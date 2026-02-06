'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MediaUpload from '@/components/MediaUpload';
import PlatformSelector from '@/components/PlatformSelector';
import TextEditor from '@/components/TextEditor';
import SchedulePicker from '@/components/SchedulePicker';
import { createPost } from '@/lib/supabase-db';
import { ArrowLeft, Send, Check, Image as ImageIcon, Video, Layers } from 'lucide-react';

export default function CriarPost() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <CriarPostContent />
        </Suspense>
    );
}

function CriarPostContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [files, setFiles] = useState<File[]>([]);
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [texts, setTexts] = useState({
        instagram: '',
        facebook: '',
        youtube: '',
        x: '',
        tiktok: '',
    });
    const [scheduleDays, setScheduleDays] = useState<string[]>(['segunda', 'quarta', 'sexta', 'domingo']);
    const [scheduleTime, setScheduleTime] = useState('18:30');
    const [postNow, setPostNow] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [placement, setPlacement] = useState<'feed' | 'stories'>('feed');
    const [youtubePlacement, setYoutubePlacement] = useState<'video' | 'shorts'>('video');

    useEffect(() => {
        const text = searchParams.get('text');
        const mediaUrl = searchParams.get('media_url');
        const mediaType = searchParams.get('media_type');

        if (text) {
            setTexts(prev => ({ ...prev, instagram: text, facebook: text, tiktok: text }));
        }

        if (mediaUrl) {
            const fetchMedia = async () => {
                try {
                    const response = await fetch(mediaUrl);
                    const blob = await response.blob();
                    const fileName = `inspiration.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
                    const file = new File([blob], fileName, { type: blob.type });
                    setFiles([file]);
                } catch (error) {
                    console.error('Error fetching media:', error);
                }
            };
            fetchMedia();
        }
    }, [searchParams]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem('fc_inspiration_draft');
        if (!raw) return;
        try {
            const draft = JSON.parse(raw);
            const draftText = draft?.text;
            if (draftText && typeof draftText === 'string') {
                setTexts(prev => ({
                    ...prev,
                    instagram: draftText,
                    facebook: draftText,
                    youtube: draftText,
                    x: draftText.slice(0, 280),
                    tiktok: draftText,
                }));
            }
            if (Array.isArray(draft?.platforms) && draft.platforms.length > 0) {
                setPlatforms(draft.platforms);
            }
        } catch {
            // ignore malformed draft
        } finally {
            localStorage.removeItem('fc_inspiration_draft');
        }
    }, []);

    const isVideo = files.length > 0 && files[0].type.startsWith('video/');
    const isCarousel = files.length > 1;

    const canSubmit = files.length > 0 && platforms.length > 0 && (postNow || scheduleDays.length > 0);

    const getDayLabels = () => {
        const dayMap: Record<string, string> = {
            domingo: 'Dom',
            segunda: 'Seg',
            terca: 'Ter',
            quarta: 'Qua',
            quinta: 'Qui',
            sexta: 'Sex',
            sabado: 'Sáb',
        };
        return scheduleDays.map(d => dayMap[d] || d).join(', ');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);

        try {
            await createPost({
                files,
                textInstagram: texts.instagram,
                textFacebook: texts.facebook,
                textYoutube: texts.youtube || texts.instagram,
                textX: texts.x || texts.instagram.slice(0, 280),
                textTiktok: texts.tiktok || texts.instagram,
                mediaType: isVideo ? 'video' : 'imagem',
                postType: isCarousel ? 'carrossel' : 'unica',
                scheduleDays,
                scheduleTime,
                postNow,
                platforms,
            });

            setShowSuccess(true);

            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Erro ao criar post. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step completion status
    const stepStatus = {
        media: files.length > 0,
        platforms: platforms.length > 0,
        text: Object.values(texts).some(t => t.length > 0),
        schedule: postNow || scheduleDays.length > 0,
    };

    if (showSuccess) {
        return (
            <div className="animate-fadeIn" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'var(--success-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                }}>
                    <Check size={32} style={{ color: 'var(--success)' }} />
                </div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Post criado com sucesso!
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                    Seu post será publicado automaticamente no horário programado.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-info">📅 {getDayLabels()}</span>
                    <span className="badge badge-info">⏰ {scheduleTime}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '2rem',
            }}>
                <Link
                    href="/"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginBottom: '0.125rem',
                        letterSpacing: '-0.02em',
                    }}>
                        Criar Novo Post
                    </h1>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                    }}>
                        Preencha os campos para agendar sua publicação
                    </p>
                </div>
            </header>

            <form onSubmit={handleSubmit}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '1.5rem',
                }}>
                    {/* Main Content Area */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

                        {/* Left Column - Media + Text */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* STEP 1: Media Upload */}
                            <section className="card-flat" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '1rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            background: stepStatus.media ? 'var(--success-light)' : 'var(--background)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: stepStatus.media ? 'var(--success)' : 'var(--text-muted)',
                                            border: stepStatus.media ? 'none' : '1.5px solid var(--border)',
                                        }}>
                                            {stepStatus.media ? <Check size={14} /> : '1'}
                                        </div>
                                        <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                            Mídia
                                        </h3>
                                    </div>
                                    {files.length > 0 && (
                                        <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {isVideo ? <Video size={12} /> : isCarousel ? <Layers size={12} /> : <ImageIcon size={12} />}
                                            {isVideo ? 'Vídeo' : isCarousel ? `${files.length} imagens` : 'Imagem'}
                                        </span>
                                    )}
                                </div>
                                <MediaUpload
                                    onFilesChange={setFiles}
                                    maxFiles={10}
                                />
                            </section>

                            {/* STEP 2 (MOBILE): Platforms */}
                            <section className="card-flat lg:hidden" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: stepStatus.platforms ? 'var(--success-light)' : 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: stepStatus.platforms ? 'var(--success)' : 'var(--text-muted)',
                                        border: stepStatus.platforms ? 'none' : '1.5px solid var(--border)',
                                    }}>
                                        {stepStatus.platforms ? <Check size={14} /> : '2'}
                                    </div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Plataformas
                                    </h3>
                                </div>
                                <PlatformSelector
                                    selected={platforms}
                                    onChange={setPlatforms}
                                />
                            </section>

                            {/* STEP 3: Text Editor */}
                            <section className="card-flat" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: stepStatus.text ? 'var(--success-light)' : 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: stepStatus.text ? 'var(--success)' : 'var(--text-muted)',
                                        border: stepStatus.text ? 'none' : '1.5px solid var(--border)',
                                    }}>
                                        {stepStatus.text ? <Check size={14} /> : '3'}
                                    </div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Textos
                                    </h3>
                                </div>
                                <TextEditor
                                    values={texts}
                                    onChange={setTexts}
                                    selectedPlatforms={platforms}
                                />
                            </section>
                        </div>

                        {/* Right Column - Platforms + Schedule + Summary */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* STEP 2 (DESKTOP): Platforms */}
                            <section className="card-flat hidden lg:block" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: stepStatus.platforms ? 'var(--success-light)' : 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: stepStatus.platforms ? 'var(--success)' : 'var(--text-muted)',
                                        border: stepStatus.platforms ? 'none' : '1.5px solid var(--border)',
                                    }}>
                                        {stepStatus.platforms ? <Check size={14} /> : '2'}
                                    </div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Plataformas
                                    </h3>
                                </div>
                                <PlatformSelector
                                    selected={platforms}
                                    onChange={setPlatforms}
                                />

                                {/* Placement Option (only for IG/FB) */}
                                {(platforms.includes('instagram') || platforms.includes('facebook')) && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                        <p className="label" style={{ marginBottom: '0.75rem' }}>Destino</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[
                                                { id: 'feed', label: 'Feed / Reels', icon: '📰' },
                                                { id: 'stories', label: 'Stories', icon: '📖' },
                                            ].map(opt => (
                                                <button
                                                    type="button"
                                                    key={opt.id}
                                                    onClick={() => setPlacement(opt.id as 'feed' | 'stories')}
                                                    className={`placement-btn ${placement === opt.id ? 'placement-btn--active' : ''}`}
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Placement Option (YouTube) */}
                                {platforms.includes('youtube') && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                        <p className="label" style={{ marginBottom: '0.75rem' }}>Destino YouTube</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[
                                                { id: 'video', label: 'Vídeo' },
                                                { id: 'shorts', label: 'Shorts' },
                                            ].map(opt => (
                                                <button
                                                    type="button"
                                                    key={opt.id}
                                                    onClick={() => setYoutubePlacement(opt.id as 'video' | 'shorts')}
                                                    className={`placement-btn ${youtubePlacement === opt.id ? 'placement-btn--active' : ''}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* STEP 4: Schedule */}
                            <section className="card-flat" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginBottom: '1rem',
                                }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: stepStatus.schedule ? 'var(--success-light)' : 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: stepStatus.schedule ? 'var(--success)' : 'var(--text-muted)',
                                        border: stepStatus.schedule ? 'none' : '1.5px solid var(--border)',
                                    }}>
                                        {stepStatus.schedule ? <Check size={14} /> : '4'}
                                    </div>
                                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                        Quando Publicar
                                    </h3>
                                </div>
                                <SchedulePicker
                                    days={scheduleDays}
                                    time={scheduleTime}
                                    postNow={postNow}
                                    onDaysChange={setScheduleDays}
                                    onTimeChange={setScheduleTime}
                                    onPostNowChange={setPostNow}
                                />
                            </section>

                            {/* Summary & Submit - Sticky */}
                            <div style={{
                                position: 'sticky',
                                top: '1rem',
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                            }}>
                                <p className="label" style={{ marginBottom: '1rem' }}>Resumo</p>

                                {/* Status Items */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                                    {[
                                        { label: 'Mídia', done: stepStatus.media, value: stepStatus.media ? `${files.length} arquivo${files.length > 1 ? 's' : ''}` : 'Pendente' },
                                        { label: 'Plataformas', done: stepStatus.platforms, value: stepStatus.platforms ? platforms.map(p => p === 'x' ? 'X' : p.charAt(0).toUpperCase() + p.slice(1)).join(', ') : 'Pendente' },
                                        { label: 'Texto', done: stepStatus.text, value: stepStatus.text ? 'Preenchido' : 'Pendente' },
                                        { label: 'Agendamento', done: stepStatus.schedule, value: postNow ? 'Agora' : stepStatus.schedule ? getDayLabels() : 'Pendente' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.8125rem',
                                        }}>
                                            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: item.done ? 'var(--success)' : 'var(--border)',
                                                }} />
                                                {item.label}
                                            </span>
                                            <span style={{
                                                fontWeight: '500',
                                                color: item.done ? 'var(--text-primary)' : 'var(--text-muted)',
                                                fontSize: '0.75rem',
                                                maxWidth: '140px',
                                                textOverflow: 'ellipsis',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        fontSize: '0.9375rem',
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="animate-pulse">●</span>
                                            Criando...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} />
                                            Criar Post
                                        </>
                                    )}
                                </button>

                                {!canSubmit && (
                                    <p style={{
                                        fontSize: '0.6875rem',
                                        color: 'var(--text-muted)',
                                        textAlign: 'center',
                                        marginTop: '0.75rem',
                                    }}>
                                        Complete os campos obrigatórios
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
