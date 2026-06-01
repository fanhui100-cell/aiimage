'use client'

import { useState } from 'react'
import type { ExtractedQuestion } from '@/types/document'
import type { ScanQuizDraft } from '@/types/scan-learning'

interface ExtractedQuestionsPanelProps {
  questions: ExtractedQuestion[]
  sourceFileName: string
  documentId: string
  /** Save question as a quiz draft (status: 'draft') for practice later */
  onSaveAsDraft: (draft: ScanQuizDraft) => void
  /** Any copyright warnings forwarded from DocumentAnalysisResult */
  analysisWarnings?: string[]
  /** Pre-existing question IDs already saved as drafts (from persistent store) */
  preExistingSavedDraftIds?: Set<string>
  /** Pre-existing question IDs already marked difficult (from persistent store) */
  preExistingDifficultIds?: Set<string>
}

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'MC',
  'fill-blank': 'Fill',
  reading: 'Reading',
  grammar: 'Grammar',
  writing: 'Writing',
  unknown: 'Q',
}

const AI_SUGGESTION_DISCLAIMER =
  '⚠ AI-generated suggestion. Not an official answer. Verify before using for exam practice. / AI 生成建议，非官方答案，请在用于考试训练前自行核对。'

export function ExtractedQuestionsPanel({
  questions,
  sourceFileName,
  documentId,
  onSaveAsDraft,
  analysisWarnings,
  preExistingSavedDraftIds,
  preExistingDifficultIds,
}: ExtractedQuestionsPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Track which questions have been saved with which button
  const [savedDraft, setSavedDraft] = useState<Set<string>>(
    () => preExistingSavedDraftIds ?? new Set(),
  )
  const [savedDifficult, setSavedDifficult] = useState<Set<string>>(
    () => preExistingDifficultIds ?? new Set(),
  )

  const hasCopyrightWarning = analysisWarnings?.some(w =>
    /copyright|exam|official|copyrighted/i.test(w),
  )

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function buildDraft(q: ExtractedQuestion, status: ScanQuizDraft['status']): ScanQuizDraft {
    return {
      id: `draft-${documentId}-${q.id}-${status}-${Date.now()}`,
      documentId,
      sourceFileName,
      source: 'ai-document-analysis',
      status,
      questionType: q.type,
      prompt: q.prompt,
      options: q.options,
      answerSuggestion: q.answerSuggestion,
      explanation: q.explanation,
      sourceText: q.sourceText,
      createdAt: new Date().toISOString(),
      copyrightWarning: hasCopyrightWarning
        ? analysisWarnings?.find(w => /copyright|exam/i.test(w))
        : undefined,
    }
  }

  function handleSaveDraft(q: ExtractedQuestion) {
    onSaveAsDraft(buildDraft(q, 'draft'))
    setSavedDraft(prev => new Set(prev).add(q.id))
  }

  // "Difficult" → scanStore with status 'needs-review'.
  // Fully isolated from learningStore.wrongAnswers — scan products stay in scanStore.
  function handleSaveDifficult(q: ExtractedQuestion) {
    onSaveAsDraft(buildDraft(q, 'needs-review'))
    setSavedDifficult(prev => new Set(prev).add(q.id))
  }

  if (questions.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.1em',
        color: 'rgba(139,92,246,0.6)',
        fontFamily: 'ui-monospace, monospace',
        marginBottom: '12px',
      }}>
        EXTRACTED QUESTIONS / 题目分析 ({questions.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {questions.map(q => {
          const isExpanded = expanded.has(q.id)
          const isDraft = savedDraft.has(q.id)
          const isDifficult = savedDifficult.has(q.id)
          return (
            <div key={q.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 7px',
                      borderRadius: '3px',
                      background: 'rgba(139,92,246,0.12)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: 'rgba(139,92,246,0.9)',
                      fontFamily: 'ui-monospace, monospace',
                    }}>
                      {TYPE_LABELS[q.type] ?? 'Q'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6, fontWeight: 600 }}>
                    {q.prompt}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => toggle(q.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.25)',
                      color: '#38BDF8',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {isExpanded ? 'Hide' : 'Answer'}
                  </button>

                  <button
                    onClick={() => handleSaveDraft(q)}
                    disabled={isDraft}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: isDraft ? 'rgba(255,215,106,0.06)' : 'rgba(255,215,106,0.1)',
                      border: `1px solid ${isDraft ? 'rgba(255,215,106,0.3)' : 'rgba(255,215,106,0.4)'}`,
                      color: isDraft ? 'rgba(255,215,106,0.5)' : '#FFD76A',
                      fontSize: '11px',
                      cursor: isDraft ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isDraft ? '✓ Draft' : '+ Draft'}
                  </button>

                  <button
                    onClick={() => handleSaveDifficult(q)}
                    disabled={isDifficult}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      background: isDifficult ? 'rgba(249,115,22,0.06)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${isDifficult ? 'rgba(249,115,22,0.3)' : 'rgba(239,68,68,0.25)'}`,
                      color: isDifficult ? '#F97316' : 'rgba(239,68,68,0.7)',
                      fontSize: '11px',
                      cursor: isDifficult ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isDifficult ? '✓ Marked' : 'Difficult'}
                  </button>
                </div>
              </div>

              {isExpanded && q.answerSuggestion && (
                <div style={{
                  marginTop: '12px',
                  background: 'rgba(139,92,246,0.06)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(139,92,246,0.7)',
                    marginBottom: '6px',
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    AI SUGGESTED ANSWER / AI 建议答案
                  </div>
                  <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6, marginBottom: '4px' }}>
                    {q.answerSuggestion}
                  </div>
                  {q.explanation && (
                    <div style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.5, marginBottom: '8px' }}>
                      {q.explanation}
                    </div>
                  )}
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,215,106,0.55)',
                    borderTop: '1px solid rgba(139,92,246,0.15)',
                    paddingTop: '8px',
                    lineHeight: 1.5,
                  }}>
                    {AI_SUGGESTION_DISCLAIMER}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
