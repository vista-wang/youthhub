# YouthHub UI 全面重设计 Spec

## Why
当前 YouthHub 采用"多巴胺渐变风格"，大量使用蓝-青-绿渐变、光晕动画和蓝色调阴影，视觉上虽活泼但与 Apple 设计语言的"简洁、克制、纯色"理念差距较大。同时圆角、间距、阴影体系不统一，动画效果过于花哨，不符合中学生用户群体对现代感与品质感的审美期待。需要全面重设计，使其达到 Apple 设计标准并增强对中学生用户的吸引力。

## What Changes
- **BREAKING** 移除所有渐变背景/渐变文字/渐变按钮，替换为纯色方案
- **BREAKING** 重构 Tailwind 品牌色体系，从多色渐变改为单一主色 + 语义色
- 统一圆角体系为 8/12/16/20 四档
- 统一间距体系，基于 4px 基准网格
- 精简动画效果，移除持续循环动画（pulse-soft、float），统一过渡时长
- 重构阴影体系，使用中性色阴影，减少层级
- 修复 `brand-purple` 未定义的 bug
- 优化字体层级，建立清晰的排版规范
- 增强对中学生用户的视觉吸引力（活力色彩点缀、友好图标、趣味微交互）
- 统一毛玻璃效果模糊程度

## Impact
- Affected specs: hig-compliance-audit（部分样式会覆盖之前的修复）
- Affected code: 
  - `tailwind.config.ts` - 品牌色与圆角体系
  - `src/app/globals.css` - 全局样式、CSS 变量、动画
  - `src/app/layout.tsx` - 根布局背景
  - `src/components/ui/button.tsx` - 按钮变体
  - `src/components/ui/card.tsx` - 卡片样式
  - `src/components/ui/avatar.tsx` - 头像默认背景
  - `src/components/ui/badge.tsx` - 徽章样式
  - `src/components/ui/modal.tsx` - 弹窗样式
  - `src/components/ui/confirm-dialog.tsx` - 确认对话框
  - `src/components/ui/prompt-dialog.tsx` - 输入对话框
  - `src/components/ui/toast.tsx` - 提示样式
  - `src/components/ui/like-button.tsx` - 点赞按钮
  - `src/components/layout/Navbar.tsx` - 导航栏
  - `src/components/post/PostCard.tsx` - 帖子卡片
  - `src/components/post/RecommendedPosts.tsx` - 推荐组件
  - `src/components/post/HotPosts.tsx` - 热门帖子
  - `src/components/topic/WeeklyTopicCard.tsx` - 话题卡片
  - `src/components/auth/AuthModal.tsx` - 认证弹窗
  - `src/components/comment/CommentItem.tsx` - 评论项
  - `src/components/comment/CommentForm.tsx` - 评论表单
  - `src/components/announcement/AnnouncementsBanner.tsx` - 公告横幅
  - `src/app/HomePage.tsx` - 首页
  - `src/app/hot/HotPage.tsx` - 热门页
  - `src/app/login/LoginPage.tsx` - 登录页
  - `src/app/register/RegisterPage.tsx` - 注册页
  - `src/app/profile/ProfilePage.tsx` - 个人中心
  - `src/app/create/CreatePostPage.tsx` - 发帖页
  - `src/app/post/[id]/PostDetailPage.tsx` - 帖子详情页
  - `src/app/admin/AdminPage.tsx` - 管理后台

## ADDED Requirements

### Requirement: 品牌色体系重构
系统 SHALL 采用单一主色方案，移除所有渐变色定义。主色使用 Apple 风格的纯蓝色，辅以语义色（成功绿、警告琥珀、危险红、信息青），并增加适合中学生群体的活力点缀色。

#### Scenario: 按钮颜色
- **WHEN** 渲染主操作按钮
- **THEN** 使用纯色填充（如 `#007AFF`），而非渐变

#### Scenario: 标题文字
- **WHEN** 渲染品牌标题
- **THEN** 使用纯色文字（深色或主色），而非渐变文字

### Requirement: 圆角体系统一
系统 SHALL 建立四档圆角体系：`sm=8px`、`md=12px`、`lg=16px`、`xl=20px`，所有组件严格遵循。

#### Scenario: 组件圆角一致性
- **WHEN** 检查所有 Card、Button、Modal、Input 组件
- **THEN** 圆角值严格来自四档体系，无例外值

### Requirement: 间距体系统一
系统 SHALL 基于 4px 基准网格建立间距体系，页面级内边距统一为 `px-4 py-6`，组件级内边距统一为 `p-4 md:p-5`，表单间距统一为 `space-y-4`。

#### Scenario: 间距一致性
- **WHEN** 检查所有页面和组件的内边距
- **THEN** 均为 4 的倍数，且同类组件使用相同间距

