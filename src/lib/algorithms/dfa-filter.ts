import type { SensitiveWord } from "@/types/database";

interface TrieNode {
  children: Map<string, TrieNode>;
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

const SEVERITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

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
      children: new Map(),
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
      const chars = Array.from(wordInfo.word);

      for (const char of chars) {
        if (!node.children.has(char)) {
          node.children.set(char, this.createNode());
        }
        node = node.children.get(char)!;
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

  private buildFailLinks(root: TrieNode): void {
    const queue: TrieNode[] = [];
    root.fail = root;

    for (const [char, child] of root.children) {
      child.fail = root;
      queue.push(child);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [char, child] of current.children) {
        queue.push(child);

        let failNode = current.fail;
        while (failNode !== root && !failNode.children.has(char)) {
          failNode = failNode.fail!;
        }

        child.fail = failNode.children.get(char) || root;
        child.output = [...child.output, ...child.fail!.output];
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
    const replaceMap = new Map<number, { replacement: string; length: number }>();
    let maxSeverity: "low" | "medium" | "high" | "critical" | null = null;
    let wordsChecked = 0;

    let node = this.root;
    const chars = Array.from(text);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      while (node !== this.root && !node.children.has(char)) {
        node = node.fail!;
      }

      node = node.children.get(char) || this.root;

      if (node.output.length > 0) {
        wordsChecked++;

        for (const wordInfo of node.output) {
          if (!wordInfo || !wordInfo.word) continue;

          const wordLen = wordInfo.word.length;
          const startPos = i - wordLen + 1;

          if (!replaceMap.has(startPos) || replaceMap.get(startPos)!.length < wordLen) {
            replaceMap.set(startPos, {
              replacement: wordInfo.replacement || "***",
              length: wordLen,
            });

            matches.push({
              word: wordInfo.word,
              category: wordInfo.category,
              severity: wordInfo.severity,
              replacement: wordInfo.replacement || "***",
              start: startPos,
              end: i + 1,
            });

            if (
              !maxSeverity ||
              SEVERITY_ORDER[wordInfo.severity] > SEVERITY_ORDER[maxSeverity]
            ) {
              maxSeverity = wordInfo.severity;
            }
          }
        }
      }
    }

    let filteredText = "";
    let lastIndex = 0;

    const sortedReplacements = Array.from(replaceMap.entries()).sort(
      ([a], [b]) => a - b
    );

    for (const [start, info] of sortedReplacements) {
      if (start >= lastIndex) {
        filteredText += text.slice(lastIndex, start) + info.replacement;
        lastIndex = start + info.length;
      }
    }
    filteredText += text.slice(lastIndex);

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
    const chars = Array.from(text);

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];

      while (node !== this.root && !node.children.has(char)) {
        node = node.fail!;
      }

      node = node.children.get(char) || this.root;

      if (node.output.length > 0) {
        const highOrCritical = node.output.find(
          (w) => w.severity === "high" || w.severity === "critical"
        );
        if (highOrCritical) {
          return {
            hasSensitiveWords: true,
            severity: highOrCritical.severity as "high" | "critical",
          };
        }
        return { hasSensitiveWords: true };
      }
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
}

const DEFAULT_WORDS: SensitiveWord[] = [
  { id: "1", word: "测试敏感词1", category: "general", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "2", word: "测试敏感词2", category: "general", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "3", word: "广告", category: "spam", severity: "low", replacement: "[广告]", is_active: true, created_at: "", updated_at: "" },
  { id: "4", word: "加微信", category: "spam", severity: "high", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "5", word: "刷单", category: "fraud", severity: "critical", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "6", word: "代做", category: "fraud", severity: "high", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "7", word: "兼职", category: "spam", severity: "low", replacement: "[推广]", is_active: true, created_at: "", updated_at: "" },
  { id: "8", word: "QQ群", category: "spam", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "9", word: "加QQ", category: "spam", severity: "high", replacement: "***", is_active: true, created_at: "", updated_at: "" },
  { id: "10", word: "联系方式", category: "spam", severity: "medium", replacement: "***", is_active: true, created_at: "", updated_at: "" },
];

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
      remoteWordsCache = data.words || DEFAULT_WORDS;
      cacheExpiry = now + CACHE_DURATION;
      
      filterInstance.build(remoteWordsCache);
      
      return remoteWordsCache;
    }
  } catch {
    console.warn("Failed to fetch remote sensitive words, using defaults");
  }

  return DEFAULT_WORDS;
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
