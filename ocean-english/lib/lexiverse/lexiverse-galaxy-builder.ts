// lib/lexiverse/lexiverse-galaxy-builder.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage B
// Turn a galaxy's filter + the dictionary into 300 deterministic planets.
//
// Output is a BuiltGalaxy: meta + planets[] + edges[] + adjacency + progress.
// Stable across reloads — every randomised choice is keyed by
// `hash(galaxyId + ':' + wordId)`.
//
// Stage-C plugs in real learning state by calling resolveLearningState()
// AFTER buildGalaxy(). Stage-B uses 'unknown' for everything and overrides
// per-planet glow downstream.
// ─────────────────────────────────────────────────────────────────────────

import type {
  BuiltGalaxy,
  GalaxyProgress,
  LexiverseGalaxy,
  LexiversePlanet,
  PlanetLearningState,
} from './lexiverse-types'
import type { FilterableWord } from './lexiverse-word-filter'
import { resolveGalaxyWords } from './lexiverse-word-filter'

// ── tunables (mirror the prototype defaults) ─────────────────────────────
const FIELD_R = 130          // sphere-volume radius for planet placement
const MAX_PLANETS_DEFAULT = 300
const K_NEAREST = 3          // edges per planet (undirected, deduped)

// ── archetype families by category (visual grammar of the universe) ──────
const ARCH_BY_CAT = {
  noun: ['rocky', 'ringed', 'dwarf']                  as const,
  verb: ['gas', 'molten', 'orb', 'galaxy']            as const,
  adj : ['crystal', 'geodesic', 'orb']                as const,
}

// ── deterministic per-planet palette ─────────────────────────────────────
const PALETTE = [
  '#7EF9FF','#FFD66B','#FF6B6B','#FF8FD0','#B79BFF','#5FE0D6','#5B8BFF',
  '#9CFFB0','#FFA94D','#FF9E6B','#C8B8FF','#6BE0A0','#FF7EB6','#9AD8FF',
]

// ── helpers ──────────────────────────────────────────────────────────────
export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, '-')
}

// Word → category. Real DictionaryWord has `definitions[].partOfSpeech`;
// the mock + fallback path is rule-based + deterministic via hash so the
// same word always lands in the same family.
type DictWordLike = FilterableWord & {
  phoneticIpa?: string | null
  partOfSpeech?: string | null
  definitions?: { partOfSpeech?: string; definitionEn?: string; definitionZh?: string }[]
  examples?: { sentenceEn: string }[]
}
function inferCategory(word: DictWordLike): keyof typeof ARCH_BY_CAT {
  const pos = word.definitions?.[0]?.partOfSpeech?.toLowerCase()
  if (pos?.startsWith('verb')) return 'verb'
  if (pos?.startsWith('adj'))  return 'adj'
  if (pos?.startsWith('noun')) return 'noun'
  // fallback by suffix
  const w = word.word.toLowerCase()
  if (/(?:ate|ise|ize|ify)$/.test(w)) return 'verb'
  if (/(?:al|ic|ous|ive|able|less|ful)$/.test(w)) return 'adj'
  // stable spread by hash so the field doesn't lean noun-heavy
  return (['noun', 'verb', 'adj'] as const)[hashStr(w + ':cat') % 3]
}

function radiusFor(arch: string, r: () => number): number {
  switch (arch) {
    case 'galaxy':   return 2.4 + r() * 1.4
    case 'dwarf':    return 0.6 + r() * 0.5
    case 'ringed':   return 1.5 + r() * 1.2
    case 'geodesic': return 1.6 + r() * 1.8
    default:         return 1.1 + r() * 1.7
  }
}

