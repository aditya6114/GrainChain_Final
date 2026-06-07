import { z } from 'zod'

// ── Request schemas ─────────────────────────────────────────────

// PATCH /api/volunteer/tasks/:id/pickup — volunteer picks up a task
// No body needed — the action IS the intent

// PATCH /api/volunteer/tasks/:id/deliver — volunteer marks delivery complete
// No body needed either

// ── Response shape ──────────────────────────────────────────────

export const VolunteerTaskSchema = z.object({
  id:            z.string().uuid(),
  claim_id:      z.string().uuid(),
  volunteer_id:  z.string().uuid().nullable(),
  status:        z.enum(['pending', 'in_progress', 'completed']),
  pickup_at:     z.string().nullable(),
  delivered_at:  z.string().nullable(),
  created_at:    z.string(),
})

// ── TypeScript types ────────────────────────────────────────────

export type VolunteerTask = z.infer<typeof VolunteerTaskSchema>
