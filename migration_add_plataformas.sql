-- Adiciona a coluna 'plataformas' para armazenar ARRAY de textos (ex: ['instagram', 'x'])
-- Isso é preferível à lógica de status_detalhado e é requerido pelo Workflow Enterprise
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS plataformas text[] DEFAULT '{}';

-- Comentário para documentação
COMMENT ON COLUMN public.posts.plataformas IS 'Lista de IDs das plataformas selecionadas para postagem (ex: instagram, x, tiktok)';
