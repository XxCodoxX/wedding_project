-- Migration: Guest groups (Family, Friends, School friends, ...)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Named "categories" in the database because guests.group_id / group_label already mean
-- "the couple/family sharing one invite link". The admin UI calls these "Guest Groups".
--
-- Groups are shared by every event and managed by admins (Settings → Guest Groups).
-- One group is the default ("Other"): it can't be deleted, new guests without a group get it,
-- and guests of a deleted group are moved to it. Stored on EVERY member of an invitation,
-- like guest_side, so per-person counts are a simple count.

-- 1. Groups table
CREATE TABLE IF NOT EXISTS guest_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Names are unique ignoring case ("Family" = "family").
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_categories_name ON guest_categories (lower(btrim(name)));
-- At most one default group.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_categories_default ON guest_categories (is_default) WHERE is_default;

-- The app reads and writes through the service role; no browser access.
ALTER TABLE guest_categories ENABLE ROW LEVEL SECURITY;

-- 2. The default "Other" group
INSERT INTO guest_categories (name, is_default)
SELECT 'Other', true
WHERE NOT EXISTS (SELECT 1 FROM guest_categories WHERE is_default);

-- 3. Default for new guest rows, so every insert path lands in "Other" when no group is given.
CREATE OR REPLACE FUNCTION public.default_guest_category_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id FROM guest_categories WHERE is_default LIMIT 1;
$$;

-- 4. Guest column (SET NULL is only a safety net: the app moves guests to "Other" before deleting a group)
ALTER TABLE guests
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES guest_categories(id) ON DELETE SET NULL;

ALTER TABLE guests ALTER COLUMN category_id SET DEFAULT public.default_guest_category_id();

COMMENT ON COLUMN guests.category_id IS 'Guest group (Family, Friends, ...). Shared by every member of an invitation. Defaults to the "Other" group.';

-- 5. Existing guests → "Other"
UPDATE guests
SET category_id = public.default_guest_category_id()
WHERE category_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_guests_category ON guests (category_id);
