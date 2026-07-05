-- ============================================================
-- LexiOcean 最终整合包 P2: 词库注入 schema 扩展
-- ============================================================
-- Instructions: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- 在 phase-6a 词典 schema 之上执行。
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. dictionary_words：7 档等级标签 + 常用短语
-- ────────────────────────────────────────────────────────────
ALTER TABLE dictionary_words
  ADD COLUMN IF NOT EXISTS levels INT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_level INT,
  ADD COLUMN IF NOT EXISTS phrases JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_dict_words_primary_level
  ON dictionary_words(primary_level);
CREATE INDEX IF NOT EXISTS idx_dict_words_levels
  ON dictionary_words USING GIN (levels);

COMMENT ON COLUMN dictionary_words.levels IS
  '7 档等级标签（1初中 2高中 3四级 4六级 5考研 6托福 7SAT），多档共存';
COMMENT ON COLUMN dictionary_words.primary_level IS '最低档';
COMMENT ON COLUMN dictionary_words.phrases IS
  '常用短语 [{phrase, translation}]（前 6 条）';

-- ────────────────────────────────────────────────────────────
-- 2. word_relations：词关系（规则层 + AI 层共用）
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_relations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL,
  related_id  TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
    'derivative',          -- 词形家族（规则：后缀 stem 归并）
    'confusable-form',     -- 形近易混（规则：编辑距离 1-2 且相邻档）
    'synonym-candidate',   -- 同义候选（规则：同义首释义+同词性）
    'synonym',             -- AI 精选近义
    'antonym',             -- AI 精选反义
    'confused',            -- AI 精选易混
    'collocation'          -- AI 搭配
  )),
  note        TEXT,                       -- 如词根 stem / AI 理由
  source      TEXT NOT NULL DEFAULT 'rule' CHECK (source IN ('rule','ai')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (word_id, related_id, type)
);

ALTER TABLE word_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_relations_public_read" ON word_relations;
CREATE POLICY "word_relations_public_read"
  ON word_relations FOR SELECT USING (true);
-- 写入仅 service_role（导入脚本）

CREATE INDEX IF NOT EXISTS idx_word_relations_word ON word_relations(word_id);
CREATE INDEX IF NOT EXISTS idx_word_relations_related ON word_relations(related_id);
CREATE INDEX IF NOT EXISTS idx_word_relations_type ON word_relations(type);

-- ────────────────────────────────────────────────────────────
-- 3. grammar_points：语法点骨架（本阶段只建 schema）
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grammar_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           INT CHECK (level BETWEEN 1 AND 8),
  title           TEXT NOT NULL,
  explanation_md  TEXT,
  examples        JSONB DEFAULT '[]',
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grammar_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grammar_points_public_read" ON grammar_points;
CREATE POLICY "grammar_points_public_read"
  ON grammar_points FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_grammar_points_level ON grammar_points(level);
