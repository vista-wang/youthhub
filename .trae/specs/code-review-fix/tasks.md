# Tasks

- [x] Task 1: 修复 Critical 问题
  - [x] SubTask 1.1: HotPage 中 `post.author?.username` 改为 `post.author_name`
  - [x] SubTask 1.2: 在 database.ts 中添加 point_transactions 表类型定义
  - [x] SubTask 1.3: 移除 next.config.mjs 中的 ignoreBuildErrors、ignoreDuringBuilds 和 swcMinify

- [x] Task 2: 修复 High 问题
  - [x] SubTask 2.1: 补全 /api/admin/users select 查询
  - [x] SubTask 2.2: 补全 /api/admin/posts select 查询
  - [x] SubTask 2.3: 扩展 PostService.createPost 支持 image_urls 和 attachment_urls
  - [x] SubTask 2.4: 为 /api/posts/recommend 添加 dynamic = "force-dynamic"
  - [x] SubTask 2.5: 移除 HomePage 和 useHomePage 中未使用的 props

- [x] Task 3: 修复 Medium 问题
  - [x] SubTask 3.1: HotPage 使用共享的 formatRelativeTime
  - [x] SubTask 3.2: PostCard 图片 key 修复
  - [x] SubTask 3.3: AdminPage Post 接口添加 image_urls 和 attachment_urls

- [x] Task 4: 验证
  - [x] SubTask 4.1: lint 检查通过
  - [x] SubTask 4.2: 构建测试通过
