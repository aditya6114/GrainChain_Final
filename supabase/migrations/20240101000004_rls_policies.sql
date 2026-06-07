-- Migration 004: Row Level Security Policies
--
-- RLS is disabled by default. You must:
--   1. Enable RLS on the table (locks it down completely — no access until policies added)
--   2. Add policies that define who can do what
--
-- auth.uid()   → the UUID of the currently authenticated Supabase user
-- auth.jwt()   → the full decoded JWT (we use this to read the 'role' custom claim)
--
-- We store role in the JWT as a custom claim so Postgres can read it without
-- a DB lookup on every row. We set this claim in the Express backend when
-- the user registers (via Supabase Admin API to set user metadata).


-- ── Helper: read role from JWT ───────────────────────────────
-- Rather than repeating this expression everywhere, we define it inline.
-- auth.jwt() -> 'user_metadata' -> 'role' reads the custom claim we set on register.


-- ════════════════════════════════════════════════════════════
-- USERS TABLE
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone can read basic user info (name shown on donations, tasks)
CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  USING (true);

-- Users can only insert their own row (enforced by matching auth.uid())
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can only update their own row
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- DONATIONS TABLE
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see available donations (for map/listings)
CREATE POLICY "donations_select_available"
  ON public.donations FOR SELECT
  USING (
    status = 'available'
    OR donor_id = auth.uid()   -- donors always see their own, any status
  );

-- Only donors can create donations
CREATE POLICY "donations_insert_donor_only"
  ON public.donations FOR INSERT
  WITH CHECK (
    donor_id = auth.uid()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'donor'
  );

-- Donors can only update their own donations
-- Note: status changes by the system (expiry cron, claim confirmation) use
-- the Supabase service role key which bypasses RLS — that's intentional.
CREATE POLICY "donations_update_own"
  ON public.donations FOR UPDATE
  USING (donor_id = auth.uid());

-- Donors can only delete their own donations
CREATE POLICY "donations_delete_own"
  ON public.donations FOR DELETE
  USING (donor_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- CLAIMS TABLE
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Recipients see their own claims
-- Donors see claims on their donations (so they can confirm/reject)
CREATE POLICY "claims_select"
  ON public.claims FOR SELECT
  USING (
    recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.id = claims.donation_id
        AND d.donor_id = auth.uid()
    )
  );

-- Only recipients can create claims
-- AND they cannot claim their own donation (cross-table check)
CREATE POLICY "claims_insert_recipient_only"
  ON public.claims FOR INSERT
  WITH CHECK (
    recipient_id = auth.uid()
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'recipient'
    AND NOT EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.id = donation_id
        AND d.donor_id = auth.uid()  -- prevents donor claiming own donation
    )
  );

-- Recipients can cancel their own pending claims
-- Donors can confirm/cancel claims on their donations
CREATE POLICY "claims_update"
  ON public.claims FOR UPDATE
  USING (
    recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.id = claims.donation_id
        AND d.donor_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════
-- VOLUNTEER TASKS TABLE
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.volunteer_tasks ENABLE ROW LEVEL SECURITY;

-- Volunteers see all pending tasks (to pick one up) + their assigned tasks
CREATE POLICY "tasks_select"
  ON public.volunteer_tasks FOR SELECT
  USING (
    status = 'pending'                -- unassigned tasks visible to all volunteers
    OR volunteer_id = auth.uid()      -- assigned tasks visible to the assigned volunteer
  );

-- Only volunteers can claim (update) tasks
-- They can only update tasks assigned to them or unassigned pending tasks
CREATE POLICY "tasks_update_volunteer"
  ON public.volunteer_tasks FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'volunteer'
    AND (
      volunteer_id = auth.uid()       -- already assigned to them
      OR volunteer_id IS NULL          -- unclaimed task they're picking up
    )
  );
