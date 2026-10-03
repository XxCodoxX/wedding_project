-- Migration: Index for the event dashboard's guest list
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- The dashboard loads `guests WHERE wedding_id = ? ORDER BY created_at DESC`.
-- This index serves both the filter and the sort, so Postgres reads the rows
-- already in order instead of sorting them after the lookup.

CREATE INDEX IF NOT EXISTS idx_guests_wedding_created
  ON guests (wedding_id, created_at DESC);
