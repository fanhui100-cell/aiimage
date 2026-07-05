-- ============================================================
-- LexiOcean 界面优化5 阶段2 A7: 词状态机云同步表
-- ============================================================
-- Instructions: Copy and run this SQL in your Supabase SQL Editor.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Run ONCE per Supabase project. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- WORD STATES (合并后 lexiStore.words 的云端镜像)
-- 主键 user_id + word_id；word_id = 词典 slug
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_states (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id        TEXT NOT NULL,
  word           TEXT NOT NULL DEFAULT '',
  state          TEXT NOT NULL DEFAULT 'learning'
                 CHECK (state IN ('locked','unknown','recommended','learning','review','weak','mastered')),
  streak         INT NOT NULL DEFAULT 0,
  ease           REAL NOT NULL DEFAULT 2.5,
  interval_days  INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  saved          BOOLEAN NOT NULL DEFAULT FALSE,
  source         TEXT DEFAULT 'lookup'
                 CHECK (source IN ('today-pack','lookup','scan','reading','seed')),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_word_states_user_review
  ON word_states (user_id, next_review_at);

ALTER TABLE word_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "word_states_own_data" ON word_states;
CREATE POLICY "word_states_own_data"
  ON word_states FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
