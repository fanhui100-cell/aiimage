'use client'
/* ============================================================================
   WeeklyReportCard — F6-B3 周报（成就感）
   上周（周一-周日）纯前端聚合 history + quizHistory：学/复/正确率/
   最薄弱 3 词（点击直达）/比上上周 ±%。深海分享卡规格，可导出 PNG。
   ============================================================================ */

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { toPng } from 'html-to-image'
import { useLexiStore } from '@/store/lexiStore'

const DAY = 86_400_000
const dstr = (t: number) => new Date(t).toISOString().slice(0, 10)

function weekRange(offsetWeeks: number): [number, number] {
  const now = new Date()
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - offsetWeeks * 7)
  return [monday.getTime(), monday.getTime() + 7 * DAY]
}

export function WeeklyReportCard() {
  const history = useLexiStore(s => s.history)
  const quizHistory = useLexiStore(s => s.quizHistory)
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const report = useMemo(() => {
    const agg = (off: number) => {
      const [a, b] = weekRange(off)
      let learned = 0, reviewed = 0
      for (let t = a; t < b; t += DAY) {
        const h = history[dstr(t)]
        if (h) { learned += h.learned; reviewed += h.reviewed }
      }
      const sessions = quizHistory.filter(q => (q.completedAt ?? 0) >= a && (q.completedAt ?? 0) < b)
      const total = sessions.reduce((x, q) => x + q.total, 0)
      const correct = sessions.reduce((x, q) => x + q.score, 0)
      // 周内错词聚合（最薄弱 top3）
      const wrongCount = new Map<string, { word: string; n: number }>()
      for (const sess of sessions) {
        for (const at of sess.attempts) {
          if (at.correct) continue
          const cur = wrongCount.get(at.wordId) ?? { word: at.word, n: 0 }
          cur.n++
          wrongCount.set(at.wordId, cur)
        }
      }
      const weakest = [...wrongCount.entries()].sort((x, y) => y[1].n - x[1].n).slice(0, 3)
        .map(([id, v]) => ({ id, word: v.word, n: v.n }))
      return { learned, reviewed, total, correct, weakest, activity: learned + reviewed + total }
    }
    const last = agg(1)        // 上周
    const prev = agg(2)        // 上上周
    const delta = prev.activity > 0
      ? Math.round((last.activity - prev.activity) / prev.activity * 100)
      : null
    const [a] = weekRange(1)
    return { ...last, delta, label: `${dstr(a)} ~ ${dstr(a + 6 * DAY)}` }
  }, [history, quizHistory])

  if (report.activity === 0) return null   // 上周无活动不渲染（空状态不打扰）

  const accuracy = report.total > 0 ? Math.round(report.correct / report.total * 100) : null

  async function save() {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2 })
      const aEl = document.createElement('a')
      aEl.href = url
      aEl.download = `lexiocean-weekly-${report.label.slice(0, 10)}.png`
      aEl.click()
    } catch { /* noop */ } finally { setSaving(false) }
  }

  return (
    <div ref={cardRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'linear-gradient(160deg, #0a1722 0%, #0e2230 60%, #123042 100%)', border: '1px solid rgba(79,230,206,0.14)', padding: '20px 22px', color: '#eaf3f6' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', color: 'rgba(79,230,206,0.8)', textTransform: 'uppercase' }}>本周报告 · Weekly</div>
          <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.5)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{report.label}</div>
        </div>
        {report.delta != null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: report.delta >= 0 ? '#4fe6ce' : '#ff9e4d', background: 'rgba(255,255,255,0.06)', borderRadius: 99, padding: '3px 10px' }}>
            比上周 {report.delta >= 0 ? '+' : ''}{report.delta}%
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {([['学了', report.learned, '词'], ['复习', report.reviewed, '次'], ['正确率', accuracy ?? '—', accuracy != null ? '%' : '']] as const).map(([k, v, u]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: '#4fe6ce' }}>{v}<small style={{ fontSize: 11, color: 'rgba(234,243,246,0.5)' }}>{u}</small></div>
            <div style={{ fontSize: 10.5, color: 'rgba(234,243,246,0.55)', marginTop: 2 }}>{k}</div>
          </div>
        ))}
      </div>
      {report.weakest.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.5)', marginBottom: 6 }}>上周最薄弱（点击直达）</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {report.weakest.map(w => (
              <Link key={w.id} href={`/word/${encodeURIComponent(w.id)}`}
                style={{ fontSize: 12.5, fontWeight: 600, color: '#ff6b9d', background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.3)', borderRadius: 99, padding: '4px 12px', textDecoration: 'none' }}>
                {w.word} ×{w.n}
              </Link>
            ))}
          </div>
        </div>
      )}
      <button onClick={save} disabled={saving} className="btn-press"
        style={{ fontSize: 11.5, color: 'rgba(234,243,246,0.6)', background: 'none', border: '1px solid rgba(234,243,246,0.2)', borderRadius: 99, padding: '5px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        {saving ? '导出中…' : '导出图片 ↓'}
      </button>
    </div>
  )
}
