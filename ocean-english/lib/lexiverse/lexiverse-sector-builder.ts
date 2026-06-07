// lib/lexiverse/lexiverse-sector-builder.ts
// ─────────────────────────────────────────────────────────────────────────
// Derives spatial sector clusters from a galaxy's word list.
//
// Grouping strategy:
//   1. Non-dominant themeTags (tags that aren't the galaxy-wide filter tag)
//   2. domainTags[0] if no usable theme tags
//   3. CEFR-level bucket (advanced / intermediate / foundational) as last resort
//
// Layout: golden-angle distribution on two concentric rings (R=140 / R=210)
// for up to 6 sectors. Ring alternation gives visual depth separation.
// ─────────────────────────────────────────────────────────────────────────

import { hashStr, mulberry32 } from './lexiverse-galaxy-builder'
import type { LexiverseSector } from './lexiverse-types'

const SECTOR_PALETTE = [
  '#7EF9FF', // cyan — Lexiverse primary
  '#B79BFF', // violet
  '#5FE0D6', // aqua
  '#6BE0A0', // mint
  '#FFC861', // amber
  '#FF9E6B', // coral
]

const BLURBS: Record<string, string> = {
  academic: 'Scholarly writing, research and academic communication.',
  science: 'Scientific method, terminology and research language.',
  business: 'Professional, commercial and workplace communication.',
  technology: 'Digital, technical and computing vocabulary.',
  culture: 'Cultural references, arts, and societal expression.',
  society: 'Social dynamics, institutions and communities.',
  environment: 'Ecology, climate change and natural systems.',
  health: 'Medical, wellness and biological vocabulary.',
  arts: 'Creative disciplines, aesthetics and artistic expression.',
  politics: 'Governance, policy and political systems.',
  education: 'Learning, teaching and academic settings.',
  psychology: 'Human behaviour, cognition and emotion.',
  history: 'Historical events, periods and analysis.',
  philosophy: 'Ideas, reasoning and ethical frameworks.',
  economics: 'Markets, finance and economic theory.',
  emotion: 'Feelings, affect and interpersonal dynamics.',
  'daily-life': 'Everyday vocabulary for routine communication.',
  nature: 'The natural world, wildlife and landscapes.',
  general: 'Mixed vocabulary across multiple domains.',
  other: 'Supplemental and cross-domain vocabulary.',
  abstract: 'High-CEFR nuance: notion, premise, paradigm.',
  research: 'How studies are designed, run and reported.',
  data: 'Measurement, distribution, correlation, trends.',
  argument: 'Claims, evidence, reasoning and rhetoric.',
  advanced: 'High-CEFR nuance — precision and register.',
  intermediate: 'Core academic and professional vocabulary.',
  foundational: 'Essential everyday English for fluent communication.',
  primary: 'Core vocabulary cluster.',
  secondary: 'Extended vocabulary cluster.',
  tertiary: 'Supplemental vocabulary cluster.',
  ai: 'Artificial intelligence and machine-learning vocabulary.',
  tech: 'Digital technology and engineering terminology.',
  finance: 'Financial markets and economic analysis.',
  law: 'Legal systems and juridical vocabulary.',
  media: 'Communications, journalism and digital media.',
  travel: 'Travel, transport and cross-cultural vocabulary.',
  food: 'Food, cuisine and culinary vocabulary.',
  sport: 'Sport, fitness and competitive vocabulary.',
}

const NAMES_ZH: Record<string, string> = {
  academic: '学术', science: '科学', business: '商务', technology: '科技',
  culture: '文化', society: '社会', environment: '环境', health: '健康',
  arts: '艺术', politics: '政治', education: '教育', psychology: '心理',
  history: '历史', philosophy: '哲学', economics: '经济', emotion: '情感',
  'daily-life': '日常生活', nature: '自然', general: '综合', other: '其他',
  abstract: '抽象', research: '研究', data: '数据', argument: '论证',
  advanced: '高阶', intermediate: '中阶', foundational: '基础',
  primary: '第一区', secondary: '第二区', tertiary: '第三区',
  ai: '人工智能', tech: '科技', finance: '金融', law: '法律',
  media: '媒体', travel: '旅行', food: '饮食', sport: '体育',
}

type TaggedWord = {
  id: string
  word: string
  themeTags?: string[] | null
  domainTags?: string[] | null
  cefrLevel?: string | null
}

