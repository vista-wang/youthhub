-- ============================================
-- 友料(YouthHub) 管理员功能数据库迁移脚本
-- 包含：管理员角色、用户封禁、管理权限
-- ============================================

-- ============================================
-- 1. 升级用户表 (profiles)
-- 添加角色和封禁状态字段
-- ============================================

-- 添加角色字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- 添加封禁状态字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 添加封禁原因字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 添加封禁时间字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- ============================================
-- 2. 管理操作日志表 (admin_logs)
-- 记录管理员操作
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('post', 'user', 'announcement', 'topic', 'sensitive_word')),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- ============================================
-- 3. 更新 RLS 策略
-- ============================================

-- 管理员可以查看所有公告（包括未激活的）
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
CREATE POLICY "announcements_select_policy" ON public.announcements
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以插入公告
CREATE POLICY "announcements_insert_policy" ON public.announcements
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以更新公告
CREATE POLICY "announcements_update_policy" ON public.announcements
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以删除公告
CREATE POLICY "announcements_delete_policy" ON public.announcements
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以查看所有每周话题（包括未激活的）
DROP POLICY IF EXISTS "weekly_topics_select_policy" ON public.weekly_topics;
CREATE POLICY "weekly_topics_select_policy" ON public.weekly_topics
  FOR SELECT USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以插入每周话题
CREATE POLICY "weekly_topics_insert_policy" ON public.weekly_topics
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以更新每周话题
CREATE POLICY "weekly_topics_update_policy" ON public.weekly_topics
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以删除每周话题
CREATE POLICY "weekly_topics_delete_policy" ON public.weekly_topics
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以管理敏感词
CREATE POLICY "sensitive_words_insert_policy" ON public.sensitive_words
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "sensitive_words_update_policy" ON public.sensitive_words
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "sensitive_words_delete_policy" ON public.sensitive_words
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以查看所有帖子（包括已删除的）
DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts
  FOR SELECT USING (is_deleted = false OR auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以删除任何帖子
CREATE POLICY "posts_admin_delete_policy" ON public.posts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员可以更新任何帖子
CREATE POLICY "posts_admin_update_policy" ON public.posts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- 管理员日志 RLS
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_logs_select_policy" ON public.admin_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

CREATE POLICY "admin_logs_insert_policy" ON public.admin_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- ============================================
-- 4. 创建管理员辅助函数
-- ============================================

-- 检查用户是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 软删除帖子（管理员操作）
CREATE OR REPLACE FUNCTION public.admin_delete_post(
  post_id UUID,
  admin_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin(admin_id) THEN
    RETURN FALSE;
  END IF;

  -- 软删除帖子
  UPDATE public.posts 
  SET is_deleted = TRUE 
  WHERE id = post_id;

  -- 记录日志
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
  VALUES (admin_id, 'delete_post', 'post', post_id, jsonb_build_object('reason', reason));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 封禁用户
CREATE OR REPLACE FUNCTION public.ban_user(
  target_user_id UUID,
  admin_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin(admin_id) THEN
    RETURN FALSE;
  END IF;

  -- 不能封禁管理员
  IF public.is_admin(target_user_id) THEN
    RETURN FALSE;
  END IF;

  -- 封禁用户
  UPDATE public.profiles 
  SET is_banned = TRUE,
      ban_reason = reason,
      banned_at = NOW()
  WHERE id = target_user_id;

  -- 记录日志
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
  VALUES (admin_id, 'ban_user', 'user', target_user_id, jsonb_build_object('reason', reason));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 解封用户
CREATE OR REPLACE FUNCTION public.unban_user(
  target_user_id UUID,
  admin_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 检查是否为管理员
  IF NOT public.is_admin(admin_id) THEN
    RETURN FALSE;
  END IF;

  -- 解封用户
  UPDATE public.profiles 
  SET is_banned = FALSE,
      ban_reason = NULL,
      banned_at = NULL
  WHERE id = target_user_id;

  -- 记录日志
  INSERT INTO public.admin_logs (admin_id, action, target_type, target_id)
  VALUES (admin_id, 'unban_user', 'user', target_user_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 插入测试管理员账号
-- 注意：实际使用时请修改为真实的管理员用户ID
-- ============================================

-- 设置第一个用户为管理员（仅用于测试）
-- UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM public.profiles LIMIT 1);
