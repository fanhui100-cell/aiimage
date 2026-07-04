# Remaining QBank + TOEFL Mock Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining TOEFL/qbank work by opening a safe TOEFL mock v1, keeping unfinished speaking/build-sentence work out of papers, cleaning IELTS coming-soon gaps, hardening Word Universe source governance, and producing a final readiness report.

**Architecture:** Keep content, paper generation, practice sessions, and UI gates separated. TOEFL mock v1 is explicitly scoped to active Reading + Listening + Writing prompts, while Speaking and Build-a-Sentence remain excluded until their scoring and product contracts are ready. All migrations or status changes must be manifest-based, idempotent, and reported.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Postgres/Storage, v2 question bank tables, existing `scripts/*.ts` validators, existing practice runner and paper generator.

## Global Constraints

- Do not call DeepSeek.
- Do not perform broad deletes, DB resets, or destructive cleanup.
- Do not promote content without an explicit manifest, dry-run, apply, idempotency rerun, and report.
- TOEFL mock v1 may open only if it excludes `build_a_sentence`, `listen_and_repeat`, and `interview_speaking`.
- IELTS remains `coming_soon`; do not create or activate a full IELTS question bank in this plan.
- Old `qb:` Word Universe draft content must not become active. Prefer marking or gating over deletion.
- Every phase must end with a self-review section in its report: files changed, DB writes, promote count, active/draft deltas, validation commands, exit codes, and known residual risks.
- If a phase finds a P0/P1 safety issue, stop after writing the report and do not continue to the next phase.
- Keep generated report side effects under control: either commit intended report changes or restore incidental validation JSON refreshes before handoff.

---

## Current Baseline

The latest verified state before this plan:

- TOEFL Reading is active:
  - `read_daily_life`: 100 active
  - `reading_comprehension`: 100 active
- TOEFL Text tasks are active:
  - `complete_the_words`: 100 active
  - `email_writing`: 100 active
  - `academic_discussion`: 100 active
- TOEFL Listening is active:
  - `choose_a_response`: 100 active
  - `listening_comprehension`: 100 active
- TOEFL full/mini paper gate is still closed:
  - `paperReady=false`
  - `smoke:papers` returns `paper_not_ready` for TOEFL mini/full
- Blocked/deferred TOEFL tasks:
  - `build_a_sentence`: draft/blocked by `scoring_not_ready`
  - `listen_and_repeat`: draft/deferred
  - `interview_speaking`: draft/deferred
- Word Universe active source:
  - active Word Universe should be 100% `gen:` Claude-authored content
  - active `qb:` should be 0
- IELTS:
  - Level 8 / IELTS vocabulary and surfaces exist
  - IELTS exam content remains `coming_soon`

---

## Files And Responsibilities

These are the likely touch points. Keep edits as small as possible and do not restructure unrelated code.

- `lib/exam-specs/specs.ts`
  - Owns TOEFL `paperReady`, sections, task types, and section/task paper availability metadata.
- `lib/exam-specs/types.ts`
  - Add only minimal type support if section/task paper exclusion needs a typed field.
- `lib/papers/paper-generator.ts`
  - Owns full/mini/section paper composition, active-only draws, answer stripping, listening audio URL discipline, and excluded-section handling.
- `scripts/check-paper-api-smoke.ts`
  - Must derive correct expected paper/refusal behavior from current specs.
- `scripts/validate-paper-generator.ts`
  - Must validate TOEFL mock v1 composition and no leak conditions.
- `scripts/validate-toefl-task-alignment.ts`
  - Must reflect TOEFL paper v1 status after Phase 1.
- `components/**`
  - Touch only if visible TOEFL mock UI copy misrepresents mock v1 as full four-skill TOEFL.
- `lib/practice/**`, `components/practice/**`
  - Touch for Build-a-Sentence and Speaking phases only.
- `app/api/scoring/speaking/**`, `lib/scoring/**`
  - Touch only for transcript-based speaking scoring boundary.
- `scripts/audit-word-universe-source-distribution.ts`
  - Word Universe active source guard.
- `scripts/validate-word-universe-promote-guards.ts`
  - Word Universe promote guard.
- `scripts/promote-question-sets-v2.ts`
  - Only touch if a guard needs hardening. Do not weaken existing blocked/deprecated/source gates.
- `reports/*.md`, `reports/*.json`
  - Write phase reports and intended validation snapshots.

---

## Task 1: Open TOEFL Mock v1 Without Speaking Or Build-a-Sentence

