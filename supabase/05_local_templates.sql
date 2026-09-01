-- 1. Add image columns to weddings
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS main_image_url text;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gallery_image_urls text[] DEFAULT '{}';

-- 2. Drop the foreign key constraint on template_id
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_template_id_fkey;

-- 3. Change template_id from UUID to text (for local template IDs like 'classic', 'minimal')
-- We use a USING clause to cast existing UUIDs to text, then we will update them to 'classic'
ALTER TABLE weddings ALTER COLUMN template_id TYPE text USING template_id::text;

-- 4. Update existing weddings to use the 'classic' local template
UPDATE weddings SET template_id = 'classic';

-- 5. Drop the templates table entirely, since it's now handled by the local codebase
DROP TABLE IF EXISTS templates;
