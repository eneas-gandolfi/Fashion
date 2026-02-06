// ============================================
// ANALYTICS HELPER FUNCTIONS
// ============================================

export interface PostMetrics {
    likes: number;
    comments: number;
    shares?: number;
    views?: number;
}

export interface SocialPost {
    id: string;
    platform: 'instagram' | 'tiktok';
    text: string;
    hashtags: string[];
    metrics: PostMetrics;
    published_at: string;
    raw?: {
        author?: {
            follower_count?: number;
        };
        content_type?: string;
        posting_hour?: number;
    };
}

export interface SentimentResult {
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
}

export interface TimeSlot {
    hour: number;
    avgEngagement: number;
    postCount: number;
}

/**
 * Calculate engagement rate for a post
 * Formula: (likes + comments + shares) / followers * 100
 */
export function calculateEngagementRate(
    metrics: PostMetrics,
    followerCount: number
): number {
    if (followerCount === 0) return 0;

    const totalEngagement =
        (metrics.likes || 0) +
        (metrics.comments || 0) +
        (metrics.shares || 0);

    return Number(((totalEngagement / followerCount) * 100).toFixed(2));
}

/**
 * Calculate normalized performance score (0-100)
 * Considers engagement rate, virality, and content quality
 */
export function calculatePerformanceScore(post: SocialPost): number {
    const followerCount = post.raw?.author?.follower_count || 1;
    const engagementRate = calculateEngagementRate(post.metrics, followerCount);

    // Engagement score (max 50 points)
    const engagementScore = Math.min(engagementRate * 5, 50);

    // Virality score (max 30 points) - based on views/likes ratio
    let viralityScore = 0;
    if (post.metrics.views && post.metrics.likes) {
        const viralityRatio = post.metrics.likes / post.metrics.views;
        viralityScore = Math.min(viralityRatio * 300, 30);
    }

    // Content quality score (max 20 points) - based on hashtags and text length
    let qualityScore = 0;
    if (post.hashtags && post.hashtags.length > 0) qualityScore += 10;
    if (post.text && post.text.length > 50) qualityScore += 10;

    const totalScore = engagementScore + viralityScore + qualityScore;
    return Math.round(Math.min(totalScore, 100));
}

/**
 * Calculate virality score (0-100)
 * Detects exponential growth patterns
 */
export function calculateViralityScore(post: SocialPost): number {
    const { likes = 0, views = 0, shares = 0 } = post.metrics;

    if (views === 0) return 0;

    // Viral indicators
    const likeToViewRatio = likes / views;
    const shareToLikeRatio = shares / (likes || 1);

    // High like-to-view ratio (>5%) indicates virality
    const likeScore = Math.min(likeToViewRatio * 2000, 50);

    // High share-to-like ratio (>10%) indicates strong virality
    const shareScore = Math.min(shareToLikeRatio * 500, 50);

    return Math.round(likeScore + shareScore);
}

/**
 * Simple keyword-based sentiment analysis
 * Returns sentiment, confidence, and detected emotions
 */
export function analyzeSentiment(text: string): SentimentResult {
    if (!text) {
        return { sentiment: 'neutral', confidence: 0.5, emotions: [] };
    }

    const lowerText = text.toLowerCase();

    // Positive keywords
    const positiveKeywords = [
        'amor', 'love', 'incrível', 'amazing', 'perfeito', 'perfect',
        'lindo', 'beautiful', 'maravilhoso', 'wonderful', 'feliz', 'happy',
        'ótimo', 'great', 'excelente', 'excellent', 'adorei', 'loved'
    ];

    // Negative keywords
    const negativeKeywords = [
        'ruim', 'bad', 'péssimo', 'terrible', 'horrível', 'horrible',
        'ódio', 'hate', 'triste', 'sad', 'decepção', 'disappointed'
    ];

    // Positive emojis
    const positiveEmojis = ['❤️', '😍', '🔥', '✨', '💖', '😊', '🥰', '👏'];
    const negativeEmojis = ['😢', '😭', '😡', '💔', '😞'];

    let positiveCount = 0;
    let negativeCount = 0;

    // Count keyword matches
    positiveKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) positiveCount++;
    });

    negativeKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) negativeCount++;
    });

    // Count emoji matches
    positiveEmojis.forEach(emoji => {
        if (text.includes(emoji)) positiveCount++;
    });

    negativeEmojis.forEach(emoji => {
        if (text.includes(emoji)) negativeCount++;
    });

    const totalCount = positiveCount + negativeCount;

    if (totalCount === 0) {
        return { sentiment: 'neutral', confidence: 0.5, emotions: [] };
    }

    if (positiveCount > negativeCount) {
        const confidence = Number((positiveCount / totalCount).toFixed(2));
        return {
            sentiment: 'positive',
            confidence,
            emotions: ['joy', 'love']
        };
    } else if (negativeCount > positiveCount) {
        const confidence = Number((negativeCount / totalCount).toFixed(2));
        return {
            sentiment: 'negative',
            confidence,
            emotions: ['anger', 'sadness']
        };
    }

    return { sentiment: 'neutral', confidence: 0.5, emotions: [] };
}

/**
 * Find best posting times based on historical data
 * Returns top 5 time slots with highest engagement
 */
export function findBestPostingTimes(posts: SocialPost[]): TimeSlot[] {
    const hourlyData = new Map<number, { totalEngagement: number; count: number }>();

    posts.forEach(post => {
        const hour = post.raw?.posting_hour ?? new Date(post.published_at).getHours();
        const followerCount = post.raw?.author?.follower_count || 1;
        const engagementRate = calculateEngagementRate(post.metrics, followerCount);

        if (!hourlyData.has(hour)) {
            hourlyData.set(hour, { totalEngagement: 0, count: 0 });
        }

        const data = hourlyData.get(hour)!;
        data.totalEngagement += engagementRate;
        data.count += 1;
    });

    const timeSlots: TimeSlot[] = [];

    hourlyData.forEach((data, hour) => {
        timeSlots.push({
            hour,
            avgEngagement: Number((data.totalEngagement / data.count).toFixed(2)),
            postCount: data.count
        });
    });

    return timeSlots
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 5);
}

/**
 * Extract key topics from text using hashtags and keywords
 */
export function extractTopics(text: string, hashtags: string[]): string[] {
    const topics = new Set<string>();

    // Add hashtags as topics
    hashtags.forEach(tag => {
        if (tag.length > 2) {
            topics.add(tag.toLowerCase());
        }
    });

    // Common fashion keywords
    const fashionKeywords = [
        'moda', 'fashion', 'estilo', 'style', 'look', 'outfit',
        'tendência', 'trend', 'roupa', 'clothes', 'acessório', 'accessory'
    ];

    const lowerText = text.toLowerCase();
    fashionKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            topics.add(keyword);
        }
    });

    return Array.from(topics).slice(0, 10);
}

/**
 * Format number with K/M suffix
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Calculate growth percentage
 */
export function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
}
