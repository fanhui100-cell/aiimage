# Post-CC Review Conditional Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the project from the CC review's original `BLOCKED` state to an honest `Conditional Pass`: all code-level safety/correctness fixes are verified, misleading unfinished features are hidden or softened, and content/audio production work is split into explicit follow-up tracks.

**Architecture:** Treat the CC report as the source of findings, but do not let it drift from the working tree. Safety and correctness fixes stay in code; content/audio gaps are exposed honestly in UI copy until the assets and v2 coverage exist. Runtime verification is required before commit because several Lexiverse and route fixes were statically verified only.

**Tech Stack:** Next.js App Router, TypeScript, React, Supabase, Playwright, npm script validators, Markdown reports.

## Global Constraints

- Do not run DB reset, DB delete, or `promote --apply` without explicit owner approval.
- Do not hide remaining risks by deleting findings; mark each as fixed, mitigated, deferred, or owner-decision.
- Word -> Lexiverse navigation must land on the word's own planet/galaxy view, not only the generic universe overview.
- `/api/mock-exam` must never return `answer`, `answer_text`, `audio_ref` transcript, or `explanation_zh` to unauthenticated clients.
- Content/audio production gaps must be disclosed or hidden in UI until real content/audio exists.
- Keep the active report and the current working tree consistent before commit.

---

## Current State Summary

These fixes are already present in the current working tree and must be verified before commit:

| Finding | Current status | Main files |
|---|---|---|
| P0-1 `/api/mock-exam` leaks answers/transcripts | Code-level fixed by narrowing `SEL` | `app/api/mock-exam/route.ts` |
| P1-1 / P2-4 ungraded structured/free-text attempts corrupt mastery/results | Mitigated: `is_correct=null` no longer becomes an error or wrong mastery input; results page scores only graded items | `lib/learning-loop/error-classifier.ts`, `lib/learning-loop/skill-state-writer.ts`, `components/practice/PracticeRunner.tsx` |
| P2-1 word form labels show `pp`/`ing` | Fixed by alias labels | `components/screens/DictionaryVaultScreen.tsx` |
| P2-2 LexiGraph antonym sector empty | Fixed by merging `dictionary_antonyms` into `/relations` | `app/api/dictionary/relations/route.ts` |
| P2-3 Family card shows synonyms/collocations as derivatives | Fixed to prefer true derivative relations | `components/screens/DictionaryVaultScreen.tsx` |
| P2-8 multi-word dictionary jumps go to empty state | Fixed by navigating with `dw.id` | `components/screens/DictionaryVaultScreen.tsx` |
| P2-9 orphan `/lexiverse/word/[slug]` hard-404s missing words | Fixed by redirecting missing words to dictionary empty state | `app/lexiverse/word/[slug]/page.tsx` |
| P2-13 AI writing/conversation routes lack rate limits | Fixed with `checkRateLimit` | `app/api/ai/writing/route.ts`, `app/api/ai/conversation/route.ts` |
| P3-1 SAT/TOEFL API-only task practice can pull isolated vocab drills | Fixed by constraining no-taskType exam sessions to objective spec task types | `lib/practice/session-builder.ts` |
| P3-2 stale TOEFL/SAT comment | Fixed | `lib/exam-specs/specs.ts` |
| P3-8 `placeholder.taskTypes` leaks excluded `build_a_sentence` string | Fixed by filtering deprecated/excluded types | `lib/papers/paper-generator.ts` |
| P3-9 stale Lexiverse panel route comment | Fixed | `components/lexiverse/PlanetDetailPanel.tsx` |
| P3-11 focus-miss copy overclaims "所属星系" | Fixed copy to "最接近的星系视角" | `components/lexiverse/ReferenceLexiverseFrame.tsx` |
| P3-12 old 2026-07-04 reports read as current | Fixed with superseded banners | `reports/qbank-production-final-summary-2026-07-04.md`, `reports/self-review-audit-2026-07-04.md` |

Remaining work must be handled as separate tracks:

| Track | Status | Decision |
|---|---|---|
| P1-2 `build_a_sentence` audit drift | Owner decision required | Recommended: accept current DB state, keep draft, update audit trail and artifacts; do not promote |
| P2-5/P2-6 word-level v2 coverage | Content/data production | Disclose v1 fallback now; build coverage later |
| P2-11 non-CET6 listening audio | Audio/content production | Disclose unavailable listening now; produce audio later |
| P2-7 "考试语境" CTA is a dead lens | Product honesty fix now; full feature after coverage exists | Hide or soften the CTA now; build real exam-context only after target-word coverage exists |
| P2-10/P2-12 closed-loop e2e and wrong-edge visualization | Test/product work | Restore tests and decide whether wrong-edge remains in scope |

