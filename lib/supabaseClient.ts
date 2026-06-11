import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — the client is created on FIRST USE, not at import time.
//
// Why this matters: creating the client at module scope means any page that
// merely imports this file (directly or transitively) executes createClient()
// during Next.js build-time prerendering. If NEXT_PUBLIC_SUPABASE_URL is
// missing in that environment (e.g. CI, where .env is gitignored), the whole
// build crashes with "supabaseUrl is required" — even though the client is
// only ever used inside useEffect, which never runs during prerender.
//
// Rule of thumb: keep module scope side-effect free; do work when it's needed.

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}
