'use client'
// KnowledgeScreen — 1:1 port of prototype/screen-me.jsx (KnowledgeScreen section)
// Standalone knowledge vault at /knowledge

import { useState, useMemo } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { StateChip, SoundBtn, Eyebrow } from '@/components/screens/SharedUI'

function VaultTab({ words, emptyText }: { words: WordEntry[]; emptyText: string }) {
  if (!words.length) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
        {emptyText}
      </div>
    )
  }
  return (
    <div>
      {words.map(w => (
        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{w.word}</span>
              <SoundBtn word={w.word} size={22} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>{w.zh}</div>
            {w.ex && <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.5 }}>"{w.ex}"</div>}
          </div>
          <StateChip state={w.state} size="xs" />
        </div>
      ))}
    </div>
  )
}

export function KnowledgeScreen() {
  const navigate = useNavigate()
  const { getWeak, byState, counts, addToReview } = useLexiStore()

  const [tab, setTab] = useState<'weak' | 'saved' | 'notes'>('weak')

  const weakWords = useMemo(() => getWeak(), [])
  const savedWords = useMemo(() => byState('mastered').slice(0, 30), [])
  const wordCounts = useMemo(() => counts(), [])

  function reflux() {
    weakWords.forEach(w => addToReview(w.id))
    navigate('review')
  }

  const TABS = [
    { id: 'weak',  zh: '薄弱词',  count: weakWords.length,      words: weakWords },
    { id: 'saved', zh: '已掌握',  count: savedWords.length,      words: savedWords },
    { id: 'notes', zh: '笔记',    count: 0,                      words: [] as WordEntry[] },
  ] as const

  const tabWords = TABS.find(t => t.id === tab)?.words ?? []

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Eyebrow>知识宝库</Eyebrow>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>词库宝箱</h1>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: '薄弱词', val: wordCounts.weak ?? 0, color: '#d4477e' },
            { label: '已掌握', val: wordCounts.mastered ?? 0, color: '#0e8c7a' },
            { label: '学习中', val: wordCounts.learning ?? 0, color: '#3b5bd9' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', borderRadius: 14, padding: '16px 12px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-news)', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Vault */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as 'weak' | 'saved' | 'notes')}
                style={{ flex: 1, padding: '12px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.id ? 'var(--teal-ink)' : 'var(--ink-muted)', borderBottom: `2px solid ${tab === t.id ? 'var(--teal-ink)' : 'transparent'}`, transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
                {t.zh}
                <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--ink-muted)' }}>({t.count})</span>
              </button>
            ))}
          </div>

          <VaultTab
            words={tabWords as WordEntry[]}
            emptyText={tab === 'weak' ? '🌟 暂无薄弱词，继续保持！' : tab === 'saved' ? '💝 暂无已掌握词汇' : '📝 暂无笔记'}
          />
        </div>

        {tab === 'weak' && weakWords.length > 0 && (
          <button onClick={reflux} className="btn-press"
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '14px 20px', borderRadius: 14, border: '1.5px solid #d4477e', background: 'rgba(212,71,126,0.07)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#d4477e', fontFamily: 'var(--font-sans)', marginTop: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.48"/></svg>
            全部加入复习（{weakWords.length} 词）
          </button>
        )}
      </div>
    </div>
  )
}
