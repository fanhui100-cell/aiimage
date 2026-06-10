'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useLearningStore } from '@/store/learningStore'
import { useLexiStore } from '@/store/lexiStore'
import { SparkBurst, type SparkBurstHandle } from '@/components/ui/motion/SparkBurst'
import type { Word } from '@/types/word'

interface WordCardProps {
  word: Word
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={filled ? 'var(--gold-ink)' : 'var(--ink-muted)'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function WordCard({ word }: WordCardProps) {
  const { isWordSaved, saveWord, unsaveWord, addToReview } = useLearningStore()
  const setSaved = useLexiStore(s => s.setSaved)
  const saved = isWordSaved(word.id)
  const sparkRef = useRef<SparkBurstHandle>(null)

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (saved) {
      unsaveWord(word.id)
      setSaved(word.id, false)
    } else {
      saveWord(word.id)
      addToReview(word.id, word.word)
      setSaved(word.id, true, word.word)
      sparkRef.current?.fire()
      toast.success('已加入复习 · +10★')
    }
  }

  return (
    <Link
      href={`/word/${word.id}`}
      className="card-hover"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        padding: '20px 22px',
        boxShadow: 'var(--card-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 词 */}
          <div style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', color: 'var(--ink)', lineHeight: 1.2 }}>
            {word.word}
          </div>
          {/* 音标 */}
          {word.phonetic && (
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--teal-ink)', marginTop: '8px' }}>
              {word.phonetic}
            </div>
          )}
          {/* 释义 */}
          <div style={{ fontSize: '14px', color: 'var(--ink-sub)', marginTop: '6px', lineHeight: 1.5 }}>
            {word.definitions[0]?.meaningZh}
          </div>
        </div>
        {/* 收藏按钮 */}
        <SparkBurst ref={sparkRef} style={{ marginLeft: '8px', flexShrink: 0 }}>
          <button
            onClick={toggleSave}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            aria-label={saved ? '取消收藏' : '收藏单词'}
          >
            <StarIcon filled={saved} />
          </button>
        </SparkBurst>
      </div>

      {/* 考试标签 */}
      {word.examFrequency && word.examFrequency.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {word.examFrequency.slice(0, 3).map(exam => (
            <span
              key={exam}
              style={{
                fontSize: '11px',
                padding: '3px 9px',
                borderRadius: '9px',
                background: 'var(--card-2)',
                color: 'var(--ink-sub)',
                border: '1px solid var(--line-strong)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {exam}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
