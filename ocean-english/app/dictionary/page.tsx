'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { WordSearchBox } from '@/components/learning/WordSearchBox'
import { WordCard } from '@/components/learning/WordCard'
import { mockWords } from '@/data/mock-words'
import type { Word } from '@/types/word'

const levelOptions = [
  { value: '', label: 'All Levels / 全部等级' },
  { value: 'beginner', label: 'Beginner / 入门' },
  { value: 'elementary', label: 'Elementary / 新手' },
  { value: 'intermediate', label: 'Intermediate / 熟练' },
  { value: 'advanced', label: 'Advanced / 进阶' },
  { value: 'exam-prep', label: 'Exam Prep / 备考' },
]

const difficultyOptions = [
  { value: '', label: 'All Difficulty / 全部难度' },
  { value: '1', label: 'L1 — Beginner' },
  { value: '2', label: 'L2 — Elementary' },
  { value: '3', label: 'L3 — Intermediate' },
  { value: '4', label: 'L4 — Advanced' },
  { value: '5', label: 'L5 — Expert' },
]

export default function DictionaryPage() {
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')

  const filtered = useMemo(() => {
    return mockWords.filter((w: Word) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        w.word.toLowerCase().includes(q) ||
        w.definitions.some(
          d => d.meaningZh.includes(q) || d.meaning.toLowerCase().includes(q),
        )
      const matchesLevel = !levelFilter || w.level === levelFilter
      const matchesDiff = !diffFilter || w.difficulty === parseInt(diffFilter)
      return matchesQuery && matchesLevel && matchesDiff
    })
  }, [query, levelFilter, diffFilter])

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(155,191,202,0.25)',
    borderRadius: '8px',
    color: '#9BBFCA',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Header */}
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Vocabulary Roots{' '}
            <span style={{ fontSize: '18px', color: '#9BBFCA' }}>词汇根系</span>
          </h1>
          <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px' }}>
            {mockWords.length} words — Search, filter, and build your vocabulary.
            <span style={{ marginLeft: '8px', color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
              搜索、过滤，构建你的词汇根系。
            </span>
          </p>

          {/* Search + filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '240px' }}>
              <WordSearchBox onSearch={setQuery} />
            </div>
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              style={selectStyle}
            >
              {levelOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#020617' }}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={diffFilter}
              onChange={e => setDiffFilter(e.target.value)}
              style={selectStyle}
            >
              {difficultyOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#020617' }}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(155,191,202,0.5)',
              marginBottom: '16px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} / {filtered.length} 个结果
          </div>

          {/* Word list */}
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                color: 'rgba(155,191,202,0.4)',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '14px',
              }}
            >
              No words found for &quot;{query}&quot; / 未找到相关单词
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
              }}
            >
              {filtered.map(w => (
                <WordCard key={w.id} word={w} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
