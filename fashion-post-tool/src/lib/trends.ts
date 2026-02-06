import { supabase } from './supabase';

export interface TrendSignal {
    id: string;
    platform: 'instagram' | 'tiktok';
    type: string;
    value: string;
    score: number;
    growth: number;
    created_at: string;
}

export interface ScrapeStats {
    profiles_monitored: number;
    active_alerts: number;
    posts_collected_today: number;
}

export async function getTrendSignals(limit = 6): Promise<TrendSignal[]> {
    const { data, error } = await supabase
        .from('trend_signals')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching trends:', error);
        return [];
    }

    return data as TrendSignal[];
}

export async function getScrapeStats(): Promise<ScrapeStats> {
    // Mock implementation until we have robust aggregations
    // In a real scenario, we would use count() queries

    const { count: profilesCount } = await supabase
        .from('store_profiles')
        .select('*', { count: 'exact', head: true });

    const { count: postsCount } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .gte('collected_at', new Date().toISOString().split('T')[0]); // From today

    return {
        profiles_monitored: profilesCount || 0,
        active_alerts: 0,
        posts_collected_today: postsCount || 0,
    };
}
