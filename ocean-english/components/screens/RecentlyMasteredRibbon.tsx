'use client'

/* 界面优化2·P7：最近掌握词跑马灯（米白面）。
   从 store 取 state='mastered' 的词，按 lastReviewedAt 倒序取前若干；
   不足 6 个则不渲染（避免稀疏空跑马灯）。chip 自带米白令牌，Marquee 容器不染色。 */

import { useLexiStore } from '@/store/lexiStore'
import { Marquee } from '@/components/ui/motion/Marquee'

export function RecentlyMasteredRibbon() {
  const words = useLexiStore(s => s.words)
  const mastered = words
    .filter(w => w.state === 'mastered')
    .sort((a, b) => (b.lastReviewedAt ?? b.addedAt ?? 0) - (a.lastReviewedAt ?? a.addedAt ?? 0))
    .slice(0, 16)
  if (mastered.length < 6) return null

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Recently Mastered</span>
        <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>最近掌握 · {mastered.length} 词</span>
      </div>
      <Marquee speed={28}>
        {mastered.map(w => (
          <span key={w.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 'var(--r-pill)', background: 'var(--card)', border: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--teal-ink)', fontSize: 12 }}>✓</span>
            <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{w.word}</b>
            {w.zh && <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>{w.zh}</span>}
          </span>
        ))}
      </Marquee>
    </div>
  )
}
