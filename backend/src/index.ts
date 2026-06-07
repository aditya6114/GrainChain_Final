// dotenv must be the very first thing that runs — it populates process.env
// before any other module reads from it. If env.schema.ts runs first,
// all variables appear as undefined and Zod rejects them.
import 'dotenv/config'

// Now validate — process.env is fully populated at this point
import { env } from './types/env.schema'

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { requestIdMiddleware } from './middleware/request-id.middleware'
import { loggerMiddleware } from './middleware/logger.middleware'
import { errorHandler } from './middleware/error-handler.middleware'
import { generalLimiter, authLimiter } from './middleware/rate-limit.middleware'
import healthRouter from './routes/health.routes'
import authRouter from './routes/auth.routes'
import donationRouter from './routes/donation.routes'
import claimRouter from './routes/claim.routes'
import volunteerRouter from './routes/volunteer.routes'
import adminRouter from './routes/admin.routes'
import uploadRouter from './routes/upload.routes'

const app = express()

// ── Security middleware ───────────────────────────────────────
// helmet: sets ~14 security-related HTTP headers automatically
// (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
// One line replaces a lot of manual header configuration.
app.use(helmet())

// cors: only allow requests from our frontend URL
// In production this blocks any other origin (e.g. someone else's frontend
// trying to call our API using the user's credentials)
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,   // allow cookies/auth headers cross-origin
}))

// ── Request parsing ───────────────────────────────────────────
// Parse JSON request bodies — without this, req.body is undefined
app.use(express.json())

// ── Observability middleware (runs on every request) ──────────
// Order matters: requestId must run before logger so the logger can include it
app.use(requestIdMiddleware)
app.use(loggerMiddleware)

// ── Rate limiting ─────────────────────────────────────────────
// General limiter on all /api routes — 100 req / 15 min per IP
// Must come BEFORE route handlers so requests are counted before processing
app.use('/api', generalLimiter)

// Auth limiter is stricter — 10 req / 15 min per IP (brute-force protection)
// Applied in addition to the general limiter (both counters decrement independently)
app.use('/api/auth', authLimiter)

// ── Routes ────────────────────────────────────────────────────
app.use('/health', healthRouter)

app.use('/api/donations', donationRouter)

app.use('/api/auth', authRouter)

app.use('/api/claims', claimRouter)

app.use('/api/volunteer', volunteerRouter)

app.use('/api/uploads', uploadRouter)

// Bull Board admin dashboard — visual queue monitoring
// In production, add auth middleware: app.use('/admin/queues', requireAuth, requireRole('admin'), adminRouter)
app.use('/admin/queues', adminRouter)

// ── Global error handler ──────────────────────────────────────
// MUST be registered last — Express identifies error handlers by their
// 4-argument signature (err, req, res, next)
app.use(errorHandler)

// ── Start server ──────────────────────────────────────────────
app.listen(env.PORT, async () => {
  console.log(`GrainChain API running on port ${env.PORT} [${env.NODE_ENV}]`)

  // Start background job workers
  // Import here (not at top) so the server starts even if Redis is slow
  const { scheduleExpiryCheck } = await import('./jobs/expiry-check.job')
  await scheduleExpiryCheck()

  // The AI enrichment worker starts automatically on import
  await import('./jobs/queue')
  console.log('[Jobs] AI enrichment worker started')
})

export default app   // exported for supertest in integration tests
