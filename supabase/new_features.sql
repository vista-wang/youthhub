-- ============================================
-- 友料(YouthHub) 新功能数据库架构
-- 包含：公告、每周话题、个性化推荐、升级敏感词系统
-- ============================================

-- 启用必要的扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 升级敏感词表 (sensitive_words)
-- 添加分类、严重程度、替换文本等字段
-- ============================================

-- 添加新字段到敏感词表
ALTER TABLE public.sensitive_words 
ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS replacement VARCHAR(50) DEFAULT '***',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sensitive_words_category ON public.sensitive_words(category);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_is_active ON public.sensitive_words(is_active);

-- ============================================
-- 2. 公告表 (announcements)
-- 支持多个公告，按优先级和创建时间排序
-- ============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'important', 'event')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority DESC);

-- ============================================
-- 3. 每周话题表 (weekly_topics)
-- 每周一个热门话题
-- ============================================
CREATE TABLE IF NOT EXISTS public.weekly_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  cover_image TEXT,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_start, week_end)
);

CREATE INDEX IF NOT EXISTS idx_weekly_topics_is_active ON public.weekly_topics(is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_topics_week ON public.weekly_topics(week_start, week_end);

-- ============================================
-- 4. 用户关键词偏好表 (user_keywords)
-- 用于个性化推荐
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  keyword VARCHAR(50) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.00,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'post', 'like', 'comment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_user_keywords_user_id ON public.user_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_user_keywords_keyword ON public.user_keywords(keyword);

-- ============================================
-- 5. 帖子关键词表 (post_keywords)
-- 用于帖子关键词提取和推荐
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  keyword VARCHAR(50) NOT NULL,
  relevance DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_post_keywords_post_id ON public.post_keywords(post_id);
CREATE INDEX IF NOT EXISTS idx_post_keywords_keyword ON public.post_keywords(keyword);

-- ============================================
-- 触发器：为新表添加 updated_at 自动更新
-- ============================================

-- 为 sensitive_words 表添加更新触发器
DROP TRIGGER IF EXISTS update_sensitive_words_updated_at ON public.sensitive_words;
CREATE TRIGGER update_sensitive_words_updated_at
  BEFORE UPDATE ON public.sensitive_words
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 为 announcements 表添加更新触发器
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 为 weekly_topics 表添加更新触发器
DROP TRIGGER IF EXISTS update_weekly_topics_updated_at ON public.weekly_topics;
CREATE TRIGGER update_weekly_topics_updated_at
  BEFORE UPDATE ON public.weekly_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 为 user_keywords 表添加更新触发器
DROP TRIGGER IF EXISTS update_user_keywords_updated_at ON public.user_keywords;
CREATE TRIGGER update_user_keywords_updated_at
  BEFORE UPDATE ON public.user_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) 策略配置
-- ============================================

-- 启用 RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_keywords ENABLE ROW LEVEL SECURITY;

-- ============================================
-- announcements 表 RLS 策略
-- ============================================

-- 所有人可以查看激活的公告
CREATE POLICY "announcements_select_policy" ON public.announcements
  FOR SELECT USING (is_active = true);

-- ============================================
-- weekly_topics 表 RLS 策略
-- ============================================

-- 所有人可以查看激活的每周话题
CREATE POLICY "weekly_topics_select_policy" ON public.weekly_topics
  FOR SELECT USING (is_active = true);

-- ============================================
-- user_keywords 表 RLS 策略
-- ============================================

-- 用户可以查看自己的关键词偏好
CREATE POLICY "user_keywords_select_policy" ON public.user_keywords
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以插入自己的关键词偏好
CREATE POLICY "user_keywords_insert_policy" ON public.user_keywords
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的关键词偏好
CREATE POLICY "user_keywords_update_policy" ON public.user_keywords
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户可以删除自己的关键词偏好
CREATE POLICY "user_keywords_delete_policy" ON public.user_keywords
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- post_keywords 表 RLS 策略
-- ============================================

-- 所有人可以查看帖子关键词
CREATE POLICY "post_keywords_select_policy" ON public.post_keywords
  FOR SELECT USING (true);

-- 登录用户可以插入帖子关键词
CREATE POLICY "post_keywords_insert_policy" ON public.post_keywords
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 初始数据
-- ============================================

-- 插入升级版敏感词
INSERT INTO public.sensitive_words (word, category, severity, replacement) VALUES
  ('测试敏感词1', 'general', 'medium', '***'),
  ('测试敏感词2', 'general', 'medium', '***'),
  ('广告', 'spam', 'low', '[广告]'),
  ('加微信', 'spam', 'high', '***'),
  ('刷单', 'fraud', 'critical', '***')
ON CONFLICT (word) DO NOTHING;

-- 插入测试公告
INSERT INTO public.announcements (title, content, type, priority) VALUES
  ('欢迎来到友料社区！', '友料是一个面向初中生的温暖社区，我们致力于提供安全、积极、解压的交流环境。请遵守社区规范，友善发言！', 'important', 10),
  ('社区规范更新', '为了营造更好的社区氛围，我们更新了社区规范，请各位同学仔细阅读。', 'info', 5)
ON CONFLICT DO NOTHING;

-- 插入测试每周话题
INSERT INTO public.weekly_topics (title, description, week_start, week_end) VALUES
  ('你的学习小妙招', '分享你的学习方法和技巧，帮助更多同学提高学习效率！', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT (week_start, week_end) DO NOTHING;
