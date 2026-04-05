import type { PostWithAuthor } from "@/types/database";

interface PostFeatures {
  id: string;
  likesCount: number;
  commentsCount: number;
  hoursSinceCreation: number;
  titleLength: number;
  contentLength: number;
  hasLongContent: boolean;
}

interface ScoredPost extends PostWithAuthor {
  _score: number;
  _scoreBreakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  recencyScore: number;
  engagementScore: number;
  contentQualityScore: number;
  total: number;
}

interface RecommendationConfig {
  weights: {
    recency: number;
    engagement: number;
    contentQuality: number;
  };
  timeDecayHalfLife: number;
  maxPostsToScore: number;
  enableCache: boolean;
  cacheTTL: number;
}

const DEFAULT_CONFIG: RecommendationConfig = {
  weights: {
    recency: 0.35,
    engagement: 0.45,
    contentQuality: 0.20,
  },
  timeDecayHalfLife: 24,
  maxPostsToScore: 100,
  enableCache: true,
  cacheTTL: 60 * 1000,
};

class RecommendationEngine {
  private config: RecommendationConfig;
  private scoreCache: Map<string, { score: number; breakdown: ScoreBreakdown; timestamp: number }> = new Map();
  private featureCache: Map<string, { features: PostFeatures; timestamp: number }> = new Map();

  constructor(config?: Partial<RecommendationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(partial: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...partial };
    if (!partial.enableCache) {
      this.clearCache();
    }
  }

  extractFeatures(post: PostWithAuthor): PostFeatures {
    const cached = this.featureCache.get(post.id);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.features;
    }

    const now = Date.now();
    const createdAt = new Date(post.created_at).getTime();
    const hoursSinceCreation = Math.max(1, (now - createdAt) / (1000 * 60 * 60));

    const features: PostFeatures = {
      id: post.id,
      likesCount: post.likes_count || 0,
      commentsCount: post.comments_count || 0,
      hoursSinceCreation,
      titleLength: post.title?.length || 0,
      contentLength: post.content?.length || 0,
      hasLongContent: (post.content?.length || 0) > 200,
    };

    if (this.config.enableCache) {
      this.featureCache.set(post.id, { features, timestamp: now });
    }

