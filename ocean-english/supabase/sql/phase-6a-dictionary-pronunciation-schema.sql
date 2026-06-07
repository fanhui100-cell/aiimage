-- ============================================================
-- LexiOcean Phase 6A: Dictionary + Pronunciation Schema
-- ============================================================
-- Run AFTER phase-5c-core-learning.sql and phase-5d-scan-chat-sync.sql.
-- Instructions: Copy and run in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS, DROP POLICY IF EXISTS).
--
-- DATA COMPLIANCE NOTE:
--   dictionary_words contains ONLY original or properly licensed content.
--   Users cannot insert/update dictionary_words (no INSERT/UPDATE policy).
--   User-specific data (notes, custom meanings) lives in user_word_notes.
--   Scan-extracted words NEVER auto-populate dictionary_words.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. DICTIONARY WORDS (public read, admin-only write)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_words (
  -- ID is the canonical slug (e.g., 'ubiquitous'), matching saved_words.word_id
  id                TEXT PRIMARY KEY,
  word              TEXT NOT NULL,
  normalized_word   TEXT NOT NULL,   -- lowercase, no accents (for search)
  phonetic_ipa      TEXT,            -- IPA notation  e.g. '/juːˈbɪkwɪtəs/'
  part_of_speech    TEXT,            -- primary POS: noun, verb, adjective, adverb, etc.
  cefr_level        TEXT CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  level             TEXT CHECK (level IN ('beginner','elementary','intermediate','advanced','exam-prep')),
  difficulty        SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  frequency_rank    INT,             -- lower = more common
  is_core_word      BOOLEAN DEFAULT FALSE,
  is_exam_word      BOOLEAN DEFAULT FALSE,
  tags              TEXT[] DEFAULT '{}',
  -- Source / compliance metadata
  source_type       TEXT NOT NULL DEFAULT 'original'
                    CHECK (source_type IN ('original','ai-generated','adapted','public-domain','licensed')),
  source_note       TEXT,            -- e.g., 'Written by LexiOcean team'
  license           TEXT,            -- e.g., 'CC0', 'CC-BY-4.0', 'proprietary'
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Public read — no auth required
ALTER TABLE dictionary_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dictionary_words_public_read" ON dictionary_words;
CREATE POLICY "dictionary_words_public_read"
  ON dictionary_words FOR SELECT
  USING (true);
-- No INSERT / UPDATE policies — only service_role (admin) can write

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_dict_words_normalized ON dictionary_words(normalized_word);
CREATE INDEX IF NOT EXISTS idx_dict_words_level ON dictionary_words(level);
CREATE INDEX IF NOT EXISTS idx_dict_words_is_core ON dictionary_words(is_core_word);
CREATE INDEX IF NOT EXISTS idx_dict_words_is_exam ON dictionary_words(is_exam_word);
CREATE INDEX IF NOT EXISTS idx_dict_words_freq ON dictionary_words(frequency_rank);

-- ────────────────────────────────────────────────────────────
-- 2. DICTIONARY DEFINITIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_definitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id         TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  part_of_speech  TEXT NOT NULL,
  definition_en   TEXT NOT NULL,
  definition_zh   TEXT,
  language        TEXT DEFAULT 'en',
  order_index     SMALLINT DEFAULT 0,
  source_type     TEXT DEFAULT 'original'
                  CHECK (source_type IN ('original','ai-generated','adapted','public-domain','licensed')),
  source_note     TEXT
);

ALTER TABLE dictionary_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_definitions_public_read" ON dictionary_definitions;
CREATE POLICY "dict_definitions_public_read"
  ON dictionary_definitions FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_dict_defs_word ON dictionary_definitions(word_id);

-- ────────────────────────────────────────────────────────────
-- 3. DICTIONARY EXAMPLES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_examples (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id         TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  definition_id   UUID REFERENCES dictionary_definitions(id) ON DELETE SET NULL,
  sentence_en     TEXT NOT NULL,
  sentence_zh     TEXT,
  source_type     TEXT DEFAULT 'original'
                  CHECK (source_type IN ('original','ai-generated','adapted','public-domain','licensed')),
  source_note     TEXT,
  order_index     SMALLINT DEFAULT 0
);

