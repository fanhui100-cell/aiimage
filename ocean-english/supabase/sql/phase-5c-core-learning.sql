-- ============================================================
-- LexiOcean Phase 5C: Core Learning Data Schema
-- ============================================================
-- Instructions: Copy and run this SQL in your Supabase SQL Editor.
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Run ONCE per Supabase project. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own_data" ON profiles;
CREATE POLICY "profiles_own_data"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 2. USER LEARNING PREFERENCES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level       TEXT CHECK (level IN ('beginner','elementary','intermediate','advanced','exam-prep','free-explore')),
  daily_goal  INT DEFAULT 10,
  ui_language TEXT DEFAULT 'bilingual',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "preferences_own_data" ON user_learning_preferences;
CREATE POLICY "preferences_own_data"
  ON user_learning_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 3. USER STUDY PROGRESS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_study_progress (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_words_learned  INT DEFAULT 0,
  current_streak       INT DEFAULT 0,
  longest_streak       INT DEFAULT 0,
  total_xp             INT DEFAULT 0,
  last_study_date      DATE,
  level_progress       JSONB DEFAULT '{}',
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_study_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "study_progress_own_data" ON user_study_progress;
CREATE POLICY "study_progress_own_data"
  ON user_study_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 4. SAVED WORDS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_words (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id   TEXT NOT NULL,
  word      TEXT NOT NULL,
  saved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_words_own_data" ON saved_words;
CREATE POLICY "saved_words_own_data"
  ON saved_words FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 5. REVIEW WORDS (SM-2 spaced repetition state)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_words (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id        TEXT NOT NULL,
  word           TEXT NOT NULL,
  next_review_at TIMESTAMPTZ NOT NULL,
  interval_days  INT DEFAULT 1,
  ease_factor    FLOAT DEFAULT 2.5,
  repetitions    INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE review_words ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_words_own_data" ON review_words;
CREATE POLICY "review_words_own_data"
  ON review_words FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 6. WORD REVIEW EVENTS (SM-2 audit log — optional, Phase 5C+)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_review_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id        TEXT NOT NULL,
  reviewed_at    TIMESTAMPTZ DEFAULT NOW(),
  was_correct    BOOLEAN NOT NULL,
  interval_before INT,
  interval_after  INT,
  ease_before    FLOAT,
  ease_after     FLOAT
);

ALTER TABLE word_review_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_events_own_data" ON word_review_events;
CREATE POLICY "review_events_own_data"
  ON word_review_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. WRONG ANSWERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wrong_answers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word_id        TEXT NOT NULL,
  word           TEXT NOT NULL,
  question       TEXT NOT NULL,
  user_answer    TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation    TEXT DEFAULT '',
  source         TEXT DEFAULT 'quiz' CHECK (source IN ('quiz','scan','exam')),
  occurred_at    TIMESTAMPTZ DEFAULT NOW(),
  dedupe_key     TEXT
);

ALTER TABLE wrong_answers
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

ALTER TABLE wrong_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wrong_answers_own_data" ON wrong_answers;
CREATE POLICY "wrong_answers_own_data"
  ON wrong_answers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 8. QUIZ SESSIONS + ATTEMPTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id    TEXT,  -- original client-side session id
  started_at   TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  score        INT DEFAULT 0,
  total        INT DEFAULT 0,
  quiz_type    TEXT DEFAULT 'vocabulary'
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_sessions_own_data" ON quiz_sessions;
CREATE POLICY "quiz_sessions_own_data"
  ON quiz_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  question_id    TEXT,
  word_id        TEXT NOT NULL,
  word           TEXT NOT NULL,
  user_answer    TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct     BOOLEAN NOT NULL,
  answered_at    TIMESTAMPTZ NOT NULL
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_attempts_own_data" ON quiz_attempts;
CREATE POLICY "quiz_attempts_own_data"
  ON quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 9. USER USAGE LIMITS (for authenticated users — future rate limiting)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_usage_limits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint        TEXT NOT NULL,
  request_count   INT DEFAULT 0,
  window_start    TIMESTAMPTZ NOT NULL,
  window_end      TIMESTAMPTZ NOT NULL,
  max_requests    INT NOT NULL,
  UNIQUE(user_id, endpoint, window_start)
);

ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "usage_limits_own_data" ON user_usage_limits;
CREATE POLICY "usage_limits_own_data"
  ON user_usage_limits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- INDEXES for common query patterns
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_words_user ON saved_words(user_id);
CREATE INDEX IF NOT EXISTS idx_review_words_user ON review_words(user_id);
CREATE INDEX IF NOT EXISTS idx_review_words_next ON review_words(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user ON wrong_answers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wrong_answers_user_dedupe
  ON wrong_answers(user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_sessions_user_client
  ON quiz_sessions(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_session ON quiz_attempts(session_id);

-- ────────────────────────────────────────────────────────────
-- END OF PHASE 5C SCHEMA
-- ────────────────────────────────────────────────────────────
-- NEXT STEPS:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
-- 3. Test auth at /auth/login
-- 4. Cloud sync will activate automatically on login
-- ────────────────────────────────────────────────────────────
