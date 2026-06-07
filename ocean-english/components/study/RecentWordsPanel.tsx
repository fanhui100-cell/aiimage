'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import type { LexiStarLedgerEntry } from '@/lib/motivation/motivation-types'

interface Props {
  ledger: LexiStarLedgerEntry[]
  savedWords: string[]
}

function getRecentWords(ledger: LexiStarLedgerEntry[], savedWords: string[]): string[] {
  // Extract words from ledger (newest first, deduplicated)
  const seen = new Set<string>()
  const words: string[] = []
  for (const entry of [...ledger].reverse()) {
    if (entry.word && !seen.has(entry.word) && words.length < 5) {
      seen.add(entry.word)
      words.push(entry.word)
    }
  }
  // Fill with savedWords if needed
  if (words.length < 5) {
    for (const w of [...savedWords].reverse()) {
      if (!seen.has(w) && words.length < 5) {
        seen.add(w)
        words.push(w)
      }
    }
  }
  return words
}

export function RecentWordsPanel({ ledger, savedWords }: Props) {
  const recentWords = getRecentWords(ledger, savedWords)

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <SectionHeader label="RECENT WORDS" labelZh="最近学习" style={{ marginTop: 0, marginBottom: '12px' }} />

      {recentWords.length === 0 ? (
        <EmptyState
          icon="📖"
          title="No words yet"
          titleZh="暂无学习记录"
          description="Words you study will appear here."
          descriptionZh="你学习过的单词将显示在这里。"
          variant="empty"
          actions={[{ label: 'Open Dictionary', href: '/dictionary' }]}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {recentWords.map(word => (
            <div
              key={word}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '7px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(155,191,202,0.08)',
              }}
            >
              <Link
                href={`/word/${word}`}
                style={{ fontSize: '14px', fontWeight: 600, color: '#ECFBFF', textDecoration: 'none' }}
              >
                {word}
              </Link>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href={`/word/${word}`} style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)', textDecoration: 'none' }}>
                  Detail
                </Link>
                <Link href={`/lexigraph?word=${word}`} style={{ fontSize: '11px', color: 'rgba(126,249,255,0.5)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                  ✦
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <Link href="/memory" style={{ fontSize: '12px', color: 'rgba(56,189,248,0.5)', textDecoration: 'none' }}>
          View all saved words →
        </Link>
      </div>
    </div>
  )
}
