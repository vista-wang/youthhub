# 代码全面检查与修复 Spec

## Why
经过全面代码扫描，发现 3 个严重问题（HotPage 作者名永远显示"匿名"、point_transactions 表类型缺失、构建跳过类型检查）、6 个高优先级问题和 11 个中低优先级问题。需要系统性地修复这些问题，确保代码质量和运行时正确性。

## What Changes
- **BREAKING** 修复 HotPage 中 `post.author` 为 `post.author_name`（运行时 bug）
- 在 database.ts 中添加 `point_transactions` 表类型定义
- 移除 next.config.mjs 中的 `ignoreBuildErrors` 和 `ignoreDuringBuilds`
- 移除 `swcMinify` 废弃配置
- 补全 AdminPage API 缺失的新字段
- 补全 PostService.createPost 支持 image_urls 和 attachment_urls
- 移除 HomePage 未使用的 props（initialAnnouncements、initialHotPosts）
- 移除 useHomePage 中未使用的 initialHotPosts 参数
- 统一 formatRelativeTime 函数（HotPage 使用共享版本）
- 修复 PostCard 图片 key 可能重复的问题

## Impact
- Affected code: HotPage, database.ts, next.config.mjs, AdminPage, services/index.ts, HomePage, useHomePage, PostCard

## ADDED Requirements

### Requirement: point_transactions 表类型定义
系统 SHALL 在 database.ts 的 Tables 接口中添加 point_transactions 表的完整类型定义。

#### Scenario: 类型检查
- **WHEN** 引用 `Database['public']['Tables']['point_transactions']`
- **THEN** TypeScript 能正确推导出 Row/Insert/Update 类型

### Requirement: HotPage 作者名显示
系统 SHALL 在 HotPage 中使用 `post.author_name` 而非 `post.author?.username` 来显示作者名。

#### Scenario: 作者名显示
- **WHEN** 热门页渲染帖子列表
- **THEN** 作者名正确显示，而非永远显示"匿名"

## MODIFIED Requirements

### Requirement: next.config.mjs 配置
移除 `typescript.ignoreBuildErrors: true`、`eslint.ignoreDuringBuilds: true` 和 `swcMinify: true`，确保构建时执行类型检查和 lint 检查。

### Requirement: AdminPage API
补全 `/api/admin/users` 和 `/api/admin/posts` 的 select 查询，包含 points、experience、level、is_premium、image_urls、attachment_urls 字段。

### Requirement: PostService.createPost
扩展 `createPost` 方法，支持 `image_urls` 和 `attachment_urls` 参数。

### Requirement: HomePage props
移除 `initialAnnouncements` 和 `initialHotPosts` 未使用的 props，简化接口。

## REMOVED Requirements

### Requirement: HotPage 本地 formatRelativeTime
**Reason**: 与 @/lib/utils 中的 formatRelativeTime 重复
**Migration**: 使用共享的 formatRelativeTime 函数
