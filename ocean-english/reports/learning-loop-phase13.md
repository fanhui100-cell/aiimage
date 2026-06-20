# Learning Loop & Diagnostics — Phase 13 Report

Date: 2026-06-21
Phase: 13 — closed learning loop (word mastery, skill state, error classification, daily plan, diagnostics)
Branch: iter5-f1
Frontend: **none** (Today/ReviewHub/Report UI wiring deferred — see §3).

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/learning-loop/error-classifier.ts` | created | 14 error types + `classifyError` from taskType/subskills/inputMode/dimension; `unknown` fallback; correct → null |
| `lib/learning-loop/word-mastery.ts` | created | Attempt → dimension (recognize/spell/listen/context/output) + suggested SRS grade + `needsReview` (respects `lib/srs`) |
| `lib/learning-loop/skill-state-updater.ts` | created | EMA (α=0.15) skill mastery + `confidence` by sample size; `weakSkills`, `aggregateSkillStates` |
| `lib/daily-plan/daily-plan-engine.ts` | created | `buildDailyPlan` → 6 card types, each with `reason` + `estimatedMinutes` |
| `app/api/daily-plan/route.ts` | created | `POST` plan cards (client word data + server v2 `skill_states`) |
| `app/api/diagnostics/route.ts` | created | `GET` word/skill/exam diagnostics (v2 when applied, else v1 partial, else empty) |
| `scripts/validate-learning-loop.ts` | created | Deterministic samples through all engines; fails if any wrong attempt yields no repair signal |
| `lib/practice/attempt-recorder.ts` | **modified** | Sets `error_type` via `classifyError`; fills word `dimension` via `dimensionForAttempt` |
| `package.json` | modified | Added `validate:learning-loop` |
| `reports/learning-loop-phase13.md` | created | This report |

**Not touched:** `store/lexiStore.ts`, `lib/srs/schedule.ts` (SRS unchanged/not removed),
`TodayBento.tsx`, `ReviewHub.tsx`, `app/report/page.tsx` (UI deferred), `DailyRecapCard.tsx`.

## 2. DB changes

**None (no schema change).** The learning-loop libs are pure; the APIs are read-only (diagnostics
reads `question_attempts` / `wrong_answers`; daily-plan reads `skill_states`). `attempt-recorder`
still writes the **existing** `question_attempts` row — it just now fills `error_type` (already a
column) via the classifier instead of leaving it null. No `--apply`, no new tables.

## 3. Frontend visible changes

**None.** Per the Phase-13 frontend rule and the "if UI approved" Modify list, no Today/ReviewHub/
Report UI was changed and **no `FRONTEND_CHANGE_NOTICE` was needed** (no UI touched). The backend +
APIs are ready to wire as a design-approved follow-up:
- Today: render each `daily-plan` card's `reason` + `estimatedMinutes`.
- ReviewHub: add a weak-skill practice surface from `/api/diagnostics` `weakSkills`.
- Report: section/subskill diagnostics with the `confidence` / `isEstimate` labels already returned.

## 4. Learning-loop sample results (`validate-learning-loop`)

- **word-mastery:** 5 sample attempts → every **incorrect** attempt produces `needsReview=true` +
  `suggestedGrade='again'`; correct → `good`. Dimensions verified (spell/listen/context). Core
  invariant holds: wrong-count === review-signal-count.
- **error-classifier:** correct → `null`; `zh_to_word_spell` wrong → `word_form`;
  `reading_comprehension`+`main_idea` → `main_idea`.
- **skill-state-updater:** a single wrong attempt moves mastery `0.5 → 0.425` (conservative, < α);
  `inference` (3 wrong) → mastery < 0.5, `confidence='low'`, `isEstimate=true`, enters weak skills.
- **EMA order invariant (Codex P1 — fixed):** EMA is order-sensitive. `/api/diagnostics` pages
  `answered_at desc` (to cap the most-recent 5000) then **`reverse()`s to chronological** (oldest→
  newest) before aggregating, so "recently improved" is not misread as weaker. Verified: a "first 5
  wrong, then 5 right" sample → **chronological mastery `0.6547` vs reversed `0.3453`** (the validator
  now asserts `chrono > reverse`, `chrono > 0.5`, `reverse < 0.5`).
- **listening_inference reachable (Codex P2 — fixed):** the listening special-case now runs **before**
  the generic subskill map, so `listening_comprehension` + `inference` → `listening_inference`
  (was wrongly `inference`); no-subskill listening → `listening_detail`. Asserted in the validator.
- **daily-plan-engine:** cards `word_review, mistake_fix, exam_task, new_words, output` — each with a
  `reason` and `estimatedMinutes > 0`; weak attempts always yield a repair card.
- **API smoke:** `POST /api/daily-plan` → `word_review/mistake_fix/new_words/output` with reasons;
  `GET /api/diagnostics` (unauthed) → `source:empty, warnings:[unauthenticated]`, HTTP 200;
  empty plan body → `warnings:[no_signals]`.

## 5. Verification results (exit codes)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm run validate:learning-loop` | ✅ exit 0 (0 errors; review-signal invariant enforced) |
| `npm run validate:practice-session` | ✅ exit 0 |
| `POST /api/daily-plan` smoke | ✅ 200, cards with reason + minutes |
| `GET /api/diagnostics` smoke (unauthed) | ✅ 200 controlled (`source:empty`) |

## 6. Remaining gaps

- **UI wiring** (Today reasons, ReviewHub weak-skill surface, Report confidence-labeled diagnostics)
  — deferred pending design approval.
- **v2-backed diagnostics** require the v2 schema applied **and** real `question_attempts` /
  `skill_states` data; until then `/api/diagnostics` returns v1-partial / empty. No diagnostics are
  fabricated without attempt data (hard-scope respected).
- **Word-level diagnostics** currently surface from `wrong_answers` count (v1) / are left to the
  client store; a v2 per-word dimension rollup (via `question_target_words`) is a follow-up.
- **Confidence discipline:** skill scores carry `confidence` + `isEstimate`; the UI must render the
  estimate label (not a precise score) when `confidence !== 'high'`.

---

> **Note (post-Phase-13):** this completes the rebuild *infrastructure* (specs → audit → v2 schema →
> session API → runner → drill → Lexiverse entry → migration → audio → mock papers → generation
> templates → subjective scoring → learning loop). Actual content production must proceed in
> controlled, dry-run-first, draft-first batches (G1–G8) with QA + Codex review + user approval per
> the handoff's generation policy — never a single "generate the whole bank" run.
