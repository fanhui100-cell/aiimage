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
import type { LexiverseGalaxy, PlanetAction } from '@/lib/lexiverse/lexiverse-types'
import { useLearningStore } from '@/store/learningStore'

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
  const planetId = searchParams.get('planet')
  const filterSource = searchParams.get('source') ?? 'all'

  const currentGalaxy = galaxyId ? getGalaxyById(galaxyId) : null
  const currentConstellation = currentGalaxy?.constellationId
    ? getConstellationById(currentGalaxy.constellationId) : null

  // ── hooks ──────────────────────────────────────────────────────────────
  const slices = useLexiverseSlices()
  const { words: dictWords, loading: dictLoading } = useLexiverseDictionary()
  const addToReview = useLearningStore(s => s.addToReview)
  const reviewWords = useLearningStore(s => s.reviewWords)
  // STAGE D
  const masteryByGalaxyId = useGalaxyMastery(slices)
  const echoes = useCrossGalaxyEchoes(slices)

  // STAGE D · overdue word ids (nextReviewAt < now)
  const overdueWordIds = useMemo(() => {
    const now = Date.now()
    return (reviewWords ?? [])
      .filter(r => (r as unknown as { nextReviewAt?: number }).nextReviewAt && (r as unknown as { nextReviewAt: number }).nextReviewAt < now)
      .map(r => r.wordId)
  }, [reviewWords])

  const [webglOk, setWebglOk] = useState<boolean | null>(null)
  const [hoveredGalaxy, setHoveredGalaxy] = useState<LexiverseGalaxy | null>(null)
  useEffect(() => { setWebglOk(detectWebGL()) }, [])

  const updateSearch = useCallback((patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) { if (v === null) sp.delete(k); else sp.set(k, v) }
    const q = sp.toString()
    router.replace(q ? `${pathname}?${q}` : pathname)
  }, [router, pathname, searchParams])

  const onSelectGalaxy = useCallback((id: string) => updateSearch({ galaxy: id, planet: null }), [updateSearch])
  const onSelectPlanet = useCallback((id: string | null) => updateSearch({ planet: id }), [updateSearch])
  const onReturnToUniverse = useCallback(() => updateSearch({ galaxy: null, planet: null }), [updateSearch])
  const onChangeFilter = useCallback((v: string) => updateSearch({ source: v === 'all' ? null : v }), [updateSearch])
  const onReplay = useCallback((gid: string, pid: string) => updateSearch({ galaxy: gid, planet: pid }), [updateSearch])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (planetId) onSelectPlanet(null)
      else if (galaxyId) onReturnToUniverse()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [planetId, galaxyId, onSelectPlanet, onReturnToUniverse])

  const visibleGalaxies = useMemo(() => {
    if (filterSource === 'all') return GALAXIES
    return GALAXIES.filter(g => g.sourceType === filterSource)
  }, [filterSource])

  const builtGalaxy = useMemo(() => {
    if (!currentGalaxy || dictWords.length === 0) return null
    return buildGalaxy(currentGalaxy, dictWords)
  }, [currentGalaxy, dictWords])

  const onDemoPlanet = useCallback(() => {
    if (!builtGalaxy?.planets.length) return
    updateSearch({ planet: builtGalaxy.planets[0].id })
  }, [builtGalaxy, updateSearch])

  const recentlyMasteredIds = useRecentlyMasteredIds(builtGalaxy, slices)

  // resolver for the ribbon to look up planet meta
  const resolveRibbonEntry = useCallback((pid: string) => {
    if (!builtGalaxy) return null
    const p = builtGalaxy.planets.find(p => p.id === pid)
    if (!p) return null
    return { word: p.word, galaxyId: builtGalaxy.meta.id, color: builtGalaxy.meta.colorTheme ?? '#7EF9FF' }
  }, [builtGalaxy])

  const selectedPlanet = useMemo(() => {
    if (!planetId || !builtGalaxy) return null
    const raw = builtGalaxy.planets.find(p => p.id === planetId)
    if (!raw) return null
    return { ...raw, learningState: resolveLearningState({ wordId: raw.wordId, normalizedWord: raw.normalizedWord, slices }) }
  }, [planetId, builtGalaxy, slices])

  const isPlanetInReview = useMemo(() => {
    if (!selectedPlanet) return false
    return reviewWords?.some(r => r.wordId === selectedPlanet.wordId) ?? false
  }, [selectedPlanet, reviewWords])

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
      case 'add_to_review':       addToReview(p.wordId, p.word); break
      case 'play_pronunciation':  void speakWord(p.word); break
    }
  }, [selectedPlanet, router, returnTo, addToReview])

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
        onHoverGalaxy={setHoveredGalaxy}
        slices={slices}
        recentlyMasteredIds={recentlyMasteredIds}
        masteryByGalaxyId={masteryByGalaxyId}
        echoes={echoes}
        overdueWordIds={overdueWordIds}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 6, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <BrandChip />
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

      {isUniverse && (
        <GalaxyPreview galaxy={hoveredGalaxy} />
      )}

      {/* STAGE D · recently lit ribbon (only in galaxy view) */}
      {!isUniverse && (
        <RecentlyMasteredRibbon
          recentlyMasteredIds={recentlyMasteredIds}
          resolve={resolveRibbonEntry}
          onReplay={onReplay}
        />
      )}

      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 6 }}>
        {isUniverse ? (
          <UniverseHUD
            totalGalaxies={GALAXIES.length}
            visibleGalaxies={visibleGalaxies.length}
            litWordsTotal={slices.litWords.length}
            knownWordsTotal={slices.savedWords.length}
            reviewWordsTotal={slices.reviewWordIds.length}
          />
        ) : galaxyProgress && currentGalaxy ? (
          <GalaxyHUD galaxyTitle={currentGalaxy.title} galaxyTitleZh={currentGalaxy.titleZh} progress={galaxyProgress} />
        ) : null}
      </div>

      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 6 }}>
        <LearningStateLegend />
      </div>

      {!isUniverse && (
        <>
          <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 5, fontSize: 11, color: 'rgba(159,182,198,0.4)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em', pointerEvents: 'none' }}>
            drag to orbit · scroll to zoom · click a planet to fly in
          </div>
          <button
            type="button"
            onClick={onDemoPlanet}
            style={{ position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)', zIndex: 6, padding: '9px 18px', borderRadius: 22, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#04202B', background: 'linear-gradient(135deg, #7EF9FF, #38BDF8)', border: 'none', boxShadow: '0 8px 26px rgba(56,189,248,0.35)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Show me · 演示点亮一颗星
          </button>
        </>
      )}

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

