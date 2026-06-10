'use client'
// MeScreen (Profile) — 1:1 port of prototype/screen-me.jsx
// Stats + mastery bar + LexiVault 3 tabs

import { useState, useMemo } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META } from '@/lib/state-meta'
import { useNavigate } from '@/hooks/useNavigate'
import { ProgressRing, StateChip, SoundBtn, Eyebrow } from '@/components/screens/SharedUI'

// ── VaultTab ───────────────────────────────────────────────────
function VaultTab({ words, emptyText }: { words: WordEntry[]; emptyText: string }) {
  if (!words.length) {
    return (
      <div style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
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
          </div>
          <StateChip state={w.state} size="xs" />
        </div>
      ))}
    </div>
  )
}

// ── MeScreen ───────────────────────────────────────────────────
export function MeScreen() {
  const navigate = useNavigate()
  const { streakData, xp, masteredPct, byState, getWeak, counts, addToReview, profile, bandCefr, user } = useLexiStore()
  const streak = streakData.current

  const [tab, setTab] = useState<'weak' | 'saved' | 'notes'>('weak')

  const wordCounts = useMemo(() => counts(), [])
  const pct = useMemo(() => masteredPct(), [])
  const weakWords = useMemo(() => getWeak(), [])
  const cefr = bandCefr(profile.band)

  function reflux() {
    weakWords.forEach(w => addToReview(w.id))
    navigate('review')
  }

  const TABS = [
    { id: 'weak',  zh: '薄弱词', words: weakWords },
    { id: 'saved', zh: '收藏', words: byState('mastered').slice(0, 20) },
    { id: 'notes', zh: '笔记', words: [] as WordEntry[] },
  ] as const

  const tabWords = TABS.find(t => t.id === tab)?.words ?? []

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #3b5bd9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {(user.name || 'L')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>{user.name || '词渊学员'}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 99, background: 'var(--teal-bg)', color: 'var(--teal-ink)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cefr}</span>
              {profile.targetExam && (
                <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 99, background: 'var(--card-2)', color: 'var(--ink-sub)', fontWeight: 600 }}>{profile.targetExam}</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: '连续打卡', val: streak, unit: '天', icon: '🔥', color: '#d2792f' },
            { label: '总经验值', val: xp, unit: 'XP', icon: '⚡', color: '#3b5bd9' },
            { label: '已掌握', val: wordCounts.mastered ?? 0, unit: '词', icon: '🏆', color: '#0e8c7a' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 14px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-news)', lineHeight: 1.1, marginTop: 6 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mastery bar */}
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>词汇掌握率</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--teal-ink)', fontFamily: 'var(--font-news)' }}>{pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--teal), #34d8c0)', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {(['learning', 'review', 'weak', 'mastered'] as const).map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: STATE_META[s].light }}>{wordCounts[s] ?? 0}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{STATE_META[s].zh}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LexiVault */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>词库宝箱</span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as 'weak' | 'saved' | 'notes')}
                style={{ flex: 1, padding: '10px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tab === t.id ? 'var(--teal-ink)' : 'var(--ink-muted)', borderBottom: `2px solid ${tab === t.id ? 'var(--teal-ink)' : 'transparent'}`, transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
                {t.zh}
                {t.id !== 'notes' && <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--ink-muted)' }}>({t.words.length})</span>}
              </button>
            ))}
          </div>

          <VaultTab
            words={tabWords as WordEntry[]}
            emptyText={tab === 'weak' ? '🌟 暂无薄弱词' : tab === 'saved' ? '💝 暂无收藏' : '📝 暂无笔记'}
          />
        </div>

        {/* Action buttons */}
        {tab === 'weak' && weakWords.length > 0 && (
          <button onClick={reflux} className="btn-press"
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '14px 20px', borderRadius: 14, border: '1.5px solid #d4477e', background: 'rgba(212,71,126,0.07)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#d4477e', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.48"/></svg>
            全部加入复习（{weakWords.length} 词）
          </button>
        )}

        <button onClick={() => navigate('onboarding')} className="btn-press"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '14px 20px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 14, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          重新测试词汇基线
        </button>
      </div>
    </div>
  )
}
