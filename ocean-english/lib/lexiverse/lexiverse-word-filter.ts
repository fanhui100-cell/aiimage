// lib/lexiverse/lexiverse-word-filter.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Resolve a galaxy's `filter` against a list of dictionary words.
//
// All fields in GalaxyFilter are AND-combined. Within a multi-value field
// the rule is:
//   themeTags        — every listed tag must be present on the word (AND)
//   domainTags       — every listed tag must be present on the word (AND)
//   examTags         — at least ONE listed tag must match (OR — exams overlap)
//   cefrLevels       — word.cefrLevel must be in the listed set (OR)
//   difficultyLevels — word.difficultyLevel must be in the listed set (OR)
//   privateSourceId  — Phase E hook (Scan history)
// A 0-affinity returns `null`; matches return a 0..1 score so galaxies can
// place high-affinity words closer to centre and cap at maxPlanets.
// ─────────────────────────────────────────────────────────────────────────

import type { GalaxyFilter } from './lexiverse-types'

// Minimal duck-typed shape — matches DictionaryWord well enough that this
// file can be unit-tested without the full repo dep. The Phase 6 repo's
// DictionaryWord is a strict superset of this.
export interface FilterableWord {
  id: string
  word: string
  cefrLevel?: string
  difficulty?: number
  difficultyLevel?: number
  examTags?: string[]
  themeTags?: string[]
  domainTags?: string[]
  privateSourceId?: string
  /** P2：7 档等级标签 / 最低档 */
  levels?: number[]
  primaryLevel?: number
}

/** Returns null if the word doesn't match; else an affinity score 0..1. */
export function scoreWord(word: FilterableWord, filter: GalaxyFilter): number | null {
  let score = 0
  let dims = 0

  // ── themeTags: all listed must be present ─────────────────────────────
  if (filter.themeTags && filter.themeTags.length > 0) {
    dims++
    const wt = word.themeTags ?? []
    if (!filter.themeTags.every(t => wt.includes(t))) return null
    score += 1
  }

  // ── domainTags: all listed must be present ────────────────────────────
  if (filter.domainTags && filter.domainTags.length > 0) {
    dims++
    const wd = word.domainTags ?? []
    if (!filter.domainTags.every(t => wd.includes(t))) return null
    score += 1
  }

  // ── examTags: any listed must match (exams overlap) ───────────────────
  if (filter.examTags && filter.examTags.length > 0) {
    dims++
    const we = word.examTags ?? []
    const hits = filter.examTags.filter(t => we.includes(t)).length
    if (hits === 0) return null
    score += hits / filter.examTags.length
  }

  // ── cefrLevels: must be in set ────────────────────────────────────────
  if (filter.cefrLevels && filter.cefrLevels.length > 0) {
    dims++
    if (!word.cefrLevel || !filter.cefrLevels.includes(word.cefrLevel)) return null
    score += 1
  }

  // ── difficultyLevels: must be in set ──────────────────────────────────
  if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
    dims++
    const difficulty = word.difficultyLevel ?? word.difficulty
    if (typeof difficulty !== 'number' || !filter.difficultyLevels.includes(difficulty)) return null
    score += 1
  }

  // ── ringLevels（P2 等级星环）: primaryLevel 命中且无主题标签 ─────────
  if (filter.ringLevels && filter.ringLevels.length > 0) {
    dims++
    if (word.themeTags?.length) return null            // 有主题 → 归主题星系
    const pl = word.primaryLevel ?? (word.levels?.length ? Math.min(...word.levels) : undefined)
    if (pl == null || !filter.ringLevels.includes(pl)) return null
    score += 1
  }

  // ── privateSourceId: must match (Phase E) ─────────────────────────────
  if (filter.privateSourceId) {
    dims++
    if (word.privateSourceId !== filter.privateSourceId) return null
    score += 1
  }

  // No constraints set → galaxy matches nothing on purpose
  if (dims === 0) return null
  return score / dims
}

/**
 * Run the filter against a word list and return matches sorted by descending
 * affinity, capped at maxPlanets. Used by the galaxy builder (Stage B).
 */
export function resolveGalaxyWords<W extends FilterableWord>(
  words: W[],
  filter: GalaxyFilter,
  maxPlanets = 300,
): { word: W; score: number }[] {
  const scored: { word: W; score: number }[] = []
  for (const w of words) {
    const s = scoreWord(w, filter)
    if (s !== null && s > 0) scored.push({ word: w, score: s })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxPlanets)
}

/** Which galaxies does a given word belong to? Used by Stage D echoes. */
export function findGalaxiesForWord<W extends FilterableWord>(
  word: W,
  galaxies: { id: string; filter: GalaxyFilter }[],
): string[] {
  return galaxies.filter(g => scoreWord(word, g.filter) !== null).map(g => g.id)
}
