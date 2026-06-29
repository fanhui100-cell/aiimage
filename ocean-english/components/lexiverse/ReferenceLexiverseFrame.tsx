'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { lexiverseBasePath } from '@/config/lexiverse-build'
import { useLexiStore } from '@/store/lexiStore'
import { LEVELS, MAX_LEVEL } from '@/lib/levels'
import type { ReviewGrade } from '@/lib/srs/schedule'

// level (1-8) → 等级带星系 id（单源自 lib/levels.ts key，消除两处重复 belt 数组）；index = level，[0] 空哨兵
const LEVEL_GALAXY = ['', ...LEVELS.map(l => l.key)]

type ReferenceGalaxy = {
  id: string
  title: string
  titleZh: string
  sourceType: string
  colorTheme?: string
  wordCount?: number
  filter?: { themeTags?: string[]; domainTags?: string[] }
}

type LexiverseWindow = Window & {
  LexiverseCatalog?: { GALAXIES?: ReferenceGalaxy[] }
  __lexiverse?: {
    openGalaxy?: (galaxy: unknown) => void
    universe?: { focusGalaxy?: (id: string) => void }
    catalog?: { GALAXIES?: ReferenceGalaxy[] }
  }
}

export function ReferenceLexiverseFrame() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const galaxyId = searchParams.get('galaxy')
  const sectorParam = searchParams.get('sector')
  const returnTo = searchParams.get('returnTo')   // 19.zip：来处单词页，用于「返回单词」
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [referenceGalaxies, setReferenceGalaxies] = useState<ReferenceGalaxy[]>([])
  // 加载页：宇宙/星系 iframe 初始化（three + 词表 + 场景）期间盖一层进度页，lv:ready 时淡出
  const [loadPhase, setLoadPhase] = useState<'loading' | 'fading' | 'done'>('loading')
  const [loadProgress, setLoadProgress] = useState(8)
  const [focusMiss, setFocusMiss] = useState<string | null>(null)   // ?word= 该词不在本星系真词表时的可见提示

  const src = useMemo(() => {
    const file = galaxyId ? 'Lexiverse Galaxy.html' : 'Lexiverse Universe.html'
    // 阶段3-0：v1/v2 一行切换；真词池：星系页带 ?galaxy=&sector= 供 loader 取词
    const qs = galaxyId
      ? `?galaxy=${encodeURIComponent(galaxyId)}${sectorParam ? `&sector=${encodeURIComponent(sectorParam)}` : ''}`
      : ''
    return `${lexiverseBasePath()}/${encodeURIComponent(file)}${qs}`
  }, [galaxyId, sectorParam])

  const syncReferenceCatalog = useCallback(() => {
    let attempt = 0
    const sync = () => {
      const win = frameRef.current?.contentWindow as LexiverseWindow | null
      const galaxies = win?.__lexiverse?.catalog?.GALAXIES ?? win?.LexiverseCatalog?.GALAXIES
      if (Array.isArray(galaxies) && galaxies.length) {
        setReferenceGalaxies(galaxies)
        return
      }
      if (attempt < 30) {
        attempt += 1
        window.setTimeout(sync, 120)
      }
    }
    sync()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`${lexiverseBasePath()}/lexiverse-universe/catalog.js`)
      .then(response => response.text())
      .then(source => {
        const fakeWindow: { LexiverseCatalog?: { GALAXIES?: ReferenceGalaxy[] } } = {}
        new Function('window', source)(fakeWindow)
        const galaxies = fakeWindow.LexiverseCatalog?.GALAXIES
        if (!cancelled && Array.isArray(galaxies) && galaxies.length) {
          setReferenceGalaxies(galaxies)
        }
      })
      .catch(() => {
        syncReferenceCatalog()
      })
    return () => {
      cancelled = true
    }
  }, [syncReferenceCatalog])

  // src 变化 = 新页开始加载 → 复位进度
  useEffect(() => {
    setLoadPhase('loading')
    setLoadProgress(8)
  }, [src])
  // 加载中：进度平滑推进到 ~92%（真实就绪由 lv:ready 补满）；18s 兜底淡出
  useEffect(() => {
    if (loadPhase !== 'loading') return
    const tick = window.setInterval(() => {
      setLoadProgress(p => (p >= 92 ? p : p + Math.max(0.6, (92 - p) * 0.06)))
    }, 130)
    const fallback = window.setTimeout(() => setLoadPhase('fading'), 18000)
    return () => { window.clearInterval(tick); window.clearTimeout(fallback) }
  }, [loadPhase])
  // 淡出后卸载
  useEffect(() => {
    if (loadPhase !== 'fading') return
    const t = window.setTimeout(() => setLoadPhase('done'), 480)
    return () => window.clearTimeout(t)
  }, [loadPhase])

  /* ── 阶段3-2：postMessage 桥 ──────────────────────────────────────────────
     parent → iframe : lv:user-states｜lv:galaxy-stats｜lv:celebrate｜lv:focus-word
     iframe → parent : lv:ready｜lv:navigate｜lv:review-grade｜lv:open-word｜
                       lv:ensure-word｜lexiverse-enter/exit-galaxy
     数据归 React store，iframe 只展示转发；统一 origin 校验。 */

  // 词 → 星系归属（v3 目录按等级/考试组织，无语义簇）：
  // ① 直接命中 v3 星系 id ② 按 7 档数字等级落到「等级带」星系（junior→sat）
  // ③ 命中不了返回 null，上游优雅降级（聚焦首星系 / 跳过该词聚合）
  const galaxyForWord = useCallback((wordGalaxy: string | undefined, levels?: number[]): string | null => {
    if (wordGalaxy && referenceGalaxies.some(g => g.id === wordGalaxy)) return wordGalaxy
    if (levels?.length) {
      // index = 等级号 (1-8) → 等级带星系；聚焦取 min-level 星系（词在该星系也在场，见计划 §4.4）
      const lv = Math.max(1, Math.min(MAX_LEVEL, Math.min(...levels)))
      const id = LEVEL_GALAXY[lv]
      if (id && referenceGalaxies.some(g => g.id === id)) return id
    }
    return null
  }, [referenceGalaxies])

  const pushStates = useCallback(() => {
    const win = frameRef.current?.contentWindow
    if (!win) return
    const { words, profile } = useLexiStore.getState()
    const now = Date.now()
    const states: Record<string, { state: string; due: boolean }> = {}
    for (const w of words) {
      states[w.id] = { state: w.state, due: w.nextReviewAt != null && w.nextReviewAt <= now }
    }
    win.postMessage({ type: 'lv:user-states', states }, window.location.origin)
    // U3：按星系聚合（mastered/total/due）
    if (referenceGalaxies.length) {
      const stats: Record<string, { mastered: number; total: number; due: number }> = {}
      for (const w of words) {
        const gid = galaxyForWord(w.galaxy, w.levels)
        if (!gid) continue
        const s = (stats[gid] ??= { mastered: 0, total: 0, due: 0 })
        s.total++
        if (w.state === 'mastered') s.mastered++
        if (states[w.id].due) s.due++
      }
      win.postMessage({ type: 'lv:galaxy-stats', stats, level: profile.level ?? null }, window.location.origin)
    }
  }, [referenceGalaxies, galaxyForWord])

  // store 变化 → 300ms 防抖推送
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const unsub = useLexiStore.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(pushStates, 300)
    })
    return () => { clearTimeout(timer); unsub() }
  }, [pushStates])

  // U4：?celebrate=1 → 今日状态变化词（log 今日条目，≤8）
  const sendCelebrate = useCallback(() => {
    if (searchParams.get('celebrate') !== '1') return
    const win = frameRef.current?.contentWindow
    if (!win) return
    const { log, words } = useLexiStore.getState()
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    const seen = new Set<string>()
    const items = log
      .filter(e => e.t >= dayStart && e.from !== e.to)
      .filter(e => (seen.has(e.id) ? false : (seen.add(e.id), true)))
      .slice(0, 8)
      .map(e => {
        const entry = words.find(w => w.id === e.id)
        return { word: e.word, from: e.from, to: e.to, galaxyId: galaxyForWord(entry?.galaxy, entry?.levels) }
      })
    win.postMessage({ type: 'lv:celebrate', items }, window.location.origin)
  }, [searchParams, galaxyForWord])

  // P5-A3：?highlight=w1,w2 → 宇宙侧 2s 脉冲这些词所在星系
  const sendHighlight = useCallback(() => {
    const raw = searchParams.get('highlight')
    if (!raw) return
    const win = frameRef.current?.contentWindow
    if (!win) return
    const { words } = useLexiStore.getState()
    const items = raw.split(',').map(decodeURIComponent).filter(Boolean).slice(0, 8).map(slug => {
      const entry = words.find(w => w.id === slug)
      return { word: entry?.word ?? slug, galaxyId: galaxyForWord(entry?.galaxy, entry?.levels) }
    })
    win.postMessage({ type: 'lv:highlight', items }, window.location.origin)
  }, [searchParams, galaxyForWord])

  // U1：?word= 外部定位 — 解析词所属「等级带星系」并进入，再让星系页聚焦该词飞入星球。
  // 等级带星系装载该档完整真词表（dataFile，数千词），故只要进对档，focusWord 即能命中飞入。
  // 词在 store（已入库）→ 用其 levels；未入库 → 取词典拿 levels/primaryLevel 推等级带，绝不再静默兜底到首星系。
  const focusWordRef = useRef<string | null>(null)
  useEffect(() => {
    const word = searchParams.get('word')
    if (!word) return
    focusWordRef.current = word
    if (galaxyId) return                    // 已在某星系：等 lv:ready 聚焦
    if (!referenceGalaxies.length) return   // 目录未就绪：referenceGalaxies 更新后本 effect 重跑
    let cancelled = false
    const enter = (gid: string | null | undefined) => {
      if (cancelled) return
      const target = gid || referenceGalaxies[0]?.id
      if (!target) return
      const sp = new URLSearchParams(searchParams.toString())
      sp.set('galaxy', target)
      router.replace(`${pathname}?${sp.toString()}`)
    }
    const entry = useLexiStore.getState().words.find(w => w.id === word)
    const direct = galaxyForWord(entry?.galaxy, entry?.levels)
    if (direct) { enter(direct); return }
    // 未入库词：取词典 levels/primaryLevel → 等级带星系
    fetch(`/api/dictionary/word/${encodeURIComponent(word)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const dw = json?.data as { levels?: number[]; primaryLevel?: number } | undefined
        const levels = dw?.levels?.length ? dw.levels : (dw?.primaryLevel ? [dw.primaryLevel] : undefined)
        enter(galaxyForWord(undefined, levels))
      })
      .catch(() => enter(null))
    return () => { cancelled = true }
  }, [searchParams, galaxyId, galaxyForWord, referenceGalaxies, router, pathname])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; galaxyId?: string; href?: string; wordId?: string; grade?: string }
      switch (data.type) {
        case 'lexiverse-enter-galaxy': {
          if (!data.galaxyId) return
          const sp = new URLSearchParams(searchParams.toString())
          sp.set('galaxy', data.galaxyId)
          sp.delete('planet')
          router.replace(`${pathname}?${sp.toString()}`)
          break
        }
        case 'lexiverse-set-sector': {
          // 方案 A：星区切换 → URL 真实可分享，src 变化触发 iframe 重载新星区
          const sp = new URLSearchParams(searchParams.toString())
          sp.set('sector', String((data as { sector?: number }).sector ?? 0))
          router.replace(`${pathname}?${sp.toString()}`)
          break
        }
        case 'lexiverse-exit-galaxy': {
          const sp = new URLSearchParams(searchParams.toString())
          sp.delete('galaxy')
          sp.delete('planet')
          sp.delete('sector')
          const q = sp.toString()
          router.replace(q ? `${pathname}?${q}` : pathname)
          break
        }
        case 'lv:navigate': {
          if (data.href && data.href.startsWith('/')) router.push(data.href)
          break
        }
        case 'lv:open-word': {
          if (data.wordId) router.push(`/dictionary?word=${encodeURIComponent(data.wordId)}`)
          break
        }
        case 'lv:focus-miss': {
          // ?word= 进对了星系但该词不在该档真词表 → 给可见提示，避免「点了没反应」
          setFocusMiss(data.wordId ?? '该词')
          window.setTimeout(() => setFocusMiss(null), 3600)
          break
        }
        case 'lv:review-grade': {
          // U2：就地复习评分 → 写真 SRS → 状态回推（星色 morph 由 iframe 侧处理）
          if (!data.wordId || !data.grade) return
          const lexi = useLexiStore.getState()
          if (!lexi.byId(data.wordId)) return
          lexi.reviewGrade(data.wordId, data.grade as ReviewGrade)
          lexi.recordActivity('reviewed')
          setTimeout(pushStates, 50)
          break
        }
        case 'lv:ensure-word': {
          // 词不在宇宙（未入库）→ 词典卡「加入学习」
          if (!data.wordId) return
          fetch(`/api/dictionary/word/${encodeURIComponent(data.wordId)}`)
            .then(r => r.ok ? r.json() : null)
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
        }
        case 'lv:ready': {
          setLoadProgress(100)
          setLoadPhase('fading')
          pushStates()
          sendCelebrate()
          sendHighlight()
          if (focusWordRef.current && galaxyId) {
            frameRef.current?.contentWindow?.postMessage(
              { type: 'lv:focus-word', wordId: focusWordRef.current }, window.location.origin)
          }
          // 宇宙默认进站：按用户 7 档等级/目标考试聚焦其星系（仅宇宙总览；无 level 则不动）
          if (!galaxyId) {
            const { profile } = useLexiStore.getState()
            const lv = profile.level
            const levelGalaxy = lv && lv >= 1 && lv <= MAX_LEVEL ? LEVEL_GALAXY[lv] : null
            const tmap: Record<string, string> = { CET4: 'cet4', CET6: 'cet6', KAOYAN: 'kaoyan', TOEFL: 'toefl', SAT: 'sat', IELTS: 'ielts', GAOKAO: 'senior' }
            const targetGalaxy = profile.targetExam ? (tmap[profile.targetExam] ?? null) : null
            if (levelGalaxy || targetGalaxy) {
              frameRef.current?.contentWindow?.postMessage(
                { type: 'lv:home-focus', levelGalaxy, targetGalaxy }, window.location.origin)
            }
          }
          break
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router, pathname, searchParams, galaxyId, pushStates, sendCelebrate, sendHighlight])

  const activeGalaxy = galaxyId ? referenceGalaxies.find(g => g.id === galaxyId) : null
  const totalWords = referenceGalaxies.reduce((s, g) => s + (g.wordCount || 0), 0)
  const loadSubtitle = galaxyId
    ? (activeGalaxy
        ? `${activeGalaxy.titleZh}${activeGalaxy.wordCount ? ` · ${activeGalaxy.wordCount.toLocaleString()} 词` : ''}`
        : '单词星空 · Word Field')
    : (totalWords ? `词汇宇宙 · ${referenceGalaxies.length} 星系 · ${totalWords.toLocaleString()} 词` : '词汇宇宙 · Word Galaxy')
  const pct = Math.round(Math.min(100, loadProgress))

  return (
    <>
      <iframe
        ref={frameRef}
        key={src}
        title={galaxyId ? 'Lexiverse Galaxy' : 'Lexiverse Universe'}
        src={src}
        onLoad={() => syncReferenceCatalog()}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          border: 0,
          background: '#040407',
        }}
        allow="fullscreen"
      />

      {/* 界面优化2 返修：宇宙面已有 iframe 内「⋯ 全部」模块导航（FIX5 快捷条），
          原 React ⌘K 浮层与之重复 → 移除。命令面板仍可经全局 ⌘K 唤起。 */}

      {/* 19.zip：从单词页进来时显示「返回单词」chip（青色玻璃，HUD 之下） */}
      {returnTo && (
        <button
          onClick={() => router.push(decodeURIComponent(returnTo))}
          style={{
            position: 'fixed', left: 18, top: 74, zIndex: 40,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999,
            background: 'rgba(126,249,255,.10)', border: '1px solid rgba(126,249,255,.35)',
            color: '#7EF9FF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >‹ 返回单词</button>
      )}

      {/* ?word= 该词不在本星系真词表时的可见提示（替代此前的静默无反应） */}
      {focusMiss && (
        <div
          style={{
            position: 'fixed', left: '50%', top: 74, transform: 'translateX(-50%)', zIndex: 60,
            maxWidth: '86vw', padding: '9px 16px', borderRadius: 999,
            background: 'rgba(255,210,120,.12)', border: '1px solid rgba(255,210,120,.4)',
            color: '#FFD27A', fontSize: 13, fontWeight: 600, textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >「{focusMiss}」暂不在本星系词表 · 已带你到它所属星系</div>
      )}

      {loadPhase !== 'done' && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(120% 120% at 50% 38%, #0a1226 0%, #04040a 62%)',
            opacity: loadPhase === 'fading' ? 0 : 1,
            transition: 'opacity .5s cubic-bezier(0.22,1,0.36,1)',
            pointerEvents: loadPhase === 'fading' ? 'none' : 'auto',
            fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <style>{'@keyframes lv3spin{to{transform:rotate(360deg)}}@keyframes lv3pulse{0%,100%{opacity:.45}50%{opacity:.85}}'}</style>
          <div
            style={{
              fontSize: 'clamp(40px, 8vw, 88px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              backgroundImage: 'linear-gradient(135deg,#BFF6FF,#7EF9FF 40%,#38BDF8 80%,#7C5CFF)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lexiverse
          </div>
          <div style={{ marginTop: 14, fontSize: 'clamp(13px,1.6vw,17px)', fontStyle: 'italic', color: '#9FB6C6' }}>
            {loadSubtitle}
          </div>

          <div style={{ marginTop: 36, position: 'relative', width: 42, height: 42 }}>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2.5px solid rgba(126,249,255,0.16)',
                borderTopColor: '#7EF9FF',
                animation: 'lv3spin 0.9s linear infinite',
              }}
            />
          </div>

          <div
            style={{
              marginTop: 26,
              width: 'min(280px, 62vw)',
              height: 3,
              borderRadius: 999,
              background: 'rgba(150,200,255,0.14)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg,#7EF9FF,#38BDF8 60%,#7C5CFF)',
                boxShadow: '0 0 10px rgba(126,249,255,0.5)',
                transition: 'width .3s ease',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: '0.08em',
              color: '#7E96A6',
            }}
          >
            {pct}% · 正在装载单词星空
          </div>

          <div
            style={{
              marginTop: 30,
              fontFamily: "'Space Mono', ui-monospace, monospace",
              fontSize: 11,
              color: 'rgba(126,180,200,0.45)',
              animation: 'lv3pulse 2.4s ease-in-out infinite',
            }}
          >
            词表数据 · ECDICT / KyleBing 开源（MIT）
          </div>
        </div>
      )}
    </>
  )
}
