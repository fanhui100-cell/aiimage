-- ============================================================
-- LexiOcean P2: reading_passages（阅读短文富化表）
-- 用途：阅读板块升级 — 存真标题/中文标题/中文翻译/可点生词，
--      取代 /api/reading 当前从 question_bank.audio_ref 派生标题的临时做法。
-- 配套：gen-reading.ts 落表（passage_id 关联 question_bank 理解题），
--      /api/reading 优先读本表、回退 question_bank（契约不变）。
-- 说明：在 Supabase SQL Editor 运行一次。含 IF NOT EXISTS，可安全重跑。
-- ============================================================

CREATE TABLE IF NOT EXISTS reading_passages (
  id          TEXT PRIMARY KEY,                 -- = question_bank.normalized_word（同篇共享）
  title       TEXT,
  title_zh    TEXT,
  passage_en  TEXT NOT NULL,
  passage_zh  TEXT,
  level       SMALLINT,                          -- 1..7
  exam_tags   TEXT[] DEFAULT '{}',
  key_words   TEXT[] DEFAULT '{}',               -- 文中实词 ∩ 词典（可点查词）
  minutes     SMALLINT,
  source_type TEXT DEFAULT 'ai_generated_practice',
  status      TEXT DEFAULT 'active'
    CHECK (status IN ('active','draft','deprecated')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_passages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reading_passages_public_read" ON reading_passages;
CREATE POLICY "reading_passages_public_read"
  ON reading_passages FOR SELECT USING (true);
-- 写入仅服务端（gen-reading 用 service role，绕过 RLS）；不开放匿名写。

CREATE INDEX IF NOT EXISTS idx_reading_passages_level
  ON reading_passages(level, status);
