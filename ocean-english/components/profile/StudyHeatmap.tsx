'use client'
// StudyHeatmap — 最近 12 周打卡热力图（B9-1）
// 色阶 = 当日学习量：0 / 1-5 / 6-15 / 16+ → paper-2 → teal 三档
// 数据：lexiStore.history（recordActivity 跨天归档）+ 今天的 daily

import { useMemo, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'

const DAY = 86_400_000
const dstr = (t: number) => new Date(t).toISOString().slice(0, 10)

function tierColor(n: number): string {
  if (n <= 0) return 'var(--card-2)'
  if (n <= 5) return 'rgba(14,140,122,0.3)'
  if (n <= 15) return 'rgba(14,140,122,0.6)'
  return 'var(--teal-ink)'
}

export function StudyHeatmap() {
  const history = useLexiStore(s => s.history)
  const daily = useLexiStore(s => s.daily)
  const [picked, setPicked] = useState<string | null>(null)

  const { weeks, today } = useMemo(() => {
    const today = dstr(Date.now())
    // 从本周一起回溯 12 周
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const start = monday.getTime() - 11 * 7 * DAY
    const weeks: { date: string; n: number; future: boolean }[][] = []
    for (let w = 0; w < 12; w++) {
      const col: { date: string; n: number; future: boolean }[] = []
      for (let d = 0; d < 7; d++) {
        const t = start + (w * 7 + d) * DAY
        const date = dstr(t)
        const rec = date === today && daily.date === today
          ? daily
          : history[date]
        const n = rec ? rec.learned + rec.quizzed + rec.reviewed : 0
        col.push({ date, n, future: t > Date.now() })
      }
      weeks.push(col)
    }
    return { weeks, today }
  }, [history, daily])

  const pickedRec = picked
    ? (picked === today && daily.date === today ? daily : history[picked])
    : null

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>学习打卡 · 12 周</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[0, 3, 10, 20].map(n => (
            <span key={n} style={{ width: 10, height: 10, borderRadius: 3, background: tierColor(n) }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 4, fontFamily: 'var(--font-mono)' }}>少 → 多</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'space-between' }}>
        {weeks.map((col, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {col.map(cell => (
              <button
                key={cell.date}
                onClick={() => setPicked(p => p === cell.date ? null : cell.date)}
                title={`${cell.date} · ${cell.n} 次学习`}
                style={{
                  aspectRatio: '1', width: '100%', borderRadius: 3, padding: 0,
                  border: picked === cell.date ? '1.5px solid var(--ink)' : 'none',
                  background: cell.future ? 'transparent' : tierColor(cell.n),
                  cursor: cell.future ? 'default' : 'pointer',
                }}
                disabled={cell.future}
              />
            ))}
          </div>
        ))}
      </div>
      {picked && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-sub)', fontFamily: 'var(--font-mono)' }}>
          {picked} · 学 {pickedRec?.learned ?? 0} · 练 {pickedRec?.quizzed ?? 0} · 复 {pickedRec?.reviewed ?? 0}
        </div>
      )}
    </div>
  )
}
