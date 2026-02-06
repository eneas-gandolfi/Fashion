# Checklist de Validação Manual (Modo Debug)

Este documento guia a validação do novo módulo de Scraping e Tendências.

## 1. Configuração do Ambiente
- [ ] Verifique se o arquivo `.env.local` contém `DEBUG_MODE=true` e `NEXT_PUBLIC_DEBUG_MODE=true`.
- [ ] Verifique se as tabelas foram criadas no Supabase (social_posts, trends_signals, etc).

## 2. Configuração do n8n
- [ ] Importe os 3 workflows da pasta `workflows/n8n/` para o seu n8n.
- [ ] Configure as Credenciais do Supabase no n8n.
- [ ] Configure as Variáveis de Ambiente no n8n (Global ou no nó "Get Env" se necessário):
  - `DEBUG_MODE` = `true`
  - `APIFY_TOKEN` = (Seu token Apify)
  - `SUPABASE_URL` = (Sua URL)
  - `SUPABASE_SERVICE_ROLE_KEY` = (Sua Key Service Role)

## 3. Validação - Monitoramento de Perfis
- [ ] Execute o workflow `MONITOR_PROFILES_DAILY` manualmente.
- [ ] Verifique no Apify Console: Devem ter sido disparadas runs para Instagram e TikTok (apenas 1 run cada, pois debug=true e limit=1).
- [ ] Verifique no Supabase (`social_posts`): O campo `raw` deve conter `{"debug": true}`.
- [ ] Verifique no Supabase (`store_profiles`): O campo `last_scraped_at` deve ter sido atualizado.

## 4. Validação - Tendências
- [ ] Execute o workflow `TRENDS_DAILY` manualmente.
- [ ] O workflow deve processar apenas 1 hashtag (Debug Mode).
- [ ] Verifique novos registros em `social_posts` com `profile_id` nulo.

## 5. Validação - Interface (UI)
- [ ] Acesse `http://localhost:3000/radar`.
- [ ] Verifique se o badge vermelho **DEBUG MODE ATIVO** está visível no topo à direita.
- [ ] Verifique se a tabela de tendências exibe dados (se houver dados computados).
- [ ] Acesse `http://localhost:3000/inspiracoes`.
- [ ] Verifique se os posts coletados aparecem no grid.
- [ ] Teste o botão "Usar como Inspiração" (deve copiar o texto).

## 6. Promoção para Produção
- [ ] Alterar `DEBUG_MODE=false` no `.env.local`.
- [ ] Alterar `DEBUG_MODE` para `false` no n8n.
- [ ] Ativar os workflows no n8n (Switch Active).
