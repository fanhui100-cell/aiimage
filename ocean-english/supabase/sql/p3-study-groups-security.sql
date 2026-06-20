-- ============================================================
-- LexiOcean P3: 学习小组安全收紧（修复 Codex 审查 HIGH）
-- 问题：
--   1) group_members 读策略对所有登录用户开放 → 泄露全站成员关系；
--   2) group_members 自助插入只校验本人 → 知道 group_id 即可加入任意私有组。
-- 方案：
--   · 读：仅「本人 / 公开组 / 自己拥有的组 / 自己所属的组」可见；
--   · 写：直接自助插入仅限公开组或自己的组；私有组改走 join_group(code) / join_group_by_code(code)；
--   · 成员判定用 SECURITY DEFINER 函数绕过 RLS，避免 group_members 自引用递归。
-- 依赖：p2-study-groups.sql 已建表。在 Supabase SQL Editor 运行一次。可安全重跑。
-- ============================================================

-- 1) 成员判定（SECURITY DEFINER 绕过 RLS，杜绝策略内自引用递归）
CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid, uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM group_members WHERE group_id = gid AND user_id = uid);
$$;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;

-- 2) study_groups 读策略：公开组 / 自己拥有的组 / 自己所属的组。
--    重要：不要在 policy 内直接 SELECT group_members，避免与 group_members_read 互相递归。
DROP POLICY IF EXISTS "study_groups_read" ON study_groups;
CREATE POLICY "study_groups_read" ON study_groups FOR SELECT USING (
  is_public
  OR owner_id = auth.uid()
  OR public.is_group_member(study_groups.id, auth.uid())
);

-- 3) group_members 读策略：本人 / 公开组 / 自己拥有的组 / 自己所属的组
DROP POLICY IF EXISTS "group_members_read" ON group_members;
CREATE POLICY "group_members_read" ON group_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM study_groups g
    WHERE g.id = group_members.group_id
      AND (g.is_public OR g.owner_id = auth.uid())
  )
  OR public.is_group_member(group_members.group_id, auth.uid())
);

-- 4) 直接自助加入仅限公开组 / 自己的组；私有组走下方 RPC（带邀请码校验）
DROP POLICY IF EXISTS "group_members_join_self" ON group_members;
CREATE POLICY "group_members_join_self" ON group_members FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM study_groups g
    WHERE g.id = group_members.group_id
      AND (g.is_public OR g.owner_id = auth.uid())
  )
);

-- 5) 按 group_id 加入：公开组直接进；私有组需匹配邀请码（SECURITY DEFINER 绕过 INSERT 策略）
CREATE OR REPLACE FUNCTION public.join_group(gid uuid, code text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g study_groups%ROWTYPE; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO g FROM study_groups WHERE id = gid;
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;
  IF (NOT g.is_public) AND g.owner_id <> uid
     AND (code IS NULL OR g.invite_code IS NULL OR upper(btrim(code)) <> upper(g.invite_code)) THEN
    RAISE EXCEPTION 'invite_required';
  END IF;
  INSERT INTO group_members (group_id, user_id) VALUES (gid, uid)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN TRUE;
END; $$;
REVOKE ALL ON FUNCTION public.join_group(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_group(uuid, text) TO authenticated;

-- 6) 按邀请码加入：私有组不可被发现，只能凭码加入（SECURITY DEFINER 绕过 study_groups 读策略）
CREATE OR REPLACE FUNCTION public.join_group_by_code(code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g study_groups%ROWTYPE; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF code IS NULL OR btrim(code) = '' THEN RAISE EXCEPTION 'invite_required'; END IF;
  SELECT * INTO g FROM study_groups WHERE upper(invite_code) = upper(btrim(code));
  IF NOT FOUND THEN RAISE EXCEPTION 'group_not_found'; END IF;
  INSERT INTO group_members (group_id, user_id) VALUES (g.id, uid)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN g.id;
END; $$;
REVOKE ALL ON FUNCTION public.join_group_by_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;
