interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
}

export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private stats: CacheStats;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
    this.defaultTTL = defaultTTL;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  get<K extends string, V extends T>(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    this.stats.hits++;
    return entry.value as V;
  }

  set<K extends string, V extends T>(key: K, value: V, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  has<K extends string>(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.evictions++;
      return false;
    }
    return true;
  }

  delete<K extends string>(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  getSize(): number {
    return this.cache.size;
  }

  async getOrSet<K extends string, V extends T>(
    key: K,
    fn: () => Promise<V>,
    ttl?: number
  ): Promise<V> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached as V;
    }
    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
}

export const createCache = <T = unknown>(defaultTTL?: number) => {
  return new MemoryCache<T>(defaultTTL);
};

let globalCache: MemoryCache | null = null;

export const getGlobalCache = (): MemoryCache => {
  if (!globalCache) {
    globalCache = new MemoryCache();
  }
  return globalCache;
};