ALTER TABLE dictionary_examples ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_examples_public_read" ON dictionary_examples;
CREATE POLICY "dict_examples_public_read"
  ON dictionary_examples FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_dict_examples_word ON dictionary_examples(word_id);

-- ────────────────────────────────────────────────────────────
-- 4. DICTIONARY ETYMOLOGY
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_etymology (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id         TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE UNIQUE,
  roots           TEXT,              -- e.g., 'ubique (Latin: everywhere)'
  explanation_en  TEXT,
  explanation_zh  TEXT,
  source_type     TEXT DEFAULT 'original',
  source_note     TEXT
);

ALTER TABLE dictionary_etymology ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_etymology_public_read" ON dictionary_etymology;
CREATE POLICY "dict_etymology_public_read"
  ON dictionary_etymology FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 5. WORD MNEMONICS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_mnemonics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id         TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  mnemonic_en     TEXT NOT NULL,
  mnemonic_zh     TEXT,
  mnemonic_style  TEXT DEFAULT 'standard'
                  CHECK (mnemonic_style IN ('standard','evil','visual','story','phonetic')),
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_reviewed     BOOLEAN DEFAULT FALSE,  -- human-reviewed flag
  order_index     SMALLINT DEFAULT 0,
  source_type     TEXT DEFAULT 'original'
);

ALTER TABLE word_mnemonics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_mnemonics_public_read" ON word_mnemonics;
CREATE POLICY "word_mnemonics_public_read"
  ON word_mnemonics FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_mnemonics_word ON word_mnemonics(word_id);

-- ────────────────────────────────────────────────────────────
-- 6. DICTIONARY COLLOCATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_collocations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id       TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  phrase        TEXT NOT NULL,
  example_en    TEXT,
  example_zh    TEXT,
  order_index   SMALLINT DEFAULT 0
);

ALTER TABLE dictionary_collocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_collocations_public_read" ON dictionary_collocations;
CREATE POLICY "dict_collocations_public_read"
  ON dictionary_collocations FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_collocations_word ON dictionary_collocations(word_id);

-- ────────────────────────────────────────────────────────────
-- 7. DICTIONARY SYNONYMS / ANTONYMS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_synonyms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  synonym     TEXT NOT NULL,        -- may or may not be in dictionary_words
  order_index SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dictionary_antonyms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  antonym     TEXT NOT NULL,
  order_index SMALLINT DEFAULT 0
);

ALTER TABLE dictionary_synonyms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_synonyms_public_read" ON dictionary_synonyms;
CREATE POLICY "dict_synonyms_public_read" ON dictionary_synonyms FOR SELECT USING (true);

ALTER TABLE dictionary_antonyms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_antonyms_public_read" ON dictionary_antonyms;
CREATE POLICY "dict_antonyms_public_read" ON dictionary_antonyms FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 8. DICTIONARY SCENE USAGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictionary_scene_usages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  scene_en    TEXT NOT NULL,
  scene_zh    TEXT,
  example_en  TEXT,
  example_zh  TEXT,
  order_index SMALLINT DEFAULT 0
);

ALTER TABLE dictionary_scene_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dict_scenes_public_read" ON dictionary_scene_usages;
CREATE POLICY "dict_scenes_public_read" ON dictionary_scene_usages FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 9. WORD PRONUNCIATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_pronunciations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id     TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  accent      TEXT NOT NULL CHECK (accent IN ('us','uk','au','neutral')),
  phonetic_ipa TEXT,
  audio_url   TEXT,                 -- CDN URL, nullable (use browser TTS if null)
  audio_duration_ms INT,
  provider    TEXT DEFAULT 'browser-tts'
              CHECK (provider IN ('browser-tts','aws-polly','google-tts','azure-tts','custom')),
  voice_name  TEXT,                 -- e.g., 'Joanna' for Polly, 'en-US-Standard-B' for Google
  source_type TEXT DEFAULT 'original',
  is_default  BOOLEAN DEFAULT FALSE
);

