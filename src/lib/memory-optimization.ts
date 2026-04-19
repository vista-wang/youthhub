/**
 * 内存优化工具库
 * 提供对象池、大对象处理、内存监控等功能
 */

// 内存监控配置
const MEMORY_WARNING_THRESHOLD = 0.8; // 80% 内存使用率警告
const MEMORY_CRITICAL_THRESHOLD = 0.9; // 90% 内存使用率紧急警告

/**
 * 对象池 - 用于复用对象实例，减少垃圾回收压力
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool = [];
  }

  get size(): number {
    return this.pool.length;
  }
}

/**
 * 数组对象池 - 专门用于数组复用
 */
export class ArrayPool<T> extends ObjectPool<T[]> {
  constructor(maxSize: number = 50) {
    super(
      () => [],
      (arr) => arr.length = 0,
      maxSize
    );
  }
}

/**
 * 大对象管理器 - 用于管理大型对象，避免内存泄漏
 */
export class LargeObjectManager {
  private objects = new Map<string, {
    data: any;
    lastAccess: number;
    size: number;
  }>();

  private maxCacheSize: number;
  private ttl: number;

  constructor(maxCacheSize: number = 100 * 1024 * 1024, ttl: number = 5 * 60 * 1000) {
    this.maxCacheSize = maxCacheSize;
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    const size = this.estimateSize(data);
    this.cleanup();
    if (this.totalSize() + size > this.maxCacheSize) {
      this.evictOldest();
    }
    this.objects.set(key, {
      data,
      lastAccess: Date.now(),
      size
    });
  }

  get(key: string): any | null {
    const obj = this.objects.get(key);
    if (!obj) return null;
    obj.lastAccess = Date.now();
    return obj.data;
  }

  has(key: string): boolean {
    return this.objects.has(key);
  }

  delete(key: string): boolean {
    return this.objects.delete(key);
  }

  clear(): void {
    this.objects.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, obj] of this.objects) {
      if (now - obj.lastAccess > this.ttl) {
        this.objects.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, obj] of this.objects) {
      if (obj.lastAccess < oldestTime) {
        oldestTime = obj.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.objects.delete(oldestKey);
    }
  }

  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'string') return obj.length * 2;
    if (typeof obj === 'number') return 8;
    if (typeof obj === 'boolean') return 4;
    if (Array.isArray(obj)) return obj.reduce((acc, item) => acc + this.estimateSize(item), 0);
    if (typeof obj === 'object') {
      let size = 0;
      for (const [key, value] of Object.entries(obj)) {
        size += key.length * 2 + this.estimateSize(value);
      }
      return size;
    }
    return 0;
  }

  private totalSize(): number {
    let total = 0;
    for (const obj of this.objects.values()) {
      total += obj.size;
    }
    return total;
  }
}

/**
 * 内存监控器 - 监控内存使用情况
 */
export class MemoryMonitor {
  private listeners = new Set<(status: MemoryStatus) => void>();
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalMs: number = 10000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.checkMemory();
    }, intervalMs);
    this.checkMemory();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  subscribe(listener: (status: MemoryStatus) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private checkMemory(): void {
    const status = this.getMemoryStatus();
    this.listeners.forEach(listener => listener(status));
  }

  getMemoryStatus(): MemoryStatus {
    let usedMemory = 0;
    let totalMemory = 1;
    let jsHeapSizeLimit = Infinity;

    if ('performance' in window && 'memory' in (window.performance as any)) {
      const memoryInfo = (window.performance as any).memory;
      usedMemory = memoryInfo.usedJSHeapSize;
      jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
      totalMemory = jsHeapSizeLimit;
    } else {
      // fallback for browsers without memory API
      usedMemory = 0;
      totalMemory = 1;
    }

    const usagePercent = totalMemory > 0 ? usedMemory / totalMemory : 0;
    let level: MemoryLevel = 'normal';
    if (usagePercent >= MEMORY_CRITICAL_THRESHOLD) {
      level = 'critical';
    } else if (usagePercent >= MEMORY_WARNING_THRESHOLD) {
      level = 'warning';
    }

    return {
      usedMemory,
      totalMemory,
      jsHeapSizeLimit,
      usagePercent,
      level,
      timestamp: Date.now()
    };
  }
}

// 类型定义
export interface MemoryStatus {
  usedMemory: number;
  totalMemory: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
  level: MemoryLevel;
  timestamp: number;
}

export type MemoryLevel = 'normal' | 'warning' | 'critical';

// 默认实例
let defaultObjectPool: ObjectPool<any> | null = null;
let defaultArrayPool: ArrayPool<any> | null = null;
let defaultLargeObjectManager: LargeObjectManager | null = null;
let defaultMemoryMonitor: MemoryMonitor | null = null;

export function getDefaultObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void
): ObjectPool<T> {
  if (!defaultObjectPool) {
    defaultObjectPool = new ObjectPool(factory, reset);
  }
  return defaultObjectPool as ObjectPool<T>;
}

export function getDefaultArrayPool<T>(): ArrayPool<T> {
  if (!defaultArrayPool) {
    defaultArrayPool = new ArrayPool();
  }
  return defaultArrayPool as ArrayPool<T>;
}

export function getDefaultLargeObjectManager(): LargeObjectManager {
  if (!defaultLargeObjectManager) {
    defaultLargeObjectManager = new LargeObjectManager();
  }
  return defaultLargeObjectManager;
}

export function getDefaultMemoryMonitor(): MemoryMonitor {
  if (!defaultMemoryMonitor) {
    defaultMemoryMonitor = new MemoryMonitor();
  }
  return defaultMemoryMonitor;
}

// 工具函数
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

