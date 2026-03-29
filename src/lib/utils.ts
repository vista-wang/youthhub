import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/database";

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
  return posts?.map(transformPostWithAuthor) || [];
}

export function transformCommentsWithAuthor(comments: SupabaseCommentResponse[] | null): CommentWithAuthor[] {
  return comments?.map(transformCommentWithAuthor) || [];
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "刚刚";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}天前`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}周前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

const DEFAULT_SENSITIVE_WORDS: Array<{ word: string; replacement: string }> = [
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
  const foundWords: string[] = [];
  let filteredText = text;

  for (const { word, replacement } of DEFAULT_SENSITIVE_WORDS) {
    if (text.includes(word)) {
      foundWords.push(word);
      filteredText = filteredText.split(word).join(replacement);
    }
  }

  return {
    hasSensitiveWords: foundWords.length > 0,
    filteredText,
    foundWords,
  };
}

export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: "用户名不能为空" };
  }

  if (username.length < 2 || username.length > 20) {
    return { isValid: false, error: "用户名长度需要在2-20个字符之间" };
  }

  const usernameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
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

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
