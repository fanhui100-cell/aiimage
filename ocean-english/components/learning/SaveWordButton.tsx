'use client'

import { useLearningStore } from '@/store/learningStore'

interface SaveWordButtonProps {
  wordId: string
  word: string
  compact?: boolean
}

export function SaveWordButton({ wordId, word, compact = false }: SaveWordButtonProps) {
  const { isWordSaved, saveWord, unsaveWord, addToReview } = useLearningStore()
  const saved = isWordSaved(wordId)

  function handleSave() {
    if (saved) {
      unsaveWord(wordId)
    } else {
      saveWord(wordId)
      addToReview(wordId, word)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleSave}
        style={{
          background: saved ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${saved ? 'rgba(251,191,36,0.5)' : 'rgba(155,191,202,0.25)'}`,
          borderRadius: '6px',
          padding: '6px 12px',
          color: saved ? '#FBBF24' : '#9BBFCA',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {saved ? '★ Saved' : '☆ Save'}
      </button>
    )
  }

  return (
    <button
      onClick={handleSave}
      style={{
        padding: '10px 24px',
        borderRadius: '8px',
        background: saved ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.1)',
        border: `1px solid ${saved ? 'rgba(251,191,36,0.5)' : 'rgba(56,189,248,0.4)'}`,
        color: saved ? '#FBBF24' : '#38BDF8',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>{saved ? '★' : '☆'}</span>
      <span>{saved ? 'Saved / 已收藏' : 'Save Word / 收藏单词'}</span>
    </button>
  )
}
