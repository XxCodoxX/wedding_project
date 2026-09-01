-- Wedding Invitation App — Supabase Migration
-- Run this in the Supabase SQL Editor

-- 1. Create the guests table
CREATE TABLE IF NOT EXISTS guests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name      text NOT NULL,
  custom_message  text,
  photo_urls      text[],
  rsvp_status     text NOT NULL DEFAULT 'pending'
                  CHECK (rsvp_status IN ('pending', 'attending', 'not_attending')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Create an index on rsvp_status for dashboard queries
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests (rsvp_status);

-- 3. Enable Row Level Security (the app uses the service role key server-side,
--    which bypasses RLS, but we enable it as a safety net)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- 4. Storage bucket for invite photos
-- NOTE: Create the bucket "invite-photos" via the Supabase Dashboard:
--   Storage → New Bucket → Name: "invite-photos" → Public bucket: ON
--
-- Then add this storage policy to allow public reads:
-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'invite-photos');
--
-- And this policy to allow authenticated uploads (service role bypasses this):
-- CREATE POLICY "Service role upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'invite-photos');
