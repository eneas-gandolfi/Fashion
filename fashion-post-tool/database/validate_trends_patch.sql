-- Validation checks for trends patch
-- Run after applying schema_patch_trends.sql

-- 1) trending_hashtags: ensure new fields are populated
SELECT
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE engagement_avg IS NULL) AS engagement_avg_nulls,
  COUNT(*) FILTER (WHERE likes_total IS NULL) AS likes_total_nulls,
  COUNT(*) FILTER (WHERE scraped_at IS NULL) AS scraped_at_nulls
FROM trending_hashtags;

-- 2) trending_hashtags: spot-check legacy vs new values
SELECT
  hashtag,
  platform,
  avg_engagement AS legacy_avg_engagement,
  engagement_avg AS new_engagement_avg,
  total_engagement AS legacy_total_engagement,
  likes_total AS new_likes_total,
  last_seen_at AS legacy_last_seen_at,
  scraped_at AS new_scraped_at
FROM trending_hashtags
WHERE avg_engagement IS NOT NULL
   OR total_engagement IS NOT NULL
   OR last_seen_at IS NOT NULL
ORDER BY scraped_at DESC NULLS LAST
LIMIT 20;
