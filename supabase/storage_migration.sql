-- ============================================
-- 头像和附件功能 迁移脚本
-- ============================================

-- 1. 在 posts 表添加附件字段（图片 + 文件）
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';

-- 2. 创建头像存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
])
ON CONFLICT (id) DO NOTHING;

-- 3. 创建附件存储桶（支持图片、文档、视频、音频）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('attachments', 'attachments', true, 20971520, ARRAY[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
])
ON CONFLICT (id) DO NOTHING;

-- 4. 头像存储桶策略
CREATE POLICY "avatars_upload_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 5. 附件存储桶策略
CREATE POLICY "attachments_upload_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "attachments_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'attachments');

CREATE POLICY "attachments_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
