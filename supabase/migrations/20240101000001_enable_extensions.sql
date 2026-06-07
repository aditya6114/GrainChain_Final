-- Migration 001: Enable required Postgres extensions
--
-- PostGIS: adds geographic data types and functions to Postgres.
-- ST_DWithin(), ST_MakePoint(), geography type — all come from here.
-- uuid-ossp: adds gen_random_uuid() for generating UUIDs as primary keys.
--
-- Run this FIRST — other migrations depend on these types existing.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
