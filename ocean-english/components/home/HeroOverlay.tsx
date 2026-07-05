'use client'
// HeroOverlay — 首页 hero 覆盖层（界面优化1·阶段1）
// 叠在 3D 粒子树/2D Canvas 之上。两态：
//  · 未定级（新用户）：「万词成海，自有光」+ 开始学习/选择等级
//  · 已定级（回访）：「欢迎回来，{用户名} · {目标}方向 / 下午好，继续航行」+ 进入今日/专练
// 仅改文案与点击行为，不动大树渲染。

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { ShinyText } from '@/components/ui/motion/ShinyText'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

const HERO_NODES = [
  { go: 'chat',     zh: 'AI 导学',  en: 'Guide',     x: '63%', y: '30%' },
  { go: 'words',    zh: '词库',     en: 'Words',     x: '79%', y: '20%' },
  { go: 'universe', zh: '词汇宇宙', en: 'Lexiverse', x: '83%', y: '54%' },
  { go: 'drill',    zh: '专练',     en: 'Drill',     x: '67%', y: '70%' },
  { go: 'scan',     zh: '扫描',     en: 'Scan',      x: '48%', y: '44%' },
]

// 7 能力档中文（profile.level → 目标方向文案）
const LV_ZH = ['', '初中', '高中', '四级', '六级', '考研', '托福', 'SAT']

function greet(): string {
  const h = new Date().getHours()
  return h < 5 ? '夜深了，继续航行' : h < 12 ? '早上好，继续航行' : h < 18 ? '下午好，继续航行' : '晚上好，继续航行'
}

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

const primaryBtn: React.CSSProperties = { padding: '10px 22px', borderRadius: 999, background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontSize: 13.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 12px 26px -14px rgba(79,230,206,0.8)', fontFamily: 'var(--font-sans)' }
const ghostBtn: React.CSSProperties = { padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(225,238,244,0.3)', color: '#eaf3f6', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }

export function HeroOverlay({ navigate }: { navigate: (go: string) => void }) {
  const router = useRouter()
  const onboarded = useLexiStore(s => s.profile.onboarded)
  const skipped = useLexiStore(s => s.profile.skipped)
  const level = useLexiStore(s => s.profile.level)
  const targetExam = useLexiStore(s => s.profile.targetExam)

  // 用户名：Supabase 显示名/邮箱前缀；未登录但已逛过 → 「远航者」
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    createClient().auth.getUser().then(({ data }) => {
      const u = data.user
      const n = (u?.user_metadata?.username as string) || (u?.user_metadata?.display_name as string) || u?.email?.split('@')[0] || null
      setName(n)
    }).catch(() => {})
  }, [])

  const goalZh = (level && LV_ZH[level]) ? LV_ZH[level] : (targetExam || '')

  // 回访态：已定级（或已 skip 逛过）
  if (onboarded || skipped) {
    const who = name || '远航者'
    return (
      <>
        <div className="hero-nodes-wrap">
          {HERO_NODES.map(n => <HeroNode key={n.go} node={n} navigate={navigate} />)}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, transparent 52%, rgba(4,7,12,0.7) 100%)', pointerEvents: 'none', zIndex: 5 }} />
        <div style={{ position: 'absolute', bottom: 'clamp(22px,6%,36px)', left: 'clamp(20px,4vw,32px)', zIndex: 10, maxWidth: 'min(560px, calc(100% - 40px))' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(79,230,206,0.85)' }}>欢迎回来，{who}{goalZh ? ` · ${goalZh}方向` : ''}</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,3.4vw,36px)', lineHeight: 1.2, letterSpacing: '0.02em', color: '#f3f7f8', textShadow: '0 0 40px rgba(79,230,206,0.18)' }}>{greet()}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 'clamp(12px,1.3vw,13.5px)', color: 'rgba(234,243,246,0.62)', lineHeight: 1.55 }}>今日为你编排好了 — 跟着走，或去专练自选一组。</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('today')} className="btn-press" style={primaryBtn}>进入今日</button>
            <button onClick={() => navigate('drill')} className="btn-press" style={ghostBtn}>专练</button>
          </div>
        </div>
      </>
    )
  }

  // 新用户态
  return (
    <>
      <div className="hero-nodes-wrap">
        {HERO_NODES.map(n => <HeroNode key={n.go} node={n} navigate={navigate} />)}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, transparent 52%, rgba(4,7,12,0.7) 100%)', pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 'clamp(22px,6%,36px)', left: 'clamp(20px,4vw,32px)', zIndex: 10, maxWidth: 'min(560px, calc(100% - 40px))' }}>
        {/* 界面优化2·P9：标题流光（暗色 hero → 浅色基底 + teal 高光，不串色） */}
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,3.4vw,36px)', lineHeight: 1.2, letterSpacing: '0.02em', color: '#f3f7f8', textShadow: '0 0 40px rgba(79,230,206,0.18)', whiteSpace: 'nowrap' }}>
          <ShinyText baseColor="#f3f7f8" shineColor="var(--teal)">万词成海，自有光</ShinyText>
        </h1>
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 'clamp(13px,1.5vw,16px)', color: 'var(--teal)', opacity: 0.92 }}>An ocean of words, lit from within.</p>
        <p style={{ margin: '6px 0 0', fontSize: 'clamp(12px,1.3vw,13.5px)', color: 'rgba(234,243,246,0.62)', lineHeight: 1.55 }}>AI 驱动的深海英语学习系统 — 词汇、星图、阅读、记忆，一起生长。先定个目标，我们为你编排每天该走的路。</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/auth/login')} className="btn-press" style={primaryBtn}>开始学习</button>
          <button onClick={() => navigate('onboarding')} className="btn-press" style={ghostBtn}>选择等级</button>
        </div>
      </div>
    </>
  )
}
