'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { useLexiStore } from '@/store/lexiStore'
import { useScanStore } from '@/store/scanStore'
import { DocumentComplianceNotice } from '@/components/scan/DocumentComplianceNotice'
import { DocumentUploadPanel } from '@/components/scan/DocumentUploadPanel'
import { DocumentProcessingStatusPanel } from '@/components/scan/DocumentProcessingStatus'
import { PDFExtractionInfoPanel } from '@/components/scan/PDFExtractionInfoPanel'
import { ImageOCRInfoPanel } from '@/components/scan/ImageOCRInfoPanel'
import { DocumentAnalysisPanel } from '@/components/scan/DocumentAnalysisPanel'
import { ScanHistorySaveButton } from '@/components/scan/history/ScanHistorySaveButton'
import { DEMO_RAW_TEXT } from '@/lib/document/demo-text'
import { DOCUMENT_CONFIG } from '@/lib/document/document-config'
import type {
  DocumentProcessingStatus,
  DocumentAnalysisResult,
  ExtractedDocumentData,
  ExtractedVocabulary,
} from '@/types/document'
import type { ScanQuizDraft, ScanStudyNote } from '@/types/scan-learning'

/** Generate a stable short ID for a document analysis session. */
function newDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function ScanPage() {
  const {
    addToReview,
    saveWord,
    completeTaskUnit,
    incrementXp,
    markStudyToday,
    reviewWords,
    userLevel,
    addWrongAnswer,
  } = useLearningStore()

  const {
    scanQuizDrafts,
    addScanQuizDraft,
    removeScanQuizDraft,
    updateScanQuizDraftStatus,
    addScanStudyNote,
  } = useScanStore()

  const [complianceConfirmed, setComplianceConfirmed] = useState(false)
  const [status, setStatus] = useState<DocumentProcessingStatus>('idle')
  const [statusError, setStatusError] = useState<string | null>(null)
  const [extractedDoc, setExtractedDoc] = useState<ExtractedDocumentData | null>(null)
  const [analysisResult, setAnalysisResult] = useState<DocumentAnalysisResult | null>(null)
  // Stable ID per analysis session — generated once when analysis completes.
  // Prevents same-filename collisions and used for dedup in scanStore.
  const [documentId, setDocumentId] = useState('')

  // Build Set of already-in-review word IDs for the VocabPanel dedup display
  const alreadyInReview = useMemo<Set<string>>(
    () => new Set(reviewWords.map(r => r.wordId)),
    [reviewWords],
  )

  // Quiz drafts for the current document session
  const currentDrafts = useMemo<ScanQuizDraft[]>(
    () => (documentId ? scanQuizDrafts.filter(d => d.documentId === documentId) : []),
    [documentId, scanQuizDrafts],
  )

  // ── AI analysis pipeline ─────────────────────────────────────────────────

  async function runAnalysis() {
    if (!extractedDoc) return
    const rawTextForAI = extractedDoc.rawText.slice(0, DOCUMENT_CONFIG.maxRawTextForAnalysis)
    setStatus('analyzing')
    try {
      const res = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawTextForAI,
          fileName: extractedDoc.fileName,
          userLevel: userLevel ?? 'intermediate',
        }),
      })
      const data = (await res.json()) as {
        ok: boolean
        data?: DocumentAnalysisResult
        error?: { message: string }
      }
      if (res.ok && data.ok && data.data) {
        setDocumentId(newDocumentId())
        setAnalysisResult(data.data)
        setStatus('ready')
      } else {
        setStatusError(data.error?.message ?? 'Analysis failed. Please try again.')
        setStatus('error')
      }
    } catch {
      setStatusError('Could not connect to the AI service. Please check your connection.')
      setStatus('error')
    }
  }

  // ── File upload pipeline ─────────────────────────────────────────────────

  async function handleFileUpload(file: File) {
    setStatusError(null)
    setStatus('extracting')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/document/extract', { method: 'POST', body: formData })
      const data = (await res.json()) as {
        ok: boolean
        data?: ExtractedDocumentData
        error?: { message: string }
      }
      if (!res.ok || !data.ok || !data.data) {
        setStatusError(data.error?.message ?? 'Text extraction failed.')
        setStatus('error')
        return
      }
      setExtractedDoc(data.data)
      setStatus('extracted')
    } catch {
      setStatusError('Upload failed. Please check your connection and try again.')
      setStatus('error')
    }
  }

  // ── Demo mode ────────────────────────────────────────────────────────────

  async function handleDemo() {
    setStatusError(null)
    setStatus('extracting')

    await new Promise(r => setTimeout(r, 700))

    const demoDoc: ExtractedDocumentData = {
      fileName: 'Demo — Academic Passage',
      fileType: 'text',
      rawText: DEMO_RAW_TEXT,
      extractionMethod: 'mock',
      pageCount: 1,
      warnings: [
        'Demo mode — using pre-loaded sample text. Upload a real PDF to extract your own content.',
        '演示模式 — 使用预加载示例文本。上传真实 PDF 以提取您自己的内容。',
      ],
    }
    setExtractedDoc(demoDoc)
    setStatus('extracted')
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  function handleReset() {
    setStatus('idle')
    setStatusError(null)
    setExtractedDoc(null)
    setAnalysisResult(null)
    setDocumentId('')
  }

  // ── Learning store: vocabulary review ────────────────────────────────────

  function handleAddToReview(word: ExtractedVocabulary) {
    const id = word.word.toLowerCase().replace(/\s+/g, '-')
    addToReview(id, word.word)
    saveWord(id)
    useLexiStore.getState().setSaved(id, true, word.word)   // A4：统一中枢标记收藏
    completeTaskUnit('vocab-5', 1)
    incrementXp(10)
    markStudyToday()
  }

  // ── Scan store: quiz drafts + study notes ────────────────────────────────

  function handleSaveAsDraft(draft: ScanQuizDraft) {
    addScanQuizDraft(draft)
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
    }
    completeTaskUnit('quiz-5', 1)
    incrementXp(5)
  }

  function handleSaveNote(note: ScanStudyNote) {
    addScanStudyNote(note)
    incrementXp(5)
    markStudyToday()
  }

  // Update statuses for all reviewed drafts after a practice session
  function handlePracticeFinish(reviewedIds: string[]) {
    reviewedIds.forEach(id => {
      // Only advance 'draft' → 'needs-review'; keep 'needs-review' and others unchanged
      const draft = scanQuizDrafts.find(d => d.id === id)
      if (draft?.status === 'draft') {
        updateScanQuizDraftStatus(id, 'needs-review')
      }
    })
    markStudyToday()
  }

  const isActivelyProcessing =
    status === 'validating' || status === 'extracting' || status === 'analyzing'

  return (
    <AppShell>
      <div className="theme-light" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
            文档扫描 · Scan
          </p>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
            文档扫描
          </h1>
          <p style={{ margin: '0 0 28px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
            Scan Mode — Extract vocabulary &amp; study notes from PDFs
          </p>

          {status === 'idle' && (
            <>
              <DocumentComplianceNotice
                confirmed={complianceConfirmed}
                onConfirm={setComplianceConfirmed}
              />
              <DocumentUploadPanel
                disabled={!complianceConfirmed}
                onFile={handleFileUpload}
                onDemo={handleDemo}
              />
            </>
          )}

          {isActivelyProcessing && (
            <DocumentProcessingStatusPanel
              status={status}
              error={null}
              fileName={extractedDoc?.fileName ?? undefined}
            />
          )}

          {status === 'extracted' && extractedDoc && extractedDoc.fileType !== 'image' && (
            <PDFExtractionInfoPanel
              extractedDoc={extractedDoc}
              onAnalyze={runAnalysis}
              onReset={handleReset}
            />
          )}
          {status === 'extracted' && extractedDoc && extractedDoc.fileType === 'image' && (
            <ImageOCRInfoPanel
              extractedDoc={extractedDoc}
              onAnalyze={runAnalysis}
              onReset={handleReset}
            />
          )}

          {status === 'error' && (
            <div>
              <DocumentProcessingStatusPanel
                status={status}
                error={statusError}
                fileName={extractedDoc?.fileName ?? undefined}
              />
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--teal-bg)',
                  border: '1px solid rgba(14,140,122,0.35)',
                  color: 'var(--teal-ink)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                ↩ 重试
              </button>
            </div>
          )}

          {status === 'ready' && analysisResult && (
            <>
              <DocumentAnalysisPanel
                result={analysisResult}
                documentId={documentId}
                onAddToReview={handleAddToReview}
                onSaveAsDraft={handleSaveAsDraft}
                onSaveNote={handleSaveNote}
                onReset={handleReset}
                onPracticeFinish={handlePracticeFinish}
                alreadyInReview={alreadyInReview}
                quizDrafts={currentDrafts}
                onRemoveDraft={removeScanQuizDraft}
              />
              <ScanHistorySaveButton
                analysisResult={analysisResult}
                documentId={documentId}
                extractionMethod={extractedDoc?.extractionMethod ?? 'mock'}
                fileType={extractedDoc?.fileType ?? analysisResult.fileType}
                pageCount={extractedDoc?.pageCount}
                confidence={extractedDoc?.confidence}
              />
            </>
          )}

          <div style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none' }}>
              ← 返回首页
            </Link>
            <Link href="/scan/history" style={{ fontSize: '13px', color: 'var(--ink-sub)', textDecoration: 'none' }}>
              查看扫描历史 →
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
