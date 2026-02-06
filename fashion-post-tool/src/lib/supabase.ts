import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder to prevent build crash if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de autenticação
export interface AuthUser {
    id: string;
    email: string;
    created_at?: string;
}

// Funções de autenticação
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ClientNiche {
    id: string;
    client_id: string;
    name: string;
    description: string | null;
    hashtags: string[];
    keywords: string[];
    excluded_terms: string[];
    min_engagement: number;
    min_followers: number;
    target_regions: string[];
    enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProfileAnalytics {
    id: string;
    profile_id: string;
    date: string;
    follower_count: number;
    follower_growth: number;
    avg_engagement_rate: number;
    post_frequency: number;
    top_hashtags: string[];
    top_content_types: string[];
    computed_at: string;
}

export interface ContentInsight {
    id: string;
    social_post_id: string;
    niche_id: string | null;
    performance_score: number;
    engagement_rate: number;
    virality_score: number;
    best_posting_time: string | null;
    content_type: string | null;
    sentiment_score: number | null;
    key_topics: string[];
    computed_at: string;
}

export interface CompetitorTracking {
    id: string;
    client_id: string;
    competitor_profile_id: string;
    tracking_reason: string | null;
    priority: 'high' | 'medium' | 'low';
    last_analyzed_at: string | null;
    alert_on_changes: boolean;
    created_at: string;
}

export interface SentimentAnalysis {
    id: string;
    social_post_id: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence_score: number;
    key_emotions: string[];
    topics: string[];
    analyzed_at: string;
}

export interface TrendingContent {
    id: string;
    platform: string;
    text: string;
    hashtags: string[];
    published_at: string;
    performance_score: number;
    engagement_rate: number;
    virality_score: number;
    sentiment_score: number;
    key_topics: string[];
    time_window: string;
}

export interface EmergingInfluencer {
    profile_id: string;
    handle: string;
    platform: string;
    follower_count: number;
    follower_growth: number;
    avg_engagement_rate: number;
    growth_rate: number;
    date: string;
    computed_at: string;
}
