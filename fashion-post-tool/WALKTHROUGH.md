# Walkthrough: Módulo de Scraping e Tendências (Fashion Tool)

Este documento detalha a implementação do novo sistema de monitoramento de tendências e inspirações.

## 🏗️ Arquitetura do Sistema

O sistema opera em 3 camadas principais:

| Camada | Ferramenta | Responsabilidade |
| :--- | :--- | :--- |
| **Orquestração** | **n8n Cloud** | Agendamento, lógica de decisão, e controle de fluxo. |
| **Coleta** | **Apify** | Scraping real (Instagram/TikTok) usando infraestrutura de proxies residenciais. |
| **Dados & UI** | **Supabase + Next.js** | Armazenamento relacional e interface para o usuário final. |

### Fluxo de Dados (Data Flow)

1.  **Monitoramento (07:00 AM)**: `n8n` busca perfis no `Supabase` -> Aciona `Apify` -> Salva posts no `Supabase` (Tabela `social_posts`).
2.  **Tendências (08:00 AM)**: `n8n` busca hashtags no `Supabase` -> Aciona `Apify` -> Salva posts de descoberta.
3.  **Computação (09:00 AM)**: `n8n` analisa posts dos últimos 7-14 dias -> Calcula scores -> Salva sinais em `trend_signals`.
4.  **Visualização**: O usuário acessa `/radar` ou `/inspiracoes` no Next.js para consumir esses dados.

---

## 🐞 Modo Debug (Atual)

O sistema foi entregue configurado em **DEBUG MODE** para economizar créditos do Apify e evitar banimentos durante os testes.

| Configuração | Debug Mode (`true`) | Production Mode (`false`) |
| :--- | :--- | :--- |
| **Perfis Monitorados** | 1 perfil por plataforma | Até 10 perfis por plataforma |
| **Limite de Posts** | 3 posts recentes | 10-20 posts recentes |
| **Hashtags de Tendência** | 1 query | Múltiplas queries |
| **Processamento** | Mais rápido, menor custo | Maior volume, maior custo |

### Como o Debug Funciona?
*   No **Next.js**: A variável `NEXT_PUBLIC_DEBUG_MODE=true` exibe um badge vermelho na UI.
*   No **n8n**: A variável `DEBUG_MODE=true` altera a lógica dos nós "Config" para reduzir arrays e limites.

---

## 🚀 Como Ir para Produção

Quando você estiver pronto para coletar dados reais em volume, siga estes passos:

1.  **No Next.js (.env.local)**:
    ```bash
    # Altere para false
    DEBUG_MODE=false
    NEXT_PUBLIC_DEBUG_MODE=false
    ```
    *Reinicie o servidor (`npm run dev`) após alterar.*

2.  **No n8n (Variáveis)**:
    *   Vá nos workflows `MONITOR_PROFILES_DAILY` e `TRENDS_DAILY`.
    *   No nó **Get Env**, altere o valor de `DEBUG_MODE` para `false`.
    *   (Ou se estiver usando variáveis globais do n8n, altere lá na gestão de variáveis).

3.  **Ativar Workflows**:
    *   No n8n, ative a chave **"Active"** no topo direito de cada um dos 3 workflows para que eles rodem automaticamente nos horários agendados.

---

## 🔮 Próximos Passos (Sugestão)

1.  **Módulo de Publicação**: Criar a lógica para pegar um post de "Inspiração" e agendar uma publicação real.
2.  **Refinamento de Algoritmo**: Ajustar o cálculo de "Score" no n8n (atualmente baseado em likes/comments simples) para considerar "Viralidade" (velocidade de crescimento).
