/**
 * Lightweight TypeScript types for the Supabase Phase 5C database schema.
 *
 * NOTE: These are hand-written for Phase 5C. Once the Supabase CLI is set up,
 * replace this file with generated types:
 *   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
 */

export interface DbProfile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DbUserLearningPreferences {
  id: string
  user_id: string
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'exam-prep' | 'free-explore' | null
  daily_goal: number
  ui_language: string
  created_at: string
  updated_at: string
}

export interface DbUserStudyProgress {
  id: string
  user_id: string
  total_words_learned: number
  current_streak: number
  longest_streak: number
  total_xp: number
  last_study_date: string | null
  level_progress: Record<string, number>
  updated_at: string
}

export interface DbSavedWord {
  id: string
  user_id: string
  word_id: string
  word: string
  saved_at: string
}

export interface DbReviewWord {
  id: string
  user_id: string
  word_id: string
  word: string
  next_review_at: string
  interval_days: number
  ease_factor: number
  repetitions: number
  created_at: string
  updated_at: string
}

export interface DbWrongAnswer {
  id: string
  user_id: string
  word_id: string
  word: string
  question: string
  user_answer: string
  correct_answer: string
  explanation: string
  source: 'quiz' | 'scan' | 'exam'
  occurred_at: string
}

export interface DbQuizSession {
  id: string
  user_id: string
  client_id: string | null
  started_at: string
  completed_at: string | null
  score: number
  total: number
  quiz_type: string
}

export interface DbQuizAttempt {
  id: string
  session_id: string
  user_id: string
  question_id: string | null
  word_id: string
  word: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  answered_at: string
}

/** Aggregated counts for the profile page cloud stats panel */
export interface DbCloudStats {
  savedWordsCount: number
  reviewWordsCount: number
  wrongAnswersCount: number
  quizSessionsCount: number
  // Phase 5D — scan + chat
  scanDocumentsCount: number
  quizDraftsCount: number
  studyNotesCount: number
  chatSessionsCount: number
  chatMessagesCount: number
}

// ── Phase 5D types ──────────────────────────────────────────────────────────

export interface DbScanDocument {
  id: string
  user_id: string
  file_name: string
  file_type: 'pdf' | 'image' | 'text'
  status: 'analyzed' | 'partially-analyzed' | 'needs-ocr' | 'error'
  extraction_method: string
  created_at: string
  updated_at: string
  summary_en: string | null
  summary_zh: string | null
  raw_text_preview: string | null
  raw_text_length: number | null
  page_count: number | null
  ocr_confidence: number | null
  warnings: unknown[]
  question_count: number
  vocabulary_count: number
  study_note_count: number
  warning_count: number
  questions_json: unknown[]
  vocabulary_json: unknown[]
  study_notes_json: unknown[]
  answer_suggestions_json: unknown[]
}

export interface DbQuizDraft {
  id: string
  user_id: string
  scan_document_id: string | null
  source_file_name: string | null
  source: string
  status: 'draft' | 'needs-review' | 'ready' | 'saved' | 'discarded'
  question_type: string | null
  prompt: string
  options: unknown[]
  answer_suggestion: string | null
  explanation: string | null
  source_text: string | null
  copyright_warning: string | null
  created_at: string
}

export interface DbStudyNote {
  id: string
  user_id: string
  scan_document_id: string | null
  source_file_name: string | null
  title: string
  title_zh: string | null
  content: string
  content_zh: string | null
  created_at: string
}

export interface DbChatSession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  message_count: number
  topic_context: string | null
}

export interface DbChatMessage {
  id: string
  session_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  word_ref: string | null
  sent_at: string
}
