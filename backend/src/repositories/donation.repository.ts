import { supabaseAdmin } from '../lib/supabase'
import { CreateDonationInput, Donation } from '../types/donation.schema'
import { ApiError } from '../utils/api-error'

// The repository's only job: translate between your application and the database.
// No business rules here. No HTTP concepts. Just queries.
//
// Why supabaseAdmin (service role) instead of anon?
// The repository runs on the server. We've already verified the user's identity
// in auth middleware and enforced business rules in the service.
// By this point, we trust the operation is legitimate — we just need to execute it.
// RLS is a frontend/direct-access safety net; server-side we control access ourselves.

export const donationRepository = {

  // ── CREATE ────────────────────────────────────────────────
  async create(input: CreateDonationInput, donorId: string): Promise<Donation> {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .insert({
        ...input,
        donor_id: donorId,
        expiry_time: input.expiry_time,
        // Build the PostGIS geography point from lat/lng.
        // ST_MakePoint takes (longitude, latitude) — longitude first.
        // This is a common gotcha: PostGIS uses (x,y) = (lng,lat) convention.
        location: `POINT(${input.lng} ${input.lat})`,
        // urgency is not set here — defaults to 'medium' in DB schema.
        // The AI enrichment job will update it async after this returns.
      })
      .select()
      .single()  // .single() tells Supabase we expect exactly one row back

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Donation
  },

  // ── FIND NEARBY (geo query) ───────────────────────────────
  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Donation[]> {
    // Supabase's JS client can't express ST_DWithin directly.
    // For complex PostGIS queries we use .rpc() to call a Postgres function,
    // or we use the raw SQL approach via the pg driver.
    // Here we use .rpc() — we'll create the matching Postgres function in a migration.
    const { data, error } = await supabaseAdmin
      .rpc('get_nearby_donations', {
        p_lat:       lat,
        p_lng:       lng,
        p_radius_m:  radiusKm * 1000,  // convert km → meters for ST_DWithin
      })

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return (data ?? []) as Donation[]
  },

  // ── FIND BY ID ────────────────────────────────────────────
  async findById(id: string): Promise<Donation | null> {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('id', id)
      .single()

    // PGRST116 is Supabase's "row not found" error code
    if (error?.code === 'PGRST116') return null
    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Donation
  },

  // ── UPDATE STATUS ─────────────────────────────────────────
  async updateStatus(id: string, status: Donation['status']): Promise<Donation> {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Donation
  },

  // ── UPDATE AI ENRICHMENT ──────────────────────────────────
  // Called by the BullMQ worker after Gemini responds — not by any HTTP route
  async updateAiEnrichment(id: string, enrichment: {
    urgency: Donation['urgency']
    ai_summary: string
    safe_window_hours: number
    suggested_recipients: string
    handling_notes: string
  }): Promise<void> {
    const { error } = await supabaseAdmin
      .from('donations')
      .update({ ...enrichment, ai_enriched: true })
      .eq('id', id)

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
  },

  // ── EXPIRE STALE DONATIONS ────────────────────────────────
  // Called by the expiry-check cron job — not by any HTTP route
  async expireStale(): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('donations')
      .update({ status: 'expired' })
      .eq('status', 'available')
      .lt('expiry_time', new Date().toISOString())  // expiry_time < NOW()
      .select('id')

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data?.length ?? 0  // return count of expired rows for logging
  },
}
