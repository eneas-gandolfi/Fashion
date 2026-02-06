'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { TrendingUp, Hash, Instagram, Music2, ExternalLink, RefreshCw, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface TrendingHashtag {
    id: string;
    platform: 'instagram' | 'tiktok';
    hashtag: string;
    post_count: number;
    engagement_avg: number;
    likes_total: number;
    scraped_at: string;
}

interface TrendingContent {
    id: string;
    platform: 'instagram' | 'tiktok';
    author_username: string;
    caption: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    plays_count: number;
    content_url: string;
    thumbnail_url: string;
    trending_hashtags: { hashtag: string };
}

interface TrendsData {
    hashtags: TrendingHashtag[];
    content: TrendingContent[];
    logs: { id: string; workflow_name: string; status: string; started_at: string }[];
}

export default function TrendsPanel() {
    const [data, setData] = useState<TrendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'tiktok'>('all');
    const [error, setError] = useState<string | null>(null);

    const fetchTrends = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/trends?type=dashboard');
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError('Erro ao carregar tendências');
            }
        } catch (err) {
            console.error('Erro de conexao', err);
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
    }, []);

    const filteredHashtags = data?.hashtags.filter(
        h => activeTab === 'all' || h.platform === activeTab
    ) || [];

    const filteredContent = data?.content.filter(
        c => activeTab === 'all' || c.platform === activeTab
    ) || [];

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const PlatformIcon = ({ platform }: { platform: 'instagram' | 'tiktok' }) => {
        return platform === 'instagram' ? (
            <Instagram className="w-4 h-4 text-pink-500" />
        ) : (
            <Music2 className="w-4 h-4 text-cyan-500" />
        );
    };

    if (loading) {
        return (
            <div className="trends-panel loading">
                <div className="trends-header">
                    <TrendingUp className="w-5 h-5" />
                    <h3>Tendências da Semana</h3>
                </div>
                <div className="trends-skeleton">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton-item" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="trends-panel error">
                <div className="trends-header">
                    <TrendingUp className="w-5 h-5" />
                    <h3>Tendências</h3>
                </div>
                <div className="trends-error">
                    <p>{error}</p>
                    <button onClick={fetchTrends} className="retry-btn">
                        <RefreshCw className="w-4 h-4" />
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="trends-panel">
            <div className="trends-header">
                <div className="header-left">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h3>Tendências da Semana</h3>
                </div>
                <button onClick={fetchTrends} className="refresh-btn" title="Atualizar">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Tab Filter */}
            <div className="trends-tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Todas
                </button>
                <button
                    className={`tab ${activeTab === 'instagram' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instagram')}
                >
                    <Instagram className="w-4 h-4" />
                    Instagram
                </button>
                <button
                    className={`tab ${activeTab === 'tiktok' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tiktok')}
                >
                    <Music2 className="w-4 h-4" />
                    TikTok
                </button>
            </div>

            {/* Trending Hashtags */}
            <div className="trends-section">
                <h4>
                    <Hash className="w-4 h-4" />
                    Hashtags em Alta
                </h4>
                <div className="hashtags-grid">
                    {filteredHashtags.slice(0, 8).map((tag, index) => (
                        <div key={tag.id} className="hashtag-card">
                            <div className="hashtag-rank">#{index + 1}</div>
                            <div className="hashtag-info">
                                <div className="hashtag-name">
                                    <PlatformIcon platform={tag.platform} />
                                    <span>#{tag.hashtag}</span>
                                </div>
                                <div className="hashtag-stats">
                                    <span className="stat">
                                        <Heart className="w-3 h-3" />
                                        {formatNumber(tag.likes_total)}
                                    </span>
                                    <span className="stat engagement">
                                        {formatNumber(tag.engagement_avg)} avg
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredHashtags.length === 0 && (
                    <p className="no-data">Nenhuma hashtag encontrada. Execute o scraping primeiro.</p>
                )}
            </div>

            {/* Top Content */}
            <div className="trends-section">
                <h4>
                    <TrendingUp className="w-4 h-4" />
                    Conteúdo Popular
                </h4>
                <div className="content-list">
                    {filteredContent.slice(0, 5).map(content => (
                        <div key={content.id} className="content-card">
                            <div className="content-thumb">
                                {content.thumbnail_url ? (
                                    <Image
                                        src={content.thumbnail_url}
                                        alt="Thumb do conteudo"
                                        width={120}
                                        height={120}
                                        unoptimized
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="thumb-placeholder">
                                        <PlatformIcon platform={content.platform} />
                                    </div>
                                )}
                            </div>
                            <div className="content-info">
                                <div className="content-header">
                                    <PlatformIcon platform={content.platform} />
                                    <span className="author">@{content.author_username}</span>
                                    <span className="hashtag">#{content.trending_hashtags?.hashtag}</span>
                                </div>
                                <p className="caption">{content.caption?.substring(0, 80)}...</p>
                                <div className="content-stats">
                                    <span><Heart className="w-3 h-3" />{formatNumber(content.likes_count)}</span>
                                    <span><MessageCircle className="w-3 h-3" />{formatNumber(content.comments_count)}</span>
                                    {content.plays_count > 0 && (
                                        <span><Eye className="w-3 h-3" />{formatNumber(content.plays_count)}</span>
                                    )}
                                    {content.shares_count > 0 && (
                                        <span><Share2 className="w-3 h-3" />{formatNumber(content.shares_count)}</span>
                                    )}
                                </div>
                            </div>
                            {content.content_url && (
                                <a href={content.content_url} target="_blank" rel="noopener noreferrer" className="content-link">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
                {filteredContent.length === 0 && (
                    <p className="no-data">Nenhum conteúdo encontrado.</p>
                )}
            </div>

            {/* Last Scraping Info */}
            {data?.logs && data.logs.length > 0 && (
                <div className="scraping-info">
                    <span className={`status ${data.logs[0].status}`}>
                        {data.logs[0].status === 'success' ? '✓' : '⚠'}
                    </span>
                    <span>
                        Última coleta: {new Date(data.logs[0].started_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            )}

            <style jsx>{`
        .trends-panel {
          background: var(--card-bg, #1a1a2e);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }

        .trends-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trends-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary, #fff);
          margin: 0;
        }

        .refresh-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary, #fff);
        }

        .trends-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.1));
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--border-color, rgba(255,255,255,0.15));
          background: transparent;
          color: var(--text-secondary, #888);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          border-color: var(--accent, #6366f1);
          color: var(--text-primary, #fff);
        }

        .tab.active {
          background: var(--accent, #6366f1);
          border-color: var(--accent, #6366f1);
          color: #fff;
        }

        .trends-section {
          margin-bottom: 24px;
        }

        .trends-section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary, #888);
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .hashtags-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .hashtag-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s;
        }

        .hashtag-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: var(--accent, #6366f1);
        }

        .hashtag-rank {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent, #6366f1);
          min-width: 24px;
        }

        .hashtag-info {
          flex: 1;
          min-width: 0;
        }

        .hashtag-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: var(--text-primary, #fff);
          font-size: 0.9rem;
        }

        .hashtag-name span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hashtag-stats {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary, #888);
        }

        .stat.engagement {
          color: var(--success, #10b981);
        }

        .content-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .content-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s;
        }

        .content-card:hover {
          background: rgba(255,255,255,0.06);
        }

        .content-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(255,255,255,0.05);
        }

        .content-thumb :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-info {
          flex: 1;
          min-width: 0;
        }

        .content-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .author {
          font-weight: 500;
          color: var(--text-primary, #fff);
          font-size: 0.85rem;
        }

        .hashtag {
          font-size: 0.75rem;
          color: var(--accent, #6366f1);
        }

        .caption {
          font-size: 0.8rem;
          color: var(--text-secondary, #888);
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .content-stats {
          display: flex;
          gap: 12px;
        }

        .content-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-secondary, #888);
        }

        .content-link {
          padding: 8px;
          color: var(--text-secondary, #888);
          transition: color 0.2s;
        }

        .content-link:hover {
          color: var(--accent, #6366f1);
        }

        .scraping-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-size: 0.8rem;
          color: var(--text-secondary, #888);
        }

        .status {
          font-size: 1rem;
        }

        .status.success {
          color: var(--success, #10b981);
        }

        .status.error {
          color: var(--error, #ef4444);
        }

        .no-data {
          text-align: center;
          color: var(--text-secondary, #888);
          font-size: 0.85rem;
          padding: 20px;
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }

        .trends-skeleton .skeleton-item {
          height: 40px;
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%);
          border-radius: 8px;
          margin-bottom: 8px;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .trends-error {
          text-align: center;
          padding: 20px;
        }

        .retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 8px 16px;
          background: var(--accent, #6366f1);
          border: none;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          font-size: 0.85rem;
        }

        @media (max-width: 768px) {
          .hashtags-grid {
            grid-template-columns: 1fr;
          }

          .trends-tabs {
            flex-wrap: wrap;
          }
        }
      `}</style>
        </div>
    );
}
