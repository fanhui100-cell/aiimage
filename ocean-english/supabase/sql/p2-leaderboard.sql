-- ============================================================
-- LexiOcean P2: 排行榜（leaderboard）
-- 复用现有 user_study_progress(total_xp/current_streak/longest_streak)
-- + profiles(display_name/avatar)，无需新建 XP 表。
-- 周榜需 week_xp/week_start（下方 ALTER 加列；由 App 端同步维护，
--   未维护时周榜=0，总榜/连击榜立即可用）。
-- 跨用户读取通过「定义者视图」实现：视图默认以所有者权限运行，绕过
--   底表 RLS，仅暴露排行所需安全字段。
-- 隐私：这是全体用户的全局榜；如需可加 profiles.lb_opt_out 列后在视图 WHERE 过滤。
-- 说明：在 Supabase SQL Editor 运行一次。可安全重跑。
-- ============================================================

-- 周榜增量列（App 端：跨周时把 week_xp 归零并更新 week_start）
ALTER TABLE user_study_progress ADD COLUMN IF NOT EXISTS week_xp     INT  DEFAULT 0;
ALTER TABLE user_study_progress ADD COLUMN IF NOT EXISTS week_start  DATE;

-- 排行榜视图（仅暴露：名称/头像/XP/连击/最近学习日）
DROP VIEW IF EXISTS leaderboard;
CREATE VIEW leaderboard AS
SELECT
  p.id                                                            AS user_id,
  COALESCE(NULLIF(p.display_name, ''), split_part(p.email, '@', 1), 'Learner') AS name,
  p.avatar_url,
  COALESCE(sp.total_xp, 0)        AS total_xp,
  COALESCE(sp.week_xp, 0)         AS week_xp,
  COALESCE(sp.current_streak, 0)  AS current_streak,
  COALESCE(sp.longest_streak, 0)  AS longest_streak,
  sp.last_study_date              AS last_study_date
FROM profiles p
LEFT JOIN user_study_progress sp ON sp.user_id = p.id;

-- 暴露给已登录用户（PostgREST 读视图需显式授权）
GRANT SELECT ON leaderboard TO authenticated;

CREATE INDEX IF NOT EXISTS idx_usp_total_xp ON user_study_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_usp_week_xp  ON user_study_progress(week_xp DESC);
CREATE INDEX IF NOT EXISTS idx_usp_streak   ON user_study_progress(current_streak DESC);
