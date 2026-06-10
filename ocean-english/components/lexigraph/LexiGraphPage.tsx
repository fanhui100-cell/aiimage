'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { LexiGraphMap } from './LexiGraphMap'
import { LexiGraphSearch } from './LexiGraphSearch'
import { LexiGraphPanel, type PanelMode } from './LexiGraphPanel'
import { LexiGraphHUD } from './LexiGraphHUD'
import { LexiGraphLegend } from './LexiGraphLegend'
import { LexiGraphRelationFilter, type RelationFilter } from './LexiGraphRelationFilter'
import { LumiCompanion } from '@/components/companion/LumiCompanion'
import { buildLexiGraphModel } from '@/lib/lexigraph/lexigraph-data-mapper'
import { useLexiStore } from '@/store/lexiStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { LexiGraphModel, LexiGraphNode } from '@/types/lexigraph'

const DEFAULT_WORD = 'accept'

// Non-word node types — clicking these skips corpus lookup
const NON_WORD_TYPES = new Set(['collocation', 'etymology', 'scene', 'exam', 'example'])

export function LexiGraphPage() {
  const searchParams = useSearchParams()
  const initialWord = searchParams.get('word') ?? DEFAULT_WORD

  const [centerWord, setCenterWord] = useState(initialWord)
  const [model, setModel] = useState<LexiGraphModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [panelWord, setPanelWord] = useState<DictionaryWord | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode>('loading')
  const [notInCorpusWord, setNotInCorpusWord] = useState<string | undefined>()
  const [waveActive, setWaveActive] = useState(false)
  const [activeFilter, setActiveFilter] = useState<RelationFilter>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load word on mount and whenever the URL ?word= param changes (e.g. client-side navigation)
  useEffect(() => {
    void loadCenterWord(initialWord)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWord])

  async function fetchWord(slug: string): Promise<DictionaryWord | null> {
    try {
      const res = await fetch(`/api/dictionary/word/${encodeURIComponent(slug.toLowerCase().trim())}`)
      if (!res.ok) return null
      const json = (await res.json()) as { ok: boolean; data?: DictionaryWord }
      return json.data ?? null
    } catch {
      return null
    }
  }

  async function loadCenterWord(slug: string) {
    setIsLoading(true)
    setNotFound(false)

    const word = await fetchWord(slug)
    setIsLoading(false)

    if (!word) {
      setCenterWord(slug)  // keep centerWord current so the "not found" message names the right word
      setNotFound(true)
      if (!panelWord) setPanelMode('empty')
      return
    }

    // Read store state at call time — avoids stale closure without deps
    const lexi = useLexiStore.getState()
    const mStore = useMotivationStore.getState()
    const slices = {
      savedWords: lexi.words.filter(w => w.saved).map(w => w.id),
      reviewWordIds: lexi.words.filter(w => w.nextReviewAt != null).map(w => w.id),
      weakWordIds: lexi.words.filter(w => w.state === 'weak').map(w => w.id),
      litWords: mStore.litWords,
    }

    const m = buildLexiGraphModel(word, slices)
    setModel(m)
    setPanelWord(word)
    setPanelMode('detail')
    setActiveNodeId(m.nodes.find(n => n.type === 'core')?.id ?? null)
    setCenterWord(slug)

    // Update recent searches (deduplicated, newest first, max 5)
    setRecentSearches(prev => [word.word, ...prev.filter(s => s !== word.word)].slice(0, 5))

    try {
      const mStore = useMotivationStore.getState()
      // recordGraphSearch first — it deduplicates via litWords, which lightUpWordNode updates next
      mStore.recordGraphSearch(word.id)
      mStore.lightUpWordNode(word.id)
    } catch {}
  }

  async function handleSearch(query: string) {
    await loadCenterWord(query)
  }

  async function handleNodeClick(node: LexiGraphNode) {
    setActiveNodeId(node.id)

    if (node.type === 'core') {
      if (model) {
        setPanelWord(model.centerDetail)
        setPanelMode('detail')
      }
      return
    }

    // Non-word nodes — show "not in corpus" immediately
    if (NON_WORD_TYPES.has(node.type)) {
      setNotInCorpusWord(node.word)
      setPanelMode('not-in-corpus')
      return
    }

    // Synonym / antonym — attempt corpus lookup
    const word = await fetchWord(node.word)
    if (word) {
      await loadCenterWord(node.word)
    } else {
      setNotInCorpusWord(node.word)
      setPanelMode('not-in-corpus')
    }
  }

  function handleSynonymClick(syn: string) {
    void loadCenterWord(syn.toLowerCase().replace(/\s+/g, '-'))
  }

  function handlePronunciationPlayed() {
    setWaveActive(true)
    setTimeout(() => setWaveActive(false), 1700)
  }

  return (
    <AppShell>
      <div
        style={{
          height: '100vh',
          paddingTop: '64px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Sub-header ─────────────────────────────────────────────────────── */}
        <div style={{
          height: '52px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'rgba(5,9,15,0.92)',
          backdropFilter: 'blur(12px)',
        }}>
          <div>
            <span style={{
              fontSize: '15px', fontWeight: 700, color: 'var(--teal)',
              letterSpacing: '0.06em', fontFamily: 'var(--font-mono)',
            }}>
              LexiGraph
            </span>
            <span style={{
              marginLeft: '10px', fontSize: '11px', color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              词汇星图 · 探索单词关系与记忆
            </span>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Link
              href="/dictionary"
              style={{ fontSize: '12px', color: 'var(--teal-deep)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
            >
              ← 词汇根系
            </Link>
            {panelWord && (
              <Link
                href={`/word/${panelWord.id}`}
                style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
              >
                ↗ 完整词条
              </Link>
            )}
          </div>
        </div>

        {/* ── Main content row ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Graph area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
            {/* Search + recent searches */}
            <div style={{ position: 'absolute', top: '14px', left: '18px', zIndex: 10 }}>
              <LexiGraphSearch
                onSearch={handleSearch}
                isLoading={isLoading}
                notFound={notFound}
                currentWord={centerWord}
              />
              {recentSearches.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', maxWidth: '280px' }}>
                  {recentSearches.map(w => (
                    <button
                      key={w}
                      onClick={() => void loadCenterWord(w)}
                      style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px',
                        fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        background: w === centerWord ? 'rgba(79,230,206,0.14)' : 'rgba(5,9,15,0.75)',
                        border: `1px solid ${w === centerWord ? 'rgba(79,230,206,0.45)' : 'rgba(79,230,206,0.18)'}`,
                        color: w === centerWord ? 'var(--teal)' : 'var(--text-muted)',
                        backdropFilter: 'blur(6px)',
                        lineHeight: 1.5,
                      }}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Legend + Relation Filter */}
            {model && (
              <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <LexiGraphLegend />
                <LexiGraphRelationFilter value={activeFilter} onChange={setActiveFilter} />
              </div>
            )}

            {/* SVG graph */}
            <div style={{ width: '100%', height: '100%' }}>
              {model ? (
                <LexiGraphMap
                  model={model}
                  activeNodeId={activeNodeId}
                  onNodeClick={handleNodeClick}
                  waveActive={waveActive}
                  activeFilter={activeFilter}
                />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: 'var(--teal)', fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {isLoading ? '加载星图中…' : '输入单词开始探索'}
                </div>
              )}
            </div>
          </div>

          {/* Panel */}
          <div style={{
            width: '340px',
            flexShrink: 0,
            borderLeft: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}>
            <LexiGraphPanel
              key={panelWord?.id ?? panelMode}
              word={panelWord}
              mode={panelMode}
              notInCorpusWord={notInCorpusWord}
              onSynonymClick={handleSynonymClick}
              onPronunciationPlayed={handlePronunciationPlayed}
            />
          </div>
        </div>

        {/* ── HUD ────────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <LexiGraphHUD />
        </div>
      </div>

      {/* Lumi — fixed position, above HUD */}
      <LumiCompanion />
    </AppShell>
  )
}
