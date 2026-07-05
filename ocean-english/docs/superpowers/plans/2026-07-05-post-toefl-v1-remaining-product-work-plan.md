# Post TOEFL Mock v1 Remaining Product Work Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the work that remains after TOEFL mock v1: TOEFL speaking, Build-a-Sentence activation, IELTS full question bank, legacy draft cleanup, performance hardening, and final product readiness.

**Architecture:** TOEFL mock v1 is already live without speaking/build-a-sentence. This plan keeps each remaining area isolated: speaking is a privacy/scoring product decision, Build-a-Sentence is a scoring-contract task, IELTS is a separate content-production program, legacy drafts are governance work, and performance work must not change paper semantics.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Postgres/Storage, v2 question bank, Azure TTS/STT where explicitly authorized, existing validation scripts and smoke tests.

## Global Constraints

- Do not call DeepSeek.
- Do not scrape or copy real exam questions. All new questions must be original and only model official format.
- Do not promote any content without manifest, dry-run, apply, idempotency rerun, QA, and report.
- Do not delete old rows unless the user explicitly approves deletion. Prefer reversible status/flag changes.
- TOEFL mock v1 must remain usable while these tasks proceed.
- IELTS must not silently fall back to TOEFL/SAT/CET content.
- Every task must end with a report in `reports/`, validation commands with exit codes, DB-write disclosure, and a clear stop/go recommendation.
- If a task finds answer leakage, transcript leakage, deprecated active rows, or accidental cross-exam fallback, stop immediately and report P0/P1.

---

## Current State

- TOEFL专项练习：Reading / Listening / complete_the_words / email_writing / academic_discussion 已可练。
- TOEFL mock v1：已开启，mini=Reading+Listening，full=Reading+Listening+Writing，不含 Speaking，不含 Build-a-Sentence。
- TOEFL未完成：Speaking pipeline、Build-a-Sentence activation、是否升级到完整四技能 mock。
- IELTS：第 8 档和 coming-soon 框架存在；完整 IELTS 题库/模考未建设。
- Word Universe：active 来源应为 Claude `gen:`，旧 `qb:` draft 已封存但未最终处置。
- 性能：paper smoke 已能通过，但仍可能超过 120 秒。

---

## Task 1: TOEFL Speaking Product Decision + Transcript-Only MVP

**Files:**
- Modify: `components/practice/renderers/FreeTextRenderer.tsx` or speaking-specific renderer if present
- Modify: `app/api/scoring/speaking/route.ts`
- Modify: `lib/scoring/score-speaking.ts`
- Modify: `lib/practice/session-builder.ts`
- Modify: `scripts/validate-practice-session.ts`
- Create: `reports/toefl-speaking-mvp-2026-07-05.md`

**Decision fixed for this task:** First release is transcript-only. Do not store user audio. Do not upload user audio. Do not claim official TOEFL speaking score.

- [ ] Confirm current speaking rows and route behavior:

```powershell
rg "listen_and_repeat|interview_speaking|speaking_ready|audioScoring|audioStorage" app components lib scripts data reports
npm run validate:rubrics
npm run validate:practice-session
```

- [ ] Ensure `/api/scoring/speaking` rejects audio payloads and accepts transcript only.

Required behavior:

```json
{ "audioStorage": "none", "audioScoring": "not_ready", "isEstimate": true }
```

If request body contains `audio`, `audioBlob`, `audioUrl`, or `file`, return:

```json
{ "ok": false, "error": "audio_upload_not_supported" }
```

- [ ] Update the speaking practice UI copy:

```text
口语练习当前按文字转写估分；录音不会上传或保存。本结果为练习估分，不是官方 TOEFL 分数。
```

- [ ] Keep speaking excluded from TOEFL mock.

Validate that:

- `listen_and_repeat` not in paper
- `interview_speaking` not in paper
- TOEFL full mock remains Reading + Listening + Writing

- [ ] Decide whether to promote existing speaking draft rows.

Default: do not promote. If promoting, promote at most 10 per type, with:

- transcript-only prompt QA
- rubric present
- `qa_flags.speaking_ready=true`
- manifest + dry-run + apply + idempotency rerun

- [ ] Run validation:

```powershell
npm run validate:practice-session
npm run validate:rubrics
npm run smoke:papers
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] Write `reports/toefl-speaking-mvp-2026-07-05.md`.

Report must state whether speaking is:

- practice-ready
- active or still draft
- included or excluded from mock
- storing audio or not

Commit:

```powershell
git add app components lib scripts reports
git commit -m "feat: define TOEFL speaking transcript-only MVP"
```

---

## Task 2: Build-a-Sentence Content Completion + Activation Decision

**Files:**
- Modify: source data for `build_a_sentence`
- Modify: `scripts/promote-question-sets-v2.ts` only if existing guard cannot recognize the accepted-sequence contract
- Modify: `supabase/sql/p5-question-bank-promotion-rpc.sql` only if RPC still rejects valid accepted-sequence answers
- Create: `reports/toefl-build-sentence-activation-readiness-2026-07-05.md`

**Decision fixed for this task:** Use accepted-sequence exact matching. Do not implement broad grammar equivalence.

- [ ] Audit current 10 draft Build-a-Sentence rows:

```powershell
rg "build_a_sentence|build_sentence|acceptedSequences|scoring_not_ready" data scripts lib reports
npx tsx scripts/verify-toefl-pilot.ts --db
```

- [ ] For each current draft row, add:

```json
{
  "canonical": ["..."],
  "acceptedSequences": [
    ["..."],
    ["..."]
  ],
  "scoring": "accepted_sequence_exact",
  "official": false
}
```

Requirements:

- 2 to 4 accepted sequences per item if genuinely acceptable
- canonical must be included
- all sequences same token count
- no broad grammar equivalence
- explanation must not claim official TOEFL answer

- [ ] Upgrade promote/RPC if needed.

The TypeScript promote guard and SQL RPC must both accept valid `accepted_sequence_exact` answer objects and reject invalid ones.

Rejection reasons should remain explicit:

- `build_sentence_scoring_not_ready`
- `accepted_sequences_missing`
- `accepted_sequence_invalid`

- [ ] Dry-run promote only after QA passes.

```powershell
npm run qa:qsets-v2
npx tsx scripts/promote-question-sets-v2.ts --task=build_a_sentence --limit=10
```

Expected before activation approval:

- all valid rows eligible
- invalid rows rejected with clear reasons

- [ ] Do not include Build-a-Sentence in TOEFL mock unless user explicitly asks.

Even if active for专项 practice, it remains excluded from mock v1.

- [ ] Run validation:

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run smoke:papers
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] Write report:

`reports/toefl-build-sentence-activation-readiness-2026-07-05.md`

Report:

- how many rows are ready
- how many remain blocked
- whether RPC was changed/applied
- whether any rows were promoted
- proof TOEFL mock still excludes it

Commit:

```powershell
git add data scripts supabase/sql reports lib
git commit -m "feat: prepare TOEFL build-a-sentence activation"
```

---

## Task 3: IELTS Question Bank Program Plan + Pilot

**Files:**
- Create: `docs/superpowers/plans/2026-07-05-ielts-question-bank-production-plan.md`
- Create/modify IELTS templates under `data/exam-task-templates/`
- Create IELTS pilot source files under `data/generated-question-sets/ielts-pilot-2026-07-05/`
- Create: `reports/ielts-pilot-2026-07-05.md`

**Decision fixed for this task:** Do not open IELTS mock yet. Build a pilot only.

- [ ] Research and document IELTS Academic format using official sources only.

Use web search if needed and cite official IELTS/British Council/IDP/Cambridge pages in the report.

At minimum document:

- Listening sections and question formats
- Academic Reading passage/task formats
- Writing Task 1 / Task 2
- Speaking parts 1/2/3
- timing and scoring caveats

- [ ] Create an IELTS production plan.

File:

```text
docs/superpowers/plans/2026-07-05-ielts-question-bank-production-plan.md
```

It must define target scale:

- Listening: pilot 20 sets first, eventual 200+
- Academic Reading: pilot 20 passages first, eventual 200+
- Writing Task 1: pilot 30 prompts first, eventual 150+
- Writing Task 2: pilot 30 prompts first, eventual 150+
- Speaking: pilot 30 prompt sets first, eventual 150+

- [ ] Create only a small IELTS pilot.

Pilot target:

- Academic Reading: 5 passages
- Writing Task 1: 10 prompts
- Writing Task 2: 10 prompts
- Speaking: 10 prompt sets
- Listening: do not generate audio unless user provides/approves provider and cost

All pilot content must be:

- original
- draft
- not active
- `exam_id='ielts'`
- `level=8`
- `qa_flags.source='original_authored'`

- [ ] Keep IELTS coming-soon.

Do not set IELTS `status='active'` for papers.
Do not set IELTS `paperReady=true`.

- [ ] Run validation:

```powershell
npm run validate:exam-specs
npm run validate:rubrics
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run smoke:papers
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] Write `reports/ielts-pilot-2026-07-05.md`.

Report:

- official sources used
- pilot counts
- DB writes
- why IELTS remains coming-soon
- what is required before IELTS can open

Commit:

```powershell
git add docs data reports scripts
git commit -m "feat: add IELTS pilot plan and draft content"
```

---

## Task 4: Legacy `qb:` Draft Final Disposition

**Files:**
- Modify: `scripts/mark-qb-word-universe-draft-blocked.ts`
- Modify: `scripts/audit-word-universe-source-distribution.ts`
- Create: `reports/qb-draft-final-disposition-2026-07-05.md`

