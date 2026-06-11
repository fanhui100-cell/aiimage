-- ============================================================
-- LexiOcean 最终整合包 P1-2: 7 档数字等级云同步
-- ============================================================
-- Instructions: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (IF NOT EXISTS).
-- ============================================================

ALTER TABLE user_learning_preferences
  ADD COLUMN IF NOT EXISTS numeric_level INT
  CHECK (numeric_level BETWEEN 1 AND 7);

COMMENT ON COLUMN user_learning_preferences.numeric_level IS
  '7 档等级：1初中 2高中 3四级 4六级 5考研 6托福 7SAT（lib/levels.ts）';
