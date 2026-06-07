import { z } from 'zod'

// ── Request schemas (validate what comes IN from the client) ──

// POST /api/claims — recipient claims a donation
// Only needs donation_id — we get recipient_id from the JWT (req.user.id)
export const CreateClaimSchema = z.object({
  donation_id: z.string().uuid(),
})

// PATCH /api/claims/:id/confirm — donor confirms a claim
// No body needed — the action itself IS the intent (confirm)

// PATCH /api/claims/:id/cancel — either party cancels a claim
// No body needed either

// ── Response shape ──────────────────────────────────────────────

export const ClaimSchema = z.object({
  id:            z.string().uuid(),
  donation_id:   z.string().uuid(),
  recipient_id:  z.string().uuid(),
  status:        z.enum(['pending', 'confirmed', 'cancelled']),
  claimed_at:    z.string(),
})

// ── TypeScript types inferred from schemas ──────────────────────

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>
export type Claim            = z.infer<typeof ClaimSchema>
