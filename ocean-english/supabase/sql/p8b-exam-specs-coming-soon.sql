-- ============================================================
-- 八档统一 P8b: exam_specs.status CHECK 加 'coming_soon'（与 TS lib/exam-specs ExamSpecStatus 对齐）
-- ============================================================
-- Instructions: Supabase Dashboard → SQL Editor → New Query → Run（或经 MCP 应用）
-- 背景：DB v2 规格表 exam_specs.status 原 CHECK 仅 ('draft','active','deprecated')，无法表达雅思
--   「coming_soon」；seed-question-bank-v2-metadata.ts 从 TS EXAM_SPECS（IELTS status=coming_soon）
--   seed 时会被旧 CHECK 拒。
-- 做法：按列(conkey)丢弃 exam_specs.status 上的旧 CHECK（与命名/写法无关），再补含 coming_soon 的。
--   只改约束、不改数据；幂等可重跑。
-- ============================================================

DO $$
DECLARE r record; attn smallint;
BEGIN
  IF to_regclass('exam_specs') IS NULL THEN RETURN; END IF;

  SELECT att.attnum INTO attn
  FROM pg_attribute att
  WHERE att.attrelid = to_regclass('exam_specs')
    AND att.attname = 'status' AND att.attnum > 0 AND NOT att.attisdropped;
  IF attn IS NULL THEN RETURN; END IF;

  -- 丢弃「仅作用于 status 单列」的所有 CHECK（旧 draft/active/deprecated 等，无论命名）
  FOR r IN
    SELECT con.conname FROM pg_constraint con
    WHERE con.contype = 'c'
      AND con.conrelid = to_regclass('exam_specs')
      AND con.conkey = ARRAY[attn]::smallint[]
  LOOP
    EXECUTE format('ALTER TABLE exam_specs DROP CONSTRAINT %I', r.conname);
  END LOOP;

  ALTER TABLE exam_specs ADD CONSTRAINT exam_specs_status_check
    CHECK (status IN ('draft','active','coming_soon','deprecated'));
END $$;
