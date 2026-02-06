-- ============================================
-- SISTEMA DE SCRAPING DE TENDÊNCIAS
-- Fashion Trends: Instagram + TikTok
-- ============================================

-- 1. Tabela de Hashtags Trending
CREATE TABLE IF NOT EXISTS trending_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  hashtag TEXT NOT NULL,
  post_count INTEGER DEFAULT 0,
  engagement_avg DECIMAL(10,2) DEFAULT 0,
  likes_total BIGINT DEFAULT 0,
  comments_total BIGINT DEFAULT 0,
  shares_total BIGINT DEFAULT 0,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, hashtag, DATE(scraped_at))
);

-- 2. Tabela de Conteúdo Trending
CREATE TABLE IF NOT EXISTS trending_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  hashtag_id UUID REFERENCES trending_hashtags(id) ON DELETE CASCADE,
  content_type TEXT CHECK (content_type IN ('post', 'reel', 'video', 'carousel')),
  author_username TEXT,
  author_url TEXT,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  plays_count INTEGER DEFAULT 0,
  content_url TEXT,
  thumbnail_url TEXT,
  posted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Logs de Scraping
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'partial')),
  hashtags_scraped TEXT[],
  records_scraped INTEGER DEFAULT 0,
  error_message TEXT,
  apify_run_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_platform ON trending_hashtags(platform);
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_scraped_at ON trending_hashtags(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_engagement ON trending_hashtags(engagement_avg DESC);
CREATE INDEX IF NOT EXISTS idx_trending_content_platform ON trending_content(platform);
CREATE INDEX IF NOT EXISTS idx_trending_content_likes ON trending_content(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_trending_content_scraped_at ON trending_content(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);

-- 5. View para Dashboard de Tendências
CREATE OR REPLACE VIEW trends_dashboard AS
SELECT 
  th.platform,
  th.hashtag,
  th.post_count,
  th.engagement_avg,
  th.likes_total,
  th.scraped_at,
  COUNT(tc.id) as content_count,
  MAX(tc.likes_count) as top_likes,
  ARRAY_AGG(DISTINCT tc.author_username) FILTER (WHERE tc.author_username IS NOT NULL) as top_authors
FROM trending_hashtags th
LEFT JOIN trending_content tc ON tc.hashtag_id = th.id
WHERE th.scraped_at > NOW() - INTERVAL '7 days'
GROUP BY th.id, th.platform, th.hashtag, th.post_count, th.engagement_avg, th.likes_total, th.scraped_at
ORDER BY th.engagement_avg DESC, th.scraped_at DESC;

-- 6. View de Top Content por Plataforma
CREATE OR REPLACE VIEW top_trending_content AS
SELECT 
  tc.platform,
  tc.content_type,
  tc.author_username,
  tc.caption,
  tc.likes_count,
  tc.comments_count,
  tc.shares_count,
  tc.plays_count,
  tc.content_url,
  tc.thumbnail_url,
  th.hashtag,
  tc.scraped_at
FROM trending_content tc
JOIN trending_hashtags th ON th.id = tc.hashtag_id
WHERE tc.scraped_at > NOW() - INTERVAL '7 days'
ORDER BY tc.likes_count DESC
LIMIT 50;

-- 7. Function para Limpar Dados Antigos (manter 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_trends()
RETURNS void AS $$
BEGIN
  DELETE FROM trending_content WHERE scraped_at < NOW() - INTERVAL '30 days';
  DELETE FROM trending_hashtags WHERE scraped_at < NOW() - INTERVAL '30 days';
  DELETE FROM scraping_logs WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. RPC para Buscar Trends Recentes
CREATE OR REPLACE FUNCTION get_recent_trends(p_platform TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  platform TEXT,
  hashtag TEXT,
  post_count INTEGER,
  engagement_avg DECIMAL,
  likes_total BIGINT,
  scraped_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.platform,
    th.hashtag,
    th.post_count,
    th.engagement_avg,
    th.likes_total,
    th.scraped_at
  FROM trending_hashtags th
  WHERE (p_platform IS NULL OR th.platform = p_platform)
    AND th.scraped_at > NOW() - INTERVAL '7 days'
  ORDER BY th.engagement_avg DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 9. RPC para Top Content
CREATE OR REPLACE FUNCTION get_top_content(p_platform TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  platform TEXT,
  hashtag TEXT,
  author_username TEXT,
  caption TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  content_url TEXT,
  thumbnail_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.id,
    tc.platform,
    th.hashtag,
    tc.author_username,
    tc.caption,
    tc.likes_count,
    tc.comments_count,
    tc.content_url,
    tc.thumbnail_url
  FROM trending_content tc
  JOIN trending_hashtags th ON th.id = tc.hashtag_id
  WHERE (p_platform IS NULL OR tc.platform = p_platform)
    AND tc.scraped_at > NOW() - INTERVAL '7 days'
  ORDER BY tc.likes_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