## Latest Production Status From Part C

Source report: `reports/large-qbank-production-final-report-2026-07-05.md`.

Part A and Part B are reported complete:

- TOEFL mock v1 opened for reading, listening, and writing; speaking and Build-a-Sentence remain excluded by `excludeFromPaper` plus `PAPER_EXCLUDED_TASK_TYPES`.
- TOEFL speaking transcript-only MVP is in place with audio-field refusal and non-official scoring claims.
- IELTS remains `coming_soon`, with rubric cleanup and pilot/production planning.
- Legacy `qb:` drafts are sealed; active `qb` remains 0.
- Paper smoke was parallelized from 169s to 61s.
- Part B gate: 16/16 commands exit 0.

Part C has started and has measurable draft-only progress:

| Track | Current draft progress | First-stage target | Notes |
|---|---:|---:|---|
| IELTS Reading | 45 | 100 | Original authored draft, `exam_id=ielts`, `level=8`, 0 active |
| IELTS Writing | 100 | 200 | Essay-writing draft; 0 active |
| IELTS Speaking | 50 | 100 | Interview-speaking draft; 0 active |
| IELTS Listening scripts | 20 | 100 | Draft scripts only; no active audio |
| TOEFL Build-a-Sentence | 30 | 100 | `accepted_sequence_exact` contract-ready draft; 0 active |
| Word Universe / target-word coverage top-up | 0 in this run | +450 planned | Not started before session-limit stop |

Stop reason: the subagent production pool hit an account session limit, with reset reported at 09:20 Asia/Shanghai. Inline production should not be used to brute-force the remaining ~900 items because quality would drop; resume the subagent pool after reset.

Owner decisions still required:

1. Resume the subagent production pool after the limit reset to finish the remaining Part C first-stage targets. Recommended: yes.
2. Choose IELTS listening audio supplier/cost model. Current IELTS listening is script-only draft and must not become active without active, reviewed audio.
3. Decide whether to approve Build-a-Sentence promote. Recommendation: not yet; first re-apply/check the Supabase RPC SQL, rerun gates, and confirm all 30 remain draft and excluded from mock papers until explicit activation.

---

### Task 1: Synchronize The Main Review Report

**Files:**
- Modify: `reports/cc-full-project-review-2026-07-05.md`

**Interfaces:**
- Consumes: current working-tree fixes listed above.
- Produces: one truthful review report whose verdict is `条件通过 / Conditional Pass` and whose remaining issues are explicit.

- [ ] **Step 1: Change the verdict block**

Replace the top-level conclusion with this wording:

```markdown
## 总体结论

- **结论：条件通过 / CONDITIONAL PASS**。原 P0 `/api/mock-exam` 泄露已在代码层堵住；主要代码级安全/正确性问题已经修复并需要运行时复核。当前不再是上线阻塞状态，但仍有 P1-2 审计轨迹决策项、内容/音频生产任务、考试语境 CTA 诚实化、闭环 e2e 恢复等条件项。
- **条件项：**提交前必须完成本报告的 Fixes Applied 对照、运行时 smoke 验证，并保留 P1-2 为 owner decision。内容/音频覆盖不足不得在 UI 或报告中宣传为完整覆盖。
```

- [ ] **Step 2: Add `## Fixes Applied` after `## 问题清单` or before `## 建议下一步`**

Insert this section:

```markdown
## Fixes Applied

| Finding | Status | Files / evidence | Verification |
|---|---|---|---|
| P0-1 `/api/mock-exam` 泄露 answerKey/transcript | Fixed in code | `app/api/mock-exam/route.ts` narrows `SEL` to non-answer fields only | Runtime smoke required: response must not contain `answer`, `answer_text`, `audio_ref`, `explanation_zh` |
| P1-1 / P2-4 ungraded attempts corrupt mastery/results | Mitigated in code | `error-classifier.ts` only classifies explicit wrong answers; `skill-state-writer.ts` skips `is_correct=null`; `PracticeRunner.tsx` scores only graded results | `npm run validate:practice-session`; manual structured/free-text smoke |
| P2-1/P2-3/P2-8 dictionary forms/family/jumps | Fixed in code | `DictionaryVaultScreen.tsx` adds `pp/ing` labels, true derivative family, id-based multi-word navigation | Manual dictionary smoke for `carbon-dioxide` and a verb with `pp/ing` |
| P2-2 antonyms missing from `/relations` | Fixed in code | `app/api/dictionary/relations/route.ts` merges `dictionary_antonyms` | Runtime smoke `/api/dictionary/relations?word=ability` should include `antonym` |
| P2-9 missing `/lexiverse/word/[slug]` hard 404 | Fixed in code | `app/lexiverse/word/[slug]/page.tsx` redirects missing words to `/dictionary?word=` | Browser smoke `/lexiverse/word/notarealwordxyz` |
| P2-13 AI writing/conversation no rate limit | Fixed in code | `app/api/ai/writing/route.ts`, `app/api/ai/conversation/route.ts` call `checkRateLimit` | `npm run lint`; targeted route smoke if `DEEPSEEK_API_KEY` is configured |
| P3-1 SAT/TOEFL no-taskType API path off-spec | Fixed in code | `lib/practice/session-builder.ts` constrains exam sessions to objective spec task types | `npm run validate:practice-session` |
| P3-8 placeholder task type leak | Fixed in code | `lib/papers/paper-generator.ts` filters deprecated and excluded task types | `npm run validate:papers` |
| P3-2/P3-9/P3-11/P3-12 stale comments/copy/reports | Fixed in docs/copy | `specs.ts`, `PlanetDetailPanel.tsx`, `ReferenceLexiverseFrame.tsx`, two 2026-07-04 reports | `rg "paperReady=false|所属星系|/word/\\[slug\\]"` review |
```

- [ ] **Step 3: Add `## Remaining Decisions And Deferred Production`**

Insert this section:

```markdown
## Remaining Decisions And Deferred Production

| Item | Why not auto-fixed | Current mitigation | Next owner decision |
|---|---|---|---|
| P1-2 `build_a_sentence` audit drift | Requires deciding whether to accept current DB state or roll it back; no DB writes were performed in this pass | Keep all `build_a_sentence` sets draft; do not run `promote --apply` | Recommended: accept current DB state, update the two 2026-07-05 reports and commit the generated accepted-sequence artifacts |
| P2-5/P2-6 thin v2 word coverage | Requires generating/backfilling content and target-word links | UI/report must disclose non-WU words mostly use v1 fallback | Plan a word-level v2 coverage expansion batch |
| P2-11 non-CET6 listening audio missing | Requires audio/content production and human QA | UI/report must disclose listening availability by exam | Plan audio generation/import/QA for zhongkao, gaokao, CET4, TOEFL |
| P2-7 "考试语境" CTA | Current link behaves the same as normal word practice | Hide or soften the CTA now; do not promise cloze/exam-style coverage | Build real exam-context mode only after target-word coverage exists |
| P2-10/P2-12 closed-loop e2e and wrong-edge | Requires Playwright rewrite and product decision | Treat as test/product gap, not launch-blocking after disclosure | Decide whether wrong-edge remains in product; restore e2e accordingly |
```

- [ ] **Step 4: Verify report text**

Run:

```powershell
rg -n "条件通过|Fixes Applied|Remaining Decisions|P1-2|P2-7|P2-11" reports\cc-full-project-review-2026-07-05.md
git diff --check -- reports\cc-full-project-review-2026-07-05.md
```

Expected:

```text
The rg output shows the new verdict, fixes section, and remaining-decision section.
git diff --check exits 0.
```

---

### Task 2: Make The "考试语境" CTA Honest Before Full Coverage Exists

**Files:**
- Modify: `components/lexiverse/WordPracticeActions.tsx`
- Optional Modify: `lib/lexiverse/word-practice-links.ts`
- Test: `npm run lint`

**Interfaces:**
- Consumes: `poolEmpty`, `links.practice`, `links.examContext`.
- Produces: no user-facing claim that a real exam-context lens exists until it is implemented.

**Decision:** Use the conservative UI mitigation now: keep one primary `练这个词` action, render the exam-context half as disabled informational copy, and remove the `cloze · 同义 · 辨析` promise.

- [ ] **Step 1: Replace the enabled exam-context link with a disabled badge**

