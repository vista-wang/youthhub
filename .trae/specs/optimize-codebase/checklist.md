* [x] formatRelativeTime 对各时间单位（秒/分/时/天/周/月/年）的计算结果正确

* [x] 敏感词过滤仅使用 DFA 实现，sensitive-words.ts 已删除

* [x] 帖子查询使用共享的 buildPostsQuery 函数，无重复的 select 字段定义

* [x] 所有 admin API routes 使用共享的 requireAdmin 函数

* [x] 代码中无 `as any` 类型断言（使用 fromTable 类型安全辅助替代）

* [x] PostWithAuthor 类型包含 author\_name 和 author\_avatar 字段

* [x] PostCard 和 CommentItem 使用 React.memo 包装

* [x] 点赞操作无竞态条件，快速连续点击状态一致

* [x] DFA buildFailLinks 使用索引遍历而非 Array.shift()

* [x] utils.ts 已拆分为 transforms/validators/formatters 等独立模块

* [x] API routes 通过 Service 层访问数据

* [x] /api/sensitive-words 需要管理员权限才能访问

* [x] 热门帖子和每周话题 API 响应包含 Cache-Control 头

* [x] 无冗余包装函数（rankPostsOptimized 等）和重复类型定义

* [x] npm run lint 通过

* [x] npm run build 编译成功（类型检查 OOM 为 Supabase 类型复杂度预存问题）

