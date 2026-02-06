'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTrendSignals, TrendSignal } from '@/lib/supabase-db';
import { PLATFORM_COLORS, PLATFORM_ICONS } from '@/components/PlatformIcons';

type IntelligenceView = 'inspiration' | 'insight' | 'suggestion';

interface IntelligencePayload {
  titulo?: string;
  descricao?: string;
  porque_funciona?: string;
  impacto_esperado?: string;
  evidencias?: {
    url?: string;
    metricas?: {
      likes?: number;
      comments?: number;
      views?: number;
    };
  }[];
}

interface IntelligenceItem {
  key: string;
  type: IntelligenceView;
  platforms: string[];
  score: number;
  time_window: string;
  computed_at: string;
  payload: IntelligencePayload;
}

const TYPE_LABELS: Record<IntelligenceView, string> = {
  inspiration: 'Inspirações',
  insight: 'Insights',
  suggestion: 'Sugestões',
};

const TYPE_SUBTITLE: Record<IntelligenceView, string> = {
  inspiration: 'Ideias criativas e ângulos prontos para virar conteúdo.',
  insight: 'Leituras estratégicas do que está performando agora.',
  suggestion: 'Ações práticas para traduzir tendências em resultado.',
};

const PLATFORM_OPTIONS = [
  { key: 'all', label: 'Todas' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
];

const TIME_WINDOWS = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'all', label: 'Tudo' },
];

const normalizeText = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

const extractField = (source: string, field: string) => {
  const match = source.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  return match ? normalizeText(match[1]) : '';
};

const safeParse = (input: string) => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

const parsePayload = (value: string): IntelligencePayload => {
  if (!value) return {};
  const trimmed = normalizeText(value);
  const parsed = safeParse(trimmed);

  const unwrapPayload = (candidate: any): IntelligencePayload | null => {
    if (!candidate || typeof candidate !== 'object') return null;
    const base = Array.isArray(candidate) ? candidate[0] : candidate;
    if (!base || typeof base !== 'object') return null;
    const payload = (base as any).payload && typeof (base as any).payload === 'object'
      ? (base as any).payload
      : base;
    return payload as IntelligencePayload;
  };

  if (parsed !== null) {
    if (typeof parsed === 'string') {
      const nested = safeParse(parsed);
      const nestedPayload = unwrapPayload(nested);
      if (nestedPayload) return nestedPayload;
      return { titulo: normalizeText(parsed) || trimmed };
    }
    const payload = unwrapPayload(parsed);
    if (payload) return payload;
  }

  const titulo = extractField(trimmed, 'titulo') || extractField(trimmed, 'title') || extractField(trimmed, 'tema');
  const descricao = extractField(trimmed, 'descricao') || extractField(trimmed, 'description');
  const porqueFunciona =
    extractField(trimmed, 'porque_funciona') ||
    extractField(trimmed, 'impacto_esperado') ||
    extractField(trimmed, 'impacto');

  const fallbackPayload: IntelligencePayload = {};
  if (titulo) fallbackPayload.titulo = titulo;
  if (descricao) fallbackPayload.descricao = descricao;
  if (porqueFunciona) fallbackPayload.porque_funciona = porqueFunciona;

  return Object.keys(fallbackPayload).length ? fallbackPayload : { titulo: trimmed };
};

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildCopyText = (item: IntelligenceItem) => {
  const lines = [
    item.payload.titulo || 'Inspiração',
    item.payload.descricao || '',
    item.payload.porque_funciona || item.payload.impacto_esperado || '',
  ].filter(Boolean);
  return lines.join('\n');
};