In `components/lexiverse/WordPracticeActions.tsx`, replace the non-`poolEmpty` branch at lines around `116-123` with:

```tsx
            <span
              role="button"
              aria-disabled
              title="考试语境题正在补充；当前不会用普通背词题冒充考试题。"
              style={{ ...splitItem, padding: '13px 17px', background: 'rgba(255,214,107,0.08)', color: '#BDA761', cursor: 'default' }}
            >
              <IconExam />
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12, alignItems: 'flex-start' }}>
                <b style={{ fontSize: 13.5, fontWeight: 700 }}>考试语境补充中</b>
                <span style={{ fontSize: 10, opacity: 0.82, fontFamily: "'Space Mono', monospace" }}>COMING WITH V2 ITEMS</span>
              </span>
            </span>
```

- [ ] **Step 2: Update the header comment**

Change the file header from:

```tsx
从一个词出发：练这个词 | 考试语境（同一词池两种镜头，绝不回退随机题）·词图关系·加入今日。
```

to:

```tsx
从一个词出发：练这个词；考试语境在 per-word v2 覆盖不足时只显示补充中，绝不把普通背词题冒充考试题。
```

- [ ] **Step 3: Stop building an active exam-context URL for now**

In `lib/lexiverse/word-practice-links.ts`, keep the field for API compatibility but point it to the normal practice URL only as a non-rendered fallback:

```ts
    examContext: `/quiz?word=${id}&returnTo=${rt}`,
```

Update the file comment to:

```ts
/* word-practice-links.ts — 词详情页 CTA 的纯 URL 构造器。
   examContext 字段保留兼容；UI 在 v2 per-word coverage 充足前不渲染为可点击考试入口。 */
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run lint
rg -n "cloze · 同义 · 辨析|mode=exam-practice|考试语境补充中|COMING WITH V2 ITEMS" components\lexiverse lib\lexiverse
```

Expected:

```text
lint exits 0.
No "cloze · 同义 · 辨析" remains.
"考试语境补充中" appears in WordPracticeActions.
No rendered Link points to /quiz?word=...&mode=exam-practice from WordPracticeActions.
```

---

### Task 3: Runtime Smoke Verification For Fixed Routes

**Files:**
- No code changes required.
- Optional Test Doc Update: `reports/cc-full-project-review-2026-07-05.md`

**Interfaces:**
- Consumes: dev server on a non-3000 port.
- Produces: runtime evidence for P0, dictionary, Lexiverse, and route fixes.

- [ ] **Step 1: Start the dev server on a non-3000 port**

Run:

```powershell
$env:PORT='3107'; npm run dev -- --hostname 127.0.0.1 --port 3107
```

Expected:

```text
Next.js starts at http://127.0.0.1:3107.
```

- [ ] **Step 2: Verify `/api/mock-exam` no longer leaks answer fields**

In a second terminal:

```powershell
$json = Invoke-RestMethod "http://127.0.0.1:3107/api/mock-exam?exam=gaokao&seed=1"
$raw = $json | ConvertTo-Json -Depth 20
$raw -match '"answer"|"answer_text"|"audio_ref"|"explanation_zh"'
```

Expected:

```text
False
```

- [ ] **Step 3: Verify dictionary multi-word route**

Run:

```powershell
Invoke-WebRequest "http://127.0.0.1:3107/dictionary?word=carbon-dioxide" -UseBasicParsing | Select-Object StatusCode
```

Expected:

```text
StatusCode 200
```

- [ ] **Step 4: Verify Lexiverse missing word redirect**

Run:

```powershell
$r = Invoke-WebRequest "http://127.0.0.1:3107/lexiverse/word/notarealwordxyz" -MaximumRedirection 0 -ErrorAction SilentlyContinue
$r.StatusCode
$r.Headers.Location
```

Expected:

```text
307 or 308
/dictionary?word=notarealwordxyz
```

- [ ] **Step 5: Verify Lexiverse word focus query reaches a galaxy URL**

Use a browser or Playwright to visit:

```text
http://127.0.0.1:3107/lexiverse?word=benefit
```

Expected:

```text
The URL is rewritten to include `galaxy=...`, the iframe switches from Universe to Galaxy view, and the word receives focus or a visible focus-miss message.
```

- [ ] **Step 6: Record the runtime evidence**

