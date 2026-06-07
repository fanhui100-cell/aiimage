// lib/lexiverse/lexiverse-types.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Lexiverse — canonical type contract.
//
// Three nested levels:
//   Constellation       visual region of the universe (6 regions, sets palette)
//     └ Galaxy          ~42 base + N private; one fly-in target, ~300 planets
//        └ Planet       one word, one celestial body, with a learningState
//
// All visual state derives from learningStore.savedWords / reviewWords +
// useMotivationStore.litWords (single source of truth). Galaxies and planets
// are computed views over the dictionary; the catalog is static configuration.
// ─────────────────────────────────────────────────────────────────────────

// ── Planet learning state (7 states) ──────────────────────────────────────
// MUST stay aligned with the existing /lexigraph state mapper, plus two
// new states (unknown / recommended) that the universe layer needs.
//
// Visual recipe (binding for every renderer):
//   locked       → dim, base hue muted (~32% lightness), tiny glow ember
//   unknown      → normal base hue + neutral cyan glow, no ring
//   learning     → cyan glow + soft cyan halo pulse
//   review       → orange ring around the body (overdue signal)
//   mastered     → bright stable glow at full hue, persistent label
//   weak         → soft red/pink slow pulse
//   recommended  → gold / teal highlight ring (AI / motivation surface)
export type PlanetLearningState =
  | 'locked'
  | 'unknown'
  | 'learning'
  | 'review'
  | 'mastered'
  | 'weak'
  | 'recommended'

// ── Galaxy source taxonomy ────────────────────────────────────────────────
// Drives the icon, the "where does this galaxy come from" badge in the
// detail card, and which slice of dictionary fields the filter pulls from.
//   theme    — themeTags slice (daily-life / academic / ...)
//   domain   — domainTags slice (general / education / ai-tech / ...)
//   exam     — examTags slice (CET-4 / CET-6 / IELTS / TOEFL / postgraduate / gaokao)
//   cefr     — cefrLevel slice (A1..C2)
//   private  — user-uploaded (Scan / personal collection); privateSourceId set
//   custom   — manually-curated mixed filter (escape hatch)
export type GalaxySourceType = 'theme' | 'domain' | 'exam' | 'cefr' | 'private' | 'custom'

// ── Galaxy filter — the bridge to the real dictionary ─────────────────────
// All fields are optional and AND-combined; absence means "don't constrain".
// A word belongs to the galaxy iff it matches every present constraint.
//   themeTags   — every listed theme must be present on the word
//   domainTags  — every listed domain must be present on the word
//   examTags    — at least ONE listed exam tag must match (OR within examTags)
//   cefrLevels  — word's cefrLevel must be in this set
//   difficultyLevels — word's difficultyLevel must be in this set
//   privateSourceId  — Phase E hook (Scan history / personal collection)
export interface GalaxyFilter {
  themeTags?: string[]
  domainTags?: string[]
  examTags?: string[]
  cefrLevels?: string[]
  difficultyLevels?: number[]
  privateSourceId?: string
}

// ── Visual position in universe-space (R3F units) ─────────────────────────
export interface Vec3 {
  x: number
  y: number
  z: number
}

// ── Sector — spatial cluster within a galaxy ──────────────────────────────
// Sectors are NOT separate pages. They are REGIONS of the galaxy's continuous
// 3D field. Camera navigation (not routing) moves between them.
// Camera distance drives LOD: far → SectorGlow nebula; near → full planets.
export type SectorStatus = 'active' | 'growing' | 'forming'
export interface LexiverseSector {
  id: string
  name: string
  nameZh: string
  color: string
  status: SectorStatus
  /** position relative to galaxy.visualPosition (galaxy-space) */
  center: Vec3
  /** planet scatter radius around center (units) */
  radius: number
  wordCount: number
  masteryRatio: number
  reviewWords: number
  weakWords: number
  /** one-line English description shown in the sector card and detail panel */
  blurb: string
}

// ── Constellation — visual region grouping galaxies ───────────────────────
export interface LexiverseConstellation {
  id: string
  title: string
  titleZh: string
  centroid: Vec3
  /** signature color (also the default for galaxies without colorTheme) */
  color: string
  /** very faint backdrop tint (hex8 or rgba string) */
  hullColor: string
  tagline?: string
  taglineZh?: string
}

