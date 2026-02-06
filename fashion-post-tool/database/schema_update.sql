-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE platform_type AS ENUM ('instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'twitter', 'threads', 'pinterest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trend_window AS ENUM ('7d', '30d');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trend_type AS ENUM ('hashtag', 'keyword', 'sound', 'topic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. STORES & PROFILES
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_name_unique ON stores (name);

CREATE TABLE IF NOT EXISTS store_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    handle TEXT NOT NULL,
    url TEXT,
    verified BOOLEAN DEFAULT false,
    confidence_score INT DEFAULT 0,
    last_scraped_at TIMESTAMPTZ,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, platform, handle)
);

-- Ensure enabled column exists if table already existed
DO $$ BEGIN
    ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Health dashboard views for scraping logs (last 30 days)
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

-- Ensure store_id column exists if table already existed (for legacy installs)
DO $$ BEGIN
    ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure unique index for multi-store profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_profiles_store_platform_handle ON store_profiles (store_id, platform, handle);

-- 2. SCRAPING JOBS LOG
CREATE TABLE IF NOT EXISTS scrape_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform platform_type NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    payload JSONB,
    result_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

-- 3. SOCIAL POSTS (Raw Intelligence)
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform platform_type NOT NULL,
    external_post_id TEXT NOT NULL,
    profile_id UUID REFERENCES store_profiles(id) ON DELETE SET NULL, -- Nullable for hashtag trends
    text TEXT,
    hashtags TEXT[],
    media JSONB DEFAULT '[]'::jsonb, -- [{type, url, thumbnail}]
    metrics JSONB DEFAULT '{}'::jsonb, -- likes, comments, shares, views
    published_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    raw JSONB DEFAULT '{}'::jsonb, -- MUST contain raw.debug for debug mode
    CONSTRAINT social_posts_platform_external_id_key UNIQUE (platform, external_post_id)
);

-- 4. TREND SIGNALS
CREATE TABLE IF NOT EXISTS trend_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform platform_type NOT NULL,
    type trend_type NOT NULL,
    value TEXT NOT NULL,
    time_window trend_window NOT NULL,
    score NUMERIC DEFAULT 0,
    growth NUMERIC DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TREND QUERIES (Inputs for scraping)
CREATE TABLE IF NOT EXISTS trend_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform platform_type NOT NULL,
    query TEXT NOT NULL, -- hashtag or keyword
    enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, query)
);

-- 6. INSPIRATION LINKS (Bridge to content creation)
CREATE TABLE IF NOT EXISTS post_inspirations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL, -- Reference to the application's main post table (assuming 'posts' exists)
    social_post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Constraint to ensure we link to existing posts removed for flexibility, or could use REFERENCES posts(id) if sure
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_social_posts_platform_published ON social_posts(platform, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_raw_debug ON social_posts((raw->>'debug'));
CREATE INDEX IF NOT EXISTS idx_trend_signals_computed ON trend_signals(computed_at DESC);

-- RPC: pick_profiles_for_daily_monitoring
DROP FUNCTION IF EXISTS pick_profiles_for_daily_monitoring(platform_type, INT);
CREATE OR REPLACE FUNCTION pick_profiles_for_daily_monitoring(
    p_platform platform_type,
    p_limit INT
)
RETURNS TABLE (
    id UUID,
    handle TEXT,
    platform platform_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT sp.id, sp.handle, sp.platform
    FROM store_profiles sp
    WHERE sp.platform = p_platform
      AND sp.enabled = true
    ORDER BY sp.last_scraped_at ASC NULLS FIRST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Storage cleanup for free tier limits (Option A)
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

-- SEEDS (Idempotent)
DO $$
DECLARE
    v_store_id UUID;
BEGIN
    -- Ensure a store exists
    INSERT INTO stores (name) VALUES ('Fashion Center')
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO v_store_id FROM stores WHERE name = 'Fashion Center' LIMIT 1;

    -- Profiles
    INSERT INTO store_profiles (store_id, platform, handle)
    VALUES 
        (v_store_id, 'instagram', 'nike'),
        (v_store_id, 'tiktok', 'neymarjr')
    ON CONFLICT DO NOTHING;

    -- Trend Queries
    INSERT INTO trend_queries (platform, query)
    VALUES
        ('tiktok', 'fashion'),
        ('tiktok', 'summer2026'),
        ('instagram', 'ootd')
    ON CONFLICT DO NOTHING;
END $$;
