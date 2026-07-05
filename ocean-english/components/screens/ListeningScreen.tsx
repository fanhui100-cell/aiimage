'use client'
/* ============================================================================
   ListeningScreen.tsx — D15 听写练习 Listening
   补「听」维度：放音 → 拼出听到的词 → 即时判对错 + 揭示释义例句。
   词源 = 用户学习库（lexiStore 中有释义、非 locked/unknown 的词）。
   答对即 recordDimPass(id,'listen') → 直接喂报告雷达的「听」维度，闭环。
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import './screen-kit.css'
import './listening.css'

const PLAY = (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
  </svg>
)

function speak(w: string) {
  try {
    const u = new SpeechSynthesisUtterance(w)
    u.lang = 'en-US'; u.rate = 0.9
    speechSynthesis.cancel(); speechSynthesis.speak(u)
  } catch { /* 无语音合成：静默降级 */ }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 例句里把目标词高亮（不区分大小写）
function Example({ ex, word }: { ex: string; word: string }) {
  if (!ex) return null
  const parts = ex.split(new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return (
    <div className="ex">
      {parts.map((p, i) =>
        p.toLowerCase() === word.toLowerCase() ? <b key={i}>{p}</b> : <span key={i}>{p}</span>,
      )}
    </div>
  )
}

const QUEUE_SIZE = 8

export function ListeningScreen() {
  const words = useLexiStore(s => s.words)
  const recordDimPass = useLexiStore(s => s.recordDimPass)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const incXp = useLexiStore(s => s.incXp)

  // 可听写词池：有释义、非 locked/unknown（= 用户真正在学的词）
  const pool = useMemo(
    () => words.filter(w => w.zh && w.word && w.state !== 'locked' && w.state !== 'unknown'),
    [words],
  )

  const [nonce, setNonce] = useState(0)
  const queue = useMemo<WordEntry[]>(
    () => shuffle(pool).slice(0, QUEUE_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonce, pool.length],
  )

  const [idx, setIdx] = useState(0)
  const [val, setVal] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [lastOk, setLastOk] = useState(false)
  const [correctN, setCorrectN] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const cur = queue[idx]
  const done = idx >= queue.length && queue.length > 0

  // 进入每张卡：自动放音 + 聚焦输入
  useEffect(() => {
    if (cur && !revealed) {
      speak(cur.word)
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [cur, revealed])

  function check() {
    if (!cur) return
    const ok = val.trim().toLowerCase() === cur.word.toLowerCase()
    setLastOk(ok)
    setRevealed(true)
    if (ok) {
      setCorrectN(n => n + 1)
      recordDimPass(cur.id, 'listen')
      recordActivity('quizzed')
      incXp(8)
    }
  }

  function next() {
    setIdx(i => i + 1)
    setVal('')
    setRevealed(false)
    setLastOk(false)
  }

  function restart() {
    setIdx(0); setVal(''); setRevealed(false); setLastOk(false); setCorrectN(0)
    setNonce(n => n + 1)
  }

  // ── 空态：无可听写词 ──
  if (pool.length === 0) {
    return (
      <div className="scr theme-light">
        <div className="wrap">
          <div className="eyebrow">D15 · 听写练习</div>
          <h1 className="h1">听写练习 <em>Listening</em></h1>
          <div className="state empty">
            <div className="state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="state-title">还没有可听写的词 ✦</div>
            <div className="state-desc">先去学一些词、加入学习库，就能用它们来练听写。</div>
            <div className="state-acts">
              <Link className="btn btn-ink" href="/today">去学词</Link>
              <Link className="btn btn-ghost" href="/dictionary">逛词库</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 小结 ──
  if (done) {
    const pct = Math.round(correctN / queue.length * 100)
    const C = 2 * Math.PI * 40, off = C * (1 - pct / 100)
    return (
      <div className="ls-screen">
        <div className="ls-wrap">
          <div className="ls-mid">
            <svg width="104" height="104">
              <circle cx="52" cy="52" r="40" fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle cx="52" cy="52" r="40" fill="none" stroke="var(--teal-ink)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 52 52)" />
              <text x="52" y="57" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="22" fontWeight="700" fill="var(--teal-ink)">{pct}%</text>
            </svg>
            <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 23, fontWeight: 700, color: 'var(--ink)' }}>听写完成 ✦</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-sub)' }}>本组 {queue.length} 词 · 拼对 {correctN} 个</div>
          </div>
          <div className="ls-foot">
            <button className="btn btn-primary" onClick={restart}>再来一组</button>
            <Link className="btn btn-ghost" href="/report">看报告</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── 听写卡 ──
  return (
    <div className="ls-screen">
      <div className="ls-wrap">
        <div className="ls-top">
          <Link className="ls-close" href="/today" aria-label="退出">✕</Link>
          <div className="ls-prog"><i style={{ width: `${Math.round(idx / queue.length * 100)}%` }} /></div>
          <div className="ls-cnt"><b>{idx + 1}</b>/{queue.length}</div>
        </div>
        <div className="ls-mid">
          {!revealed ? (
            <>
              <button className="ls-play" onClick={() => cur && speak(cur.word)} aria-label="播放发音">{PLAY}</button>
              <div className="ls-tip">点喇叭听发音 · 把听到的词拼出来</div>
              <input
                ref={inputRef}
                className="ls-input"
                placeholder="type what you hear"
                autoComplete="off" autoCapitalize="off" spellCheck={false}
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') check() }}
              />
            </>
          ) : cur && (
            <div className="ls-reveal">
              <div className={`ls-tag ${lastOk ? 'ok' : 'no'}`}>{lastOk ? '✓ 拼写正确' : '✗ 再记一下'}</div>
              <div className="w">{cur.word}</div>
              {cur.phon && <div className="ipa">{cur.phon}</div>}
              <div className="zh">{cur.zh}</div>
              {cur.ex && <Example ex={cur.ex} word={cur.word} />}
            </div>
          )}
        </div>
        <div className="ls-foot">
          {!revealed ? (
            <>
              <button className="btn btn-ghost" onClick={() => cur && speak(cur.word)}>再听一次</button>
              <button className="btn btn-ink" onClick={check}>提交</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={next}>
              {idx === queue.length - 1 ? '查看小结' : '下一个'} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
