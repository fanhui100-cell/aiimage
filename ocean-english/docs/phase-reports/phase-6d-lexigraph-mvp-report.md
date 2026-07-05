# Phase 6D — LexiGraph MVP + Motivation Hooks Report

**Date:** 2026-06-02
**Branch:** feat/lexiocean-phase1
**Status:** Complete

---

## 1. Phase 6D Goals

- Add `/lexigraph` as a new, parallel vocabulary knowledge-map page (does not replace `/dictionary` or `/word/[slug]`).
- Render 20–28 word nodes in a deterministic 2D SVG radial graph.
- Right-side Holographic LexiLab panel with full `DictionaryWord` detail and all learning actions.
- Lightweight Motivation Hooks store (LexiStar, litNodeCount, reviewActionCount).
- Lumi Companion shell in bottom-right (CSS-animated glowing orb, hover/click).
- Bottom HUD: Nodes Lit · Review Queue · LexiStar · Streak · Level XP.
- Entry links from `/dictionary` and `/word/[slug]`.
- npm run lint ✓ / npm run build ✓.

---

## 2. Files Added

### Types
- `types/lexigraph.ts` — LexiGraphNode, LexiGraphEdge, LexiGraphModel, LexiGraphNodeInput
- `types/motivation.ts` — LexiStarReason, MotivationSnapshot

### Lib utilities
- `lib/lexigraph/lexigraph-colors.ts` — centralized edge/node/state color system
- `lib/lexigraph/lexigraph-layout.ts` — deterministic radial layout (no random seed)
- `lib/lexigraph/lexigraph-state-mapper.ts` — resolveNodeState from store slices
- `lib/lexigraph/lexigraph-data-mapper.ts` — DictionaryWord → LexiGraphModel mapper

### Store
- `store/useMotivationStore.ts` — Zustand + localStorage (key: `lexiocean-motivation-v1`)

### Components — LexiGraph
- `components/lexigraph/LexiGraphEdge.tsx` — SVG edge line
- `components/lexigraph/LexiGraphNode.tsx` — SVG node circle + label + state ring
- `components/lexigraph/LexiGraphMap.tsx` — SVG canvas, hover tracking, edge/node rendering
- `components/lexigraph/LexiGraphSearch.tsx` — search input with not-found indicator
- `components/lexigraph/LexiGraphPanel.tsx` — right-side word detail + all learning actions
- `components/lexigraph/LexiGraphHUD.tsx` — bottom stats strip
- `components/lexigraph/LexiGraphLegend.tsx` — toggleable color legend
- `components/lexigraph/LexiGraphPage.tsx` — main client page component

### Components — Companion
- `components/companion/LumiBubble.tsx` — Lumi popup bubble with stats + quick actions
- `components/companion/LumiCompanion.tsx` — Lumi glowing orb (CSS-only, no Three.js)

### Route
- `app/lexigraph/page.tsx` — server shell with Suspense boundary + metadata

### Docs
- `docs/phase-reports/phase-6d-lexigraph-mvp-report.md` — this file

---

## 3. Files Modified

| File | Change |
|---|---|
| `app/globals.css` | Added 3 keyframes (lexiPulse, lexiGlow, lumiFloat) + 4 lumiOrbit keyframes + CSS classes |
| `app/dictionary/page.tsx` | Added "✦ Open in LexiGraph" Link button in page header |
| `app/word/[slug]/WordDetailClient.tsx` | Added "✦ LexiGraph" Link button in action buttons area |

---

## 4. LexiGraph Route Structure

```
/lexigraph                → default center word: "accept"
/lexigraph?word=<slug>    → opens that word as center node
```

Page layout (desktop):
- Fixed Navbar (AppShell)
- Sub-header (LexiGraph title + back to dictionary + full detail link)
- Flex row: Graph area (flex: 1) | LexiLab Panel (340px)
- HUD strip (52px, bottom of flex column)
- Lumi (fixed position, above HUD)

---

## 5. Graph Data Model

**Node types:** core · synonym · antonym · collocation · etymology · scene · exam · example

**Node states:** unknown · learning · review · mastered · weak · recommended

**State priority:** mastered (litWords) > weak (wrongAnswers) > review (reviewWords) > learning (savedWords) > unknown

**Layout:** Deterministic radial, no random seed.
- Layer 1 (r=148): synonym · antonym · collocation
- Layer 2 (r=256): etymology · scene · exam · example
- Max nodes: 28 (core + up to 27 satellites)

**Edges:** stroke-opacity driven by strength. Dashed lines for etymology/scene.

---

## 6. Dictionary Integration

- Client component calls `GET /api/dictionary/word/[slug]` (already existed in Phase 6C).
- Lookup chain: CoreSeedAdapter → MockDictionaryAdapter → 404.
- On 404: search box shows "Not found", panel stays showing previous word (or 'empty').
- Satellite node click: synonym/antonym types → attempt corpus lookup → switch center or show 'not-in-corpus'. Collocation/etymology/scene/exam/example types → immediately show 'not-in-corpus' panel (they are not standalone dictionary words).

---

## 7. Learning Actions Integration

| Action | Implementation | LexiStar |
|---|---|---|
| Play Pronunciation | `PronunciationButton` (browser TTS, already built) | — |
| Add to Review | `useLearningStore().addToReview` + `completeTaskUnit` + `markStudyToday` + `incrementXp(10)` | +8 |
| Quiz this word | `router.push('/quiz?word=...')` | +5 |
| Ask AI | `POST /api/ai/word-explain` (same as WordDetailClient) | — |
| Open Full Detail | `Link href="/word/[id]"` | — |

