-- ============================================================
-- 八档统一 P8: 把 level/numeric_level 的 CHECK 约束从 1..7 放宽到 1..8（新增 ⑧雅思 IELTS）
-- ============================================================
-- Instructions: Supabase Dashboard → SQL Editor → New Query → Run
-- 幂等、可重跑：按「约束作用的列」(pg_constraint.conkey) 定位并丢弃该 level 列上的所有单列 CHECK，
--   再统一补「BETWEEN 1 AND 8」。
-- ⚠ 不能用 pg_get_constraintdef ILIKE '%BETWEEN 1 AND 7%' 匹配：PostgreSQL 会把 BETWEEN 规范化存为
--   「(col >= 1) AND (col <= 7)」，定义里根本没有 "BETWEEN" 字样，文本匹配永远落空 → 旧约束删不掉、
--   补新约束时同名 42710 冲突。改用 conkey 按列匹配，与约束的写法/命名无关。
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
  t text; col text; r record; attn smallint;
BEGIN
  FOR i IN 1..array_length(pairs, 1) LOOP
    t := pairs[i][1]; col := pairs[i][2];
    IF to_regclass(t) IS NULL THEN CONTINUE; END IF;   -- 表不存在则跳过

    -- 取 col 的列序号；列不存在则跳过
    SELECT att.attnum INTO attn
    FROM pg_attribute att
    WHERE att.attrelid = to_regclass(t)
      AND att.attname = col AND att.attnum > 0 AND NOT att.attisdropped;
    IF attn IS NULL THEN CONTINUE; END IF;

    -- 1) 丢弃「仅作用于 col 单列」的所有 CHECK 约束（覆盖旧 1..7、或本脚本上次建的 1..8，
    --    无论 PG 把定义规范化成 >= AND <= 还是任意命名）。多列 CHECK / 其它列约束不受影响。
    FOR r IN
      SELECT con.conname
      FROM pg_constraint con
      WHERE con.contype = 'c'
        AND con.conrelid = to_regclass(t)
        AND con.conkey = ARRAY[attn]::smallint[]
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, r.conname);
    END LOOP;

    -- 2) 统一补「BETWEEN 1 AND 8」（上面已删干净，用约定名重建无冲突）
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%I BETWEEN 1 AND 8)',
                   t, t || '_' || col || '_check', col);
  END LOOP;
END $$;

COMMENT ON COLUMN user_learning_preferences.numeric_level IS
  '8 档等级：1初中 2高中 3四级 4六级 5考研 6托福 7SAT 8雅思（lib/levels.ts）';
