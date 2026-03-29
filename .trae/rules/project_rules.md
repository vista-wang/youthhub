# YouthHub 项目规则

## 技术栈
- Next.js 14+ (App Router)
- TypeScript (严格模式)
- Tailwind CSS
- Supabase (Auth, Database, Storage)
- shadcn/ui 组件库

## 代码规范
- 使用 TypeScript 严格类型
- 组件使用函数式组件
- 使用 Tailwind CSS 进行样式
- 多巴胺配色主题 (dopamine colors)

## 常用命令
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run lint` - 运行 ESLint 检查

## 数据库
- 使用 Supabase PostgreSQL
- 启用 RLS (Row Level Security)
- 查看 supabase/schema.sql 了解表结构

## 环境变量
- NEXT_PUBLIC_SUPABASE_URL - Supabase 项目 URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase 匿名密钥
- SUPABASE_SERVICE_ROLE_KEY - Supabase 服务角色密钥
