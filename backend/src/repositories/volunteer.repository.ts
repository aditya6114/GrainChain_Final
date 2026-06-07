import { supabaseAdmin } from '../lib/supabase'
import { VolunteerTask } from '../types/volunteer.schema'
import { ApiError } from '../utils/api-error'

export const volunteerRepository = {

  // ── CREATE ──────────────────────────────────────────────────
  // Called automatically when a claim is confirmed — not from an HTTP route.
  // volunteer_id is NULL at creation — no one has picked it up yet.
  async create(claimId: string): Promise<VolunteerTask> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .insert({ claim_id: claimId })
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as VolunteerTask
  },

  // ── FIND BY ID ──────────────────────────────────────────────
  async findById(id: string): Promise<VolunteerTask | null> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116') return null
    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as VolunteerTask
  },

  // ── FIND AVAILABLE TASKS ────────────────────────────────────
  // Pending tasks with no volunteer — what the volunteer sees when browsing
  async findAvailable(): Promise<VolunteerTask[]> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .select('*')
      .eq('status', 'pending')
      .is('volunteer_id', null)
      .order('created_at', { ascending: true })  // oldest first (FIFO)

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return (data ?? []) as VolunteerTask[]
  },

  // ── FIND MY TASKS ───────────────────────────────────────────
  // Tasks assigned to a specific volunteer
  async findByVolunteer(volunteerId: string): Promise<VolunteerTask[]> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('created_at', { ascending: false })

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return (data ?? []) as VolunteerTask[]
  },

  // ── PICKUP (assign volunteer + set in_progress) ─────────────
  async pickup(id: string, volunteerId: string): Promise<VolunteerTask> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .update({
        volunteer_id: volunteerId,
        status: 'in_progress',
        pickup_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as VolunteerTask
  },

  // ── DELIVER (mark completed) ────────────────────────────────
  async deliver(id: string): Promise<VolunteerTask> {
    const { data, error } = await supabaseAdmin
      .from('volunteer_tasks')
      .update({
        status: 'completed',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data as VolunteerTask
  },
}