export interface SectorDerivation {
  sectors: LexiverseSector[]
  /** wordId → sectorId mapping, covers every word passed in */
  wordToSector: Map<string, string>
}

// Golden-angle layout — even angular spread on two rings (inner=140, outer=210)
function sectorCenter(idx: number, rng: () => number): { x: number; y: number; z: number } {
  const goldenAngle = 2.399963  // 2π / φ²
  const angle = idx * goldenAngle
  const ring = idx % 2 === 0 ? 140 : 210
  const yJitter = (rng() - 0.5) * 80
  return {
    x: +(Math.cos(angle) * ring).toFixed(1),
    y: +yJitter.toFixed(1),
    z: +(Math.sin(angle) * ring).toFixed(1),
  }
}

export function deriveSectors(galaxyId: string, words: TaggedWord[]): SectorDerivation {
  if (words.length === 0) return { sectors: [], wordToSector: new Map() }

  // Find dominant theme tag — appears in >55% of words (typically the galaxy filter tag)
  const tagFreq = new Map<string, number>()
  for (const w of words) {
    for (const t of (w.themeTags ?? [])) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1)
  }
  const dominantTag = [...tagFreq.entries()].find(([, c]) => c > words.length * 0.55)?.[0] ?? null

  // Assign each word to a group key (non-dominant tag or domain or CEFR)
  const getKey = (w: TaggedWord): string => {
    const themes = (w.themeTags ?? []).filter(Boolean) as string[]
    const nonDom = dominantTag ? themes.filter(t => t !== dominantTag) : themes
    if (nonDom.length > 0) return nonDom[0]
    const domains = (w.domainTags ?? []).filter(Boolean) as string[]
    if (domains.length > 0) return domains[0]
    const level = w.cefrLevel ?? ''
    if (level.startsWith('C')) return 'advanced'
    if (level.startsWith('B')) return 'intermediate'
    if (level.startsWith('A')) return 'foundational'
    return 'general'
  }

  const groups = new Map<string, TaggedWord[]>()
  for (const w of words) {
    const key = getKey(w)
    const g = groups.get(key) ?? []
    g.push(w)
    groups.set(key, g)
  }

  const MAX_SECTORS = 6
  const MIN_WORDS = Math.max(3, Math.floor(words.length * 0.04))

  let sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  // Merge tiny groups into a 'general' bucket
  const merged: TaggedWord[] = []
  const filtered: [string, TaggedWord[]][] = []
  for (const [key, ws] of sorted) {
    if (ws.length >= MIN_WORDS) filtered.push([key, ws])
    else merged.push(...ws)
  }
  sorted = filtered
  if (merged.length >= MIN_WORDS) sorted.push(['general', merged])
  sorted = sorted.slice(0, MAX_SECTORS)

  // Fallback: too few groups → 3-way even split
  if (sorted.length <= 1) {
    const chunk = Math.ceil(words.length / 3)
    sorted = [
      ['primary',   words.slice(0, chunk)],
      ['secondary', words.slice(chunk, chunk * 2)],
      ['tertiary',  words.slice(chunk * 2)],
    ].filter(([, ws]) => (ws as TaggedWord[]).length > 0) as [string, TaggedWord[]][]
  }

  const wordToSector = new Map<string, string>()
  const sectors: LexiverseSector[] = sorted.map(([key, ws], idx) => {
    const rng = mulberry32(hashStr(galaxyId + ':sector:' + idx))
    const center = sectorCenter(idx, rng)
    const sectorId = `${galaxyId}::sector::${key}`

    for (const w of ws) wordToSector.set(w.id, sectorId)

    const rawName = key.replace(/-/g, ' ')
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    return {
      id: sectorId,
      name,
      nameZh: NAMES_ZH[key] ?? name,
      color: SECTOR_PALETTE[idx % SECTOR_PALETTE.length],
      status: 'growing' as const,
      center,
      radius: 55 + (idx % 3) * 8,  // 55 / 63 / 71 — mild size variation
      wordCount: ws.length,
      masteryRatio: 0,
      reviewWords: 0,
      weakWords: 0,
      blurb: BLURBS[key] ?? `Vocabulary cluster — ${name.toLowerCase()}.`,
    }
  })

  return { sectors, wordToSector }
}
