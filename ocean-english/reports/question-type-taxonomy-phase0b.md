# Question-Type Taxonomy — Phase 0B Report

Date: 2026-06-20
Phase: 0B — Taxonomy UI cleanup (frontend)
Branch: iter5-f1

## 1. Design decision

**User explicitly approved skipping Claude Design for this narrow UI cleanup**
(recorded in the handoff plan, 2026-06-20): follow the existing `/drill` and
`/quiz` design language directly — **remove** retired type cards completely,
keep concise existing empty states, and do **not** redesign the pages. No new
visual system, copy, or information architecture was introduced.

## 2. Scope recap

Stop the frontend from offering the two retired types `antonym_choice` and
`cet_cloze` in `/drill` and `/quiz`, after Phase 0A already filtered them from
the backend. No DB changes, no v2 schema, no generated-content changes, no
DeepSeek rate-limit changes.

## 3. Files changed

| File | Change |
|---|---|
| `components/screens/drill/drill-data.ts` | Removed `antonym_choice` and `cet_cloze` `TypeDef` entries from the exported visible `TYPES` (replaced with a one-line deprecation comment each). Changed kaoyan `PAPER_SPECS` cloze candidate list `['cet_cloze','cloze_passage','cloze_choice']` → `['cloze_passage','cloze_choice']`. Kept `cloze_choice`/`cloze_passage`/`synonym_choice`/`synonym_substitute`/`collocation_choice` and all Word Universe types |
| `components/screens/drill/drill-questions.ts` | Removed `cet_cloze` + `antonym_choice` from `BANK_ASK`. Removed the `cet_cloze → cloze_choice` display remap in `adapt()` (now `const type = dbType`). Added a deprecated-type guard in `adapt()` (`isDeprecatedQuestionType` → returns `null`). `buildSession()` now filters retired types from the requested list; if a request is entirely retired after filtering it returns `[]` so the existing empty state shows |
| `components/screens/drill/DrillScreen.tsx` | `loadLast()` now strips retired types from a persisted `localStorage` config, so the “上次配方 · 一键重开” resume cannot restart an `antonym_choice` / `cet_cloze` run. Added the taxonomy import. No layout / navigation / visual changes |
| `components/quiz/LexiverseQuizClient.tsx` | Removed `antonym_choice` from `PType`, `TYPE_LABEL`, and `DIM_OF`. Removed `antonym_choice` + `cet_cloze` from `BANK_ASK`. Changed `DRILL_TYPE_MAP.synant` `['synonym_choice','antonym_choice']` → `['synonym_choice','synonym_substitute']`. `mapBankRow()` returns `null` for `antonym_choice`; the `cet_cloze → cloze_choice` remap is kept **legacy-only** with an explanatory comment; `ask` now reads `BANK_ASK[type]` so legacy `cet_cloze` rows still show the correct prompt |
| `scripts/validate-question-type-taxonomy.ts` | Added Phase 0B checks: fails if visible `TYPES` (drill-data) contains `antonym_choice`/`cet_cloze`; if drill-data `PAPER_SPECS` section candidate arrays contain them; if `LexiverseQuizClient.tsx` `DRILL_TYPE_MAP` block contains them (the `mapBankRow()` legacy-only `cet_cloze` path is intentionally excluded via block-scoped text scan) |
| `reports/question-type-taxonomy-phase0b.md` | This report |

**Not changed:** `components/screens/drill/MockExam.tsx` — its cloze section
source is derived from `drill-data` via `sectionType()`/`TYPE_BY_KEY`. With
`cet_cloze` removed from the kaoyan candidate list, `sectionType('kaoyan')`
resolves to `cloze_passage` (39 in-bank at lv5) and the picker shows
`篇章完形` as the source. It can never display `cet_cloze` now, so no code
edit was required. The `RECIPES` presets in `DrillScreen.tsx` never referenced
retired types, so they were left untouched.

## 4. Database changes

**None.** No SQL, no row insert/update/delete. This phase is frontend-only.

