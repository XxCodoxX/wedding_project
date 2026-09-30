-- Migration: Add guest side (bride's side / groom's side) to guests
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Stored on EVERY member of an invitation (couple/family share the same side),
-- so per-person headcounts by side are a simple count. NULL = not assigned yet.

ALTER TABLE guests
ADD COLUMN IF NOT EXISTS guest_side text
  CHECK (guest_side IS NULL OR guest_side IN ('bride', 'groom'));

COMMENT ON COLUMN guests.guest_side IS 'Which side of the couple invited this guest: bride or groom. NULL when not assigned.';

CREATE INDEX IF NOT EXISTS idx_guests_wedding_side ON guests (wedding_id, guest_side);
