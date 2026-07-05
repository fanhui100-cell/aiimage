/**
 * Phase 5.5 Migration Types
 * Shared by client (read-local-state, MigrationPrompt) and server (API routes).
 */

// ── Migration status (stored in localStorage) ──────────────────────────────

export type MigrationStatusValue =
  | 'not_started'
  | 'previewed'
  | 'completed'
  | 'dismissed'
  | 'failed'

export interface MigrationStatusRecord {
  version: 1
  status: MigrationStatusValue
  completedAt: string | null
  lastAttemptAt: string | null
  migratedCounts: MigratedCounts
  errors: string[]
}

// ── Local data shapes (read from Zustand persist localStorage) ─────────────

export interface LocalReviewWord {
  wordId: string
  word: string
  nextReviewAt: number  // ms epoch
  interval: number
  ease: number
  repetitions: number
}

export interface LocalWrongAnswer {
  id: string
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number  // ms epoch
}

export interface LocalQuizAttempt {
  questionId: string
  wordId: string
  word: string
  userAnswer: string
  correctAnswer?: string
  correct: boolean
  timestamp: number  // ms epoch
}

export interface LocalQuizSession {
  id: string
  startedAt: number  // ms epoch
  completedAt?: number
  attempts: LocalQuizAttempt[]
  score: number
  total: number
}

export interface LocalStudyProgress {
  totalWordsLearned: number
  currentStreak: number
  longestStreak: number
  totalXp: number
  lastStudyDate: string
  levelProgress: Record<string, number>
}

export interface LocalChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number  // ms epoch
  wordRef?: string
}

export interface LocalScanDocument {
  id: string
  fileName: string
  fileType: string
  status: string
  extractionMethod: string
  createdAt: string
  updatedAt: string
  summaryEn?: string
  summaryZh?: string
  rawTextPreview?: string
  rawTextLength?: number
  pageCount?: number
  confidence?: number
  warnings?: string[]
  questionCount: number
  vocabularyCount: number
  studyNoteCount: number
  warningCount: number
  reviewWordsAddedCount: number
  quizDraftsSavedCount: number
  wrongAnswersSavedCount: number
  studyNotesSavedCount: number
  questions?: unknown[]
  vocabulary?: unknown[]
  studyNotes?: unknown[]
  answerSuggestions?: unknown[]
}

export interface LocalScanQuizDraft {
  id: string
  documentId: string
  sourceFileName: string
  source: string
  status: string
  questionType: string
  prompt: string
  options?: string[]
  answerSuggestion?: string
  explanation?: string
  sourceText?: string
  createdAt: string
  copyrightWarning?: string
}

export interface LocalScanStudyNote {
  id: string
  documentId: string
  sourceFileName: string
  title: string
  titleZh: string
  content: string
  contentZh: string
  createdAt: string
}

// ── Full local snapshot ────────────────────────────────────────────────────

export interface LocalSnapshot {
  savedWords: string[]                         // word IDs
  reviewWords: LocalReviewWord[]
  wrongAnswers: LocalWrongAnswer[]
  quizHistory: LocalQuizSession[]
  studyProgress: LocalStudyProgress | null
  userLevel: string | null
  chatMessages: LocalChatMessage[]             // max 100
  scanDocuments: LocalScanDocument[]
  scanQuizDrafts: LocalScanQuizDraft[]
  scanStudyNotes: LocalScanStudyNote[]
}

// ── Preview counts ─────────────────────────────────────────────────────────

export interface MigrationPreviewCounts {
  savedWords: number
  reviewWords: number
  wrongAnswers: number
  quizSessions: number
  quizAttempts: number
  scanDocuments: number
  extractedVocabularyItems: number
  extractedQuestions: number
  scanQuizDrafts: number
  scanStudyNotes: number
  chatMessages: number
  hasRawTextPreview: boolean
  hasDocumentContent: boolean
  hasCopyrightMaterial: boolean
}

// ── Execute payload (sent from client to /api/migration/execute) ───────────

export interface MigrationSavedWord {
  wordId: string
  word: string
}

export interface MigrationExecutePayload {
  confirmed: true
  documentConsent: boolean
  savedWords: MigrationSavedWord[]
  reviewWords: LocalReviewWord[]
  wrongAnswers: LocalWrongAnswer[]
  quizSessions: LocalQuizSession[]
  studyProgress: LocalStudyProgress | null
  userLevel: string | null
  // Only sent when documentConsent === true
  scanDocuments: LocalScanDocument[]
  scanQuizDrafts: LocalScanQuizDraft[]
  scanStudyNotes: LocalScanStudyNote[]
  // Optional — max 100
  chatMessages: LocalChatMessage[]
}

// ── Migration result (returned from execute route) ─────────────────────────

export interface MigratedCounts {
  savedWords: number
  reviewWords: number
  wrongAnswers: number
  quizSessions: number
  quizAttempts: number
  scanDocuments: number
  quizDrafts: number
  studyNotes: number
  chatMessages: number
}

export interface MigrationResult {
  ok: boolean
  migratedCounts: MigratedCounts
  failedSections: string[]
  errors: Record<string, string>
}

// ── Cloud counts (returned from preview route) ─────────────────────────────

export interface CloudCounts {
  savedWords: number
  reviewWords: number
  wrongAnswers: number
  quizSessions: number
  scanDocuments: number
  quizDrafts: number
  studyNotes: number
  chatMessages: number
}