## 5. Frontend visible changes implemented

- `/drill` type picker no longer shows the `反义词` (antonym_choice) card or the
  `完形填空` (cet_cloze) card. Remaining read-family cards (`篇章完形`,
  `选词填空`, `段落匹配`, `七选五`, `阅读理解`) and recognize-family cards stay.
- `/drill` kaoyan mock paper no longer lists `cet_cloze`; its cloze source shows
  `篇章完形`.
- `/drill` “上次配方” resume silently drops any retired types from an old saved
  config.
- `/quiz` no longer advertises `antonym_choice`; the `synant` exam-practice
  mapping now uses `synonym_choice` + `synonym_substitute`.
- Empty states: existing `该考试暂无可用题` / `题库建设中` copy retained; no new
  empty-state UI was needed because removed cards simply disappear and
  `buildSession()` returns `[]` (existing empty handling) for an all-retired
  request.

## 6. Confirmations

- **Retired types are no longer startable from `/drill`:** removed from visible
  `TYPES` (picker/family-select source), removed from `PAPER_SPECS`, filtered in
  `loadLast()` (resume) and in `buildSession()` (request guard), and `adapt()`
  drops any deprecated row.
- **`/quiz` default flows no longer advertise retired types:** `PType`,
  `TYPE_LABEL`, `DIM_OF`, `BANK_ASK`, and `DRILL_TYPE_MAP` are clean;
  `mapBankRow()` rejects `antonym_choice`.

## 7. Verification command results

| Command | Result |
|---|---|
| `npm run validate:question-types` | **pass** — `taxonomy ok`, errors: 0 (drill visible types: 24, drill paper specs: 7) |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npm run lint` | **pass** — exit 0 |
| `npx tsx scripts/backend-regression.test.ts` | **pass** — exit 0 (AI provider mock notices only, unrelated) |

## 8. Browser smoke results

Dev server (existing instance, port 3137) rendered both routes; assertions ran
against the returned HTML.

| Check | Result |
|---|---|
| `/drill` shows `反义词` (antonym_choice) | **0 occurrences** ✓ |
| `/drill` shows `完形填空` (cet_cloze card) | **0 occurrences** ✓ |
| `/drill` raw `antonym_choice` / `cet_cloze` strings | **0 / 0** ✓ |
| `/drill` legitimate types still present | `篇章完形`, `近义词`, `选词填空`, `易混辨析` present ✓ |
| kaoyan mock cloze uses `cet_cloze` | structurally impossible (candidate list = `['cloze_passage','cloze_choice']`; resolves to `篇章完形`) ✓ |
| `/quiz?mode=exam-practice&drill=synant&level=7` loads | HTTP 200, 26.5 KB, no application error ✓ |
| `/quiz` renders `antonym_choice` / `反义词` | **0 / 0** ✓ |

Note: smoke was performed at the SSR/HTML level (curl against the running dev
server) rather than a full Playwright interactive run; the client-only mock
picker (`surface='mock'`) was verified structurally rather than by click-through.

## 9. Legacy compatibility left in place

- `mapBankRow()` in `LexiverseQuizClient.tsx` keeps the `cet_cloze → cloze_choice`
  remap **for legacy links / old cached rows only**, with an explanatory comment.
  The backend no longer serves `cet_cloze` by default (Phase 0A), so this path is
  effectively dormant. The validation script's `DRILL_TYPE_MAP` check is
  block-scoped and intentionally allows this isolated legacy literal.

## 10. Unresolved risks

- Generation scripts still emit retired types (`scripts/gen-exam-questions.ts`,
  `scripts/gen-questions.ts`, `scripts/gen-vocab-ai.ts`, `scripts/run-gen-q.sh`).
  Out of scope for 0A/0B (no data rebuild); must be fixed before any
  question-bank generation/migration phase.
- `drill-data.ts` per-level `by[]` counts remain static display numbers (they
  still count old rows); not corrected here since Phase 0A/0B do not touch data.
  A later phase should source counts from real DB queries.
