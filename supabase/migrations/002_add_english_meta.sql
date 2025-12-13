-- Add English meta fields for SEO
-- These fields store English translations of meta_title and meta_description

ALTER TABLE posts
ADD COLUMN meta_title_en TEXT,
ADD COLUMN meta_description_en TEXT;

-- Add comment for documentation
COMMENT ON COLUMN posts.meta_title_en IS 'English translation of meta_title for SEO';
COMMENT ON COLUMN posts.meta_description_en IS 'English translation of meta_description for SEO';
