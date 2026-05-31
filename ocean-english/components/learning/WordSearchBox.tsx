'use client'

import { useState, useCallback } from 'react'

interface WordSearchBoxProps {
  onSearch: (query: string) => void
  placeholder?: string
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
          color: 'rgba(56,189,248,0.5)',
          fontSize: '16px',
          pointerEvents: 'none',
        }}
      >
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 44px 14px 44px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '10px',
          color: '#ECFBFF',
          fontSize: '15px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.7)')}
        onBlur={e => (e.target.style.borderColor = 'rgba(56,189,248,0.3)')}
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
            color: '#9BBFCA',
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
