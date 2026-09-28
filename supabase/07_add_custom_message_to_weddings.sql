-- Migration: Add custom_message column to weddings table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add custom_message column to weddings table
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS custom_message text;

-- 2. Verify column exists
COMMENT ON COLUMN weddings.custom_message IS 'Event-wide invitation letter or custom message shown to guests unless overridden by individual guest custom_message';
