'use client'

import { useState } from 'react'
import type { ScanQuizDraft } from '@/types/scan-learning'
import { ScanPracticeMode } from './ScanPracticeMode'

interface QuizDraftPreviewProps {
  drafts: ScanQuizDraft[]
  onRemove: (id: string) => void
  /** Called when practice session finishes; use to update draft statuses. */
  onPracticeFinish: (reviewedIds: string[]) => void
}

export function QuizDraftPreview({ drafts, onRemove, onPracticeFinish }: QuizDraftPreviewProps) {
  const [practiceOpen, setPracticeOpen] = useState(false)

  if (drafts.length === 0) return null

  const draftCount = drafts.filter(d => d.status === 'draft').length
  const difficultCount = drafts.filter(d => d.status === 'needs-review').length

  function handleFinish(reviewedIds: string[]) {
    onPracticeFinish(reviewedIds)
    setPracticeOpen(false)
  }

  return (
    <div style={{
      marginTop: '24px',
      background: 'rgba(255,215,106,0.03)',
      border: '1px solid rgba(255,215,106,0.18)',
      borderRadius: '12px',
      padding: '18px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'rgba(255,215,106,0.6)',
            fontFamily: 'var(--font-mono)',
            marginBottom: '2px',
          }}>
            SCAN QUIZ DRAFTS / 扫描练习草稿
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', display: 'flex', gap: '10px' }}>
            {draftCount > 0 && <span>📝 {draftCount} draft{draftCount !== 1 ? 's' : ''}</span>}
            {difficultCount > 0 && <span>⚑ {difficultCount} difficult</span>}
          </div>
        </div>
        <button
          onClick={() => setPracticeOpen(v => !v)}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            background: practiceOpen ? 'rgba(255,215,106,0.08)' : 'rgba(255,215,106,0.14)',
            border: '1px solid rgba(255,215,106,0.45)',
            color: '#FFD76A',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {practiceOpen ? '↑ Close Practice' : '▶ Start Practice / 开始练习'}
        </button>
      </div>

      {/* Draft list */}
      {!practiceOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {drafts.map(d => (
            <div key={d.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${d.status === 'needs-review' ? 'rgba(249,115,22,0.2)' : 'rgba(255,215,106,0.12)'}`,
              borderRadius: '8px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: d.status === 'needs-review' ? 'rgba(249,115,22,0.1)' : 'rgba(255,215,106,0.1)',
                    border: `1px solid ${d.status === 'needs-review' ? 'rgba(249,115,22,0.3)' : 'rgba(255,215,106,0.25)'}`,
                    color: d.status === 'needs-review' ? '#F97316' : 'rgba(255,215,106,0.7)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {d.status === 'needs-review' ? '⚑ difficult' : d.status}
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(155,191,202,0.3)', fontFamily: 'var(--font-mono)' }}>
                    {d.questionType}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.5 }}>
                  {d.prompt.length > 100 ? d.prompt.slice(0, 100) + '…' : d.prompt}
                </div>
              </div>
              <button
                onClick={() => onRemove(d.id)}
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(155,191,202,0.3)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                  lineHeight: 1,
                }}
                aria-label="Remove draft"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {practiceOpen && (
        <ScanPracticeMode
          drafts={drafts}
          onClose={() => setPracticeOpen(false)}
          onFinish={handleFinish}
        />
      )}
    </div>
  )
}
