import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { donationRepository } from '../repositories/donation.repository'
import { calculateUrgencyFallback } from '../services/donation.service'

// ── What is BullMQ? ──────────────────────────────────────────
// BullMQ is a job queue built on top of Redis.
//
// A "job" is a task that runs in the background — not inside an HTTP request.
// BullMQ gives you:
//   - Persistence: jobs survive server restarts (stored in Redis)
//   - Retries: if a job fails, BullMQ retries it automatically
//   - Concurrency: multiple workers can process jobs in parallel
//   - Visibility: Bull Board UI shows job status (queued/active/completed/failed)
//
// Without a queue, if you call Gemini inside the HTTP handler and it fails,
// you'd need to tell the user "try again." With a queue, the system retries
// automatically — the user never knows anything went wrong.


// ── Queue definition ─────────────────────────────────────────
// The queue is where jobs are ADDED. It stores them in Redis.
export const aiEnrichmentQueue = new Queue('ai-enrichment', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,           // retry up to 3 times on failure
    backoff: {
      type: 'exponential', // wait 2s, then 4s, then 8s between retries
      delay: 2000,         // base delay in ms
    },
    removeOnComplete: 100, // keep last 100 completed jobs (for Bull Board visibility)
    removeOnFail: 200,     // keep last 200 failed jobs (for debugging)
  },
})


// ── Worker definition ────────────────────────────────────────
// The worker PROCESSES jobs from the queue.
// It runs in the same process as your Express server.
// In production with high volume, you'd run workers in separate processes.

export const aiEnrichmentWorker = new Worker(
  'ai-enrichment',
  async (job) => {
    const { donationId, title, description, food_type, quantity, expiry_time } = job.data

    console.log(`[AI Worker] Processing enrichment for donation ${donationId}`)

    try {
      // Import Gemini lazily — only loaded when a job actually runs
      const { geminiModel } = await import('../lib/gemini')

      const prompt = `You are a food safety and distribution advisor for a food donation platform.

Analyze this donated food item and return a JSON object with exactly these fields:

{
  "urgency": "low" | "medium" | "high" | "critical",
  "safe_consumption_window_hours": number,
  "suggested_recipients": string,
  "ai_summary": string,
  "handling_notes": string
}

Food item details:
- Title: ${title}
- Description: ${description || 'No description provided'}
- Food type: ${food_type}
- Quantity: ${quantity}
- Expiry time: ${expiry_time}

Rules:
- urgency: based on perishability and time until expiry (critical=needs immediate action, high=within hours, medium=within days, low=shelf stable)
- safe_consumption_window_hours: realistic estimate of how long this food is safe to eat
- suggested_recipients: who this food is best suited for (e.g. "families with children", "elderly care homes") and any groups to avoid
- ai_summary: 1-2 sentence public-facing description for the listing
- handling_notes: brief storage and handling advice

Return ONLY valid JSON, nothing else.`

      const result = await geminiModel.generateContent(prompt)
      const text = result.response.text()
      const parsed = JSON.parse(text)

      // Validate the AI response has the fields we expect
      if (!parsed.urgency || !parsed.ai_summary) {
        throw new Error('AI response missing required fields')
      }

      // Update the donation with AI enrichment data
      await donationRepository.updateAiEnrichment(donationId, {
        urgency: parsed.urgency,
        ai_summary: parsed.ai_summary,
        safe_window_hours: parsed.safe_consumption_window_hours,
        suggested_recipients: parsed.suggested_recipients,
        handling_notes: parsed.handling_notes,
      })

      console.log(`[AI Worker] Enrichment complete for donation ${donationId}`)

    } catch (err) {
      console.error(`[AI Worker] Failed for donation ${donationId}:`, err)

      // If this is the last retry attempt, apply the fallback
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        console.log(`[AI Worker] Applying fallback urgency for donation ${donationId}`)
        const fallbackUrgency = calculateUrgencyFallback(expiry_time)
        await donationRepository.updateAiEnrichment(donationId, {
          urgency: fallbackUrgency,
          ai_summary: 'AI enrichment unavailable — urgency set from expiry time.',
          safe_window_hours: Math.round(
            (new Date(expiry_time).getTime() - Date.now()) / (1000 * 60 * 60)
          ),
          suggested_recipients: 'General distribution',
          handling_notes: 'Please check food condition before distribution.',
        })
      }

      // Re-throw so BullMQ counts it as a failure and retries
      throw err
    }
  },
  {
    connection: redis as any,
    concurrency: 2,  // process up to 2 jobs at once
  },
)


// ── Event listeners (for logging/debugging) ──────────────────
aiEnrichmentWorker.on('completed', (job) => {
  console.log(`[AI Worker] Job ${job.id} completed`)
})

aiEnrichmentWorker.on('failed', (job, err) => {
  console.log(`[AI Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
})