export default function Inspiracoes() {
  const router = useRouter();
  const [signals, setSignals] = useState<TrendSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<IntelligenceView>('inspiration');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState<'all' | 'instagram' | 'tiktok'>('all');
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [sortBy, setSortBy] = useState<'score' | 'recent'>('score');
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadSignals = async () => {
    setLoading(true);
    const data = await getTrendSignals({ limit: 400 });
    setSignals(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSignals();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('fc_saved_intelligence');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedKeys(parsed);
    } catch {
      localStorage.removeItem('fc_saved_intelligence');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fc_saved_intelligence', JSON.stringify(savedKeys));
  }, [savedKeys]);

  const grouped = useMemo(() => {
    const map = new Map<string, IntelligenceItem>();
    signals.forEach((signal) => {
      if (!['inspiration', 'insight', 'suggestion'].includes(signal.type)) return;
      const key = `${signal.type}::${signal.value}::${signal.time_window}`;
      const payload = parsePayload(signal.value);
      if (!map.has(key)) {
        map.set(key, {
          key,
          type: signal.type as IntelligenceView,
          platforms: [signal.platform],
          score: Number(signal.score) || 0,
          time_window: signal.time_window,
          computed_at: signal.computed_at,
          payload,
        });
      } else {
        const existing = map.get(key)!;
        if (!existing.platforms.includes(signal.platform)) {
          existing.platforms.push(signal.platform);
        }
        existing.score = Math.max(existing.score, Number(signal.score) || 0);
        if (new Date(signal.computed_at) > new Date(existing.computed_at)) {
          existing.computed_at = signal.computed_at;
        }
      }
    });
    return Array.from(map.values());
  }, [signals]);

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    let items = grouped.filter((item) => item.type === view);
    if (platform !== 'all') {
      items = items.filter((item) => item.platforms.includes(platform));
    }
    if (timeWindow !== 'all') {
      items = items.filter((item) => item.time_window === timeWindow);
    }
    if (lower) {
      items = items.filter((item) => {
        const text = [
          item.payload.titulo,
          item.payload.descricao,
          item.payload.porque_funciona,
          item.payload.impacto_esperado,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(lower);
      });
    }
    items.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime();
      }
      return (b.score || 0) - (a.score || 0);
    });
    return items;
  }, [grouped, view, platform, timeWindow, query, sortBy]);

  const featured = filtered[0];
  const totalCount = grouped.filter((item) => item.type === view).length;
  const lastUpdate = grouped[0]?.computed_at;
  const averageScore = filtered.length
    ? Math.round(filtered.reduce((acc, item) => acc + item.score, 0) / filtered.length)
    : 0;
  const platformLeaders = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((item) => {
      item.platforms.forEach((p) => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
  }, [filtered]);
  const evidenceCount = filtered.reduce((acc, item) => acc + (item.payload.evidencias?.length || 0), 0);

  const toggleSave = (key: string) => {
    setSavedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleCopy = async (item: IntelligenceItem) => {
    const text = buildCopyText(item);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(item.key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleUse = (item: IntelligenceItem) => {
    const draft = {
      text: buildCopyText(item),
      platforms: item.platforms,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('fc_inspiration_draft', JSON.stringify(draft));
    }
    router.push('/criar-post');
  };

  return (
    <div className="intelligence-shell animate-fadeIn">
      <div className="intelligence-hero">
        <div className="hero-copy">
          <div className="hero-tag">
            <span className="hero-dot" />
            Inteligência de Moda
          </div>
          <h1>Inspirações com contexto, não só ideias soltas.</h1>
          <p>
            Um painel editorial que organiza sinais recentes em propostas criativas prontas para virar campanha,
            conteúdo ou experimentos rápidos.
          </p>
          <div className="hero-metrics">
            <div>
              <span className="metric-label">Média de score</span>
              <strong className="metric-value">{averageScore || '-'}</strong>
            </div>
            <div>
              <span className="metric-label">Evidências mapeadas</span>
              <strong className="metric-value">{evidenceCount || 0}</strong>
            </div>
            <div>
              <span className="metric-label">Plataformas líderes</span>
              <strong className="metric-value">
                {platformLeaders.length === 0
                  ? '-'
                  : platformLeaders.map(([key]) => (key === 'instagram' ? 'Instagram' : 'TikTok')).join(' + ')}
              </strong>
            </div>
          </div>
          <div className="hero-actions">
            <button className="action-card action-card--primary" onClick={loadSignals} disabled={loading}>
              <span className="action-card__title">{loading ? 'Atualizando...' : 'Atualizar painel'}</span>
              <span className="action-card__meta">Sincronizar sinais do radar</span>
            </button>
            <Link href="/criar-post" className="action-card action-card--outline" style={{ textDecoration: 'none' }}>
              <span className="action-card__title">Criar post agora</span>
              <span className="action-card__meta">Abrir editor criativo</span>
            </Link>
          </div>
        </div>
        <div className="hero-focus">
          <div className="focus-card">
            <div className="focus-header">
              <span className="label">Resumo Inteligente</span>
              <span className="focus-pill">{loading ? 'Sincronizando' : 'Pronto'}</span>
            </div>
            <h3>{TYPE_LABELS[view]}</h3>
            <p className="focus-sub">{TYPE_SUBTITLE[view]}</p>
            <div className="focus-metrics">
              <div>
                <span className="metric-label">Total</span>
                <strong className="metric-value">{loading ? '...' : totalCount}</strong>
              </div>
              <div>
                <span className="metric-label">Última atualização</span>
                <strong className="metric-value">{formatDate(lastUpdate || '')}</strong>
              </div>
              <div>
                <span className="metric-label">Filtro ativo</span>
                <strong className="metric-value">
                  {platform === 'all' ? 'Multiplataforma' : platform === 'instagram' ? 'Instagram' : 'TikTok'}
                </strong>
              </div>
              <div>
                <span className="metric-label">Janela</span>
                <strong className="metric-value">{timeWindow === 'all' ? 'Completa' : timeWindow}</strong>
              </div>
            </div>
            <div className="focus-platforms">
              {['instagram', 'tiktok'].map((key) => (
                <div key={key} className="platform-chip">
                  <span className="platform-icon" style={{ color: PLATFORM_COLORS[key] }}>
                    {PLATFORM_ICONS[key]}
                  </span>
                  <span>{key === 'instagram' ? 'Instagram' : 'TikTok'}</span>
                </div>
              ))}
            </div>
          </div>
          {featured && (
            <div className="focus-highlight">
              <div className="highlight-title">Destaque de hoje</div>
              <h4>{featured.payload.titulo || 'Ideia sem título'}</h4>
              <p>{featured.payload.descricao || 'Sem descrição disponível.'}</p>
              <div className="highlight-footer">
                <span>{featured.platforms.join(' • ')}</span>
                <span>{featured.score.toFixed(0)} / 100</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="intelligence-controls">
        <div className="tabs intelligence-tabs" role="tablist" aria-label="Categorias de inteligência">
          {(Object.keys(TYPE_LABELS) as IntelligenceView[]).map((key) => (
            <button
              key={key}
              className={`tab intelligence-tab ${view === key ? 'active' : ''}`}
              onClick={() => setView(key)}
              role="tab"
              aria-selected={view === key}
              aria-controls={`panel-${key}`}
            >
              <span className="tab-status">
                <span className={`dot ${view === key ? 'filled' : ''}`} />
                {TYPE_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por tema, ângulo ou insight..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar por tema, ângulo ou insight"
            />
          </div>
          <div className="pill-group">
            {PLATFORM_OPTIONS.map((item) => (
              <button
                key={item.key}
                className={`pill ${platform === item.key ? 'active' : ''}`}
                onClick={() => setPlatform(item.key as 'all' | 'instagram' | 'tiktok')}
                aria-pressed={platform === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pill-group">
            {TIME_WINDOWS.map((item) => (
              <button
                key={item.key}
                className={`pill ${timeWindow === item.key ? 'active' : ''}`}
                onClick={() => setTimeWindow(item.key as '7d' | '30d' | '90d' | 'all')}
                aria-pressed={timeWindow === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'recent')}
            aria-label="Ordenação"
          >
            <option value="score">Ordenar por score</option>
            <option value="recent">Ordenar por mais recente</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <p className="empty-state-title">Montando seu painel inteligente...</p>
          <p className="empty-state-description">Buscando sinais e organizando ideias.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <p className="empty-state-title">Sem inspirações para este filtro</p>
          <p className="empty-state-description">Ajuste os filtros ou gere novos sinais no workflow.</p>
        </div>
      ) : (
        <div className="card-grid" role="list" id={`panel-${view}`}>
          {filtered.map((item, index) => {
            const saved = savedKeys.includes(item.key);
            const scoreStyle = { ['--score' as string]: `${Math.min(item.score, 100) * 3.6}deg` } as CSSProperties;
            return (
              <article
                key={item.key}
                className={`intelligence-card ${saved ? 'is-saved' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
                role="listitem"
              >
                <div className="card-top">
                  <div className="card-tags">
                    <span className="card-tag">{item.time_window}</span>
                    {item.platforms.map((p) => (
                      <span key={p} className="card-tag platform">
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className="score-ring" style={scoreStyle}>
                    <span>{Math.round(item.score)}</span>
                  </div>
                </div>
                <h3>{item.payload.titulo || 'Ideia em construção'}</h3>
                <p>{item.payload.descricao || 'Sem descrição detalhada disponível.'}</p>
                {(item.payload.porque_funciona || item.payload.impacto_esperado) && (
                  <div className="card-note">
                    {item.payload.porque_funciona || item.payload.impacto_esperado}
                  </div>
                )}
                {Array.isArray(item.payload.evidencias) && item.payload.evidencias.length > 0 && (
                  <div className="card-evidence">
                    <span className="label">Evidências</span>
                    <ul>
                      {item.payload.evidencias.slice(0, 2).map((ev, idx) => (
                        <li key={`${item.key}-ev-${idx}`}>
                          <span>Link {idx + 1}</span>
                          <span className="evidence-metric">
                            {ev.metricas?.likes ? `${ev.metricas.likes} likes` : 'métrica n/d'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="card-footer">
                  <span className="card-date">{formatDate(item.computed_at)}</span>
                  <div className="intelligence-actions">
                    <button className="btn btn-ghost" onClick={() => handleCopy(item)}>
                      {copiedKey === item.key ? 'Copiado' : 'Copiar'}
                    </button>
                    <button className="btn btn-outline" onClick={() => toggleSave(item.key)}>
                      {saved ? 'Salvo' : 'Salvar'}
                    </button>
                    <button className="btn btn-primary" onClick={() => handleUse(item)}>
                      Usar agora
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

        <style jsx>{`
        .intelligence-shell {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          position: relative;
          isolation: isolate;
          font-family: var(--font-sans, sans-serif);
          max-width: 1240px;
          margin: 0 auto;
          padding: clamp(1.75rem, 3vw, 3rem);
          color: var(--text-primary);
        }

        .intelligence-shell::before,
        .intelligence-shell::after {
          content: none;
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .intelligence-shell::before {
          inset: -120px -80px auto -80px;
          height: 360px;
          background: none;
          opacity: 0;
        }

        .intelligence-shell::after {
          inset: auto -120px -160px -120px;
          height: 420px;
          background: none;
          opacity: 0;
        }

        .intelligence-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: clamp(1.5rem, 3vw, 2.75rem);
          position: relative;
          z-index: 1;
          align-items: stretch;
          padding: clamp(1.4rem, 2.5vw, 2.2rem);
          border-radius: 28px;
          border: 1px solid rgba(26, 21, 19, 0.08);
          background: var(--surface);
          box-shadow: 0 24px 48px rgba(26, 21, 19, 0.08);
          overflow: hidden;
        }

        .intelligence-hero::after {
          content: none;
          position: absolute;
          inset: -40% -10% auto auto;
          width: 340px;
          height: 340px;
          background: none;
          opacity: 0;
          pointer-events: none;
        }

        .hero-copy,
        .hero-focus {
          position: relative;
          z-index: 1;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .hero-copy h1 {
          font-family: var(--font-sans, sans-serif);
          font-size: clamp(2.2rem, 3.6vw, 3.4rem);
          margin-bottom: 0.25rem;
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .hero-copy p {
          color: var(--text-secondary);
          max-width: 560px;
          font-size: 1rem;
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        .hero-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          padding: 0.85rem;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 12px 26px rgba(26, 21, 19, 0.08);
          backdrop-filter: blur(10px);
        }

        .hero-metrics > div {
          padding: 0.75rem 0.95rem;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 8px 20px rgba(26, 21, 19, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }

        .hero-metrics > div:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(26, 21, 19, 0.08);
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          align-self: flex-start;
          width: fit-content;
          max-width: 100%;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(26, 21, 19, 0.12);
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 1rem;
          box-shadow: 0 10px 20px rgba(26, 21, 19, 0.06);
        }

        .hero-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 0 4px rgba(71, 167, 106, 0.2);
        }

        .hero-actions {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          align-items: stretch;
          grid-auto-rows: 1fr;
        }

        .action-card {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.9rem 1rem;
          border-radius: 14px;
          border: 1px solid rgba(26, 21, 19, 0.12);
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-primary);
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          min-height: 66px;
          align-items: flex-start;
          justify-content: center;
          text-decoration: none;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
          box-shadow: 0 10px 20px rgba(26, 21, 19, 0.08);
        }

        .action-card__title {
          font-size: 0.95rem;
          line-height: 1.25;
          display: block;
        }

        .action-card__meta {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
          line-height: 1.35;
          display: block;
        }

        .action-card:hover {
          transform: translateY(-2px);
          border-color: rgba(193, 125, 106, 0.35);
          box-shadow: 0 14px 26px rgba(26, 21, 19, 0.12);
        }

        .action-card:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .action-card--primary {
          background: var(--primary-gradient);
          color: var(--text-inverse);
          border-color: transparent;
        }

        .action-card--primary .action-card__meta {
          color: rgba(255, 255, 255, 0.75);
        }

        .action-card--primary:hover {
          box-shadow: 0 16px 28px rgba(193, 125, 106, 0.35);
        }

        .action-card--outline {
          background: rgba(255, 255, 255, 0.85);
        }

        .hero-focus {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          justify-self: end;
          width: 100%;
        }

        @media (min-width: 1024px) {
          .hero-focus {
            position: sticky;
            top: 1.5rem;
          }
        }

        .focus-card {
          position: relative;
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(252, 248, 244, 0.92));
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 22px;
          padding: 1.6rem;
          box-shadow: 0 18px 34px rgba(26, 21, 19, 0.1);
          backdrop-filter: blur(12px);
          overflow: hidden;
        }

        .focus-card::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(193, 125, 106, 0.2), transparent 70%);
          pointer-events: none;
        }

        .focus-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .focus-pill {
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
        }

        .focus-card h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .focus-sub {
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }

        .focus-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .focus-metrics > div {
          padding: 0.6rem 0.75rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.05);
          min-width: 0;
        }

        .metric-label {
          display: block;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .metric-value {
          font-size: 1rem;
          line-height: 1.3;
          display: block;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
          hyphens: auto;
          text-wrap: balance;
        }

        .focus-platforms {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .platform-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          background: var(--surface);
          border: 1px solid var(--border);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .platform-icon :global(svg) {
          width: 16px;
          height: 16px;
        }

        .focus-highlight {
          padding: 1.35rem;
          border-radius: 20px;
          background: linear-gradient(135deg, #1b1513 0%, #2f241f 100%);
          color: white;
          box-shadow: 0 18px 44px rgba(26, 21, 19, 0.3);
          position: relative;
          overflow: hidden;
        }

        .focus-highlight::after {
          content: '';
          position: absolute;
          inset: auto -40% -60% auto;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 70%);
        }

        .highlight-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.7;
          margin-bottom: 0.5rem;
        }

        .focus-highlight h4 {
          margin-bottom: 0.5rem;
          font-size: 1.15rem;
          color: white;
        }

        .focus-highlight p {
          opacity: 0.8;
          margin-bottom: 1rem;
        }

        .highlight-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          opacity: 0.85;
        }

        .intelligence-controls {
          --control-height: 38px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid rgba(193, 125, 106, 0.14);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 248, 244, 0.92));
          box-shadow: 0 16px 34px rgba(26, 21, 19, 0.08);
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
          z-index: 2;
        }

        .intelligence-controls::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 12% 0%, rgba(193, 125, 106, 0.12), transparent 52%);
          opacity: 0.7;
          pointer-events: none;
        }

        .intelligence-tabs {
          display: inline-flex;
          gap: 0.35rem;
          border: 1px solid rgba(26, 21, 19, 0.08);
          background: rgba(255, 255, 255, 0.92);
          padding: 0.3rem;
          border-radius: 999px;
          box-shadow: inset 0 1px 2px rgba(26, 21, 19, 0.05), 0 8px 16px rgba(26, 21, 19, 0.04);
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .intelligence-tab {
          border: none;
          border-radius: 999px;
          background: transparent;
          padding: 0.4rem 1rem;
          font-size: 0.74rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .intelligence-tab.active {
          background: var(--primary-gradient);
          color: var(--text-inverse);
          box-shadow: 0 10px 20px rgba(193, 125, 106, 0.28);
        }

        .intelligence-tab:hover {
          color: var(--text-primary);
          background: rgba(193, 125, 106, 0.14);
        }

        .filters {
          display: grid;
          grid-template-columns: minmax(200px, 1.2fr) minmax(150px, 0.9fr) minmax(150px, 0.9fr) minmax(150px, 0.7fr);
          gap: 0.65rem;
          align-items: center;
          padding: 0.65rem;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(252, 248, 244, 0.9));
          border: 1px solid rgba(26, 21, 19, 0.08);
          border-radius: 16px;
          box-shadow: inset 0 1px 2px rgba(26, 21, 19, 0.04), 0 8px 16px rgba(26, 21, 19, 0.05);
          position: relative;
          z-index: 1;
        }

        .search-box input {
          height: var(--control-height);
          background: #ffffff;
          border: 1px solid rgba(26, 21, 19, 0.14);
          border-radius: 10px;
          box-shadow: 0 6px 14px rgba(26, 21, 19, 0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-box {
          flex: 1 1 280px;
          min-width: 220px;
        }

        .filters select {
          height: var(--control-height);
          padding: 0 2.2rem 0 0.95rem;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid rgba(26, 21, 19, 0.14);
          box-shadow: 0 6px 14px rgba(26, 21, 19, 0.04);
          font-size: 0.82rem;
          line-height: 1;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.5 7.5l4.5 4.5 4.5-4.5' fill='none' stroke='%235C544F' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          outline: none;
        }

        .filters select:hover {
          border-color: rgba(193, 125, 106, 0.35);
          box-shadow: 0 8px 16px rgba(26, 21, 19, 0.06);
        }

        .filters select:focus,
        .filters select:focus-visible {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(193, 125, 106, 0.2);
          outline: none;
        }

        .pill-group {
          display: inline-flex;
          gap: 0.3rem;
          flex-wrap: nowrap;
          align-items: center;
          padding: 0.2rem;
          min-height: var(--control-height);
          height: var(--control-height);
          border-radius: 999px;
          border: 1px solid rgba(26, 21, 19, 0.1);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: inset 0 1px 2px rgba(26, 21, 19, 0.05);
          overflow-x: auto;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: calc(var(--control-height) - 8px);
          border-radius: 999px;
          border: none;
          background: transparent;
          padding: 0 0.75rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 1;
        }

        .pill.active {
          color: var(--text-inverse);
          background: var(--primary-gradient);
          box-shadow: 0 8px 18px rgba(193, 125, 106, 0.28);
        }

        .pill:hover {
          color: var(--text-primary);
          background: rgba(193, 125, 106, 0.12);
        }

        @media (max-width: 1100px) {
          .filters {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 740px) {
          .filters {
            grid-template-columns: 1fr;
          }
          .pill-group {
            height: auto;
            min-height: 0;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          position: relative;
          z-index: 1;
        }

        .intelligence-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8f3f0 100%);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 22px;
          padding: 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 16px 30px rgba(26, 21, 19, 0.1);
          animation: fadeInUp 0.35s ease-out both;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background-size: 140% 140%;
          background-position: 0% 0%;
          transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 260ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 200ms ease,
            background-position 320ms ease;
          will-change: transform, box-shadow;
        }

        .intelligence-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(193, 125, 106, 0.08), transparent 60%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .intelligence-card::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 16px;
          border: 1px solid rgba(193, 125, 106, 0.18);
          opacity: 0;
          transition: opacity 240ms ease;
          pointer-events: none;
        }

        .intelligence-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 28px 52px rgba(26, 21, 19, 0.16);
          border-color: rgba(193, 125, 106, 0.25);
          background-position: 100% 100%;
        }

        .intelligence-card:hover::before {
          opacity: 1;
        }

        .intelligence-card:hover::after {
          opacity: 1;
        }

        .intelligence-card:hover .score-ring {
          transform: scale(1.06) rotate(6deg);
          box-shadow: 0 10px 18px rgba(193, 125, 106, 0.22);
        }

        .intelligence-card:hover .card-tag {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(26, 21, 19, 0.08);
        }

        .score-ring {
          transition: transform 220ms ease, box-shadow 220ms ease;
        }

        .card-tag {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }

        .intelligence-actions {
          opacity: 0;
          transform: translateY(6px);
          transition: transform 220ms ease, opacity 220ms ease;
          pointer-events: none;
        }

        .intelligence-card:hover .intelligence-actions,
        .intelligence-card:focus-within .intelligence-actions {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .intelligence-card.is-saved {
          border-color: rgba(90, 138, 199, 0.45);
          box-shadow: 0 22px 38px rgba(90, 138, 199, 0.18);
        }

        .intelligence-card h3 {
          font-size: 1.1rem;
          font-family: var(--font-sans, sans-serif);
        }

        .intelligence-card p {
          color: var(--text-secondary);
          line-height: 1.55;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }

        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .card-tag {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .card-tag.platform {
          background: var(--background);
          color: var(--text-secondary);
        }

        .score-ring {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: conic-gradient(var(--primary) var(--score), #efe7e2 0deg);
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 700;
          position: relative;
        }

        .score-ring span {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 0 1px var(--border);
        }

        .card-note {
          border-left: 3px solid var(--primary);
          padding: 0.5rem 0.75rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          background: rgba(193, 125, 106, 0.08);
          border-radius: 10px;
        }

        .card-evidence {
          padding: 0.65rem 0.75rem;
          border-radius: 12px;
          border: 1px dashed rgba(26, 21, 19, 0.12);
          background: rgba(255, 255, 255, 0.7);
        }

        .card-evidence ul {
          list-style: none;
          margin-top: 0.4rem;
          display: grid;
          gap: 0.35rem;
        }

        .card-evidence li {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .evidence-metric {
          color: var(--text-muted);
        }

        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 0.75rem;
          border-top: 1px dashed rgba(26, 21, 19, 0.12);
        }

        .card-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .intelligence-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.2rem;
          border-radius: 999px;
          border: 1px solid rgba(26, 21, 19, 0.08);
          background: rgba(255, 255, 255, 0.75);
        }

        .intelligence-shell button:focus-visible,
        .intelligence-shell select:focus-visible,
        .intelligence-shell input:focus-visible,
        .intelligence-shell a:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        .filters select:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(193, 125, 106, 0.2);
        }

        @media (max-width: 1200px) {
          .intelligence-hero {
            grid-template-columns: 1fr;
          }
          .hero-focus {
            justify-self: stretch;
          }
        }

        @media (max-width: 980px) {
          .hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .intelligence-hero {
            gap: 1.5rem;
          }
          .hero-metrics {
            grid-template-columns: 1fr;
          }
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .focus-card {
            padding: 1.25rem;
          }
          .intelligence-shell::before {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
}
