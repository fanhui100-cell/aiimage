# Question-Type Taxonomy — Phase 0A Report

Date: 2026-06-20
Phase: 0A — Taxonomy baseline, backend only
Branch: iter5-f1

## 1. Goal recap

Establish a single, reliable question-type taxonomy and stop deprecated types
(`antonym_choice`, `cet_cloze`) from leaking into backend default pools, mock
papers, and exam-task pools — **without** deleting any `question_bank` data and
**without** changing any visible frontend. Produce a `FRONTEND_CHANGE_NOTICE`
for Phase 0B.

## 2. Current classification table

| Group | Types | Treatment |
|---|---|---|
| Word Universe practice | `en_to_zh`, `zh_to_en`, `def_to_word`, `cloze_choice`, `cloze_spell`, `zh_to_word_spell`, `word_form`, `listen_to_meaning`, `dictation_spell`, `synonym_choice`, `synonym_substitute`, `collocation_choice`, `confusable_choice` | Stay visible in word-learning loop; **not** real exam task types |
| Exam task | `reading_comprehension`, `listening_comprehension`, `banked_cloze`, `seven_select`, `para_match`, `cloze_passage`, `grammar_fill` | Real exam structure; selectable |
| Deprecated | `antonym_choice`, `cet_cloze` | Removed from default routes, recommendations, mock papers, exam-task pools. Old DB rows kept, never deleted |
| Alias-only | `definition_to_word`, `zh_definition_to_word`, `listen_to_word` | Historic naming aliases only; not exposed as selectable types. `def_to_word` is the canonical DB type for definition-to-word |

Helper API (single source of truth — `lib/question-bank/question-type-taxonomy.ts`):
`isWordUniverseType`, `isExamTaskType`, `isDeprecatedQuestionType`,
`isAliasOnlyQuestionType`, `isSelectableQuestionType`.

## 3. Files changed

| File | Type | Change |
|---|---|---|
| `lib/question-bank/question-type-taxonomy.ts` | **created** | The four type sets + 5 helper predicates. Single source of truth for type classification |
| `lib/mock-exam/paper-specs.ts` | modified | Removed `cet_cloze` from the 考研 (kaoyan) cloze section candidate list → now `['cloze_passage', 'cloze_choice']`, with `cloze_choice` marked a clearly-commented temporary fallback. Added a load-time guard (uses `isDeprecatedQuestionType`) that throws if any section ever lists a deprecated type. No `antonym_choice` anywhere |
| `app/api/mock-exam/route.ts` | modified | `pickType()` now skips any deprecated candidate type. A section with no valid (non-deprecated) pool returns empty questions with the existing `该档暂无可用题` note — no silent fallback to deprecated types |
| `app/api/questions/route.ts` | modified | (a) explicit `type=antonym_choice`/`type=cet_cloze` → HTTP 200 `{ ok: true, data: [] }`, not 500; (b) `types=` list is filtered of deprecated entries, and a list that is *only* deprecated → empty 200; (c) default random pool and word-specific queries (when no explicit `type`) exclude deprecated types via `not in (antonym_choice,cet_cloze)`; count query kept consistent with fetch query |
| `types/question-bank.ts` | modified | Added doc + inline comments: taxonomy module is the source of truth; `def_to_word` is the real DB type while `definition_to_word`/`zh_definition_to_word` are alias-only; `antonym_choice` and `cet_cloze` are deprecated for new entry points (`cet_cloze` is a DB-only historic type, not in the union). **No union members removed** (old DB rows still exist) |
| `scripts/validate-question-type-taxonomy.ts` | **created** | Fails (exit 1) if deprecated/alias/word-universe membership is wrong, or if `paper-specs.ts` section candidate types still contain `cet_cloze` or any `antonym_choice` |
| `package.json` | modified | Added `"validate:question-types": "npx tsx scripts/validate-question-type-taxonomy.ts"` |
| `reports/question-type-taxonomy-phase0a.md` | **created** | This report |

## 4. Database changes

**None.** No SQL was added or run. No row was inserted, updated, or deleted. Old
`question_bank` rows (including `antonym_choice` and `cet_cloze`) remain intact;
they are only filtered out of default/exam entry points at query time.

## 5. Frontend visible changes

**None.** No `components/**`, page component, CSS, navigation, visible label,
answer control, or layout was touched. The `/drill` and `/quiz` frontend still
reference the deprecated types as before — cleaning that up is Phase 0B and is
described in the notice below.

## 6. Backend behavior changes for deprecated types

- `/api/questions`
  - `?type=antonym_choice` / `?type=cet_cloze` → `200 { ok: true, data: [] }` (was: would query and return rows, or 500 on error).
  - `?types=a,cet_cloze,b` → deprecated entries stripped; only `a,b` queried.
  - `?types=antonym_choice` (only deprecated) → `200 { ok: true, data: [] }`.
  - default random pool and `?word=` queries (no explicit `type`) now exclude `antonym_choice`/`cet_cloze`.
- `/api/mock-exam`
  - sections never draw from deprecated candidate types; empty pool → empty section + note, never a deprecated fallback.

## 7. Verification command results

