'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPosts, deletePost, deleteAllPosts, Post } from '@/lib/supabase-db';
import { PLATFORM_ICONS, PLATFORM_COLORS } from '@/components/PlatformIcons';
import { ArrowLeft, Plus, Trash2, Clock, CheckCircle2, Image as ImageIcon, Video, Layers } from 'lucide-react';

export default function Historico() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'posted' | 'pending'>('all');

    const filterItems: { key: 'all' | 'posted' | 'pending'; label: string; count: number; color: string }[] = [
        { key: 'all', label: 'Todos', count: posts.length, color: 'var(--text-primary)' },
        { key: 'posted', label: 'Publicados', count: posts.filter(p => p.postado_em_todas).length, color: 'var(--success)' },
        { key: 'pending', label: 'Pendentes', count: posts.filter(p => !p.postado_em_todas).length, color: 'var(--warning)' },
    ];

    useEffect(() => {
        async function loadPosts() {
            const data = await getPosts();
            setPosts(data);
            setLoading(false);
        }
        loadPosts();
    }, []);

    const filteredPosts = posts.filter(post => {
        if (filter === 'all') return true;
        if (filter === 'posted') return post.postado_em_todas;
        if (filter === 'pending') return !post.postado_em_todas;
        return true;
    });

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir este post do histórico?')) return;

        try {
            await deletePost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error('Erro ao excluir post', error);
            alert('Erro ao excluir post');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('ATENÇÃO: Isso apagará TODO o histórico de postagens. Deseja continuar?')) return;

        try {
            setLoading(true);
            await deleteAllPosts();
            setPosts([]);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao limpar historico', error);
            alert('Erro ao limpar histórico');
            setLoading(false);
        }
    };

    const getPlatformStatus = (post: Post, platformKey: string) => {
        let hasContent = false;

        if (post.plataformas && Array.isArray(post.plataformas)) {
            hasContent = post.plataformas.includes(platformKey);
        } else {
            switch (platformKey) {
                case 'instagram':
                case 'facebook':
                    hasContent = !!post.texto_instagram_facebook;
                    break;
                case 'youtube':
                    hasContent = !!post.texto_youtube;
                    break;
                case 'x':
                case 'threads':
                case 'tiktok':
                    hasContent = !!post.texto_x_threads_tiktok;
                    break;
                case 'linkedin':
                    hasContent = !!post.texto_linkedin;
                    break;
            }
        }

        if (!hasContent) return null;

        const isPosted = post.status_detalhado?.[platformKey] === 'true' || post.postado_em_todas;
        return { isPosted };
    };

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link
                        href="/"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(1.375rem, 4vw, 1.75rem)',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            marginBottom: '0.125rem',
                            letterSpacing: '-0.02em',
                        }}>
                            Histórico
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Visualize todas as postagens criadas
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem' }}>
                    {posts.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="btn btn-ghost"
                            style={{
                                padding: '0.625rem 1rem',
                                color: 'var(--error)',
                                fontSize: '0.8125rem',
                            }}
                        >
                            <Trash2 size={14} />
                            Limpar
                        </button>
                    )}
                    <Link href="/criar-post" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <Plus size={16} />
                        Criar Post
                    </Link>
                </div>
            </header>

            {/* Stats - Inline Filters */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
            }}>
                {filterItems.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setFilter(item.key)}
                        style={{
                            padding: '0.625rem 1rem',
                            borderRadius: '8px',
                            border: filter === item.key ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                            background: filter === item.key ? 'var(--primary-light)' : 'var(--surface)',
                            color: filter === item.key ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: filter === item.key ? '600' : '500',
                            fontSize: '0.8125rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        {item.label}
                        <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '700',
                            background: filter === item.key ? 'var(--primary)' : 'var(--background)',
                            color: filter === item.key ? 'var(--text-inverse)' : item.color,
                            padding: '0.125rem 0.375rem',
                            borderRadius: '4px',
                        }}>
                            {loading ? '...' : item.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Posts Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        margin: '0 auto 1rem',
                    }} className="animate-spin" />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Carregando histórico...</p>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="empty-state" style={{
                    background: 'var(--surface)',
                    border: '1.5px dashed var(--border)',
                    borderRadius: '12px',
                }}>
                    <div className="empty-state-icon">📭</div>
                    <h3 className="empty-state-title">
                        {filter === 'all' ? 'Nenhum post encontrado' : filter === 'posted' ? 'Nenhum post publicado ainda' : 'Nenhum post pendente'}
                    </h3>
                    <p className="empty-state-description">
                        {filter === 'all' ? 'Crie seu primeiro post para começar.' : 'Os posts aparecerão aqui conforme forem criados.'}
                    </p>
                    {filter === 'all' && (
                        <Link href="/criar-post" className="btn btn-primary" style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
                            <Plus size={16} />
                            Criar Post
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem',
                }}>
                    {filteredPosts.map((post) => {
                        const mediaUrl = post.arquivos?.[0]?.url;
                        return (
                            <div key={post.id} className="card-flat" style={{
                                padding: 0,
                                overflow: 'hidden',
                                transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Media */}
                                <div style={{
                                    height: '160px',
                                    background: 'var(--background)',
                                    position: 'relative',
                                }}>
                                    {mediaUrl ? (
                                        post.midia_tipo === 'video' ? (
                                            <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Image
                                                src={mediaUrl}
                                                alt="Midia do post"
                                                width={560}
                                                height={320}
                                                unoptimized
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)',
                                        }}>
                                            <ImageIcon size={32} />
                                        </div>
                                    )}

                                    {/* Type Badge */}
                                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                                        <span className="badge badge-neutral" style={{
                                            background: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            backdropFilter: 'blur(4px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                        }}>
                                            {post.midia_tipo === 'video' ? <Video size={10} /> : post.post_tipo === 'carrossel' ? <Layers size={10} /> : <ImageIcon size={10} />}
                                            {post.midia_tipo === 'video' ? 'Vídeo' : post.post_tipo === 'carrossel' ? 'Carrossel' : 'Imagem'}
                                        </span>
                                    </div>

                                    {/* Status Badge */}
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                        <span className={`badge ${post.postado_em_todas ? 'badge-success' : 'badge-warning'}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                        }}>
                                            {post.postado_em_todas ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                            {post.postado_em_todas ? 'Publicado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1rem' }}>
                                    <p style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.75rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.5,
                                        minHeight: '2.4em',
                                    }}>
                                        {(post.texto_instagram_facebook || post.texto_linkedin || post.texto_x_threads_tiktok || post.texto_youtube || 'Sem texto')}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {/* Platform icons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            {['instagram', 'facebook', 'youtube', 'x', 'tiktok'].map(key => {
                                                const status = getPlatformStatus(post, key);
                                                if (!status) return null;
                                                return (
                                                    <span key={key} title={key} style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: status.isPosted ? PLATFORM_COLORS[key] : 'var(--text-muted)',
                                                        opacity: status.isPosted ? 1 : 0.4,
                                                    }}>
                                                        <div style={{ display: 'flex', filter: status.isPosted ? 'none' : 'grayscale(100%)' }}>
                                                            {PLATFORM_ICONS[key]}
                                                        </div>
                                                    </span>
                                                )
                                            })}
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={(e) => handleDelete(post.id, e)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'transparent',
                                                color: 'var(--text-muted)',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                            title="Excluir"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--error-light)';
                                                e.currentTarget.style.color = 'var(--error)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                                e.currentTarget.style.color = 'var(--text-muted)';
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
