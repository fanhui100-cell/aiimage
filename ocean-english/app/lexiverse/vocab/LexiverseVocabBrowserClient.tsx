'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import {
  LIQUID,
  LiquidActionButton,
  LiquidBadge,
  LiquidGlassCard,
  LiquidGlassPanel,
  LiquidSegmentedControl,
} from '@/components/lexiverse/liquid-ui'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { useLexiverseSlices } from '@/components/lexiverse/useLexiverseSlices'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { FilterableWord } from '@/lib/lexiverse/lexiverse-word-filter'
import type { PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'
import { useLearningStore } from '@/store/learningStore'
import type { DictionaryDefinition, DictionaryExample, DictionaryWord } from '@/lib/dictionary/dictionary-types'

type FilterKey = 'cefr' | 'pos' | 'exam' | 'theme' | 'state'
type Filters = Record<FilterKey, Set<string>>
type VocabWord = FilterableWord & Partial<Pick<DictionaryWord,
  'phoneticIpa' | 'partOfSpeech' | 'definitions' | 'examples' | 'synonyms' | 'antonyms' | 'collocations' | 'tags'
>>

const EMPTY_FILTERS: Filters = {
  cefr: new Set(),
  pos: new Set(),
  exam: new Set(),
  theme: new Set(),
  state: new Set(),
}

const STATE_COLORS: Record<PlanetLearningState, string> = {
  mastered: '#7EF9FF',
  recommended: '#FFD66B',
  learning: '#38BDF8',
  review: '#FFA85A',
  weak: '#FF8FA8',
  unknown: '#9FB6C6',
  locked: '#52617A',
}

const STATE_LABELS: Record<PlanetLearningState, string> = {
  mastered: 'Mastered',
  recommended: 'Recommended',
  learning: 'Learning',
  review: 'Review',
  weak: 'Weak',
  unknown: 'Unknown',
  locked: 'Locked',
}

export function LexiverseVocabBrowserClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { words: rawWords, loading, error } = useLexiverseDictionary()
  const words = rawWords as VocabWord[]
  const slices = useLexiverseSlices()
  const addToReview = useLearningStore(s => s.addToReview)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(() => cloneFilters(EMPTY_FILTERS))
  const [mobilePanel, setMobilePanel] = useState<'list' | 'detail'>('list')
  const [compact, setCompact] = useState(false)

  const selectedWordId = searchParams.get('word')

  const stateFor = useCallback(
    (word: FilterableWord) => resolveLearningState({ wordId: word.id, normalizedWord: word.id, slices }),
    [slices],
  )

  useEffect(() => {
    const update = () => setCompact(window.innerWidth < 980)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const updateWordParam = useCallback((wordId: string, opts?: { replace?: boolean }) => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('word', wordId)
    const url = `${pathname}?${sp.toString()}`
    if (opts?.replace) router.replace(url)
    else router.push(url)
  }, [router, pathname, searchParams])

  const facets = useMemo(() => {
    const cefr = unique(words.map(w => w.cefrLevel).filter(Boolean) as string[])
    const pos = unique(words.map(w => normalizePos(w.partOfSpeech)).filter(Boolean) as string[])
    const exam = unique(words.flatMap(w => w.examTags ?? []))
    const theme = unique(words.flatMap(w => [...(w.themeTags ?? []), ...(w.domainTags ?? [])]))
    return { cefr, pos, exam, theme }
  }, [words])

  const filteredWords = useMemo(() => {
    const q = query.trim().toLowerCase()
    return words.filter(word => {
      const state = stateFor(word)
      const definition = firstDefinition(word)
      const haystack = `${word.word} ${word.id} ${definition.en} ${definition.zh} ${(word.tags ?? []).join(' ')}`.toLowerCase()
      if (q && !haystack.includes(q)) return false
      if (filters.cefr.size && (!word.cefrLevel || !filters.cefr.has(word.cefrLevel))) return false
      const pos = normalizePos(word.partOfSpeech)
      if (filters.pos.size && (!pos || !filters.pos.has(pos))) return false
      if (filters.exam.size && !(word.examTags ?? []).some(tag => filters.exam.has(tag))) return false
      const wordThemes = [...(word.themeTags ?? []), ...(word.domainTags ?? [])]
      if (filters.theme.size && !wordThemes.some(tag => filters.theme.has(tag))) return false
      if (filters.state.size && !filters.state.has(state)) return false
      return true
    })
  }, [words, query, filters, stateFor])

  const selectedWord = useMemo(() => {
    if (!words.length) return null
    return words.find(w => w.id === selectedWordId) ?? filteredWords[0] ?? words[0] ?? null
  }, [words, filteredWords, selectedWordId])

  useEffect(() => {
    if (!selectedWord || selectedWordId === selectedWord.id) return
    updateWordParam(selectedWord.id, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord?.id])

  const toggleFilter = useCallback((key: FilterKey, value: string) => {
    setFilters(prev => {
      const next = cloneFilters(prev)
      if (next[key].has(value)) next[key].delete(value)
      else next[key].add(value)
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setQuery('')
    setFilters(cloneFilters(EMPTY_FILTERS))
  }, [])

  if (loading) return <LoadingState message="Loading Vocab Browser..." />
  if (error) return <EmptyFrame title="Dictionary unavailable" detail={error.message} />

  return (
    <main style={styles.page}>
      <div style={styles.space} />
      <header style={styles.topbar}>
        <div>
          <Link href="/lexiverse" style={styles.brand}>Lexiverse</Link>
          <span style={styles.sub}>Vocab Browser · 词库浏览</span>
        </div>
        <LiquidSegmentedControl
          value="vocab"
          onChange={() => undefined}
          options={[
            { value: 'vocab', label: 'VOCAB' },
            { value: 'grammar', label: 'GRAMMAR' },
            { value: 'exam', label: 'EXAM' },
            { value: 'review', label: 'REVIEW' },
          ]}
        />
      </header>

      <div style={{ ...styles.mobileTabs, display: compact ? 'block' : 'none' }}>
        <LiquidSegmentedControl
          value={mobilePanel}
          onChange={setMobilePanel}
          options={[
            { value: 'list', label: 'List' },
            { value: 'detail', label: 'Detail' },
          ]}
        />
      </div>

      <section style={{ ...styles.shell, ...(compact ? styles.shellCompact : null) }}>
        <aside style={{ ...styles.sidebar, ...(compact ? styles.compactSidebar : null), ...(compact && mobilePanel === 'detail' ? styles.mobileHidden : null) }}>
          <LiquidGlassPanel padding={16} style={styles.fullPanel}>
            <PanelTitle title="FILTERS" subtitle="筛选" />
            <FilterGroup title="CEFR" values={facets.cefr} selected={filters.cefr} onToggle={v => toggleFilter('cefr', v)} />
            <FilterGroup title="PART OF SPEECH" values={facets.pos} selected={filters.pos} onToggle={v => toggleFilter('pos', v)} />
            <FilterGroup title="EXAM" values={facets.exam} selected={filters.exam} onToggle={v => toggleFilter('exam', v)} />
            <FilterGroup title="THEME / DOMAIN" values={facets.theme} selected={filters.theme} onToggle={v => toggleFilter('theme', v)} limit={18} />
            <FilterGroup
              title="STATE"
              values={['mastered', 'learning', 'review', 'weak', 'unknown']}
              selected={filters.state}
              onToggle={v => toggleFilter('state', v)}
              colorFor={v => STATE_COLORS[v as PlanetLearningState]}
            />
            <LiquidActionButton variant="secondary" fullWidth onClick={clearFilters}>Clear filters · 清除</LiquidActionButton>
          </LiquidGlassPanel>
        </aside>

        <section style={{ ...styles.listCol, ...(compact && mobilePanel === 'detail' ? styles.mobileHidden : null) }}>
          <LiquidGlassPanel padding={16} style={styles.fullPanel}>
            <div style={styles.searchRow}>
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search word, meaning, tag..."
                style={styles.input}
              />
              <span style={styles.count}>{filteredWords.length} / {words.length} words</span>
            </div>
            <div style={styles.wordList}>
              {filteredWords.map(word => (
                <WordRow
                  key={word.id}
                  word={word}
                  selected={selectedWord?.id === word.id}
                  state={stateFor(word)}
                  onClick={() => {
                    updateWordParam(word.id)
                    setMobilePanel('detail')
                  }}
                />
              ))}
              {!filteredWords.length && <EmptyInline>No words match these filters.</EmptyInline>}
            </div>
          </LiquidGlassPanel>
        </section>

        <aside style={{ ...styles.detailCol, ...(compact && mobilePanel === 'list' ? styles.mobileHidden : null) }}>
          <LiquidGlassPanel padding={0} style={styles.fullPanel}>
            {selectedWord ? (
              <WordPreview
                word={selectedWord}
                state={stateFor(selectedWord)}
                onAddToReview={() => addToReview(selectedWord.id, selectedWord.word)}
              />
            ) : (
              <EmptyInline>Select a word to preview it.</EmptyInline>
            )}
          </LiquidGlassPanel>
        </aside>
      </section>
    </main>
  )
}

function WordRow({ word, state, selected, onClick }: {
  word: VocabWord
  state: PlanetLearningState
  selected: boolean
  onClick: () => void
}) {
  const definition = firstDefinition(word)
  const color = STATE_COLORS[state]
  return (
    <button type="button" onClick={onClick} style={{ ...styles.wordRow, borderColor: selected ? `${color}88` : 'rgba(126,249,255,0.10)' }}>
      <span style={{ ...styles.stateDot, background: color, boxShadow: `0 0 10px ${color}` }} />
      <span style={styles.wordMain}>
        <span style={styles.wordTitle}>{word.word}</span>
        <span style={styles.wordMeta}>{word.phoneticIpa ?? 'no IPA'} · {word.partOfSpeech ?? 'word'}</span>
        <span style={styles.wordDefinition}>{definition.en}</span>
      </span>
      <span style={styles.rowBadges}>
        {word.cefrLevel && <LiquidBadge size="sm" color="#7EF9FF">{word.cefrLevel}</LiquidBadge>}
        <LiquidBadge size="sm" color={color}>{STATE_LABELS[state]}</LiquidBadge>
      </span>
    </button>
  )
}

function WordPreview({ word, state, onAddToReview }: {
  word: VocabWord
  state: PlanetLearningState
  onAddToReview: () => void
}) {
  const definition = firstDefinition(word)
  const example = firstExample(word)
  const color = STATE_COLORS[state]
  return (
    <div style={styles.preview}>
      <div style={styles.previewHead}>
        <LiquidBadge color={color}>
          <span style={{ ...styles.stateDot, width: 7, height: 7, background: color }} />
          {STATE_LABELS[state]}
        </LiquidBadge>
        <Link href={`/lexiverse/word/${word.id}`} style={styles.tinyLink}>Word Detail</Link>
      </div>
      <h1 style={styles.previewWord}>{word.word}</h1>
      <div style={styles.previewIpa}>{word.phoneticIpa ?? '/-/'}</div>
      <div style={styles.badges}>
        {word.cefrLevel && <LiquidBadge color="#7EF9FF">{word.cefrLevel}</LiquidBadge>}
        {word.partOfSpeech && <LiquidBadge color="#9FB6C6">{word.partOfSpeech}</LiquidBadge>}
        {(word.examTags ?? []).map(tag => <LiquidBadge key={tag} color="#FFD66B">{tag}</LiquidBadge>)}
      </div>

      <SectionLabel>DEFINITION · 释义</SectionLabel>
      <p style={styles.defEn}>{definition.en}</p>
      {definition.zh && <p style={styles.defZh}>{definition.zh}</p>}

      {example.en && (
        <>
          <SectionLabel>EXAMPLE · 例句</SectionLabel>
          <LiquidGlassCard style={styles.exampleCard}>
            <p style={styles.exampleEn}>{highlightWord(example.en, word.word)}</p>
            {example.zh && <p style={styles.exampleZh}>{example.zh}</p>}
          </LiquidGlassCard>
        </>
      )}

      <SectionLabel>TOOLS · 操作</SectionLabel>
      <div style={styles.actions}>
        <LiquidActionButton onClick={onAddToReview} fullWidth>Add to Review</LiquidActionButton>
        <LinkButton href={`/lexiverse/quiz?word=${word.id}`}>Quiz · 练习</LinkButton>
        <LinkButton href={`/chat?context=word&word=${word.id}`}>Ask AI · 问 AI</LinkButton>
        <LinkButton href={`/lexigraph?word=${word.id}`}>LexiGraph</LinkButton>
      </div>

      <SectionLabel>RELATED · 关联</SectionLabel>
      <ChipList title="Synonyms" items={word.synonyms ?? []} color="#7EF9FF" />
      <ChipList title="Antonyms" items={word.antonyms ?? []} color="#FF8FA8" />
      <ChipList title="Tags" items={[...(word.themeTags ?? []), ...(word.domainTags ?? [])]} color="#6BE0A0" />
    </div>
  )
}

function FilterGroup({ title, values, selected, onToggle, colorFor, limit }: {
  title: string
  values: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  colorFor?: (value: string) => string
  limit?: number
}) {
  const shown = limit ? values.slice(0, limit) : values
  if (!shown.length) return null
  return (
    <div style={styles.filterGroup}>
      <PanelTitle title={title} />
      <div style={styles.filterPills}>
        {shown.map(value => {
          const active = selected.has(value)
          const color = colorFor?.(value) ?? '#7EF9FF'
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              style={{
                ...styles.filterPill,
                color: active ? color : LIQUID.textDim,
                borderColor: active ? `${color}88` : LIQUID.border,
                background: active ? `${color}20` : 'rgba(255,255,255,0.025)',
              }}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} style={styles.linkButton}>{children}</Link>
}

function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={styles.panelTitle}>
      <span>{title}</span>
      {subtitle && <em>{subtitle}</em>}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={styles.sectionLabel}>{children}</div>
}

function ChipList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items.length) return null
  return (
    <div style={styles.chipBlock}>
      <span style={styles.chipTitle}>{title}</span>
      <div style={styles.chips}>
        {items.slice(0, 10).map(item => (
          <Link key={item} href={`/lexiverse/word/${item.toLowerCase().replace(/\s+/g, '-')}`} style={{ ...styles.chip, borderColor: `${color}55`, color }}>
            {item}
          </Link>
        ))}
      </div>
    </div>
  )
}

function EmptyInline({ children }: { children: ReactNode }) {
  return <div style={styles.emptyInline}>{children}</div>
}

function EmptyFrame({ title, detail }: { title: string; detail: string }) {
  return (
    <main style={styles.page}>
      <LiquidGlassPanel style={{ width: 420, margin: '18vh auto' }}>
        <h1 style={{ fontSize: 24 }}>{title}</h1>
        <p style={{ color: LIQUID.textDim, marginTop: 10 }}>{detail}</p>
      </LiquidGlassPanel>
    </main>
  )
}

function firstDefinition(word: VocabWord) {
  const def = word.definitions?.[0] as DictionaryDefinition | undefined
  return {
    en: def?.definitionEn ?? 'No English definition available yet.',
    zh: def?.definitionZh ?? '',
  }
}

function firstExample(word: VocabWord) {
  const ex = word.examples?.[0] as DictionaryExample | undefined
  return {
    en: ex?.sentenceEn ?? '',
    zh: ex?.sentenceZh ?? '',
  }
}

function highlightWord(sentence: string, word: string) {
  const lower = sentence.toLowerCase()
  const target = word.toLowerCase()
  const idx = lower.indexOf(target)
  if (idx < 0) return sentence
  return (
    <>
      {sentence.slice(0, idx)}
      <strong style={{ color: '#7EF9FF' }}>{sentence.slice(idx, idx + word.length)}</strong>
      {sentence.slice(idx + word.length)}
    </>
  )
}

function normalizePos(pos?: string | null) {
  if (!pos) return ''
  const p = pos.toLowerCase()
  if (p.includes('noun')) return 'noun'
  if (p.includes('verb')) return 'verb'
  if (p.includes('adj')) return 'adjective'
  if (p.includes('adv')) return 'adverb'
  return p
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function cloneFilters(source: Filters): Filters {
  return {
    cefr: new Set(source.cefr),
    pos: new Set(source.pos),
    exam: new Set(source.exam),
    theme: new Set(source.theme),
    state: new Set(source.state),
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 12%, rgba(126,249,255,0.08), transparent 32%), radial-gradient(circle at 82% 72%, rgba(183,155,255,0.10), transparent 34%), #040407',
    color: '#ECFBFF',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    overflow: 'hidden',
  },
  space: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.42) 1px, transparent 1px)',
    backgroundSize: '72px 72px',
    opacity: 0.12,
    pointerEvents: 'none',
  },
  topbar: {
    position: 'relative',
    zIndex: 2,
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 22px',
  },
  brand: {
    color: '#7EF9FF',
    fontWeight: 700,
    fontSize: 18,
    textDecoration: 'none',
  },
  sub: {
    marginLeft: 12,
    color: '#6F8AA0',
    fontSize: 12,
    fontFamily: "'Space Mono', monospace",
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '250px minmax(320px, 1fr) 380px',
    gap: 14,
    height: 'calc(100vh - 74px)',
    padding: '0 20px 20px',
  },
  shellCompact: {
    gridTemplateColumns: 'minmax(0, 1fr)',
    height: 'calc(100vh - 118px)',
  },
  sidebar: { minHeight: 0 },
  compactSidebar: { display: 'none' },
  listCol: { minHeight: 0 },
  detailCol: { minHeight: 0 },
  fullPanel: { height: '100%', display: 'flex', flexDirection: 'column' },
  panelTitle: {
    display: 'flex',
    gap: 8,
    alignItems: 'baseline',
    marginBottom: 10,
    color: 'rgba(126,249,255,0.65)',
    fontSize: 10,
    letterSpacing: '0.14em',
    fontFamily: "'Space Mono', monospace",
  },
  filterGroup: { marginBottom: 17 },
  filterPills: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  filterPill: {
    border: `1px solid ${LIQUID.border}`,
    borderRadius: 999,
    padding: '5px 9px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: "'Space Mono', monospace",
  },
  searchRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  input: {
    flex: 1,
    minWidth: 0,
    padding: '11px 13px',
    borderRadius: 11,
    border: `1px solid ${LIQUID.border}`,
    background: 'rgba(255,255,255,0.035)',
    color: '#ECFBFF',
    outline: 'none',
    fontSize: 13,
  },
  count: { color: '#6F8AA0', fontSize: 12, fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' },
  wordList: { overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 },
  wordRow: {
    display: 'grid',
    gridTemplateColumns: '12px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 10,
    padding: '10px 11px',
    border: '1px solid rgba(126,249,255,0.10)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.032)',
    color: '#ECFBFF',
    textAlign: 'left',
    cursor: 'pointer',
  },
  stateDot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  wordMain: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  wordTitle: { fontSize: 17, fontWeight: 700 },
  wordMeta: { color: '#6F8AA0', fontSize: 11, fontFamily: "'Space Mono', monospace" },
  wordDefinition: { color: '#9FB6C6', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowBadges: { display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' },
  preview: { padding: 24, overflowY: 'auto', height: '100%' },
  previewHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  tinyLink: { color: '#7EF9FF', fontSize: 12, textDecoration: 'none', fontFamily: "'Space Mono', monospace" },
  previewWord: { fontSize: 'clamp(42px, 5vw, 70px)', lineHeight: 1, margin: '16px 0 8px', letterSpacing: 0 },
  previewIpa: { color: '#7EF9FF', fontSize: 15, fontFamily: "'Space Mono', monospace" },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  sectionLabel: { margin: '24px 0 10px', color: 'rgba(126,249,255,0.58)', fontSize: 10, letterSpacing: '0.14em', fontFamily: "'Space Mono', monospace" },
  defEn: { color: '#DCEAF2', fontSize: 17, lineHeight: 1.6 },
  defZh: { color: '#8AA2B2', fontSize: 13, lineHeight: 1.6, marginTop: 5 },
  exampleCard: { borderLeft: '2px solid rgba(126,249,255,0.65)' },
  exampleEn: { color: '#DCEAF2', fontSize: 14, lineHeight: 1.6 },
  exampleZh: { color: '#8AA2B2', fontSize: 12.5, lineHeight: 1.5, marginTop: 6 },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 43,
    borderRadius: 11,
    border: `1px solid ${LIQUID.border}`,
    background: 'rgba(255,255,255,0.03)',
    color: '#CFE6F2',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
  },
  chipBlock: { marginTop: 10 },
  chipTitle: { display: 'block', color: '#6F8AA0', fontSize: 11, marginBottom: 7, fontFamily: "'Space Mono', monospace" },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  chip: { border: '1px solid', borderRadius: 8, padding: '5px 9px', background: 'rgba(255,255,255,0.028)', textDecoration: 'none', fontSize: 12 },
  emptyInline: { color: '#6F8AA0', padding: 18, fontSize: 13 },
  mobileTabs: { position: 'relative', zIndex: 2, padding: '0 20px 12px' },
  mobileHidden: { display: 'none' },
}
