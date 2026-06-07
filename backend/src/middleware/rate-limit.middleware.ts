import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../lib/redis'

// ── WHY REDIS STORE? ──────────────────────────────────────────────
// The default store is in-memory. That works for a single server, but
// if you horizontally scale (e.g. 3 containers behind a load balancer),
// each instance tracks counts independently — a client could make
// 100 req × 3 instances = 300 requests before being limited.
//
// Redis is shared across all instances, so the count is global.
// Our Upstash Redis is already running for BullMQ and caching —
// rate limiting piggybacks on it with zero extra infrastructure.

// ── GENERAL LIMITER ───────────────────────────────────────────────
// Applied to all API routes. Generous enough for normal usage,
// tight enough to block automated abuse.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  limit: 100,                 // max 100 requests per window per IP
  standardHeaders: 'draft-7', // sends RateLimit-* headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  legacyHeaders: false,       // disables old X-RateLimit-* headers

  store: new RedisStore({
    // rate-limit-redis expects a sendCommand function, not the raw IORedis client.
    // This adapter translates: sendCommand('SET', 'key', 'val') → redis.call('SET', 'key', 'val')
    // @ts-expect-error -- rate-limit-redis sendCommand signature vs ioredis .call() mismatch is safe at runtime
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:general:',    // Redis key prefix — keeps rate limit keys organized
  }),

  // Custom response when limit is exceeded
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests. Please try again later.',
  },
})

// ── AUTH LIMITER ──────────────────────────────────────────────────
// Much stricter — auth endpoints are the #1 brute-force target.
// 10 attempts per 15 minutes is enough for a real user who mistyped
// their password, but blocks automated credential stuffing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  limit: 10,                  // max 10 requests per window per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,

  store: new RedisStore({
    // @ts-expect-error -- same adapter pattern as above
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:auth:',       // separate prefix so auth and general counters don't collide
  }),

  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
})
