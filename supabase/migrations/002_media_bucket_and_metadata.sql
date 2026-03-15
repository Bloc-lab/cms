-- Media bucket and metadata column

-- Add metadata column to media table
ALTER TABLE media ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create media storage bucket (public read for serving images on websites)
-- Backend uses service_role which bypasses RLS for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
