import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type TrendingHashtagRow = {
    id: string | number;
    platform: string;
    hashtag: string;
    post_count: number;
    engagement_avg?: number | null;
    likes_total?: number | null;
    scraped_at?: string | null;
    // Legacy/alternate column names
    avg_engagement?: number | null;
    total_engagement?: number | null;
    last_seen_at?: string | null;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform'); // 'instagram' | 'tiktok' | null (all)
        const type = searchParams.get('type') || 'hashtags'; // 'hashtags' | 'content' | 'dashboard'
        const limit = parseInt(searchParams.get('limit') || '10');

        if (type === 'hashtags') {
            // Buscar hashtags trending
            let query = supabase
                .from('trending_hashtags')
                .select('id, platform, hashtag, post_count, engagement_avg, likes_total, scraped_at')
                .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('engagement_avg', { ascending: false })
                .limit(limit);

            if (platform) {
                query = query.eq('platform', platform);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Mapear para formato esperado pelo componente
            const mappedData = ((data as TrendingHashtagRow[]) || []).map(item => ({
                ...item,
                engagement_avg: item.engagement_avg ?? item.avg_engagement,
                likes_total: item.likes_total ?? item.total_engagement,
                scraped_at: item.scraped_at ?? item.last_seen_at
            }));

            return NextResponse.json({
                success: true,
                type: 'hashtags',
                platform: platform || 'all',
                data: mappedData,
                count: mappedData.length
            });
        }

        if (type === 'content') {
            // Buscar conteúdo trending
            let query = supabase
                .from('trending_content')
                .select(`
          *,
          trending_hashtags!inner(hashtag)
        `)
                .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('likes_count', { ascending: false })
                .limit(limit);

            if (platform) {
                query = query.eq('platform', platform);
            }

            const { data, error } = await query;

            if (error) throw error;

            return NextResponse.json({
                success: true,
                type: 'content',
                platform: platform || 'all',
                data: data || [],
                count: data?.length || 0
            });
        }

        // Buscar dashboard completo
        const [hashtagsRes, contentRes, logsRes] = await Promise.all([
            supabase
                .from('trending_hashtags')
                .select('id, platform, hashtag, post_count, engagement_avg, likes_total, scraped_at')
                .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('engagement_avg', { ascending: false })
                .limit(20),
            supabase
                .from('trending_content')
                .select('*, trending_hashtags!inner(hashtag)')
                .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('likes_count', { ascending: false })
                .limit(10),
            supabase
                .from('scraping_logs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(5)
        ]);

        // Mapear hashtags para formato esperado
        const mappedHashtags = ((hashtagsRes.data as TrendingHashtagRow[]) || []).map(item => ({
            ...item,
            engagement_avg: item.engagement_avg ?? item.avg_engagement,
            likes_total: item.likes_total ?? item.total_engagement,
            scraped_at: item.scraped_at ?? item.last_seen_at
        }));

        return NextResponse.json({
            success: true,
            type: 'dashboard',
            data: {
                hashtags: mappedHashtags,
                content: contentRes.data || [],
                logs: logsRes.data || []
            }
        });
    } catch (error) {
        console.error('Trends API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch trends' },
            { status: 500 }
        );
    }
}
