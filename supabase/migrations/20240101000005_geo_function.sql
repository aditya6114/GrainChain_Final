-- Migration 006: Create the geo query function used by donationRepository.findNearby()
--
-- Why a Postgres function instead of inline SQL?
-- The Supabase JS client can't express ST_DWithin in its query builder.
-- By wrapping it in a function, we can call it cleanly with .rpc('get_nearby_donations').
-- The function runs inside Postgres — no performance overhead.

CREATE OR REPLACE FUNCTION get_nearby_donations(
  p_lat      DOUBLE PRECISION,
  p_lng      DOUBLE PRECISION,
  p_radius_m DOUBLE PRECISION   -- radius in meters
)
RETURNS SETOF donations         -- returns rows shaped like the donations table
LANGUAGE sql
STABLE                          -- STABLE = same inputs always give same output within a transaction
                                -- lets Postgres cache and optimize calls
AS $$
  SELECT *
  FROM donations
  WHERE
    status = 'available'
    AND location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_MakePoint(p_lng, p_lat)::geography,  -- longitude first (x,y convention)
      p_radius_m
    )
  ORDER BY
    ST_Distance(location, ST_MakePoint(p_lng, p_lat)::geography) ASC
  LIMIT 50;
$$;
