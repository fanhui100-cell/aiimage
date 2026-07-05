-- ============================================================
-- LexiOcean P3: 用户名（唯一，登录后显示）
-- 给 profiles 加 username 列 + 大小写不敏感唯一索引。
-- 查重走 /api/user/username-check（service role 读全表）；写入由 App 在注册/登录后 upsert。
-- 在 Supabase SQL Editor 运行一次。可安全重跑。
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 大小写不敏感唯一（lower(username)）；NULL 不参与唯一约束（未设用户名的老用户不受影响）
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON profiles (lower(username)) WHERE username IS NOT NULL;
