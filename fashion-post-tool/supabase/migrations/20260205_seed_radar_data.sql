-- Seed minimal data for Radar tabs (v_trending_content and v_emerging_influencers)
DO $$
DECLARE
  v_store_id UUID;
  v_profile_ig UUID;
  v_profile_ig2 UUID;
  v_profile_tt UUID;
  v_post_ig1 UUID;
  v_post_ig2 UUID;
  v_post_tt1 UUID;
BEGIN
  -- Ensure Fashion Center store exists
  SELECT id INTO v_store_id FROM stores WHERE name = 'Fashion Center' LIMIT 1;
  IF v_store_id IS NULL THEN
    INSERT INTO stores (name) VALUES ('Fashion Center') RETURNING id INTO v_store_id;
  END IF;

  -- Seed store profiles (influencers)
  INSERT INTO store_profiles (
    store_id, platform, handle, url, enabled
  ) VALUES
    (v_store_id, 'instagram', 'atelier_nova', 'https://www.instagram.com/atelier_nova', true),
    (v_store_id, 'instagram', 'streetlab.br', 'https://www.instagram.com/streetlab.br', true),
    (v_store_id, 'tiktok', 'moda_tok', 'https://www.tiktok.com/@moda_tok', true)
  ON CONFLICT (store_id, platform, handle) DO NOTHING;

  SELECT id INTO v_profile_ig FROM store_profiles WHERE store_id = v_store_id AND platform = 'instagram' AND handle = 'atelier_nova' LIMIT 1;
  SELECT id INTO v_profile_ig2 FROM store_profiles WHERE store_id = v_store_id AND platform = 'instagram' AND handle = 'streetlab.br' LIMIT 1;
  SELECT id INTO v_profile_tt FROM store_profiles WHERE store_id = v_store_id AND platform = 'tiktok' AND handle = 'moda_tok' LIMIT 1;

  -- Seed social posts for trending content (last 7 days)
  INSERT INTO social_posts (
    platform, external_post_id, profile_id, text, hashtags, media, metrics, published_at, raw
  ) VALUES (
    'instagram',
    'seed-ig-001',
    v_profile_ig,
    'Look monocromatico com alfaiataria leve e toque moderno.',
    ARRAY['moda', 'ootd', 'alfaiataria', 'streetstyle'],
    '[]'::jsonb,
    '{"likes": 12400, "comments": 420, "shares": 210, "views": 56000}'::jsonb,
    NOW() - INTERVAL '2 days',
    '{"author": {"follower_count": 42000}}'::jsonb
  )
  ON CONFLICT (platform, external_post_id) DO UPDATE SET
    text = EXCLUDED.text,
    hashtags = EXCLUDED.hashtags,
    metrics = EXCLUDED.metrics,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_post_ig1;

  INSERT INTO social_posts (
    platform, external_post_id, profile_id, text, hashtags, media, metrics, published_at, raw
  ) VALUES (
    'instagram',
    'seed-ig-002',
    v_profile_ig2,
    'Streetwear minimal com foco em textura e volume.',
    ARRAY['streetwear', 'minimal', 'style', 'fashiontrends'],
    '[]'::jsonb,
    '{"likes": 9800, "comments": 310, "shares": 180, "views": 42000}'::jsonb,
    NOW() - INTERVAL '4 days',
    '{"author": {"follower_count": 35000}}'::jsonb
  )
  ON CONFLICT (platform, external_post_id) DO UPDATE SET
    text = EXCLUDED.text,
    hashtags = EXCLUDED.hashtags,
    metrics = EXCLUDED.metrics,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_post_ig2;

  INSERT INTO social_posts (
    platform, external_post_id, profile_id, text, hashtags, media, metrics, published_at, raw
  ) VALUES (
    'tiktok',
    'seed-tt-001',
    v_profile_tt,
    '3 formas de usar camisa oversize sem perder elegancia.',
    ARRAY['moda', 'tiktokfashion', 'dicas', 'oversize'],
    '[]'::jsonb,
    '{"likes": 18000, "comments": 900, "shares": 600, "views": 98000}'::jsonb,
    NOW() - INTERVAL '1 day',
    '{"author": {"follower_count": 68000}}'::jsonb
  )
  ON CONFLICT (platform, external_post_id) DO UPDATE SET
    text = EXCLUDED.text,
    hashtags = EXCLUDED.hashtags,
    metrics = EXCLUDED.metrics,
    published_at = EXCLUDED.published_at
  RETURNING id INTO v_post_tt1;

  -- Seed content insights (required for v_trending_content)
  INSERT INTO content_insights (
    social_post_id, performance_score, engagement_rate, virality_score,
    sentiment_score, key_topics, content_type, computed_at
  ) VALUES
    (v_post_ig1, 86.5, 4.2, 72.0, 0.6, ARRAY['alfaiataria', 'monocromatico'], 'image', NOW()),
    (v_post_ig2, 78.0, 3.7, 60.0, 0.4, ARRAY['streetwear', 'minimal'], 'image', NOW()),
    (v_post_tt1, 91.0, 5.4, 85.0, 0.7, ARRAY['oversize', 'dicas'], 'video', NOW())
  ON CONFLICT (social_post_id) DO UPDATE SET
    performance_score = EXCLUDED.performance_score,
    engagement_rate = EXCLUDED.engagement_rate,
    virality_score = EXCLUDED.virality_score,
    sentiment_score = EXCLUDED.sentiment_score,
    key_topics = EXCLUDED.key_topics,
    content_type = EXCLUDED.content_type,
    computed_at = NOW();

  -- Seed profile analytics (required for v_emerging_influencers)
  INSERT INTO profile_analytics (
    profile_id, date, follower_count, follower_growth, avg_engagement_rate,
    post_frequency, top_hashtags
  ) VALUES
    (v_profile_ig, CURRENT_DATE, 42000, 3200, 4.8, 3, ARRAY['moda', 'ootd', 'alfaiataria']),
    (v_profile_ig2, CURRENT_DATE, 35000, 2100, 3.9, 2, ARRAY['streetwear', 'minimal']),
    (v_profile_tt, CURRENT_DATE, 68000, 5400, 5.6, 4, ARRAY['tiktokfashion', 'oversize'])
  ON CONFLICT (profile_id, date) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    follower_growth = EXCLUDED.follower_growth,
    avg_engagement_rate = EXCLUDED.avg_engagement_rate,
    post_frequency = EXCLUDED.post_frequency,
    top_hashtags = EXCLUDED.top_hashtags,
    computed_at = NOW();
END $$;
