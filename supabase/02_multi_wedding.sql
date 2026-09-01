-- 1. Create the weddings table
CREATE TABLE IF NOT EXISTS weddings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  groom_name      text NOT NULL,
  bride_name      text NOT NULL,
  wedding_date    date NOT NULL,
  venue_name      text NOT NULL,
  venue_location  text NOT NULL,
  location_url    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for weddings
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;

-- 2. Insert a default wedding for existing guests
INSERT INTO weddings (id, groom_name, bride_name, wedding_date, venue_name, venue_location)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sarah',
  'James',
  '2026-12-28',
  'The Grand Ballroom',
  'The Ritz-Carlton • New York City'
) ON CONFLICT (id) DO NOTHING;

-- 3. Add wedding_id to guests (nullable initially)
ALTER TABLE guests ADD COLUMN IF NOT EXISTS wedding_id uuid REFERENCES weddings(id) ON DELETE CASCADE;

-- 4. Assign existing guests to the default wedding
UPDATE guests SET wedding_id = '00000000-0000-0000-0000-000000000001' WHERE wedding_id IS NULL;

-- 5. Make wedding_id NOT NULL now that all guests have one
ALTER TABLE guests ALTER COLUMN wedding_id SET NOT NULL;
