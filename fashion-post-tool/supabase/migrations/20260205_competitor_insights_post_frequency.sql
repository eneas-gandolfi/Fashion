-- Include post_frequency in competitor insights
DROP VIEW IF EXISTS v_competitor_insights;

CREATE VIEW v_competitor_insights AS
SELECT 
  ct.client_id,
  sp.id as competitor_id,
  sp.handle,
  sp.platform,
  ct.priority,
  pa.follower_count,
  pa.follower_growth,
  pa.avg_engagement_rate,
  pa.post_frequency,
  ct.last_analyzed_at
FROM competitor_tracking ct
JOIN store_profiles sp ON sp.id = ct.competitor_profile_id
LEFT JOIN LATERAL (
  SELECT * FROM profile_analytics 
  WHERE profile_id = sp.id 
  ORDER BY date DESC 
  LIMIT 1
) pa ON true
WHERE ct.alert_on_changes = true;
