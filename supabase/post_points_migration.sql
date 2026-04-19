-- 11. 发帖时自动加点和经验
CREATE OR REPLACE FUNCTION public.on_post_add_points()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.add_user_points(
    NEW.author_id,
    'post',
    5,  -- 发帖 +5 点数
    5,  -- 发帖 +5 经验
    '发帖获得点数和经验'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_add_points_trigger ON public.posts;
CREATE TRIGGER on_post_add_points_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.on_post_add_points();

-- 12. 高级用户购买/续费时增加额外点数和经验
CREATE OR REPLACE FUNCTION public.on_premium_add_points()
RETURNS TRIGGER AS $$
BEGIN
  -- 只在 is_premium 从 false 变为 true 时触发
  IF OLD.is_premium = false AND NEW.is_premium = true THEN
    PERFORM public.add_user_points(
      NEW.id,
      'premium',
      10,  -- 高级用户 +10 点数
      10,  -- 高级用户 +10 经验
      '购买高级用户获得点数和经验'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_premium_add_points_trigger ON public.profiles;
CREATE TRIGGER on_premium_add_points_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_premium_add_points();
