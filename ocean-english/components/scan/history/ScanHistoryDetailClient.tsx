'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { useScanStore } from '@/store/scanStore'
import { useLexiStore } from '@/store/lexiStore'
import { ExtractedVocabularyPanel } from '@/components/scan/ExtractedVocabularyPanel'
import { ExtractedQuestionsPanel } from '@/components/scan/ExtractedQuestionsPanel'
import type { ExtractedVocabulary } from '@/types/document'
import type { ScanQuizDraft } from '@/types/scan-learning'

const STATUS_COLORS: Record<string, string> = {
  analyzed: '#34D399',
  'partially-analyzed': '#FFD76A',
  'needs-ocr': '#F97316',
  error: '#F87171',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

interface ScanHistoryDetailClientProps {
  documentId: string
}

export function ScanHistoryDetailClient({ documentId }: ScanHistoryDetailClientProps) {
  const { getScanDocumentById, deleteScanDocument, markVocabularyAdded, markQuizDraftsSaved, markWrongAnswersSaved, markStudyNotesSaved } = useScanHistoryStore()
  const { addScanQuizDraft, addScanStudyNote, scanQuizDrafts, scanStudyNotes } = useScanStore()
  const addWrongAnswer = useLexiStore(s => s.addWrongAnswer)
  const lexiWords = useLexiStore(s => s.words)

  const doc = getScanDocumentById(documentId)

  const [rawExpanded, setRawExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const alreadyInReview = useMemo(
    () => new Set(lexiWords.filter(w => w.nextReviewAt != null).map(w => w.id)),
    [lexiWords],
  )

  const preExistingSavedDraftIds = useMemo(() => {
    if (!doc) return new Set<string>()
    const savedPrompts = new Set(
      scanQuizDrafts
        .filter(d => d.documentId === documentId && d.status !== 'needs-review')
        .map(d => d.prompt),
    )
    return new Set(
      doc.questions.filter(q => savedPrompts.has(q.prompt)).map(q => q.id),
    )
  }, [scanQuizDrafts, doc, documentId])

  const preExistingDifficultIds = useMemo(() => {
    if (!doc) return new Set<string>()
    const savedPrompts = new Set(
      scanQuizDrafts
        .filter(d => d.documentId === documentId && d.status === 'needs-review')
        .map(d => d.prompt),
    )
    return new Set(
      doc.questions.filter(q => savedPrompts.has(q.prompt)).map(q => q.id),
    )
  }, [scanQuizDrafts, doc, documentId])

  const savedNoteIndices = useMemo(() => {
    if (!doc) return new Set<number>()
    return new Set(
      doc.studyNotes
        .map((note, i) => ({ note, i }))
        .filter(({ note }) =>
          scanStudyNotes.some(n => n.documentId === documentId && n.title === note.title),
        )
        .map(({ i }) => i),
    )
  }, [scanStudyNotes, doc, documentId])

  const [localSavedNotes, setLocalSavedNotes] = useState<Set<number>>(() => savedNoteIndices)

  if (!doc || deleted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
          <p style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '8px' }}>
            {deleted ? 'Document record deleted / 已删除文档记录' : 'Document not found / 文档记录不存在'}
          </p>
          <Link href="/scan/history" style={{ color: '#38BDF8', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Scan History / 返回扫描历史
          </Link>
        </div>
      </div>
    )
  }

  function handleAddToReview(word: ExtractedVocabulary) {
    const id = word.word.toLowerCase().replace(/\s+/g, '-')
    // A4：扫描词进统一状态机（带释义与来源），收藏 + 进 SRS 队列
    const lexi = useLexiStore.getState()
    lexi.addWord({ id, word: word.word, zh: word.meaningZh ?? word.definitionEn ?? '', source: 'scan' })
    lexi.setSaved(id, true, word.word)
    lexi.addToReview(id)
    lexi.recordActivity('learned')
    lexi.incXp(10)
    markVocabularyAdded(documentId, 1)
  }

  function handleSaveAsDraft(draft: ScanQuizDraft) {
    const isNew = !scanQuizDrafts.some(
      d => d.documentId === draft.documentId && d.prompt === draft.prompt,
    )
    addScanQuizDraft(draft)
    if (isNew) {
      if (draft.status === 'needs-review') {
        addWrongAnswer({
          wordId: `scan-${draft.documentId}`,
          word: draft.sourceFileName,
          question: draft.prompt,
          userAnswer: '',
          correctAnswer: draft.answerSuggestion ?? '—',
          explanation: draft.explanation ?? '',
          timestamp: Date.now(),
        })
        markWrongAnswersSaved(documentId, 1)
      } else {
        markQuizDraftsSaved(documentId, 1)
      }
    }
    useLexiStore.getState().incXp(5)
  }

  function handleSaveNote(index: number) {
    const note = doc!.studyNotes[index]
    if (!note) return
    const isNew = !scanStudyNotes.some(n => n.documentId === documentId && n.title === note.title)
    addScanStudyNote(note)
    if (isNew) markStudyNotesSaved(documentId, 1)
    setLocalSavedNotes(prev => new Set(prev).add(index))
    const lexi = useLexiStore.getState()
    lexi.incXp(5)
    lexi.recordActivity('learned')
  }

  function handleDelete() {
    deleteScanDocument(documentId)
    setDeleted(true)
  }

  const statusColor = STATUS_COLORS[doc.status] ?? '#9BBFCA'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/scan/history" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Scan History / 返回扫描历史
          </Link>
        </div>

        {/* Doc header */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(155,191,202,0.12)',
          borderRadius: '12px',
          padding: '20px 22px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#ECFBFF', wordBreak: 'break-word' }}>
                {doc.fileName}
              </h1>
              <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', fontFamily: 'var(--font-mono)' }}>
                {formatDate(doc.createdAt)} · {doc.extractionMethod}
                {doc.pageCount ? ` · ${doc.pageCount}p` : ''}
                {doc.confidence !== undefined ? ` · OCR ${Math.round(doc.confidence * 100)}%` : ''}
              </div>
            </div>
            <span style={{
              flexShrink: 0,
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '4px',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
              fontFamily: 'var(--font-mono)',
              marginTop: '2px',
            }}>
              {doc.status}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: doc.warnings.length > 0 ? '12px' : 0 }}>
            {[
              { label: 'Questions', value: doc.questionCount, color: '#8B5CF6' },
              { label: 'Words', value: doc.vocabularyCount, color: '#38BDF8' },
              { label: 'Notes', value: doc.studyNoteCount, color: '#34D399' },
              { label: 'Warnings', value: doc.warningCount, color: '#FFD76A' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color }}>
                {value} {label}
              </div>
            ))}
          </div>

          {/* Warnings */}
          {doc.warnings.length > 0 && (
            <div style={{
              background: 'rgba(255,215,106,0.04)',
              border: '1px solid rgba(255,215,106,0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
            }}>
              {doc.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'rgba(255,215,106,0.8)', marginBottom: i < doc.warnings.length - 1 ? '3px' : 0 }}>
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {(doc.summaryEn || doc.summaryZh) && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(155,191,202,0.1)',
            borderRadius: '10px',
            padding: '16px 18px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(56,189,248,0.6)', fontFamily: 'var(--font-mono)', marginBottom: '10px' }}>
              DOCUMENT SUMMARY / 文档摘要
            </div>
            {doc.summaryEn && (
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.7 }}>{doc.summaryEn}</p>
            )}
            {doc.summaryZh && (
              <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.7 }}>{doc.summaryZh}</p>
            )}
          </div>
        )}

        {/* Raw text preview */}
        {doc.rawTextPreview && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setRawExpanded(v => !v)}
              style={{
                background: 'none',
                border: '1px solid rgba(155,191,202,0.15)',
                borderRadius: '6px',
                padding: '6px 14px',
                color: 'rgba(155,191,202,0.5)',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {rawExpanded ? '▲ Hide' : '▼ Show'} Raw Text Preview / 原始文本预览
            </button>
            {rawExpanded && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(155,191,202,0.1)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: '#9BBFCA',
                  lineHeight: 1.8,
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  {doc.rawTextPreview}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(155,191,202,0.4)' }}>
                  ℹ Preview only — showing first {doc.rawTextPreview.length.toLocaleString()} of {doc.rawTextLength?.toLocaleString() ?? '?'} characters.
                  Original file is not stored. / 仅显示预览，原始文件未保存。
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary panel (reused) */}
        <ExtractedVocabularyPanel
          vocabulary={doc.vocabulary}
          onAddToReview={handleAddToReview}
          alreadyInReview={alreadyInReview}
        />

        {/* Questions panel (reused) */}
        {doc.questions.length > 0 && (
          <ExtractedQuestionsPanel
            questions={doc.questions}
            sourceFileName={doc.fileName}
            documentId={documentId}
            onSaveAsDraft={handleSaveAsDraft}
            analysisWarnings={doc.warnings}
            preExistingSavedDraftIds={preExistingSavedDraftIds}
            preExistingDifficultIds={preExistingDifficultIds}
          />
        )}

        {/* Study notes */}
        {doc.studyNotes.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(52,211,153,0.6)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
              STUDY NOTES / 学习笔记 ({doc.studyNotes.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {doc.studyNotes.map((note, i) => {
                const isSaved = localSavedNotes.has(i)
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(155,191,202,0.1)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8', marginBottom: '4px' }}>
                          {note.title} / {note.titleZh}
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#ECFBFF', lineHeight: 1.6 }}>{note.content}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>{note.contentZh}</p>
                      </div>
                      <button
                        onClick={() => handleSaveNote(i)}
                        disabled={isSaved}
                        style={{
                          flexShrink: 0,
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: isSaved ? 'rgba(52,211,153,0.06)' : 'rgba(56,189,248,0.08)',
                          border: `1px solid ${isSaved ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.25)'}`,
                          color: isSaved ? '#34D399' : '#38BDF8',
                          fontSize: '11px',
                          cursor: isSaved ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSaved ? '✓ Saved' : '+ Save Note'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Compliance notice */}
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '24px',
          fontSize: '11px',
          color: 'rgba(255,215,106,0.6)',
          lineHeight: 1.6,
        }}>
          AI-generated answer suggestions are not official answers. Verify before use. /
          AI 生成答案建议不是官方答案，使用前请自行核对。
          <br />
          Uploaded content was used only for personal learning analysis. /
          上传内容仅用于个人学习分析。
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href="/scan/history"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(155,191,202,0.08)',
              border: '1px solid rgba(155,191,202,0.2)',
              color: '#9BBFCA',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Scan History / 扫描历史
          </Link>
          <Link
            href="/scan"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: '#38BDF8',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Scan / 前往扫描 →
          </Link>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Delete Record / 删除记录
            </button>
          ) : (
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(239,68,68,0.85)' }}>
                Delete this record? / 确认删除？
              </span>
              <button
                onClick={handleDelete}
                style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', fontSize: '12px', cursor: 'pointer' }}
              >
                Yes / 是
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '4px 10px', borderRadius: '6px', background: 'none', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel / 取消
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
