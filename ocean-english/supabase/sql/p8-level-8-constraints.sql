-- ============================================================
-- 八档统一 P8: 把 level/numeric_level 的 CHECK 约束从 1..7 放宽到 1..8（新增 ⑧雅思 IELTS）
-- ============================================================
-- Instructions: Supabase Dashboard → SQL Editor → New Query → Run
-- 幂等、可重跑：动态丢弃任何「BETWEEN 1 AND 7」的 level 约束，再补「BETWEEN 1 AND 8」。
-- 影响表：user_learning_preferences.numeric_level（用户定级写 8 必需）、grammar_points.level、
--         exam_specs.level、stimuli.level、question_sets.level。
-- 不改任何数据，只改约束。dictionary_words.levels/primary_level 无 CHECK，无需迁移。
-- ============================================================

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ['user_learning_preferences','numeric_level'],
    ['grammar_points','level'],
    ['exam_specs','level'],
    ['stimuli','level'],
    ['question_sets','level']
  ];
  t text; col text; r record;
BEGIN
  FOR i IN 1..array_length(pairs, 1) LOOP
    t := pairs[i][1]; col := pairs[i][2];
    IF to_regclass(t) IS NULL THEN CONTINUE; END IF;   -- 表不存在则跳过

    -- 1) 丢弃该表上任何「BETWEEN 1 AND 7」的 CHECK（无论自动名/手工名）
    FOR r IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE con.contype = 'c'
        AND rel.relname = t
        AND pg_get_constraintdef(con.oid) ILIKE '%BETWEEN 1 AND 7%'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, r.conname);
    END LOOP;

    -- 2) 若尚无「BETWEEN 1 AND 8」的 level 约束则补一条
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE con.contype = 'c' AND rel.relname = t
        AND pg_get_constraintdef(con.oid) ILIKE '%BETWEEN 1 AND 8%'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%I BETWEEN 1 AND 8)',
                     t, t || '_' || col || '_check', col);
    END IF;
  END LOOP;
END $$;

COMMENT ON COLUMN user_learning_preferences.numeric_level IS
  '8 档等级：1初中 2高中 3四级 4六级 5考研 6托福 7SAT 8雅思（lib/levels.ts）';
