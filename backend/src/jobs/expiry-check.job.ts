import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { donationRepository } from '../repositories/donation.repository'
import { cache } from '../lib/cache'

// ── Expiry check cron job ────────────────────────────────────
// Runs every hour. Finds donations where:
//   status = 'available' AND expiry_time < NOW()
// and flips them to 'expired'.
//
// Why a cron job instead of checking on every read?
// If you checked on reads, the first user to view an expired donation
// would see it AND it would slow down every read with an extra check.
// A cron job is fire-and-forget — runs in background, users unaffected.

export const expiryQueue = new Queue('expiry-check', {
  connection: redis as any,
})

// Schedule repeating job — runs every hour
// BullMQ cron syntax is standard Unix cron: minute hour day month weekday
export async function scheduleExpiryCheck() {
  // Remove any existing repeatable jobs to avoid duplicates on restart
  const existingJobs = await expiryQueue.getRepeatableJobs()
  for (const job of existingJobs) {
    await expiryQueue.removeRepeatableByKey(job.key)
  }

  await expiryQueue.add(
    'check-expired',
    {},  // no data needed — the job reads from DB
    {
      repeat: { pattern: '0 * * * *' },  // every hour at minute 0
    },
  )
  console.log('[Expiry] Cron job scheduled: runs every hour')
}

// Worker that processes the expiry check
export const expiryWorker = new Worker(
  'expiry-check',
  async () => {
    console.log('[Expiry] Running expiry check...')
    const count = await donationRepository.expireStale()
    console.log(`[Expiry] Marked ${count} donations as expired`)

    // Invalidate geo caches since expired donations should no longer appear
    if (count > 0) {
      await cache.delPattern('donations:geo:*')
    }
  },
  { connection: redis as any },
)
