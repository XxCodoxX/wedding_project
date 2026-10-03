-- Migration: Store the wishes guests write when they RSVP
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Written by the public RSVP form. For a couple/family RSVP the one message is stored
-- on every member who responded, like guest_side. NULL = no message.

ALTER TABLE guests
ADD COLUMN IF NOT EXISTS rsvp_message text
  CHECK (rsvp_message IS NULL OR char_length(rsvp_message) <= 1000);

COMMENT ON COLUMN guests.rsvp_message IS 'Wishes / note the guest wrote with their RSVP. NULL when none.';
