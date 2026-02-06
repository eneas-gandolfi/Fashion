"use client";

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase, type TrendingContent, type EmergingInfluencer } from '@/lib/supabase';
import { formatNumber } from '@/lib/analytics';
import { TrendingUp, Users, Hash, Activity, ArrowUpRight, Zap, Radio, Flame, Target, BarChart3, Instagram, Music2, Heart, X, Pencil, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Types
interface TrendSignal {
    id: string;
    platform: 'instagram' | 'tiktok';
    type: string;
    value: string;
    score: number;
    growth: number;
    computed_at: string;
}

interface MonitoredProfile {
    id: string;
    handle: string;
    platform: string;
}


interface HashtagData {
    id: string;
    platform: 'instagram' | 'tiktok';
    hashtag: string;
    post_count: number;
    engagement_avg: number;
    likes_total: number;
    scraped_at: string;
}

interface CompetitorInsight {
    client_id: string;
    competitor_id: string;
    handle: string;
    platform: string;
    priority: 'high' | 'medium' | 'low' | string;
    follower_count: number | null;
    follower_growth: number | null;
    avg_engagement_rate: number | null;
    post_frequency: number | null;
    last_analyzed_at: string | null;
}

type TabType = 'trends' | 'hashtags' | 'influencers' | 'content' | 'competitors';

export default function RadarPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('trends');
    const [trends, setTrends] = useState<TrendSignal[]>([]);
    const [profiles, setProfiles] = useState<MonitoredProfile[]>([]);
    const [trendingContent, setTrendingContent] = useState<TrendingContent[]>([]);
    const [emergingInfluencers, setEmergingInfluencers] = useState<EmergingInfluencer[]>([]);
    const [competitors, setCompetitors] = useState<CompetitorInsight[]>([]);
    const [triggeringCompetitors, setTriggeringCompetitors] = useState(false);
    const [competitorMessage, setCompetitorMessage] = useState<string | null>(null);
    const [competitorProcessing, setCompetitorProcessing] = useState(false);
    const [competitorProcessStartedAt, setCompetitorProcessStartedAt] = useState<string | null>(null);
    const [showAddCompetitor, setShowAddCompetitor] = useState(false);
    const [addingCompetitor, setAddingCompetitor] = useState(false);
    const [addCompetitorError, setAddCompetitorError] = useState<string | null>(null);
    const [editingCompetitor, setEditingCompetitor] = useState<CompetitorInsight | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CompetitorInsight | null>(null);
    const [deletingCompetitor, setDeletingCompetitor] = useState(false);
    const [handleValidation, setHandleValidation] = useState<{
        status: 'idle' | 'checking' | 'valid' | 'not_found' | 'invalid';
        message?: string;
    }>({ status: 'idle' });
    const [newCompetitor, setNewCompetitor] = useState({
        handle: '',
        platform: 'instagram',
        priority: 'medium',
        reason: ''
    });
    const [hashtags, setHashtags] = useState<HashtagData[]>([]);
    const [loading, setLoading] = useState(true);

    const isTabType = (value: string): value is TabType => {
        return ['trends', 'hashtags', 'influencers', 'content', 'competitors'].includes(value);
    };

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam && isTabType(tabParam) && tabParam !== activeTab) {
            setActiveTab(tabParam);
        }
    }, [searchParams, activeTab]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    useEffect(() => {
        if (!competitorProcessing) return;
        const timeout = setTimeout(() => {
            setCompetitorProcessing(false);
            setCompetitorMessage((prev) => {
                if (prev && !prev.toLowerCase().includes('processamento')) return prev;
                return 'Processamento demorou mais que o esperado. Atualize em alguns minutos.';
            });
        }, 6 * 60 * 1000);
        return () => clearTimeout(timeout);
    }, [competitorProcessing]);

    const markCompetitorProcessing = () => {
        const now = new Date().toISOString();
        setCompetitorProcessStartedAt(now);
        setCompetitorProcessing(true);
        return now;
    };

    useEffect(() => {
        if (!showAddCompetitor) {
            setHandleValidation({ status: 'idle' });
            return;
        }

        const parsed = parseCompetitorInput(newCompetitor.handle, newCompetitor.platform);
        const rawValue = newCompetitor.handle.trim();

        if (!rawValue) {
            setHandleValidation({ status: 'idle' });
            return;
        }

        if (!parsed.handle) {
            setHandleValidation({ status: 'invalid', message: 'Informe um @ válido.' });
            return;
        }

        setHandleValidation({ status: 'checking', message: 'Validando perfil...' });

        const timeout = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('store_profiles')
                    .select('id')
                    .eq('platform', parsed.platform)
                    .ilike('handle', parsed.handle)
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    setHandleValidation({ status: 'invalid', message: 'Não foi possível validar agora.' });
                    return;
                }

                if (data?.id) {
                    setHandleValidation({ status: 'valid', message: 'Perfil encontrado na base.' });
                } else {
                    setHandleValidation({ status: 'not_found', message: 'Perfil Não encontrado na base. Vamos tentar monitorar mesmo assim.' });
                }
            } catch (err) {
                setHandleValidation({ status: 'invalid', message: 'Não foi possível validar agora.' });
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [newCompetitor.handle, newCompetitor.platform, showAddCompetitor]);

    const formatLastAnalyzed = (value: string) => {
        try {
            return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        } catch {
            return value;
        }
    };

    const fetchData = async () => {
        setLoading(true);

            // Fetch trend signals
            const { data: trendData } = await supabase
                .from('trend_signals')
                .select('*')
                .eq('time_window', '7d')
                .order('score', { ascending: false })
                .limit(20);

            if (trendData) {
                setTrends(trendData as TrendSignal[]);
            }

            // Fetch trending content
            const { data: contentData } = await supabase
                .from('v_trending_content')
                .select('*')
                .limit(20);

            if (contentData) {
                setTrendingContent(contentData as TrendingContent[]);
            }

            // Fetch emerging influencers
            // Fetch competitor insights
            const { data: competitorData } = await supabase
                .from('v_competitor_insights')
                .select('*');

            if (competitorData) {
                const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                const typed = competitorData as CompetitorInsight[];
                const normalized = typed.map((item) => {
                    const cleanedHandle = parseCompetitorInput(item.handle || '', item.platform || 'instagram').handle;
                    return { ...item, handle: cleanedHandle || item.handle };
                });
                const uniqueMap = new Map<string, CompetitorInsight>();
                for (const item of normalized) {
                    const key = `${item.platform}:${item.handle}`;
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, item);
                    }
                }
                const unique = Array.from(uniqueMap.values());
                const sorted = unique.slice().sort((a, b) => {
                    const wa = order[a.priority] ?? 9;
                    const wb = order[b.priority] ?? 9;
                    return wa - wb;
                });
                setCompetitors(sorted);

                setProfiles(sorted.map((item) => ({
                    id: item.competitor_id,
                    handle: item.handle,
                    platform: item.platform
                })));

                if (competitorProcessing && competitorProcessStartedAt) {
                    const startedAtMs = new Date(competitorProcessStartedAt).getTime();
                    const hasNewAnalysis = sorted.some((item) => {
                        if (!item.last_analyzed_at) return false;
                        const analyzedAt = new Date(item.last_analyzed_at).getTime();
                        return analyzedAt >= startedAtMs - 60000;
                    });
                    if (hasNewAnalysis) {
                        setCompetitorProcessing(false);
                        setCompetitorMessage(null);
                        setCompetitorProcessStartedAt(null);
                    }
                }
            }

            const { data: influencerData } = await supabase
                .from('v_emerging_influencers')
                .select('*')
                .limit(20);

            if (influencerData) {
                setEmergingInfluencers(influencerData as EmergingInfluencer[]);
            }

            // Fetch scraped hashtags from API
            try {
                const hashtagRes = await fetch('/api/trends?type=hashtags&limit=50');
                const hashtagJson = await hashtagRes.json();
                if (hashtagJson.success && hashtagJson.data) {
                    setHashtags(hashtagJson.data as HashtagData[]);
                }
            } catch (e) {
                console.error('Failed to fetch hashtags:', e);
            }

        setLoading(false);
    };

    
    const triggerCompetitorMonitor = async () => {
        setTriggeringCompetitors(true);
        setCompetitorMessage(null);
        markCompetitorProcessing();
        try {
            const res = await fetch('/api/trigger-competitor-monitor', { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.success === false) {
                setCompetitorMessage(data?.message || 'Falha ao disparar o workflow.');
                setCompetitorProcessing(false);
            } else {
                setCompetitorMessage('Em processamento. Aguarde alguns minutos.');
            }
            await fetchData();
        } catch (error) {
            console.error('Failed to trigger competitor workflow', error);
            setCompetitorMessage('Falha ao disparar o workflow.');
            setCompetitorProcessing(false);
        } finally {
            setTriggeringCompetitors(false);
        }
    };

    const triggerCompetitorMonitorSilent = async () => {
        markCompetitorProcessing();
        try {
            await fetch('/api/trigger-competitor-monitor', { method: 'POST' });
        } catch (error) {
            console.error('Failed to trigger competitor workflow', error);
            setCompetitorProcessing(false);
        }
    };

    function parseCompetitorInput(value: string, fallbackPlatform: string) {
        const trimmed = value.trim();
        if (!trimmed) {
            return { handle: '', platform: fallbackPlatform };
        }

        const lower = trimmed.toLowerCase();
        let platform = fallbackPlatform;
        let handle = trimmed;

        if (lower.includes('instagram.com') || lower.includes('tiktok.com')) {
            try {
                const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
                const parts = url.pathname.split('/').filter(Boolean);
                if (lower.includes('tiktok.com')) {
                    platform = 'tiktok';
                    const atHandle = parts.find((part) => part.startsWith('@'));
                    handle = atHandle ? atHandle.replace('@', '') : (parts[0] || '');
                } else {
                    platform = 'instagram';
                    handle = parts[0] || '';
                }
            } catch {
                handle = trimmed;
            }
        }

        const sanitized = handle
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/^instagram\.com\//, '')
            .replace(/^tiktok\.com\//, '')
            .replace(/^@/, '')
            .replace(/[?#].*$/, '')
            .replace(/\/.*$/, '')
            .replace(/\s+/g, '')
            .trim();

        return {
            handle: sanitized,
            platform
        };
    }

    const buildProfileUrl = (platform: string, handle: string) => {
        if (platform === 'tiktok') {
            return `https://www.tiktok.com/@${handle}`;
        }
        return `https://www.instagram.com/${handle}`;
    };

    const getOrCreateStoreId = async () => {
        const storeName = 'Fashion Center';
        const { data: storeRow, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('name', storeName)
            .maybeSingle();

        if (storeError) {
            throw storeError;
        }

        if (storeRow?.id) {
            return storeRow.id as string;
        }

        const { data: inserted, error: insertError } = await supabase
            .from('stores')
            .insert({ name: storeName })
            .select('id')
            .single();

        if (insertError) {
            const { data: retryRow, error: retryError } = await supabase
                .from('stores')
                .select('id')
                .eq('name', storeName)
                .maybeSingle();

            if (retryError || !retryRow?.id) {
                throw insertError;
            }
            return retryRow.id as string;
        }

        return inserted.id as string;
    };

    const upsertCompetitorProfile = async (storeId: string, platform: string, handle: string) => {
        const url = buildProfileUrl(platform, handle);
        const { data: profileRow, error: profileError } = await supabase
            .from('store_profiles')
            .upsert({
                store_id: storeId,
                platform,
                handle,
                url,
                enabled: true
            }, { onConflict: 'store_id,platform,handle' })
            .select('id')
            .single();

        if (profileError) {
            throw profileError;
        }

        return profileRow.id as string;
    };

    const handleAddCompetitor = async () => {
        if (addingCompetitor) return;
        const parsed = parseCompetitorInput(newCompetitor.handle, newCompetitor.platform);

        if (!parsed.handle) {
            setAddCompetitorError('Informe o @ do concorrente.');
            return;
        }

        setAddingCompetitor(true);
        setAddCompetitorError(null);
        try {
            const storeId = await getOrCreateStoreId();
            const profileId = await upsertCompetitorProfile(storeId, parsed.platform, parsed.handle);

            const { error: trackingError } = await supabase
                .from('competitor_tracking')
                .upsert({
                    client_id: storeId,
                    competitor_profile_id: profileId,
                    tracking_reason: newCompetitor.reason || null,
                    priority: newCompetitor.priority,
                    last_analyzed_at: new Date().toISOString(),
                    alert_on_changes: true
                }, { onConflict: 'client_id,competitor_profile_id' });

            if (trackingError) {
                throw trackingError;
            }

            if (editingCompetitor && editingCompetitor.competitor_id !== profileId) {
                await supabase
                    .from('competitor_tracking')
                    .delete()
                    .match({
                        client_id: editingCompetitor.client_id,
                        competitor_profile_id: editingCompetitor.competitor_id
                    });
            }

            setShowAddCompetitor(false);
            setNewCompetitor({ handle: '', platform: 'instagram', priority: 'medium', reason: '' });
            setEditingCompetitor(null);
            setCompetitorMessage(editingCompetitor ? 'Concorrente atualizado. Atualização em andamento.' : 'Concorrente adicionado. Atualização em andamento.');
            await triggerCompetitorMonitorSilent();
            await fetchData();
        } catch (error) {
            console.error('Failed to add competitor', error);
            setAddCompetitorError('Não foi possível adicionar o concorrente. Verifique as permissões.');
        } finally {
            setAddingCompetitor(false);
        }
    };

    const openEditCompetitor = async (item: CompetitorInsight) => {
        setEditingCompetitor(item);
        setNewCompetitor({
            handle: `@${item.handle}`,
            platform: item.platform || 'instagram',
            priority: item.priority || 'medium',
            reason: ''
        });
        setAddCompetitorError(null);
        setShowAddCompetitor(true);

        try {
            const { data: trackingRow, error: trackingError } = await supabase
                .from('competitor_tracking')
                .select('tracking_reason')
                .eq('client_id', item.client_id)
                .eq('competitor_profile_id', item.competitor_id)
                .maybeSingle();

            if (trackingError) {
                console.error('Failed to load tracking reason', trackingError);
                return;
            }

            if (trackingRow?.tracking_reason) {
                setNewCompetitor((prev) => ({ ...prev, reason: trackingRow.tracking_reason || '' }));
            }
        } catch (error) {
            console.error('Failed to load tracking reason', error);
        }
    };

    const handleRemoveCompetitor = async (item: CompetitorInsight) => {
        if (deletingCompetitor) return;
        setDeletingCompetitor(true);
        try {
            const { error } = await supabase
                .from('competitor_tracking')
                .delete()
                .match({ client_id: item.client_id, competitor_profile_id: item.competitor_id });

            if (error) {
                throw error;
            }

            setCompetitorMessage('Concorrente removido com sucesso.');
            await fetchData();
        } catch (error) {
            console.error('Failed to remove competitor', error);
            setCompetitorMessage('Falha ao remover concorrente.');
        } finally {
            setDeletingCompetitor(false);
            setDeleteTarget(null);
        }
    };

useEffect(() => {
        fetchData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    const tabs = [
        { id: 'trends' as TabType, label: 'Tendências', icon: TrendingUp },
        { id: 'hashtags' as TabType, label: 'Hashtags', icon: Hash },
        { id: 'influencers' as TabType, label: 'Influenciadores', icon: Flame },
        { id: 'content' as TabType, label: 'Conteúdo', icon: BarChart3 },
        { id: 'competitors' as TabType, label: 'Concorrentes', icon: Target }
    ];

    const safeNumber = (value: number | string | null | undefined) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const normalizeText = (value: unknown) =>
        typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

    const extractField = (source: string, field: string) => {
        const match = source.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
        return match ? normalizeText(match[1]) : '';
    };

    const MAX_TITLE_LENGTH = 120;
    const MAX_DESCRIPTION_LENGTH = 140;
    const MAX_REASON_LENGTH = 120;

    const clampText = (text: string, maxLength: number) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        const trimmed = text.slice(0, maxLength).trim();
        const lastSpace = trimmed.lastIndexOf(' ');
        const safeCut = lastSpace > maxLength * 0.6 ? trimmed.slice(0, lastSpace) : trimmed;
        return `${safeCut}...`;
    };

    const buildContent = (title: string, description: string, reason: string, fallback: string) => ({
        title: clampText(title || fallback || '-', MAX_TITLE_LENGTH),
        description: clampText(description, MAX_DESCRIPTION_LENGTH),
        reason: clampText(reason, MAX_REASON_LENGTH)
    });

    const getTrendContent = (value: string) => {
        const trimmed = normalizeText(value);
        if (!trimmed) {
            return { title: '-', description: '', reason: '' };
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') {
                const title = normalizeText(parsed) || trimmed;
                return buildContent(title, '', '', trimmed);
            }
            if (parsed && typeof parsed === 'object') {
                const base = Array.isArray(parsed) ? (parsed as any[])[0] : parsed;
                const payload = (base as any)?.payload && typeof (base as any).payload === 'object'
                    ? (base as any).payload
                    : base;
                const title = normalizeText(
                    (payload as any).titulo ??
                    (payload as any).title ??
                    (payload as any).tema ??
                    (payload as any).nome ??
                    (payload as any).name
                );
                const description = normalizeText(
                    (payload as any).descricao ??
                    (payload as any).description
                );
                const reason = normalizeText(
                    (payload as any).porque_funciona ??
                    (payload as any).impacto_esperado ??
                    (payload as any).impacto
                );
                return buildContent(title, description, reason, trimmed);
            }
        } catch {
            const title = extractField(trimmed, 'titulo') || extractField(trimmed, 'title') || extractField(trimmed, 'tema');
            const description = extractField(trimmed, 'descricao') || extractField(trimmed, 'description');
            const reason = extractField(trimmed, 'porque_funciona') || extractField(trimmed, 'impacto_esperado') || extractField(trimmed, 'impacto');
            if (title || description || reason) {
                return buildContent(title, description, reason, trimmed);
            }
        }
        return buildContent(trimmed, '', '', trimmed);
    };

    const summaryCardStyle: CSSProperties = {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
    };

    const summaryLabelStyle: CSSProperties = {
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        fontWeight: 700
    };

    const summaryValueStyle: CSSProperties = {
        fontSize: '1.1rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        marginTop: '0.35rem',
        lineHeight: 1.25,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    };

    const summaryHintStyle: CSSProperties = {
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginTop: '0.5rem'
    };

    const trendTop = trends[0];
    const trendAvgScore = trends.length
        ? Math.round(trends.reduce((sum, t) => sum + safeNumber(t.score), 0) / trends.length)
        : null;
    const trendTopGrowth = trends.length
        ? trends.reduce((best, t) => (safeNumber(t.growth) > safeNumber(best.growth) ? t : best), trends[0])
        : null;
    const trendTopContent = trendTop ? getTrendContent(trendTop.value) : null;
    const trendTopGrowthContent = trendTopGrowth ? getTrendContent(trendTopGrowth.value) : null;
    const trendPlatforms = Array.from(new Set(trends.map((t) => t.platform))).join(', ') || '-';

    const hashtagTotalLikes = hashtags.reduce((sum, h) => sum + safeNumber(h.likes_total), 0);
    const hashtagAvgEngagement = hashtags.length
        ? (hashtags.reduce((sum, h) => sum + safeNumber(h.engagement_avg), 0) / hashtags.length)
        : null;
    const hashtagTop = hashtags.length
        ? hashtags.reduce((best, h) => (safeNumber(h.likes_total) > safeNumber(best.likes_total) ? h : best), hashtags[0])
        : null;

    const influencerTop = emergingInfluencers.length
        ? emergingInfluencers.reduce((best, i) => (safeNumber(i.growth_rate) > safeNumber(best.growth_rate) ? i : best), emergingInfluencers[0])
        : null;
    const influencerAvgGrowth = emergingInfluencers.length
        ? (emergingInfluencers.reduce((sum, i) => sum + safeNumber(i.growth_rate), 0) / emergingInfluencers.length)
        : null;
    const influencerPlatforms = Array.from(new Set(emergingInfluencers.map((i) => i.platform))).join(', ') || '-';
    const monitoredCompetitors = competitors.slice(0, 5);
    const maxMonitoredProfiles = 10;
    const canAddMoreProfiles = competitors.length < maxMonitoredProfiles;

    const contentTop = trendingContent.length
        ? trendingContent.reduce((best, c) => (safeNumber(c.performance_score) > safeNumber(best.performance_score) ? c : best), trendingContent[0])
        : null;
    const contentAvgScore = trendingContent.length
        ? (trendingContent.reduce((sum, c) => sum + safeNumber(c.performance_score), 0) / trendingContent.length)
        : null;
    const contentTopPlatform = trendingContent.length
        ? Object.entries(trendingContent.reduce((acc, c) => {
            const key = c.platform || 'outros';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-'
        : '-';
    const handleValidationColor = handleValidation.status === 'valid'
        ? 'var(--success)'
        : handleValidation.status === 'not_found'
            ? 'var(--warning)'
            : handleValidation.status === 'invalid'
                ? 'var(--error)'
                : 'var(--text-muted)';
    const handleBorderColor = handleValidation.status === 'valid'
        ? 'var(--success)'
        : handleValidation.status === 'not_found'
            ? 'var(--warning)'
            : handleValidation.status === 'invalid'
                ? 'var(--error)'
                : 'var(--border)';
    const handleValidationIcon = handleValidation.status === 'valid'
        ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
        : handleValidation.status === 'not_found'
            ? <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
            : handleValidation.status === 'invalid'
                ? <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
                : handleValidation.status === 'checking'
                    ? <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                    : null;
    const isSaveDisabled = addingCompetitor || handleValidation.status === 'invalid' || handleValidation.status === 'checking';

    return (
        <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>

            {/* Hero Section */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                    position: 'relative',
                    marginBottom: '3rem',
                    textAlign: 'center',
                    padding: '4rem 1rem',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)'
                }}
            >
                {/* Background Glow */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        zIndex: 0,
                        opacity: 0.4
                    }}
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '50px',
                            border: '1px solid var(--border)',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Radio size={16} className="text-primary animate-pulse" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)' }}>
                            Monitorando em Tempo Real
                        </span>
                    </motion.div>

                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.03em',
                        marginBottom: '1rem',
                        lineHeight: 1.1
                    }}>
                        Radar de Inteligência
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        Análise avançada de Tendências, influenciadores e Conteúdo para guiar sua estratégia.
                    </p>
                </div>
            </motion.header>

            {/* Tabs */}
            <div className="radar-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(tab.id)}
                            className={`radar-tab ${isActive ? 'radar-tab--active' : ''}`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid var(--border)',
                        borderTopColor: 'var(--primary)',
                        borderRadius: '50%',
                    }} className="animate-spin" />
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', width: '100%' }}>

                        {/* Main Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* TRENDS TAB */}
                            {activeTab === 'trends' && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Zap size={24} style={{ color: 'var(--primary)' }} fill="var(--primary)" fillOpacity={0.2} />
                                            Top Tópicos
                                        </h2>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ãšltimos 7 dias</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>SINAIS ANALISADOS</div>
                                            <div style={summaryValueStyle}>{trends.length}</div>
                                            <div style={summaryHintStyle}>
                                                Quantidade de topicos ativos no periodo. Plataformas: {trendPlatforms}.
                                            </div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>
                                                <span
                                                    className="tooltip"
                                                    data-tooltip="Score de tendência = média de interações por post × log10(qtd. de posts + 1)."
                                                >
                                                    SCORE MÉDIO
                                                </span>
                                            </div>
                                            <div style={summaryValueStyle}>{trendAvgScore !== null ? trendAvgScore : '-'}</div>
                                            <div style={summaryHintStyle}>Força média dos sinais capturados.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>TOP TOPICO</div>
                                            <div style={summaryValueStyle}>{trendTopContent ? trendTopContent.title : '-'}</div>
                                            <div style={summaryHintStyle}>
                                                {trendTopContent?.description && (
                                                    <span style={{ display: 'block', marginBottom: '0.35rem' }}>
                                                        {trendTopContent.description}
                                                    </span>
                                                )}
                                                {trendTop ? `${trendTop.platform} · Score ${Math.round(safeNumber(trendTop.score))}` : 'Sem dados suficientes.'}
                                            </div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>MAIOR CRESCIMENTO</div>
                                            <div style={summaryValueStyle}>{trendTopGrowthContent ? trendTopGrowthContent.title : '-'}</div>
                                            <div style={summaryHintStyle}>
                                                {trendTopGrowthContent?.description && (
                                                    <span style={{ display: 'block', marginBottom: '0.35rem' }}>
                                                        {trendTopGrowthContent.description}
                                                    </span>
                                                )}
                                                {trendTopGrowth ? `+${Math.round(safeNumber(trendTopGrowth.growth))}% no periodo.` : 'Aguardando novos sinais.'}
                                            </div>
                                        </div>
                                    </div>

                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}
                                    >
                                        {trends.map((trend, i) => {
                                            const trendContent = getTrendContent(trend.value);
                                            const hasGrowth = trend.growth !== null && trend.growth !== undefined;
                                            const growthValue = Math.round(safeNumber(trend.growth));

                                            return (
                                                <motion.div
                                                    key={trend.id}
                                                    variants={itemVariants}
                                                    whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                                                    style={{
                                                        background: 'linear-gradient(180deg, #ffffff 0%, #fbf7f4 100%)',
                                                        borderRadius: '20px',
                                                        padding: '1.5rem',
                                                        border: '1px solid var(--border)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        minHeight: '180px',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        cursor: 'default',
                                                        boxShadow: '0 12px 24px rgba(26, 21, 19, 0.08)'
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        padding: '0.75rem',
                                                        background: trend.platform === 'instagram' ? 'linear-gradient(135deg, rgba(188, 108, 116, 0.12), #FFF)' : 'linear-gradient(135deg, rgba(45, 36, 32, 0.06), #FFF)',
                                                        borderBottomLeftRadius: '20px',
                                                        fontSize: '0.625rem',
                                                        fontWeight: '700',
                                                        color: trend.platform === 'instagram' ? 'var(--instagram)' : 'var(--text-primary)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {trend.platform}
                                                    </div>

                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <span style={{
                                                            fontSize: '2rem',
                                                            fontWeight: '800',
                                                            letterSpacing: '-0.03em',
                                                            color: 'var(--text-primary)',
                                                            lineHeight: 1
                                                        }}>
                                                            {i + 1}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h3 style={{
                                                            fontSize: '1.25rem',
                                                            fontWeight: '700',
                                                            marginBottom: trendContent.description ? '0.4rem' : '0.65rem',
                                                            wordBreak: 'break-word',
                                                            background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                            lineHeight: 1.25
                                                        }}>
                                                            {trendContent.title}
                                                        </h3>

                                                        {trendContent.description && (
                                                            <p style={{
                                                                fontSize: '0.85rem',
                                                                color: 'var(--text-secondary)',
                                                                marginBottom: '0.6rem',
                                                                lineHeight: 1.5,
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}>
                                                                {trendContent.description}
                                                            </p>
                                                        )}

                                                        {trendContent.reason && (
                                                            <div style={{
                                                                borderLeft: '2px solid var(--primary)',
                                                                paddingLeft: '0.6rem',
                                                                fontSize: '0.75rem',
                                                                color: 'var(--text-muted)',
                                                                marginBottom: '0.6rem',
                                                                lineHeight: 1.45
                                                            }}>
                                                                {trendContent.reason}
                                                            </div>
                                                        )}

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem',
                                                                color: 'var(--success)',
                                                                background: 'rgba(71, 167, 106, 0.1)',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '12px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: '700'
                                                            }}>
                                                                <ArrowUpRight size={14} />
                                                                <span
                                                                    className="tooltip"
                                                                    data-tooltip="Score de tendência = média de interações por post × log10(qtd. de posts + 1)."
                                                                >
                                                                    Score {Math.round(trend.score).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {hasGrowth && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.25rem',
                                                                    color: 'var(--primary)',
                                                                    background: 'rgba(193, 125, 106, 0.12)',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    +{growthValue}% no período
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </>
                            )}

                            {/* HASHTAGS TAB */}
                            {activeTab === 'hashtags' && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Hash size={24} style={{ color: 'var(--primary)' }} />
                                            Hashtags Coletadas
                                        </h2>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                                            {hashtags.length} hashtags
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>HASHTAGS MAPEADAS</div>
                                            <div style={summaryValueStyle}>{hashtags.length}</div>
                                            <div style={summaryHintStyle}>Volume total de termos coletados.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>
                                                <span
                                                    className="tooltip"
                                                    data-tooltip="Média de interações por post (curtidas + comentários + compartilhamentos)."
                                                >
                                                    ENGAJAMENTO MÉDIO
                                                </span>
                                            </div>
                                            <div style={summaryValueStyle}>{hashtagAvgEngagement !== null ? `${hashtagAvgEngagement.toFixed(1)}%` : '-'}</div>
                                            <div style={summaryHintStyle}>Média de interações por hashtag.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>INTERACOES TOTAIS</div>
                                            <div style={summaryValueStyle}>{formatNumber(hashtagTotalLikes)}</div>
                                            <div style={summaryHintStyle}>Soma de curtidas do periodo.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>TOP HASHTAG</div>
                                            <div style={summaryValueStyle}>{hashtagTop ? `#${hashtagTop.hashtag}` : '-'}</div>
                                            <div style={summaryHintStyle}>
                                                {hashtagTop ? `${formatNumber(hashtagTop.likes_total)} curtidas` : 'Sem dados suficientes.'}
                                            </div>
                                        </div>
                                    </div>

                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}
                                    >
                                        {hashtags.slice(0, 20).map((tag, i) => (
                                            <motion.div
                                                key={tag.id}
                                                variants={itemVariants}
                                                whileHover={{ y: -3, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                                                style={{
                                                    background: 'var(--surface)',
                                                    borderRadius: '16px',
                                                    padding: '1.25rem',
                                                    border: '1px solid var(--border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    cursor: 'default'
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '12px',
                                                    background: tag.platform === 'instagram'
                                                        ? 'linear-gradient(135deg, rgba(188, 108, 116, 0.15), rgba(188, 108, 116, 0.05))'
                                                        : 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.02))',
                                                    flexShrink: 0
                                                }}>
                                                    {tag.platform === 'instagram' ? (
                                                        <Instagram size={20} style={{ color: 'var(--instagram)' }} />
                                                    ) : (
                                                        <Music2 size={20} style={{ color: 'var(--text-primary)' }} />
                                                    )}
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        fontWeight: '700',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '1rem',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        #{tag.hashtag}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <Heart size={12} />
                                                            {formatNumber(tag.likes_total)}
                                                        </span>
                                                        <span
                                                            className="tooltip"
                                                            data-tooltip="Média de interações por post (curtidas + comentários + compartilhamentos)."
                                                            style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                        >
                                                            <span style={{ fontWeight: 600 }}>Média engaj.</span>
                                                            <span>{formatNumber(tag.engagement_avg)}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: '800',
                                                    color: 'var(--text-primary)',
                                                    opacity: 0.3
                                                }}>
                                                    #{i + 1}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {hashtags.length === 0 && (
                                        <div style={{
                                            background: 'var(--surface)',
                                            borderRadius: '16px',
                                            padding: '3rem',
                                            border: '1px solid var(--border)',
                                            textAlign: 'center'
                                        }}>
                                            <Hash size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                Nenhuma hashtag coletada ainda.
                                            </p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Execute os workflows de scraping no n8n.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* INFLUENCERS TAB */}
                            {activeTab === 'influencers' && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Flame size={24} style={{ color: 'var(--primary)' }} />
                                            Influenciadores Emergentes
                                        </h2>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ãšltimos 30 dias</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>PERFIS EM ALTA</div>
                                            <div style={summaryValueStyle}>{emergingInfluencers.length}</div>
                                            <div style={summaryHintStyle}>Perfis com crescimento acima da media.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>CRESCIMENTO MEDIO</div>
                                            <div style={summaryValueStyle}>{influencerAvgGrowth !== null ? `+${influencerAvgGrowth.toFixed(1)}%` : '-'}</div>
                                            <div style={summaryHintStyle}>Variacao media de seguidores.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>TOP CRESCIMENTO</div>
                                            <div style={summaryValueStyle}>{influencerTop ? `@${influencerTop.handle}` : '-'}</div>
                                            <div style={summaryHintStyle}>
                                                {influencerTop ? `+${safeNumber(influencerTop.growth_rate).toFixed(1)}% no periodo.` : 'Sem dados suficientes.'}
                                            </div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>PLATAFORMAS</div>
                                            <div style={summaryValueStyle}>{influencerPlatforms}</div>
                                            <div style={summaryHintStyle}>Onde os criadores mais crescem.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {emergingInfluencers.map((influencer) => {
                                            const platformLabel = (influencer.platform || '').toLowerCase();
                                            const isInstagram = platformLabel.includes('instagram');
                                            const isTiktok = platformLabel.includes('tiktok');

                                            return (

                                            <motion.div
                                                key={influencer.profile_id}
                                                whileHover={{ x: 5 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '1.5rem',
                                                    background: 'var(--surface)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border)',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '12px',
                                                        background: 'var(--background)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {isInstagram ? (

                                                            <Instagram size={18} style={{ color: 'var(--instagram)' }} />
                                                        ) : isTiktok ? (

                                                            <Music2 size={18} style={{ color: 'var(--tiktok)' }} />
                                                        ) : (

                                                            <Users size={18} style={{ color: 'var(--text-muted)' }} />
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>@{influencer.handle}</p>
                                                            {influencer.growth_rate >= 50 && (

                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: '700',
                                                                    padding: '0.25rem 0.5rem',
                                                                    borderRadius: '8px',
                                                                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                                                                    color: 'white'
                                                                }}>
                                                                    EM ALTA
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                            {influencer.platform}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--success)' }}>
                                                        +{influencer.growth_rate.toFixed(1)}%
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {formatNumber(influencer.follower_count)} seguidores
                                                    </p>
                                                </div>
                                            </motion.div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* CONTENT TAB */}
                            {activeTab === 'content' && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
                                            Top Conteúdo
                                        </h2>
                                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>Ãšltimos 7 dias</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '0.5rem 0 1.5rem' }}>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>POSTS ANALISADOS</div>
                                            <div style={summaryValueStyle}>{trendingContent.length}</div>
                                            <div style={summaryHintStyle}>Quantidade de posts avaliados.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>
                                                <span
                                                    className="tooltip"
                                                    data-tooltip="Score de performance (0-100) = engajamento (0-50) + viralidade (0-30) + qualidade (0-20)."
                                                >
                                                    SCORE MÉDIO
                                                </span>
                                            </div>
                                            <div style={summaryValueStyle}>{contentAvgScore !== null ? contentAvgScore.toFixed(0) : '-'}</div>
                                            <div style={summaryHintStyle}>Desempenho médio do conteúdo.</div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>
                                                <span
                                                    className="tooltip"
                                                    data-tooltip="Score de performance (0-100) = engajamento (0-50) + viralidade (0-30) + qualidade (0-20)."
                                                >
                                                    MELHOR SCORE
                                                </span>
                                            </div>
                                            <div style={summaryValueStyle}>{contentTop ? contentTop.performance_score.toFixed(0) : '-'}</div>
                                            <div style={summaryHintStyle}>
                                                {contentTop ? `${contentTop.platform} · destaque do período` : 'Sem dados suficientes.'}
                                            </div>
                                        </div>
                                        <div style={summaryCardStyle}>
                                            <div style={summaryLabelStyle}>PLATAFORMA DOMINANTE</div>
                                            <div style={summaryValueStyle}>{contentTopPlatform}</div>
                                            <div style={summaryHintStyle}>Onde o volume de posts foi maior.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                        {trendingContent.slice(0, 12).map((content) => (
                                            <motion.div
                                                key={content.id}
                                                whileHover={{ y: -5 }}
                                                style={{
                                                    background: 'var(--surface)',
                                                    borderRadius: '16px',
                                                    padding: '1.5rem',
                                                    border: '1px solid var(--border)',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                                }}
                                            >
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: '700',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '8px',
                                                            background: content.platform === 'instagram' ? 'rgba(188, 108, 116, 0.1)' : 'rgba(45, 36, 32, 0.1)',
                                                            color: content.platform === 'instagram' ? 'var(--instagram)' : 'var(--text-primary)',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {content.platform}
                                                        </span>
                                                        <div
                                                            className="tooltip"
                                                            data-tooltip="Score de performance (0-100) = engajamento (0-50) + viralidade (0-30) + qualidade (0-20)."
                                                            style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}
                                                        >
                                                            <span style={{
                                                                fontSize: '0.65rem',
                                                                fontWeight: '700',
                                                                letterSpacing: '0.08em',
                                                                textTransform: 'uppercase',
                                                                color: 'var(--text-muted)'
                                                            }}>
                                                                Score
                                                            </span>
                                                            <span style={{
                                                                fontSize: '1.25rem',
                                                                fontWeight: '800',
                                                                color: content.performance_score >= 70 ? 'var(--success)' : 'var(--text-secondary)'
                                                            }}>
                                                                {content.performance_score.toFixed(0)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p style={{
                                                        fontSize: '0.9rem',
                                                        color: 'var(--text-primary)',
                                                        lineHeight: 1.5,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {content.text || 'Sem descrição'}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    {content.hashtags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} style={{
                                                            fontSize: '0.7rem',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '8px',
                                                            background: 'var(--background)',
                                                            color: 'var(--primary)',
                                                            fontWeight: '600'
                                                        }}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* COMPETITORS TAB */}
                            {activeTab === 'competitors' && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Target size={24} style={{ color: 'var(--primary)' }} />
                                            Concorrentes
                                        </h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn btn-outline"
                                                onClick={triggerCompetitorMonitor}
                                                disabled={triggeringCompetitors}
                                                style={{ padding: '0.6rem 1rem' }}
                                            >
                                                {triggeringCompetitors ? 'Atualizando...' : 'Atualizar dados'}
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => {
                                                    setShowAddCompetitor(true);
                                                    setAddCompetitorError(null);
                                                    setEditingCompetitor(null);
                                                    setNewCompetitor({ handle: '', platform: 'instagram', priority: 'medium', reason: '' });
                                                }}
                                                style={{ padding: '0.6rem 1rem' }}
                                            >
                                                Adicionar concorrente
                                            </button>
                                        </div>
                                    </div>

                                    {competitorMessage && (
                                        <div style={{
                                            background: 'var(--background)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            padding: '0.75rem 1rem',
                                            marginBottom: '1rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.85rem'
                                        }}>
                                            {competitorMessage}
                                        </div>
                                    )}

                                    {competitorProcessing && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            padding: '0.75rem 1rem',
                                            marginBottom: '1rem',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.85rem'
                                        }}>
                                            <div
                                                className="animate-spin"
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid var(--border)',
                                                    borderTopColor: 'var(--primary)',
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            Em processamento. Coletando dados dos concorrentes.
                                        </div>
                                    )}

                                    {competitors.length === 0 ? (
                                        <div style={{
                                            background: 'var(--surface)',
                                            borderRadius: '16px',
                                            padding: '2rem',
                                            border: '1px solid var(--border)',
                                            textAlign: 'center'
                                        }}>
                                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                Nenhum concorrente sendo monitorado no momento.
                                            </p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Configure concorrentes para analise comparativa.
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                            {competitors.map((item, i) => {
                                                const engagementValue = item.avg_engagement_rate !== null
                                                    ? `${item.avg_engagement_rate.toFixed(1)}%`
                                                    : null;
                                                const frequencyValue = item.post_frequency !== null
                                                    ? `${item.post_frequency}/7d`
                                                    : null;
                                                const hasInsights = engagementValue !== null || frequencyValue !== null;
                                                const lastAnalyzedLabel = item.last_analyzed_at
                                                    ? ` · Última Análise ${formatLastAnalyzed(item.last_analyzed_at)}`
                                                    : '';

                                                return (
                                                <motion.div
                                                    key={`${item.competitor_id}-${i}`}
                                                    whileHover={{ y: -4 }}
                                                    className="card-hover-actions"
                                                    style={{
                                                        background: 'var(--surface)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '16px',
                                                        padding: '1.25rem',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                @{item.handle}
                                                            </div>
                                                            <span className="badge badge-neutral" style={{ marginTop: '0.35rem', display: 'inline-flex' }}>{item.priority}</span>
                                                        </div>
                                                        <div className="card-actions">
                                                            <button
                                                                onClick={() => openEditCompetitor(item)}
                                                                aria-label={`Editar ${item.handle}`}
                                                                className="icon-btn tooltip"
                                                                data-tooltip="Editar concorrente"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteTarget(item)}
                                                                aria-label={`Remover ${item.handle}`}
                                                                className="icon-btn icon-danger tooltip"
                                                                data-tooltip="Remover concorrente"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                                                            {item.platform}{lastAnalyzedLabel}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div>
                                                            <div className="label">Seguidores</div>
                                                            <div style={{ fontWeight: 700 }}>
                                                                {item.follower_count !== null ? item.follower_count.toLocaleString('pt-BR') : '-'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="label">Crescimento</div>
                                                            <div style={{ fontWeight: 700, color: 'var(--success)' }}>
                                                                {item.follower_growth !== null ? item.follower_growth.toLocaleString('pt-BR') : '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {hasInsights ? (
                                                            <span>
                                                                Engaj. {engagementValue ?? 'Ã¢Â€Â”'} · Posts/7d {frequencyValue ?? 'Ã¢Â€Â”'}
                                                            </span>
                                                        ) : (
                                                            <span>Aguardando Análise</span>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                        </div>

                        {/* Sidebar Column: Stats & Profiles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* Status Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="card-status"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                    <Activity size={20} style={{ color: '#3D261C' }} />
                                    <h3 className="card-title">Status do Sistema</h3>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p className="card-label-secondary">
                                            Perfis
                                        </p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{profiles.length}</p>
                                    </div>
                                    <div>
                                        <p className="card-label-secondary">
                                            Sinais
                                        </p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 }}>{trends.length}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)' }}>Próxima Atualização</span>
                                    <span className="card-time">06:00 AM</span>
                                </div>
                            </motion.div>

                            {/* Monitored Profiles List */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={20} />
                                        Perfis Monitorados
                                    </h3>
                                    {canAddMoreProfiles && (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => {
                                                setEditingCompetitor(null);
                                                setNewCompetitor({ handle: '', platform: 'instagram', priority: 'medium', reason: '' });
                                                setAddCompetitorError(null);
                                                setShowAddCompetitor(true);
                                            }}
                                            style={{ padding: '0.5rem 0.9rem' }}
                                        >
                                            Adicionar perfil
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {monitoredCompetitors.length === 0 ? (
                                        <div style={{
                                            background: 'var(--surface)',
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            border: '1px solid var(--border)',
                                            textAlign: 'center',
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.9rem'
                                        }}>
                                            Nenhum perfil monitorado ainda. Adicione um perfil para iniciar o acompanhamento.
                                        </div>
                                    ) : monitoredCompetitors.map((competitor) => {
                                        const platformLabel = (competitor.platform || '').toLowerCase();
                                        const isInstagram = platformLabel.includes('instagram');
                                        const isTiktok = platformLabel.includes('tiktok');

                                        return (
                                        <motion.div
                                            key={competitor.competitor_id}
                                            whileHover={{ x: 5 }}
                                            className="card-hover-actions"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '1rem',
                                                background: 'var(--surface)',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '12px',
                                                    background: 'var(--background)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {isInstagram ? (
                                                        <Instagram size={16} style={{ color: 'var(--instagram)' }} />
                                                    ) : isTiktok ? (
                                                        <Music2 size={16} style={{ color: 'var(--tiktok)' }} />
                                                    ) : (
                                                        <Users size={16} style={{ color: 'var(--text-muted)' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>@{competitor.handle}</p>
                                                        <span style={{
                                                            width: '6px',
                                                            height: '6px',
                                                            borderRadius: '50%',
                                                            background: 'var(--success)',
                                                            boxShadow: '0 0 8px var(--success)'
                                                        }} />
                                                    </div>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                                        {competitor.platform}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="card-actions">
                                                <button
                                                    onClick={() => openEditCompetitor(competitor)}
                                                    aria-label={`Editar ${competitor.handle}`}
                                                    className="icon-btn tooltip"
                                                    data-tooltip="Editar concorrente"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(competitor)}
                                                    aria-label={`Remover ${competitor.handle}`}
                                                    className="icon-btn icon-danger tooltip"
                                                    data-tooltip="Remover concorrente"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {showAddCompetitor && (
                <div
                    onClick={() => {
                        if (!addingCompetitor) {
                            setShowAddCompetitor(false);
                            setEditingCompetitor(null);
                        }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(26, 21, 19, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        zIndex: 50
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '520px',
                            background: 'var(--surface)',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '1.75rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                    {editingCompetitor ? 'Editar concorrente' : 'Adicionar concorrente'}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    {editingCompetitor
                                        ? 'Atualize as informações e mantenha o monitoramento ativo.'
                                        : 'Salve um perfil e dispare o monitoramento automático.'}
                                </p>
                            </div>
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowAddCompetitor(false);
                                    setEditingCompetitor(null);
                                }}
                                disabled={addingCompetitor}
                                style={{ padding: '0.35rem 0.5rem' }}
                                aria-label="Fechar modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Perfil</label>
                                <input
                                    value={newCompetitor.handle}
                                    onChange={(event) => setNewCompetitor((prev) => ({ ...prev, handle: event.target.value }))}
                                    placeholder="@lojarenner"
                                    style={{
                                        padding: '0.75rem 0.9rem',
                                        borderRadius: '12px',
                                        border: `1px solid ${handleBorderColor}`,
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s ease'
                                    }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Aceita @usuario ou URL completa do perfil.
                                </span>
                                {handleValidation.status !== 'idle' && handleValidation.message && (
                                    <span style={{ fontSize: '0.75rem', color: handleValidationColor, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                        {handleValidationIcon}
                                        {handleValidation.message}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Plataforma</label>
                                    <select
                                        value={newCompetitor.platform}
                                        onChange={(event) => setNewCompetitor((prev) => ({ ...prev, platform: event.target.value }))}
                                        style={{
                                            padding: '0.7rem 0.9rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)'
                                        }}
                                    >
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Prioridade</label>
                                    <select
                                        value={newCompetitor.priority}
                                        onChange={(event) => setNewCompetitor((prev) => ({ ...prev, priority: event.target.value }))}
                                        style={{
                                            padding: '0.7rem 0.9rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--surface)'
                                        }}
                                    >
                                        <option value="high">Alta</option>
                                        <option value="medium">MÃ©dia</option>
                                        <option value="low">Baixa</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Motivo (opcional)</label>
                                <textarea
                                    value={newCompetitor.reason}
                                    onChange={(event) => setNewCompetitor((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Ex: benchmark de campanhas"
                                    rows={3}
                                    style={{
                                        padding: '0.75rem 0.9rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {addCompetitorError && (
                                <div style={{
                                    background: 'var(--error-light)',
                                    color: 'var(--error)',
                                    border: '1px solid rgba(199, 90, 90, 0.35)',
                                    borderRadius: '12px',
                                    padding: '0.65rem 0.85rem',
                                    fontSize: '0.85rem'
                                }}>
                                    {addCompetitorError}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowAddCompetitor(false);
                                    setEditingCompetitor(null);
                                }}
                                disabled={addingCompetitor}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddCompetitor}
                                disabled={isSaveDisabled}
                            >
                                {addingCompetitor
                                    ? (editingCompetitor ? 'Salvando...' : 'Salvando...')
                                    : (editingCompetitor ? 'Salvar alteraÃ§Ãµes' : 'Salvar concorrente')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div
                    onClick={() => {
                        if (!deletingCompetitor) {
                            setDeleteTarget(null);
                        }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(26, 21, 19, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        zIndex: 60
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '460px',
                            background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFAF9 100%)',
                            borderRadius: '22px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 18px 40px rgba(26, 21, 19, 0.18)',
                            padding: '1.75rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                borderRadius: '16px',
                                background: 'rgba(199, 90, 90, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--error)'
                            }}>
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>Remover concorrente</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Essa ação desativa o monitoramento para este perfil.
                                </p>
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--background)',
                            borderRadius: '14px',
                            padding: '0.85rem 1rem',
                            border: '1px dashed var(--border)',
                            marginBottom: '1.25rem'
                        }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>@{deleteTarget.handle}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                {deleteTarget.platform}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deletingCompetitor}
                            >
                                Manter concorrente
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleRemoveCompetitor(deleteTarget)}
                                disabled={deletingCompetitor}
                                style={{ background: 'linear-gradient(135deg, #C75A5A 0%, #D27474 100%)' }}
                            >
                                {deletingCompetitor ? 'Removendo...' : 'Remover agora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}




