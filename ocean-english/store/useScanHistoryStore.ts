'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DocumentAnalysisResult, UploadedDocumentType } from '@/types/document'
import type { ScanStudyNote } from '@/types/scan-learning'
import type {
  ScanDocumentLibraryDetail,
  ScanDocumentLibraryItem,
  ScanDocumentStatus,
  ScanHistoryFilter,
} from '@/types/scan-history'

const MAX_SCAN_HISTORY = 50
const MAX_RAW_TEXT_PREVIEW = 3000

export type SaveScanDocumentResult = 'saved' | 'already-exists' | 'storage-full' | 'error'

interface SaveMeta {
  documentId: string
  extractionMethod: string
  fileType: UploadedDocumentType
  pageCount?: number
  confidence?: number
}

const DEFAULT_FILTERS: ScanHistoryFilter = {
  query: '',
  fileType: 'all',
  hasWarnings: false,
  hasQuestions: false,
  hasVocabulary: false,
}

interface ScanHistoryStore {
  scanDocuments: ScanDocumentLibraryDetail[]
  scanHistoryFilters: ScanHistoryFilter
  lastSavedScanDocumentId: string | null

  saveScanDocument(result: DocumentAnalysisResult, meta: SaveMeta): SaveScanDocumentResult
  updateScanDocument(id: string, patch: Partial<ScanDocumentLibraryItem>): void
  deleteScanDocument(id: string): void
  clearScanHistory(): void
  getScanDocumentById(id: string): ScanDocumentLibraryDetail | undefined
  getFilteredDocuments(): ScanDocumentLibraryDetail[]
  markVocabularyAdded(documentId: string, count: number): void
  markQuizDraftsSaved(documentId: string, count: number): void
  markWrongAnswersSaved(documentId: string, count: number): void
  markStudyNotesSaved(documentId: string, count: number): void
  setFilters(filters: Partial<ScanHistoryFilter>): void
}

function inferStatus(meta: SaveMeta, warnings: string[]): ScanDocumentStatus {
  if (meta.extractionMethod === 'mock-ocr') return 'needs-ocr'
  if (warnings.some(w => /scanned|no.*text|ocr required/i.test(w))) return 'needs-ocr'
  if (meta.confidence !== undefined && meta.confidence < 0.6) return 'partially-analyzed'
  return 'analyzed'
}

function buildDetail(result: DocumentAnalysisResult, meta: SaveMeta): ScanDocumentLibraryDetail {
  const now = new Date().toISOString()
  const studyNotes: ScanStudyNote[] = result.studyNotes.map((note, i) => ({
    id: `note-${meta.documentId}-${i}`,
    documentId: meta.documentId,
    sourceFileName: result.fileName,
    title: note.title,
    titleZh: note.titleZh,
    content: note.content,
    contentZh: note.contentZh,
    createdAt: now,
  }))

  return {
    id: meta.documentId,
    fileName: result.fileName,
    fileType: meta.fileType,
    status: inferStatus(meta, result.warnings),
    extractionMethod: meta.extractionMethod,
    createdAt: now,
    updatedAt: now,

    summaryEn: result.summaryEn,
    summaryZh: result.summaryZh,

    rawTextPreview: result.rawText.slice(0, MAX_RAW_TEXT_PREVIEW),
    rawTextLength: result.rawText.length,
    pageCount: meta.pageCount,
    confidence: meta.confidence,

    questionCount: result.questions.length,
    vocabularyCount: result.vocabulary.length,
    studyNoteCount: result.studyNotes.length,
    warningCount: result.warnings.length,

    reviewWordsAddedCount: 0,
    quizDraftsSavedCount: 0,
    wrongAnswersSavedCount: 0,
    studyNotesSavedCount: 0,

    warnings: result.warnings,
    questions: result.questions,
    vocabulary: result.vocabulary,
    studyNotes,
    answerSuggestions: result.answerSuggestions.map(a => ({
      questionId: a.questionId,
      suggestion: a.suggestion,
      explanationZh: a.explanationZh,
    })),
  }
}

const INITIAL_STATE = {
  scanDocuments: [] as ScanDocumentLibraryDetail[],
  scanHistoryFilters: DEFAULT_FILTERS,
  lastSavedScanDocumentId: null as string | null,
}

export const useScanHistoryStore = create<ScanHistoryStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      saveScanDocument: (result, meta) => {
        const { scanDocuments } = get()
        if (scanDocuments.some(d => d.id === meta.documentId)) return 'already-exists'
        if (scanDocuments.length >= MAX_SCAN_HISTORY) return 'storage-full'
        try {
          const detail = buildDetail(result, meta)
          set(s => ({
            scanDocuments: [detail, ...s.scanDocuments],
            lastSavedScanDocumentId: meta.documentId,
          }))
          return 'saved'
        } catch {
          return 'error'
        }
      },

      updateScanDocument: (id, patch) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
          ),
        })),

      deleteScanDocument: id =>
        set(s => ({ scanDocuments: s.scanDocuments.filter(d => d.id !== id) })),

      clearScanHistory: () => set({ scanDocuments: [], lastSavedScanDocumentId: null }),

      getScanDocumentById: id => get().scanDocuments.find(d => d.id === id),

      getFilteredDocuments: () => {
        const { scanDocuments, scanHistoryFilters: f } = get()
        return scanDocuments.filter(d => {
          if (f.query) {
            const q = f.query.toLowerCase()
            const matches =
              d.fileName.toLowerCase().includes(q) ||
              (d.summaryEn?.toLowerCase().includes(q) ?? false) ||
              (d.summaryZh?.toLowerCase().includes(q) ?? false)
            if (!matches) return false
          }
          if (f.fileType !== 'all' && d.fileType !== f.fileType) return false
          if (f.hasWarnings && d.warningCount === 0) return false
          if (f.hasQuestions && d.questionCount === 0) return false
          if (f.hasVocabulary && d.vocabularyCount === 0) return false
          return true
        })
      },

      markVocabularyAdded: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, reviewWordsAddedCount: d.reviewWordsAddedCount + count }
              : d,
          ),
        })),

      markQuizDraftsSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, quizDraftsSavedCount: d.quizDraftsSavedCount + count }
              : d,
          ),
        })),

      markWrongAnswersSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, wrongAnswersSavedCount: d.wrongAnswersSavedCount + count }
              : d,
          ),
        })),

      markStudyNotesSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, studyNotesSavedCount: d.studyNotesSavedCount + count }
              : d,
          ),
        })),

      setFilters: filters =>
        set(s => ({ scanHistoryFilters: { ...s.scanHistoryFilters, ...filters } })),
    }),
    {
      name: 'lexiocean-scan-history',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({ ...INITIAL_STATE }),
      partialize: state => ({
        scanDocuments: state.scanDocuments,
        scanHistoryFilters: state.scanHistoryFilters,
        lastSavedScanDocumentId: state.lastSavedScanDocumentId,
      }),
    },
  ),
)