// ── Galaxy ────────────────────────────────────────────────────────────────
// Static configuration shape — matches the contract requested in the spec.
// The dictionary is queried via `filter` at runtime to materialise planets.
export interface LexiverseGalaxy {
  id: string
  title: string
  titleZh: string
  description: string
  descriptionZh?: string
  constellationId?: string
  sourceType: GalaxySourceType
  filter: GalaxyFilter
  visualPosition: Vec3
  colorTheme?: string
  /** outer-view representation hint (how the galaxy looks from afar) */
  visualType?: 'spiral' | 'cluster' | 'wireframe' | 'nebula' | 'binary'
  /** soft cap on planets (default 300) */
  maxPlanets?: number
}

// ── Galaxy progress (derived from learning state, not stored) ─────────────
export interface GalaxyProgress {
  galaxyId: string
  totalWords: number
  learnedWords: number   // mastered + learning + review
  reviewWords: number
  weakWords: number
  masteryRatio: number   // 0..1, drives outer-view glow intensity
}

// ── Planet ────────────────────────────────────────────────────────────────
// Derived at runtime from (galaxy.id, dictionary words matching filter).
// Stable across reloads because (wordId + galaxyId) seeds the position
// + visualType deterministically.
export interface LexiversePlanet {
  id: string
  wordId: string
  word: string
  /** lowercase, hyphenated form used for routing (matches /word/[normalizedWord]) */
  normalizedWord: string
  galaxyId: string
  ipa?: string
  definition?: string
  definitionZh?: string
  example?: string
  cefrLevel?: string
  difficultyLevel?: number
  examTags?: string[]
  themeTags?: string[]
  domainTags?: string[]
  learningState: PlanetLearningState
  /** which sector cluster this planet belongs to */
  sectorId: string
  position: Vec3
  /** celestial archetype: 'gas' | 'rocky' | 'molten' | 'geodesic' | 'orb' | 'ringed' | 'galaxy' | 'crystal' | 'dwarf' */
  visualType: string
  /** hex color for archetype material and ribbon / panel display */
  color?: string
  /** 0..1 — driven by learningState; renderer uses it for halo opacity + scale */
  glowLevel: number
  /** count of adjacency edges into this planet (synonyms / collocations / scene) */
  relationCount?: number
}

// ── Planet actions — every action the detail panel can trigger ────────────
// These are the routing intents the Stage-A panel emits to props; in Stage C
// they hard-bind to real router pushes against the existing routes.
export type PlanetAction =
  | 'open_word_detail'      // → /word/[normalizedWord]
  | 'open_lexigraph'        // → /lexigraph?word=[normalizedWord]
  | 'add_to_review'         // learningStore.addToReview(wordId)
  | 'start_quiz'            // → /quiz?mode=vocabulary-drill&word=...&returnTo=...
  | 'ask_ai'                // → /chat?context=word&word=...&returnTo=...
  | 'play_pronunciation'    // pronunciationClient.speak(word)

export interface PlanetActionPayload {
  planet: LexiversePlanet
  galaxyId: string
  /** where to come back to ("returnTo" for quiz/chat URLs) */
  returnTo: string
}

// ── Built galaxy (catalog meta + materialised planet field + progress) ────
export interface BuiltGalaxy {
  meta: LexiverseGalaxy
  sectors: LexiverseSector[]
  planets: LexiversePlanet[]
  edges: { source: string; target: string }[]
  adjacency: Map<string, string[]>
  wordIds: Set<string>
  progress: GalaxyProgress
}

// ── State slices the universe reads (uniform contract) ────────────────────
export interface LexiverseStoreSlices {
  savedWords: string[]
  litWords: string[]
  reviewWordIds: string[]
  weakWordIds: string[]
  recommendedWordIds?: string[]
}

// ── Lexiverse view mode (URL state) ───────────────────────────────────────
// The /lexiverse route is single-page; the layer in view is encoded as
// ?galaxy=<id> (absent = universe view), ?sector=<id> (sector focus within galaxy).
export interface LexiverseViewState {
  galaxyId: string | null
  sectorId: string | null
  selectedPlanetId: string | null
}
