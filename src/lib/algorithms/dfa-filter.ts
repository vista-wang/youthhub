import type { SensitiveWord } from "@/types/database";

interface TrieNode {
  children: Record<string, TrieNode>;
  wordEnd: boolean;
  wordInfo: SensitiveWord | null;
  fail: TrieNode | null;
  output: SensitiveWord[];
}

interface MatchResult {
  word: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  replacement: string;
  start: number;
  end: number;
}

interface FilterResult {
  isValid: boolean;
  hasSensitiveWords: boolean;
  filteredText: string;
  matches: MatchResult[];
  maxSeverity: "low" | "medium" | "high" | "critical" | null;
  blockedReason: string | null;
  stats: {
    scanTimeMs: number;
    matchCount: number;
    wordsChecked: number;
  };
}

interface Replacement {
  start: number;
  replacement: string;
  length: number;
}

function getSeverityValue(severity: string): number {
  switch (severity) {
    case "low": return 1;
    case "medium": return 2;
    case "high": return 3;
    case "critical": return 4;
    default: return 0;
  }
}

class DFASensitiveWordFilter {
  private root: TrieNode;
  private built: boolean = false;
  private wordCount: number = 0;
  private lastBuildTime: number = 0;
  private cacheVersion: number = 0;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode {
    return {
      children: {},
      wordEnd: false,
      wordInfo: null,
      fail: null,
      output: [],
    };
  }

  build(words: SensitiveWord[]): void {
    const startTime = performance.now();
    
    const root = this.createNode();
    let validCount = 0;

    for (const wordInfo of words) {
      if (!wordInfo.word || !wordInfo.is_active) continue;

      let node = root;
      const word = wordInfo.word;
      const len = word.length;

      for (let i = 0; i < len; i++) {
        const char = word[i]!;
        if (!node.children[char]) {
          node.children[char] = this.createNode();
        }
        node = node.children[char];
      }

      node.wordEnd = true;
      node.wordInfo = wordInfo;
      node.output.push(wordInfo);
      validCount++;
    }

    this.buildFailLinks(root);
    
    this.root = root;
    this.built = true;
    this.wordCount = validCount;
    this.lastBuildTime = performance.now() - startTime;
    this.cacheVersion++;
  }

  /**
   * 构建 Aho-Corasick 自动机的失败链接
   * 
   * 性能优化策略：
   * - 使用索引 `front` 替代 `Array.shift()`，避免 O(n) 时间复杂度
   * - 优化前：每次出队需要移动数组元素，总时间 O(n²)
   * - 优化后：通过索引指针直接访问，总时间 O(n)
   */
  private buildFailLinks(root: TrieNode): void {
    const queue: TrieNode[] = [];
    let front = 0;
    root.fail = root;

    for (const char in root.children) {
      if (Object.prototype.hasOwnProperty.call(root.children, char)) {
        const child = root.children[char]!;
        child.fail = root;
        queue.push(child);
      }
    }

    while (front < queue.length) {
      const current = queue[front]!;
      front++;

      for (const char in current.children) {
        if (Object.prototype.hasOwnProperty.call(current.children, char)) {
          const child = current.children[char]!;
          queue.push(child);

          let failNode = current.fail;
          while (failNode && failNode !== root && !failNode.children[char]) {
            failNode = failNode.fail;
          }

          child.fail = failNode?.children[char] || root;
          child.output = [...child.output, ...(child.fail?.output || [])];
        }
      }
    }
  }

