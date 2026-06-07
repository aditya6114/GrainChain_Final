-- Migration 003: Create indexes
--
-- Rule: only index columns that appear in WHERE clauses or JOIN conditions
-- in your most frequent queries. Every index slows down INSERT/UPDATE slightly
-- because Postgres must update the index too. Don't over-index.
--
-- Query this index strategy serves:
--   donations: "get all available donations near (lat, lng) within radius_km"
--   donations: "get all donations by this donor"
--   claims:    "how many claims exist for this donation?"
--   volunteer_tasks: "what tasks are assigned to this volunteer?"


-- ── donations ────────────────────────────────────────────────

-- Most queries filter by status first: WHERE status = 'available'
-- Without this: Postgres scans all 100k donations to find available ones.
-- With this: Postgres jumps directly to the ~20% that are 'available'.
CREATE INDEX IF NOT EXISTS idx_donations_status
  ON public.donations(status);

-- Donor dashboard: "show me my donations" → WHERE donor_id = $1
CREATE INDEX IF NOT EXISTS idx_donations_donor_id
  ON public.donations(donor_id);

-- PostGIS spatial index — required for ST_DWithin to be fast.
-- Without this, geo query degrades to O(n): calculate distance to every row.
-- With this: R-tree index lets Postgres eliminate most rows geometrically.
-- GiST (Generalized Search Tree) is the index type PostGIS requires.
CREATE INDEX IF NOT EXISTS idx_donations_location
  ON public.donations USING GIST(location);

-- Status + expiry_time composite: used by the expiry-check cron job
-- Query: WHERE status = 'available' AND expiry_time < NOW()
-- Composite index covers both conditions in one pass.
CREATE INDEX IF NOT EXISTS idx_donations_status_expiry
  ON public.donations(status, expiry_time);


-- ── claims ───────────────────────────────────────────────────

-- "How many claims does donation X have?" — runs on every claim attempt
-- Also used when donor views claims on their donation
CREATE INDEX IF NOT EXISTS idx_claims_donation_id
  ON public.claims(donation_id);

-- Recipient dashboard: "show me my claims" → WHERE recipient_id = $1
CREATE INDEX IF NOT EXISTS idx_claims_recipient_id
  ON public.claims(recipient_id);

-- Partial unique index: enforces that only ONE confirmed claim can exist
-- per donation at the database level — not just application level.
-- Partial means: only rows WHERE status = 'confirmed' are indexed.
-- Effect: INSERT of second confirmed claim for same donation → unique violation.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_confirmed_claim_per_donation
  ON public.claims(donation_id)
  WHERE status = 'confirmed';


-- ── volunteer_tasks ──────────────────────────────────────────

-- Volunteer portal: "show me tasks assigned to me" → WHERE volunteer_id = $1
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_volunteer_id
  ON public.volunteer_tasks(volunteer_id);

-- Admin/coordinator: "show me all pending tasks" → WHERE status = 'pending'
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_status
  ON public.volunteer_tasks(status);
