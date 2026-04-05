import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PostWithAuthor, CommentWithAuthor, SensitiveWord } from "@/types/database";
import { checkContentWithDFA as dfaCheck, getFilterInstance } from "@/lib/algorithms";
import { rankPosts, getHotPosts, recommendForUser } from "@/lib/algorithms";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SupabasePostResponse {
  id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

interface SupabaseCommentResponse {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author_id: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  } | null;
}

export function transformPostWithAuthor(post: SupabasePostResponse): PostWithAuthor {
  return {
    ...post,
    author_name: post.profiles?.username || "匿名用户",
    author_avatar: post.profiles?.avatar_url || null,
  };
}

export function transformCommentWithAuthor(comment: SupabaseCommentResponse): CommentWithAuthor {
  return {
    ...comment,
    author_name: comment.profiles?.username || "匿名用户",
    author_avatar: comment.profiles?.avatar_url || null,
  };
}

export function transformPostsWithAuthor(posts: SupabasePostResponse[] | null): PostWithAuthor[] {
  if (!posts || posts.length === 0) return [];
  const result = new Array<PostWithAuthor>(posts.length);
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (post) {
      result[i] = transformPostWithAuthor(post);
    }
  }
  return result;
}

export function transformCommentsWithAuthor(comments: SupabaseCommentResponse[] | null): CommentWithAuthor[] {
  if (!comments || comments.length === 0) return [];
  const result = new Array<CommentWithAuthor>(comments.length);
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    if (comment) {
      result[i] = transformCommentWithAuthor(comment);
    }
  }
  return result;
}

const TIME_UNITS: ReadonlyArray<{ unit: string; value: number; text?: string }> = [
  { unit: "秒", value: 60, text: "刚刚" },
  { unit: "分钟", value: 60 },
  { unit: "小时", value: 24 },
  { unit: "天", value: 7 },
  { unit: "周", value: 4 },
  { unit: "个月", value: 12 },
];

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString).getTime();
  const now = Date.now();
  let diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < TIME_UNITS[0]!.value) return TIME_UNITS[0]?.text || "刚刚";

  for (let i = 1; i < TIME_UNITS.length; i++) {
    const prevUnit = TIME_UNITS[i - 1];
    const currentUnit = TIME_UNITS[i];
    if (!prevUnit || !currentUnit) break;
    
    diffInSeconds = Math.floor(diffInSeconds / prevUnit.value);
    if (diffInSeconds < currentUnit.value) {
      return `${diffInSeconds}${currentUnit.unit}前`;
    }
  }

  const years = Math.floor(diffInSeconds / 12);
  return `${years}年前`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

const DEFAULT_SENSITIVE_WORDS: ReadonlyArray<{ word: string; replacement: string }> = [
  { word: "测试敏感词1", replacement: "***" },
  { word: "测试敏感词2", replacement: "***" },
  { word: "广告", replacement: "[广告]" },
  { word: "加微信", replacement: "***" },
  { word: "刷单", replacement: "***" },
];

export function checkSensitiveWords(text: string): {
  hasSensitiveWords: boolean;
  filteredText: string;
  foundWords: string[];
} {
  const result = dfaCheck(text);
  
  return {
    hasSensitiveWords: result.hasSensitiveWords,
    filteredText: result.filteredText,
    foundWords: result.matches.map((m) => m.word),
  };
}

export function checkSensitiveWordsWithDetail(text: string) {
  return dfaCheck(text);
}

const USERNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: "用户名不能为空" };
  }

  const len = username.length;
  if (len < 2 || len > 20) {
    return { isValid: false, error: "用户名长度需要在2-20个字符之间" };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: "用户名只能包含中文、字母、数字和下划线",
    };
  }

  return { isValid: true };
}

export function validatePostContent(
  title: string,
  content: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push("标题不能为空");
  } else if (title.length > 100) {
    errors.push("标题不能超过100个字符");
  }

  if (!content || content.trim().length === 0) {
    errors.push("内容不能为空");
  } else if (content.length > 5000) {
    errors.push("内容不能超过5000个字符");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCommentContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: "评论内容不能为空" };
  }

  if (content.length > 500) {
    return { isValid: false, error: "评论内容不能超过500个字符" };
  }

  return { isValid: true };
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

export function calculatePostScores(
  postKeywords: Array<{ post_id: string; keyword: string; relevance: number }>,
  userKeywordWeights: Map<string, number>
): Map<string, number> {
  const postScores = new Map<string, number>();

  for (const pk of postKeywords) {
    const weight = userKeywordWeights.get(pk.keyword);
    if (weight) {
      const currentScore = postScores.get(pk.post_id) || 0;
      postScores.set(pk.post_id, currentScore + weight * pk.relevance);
    }
  }

  return postScores;
}

export function getTopPostIds(
  postScores: Map<string, number>,
  limit: number
): string[] {
  return Array.from(postScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export function rankPostsOptimized(posts: PostWithAuthor[], limit?: number): PostWithAuthor[] {
  return rankPosts(posts, limit);
}

export function getHotPostsOptimized(posts: PostWithAuthor[], limit?: number): PostWithAuthor[] {
  return getHotPosts(posts, limit);
}

export function recommendPostsForUser(
  posts: PostWithAuthor[],
  keywords: string[],
  likedPostIds: Set<string>,
  limit?: number
): PostWithAuthor[] {
  return recommendForUser(posts, keywords, likedPostIds, limit);
}