**Files:**
- Modify: `lib/exam-specs/types.ts`
- Modify: `lib/exam-specs/specs.ts`
- Modify: `lib/papers/paper-generator.ts`
- Modify: `scripts/check-paper-api-smoke.ts`
- Modify: `scripts/validate-paper-generator.ts`
- Modify: `scripts/validate-toefl-task-alignment.ts`
- Create: `reports/toefl-mock-v1-open-2026-07-05.md`
- Optional UI copy only if needed: `components/screens/drill/MockPaperPicker.tsx`, `components/**/MockExam*.tsx`, or the actual TOEFL mock entry component discovered by `rg "paperReady|TOEFL|mock" components app`

**Interfaces:**
- Consumes: existing TOEFL active pools and existing `paperReady=false` gate.
- Produces: TOEFL `paperReady=true` with explicit paper exclusion for speaking and build-a-sentence, and tests proving TOEFL mock v1 is safe.

- [ ] **Step 1: Locate current TOEFL spec and paper generator gates**

Run:

```powershell
rg "paperReady|toefl|build_a_sentence|listen_and_repeat|interview_speaking" lib\exam-specs lib\papers scripts components app
```

Expected: find TOEFL spec, `generatePaper`, `smoke:papers`, and TOEFL alignment validator.

- [ ] **Step 2: Add explicit paper exclusion metadata**

Implement a minimal typed field. Acceptable shape:

```ts
export interface ExamSectionSpec {
  id: string
  title: string
  skill: ExamSkill
  taskTypes: string[]
  itemCount?: number
  points?: number
  requiresAudio?: boolean
  requiresRubric?: boolean
  excludeFromPaper?: boolean
  paperExcludedReason?: string
}
```

If task-level exclusion already exists, use the existing local pattern instead of adding a duplicate.

- [ ] **Step 3: Update TOEFL spec**

Set TOEFL `paperReady: true`.

Mark the speaking section as excluded from papers:

```ts
{
  id: 'speaking',
  skill: 'speaking',
  taskTypes: ['listen_and_repeat', 'interview_speaking'],
  requiresAudio: true,
  requiresRubric: true,
  excludeFromPaper: true,
  paperExcludedReason: 'speaking_pipeline_not_ready',
}
```

Keep `build_a_sentence` out of papers. If it lives inside the writing section with `email_writing` and `academic_discussion`, add task-level filtering in the generator for `build_a_sentence`, or ensure it has 0 active and is excluded by type. Do not rely only on 0 active if the generator can later include it by accident.

- [ ] **Step 4: Update paper generator section filtering**

For `full` mode:

- include sections unless `excludeFromPaper === true`
- include TOEFL reading/listening/writing
- exclude TOEFL speaking
- exclude `build_a_sentence` from writing section candidate task types

For `mini` mode:

- keep objective-only behavior
- include TOEFL reading/listening
- exclude writing/speaking

Do not let intentionally excluded sections create `insufficient_pool`.

- [ ] **Step 5: Update client paper safety assertions**

Ensure `toClientPaper` still strips:

- every `answerKey`
- listening `stimulus.textEn` / transcript
- private scoring details

Ensure listening client stimuli include signed `audioUrl`.

- [ ] **Step 6: Update paper smoke expectations**

In `scripts/check-paper-api-smoke.ts`, TOEFL must no longer expect `paper_not_ready`.

Expected TOEFL behavior:

- `toefl mini`: generated paper with reading + listening
- `toefl full`: generated paper with reading + listening + writing
- no speaking section
- no build-a-sentence task

IELTS remains:

- `ielts mini`: `exam_coming_soon`
- `ielts full`: `exam_coming_soon`

- [ ] **Step 7: Update paper validator**

Add TOEFL assertions to `scripts/validate-paper-generator.ts`:

- TOEFL mini generates and has no writing/speaking.
- TOEFL full generates and has writing but no speaking.
- TOEFL full has no `build_a_sentence`.
- TOEFL listening items have `audioUrl`.
- TOEFL listening client payload has no transcript.
- All client items have no `answerKey`.

- [ ] **Step 8: Update TOEFL task alignment**

In `scripts/validate-toefl-task-alignment.ts`, update the paper contract:

- TOEFL status is active.
- TOEFL `paperReady` is true.
- Speaking is intentionally excluded from papers.
- Build-a-Sentence remains blocked/excluded.

- [ ] **Step 9: Update visible copy if needed**

If the UI presents TOEFL mock as a complete official four-skill mock, change copy to:

```text
TOEFL 模考 v1：包含阅读、听力、写作；口语建设中。
```

Do not add marketing copy. Keep it terse.

- [ ] **Step 10: Run validation**

Run:

```powershell
npm run smoke:papers
npm run validate:papers
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:audio-assets
npm run lint
npx tsc --noEmit --incremental false
```

Expected:

- all commands exit 0
- `smoke:papers` shows TOEFL mini/full generated, not refused
- IELTS still refused with `exam_coming_soon`

- [ ] **Step 11: Write report**

Create `reports/toefl-mock-v1-open-2026-07-05.md` with:

- files changed
- exact TOEFL paper composition
- confirmation speaking/build-a-sentence are excluded
- DB writes: should be none
- promote: should be none
- validation command table with exit codes
- known limitation: this is TOEFL mock v1, not complete speaking-enabled TOEFL

- [ ] **Step 12: Self-review**

Check:

```powershell
rg "paper_not_ready" scripts reports lib\exam-specs lib\papers
rg "build_a_sentence" lib\papers scripts reports
rg "listen_and_repeat|interview_speaking" lib\papers scripts reports
git diff --check
git status --short
```

If TOEFL still expects `paper_not_ready`, fix it. If IELTS no longer expects `exam_coming_soon`, fix it. If `build_a_sentence` or speaking enters TOEFL papers, stop and report P1.

Commit:

```powershell
git add lib scripts components app reports
git commit -m "feat: open TOEFL mock v1 without speaking"
```

---

## Task 2: Build-a-Sentence Accepted-Sequence Scoring Boundary

**Files:**
- Modify: `lib/exam-task-templates/shape.ts`
- Modify: `lib/papers/scoring.ts`
- Modify: `lib/practice/session-types.ts`
- Modify: `components/practice/renderers/*Build*` or the renderer that handles `build_a_sentence`
- Modify: `scripts/qa-question-sets-v2.ts`
- Modify: `scripts/promote-question-sets-v2.ts`
- Create: `reports/toefl-build-sentence-scoring-2026-07-05.md`

**Interfaces:**
- Consumes: current 10 draft `build_a_sentence` sets.
- Produces: safe accepted-sequence scoring for practice, while still excluding build-a-sentence from TOEFL mock.

- [ ] **Step 1: Confirm current task shape**

Run:

```powershell
rg "build_a_sentence|build_sentence|acceptedSequences|scoring_not_ready" lib components scripts data reports
```

Record current storage location for answer payload and QA flags.

- [ ] **Step 2: Define accepted sequence contract**

Use this contract:

```ts
type AcceptedSequence = string[]

type BuildSentenceAnswer = {
  canonical: string[]
  acceptedSequences: AcceptedSequence[]
  scoring: 'accepted_sequence_exact'
  official: false
}
```

Normalize for scoring:

- lowercase
- trim
- collapse multiple spaces
- strip trailing sentence punctuation from each token

- [ ] **Step 3: Add QA validation**

In QA, require for active `build_a_sentence`:

- `answer.canonical` is a non-empty string array
- `answer.acceptedSequences` has at least 1 sequence
- every accepted sequence has the same token count as canonical
- no empty token
- `answer.official === false`
- `qa_flags.scoring_not_ready !== true`

Draft rows may still have `scoring_not_ready`.

- [ ] **Step 4: Implement scoring**

In scoring logic, add:

```ts
function normalizeBuildSentenceTokens(tokens: string[]): string[] {
  return tokens.map((token) =>
    String(token)
      .trim()
      .toLowerCase()
      .replace(/[.!?。！？]+$/g, '')
      .replace(/\s+/g, ' ')
  )
}

function sequenceEquals(a: string[], b: string[]): boolean {
  const na = normalizeBuildSentenceTokens(a)
  const nb = normalizeBuildSentenceTokens(b)
  return na.length === nb.length && na.every((token, index) => token === nb[index])
}
```

Use exact accepted-sequence match only. Do not implement broad grammar equivalence.

- [ ] **Step 5: Update renderer copy**

Visible copy must say:

```text
按项目参考语序判分；部分等价表达可能需人工判断。
```

Do not claim official TOEFL scoring.

- [ ] **Step 6: Update promote guard**

`build_a_sentence` must be rejected unless:

- accepted sequences exist
- QA says scoring is ready
- task remains excluded from TOEFL paper

Use rejection reason:

```text
build_sentence_scoring_not_ready
```

