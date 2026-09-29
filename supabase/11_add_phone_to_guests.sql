-- Migration: Add WhatsApp phone number to guests
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Stored on the PRIMARY guest of an invitation (couple/family share one number),
-- normalised by the app to E.164 format, e.g. +94771234567.

ALTER TABLE guests
ADD COLUMN IF NOT EXISTS phone text
  CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');

COMMENT ON COLUMN guests.phone IS 'WhatsApp number in E.164 format (e.g. +94771234567). Set on the primary guest of an invitation.';
