'use client'

import { useState } from 'react'

interface Props {
  onSearch: (query: string) => void
  isLoading: boolean
  notFound: boolean
  currentWord: string
}

export function LexiGraphSearch({ onSearch, isLoading, notFound, currentWord }: Props) {
  const [value, setValue] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim().toLowerCase())
    }
  }

  return (
    <div style={{ width: '280px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search a word… e.g. arrive"
          aria-label="Search word"
          style={{
            width: '100%',
            padding: '8px 32px 8px 12px',
            background: 'rgba(2,6,23,0.85)',
            border: `1px solid ${notFound ? 'rgba(248,113,113,0.55)' : 'rgba(56,189,248,0.3)'}`,
            borderRadius: '8px',
            color: '#ECFBFF',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            boxSizing: 'border-box',
            backdropFilter: 'blur(8px)',
          }}
        />
        {isLoading && (
          <span
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#38BDF8',
              fontSize: '13px',
              lineHeight: 1,
            }}
          >
            ⋯
          </span>
        )}
      </div>
      {notFound && !isLoading && (
        <div
          style={{
            marginTop: '5px',
            fontSize: '11px',
            color: '#F87171',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Not found / 未找到：{currentWord}
        </div>
      )}
    </div>
  )
}
