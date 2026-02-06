-- Seed real data for Inspirations (social_posts with media)
DO $$
DECLARE
  v_store_id UUID;
  v_profile_ig UUID;
  v_profile_ig2 UUID;
  v_profile_tt UUID;
BEGIN
  -- Ensure Fashion Center store exists
  SELECT id INTO v_store_id FROM stores WHERE name = 'Fashion Center' LIMIT 1;
  IF v_store_id IS NULL THEN
    INSERT INTO stores (name) VALUES ('Fashion Center') RETURNING id INTO v_store_id;
  END IF;

  -- Ensure profiles exist
  INSERT INTO store_profiles (store_id, platform, handle, url, enabled)
  VALUES
    (v_store_id, 'instagram', 'atelier_nova', 'https://www.instagram.com/atelier_nova', true),
    (v_store_id, 'instagram', 'streetlab.br', 'https://www.instagram.com/streetlab.br', true),
    (v_store_id, 'tiktok', 'moda_tok', 'https://www.tiktok.com/@moda_tok', true)
  ON CONFLICT (store_id, platform, handle) DO NOTHING;

  SELECT id INTO v_profile_ig FROM store_profiles WHERE store_id = v_store_id AND platform = 'instagram' AND handle = 'atelier_nova' LIMIT 1;
  SELECT id INTO v_profile_ig2 FROM store_profiles WHERE store_id = v_store_id AND platform = 'instagram' AND handle = 'streetlab.br' LIMIT 1;
  SELECT id INTO v_profile_tt FROM store_profiles WHERE store_id = v_store_id AND platform = 'tiktok' AND handle = 'moda_tok' LIMIT 1;

  -- Seed social posts with media (used by Inspirations)
  INSERT INTO social_posts (
    platform, external_post_id, profile_id, text, hashtags, media, metrics, published_at, raw
  ) VALUES
    (
      'instagram',
      'inspo-ig-001',
      v_profile_ig,
      'A simplicidade e o auge da sofisticacao. Basicos essenciais com textura premium.',
      ARRAY['moda', 'ootd', 'minimalismo', 'fashion'],
      '[{"type":"image","url":"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=80"}]'::jsonb,
      '{"likes": 2450, "comments": 120, "shares": 45, "views": 15000}'::jsonb,
      NOW() - INTERVAL '2 days',
      '{"author": {"follower_count": 42000}}'::jsonb
    ),
    (
      'instagram',
      'inspo-ig-002',
      v_profile_ig2,
      'Streetwear minimal com foco em textura e volume. Conforto e estilo no mesmo look.',
      ARRAY['streetwear', 'style', 'fashiontrends', 'urban'],
      '[{"type":"image","url":"https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&auto=format&fit=crop&q=80"}]'::jsonb,
      '{"likes": 4300, "comments": 310, "shares": 210, "views": 45000}'::jsonb,
      NOW() - INTERVAL '4 days',
      '{"author": {"follower_count": 35000}}'::jsonb
    ),
    (
      'instagram',
      'inspo-ig-003',
      v_profile_ig,
      'O poder de um bom acessorio. Detalhes que transformam o look.',
      ARRAY['acessorios', 'joias', 'luxo'],
      '[{"type":"image","url":"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&auto=format&fit=crop&q=80"}]'::jsonb,
      '{"likes": 3200, "comments": 56, "shares": 12, "views": 9800}'::jsonb,
      NOW() - INTERVAL '6 days',
      '{"author": {"follower_count": 42000}}'::jsonb
    ),
    (
      'tiktok',
      'inspo-tt-001',
      v_profile_tt,
      'Tutorial rapido: 3 formas de usar lenco! Qual a sua favorita?',
      ARRAY['dicasdemoda', 'tiktokfashion', 'scarfstyle'],
      '[{"type":"video","url":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&auto=format&fit=crop&q=80","thumbnail":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&auto=format&fit=crop&q=80"}]'::jsonb,
      '{"likes": 15600, "comments": 890, "shares": 3400, "views": 250000}'::jsonb,
      NOW() - INTERVAL '1 day',
      '{"author": {"follower_count": 68000}}'::jsonb
    )
  ON CONFLICT (platform, external_post_id) DO UPDATE SET
    text = EXCLUDED.text,
    hashtags = EXCLUDED.hashtags,
    media = EXCLUDED.media,
    metrics = EXCLUDED.metrics,
    published_at = EXCLUDED.published_at;
END $$;
