-- Storage cleanup for free tier limits (Option A)
-- Retention:
--   scraping_logs: 14 days
--   trending_content: 14 days
--   trending_hashtags: 14 days
--   social_posts: 14 days
--   profile_analytics: 60 days
-- Raw JSON cleanup after 7 days

CREATE OR REPLACE FUNCTION cleanup_storage_free_tier()
RETURNS void AS $$
BEGIN
  -- Remove large raw JSON payloads after 7 days
  UPDATE trending_content
  SET raw_data = NULL
  WHERE raw_data IS NOT NULL
    AND scraped_at < NOW() - INTERVAL '7 days';

  UPDATE social_posts
  SET raw = '{}'::jsonb,
      media = '[]'::jsonb
  WHERE (raw IS NOT NULL OR media IS NOT NULL)
    AND collected_at < NOW() - INTERVAL '7 days';

  -- Delete old data (retention windows)
  DELETE FROM scraping_logs
  WHERE started_at < NOW() - INTERVAL '14 days';

  DELETE FROM trending_content
  WHERE scraped_at < NOW() - INTERVAL '14 days';

  DELETE FROM trending_hashtags
  WHERE scraped_at < NOW() - INTERVAL '14 days';

  DELETE FROM social_posts
  WHERE collected_at < NOW() - INTERVAL '14 days';

  DELETE FROM profile_analytics
  WHERE date < CURRENT_DATE - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;
