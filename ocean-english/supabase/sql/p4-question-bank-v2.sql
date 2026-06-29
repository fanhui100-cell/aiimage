-- ============================================================================
-- P4 题库 v2 schema —— question-bank rebuild Phase 3（仅建表，未对生产库执行）
--
-- 目标：在不动 v1 question_bank 的前提下，新增 v2 模型：考试规格 / 板块 / 任务模板 /
--       材料 / 音频 / 题组 / 题目 / 目标词 / rubric / 模拟卷 / 作答 / 技能状态 / 今日计划。
--
-- 安全：全部 CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / DROP POLICY IF EXISTS，
--       可重复执行；不删除、不修改 v1 question_bank。默认「未应用」——需用户显式在
--       Supabase SQL Editor 执行一次。
-- 合规：stimuli/question_* 只存原创/授权/公版内容，禁止真题原文。
-- id 约定：specs/sections/templates 用稳定 TEXT id（对齐 lib/exam-specs）；其余 UUID。
--          question_sets/question_items/stimuli 另存 legacy_id 供 v1→v2 迁移溯源。
-- ============================================================================

-- 通用 updated_at 触发器
CREATE OR REPLACE FUNCTION qbank_v2_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. exam_specs —— 七档考试规格（DB 镜像，可由 lib/exam-specs seed）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_specs (
  id            TEXT PRIMARY KEY,                       -- zhongkao / gaokao / cet4 ...
  level         INT NOT NULL CHECK (level BETWEEN 1 AND 8),
  name_zh       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  version       TEXT NOT NULL,
  source_urls   TEXT[] DEFAULT '{}',
  total_minutes INT,
  full_score    NUMERIC,
  scoring_scale TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','coming_soon','deprecated')),   -- 八档：加 coming_soon（雅思整卷未做，与 TS ExamSpecStatus 对齐）
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. exam_sections —— 考试板块
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_sections (
  id             TEXT PRIMARY KEY,                      -- 如 cet4_listening
  exam_id        TEXT NOT NULL REFERENCES exam_specs(id) ON DELETE CASCADE,
  order_index    INT NOT NULL DEFAULT 0,
  name_zh        TEXT NOT NULL,
  name_en        TEXT,
  skill          TEXT NOT NULL CHECK (skill IN ('vocabulary','grammar','reading','listening','speaking','writing','translation','integrated')),
  selection_mode TEXT CHECK (selection_mode IN ('single','rows','passages','paper')),
  item_count     INT,
  points         NUMERIC,
  time_limit_sec INT,
  requires_audio   BOOLEAN DEFAULT FALSE,
  requires_rubric  BOOLEAN DEFAULT FALSE,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. task_templates —— 题型任务模板（exam_id 可空=跨档共享）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_templates (
  id            TEXT PRIMARY KEY,
  exam_id       TEXT REFERENCES exam_specs(id) ON DELETE CASCADE,
  section_id    TEXT REFERENCES exam_sections(id) ON DELETE SET NULL,
  task_type     TEXT NOT NULL,
  name_zh       TEXT,
  subskills     TEXT[] DEFAULT '{}',
  input_mode    TEXT NOT NULL CHECK (input_mode IN ('choice','spell','free_text','speak','listen','matching','multi_blank')),
  group_mode    TEXT NOT NULL CHECK (group_mode IN ('single','set','paper')),
  answer_schema JSONB DEFAULT '{}',
  min_pool      INT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','deprecated')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. stimuli —— 材料（阅读文章 / 听力脚本 / 短文本 / 表格）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stimuli (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id   TEXT,                                     -- v1 溯源
  kind        TEXT NOT NULL CHECK (kind IN ('passage','dialogue','lecture','announcement','table','image','sentence','word')),
  title       TEXT,
  text_en     TEXT,
  text_zh     TEXT,
  topic_tags  TEXT[] DEFAULT '{}',
  domain_tags TEXT[] DEFAULT '{}',
  level       INT CHECK (level BETWEEN 1 AND 8),
  word_count  INT,
  source_type TEXT NOT NULL DEFAULT 'original',
  source_note TEXT,
  qa_status   TEXT NOT NULL DEFAULT 'draft' CHECK (qa_status IN ('draft','machine_checked','human_checked','active','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. audio_assets —— 听力音频资产
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stimulus_id UUID REFERENCES stimuli(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  transcript  TEXT NOT NULL,
  duration_ms INT,
  accent      TEXT,
  voice_id    TEXT,
  provider    TEXT,
  checksum    TEXT,
  qa_status   TEXT NOT NULL DEFAULT 'draft' CHECK (qa_status IN ('draft','machine_checked','human_checked','active','rejected')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. rubrics —— 主观题评分量规
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rubrics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_zh    TEXT,
  exam_id    TEXT REFERENCES exam_specs(id) ON DELETE SET NULL,
  skill      TEXT,
  criteria   JSONB NOT NULL DEFAULT '[]',               -- rubric jsonb：[{key,label,maxScore,descriptors}]
  max_score  NUMERIC,
  status     TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','deprecated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. question_sets —— 题组（single 题也建为单题组）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_sets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id        TEXT,
  exam_id          TEXT REFERENCES exam_specs(id) ON DELETE SET NULL,
  section_id       TEXT REFERENCES exam_sections(id) ON DELETE SET NULL,
  task_template_id TEXT REFERENCES task_templates(id) ON DELETE SET NULL,
  stimulus_id      UUID REFERENCES stimuli(id) ON DELETE SET NULL,
  level            INT CHECK (level BETWEEN 1 AND 8),
  task_type        TEXT NOT NULL,
  difficulty_band  INT CHECK (difficulty_band BETWEEN 1 AND 5),
  estimated_minutes NUMERIC,
  topic_tags       TEXT[] DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','reviewed','active','retired','rejected')),
  qa_flags         JSONB DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. question_items —— 题目
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id       TEXT,
  question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
  order_index     INT NOT NULL DEFAULT 0,
  input_mode      TEXT NOT NULL CHECK (input_mode IN ('choice','spell','free_text','speak','listen','matching','multi_blank')),
  prompt          TEXT NOT NULL,
  prompt_zh       TEXT,
  choices         JSONB DEFAULT '[]',
  answer          JSONB NOT NULL,
  explanation_zh  TEXT,
  subskills       TEXT[] DEFAULT '{}',
  rubric_id       UUID REFERENCES rubrics(id) ON DELETE SET NULL,
  difficulty_band INT CHECK (difficulty_band BETWEEN 1 AND 5),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','reviewed','active','retired','rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 9. question_target_words —— 题目↔目标词绑定（归一化）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_target_words (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_item_id UUID NOT NULL REFERENCES question_items(id) ON DELETE CASCADE,
  word_id          TEXT REFERENCES dictionary_words(id) ON DELETE SET NULL,
  surface          TEXT,
  role             TEXT NOT NULL CHECK (role IN ('tested_answer','tested_context','distractor','keyword','expected_output')),
  sense_key        TEXT,
  dimension        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. paper_instances —— 模拟卷实例（用户拥有）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paper_instances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id      TEXT REFERENCES exam_specs(id) ON DELETE SET NULL,
  seed         TEXT NOT NULL,
  mode         TEXT NOT NULL CHECK (mode IN ('mini','section','full')),
  status       TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','abandoned')),
  score        JSONB DEFAULT '{}',
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 11. paper_sections —— 卷面分区（user_id 反范式化便于 RLS）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paper_sections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_instance_id UUID NOT NULL REFERENCES paper_instances(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id        TEXT REFERENCES exam_sections(id) ON DELETE SET NULL,
  order_index       INT NOT NULL DEFAULT 0,
  question_set_ids  UUID[] DEFAULT '{}',
  question_item_ids UUID[] DEFAULT '{}',
  points            NUMERIC,
  time_limit_sec    INT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 12. paper_attempts —— 整卷提交结果（用户拥有）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paper_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_instance_id UUID NOT NULL REFERENCES paper_instances(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score             JSONB DEFAULT '{}',
  objective_score   NUMERIC,
  scaled_score      NUMERIC,
  submitted_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 13. question_attempts —— 单题作答（用户拥有，诊断核心）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_attempts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_item_id  UUID NOT NULL REFERENCES question_items(id) ON DELETE CASCADE,
  question_set_id   UUID REFERENCES question_sets(id) ON DELETE SET NULL,
  paper_instance_id UUID REFERENCES paper_instances(id) ON DELETE SET NULL,
  exam_id           TEXT REFERENCES exam_specs(id) ON DELETE SET NULL,
  section_id        TEXT REFERENCES exam_sections(id) ON DELETE SET NULL,
  task_type         TEXT,
  subskills         TEXT[] DEFAULT '{}',
  answer            JSONB NOT NULL,
  is_correct        BOOLEAN,
  score             NUMERIC,
  duration_ms       INT,
  error_type        TEXT,
  answered_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 14. skill_states —— 用户×考试×技能 掌握度（用户拥有）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_states (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id         TEXT NOT NULL,
  skill_key       TEXT NOT NULL,
  mastery         NUMERIC NOT NULL DEFAULT 0,
  attempts        INT NOT NULL DEFAULT 0,
  correct         INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, exam_id, skill_key)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 15. daily_plan_items —— 今日计划项（用户拥有）
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_plan_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_date         DATE NOT NULL,
  kind              TEXT NOT NULL,                       -- lexiverse_words / exam_task / review / output ...
  payload           JSONB DEFAULT '{}',
  priority          INT DEFAULT 0,
  estimated_minutes INT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','skipped')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 索引
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_v2_sections_exam        ON exam_sections(exam_id);
CREATE INDEX IF NOT EXISTS idx_v2_templates_exam       ON task_templates(exam_id);
CREATE INDEX IF NOT EXISTS idx_v2_stimuli_level_kind   ON stimuli(level, kind);
CREATE INDEX IF NOT EXISTS idx_v2_audio_stimulus       ON audio_assets(stimulus_id, qa_status);
CREATE INDEX IF NOT EXISTS idx_v2_sets_lookup          ON question_sets(exam_id, section_id, task_type, status);
CREATE INDEX IF NOT EXISTS idx_v2_sets_stimulus        ON question_sets(stimulus_id);
-- legacy_id 唯一（NULLS DISTINCT：生成行的 NULL legacy_id 不冲突）：迁移幂等 + upsert onConflict 的前提。
-- DROP 旧普通索引名以兼容历史半应用；本库尚未应用，正常首次即建唯一索引。
DROP INDEX IF EXISTS idx_v2_sets_legacy;
CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_sets_legacy   ON question_sets(legacy_id);
DROP INDEX IF EXISTS idx_v2_items_legacy;
CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_items_legacy  ON question_items(legacy_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_stimuli_legacy ON stimuli(legacy_id);
CREATE INDEX IF NOT EXISTS idx_v2_items_set            ON question_items(question_set_id, status);
CREATE INDEX IF NOT EXISTS idx_v2_target_words_word    ON question_target_words(word_id);
CREATE INDEX IF NOT EXISTS idx_v2_target_words_item    ON question_target_words(question_item_id);
CREATE INDEX IF NOT EXISTS idx_v2_attempts_user        ON question_attempts(user_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_v2_attempts_exam_sec    ON question_attempts(exam_id, section_id);
CREATE INDEX IF NOT EXISTS idx_v2_attempts_item        ON question_attempts(question_item_id);
CREATE INDEX IF NOT EXISTS idx_v2_paper_sections_paper ON paper_sections(paper_instance_id);
CREATE INDEX IF NOT EXISTS idx_v2_paper_instances_user ON paper_instances(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_v2_skill_states_user    ON skill_states(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_v2_daily_plan_user_date ON daily_plan_items(user_id, plan_date);

-- ============================================================================
-- updated_at 触发器
-- ============================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'exam_specs','exam_sections','task_templates','stimuli','audio_assets',
    'rubrics','question_sets','question_items','paper_instances','skill_states'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION qbank_v2_set_updated_at();', t, t);
  END LOOP;
END $$;

-- ============================================================================
-- RLS：内容表公开只读 active；用户数据表仅本人可读写
-- ============================================================================

-- 内容表（公开只读 active / 结构性 true）
ALTER TABLE exam_specs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_exam_specs_read" ON exam_specs;
CREATE POLICY "v2_exam_specs_read" ON exam_specs FOR SELECT USING (status = 'active');

ALTER TABLE exam_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_exam_sections_read" ON exam_sections;
CREATE POLICY "v2_exam_sections_read" ON exam_sections FOR SELECT USING (true);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_task_templates_read" ON task_templates;
CREATE POLICY "v2_task_templates_read" ON task_templates FOR SELECT USING (status = 'active');

ALTER TABLE stimuli ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_stimuli_read" ON stimuli;
CREATE POLICY "v2_stimuli_read" ON stimuli FOR SELECT USING (qa_status = 'active');

ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_audio_assets_read" ON audio_assets;
CREATE POLICY "v2_audio_assets_read" ON audio_assets FOR SELECT USING (qa_status = 'active');

ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_rubrics_read" ON rubrics;
CREATE POLICY "v2_rubrics_read" ON rubrics FOR SELECT USING (status = 'active');

ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_question_sets_read" ON question_sets;
CREATE POLICY "v2_question_sets_read" ON question_sets FOR SELECT USING (status = 'active');

ALTER TABLE question_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_question_items_read" ON question_items;
CREATE POLICY "v2_question_items_read" ON question_items FOR SELECT USING (status = 'active');

ALTER TABLE question_target_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_target_words_read" ON question_target_words;
-- 仅可读「父题 active 且父题组 active」的目标词；草稿/rejected 题的 tested_answer/distractor 不外泄
CREATE POLICY "v2_target_words_read" ON question_target_words FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM question_items qi
    JOIN question_sets qs ON qs.id = qi.question_set_id
    WHERE qi.id = question_target_words.question_item_id
      AND qi.status = 'active'
      AND qs.status = 'active'
  ));

-- 用户数据表（仅本人可读写；service role 绕过 RLS 做生成/迁移）
ALTER TABLE paper_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_paper_instances_own" ON paper_instances;
CREATE POLICY "v2_paper_instances_own" ON paper_instances FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE paper_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_paper_sections_own" ON paper_sections;
CREATE POLICY "v2_paper_sections_own" ON paper_sections FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE paper_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_paper_attempts_own" ON paper_attempts;
CREATE POLICY "v2_paper_attempts_own" ON paper_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_question_attempts_own" ON question_attempts;
CREATE POLICY "v2_question_attempts_own" ON question_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE skill_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_skill_states_own" ON skill_states;
CREATE POLICY "v2_skill_states_own" ON skill_states FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE daily_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v2_daily_plan_items_own" ON daily_plan_items;
CREATE POLICY "v2_daily_plan_items_own" ON daily_plan_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 完成。v1 question_bank 未改动；本文件默认未应用，需在 Supabase SQL Editor 执行一次。
-- ============================================================================
