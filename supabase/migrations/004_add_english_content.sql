-- Add English content fields for full bilingual support
-- These fields store English translations of title, excerpt, and content

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
ADD COLUMN IF NOT EXISTS content_en JSONB;

COMMENT ON COLUMN posts.title_en IS 'English translation of title';
COMMENT ON COLUMN posts.excerpt_en IS 'English translation of excerpt';
COMMENT ON COLUMN posts.content_en IS 'English translation of content (JSON with html key)';