function BrandChip() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 13px 7px 8px', borderRadius: 999, background: 'rgba(186,220,252,0.16)', border: '1px solid rgba(190,228,255,0.30)', backdropFilter: 'blur(24px) saturate(1.5)', WebkitBackdropFilter: 'blur(24px) saturate(1.5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 30px rgba(2,8,26,0.4)' }}>
      <span style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#BFF6FF,#7EF9FF 45%,#38BDF8)', color: '#051421', fontWeight: 700, fontSize: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        L
      </span>
      <span style={{ lineHeight: 1.05 }}>
        <b style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#F2FAFF' }}>LexiOcean</b>
        <i style={{ fontSize: 10, fontStyle: 'normal', color: '#9DB6CB', fontFamily: "'Space Mono', monospace" }}>Lexiverse · 词汇宇宙</i>
      </span>
    </div>
  )
}

function GalaxyPreview({ galaxy }: { galaxy: LexiverseGalaxy | null }) {
  if (!galaxy) return null
  const tags = [
    galaxy.sourceType,
    ...(galaxy.filter.themeTags ?? []),
    ...(galaxy.filter.domainTags ?? []),
    ...(galaxy.filter.examTags ?? []),
    ...(galaxy.filter.cefrLevels ?? []),
  ].slice(0, 5)

  return (
    <div style={{ position: 'absolute', left: 22, top: 60, width: 280, zIndex: 6, padding: 14, background: 'rgba(186,220,252,0.16)', border: '1px solid rgba(190,228,255,0.30)', borderRadius: 12, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 14px 36px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: galaxy.colorTheme ?? '#7EF9FF', boxShadow: `0 0 8px ${galaxy.colorTheme ?? '#7EF9FF'}` }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' }}>{galaxy.title}</div>
          <div style={{ fontSize: 12, color: '#9FB6C6' }}>{galaxy.titleZh}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#DCEAF2', lineHeight: 1.55, marginTop: 8 }}>{galaxy.description}</div>
      {galaxy.descriptionZh && <div style={{ fontSize: 12, color: '#8AA2B2', lineHeight: 1.55, marginTop: 4 }}>{galaxy.descriptionZh}</div>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {tags.map((tag) => (
          <span key={tag} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, color: '#7EF9FF', border: '1px solid rgba(126,249,255,0.3)', background: 'rgba(126,249,255,0.06)', fontFamily: "'Space Mono', monospace" }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
