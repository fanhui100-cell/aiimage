'use client'
/* practice/icons.tsx — PracticeRunner 共享视觉原语（复用 .pr-v2 / globals 令牌） */
import { useState, type ReactNode } from 'react'
import { speakSmart } from '@/lib/pronunciation/word-audio'

export const OkMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)
export const NoMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose-ink)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)

/** 完形挖空：拆 [BLANK] → 文本 + 空格标记 */
export function clozeNodes(text: string): ReactNode[] {
  const parts = String(text || '').split('[BLANK]')
  const out: ReactNode[] = []
  parts.forEach((p, i) => {
    if (i > 0) out.push(<span key={`b${i}`} className="blank">？</span>)
    out.push(<span key={`t${i}`}>{p}</span>)
  })
  return out
}

/** 拼写提示首字母：首字母加粗 + 其余以点位表示长度 */
export function HintInitials({ answer }: { answer: string }) {
  const a = (answer || '').trim()
  if (!a) return null
  return <span className="hint-initials"><b>{a[0]}</b>{a.length > 1 ? ' ' + '·'.repeat(Math.min(a.length - 1, 14)) : ''}</span>
}

/** 拼写错误差异高亮 */
export function Diff({ val, ans }: { val: string; ans: string }) {
  const n = Math.max(val.length, ans.length)
  const out: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    const c = val[i] ?? '·'
    const ok = !!val[i] && !!ans[i] && val[i] === ans[i]
    out.push(<span key={i} className={ok ? 'ok' : 'no'}>{c}</span>)
  }
  return <>{out}</>
}

/** 听力播放钮（渐变圆 + TTS + 播放态均衡条），复用旧 ListenPlay 视觉 */
export function ListenButton({ word, slow = false }: { word: string; slow?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const play = () => {
    setPlaying(true)
    void speakSmart(word, 'us', { slow })
    setTimeout(() => setPlaying(false), slow ? 2600 : 1000)
  }
  return (
    <button type="button" className="press" onClick={play} title="播放发音" aria-label="播放发音"
      style={{ width: 64, height: 64, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 28px -14px rgba(14,140,122,.7)' }}>
      {playing
        ? <span style={{ display: 'inline-flex', gap: 3 }}>{[0, 1, 2, 3].map(i => <span key={i} style={{ width: 3, height: 14, borderRadius: 2, background: '#04241f', animation: `pr-eq .7s ${i * 0.12}s ease-in-out infinite` }} />)}</span>
        : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
    </button>
  )
}
