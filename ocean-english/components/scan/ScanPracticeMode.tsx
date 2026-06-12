'use client'

import { useState } from 'react'
import type { ScanQuizDraft } from '@/types/scan-learning'

interface ScanPracticeModeProps {
  drafts: ScanQuizDraft[]
  onClose: () => void
  /** Called on Finish with the IDs of all drafts that were reviewed in this session. */
  onFinish: (reviewedIds: string[]) => void
}

const AI_DISCLAIMER =
  '⚠ AI-generated suggestion — not an official answer. Verify before exam use. / AI 建议，非官方答案，请自行核对。'

export function ScanPracticeMode({ drafts, onClose, onFinish }: ScanPracticeModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  // Track which draft IDs have been viewed in this session
  const [reviewed, setReviewed] = useState<Set<string>>(new Set([drafts[0]?.id].filter(Boolean) as string[]))

  const current = drafts[currentIndex]
  if (!current) return null

  function next() {
    const nextIdx = Math.min(currentIndex + 1, drafts.length - 1)
    setRevealed(false)
    setCurrentIndex(nextIdx)
    // Mark the next question as reviewed when navigating to it
    setReviewed(prev => new Set(prev).add(drafts[nextIdx].id))
  }

  function prev() {
    setRevealed(false)
    setCurrentIndex(i => Math.max(i - 1, 0))
  }

  function handleFinish() {
    onFinish(Array.from(reviewed))
    onClose()
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === drafts.length - 1

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
          Question {currentIndex + 1} / {drafts.length} · {reviewed.size} reviewed
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {drafts.map((d, i) => (
            <div
              key={d.id}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === currentIndex
                  ? 'var(--gold-ink)'
                  : reviewed.has(d.id)
                  ? 'rgba(14,140,122,0.5)'
                  : 'var(--line)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '12px',
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: current.status === 'needs-review'
          ? 'rgba(249,115,22,0.1)'
          : 'rgba(179,120,31,0.08)',
        border: `1px solid ${current.status === 'needs-review' ? 'rgba(249,115,22,0.3)' : 'rgba(255,215,106,0.2)'}`,
        color: current.status === 'needs-review' ? '#b3261e' : 'var(--gold-ink)',
        fontFamily: 'var(--font-mono)',
      }}>
        {current.status === 'needs-review' ? '⚑ difficult' : current.status}
      </div>

      {/* Question card */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid rgba(255,215,106,0.2)',
        borderRadius: '10px',
        padding: '18px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '10px',
            padding: '1px 7px',
            borderRadius: '3px',
            background: 'rgba(179,120,31,0.08)',
            border: '1px solid rgba(179,120,31,0.35)',
            color: 'var(--gold-ink)',
            fontFamily: 'var(--font-mono)',
          }}>
            {current.questionType}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(155,191,202,0.35)' }}>
            {current.sourceFileName}
          </span>
        </div>

        <div style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.7, fontWeight: 500, marginBottom: '14px' }}>
          {current.prompt}
        </div>

        {current.options && current.options.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {current.options.map((opt, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                borderRadius: '7px',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                fontSize: '13px',
                color: 'var(--ink-sub)',
              }}>
                {opt}
              </div>
            ))}
          </div>
        )}

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.35)',
              color: 'rgba(139,92,246,0.9)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Show AI Suggestion / 显示 AI 建议
          </button>
        ) : (
          <div style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '8px',
            padding: '12px 14px',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(139,92,246,0.7)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '6px',
            }}>
              AI SUGGESTED ANSWER / AI 建议答案
            </div>
            {current.answerSuggestion ? (
              <div style={{ fontSize: '14px', color: 'var(--ink)', lineHeight: 1.6, marginBottom: '6px' }}>
                {current.answerSuggestion}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                No answer suggestion available for this question.
              </div>
            )}
            {current.explanation && (
              <div style={{ fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.5, marginBottom: '8px' }}>
                {current.explanation}
              </div>
            )}
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,215,106,0.5)',
              borderTop: '1px solid rgba(139,92,246,0.15)',
              paddingTop: '8px',
              lineHeight: 1.5,
            }}>
              {AI_DISCLAIMER}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={prev}
          disabled={isFirst}
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            background: 'transparent',
            border: '1px solid var(--line)',
            color: isFirst ? 'var(--line)' : 'var(--ink-sub)',
            fontSize: '13px',
            cursor: isFirst ? 'default' : 'pointer',
          }}
        >
          ← Prev
        </button>

        {isLast ? (
          <button
            onClick={handleFinish}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              background: 'rgba(14,140,122,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: 'var(--teal-ink)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ✓ Finish Practice / 完成练习
          </button>
        ) : (
          <button
            onClick={next}
            style={{
              padding: '8px 18px',
              borderRadius: '7px',
              background: 'rgba(179,120,31,0.08)',
              border: '1px solid rgba(179,120,31,0.4)',
              color: 'var(--gold-ink)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Next → 下一题
          </button>
        )}
      </div>
    </div>
  )
}
