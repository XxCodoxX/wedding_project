-- Migration: Add whatsapp_message_template column to weddings table
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE weddings 
ADD COLUMN IF NOT EXISTS whatsapp_message_template text;

COMMENT ON COLUMN weddings.whatsapp_message_template IS 'Customizable WhatsApp invitation message template with {guest_name}, {link}, {couple_names}, {wedding_date}, {venue_name} placeholders';
