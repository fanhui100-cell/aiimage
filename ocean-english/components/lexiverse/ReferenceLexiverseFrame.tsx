'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ReferenceLexiverseNavPanel } from './ReferenceLexiverseNavPanel'
import { lexiverseBasePath } from '@/config/lexiverse-build'
import { useLexiStore } from '@/store/lexiStore'
import type { ReviewGrade } from '@/lib/srs/schedule'

type ReferenceGalaxy = {
  id: string
  title: string
  titleZh: string
  sourceType: string
  colorTheme?: string
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
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [referenceGalaxies, setReferenceGalaxies] = useState<ReferenceGalaxy[]>([])

  const src = useMemo(() => {
    const file = galaxyId ? 'Lexiverse Galaxy.html' : 'Lexiverse Universe.html'
    // 阶段3-0：v1/v2 一行切换（config/lexiverse-build.ts）
    return `${lexiverseBasePath()}/${encodeURIComponent(file)}`
  }, [galaxyId])

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

  const previewGalaxy = useCallback((id: string) => {
    let attempt = 0
    const preview = () => {
      const win = frameRef.current?.contentWindow as LexiverseWindow | null
      const api = win?.__lexiverse
      const catalog = api?.catalog ?? win?.LexiverseCatalog
      const galaxy = catalog?.GALAXIES?.find(item => {
        return item.id === id
      })
      win?.postMessage({ type: 'lexiverse-preview-galaxy', galaxyId: id }, window.location.origin)
      if ((!api?.openGalaxy || !api.universe?.focusGalaxy) && attempt < 20) {
        attempt += 1
        window.setTimeout(preview, 120)
        return
      }
      api?.universe?.focusGalaxy?.(id)
      if (galaxy) api?.openGalaxy?.(galaxy)
    }
    preview()
  }, [])

  /* ── 阶段3-2：postMessage 桥 ──────────────────────────────────────────────
     parent → iframe : lv:user-states｜lv:galaxy-stats｜lv:celebrate｜lv:focus-word
     iframe → parent : lv:ready｜lv:navigate｜lv:review-grade｜lv:open-word｜
                       lv:ensure-word｜lexiverse-enter/exit-galaxy
     数据归 React store，iframe 只展示转发；统一 origin 校验。 */

  // 词 → 星系归属（word.galaxy 主题 ↔ 星系 filter.themeTags）
  const galaxyForWord = useCallback((wordGalaxy: string | undefined): string | null => {
    if (!wordGalaxy) return null
    const hit = referenceGalaxies.find(g =>
      g.filter?.themeTags?.includes(wordGalaxy) || g.filter?.domainTags?.includes(wordGalaxy) || g.id === wordGalaxy)
    return hit?.id ?? null
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
        const gid = galaxyForWord(w.galaxy)
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
      .map(e => ({
        word: e.word, from: e.from, to: e.to,
        galaxyId: galaxyForWord(words.find(w => w.id === e.id)?.galaxy),
      }))
    win.postMessage({ type: 'lv:celebrate', items }, window.location.origin)
  }, [searchParams, galaxyForWord])

  // U1：?word= 外部定位 — 解析词所属星系并进入，再让星系页聚焦该词
  const focusWordRef = useRef<string | null>(null)
  useEffect(() => {
    const word = searchParams.get('word')
    if (!word) return
    focusWordRef.current = word
    if (!galaxyId) {
      const entry = useLexiStore.getState().words.find(w => w.id === word)
      const gid = galaxyForWord(entry?.galaxy) ?? referenceGalaxies[0]?.id
      if (gid) {
        const sp = new URLSearchParams(searchParams.toString())
        sp.set('galaxy', gid)
        router.replace(`${pathname}?${sp.toString()}`)
      }
    }
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
        case 'lexiverse-exit-galaxy': {
          const sp = new URLSearchParams(searchParams.toString())
          sp.delete('galaxy')
          sp.delete('planet')
          const q = sp.toString()
          router.replace(q ? `${pathname}?${q}` : pathname)
          break
        }
        case 'lv:navigate': {
          if (data.href && data.href.startsWith('/')) router.push(data.href)
          break
        }
        case 'lv:open-word': {
          if (data.wordId) router.push(`/word/${encodeURIComponent(data.wordId)}`)
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
          pushStates()
          sendCelebrate()
          if (focusWordRef.current && galaxyId) {
            frameRef.current?.contentWindow?.postMessage(
              { type: 'lv:focus-word', wordId: focusWordRef.current }, window.location.origin)
          }
          break
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router, pathname, searchParams, galaxyId, pushStates, sendCelebrate])

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
      <ReferenceLexiverseNavPanel galaxies={referenceGalaxies} onPreviewGalaxy={previewGalaxy} />
    </>
  )
}
