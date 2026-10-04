-- Migration: Stable sort for the event dashboard's guest list
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- The dashboard now loads `guests WHERE wedding_id = ? ORDER BY created_at DESC, id DESC`.
-- Guests inserted in one statement (a family, a bulk import) share created_at, so `id` breaks
-- the tie; otherwise an UPDATE (e.g. an RSVP change) could reshuffle them between page loads.
-- This index replaces 15_index_guests_wedding_created.sql and serves the full sort.

CREATE INDEX IF NOT EXISTS idx_guests_wedding_created_id
  ON guests (wedding_id, created_at DESC, id DESC);

DROP INDEX IF EXISTS idx_guests_wedding_created;
