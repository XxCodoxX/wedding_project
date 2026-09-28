-- Migration: Add group invitation support
-- Adds support for Individual, Couple, and Family invitation types.
-- Run this in your Supabase SQL Editor.

-- 1. Add invitation type column
ALTER TABLE guests ADD COLUMN IF NOT EXISTS invitation_type text NOT NULL DEFAULT 'individual'
  CHECK (invitation_type IN ('individual', 'couple', 'family'));

-- 2. Add group columns for couple/family invitations
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_id uuid;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_label text;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT true;

-- 3. Index for fast group lookups
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests (group_id);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_type ON guests (invitation_type);
