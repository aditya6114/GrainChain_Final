-- Migration 006: Enable Supabase Realtime on donations
--
-- Supabase Realtime works by reading the Postgres WAL (write-ahead log)
-- and broadcasting row changes over WebSockets to subscribed clients.
-- Tables are NOT broadcast by default — you must opt in by adding them
-- to the special 'supabase_realtime' publication.
--
-- Security note: Realtime respects RLS. A subscriber only receives rows
-- their role is allowed to SELECT. Our policy "donations_select_available"
-- allows anyone to see status='available' rows, so the public map gets
-- live inserts — but a donation flipped to 'claimed' stops being visible
-- to everyone except its donor. Exactly the behavior we want.

ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;

-- By default, UPDATE events only include the changed columns plus the
-- primary key (REPLICA IDENTITY DEFAULT). The frontend needs the full row
-- (e.g. status + lat/lng) to decide whether to add/remove a map marker,
-- so we tell Postgres to log the entire row on updates.
ALTER TABLE public.donations REPLICA IDENTITY FULL;
