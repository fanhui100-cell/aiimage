'use client'
// WordsScreen — 1:1 port of prototype/screen-words.jsx
// Global search + my words library

import { useState, useMemo } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, STATE_ORDER, type WordState } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'
import { useNavigate } from '@/hooks/useNavigate'
import { StateChip, SoundBtn, Eyebrow } from '@/components/screens/SharedUI'

const FILTERS: Array<{ id: WordState | 'all'; zh: string }> = [
  { id: 'all',       zh: '全部' },
  { id: 'learning',  zh: '学习中' },
  { id: 'review',    zh: '待复习' },
  { id: 'weak',      zh: '薄弱' },
  { id: 'mastered',  zh: '已掌握' },
]

// ── WordRow ────────────────────────────────────────────────────
function WordRow({ entry }: { entry: WordEntry }) {
  const [open, setOpen] = useState(false)
  const m = STATE_META[entry.state]
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        padding: '14px 18px', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
      className="card-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{entry.word}</span>
            {entry.pos && <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{entry.pos}</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 2 }}>{entry.zh}</div>
        </div>
        <StateChip state={entry.state} size="xs" />
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {entry.phon && <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{entry.phon}</span>}
            <SoundBtn word={entry.word} size={24} />
          </div>
          {entry.ex && (
            <div style={{ fontSize: 13, color: 'var(--ink-sub)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 4 }}>"{entry.ex}"</div>
          )}
          {entry.exZh && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 8 }}>{entry.exZh}</div>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {entry.syn?.slice(0, 4).map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'var(--teal-bg)', color: 'var(--teal-ink)' }}>{s}</span>
            ))}
            {entry.ant?.slice(0, 2).map(a => (
              <span key={a} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(212,71,126,0.1)', color: '#d4477e' }}>{a}</span>
            ))}
          </div>
          {entry.examTags && entry.examTags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {entry.examTags.map(t => (
                <span key={t} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--card-2)', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ── WordsScreen ────────────────────────────────────────────────
export function WordsScreen() {
  const navigate = useNavigate()
  const { all, byState, getWeak, addToReview } = useLexiStore()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<WordState | 'all'>('all')

  const allWords = useMemo(() => all(), [])

  const displayed = useMemo(() => {
    let words = filter === 'all' ? allWords : allWords.filter(w => w.state === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      words = words.filter(w => w.word.toLowerCase().includes(q) || w.zh.includes(q))
    }
    return words
  }, [allWords, filter, query])

  const weakWords = useMemo(() => getWeak(), [])

  function refluxWeak() {
    weakWords.forEach(w => addToReview(w.id))
    navigate('review')
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Eyebrow>词库</Eyebrow>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>我的词汇</h1>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索单词或中文..."
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as WordState | 'all')}
              className="btn-press"
              style={{ padding: '6px 14px', borderRadius: 99, border: `1.5px solid ${filter === f.id ? 'var(--teal-ink)' : 'var(--line)'}`, background: filter === f.id ? 'var(--teal-bg)' : 'var(--card)', color: filter === f.id ? 'var(--teal-ink)' : 'var(--ink-sub)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
              {f.zh}
              {f.id !== 'all' && ` · ${allWords.filter(w => w.state === f.id).length}`}
            </button>
          ))}
        </div>

        {/* Weak batch action */}
        {filter === 'weak' && weakWords.length > 0 && (
          <button onClick={refluxWeak} className="btn-press"
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 18px', borderRadius: 12, border: '1.5px solid #d4477e', background: 'rgba(212,71,126,0.07)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#d4477e', fontFamily: 'var(--font-sans)', marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.48"/></svg>
            全部加入复习（{weakWords.length} 词）
          </button>
        )}

        {/* Word list */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          {displayed.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
              {query ? '未找到匹配词汇' : '暂无词汇'}
            </div>
          ) : (
            displayed.map(w => <WordRow key={w.id} entry={w} />)
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
          共 {displayed.length} 词
        </div>
      </div>
    </div>
  )
}
