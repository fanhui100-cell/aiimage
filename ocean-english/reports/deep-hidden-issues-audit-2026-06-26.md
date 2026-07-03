# Ocean English Deep Hidden-Issues Audit

Date: 2026-06-26
Scope: project architecture, routes, core UI flows, dictionary/Lexiverse/reading/report metrics, v2 question bank state, and QA gates.

This audit was read-only for code/data. No source, schema, frontend, or database rows were changed. The only file created is this report.

## Executive Summary

I found several issues that match the pattern in the supplied screenshot: they do not crash loudly, but they can silently send users to the wrong place, show proxy data as if it were real, or hide a failed data source behind fallback content.

Most v2 question-bank infrastructure is healthy: active rows contain no retired question types, active compound-question answer shapes are valid, active listening answer positions are balanced, and the current coverage report correctly marks TOEFL blocked/missing cells instead of pretending they are ready.

The highest-priority issue is the Lexiverse word-entry path. The dictionary "Cosmos" action sends the display word, while the Lexiverse frame resolves only local-store ids and can fall back to the first galaxy. This can produce exactly the "clicked but nothing happens / wrong galaxy" behavior described in the screenshot.

## Findings

### P1-1. Lexiverse word deep-link can silently open the wrong galaxy or fail focus

Status: real bug.

Evidence:

- `components/screens/DictionaryVaultScreen.tsx` sends display text into the cosmos route:
  - `router.push(/lexiverse?word=${wordStr}...)`
- `components/lexiverse/ReferenceLexiverseFrame.tsx` resolves `?word=` by looking only in `useLexiStore.getState().words.find(w => w.id === word)`.
- The same resolver calls `galaxyForWord(entry?.galaxy)` without passing `entry?.levels` in the external focus path, then falls back to `referenceGalaxies[0]?.id`.
- Focus is later sent to the iframe as `{ type: 'lv:focus-word', wordId: focusWordRef.current }`, with no acknowledgement/error path.

Impact:

- If the URL parameter is the display word rather than the canonical id, local-store lookup misses.
- If the word exists in the DB dictionary but not in the local Zustand word list, lookup misses.
- If the word has levels but no reference-galaxy id, levels are ignored in the focus path.
- The page can land in the first galaxy and then send a focus message for a word that is not in that galaxy, producing a silent no-op.

Recommended fix:

1. Make `/lexiverse?word=` accept canonical dictionary ids only, or normalize display text to dictionary id before routing.
2. In DictionaryVault, pass `slug`/`word.id`, not `wordStr`, for the cosmos action.
3. In `ReferenceLexiverseFrame`, resolve word membership through dictionary/Lexiverse data, not only local store.
4. Call `galaxyForWord(entry?.galaxy, entry?.levels)` consistently.
5. Add an iframe acknowledgement for `lv:focus-word`; if not found, show a visible "word not in this galaxy" state instead of silent failure.

### P1-2. Lexiverse galaxy word API hides DB/query failures behind seed fallback

Status: real design bug with misleading failure mode.

Evidence:

- `app/api/lexiverse/galaxy-words/route.ts` wraps DB work in `try/catch`.
- On error or empty DB result, it falls back to seed adapters and returns normal-looking data.
- The catch block does not attach a warning, source marker, or error code.

Impact:

- A Supabase config/RLS/query failure can look like a small "valid" galaxy instead of a broken data source.
- Users and QA may see a populated scene while the real 28k-word dictionary path is not being used.
- This is similar to the "only 500 words / wrong level count" class of bugs: the product looks alive but is based on fallback data.

Recommended fix:

1. Return `source: 'db' | 'seed_fallback'` and `warnings` in the API response.
2. Only allow seed fallback for galaxies intentionally backed by seed/theme data.
3. For exam/ring/CEFR galaxies, return a controlled `db_unavailable` or `empty_pool` state instead of silent demo data.
4. Add a smoke test that fails if a DB-backed galaxy returns seed fallback without an explicit warning.

### P2-1. Dictionary default word can be stale after hydration

Status: likely UI bug.

Evidence:

- `components/screens/DictionaryVaultScreen.tsx` computes the default slug from `words`, but the default memo has an empty dependency list.
- If the Zustand store hydrates after the first render, the default can remain the hardcoded fallback rather than the intended risk-sorted word.

Impact:

- Opening `/dictionary` can show the fallback/demo word instead of the user's real highest-risk/current word.
- This is subtle because direct `/dictionary?word=...` still works.

Recommended fix:

1. Include `words` in the default-slug dependency, or compute the initial default after hydration.
2. Distinguish "store not hydrated yet" from "store empty".
3. Add a regression test: seed local store with a high-risk word, load `/dictionary`, assert that word is selected.

### P2-2. "My words" list is capped at 200 but can look like a true count

Status: misleading UI behavior.

Evidence:

- `components/screens/DictionaryVaultScreen.tsx` filters local words, sorts by risk, then `.slice(0, 200)`.
- The UI label is based on the sliced list length for the active local view.

Impact:

- For users with more than 200 local words in a folder/filter, the drawer can show only the first 200 without a clear "showing 200 of N" distinction.
- This is the same class as the screenshot's "dictionary only shows 500" problem, but local to the drawer/folder UI.

Recommended fix:

1. Track `filteredTotal` separately from displayed rows.
2. Display "showing 200 / N" and add pagination or virtualized list.
3. Keep the 200 display cap if needed for performance, but do not use it as the apparent total.

