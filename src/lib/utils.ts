import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { checkContentWithDFA as dfaCheck } from "@/lib/algorithms";

export { transformPostWithAuthor, transformCommentWithAuthor, transformPostsWithAuthor, transformCommentsWithAuthor } from "./transforms";
export { validateUsername, validatePostContent, validateCommentContent } from "./validators";
export { formatRelativeTime, truncateText } from "./formatters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  for (let i = 0, len = postKeywords.length; i < len; i++) {
    const pk = postKeywords[i];
    const weight = userKeywordWeights.get(pk.keyword);
    if (weight) {
      const postId = pk.post_id;
      let currentScore = postScores.get(postId);
      if (currentScore === undefined) {
        currentScore = 0;
      }
      postScores.set(postId, currentScore + weight * pk.relevance);
    }
  }

  return postScores;
}

export function getTopPostIds(
  postScores: Map<string, number>,
  limit: number
): string[] {
  const entries = Array.from(postScores.entries());
  entries.sort((a, b) => b[1] - a[1]);
  const result: string[] = [];
  const end = Math.min(limit, entries.length);
  for (let i = 0; i < end; i++) {
    result[i] = entries[i][0];
  }
  return result;
}

export function compareNumbers(a: number, b: number): number {
  return (a > b) | -(a < b);
}
