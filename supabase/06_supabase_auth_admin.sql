-- Migration: Add user_profiles table for role-based access control
-- Run this in the Supabase SQL Editor

-- 1. Create user_profiles table
-- Links Supabase Auth users to their role and optionally assigned wedding
CREATE TABLE IF NOT EXISTS user_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  full_name       text NOT NULL DEFAULT '',
  role            text NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('admin', 'guest')),
  assigned_wedding_id uuid REFERENCES weddings(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Create index on auth_user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles (auth_user_id);

-- 3. Create index on assigned_wedding_id for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_wedding ON user_profiles (assigned_wedding_id);

-- 4. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. IMPORTANT: After running this migration, create your admin profile:
--    First, find your admin user's auth ID from the Supabase Auth dashboard,
--    then run:
--
--    INSERT INTO user_profiles (auth_user_id, email, full_name, role)
--    VALUES ('your-auth-user-uuid', 'admin@example.com', 'Admin', 'admin');
