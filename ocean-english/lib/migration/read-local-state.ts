/**
 * Safely reads the three Zustand-persist localStorage stores used by LexiOcean.
 * Returns a typed LocalSnapshot — never throws; missing/corrupt data falls back to empty arrays.
 *
 * IMPORTANT: This module must only be imported in client components (the localStorage API is not
 * available during server-side rendering).
 */

import type {
  LocalSnapshot,
  LocalReviewWord,
  LocalWrongAnswer,
  LocalQuizSession,
  LocalStudyProgress,
  LocalChatMessage,
  LocalScanDocument,
  LocalScanQuizDraft,
  LocalScanStudyNote,
  MigrationPreviewCounts,
  MigrationSavedWord,
} from './migration-types'

// Zustand persist format: { state: {...}, version: number }
function safeParseZustand<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const outer = JSON.parse(raw) as { state?: T; version?: number }
    return outer.state ?? null
  } catch {
    return null
  }
}

interface LearningState {
  userLevel?: string | null
  savedWords?: string[]
  reviewWords?: LocalReviewWord[]
  wrongAnswers?: LocalWrongAnswer[]
  quizHistory?: LocalQuizSession[]
  studyProgress?: LocalStudyProgress
  chatMessages?: LocalChatMessage[]
}

interface ScanHistoryState {
  scanDocuments?: LocalScanDocument[]
}

interface ScanState {
  scanQuizDrafts?: LocalScanQuizDraft[]
  scanStudyNotes?: LocalScanStudyNote[]
}

export function readLocalSnapshot(): LocalSnapshot {
  const learning = safeParseZustand<LearningState>('lexiocean-learning')
  const scanHistory = safeParseZustand<ScanHistoryState>('lexiocean-scan-history')
  const scan = safeParseZustand<ScanState>('lexiocean-scan')

  return {
    savedWords: Array.isArray(learning?.savedWords) ? learning.savedWords : [],
    reviewWords: Array.isArray(learning?.reviewWords) ? learning.reviewWords : [],
    wrongAnswers: Array.isArray(learning?.wrongAnswers) ? learning.wrongAnswers : [],
    quizHistory: Array.isArray(learning?.quizHistory) ? learning.quizHistory : [],
    studyProgress: learning?.studyProgress ?? null,
    userLevel: learning?.userLevel ?? null,
    // Keep max 100 most recent chat messages
    chatMessages: Array.isArray(learning?.chatMessages)
      ? learning.chatMessages.slice(-100)
      : [],
    scanDocuments: Array.isArray(scanHistory?.scanDocuments) ? scanHistory.scanDocuments : [],
    scanQuizDrafts: Array.isArray(scan?.scanQuizDrafts) ? scan.scanQuizDrafts : [],
    scanStudyNotes: Array.isArray(scan?.scanStudyNotes) ? scan.scanStudyNotes : [],
  }
}

/** Check if there is any local data worth migrating */
export function hasLocalDataToMigrate(snapshot: LocalSnapshot): boolean {
  return (
    snapshot.savedWords.length > 0 ||
    snapshot.reviewWords.length > 0 ||
    snapshot.wrongAnswers.length > 0 ||
    snapshot.quizHistory.length > 0 ||
    snapshot.scanDocuments.length > 0 ||
    snapshot.scanQuizDrafts.length > 0 ||
    snapshot.scanStudyNotes.length > 0 ||
    snapshot.chatMessages.length > 0
  )
}

/** Build preview counts from a local snapshot */
export function buildPreviewCounts(snapshot: LocalSnapshot): MigrationPreviewCounts {
  const extractedVocabItems = snapshot.scanDocuments.reduce(
    (sum, d) => sum + (Array.isArray(d.vocabulary) ? d.vocabulary.length : 0),
    0,
  )
  const extractedQuestions = snapshot.scanDocuments.reduce(
    (sum, d) => sum + (Array.isArray(d.questions) ? d.questions.length : 0),
    0,
  )
  const hasRawTextPreview = snapshot.scanDocuments.some(
    d => typeof d.rawTextPreview === 'string' && d.rawTextPreview.length > 0,
  )
  const hasDocumentContent =
    snapshot.scanDocuments.length > 0 ||
    snapshot.scanQuizDrafts.length > 0 ||
    snapshot.scanStudyNotes.length > 0
  const hasCopyrightMaterial = snapshot.scanQuizDrafts.some(d => !!d.copyrightWarning)

  const quizAttempts = snapshot.quizHistory.reduce(
    (sum, s) => sum + (Array.isArray(s.attempts) ? s.attempts.length : 0),
    0,
  )

  return {
    savedWords: snapshot.savedWords.length,
    reviewWords: snapshot.reviewWords.length,
    wrongAnswers: snapshot.wrongAnswers.length,
    quizSessions: snapshot.quizHistory.length,
    quizAttempts,
    scanDocuments: snapshot.scanDocuments.length,
    extractedVocabularyItems: extractedVocabItems,
    extractedQuestions,
    scanQuizDrafts: snapshot.scanQuizDrafts.length,
    scanStudyNotes: snapshot.scanStudyNotes.length,
    chatMessages: snapshot.chatMessages.length,
    hasRawTextPreview,
    hasDocumentContent,
    hasCopyrightMaterial,
  }
}

/**
 * Build the savedWords array for migration.
 * Since the store only has wordIds, we look up word text from reviewWords.
 */
export function buildSavedWordsPayload(snapshot: LocalSnapshot): MigrationSavedWord[] {
  const reviewMap = new Map(snapshot.reviewWords.map(r => [r.wordId, r.word]))
  return snapshot.savedWords.map(wordId => ({
    wordId,
    word: reviewMap.get(wordId) ?? wordId,
  }))
}
