export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private resetter?: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    resetter?: (obj: T) => void,
    maxSize: number = 50
  ) {
    this.factory = factory;
    this.resetter = resetter;
    this.maxSize = maxSize;
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.resetter) {
      this.resetter(obj);
    }
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

export class StringBuilder {
  private parts: string[] = [];

  append(str: string): this {
    this.parts.push(str);
    return this;
  }

  appendLine(str: string = ""): this {
    this.parts.push(str, "\n");
    return this;
  }

  toString(): string {
    return this.parts.join("");
  }

  clear(): void {
    this.parts = [];
  }

  get length(): number {
    let len = 0;
    for (const part of this.parts) {
      len += part.length;
    }
    return len;
  }
}

const stringBuilderPool = new ObjectPool<StringBuilder>(
  () => new StringBuilder(),
  (sb) => sb.clear()
);

export function getStringBuilder(): StringBuilder {
  return stringBuilderPool.get();
}

export function releaseStringBuilder(sb: StringBuilder): void {
  stringBuilderPool.release(sb);
}

export class TypedArrayUtils {
  static sum(arr: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array): number {
    let total = 0;
    for (let i = 0, len = arr.length; i < len; i++) {
      total += arr[i];
    }
    return total;
  }

  static max(arr: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array): number {
    if (arr.length === 0) return -Infinity;
    let maxVal = arr[0];
    for (let i = 1, len = arr.length; i < len; i++) {
      if (arr[i] > maxVal) {
        maxVal = arr[i];
      }
    }
    return maxVal;
  }

  static min(arr: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array): number {
    if (arr.length === 0) return Infinity;
    let minVal = arr[0];
    for (let i = 1, len = arr.length; i < len; i++) {
      if (arr[i] < minVal) {
        minVal = arr[i];
      }
    }
    return minVal;
  }

  static avg(arr: Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array): number {
    if (arr.length === 0) return 0;
    return this.sum(arr) / arr.length;
  }

  static findIndex<T extends Uint8Array | Uint16Array | Uint32Array | Int8Array | Int16Array | Int32Array | Float32Array | Float64Array>(
    arr: T,
    predicate: (value: number, index: number, array: T) => boolean
  ): number {
    for (let i = 0, len = arr.length; i < len; i++) {
      if (predicate(arr[i], i, arr)) {
        return i;
      }
    }
    return -1;
  }
}
