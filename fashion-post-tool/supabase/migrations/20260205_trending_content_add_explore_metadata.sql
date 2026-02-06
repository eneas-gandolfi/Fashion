-- Add optional explore metadata fields to trending_content
ALTER TABLE trending_content
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS subtopic TEXT,
  ADD COLUMN IF NOT EXISTS ig_id TEXT,
  ADD COLUMN IF NOT EXISTS shortcode TEXT;