---

## 8. Motivation Hooks

**Store:** `useMotivationStore` — Zustand + localStorage (key: `lexiocean-motivation-v1`, version: 1)

**Persisted fields:** lexiStar · litNodeCount · reviewActionCount · lastCompanionMessage · litWords[] · reviewedWords[]

**Anti-farming:** per-reason cooldown (5 seconds, in-memory Map, resets on page load). litWords and reviewedWords deduplicate across sessions.

**LexiStar rules:**
- Add to Review: +8 (per slug, with cooldown)
- Quiz this word: +5 (with cooldown)
- Open word in graph (lightUpWordNode): tracked in litNodeCount

**Safety:** all Motivation store calls in `LexiGraphPanel` are wrapped in try/catch — errors never propagate to learning actions.

---

## 9. Lumi Companion Shell

**Implementation:** Pure CSS, no Three.js, no canvas.

- Floating 52×52px orb: `radial-gradient` + CSS `box-shadow` + `lumiFloat` keyframe.
- 4 orbit particle `<span>` elements with `lumiOrbit0–3` keyframes (different radii: 20–32px, durations: 4–7s).
- Inner nucleus: small white dot with glow.
- Hover: box-shadow doubles, "Need help?" tooltip appears.
- Click: toggles `LumiBubble` (stats + quick actions + last companion message).
- Messages driven by `useMotivationStore().lastCompanionMessage`.
- respects `prefers-reduced-motion` via existing globals.css rule.

---

## 10. LocalStorage / Zustand Impact

| Store | Key | Change |
|---|---|---|
| `useLearningStore` | `lexiocean-learning` | No change — read-only from LexiGraph (no schema modification) |
| `useMotivationStore` | `lexiocean-motivation-v1` | **New** — independent key, no collision |

---

## 11. Phase 5 Compatibility

- `CloudSyncProvider` wraps LexiGraph page via AppShell — sync continues to function.
- `useLearningStore` schema unchanged — migration version unchanged.
- No new Supabase tables or RLS policies added.
- No user-uploaded content is added to any word corpus.

---

## 12. Privacy / Compliance Notes

- No new data sent to any third-party service.
- Motivation data (`lexiStar`, `litWords`, etc.) stays in localStorage only.
- AI explain calls go to existing `/api/ai/word-explain` which enforces Phase 3.5 security rules.
- Dictionary data is original seed content (Phase 6B compliance declaration applies).

---

## 13. Known Limitations

1. On narrow screens (< 768px), the 340px panel causes horizontal compression of the graph area.
2. LexiGraph is not in the main Navbar — accessible only via `/dictionary` and `/word/[slug]` entry links, or direct URL.
3. Satellite words that are not in the seed/mock corpus show "not in corpus" panel — no AI explanation in this phase.
4. Motivation store `streak` is not synced from `learningStore.studyProgress.currentStreak` — HUD reads learning store streak directly.
5. No Phase 6E+ multi-hop graph expansion.

## 13a. P2 Fixes Applied (post-review)

The following issues identified in the Phase 6D review were fixed before final acceptance:

| Issue | Fix |
|---|---|
| URL param not re-triggering on client-side navigation | `useEffect` deps changed from `[]` to `[initialWord]` |
| "Not found" message showing stale centerWord | `setCenterWord(slug)` called in the failure branch before early return |
| Mock words misidentified as `seed` sourceType | `lexigraph-data-mapper.ts` now uses `sourceNote?.includes('Phase 6B')` instead of `sourceType === 'original'` |
| Report claimed "existing routes untouched" | Clarified: `/dictionary` and `/word/[slug]` were intentionally modified to add LexiGraph entry links (listed in section 3 of this report) |

---

## 14. Test Commands

```bash
# Lint
npm run lint

# Build
npm run build

# Smoke: verify accept loads from seed
npx tsx -e "import { getDictionaryClient } from './lib/dictionary/dictionary-client'; (async()=>{ const w = await getDictionaryClient().lookupWord('accept'); console.log(w?.word, w?.synonyms); })();"

# Verify /lexigraph route exists in build output
npm run build 2>&1 | grep lexigraph
```

---

## 15. Codex Review Checklist

- [ ] `/lexigraph` route exists and loads without 500 error
- [ ] Default word "accept" loads on first visit
- [ ] Search for "vivid" returns a graph with nodes and edges
- [ ] Search for non-existent word shows "not found", panel stays stable
- [ ] Hover on synonym node: node highlights, other edges dim
- [ ] Click synonym node in corpus → new center word loaded
- [ ] Click collocation node → "not in corpus" panel shown, graph intact
- [ ] Add to Review: word added to `useLearningStore().reviewWords`, LexiStar increases
- [ ] Quiz button navigates to `/quiz?word=...`
- [ ] Ask AI returns explanation in panel
- [ ] Full Detail link navigates to `/word/[id]`
- [ ] PronunciationButton speaks the word
- [ ] HUD shows Nodes Lit count increasing after loading words
- [ ] Lumi orb visible bottom-right with float animation
- [ ] Lumi hover shows "Need help?", click opens/closes bubble
- [ ] `/dictionary` page has "✦ Open in LexiGraph" button
- [ ] `/word/[slug]` page has "✦ LexiGraph" button in action bar
- [ ] `/dictionary` page unchanged and functional
- [ ] `/word/[slug]` page unchanged and functional
- [ ] `/quiz`, `/memory`, `/scan`, `/chat` all unchanged
- [ ] Phase 5 auth / cloud sync unaffected
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
