import { supabase } from './supabase';

export interface Post {
    id: string;
    created_at: string;
    midia_tipo: 'video' | 'imagem';
    post_tipo: 'unica' | 'carrossel';
    texto_instagram?: string;
    texto_facebook?: string;
    texto_x?: string;
    texto_tiktok?: string;
    texto_youtube?: string;
    // Legacy fields (kept for compatibility with old records if needed)
    texto_instagram_facebook?: string;
    texto_x_threads_tiktok?: string;
    texto_linkedin?: string;
    dias_agendamento?: string[];
    horario_agendamento?: string;
    postar_agora: boolean;
    arquivos: { url: string; name: string }[];
    postado_em_todas: boolean;
    status_detalhado: Record<string, string>;
    plataformas?: string[];
}

export interface CreatePostData {
    files: File[];
    textInstagram: string;
    textFacebook: string;
    textYoutube: string;
    textX: string;
    textTiktok: string;
    mediaType: 'video' | 'imagem';
    postType: 'unica' | 'carrossel';
    scheduleDays?: string[];
    scheduleTime?: string;
    postNow?: boolean;
    platforms: string[];
}

export interface TrendSignal {
    id: string;
    platform: string;
    type: string;
    value: string;
    score: number;
    growth: number;
    time_window: string;
    computed_at: string;
}

export interface TrendSignalQuery {
    types?: string[];
    platforms?: string[];
    timeWindow?: string;
    limit?: number;
}

// Upload de arquivo para o Bucket 'Postagens'
export async function uploadFile(file: File): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;

    const { error } = await supabase.storage
        .from('Postagens')
        .upload(fileName, file, {
            upsert: true
        });

    if (error) {
        throw new Error(`Storage error: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('Postagens')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

export async function createPost(postData: CreatePostData): Promise<Post | null> {
    try {
        // 1. Upload dos arquivos
        const uploadedFiles: { url: string; name: string }[] = [];

        for (const file of postData.files) {
            const url = await uploadFile(file);
            uploadedFiles.push({ url, name: file.name });
        }

        // 2. Preparar dados para o banco
        const newPost = {
            midia_tipo: postData.mediaType,
            post_tipo: postData.postType,
            texto_instagram: postData.textInstagram,
            texto_facebook: postData.textFacebook,
            texto_youtube: postData.textYoutube,
            texto_x: postData.textX,
            texto_tiktok: postData.textTiktok,
            // Fallback for legacy columns (optional: can be removed if strictly using new cols)
            texto_instagram_facebook: postData.textInstagram,
            texto_x_threads_tiktok: postData.textTiktok,
            dias_agendamento: postData.scheduleDays || [],
            horario_agendamento: postData.scheduleTime || '18:30',
            postar_agora: postData.postNow || false,
            arquivos: uploadedFiles,
            postado_em_todas: false,
            status_detalhado: {}, // Sempre inicia vazio para N8N Enterprise controlar
            plataformas: postData.platforms,
        };

        // 3. Inserir no Supabase (não precisa de API Route se os Policies estiverem configurados)
        const { data, error } = await supabase
            .from('posts')
            .insert(newPost)
            .select()
            .single();

        if (error) {
            console.error('Supabase DB Insert Error:', error);
            throw error;
        }

        // 4. Se for para postar agora, dispara o webhook do N8N (via Proxy API para evitar CORS)
        if (postData.postNow) {
            fetch('/api/trigger-n8n', { method: 'POST' })
                .catch(err => console.error('Failed to trigger background webhook:', err));
        }

        return data as Post;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
}

export async function getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    return data as Post[];
}

export async function getPendingPosts(): Promise<Post[]> {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('postado_em_todas', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending posts:', error);
        return [];
    }

    return data as Post[];
}

export async function deletePost(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting post:', error);
        throw error;
    }

    return true;
}

export async function deleteAllPosts(): Promise<boolean> {
    const { error } = await supabase
        .from('posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
        console.error('Error deleting all posts:', error);
        throw error;
    }

    return true;
}

export async function getTrendSignals(query: TrendSignalQuery = {}): Promise<TrendSignal[]> {
    const { types, platforms, timeWindow, limit = 200 } = query;
    let builder = supabase
        .from('trend_signals')
        .select('*')
        .order('computed_at', { ascending: false })
        .limit(limit);

    if (types && types.length > 0) {
        builder = builder.in('type', types);
    }

    if (platforms && platforms.length > 0) {
        builder = builder.in('platform', platforms);
    }

    if (timeWindow && timeWindow !== 'all') {
        builder = builder.eq('time_window', timeWindow);
    }

    const { data, error } = await builder;

    if (error) {
        console.error('Error fetching trend signals:', error);
        return [];
    }

    return data as TrendSignal[];
}
