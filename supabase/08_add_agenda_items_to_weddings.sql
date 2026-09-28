-- Migration: Add agenda_items column to weddings table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Add agenda_items column as jsonb
ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS agenda_items jsonb DEFAULT '[]'::jsonb;

-- 2. Add documentation comment
COMMENT ON COLUMN weddings.agenda_items IS 'Wedding day schedule / agenda items [{ time, title, description }]';