  filter(text: string): FilterResult {
    const startTime = performance.now();

    if (!this.built || this.wordCount === 0) {
      return {
        isValid: true,
        hasSensitiveWords: false,
        filteredText: text,
        matches: [],
        maxSeverity: null,
        blockedReason: null,
        stats: {
          scanTimeMs: performance.now() - startTime,
          matchCount: 0,
          wordsChecked: 0,
        },
      };
    }

    const matches: MatchResult[] = [];
    const replacements: Replacement[] = [];
    let maxSeverity: "low" | "medium" | "high" | "critical" | null = null;
    let maxSeverityValue = 0;
    let wordsChecked = 0;

    let node = this.root;
    const len = text.length;
    let i = 0;

    while (i < len) {
      const char = text[i]!;
      
      while (node !== this.root && !node.children[char]) {
        node = node.fail || this.root;
      }

      node = node.children[char] || this.root;

      if (node.output.length > 0) {
        wordsChecked++;

        for (const wordInfo of node.output) {
          if (!wordInfo || !wordInfo.word) continue;

          const wordLen = wordInfo.word.length;
          const startPos = i - wordLen + 1;

          let shouldReplace = true;
          let replaceIndex = -1;
          
          for (let j = 0; j < replacements.length; j++) {
            const r = replacements[j]!;
            if (r.start === startPos) {
              if (r.length < wordLen) {
                replaceIndex = j;
              } else {
                shouldReplace = false;
              }
              break;
            }
          }

          if (shouldReplace) {
            const replacementData: Replacement = {
              start: startPos,
              replacement: wordInfo.replacement || "***",
              length: wordLen,
            };

            if (replaceIndex >= 0) {
              replacements[replaceIndex] = replacementData;
            } else {
              replacements.push(replacementData);
            }

            matches.push({
              word: wordInfo.word,
              category: wordInfo.category,
              severity: wordInfo.severity,
              replacement: wordInfo.replacement || "***",
              start: startPos,
              end: i + 1,
            });

            const severityValue = getSeverityValue(wordInfo.severity);
            if (severityValue > maxSeverityValue) {
              maxSeverityValue = severityValue;
              maxSeverity = wordInfo.severity;
            }
          }
        }
      }
      i++;
    }

    replacements.sort((a, b) => a.start - b.start);

    let filteredText = "";
    let lastIndex = 0;

    for (const r of replacements) {
      if (r.start >= lastIndex) {
        filteredText += text.slice(lastIndex, r.start) + r.replacement;
        lastIndex = r.start + r.length;
      }
    }
    filteredText += text.slice(lastIndex);

    const hasCriticalWords = maxSeverity === "critical";
    const hasHighSeverityWords = maxSeverity === "high" || hasCriticalWords;

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
      stats: {
        scanTimeMs: performance.now() - startTime,
        matchCount: matches.length,
        wordsChecked,
      },
    };
  }

  quickCheck(text: string): { hasSensitiveWords: boolean; severity?: "high" | "critical" } {
    if (!this.built || this.wordCount === 0) {
      return { hasSensitiveWords: false };
    }

    let node = this.root;
    const len = text.length;
    let i = 0;

    while (i < len) {
      const char = text[i]!;
      
      while (node !== this.root && !node.children[char]) {
        node = node.fail || this.root;
      }

      node = node.children[char] || this.root;

      if (node.output.length > 0) {
        for (const w of node.output) {
          if (w.severity === "critical") {
            return { hasSensitiveWords: true, severity: "critical" };
          }
        }
        for (const w of node.output) {
          if (w.severity === "high") {
            return { hasSensitiveWords: true, severity: "high" };
          }
        }
        return { hasSensitiveWords: true };
      }
      i++;
    }

    return { hasSensitiveWords: false };
  }

  getStats(): {
    wordCount: number;
    isBuilt: boolean;
    buildTimeMs: number;
    cacheVersion: number;
  } {
    return {
      wordCount: this.wordCount,
      isBuilt: this.built,
      buildTimeMs: this.lastBuildTime,
      cacheVersion: this.cacheVersion,
    };
  }

  benchmark(text: string, iterations: number = 100): {
    avgTimeMs: number;
    maxTimeMs: number;
    minTimeMs: number;
  } {
    let total = 0;
    let max = 0;
    let min = Infinity;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      this.filter(text);
      const time = performance.now() - start;
      total += time;
      if (time > max) max = time;
      if (time < min) min = time;
    }

    return {
      avgTimeMs: total / iterations,
      maxTimeMs: max,
      minTimeMs: min,
    };
  }
}

const DEFAULT_WORDS: SensitiveWord[] = [];

const filterInstance = new DFASensitiveWordFilter();

filterInstance.build(DEFAULT_WORDS);

let remoteWordsCache: SensitiveWord[] | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getSensitiveWords(): Promise<SensitiveWord[]> {
  const now = Date.now();

  if (remoteWordsCache && now < cacheExpiry) {
    return remoteWordsCache;
  }

  try {
    const response = await fetch("/api/sensitive-words");
    if (response.ok) {
      const data = await response.json();
      remoteWordsCache = data.words || [];
      cacheExpiry = now + CACHE_DURATION;
      
      if (remoteWordsCache) {
        filterInstance.build(remoteWordsCache);
      }
      
      return remoteWordsCache || [];
    }
  } catch {
    console.warn("Failed to fetch remote sensitive words");
  }

  return remoteWordsCache || [];
}

export function getFilterInstance(): DFASensitiveWordFilter {
  return filterInstance;
}

export function checkContentWithDFA(
  text: string,
  words?: SensitiveWord[]
): FilterResult {
  if (words) {
    filterInstance.build(words);
  }
  
  return filterInstance.filter(text);
}

export async function checkContent(text: string): Promise<FilterResult> {
  await getSensitiveWords();
  return filterInstance.filter(text);
}

export async function quickCheckContent(text: string): Promise<{
  hasSensitiveWords: boolean;
  severity?: "high" | "critical";
}> {
  await getSensitiveWords();
  return filterInstance.quickCheck(text);
}

export function benchmarkFilter(text: string, words?: SensitiveWord[], iterations: number = 100) {
  if (words) {
    filterInstance.build(words);
  }
  return filterInstance.benchmark(text, iterations);
}
