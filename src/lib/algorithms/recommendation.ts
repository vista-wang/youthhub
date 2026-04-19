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

const HOURS_TO_MS = 1000 * 60 * 60;
const LIKE_WEIGHT = 0.6;
const COMMENT_WEIGHT = 0.4;
const NORMALIZE_LIKES_MAX = 50;
const NORMALIZE_COMMENTS_MAX = 20;
const MIN_TITLE = 5;
const MAX_TITLE = 40;
const CONTENT_MIN_OPTIMAL = 20;
const CONTENT_MAX_OPTIMAL = 2000;
const CONTENT_MIN_BASIC = 10;
const CONTENT_MAX_BASIC = 5000;
const LONG_CONTENT_THRESHOLD = 200;
const LONG_CONTENT_SCORE = 0.3;
const SHORT_CONTENT_SCORE = 0.15;
const OPTIMAL_TITLE_SCORE = 0.4;
const ACCEPTABLE_TITLE_SCORE = 0.2;
const OPTIMAL_CONTENT_SCORE = 0.3;
const ACCEPTABLE_CONTENT_SCORE = 0.15;

interface ScoredIndex {
  index: number;
  score: number;
}

/**
 * Quickselect 算法实现 Top-K 选择
 * 
 * 性能优化策略：
 * - 平均时间复杂度：O(n)
 * - 优化前：使用完整排序 O(n log n)
 * - 优化后：快速选择，仅处理需要的 Top-K
 * - 当 K << n 时性能提升显著
 */
function quickselect(arr: ScoredIndex[], k: number): ScoredIndex[] {
  if (k <= 0) return [];
  if (k >= arr.length) return arr.sort((a, b) => b.score - a.score);
  
  function partition(left: number, right: number): number {
    const pivotScore = arr[right].score;
    let i = left;
    for (let j = left; j < right; j++) {
      if (arr[j].score >= pivotScore) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        i++;
      }
    }
    [arr[i], arr[right]] = [arr[right], arr[i]];
    return i;
  }

  function select(left: number, right: number, kSmallest: number): void {
    if (left === right) return;
    const pivotIndex = partition(left, right);
    if (kSmallest === pivotIndex) {
      return;
    } else if (kSmallest < pivotIndex) {
      select(left, pivotIndex - 1, kSmallest);
    } else {
      select(pivotIndex + 1, right, kSmallest);
    }
  }

  select(0, arr.length - 1, k);
  const topK = arr.slice(0, k);
  topK.sort((a, b) => b.score - a.score);
  return topK;
}

class RecommendationEngine {
  private config: RecommendationConfig;
  private scoreCache: Map<string, { score: number; breakdown: ScoreBreakdown; timestamp: number }> = new Map();
  private featureCache: Map<string, { features: PostFeatures; timestamp: number }> = new Map();
  
  /**
   * 复用临时对象减少 GC 压力
   * 性能优化：避免在 scorePost 中频繁创建新对象
   */
  private tempScoreBreakdown: ScoreBreakdown = { recencyScore: 0, engagementScore: 0, contentQualityScore: 0, total: 0 };

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
    const hoursSinceCreation = Math.max(1, (now - createdAt) / HOURS_TO_MS);

    const features: PostFeatures = {
      id: post.id,
      likesCount: post.likes_count || 0,
      commentsCount: post.comments_count || 0,
      hoursSinceCreation,
      titleLength: post.title?.length || 0,
      contentLength: post.content?.length || 0,
      hasLongContent: (post.content?.length || 0) > LONG_CONTENT_THRESHOLD,
    };

    if (this.config.enableCache) {
      this.featureCache.set(post.id, { features, timestamp: now });
    }

