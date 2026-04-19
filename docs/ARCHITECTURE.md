# YouthHub 系统架构文档

## 概述

YouthHub 是一个基于 Next.js 15 和 Supabase 的现代社区平台，采用全栈 TypeScript 开发。本文档详细描述系统架构、核心模块和性能优化策略。

## 1. 系统架构

### 1.1 技术栈

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 前端框架 | Next.js | 15.2.4 |
| UI 库 | React | 19.0.0 |
| 样式方案 | Tailwind CSS | 3.4.10 |
| 数据库 | Supabase (PostgreSQL) | - |
| 语言 | TypeScript | 5.4.5 |
| 构建工具 | Turbopack | - |

### 1.2 目录结构

```
YouthHub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── admin/         # 管理员接口
│   │   │   ├── posts/         # 帖子相关接口
│   │   │   └── ...
│   │   ├── (routes)/          # 页面路由
│   │   └── layout.tsx         # 根布局
│   ├── components/            # React 组件
│   │   ├── announcement/
│   │   ├── auth/
│   │   ├── comment/
│   │   ├── post/
│   │   ├── topic/
│   │   └── ui/                # 基础 UI 组件
│   ├── lib/                   # 核心库
│   │   ├── algorithms/        # 算法实现
│   │   ├── hooks/             # React Hooks
│   │   ├── services/          # 数据服务层
│   │   ├── supabase/          # Supabase 配置
│   │   └── utils/             # 工具函数
│   └── types/                 # TypeScript 类型定义
├── supabase/                  # Supabase 迁移和配置
└── docs/                      # 项目文档
```

### 1.3 系统层级

```
┌─────────────────────────────────────┐
│         前端 UI 层 (React)           │
│  - 页面组件                          │
│  - 业务组件                          │
│  - UI 组件                           │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      业务逻辑层 (Hooks/Services)    │
│  - useHomePage                      │
│  - useLike                          │
│  - PostService                      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      算法层 (Algorithms)             │
│  - DFASensitiveWordFilter           │
│  - RecommendationEngine             │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      数据层 (Supabase)               │
│  - 数据库查询                        │
│  - 实时订阅                          │
│  - 认证授权                          │
└─────────────────────────────────────┘
```

## 2. 核心模块

### 2.1 敏感词过滤模块 (`src/lib/algorithms/dfa-filter.ts`)

**功能**: 基于 Aho-Corasick 算法的高效多模式匹配

**核心类**: `DFASensitiveWordFilter`

**主要方法**:
- `build(words)`: 构建 DFA 自动机
- `filter(text)`: 完整过滤，返回匹配和替换结果
- `quickCheck(text)`: 快速检查，仅返回是否包含敏感词

**性能优化**:
- ✅ 使用索引遍历替代 `Array.shift()`，构建时间从 O(n²) 降到 O(n)
- ✅ 单例模式复用过滤器实例
- ✅ 远程敏感词缓存 5 分钟

### 2.2 推荐引擎模块 (`src/lib/algorithms/recommendation.ts`)

**功能**: 基于内容和互动的帖子推荐算法

**核心类**: `RecommendationEngine`

**主要方法**:
- `rankPosts(posts, limit)`: 通用排序
- `getHotPosts(posts, limit)`: 热门帖子（偏重互动）
- `recommendForUser(posts, keywords, likedIds, limit)`: 个性化推荐

**评分维度**:
- 时效性 (Recency): 35%
- 互动量 (Engagement): 45%
- 内容质量 (Content Quality): 20%

**性能优化**:
- ✅ Quickselect 算法实现 Top-K 排序，平均复杂度 O(n)
- ✅ 特征缓存和分数缓存，TTL 60 秒
- ✅ 单例模式复用推荐引擎实例
- ✅ 复用临时对象减少 GC 压力

### 2.3 组件层优化

**优化策略**:
- `PostCard` 使用 `React.memo()` 避免不必要重渲染
- `LikeButton` 使用函数式状态更新避免竞态条件
- 错误边界包裹关键组件

## 3. 性能优化策略

### 3.1 算法优化

#### DFA 敏感词过滤
- **优化前**: 使用 `Array.shift()` 处理队列，每次操作 O(n)
- **优化后**: 使用 `front` 索引指针遍历，每次操作 O(1)
- **效果**: 构建时间复杂度从 O(n²) 降低到 O(n)

#### 推荐排序
- **优化前**: 对所有帖子完整排序 O(n log n)
- **优化后**: Quickselect 选择 Top-K，平均 O(n)
- **效果**: 当 K << n 时性能提升显著

### 3.2 缓存策略

| 缓存层级 | 内容 | TTL | 实现 |
|----------|------|-----|------|
| 内存 | 推荐引擎分数和特征 | 60s | Map |
| 内存 | 敏感词库 | 5min | 变量缓存 |
| HTTP | 热门帖子 API | 60s | Cache-Control |

### 3.3 资源优化

- API 响应添加合理的 Cache-Control 头
- 敏感词接口添加管理员权限验证
- 减少不必要的对象创建

### 3.4 类型安全

- 消除所有 `as any` 类型断言
- 统一类型定义和导出
- 使用泛型确保类型安全

## 4. 数据流

### 4.1 帖子列表加载流程

```
1. HomePage 加载
   ↓
2. useHomePage hook 调用
   ↓
3. Service 层查询 Supabase
   ↓
4. 推荐引擎 rankPosts()
   ↓
5. Quickselect 选择 Top-K
   ↓
6. PostCard 列表渲染 (React.memo)
```

### 4.2 敏感词检查流程

```
1. 用户输入文本
   ↓
2. getFilterInstance() 获取单例
   ↓
3. checkContent() 调用
   ↓
4. 检查缓存，过期则拉取远程
   ↓
5. DFA 扫描文本
   ↓
6. 返回过滤结果
```

## 5. 安全架构

### 5.1 认证授权

- Supabase Auth 管理用户会话
- 管理员接口使用 `requireAdmin()` 验证权限
- RLS (Row Level Security) 数据库层面权限控制

### 5.2 敏感数据保护

- 敏感词库仅管理员可访问
- 用户隐私信息脱敏
- 密码使用 bcrypt 哈希存储

## 6. 扩展性

### 6.1 水平扩展

- Next.js 应用可部署到 Vercel 或自建集群
- Supabase 支持读写分离和只读副本
- 推荐引擎可拆分为独立服务

### 6.2 功能扩展

- 推荐算法可添加机器学习模型
- 敏感词过滤可添加更多语种支持
- 组件库可扩展更多 UI 元素
