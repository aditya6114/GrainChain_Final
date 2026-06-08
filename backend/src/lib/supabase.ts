import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { env } from '../types/env.schema'

// We have TWO Supabase clients with different permission levels.
//
// supabaseAnon: uses the anon key — RESPECTS RLS policies.
//   Use this when you want RLS to enforce data access rules.
//   (Currently not used directly — frontend uses its own anon client)
//
// supabaseAdmin: uses the service role key — BYPASSES RLS entirely.
//   Use this for:
//     - Cron jobs (expiry check runs as system, not as a user)
//     - Auth verification (reading user data during JWT check)
//     - AI enrichment job (updating donation after Claude responds)
//   Never expose this key to the frontend. It has unrestricted DB access.

export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,  // Node 20 lacks native WebSocket — provide ws package
    },
  },
)

// Separate client for user sign-in operations.
// Why not use supabaseAdmin for sign-in?
// signInWithPassword sets an in-memory auth session on the client instance.
// If we do this on supabaseAdmin, subsequent DB operations (inserts, updates)
// get polluted by that session state — causing failures when registering
// multiple users in sequence. This dedicated client isolates sign-in sessions
// from admin DB operations.
export const supabaseAuth = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
    },
  },
)
