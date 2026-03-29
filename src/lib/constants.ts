export const POST_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 5000,
  COMMENT_MAX_LENGTH: 500,
  USERNAME_MIN_LENGTH: 2,
  USERNAME_MAX_LENGTH: 20,
  POSTS_PER_PAGE: 20,
  HOT_POST_THRESHOLD: 10,
  TRUNCATE_LENGTH: 120,
} as const;

export const ERROR_MESSAGES = {
  TITLE_EMPTY: "标题不能为空",
  TITLE_TOO_LONG: "标题不能超过100个字符",
  CONTENT_EMPTY: "内容不能为空",
  CONTENT_TOO_LONG: "内容不能超过5000个字符",
  COMMENT_EMPTY: "评论内容不能为空",
  COMMENT_TOO_LONG: "评论内容不能超过500个字符",
  USERNAME_EMPTY: "用户名不能为空",
  USERNAME_LENGTH: "用户名长度需要在2-20个字符之间",
  USERNAME_FORMAT: "用户名只能包含中文、字母、数字和下划线",
  UNAUTHORIZED: "请先登录",
  SERVER_ERROR: "服务器错误",
  NETWORK_ERROR: "网络错误，请稍后重试",
} as const;

export const SUCCESS_MESSAGES = {
  POST_CREATED: "帖子发布成功",
  COMMENT_CREATED: "评论发表成功",
} as const;
