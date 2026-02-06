-- Health dashboard views for scraping_logs

-- Fast lookups by workflow and recency
CREATE INDEX IF NOT EXISTS idx_scraping_logs_workflow_started
  ON scraping_logs (workflow_name, started_at DESC);

-- Aggregated health over last 30 days
CREATE OR REPLACE VIEW scraping_health_dashboard AS
SELECT
  date_trunc('day', started_at) AS day,
  workflow_name,
  platform,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'success') AS success_runs,
  COUNT(*) FILTER (WHERE status = 'partial') AS partial_runs,
  COUNT(*) FILTER (WHERE status = 'error') AS error_runs,
  COALESCE(SUM(records_scraped), 0) AS records_scraped_total,
  MAX(completed_at) AS last_completed_at,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) AS error_count
FROM scraping_logs
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2, 3
ORDER BY day DESC, workflow_name, platform;

-- Latest run per workflow/platform
CREATE OR REPLACE VIEW scraping_last_run AS
SELECT DISTINCT ON (workflow_name, platform)
  workflow_name,
  platform,
  status,
  records_scraped,
  error_message,
  apify_run_id,
  started_at,
  completed_at
FROM scraping_logs
ORDER BY workflow_name, platform, started_at DESC;
