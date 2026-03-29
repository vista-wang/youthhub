import type { SensitiveWord } from "@/types/database";

interface SensitiveWordMatch {
  word: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  replacement: string;
  positions: number[];
}

interface ContentCheckResult {
  isValid: boolean;
  hasSensitiveWords: boolean;
  filteredText: string;
  matches: SensitiveWordMatch[];
  maxSeverity: "low" | "medium" | "high" | "critical" | null;
  blockedReason: string | null;
}

const DEFAULT_SENSITIVE_WORDS: SensitiveWord[] = [
  { id: "1", word: "测试敏感词1", category: "general", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "2", word: "测试敏感词2", category: "general", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "3", word: "广告", category: "spam", severity: "low", replacement: "[广告]", is_active: true, created_at: "", updated_at: "" },
  { id: "4", word: "加微信", category: "spam", severity: "high", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "5", word: "刷单", category: "fraud", severity: "critical", replacement: "***", is_active: true, created_at: "", updated_at: "" },
];

let cachedWords: SensitiveWord[] | null = null;
let cacheExpiry = 0;

export async function getSensitiveWords(): Promise<SensitiveWord[]> {
  const now = Date.now();
  
  if (cachedWords && now < cacheExpiry) {
    return cachedWords;
  }

  try {
    const response = await fetch("/api/sensitive-words");
    if (response.ok) {
      const data = await response.json();
      cachedWords = data.words;
      cacheExpiry = now + 5 * 60 * 1000;
      return cachedWords || DEFAULT_SENSITIVE_WORDS;
    }
  } catch (error) {
    console.error("Failed to fetch sensitive words:", error);
  }

  return DEFAULT_SENSITIVE_WORDS;
}

export function checkContentWithWords(
  text: string,
  words: SensitiveWord[]
): ContentCheckResult {
  const matches: SensitiveWordMatch[] = [];
  let filteredText = text;
  let maxSeverity: "low" | "medium" | "high" | "critical" | null = null;

  const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

  for (const wordInfo of words) {
    if (!wordInfo.word) continue;

    const regex = new RegExp(escapeRegExp(wordInfo.word), "gi");
    const positions: number[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      positions.push(match.index);
    }

    if (positions.length > 0) {
      matches.push({
        word: wordInfo.word,
        category: wordInfo.category,
        severity: wordInfo.severity,
        replacement: wordInfo.replacement,
        positions,
      });

      filteredText = filteredText.split(new RegExp(escapeRegExp(wordInfo.word), "gi")).join(wordInfo.replacement);

      if (!maxSeverity || severityOrder[wordInfo.severity] > severityOrder[maxSeverity]) {
        maxSeverity = wordInfo.severity;
      }
    }
  }

  const hasCriticalWords = matches.some((m) => m.severity === "critical");
  const hasHighSeverityWords = matches.some((m) => m.severity === "high");

  let blockedReason: string | null = null;
  if (hasCriticalWords) {
    blockedReason = "内容包含违规信息，禁止发布";
  } else if (hasHighSeverityWords) {
    blockedReason = "内容包含敏感信息，请修改后重试";
  }

  return {
    isValid: !hasCriticalWords && !hasHighSeverityWords,
    hasSensitiveWords: matches.length > 0,
    filteredText,
    matches,
    maxSeverity,
    blockedReason,
  };
}

export async function checkContent(text: string): Promise<ContentCheckResult> {
  const words = await getSensitiveWords();
  return checkContentWithWords(text, words);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个",
    "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好",
    "自己", "这", "那", "什么", "他", "她", "它", "们", "这个", "那个", "怎么",
    "可以", "因为", "所以", "但是", "如果", "还是", "或者", "而且", "虽然",
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "this", "that", "these", "those", "i", "you", "he", "she", "it", "we",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !stopWords.has(word));

  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}