// ── main: build a galaxy from its filter + the dictionary word list ──────
export function buildGalaxy(
  meta: LexiverseGalaxy,
  words: DictWordLike[],
): BuiltGalaxy {
  const maxPlanets = meta.maxPlanets ?? MAX_PLANETS_DEFAULT
  const matches = resolveGalaxyWords(words, meta.filter, maxPlanets)
  if (matches.length < Math.min(maxPlanets, words.length)) {
    const seen = new Set(matches.map(({ word }) => word.id))
    const supplemental = words
      .filter((word) => !seen.has(word.id))
      .sort((a, b) => hashStr(`${meta.id}:${a.id}:fill`) - hashStr(`${meta.id}:${b.id}:fill`))
      .slice(0, Math.min(maxPlanets, words.length) - matches.length)
      .map((word) => ({ word, score: 0 }))
    matches.push(...supplemental)
  }

  // ── build planets ──────────────────────────────────────────────────────
  const planets: LexiversePlanet[] = matches.map(({ word }) => {
    const seed = hashStr(meta.id + ':' + word.id)
    const r = mulberry32(seed)

    // sphere-volume position (cube-root for even density), flattened y
    const u = r(), v = r(), w = r()
    const rad = FIELD_R * Math.cbrt(0.06 + 0.94 * u)
    const theta = v * Math.PI * 2
    const phi = Math.acos(2 * w - 1)
    const x = +(rad * Math.sin(phi) * Math.cos(theta)).toFixed(2)
    const y = +(rad * Math.cos(phi) * 0.72).toFixed(2)
    const z = +(rad * Math.sin(phi) * Math.sin(theta)).toFixed(2)

    const category = inferCategory(word)
    const archChoices = ARCH_BY_CAT[category]
    const arch = archChoices[(r() * archChoices.length) | 0]
    const color = PALETTE[(r() * PALETTE.length) | 0]
    radiusFor(arch, r)

    const planet: LexiversePlanet & { breathPhase: number; breathSpeed: number; seed: number } = {
      id: `${meta.id}::${word.id}`,
      wordId: word.id,
      word: word.word,
      normalizedWord: normalizeWord(word.word),
      galaxyId: meta.id,
      ipa: word.phoneticIpa ?? undefined,
      definition: word.definitions?.[0]?.definitionEn,
      definitionZh: word.definitions?.[0]?.definitionZh,
      example: word.examples?.[0]?.sentenceEn,
      cefrLevel: word.cefrLevel,
      difficultyLevel: word.difficultyLevel ?? word.difficulty,
      examTags: word.examTags,
      themeTags: word.themeTags,
      domainTags: word.domainTags,
      learningState: 'unknown' as PlanetLearningState,
      position: { x, y, z },
      visualType: arch,
      color,
      glowLevel: 0.4,
      relationCount: 0,
      // extra (in-house) breathing keys, intentionally NOT in the public type
      breathPhase: +(r() * Math.PI * 2).toFixed(3),
      breathSpeed: +(0.5 + r() * 1.1).toFixed(3),
      seed,
    }
    return planet
  })

  // ── k-nearest edges (undirected, deduped) ──────────────────────────────
  const edges: { source: string; target: string }[] = []
  const seen = new Set<string>()
  for (let i = 0; i < planets.length; i++) {
    const a = planets[i]
    const dists: [number, number][] = []
    for (let j = 0; j < planets.length; j++) {
      if (i === j) continue
      const b = planets[j]
      const dx = a.position.x - b.position.x
      const dy = a.position.y - b.position.y
      const dz = a.position.z - b.position.z
      dists.push([dx * dx + dy * dy + dz * dz, j])
    }
    dists.sort((p, q) => p[0] - q[0])
    for (let n = 0; n < K_NEAREST && n < dists.length; n++) {
      const j = dists[n][1]
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ source: planets[i].id, target: planets[j].id })
    }
  }

  // ── adjacency (symmetric for navigation) ───────────────────────────────
  const adjacency = new Map<string, string[]>(planets.map(p => [p.id, []]))
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target)
    adjacency.get(e.target)?.push(e.source)
  }
  for (const p of planets) p.relationCount = adjacency.get(p.id)?.length ?? 0

  // ── progress (Stage-C overrides with real learning state) ──────────────
  const progress: GalaxyProgress = computeProgress(meta.id, planets)

  return {
    meta,
    planets,
    edges,
    adjacency,
    wordIds: new Set(planets.map(p => p.wordId)),
    progress,
  }
}

// ── derive progress from learning state ──────────────────────────────────
export function computeProgress(galaxyId: string, planets: LexiversePlanet[]): GalaxyProgress {
  let mastered = 0, learning = 0, review = 0, weak = 0
  for (const p of planets) {
    if (p.learningState === 'mastered') mastered++
    if (p.learningState === 'learning') learning++
    if (p.learningState === 'review')   review++
    if (p.learningState === 'weak')     weak++
  }
  const total = planets.length || 1
  return {
    galaxyId,
    totalWords: planets.length,
    learnedWords: mastered + learning + review,
    reviewWords: review,
    weakWords: weak,
    masteryRatio: mastered / total,
  }
}
