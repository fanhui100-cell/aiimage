'use client'

import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'
import type { Word } from '@/types/word'

interface WordCardProps {
  word: Word
}

/* 线性收藏星 SVG — 选中金色,未选中弱色 */
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
  const { isWordSaved, saveWord, unsaveWord } = useLearningStore()
  const saved = isWordSaved(word.id)

  function toggleSave(e: React.MouseEvent) {
    e.preventDefault()
    saved ? unsaveWord(word.id) : saveWord(word.id)
  }

  return (
    <Link
      href={`/word/${word.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        padding: '20px 22px',
        boxShadow: 'var(--card-shadow-sm)',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'rgba(14,140,122,0.4)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = 'var(--line)'
        el.style.transform = ''
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
        <button
          onClick={toggleSave}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0, marginLeft: '8px' }}
          aria-label={saved ? '取消收藏' : '收藏单词'}
        >
          <StarIcon filled={saved} />
        </button>
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
