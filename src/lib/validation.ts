
import { safeString, safeNumber } from "@/types/safe";

export interface ValidationResult {
  isValid: boolean;
  errors: readonly string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateString(
  value: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
    label?: string;
  } = {}
): FieldValidationResult {
  const {
    minLength = 0,
    maxLength = Infinity,
    pattern,
    required = true,
    label = "字段",
  } = options;

  const str = safeString(value);

  if (required && str.length === 0) {
    return { isValid: false, error: `${label}不能为空` };
  }

  if (str.length > 0 && str.length < minLength) {
    return { isValid: false, error: `${label}长度不能少于${minLength}个字符` };
  }

  if (str.length > maxLength) {
    return { isValid: false, error: `${label}长度不能超过${maxLength}个字符` };
  }

  if (pattern && str.length > 0 && !pattern.test(str)) {
    return { isValid: false, error: `${label}格式不正确` };
  }

  return { isValid: true };
}

export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
    label?: string;
  } = {}
): FieldValidationResult {
  const {
    min = -Infinity,
    max = Infinity,
    integer = false,
    required = true,
    label = "数字",
  } = options;

  if (value == null) {
    if (required) {
      return { isValid: false, error: `${label}不能为空` };
    }
    return { isValid: true };
  }

  const num = safeNumber(value as number, NaN);

  if (isNaN(num)) {
    return { isValid: false, error: `${label}必须是有效数字` };
  }

  if (integer && !Number.isInteger(num)) {
    return { isValid: false, error: `${label}必须是整数` };
  }

  if (num < min) {
    return { isValid: false, error: `${label}不能小于${min}` };
  }

  if (num > max) {
    return { isValid: false, error: `${label}不能大于${max}` };
  }

  return { isValid: true };
}

export function validateId(value: unknown, label: string = "ID"): FieldValidationResult {
  return validateString(value, {
    minLength: 1,
    maxLength: 100,
    required: true,
    label,
  });
}

export function validateUuid(value: unknown, label: string = "UUID"): FieldValidationResult {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return validateString(value, {
    pattern: uuidPattern,
    required: true,
    label,
  });
}

export function validateEmail(value: unknown, label: string = "邮箱"): FieldValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(value, {
    pattern: emailPattern,
    maxLength: 254,
    required: true,
    label,
  });
}

export function validateUrl(value: unknown, label: string = "URL"): FieldValidationResult {
  const result = validateString(value, {
    maxLength: 2048,
    required: true,
    label,
  });

  if (!result.isValid) return result;

  try {
    new URL(safeString(value));
    return { isValid: true };
  } catch {
    return { isValid: false, error: `${label}格式不正确` };
  }
}

export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string = "值"
): FieldValidationResult {
  const str = safeString(value);

  if (!allowedValues.includes(str as T)) {
    return {
      isValid: false,
      error: `${label}必须是以下值之一: ${allowedValues.join(", ")}`,
    };
  }

  return { isValid: true };
}

export function validateArray<T>(
  value: unknown,
  validator: (item: unknown, index: number) => FieldValidationResult,
  options: {
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    label?: string;
  } = {}
): ValidationResult {
  const {
    minLength = 0,
    maxLength = Infinity,
    required = true,
    label = "数组",
  } = options;

  const errors: string[] = [];

  if (value == null || !Array.isArray(value)) {
    if (required) {
      return { isValid: false, errors: [`${label}不能为空`] };
    }
    return { isValid: true, errors: [] };
  }

  if (value.length < minLength) {
    errors.push(`${label}长度不能少于${minLength}个元素`);
  }

  if (value.length > maxLength) {
    errors.push(`${label}长度不能超过${maxLength}个元素`);
  }

  for (let i = 0; i < value.length; i++) {
    const result = validator(value[i], i);
    if (!result.isValid && result.error) {
      errors.push(`${label}[${i}]: ${result.error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  validators: {
    [K in keyof T]?: (value: unknown) => FieldValidationResult;
  },
  options: {
    label?: string;
  } = {}
): ValidationResult {
  const { label = "对象" } = options;
  const errors: string[] = [];

  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return { isValid: false, errors: [`${label}必须是一个有效对象`] };
  }

  const obj = value as Record<string, unknown>;

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(obj[field]);
      if (!result.isValid && result.error) {
        errors.push(`${field}: ${result.error}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function combineResults(
  results: readonly FieldValidationResult[]
): ValidationResult {
  const errors: string[] = [];

  for (const result of results) {
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function safeValidate<T>(
  validator: () => T
): { success: true; value: T } | { success: false; error: string } {
  try {
    const result = validator();
    return { success: true, value: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "验证失败",
    };
  }
}
