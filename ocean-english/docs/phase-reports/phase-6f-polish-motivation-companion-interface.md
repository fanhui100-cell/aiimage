# Phase 6F — LexiGraph Polish + Motivation Lite Enhancement + Companion Interface Reserve

**Date:** 2026-06-02
**Branch:** feat/lexiocean-phase1
**Status:** Complete

---

## 1. Executive Summary

Phase 6F is complete. No 3D CatPet was implemented or globally mounted. The phase delivers:

1. **Companion Interface Reserve** — typed event bus (`lib/companion/`), bilingual message catalog, and pub/sub `emitCompanionEvent` that future CatPet / Lumi Cat can subscribe to.
2. **Motivation Lite v2** — store rewritten at `lexiocean-motivation-v2` with Daily Missions (3), Achievements (4), LexiStar Ledger, Level Progress (Lv.1–5), and 10-minute per-word anti-farming.
3. **LexiGraph Polish** — Relation Filter (All/Meaning/Usage/Memory/Exam), Recent Searches chips, upgraded HUD (level + progress bar + missions).
4. **Entry Polish** — `/dictionary` has a prominent LexiGraph entry card.
5. **Layout fix** — removed a leftover `CatPet` dynamic import with `ssr: false` that was blocking builds (not from Phase 6F, pre-existing stub).

---

## 2. Files Added

| File | Purpose |
|---|---|
| `lib/companion/companion-types.ts` | CompanionEventType, CompanionMessage, CompanionListener types |
| `lib/companion/companion-messages.ts` | Bilingual message catalog (10 categories, 20+ messages) |
| `lib/companion/companion-events.ts` | Lightweight pub/sub event bus; `emitCompanionEvent` + `onCompanionEvent` |
| `lib/motivation/motivation-types.ts` | DailyMission, LexiStarLedgerEntry, AchievementLite, MotivationSnapshotV2 |
| `lib/motivation/motivation-levels.ts` | `calculateLevel(lexiStar)` — 5 levels, progress 0..1 |
| `lib/motivation/motivation-achievements.ts` | 4 achievement definitions + `checkNewAchievements()` |
| `lib/motivation/motivation-daily-missions.ts` | 3 mission definitions + `getDefaultDailyMissions()` + `deriveMissions()` |
| `components/lexigraph/LexiGraphRelationFilter.tsx` | All / Meaning / Usage / Memory / Exam filter toggle + `FILTER_RELATIONS` map |
| `docs/phase-reports/phase-6f-polish-motivation-companion-interface.md` | This file |

---

## 3. Files Modified

| File | Change |
|---|---|
| `types/motivation.ts` | Extended `LexiStarReason` + updated `MotivationSnapshot` to v2 shape |
| `store/useMotivationStore.ts` | Full rewrite → v2 (new localStorage key, Daily Missions, Achievements, Ledger, anti-farming) |
| `components/lexigraph/LexiGraphHUD.tsx` | Level badge + progress bar + mission dots |
| `components/lexigraph/LexiGraphMap.tsx` | Accept `activeFilter` prop; apply `FILTER_RELATIONS` to edge visibility |
| `components/lexigraph/LexiGraphPage.tsx` | Add `activeFilter` state + `recentSearches` state; wire filter + chips to JSX; call `recordGraphSearch` |
| `components/lexigraph/LexiGraphPanel.tsx` | Wire `recordPronunciationPlay`, `recordQuizStart`; pass `wordId` to `addLexiStar` |
| `app/word/[slug]/WordDetailClient.tsx` | Pass `wordId` to `addLexiStar`; call `recordPronunciationPlay` |
| `app/dictionary/page.tsx` | Replace small button with full LexiGraph entry card |
| `app/layout.tsx` | **Removed** pre-existing leftover `CatPet` dynamic import with `ssr: false` (was blocking builds) |

---

## 4. Companion Interface Reserved

### Event bus (`lib/companion/companion-events.ts`)

```typescript
emitCompanionEvent(event: CompanionEventType, payload?: CompanionEventPayload): void
onCompanionEvent(event: CompanionEventType, listener: CompanionListener): () => void
```

Current events emitted from the motivation store:
| Trigger | Event |
|---|---|
| `recordGraphSearch()` | `word_opened` |
| `lightUpWordNode()` → achievement | `achievement_unlocked` |
| `markReviewAction()` → achievement | `achievement_unlocked` |
| `recordPronunciationPlay()` | `pronunciation_played` |
| `recordQuizStart()` | `quiz_started` |

**Phase 6G+ CatPet integration path:**
```typescript
// In CatPet component:
useEffect(() => {
  const unsub = onCompanionEvent('word_opened', ({ word }) => {
    catPet.reactToWordOpen(word)
  })
  return unsub
}, [])
```

No AI, no 3D, no global mount in this phase. The bus fires silently.

### Message catalog (`lib/companion/companion-messages.ts`)

10 categories, all bilingual. Used by `setCompanionMessage` calls; Lumi bubble reads `lastCompanionMessage`.

---

## 5. Motivation Lite Enhancement

### Store: `lexiocean-motivation-v2`

**V1 → V2 migration**: On first load, if `lexiocean-motivation-v1` exists, seeds `lexiStar`, `litNodeCount`, `reviewActionCount`, `litWords`, `reviewedWords` from it. Preserves prior progress.

**New state fields:**
- `pronunciationPlayCount`, `quizActionCount`, `graphSearchCount`
- `ledger: LexiStarLedgerEntry[]` (last 100 entries)
- `dailyMissionProgress: { litCount, reviewCount, pronunciationCount }` (daily, resets each day)
- `missionResetDate: string`
- `achievements: AchievementLite[]`
- `wordActionTimestamps: Record<string, number>` (anti-farming)
- `dailyCounts` (daily caps per reason)

