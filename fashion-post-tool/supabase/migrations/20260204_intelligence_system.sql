-- ============================================
-- FASHION CENTER INTELLIGENCE SYSTEM
-- Advanced Analytics & Multi-Method Discovery
-- ============================================

-- 1. CLIENT NICHES (Multi-tenant Configuration)
CREATE TABLE IF NOT EXISTS client_niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL, -- Reference to client/store
  name TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  excluded_terms TEXT[] DEFAULT '{}',
  min_engagement INTEGER DEFAULT 1000,
  min_followers INTEGER DEFAULT 5000,
  target_regions TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, name)
);

-- 2. PROFILE ANALYTICS (Growth Tracking)
CREATE TABLE IF NOT EXISTS profile_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  follower_count INTEGER,
  follower_growth INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC(5,2),
  post_frequency INTEGER DEFAULT 0,
  top_hashtags TEXT[] DEFAULT '{}',
  top_content_types TEXT[] DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, date)
);

-- 3. CONTENT INSIGHTS (Performance Analysis)
CREATE TABLE IF NOT EXISTS content_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  niche_id UUID REFERENCES client_niches(id) ON DELETE SET NULL,
  performance_score NUMERIC(5,2) DEFAULT 0, -- 0-100 normalized score
  engagement_rate NUMERIC(5,2),
  virality_score NUMERIC(5,2) DEFAULT 0,
  best_posting_time TIME,
  content_type TEXT, -- 'image', 'video', 'carousel', 'reel'
  sentiment_score NUMERIC(3,2), -- -1 to 1
  key_topics TEXT[] DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(social_post_id)
);

-- 4. COMPETITOR TRACKING
CREATE TABLE IF NOT EXISTS competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  competitor_profile_id UUID NOT NULL REFERENCES store_profiles(id) ON DELETE CASCADE,
  tracking_reason TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  last_analyzed_at TIMESTAMPTZ,
  alert_on_changes BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, competitor_profile_id)
);

