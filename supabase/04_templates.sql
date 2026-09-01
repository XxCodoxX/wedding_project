-- 1. Create the templates table
CREATE TABLE IF NOT EXISTS templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  main_image_url      text,
  gallery_image_urls  text[] DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- 2. Insert a default template
INSERT INTO templates (id, name, main_image_url, gallery_image_urls)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Classic Elegance (Default)',
  null,
  '{}'
) ON CONFLICT (id) DO NOTHING;

-- 3. Add template_id to weddings
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES templates(id) ON DELETE RESTRICT;

-- 4. Assign existing weddings to the default template
UPDATE weddings SET template_id = '00000000-0000-0000-0000-000000000001' WHERE template_id IS NULL;

-- 5. Make template_id NOT NULL
ALTER TABLE weddings ALTER COLUMN template_id SET NOT NULL;

-- 6. Drop photo_urls from guests (as images are now managed by templates)
ALTER TABLE guests DROP COLUMN IF EXISTS photo_urls;
