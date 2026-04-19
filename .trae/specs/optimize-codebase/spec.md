# YouthHub 项目系统性优化 Spec

## Why
项目存在大量代码重复、类型安全隐患、性能瓶颈和潜在 Bug，需要系统性优化以提升代码质量、运行性能和可维护性。

## What Changes
- 消除重复代码：统一敏感词过滤实现、抽取共享查询构建器、统一管理员鉴权逻辑
- 修复潜在 Bug：修正 `formatRelativeTime` 算法错误、修复点赞竞态条件、修复 DFA 构建逻辑
- 增强类型安全：消除 `as any` 类型断言、统一类型定义、修正 `PostWithAuthor` 类型
- 提升性能：React 组件 memo 化、优化 DFA 队列操作、减少不必要的对象创建
- 改善代码结构：拆分 `utils.ts` 上帝文件、统一 Service 层使用、清理死代码
- 优化资源使用：添加 API 缓存头、敏感词接口增加鉴权

## Impact
- Affected code: `src/lib/utils.ts`, `src/lib/sensitive-words.ts`, `src/lib/algorithms/dfa-filter.ts`, `src/lib/algorithms/recommendation.ts`, `src/lib/services/index.ts`, `src/lib/hooks/use-like.ts`, `src/lib/hooks/use-home-page.ts`, `src/lib/supabase/server.ts`, `src/types/database.ts`, `src/components/post/PostCard.tsx`, `src/components/ui/like-button.tsx`, 所有 API routes, `src/app/page.tsx`, 管理员相关页面

## ADDED Requirements

### Requirement: 统一敏感词过滤实现
系统 SHALL 仅保留 DFA（Aho-Corasick）算法实现，移除基于正则的冗余实现。

#### Scenario: 敏感词检查统一入口
- **WHEN** 任何模块调用敏感词检查功能
- **THEN** 统一通过 `dfa-filter.ts` 的 DFA 算法执行，不再使用 `sensitive-words.ts` 的正则实现

### Requirement: 共享 Supabase 查询构建器
系统 SHALL 提供统一的帖子查询构建函数，消除跨文件的重复查询定义。

#### Scenario: 帖子查询构建
- **WHEN** API route 或 Server Component 需要查询帖子数据
- **THEN** 使用共享的查询构建函数，确保查询字段和关联关系一致

### Requirement: 统一管理员鉴权
系统 SHALL 提供单一的管理员鉴权工具函数，所有 admin API routes 共享使用。

#### Scenario: 管理员接口鉴权
- **WHEN** admin API route 需要验证管理员权限
- **THEN** 调用共享的 `requireAdmin()` 函数，返回鉴权结果和 supabase 客户端

### Requirement: 修复 formatRelativeTime 算法
系统 SHALL 修正相对时间计算算法，确保各时间单位转换正确。

#### Scenario: 时间计算正确性
- **WHEN** 用户查看帖子的发布时间
- **THEN** 显示的相对时间（如"3天前"、"2周前"）计算准确

### Requirement: 修复点赞竞态条件
系统 SHALL 在点赞操作中使用函数式状态更新，避免快速点击导致的状态不一致。

#### Scenario: 快速连续点赞
- **WHEN** 用户快速连续点击点赞按钮
- **THEN** 点赞状态始终与服务器最终状态一致，不会出现 UI 与数据不同步

### Requirement: 消除 as any 类型断言
系统 SHALL 使用正确的泛型类型替代所有 `as any` 类型断言，确保类型安全。

#### Scenario: 类型安全的数据操作
- **WHEN** 执行 Supabase 数据写入操作
- **THEN** 使用正确的类型约束，编译时即可发现类型错误

### Requirement: PostWithAuthor 类型修正
系统 SHALL 修正 `PostWithAuthor` 类型定义，使其包含 `author_name` 和 `author_avatar` 字段。

#### Scenario: 帖子数据类型完整
- **WHEN** 前端组件接收帖子数据
- **THEN** TypeScript 类型系统正确识别 `author_name` 和 `author_avatar` 字段，无需额外断言

### Requirement: React 组件性能优化
系统 SHALL 对频繁重渲染的列表项组件使用 `React.memo`，减少不必要的重渲染。

#### Scenario: 帖子列表渲染性能
- **WHEN** 用户在首页切换标签或执行点赞操作
- **THEN** 未变化的帖子卡片不重新渲染

### Requirement: DFA 队列操作优化
系统 SHALL 将 DFA 算法中的 `Array.shift()` 替换为索引遍历，将时间复杂度从 O(n²) 降至 O(n)。

#### Scenario: 敏感词过滤构建性能
- **WHEN** 系统加载敏感词库构建 DFA 自动机
- **THEN** 构建过程使用高效队列操作，避免数组 shift 的性能损耗

### Requirement: 拆分 utils.ts 上帝文件
系统 SHALL 将 `utils.ts` 按职责拆分为独立模块，提升代码可维护性。

#### Scenario: 工具函数组织
- **WHEN** 开发者需要使用特定工具函数
- **THEN** 可以从语义明确的模块路径导入，而非单一的大文件

### Requirement: 统一 Service 层使用
系统 SHALL 在 API routes 中使用已有的 Service 层，消除直接在 route handler 中重复查询逻辑。

#### Scenario: API route 数据访问
- **WHEN** API route 需要访问数据库
- **THEN** 通过 Service 层方法调用，保持数据访问逻辑一致性

### Requirement: 敏感词接口鉴权
系统 SHALL 对 `/api/sensitive-words` 接口添加管理员权限验证，防止敏感词库泄露。

#### Scenario: 敏感词接口安全
- **WHEN** 未授权用户请求敏感词列表
- **THEN** 返回 401 未授权响应，不暴露敏感词数据

### Requirement: API 缓存头优化
系统 SHALL 为适合缓存的 API 响应添加合理的 Cache-Control 头，减少重复请求。

#### Scenario: 热门帖子缓存
- **WHEN** 客户端请求热门帖子列表
- **THEN** 响应包含 `Cache-Control: public, s-maxage=60` 头，允许 CDN 缓存

### Requirement: 清理死代码和冗余导出
系统 SHALL 移除未使用的代码、冗余的包装函数和重复的类型定义。

#### Scenario: 代码库整洁度
- **WHEN** 开发者浏览代码库
- **THEN** 不存在未使用的导出函数、重复的类型定义或已废弃的实现

## MODIFIED Requirements

### Requirement: 推荐引擎实例管理
推荐引擎 SHALL 复用单例实例而非每次调用 `getHotPosts` 时创建新实例，避免不必要的对象分配和缓存失效。

## REMOVED Requirements

### Requirement: 基于正则的敏感词过滤
**Reason**: 被 DFA 算法完全替代，正则实现性能差且功能重复
**Migration**: 删除 `src/lib/sensitive-words.ts`，所有引用改为使用 `dfa-filter.ts`
