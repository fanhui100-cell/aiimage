'use client'
// ReviewForecast — 未来 7 天复习量预测（B9-2）
// 第 i 根柱 = nextReviewAt 落在第 i 个自然日的词数；点击跳 /memory

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'

const DAY = 86_400_000
const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']

export function ReviewForecast() {
  const router = useRouter()
  const words = useLexiStore(s => s.words)

  const bars = useMemo(() => {
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    return Array.from({ length: 7 }, (_, i) => {
      const start = dayStart + i * DAY
      const end = start + DAY
      // 第 0 天（今天）包含已逾期的词：它们今天就要还
      const n = words.filter(w => w.nextReviewAt != null
        && (i === 0 ? w.nextReviewAt < end : w.nextReviewAt >= start && w.nextReviewAt < end)).length
      const d = new Date(start)
      return { n, label: i === 0 ? '今' : WEEKDAY[d.getDay()] }
    })
  }, [words])

  const max = Math.max(1, ...bars.map(b => b.n))

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>未来 7 天复习量</span>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>点击柱子去复习</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 72 }}>
        {bars.map((b, i) => (
          <button key={i} onClick={() => router.push('/memory')} title={`${b.n} 词`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: b.n > 0 ? 'var(--teal-ink)' : 'var(--ink-muted)' }}>{b.n}</span>
            <span style={{
              width: '100%', borderRadius: '4px 4px 2px 2px',
              height: `${Math.max(4, (b.n / max) * 44)}px`,
              background: i === 0 && b.n > 0 ? 'var(--teal-ink)' : 'rgba(14,140,122,0.35)',
              transition: 'height .3s ease',
            }} />
            <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
