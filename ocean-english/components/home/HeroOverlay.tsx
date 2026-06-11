'use client'
// HeroOverlay — 首页 hero 覆盖层（fix1：从 BanyanHero 抽出，结构/文案/样式逐像素不变）
// 标题「万词成海，自有光」、副标题、CTA、HERO_NODES 悬浮节点、SCROLL 指示、
// vignette 与向 --paper 过渡的渐变遮罩。叠在 3D 粒子树或 2D Canvas 之上。

import { useState } from 'react'

const HERO_NODES = [
  { go: 'chat',     zh: 'AI 导学',  en: 'Guide',     x: '63%', y: '30%' },
  { go: 'words',    zh: '词库',     en: 'Words',     x: '79%', y: '20%' },
  { go: 'universe', zh: '词汇宇宙', en: 'Lexiverse', x: '83%', y: '54%' },
  { go: 'review',   zh: '复习',     en: 'Review',    x: '67%', y: '70%' },
  { go: 'scan',     zh: '扫描',     en: 'Scan',      x: '48%', y: '44%' },
]

function HeroNode({ node, navigate }: { node: typeof HERO_NODES[0]; navigate: (go: string) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => navigate(node.go)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="hero-node"
      style={{ position: 'absolute', left: node.x, top: node.y, zIndex: 8, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{ width: hov ? 13 : 10, height: hov ? 13 : 10, borderRadius: 999, background: 'var(--teal)', boxShadow: hov ? '0 0 28px 8px rgba(79,230,206,0.85)' : '0 0 14px 4px rgba(79,230,206,0.5)', transition: 'all .22s' }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(-4px)', transition: 'all .2s', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 12, fontWeight: 600, color: '#eaf3f6', whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{node.zh}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--teal)', letterSpacing: '0.1em', opacity: 0.8 }}>{node.en}</span>
      </span>
    </button>
  )
}

export function HeroOverlay({ navigate }: { navigate: (go: string) => void }) {
  return (
    <>
      <div className="hero-nodes-wrap">
        {HERO_NODES.map(n => <HeroNode key={n.go} node={n} navigate={navigate} />)}
      </div>
      {/* F1：画框卡内排版 — vignette 保留，删除向 paper 过渡与 SCROLL 指示 */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, transparent 52%, rgba(4,7,12,0.7) 100%)', pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 'clamp(22px,6%,36px)', left: 'clamp(20px,4vw,32px)', zIndex: 10, maxWidth: 'min(560px, calc(100% - 40px))' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,3.4vw,36px)', lineHeight: 1.2, letterSpacing: '0.02em', color: '#f3f7f8', textShadow: '0 0 40px rgba(79,230,206,0.18)', whiteSpace: 'nowrap' }}>万词成海，自有光</h1>
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 'clamp(13px,1.5vw,16px)', color: 'var(--teal)', opacity: 0.92 }}>An ocean of words, lit from within.</p>
        <p style={{ margin: '6px 0 0', fontSize: 'clamp(12px,1.3vw,13.5px)', color: 'rgba(234,243,246,0.62)', lineHeight: 1.55 }}>AI 驱动的深海英语学习系统 — 词汇、星图、阅读、记忆，一起生长。</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('today')} className="btn-press" style={{ padding: '10px 22px', borderRadius: 999, background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 12px 26px -14px rgba(79,230,206,0.8)', fontFamily: 'var(--font-sans)' }}>开始学习</button>
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(225,238,244,0.3)', color: '#eaf3f6', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>选择等级</button>
        </div>
      </div>
    </>
  )
}
