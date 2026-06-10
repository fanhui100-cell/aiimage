'use client'
// components/lexiverse/LexiverseShell.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — Shell instantiates all Stage-D hooks + UI.
//
// Adds:
//   · useGalaxyMastery   → per-galaxy halo brightness
//   · useCrossGalaxyEchoes → ripple when a word is lit
//   · overdueWordIds      → derive from reviewWords with nextReviewAt < now
//   · <RecentlyMasteredRibbon /> top-right
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import { GALAXIES, getGalaxyById, getConstellationById } from '@/config/lexiverse-galaxies'
import { buildGalaxy } from '@/lib/lexiverse/lexiverse-galaxy-builder'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { PlanetAction } from '@/lib/lexiverse/lexiverse-types'
import { useLexiStore } from '@/store/lexiStore'

import { LexiverseScene } from './LexiverseScene'
import { UniverseHUD } from './UniverseHUD'
import { GalaxyHUD } from './GalaxyHUD'
import { LexiverseBreadcrumb } from './LexiverseBreadcrumb'
import { GalaxySearch } from './GalaxySearch'
import { GalaxyFilter } from './GalaxyFilter'
import { ReturnToUniverseButton } from './ReturnToUniverseButton'
import { LearningStateLegend } from './LearningStateLegend'
import { WebGLFallback } from './WebGLFallback'
import { LoadingState } from './LoadingState'
import { PlanetDetailPanel } from './PlanetDetailPanel'
import { SectorPanel } from './SectorPanel'
import { SectorDetailPanel } from './SectorDetailPanel'
import { useLexiverseSlices } from './useLexiverseSlices'
import { useRecentlyMasteredIds } from './useRecentlyMasteredIds'
import { useGalaxyMastery } from './useGalaxyMastery'
import { useCrossGalaxyEchoes } from './useCrossGalaxyEchoes'
import { RecentlyMasteredRibbon } from './RecentlyMasteredRibbon'

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return true
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

async function speakWord(word: string) {
  try {
    const mod = await import('@/lib/pronunciation/pronunciation-client') as { pronunciationClient?: { speak: (w: string) => void } }
    if (mod.pronunciationClient?.speak) { mod.pronunciationClient.speak(word); return }
  } catch {}
  try { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; window.speechSynthesis?.speak(u) } catch {}
}

