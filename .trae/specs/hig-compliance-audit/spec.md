# Apple HIG 合规性审计与修复 Spec

## Why
项目 UI 存在大量不符合 Apple Human Interface Guidelines 的问题，包括严重的无障碍缺陷（Modal 缺少 ARIA 角色、图标按钮缺少标签）、触摸目标过小（多处低于 44pt 最低标准）、使用原生对话框（alert/confirm/prompt）等，影响用户体验和平台一致性。

## What Changes
- 修复所有 Modal 的无障碍属性：添加 `role="dialog"`、`aria-modal`、焦点陷阱、Escape 关闭
- 为所有图标按钮添加 `aria-label`，为切换按钮添加 `aria-pressed`
- 增大所有交互元素触摸目标至 ≥44x44pt
- 替换 `alert()`/`confirm()`/`prompt()` 为自定义 UI 组件
- 为表单添加 `autocomplete` 属性，为错误提示添加 `role="alert"`
- 修复 EmojiPicker 无障碍（ARIA 角色、键盘导航）
- 添加 Safe Area 适配
- 修复 Tab 组件 ARIA 语义
- 修复 PostCard 嵌套交互元素问题
- 为自动轮播添加暂停控制
- 修复 AnnouncementsBanner 关闭按钮触摸目标
- 添加骨架屏 `aria-busy` 属性

## Impact
- Affected code: 所有 Modal 组件、所有含图标按钮的组件、所有表单页面、PostCard、EmojiPicker、AnnouncementsBanner、Navbar、AdminPage、globals.css、layout.tsx

## ADDED Requirements

