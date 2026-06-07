'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ExtractedVocabulary } from '@/types/document'

interface ExtractedVocabularyPanelProps {
  vocabulary: ExtractedVocabulary[]
  onAddToReview: (word: ExtractedVocabulary) => void
  /** Word IDs already in the review queue (from persistent store). */
  alreadyInReview?: Set<string>
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#34D399',
  elementary: '#38BDF8',
  intermediate: '#7EF9FF',
  advanced: '#8B5CF6',
  exam: '#F97316',
}

function wordId(word: string): string {
  return word.toLowerCase().replace(/\s+/g, '-')
}

export function ExtractedVocabularyPanel({
  vocabulary,
  onAddToReview,
  alreadyInReview = new Set(),
}: ExtractedVocabularyPanelProps) {
  const [addedThisSession, setAddedThisSession] = useState<Set<string>>(new Set())

  function handleAdd(v: ExtractedVocabulary) {
    onAddToReview(v)
    setAddedThisSession(prev => new Set(prev).add(v.word))
  }

  function handleAddAll() {
    vocabulary
      .filter(v => v.shouldReview && !isAdded(v.word) && !isInReview(v.word))
      .forEach(v => handleAdd(v))
  }

  function isInReview(word: string): boolean {
    return alreadyInReview.has(wordId(word))
  }

  function isAdded(word: string): boolean {
    return addedThisSession.has(word)
  }

  const reviewable = vocabulary.filter(v => v.shouldReview && !isAdded(v.word) && !isInReview(v.word))

  if (vocabulary.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: 'rgba(56,189,248,0.6)',
          fontFamily: 'var(--font-mono)',
        }}>
          EXTRACTED VOCABULARY / 提取生词 ({vocabulary.length})
        </div>
        {reviewable.length > 0 && (
          <button
            onClick={handleAddAll}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.4)',
              color: '#34D399',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            + Add All Recommended / 加入全部推荐
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {vocabulary.map(v => {
          const inReview = isInReview(v.word)
          const added = isAdded(v.word)
          const color = DIFFICULTY_COLORS[v.difficulty ?? 'intermediate'] ?? '#9BBFCA'

          // Button state: already in review > added this session > available
          let btnLabel: string
          let btnStyle: React.CSSProperties
          if (inReview && !added) {
            btnLabel = '✓ In Review'
            btnStyle = {
              background: 'rgba(155,191,202,0.06)',
              border: '1px solid rgba(155,191,202,0.2)',
              color: 'rgba(155,191,202,0.45)',
              cursor: 'default',
            }
          } else if (added || inReview) {
            btnLabel = '✓ Added'
            btnStyle = {
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: '#34D399',
              cursor: 'default',
            }
          } else {
            btnLabel = '+ Review'
            btnStyle = {
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.3)',
              color: '#38BDF8',
              cursor: 'pointer',
            }
          }

          return (
            <div
              key={v.word}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(155,191,202,0.1)',
                borderRadius: '10px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/word/${wordId(v.word)}`}
                    style={{ fontSize: '15px', fontWeight: 700, color: '#ECFBFF', textDecoration: 'none' }}
                  >
                    {v.word}
                  </Link>
                  <Link
                    href={`/lexigraph?word=${wordId(v.word)}`}
                    title="Open in LexiGraph"
                    style={{ fontSize: '10px', color: 'rgba(126,249,255,0.55)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                  >
                    ✦
                  </Link>
                  {v.difficulty && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}40`,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {v.difficulty}
                    </span>
                  )}
                  {v.shouldReview && (
                    <span style={{ fontSize: '10px', color: 'rgba(255,215,106,0.6)' }}>★ recommended</span>
                  )}
                </div>
                {v.meaningZh && (
                  <div style={{ fontSize: '12px', color: '#7EF9FF', marginBottom: '2px' }}>{v.meaningZh}</div>
                )}
                {v.definitionEn && (
                  <div style={{ fontSize: '12px', color: '#9BBFCA', marginBottom: '2px' }}>{v.definitionEn}</div>
                )}
                {v.context && (
                  <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontStyle: 'italic' }}>
                    {v.context}
                  </div>
                )}
              </div>

              <button
                onClick={() => !inReview && !added && handleAdd(v)}
                disabled={inReview || added}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  ...btnStyle,
                }}
              >
                {btnLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
