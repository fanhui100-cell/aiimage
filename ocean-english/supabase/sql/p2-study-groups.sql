-- ============================================================
-- LexiOcean P2: 学习小组（study_groups / group_members）
-- 小组打卡墙/小组排行复用 leaderboard 视图（见 p2-leaderboard.sql）。
-- 依赖：profiles 表（phase-5c）。member_count 由路由 count 派生（不建触发器）。
-- 说明：在 Supabase SQL Editor 运行一次。可安全重跑。
-- 注意：先建两张表，再建策略（study_groups 的读策略引用 group_members）。
-- ============================================================

-- 1) 表（先都建好，避免策略引用未建表）
CREATE TABLE IF NOT EXISTS study_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 2) RLS
ALTER TABLE study_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- study_groups：公开组任何登录用户可见；私有组仅组长/成员可见
DROP POLICY IF EXISTS "study_groups_read" ON study_groups;
CREATE POLICY "study_groups_read" ON study_groups FOR SELECT
  USING (
    is_public
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members m
      WHERE m.group_id = study_groups.id AND m.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "study_groups_insert_own" ON study_groups;
CREATE POLICY "study_groups_insert_own" ON study_groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "study_groups_modify_owner" ON study_groups;
CREATE POLICY "study_groups_modify_owner" ON study_groups FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "study_groups_delete_owner" ON study_groups;
CREATE POLICY "study_groups_delete_owner" ON study_groups FOR DELETE
  USING (owner_id = auth.uid());

-- group_members：登录用户可读（展示成员/打卡墙）；仅本人加入/退出
DROP POLICY IF EXISTS "group_members_read" ON group_members;
CREATE POLICY "group_members_read" ON group_members FOR SELECT
  USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "group_members_join_self" ON group_members;
CREATE POLICY "group_members_join_self" ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "group_members_leave_self" ON group_members;
CREATE POLICY "group_members_leave_self" ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- 3) 索引
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_owner  ON study_groups(owner_id);
