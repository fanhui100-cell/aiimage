'use client'
/* ============================================================================
   ShareScreen.tsx — D14 战绩分享卡 Share
   把真实学习战绩做成竖图卡（今日 / 词汇量 / 本周），换主题、切内容。
   「保存图片」走真实 canvas 绘制 → PNG 下载；「分享」走 Web Share API（带图回退保存）。
   全部数值来自 lexiStore + report/achievements 派生，绝不造假。
   ============================================================================ */

import { useRef, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import { buildVocabCard } from '@/lib/analytics/report'
import { buildAchievements } from '@/lib/analytics/achievements'
import { BorderBeam } from '@/components/ui/motion/BorderBeam'
import { Button } from '@/components/ui/Button'
import './screen-kit.css'
import './share.css'

interface Theme { id: string; bg: string; sw: string; stops: [string, string, string] }
const THEMES: Theme[] = [
  { id: 'ocean', bg: 'linear-gradient(165deg,#0e5f7a,#0a3a52 58%,#06212f)', sw: 'linear-gradient(150deg,#1583a0,#06212f)', stops: ['#0e5f7a', '#0a3a52', '#06212f'] },
  { id: 'teal', bg: 'linear-gradient(165deg,#1f9f8c,#0e6d5f 58%,#073d35)', sw: 'linear-gradient(150deg,#4fe6ce,#0e6d5f)', stops: ['#1f9f8c', '#0e6d5f', '#073d35'] },
  { id: 'dusk', bg: 'linear-gradient(165deg,#6d4bc4,#3a2a6e 58%,#1a1430)', sw: 'linear-gradient(150deg,#9b7ce0,#3a2a6e)', stops: ['#6d4bc4', '#3a2a6e', '#1a1430'] },
  { id: 'amber', bg: 'linear-gradient(165deg,#c98a2e,#8a5a17 58%,#4a300c)', sw: 'linear-gradient(150deg,#f1c879,#8a5a17)', stops: ['#c98a2e', '#8a5a17', '#4a300c'] },
  { id: 'night', bg: 'radial-gradient(130% 90% at 22% 0%,#1b3047,#0c1622 58%,#05090f)', sw: 'linear-gradient(150deg,#22507a,#05090f)', stops: ['#1b3047', '#0c1622', '#05090f'] },
]

interface Content { ico: string; name: string; kicker: string; big: string; bigu: string; tag: string; cells: [string, string][] }

const Mark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="12" rx="10" ry="4.4" stroke="currentColor" strokeWidth="1.5" transform="rotate(-28 12 12)" />
    <circle cx="12" cy="12" r="3.4" fill="currentColor" />
  </svg>
)
const Orbit = () => (
  <svg className="sh-orbit" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="#fff" strokeWidth="1.2">
    <ellipse cx="60" cy="60" rx="52" ry="22" transform="rotate(-24 60 60)" />
    <ellipse cx="60" cy="60" rx="52" ry="22" transform="rotate(36 60 60)" />
    <circle cx="60" cy="60" r="6" fill="#fff" stroke="none" />
    <circle cx="106" cy="48" r="3" fill="#fff" stroke="none" />
  </svg>
)

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const dateStr = (off: number) => { const d = new Date(); d.setDate(d.getDate() - off); return d.toISOString().slice(0, 10) }

