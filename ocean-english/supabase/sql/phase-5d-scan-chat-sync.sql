-- ============================================================
-- LexiOcean Phase 5D: Scan History + Chat Cloud Sync Schema
-- ============================================================
-- Run AFTER phase-5c-core-learning.sql.
-- Instructions: Copy and run in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS, DROP POLICY IF EXISTS).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SCAN DOCUMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_documents (
  id                        TEXT PRIMARY KEY,              -- client-generated documentId
  user_id                   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name                 TEXT NOT NULL,
  file_type                 TEXT CHECK (file_type IN ('pdf','image','text')),
  status                    TEXT CHECK (status IN ('analyzed','partially-analyzed','needs-ocr','error')),
  extraction_method         TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL,
  updated_at                TIMESTAMPTZ NOT NULL,

  summary_en                TEXT,
  summary_zh                TEXT,

  -- Privacy: only preview stored, never full rawText / file binary / base64
  raw_text_preview          TEXT CHECK (length(raw_text_preview) <= 3000),
  raw_text_length           INT,
  page_count                INT,
  ocr_confidence            FLOAT,

  warnings                  JSONB DEFAULT '[]',
  question_count            INT DEFAULT 0,
  vocabulary_count          INT DEFAULT 0,
  study_note_count          INT DEFAULT 0,
  warning_count             INT DEFAULT 0,
  review_words_added_count  INT DEFAULT 0,
  quiz_drafts_saved_count   INT DEFAULT 0,
  wrong_answers_saved_count INT DEFAULT 0,
  study_notes_saved_count   INT DEFAULT 0,

  -- Structured content (JSONB for Phase 5D; normalized to separate tables in Phase 6+)
  questions_json            JSONB DEFAULT '[]',
  vocabulary_json           JSONB DEFAULT '[]',
  study_notes_json          JSONB DEFAULT '[]',
  answer_suggestions_json   JSONB DEFAULT '[]'
);

ALTER TABLE scan_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scan_documents_own_data" ON scan_documents;
CREATE POLICY "scan_documents_own_data"
  ON scan_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 2. DOCUMENT EXTRACTED VOCABULARY (Phase 6 — reserved)
--    For Phase 5D, vocabulary is stored in scan_documents.vocabulary_json.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_extracted_vocabulary (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_document_id TEXT NOT NULL REFERENCES scan_documents(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word             TEXT NOT NULL,
  meaning_zh       TEXT,
  definition_en    TEXT,
  context          TEXT,
  difficulty       TEXT,
  should_review    BOOLEAN DEFAULT FALSE
);

ALTER TABLE document_extracted_vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doc_vocab_own_data" ON document_extracted_vocabulary;
CREATE POLICY "doc_vocab_own_data"
  ON document_extracted_vocabulary FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. DOCUMENT EXTRACTED QUESTIONS (Phase 6 — reserved)
--    For Phase 5D, questions are stored in scan_documents.questions_json.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_extracted_questions (
  id               TEXT PRIMARY KEY,               -- from ExtractedQuestion.id
  scan_document_id TEXT NOT NULL REFERENCES scan_documents(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             TEXT,
  prompt           TEXT NOT NULL,
  options          JSONB DEFAULT '[]',
  answer_suggestion TEXT,
  explanation      TEXT,
  source_text      TEXT CHECK (length(source_text) <= 2000)  -- limit: potential copyright content
);

ALTER TABLE document_extracted_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doc_questions_own_data" ON document_extracted_questions;
CREATE POLICY "doc_questions_own_data"
  ON document_extracted_questions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. QUIZ DRAFTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_drafts (
  id                TEXT PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scan_document_id  TEXT REFERENCES scan_documents(id) ON DELETE SET NULL,
  source_file_name  TEXT,
  source            TEXT DEFAULT 'ai-document-analysis',
  status            TEXT CHECK (status IN ('draft','needs-review','ready','saved','discarded')),
  question_type     TEXT,
  prompt            TEXT NOT NULL,
  options           JSONB DEFAULT '[]',
  answer_suggestion TEXT,
  explanation       TEXT,
  source_text       TEXT CHECK (length(source_text) <= 2000),
  copyright_warning TEXT,
  created_at        TIMESTAMPTZ NOT NULL
);

ALTER TABLE quiz_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_drafts_own_data" ON quiz_drafts;
CREATE POLICY "quiz_drafts_own_data"
  ON quiz_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 5. STUDY NOTES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_notes (
  id                TEXT PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scan_document_id  TEXT REFERENCES scan_documents(id) ON DELETE SET NULL,
  source_file_name  TEXT,
  title             TEXT NOT NULL,
  title_zh          TEXT,
  content           TEXT NOT NULL,
  content_zh        TEXT,
  created_at        TIMESTAMPTZ NOT NULL
);

ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "study_notes_own_data" ON study_notes;
CREATE POLICY "study_notes_own_data"
  ON study_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 6. CHAT SESSIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  topic_context TEXT
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_sessions_own_data" ON chat_sessions;
CREATE POLICY "chat_sessions_own_data"
  ON chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. CHAT MESSAGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  -- 'system' role is never written by client — only 'user' and 'assistant'
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  word_ref    TEXT,
  sent_at     TIMESTAMPTZ NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_messages_own_data" ON chat_messages;
CREATE POLICY "chat_messages_own_data"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_scan_documents_user ON scan_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_documents_created ON scan_documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_drafts_user ON quiz_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_drafts_document ON quiz_drafts(scan_document_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_user ON study_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_document ON study_notes(scan_document_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- ────────────────────────────────────────────────────────────
-- END OF PHASE 5D SCHEMA
-- ────────────────────────────────────────────────────────────
-- NEXT STEPS:
-- 1. Run this SQL in Supabase SQL Editor (after phase-5c-core-learning.sql)
-- 2. Restart the dev server after running
-- 3. Sign in and save a scan document to test cloud sync
-- 4. Check Supabase Table Editor → scan_documents to verify sync
--
-- PHASE 6+ NOTES:
-- document_extracted_vocabulary and document_extracted_questions tables
-- are reserved for Phase 6. In Phase 5D, content is stored as JSONB
-- in scan_documents.questions_json / vocabulary_json.
-- ────────────────────────────────────────────────────────────