**Decision fixed for this task:** Do not delete `qb:` rows. Keep them non-promotable.

- [ ] Audit current `qb:` rows:

```powershell
npm run audit:wu-source -- --status=draft
npm run audit:wu-source -- --status=active --fail-on-qb-active
```

- [ ] Confirm every old `qb:` Word Universe draft has:

```json
{
  "doNotPromote": true,
  "blockedReason": "legacy_qb_not_for_promotion"
}
```

- [ ] If not, run the blocker script:

```powershell
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --dry-run
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --apply
npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --apply
```

Expected second apply: 0 changes.

- [ ] Validate:

```powershell
npm run validate:wu-promote-guards
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:qbank-v2
npm run qa:qsets-v2
```

- [ ] Write report:

`reports/qb-draft-final-disposition-2026-07-05.md`

Commit:

```powershell
git add scripts reports
git commit -m "chore: finalize legacy qb draft disposition"
```

---

## Task 5: Paper Smoke Parallelization

**Files:**
- Modify: `scripts/check-paper-api-smoke.ts`
- Modify: `scripts/validate-paper-generator.ts` only if shared helper needed
- Create: `reports/paper-smoke-parallelization-2026-07-05.md`

**Goal:** Reduce `smoke:papers` below 120 seconds if possible without weakening safety checks.

- [ ] Measure baseline:

```powershell
Measure-Command { npm run smoke:papers }
```

- [ ] Parallelize at exam/mode level with bounded concurrency.

Use concurrency 2 or 3, not unlimited, to avoid Supabase rate limits.

Keep deterministic seed behavior.

Do not parallelize inside a single generated paper if it changes section order or seed draw order.

- [ ] Preserve exact refusal checks:

- IELTS must be `exam_coming_soon`
- active exams must generate or explicitly `insufficient_pool`
- TOEFL must generate mini/full
- `unknown_exam` is never an acceptable result for known exams

- [ ] Validate:

```powershell
npm run smoke:papers
npm run validate:papers
npm run lint
npx tsc --noEmit --incremental false
```

- [ ] Write report:

`reports/paper-smoke-parallelization-2026-07-05.md`

Report before/after time and concurrency level.

Commit:

```powershell
git add scripts reports
git commit -m "perf: parallelize paper smoke safely"
```

---

## Task 6: Content Human Review Queue

**Files:**
- Create: `reports/content-human-review-queue-2026-07-05.md`
- Create: optional `reports/content-human-review-sample-2026-07-05.json`

**Goal:** Produce a review queue for semantic quality that machines cannot fully certify.

- [ ] Build a sampled review set.

Include:

- TOEFL reading: 20 sets
- TOEFL listening: 20 sets
- TOEFL writing prompts: 20 sets
- Word Universe active gen: 30 sets
- SAT reading: 20 sets

- [ ] For each sample, include:

- task type
- prompt/stimulus
- choices
- answer
- explanation
- audio URL if listening
- source stage
- reviewer checklist

- [ ] Checklist fields:

```text
PASS / REVIEW / REJECT
answer unique?
distractors plausible?
level appropriate?
copy original?
audio natural?
notes
```

- [ ] Do not modify DB.

This task is report-only unless user asks to action review results.

- [ ] Write report and commit:

```powershell
git add reports
git commit -m "docs: add content human review queue"
```

---

## Task 7: Final Product Completion Report

**Files:**
- Create: `reports/post-toefl-v1-product-completion-2026-07-05.md`

- [ ] Run final gates:

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
npm run smoke:full-routes
npm run validate:exam-specs
npm run validate:question-types
npm run validate:data-quality
npm run validate:rubrics
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

- [ ] Write final report with:

- TOEFL专项 status
- TOEFL mock v1 status
- TOEFL speaking status
- Build-a-Sentence status
- IELTS status
- Word Universe status
- old qb draft status
- paper smoke performance
- remaining user decisions
- command exit table
- worktree status

- [ ] Clean report side effects:

```powershell
git status --short
```

Restore timestamp-only generated JSON changes unless they are intended final snapshots.

- [ ] Commit:

```powershell
git add reports
git commit -m "docs: post TOEFL v1 product completion report"
```

---

## Stop Conditions

Stop and report immediately if:

- TOEFL paper includes speaking without explicit user approval.
- TOEFL paper includes Build-a-Sentence without explicit user approval.
- IELTS returns anything other than coming-soon for papers before the IELTS program is approved.
- Any active question uses `antonym_choice` or `cet_cloze`.
- Any active Word Universe row has `qb:` source.
- Any client paper payload contains `answerKey`.
- Any listening client payload contains transcript before answer/review mode.
- Any DB apply writes unexpected row counts.

If none of these happen, complete tasks in order and hand off the final report.

