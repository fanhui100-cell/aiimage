# Practice Session API — Phase 4 Report

Date: 2026-06-20
Phase: 4 — Unified Practice Session API (backend only)
Branch: iter5-f1

## 1. Goal recap

Backend APIs that build practice sessions for `word` / `task` / `section` /
`paper` modes and record attempts, **keeping `/api/questions` untouched**, with
v1 fallback, controlled empty pools, and graceful attempt handling. No visible
frontend change; no DeepSeek rate-limit change.

## 2. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/practice/session-types.ts` | created | Contracts: `BuildPracticeSessionInput`, `PracticeItem`, `PracticeSessionResponse`, `RecordAttemptInput`, `RecordAttemptResponse`, word/skill suggestion types |
| `lib/practice/session-builder.ts` | created | `buildPracticeSession(db, input)` — v2-first detection + v1 fallback + empty-pool handling |
| `lib/practice/attempt-recorder.ts` | created | `recordAttempt(db, userId, input)` — graceful v2 write / `not_applied`, derives word + skill suggestions |
| `app/api/practice/session/route.ts` | created | `POST` + `GET` (query-param smoke); 400 on invalid input, 200 on empty |
| `app/api/practice/attempts/route.ts` | created | `POST`; 400 on missing question ref, 200 otherwise |
| `scripts/validate-practice-session.ts` | created | Drives the builder directly (service role): word / task / deprecated / shape |
| `package.json` | modified | Added `validate:practice-session` |
| `reports/practice-session-api-phase4.md` | created | This report |

## 3. DB changes

**None.** The session builder only reads `question_bank` (v1). Attempts are
written only when the v2 `question_attempts` table exists **and** a user is
authenticated **and** the attempt has a `questionItemId`; none of those hold yet
(v2 schema unapplied), so no rows are written. `/api/questions` and
`/api/mock-exam` are unchanged.

## 4. v1 fallback

- v1 抽题复用`lib/question-bank/question-api-utils`（`questionTypeAliases` /
  `normalizeQuestionTypeForClient`）+ taxonomy 的退役过滤，**不改 `/api/questions`**.
- Level filtering uses `theme_tags: lvN` (same as `/api/mock-exam`). The
  `exam_tags` column is effectively empty across `question_bank`, so it is **not**
  used for level/exam filtering — that was the cause of an early empty-pool bug,
  now fixed.
- Mode mapping (v1):
  - `word` — by `normalized_word`/`word_id`, all non-deprecated types.
  - `task` — `taskType` (or objective types inferred from `examId` via
    `lib/exam-specs`) at `level`. Productive task types (writing/translation/
    speaking) have no v1 pool → `no_v1_pool_for_task`.
  - `section` — objective task types of that section spec at the exam level.
  - `paper` — iterate the spec's sections, draw a few per section (capped 50),
    tagging each item's `setId` with the section id; warns `v1_paper_approximation`.
- **Deprecated types never returned:** `antonym_choice` / `cet_cloze` are dropped
  from any requested type list; a request for only a deprecated type returns
  `source:'empty'` with `deprecated_type`.

## 5. v2 readiness

- `buildPracticeSession` probes `question_items`; if the v2 tables exist and have
  active data it builds from v2 (sets → items → stimuli → active audio → target
  words), otherwise it returns `[]` and the builder falls back to v1.
- v2 schema is **unapplied** (Phase 3), so the v2 path currently short-circuits at
  the availability probe and v1 is always used. The v2 code path is implemented
  for when the schema is applied + populated (Phase 8+), but is not exercised by
  this phase's verification.
- `source` input: `'auto'` (default, v2→v1), `'v1'` (force v1), `'v2'` (force v2;
  empty → `v2_unavailable_or_empty`).
- A deprecated `taskType` short-circuits to an empty pool **before** the v2/v1
  branch, so the v2 path can never surface a deprecated type even once populated.

## 6. Auth / attempt behavior

- `POST /api/practice/attempts` always returns **HTTP 200** for valid input and
  always returns derived `wordUpdates` + `skillUpdates` (so the client can update
  `lexiStore` even offline). It never mutates client state directly.
- Recording is gated: **unauthenticated** → `recorded:false`, `unauthenticated`;
  **v1-only attempt (no `questionItemId`)** → `v1_attempt_no_v2_target`;
  **v2 table missing** → `not_applied`; insert error → `attempt_insert_failed`
  (non-fatal, still 200). A row is written only when authed + table exists +
  `questionItemId` present.
- Word suggestions only include target words with role `tested_answer` /
  `tested_context`; skill suggestions key off `subskills` (or `sectionId`/
  `taskType`) with ±0.02 delta.

## 7. Empty-pool behavior

A deprecated `taskType` (`antonym_choice` / `cet_cloze`) is **hard-blocked at the
top of `buildPracticeSession` for every source** (v1/v2/auto) → `source:'empty'`,
`warnings:['deprecated_type']`, before any query runs.

Other `{ ok:true, source:'empty', items:[], warnings:[...] }` (HTTP 200) cases:
no v1 pool for a productive task (`no_v1_pool_for_task` / `no_v1_pool_for_section`),
unknown exam/section (`unknown_exam`/`unknown_section`), missing word
(`missing_word`), or genuinely empty pool (`insufficient_pool`).

Invalid input → **HTTP 400**: bad `mode`/`source`, missing required params, and
`mode='task'` without `examId` **and** without `level` (`missing_level`).

## 8. API examples tested

Against the running dev server + the direct validator:

| Call | Result |
|---|---|
| `GET /api/practice/session?mode=task&examId=cet4&taskType=reading_comprehension&level=3&count=3` | `ok:true, source:'v1'`, reading items |
| `GET …?mode=word&word=assist&count=3` | `source:'v1'`, items returned |
| `GET …?mode=task&taskType=antonym_choice&level=1` | `source:'empty'`, `warnings:['deprecated_type']` |
| `GET …?mode=bogus` | HTTP 400 |
| `POST /api/practice/attempts` (unauth, valid body) | HTTP 200, `recorded:false`, `unauthenticated`, derived word+skill updates |
| `POST /api/practice/attempts` (no question ref) | HTTP 400 |

## 9. Verification results (exit codes)

| Command | Result |
|---|---|
| `npm run validate:practice-session` | **pass** — word/task built (v1), deprecated empty, shapes valid, errors 0 (exit 0) |
| `npm run validate:question-types` | **pass** — exit 0 |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npm run lint` | **pass** — exit 0 |
| `npx tsx scripts/backend-regression.test.ts` | **pass** — exit 0 |

## 10. Known limitations

- v2 builder path is implemented but **untested** until the v2 schema is applied
  and populated; current verification only exercises v1.
- `paper` mode (v1) is an approximation: it draws objective items per section by
  level, not a true scored paper (that is `lib/papers` in a later phase).
- Attempts cannot persist for v1-only items (no `question_item_id` FK target);
  v1 attempts continue via the existing `/api/user/quiz-history` path until
  migration. No double-write is introduced here.
- `exam_tags`-based exam filtering is intentionally omitted (column is empty);
  exam scoping is via level only for now.