    return features;
  }

  calculateRecencyScore(hoursAgo: number): number {
    return Math.pow(0.5, hoursAgo / this.config.timeDecayHalfLife);
  }

  calculateEngagementScore(likes: number, comments: number): number {
    const normalizedLikes = Math.min(likes / NORMALIZE_LIKES_MAX, 1);
    const normalizedComments = Math.min(comments / NORMALIZE_COMMENTS_MAX, 1);
    return normalizedLikes * LIKE_WEIGHT + normalizedComments * COMMENT_WEIGHT;
  }

  calculateContentQualityScore(
    titleLen: number,
    contentLen: number,
    hasLongContent: boolean
  ): number {
    let score = 0;

    if (titleLen >= MIN_TITLE && titleLen <= MAX_TITLE) {
      score += OPTIMAL_TITLE_SCORE;
    } else if (titleLen > 1 && titleLen < 80) {
      score += ACCEPTABLE_TITLE_SCORE;
    }

    if (contentLen >= CONTENT_MIN_OPTIMAL && contentLen <= CONTENT_MAX_OPTIMAL) {
      score += OPTIMAL_CONTENT_SCORE;
    } else if (contentLen >= CONTENT_MIN_BASIC && contentLen <= CONTENT_MAX_BASIC) {
      score += ACCEPTABLE_CONTENT_SCORE;
    }

    if (hasLongContent) {
      score += LONG_CONTENT_SCORE;
    } else if (contentLen >= 30) {
      score += SHORT_CONTENT_SCORE;
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

    this.tempScoreBreakdown.recencyScore = recencyScore;
    this.tempScoreBreakdown.engagementScore = engagementScore;
    this.tempScoreBreakdown.contentQualityScore = contentQualityScore;
    this.tempScoreBreakdown.total = total;

    if (this.config.enableCache) {
      this.scoreCache.set(post.id, {
        score: total,
        breakdown: { ...this.tempScoreBreakdown },
        timestamp: Date.now()
      });
    }

    return { ...post, _score: total, _scoreBreakdown: { ...this.tempScoreBreakdown } };
  }

  rankPosts(posts: PostWithAuthor[], limit?: number): ScoredPost[] {
    const postsToProcess = posts.slice(0, this.config.maxPostsToScore);
    
    if (!limit || limit >= postsToProcess.length) {
      const scoredPosts = postsToProcess.map((post) => this.scorePost(post));
      scoredPosts.sort((a, b) => b._score - a._score);
      return scoredPosts;
    }

    const scoredIndices: ScoredIndex[] = [];
    const scoredPosts: ScoredPost[] = [];
    
    for (let i = 0; i < postsToProcess.length; i++) {
      const post = postsToProcess[i];
      const scored = this.scorePost(post);
      scoredPosts.push(scored);
      scoredIndices.push({ index: i, score: scored._score });
    }

    const topKIndices = quickselect(scoredIndices, limit);
    return topKIndices.map(idx => scoredPosts[idx.index]);
  }

  getHotPosts(posts: PostWithAuthor[], limit?: number): ScoredPost[] {
    const originalConfig = { ...this.config };
    
    this.config.weights = {
      recency: 0.15,
      engagement: 0.70,
      contentQuality: 0.15,
    };
    this.config.timeDecayHalfLife = 12;
    
    const result = this.rankPosts(posts, limit);
    
    this.config = originalConfig;
    
    return result;
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

    if (!limit || limit >= enrichedPosts.length) {
      enrichedPosts.sort((a, b) => b._score - a._score);
      return enrichedPosts;
    }

    const scoredIndices: ScoredIndex[] = enrichedPosts.map((post, index) => ({
      index,
      score: post._score
    }));

    const topKIndices = quickselect(scoredIndices, limit);
    return topKIndices.map(idx => enrichedPosts[idx.index]);
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

  benchmark(posts: PostWithAuthor[], iterations: number = 100, limit?: number): {
    avgTime: number;
    minTime: number;
    maxTime: number;
    iterations: number;
  } {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      this.rankPosts(posts, limit);
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      avgTime,
      minTime,
      maxTime,
      iterations
    };
  }
}

/**
 * 单例模式，避免重复创建推荐引擎实例
 * 性能优化：
 * - 优化前：每次调用 getHotPosts 时创建新实例，重复构建缓存
 * - 优化后：全局唯一实例，复用缓存
 */
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
