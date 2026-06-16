'use client'

/* LexiGraphFrame — /lexigraph 实装外壳（界面优化10 / 任务A）
   1:1 原型移植：iframe 嵌 public/lexigraph-reference/ 的力导向词图原型；
   postMessage 桥负责联动：宇宙→/lexiverse、词典→/word/[slug]、?word= 定位、
   真 SRS 状态 → 节点金环、学会/错词 → 回写 store。契约与 wu-bridge 一致。 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import type { ReviewGrade } from '@/lib/srs/schedule'

const BASE = '/lexigraph-reference'

// 七星系单包（slug 与 public/lexigraph-reference/data/words-{slug}-full.js 对应）
const BELTS = [
  { slug: 'chuzhong', label: '初中' },
  { slug: 'gaozhong', label: '高中' },
  { slug: 'cet4', label: '四级' },
  { slug: 'cet6', label: '六级' },
  { slug: 'kaoyan', label: '考研' },
  { slug: 'toefl', label: '托福' },
  { slug: 'sat', label: 'SAT' },
] as const

// 用户当前档（lexiStore profile.level 1-8）→ 星系 slug，默认四级
function beltForLevel(level: number | undefined): string {
  const idx = Math.min(7, Math.max(1, level ?? 3)) - 1
  return BELTS[idx]?.slug ?? 'cet4'
}

export function LexiGraphFrame() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const word = searchParams.get('word')
  const returnTo = searchParams.get('returnTo')   // 19.zip：来处单词页，用于「返回单词」
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loadPhase, setLoadPhase] = useState<'loading' | 'fading' | 'done'>('loading')
  const [progress, setProgress] = useState(10)
  // 初始星系取用户当前学习档；手动切档后只带 list（丢掉跨档的 word）
  const [list, setList] = useState(() => beltForLevel(useLexiStore.getState().profile?.level))

  const src = useMemo(
    () => `${BASE}/LexiGraph.html?list=${list}${word ? `&word=${encodeURIComponent(word)}` : ''}`,
    [list, word],
  )

  // 真 SRS 状态 → iframe（金环）
  const pushStates = useCallback(() => {
    const win = frameRef.current?.contentWindow
    if (!win) return
    const { words } = useLexiStore.getState()
    const now = Date.now()
    const states: Record<string, { state: string; due: boolean }> = {}
    for (const w of words) {
      states[w.id] = { state: w.state, due: w.nextReviewAt != null && w.nextReviewAt <= now }
    }
    win.postMessage({ type: 'lv:user-states', states }, window.location.origin)
  }, [])

  // store 变化 → 300ms 防抖推送
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const unsub = useLexiStore.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(pushStates, 300)
    })
    return () => { clearTimeout(timer); unsub() }
  }, [pushStates])

  // iframe → parent 桥
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; href?: string; wordId?: string; grade?: string }
      switch (data.type) {
        case 'lv:navigate':
          if (data.href && data.href.startsWith('/')) router.push(data.href)
          break
        case 'lv:open-word':
          if (data.wordId) router.push(`/word/${encodeURIComponent(data.wordId)}`)
          break
        case 'lv:review-grade': {
          if (!data.wordId || !data.grade) return
          const lexi = useLexiStore.getState()
          if (!lexi.byId(data.wordId)) return
          lexi.reviewGrade(data.wordId, data.grade as ReviewGrade)
          lexi.recordActivity('reviewed')
          setTimeout(pushStates, 50)
          break
        }
        case 'lv:ensure-word':
          if (!data.wordId) return
          fetch(`/api/dictionary/word/${encodeURIComponent(data.wordId)}`)
            .then(r => (r.ok ? r.json() : null))
            .then(json => {
              if (json?.data) {
                const lexi = useLexiStore.getState()
                lexi.ensureWord(json.data, 'lookup')
                lexi.recordActivity('learned')
                setTimeout(pushStates, 50)
              }
            })
            .catch(() => {})
          break
        case 'lv:ready':
          setProgress(100)
          setLoadPhase('fading')
          pushStates()
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router, pushStates])

  // 加载页进度（lv:ready 补满淡出；18s 兜底）
  useEffect(() => { setLoadPhase('loading'); setProgress(10) }, [src])
  useEffect(() => {
    if (loadPhase !== 'loading') return
    const tick = window.setInterval(() => setProgress(p => (p >= 92 ? p : p + Math.max(0.8, (92 - p) * 0.07))), 130)
    const fallback = window.setTimeout(() => setLoadPhase('fading'), 18000)
    return () => { window.clearInterval(tick); window.clearTimeout(fallback) }
  }, [loadPhase])
  useEffect(() => {
    if (loadPhase !== 'fading') return
    const t = window.setTimeout(() => setLoadPhase('done'), 460)
    return () => window.clearTimeout(t)
  }, [loadPhase])

  const pct = Math.round(Math.min(100, progress))

  // 切档：换星系数据包；丢掉跨档残留的 ?word=（否则新档找不到该词）
  const switchBelt = useCallback((slug: string) => {
    if (slug === list) return
    setList(slug)
    if (word) router.replace('/lexigraph')
  }, [list, word, router])

  return (
    <>
      <iframe
        ref={frameRef}
        key={src}
        title="LexiGraph 词图"
        src={src}
        /* iframe 是替换元素：left/right + width:auto 不会拉伸（会退回 300×150 固有尺寸），必须显式给宽高 */
        style={{ position: 'fixed', top: 'var(--nav-h, 64px)', left: 0, width: '100vw', height: 'calc(100vh - var(--nav-h, 64px))', border: 0, background: '#F2EFE9' }}
        allow="fullscreen"
      />

      {/* 返工FIX3：常驻「返回」chip（不再仅 returnTo 时显示）。有来源回来源，否则 router.back() */}
      <button
        onClick={() => { if (returnTo) router.push(decodeURIComponent(returnTo)); else router.back() }}
        style={{
          position: 'fixed', left: 16, top: 'calc(var(--nav-h, 64px) + 14px)', zIndex: 30,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 999,
          background: 'var(--card)', border: '1px solid var(--line-strong)',
          color: 'var(--teal-ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        {returnTo ? '返回单词' : '返回'}
      </button>

      {/* 星系切档器 —— 居顶部中央（LexiGraph 自带 brand 在左 / 搜索在右，中部留白） */}
      {loadPhase === 'done' && (
        <div
          style={{
            position: 'fixed', top: 'calc(var(--nav-h, 64px) + 14px)', left: '50%', transform: 'translateX(-50%)',
            zIndex: 13, display: 'flex', gap: 3, padding: 4, borderRadius: 999,
            background: 'rgba(251,249,244,0.86)', backdropFilter: 'blur(8px)',
            boxShadow: '3px 3px 10px rgba(120,110,85,0.16), -3px -3px 10px rgba(255,255,255,0.7)',
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          {BELTS.map(b => {
            const active = b.slug === list
            return (
              <button
                key={b.slug}
                onClick={() => switchBelt(b.slug)}
                title={`切到「${b.label}」星系`}
                style={{
                  border: 0, cursor: 'pointer', padding: '5px 11px', borderRadius: 999,
                  fontSize: 12.5, fontWeight: active ? 700 : 500, letterSpacing: '0.02em',
                  color: active ? '#fff' : '#5A6570',
                  background: active ? 'linear-gradient(135deg,#1FBFA6,#0E8C7A 75%)' : 'transparent',
                  boxShadow: active ? '0 1px 4px rgba(14,140,122,0.35)' : 'none',
                  transition: 'background .2s, color .2s',
                }}
              >
                {b.label}
              </button>
            )
          })}
        </div>
      )}

      {loadPhase !== 'done' && (
        <div
          aria-hidden
          style={{
            position: 'fixed', top: 'var(--nav-h, 64px)', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(120% 100% at 50% 36%, #FAF8F2 0%, #F1EDE4 60%, #E9E4D8 100%)',
            opacity: loadPhase === 'fading' ? 0 : 1,
            transition: 'opacity .46s cubic-bezier(0.22,1,0.36,1)',
            pointerEvents: loadPhase === 'fading' ? 'none' : 'auto',
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <style>{'@keyframes lggspin{to{transform:rotate(360deg)}}'}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, color: '#fff', background: 'linear-gradient(135deg,#1FBFA6,#0E8C7A 70%,#0a6e60)' }}>⬡</span>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.01em', color: '#14191E' }}>LexiGraph</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#8A97A2', fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: '0.16em' }}>词图 · WORD WEB</div>
          <div style={{ marginTop: 30, position: 'relative', width: 38, height: 38 }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2.5px solid rgba(14,140,122,0.18)', borderTopColor: '#0E8C7A', animation: 'lggspin 0.9s linear infinite' }} />
          </div>
          <div style={{ marginTop: 24, width: 'min(260px,60vw)', height: 3, borderRadius: 999, background: 'rgba(120,110,85,0.14)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#1FBFA6,#0E8C7A 60%,#B3781F)', transition: 'width .3s ease' }} />
          </div>
          <div style={{ marginTop: 10, fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11, letterSpacing: '0.08em', color: '#8A97A2' }}>{pct}% · 正在编织词网</div>
        </div>
      )}
    </>
  )
}
