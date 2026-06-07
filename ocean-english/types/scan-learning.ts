/**
 * Scan-to-learning types — Phase 4D.
 * These types represent the intermediate step between raw document analysis
 * and the core learning system (quiz, review, study notes).
 */

export type QuizDraftSource = 'scan' | 'pdf' | 'image' | 'ocr' | 'ai-document-analysis'

export type QuizDraftStatus =
  | 'draft'          // saved, not yet practiced
  | 'needs-review'   // practiced, answer unclear
  | 'ready'          // confirmed correct by user
  | 'saved'          // committed to wrongAnswers or quiz history
  | 'discarded'

export interface ScanQuizDraft {
  id: string
  /**
   * Stable ID for the analysis session that produced this draft.
   * Generated once per document-analysis call; used for filtering and dedup.
   * Prevents same-filename collisions across different analysis sessions.
   */
  documentId: string
  sourceFileName: string
  source: QuizDraftSource
  status: QuizDraftStatus
  questionType: 'multiple-choice' | 'fill-blank' | 'reading' | 'grammar' | 'writing' | 'unknown'
  prompt: string
  options?: string[]
  /** AI-generated suggestion only — not an official answer. */
  answerSuggestion?: string
  explanation?: string
  sourceText?: string
  createdAt: string
  /** Forwarded from DocumentAnalysisResult.warnings if material appears copyrighted. */
  copyrightWarning?: string
}

export interface ScanStudyNote {
  id: string
  /** Stable ID for the analysis session that produced this note. */
  documentId: string
  sourceFileName: string
  title: string
  titleZh: string
  content: string
  contentZh: string
  createdAt: string
}

export interface SaveScanActionResult {
  ok: boolean
  message: string
  messageZh: string
  addedCount?: number
  skippedCount?: number
}
