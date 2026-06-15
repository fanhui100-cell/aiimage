'use client'
// UniverseScreen — 1:1 port of prototype/screen-universe.jsx
// Chromeless iframe + postMessage sync + writeInject

import { useEffect, useRef, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'

const UNIVERSE_SRC = '/lexiverse-embed/Lexiverse%20Universe.html'
const GALAXY_SRC   = '/lexiverse-embed/Lexiverse%20Galaxy.html'

export function UniverseScreen() {
  const navigate = useNavigate()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { markLearning, markCorrect, incXp, getDue, getWeak, profile, bandCefr, all } = useLexiStore()

  const [inGalaxy, setInGalaxy] = useState(false)
  const cefr = bandCefr(profile.band)

  // Write inject to localStorage before iframe loads
  function writeInject() {
    try {
      const words = all()
      const inject = words.map(w => ({
        id: w.id, word: w.word, zh: w.zh, state: w.state, galaxy: w.galaxy,
      }))
      localStorage.setItem('__lexi_inject', JSON.stringify(inject))
      localStorage.setItem('__lexi_band', String(profile.band))
      localStorage.setItem('__lexi_goals', JSON.stringify(profile.goals ?? []))
    } catch {}
  }

  useEffect(() => {
    writeInject()
  }, [])

  // Listen for postMessages from iframe
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      // 安全：仅接受同源 iframe 的消息
      if (ev.origin !== window.location.origin) return
      if (!ev.data || typeof ev.data !== 'object') return
      const { type, payload } = ev.data

      if (type === 'lexiverse:learn' && payload?.wordId) {
        // 「学过一次」= 一次正常调度（一次 gradeSrs('good')），不再连记 4 次把词强推到 mastered
        markLearning(payload.wordId)
        markCorrect(payload.wordId)
        incXp(10)
      }

      if (type === 'lexiverse:nav') {
        const dest = payload?.screen
        if (dest === 'galaxy') {
          setInGalaxy(true)
        } else if (dest === 'universe') {
          setInGalaxy(false)
        } else if (dest) {
          navigate(dest)
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const dueCount = getDue().length + getWeak().length

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020810', display: 'flex', flexDirection: 'column' }}>
      {/* Top HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(2,8,16,0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        {/* Left: back + CEFR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <button onClick={() => navigate('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 14px', cursor: 'pointer', color: 'rgba(234,243,246,0.8)', fontSize: 13, backdropFilter: 'blur(8px)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回
          </button>
          <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: 'rgba(79,230,206,0.15)', color: 'var(--teal)', border: '1px solid rgba(79,230,206,0.25)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
            {cefr}
          </span>
        </div>

        {/* Right: today + review */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
          <button onClick={() => navigate('today')}
            style={{ border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 14px', cursor: 'pointer', color: 'rgba(234,243,246,0.8)', fontSize: 13, backdropFilter: 'blur(8px)' }}>
            今日
          </button>
          <button onClick={() => navigate('review')}
            style={{ position: 'relative', border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '6px 14px', cursor: 'pointer', color: 'rgba(234,243,246,0.8)', fontSize: 13, backdropFilter: 'blur(8px)' }}>
            复习
            {dueCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 99, background: '#d4477e', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {dueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Galaxy toggle */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, pointerEvents: 'auto',
      }}>
        <button
          onClick={() => setInGalaxy(g => !g)}
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '8px 20px', cursor: 'pointer', color: 'rgba(234,243,246,0.7)', fontSize: 13, backdropFilter: 'blur(8px)' } as React.CSSProperties}
        >
          {inGalaxy ? '🌌 宇宙全图' : '🌠 词汇星系'}
        </button>
      </div>

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        key={inGalaxy ? 'galaxy' : 'universe'}
        src={inGalaxy ? GALAXY_SRC : UNIVERSE_SRC}
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        allow="autoplay"
        title={inGalaxy ? 'Lexiverse Galaxy' : 'Lexiverse Universe'}
      />
    </div>
  )
}