-- 5. SENTIMENT ANALYSIS
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence_score NUMERIC(3,2), -- 0-1
  key_emotions TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(social_post_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_niches_client ON client_niches(client_id) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile ON profile_analytics(profile_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_profile_analytics_growth ON profile_analytics(follower_growth DESC);
CREATE INDEX IF NOT EXISTS idx_content_insights_performance ON content_insights(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_insights_niche ON content_insights(niche_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_client ON competitor_tracking(client_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_client_niches_updated_at
  BEFORE UPDATE ON client_niches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Trending Content (Last 7 days)
CREATE OR REPLACE VIEW v_trending_content AS
SELECT 
  sp.id,
  sp.platform,
  sp.text,
  sp.hashtags,
  sp.published_at,
  ci.performance_score,
  ci.engagement_rate,
  ci.virality_score,
  ci.sentiment_score,
  ci.key_topics,
  '7d'::TEXT as time_window
FROM social_posts sp
JOIN content_insights ci ON ci.social_post_id = sp.id
WHERE sp.published_at >= NOW() - INTERVAL '7 days'
ORDER BY ci.performance_score DESC;

-- Emerging Influencers (High Growth)
CREATE OR REPLACE VIEW v_emerging_influencers AS
SELECT 
  sp.id as profile_id,
  sp.handle,
  sp.platform,
  pa.follower_count,
  pa.follower_growth,
  pa.avg_engagement_rate,
  (pa.follower_growth::NUMERIC / NULLIF(pa.follower_count - pa.follower_growth, 0) * 100) as growth_rate,
  pa.date,
  pa.computed_at
FROM store_profiles sp
JOIN profile_analytics pa ON pa.profile_id = sp.id
WHERE pa.date >= CURRENT_DATE - INTERVAL '30 days'
  AND pa.follower_growth > 0
ORDER BY growth_rate DESC;

-- Niche Performance Summary
CREATE OR REPLACE VIEW v_niche_performance AS
SELECT 
  cn.id as niche_id,
  cn.name as niche_name,
  cn.client_id,
  COUNT(DISTINCT ci.social_post_id) as total_posts,
  AVG(ci.performance_score) as avg_performance,
  AVG(ci.engagement_rate) as avg_engagement,
  AVG(ci.sentiment_score) as avg_sentiment,
  MAX(ci.computed_at) as last_computed
FROM client_niches cn
LEFT JOIN content_insights ci ON ci.niche_id = cn.id
WHERE cn.enabled = true
GROUP BY cn.id, cn.name, cn.client_id;

-- Competitor Insights
CREATE OR REPLACE VIEW v_competitor_insights AS
SELECT 
  ct.client_id,
  sp.id as competitor_id,
  sp.handle,
  sp.platform,
  ct.priority,
  pa.follower_count,
  pa.follower_growth,
  pa.avg_engagement_rate,
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

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Get Client Niches
CREATE OR REPLACE FUNCTION get_client_niches(p_client_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  hashtags TEXT[],
  keywords TEXT[],
  excluded_terms TEXT[],
  min_engagement INTEGER,
  min_followers INTEGER,
  target_regions TEXT[],
  enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cn.id, cn.name, cn.description, cn.hashtags, cn.keywords,
    cn.excluded_terms, cn.min_engagement, cn.min_followers,
    cn.target_regions, cn.enabled
  FROM client_niches cn
  WHERE cn.client_id = p_client_id
    AND cn.enabled = true
  ORDER BY cn.created_at;
END;
$$ LANGUAGE plpgsql;

-- Get Trending Topics
CREATE OR REPLACE FUNCTION get_trending_topics(
  p_niche_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  topic TEXT,
  mention_count BIGINT,
  avg_performance NUMERIC,
  avg_sentiment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(ci.key_topics) as topic,
    COUNT(*) as mention_count,
    AVG(ci.performance_score) as avg_performance,
    AVG(ci.sentiment_score) as avg_sentiment
  FROM content_insights ci
  WHERE ci.niche_id = p_niche_id
    AND ci.computed_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY topic
  HAVING COUNT(*) >= 3
  ORDER BY mention_count DESC, avg_performance DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Get Emerging Influencers
CREATE OR REPLACE FUNCTION get_emerging_influencers(
  p_niche_id UUID,
  p_min_growth_rate NUMERIC DEFAULT 20.0
)
RETURNS TABLE (
  profile_id UUID,
  handle TEXT,
  platform TEXT,
  follower_count INTEGER,
  growth_rate NUMERIC,
  avg_engagement_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ei.profile_id,
    ei.handle,
    ei.platform::TEXT,
    ei.follower_count,
    ei.growth_rate,
    ei.avg_engagement_rate
  FROM v_emerging_influencers ei
  WHERE ei.growth_rate >= p_min_growth_rate
  ORDER BY ei.growth_rate DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Get Content Recommendations
CREATE OR REPLACE FUNCTION get_content_recommendations(p_niche_id UUID)
RETURNS TABLE (
  recommendation_type TEXT,
  value TEXT,
  reason TEXT,
  score NUMERIC
) AS $$
BEGIN
  -- Best performing hashtags
  RETURN QUERY
  SELECT 
    'hashtag'::TEXT,
    unnest(sp.hashtags) as value,
    'High performance in recent posts'::TEXT as reason,
    AVG(ci.performance_score) as score
  FROM social_posts sp
  JOIN content_insights ci ON ci.social_post_id = sp.id
  WHERE ci.niche_id = p_niche_id
    AND ci.computed_at >= NOW() - INTERVAL '30 days'
  GROUP BY value
  HAVING COUNT(*) >= 5
  ORDER BY score DESC
  LIMIT 10;
  
  -- Best posting times
  RETURN QUERY
  SELECT 
    'posting_time'::TEXT,
    TO_CHAR(ci.best_posting_time, 'HH24:MI')::TEXT as value,
    'Optimal engagement window'::TEXT as reason,
    AVG(ci.engagement_rate) as score
  FROM content_insights ci
  WHERE ci.niche_id = p_niche_id
    AND ci.best_posting_time IS NOT NULL
    AND ci.computed_at >= NOW() - INTERVAL '30 days'
  GROUP BY ci.best_posting_time
  ORDER BY score DESC
  LIMIT 5;
  
  -- Best content types
  RETURN QUERY
  SELECT 
    'content_type'::TEXT,
    ci.content_type as value,
    'High engagement format'::TEXT as reason,
    AVG(ci.performance_score) as score
  FROM content_insights ci
  WHERE ci.niche_id = p_niche_id
    AND ci.content_type IS NOT NULL
    AND ci.computed_at >= NOW() - INTERVAL '30 days'
  GROUP BY ci.content_type
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate Profile Analytics
CREATE OR REPLACE FUNCTION calculate_profile_analytics(p_profile_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_follower_count INTEGER;
  v_prev_follower_count INTEGER;
  v_post_count INTEGER;
  v_avg_engagement NUMERIC;
  v_top_hashtags TEXT[];
BEGIN
  -- Get current follower count from latest post metadata
  SELECT COALESCE((raw->'author'->>'follower_count')::INTEGER, 0)
  INTO v_follower_count
  FROM social_posts
  WHERE profile_id = p_profile_id
  ORDER BY published_at DESC
  LIMIT 1;
  
  -- Get previous day follower count
  SELECT follower_count INTO v_prev_follower_count
  FROM profile_analytics
  WHERE profile_id = p_profile_id
    AND date = v_today - INTERVAL '1 day';
  
  -- Count posts in last 7 days
  SELECT COUNT(*)
  INTO v_post_count
  FROM social_posts
  WHERE profile_id = p_profile_id
    AND published_at >= v_today - INTERVAL '7 days';
  
  -- Calculate average engagement rate
  SELECT AVG(
    (COALESCE((metrics->>'likes')::INTEGER, 0) + 
     COALESCE((metrics->>'comments')::INTEGER, 0))::NUMERIC / 
    NULLIF(COALESCE((raw->'author'->>'follower_count')::INTEGER, 1), 0) * 100
  )
  INTO v_avg_engagement
  FROM social_posts
  WHERE profile_id = p_profile_id
    AND published_at >= v_today - INTERVAL '7 days';
  
  -- Get top hashtags
  SELECT ARRAY_AGG(DISTINCT hashtag ORDER BY hashtag)
  INTO v_top_hashtags
  FROM (
    SELECT unnest(hashtags) as hashtag
    FROM social_posts
    WHERE profile_id = p_profile_id
      AND published_at >= v_today - INTERVAL '7 days'
    LIMIT 10
  ) t;
  
  -- Insert or update analytics
  INSERT INTO profile_analytics (
    profile_id, date, follower_count, follower_growth,
    avg_engagement_rate, post_frequency, top_hashtags
  ) VALUES (
    p_profile_id, v_today, v_follower_count,
    COALESCE(v_follower_count - v_prev_follower_count, 0),
    COALESCE(v_avg_engagement, 0),
    v_post_count,
    COALESCE(v_top_hashtags, '{}')
  )
  ON CONFLICT (profile_id, date) DO UPDATE SET
    follower_count = EXCLUDED.follower_count,
    follower_growth = EXCLUDED.follower_growth,
    avg_engagement_rate = EXCLUDED.avg_engagement_rate,
    post_frequency = EXCLUDED.post_frequency,
    top_hashtags = EXCLUDED.top_hashtags,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Analyze Sentiment (Simple Keyword-Based)
CREATE OR REPLACE FUNCTION analyze_sentiment(p_post_text TEXT)
RETURNS TABLE (
  sentiment TEXT,
  confidence_score NUMERIC,
  key_emotions TEXT[]
) AS $$
DECLARE
  v_positive_count INTEGER := 0;
  v_negative_count INTEGER := 0;
  v_total_count INTEGER;
  v_sentiment TEXT;
  v_confidence NUMERIC;
  v_emotions TEXT[] := '{}';
BEGIN
  -- Positive keywords
  v_positive_count := (
    SELECT COUNT(*)
    FROM unnest(ARRAY['amor', 'love', 'incrível', 'amazing', 'perfeito', 'perfect', 
                      'lindo', 'beautiful', 'maravilhoso', 'wonderful', 'feliz', 'happy',
                      '❤️', '😍', '🔥', '✨', '💖']) as keyword
    WHERE p_post_text ILIKE '%' || keyword || '%'
  );
  
  -- Negative keywords
  v_negative_count := (
    SELECT COUNT(*)
    FROM unnest(ARRAY['ruim', 'bad', 'péssimo', 'terrible', 'horrível', 'horrible',
                      'ódio', 'hate', 'triste', 'sad', '😢', '😭', '😡']) as keyword
    WHERE p_post_text ILIKE '%' || keyword || '%'
  );
  
  v_total_count := v_positive_count + v_negative_count;
  
  -- Determine sentiment
  IF v_total_count = 0 THEN
    v_sentiment := 'neutral';
    v_confidence := 0.5;
  ELSIF v_positive_count > v_negative_count THEN
    v_sentiment := 'positive';
    v_confidence := LEAST(v_positive_count::NUMERIC / NULLIF(v_total_count, 0), 1.0);
    v_emotions := ARRAY['joy', 'love'];
  ELSIF v_negative_count > v_positive_count THEN
    v_sentiment := 'negative';
    v_confidence := LEAST(v_negative_count::NUMERIC / NULLIF(v_total_count, 0), 1.0);
    v_emotions := ARRAY['anger', 'sadness'];
  ELSE
    v_sentiment := 'neutral';
    v_confidence := 0.5;
  END IF;
  
  RETURN QUERY SELECT v_sentiment, v_confidence, v_emotions;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default client niche for Fashion Center
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Get or create Fashion Center store
  SELECT id INTO v_client_id FROM stores WHERE name = 'Fashion Center' LIMIT 1;
  
  IF v_client_id IS NULL THEN
    INSERT INTO stores (name) VALUES ('Fashion Center') RETURNING id INTO v_client_id;
  END IF;
  
  -- Insert Fashion Center niche
  INSERT INTO client_niches (
    client_id, name, description, hashtags, keywords,
    min_engagement, min_followers
  ) VALUES (
    v_client_id,
    'Fashion Center',
    'Moda, estilo e tendências para Fashion Center',
    ARRAY['fashion', 'moda', 'ootd', 'streetwear', 'style', 'fashiontrends', 
          'modafeminina', 'lookdodia', 'fashionista', 'estilo'],
    ARRAY['moda feminina', 'roupa', 'look', 'outfit', 'estilo', 'tendencia'],
    1000,
    5000
  )
  ON CONFLICT (client_id, name) DO NOTHING;
END $$;
