# /drill Three-Surface Redesign — Phase 6 Report

Date: 2026-06-20
Phase: 6 — `/drill` redesign into three practice surfaces
Branch: iter5-f1
Design: implemented per Claude Design handoff `docs/design-briefs/2026-06-20-drill-three-surface-handoff/` (README/SPEC/CC_PROMPT + mock). Accordion-only layout; review moved to a thin entry.

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `components/screens/drill/DrillScreen.tsx` | modified | `BConfig` rewritten into 3 surfaces (`SurfaceSwitch` + `ReviewEntry` + faces); run/result machinery (`BRun`/`BResult`/`MockRun`) unchanged; exports `DrillConfig`/`DrillMode` types |
| `components/screens/drill/DrillShared.tsx` | modified | Added icons `planet`/`layers`/`cone`/`wrench`/`arrowright`/`chev` to `Ic` (additive) |
| `components/screens/drill/drill-phase6.css` | created | Design overlay (from `redesign.css`): `lx-reviewentry` / `lx-surfacesw.v2` / `lx-es-*` accordion / `lx-empty` / `lx-toast` |
| `components/drill/exam-task-data.ts` | created | `deriveTaskState`/`bestTask`/`deriveSectionState` + `SKILL_META`/`taskLabel`/`GROUP_MODE_ZH`, wired to `lib/exam-specs` + `drill-data.typeCount` + taxonomy |
| `components/drill/DrillEmptyState.tsx` | created | Unified empty state: `build`/`plan`/`exam` |
| `components/drill/ExamTaskPicker.tsx` | created | **核心** exam→section→task accordion; task三态; launch → `/quiz?mode=task` |
| `components/drill/WordUniversePracticePicker.tsx` | created | self-surface + whitelist `TypePicker`(13 word-universe types, 3 families) |
| `components/drill/MockPaperPicker.tsx` | created | mock paper picker reading canonical exam-specs; launches existing `MockRun` |
| `scripts/smoke-drill-phase6.ts` | created | Playwright click-level smoke (desktop + mobile) |
| `docs/design-briefs/2026-06-20-drill-three-surface-handoff/**` | added | Archived design handoff |
| `reports/drill-three-surface-phase6.md` | created | This report |

**Not changed:** `MockExam.tsx` (`MockRun`/`MockResult` reused; old `MockExamPicker` superseded by `MockPaperPicker` but left as legacy), `drill-data.ts`, `drill-questions.ts`, `drill-merged.css` (kept untouched per handoff).

## 2. Screens changed / new user flow

`/drill` config screen reorganized from `自选练习 / 智能复习 / 模拟考试` to three surfaces:

- **单词宇宙练习** (teal) — the former self surface, type list whitelisted to `WORD_UNIVERSE_TYPES` (13 types across 识记/拼写/听辨; never `antonym_choice`/`cet_cloze`/exam-task/AI types). Level grid + family picker + 自由练 / 限时试炼 + resume + mobile dock/sheet all preserved. Run via existing `buildSession` → `BRun`.
- **考试专项** (blue, new core) — reads `lib/exam-specs`; exam strip (7) → accordion of sections (multi-open, 全部展开/收起) → inline task cards. Each task card is one of three states (see §3). A 可练 task launches `/quiz?mode=task&examId=…&taskType=…&level=…` (reuses Phase-5 PracticeRunner).
- **模拟试卷** (violet) — mock paper picker reading canonical exam-specs; paper structure shows 题源 via `bestTask` (never deprecated); TOEFL/SAT (`status:'draft'`) coming-soon, CTA disabled. Run via existing `MockRun` → `/api/mock-exam`.
- **智能复习** moved out of the 3-way switch into a thin top entry (`.lx-reviewentry`) → `/memory`, showing due/wrong counts.

## 3. Empty-state behavior (no silent fallback)

Task state (`deriveTaskState`, aligned with the backend `source:'empty'` rule):
- `ok` — objective task type with an active pool at that level → 「可练 + {题量} + 开始练习」.
- `build` — objective task with empty pool, **or** a `draft` exam (TOEFL/SAT) → 「题库建设中」mini-state, **no launch button, never falls back to an unrelated word drill**.
- `plan` — productive task (writing/translation/speaking) → 「规划中 · 待生产性任务支持」.