export function ShareScreen() {
  const words = useLexiStore(s => s.words)
  const streakData = useLexiStore(s => s.streakData)
  const daily = useLexiStore(s => s.daily)
  const history = useLexiStore(s => s.history)
  const xp = useLexiStore(s => s.xp)
  const profile = useLexiStore(s => s.profile)
  const counts = useLexiStore(s => s.counts)

  const [theme, setTheme] = useState('ocean')
  const [content, setContent] = useState<'today' | 'vocab' | 'week'>('today')
  const [msg, setMsg] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const CONTENTS: Record<'today' | 'vocab' | 'week', Content> = (() => {
    const today = new Date().toISOString().slice(0, 10)
    const isToday = daily.date === today
    const c = counts()
    const mastered = c.mastered
    const streak = streakData.current
    const level = profile.level ?? 4
    const vc = buildVocabCard(level, mastered)
    const reviewedTotal = Object.values(history).reduce((a, d) => a + (d.reviewed ?? 0), 0) + (daily.reviewed ?? 0)
    const ach = buildAchievements({
      streak: Math.max(streakData.longest, streak), mastered, total: words.length,
      reviewedTotal, pronOk: words.filter(w => (w.pronScore ?? 0) >= 80).length,
      gold: words.filter(w => w.state === 'mastered' && (w.dims?.length ?? 0) >= 2).length, xp,
    })
    // 本周（近 7 天，含今日）
    let wDays = 0, wNew = 0, wRev = 0
    for (let i = 0; i < 7; i++) {
      const d = dateStr(i)
      const rec = (d === today && isToday)
        ? { learned: daily.learned, reviewed: daily.reviewed, quizzed: daily.quizzed }
        : history[d]
      if (rec) {
        const act = (rec.learned ?? 0) + (rec.reviewed ?? 0) + (rec.quizzed ?? 0)
        if (act > 0) wDays++
        wNew += rec.learned ?? 0; wRev += rec.reviewed ?? 0
      }
    }
    const tLearned = isToday ? daily.learned : 0
    const tQuizzed = isToday ? daily.quizzed : 0
    const tReviewed = isToday ? daily.reviewed : 0
    const streakTag = streak >= 7 ? `“连续第 ${streak} 天，没有断更。”` : streak > 0 ? `“今天也学了，第 ${streak} 天。”` : '“今天，从这里开始。”'
    return {
      today: {
        ico: '⚡', name: '今日战绩', kicker: '今日战绩 · TODAY',
        big: String(tLearned), bigu: '今日学词', tag: streakTag,
        cells: [[`🔥 ${streak}`, '连续天数'], [String(tQuizzed), '今日测验'], [String(tReviewed), '复习巩固'], [String(mastered), '累计掌握']],
      },
      vocab: {
        ico: '📚', name: '词汇量', kicker: '我的词汇量 · VOCAB',
        big: vc.vocabEstimate.toLocaleString(), bigu: `约 词 · ${vc.levelName}`, tag: `“词海行者，已掌握 ${mastered} 词。”`,
        cells: [[String(mastered), '已掌握'], [vc.levelName, '当前档'], [`🔥 ${streak}`, '连续天数'], [String(ach.unlocked), '解锁勋章']],
      },
      week: {
        ico: '📈', name: '本周回顾', kicker: '本周回顾 · WEEKLY',
        big: String(wNew), bigu: '本周新词', tag: '“这一周，稳稳地往前走。”',
        cells: [[`${wDays}/7`, '打卡天数'], [String(wRev), '本周复习'], [String(mastered), '累计掌握'], [`${xp.toLocaleString()}`, '总 XP']],
      },
    }
  })()

  const t = THEMES.find(x => x.id === theme)!
  const c = CONTENTS[content]
  const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  const QR = Array.from({ length: 16 }, (_, i) => (i % 3 === 0 || i === 5 || i === 10))

  // ── 真实 canvas 绘制（2x，624×1112）──
  function paint(): HTMLCanvasElement {
    const W = 624, H = 1112, P = 52
    const cv = canvasRef.current ?? document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
    g.addColorStop(0, t.stops[0]); g.addColorStop(0.58, t.stops[1]); g.addColorStop(1, t.stops[2])
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    // 品牌
    ctx.globalAlpha = 0.16; roundRect(ctx, P, P, 64, 64, 18); ctx.fill(); ctx.globalAlpha = 1
    ctx.beginPath(); ctx.arc(P + 32, P + 32, 9, 0, Math.PI * 2); ctx.fill()
    ctx.font = '600 32px Georgia, serif'; ctx.textBaseline = 'alphabetic'
    ctx.fillText('Lexiverse', P + 84, P + 32)
    ctx.globalAlpha = 0.7; ctx.font = '15px monospace'; ctx.fillText('词 汇 宇 宙', P + 84, P + 56); ctx.globalAlpha = 1
    // kicker
    ctx.globalAlpha = 0.72; ctx.font = '20px monospace'; ctx.fillText(c.kicker, P, P + 168); ctx.globalAlpha = 1
    // big
    ctx.font = '700 132px monospace'; ctx.fillText(c.big, P - 4, P + 290)
    ctx.globalAlpha = 0.85; ctx.font = '28px serif'; ctx.fillText(c.bigu, P, P + 326); ctx.globalAlpha = 1
    // tag（按字符换行）
    ctx.globalAlpha = 0.92; ctx.font = 'italic 27px Georgia, serif'
    const tag = c.tag; const maxChars = 15; let ty = P + 388
    for (let i = 0; i < tag.length; i += maxChars) { ctx.fillText(tag.slice(i, i + maxChars), P, ty); ty += 38 }
    ctx.globalAlpha = 1
    // 2×2 cells（底部）
    const cellW = (W - P * 2 - 18) / 2, cellH = 130, gx = 18, gy = 18
    const cy0 = H - P - 150 - cellH * 2 - gy
    c.cells.forEach((cell, i) => {
      const cx = P + (i % 2) * (cellW + gx)
      const cyy = cy0 + Math.floor(i / 2) * (cellH + gy)
      ctx.globalAlpha = 0.10; ctx.fillStyle = '#fff'; roundRect(ctx, cx, cyy, cellW, cellH, 18); ctx.fill(); ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = '700 44px monospace'; ctx.fillText(cell[0], cx + 26, cyy + 64)
      ctx.globalAlpha = 0.78; ctx.font = '22px sans-serif'; ctx.fillText(cell[1], cx + 26, cyy + 100); ctx.globalAlpha = 1
    })
    // footer
    const fy = H - P - 70
    ctx.globalAlpha = 0.15; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(P, fy); ctx.lineTo(W - P, fy); ctx.stroke(); ctx.globalAlpha = 1
    ctx.globalAlpha = 0.2; roundRect(ctx, P, fy + 18, 56, 56, 28); ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'; ctx.font = '700 24px sans-serif'; ctx.fillText('L', P + 21, fy + 54)
    ctx.font = '600 24px sans-serif'; ctx.fillText('词渊 · 学习者', P + 74, fy + 44)
    ctx.globalAlpha = 0.66; ctx.font = '18px monospace'; ctx.fillText(`lexiverse · ${dateLabel}`, P + 74, fy + 70); ctx.globalAlpha = 1
    return cv
  }

  async function save() {
    try {
      const cv = paint()
      cv.toBlob(blob => {
        if (!blob) { setMsg('生成失败，请重试'); return }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `lexiverse-${content}.png`; a.click()
        URL.revokeObjectURL(url)
        setMsg('已保存为图片 ✦')
      }, 'image/png')
    } catch { setMsg('当前环境不支持导出') }
  }

  async function share() {
    try {
      const cv = paint()
      const blob: Blob | null = await new Promise(res => cv.toBlob(b => res(b), 'image/png'))
      if (!blob) { setMsg('生成失败，请重试'); return }
      const file = new File([blob], `lexiverse-${content}.png`, { type: 'image/png' })
      const navAny = navigator as Navigator & { canShare?: (d?: unknown) => boolean }
      if (navAny.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: '我的词渊战绩', text: '一起来词渊学英语 📚' })
        setMsg('已调起分享')
      } else {
        save(); setMsg('已保存图片，可手动分享到社交')
      }
    } catch { setMsg('分享已取消') }
  }

  return (
    <div className="scr theme-light">
      <div className="wrap">
        <div className="eyebrow">分享 · Share</div>
        <h1 className="h1">晒出你的坚持</h1>
        <p className="sub" style={{ marginBottom: 26 }}>把今天的成果做成一张好看的卡片，分享给朋友一起卷。</p>

        <div className="sh-layout">
          {/* 卡面预览 */}
          <div className="sh-stage">
            {/* 界面优化2·P3：战绩卡流光描边（米白默认色 teal-ink/gold-ink，圆角对齐 .sh-card 的 26px） */}
            <BorderBeam radius={26}>
            <div className="sh-card">
              <div className="bg" style={{ background: t.bg }} />
              <div className="glow" />
              <Orbit />
              <div className="sh-grain" />
              <div className="sh-inner">
                <div className="sh-brand">
                  <span className="sh-mark"><Mark /></span>
                  <span className="sh-wm"><div className="nm">Lexi<em>verse</em></div><div className="subt">词汇宇宙</div></span>
                </div>
                <div className="sh-kicker">{c.kicker}</div>
                <div className="sh-big">{c.big}</div>
                <div className="sh-bigu">{c.bigu}</div>
                <div className="sh-tag">{c.tag}</div>
                <div className="sh-grid">
                  {c.cells.map(([v, l], i) => (
                    <div key={i} className="sh-cell"><div className="v">{v}</div><div className="l">{l}</div></div>
                  ))}
                </div>
                <div className="sh-foot">
                  <span className="sh-ava">L</span>
                  <span className="sh-handle"><div className="h">词渊 · 学习者</div><div className="d">lexiverse · {dateLabel}</div></span>
                  <span className="sh-qr">{QR.map((on, i) => <i key={i} className={on ? 'o' : ''} />)}</span>
                </div>
              </div>
            </div>
            </BorderBeam>
          </div>

          {/* 控制面板 */}
          <div className="sh-controls">
            <div className="sh-ctl-row">
              <div className="sh-ctl-lab">主题配色</div>
              <div className="sh-themes">
                {THEMES.map(x => (
                  <div key={x.id} className={`sh-theme${x.id === theme ? ' on' : ''}`} style={{ background: x.sw }} onClick={() => setTheme(x.id)} />
                ))}
              </div>
            </div>
            <div className="sh-ctl-row">
              <div className="sh-ctl-lab">展示内容</div>
              <div className="sh-segs">
                {(['today', 'vocab', 'week'] as const).map(k => (
                  <button key={k} className={`sh-seg${k === content ? ' on' : ''}`} onClick={() => setContent(k)}>
                    <span className="ico">{CONTENTS[k].ico}</span>{CONTENTS[k].name}
                    <span className="chk"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sh-actions">
              {/* 界面优化2·P8：唯一主 CTA 用微光按钮（flex:1 对齐原 .btn 布局） */}
              <Button variant="shimmer" onClick={save} style={{ flex: 1 }}>保存图片</Button>
              <button className="btn btn-ghost" onClick={share}>分享 →</button>
            </div>
            <div className="sh-msg">{msg}</div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