**Anti-farming rules:**
1. Per-word + action: 10-minute window (`${wordId}:${reason}` key)
2. Global per-reason fallback (`_global:${reason}`) when no wordId passed
3. Daily caps: pronunciation max 30/day, nodeOpen max 50/day
4. Review: `reviewedWords` set — same word never re-awards

**Daily Missions (3):**
- Light up 3 word nodes → +15 LexiStar
- Add 1 word to review → +10 LexiStar
- Play pronunciation 3 times → +8 LexiStar

Progress derived from daily counters; resets at midnight.

**Achievements (4):**
- First Light: light 1 node
- Review Keeper: add 5 words to review
- Sound Seeker: 10 pronunciation plays
- Graph Explorer: open 10 unique words

**Level System:**
- Lv.1: 0–49 · Lv.2: 50–149 · Lv.3: 150–299 · Lv.4: 300–599 · Lv.5: 600+

---

## 6. LexiGraph Polish

### Relation Filter

5 filters rendered at top-right of graph area (below Legend button):
- **All** — show all edges
- **Meaning** — synonym, antonym
- **Usage** — collocation, example
- **Memory** — etymology, scene
- **Exam** — exam tag

When a filter is active, non-matching edges are dimmed (opacity 0.06). Core node always visible.

### Recent Searches

Up to 5 recent successful center words shown as clickable chips below the search box. Deduped, newest first. Current word highlighted in cyan. Clicking re-loads that word as center.

### HUD (updated)

Old: Nodes Lit · Review Queue · LexiStar · Streak · Level XP

New:
1. **Lit** — cumulative lit node count
2. **Due** — review words past due date
3. **★ LexiStar + Lv.N** — star count + level badge + 2px progress bar (% to next level)
4. **Streak** — days from learningStore
5. **X/3 Mission** — mission progress dots (green = done, dim = pending)

---

## 7. Entry Polish

### `/dictionary`

Added full LexiGraph entry card (replaces the small button):
- Title: `✦ Explore in LexiGraph / 进入词汇星图`
- Description: relationship map exploration pitch (EN + ZH)
- Navigates to `/lexigraph`

### `/word/[slug]`

The `✦ LexiGraph` button in the action bar from Phase 6D remains. No further change — it's already present and navigates to `/lexigraph?word=${word.id}`.

---

## 8. LocalStorage and Compatibility

| Key | Version | Content |
|---|---|---|
| `lexiocean-motivation-v1` | 1 | Old store — preserved, not deleted, not modified |
| `lexiocean-motivation-v2` | 1 | New store — seeded from v1 on first load |
| `lexiocean-accent-preference` | — | Unchanged (Phase 6E) |
| `lexiocean-learning` | 1 | Unchanged (learningStore) |

---

## 9. Known Limitations (Not Implemented in Phase 6F)

1. **3D CatPet** — not implemented; companion event bus provides the hook
2. **Global companion mount** — `app/layout.tsx` has no pet; LumiCompanion stays in `/lexigraph` only
3. **AI Chat Drawer** — not implemented
4. **TD particle cat** — not implemented
5. **Pet raising / feeding / skins** — not implemented
6. **Mission reward auto-award** — missions track completion but don't automatically grant the LexiStar reward on mission complete (can be added in Phase 6G)
7. **Supabase sync for motivation** — motivation data is localStorage-only
8. **Daily mission streak tracking** — missions reset daily but no streak counter for consecutive days
9. **LexiStarLedger UI** — ledger is stored but not displayed in UI yet

---

## 10. Test Commands

```bash
npm run lint     # 0 errors, 0 warnings
npm run build    # 46 routes, TypeScript clean

# Smoke: verify motivation store exports
npx tsx -e "
const src = require('fs').readFileSync('./store/useMotivationStore.ts','utf8');
console.log('v2 key:', src.includes(\"lexiocean-motivation-v2\"));
console.log('recordPronunciationPlay:', src.includes('recordPronunciationPlay'));
console.log('checkNewAchievements:', src.includes('checkNewAchievements'));
"

# Smoke: verify companion event bus
npx tsx -e "
const src = require('fs').readFileSync('./lib/companion/companion-events.ts','utf8');
console.log('emitCompanionEvent:', src.includes('emitCompanionEvent'));
console.log('onCompanionEvent:', src.includes('onCompanionEvent'));
"
```

---

## 11. Recommended Codex Review Prompt

```
Review Phase 6F implementation:

1. Companion interface: lib/companion/companion-types.ts, companion-messages.ts, companion-events.ts
   — Is the event bus type-safe? Can future CatPet subscribe cleanly?

2. Motivation store v2: store/useMotivationStore.ts
   — Anti-farming: does the 10-minute window work correctly for per-word+action keys?
   — V1 migration: does the migrate() function correctly seed from lexiocean-motivation-v1?
   — Achievement check: is checkNewAchievements called at the right points?
   — Daily mission progress: does dailyMissionProgress reset correctly on new day?

3. LexiGraph relation filter: components/lexigraph/LexiGraphRelationFilter.tsx + LexiGraphMap.tsx
   — Does FILTER_RELATIONS correctly map filter values to edge relation arrays?
   — When a filter is active, do non-matching edges dim to 0.06 opacity?

4. HUD: components/lexigraph/LexiGraphHUD.tsx
   — Does calculateLevel return correct level for lexiStar = 0, 50, 150, 300, 600?
   — Does deriveMissions return completed: true when progress >= target?

5. Entry polish: app/dictionary/page.tsx
   — Does the LexiGraph entry card link to /lexigraph?

6. app/layout.tsx
   — Confirm CatPet dynamic import is removed (it was blocking builds).

7. npm run lint + npm run build
   — Both must pass with 0 errors.
```
