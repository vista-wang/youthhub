const USERNAME_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: "用户名不能为空" };
  }

  const len = username.length;
  if (len < 2 || len > 20) {
    return { isValid: false, error: "用户名长度需要在2-20个字符之间" };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: "用户名只能包含中文、字母、数字和下划线",
    };
  }

  return { isValid: true };
}

export function validatePostContent(
  title: string,
  content: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!title || title.trim().length === 0) {
    errors.push("标题不能为空");
  } else if (title.length > 100) {
    errors.push("标题不能超过100个字符");
  }

  if (!content || content.trim().length === 0) {
    errors.push("内容不能为空");
  } else if (content.length > 5000) {
    errors.push("内容不能超过5000个字符");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCommentContent(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: "评论内容不能为空" };
  }

  if (content.length > 500) {
    return { isValid: false, error: "评论内容不能超过500个字符" };
  }

  return { isValid: true };
}
