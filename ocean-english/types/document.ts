export type UploadedDocumentType = 'pdf' | 'image' | 'text'

export type DocumentProcessingStatus =
  | 'idle'
  | 'validating'
  | 'extracting'
  | 'extracted'   // Phase 4B: intermediate step — show PDF info before AI analysis
  | 'analyzing'
  | 'ready'
  | 'error'

export type ExtractionMethod =
  | 'pdf-parse'
  | 'image-ocr'    // generic / legacy
  | 'mock-ocr'     // Phase 4C: mock OCR pipeline
  | 'vision-ocr'   // Phase 4C: real Vision API (Gemini/OpenAI)
  | 'mock'
  | 'plain-text'

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  creator?: string
  producer?: string
  creationDate?: string
  modificationDate?: string
}

export interface ExtractedDocumentData {
  fileName: string
  fileType: UploadedDocumentType
  rawText: string
  extractionMethod: ExtractionMethod
  pageCount?: number
  metadata?: PdfMetadata
  /** OCR confidence score 0–1, if available from the OCR provider. */
  confidence?: number
  warnings: string[]
}

export interface ExtractedQuestion {
  id: string
  type: 'multiple-choice' | 'fill-blank' | 'reading' | 'grammar' | 'writing' | 'unknown'
  prompt: string
  options?: string[]
  answerSuggestion?: string
  explanation?: string
  sourceText?: string
}

export interface ExtractedVocabulary {
  word: string
  meaningZh?: string
  definitionEn?: string
  context?: string
  difficulty?: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'exam'
  shouldReview?: boolean
}

export interface DocumentStudyNote {
  title: string
  titleZh: string
  content: string
  contentZh: string
}

export interface AnswerSuggestion {
  questionId: string
  suggestion: string
  explanationZh?: string
}

export interface DocumentAnalysisResult {
  id: string
  fileName: string
  fileType: UploadedDocumentType
  rawText: string
  summaryEn: string
  summaryZh: string
  questions: ExtractedQuestion[]
  vocabulary: ExtractedVocabulary[]
  answerSuggestions: AnswerSuggestion[]
  studyNotes: DocumentStudyNote[]
  warnings: string[]
  createdAt: string
}

export interface DocumentProcessingError {
  code:
    | 'empty_file'
    | 'file_too_large'
    | 'unsupported_type'
    | 'extraction_failed'
    | 'analysis_failed'
    | 'invalid_request'
  message: string
  userMessage: string
}

export interface DocumentExtractionOptions {
  maxTextLength?: number
}
