# PracticeRunner — Phase 5 Report

Date: 2026-06-20
Phase: 5 — Unified PracticeRunner (/quiz migration + premium visual)
Branch: iter5-f1
Design: implemented per Claude Design handoff `docs/design-briefs/2026-06-20-practice-runner-handoff/` (README/CONSTRAINTS/PROMPT/PREMIUM-DIFF + references).

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `components/practice/practice-types.ts` | created | Runner types (re-exports session contracts), `RunnerSession`/`QState`, `DIM_OF`/`ASK_OF`, `isDeprecatedSafe` |
| `components/practice/icons.tsx` | created | Shared primitives: `OkMark`/`NoMark`/`clozeNodes`/`HintInitials`/`Diff`/`ListenButton` |
| `components/practice/PracticeFrame.tsx` | created | `.pr-v2` shell; imports base CSS then premium overlay |
| `components/practice/PracticeRunner.tsx` | created | Orchestrator: fetch session, 5 states, attempt POST, `lexiStore` wordUpdates, keyboard |
| `components/practice/renderers/ChoiceRenderer.tsx` | created | Single choice (`<button aria-pressed>`, keyboard) |
| `components/practice/renderers/SpellRenderer.tsx` | created | Spell (one-time tolerance) + the README §7 三连修复 |
| `components/practice/renderers/ListeningRenderer.tsx` | created | Play button + question + transcript-after-answer |
| `components/practice/renderers/FreeTextRenderer.tsx` | created | Textarea, submitted, no auto-score |
| `components/practice/renderers/MultiBlankRenderer.tsx` | created | Controlled「建设中」placeholder |
| `components/practice/renderers/MatchingRenderer.tsx` | created | Controlled「建设中」placeholder |
| `components/quiz/practice-session-premium.css` | created | Premium overlay (copied) + Phase-5 token-only additions (`.prompt.muted`/`.transcript`/`.sr-only`) |
| `app/quiz/page.tsx` | modified | Map legacy params → `PracticeRunner` props; route `vs`/`yesterday`/`wrong-answer-booster` to legacy |
| `lib/practice/session-builder.ts` | modified | (a) v1 reading passage → `stimulus`; (b) allow word-universe types in `task` mode; (c) fix `mapV1Row` answerability (listening MCQ has `input_mode='listen'`) |
| `eslint.config.mjs` | modified | Ignore `docs/**` (design HTML/JSX references are not runtime code) |
| `docs/design-briefs/2026-06-20-practice-runner-handoff/**` | added | Archived design handoff for traceability |
| `reports/practice-runner-phase5.md` | created | This report |

**Kept (legacy fallback, not removed):** `components/quiz/LexiverseQuizClient.tsx`.
**Reused, not forked:** `components/quiz/practice-session.css`, `LoadingState`, `store/lexiStore`. **`/drill` untouched.**

## 2. Frontend visible changes

- `/quiz` now renders the new `PracticeRunner` for word/task/section/paper sessions, reusing the **same `.pr-v2` skeleton** plus the premium overlay (gradient hairline cards, shimmer progress, option sheen, larger result ring). Net visual language unchanged; premium overlay is additive.
- Five states implemented: **loading** (`LoadingState`), **empty** (centered `.results` + warning-driven copy + ModeSwitch), **error** (`role=alert` + retry/return), **play** (topbar/eyebrow/prompt/input/feedback/cta), **results** (animated ring + `res-stats` + wrongbook + actions).
- `multi_blank`/`matching` show a controlled 「该题型暂不可用 · 题库建设中」placeholder (`.prompt.muted`, `role=note`, text-conveyed, skip CTA) — no broken UI.
- Listening: play button + transcript shown only after answering. Free-text: collects text, marks submitted, no auto-score.

## 3. API dependencies

- `GET /api/practice/session` (Phase 4) — word/task/section/paper; v1 fallback. Deprecated types never requested/rendered (backend hard-block + frontend `isDeprecatedSafe` filter).
- `POST /api/practice/attempts` (Phase 4) — each answered question. `storage:'none'`/`not_applied` does **not** break local scoring; `wordUpdates` applied to `lexiStore` (`markCorrect`/`markWrong`/`recordDimPass`); runner never mutates the store server-side.

## 4. Old `/quiz` paths verified