### Requirement: 动画效果精简
系统 SHALL 移除所有持续循环动画（pulse-soft、float），保留过渡动画但统一时长为 0.2-0.35s ease-in-out，弹性动画改为更微妙的 spring 效果。

#### Scenario: 页面加载后无持续动画
- **WHEN** 页面完全加载后静置
- **THEN** 无任何持续循环动画在运行

#### Scenario: 交互过渡时长
- **WHEN** 用户点击按钮或切换 Tab
- **THEN** 过渡动画时长在 0.2-0.35s 之间

### Requirement: 阴影体系统一
系统 SHALL 使用中性色阴影（不带色调），建立三档阴影：`sm`（微弱）、`md`（标准）、`lg`（弹窗/浮层），移除 `brand-shadow` 多层蓝色调阴影。

#### Scenario: 卡片阴影
- **WHEN** 渲染帖子卡片
- **THEN** 使用中性色 `shadow-sm`，无蓝色调

### Requirement: 字体排版层级
系统 SHALL 建立清晰的排版层级：大标题 `text-2xl font-bold`、标题 `text-xl font-semibold`、小标题 `text-base font-semibold`、正文 `text-sm font-normal`、辅助文字 `text-xs font-normal`。

#### Scenario: 标题字重一致性
- **WHEN** 检查所有页面标题
- **THEN** 大标题使用 `font-bold`，小标题使用 `font-semibold`，无 `font-medium` 混用

### Requirement: 中学生群体视觉吸引力
系统 SHALL 在保持 Apple 简洁风格的基础上，通过以下方式增强对中学生用户的吸引力：活力色彩点缀（如点赞红、热门橙）、友好的圆角和间距、趣味微交互（点赞弹跳、成功勾选动画）、清晰的图标系统。

#### Scenario: 点赞交互
- **WHEN** 用户点赞帖子
- **THEN** 心形图标有微妙的弹跳反馈（scale 0.9->1.1->1），颜色从灰变为红色

#### Scenario: 空状态设计
- **WHEN** 列表为空时
- **THEN** 显示友好的插图式空状态，而非简单的图标+文字

### Requirement: 毛玻璃效果统一
系统 SHALL 统一所有毛玻璃效果的模糊程度为 `backdrop-blur-xl`（24px），背景透明度为 `bg-white/80`。

#### Scenario: 导航栏与弹窗毛玻璃一致
- **WHEN** 检查 Navbar、底部栏、Modal 遮罩的毛玻璃效果
- **THEN** 模糊程度和透明度完全一致

## MODIFIED Requirements

### Requirement: 按钮变体
按钮组件 SHALL 修改 `primary` 变体为纯色填充（`bg-[#007AFF]`），移除渐变。`default` 变体改为与 `primary` 相同（纯蓝实心），原 `default` 变体的功能由 `secondary` 覆盖。新增 `danger` 变体用于破坏性操作。

### Requirement: 头像默认背景
头像组件 SHALL 将默认背景从渐变改为纯色 `bg-brand-blue`，首字母文字为白色。

### Requirement: 导航栏设计
导航栏 SHALL 移除 Logo 光晕动画和渐变文字，Logo 使用纯色圆形 + 纯色文字，"公测版"标签改为纯色胶囊。

### Requirement: 帖子卡片设计
帖子卡片 SHALL 移除 `brand-shadow`，使用中性 `shadow-sm`，头像环改为 `ring-slate-100`，底部栏背景改为纯白。

### Requirement: 管理后台 Tab
管理后台 Tab 选中态 SHALL 从渐变改为纯色 `bg-brand-blue text-white`。

## REMOVED Requirements

### Requirement: 渐变背景
**Reason**: Apple 设计语言以纯色为主，渐变不符合简洁风格
**Migration**: 所有 `bg-gradient-to-*` 替换为纯色 `bg-*`

### Requirement: 品牌渐变文字
**Reason**: `.brand-text` 渐变文字不符合 Apple 排版规范
**Migration**: 替换为纯色 `text-brand-blue` 或 `text-gray-900`

### Requirement: 品牌蓝色调阴影
**Reason**: `.brand-shadow` 带蓝色调不符合 Apple 中性阴影规范
**Migration**: 替换为中性 `shadow-sm` 或 `shadow-md`

### Requirement: 持续循环动画
**Reason**: `animate-pulse-soft`、`animate-float` 等持续动画分散注意力
**Migration**: 移除动画，使用静态样式

## 兼容性说明
- 所有功能逻辑保持不变，仅修改视觉样式
- 无障碍属性（ARIA、焦点管理）不受影响
- 数据获取和状态管理逻辑不受影响
- API 接口不变
