-- ============================================================================
-- P1 富化落地 B v2 迁移 —— 在 Supabase SQL Editor 执行一次
-- 解锁两项无处可存的富字段：① 词形变化 inflections ② 近义辨析 nuance
-- 安全：全部 IF NOT EXISTS，可重复执行；不动现有数据。
-- ============================================================================

-- ① 词形变化（过去式/分词/三单/复数/比较级…）存为 jsonb
ALTER TABLE dictionary_words
  ADD COLUMN IF NOT EXISTS inflections JSONB DEFAULT '{}';

COMMENT ON COLUMN dictionary_words.inflections IS
  '词形变化 {past,pp,ing,third,plural,comparative,superlative}（来源 ECDICT exchange）';

-- ② 近义辨析表：一个词 → 它同义/易混组里各成员的中文辨析
CREATE TABLE IF NOT EXISTS dictionary_word_nuance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  member      TEXT NOT NULL,                 -- 组内某个词（含词本身）
  nuance_zh   TEXT NOT NULL,                 -- 中文辨析（语义/语域/搭配差别）
  nuance_en   TEXT,
  source_type TEXT DEFAULT 'ai-generated'
    CHECK (source_type IN ('original','ai-generated','adapted','public-domain','licensed')),
  source_note TEXT,                          -- e.g. 'DeepSeek draft / Opus reviewed'
  is_reviewed BOOLEAN DEFAULT FALSE,         -- 人工/Opus 审核后置 true
  order_index SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dictionary_word_nuance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nuance_public_read" ON dictionary_word_nuance;
CREATE POLICY "nuance_public_read" ON dictionary_word_nuance FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_nuance_word ON dictionary_word_nuance(word_id);