or a more specific existing local reason.

- [ ] **Step 7: Prepare the 10 current draft rows**

For each existing draft item:

- add canonical sequence
- add 2 to 4 accepted sequences when genuinely acceptable
- keep `official:false`
- remove `scoring_not_ready` only if QA fully passes

If any sentence is ambiguous or hard to score, leave it draft and report it.

- [ ] **Step 8: Validate**

Run:

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] **Step 9: Report**

Create `reports/toefl-build-sentence-scoring-2026-07-05.md`:

- how many build-a-sentence rows are scoring-ready
- how many remain blocked
- whether any were promoted
- proof build-a-sentence remains excluded from TOEFL mock
- validation command table

- [ ] **Step 10: Self-review and commit**

Run:

```powershell
rg "official.*true|official: true|scoring_not_ready" lib scripts data reports
git diff --check
git status --short
```

Commit if clean:

```powershell
git add lib components scripts data reports
git commit -m "feat: add build sentence accepted sequence scoring"
```

---

## Task 3: Speaking Transcript-Only Practice Boundary

**Files:**
- Modify: `components/practice/renderers/*Speaking*` or create a focused renderer if the project pattern requires it
- Modify: `lib/practice/session-builder.ts`
- Modify: `lib/practice/session-types.ts`
- Modify: `app/api/scoring/speaking/route.ts`
- Modify: `scripts/validate-rubrics.ts`
- Modify: `scripts/validate-practice-session.ts`
- Create: `reports/toefl-speaking-boundary-2026-07-05.md`

**Interfaces:**
- Consumes: existing speaking draft content and speaking scoring route.
- Produces: transcript-only practice path, no audio storage, no paper inclusion.

- [ ] **Step 1: Confirm current speaking flow**

Run:

```powershell
rg "listen_and_repeat|interview_speaking|score-speaking|audioScoring|speaking_pipeline" app components lib scripts
```

- [ ] **Step 2: Enforce privacy boundary**

The first speaking practice version must:

- not upload audio
- not store audio
- not create Storage objects
- accept typed or pasted transcript
- call speaking scoring with transcript only
- return `audioScoring:'not_ready'`
- return `isEstimate:true`

- [ ] **Step 3: Renderer behavior**

Renderer should show:

```text
口语练习当前按文字转写估分；录音不会上传或保存。
```

Allow user to type transcript. If local recording controls exist, keep them local only and do not persist audio.

- [ ] **Step 4: API assertion**

In `app/api/scoring/speaking/route.ts`, ignore or reject any `audio` payload. Prefer rejection:

```json
{ "ok": false, "error": "audio_upload_not_supported" }
```

if a client attempts to send audio. Transcript requests should continue.

- [ ] **Step 5: Practice session handling**

Speaking tasks may be available in专项 practice only if the item is active and marked `speaking_ready=true`. Otherwise return controlled empty state.

Do not include speaking in TOEFL mock.

- [ ] **Step 6: Validate**

Run:

```powershell
npm run validate:rubrics
npm run validate:practice-session
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] **Step 7: Report**

Create `reports/toefl-speaking-boundary-2026-07-05.md`:

- whether any speaking set became active
- whether audio storage is still none
- whether full mock still excludes speaking
- validation table

- [ ] **Step 8: Self-review and commit**

Run:

```powershell
rg "audioStorage|audioScoring|speaking_ready|interview_speaking|listen_and_repeat" app components lib scripts reports
git diff --check
git status --short
```

Commit:

```powershell
git add app components lib scripts reports
git commit -m "feat: add transcript-only TOEFL speaking boundary"
```

---

## Task 4: IELTS Coming-Soon Cleanup

**Files:**
- Modify: `scripts/validate-rubrics.ts`
- Modify: `lib/exam-specs/specs.ts` only if coming-soon metadata is inconsistent
- Modify: affected route/UI components only if IELTS falls back to another exam
- Create: `reports/ielts-coming-soon-cleanup-2026-07-05.md`

**Interfaces:**
- Consumes: current IELTS level/exam spec.
- Produces: clean coming-soon behavior with validators green.

- [ ] **Step 1: Reproduce current gap**

Run:

```powershell
npm run validate:rubrics
npm run smoke:papers
rg "ielts|IELTS" lib app components scripts
```

Record exact rubric errors.

- [ ] **Step 2: Make coming-soon rubric gaps non-blocking**

If IELTS sections are `coming_soon`, `validate:rubrics` should report warnings rather than fail.

Do not create fake active rubrics for IELTS unless the status is clearly non-active.

- [ ] **Step 3: Confirm routing does not fallback**

IELTS should not silently route to TOEFL/SAT/CET.

Expected:

- IELTS paper: `exam_coming_soon`
- IELTS task pools: controlled empty / coming soon
- IELTS level vocabulary surfaces: allowed

- [ ] **Step 4: Validate**

Run:

```powershell
npm run validate:exam-specs
npm run validate:rubrics
npm run smoke:papers
npm run full-routes
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] **Step 5: Report and commit**