| Path | Routing | Result |
|---|---|---|
| `?word=ability` | runner (word) | 200, session returns items |
| `?mode=reading-practice&level=3` | runner (task reading_comprehension) | 200, v1 items (passage stem) |
| `?mode=listening-practice&level=3` | runner (task listening_comprehension) | 200, v1 listen items (fixed) |
| `?mode=exam-practice&drill=synant&level=7` | runner (task synonym_choice) | 200, v1 items (word-universe task allowed) |
| `?word=…&vs=…` | **legacy** `LexiverseQuizClient` | 200, no error |
| `?yesterday=1` | **legacy** | 200, no error |
| `?mode=wrong-answer-booster` | **legacy** | 200, no error |

Old links never 404/crash; deprecated types never render.

## 5. Renderers status

| Renderer | Status |
|---|---|
| ChoiceRenderer | **complete** (incl. reading/listening MCQ via StemCard) |
| SpellRenderer | **complete** (one-time tolerance, Enter `stopPropagation` + IME guard + latin-only filter) |
| ListeningRenderer | **complete** (play + transcript-after) |
| FreeTextRenderer | **complete** (no auto-score; neutral submitted feedback) — v2-only, no data yet |
| MultiBlankRenderer | **controlled placeholder** (no v2 multi-blank data) |
| MatchingRenderer | **controlled placeholder** (no v2 matching data) |

## 6. Browser smoke results

Against the running dev server (SSR-level, since the runner fetches client-side):
- All 4 acceptance URLs → **HTTP 200**, no application error, PracticeRunner loading shell renders.
- 3 legacy paths (`vs`/`yesterday`/`wrong-answer-booster`) → **HTTP 200**, `LexiverseQuizClient` renders.
- Functional: the session API returns items for the exact mapped params (word=ability, reading lv3, listening lv3 after fix, synonym_choice lv7). Interactive answering/scoring is exercised via the session/attempts APIs + `validate:practice-session`; a full headless-browser click-through was not run in this environment.

## 7. Verification results (exit codes)

| Command | Result |
|---|---|
| `npm run validate:practice-session` | **pass** — word/task v1, deprecated empty, shapes valid, errors 0 |
| `npm run lint` | **pass** — exit 0 (added `docs/**` ignore for design references) |
| `npx tsc --noEmit` | **pass** — exit 0 |

## 8. Legacy fallback status

`LexiverseQuizClient` is **retained** and still serves `?word&vs` (辨析), `?yesterday=1` (昨日回顾), and `?mode=wrong-answer-booster` (错题强化). It is the fallback path until the runner covers those flows; nothing was removed.

## 9. Notes / limitations

- v1 reading passage is mapped from `audio_ref` into `stimulus.textEn` (mirrors legacy); true v2 stimuli arrive in later phases.
- `paper`/`section` and v2 renderers (free_text/multi_blank/matching) are wired but exercised only once v2 data exists.
- `exam-practice`/`drill` with multi-type keys uses the first mapped type (e.g. `synant`→`synonym_choice`); acceptable per acceptance criteria.
- Desktop two-column `.pr-rail` (premium §RAIL) intentionally **not** enabled — left as a separate later change per the handoff.
- `session-builder.ts` (Phase 4) got three small correctness touches (reading stimulus, word-universe task types, listening answerability); `validate:practice-session` and `validate:qbank-v2` semantics unchanged.

## 10. Post-review fixes (Codex)

- **P1 invalid level/count (NaN bypass):** `app/api/practice/session/route.ts` now rejects a provided `level` that is not an integer 1-7 (`invalid_level`) and a `count` that is not a positive integer (`invalid_count`) with **HTTP 400**, before the builder runs — `?level=abc`/`9`/`0` and `?count=abc` all 400 now (verified). The `/quiz` page also sanitizes `level` to `1-7` and otherwise falls back, so it never sends NaN.
- **P1 IELTS/GRE re-aliasing:** removed `IELTS: 6` / `GRE: 7` from `app/quiz/page.tsx` `EXAM_TO_LEVEL` and removed the `?? 'IELTS'` default. Unknown/IELTS/GRE exams no longer silently map to TOEFL/SAT; level falls back to `level` param → real exam level → default `3` (CET-4).
- **P2 v2 deprecated exclusion:** `tryBuildFromV2` now excludes retired `task_type` from the `question_sets` query (`not in (antonym_choice,cet_cloze)`) and post-filters results, so even if a migration mislabels a retired set `active`, examId/section/paper v2 mode can't surface it.
