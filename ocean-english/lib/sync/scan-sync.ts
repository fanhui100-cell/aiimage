/**
 * Scan cloud sync utilities — fire-and-forget, never throw.
 * Only called when user is logged in (CloudSyncProvider checks auth).
 *
 * Privacy guarantees (enforced server-side too):
 * - rawTextPreview is capped at 3000 chars
 * - No rawText, no base64, no file binary
 */

import type { ScanDocumentLibraryDetail } from '@/types/scan-history'
import type { ScanQuizDraft, ScanStudyNote } from '@/types/scan-learning'

async function safeFetch(url: string, init: RequestInit): Promise<void> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn(`[scan-sync] ${init.method} ${url} failed:`, data)
    }
  } catch (err) {
    console.warn(`[scan-sync] ${init.method} ${url} network error:`, err)
  }
}

export function syncScanDocument(doc: ScanDocumentLibraryDetail): void {
  void safeFetch('/api/scan/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      status: doc.status,
      extractionMethod: doc.extractionMethod,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      summaryEn: doc.summaryEn,
      summaryZh: doc.summaryZh,
      // rawTextPreview is already ≤3000 chars in the store; server enforces too
      rawTextPreview: doc.rawTextPreview,
      rawTextLength: doc.rawTextLength,
      pageCount: doc.pageCount,
      confidence: doc.confidence,
      warnings: doc.warnings,
      questionCount: doc.questionCount,
      vocabularyCount: doc.vocabularyCount,
      studyNoteCount: doc.studyNoteCount,
      warningCount: doc.warningCount,
      reviewWordsAddedCount: doc.reviewWordsAddedCount,
      quizDraftsSavedCount: doc.quizDraftsSavedCount,
      wrongAnswersSavedCount: doc.wrongAnswersSavedCount,
      studyNotesSavedCount: doc.studyNotesSavedCount,
      questions: doc.questions,
      vocabulary: doc.vocabulary,
      studyNotes: doc.studyNotes,
      answerSuggestions: doc.answerSuggestions,
    }),
  })
}

export function syncDeleteScanDocument(documentId: string): void {
  void safeFetch(`/api/scan/documents?id=${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  })
}

export function syncClearScanHistory(): void {
  void safeFetch('/api/scan/documents?action=clear-all', {
    method: 'DELETE',
  })
}

export function syncScanQuizDraft(draft: ScanQuizDraft): void {
  void safeFetch('/api/scan/quiz-drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft: {
        id: draft.id,
        documentId: draft.documentId,
        sourceFileName: draft.sourceFileName,
        source: draft.source,
        status: draft.status,
        questionType: draft.questionType,
        prompt: draft.prompt,
        options: draft.options,
        answerSuggestion: draft.answerSuggestion,
        explanation: draft.explanation,
        sourceText: draft.sourceText,
        copyrightWarning: draft.copyrightWarning,
        createdAt: draft.createdAt,
      },
    }),
  })
}

export function syncScanStudyNote(note: ScanStudyNote): void {
  void safeFetch('/api/scan/study-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      note: {
        id: note.id,
        documentId: note.documentId,
        sourceFileName: note.sourceFileName,
        title: note.title,
        titleZh: note.titleZh,
        content: note.content,
        contentZh: note.contentZh,
        createdAt: note.createdAt,
      },
    }),
  })
}
