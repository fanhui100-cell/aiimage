'use client'

import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'
import type { Word } from '@/types/word'

const difficultyColors: Record<number, string> = {
  1: '#34D399',
  2: '#60A5FA',
  3: '#FBBF24',
  4: '#F97316',
  5: '#EF4444',
}

interface WordCardProps {
  word: Word
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
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(155,191,202,0.15)',
        borderRadius: '10px',
        padding: '16px 20px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(56,189,248,0.4)'
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(56,189,248,0.04)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(155,191,202,0.15)'
        ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#ECFBFF' }}>{word.word}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: `${difficultyColors[word.difficulty]}20`,
                color: difficultyColors[word.difficulty],
                border: `1px solid ${difficultyColors[word.difficulty]}50`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {['', 'L1', 'L2', 'L3', 'L4', 'L5'][word.difficulty]}
            </span>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(126,249,255,0.7)',
              fontFamily: 'var(--font-mono)',
              marginBottom: '6px',
            }}
          >
            {word.phonetic}
          </div>
          <div style={{ fontSize: '13px', color: '#9BBFCA' }}>
            {word.definitions[0]?.meaningZh}
          </div>
        </div>
        <button
          onClick={toggleSave}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            color: saved ? '#FBBF24' : 'rgba(155,191,202,0.4)',
            transition: 'color 0.2s',
          }}
          aria-label={saved ? 'Remove from saved' : 'Save word'}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
        {word.examFrequency.slice(0, 3).map(exam => (
          <span
            key={exam}
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '3px',
              background: 'rgba(56,189,248,0.08)',
              color: 'rgba(56,189,248,0.6)',
              border: '1px solid rgba(56,189,248,0.2)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {exam}
          </span>
        ))}
      </div>
    </Link>
  )
}