Append a short verification note to `reports/cc-full-project-review-2026-07-05.md` under `Fixes Applied`:

```markdown
Runtime smoke on 2026-07-05:
- `/api/mock-exam?exam=gaokao&seed=1`: no `answer`, `answer_text`, `audio_ref`, or `explanation_zh` in response.
- `/dictionary?word=carbon-dioxide`: HTTP 200.
- `/lexiverse/word/notarealwordxyz`: redirects to `/dictionary?word=notarealwordxyz`.
- `/lexiverse?word=benefit`: rewrites into a galaxy view or shows a visible focus-miss state.
```

---

### Task 4: Validator Gate Before Commit

**Files:**
- No code changes required unless a validator fails.

**Interfaces:**
- Consumes: all current code fixes and Task 2 UI mitigation.
- Produces: a clean verification baseline.

- [ ] **Step 1: Run the fast gate**

Run:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run validate:practice-session
npm run validate:papers
```

Expected:

```text
All four commands exit 0.
```

- [ ] **Step 2: Run route and safety smokes**

Run:

```powershell
npm run smoke:full-routes
npm run smoke:active-serve
npm run validate:audio-assets
```

Expected:

```text
All commands exit 0.
`smoke:active-serve` reports no answerKey/transcript leak.
```

- [ ] **Step 3: Run qbank integrity gates**

Run:

```powershell
npm run validate:qbank-v2
npm run qa:qsets-v2
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 4: Update report command table if rerun timestamps changed**

If report JSON files changed only by timestamp, mention it in the final commit note. If command counts or pass/warn status changed, update `reports/cc-full-project-review-2026-07-05.md`.

---

### Task 5: Owner Decision For `build_a_sentence` Audit Drift

**Files:**
- Modify after decision: `reports/toefl-build-sentence-scoring-2026-07-05.md`
- Modify after decision: `reports/final-qbank-learning-loop-readiness-2026-07-05.md`
- Add or commit after decision: `data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json`
- Add or commit after decision: `reports/build-sentence-accepted-sequences-apply-report.json`

**Interfaces:**
- Consumes: owner decision.
- Produces: aligned DB/report/artifact audit trail without activating `build_a_sentence`.

**Recommended decision:** Accept the current DB state, keep all `build_a_sentence` sets as draft, and update the audit trail. Do not roll back DB unless there is evidence that the accepted-sequence contracts are wrong.

- [ ] **Step 1: Confirm no active `build_a_sentence`**

Run:

```powershell
npm run verify:toefl-current
npm run validate:toefl-task-alignment
```

Expected:

```text
Both commands exit 0.
`build_a_sentence` active count remains 0.
```

- [ ] **Step 2: Update the two stale reports**

Replace claims equivalent to:

```text
eligible 0 / rejected 10 / DB writes 0 / scoring_not_ready=true
```

with:

```text
Accepted-sequence contracts have been applied to 10 draft `build_a_sentence` sets and `scoring_not_ready` has been cleared. These sets remain draft and are still excluded from TOEFL mock papers. Local promote dry-run may show them as eligible, but owner approval and server RPC confirmation are required before any activation. No `promote --apply` was run in this pass.
```

- [ ] **Step 3: Commit the audit artifacts with the report update**

Run:

```powershell
git status --short data\generated-question-sets reports\build-sentence-accepted-sequences-apply-report.json
```

Expected:

```text
The accepted-sequence source file and apply report are visible and can be reviewed.
```

- [ ] **Step 4: Keep activation blocked**

Do not run:

```powershell
npm run promote:qsets-v2 -- --apply --task=build_a_sentence
```

until the owner explicitly approves activation and the server RPC has been checked.

---

### Task 6: Content And Audio Production Tracks

**Files:**
- Create: `docs/superpowers/plans/2026-07-05-word-v2-coverage-expansion-plan.md`
- Create: `docs/superpowers/plans/2026-07-05-listening-audio-expansion-plan.md`
- Future Modify: `data/generated-question-sets/**`
- Future Modify: `reports/qbank-v2-coverage-audit.md`
- Future Modify: `reports/audio-assets-validation.json`

**Interfaces:**
- Consumes: current qbank coverage and audio validation reports.
- Produces: separate production plans that can be executed without mixing content generation into this safety-fix branch.

- [ ] **Step 1: Create the word v2 coverage plan**

The plan must set this first measurable target:

```markdown
Initial target: raise active v2 `question_target_words` coverage from 255 distinct words to at least 2,000 distinct words, prioritizing high-frequency CET4/CET6/TOEFL/SAT words and words surfaced in Dictionary/Lexiverse entry points.
```

It must include these validation commands:

```powershell
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:practice-session
npm run audit:qbank-v2-coverage
```

- [ ] **Step 2: Create the listening audio expansion plan**

The plan must set this first measurable target:

```markdown
Initial target: add active listening audio beyond CET6 for zhongkao, gaokao, CET4, and TOEFL; do not advertise TOEFL accent coverage until TOEFL listening audio rows are active and human-reviewed.
```

It must include these validation commands:

```powershell
npm run validate:audio-assets
npm run validate:audio-pipeline
npm run review:audio-assets
npm run smoke:active-serve
npm run validate:papers
```

- [ ] **Step 3: Keep UI disclosure until production is complete**

Before the production plans complete, product copy must continue to say:

```text
部分单词练习仍使用旧题库补位；考试语境题和非 CET6 听力音频正在补充中。
```

---

### Task 7: Closed-Loop E2E And Wrong-Edge Product Decision

**Files:**
- Modify: `e2e/closed-loop.spec.ts`
- Inspect: `components/lexigraph-v2/LexiGraphScreen.tsx`
- Inspect: `app/lexigraph/page.tsx`
- Inspect: `public/lexigraph-reference/**`

**Interfaces:**
- Consumes: current Lexiverse iframe routes and dictionary routes.
- Produces: running Playwright coverage for the user loops that were previously `test.fixme`.

- [ ] **Step 1: Decide whether wrong-edge remains a product feature**

Record one of these in the review report:

```markdown
Wrong-edge decision: keep. Re-expose wrong-edge data through the active `/lexigraph` iframe and restore the e2e assertion.
```

or:

```markdown
Wrong-edge decision: de-scope. Remove stale wrong-edge assertions and orphaned visual components from the active product surface.
```

- [ ] **Step 2: Re-enable closed-loop tests one by one**

For each disabled case in `e2e/closed-loop.spec.ts`, replace `test.fixme` with an active `test` only after the selector targets current UI:

```ts
test('dictionary detail can reach lexigraph and lexiverse', async ({ page }) => {
  await page.goto('/dictionary?word=benefit')
  await page.getByRole('link', { name: /词图|LEXIGRAPH/i }).click()
  await expect(page).toHaveURL(/\/lexigraph\?word=benefit/)
})
```

- [ ] **Step 3: Run the focused suite**

Run:

```powershell
npx playwright test e2e/closed-loop.spec.ts --project=chromium
```

Expected:

```text
The suite executes real tests rather than reporting all cases as fixme.
```

---

## Final Commit Checklist

- [ ] `reports/cc-full-project-review-2026-07-05.md` says `条件通过 / CONDITIONAL PASS`.
- [ ] The report contains `Fixes Applied`.
- [ ] The report contains `Remaining Decisions And Deferred Production`.
- [ ] `P1-2 build_a_sentence` remains clearly marked as owner-decision and not activated.
- [ ] "考试语境" no longer overclaims exam-style per-word coverage.
- [ ] Runtime smoke confirms `/api/mock-exam` does not return answer or transcript fields.
- [ ] Runtime smoke confirms dictionary multi-word and Lexiverse missing-word behavior.
- [ ] `npm run lint` exits 0.
- [ ] `npx tsc --noEmit --incremental false` exits 0.
- [ ] `npm run validate:practice-session` exits 0.
- [ ] `npm run validate:papers` exits 0.
- [ ] `npm run smoke:full-routes` exits 0.
- [ ] `git diff --check` exits 0.

## Self-Review

- Spec coverage: This plan covers the user's requested states: already-fixed code issues, report synchronization, owner-decision items, content/audio production separation, exam-context copy/hide mitigation, runtime verification, and future closed-loop tests.
- Placeholder scan: No task uses unresolved placeholder language, open-ended "add tests", or unspecified "handle edge cases" wording.
- Type consistency: All referenced file paths and commands are taken from the current repository. `WordPracticeActions`, `buildWordPracticeLinks`, `PracticeRunner`, `error-classifier`, `skill-state-writer`, and report paths match existing files.

Plan complete and saved to `docs/superpowers/plans/2026-07-05-post-cc-review-conditional-pass-development-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.