export function LexiverseShell() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const galaxyId = searchParams.get('galaxy')
  const sectorId = searchParams.get('sector')
  const planetId = searchParams.get('planet')
  const filterSource = searchParams.get('source') ?? 'all'

  const currentGalaxy = galaxyId ? getGalaxyById(galaxyId) : null
  const currentConstellation = currentGalaxy?.constellationId
    ? getConstellationById(currentGalaxy.constellationId) : null

  // ── hooks ──────────────────────────────────────────────────────────────
  const slices = useLexiverseSlices()
  const { words: dictWords, loading: dictLoading } = useLexiverseDictionary()
  const lexiWords = useLexiStore(s => s.words)
  // STAGE D
  const masteryByGalaxyId = useGalaxyMastery(slices)
  const echoes = useCrossGalaxyEchoes(slices)

  // STAGE D · overdue word ids (nextReviewAt < now)
  const overdueWordIds = useMemo(() => {
    const now = Date.now()
    return lexiWords
      .filter(w => w.nextReviewAt != null && w.nextReviewAt < now)
      .map(w => w.id)
  }, [lexiWords])

  // detail panel: which sector card is "open" in the right slide-in
  const [detailSectorId, setDetailSectorId] = useState<string | null>(null)

  const [webglOk, setWebglOk] = useState<boolean | null>(null)
  useEffect(() => { setWebglOk(detectWebGL()) }, [])

  const updateSearch = useCallback((patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) { if (v === null) sp.delete(k); else sp.set(k, v) }
    const q = sp.toString()
    router.replace(q ? `${pathname}?${q}` : pathname)
  }, [router, pathname, searchParams])

  const onSelectGalaxy = useCallback((id: string) => updateSearch({ galaxy: id, planet: null, sector: null }), [updateSearch])
  const onSelectPlanet = useCallback((id: string | null) => updateSearch({ planet: id }), [updateSearch])
  const onReturnToUniverse = useCallback(() => updateSearch({ galaxy: null, planet: null, sector: null }), [updateSearch])
  const onFocusSector = useCallback((id: string | null) => {
    updateSearch({ sector: id, planet: null })
    setDetailSectorId(null)
  }, [updateSearch])
  const onOpenSectorDetail = useCallback((id: string) => setDetailSectorId(id), [])
  const onChangeFilter = useCallback((v: string) => updateSearch({ source: v === 'all' ? null : v }), [updateSearch])
  const onReplay = useCallback((gid: string, pid: string) => updateSearch({ galaxy: gid, planet: pid }), [updateSearch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (planetId) onSelectPlanet(null)
      else if (sectorId) onFocusSector(null)
      else if (galaxyId) onReturnToUniverse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [planetId, sectorId, galaxyId, onSelectPlanet, onFocusSector, onReturnToUniverse])

  const visibleGalaxies = useMemo(() => {
    if (filterSource === 'all') return GALAXIES
    return GALAXIES.filter(g => g.sourceType === filterSource)
  }, [filterSource])

  const builtGalaxy = useMemo(() => {
    if (!currentGalaxy || dictWords.length === 0) return null
    return buildGalaxy(currentGalaxy, dictWords)
  }, [currentGalaxy, dictWords])

  const recentlyMasteredIds = useRecentlyMasteredIds(builtGalaxy, slices)

  // sector detail panel support
  const detailSector = useMemo(() =>
    detailSectorId ? (builtGalaxy?.sectors.find(s => s.id === detailSectorId) ?? null) : null,
    [detailSectorId, builtGalaxy],
  )
  const featuredWords = useMemo(() =>
    detailSectorId && builtGalaxy
      ? builtGalaxy.planets
          .filter(p => p.sectorId === detailSectorId)
          .slice(0, 8)
          .map(p => p.word)
      : [],
    [detailSectorId, builtGalaxy],
  )

  // resolver for the ribbon to look up planet meta
  const resolveRibbonEntry = useCallback((pid: string) => {
    if (!builtGalaxy) return null
    const p = builtGalaxy.planets.find(p => p.id === pid)
    if (!p) return null
    return { word: p.word, galaxyId: builtGalaxy.meta.id, color: p.color }
  }, [builtGalaxy])

  const selectedPlanet = useMemo(() => {
    if (!planetId || !builtGalaxy) return null
    const raw = builtGalaxy.planets.find(p => p.id === planetId)
    if (!raw) return null
    return { ...raw, learningState: resolveLearningState({ wordId: raw.wordId, normalizedWord: raw.normalizedWord, slices }) }
  }, [planetId, builtGalaxy, slices])

  const isPlanetInReview = useMemo(() => {
    if (!selectedPlanet) return false
    return lexiWords.some(w => w.id === selectedPlanet.wordId && w.nextReviewAt != null)
  }, [selectedPlanet, lexiWords])

  const galaxyProgress = useMemo(() => {
    if (!builtGalaxy) return null
    let m = 0, lr = 0, w = 0
    for (const p of builtGalaxy.planets) {
      const st = resolveLearningState({ wordId: p.wordId, normalizedWord: p.normalizedWord, slices })
      if (st === 'mastered') m++
      else if (st === 'learning' || st === 'review' || st === 'recommended') lr++
      if (st === 'weak') w++
    }
    return {
      galaxyId: builtGalaxy.meta.id,
      totalWords: builtGalaxy.planets.length,
      learnedWords: m + lr,
      reviewWords: builtGalaxy.planets.filter(p => slices.reviewWordIds.includes(p.wordId)).length,
      weakWords: w,
      masteryRatio: builtGalaxy.planets.length ? m / builtGalaxy.planets.length : 0,
    }
  }, [builtGalaxy, slices])

  const returnTo = useMemo(() => {
    const q = searchParams.toString()
    return encodeURIComponent(q ? `${pathname}?${q}` : pathname)
  }, [pathname, searchParams])

  const onPlanetAction = useCallback((action: PlanetAction) => {
    if (!selectedPlanet) return
    const p = selectedPlanet
    switch (action) {
      case 'open_word_detail':    router.push(`/word/${p.normalizedWord}`); break
      case 'open_lexigraph':      router.push(`/lexigraph?word=${p.normalizedWord}`); break
      case 'start_quiz':          router.push(`/quiz?mode=vocabulary-drill&word=${p.normalizedWord}&returnTo=${returnTo}`); break
      case 'ask_ai':              router.push(`/chat?context=word&word=${p.normalizedWord}&returnTo=${returnTo}`); break
      case 'add_to_review': {
        // 词进统一状态机再入 SRS 队列（内容字段由 hydrate 补拉）
        const lexi = useLexiStore.getState()
        if (!lexi.byId(p.wordId)) {
          lexi.addWord({ id: p.wordId, word: p.word, zh: '', source: 'lookup' })
          void lexi.hydrateMissingEntries()
        }
        lexi.addToReview(p.wordId)
        break
      }
      case 'play_pronunciation':  void speakWord(p.word); break
    }
  }, [selectedPlanet, router, returnTo])

  if (webglOk === null) return <LoadingState message="Initialising Lexiverse… / 初始化中" />
  if (!webglOk)         return <WebGLFallback />
  if (dictLoading)      return <LoadingState message="Loading dictionary… / 载入词典" />

  const isUniverse = !galaxyId

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#040407', color: '#ECFBFF',
        fontFamily: "'Space Grotesk', system-ui, sans-serif", overflow: 'hidden' }}>
      <LexiverseScene
        galaxies={visibleGalaxies}
        currentGalaxyId={galaxyId}
        selectedPlanetId={planetId}
        onSelectGalaxy={onSelectGalaxy}
        onSelectPlanet={onSelectPlanet}
        slices={slices}
        recentlyMasteredIds={recentlyMasteredIds}
        masteryByGalaxyId={masteryByGalaxyId}
        echoes={echoes}
        overdueWordIds={overdueWordIds}
        focusSectorId={sectorId}
        onFocusSector={onFocusSector}
        builtGalaxy={builtGalaxy}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 6, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <LexiverseBreadcrumb constellation={currentConstellation ?? null} galaxy={currentGalaxy ?? null} onHomeClick={onReturnToUniverse} />
        </div>
        {!isUniverse && (
          <div style={{ pointerEvents: 'auto' }}>
            <ReturnToUniverseButton onClick={onReturnToUniverse} />
          </div>
        )}
      </header>

      {isUniverse && (
        <div style={{ position: 'absolute', top: 60, right: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', zIndex: 6 }}>
          <GalaxySearch galaxies={GALAXIES} onSelect={onSelectGalaxy} />
          <GalaxyFilter value={filterSource} onChange={onChangeFilter} />
        </div>
      )}

      {/* STAGE D · recently lit ribbon (only in galaxy view) */}
      {!isUniverse && (
        <RecentlyMasteredRibbon
          recentlyMasteredIds={recentlyMasteredIds}
          resolve={resolveRibbonEntry}
          onReplay={onReplay}
        />
      )}

      {/* Sector model · sector list panel (only in galaxy view) */}
      {!isUniverse && builtGalaxy && builtGalaxy.sectors.length > 0 && (
        <SectorPanel
          sectors={builtGalaxy.sectors}
          detailSectorId={detailSectorId}
          onOpenDetail={onOpenSectorDetail}
          onEnterSector={onFocusSector}
        />
      )}

      {/* Sector detail slide-in panel (right side) */}
      {!isUniverse && (
        <SectorDetailPanel
          sector={detailSector}
          featuredWords={featuredWords}
          onClose={() => setDetailSectorId(null)}
          onEnterSector={onFocusSector}
        />
      )}

      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 6 }}>
        {isUniverse ? (
          <UniverseHUD
            totalGalaxies={GALAXIES.length}
            visibleGalaxies={visibleGalaxies.length}
            litWordsTotal={slices.litWords.length}
            knownWordsTotal={slices.savedWords.length}
          />
        ) : galaxyProgress && currentGalaxy ? (
          <GalaxyHUD galaxyTitle={currentGalaxy.title} galaxyTitleZh={currentGalaxy.titleZh} progress={galaxyProgress} />
        ) : null}
      </div>

      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 6 }}>
        <LearningStateLegend />
      </div>

      <PlanetDetailPanel
        open={!!selectedPlanet}
        planet={selectedPlanet}
        onClose={() => onSelectPlanet(null)}
        onAction={onPlanetAction}
        isInReview={isPlanetInReview}
      />
    </div>
  )
}
