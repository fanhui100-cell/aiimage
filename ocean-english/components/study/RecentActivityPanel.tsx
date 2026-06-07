'use client'

import { useState } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import type { LexiStarLedgerEntry } from '@/lib/motivation/motivation-types'

interface Props {
  ledger: LexiStarLedgerEntry[]
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  pronunciation: { label: 'Played pronunciation', color: '#7EF9FF' },
  review: { label: 'Added to review', color: '#34D399' },
  quiz: { label: 'Started quiz', color: '#8B5CF6' },
  nodeOpen: { label: 'Opened in LexiGraph', color: '#38BDF8' },
  achievement: { label: 'Achievement unlocked', color: '#FFD76A' },
  mission: { label: 'Mission complete', color: '#F97316' },
}

function timeAgo(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RecentActivityPanel({ ledger }: Props) {
  const [expanded, setExpanded] = useState(false)
  const recent = [...ledger].reverse().slice(0, expanded ? 12 : 5)

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <SectionHeader label="RECENT ACTIVITY" labelZh="最近活动" style={{ margin: 0 }} />
        {ledger.length > 5 && (
          <button
            onClick={() => setExpanded(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'rgba(56,189,248,0.5)', padding: 0 }}
          >
            {expanded ? 'Show less ▴' : 'Show more ▾'}
          </button>
        )}
      </div>

      {ledger.length === 0 ? (
        <EmptyState
          title="No activity yet"
          titleZh="暂无活动记录"
          description="Your LexiStar earnings and learning actions will appear here."
          descriptionZh="你的 LexiStar 收益和学习动作将显示在这里。"
          variant="empty"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {recent.map(entry => {
            const meta = REASON_LABELS[entry.reason] ?? { label: entry.action, color: '#9BBFCA' }
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: '7px',
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(155,191,202,0.07)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '12px', color: meta.color, flexShrink: 0 }}>
                    +{entry.points}★
                  </span>
                  <span style={{ fontSize: '12px', color: '#9BBFCA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {meta.label}{entry.word ? ` · ${entry.word}` : ''}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.3)', marginLeft: '8px', flexShrink: 0 }}>
                  {timeAgo(entry.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
