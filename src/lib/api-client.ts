export interface ApiErrorLike {
  message?: string;
  error?: string;
  details?: string[];
}

export async function parseApiError(response: Response): Promise<string[]> {
  try {
    const data = (await response.json()) as ApiErrorLike;
    if (Array.isArray(data.details) && data.details.length > 0) {
      return data.details;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return [data.message];
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return [data.error];
    }
  } catch {
    // fall through to default message
  }
  return ["请求失败，请稍后重试"];
}
