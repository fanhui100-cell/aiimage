# Subjective Scoring (Writing / Translation / Speaking) — Phase 12 Report

Date: 2026-06-21
Phase: 12 — rubric-based subjective scoring contracts + APIs
Branch: iter5-f1
Frontend: **none** (UI wiring is optional/deferred — see §2).

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/scoring/rubric-types.ts` | created | Dimension keys, `Rubric`, `SubjectiveScore`, `ScoreInput` contracts (always `isEstimate: true`) |
| `lib/scoring/rubrics.ts` | created | 9 reusable dimensions + 10 exam presets (zhongkao/gaokao/cet4/cet6/kaoyan/toefl) + `getRubric`/`getRubricForSection`/`sectionNeedsRubric` |
| `lib/scoring/score-engine.ts` | created | Shared rubric engine: self-contained DeepSeek (JSON) → mock fallback; deterministic mock estimate |
| `lib/scoring/score-writing.ts` | created | Writing scorer (rubric `examId:writing`) |
| `lib/scoring/score-translation.ts` | created | Translation scorer (source + target) |
| `lib/scoring/score-speaking.ts` | created | Speaking scorer (text transcript; `audioScoring: 'not_ready'`) |
| `app/api/scoring/writing/route.ts` | created | `POST` writing scoring |
| `app/api/scoring/translation/route.ts` | created | `POST` translation scoring |
| `app/api/scoring/speaking/route.ts` | created | `POST` speaking scoring (transcript only, no audio) |
| `scripts/validate-rubrics.ts` | created | Rubric completeness validator |
| `reports/subjective-scoring-phase12.md` | created | This report |
| `package.json` | modified | Added `validate:rubrics` |

**Not touched:** `components/screens/SpeakingScreen.tsx`, `app/writing/page.tsx`,
`app/api/ai/writing/route.ts`, `lib/ai/ai-rate-limit.ts` (used, not modified), PracticeRunner
renderers, DeepSeek route / global rate-limit config.

## 2. Frontend changes

**None.** Per the Phase-12 frontend rule and the Modify list ("PracticeRunner free-text/speaking
renderers only if UI has been approved"), no visible UI was changed and **no `FRONTEND_CHANGE_NOTICE`
was needed** (no UI touched). The scoring APIs are ready to wire into the PracticeRunner free-text /
speaking renderers (and the existing `/writing` page / `SpeakingScreen`) as a **separate,
design-approved** follow-up. Until then, Phase-10 `scoring.ts` continues to mark these items
`needs_manual_or_ai_scoring`.

## 3. AI provider behavior

- **Real provider:** when `DEEPSEEK_API_KEY` is set, `score-engine` makes a **self-contained**
  DeepSeek call (`response_format: json_object`, temp 0.3, 30s `AbortController` timeout) — the same
  pattern as the existing `/api/ai/writing`. It does **not** import or alter the DeepSeek provider /
  global rate-limit route.
- **Mock fallback:** if the key is missing, the call fails, **the AI response is malformed**, or the
  caller forces it (`?mock=1` or `{mock:true}`), it returns a **deterministic mock estimate** with
  `provider: 'mock'` and a `warnings` entry (`mock_estimate` / `provider_not_configured` /
  `provider_unavailable_fallback`).
- **Strict dimension validation (Codex P1 — fixed):** the AI's `dimensions` are parsed by a shared
  pure function `parseRubricDimensions(rubric, dims)` that **only accepts keys belonging to the
  rubric**, requires `Number.isFinite(band)` (NaN never silently becomes 0), requires a **non-empty
  comment**, and requires **every** rubric dimension to be covered — otherwise it returns `null` and
  the engine **falls back to mock** (so a response like `[{key:"not_a_real_dimension",band:5}]` no
  longer counts as a "DeepSeek success"). `validate:rubrics` includes fixtures asserting unknown key
  / missing dimension / empty comment / NaN band all → `null`.
- **Exam-id normalization (Codex P2 — fixed):** all three routes run `normalizeExamId()` so aliases
  like `CET-4` resolve to `cet4`; `ielts`/`gre`/unknown stay unresolved → no rubric → `404`. Verified:
  `{examId:"CET-4"}` → 200, `{examId:"ielts"}` → 404.
- **Always an estimate:** every response carries `isEstimate: true` and a `disclaimer` ("练习估分…
  非官方分数") — never claims an official score.
- Verified live (mock): writing `cet4` → `overall 60.42/106` with per-dimension awarded/max;
  translation `cet4` → `64.2/107`; speaking `toefl` → `audioScoring: not_ready`,
  `transcriptUsed: true`.

## 4. Cost / rate safety

- **Conservative in-route rate limit:** each route uses `checkRateLimit` with its **own** key
  (`scoring-writing` / `scoring-translation` / `scoring-speaking`) at **5 req/min/IP** — defined in
  route code, **not** added to the shared `RATE_LIMITS` and **not** touching the DeepSeek global
  rate-limit route. (`429 rate_limited` when exceeded.)
- **No unlimited endpoint:** every request is rate-limited, length-capped (`text` 5–4000 chars,
  `sourceText` ≤2000), and the AI call has a 30s timeout.
- **No-cost path:** without a key, scoring runs entirely on the mock estimate (no external calls).
- **No raw audio:** the speaking route accepts **text transcript only**; any `audio` field is
  ignored, the response reports `audioStorage: 'none'`, and audio scoring is `not_ready`. No
  microphone audio is received or stored.
- **SAT excluded:** no writing/speaking rubric for SAT → `POST /api/scoring/writing {examId:sat}`
  returns `404 no_writing_rubric`.

## 5. Verification results (exit codes)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npm run validate:rubrics` | ✅ exit 0 (10 rubrics, **12 subjective sections all covered**, 0 errors) |
| `POST /api/scoring/writing?mock=1` | ✅ 200, structured estimate (`provider:mock`, dimensions, disclaimer) |
| `POST /api/scoring/translation?mock=1` | ✅ 200, estimate |
| `POST /api/scoring/speaking?mock=1` | ✅ 200, `audioScoring:not_ready`, `audioStorage:none`, audio field ignored |
| `POST /api/scoring/writing {examId:sat}` | ✅ 404 (`no_writing_rubric`) |
| `POST /api/scoring/writing {text:"hi"}` | ✅ 400 (`text_too_short`) |
| `POST /api/scoring/speaking {no transcript}` | ✅ 400 |

`validate-rubrics` also confirms: every productive (writing/translation/speaking) ExamSpec section
resolves to a rubric; SAT has **no** productive section and **no** rubric; every rubric dimension has
zh/en labels, a `description`, a `scale`, band descriptors, and weights summing to 1.

## 6. Notes / deferred

- **UI wiring** (PracticeRunner free-text/speaking → these APIs; surfacing the estimate + dimension
  feedback) is a design-approved follow-up.
- **Audio scoring** (transcription + pronunciation/fluency from real audio) is `not_ready`; speaking
  is scored from a text transcript this phase.
- **Per-section full score:** rubrics use a nominal `fullScore` per (exam, skill); where a skill has
  two sections with different points (e.g. gaokao applied 15 vs continuation 25), the estimate scales
  to the rubric nominal and notes it — exact per-task scaling can be added when the UI passes the
  section's points.
