import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { redis } from '../lib/redis'

// GET /health — used by Railway to check if the app is running
// Also useful for you to verify all dependencies are reachable after deploy.
//
// A good health check doesn't just return 200 — it actually verifies
// each dependency (DB, Redis) is reachable. If Postgres is down,
// return 503 so the load balancer knows not to route traffic here.

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  const health: Record<string, string> = { status: 'ok' }
  let httpStatus = 200

  // Check DB: run a trivial query
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1)
    health.db = error ? 'error' : 'ok'
    if (error) httpStatus = 503
  } catch {
    health.db = 'error'
    httpStatus = 503
  }
  // Check Redis: PING should return PONG
  try {
    const pong = await redis.ping()
    health.redis = pong === 'PONG' ? 'ok' : 'error'
    if (pong !== 'PONG') httpStatus = 503
  } catch {
    health.redis = 'error'
    httpStatus = 503
  }

  res.status(httpStatus).json(health)
})

export default router