    return features;
  }

  calculateRecencyScore(hoursAgo: number): number {
    const halfLife = this.config.timeDecayHalfLife;
    return Math.pow(0.5, hoursAgo / halfLife);
  }

  calculateEngagementScore(likes: number, comments: number): number {
    const normalizedLikes = Math.min(likes / 50, 1);
    const normalizedComments = Math.min(comments / 20, 1);
    
    const likeWeight = 0.6;
    const commentWeight = 0.4;

    return normalizedLikes * likeWeight + normalizedComments * commentWeight;
  }

  calculateContentQualityScore(
    titleLen: number,
    contentLen: number,
    hasLongContent: boolean
  ): number {
    let score = 0;

    const optimalTitleRange = [5, 40];
    if (titleLen >= optimalTitleRange[0] && titleLen <= optimalTitleRange[1]) {
      score += 0.4;
    } else if (titleLen > 1 && titleLen < 80) {
      score += 0.2;
    }

    if (contentLen >= 20 && contentLen <= 2000) {
      score += 0.3;
    } else if (contentLen >= 10 && contentLen <= 5000) {
      score += 0.15;
    }

    if (hasLongContent) {
      score += 0.3;
    } else if (contentLen >= 30) {
      score += 0.15;
    }

    return Math.min(score, 1);
  }

  scorePost(post: PostWithAuthor): ScoredPost {
    const cached = this.scoreCache.get(post.id);
    if (
      cached &&
      this.config.enableCache &&
      Date.now() - cached.timestamp < this.config.cacheTTL
    ) {
      return { ...post, _score: cached.score, _scoreBreakdown: cached.breakdown };
    }

    const features = this.extractFeatures(post);

    const recencyScore = this.calculateRecencyScore(features.hoursSinceCreation);
    const engagementScore = this.calculateEngagementScore(
      features.likesCount,
      features.commentsCount
    );
    const contentQualityScore = this.calculateContentQualityScore(
      features.titleLength,
      features.contentLength,
      features.hasLongContent
    );

    const total =
      recencyScore * this.config.weights.recency +
      engagementScore * this.config.weights.engagement +
      contentQualityScore * this.config.weights.contentQuality;

    const breakdown: ScoreBreakdown = {
      recencyScore,
      engagementScore,
      contentQualityScore,
      total,
    };

    if (this.config.enableCache) {
      this.scoreCache.set(post.id, { score: total, breakdown, timestamp: Date.now() });
    }

    return { ...post, _score: total, _scoreBreakdown: breakdown };
  }

  rankPosts(posts: PostWithAuthor[], limit?: number): ScoredPost[] {
    const postsToProcess = posts.slice(0, this.config.maxPostsToScore);

    const scoredPosts = postsToProcess.map((post) => this.scorePost(post));

    scoredPosts.sort((a, b) => b._score - a._score);

    return limit ? scoredPosts.slice(0, limit) : scoredPosts;
  }

  getHotPosts(posts: PostWithAuthor[], limit?: number): ScoredPost[] {
    const hotConfig: Partial<RecommendationConfig> = {
      weights: {
        recency: 0.15,
        engagement: 0.70,
        contentQuality: 0.15,
      },
      timeDecayHalfLife: 12,
    };

    const hotEngine = new RecommendationEngine({ ...this.config, ...hotConfig });
    return hotEngine.rankPosts(posts, limit);
  }

  recommendForUser(
    posts: PostWithAuthor[],
    userKeywords: string[],
    userLikedIds: Set<string>,
    limit?: number
  ): ScoredPost[] {
    const keywordSet = new Set(userKeywords.map((k) => k.toLowerCase()));

    const enrichedPosts = posts.map((post) => {
      const baseScored = this.scorePost(post);

      let keywordBonus = 0;
      const postText = `${post.title} ${post.content}`.toLowerCase();

      for (const keyword of keywordSet) {
        if (postText.includes(keyword)) {
          keywordBonus += 0.15;
        }
      }
      keywordBonus = Math.min(keywordBonus, 0.3);

      const isLiked = userLikedIds.has(post.id);
      const likedPenalty = isLiked ? -0.1 : 0;

      const adjustedScore = Math.max(
        0,
        Math.min(1, baseScored._score + keywordBonus + likedPenalty)
      );

      return {
        ...baseScored,
        _score: adjustedScore,
        _scoreBreakdown: {
          ...baseScored._scoreBreakdown,
          total: adjustedScore,
        },
      };
    });

    enrichedPosts.sort((a, b) => b._score - a._score);

    return limit ? enrichedPosts.slice(0, limit) : enrichedPosts;
  }

  clearCache(): void {
    this.scoreCache.clear();
    this.featureCache.clear();
  }

  getCacheStats(): {
    scoreCacheSize: number;
    featureCacheSize: number;
  } {
    return {
      scoreCacheSize: this.scoreCache.size,
      featureCacheSize: this.featureCache.size,
    };
  }
}

let engineInstance: RecommendationEngine | null = null;

export function getRecommendationEngine(config?: Partial<RecommendationConfig>): RecommendationEngine {
  if (!engineInstance) {
    engineInstance = new RecommendationEngine(config);
  } else if (config) {
    engineInstance.updateConfig(config);
  }
  return engineInstance;
}

export function rankPosts(posts: PostWithAuthor[], limit?: number): PostWithAuthor[] {
  const engine = getRecommendationEngine();
  return engine.rankPosts(posts, limit).map(({ _score, _scoreBreakdown, ...post }) => post);
}

export function getHotPosts(posts: PostWithAuthor[], limit?: number): PostWithAuthor[] {
  const engine = getRecommendationEngine();
  return engine.getHotPosts(posts, limit).map(({ _score, _scoreBreakdown, ...post }) => post);
}

export function recommendForUser(
  posts: PostWithAuthor[],
  userKeywords: string[],
  userLikedIds: Set<string>,
  limit?: number
): PostWithAuthor[] {
  const engine = getRecommendationEngine();
  return engine.recommendForUser(posts, userKeywords, userLikedIds, limit)
    .map(({ _score, _scoreBreakdown, ...post }) => post);
}