Two-end safety: the picker pre-labels via `deriveTaskState`; on click the PracticeRunner re-checks `/api/practice/session` and shows its own empty state if the pool is empty. `DrillEmptyState` (`build`/`plan`/`exam`) uses `role="status"` with text-conveyed state. Mock paper shows 「主观题 · 不计入客观卷」for productive sections and coming-soon for draft exams.

## 4. Compatibility with old practice run

- The run/result state machine is unchanged: 单词宇宙练习 launches `BRun`/`DrillAiRun` exactly as before; 模拟试卷 launches `MockRun`. No regression to existing practice/trial/mock runs.
- Old `localStorage` (`lexiB.lastConfig`) and recipes are filtered through `isWordUniverseType && !isDeprecatedQuestionType`; an empty result resets to a safe default (no preselect), and the resume card is hidden when empty — no crash.
- 考试专项 tasks do not use `BRun`; they hand off to `/quiz` (PracticeRunner), which keeps `/quiz` URLs working.

## 5. Browser smoke results

`scripts/smoke-drill-phase6.ts` (Playwright, headless chromium, desktop 1280×900 + mobile 390×844) — **22 checks, 0 failures**:
- Desktop: 3 surface tabs + review entry present; word-universe select → 「开始自由练」enabled; exam strip = 7, accordion ≥ 4 sections, ≥ 1 「可练」task; 可练 task click → `/quiz?mode=task&examId=cet4&taskType=listening_comprehension&level=3`; mock TOEFL/SAT coming-soon (≥2, 「题库建设中」).
- Mobile: 3 surfaces + accordion vertical stack usable.
- **Zero deprecated types** (`反义词`/`antonym_choice`/`cet_cloze`) on every surface (universe/exam/mock/mobile).

SSR smoke: `GET /drill` → 200, all three surface labels present, no deprecated strings.

## 6. Validation results (exit codes)

| Command | Result |
|---|---|
| `npm run validate:exam-specs` | **pass** (exit 0) |
| `npm run validate:question-types` | **pass** (exit 0) |
| `npx tsc --noEmit` | **pass** (exit 0) |
| `npm run lint` | **pass** (exit 0) |
| `npx tsx scripts/smoke-drill-phase6.ts` | **pass** — 22/22 (exit 0) |

## 7. Notes / known limitations

- **Task 题量 is a drill-data static placeholder** (`typeCount`), as the mock intended. Exact `itemAvailable`/`poolStatus` should be precomputed by the `/api/exam-specs` endpoint in a later phase; until then `deriveTaskState` renders the state and the runner is the click-time bottom-line.
- **Turbopack CSS workaround:** the design's `redesign.css` contained a latent invalid selector `.lx-es-exam . recdot{ }` (stray space) that browsers ignore but Turbopack's lightningcss rejects; it was removed. Turbopack also crashed its code-frame highlighter on the file's multibyte Chinese comments, so comments were stripped from `drill-phase6.css` (rules unchanged; the fully-commented original is archived under `docs/design-briefs/...`).
- `MockExamPicker` in `MockExam.tsx` is now unused (superseded by `MockPaperPicker`) but kept to avoid touching the mock run flow; can be retired later.
- Desktop two-column `.pr-rail` variant (handoff §RAIL) intentionally not enabled.

## 8. Post-review fixes (Codex)

- **P1 — exam task launch was not wired to its taskType.** `app/quiz/page.tsx` `mapToRunnerProps()` had no `mode === 'task'` branch, so `/quiz?mode=task&examId=cet4&taskType=listening_comprehension&level=3` fell through to the default `{ taskType: 'en_to_zh' }` — clicking "CET-4 听力理解" actually ran 英译中 vocab. Added an explicit `mode === 'task'` branch that reads `taskType`/`examId`/`sectionId`/`count`/`level` and passes them straight to `PracticeRunner` (deprecated taskType is left to the session API's empty-pool handling). Verified: the real request is now `/api/practice/session?mode=task&examId=cet4&taskType=listening_comprehension&level=3`.
- **P2 — smoke didn't check the real runner request.** `scripts/smoke-drill-phase6.ts` now attaches a `waitForRequest` listener and asserts the actual `/api/practice/session` request carries `taskType=listening_comprehension` + `examId=cet4` and is **not** `en_to_zh`. Suite is now **25/25**.
