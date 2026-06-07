import { Router } from 'express'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { aiEnrichmentQueue } from '../jobs/queue'

// ── Bull Board: Visual dashboard for BullMQ queues ──────────
//
// What it gives you:
//   - Real-time view of all jobs: queued, active, completed, failed
//   - Inspect individual job data, logs, and error stack traces
//   - Retry failed jobs with one click
//   - Clean completed/failed jobs in bulk
//
// How it works:
//   1. ExpressAdapter creates a sub-app (its own set of routes + static files)
//   2. createBullBoard connects your queue(s) to that sub-app
//   3. We mount the sub-app at /admin/queues in index.ts
//
// In production you'd add auth middleware before this route
// (e.g., requireAuth + requireRole('admin')) so random users can't
// see job data. For dev, we leave it open.

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(aiEnrichmentQueue),
    // Add more queues here as you create them:
    // new BullMQAdapter(emailQueue),
    // new BullMQAdapter(notificationQueue),
  ],
  serverAdapter,
})

const router = Router()
router.use('/', serverAdapter.getRouter())

export default router