### Requirement: Modal 无障碍
系统 SHALL 为所有 Modal（AnnouncementModal、AuthModal、AdminPage 内 Modal）添加 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`，实现焦点陷阱（Tab 键不可跳出 Modal），并支持 Escape 键关闭。

#### Scenario: Modal 打开时的键盘导航
- **WHEN** 用户打开任意 Modal
- **THEN** 焦点被限制在 Modal 内部，Tab 循环遍历 Modal 内可聚焦元素，按 Escape 键关闭 Modal

#### Scenario: 屏幕阅读器识别 Modal
- **WHEN** 屏幕阅读器用户遇到 Modal
- **THEN** 读出 Modal 的标题（通过 `aria-labelledby`），识别为对话框角色

### Requirement: 图标按钮无障碍标签
系统 SHALL 为所有仅含图标的按钮添加 `aria-label`，描述按钮功能。

#### Scenario: 屏幕阅读器识别按钮功能
- **WHEN** 屏幕阅读器用户聚焦到图标按钮
- **THEN** 读出按钮的功能描述（如"菜单"、"返回"、"点赞"、"关闭"等）

### Requirement: 切换按钮状态标注
系统 SHALL 为所有切换状态的按钮（点赞等）添加 `aria-pressed` 属性。

#### Scenario: 屏幕阅读器感知按钮状态
- **WHEN** 用户点赞或取消点赞
- **THEN** `aria-pressed` 属性同步更新，屏幕阅读器读出当前状态

### Requirement: 最小触摸目标
系统 SHALL 确保所有可交互元素的触摸目标区域不小于 44x44pt（约 44px），通过增加 padding 或使用 `min-w-[44px] min-h-[44px]` 实现。

#### Scenario: 移动端触摸操作
- **WHEN** 用户在移动设备上点击小图标按钮（如点赞、关闭、删除标签）
- **THEN** 触摸目标区域足够大（≥44px），不会误触相邻元素

### Requirement: 自定义对话框替代原生对话框
系统 SHALL 使用自定义 UI 对话框替代 `alert()`、`confirm()`、`prompt()` 原生对话框，确保视觉一致性和可定制性。

#### Scenario: 破坏性操作确认
- **WHEN** 管理员执行删除帖子、封禁用户等破坏性操作
- **THEN** 显示自定义确认对话框，包含操作说明和确认/取消按钮

#### Scenario: 封禁原因输入
- **WHEN** 管理员封禁用户
- **THEN** 显示自定义输入对话框，包含文本输入框和提交/取消按钮

#### Scenario: 链接复制成功提示
- **WHEN** 用户复制分享链接成功
- **THEN** 显示非侵入式 Toast 提示，而非 `alert()`

### Requirement: 表单 autocomplete 属性
系统 SHALL 为所有表单输入框添加正确的 `autocomplete` 属性，支持密码管理器和浏览器自动填充。

#### Scenario: 浏览器自动填充
- **WHEN** 用户在登录页聚焦邮箱输入框
- **THEN** 浏览器提供已保存的邮箱地址建议

### Requirement: 错误提示无障碍
系统 SHALL 为所有动态出现的错误提示添加 `role="alert"` 或 `aria-live="assertive"`，确保屏幕阅读器即时播报。

#### Scenario: 表单验证错误播报
- **WHEN** 表单提交失败显示错误消息
- **THEN** 屏幕阅读器立即读出错误内容

### Requirement: EmojiPicker 无障碍
系统 SHALL 为 EmojiPicker 添加 `role="listbox"`、每个 Emoji 添加 `role="option"` 和 `aria-label`，支持方向键导航。

#### Scenario: 键盘导航 Emoji
- **WHEN** 用户打开 Emoji 选择器后按方向键
- **THEN** 焦点在 Emoji 间移动，屏幕阅读器读出 Emoji 名称

### Requirement: Safe Area 适配
系统 SHALL 在根布局中添加 `viewport-fit=cover` 和底部安全区域 padding，确保在刘海/灵动岛设备上内容不被遮挡。

#### Scenario: iPhone 灵动岛设备浏览
- **WHEN** 用户在 iPhone 14 Pro 及以上设备浏览页面
- **THEN** 底部固定栏不被灵动岛区域遮挡，内容完整显示

### Requirement: Tab 组件 ARIA 语义
系统 SHALL 为 Tab 切换组件添加 `role="tablist"`、`role="tab"` 和 `aria-selected` 属性。

#### Scenario: 屏幕阅读器识别 Tab 导航
- **WHEN** 屏幕阅读器用户浏览首页 Tab 栏
- **THEN** 识别为标签页列表，读出每个 Tab 的名称和选中状态

### Requirement: PostCard 交互元素解耦
系统 SHALL 将 PostCard 中的点赞按钮从卡片链接中分离，避免嵌套交互元素。

#### Scenario: 屏幕阅读器导航帖子卡片
- **WHEN** 屏幕阅读器用户浏览帖子列表
- **THEN** 卡片整体和点赞按钮是独立的交互元素，无嵌套冲突

### Requirement: 自动轮播暂停控制
系统 SHALL 为 AnnouncementsBanner 的自动轮播添加暂停/播放按钮，满足 WCAG 2.1 SC 2.2.2 要求。

#### Scenario: 用户暂停轮播
- **WHEN** 用户点击轮播暂停按钮
- **THEN** 自动轮播停止，仅手动切换

### Requirement: 骨架屏无障碍标注
系统 SHALL 为所有骨架屏加载状态添加 `aria-busy="true"` 和 `aria-hidden="true"`。

#### Scenario: 加载状态无障碍
- **WHEN** 页面内容正在加载显示骨架屏
- **THEN** 屏幕阅读器跳过骨架屏，等待真实内容加载

## MODIFIED Requirements

### Requirement: 导航栏汉堡菜单
导航栏汉堡菜单按钮 SHALL 添加 `aria-label="菜单"` 和 `aria-expanded` 属性，移动端菜单 SHALL 支持 Escape 键关闭。

### Requirement: Turnstile 站点密钥
Turnstile 组件 SHALL 从环境变量读取站点密钥，而非硬编码在代码中。

## REMOVED Requirements

无移除项。
