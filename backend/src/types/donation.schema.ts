import { z } from 'zod'

// ── Request schemas (validate what comes IN from the client) ──

export const CreateDonationSchema = z.object({
  title:         z.string().min(3).max(100),
  description:   z.string().max(500).optional(),
  food_type:     z.string().min(2).max(50),
  quantity:      z.number().int().positive(),
  quantity_unit: z.enum(['servings', 'kg', 'boxes', 'items']).default('servings'),
  expiry_time:   z.string().datetime(),   // ISO 8601 string from frontend
  lat:           z.number().min(-90).max(90),
  lng:           z.number().min(-180).max(180),
  location_text: z.string().min(3).max(200),
  image_url:     z.string().url().optional(),
})

export const GetNearbyDonationsSchema = z.object({
  lat:       z.string().transform(Number),   // query params arrive as strings
  lng:       z.string().transform(Number),   // .transform(Number) coerces them
  radius_km: z.string().transform(Number).default('5'),
})
// Why .transform(Number) here but not in CreateDonation?
// Request bodies are parsed as JSON (Express does this) so numbers arrive as numbers.
// Query params (?lat=12.34) are always strings — we coerce them here.

export const UpdateDonationStatusSchema = z.object({
  status: z.enum(['available', 'claimed', 'completed', 'expired']),
})

// ── Response shape (what we send back) ──
// Defined once here so controller and tests use the same shape

export const DonationSchema = z.object({
  id:                  z.string().uuid(),
  donor_id:            z.string().uuid(),
  title:               z.string(),
  description:         z.string().nullable(),
  food_type:           z.string(),
  quantity:            z.number(),
  quantity_unit:       z.string(),
  expiry_time:         z.string(),
  status:              z.enum(['available', 'claimed', 'completed', 'expired']),
  lat:                 z.number().nullable(),
  lng:                 z.number().nullable(),
  location_text:       z.string().nullable(),
  image_url:           z.string().nullable(),
  urgency:             z.enum(['low', 'medium', 'high', 'critical']),
  ai_enriched:         z.boolean(),
  ai_summary:          z.string().nullable(),
  safe_window_hours:   z.number().nullable(),
  suggested_recipients: z.string().nullable(),
  handling_notes:      z.string().nullable(),
  created_at:          z.string(),
})

// ── TypeScript types inferred from the schemas ──
// Use these everywhere instead of writing types manually.
// If the schema changes, the type updates automatically.

export type CreateDonationInput  = z.infer<typeof CreateDonationSchema>
export type GetNearbyInput        = z.infer<typeof GetNearbyDonationsSchema>
export type UpdateStatusInput     = z.infer<typeof UpdateDonationStatusSchema>
export type Donation              = z.infer<typeof DonationSchema>
