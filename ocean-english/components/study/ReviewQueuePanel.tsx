'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ReviewWord } from '@/store/learningStore'

interface Props {
  dueWords: ReviewWord[]
  totalReviewWords: number
}

export function ReviewQueuePanel({ dueWords, totalReviewWords }: Props) {
  const dueCount = dueWords.length
  const preview = dueWords.slice(0, 3)

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <SectionHeader label="REVIEW QUEUE" labelZh="复习队列" style={{ margin: 0 }} />
        {dueCount > 0 && (
          <span
            style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.12)', color: '#EF4444',
              border: '1px solid rgba(239,68,68,0.25)', fontFamily: 'var(--font-mono)',
            }}
          >
            {dueCount} due
          </span>
        )}
      </div>

      <div style={{ flex: 1, marginTop: '12px' }}>
        {dueCount === 0 ? (
          <EmptyState
            icon="✓"
            title="All caught up!"
            titleZh="复习已全部完成"
            description={totalReviewWords > 0 ? `${totalReviewWords} words in queue — check back later.` : 'Add words from Dictionary or LexiGraph to start reviewing.'}
            descriptionZh={totalReviewWords > 0 ? `复习队列共 ${totalReviewWords} 个单词，稍后再来。` : '在词典或词汇星图中添加单词开始复习。'}
            variant="empty"
            actions={[{ label: 'Explore LexiGraph / 探索星图', href: '/lexigraph' }]}
          />
        ) : (
          <>
            {/* Word preview chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {preview.map(r => (
                <Link
                  key={r.wordId}
                  href={`/word/${r.wordId}`}
                  style={{
                    padding: '4px 10px', borderRadius: '6px', textDecoration: 'none',
                    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                    color: '#38BDF8', fontSize: '12px', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {r.word}
                </Link>
              ))}
              {dueCount > 3 && (
                <span style={{ fontSize: '12px', color: 'rgba(155,191,202,0.4)', padding: '4px 6px' }}>
                  +{dueCount - 3} more
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link
                href="/memory"
                style={{
                  padding: '9px 18px', borderRadius: '7px', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34D399',
                }}
              >
                Start Review / 开始复习
              </Link>
              <Link
                href="/quiz"
                style={{
                  padding: '9px 18px', borderRadius: '7px', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6',
                }}
              >
                Quick Quiz / 快速练习
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(155,191,202,0.35)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Total: {totalReviewWords} in queue / 队列共 {totalReviewWords} 词</span>
        <Link href="/memory" style={{ color: 'rgba(56,189,248,0.5)', textDecoration: 'none' }}>View all →</Link>
      </div>
    </div>
  )
}
