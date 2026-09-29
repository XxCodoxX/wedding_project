-- Migration: Invitation delivery tracking (sent / opened)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Tracked on the PRIMARY guest of an invitation (the one whose ID is in the invite link).
--   invite_sent_at          → admin confirmed the WhatsApp message was sent
--   invite_first_opened_at  → first time the guest opened their invite link
--   invite_last_opened_at   → most recent open
--   invite_open_count       → number of opens (link-preview bots & admin visits excluded by the app)

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_first_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_last_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_open_count integer NOT NULL DEFAULT 0;

-- Atomic open counter (avoids read-modify-write races when a link is opened on two devices at once).
CREATE OR REPLACE FUNCTION record_invite_open(p_guest_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE guests
  SET invite_open_count      = invite_open_count + 1,
      invite_first_opened_at = COALESCE(invite_first_opened_at, now()),
      invite_last_opened_at  = now()
  WHERE id = p_guest_id;
$$;

-- Only the server (service role) may call it — otherwise anyone with the public
-- anon key could inflate open counts through the REST API.
REVOKE EXECUTE ON FUNCTION record_invite_open(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_invite_open(uuid) TO service_role;
