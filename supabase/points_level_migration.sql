-- ============================================
-- 点数、经验值、等级、高级用户 迁移脚本
-- ============================================

-- 1. 在 profiles 表添加新字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. 创建点数记录表（用于追踪点数变动）
CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(30) NOT NULL CHECK (action IN ('like', 'comment', 'share', 'premium_purchase', 'premium_renew', 'exchange', 'admin_adjust')),
  points INTEGER NOT NULL,
  experience INTEGER NOT NULL,
  description VARCHAR(200),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action ON public.point_transactions(action);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);

-- 3. 启用 RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的点数记录
CREATE POLICY "point_transactions_select_policy" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 系统可以插入点数记录（通过 service_role 或触发器）
CREATE POLICY "point_transactions_insert_policy" ON public.point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. 创建等级计算函数
CREATE OR REPLACE FUNCTION public.calculate_level(exp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF exp < 25 THEN RETURN 1;
  ELSIF exp < 50 THEN RETURN 2;
  ELSIF exp < 100 THEN RETURN 3;
  ELSIF exp < 200 THEN RETURN 4;
  ELSIF exp < 400 THEN RETURN 5;
  ELSIF exp < 800 THEN RETURN 6;
  ELSIF exp < 1600 THEN RETURN 7;
  ELSIF exp < 3200 THEN RETURN 8;
  ELSIF exp < 6400 THEN RETURN 9;
  ELSE RETURN 10;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. 创建添加点数和经验的函数
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id UUID,
  p_action VARCHAR(30),
  p_points INTEGER,
  p_experience INTEGER,
  p_description VARCHAR(200) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_new_points INTEGER;
  v_new_experience INTEGER;
  v_new_level INTEGER;
BEGIN
  UPDATE public.profiles
  SET 
    points = points + p_points,
    experience = experience + p_experience,
    level = public.calculate_level(experience + p_experience)
  WHERE id = p_user_id
  RETURNING points, experience INTO v_new_points, v_new_experience;

  v_new_level := public.calculate_level(v_new_experience);

  UPDATE public.profiles SET level = v_new_level WHERE id = p_user_id;

  INSERT INTO public.point_transactions (user_id, action, points, experience, description, reference_id)
  VALUES (p_user_id, p_action, p_points, p_experience, p_description, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 点赞时自动加点和经验的触发器
CREATE OR REPLACE FUNCTION public.on_like_add_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.add_user_points(
    NEW.user_id,
    'like',
    1,
    1,
    '点赞获得点数和经验'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_add_points_trigger ON public.likes;
CREATE TRIGGER on_like_add_points_trigger
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.on_like_add_points();

-- 取消点赞不扣除点数和经验值（只移除点赞记录，不触发扣减）
DROP TRIGGER IF EXISTS on_unlike_remove_points_trigger ON public.likes;

-- 7. 评论时自动加点和经验
CREATE OR REPLACE FUNCTION public.on_comment_add_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.add_user_points(
    NEW.author_id,
    'comment',
    2,
    2,
    '评论获得点数和经验'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_add_points_trigger ON public.comments;
CREATE TRIGGER on_comment_add_points_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.on_comment_add_points();

-- 8. 更新 posts_with_author 视图，添加作者等级和图片
CREATE OR REPLACE VIEW public.posts_with_author AS
SELECT 
  p.id,
  p.title,
  p.content,
  p.likes_count,
  p.comments_count,
  p.image_urls,
  p.created_at,
  p.updated_at,
  p.author_id,
  pr.username AS author_name,
  pr.avatar_url AS author_avatar,
  pr.level AS author_level
FROM public.posts p
LEFT JOIN public.profiles pr ON p.author_id = pr.id
WHERE p.is_deleted = false
ORDER BY p.created_at DESC;

-- 9. 更新 profiles 的 RLS 策略（允许读取新字段）
-- 已有的 select 策略允许所有人读取，无需修改

-- 10. 为现有用户初始化等级
UPDATE public.profiles 
SET level = public.calculate_level(experience)
WHERE level = 1 AND experience > 0;
