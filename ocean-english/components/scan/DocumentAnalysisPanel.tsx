'use client'

import type { DocumentAnalysisResult, ExtractedVocabulary, ExtractedQuestion } from '@/types/document'
import type { ScanQuizDraft, ScanStudyNote } from '@/types/scan-learning'
import { StudyNotesPanel } from './StudyNotesPanel'
import { ExtractedQuestionsPanel } from './ExtractedQuestionsPanel'
import { ExtractedVocabularyPanel } from './ExtractedVocabularyPanel'
import { QuizDraftPreview } from './QuizDraftPreview'

interface DocumentAnalysisPanelProps {
  result: DocumentAnalysisResult
  /** Stable ID for this analysis session — used for dedup and documentId on drafts/notes. */
  documentId: string
  onAddToReview: (word: ExtractedVocabulary) => void
  /** Unused: kept for backward-compat signature. Difficult questions now go to onSaveAsDraft. */
  onSaveQuestion?: (question: ExtractedQuestion) => void
  onSaveAsDraft: (draft: ScanQuizDraft) => void
  onSaveNote: (note: ScanStudyNote) => void
  onReset: () => void
  onPracticeFinish: (reviewedIds: string[]) => void
  alreadyInReview?: Set<string>
  quizDrafts?: ScanQuizDraft[]
  onRemoveDraft?: (id: string) => void
}

export function DocumentAnalysisPanel({
  result,
  documentId,
  onAddToReview,
  onSaveAsDraft,
  onSaveNote,
  onReset,
  onPracticeFinish,
  alreadyInReview,
  quizDrafts = [],
  onRemoveDraft,
}: DocumentAnalysisPanelProps) {
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div>
          <div style={{ fontSize: '13px', color: '#34D399', marginBottom: '2px' }}>
            ✓ Analysis complete / 分析完成
          </div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(155,191,202,0.5)',
            fontFamily: 'var(--font-mono)',
          }}>
            {result.fileName} · {result.questions.length} questions · {result.vocabulary.length} words
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: '1px solid rgba(155,191,202,0.2)',
            borderRadius: '7px',
            padding: '7px 14px',
            color: '#9BBFCA',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          ↑ Upload New / 重新上传
        </button>
      </div>

      <StudyNotesPanel result={result} documentId={documentId} onSaveNote={onSaveNote} />

      <ExtractedQuestionsPanel
        questions={result.questions}
        sourceFileName={result.fileName}
        documentId={documentId}
        onSaveAsDraft={onSaveAsDraft}
        analysisWarnings={result.warnings}
      />

      <ExtractedVocabularyPanel
        vocabulary={result.vocabulary}
        onAddToReview={onAddToReview}
        alreadyInReview={alreadyInReview}
      />

      {quizDrafts.length > 0 && onRemoveDraft && (
        <QuizDraftPreview
          drafts={quizDrafts}
          onRemove={onRemoveDraft}
          onPracticeFinish={onPracticeFinish}
        />
      )}
    </div>
  )
}
