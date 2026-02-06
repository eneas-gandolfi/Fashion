-- Schema patch: align trends/tables to current code
-- Safe to run multiple times.

-- 1) trending_hashtags column alignment
DO $$
BEGIN
  -- add new columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'engagement_avg'
  ) THEN
    ALTER TABLE trending_hashtags ADD COLUMN engagement_avg DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'likes_total'
  ) THEN
    ALTER TABLE trending_hashtags ADD COLUMN likes_total BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'comments_total'
  ) THEN
    ALTER TABLE trending_hashtags ADD COLUMN comments_total BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'shares_total'
  ) THEN
    ALTER TABLE trending_hashtags ADD COLUMN shares_total BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'scraped_at'
  ) THEN
    ALTER TABLE trending_hashtags ADD COLUMN scraped_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- backfill from legacy columns, if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'avg_engagement'
  ) THEN
    UPDATE trending_hashtags
    SET engagement_avg = avg_engagement
    WHERE engagement_avg IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'total_engagement'
  ) THEN
    UPDATE trending_hashtags
    SET likes_total = COALESCE(likes_total, total_engagement)
    WHERE likes_total IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_hashtags' AND column_name = 'last_seen_at'
  ) THEN
    UPDATE trending_hashtags
    SET scraped_at = COALESCE(scraped_at, last_seen_at)
    WHERE scraped_at IS NULL;
  END IF;
END $$;

-- Mark legacy columns as deprecated (kept for backward compatibility)
COMMENT ON COLUMN trending_hashtags.avg_engagement IS 'DEPRECATED: use engagement_avg';
COMMENT ON COLUMN trending_hashtags.total_engagement IS 'DEPRECATED: use likes_total (+ comments_total + shares_total)';
COMMENT ON COLUMN trending_hashtags.last_seen_at IS 'DEPRECATED: use scraped_at';
COMMENT ON COLUMN trending_hashtags.first_seen_at IS 'DEPRECATED: not used by current pipeline';

-- 2) trending_content column alignment
DO $$
BEGIN
  -- ensure current schema columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN content_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'author_username'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN author_username TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'author_url'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN author_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'caption'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN caption TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'plays_count'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN plays_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'content_url'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN content_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'posted_at'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN posted_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN raw_data JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'topic'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN topic TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'subtopic'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN subtopic TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'ig_id'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN ig_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'shortcode'
  ) THEN
    ALTER TABLE trending_content ADD COLUMN shortcode TEXT;
  END IF;

  -- backfill from legacy columns, if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'author_handle'
  ) THEN
    UPDATE trending_content
    SET author_username = author_handle
    WHERE author_username IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'text'
  ) THEN
    UPDATE trending_content
    SET caption = text
    WHERE caption IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'views_count'
  ) THEN
    UPDATE trending_content
    SET plays_count = COALESCE(plays_count, views_count)
    WHERE plays_count IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'post_url'
  ) THEN
    UPDATE trending_content
    SET content_url = post_url
    WHERE content_url IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trending_content' AND column_name = 'published_at'
  ) THEN
    UPDATE trending_content
    SET posted_at = published_at
    WHERE posted_at IS NULL;
  END IF;
END $$;

-- 3) scraping_logs alignment (if older fields exist)
DO $$
BEGIN
  -- Backfill workflow_name from job_type when missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraping_logs' AND column_name = 'job_type'
  ) THEN
    UPDATE scraping_logs
    SET workflow_name = job_type
    WHERE workflow_name IS NULL;
  END IF;

  -- Backfill records_scraped from records_processed when missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraping_logs' AND column_name = 'records_processed'
  ) THEN
    UPDATE scraping_logs
    SET records_scraped = records_processed
    WHERE records_scraped IS NULL;
  END IF;
END $$;