ALTER TABLE word_pronunciations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pronunciations_public_read" ON word_pronunciations;
CREATE POLICY "pronunciations_public_read"
  ON word_pronunciations FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_pronunciations_word ON word_pronunciations(word_id);
CREATE INDEX IF NOT EXISTS idx_pronunciations_accent ON word_pronunciations(word_id, accent);

-- ────────────────────────────────────────────────────────────
-- 10. EXAM WORD TAGS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_word_tags (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id   TEXT NOT NULL REFERENCES dictionary_words(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL
            CHECK (exam_type IN ('TOEFL','IELTS','CET-4','CET-6','KAOYAN','GAOKAO','SAT','GRE','custom')),
  band      TEXT,                   -- optional: e.g., 'Band-6', 'Core', 'Advanced'
  source_note TEXT,
  UNIQUE(word_id, exam_type)
);

ALTER TABLE exam_word_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exam_tags_public_read" ON exam_word_tags;
CREATE POLICY "exam_tags_public_read"
  ON exam_word_tags FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_exam_tags_word ON exam_word_tags(word_id);
CREATE INDEX IF NOT EXISTS idx_exam_tags_type ON exam_word_tags(exam_type);

-- ────────────────────────────────────────────────────────────
-- 11. WORD FREQUENCY (optional — for future ranking)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_frequency (
  word_id        TEXT PRIMARY KEY REFERENCES dictionary_words(id) ON DELETE CASCADE,
  corpus_rank    INT,               -- rank in a public corpus (e.g., COCA)
  corpus_source  TEXT,              -- e.g., 'COCA-2020', 'BNC', 'original'
  frequency_per_million FLOAT
);

ALTER TABLE word_frequency ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "word_freq_public_read" ON word_frequency;
CREATE POLICY "word_freq_public_read" ON word_frequency FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 12. USER WORD NOTES (per-user private notes — has RLS)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_word_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id         TEXT NOT NULL,    -- references dictionary_words.id or user-generated slug
  custom_meaning  TEXT,
  note            TEXT,
  memory_trick    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE user_word_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_word_notes_own_data" ON user_word_notes;
CREATE POLICY "user_word_notes_own_data"
  ON user_word_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_word_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_word ON user_word_notes(word_id);

-- ────────────────────────────────────────────────────────────
-- 13. LEXIVERSE WORD NODES (Phase 7 — reserved, not implemented)
-- ────────────────────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS lexiverse_word_nodes (
--   id              TEXT PRIMARY KEY,  -- same as dictionary_words.id
--   word_id         TEXT REFERENCES dictionary_words(id),
--   cluster_id      TEXT,
--   position_x      FLOAT,
--   position_y      FLOAT,
--   position_z      FLOAT,
--   visual_size     FLOAT,
--   visual_color    TEXT,
--   connected_to    TEXT[],          -- IDs of connected nodes
--   created_at      TIMESTAMPTZ DEFAULT NOW()
-- );
-- NOTE: Intentionally left commented out.
-- Implement in Phase 7 after dictionary_words is seeded.

-- ────────────────────────────────────────────────────────────
-- END OF PHASE 6A SCHEMA
-- ────────────────────────────────────────────────────────────
-- NEXT STEPS (Phase 6B):
-- 1. Run this SQL in Supabase SQL Editor (after phase-5c and phase-5d)
-- 2. Seed ~50 original mock words into dictionary_words using the existing
--    mock-words.ts data (manually reviewed and approved)
-- 3. Wire lib/dictionary/dictionary-client.ts to SupabaseDictionaryClient
-- 4. Update /word/[slug] to try DB first, fallback to mock
-- 5. Build PronunciationButton into WordDetailClient
--
-- DATA COMPLIANCE REMINDER:
-- • Only insert original content or content with clear license
-- • Tag all AI-generated content with source_type = 'ai-generated'
-- • Do NOT bulk-import commercial dictionary content
-- • Do NOT import pirated exam word lists
-- • Scan-extracted user vocabulary stays in vocabulary_json (scan_documents)
--   and NEVER auto-populates dictionary_words
-- ────────────────────────────────────────────────────────────