| Command | Result |
|---|---|
| `npm run validate:question-types` | **pass** — `taxonomy ok`, errors: 0 (word universe types: 13, deprecated: antonym_choice/cet_cloze, alias-only: 3, mock paper specs: 7) |
| `npx tsc --noEmit` | **pass** — exit 0, no errors |
| `npm run lint` | **pass** — exit 0, no errors |

All three are clean on Phase 0A files; no unrelated WIP failures were observed.

## 8. Unresolved risks / notes

- `cet_cloze` is a DB-only historic `type` not present in the `QuestionBankQuestionType` union; documented as deprecated. A future migration phase can decide whether to remap or retire those rows.
- The `paper-specs.ts` load-time guard throws on regression; this is intentional fail-fast for static config and is also covered by `validate:question-types`.
- 考研 cloze still uses `cloze_choice` as a temporary fallback until v2 passage-cloze sets exist (commented in `paper-specs.ts`).
- Frontend (`/drill`, `/quiz`) still surfaces the deprecated types; not changed in 0A by design. See notice below.

---

## FRONTEND_CHANGE_NOTICE

- **Routes/pages affected:**
  - `/drill` (`app/drill/page.tsx` → `components/screens/drill/DrillScreen.tsx`, `components/screens/drill/drill-data.ts`, `components/screens/drill/drill-questions.ts`)
  - `/quiz` (`app/quiz/page.tsx` → `components/quiz/LexiverseQuizClient.tsx`)

- **Existing user flow:**
  - `/drill`: the type picker lists a `反义词` (`antonym_choice`) card under the 识记·选择 family and a `完形填空` (`cet_cloze`) card under the 阅读·篇章 family (both from `drill-data.ts` `TYPES`). The 考研 mock-paper spec in `drill-data.ts` `PAPER_SPECS` lists `cet_cloze` as the first cloze candidate. Users can pick these and start a practice/mock run.
  - `/quiz`: `LexiverseQuizClient` accepts `antonym_choice` in its `PType` union, shows it in `synant` skill mapping and `BANK_ASK` prompts, and maps `cet_cloze → cloze_choice` in `mapBankRow`.

- **Proposed user flow:**
  - `反义词`/`antonym_choice` and `完形填空`/`cet_cloze` are removed (or visibly marked deprecated and disabled) from the `/drill` type picker so users cannot start a run against a deprecated type.
  - 考研 mock-paper cloze in the frontend mirror (`drill-data.ts PAPER_SPECS`) drops `cet_cloze`, matching backend `paper-specs.ts` (`['cloze_passage', 'cloze_choice']`).
  - `/quiz` keeps backward-compatible URLs but no longer advertises deprecated types; deprecated mappings are removed from default exam-practice flows. The existing `cet_cloze → cloze_choice` compatibility remap may stay only for legacy links (decision for Phase 0B).
  - If filtering leaves an exam task with no valid active pool, show an empty state (e.g. `题库建设中`) instead of a broken/empty picker.

- **Visible UI changes:**
  - Two practice-type cards disappear (or become disabled "deprecated" chips) in `/drill`.
  - The 考研 mock paper no longer offers the deprecated cloze candidate.
  - Possible new empty-state copy where a task's pool is now empty after filtering.

- **Components likely touched:**
  - `components/screens/drill/drill-data.ts` (`TYPES`, `PAPER_SPECS`)
  - `components/screens/drill/DrillScreen.tsx` (picker rendering / availability)
  - `components/screens/drill/drill-questions.ts` (`BANK_ASK`, `adapt` remap)
  - `components/quiz/LexiverseQuizClient.tsx` (`PType`, `DRILL_TYPE_MAP`/`synant`, `BANK_ASK`, `mapBankRow`)

- **Data/API dependencies:**
  - `GET /api/questions` and `GET /api/mock-exam` already filter deprecated types after Phase 0A; the frontend should align so it never *requests* a deprecated type and gracefully handles empty pools (`{ ok: true, data: [] }`).

- **Empty/loading/error states:**
  - Need an explicit empty state when an exam task/section returns `data: []` after deprecated filtering (today some pickers assume a non-empty pool).
  - Loading/error states unchanged otherwise.

- **Accessibility/responsive concerns:**
  - If cards become disabled chips rather than removed, ensure disabled state is conveyed non-visually (aria-disabled, not color-only) and remains usable on mobile tab bar widths.

- **Acceptance criteria:**
  - `/drill` no longer lets a user start `antonym_choice` or `cet_cloze`.
  - 考研 mock paper cloze uses `cloze_passage` (fallback `cloze_choice`), never `cet_cloze`.
  - `/quiz` legacy URLs still load; no deprecated type is offered in default flows.
  - Any task/section with an empty post-filter pool shows a clear "building / unavailable" state, not a blank or crashing picker.
  - Playwright/browser smoke check of `/drill` and `/quiz` passes after implementation.

**Phase 0B is paused here.** Per the Mandatory Frontend Design Gate, this notice
should go to Claude Design before any `/drill` or `/quiz` UI is implemented;
alternatively the user may explicitly approve "follow existing design and
implement" if a design pass is unnecessary.
