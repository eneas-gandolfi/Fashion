-- Seed data for "descobertas" (discovery) and "inspiracoes" (inspiration)
-- Run in Supabase SQL Editor

-- 1) Extend trend_type enum to support intelligence categories
DO $$ BEGIN
  ALTER TYPE trend_type ADD VALUE IF NOT EXISTS 'insight';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'trend_type enum does not exist';
END $$;

DO $$ BEGIN
  ALTER TYPE trend_type ADD VALUE IF NOT EXISTS 'inspiration';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'trend_type enum does not exist';
END $$;

DO $$ BEGIN
  ALTER TYPE trend_type ADD VALUE IF NOT EXISTS 'suggestion';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'trend_type enum does not exist';
END $$;

DO $$ BEGIN
  ALTER TYPE trend_type ADD VALUE IF NOT EXISTS 'discovery';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'trend_type enum does not exist';
END $$;

-- 2) Seed inspirations
INSERT INTO trend_signals (platform, type, value, time_window, score, growth, computed_at)
VALUES
  (
    'instagram',
    'inspiration',
    '{"titulo":"Vestuario monocromatico com textura","descricao":"Sequencia de looks monocromaticos com foco em textura (trico, couro, algodao premium).","porque_funciona":"Alta percepcao de valor + feed coeso","evidencias":[{"url":"https://instagram.com/p/EXEMPLO1","metricas":{"likes":4200,"comments":210,"views":0}}]}',
    '7d',
    86,
    8,
    NOW() - INTERVAL '1 day'
  ),
  (
    'tiktok',
    'inspiration',
    '{"titulo":"Transicoes rapidas de troca de look","descricao":"Video curto (8-12s) com 3 mudancas de look sincronizadas no beat.","porque_funciona":"Alto tempo de retencao + repeticao","evidencias":[{"url":"https://tiktok.com/@exemplo/video/123","metricas":{"likes":18000,"comments":640,"views":120000}}]}',
    '7d',
    92,
    12,
    NOW() - INTERVAL '2 days'
  ),
  (
    'instagram',
    'inspiration',
    '{"titulo":"Close em detalhe de acabamento","descricao":"Macro em costuras, ziperes, forro e etiqueta para comunicar qualidade.","porque_funciona":"Refina percepcao do produto","evidencias":[{"url":"https://instagram.com/p/EXEMPLO2","metricas":{"likes":2700,"comments":90,"views":0}}]}',
    '7d',
    78,
    5,
    NOW() - INTERVAL '3 days'
  );

-- 3) Seed discoveries (descobertas)
INSERT INTO trend_signals (platform, type, value, time_window, score, growth, computed_at)
VALUES
  (
    'instagram',
    'discovery',
    '{"titulo":"Paleta areia + oliva em alta","descricao":"Apareceu em 4 dos 10 posts mais salvos da semana.","impacto_esperado":"Aplicar em capas e vitrine digital para elevar cliques","evidencias":[{"url":"https://instagram.com/p/EXEMPLO3","metricas":{"likes":3100,"comments":140,"views":0}}]}',
    '7d',
    84,
    10,
    NOW() - INTERVAL '1 day'
  ),
  (
    'tiktok',
    'discovery',
    '{"titulo":"Hook: \"3 formas de usar\" com legenda fixa","descricao":"Formato recorrente com aumento de compartilhamentos.","impacto_esperado":"Aumentar compartilhamento e salvamentos","evidencias":[{"url":"https://tiktok.com/@exemplo/video/456","metricas":{"likes":23000,"comments":980,"views":180000}}]}',
    '7d',
    88,
    11,
    NOW() - INTERVAL '2 days'
  );