### P2-3. Several report/reading metrics are proxy estimates but can be read as real measurements

Status: design-as-built, but misleading unless labelled carefully.

Evidence:

- `lib/analytics/report.ts` uses `estimateVocab(level, masteredCount)` = level baseline + mastered count.
- `lib/analytics/report.ts` also has hardcoded `LEVEL_TOTALS`, separate from current DB/audit targets.
- `components/screens/ReadingScreen.tsx` documents `difficulty` as a proxy: `level * 11 + keyword density`, not true unknown-word rate.

Impact:

- Users may interpret "词汇量", "各档进度", or reading "难度" as measured personal ability or true article unknown-word rate.
- These are useful heuristics, but current naming can overstate their precision.

Recommended fix:

1. Rename labels to "估算词汇量", "难度代理", "词汇密度/等级难度".
2. Add `confidence` or `source` next to proxy metrics.
3. Move level totals into a single source of truth shared by dictionary audit, onboarding, report, and level-progress UI.
4. For reading, eventually compute true unknown-word rate from user word-state + article keywords.

### P2-4. Reading "review" state is device-local only

Status: design-as-built, but potentially misleading.

Evidence:

- `components/screens/ReadingScreen.tsx` stores reading results in `localStorage` key `rd-results-v1`.
- The "待复读"/review list is derived from that local storage, not user account history.

Impact:

- A logged-in user switching browser/device can lose reading review state.
- The UI may look like an account-level learning loop but is actually local-only.

Recommended fix:

1. Persist reading attempts into v2 `question_attempts` or a reading-attempt table.
2. Until then, label the review list as local-device history.
3. Add migration from local `rd-results-v1` to server history after login.

### P3-1. Ad-hoc dictionary scripts can false-fallback to the 392-word seed pool if env is not loaded

Status: test/audit hazard, not necessarily production runtime bug.

Evidence:

- `scripts/load-dotenv.ts` exports `loadDotenv()` but does not auto-run.
- A direct `npx tsx` dictionary query without calling `loadDotenv()` produced:
  - `isLive: false`
  - `total: 392`
  - level counts all zero in that ad-hoc script context.
- Official scripts that need env mostly call `loadDotenv()`, but ad-hoc audits can easily forget it.

Impact:

- A developer can accidentally audit the seed fallback and believe dictionary totals/level counts are broken or fixed.
- This is not a user-facing bug by itself, but it can create false reports and bad decisions.

Recommended fix:

1. Add a shared script prelude for DB audits that always loads `.env.local`.
2. In critical audit scripts, assert `client.isLive` or expected total > 20k unless explicitly running offline.
3. Optionally make `scripts/load-dotenv.ts` auto-load when imported for side effects, or disallow side-effect import and require an explicit helper.

## Checks That Did Not Reveal A New Bug

### v2 active question-bank structural checks

Read-only Supabase checks showed:

- `question_sets`: 5623 total, 1993 active, 3630 draft.
- `question_items`: 6803 total, 3173 active, 3630 draft.
- Deprecated active task types: none.
- Active set with draft/missing active items: none found.
- Active productive item missing rubric: none found.
- Active objective item with empty answer: none found.
- Active choice answer missing from choices: none found.

### Compound question shapes

Active `banked_cloze`, `seven_select`, `para_match`, `grammar_fill`, and `cloze_passage` were checked against their v2 shapes:

- answer array lengths match the required blank/item counts;
- indices are in range;
- uniqueness constraints are respected where required;
- `para_match` active sets have `qa_flags.paras`;
- no structural problem was found.

### Active listening answer-position distribution

After checking the correct v2 join (`question_sets.task_type` + `question_items.question_set_id`), active listening answers are balanced:

- lv1: 39 / 39 / 39 / 39
- lv2: 40 / 40 / 40 / 39
- lv3: 51 / 49 / 50 / 50
- lv4: 39 / 39 / 39 / 39

So no action is needed for active listening answer-position normalization at this time.

### Route existence

A static scan of internal `href`/`router.push` targets did not reveal obvious missing top-level routes. One dynamic `/lexiverse${...}` pattern appears in the scan but is a valid template route, not a missing route.

### Current qbank coverage report

`reports/qbank-v2-coverage-audit.md` currently reports:

- `MISSING 2`
- `THIN 0`
- `READY_ACTIVE 38`
- `BLOCKED 5`

The remaining missing/blocked cells are TOEFL-specific and are correctly not hidden:

- missing: TOEFL `choose_a_response`, TOEFL `listening_comprehension`;
- blocked: TOEFL `read_daily_life`, `reading_comprehension`, `build_a_sentence`, `listen_and_repeat`, `interview_speaking`.

## Recommended Next Work Order For CC

1. Fix Lexiverse word deep-link resolution first.
   - It is the closest match to the screenshot's concrete bug.
   - Add route/API/iframe acknowledgement tests.

2. Add explicit `source`/`warnings` to `/api/lexiverse/galaxy-words`.
   - Prevent seed fallback from pretending to be DB-backed content.

3. Fix DictionaryVault default hydration and 200-row count display.
   - These are small but user-visible.

4. Rename/provenance-label proxy metrics in reading/report UI.
   - No algorithm change required initially; just make the meaning honest.

5. Move reading review history from local-only toward account-backed storage, or label it as local.

6. Harden developer audit scripts against env fallback.
   - This prevents future false positives/false greens during data QA.

