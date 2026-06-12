'use client'
// DailyRecapCard — 今日小结分享卡（B3-2）
// 固定 360×640（9:16），深海渐变底（复用 ContinueCard 的 bg），
// 数据全部来自 daily + streakData + quizHistory 当日切片，html-to-image 导出 PNG。

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { useLexiStore } from '@/store/lexiStore'

const DAY = 86_400_000
const dstr = (t: number) => new Date(t).toISOString().slice(0, 10)

export function DailyRecapCard() {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  const daily = useLexiStore(s => s.daily)
  const history = useLexiStore(s => s.history)
  const streakData = useLexiStore(s => s.streakData)
  const quizHistory = useLexiStore(s => s.quizHistory)
  const log = useLexiStore(s => s.log)

  const today = dstr(Date.now())
  const learned = daily.date === today ? daily.learned : 0
  const reviewed = daily.date === today ? daily.reviewed : 0

  // 正确率 = 今日测验切片；无数据显示 —
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  const sessions = quizHistory.filter(q => (q.completedAt ?? 0) >= todayStart)
  const total = sessions.reduce((a, q) => a + q.total, 0)
  const correct = sessions.reduce((a, q) => a + q.score, 0)
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : null

  // 本周 7 格（周一起）：history 或今天的 daily 有活动即点亮
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = dstr(monday.getTime() + i * DAY)
    const h = history[d]
    const active = d === today
      ? learned + (daily.quizzed ?? 0) + reviewed > 0
      : !!h && h.learned + h.quizzed + h.reviewed > 0
    return { date: d, active, future: monday.getTime() + i * DAY > Date.now() }
  })

  const dateLabel = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
  // F5：今日写入知识库条数（log 今日去重词数 — 与知识库 feed 同口径）
  const vaultToday = new Set(log.filter(e => e.t >= todayStart).map(e => e.id)).size

  async function save() {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.href = url
      a.download = `lexiocean-recap-${today}.png`
      a.click()
    } catch {
      // 导出失败（跨域字体等）：静默，不阻塞页面
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        ref={cardRef}
        style={{
          width: 360, height: 640, flexShrink: 0,
          borderRadius: 24, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(160deg, #0a1722 0%, #0e2230 60%, #123042 100%)',
          border: '1px solid rgba(79,230,206,0.14)',
          color: '#eaf3f6', padding: '36px 30px',
          display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Demo08：光斑 20s 漂移 */}
        <div className="drift-a" style={{ position: 'absolute', top: -90, right: -70, width: 280, height: 280, borderRadius: 999, background: 'radial-gradient(circle, rgba(79,230,206,0.2), transparent 70%)', pointerEvents: 'none' }} />

        {/* Eyebrow */}
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(79,230,206,0.8)' }}>
          {dateLabel} · 第 {Math.max(1, streakData.current)} 天 · 词渊
        </p>
        <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 30, lineHeight: 1.4 }}>
          今日航行小结
        </h2>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 44, flex: 1 }}>
          {[
            { label: '学了', n: `${learned}`, unit: '词' },
            { label: '复习', n: `${reviewed}`, unit: '词' },
            { label: '正确率', n: accuracy != null ? `${accuracy}` : '—', unit: accuracy != null ? '%' : '' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 14, color: 'rgba(234,243,246,0.6)', width: 52 }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 46, fontWeight: 700, color: '#4fe6ce', lineHeight: 1 }}>{s.n}</span>
              <span style={{ fontSize: 14, color: 'rgba(234,243,246,0.6)' }}>{s.unit}</span>
            </div>
          ))}
        </div>

        {/* 本周打卡条 + streak */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {week.map((d, i) => (
              <div key={d.date} title={d.date}
                style={{
                  flex: 1, height: 34, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  background: d.active ? 'rgba(79,230,206,0.22)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${d.active ? 'rgba(79,230,206,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  color: d.active ? '#4fe6ce' : 'rgba(234,243,246,0.35)',
                  opacity: d.future ? 0.4 : 1,
                }}>
                {'一二三四五六日'[i]}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1c879" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5C9 8 12 6 12 2z"/></svg>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: '#f1c879' }}>{streakData.current}</span>
              <span style={{ fontSize: 12, color: 'rgba(234,243,246,0.55)' }}>天连续</span>
              {vaultToday > 0 && (
                <span style={{ display: 'block', fontSize: 11.5, color: 'rgba(79,230,206,0.8)', marginTop: 6 }}>
                  今日已写入知识库 {vaultToday} 条
                </span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 12, color: 'rgba(234,243,246,0.45)' }}>
              LexiOcean · 万词成海，自有光
            </span>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-press"
        style={{ padding: '11px 26px', borderRadius: 999, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
        {saving ? '正在导出…' : '保存图片'}
      </button>
    </div>
  )
}
