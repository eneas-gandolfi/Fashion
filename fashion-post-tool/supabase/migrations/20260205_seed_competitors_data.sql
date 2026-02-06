-- Seed data for competitors (v_competitor_insights)
DO $$
DECLARE
  v_client_id UUID;
  v_comp_zara UUID;
  v_comp_renner UUID;
  v_comp_cea UUID;
  v_comp_marisa UUID;
BEGIN
  -- Ensure Fashion Center store exists (client_id)
  SELECT id INTO v_client_id FROM stores WHERE name = 'Fashion Center' LIMIT 1;
  IF v_client_id IS NULL THEN
    INSERT INTO stores (name) VALUES ('Fashion Center') RETURNING id INTO v_client_id;
  END IF;

  -- Ensure competitor profiles exist
  INSERT INTO store_profiles (store_id, platform, handle, url, enabled)
  VALUES
    (v_client_id, 'instagram', 'zfradelashop', 'https://www.instagram.com/zfradelashop', true),
    (v_client_id, 'instagram', 'lojarenner', 'https://www.instagram.com/lojarenner', true),
    (v_client_id, 'instagram', 'cea_brasil', 'https://www.instagram.com/cea_brasil', true),
    (v_client_id, 'instagram', 'lojasmarisa', 'https://www.instagram.com/lojasmarisa', true)
  ON CONFLICT (store_id, platform, handle) DO NOTHING;

  SELECT id INTO v_comp_zara FROM store_profiles WHERE store_id = v_client_id AND platform = 'instagram' AND handle = 'zfradelashop' LIMIT 1;
  SELECT id INTO v_comp_renner FROM store_profiles WHERE store_id = v_client_id AND platform = 'instagram' AND handle = 'lojarenner' LIMIT 1;
  SELECT id INTO v_comp_cea FROM store_profiles WHERE store_id = v_client_id AND platform = 'instagram' AND handle = 'cea_brasil' LIMIT 1;
  SELECT id INTO v_comp_marisa FROM store_profiles WHERE store_id = v_client_id AND platform = 'instagram' AND handle = 'lojasmarisa' LIMIT 1;

  -- Seed competitor tracking
  INSERT INTO competitor_tracking (client_id, competitor_profile_id, tracking_reason, priority, last_analyzed_at, alert_on_changes)
  VALUES
    (v_client_id, v_comp_zara, 'Benchmark de fast fashion', 'high', NOW(), true),
    (v_client_id, v_comp_renner, 'Comparativo de campanhas', 'medium', NOW(), true),
    (v_client_id, v_comp_cea, 'Monitorar colecoes sazonais', 'medium', NOW(), true),
    (v_client_id, v_comp_marisa, 'Comparar engajamento', 'low', NOW(), true)
  ON CONFLICT (client_id, competitor_profile_id) DO UPDATE SET
    tracking_reason = EXCLUDED.tracking_reason,
    priority = EXCLUDED.priority,
    last_analyzed_at = NOW(),
    alert_on_changes = true;

  -- Seed profile analytics to populate v_competitor_insights
  INSERT INTO profile_analytics (profile_id, date, follower_count, follower_growth, avg_engagement_rate, post_frequency, top_hashtags)
  VALUES
    (v_comp_zara, CURRENT_DATE, 9200000, 64000, 2.6, 7, ARRAY['sale', 'newin', 'moda']),
    (v_comp_renner, CURRENT_DATE, 5100000, 42000, 3.1, 6, ARRAY['renner', 'lookdodia', 'moda']),
    (v_comp_cea, CURRENT_DATE, 3900000, 31000, 2.4, 5, ARRAY['cea', 'tendencia', 'fashion']),
    (v_comp_marisa, CURRENT_DATE, 2100000, 18000, 2.0, 4, ARRAY['marisa', 'promo', 'estilo'])
  ON CONFLICT (profile_id, date) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    follower_growth = EXCLUDED.follower_growth,
    avg_engagement_rate = EXCLUDED.avg_engagement_rate,
    post_frequency = EXCLUDED.post_frequency,
    top_hashtags = EXCLUDED.top_hashtags,
    computed_at = NOW();
END $$;
