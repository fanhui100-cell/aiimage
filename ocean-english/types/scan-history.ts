import type { ExtractedQuestion, ExtractedVocabulary, UploadedDocumentType } from './document'
import type { ScanStudyNote } from './scan-learning'

export type ScanDocumentStatus =
  | 'analyzed'
  | 'partially-analyzed'
  | 'needs-ocr'
  | 'error'

export interface ScanDocumentLibraryItem {
  id: string                      // = client documentId generated in /scan page
  fileName: string
  fileType: UploadedDocumentType
  status: ScanDocumentStatus
  extractionMethod: string
  createdAt: string
  updatedAt: string

  summaryEn?: string
  summaryZh?: string

  rawTextPreview?: string         // first 3000 chars of rawText only
  rawTextLength?: number          // full length of original rawText
  pageCount?: number
  confidence?: number

  questionCount: number
  vocabularyCount: number
  studyNoteCount: number
  warningCount: number

  reviewWordsAddedCount: number
  quizDraftsSavedCount: number
  wrongAnswersSavedCount: number
  studyNotesSavedCount: number

  warnings: string[]
}

export interface ScanDocumentLibraryDetail extends ScanDocumentLibraryItem {
  questions: ExtractedQuestion[]
  vocabulary: ExtractedVocabulary[]
  studyNotes: ScanStudyNote[]     // pre-populated with documentId/sourceFileName at save time
  answerSuggestions: { questionId: string; suggestion: string; explanationZh?: string }[]
}

export interface ScanHistoryFilter {
  query: string
  fileType: 'all' | 'pdf' | 'image' | 'text'
  hasWarnings: boolean
  hasQuestions: boolean
  hasVocabulary: boolean
}
