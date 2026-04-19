
export class YouthHubError extends Error {
  readonly code: string;

  constructor(message: string, code: string = "INTERNAL_ERROR") {
    super(message);
    this.name = "YouthHubError";
    this.code = code;
  }
}

export class ValidationError extends YouthHubError {
  readonly field?: string;
  readonly details?: readonly string[];

  constructor(
    message: string,
    field?: string,
    details?: readonly string[]
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
    this.details = details;
  }
}

export class NotFoundError extends YouthHubError {
  readonly resourceType: string;
  readonly resourceId: string | null;

  constructor(
    resourceType: string,
    resourceId: string | null = null,
    message?: string
  ) {
    super(
      message ?? `${resourceType} not found${resourceId ? ` (ID: ${resourceId})` : ""}`,
      "NOT_FOUND"
    );
    this.name = "NotFoundError";
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

export class UnauthorizedError extends YouthHubError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends YouthHubError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class RateLimitError extends YouthHubError {
  readonly retryAfter: number | null;

  constructor(message: string = "Rate limit exceeded", retryAfter: number | null = null) {
    super(message, "RATE_LIMIT");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class DatabaseError extends YouthHubError {
  constructor(message: string = "Database error occurred") {
    super(message, "DATABASE_ERROR");
    this.name = "DatabaseError";
  }
}

export class SensitiveContentError extends YouthHubError {
  readonly words: readonly string[];

  constructor(message: string = "Sensitive content detected", words: readonly string[] = []) {
    super(message, "SENSITIVE_CONTENT");
    this.name = "SensitiveContentError";
    this.words = words;
  }
}

export function isYouthHubError(error: unknown): error is YouthHubError {
  return error instanceof YouthHubError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function toErrorResponse(error: unknown): {
  code: string; message: string; details?: unknown } {
  if (isYouthHubError(error)) {
    return {
      code: error.code, message: error.message };
  }
  if (error instanceof Error) {
    return { code: "UNKNOWN_ERROR", message: error.message };
  }
  return { code: "UNKNOWN_ERROR", message: "An unknown error occurred" };
}

