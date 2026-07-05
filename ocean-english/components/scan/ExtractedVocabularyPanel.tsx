'use client'

import { useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import Link from 'next/link'
import type { ExtractedVocabulary } from '@/types/document'

interface ExtractedVocabularyPanelProps {
  vocabulary: ExtractedVocabulary[]
  onAddToReview: (word: ExtractedVocabulary) => void
  /** Word IDs already in the review queue (from persistent store). */
  alreadyInReview?: Set<string>
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'var(--teal-ink)',
  elementary: 'var(--blue-ink)',
  intermediate: 'var(--teal-ink)',
  advanced: '#8B5CF6',
  exam: '#b3261e',
}

function wordId(word: string): string {
  return word.toLowerCase().replace(/\s+/g, '-')
}

export function ExtractedVocabularyPanel({
  vocabulary,
  onAddToReview,
  alreadyInReview = new Set(),
}: ExtractedVocabularyPanelProps) {
  // F3-4：已入库词显示当前学习状态 chip（读 store）
  const storeWords = useLexiStore(st => st.words)
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
              background: 'rgba(14,140,122,0.08)',
              border: '1px solid rgba(14,140,122,0.35)',
              color: 'var(--teal-ink)',
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
          const color = DIFFICULTY_COLORS[v.difficulty ?? 'intermediate'] ?? 'var(--ink-sub)'

          // Button state: already in review > added this session > available
          let btnLabel: string
          let btnStyle: React.CSSProperties
          if (inReview && !added) {
            btnLabel = '✓ In Review'
            btnStyle = {
              background: 'rgba(155,191,202,0.06)',
              border: '1px solid var(--line)',
              color: 'var(--ink-muted)',
              cursor: 'default',
            }
          } else if (added || inReview) {
            btnLabel = '✓ Added'
            btnStyle = {
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              color: 'var(--teal-ink)',
              cursor: 'default',
            }
          } else {
            btnLabel = '+ Review'
            btnStyle = {
              background: 'rgba(59,91,217,0.08)',
              border: '1px solid rgba(56,189,248,0.3)',
              color: 'var(--blue-ink)',
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
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/dictionary?word=${wordId(v.word)}`}
                    style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}
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
                    <span style={{ fontSize: '10px', color: 'rgba(179,120,31,0.55)' }}>★ recommended</span>
                  )}
                  {/* F3-4：已入库词显示当前学习状态 chip（统一状态色语言） */}
                  {(() => {
                    const entry = storeWords.find(w => w.id === wordId(v.word))
                    if (!entry || entry.state === 'unknown' || entry.state === 'locked') return null
                    const m = STATE_META[entry.state as WordState]
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '10px', padding: '1px 7px', borderRadius: 99, background: `${m.light}14`, color: m.light, border: `1px solid ${m.light}40`, fontWeight: 700 }}>
                        <i style={{ width: 5, height: 5, borderRadius: 99, background: m.light }} />{m.zh}
                      </span>
                    )
                  })()}
                </div>
                {v.meaningZh && (
                  <div style={{ fontSize: '12px', color: 'var(--teal-ink)', marginBottom: '2px' }}>{v.meaningZh}</div>
                )}
                {v.definitionEn && (
                  <div style={{ fontSize: '12px', color: 'var(--ink-sub)', marginBottom: '2px' }}>{v.definitionEn}</div>
                )}
                {v.context && (
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
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