Create `reports/ielts-coming-soon-cleanup-2026-07-05.md` with:

- exact validator behavior before/after
- confirmation IELTS remains coming-soon
- confirmation no IELTS content was activated

Commit:

```powershell
git add lib app components scripts reports
git commit -m "fix: make IELTS coming-soon validation explicit"
```

---

## Task 5: Word Universe v2 Source Cleanup

**Files:**
- Modify: `scripts/audit-word-universe-source-distribution.ts`
- Modify: `scripts/validate-word-universe-promote-guards.ts`
- Modify: `scripts/promote-question-sets-v2.ts` only if guard hardening is needed
- Create: optional one-off script `scripts/mark-qb-word-universe-draft-blocked.ts`
- Create: `reports/word-universe-v2-cleanup-2026-07-05.md`

**Interfaces:**
- Consumes: current active Word Universe source distribution.
- Produces: active 100% gen guarantee and old qb draft cannot promote.

- [ ] **Step 1: Audit current source distribution**

Run:

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

Expected: active `qb` count is 0.

- [ ] **Step 2: Dry-run old qb draft handling**

Find old qb draft rows for the Word Universe task family:

```powershell
npx tsx scripts/audit-word-universe-source-distribution.ts --status=draft --json
```

Plan handling:

- mark as `rejected` if schema and app already tolerate rejected status
- otherwise keep `draft` and add `qa_flags.doNotPromote=true` plus `qa_flags.blockedReason='legacy_qb_not_for_promotion'`

Do not delete.

- [ ] **Step 3: Apply handling with manifest**

If a script is needed, it must support:

```powershell
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --dry-run
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --apply
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --apply
```

Expected second apply: 0 changes or all dup-skip.

- [ ] **Step 4: Confirm practice selection**

Check that v2 active is preferred when available, and no random fallback happens when a word has no v2 item.

Run:

```powershell
npm run validate:practice-session
npm run smoke:active-serve
```

- [ ] **Step 5: Validate**

Run:

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] **Step 6: Report and commit**

Create `reports/word-universe-v2-cleanup-2026-07-05.md`.

Commit:

```powershell
git add scripts reports
git commit -m "chore: guard legacy qb word-universe drafts"
```

---

## Task 6: Mojibake Cleanup In Reports And Script Comments

**Files:**
- Modify: `reports/toefl-full-mock-readiness-eval-2026-07-04.md`
- Modify: `scripts/verify-toefl-reading-expansion.ts`
- Modify: `scripts/build-toefl-reading-q4fix-promote-manifest.ts`
- Modify: other `reports/`, `scripts/`, or `docs/` files found by the grep below
- Create: `reports/mojibake-cleanup-2026-07-05.md`

**Interfaces:**
- Consumes: existing docs and comments.
- Produces: readable docs/comments without business logic changes.

- [ ] **Step 1: Find mojibake**

Run:

```powershell
rg "鈥|锛|鏉|涓|鍚|绾|鏃|褰|妫|坋|塦|鈫|鉁|鏍|膶|瀛|闂" reports scripts docs
```

- [ ] **Step 2: Rewrite comments and prose only**

Rules:

- do not change executable logic
- do not change SQL logic
- do not change manifest IDs
- do not change question content
- do not change validator expectations except readable text messages

- [ ] **Step 3: Validate no logic drift**

Run:

```powershell
git diff --word-diff -- scripts reports docs
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] **Step 4: Report and commit**

Create `reports/mojibake-cleanup-2026-07-05.md` with files cleaned and confirmation that only prose/comment/error-message text changed.

Commit:

```powershell
git add reports scripts docs
git commit -m "docs: clean mojibake in qbank reports and script comments"
```

---

## Task 7: Paper Smoke Performance Optimization

**Files:**
- Modify: `lib/papers/paper-generator.ts`
- Modify: `scripts/validate-paper-generator.ts`
- Modify: `scripts/check-paper-api-smoke.ts` only if timing instrumentation is needed
- Create: `reports/paper-smoke-performance-2026-07-05.md`

**Interfaces:**
- Consumes: current paper generator.
- Produces: fewer remote DB/Storage round trips while preserving safety.

- [ ] **Step 1: Measure baseline**

Run:

```powershell
Measure-Command { npm run validate:papers }
Measure-Command { npm run smoke:papers }
```

Record elapsed seconds.

- [ ] **Step 2: Identify serial DB loops**

Search:

```powershell
rg "await .*from\\(|for .*await|for \\(.* of .*\\).*await|createSignedUrl|signAudioPath" lib\papers scripts
```

- [ ] **Step 3: Batch fetch items and target words**

Replace per-set fetches with batched queries:

- collect selected set IDs
- fetch all `question_items` with `.in('question_set_id', ids)` in chunks
- fetch all `question_target_words` with `.in('question_item_id', itemIds)` in chunks
- group in memory

Keep chunk sizes safe for PostgREST URL limits.

- [ ] **Step 4: Keep audio signing secure**

Do not sign all candidates.

Correct behavior:

- use active audio IDs only as availability filter
- after final set selection, sign only selected listening stimuli
- do not include signed URLs in deterministic seed comparisons

- [ ] **Step 5: Validate performance and correctness**

Run:

```powershell
npm run validate:papers
npm run smoke:papers
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit --incremental false
```

Targets:

- `validate:papers` preferably under 90 seconds
- `smoke:papers` preferably under 120 seconds
- if remote services make this impossible, report actual timings and the remaining bottleneck

- [ ] **Step 6: Report and commit**

Create `reports/paper-smoke-performance-2026-07-05.md`.

Commit:

```powershell
git add lib scripts reports
git commit -m "perf: batch paper generator fetches"
```

---

## Task 8: Final Full Regression And Readiness Report

**Files:**
- Create: `reports/final-qbank-learning-loop-readiness-2026-07-05.md`
- Modify: summary/ledger files only if the project already uses them as canonical status reports

**Interfaces:**
- Consumes: all previous tasks.
- Produces: final user-facing state report and remaining decision list.

- [ ] **Step 1: Run full gate**

Run:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:practice-session
npm run validate:audio-assets
npm run validate:papers
npm run smoke:papers
npm run smoke:active-serve
npm run validate:exam-specs
npm run validate:question-types
npm run validate:data-quality
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

If available in `package.json`, also run:

```powershell
npm run smoke:paper-e2e
npm run full-routes
```

- [ ] **Step 2: Snapshot final DB counts**

Use existing snapshot scripts if available:

```powershell
npx tsx scripts/qbank-v2-snapshot.ts
```

Record:

- total sets
- active sets
- draft sets
- active items
- TOEFL active by task
- Word Universe active by source
- deprecated active count

- [ ] **Step 3: Write final report**

Create `reports/final-qbank-learning-loop-readiness-2026-07-05.md` with:

- TOEFL 专项状态
- TOEFL mock v1 status
- TOEFL speaking status
- build_a_sentence status
- IELTS status
- Word Universe active source status
- old qb draft handling
- DB writes by phase
- promote counts by phase
- all validation exit codes
- remaining user decisions

- [ ] **Step 4: Clean generated report side effects**

Run:

```powershell
git status --short
```

For validation JSON files that changed only by `generatedAt` or run timestamp, choose one:

- include them if this project convention commits refreshed validation reports
- restore them if they are incidental

Do not leave accidental dirty files.

- [ ] **Step 5: Commit final report**

```powershell
git add reports
git commit -m "docs: final qbank readiness report"
```

- [ ] **Step 6: Handoff**

Final message must include:

- overall conclusion: pass / conditional pass / blocked
- exact commits created
- DB writes and promote counts
- remaining user decisions
- any commands that failed, with reasons
- whether worktree is clean

---

## Final Stop Conditions

Stop immediately and report if any of these happen:

- TOEFL paper includes `build_a_sentence`.
- TOEFL paper includes `listen_and_repeat` or `interview_speaking`.
- TOEFL listening client payload contains transcript text.
- Client paper payload contains `answerKey`.
- IELTS starts drawing TOEFL/SAT/CET questions.
- Word Universe active `qb:` count becomes greater than 0.
- Deprecated task type becomes active.
- `validate:qbank-v2` reports active integrity errors.
- A promote apply partially succeeds without a rollback or manifest report.

If none of these happen, continue phase by phase until Task 8 is complete.

