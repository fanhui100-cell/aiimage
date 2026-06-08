'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { useLearningStore } from '@/store/learningStore'
import { SparkBurst, type SparkBurstHandle } from '@/components/ui/motion/SparkBurst'

interface SaveWordButtonProps {
  wordId: string
  word: string
  compact?: boolean
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--gold-ink)' : 'none'}
      stroke={filled ? 'var(--gold-ink)' : 'currentColor'}
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function SaveWordButton({ wordId, word, compact = false }: SaveWordButtonProps) {
  const { isWordSaved, saveWord, unsaveWord, addToReview } = useLearningStore()
  const saved = isWordSaved(wordId)
  const sparkRef = useRef<SparkBurstHandle>(null)

  function handleSave() {
    if (saved) {
      unsaveWord(wordId)
    } else {
      saveWord(wordId)
      addToReview(wordId, word)
      sparkRef.current?.fire()
      toast.success('已加入复习 · +10★')
    }
  }

  if (compact) {
    return (
      <SparkBurst ref={sparkRef}>
        <button
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: saved ? 'rgba(179,120,31,0.12)' : 'var(--card)',
            border: `1px solid ${saved ? 'rgba(179,120,31,0.4)' : 'var(--line-strong)'}`,
            borderRadius: '6px',
            padding: '6px 12px',
            color: saved ? 'var(--gold-ink)' : 'var(--ink-sub)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <StarIcon filled={saved} />
          {saved ? 'Saved' : 'Save'}
        </button>
      </SparkBurst>
    )
  }

  return (
    <SparkBurst ref={sparkRef}>
      <button
        onClick={handleSave}
        style={{
          padding: '10px 24px',
          borderRadius: '8px',
          background: saved ? 'rgba(179,120,31,0.1)' : 'rgba(14,140,122,0.08)',
          border: `1px solid ${saved ? 'rgba(179,120,31,0.4)' : 'rgba(14,140,122,0.3)'}`,
          color: saved ? 'var(--gold-ink)' : 'var(--teal-ink)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <StarIcon filled={saved} />
        <span>{saved ? 'Saved / 已收藏' : 'Save Word / 收藏单词'}</span>
      </button>
    </SparkBurst>
  )
}
