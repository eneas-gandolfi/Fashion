-- ============================================
-- SISTEMA DE DESCOBERTA AUTOMÁTICA POR NICHO
-- ============================================

-- 1. Tabela de Nichos
CREATE TABLE IF NOT EXISTS niches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hashtags TEXT[] NOT NULL,
  keywords TEXT[],
  min_engagement INTEGER DEFAULT 1000,
  min_followers INTEGER DEFAULT 5000,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Nichos Pré-configurados
INSERT INTO niches (name, description, hashtags, keywords, min_engagement, min_followers) VALUES
  (
    'Fashion',
    'Moda, estilo e tendências',
    ARRAY['fashion', 'ootd', 'streetwear', 'style', 'fashiontrends', 'fashionista', 'outfitoftheday', 'fashionblogger', 'instafashion', 'fashionstyle'],
    ARRAY['moda', 'roupa', 'look', 'outfit', 'estilo'],
    1000,
    5000
  ),
  (
    'Beauty',
    'Beleza, maquiagem e skincare',
    ARRAY['beauty', 'makeup', 'skincare', 'beautytips', 'makeuptutorial', 'beautyblogger', 'cosmetics', 'beautygram', 'makeupaddict', 'skincareroutine'],
    ARRAY['beleza', 'maquiagem', 'pele', 'cosmeticos'],
    1000,
    5000
  ),
  (
    'Fitness',
    'Fitness, treino e vida saudável',
    ARRAY['fitness', 'workout', 'gym', 'fitnessmotivation', 'fitfam', 'training', 'bodybuilding', 'healthylifestyle', 'fitlife', 'gymlife'],
    ARRAY['treino', 'academia', 'musculacao', 'saude'],
    1000,
    5000
  ),
  (
    'Food',
    'Gastronomia e culinária',
    ARRAY['food', 'foodie', 'foodporn', 'instafood', 'foodblogger', 'cooking', 'recipe', 'delicious', 'foodphotography', 'yummy'],
    ARRAY['comida', 'receita', 'gastronomia', 'culinaria'],
    1000,
    5000
  ),
  (
    'Travel',
    'Viagens e turismo',
    ARRAY['travel', 'travelphotography', 'wanderlust', 'travelgram', 'instatravel', 'traveling', 'travelblogger', 'adventure', 'explore', 'vacation'],
    ARRAY['viagem', 'turismo', 'destino', 'aventura'],
    1000,
    5000
  ),
  (
    'Luxury',
    'Luxo, marcas premium e lifestyle',
    ARRAY['luxury', 'luxurylifestyle', 'luxurybrand', 'designer', 'highfashion', 'luxurylife', 'luxuryliving', 'luxurygoods', 'premium', 'exclusive'],
    ARRAY['luxo', 'premium', 'exclusivo', 'grife'],
    2000,
    10000
  )
ON CONFLICT (name) DO NOTHING;

-- 3. Tabela de Perfis Descobertos
CREATE TABLE IF NOT EXISTS discovered_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche_id UUID REFERENCES niches(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  url TEXT,
  discovered_via TEXT,
  engagement_score INTEGER,
  follower_count INTEGER,
  verified BOOLEAN DEFAULT false,
  profile_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'monitoring')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, handle)
);

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_discovered_profiles_niche ON discovered_profiles(niche_id);
CREATE INDEX IF NOT EXISTS idx_discovered_profiles_status ON discovered_profiles(status);
CREATE INDEX IF NOT EXISTS idx_discovered_profiles_engagement ON discovered_profiles(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_niches_enabled ON niches(enabled) WHERE enabled = true;

-- 5. Trigger para Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_niches_updated_at
  BEFORE UPDATE ON niches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discovered_profiles_updated_at
  BEFORE UPDATE ON discovered_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RPC Function para Pegar Nichos Ativos
CREATE OR REPLACE FUNCTION get_active_niches()
RETURNS TABLE (
  id UUID,
  name TEXT,
  hashtags TEXT[],
  keywords TEXT[],
  min_engagement INTEGER,
  min_followers INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.name, n.hashtags, n.keywords, n.min_engagement, n.min_followers
  FROM niches n
  WHERE n.enabled = true
  ORDER BY n.created_at;
END;
$$ LANGUAGE plpgsql;

-- 7. RPC Function para Aprovar Perfil Descoberto
CREATE OR REPLACE FUNCTION approve_discovered_profile(
  p_profile_id UUID,
  p_store_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  v_platform TEXT;
  v_handle TEXT;
  v_url TEXT;
BEGIN
  -- Pega dados do perfil descoberto
  SELECT platform, handle, url
  INTO v_platform, v_handle, v_url
  FROM discovered_profiles
  WHERE id = p_profile_id;
  
  -- Adiciona ao store_profiles
  INSERT INTO store_profiles (store_id, platform, handle, url, enabled)
  VALUES (p_store_id, v_platform, v_handle, v_url, true)
  ON CONFLICT (store_id, platform, handle) DO NOTHING
  RETURNING id INTO v_profile_id;
  
  -- Atualiza status
  UPDATE discovered_profiles
  SET status = 'monitoring'
  WHERE id = p_profile_id;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- 8. View para Dashboard de Descoberta
CREATE OR REPLACE VIEW discovery_dashboard AS
SELECT 
  n.name as niche_name,
  COUNT(dp.id) as total_discovered,
  COUNT(CASE WHEN dp.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN dp.status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN dp.status = 'monitoring' THEN 1 END) as monitoring,
  AVG(dp.engagement_score) as avg_engagement,
  MAX(dp.created_at) as last_discovery
FROM niches n
LEFT JOIN discovered_profiles dp ON dp.niche_id = n.id
WHERE n.enabled = true
GROUP BY n.id, n.name
ORDER BY total_discovered DESC;
