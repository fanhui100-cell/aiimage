'use client'

import type { DocumentProcessingStatus } from '@/types/document'

interface DocumentProcessingStatusProps {
  status: DocumentProcessingStatus
  error: string | null
  fileName?: string
}

const STEPS: { key: DocumentProcessingStatus; label: string; labelZh: string }[] = [
  { key: 'validating', label: 'Validating file', labelZh: '校验文件' },
  { key: 'extracting', label: 'Extracting text', labelZh: '提取文字' },
  { key: 'analyzing', label: 'AI analyzing', labelZh: 'AI 分析中' },
  { key: 'ready', label: 'Complete', labelZh: '完成' },
]

const STEP_ORDER: DocumentProcessingStatus[] = ['validating', 'extracting', 'analyzing', 'ready']

export function DocumentProcessingStatusPanel({
  status,
  error,
  fileName,
}: DocumentProcessingStatusProps) {
  if (status === 'idle') return null

  const currentIdx = STEP_ORDER.indexOf(status)

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,215,106,0.2)'}`,
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '20px',
      }}
    >
      {fileName && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink-sub)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '14px',
          }}
        >
          📄 {fileName}
        </div>
      )}

      {status === 'error' ? (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#b3261e', marginBottom: '6px' }}>
            ✗ Processing failed / 处理失败
          </div>
          {error && (
            <div style={{ fontSize: '13px', color: 'var(--ink-sub)' }}>{error}</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {STEPS.map((step, i) => {
            const isDone = i < currentIdx || status === 'ready'
            const isActive = step.key === status
            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: i > currentIdx ? 0.3 : 1,
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isDone
                      ? 'rgba(52,211,153,0.3)'
                      : isActive
                        ? 'rgba(179,120,31,0.35)'
                        : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isDone ? 'rgba(14,140,122,0.5)' : isActive ? 'rgba(179,120,31,0.55)' : 'var(--line)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? '✓' : isActive ? '·' : ''}
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    color: isDone ? 'var(--teal-ink)' : isActive ? 'var(--gold-ink)' : 'var(--ink-sub)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step.label} / {step.labelZh}
                  {isActive && <span style={{ marginLeft: '6px', opacity: 0.7 }}>···</span>}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
