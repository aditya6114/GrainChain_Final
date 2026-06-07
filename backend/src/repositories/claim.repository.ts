import { supabaseAdmin } from '../lib/supabase'
import { Claim } from '../types/claim.schema'
import { ApiError } from '../utils/api-error'

// Same pattern as donation.repository.ts:
// - Uses supabaseAdmin (service role) — RLS bypassed because we already
//   verified identity in middleware and enforced rules in the service layer.
// - Each method does ONE query. No business logic here.

export const claimRepository = {

  // ── CREATE ──────────────────────────────────────────────────
  async create(donationId: string, recipientId: string): Promise<Claim> {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .insert({ donation_id: donationId, recipient_id: recipientId })
      .select()
      .single()

    // 23505 = unique_violation — the DB's unique(donation_id, recipient_id) constraint
    // fires if this recipient already claimed this donation
    if (error?.code === '23505') {
      throw new ApiError(409, 'ALREADY_CLAIMED', 'You have already claimed this donation')
    }
    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Claim
  },

  // ── FIND BY ID ──────────────────────────────────────────────
  async findById(id: string): Promise<Claim | null> {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116') return null
    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Claim
  },

  // ── FIND BY RECIPIENT ───────────────────────────────────────
  // "My claims" view — recipient sees all their claims with donation details
  async findByRecipient(recipientId: string): Promise<Claim[]> {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('claimed_at', { ascending: false })

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return (data ?? []) as Claim[]
  },

  // ── FIND BY DONATION ────────────────────────────────────────
  // Used by the service to check if a donation already has a confirmed claim
  async findByDonation(donationId: string): Promise<Claim[]> {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .select('*')
      .eq('donation_id', donationId)

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return (data ?? []) as Claim[]
  },

  // ── UPDATE STATUS ───────────────────────────────────────────
  async updateStatus(id: string, status: Claim['status']): Promise<Claim> {
    const { data, error } = await supabaseAdmin
      .from('claims')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as Claim
  },
}
