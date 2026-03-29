-- ============================================
-- 友料(YouthHub) 数据库架构设计
-- 面向初中生的轻量级社区论坛
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户扩展表 (profiles)
-- 扩展 Supabase Auth 的 auth.users 表
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio VARCHAR(200),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为用户名创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- 自动创建用户 profile 的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', '用户' || LEFT(NEW.id::TEXT, 6)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'bio'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除已存在的触发器（如果有）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器：新用户注册时自动创建 profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 帖子表 (posts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为帖子创建索引
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON public.posts(is_deleted);

-- ============================================
-- 3. 评论表 (comments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为评论创建索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- ============================================
-- 4. 点赞表 (likes)
-- 用于追踪用户对帖子和评论的点赞
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  likeable_id UUID NOT NULL,
  likeable_type VARCHAR(20) NOT NULL CHECK (likeable_type IN ('post', 'comment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, likeable_id, likeable_type)
);

-- 为点赞创建索引
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_likeable ON public.likes(likeable_id, likeable_type);

-- ============================================
-- 5. 敏感词表 (sensitive_words)
-- 用于内容过滤，支持分类和严重程度
-- ============================================
CREATE TABLE IF NOT EXISTS public.sensitive_words (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  replacement VARCHAR(50) DEFAULT '***',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensitive_words_category ON public.sensitive_words(category);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_is_active ON public.sensitive_words(is_active);

-- ============================================
-- 6. 公告表 (announcements)
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
-- 7. 每周话题表 (weekly_topics)
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
-- 8. 用户关键词偏好表 (user_keywords)
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
-- 9. 帖子关键词表 (post_keywords)
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
-- 触发器：自动更新 updated_at 字段
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表添加更新触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 为 posts 表添加更新触发器
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 为 comments 表添加更新触发器
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
-- 函数：更新帖子评论计数
-- ============================================
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- ============================================
-- 函数：更新点赞计数
-- ============================================
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.likeable_type = 'post' THEN
      UPDATE public.posts 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.likeable_id;
    ELSIF NEW.likeable_type = 'comment' THEN
      UPDATE public.comments 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.likeable_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.likeable_type = 'post' THEN
      UPDATE public.posts 
      SET likes_count = GREATEST(likes_count - 1, 0) 
      WHERE id = OLD.likeable_id;
    ELSIF OLD.likeable_type = 'comment' THEN
      UPDATE public.comments 
      SET likes_count = GREATEST(likes_count - 1, 0) 
      WHERE id = OLD.likeable_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- ============================================
-- RLS (Row Level Security) 策略配置
-- ============================================

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_keywords ENABLE ROW LEVEL SECURITY;

-- ============================================
-- profiles 表 RLS 策略
-- ============================================

-- 所有人可以查看用户资料
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

-- 用户只能更新自己的资料
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 用户只能插入自己的资料（通常由触发器自动创建）
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- posts 表 RLS 策略
-- ============================================

-- 所有人可以查看未删除的帖子
CREATE POLICY "posts_select_policy" ON public.posts
  FOR SELECT USING (is_deleted = false OR auth.uid() = author_id);

-- 登录用户可以发帖
CREATE POLICY "posts_insert_policy" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 作者可以更新自己的帖子
CREATE POLICY "posts_update_policy" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- 作者可以删除自己的帖子（软删除）
CREATE POLICY "posts_delete_policy" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- comments 表 RLS 策略
-- ============================================

-- 所有人可以查看未删除的评论
CREATE POLICY "comments_select_policy" ON public.comments
  FOR SELECT USING (is_deleted = false OR auth.uid() = author_id);

-- 登录用户可以发表评论
CREATE POLICY "comments_insert_policy" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 作者可以更新自己的评论
CREATE POLICY "comments_update_policy" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

-- 作者可以删除自己的评论（软删除）
CREATE POLICY "comments_delete_policy" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- likes 表 RLS 策略
-- ============================================

-- 登录用户可以查看所有点赞
CREATE POLICY "likes_select_policy" ON public.likes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 登录用户可以点赞
CREATE POLICY "likes_insert_policy" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以取消自己的点赞
CREATE POLICY "likes_delete_policy" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- sensitive_words 表 RLS 策略
-- ============================================

-- 只有管理员可以管理敏感词（这里简化为所有人可读，实际生产环境需要更严格的控制）
CREATE POLICY "sensitive_words_select_policy" ON public.sensitive_words
  FOR SELECT USING (true);

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
-- 插入一些测试敏感词（升级版）
-- ============================================
INSERT INTO public.sensitive_words (word, category, severity, replacement) VALUES
  ('测试敏感词1', 'general', 'medium', '***'),
  ('测试敏感词2', 'general', 'medium', '***'),
  ('广告', 'spam', 'low', '[广告]'),
  ('加微信', 'spam', 'high', '***'),
  ('刷单', 'fraud', 'critical', '***')
ON CONFLICT (word) DO NOTHING;

-- ============================================
-- 插入测试公告
-- ============================================
INSERT INTO public.announcements (title, content, type, priority) VALUES
  ('欢迎来到友料社区！', '友料是一个面向初中生的温暖社区，我们致力于提供安全、积极、解压的交流环境。请遵守社区规范，友善发言！', 'important', 10),
  ('社区规范更新', '为了营造更好的社区氛围，我们更新了社区规范，请各位同学仔细阅读。', 'info', 5)
ON CONFLICT DO NOTHING;

-- ============================================
-- 插入测试每周话题
-- ============================================
INSERT INTO public.weekly_topics (title, description, week_start, week_end) VALUES
  ('你的学习小妙招', '分享你的学习方法和技巧，帮助更多同学提高学习效率！', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT (week_start, week_end) DO NOTHING;

-- ============================================
-- 创建视图：帖子列表视图（包含作者信息）
-- ============================================
CREATE OR REPLACE VIEW public.posts_with_author AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.likes_count,
  p.comments_count,
  p.created_at,
  p.updated_at,
  p.author_id,
  pr.username AS author_name,
  pr.avatar_url AS author_avatar
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
WHERE p.is_deleted = false
ORDER BY p.created_at DESC;

-- ============================================
-- 创建视图：评论列表视图（包含作者信息）
-- ============================================
CREATE OR REPLACE VIEW public.comments_with_author AS
SELECT 
  c.id,
  c.post_id,
  c.parent_id,
  c.content,
  c.likes_count,
  c.created_at,
  c.updated_at,
  c.author_id,
  pr.username AS author_name,
  pr.avatar_url AS author_avatar
FROM public.comments c
LEFT JOIN public.profiles pr ON c.author_id = pr.id
WHERE c.is_deleted = false
ORDER BY c.created_at ASC;
