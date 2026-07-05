-- ============================================================================
-- P1 题库 question_bank 表 —— 在 Supabase SQL Editor 执行一次
-- 字段对齐 types/question-bank.ts（含 inputMode / 新题型 / audioRef）。
-- 合规：source_exam 仅 LexiOcean 原创集名；AI 生成默认 draft，审核后 active。
-- 安全：IF NOT EXISTS，可重复执行。
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_bank (
  id                 TEXT PRIMARY KEY,
  type               TEXT NOT NULL,                 -- def_to_word / synonym_choice / cet_cloze ...
  input_mode         TEXT NOT NULL DEFAULT 'choice' -- choice | spell | speak | listen
    CHECK (input_mode IN ('choice','spell','speak','listen')),
  source_type        TEXT NOT NULL DEFAULT 'ai_generated_practice'
    CHECK (source_type IN ('original_curated','ai_generated_practice','scan_private_practice','exam_tagged_practice')),
  source_note        TEXT,
  source_exam        TEXT,                          -- 仅 LexiOcean 原创集名，禁止盗版真题
  word_id            TEXT REFERENCES dictionary_words(id) ON DELETE CASCADE,
  normalized_word    TEXT,
  difficulty_level   SMALLINT CHECK (difficulty_level BETWEEN 1 AND 5),
  question_difficulty SMALLINT CHECK (question_difficulty BETWEEN 1 AND 5),
  bloom_level        TEXT CHECK (bloom_level IN ('remember','understand','apply','analyze')),
  prompt             TEXT NOT NULL,
  prompt_zh          TEXT,
  choices            JSONB DEFAULT '[]',            -- [{id:'a',text:'...'}]
  answer             TEXT,                          -- choice id（选择题）
  answer_text        TEXT,                          -- 标准答案（打字/听写题）
  hint               JSONB,                         -- {initials, ipa}
  audio_ref          TEXT,                          -- 词形 slug / passage id / url（听力题）
  explanation        TEXT,
  explanation_zh     TEXT,
  skill_tags         TEXT[] DEFAULT '{}',
  exam_tags          TEXT[] DEFAULT '{}',
  theme_tags         TEXT[] DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('active','draft','deprecated')),
  is_reviewed        BOOLEAN DEFAULT FALSE,
  reviewed_by        TEXT,
  version            TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qbank_public_read_active" ON question_bank;
-- 公开只读「上线」题；draft 仅 service role 可见
CREATE POLICY "qbank_public_read_active" ON question_bank FOR SELECT USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_qbank_word   ON question_bank(word_id);
CREATE INDEX IF NOT EXISTS idx_qbank_type   ON question_bank(type);
CREATE INDEX IF NOT EXISTS idx_qbank_status ON question_bank(status);
CREATE INDEX IF NOT EXISTS idx_qbank_exam   ON question_bank USING GIN (exam_tags);

-- 听力短文（P3 听短文→选择用；可选，先建空表）
CREATE TABLE IF NOT EXISTS listening_passages (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  passage_en  TEXT NOT NULL,
  passage_zh  TEXT,
  audio_ref   TEXT,                                 -- 预留：TTS 缓存 / 音频 url
  level       SMALLINT,
  source_type TEXT DEFAULT 'ai_generated_practice',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE listening_passages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "passages_public_read" ON listening_passages;
CREATE POLICY "passages_public_read" ON listening_passages FOR SELECT USING (true);
