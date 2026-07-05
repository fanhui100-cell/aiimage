'use client'

import { useState, useCallback } from 'react'

interface WordSearchBoxProps {
  onSearch: (query: string) => void
  placeholder?: string
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function WordSearchBox({ onSearch, placeholder = 'Search words... / 搜索单词...' }: WordSearchBoxProps) {
  const [value, setValue] = useState('')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
      onSearch(e.target.value)
    },
    [onSearch],
  )

  const handleClear = useCallback(() => {
    setValue('')
    onSearch('')
  }, [onSearch])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <span
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--teal-ink)',
          opacity: 0.5,
          pointerEvents: 'none',
          display: 'flex',
        }}
      >
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 44px 14px 44px',
          background: 'var(--card-2)',
          border: '1px solid var(--line-strong)',
          borderRadius: '10px',
          color: 'var(--ink)',
          fontSize: '15px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(14,140,122,0.55)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--ink-muted)',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            lineHeight: 1,
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
