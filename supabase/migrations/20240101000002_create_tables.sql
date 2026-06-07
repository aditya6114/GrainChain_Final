-- Migration 002: Create core tables
--
-- Design principle: every table has a UUID primary key (not serial integer).
-- Why UUID over serial int?
--   - Safe to generate on the client without a DB round-trip
--   - No information leakage (attacker can't guess "there are 847 donations")
--   - Required by Supabase Auth (auth.users uses UUIDs)
--
-- Order matters: referenced tables must exist before foreign keys are declared.
-- Order: users → donations → claims → volunteer_tasks


-- ============================================================
-- USERS
-- Stores application-level user data.
-- Note: Supabase Auth stores credentials (email/password hash) in auth.users.
-- This table stores our app-specific data, linked via the same UUID.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  -- role determines what routes/data the user can access
  -- ENUM enforced at DB level — invalid roles are rejected before hitting app code
  role        TEXT NOT NULL CHECK (role IN ('donor', 'recipient', 'volunteer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- DONATIONS
-- Core entity. A donor creates a donation, recipients claim it.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  title           TEXT NOT NULL,
  description     TEXT,
  food_type       TEXT NOT NULL,   -- e.g. "cooked meals", "packaged goods", "produce"
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  quantity_unit   TEXT NOT NULL DEFAULT 'servings',

  -- expiry_time is critical: drives urgency calculation and expiry-check cron job
  expiry_time     TIMESTAMPTZ NOT NULL,

  -- status lifecycle: available → claimed → completed | expired
  -- 'available': visible to recipients
  -- 'claimed':   a recipient has confirmed a claim
  -- 'completed': volunteer delivered, done
  -- 'expired':   expiry_check cron job flipped this past expiry_time
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'claimed', 'completed', 'expired')),

  -- Geographic data stored two ways:
  -- lat/lng: raw coords for bounding box queries and map markers
  -- location: PostGIS geography point for accurate distance queries (ST_DWithin)
  -- location_text: human-readable address shown in UI
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  location        GEOGRAPHY(POINT, 4326),  -- SRID 4326 = WGS84 (standard GPS coords)
  location_text   TEXT,

  image_url       TEXT,   -- S3 URL after upload; NULL until uploaded

  -- urgency: set by AI enrichment job, or fallback heuristic if AI fails
  -- low=72h+, medium=24-72h, high=6-24h, critical=<6h
  urgency         TEXT NOT NULL DEFAULT 'medium'
                  CHECK (urgency IN ('low', 'medium', 'high', 'critical')),

  -- AI enrichment fields — populated async by BullMQ worker after donation created
  ai_enriched         BOOLEAN NOT NULL DEFAULT false,
  ai_summary          TEXT,       -- public-facing description written by Claude
  safe_window_hours   INTEGER,    -- Claude's estimate of safe consumption window
  suggested_recipients TEXT,      -- e.g. "families, avoid for elderly"
  handling_notes      TEXT,       -- storage/handling advice from Claude

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- CLAIMS
-- A recipient claims a donation. Only one claim can be 'confirmed'
-- per donation at a time (enforced in application layer + partial index below).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id   UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- status lifecycle: pending → confirmed | cancelled
  -- pending: recipient claimed, waiting for donor confirmation
  -- confirmed: donor accepted — triggers volunteer task creation
  -- cancelled: either party cancelled
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'cancelled')),

  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A recipient shouldn't be able to claim the same donation twice
  CONSTRAINT unique_recipient_donation UNIQUE (donation_id, recipient_id)
);


-- ============================================================
-- VOLUNTEER TASKS
-- Created when a claim is confirmed. One task per confirmed claim.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.volunteer_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  volunteer_id  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  -- volunteer_id is nullable: task exists before a volunteer picks it up

  -- status lifecycle: pending → in_progress → completed
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed')),

  pickup_at     TIMESTAMPTZ,    -- when volunteer picked up the food
  delivered_at  TIMESTAMPTZ,   -- when volunteer delivered to recipient

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
