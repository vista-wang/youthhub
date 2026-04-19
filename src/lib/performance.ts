interface TimingMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface CounterMetric {
  name: string;
  value: number;
}

interface PerformanceMetrics {
  timings: TimingMetric[];
  counters: Map<string, number>;
}

class PerformanceTracker {
  private metrics: PerformanceMetrics;
  private maxTimings: number;

  constructor(maxTimings: number = 1000) {
    this.metrics = {
      timings: [],
      counters: new Map(),
    };
    this.maxTimings = maxTimings;
  }

  time<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordTiming(name, duration);
    }
  }

  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordTiming(name, duration);
    }
  }

  startTimer(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordTiming(name, duration);
      return duration;
    };
  }

  private recordTiming(name: string, duration: number): void {
    this.metrics.timings.push({
      name,
      duration,
      timestamp: Date.now(),
    });
    if (this.metrics.timings.length > this.maxTimings) {
      this.metrics.timings.shift();
    }
  }

  increment(name: string, value: number = 1): void {
    const current = this.metrics.counters.get(name) || 0;
    this.metrics.counters.set(name, current + value);
  }

  setCounter(name: string, value: number): void {
    this.metrics.counters.set(name, value);
  }

  getCounter(name: string): number {
    return this.metrics.counters.get(name) || 0;
  }

  getTimings(name?: string): TimingMetric[] {
    if (name) {
      return this.metrics.timings.filter(t => t.name === name);
    }
    return [...this.metrics.timings];
  }

  getTimingStats(name: string) {
    const timings = this.getTimings(name);
    if (timings.length === 0) {
      return null;
    }
    const durations = timings.map(t => t.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    return {
      count: durations.length,
      avg,
      min,
      max,
      sum,
    };
  }

  getAllStats() {
    const names = new Set(this.metrics.timings.map(t => t.name));
    const stats: Record<string, ReturnType<typeof this.getTimingStats>> = {};
    for (const name of names) {
      stats[name] = this.getTimingStats(name);
    }
    return {
      timings: stats,
      counters: Object.fromEntries(this.metrics.counters.entries()),
    };
  }

  reset(): void {
    this.metrics.timings = [];
    this.metrics.counters.clear();
  }
}

let globalTracker: PerformanceTracker | null = null;

export const getPerformanceTracker = (): PerformanceTracker => {
  if (!globalTracker) {
    globalTracker = new PerformanceTracker();
  }
  return globalTracker;
};

export const createPerformanceTracker = (maxTimings?: number) => {
  return new PerformanceTracker(maxTimings);
};

export const trackTime = <T>(name: string, fn: () => T): T => {
  return getPerformanceTracker().time(name, fn);
};

export const trackTimeAsync = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return getPerformanceTracker().timeAsync(name, fn);
};
