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
}
