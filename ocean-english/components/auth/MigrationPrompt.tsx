'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  readLocalSnapshot,
  hasLocalDataToMigrate,
  buildPreviewCounts,
  buildSavedWordsPayload,
} from '@/lib/migration/read-local-state'
import {
  readMigrationStatus,
  setMigrationCompleted,
  setMigrationFailed,
  setMigrationDismissed,
  setMigrationPreviewed,
  resetMigrationStatus,
} from '@/lib/migration/migration-status'
import type {
  MigrationPreviewCounts,
  MigrationStatusRecord,
  MigrationResult,
  LocalSnapshot,
  MigrationExecutePayload,
} from '@/lib/migration/migration-types'

type UIStep = 'idle' | 'banner' | 'preview' | 'running' | 'done' | 'error' | 'already-done'

// All state that comes from localStorage is initialised in one batch
interface InitState {
  step: UIStep
  snapshot: LocalSnapshot | null
  previewCounts: MigrationPreviewCounts | null
  statusRecord: MigrationStatusRecord | null
}

// ── Styles ─────────────────────────────────────────────────────────────────

const S = {
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(155,191,202,0.14)',
    borderRadius: '10px',
    padding: '16px 18px',
    marginBottom: '16px',
  } satisfies React.CSSProperties,
  label: {
    fontSize: '11px',
    color: 'rgba(56,189,248,0.6)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    marginBottom: '10px',
  } satisfies React.CSSProperties,
  row: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '4px',
  } satisfies React.CSSProperties,
  rowLabel: { fontSize: '12px', color: '#9BBFCA' } satisfies React.CSSProperties,
  rowValue: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: '#ECFBFF',
    fontWeight: 600,
  } satisfies React.CSSProperties,
  btn: (color: string): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '7px',
    background: `${color}14`,
    border: `1px solid ${color}40`,
    color,
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 600,
  }),
  ghost: {
    padding: '8px 14px',
    borderRadius: '7px',
    background: 'transparent',
    border: '1px solid rgba(155,191,202,0.15)',
    color: 'rgba(155,191,202,0.6)',
    fontSize: '12px',
    cursor: 'pointer',
  } satisfies React.CSSProperties,
  warning: {
    fontSize: '11px',
    color: 'rgba(251,191,36,0.75)',
    background: 'rgba(251,191,36,0.04)',
    border: '1px solid rgba(251,191,36,0.12)',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '10px',
    lineHeight: 1.5,
  } satisfies React.CSSProperties,
  success: {
    fontSize: '12px',
    color: '#34D399',
    background: 'rgba(52,211,153,0.04)',
    border: '1px solid rgba(52,211,153,0.2)',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '10px',
    lineHeight: 1.5,
  } satisfies React.CSSProperties,
  err: {
    fontSize: '12px',
    color: '#F87171',
    background: 'rgba(248,113,113,0.04)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '10px',
    lineHeight: 1.5,
  } satisfies React.CSSProperties,
}

// ── Sub-component ──────────────────────────────────────────────────────────

function CountRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null
  return (
    <div style={S.row}>
      <span style={S.rowLabel}>{label}</span>
      <span style={S.rowValue}>{value}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function MigrationPrompt() {
  const [init, setInit] = useState<InitState>({
    step: 'idle',
    snapshot: null,
    previewCounts: null,
    statusRecord: null,
  })
  const [step, setStep] = useState<UIStep>('idle')
  const [documentConsent, setDocumentConsent] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  useEffect(() => {
    const status = readMigrationStatus()
    const snap = readLocalSnapshot()
    const hasMigratableData = hasLocalDataToMigrate(snap)

    const initialStep: UIStep =
      status.status === 'completed' ? 'already-done'
      : status.status === 'dismissed' ? 'idle'
      : hasMigratableData ? 'banner'
      : 'idle'

    setInit({
      step: initialStep,
      snapshot: snap,
      previewCounts: hasMigratableData ? buildPreviewCounts(snap) : null,
      statusRecord: status,
    })
    setStep(initialStep)
  }, [])

  const handleStartPreview = useCallback(() => {
    setMigrationPreviewed()
    setStep('preview')
  }, [])

  const handleDismiss = useCallback(() => {
    setMigrationDismissed()
    setStep('idle')
  }, [])

  const handleExecute = useCallback(async () => {
    const snapshot = init.snapshot
    if (!snapshot) return
    setStep('running')
    setRunError(null)

    const payload: MigrationExecutePayload = {
      confirmed: true,
      documentConsent,
      savedWords: buildSavedWordsPayload(snapshot),
      reviewWords: snapshot.reviewWords,
      wrongAnswers: snapshot.wrongAnswers,
      quizSessions: snapshot.quizHistory,
      studyProgress: snapshot.studyProgress,
      userLevel: snapshot.userLevel,
      scanDocuments: documentConsent ? snapshot.scanDocuments : [],
      scanQuizDrafts: documentConsent ? snapshot.scanQuizDrafts : [],
      scanStudyNotes: documentConsent ? snapshot.scanStudyNotes : [],
      chatMessages: snapshot.chatMessages,
    }

    try {
      const res = await fetch('/api/migration/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as MigrationResult & { error?: string }

      if (!res.ok) {
        const msg = data.error ?? `HTTP ${res.status}`
        setMigrationFailed([msg])
        setRunError(msg)
        setStep('error')
        return
      }

      setResult(data)
      if (data.failedSections && data.failedSections.length > 0) {
        setMigrationFailed(data.failedSections)
        setStep('error')
      } else {
        setMigrationCompleted(data.migratedCounts)
        setStep('done')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'network_error'
      setMigrationFailed([msg])
      setRunError(msg)
      setStep('error')
    }
  }, [init.snapshot, documentConsent])

  const handleReopen = useCallback(() => {
    resetMigrationStatus('not_started')
    const snap = readLocalSnapshot()
    if (hasLocalDataToMigrate(snap)) {
      setInit(prev => ({
        ...prev,
        snapshot: snap,
        previewCounts: buildPreviewCounts(snap),
      }))
      setStep('banner')
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────

  const { previewCounts, statusRecord } = init

  if (step === 'idle') return null

  if (step === 'already-done') {
    return (
      <div style={S.card}>
        <div style={S.label}>LOCAL → CLOUD MIGRATION / 本地数据迁移</div>
        <div style={S.success}>
          Migration completed
          {statusRecord?.completedAt
            ? ` on ${new Date(statusRecord.completedAt).toLocaleDateString('zh-CN')}`
            : ''}.
          Local data remains in localStorage as backup.
          <br />
          <span style={{ fontSize: '11px', color: 'rgba(52,211,153,0.6)' }}>
            迁移已完成。本地数据仍保留在 localStorage 中作为备份。
          </span>
        </div>
        <button style={S.ghost} onClick={handleReopen}>
          Re-migrate / 重新迁移
        </button>
      </div>
    )
  }

  if (step === 'banner') {
    return (
      <div style={S.card}>
        <div style={S.label}>LOCAL → CLOUD MIGRATION / 本地数据迁移</div>
        <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '6px', fontWeight: 600 }}>
          Local learning data detected / 检测到本地学习数据
        </div>
        {previewCounts && (
          <div style={{ fontSize: '12px', color: '#9BBFCA', marginBottom: '10px', lineHeight: 1.6 }}>
            Found {previewCounts.savedWords} saved words,{' '}
            {previewCounts.reviewWords} review words,{' '}
            {previewCounts.quizSessions} quiz sessions,{' '}
            {previewCounts.scanDocuments} scan docs,{' '}
            {previewCounts.chatMessages} chat messages.
            <br />
            <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>
              检测到本地数据，可同步到您的账户。
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          <button style={S.btn('#38BDF8')} onClick={handleStartPreview}>
            Preview &amp; Migrate / 预览并迁移
          </button>
          <button style={S.ghost} onClick={handleDismiss}>
            Don&apos;t migrate / 不迁移
          </button>
        </div>
      </div>
    )
  }

  if (step === 'preview' && previewCounts) {
    const hasDocData = previewCounts.hasDocumentContent
    return (
      <div style={S.card}>
        <div style={S.label}>MIGRATION PREVIEW / 迁移预览</div>

        <div style={S.warning}>
          <strong>Privacy Notice / 隐私说明</strong><br />
          • Data syncs to your account only — never made public.<br />
          • No original PDF, images, or base64 will be uploaded.<br />
          • Only a text preview up to 3,000 characters is stored.<br />
          • AI-generated answers are for personal study only.<br />
          • 您的数据只同步到您自己的账户。不上传原始文件，不保存 base64。
        </div>

        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: 'rgba(56,189,248,0.45)', fontFamily: 'monospace', marginBottom: '4px' }}>
            LEARNING DATA / 学习数据
          </div>
          <CountRow label="Saved Words / 收藏单词" value={previewCounts.savedWords} />
          <CountRow label="Review Words / 复习单词" value={previewCounts.reviewWords} />
          <CountRow label="Wrong Answers / 错题" value={previewCounts.wrongAnswers} />
          <CountRow label="Quiz Sessions / 练习记录" value={previewCounts.quizSessions} />
          <CountRow label="Quiz Attempts / 答题记录" value={previewCounts.quizAttempts} />
          <CountRow label="Chat Messages / 聊天记录 (max 100)" value={previewCounts.chatMessages} />
        </div>

        {hasDocData && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(56,189,248,0.45)', fontFamily: 'monospace', marginBottom: '4px' }}>
              SCAN &amp; DOCUMENT DATA / 扫描数据（需要确认）
            </div>
            <CountRow label="Scan Documents / 扫描文档" value={previewCounts.scanDocuments} />
            <CountRow label="Vocabulary Items / 词汇条目" value={previewCounts.extractedVocabularyItems} />
            <CountRow label="Extracted Questions / 提取题目" value={previewCounts.extractedQuestions} />
            <CountRow label="Quiz Drafts / 题目草稿" value={previewCounts.scanQuizDrafts} />
            <CountRow label="Study Notes / 学习笔记" value={previewCounts.scanStudyNotes} />

            {previewCounts.hasCopyrightMaterial && (
              <div style={{ ...S.warning, marginTop: '6px' }}>
                Some quiz drafts may contain copyrighted material — for personal study only.
                <br />
                <span style={{ fontSize: '10px' }}>部分题目可能含版权材料，仅供个人学习。</span>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={documentConsent}
                onChange={e => setDocumentConsent(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#38BDF8', flexShrink: 0 }}
              />
              <span style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.5 }}>
                I confirm that scanned document content (text preview ≤3,000 chars, AI-generated
                questions, study notes) will be synced to my private account only.
                No original files will be uploaded.
                <br />
                <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>
                  我确认扫描内容（文本预览≤3000字、AI生成题目、笔记）仅同步到我的私有账户，不上传原始文件。
                </span>
              </span>
            </label>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginTop: '10px' }}>
          <button
            style={S.btn('#34D399')}
            onClick={() => void handleExecute()}
          >
            {hasDocData && !documentConsent
              ? 'Migrate (skip scan data) / 迁移（跳过扫描数据）'
              : 'Start Migration / 开始迁移'}
          </button>
          <button style={S.ghost} onClick={() => setStep('banner')}>Back / 返回</button>
          <button style={S.ghost} onClick={handleDismiss}>Skip / 跳过</button>
        </div>

        {hasDocData && !documentConsent && (
          <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)', marginTop: '6px' }}>
            Scan data will be skipped. Check the consent box above to also migrate scan documents,
            quiz drafts, and study notes.
            <br />
            <span style={{ fontSize: '10px' }}>未勾选同意，扫描数据将被跳过，只迁移学习和聊天数据。</span>
          </div>
        )}
      </div>
    )
  }

  if (step === 'running') {
    return (
      <div style={S.card}>
        <div style={S.label}>MIGRATING… / 迁移中…</div>
        <div style={{ fontSize: '13px', color: '#9BBFCA' }}>
          Uploading your local data to the cloud. Please wait.
          <br />
          <span style={{ fontSize: '11px' }}>正在上传本地数据到云端，请稍候。</span>
        </div>
      </div>
    )
  }

  if (step === 'done' && result) {
    const c = result.migratedCounts
    return (
      <div style={S.card}>
        <div style={S.label}>MIGRATION COMPLETE / 迁移完成</div>
        <div style={S.success}>
          Your local learning data has been synced to your account.
          Local data remains in localStorage as backup.
          <br />
          <span style={{ fontSize: '11px', color: 'rgba(52,211,153,0.6)' }}>
            本地学习数据已同步。本地数据仍保留为备份。
          </span>
        </div>
        <div>
          {c.savedWords > 0 && <div style={S.row}><span style={S.rowLabel}>Saved Words</span><span style={S.rowValue}>{c.savedWords}</span></div>}
          {c.reviewWords > 0 && <div style={S.row}><span style={S.rowLabel}>Review Words</span><span style={S.rowValue}>{c.reviewWords}</span></div>}
          {c.wrongAnswers > 0 && <div style={S.row}><span style={S.rowLabel}>Wrong Answers</span><span style={S.rowValue}>{c.wrongAnswers}</span></div>}
          {c.quizSessions > 0 && <div style={S.row}><span style={S.rowLabel}>Quiz Sessions</span><span style={S.rowValue}>{c.quizSessions}</span></div>}
          {c.scanDocuments > 0 && <div style={S.row}><span style={S.rowLabel}>Scan Documents</span><span style={S.rowValue}>{c.scanDocuments}</span></div>}
          {c.quizDrafts > 0 && <div style={S.row}><span style={S.rowLabel}>Quiz Drafts</span><span style={S.rowValue}>{c.quizDrafts}</span></div>}
          {c.studyNotes > 0 && <div style={S.row}><span style={S.rowLabel}>Study Notes</span><span style={S.rowValue}>{c.studyNotes}</span></div>}
          {c.chatMessages > 0 && <div style={S.row}><span style={S.rowLabel}>Chat Messages</span><span style={S.rowValue}>{c.chatMessages}</span></div>}
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div style={S.card}>
        <div style={S.label}>MIGRATION / 迁移</div>
        <div style={S.err}>
          {result && result.failedSections.length > 0 ? (
            <>
              Migration partially failed. Failed: {result.failedSections.join(', ')}.
              Successfully migrated sections are saved. Local data not affected.
              <br />
              <span style={{ fontSize: '11px' }}>
                部分失败（{result.failedSections.join(', ')}），成功部分已保存，本地数据未受影响。
              </span>
            </>
          ) : (
            <>
              Migration failed: {runError ?? 'unknown error'}. Local data is not affected.
              <br />
              <span style={{ fontSize: '11px' }}>迁移失败，本地数据未受影响。</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          <button style={S.btn('#38BDF8')} onClick={() => setStep('preview')}>
            Try again / 重试
          </button>
          <button style={S.ghost} onClick={handleDismiss}>Skip / 跳过</button>
        </div>
      </div>
    )
  }

  return null
}
