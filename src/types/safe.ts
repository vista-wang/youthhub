
export type SafeArray<T> = readonly T[];

export type SafeObject<T> = Readonly<T>;

export type Maybe<T> = T | null | undefined;

export type NonNullable<T> = Exclude<T, null | undefined>;

export type Dictionary<T> = Readonly<Record<string, T>>;

export type MutableDictionary<T> = Record<string, T>;

export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type DeepMutable<T> = T extends ReadonlyArray<infer U>
  ? Array<DeepMutable<U>>
  : T extends ReadonlyMap<infer K, infer V>
  ? Map<DeepMutable<K>, DeepMutable<V>>
  : T extends ReadonlySet<infer U>
  ? Set<DeepMutable<U>>
  : T extends object
  ? { -readonly [P in keyof T]: DeepMutable<T[P]> }
  : T;

export function ensureExists<T>(
  value: Maybe<T>,
  message?: string
): NonNullable<T> {
  if (value == null) {
    throw new Error(message ?? "Value cannot be null or undefined");
  }
  return value as NonNullable<T>;
}

export function safeGet<T>(
  value: Maybe<T>,
  defaultValue: NonNullable<T>
): NonNullable<T> {
  return value == null ? defaultValue : (value as NonNullable<T>);
}

export function safeGetOrUndefined<T>(value: Maybe<T>): T | undefined {
  return value == null ? undefined : (value as T);
}

export function safeGetOrNull<T>(value: Maybe<T>): T | null {
  return value == null ? null : (value as T);
}

export function safeArray<T>(
  value: Maybe<readonly T[] | T[]>
): readonly T[] {
  return value == null ? [] : value;
}

export function safeString(value: Maybe<string>): string {
  return value == null ? "" : value;
}

export function safeNumber(value: Maybe<number>, defaultValue: number = 0): number {
  return typeof value === "number" ? value : defaultValue;
}

export function safeBoolean(value: Maybe<boolean>, defaultValue: boolean = false): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

export function safeDate(value: Maybe<string | Date>): Date | null {
  if (value == null) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return isNaN(date.getTime()) ? null : date;
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapper: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(mapper(result.value)) : result;
}

export function mapErr<T, E, F>(
  result: Result<T, E>,
  mapper: (error: E) => F
): Result<T, F> {
  return result.ok ? result : err(mapper(result.error));
}

export function unwrapResult<T>(result: Result<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}
