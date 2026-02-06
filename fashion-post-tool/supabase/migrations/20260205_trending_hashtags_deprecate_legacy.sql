-- ============================================
-- Deprecate legacy columns in trending_hashtags
-- Adds new columns used by app/workflows and backfills from legacy fields.
-- Legacy columns are kept (not dropped) for safety.
-- ============================================

DO $$
BEGIN
  -- Add new columns if missing
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

  -- Backfill from legacy columns if they exist
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
