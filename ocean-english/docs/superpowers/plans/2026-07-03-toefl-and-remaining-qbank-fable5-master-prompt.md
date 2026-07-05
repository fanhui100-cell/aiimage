# TOEFL and Remaining Question Bank Fable5 Master Prompt

> **For Claude fable5 / Claude Code new conversation:** Read this file completely before editing. Execute the phases in order. After each phase, run the listed checks, write/update the phase report, self-review, commit only phase-owned files, then continue only if there is no hard-stop condition. If a phase requires an external product decision, stop and report the exact decision needed.

**Goal:** Finish the remaining Ocean English question-bank/runtime work after the current TOEFL listening/reading/build/speaking checkpoint, while keeping TOEFL full mock closed until it is genuinely ready.

**Architecture:** Canonical exam specs drive task availability. v2 question-bank rows are authored/validated as `draft`, promoted only through guarded scripts/RPC, and served only when `status='active'`. Practice sessions may expose answer/review data for learning mode, but papers/mock exams must remain server-scored and answer-key safe.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/PostgreSQL/RLS, v2 question bank, JSON authored content, `tsx` scripts, Playwright/smoke validators.

---

## 0. Current Verified State

Use these as the starting assumptions, then verify with commands before writing.

### Latest audit command already run

```powershell
npm run audit:qbank-v2-coverage
```

Latest observed summary:

- Total v2 sets: `6047`
- Total v2 items: `7291`
- Active sets: `2364`
- Draft sets: `3683`
- Canonical matrix: `49 rows`
- `READY_ACTIVE`: `40`
- `BLOCKED`: `5`
- `MISSING`: `4`
- `THIN`: `0`

### TOEFL current state

TOEFL is partially active:

| TOEFL task | Current | Target | Remaining |
|---|---:|---:|---:|
| `complete_the_words` | 70 active | 100 reviewed active | +30 draft, then optional promote |
| `email_writing` | 60 active | 100 reviewed active | +40 draft, then optional promote |
| `academic_discussion` | 60 active | 100 reviewed active | +40 draft, then optional promote |
| `choose_a_response` | 10 active | 100 reviewed active | +90 draft/audio, then optional promote |
| `listening_comprehension` | 10 active | 100 reviewed active | +90 draft/audio, then optional promote |
| `read_daily_life` | 10 draft / 24 items | 100 reviewed active sets | +90 draft, then optional promote 100 |
| `reading_comprehension` | 10 draft / 40 items | 100 reviewed active sets | +90 draft, then optional promote 100 |
| `build_a_sentence` | 10 draft, blocked | 100 active only after scoring/equivalence | implement scoring + +90 |
| `listen_and_repeat` | 10 draft, blocked | 100 active only after speaking pipeline | pipeline + +90 |
| `interview_speaking` | 10 draft, blocked | 100 active only after speaking pipeline | pipeline + +90 |

Important:

- TOEFL listening **专项** is active and playable.
- TOEFL full/mini mock **must remain closed**: `paperReady=false`.
- Do **not** set TOEFL `paperReady=true` until Reading, Listening, Writing/Build, and Speaking readiness decisions are all resolved and verified.

### IELTS current state

IELTS level 8 is in the canonical matrix but currently content-empty / coming-soon:

| IELTS task | Current | Long-term target | Remaining |
|---|---:|---:|---:|
| `listening_comprehension` | 0 | 50 | +50 + audio |
| `reading_comprehension` | 0 | 50 | +50 |
| `essay_writing` | 0 | 50 | +50 rubric prompts |
| `interview_speaking` | 0 | 50 | +50 + speaking pipeline |

Do not start IELTS content unless the user explicitly approves IELTS expansion. For now, keep IELTS `coming_soon`/not paper-ready.

### Known reports to read first

Read these before editing:

- `reports/qbank-v2-coverage-audit.md`
- `reports/toefl-task-alignment-validation.json`
- `reports/toefl-reading-pilot-2026-07-02.md`
- `reports/toefl-listening-promotion-2026-07-02.md`
- `reports/toefl-build-sentence-infrastructure-2026-07-02.md`
- `reports/toefl-speaking-pipeline-boundary-2026-07-02.md`
- `reports/qbank-production-issue-ledger.md`

---

## 1. Global Hard Rules

1. **No DeepSeek or paid generation API.** Content is Claude-authored original JSON unless the user explicitly authorizes another provider in the same turn.
2. **No copyrighted real exam questions.** Official ETS/IELTS sources may define format only. All passages, scripts, prompts, questions, options, and explanations must be original.
3. **Do not open TOEFL full mock yet.** Keep `paperReady=false` until a later explicit phase says otherwise and all checks pass.
4. **Do not promote blocked tasks.**
   - `build_a_sentence` remains blocked until scoring/equivalence exists.
   - `listen_and_repeat` / `interview_speaking` remain blocked until speaking capture/privacy/ASR/scoring exists.
5. **All new content starts as draft.**
6. **Promote only in a phase that explicitly says promote.**
7. **Never create or activate retired types:** `antonym_choice`, `cet_cloze`.
8. **No unrelated fallback.** Empty TOEFL paper section must not be filled with word-universe or unrelated task questions.
9. **Exact delete/replace only.** Never delete broadly by task/level/stage without first listing exact `legacy_id` and asserting status/type/stage.
10. **Preserve user work.** Do not run `git reset --hard`, `git clean -fd`, or broad checkout/restore.

## 1.1 Phase Execution Protocol

Claude must execute this document phase by phase. A phase is not complete until all of the following are true:

1. The phase-owned files are created/modified.
2. Every required command for the phase has been run and its real exit code recorded.
3. Every authored content item in the phase has a self-review result:
   - `PASS`: can remain a candidate;
   - `REVIEW`: keep draft, do not promote;
   - `REJECT`: remove/rewrite before import or leave out of candidate manifest.
4. A phase report is written under `reports/`.
5. A self-review checklist is completed in that report.
6. The phase is committed, unless the user explicitly says not to commit.
7. Claude stops and reports the phase result before starting the next phase, unless the user has explicitly said: "continue automatically through phases if self-review passes."

If the user authorizes automatic continuation, Claude may continue only when:

- the phase report has zero blocking issues;
- validators are green;
- no `REVIEW` or `REJECT` item was accidentally imported as active;
- no hard-stop condition occurred;
- no frontend/schema/provider/product decision is required.

## 1.2 Mandatory Content Self-Review Standard

For every newly authored question/prompt, Claude must review the content itself before claiming success. Shape validation is not enough.

Each content item must be checked against:

- **Originality:** not copied or lightly paraphrased from official/sample exams.
- **Exam fit:** topic, wording, difficulty, passage length, and reasoning match the target TOEFL task.
- **Single defensible answer:** objective questions have exactly one best answer.
- **Distractor quality:** distractors are plausible but clearly wrong from the text/audio/context.
- **No answer leakage:** prompt/stimulus does not reveal the answer before submission.
- **No stale wording:** no references like "last sentence", "above", "the chart" unless actually true.
- **No duplicate scenario:** not a cosmetic rewrite of an existing pilot/active item.
- **Rubric honesty:** productive tasks use `official=false`, no fake official answer/model score.
- **Metadata correctness:** stage, taskType, level, rubric, wordLimit, domain, source/provenance all match.

Every phase that authors content must include this table in its report:

| taskType | authored | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|

Rules:

- `REVIEW` items may be imported as draft only if explicitly marked and excluded from promote manifests.
- `REJECT` items must not be imported. If already imported, replace/delete exact rows and document old/new `legacy_id`.
- No phase may promote content unless its candidate manifest is 100% `PASS`.

## 1.3 Phase Report Required Format

At the end of every phase, Claude must report:

1. Phase name and commit hash.
2. Changed files.
3. DB writes by table/status/count, or "no DB writes".
4. Content counts before/after.
5. Self-review PASS/REVIEW/REJECT table.
6. Exact commands and exit codes.
7. Active/deprecated counts:
   - active total;
   - `antonym_choice = 0`;
   - `cet_cloze = 0`.
8. Any skipped items and reasons.
9. Whether TOEFL `paperReady` is still `false`.
10. Recommendation for the next phase.

Hard-stop if:

- any validator reports answer-key errors;
- any write count differs from expected;
- any active row appears outside an approved promote phase;
- any transcript/answer leaks before it should;
- official spec cannot be verified but the phase depends on it;
- audio generation/upload lacks checksum/provenance;
- promote leaves item/set status inconsistent;
- frontend behavior changes need design approval and none was granted.

---

## 2. Phase Overview

Execute in this order:

1. **F0: Baseline refresh and report reconciliation**
2. **F1: TOEFL Reading expansion to 100+100 draft**
3. **F2: TOEFL Reading semantic audit and optional promote**
4. **F2B: TOEFL active text-task top-up to 100**
5. **F3: TOEFL Listening expansion from 10+10 to 100+100**
6. **F4: Build a Sentence scoring/equivalence decision and implementation**
7. **F5: TOEFL Speaking pipeline decision and implementation**
8. **F6: TOEFL full mock readiness gate**
9. **F7: Optional IELTS expansion decision**
10. **F8: Word-universe / v2 active-pool cleanup**
11. **F9: Final full-product audit**

---

# F0: Baseline Refresh and Report Reconciliation

## Goal

Make all reports/scripts agree with the current state. In particular, coverage currently still labels TOEFL Reading as `official_spec_unverified`, while `validate:toefl-task-alignment` and the 2026-07-02 report treat it as `draft_ready` / spec-confirmed draft-only.

## Files

- Modify if needed: `scripts/audit-question-bank-v2-coverage.ts`
- Modify if needed: `scripts/validate-coverage-audit.ts`
- Regenerate:
  - `reports/qbank-v2-coverage-audit.md`
  - `reports/qbank-v2-coverage-audit.json`
  - `reports/toefl-task-alignment-validation.json`
- Update:
  - `reports/qbank-production-issue-ledger.md`

## Steps

- [ ] Run:

```powershell
git status --short
npm run validate:toefl-task-alignment
npm run audit:qbank-v2-coverage
```

- [ ] Confirm TOEFL Reading counts:
  - `read_daily_life`: `10 draft`, `24 items`
  - `reading_comprehension`: `10 draft`, `40 items`
- [ ] Update coverage logic so these two cells are no longer called `official_spec_unverified`.
- [ ] Use a state such as `READY_DRAFT` only if the audit threshold permits 10 draft; otherwise use a precise state/reason such as `PILOT_DRAFT` / `needs_90_more`.
- [ ] Do not alter DB rows.
- [ ] Update the ledger to mark old `official_spec_unverified` wording as superseded by `spec_confirmed_project_practice_shape`, with the warning that the 4-option MCQ is a project practice format, not a claimed exact ETS UI.

## Required commands

```powershell
npm run validate:toefl-task-alignment
npm run audit:qbank-v2-coverage
npm run validate:coverage-audit
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit --incremental false
```

## Acceptance

- Coverage and TOEFL alignment reports no longer contradict each other.
- TOEFL full mock remains closed.
- No DB writes.
- Commit and continue to F1 only if all commands pass.

---

# F1: TOEFL Reading Expansion to 100+100 Draft

## Goal

Expand TOEFL Reading from 10+10 draft to 100+100 draft:

- `read_daily_life`: add 90 sets.
- `reading_comprehension`: add 90 sets.

Do not promote yet.

## Files

- Create:
  - `data/generated-question-sets/toefl-reading-expansion-2026-07-03/toefl-read-daily-life-90.json`
  - `data/generated-question-sets/toefl-reading-expansion-2026-07-03/toefl-academic-reading-90.json`
- Create:
  - `scripts/verify-toefl-reading-expansion.ts`
- Create:
  - `reports/toefl-reading-expansion-2026-07-03.md`
  - `reports/toefl-reading-expansion-2026-07-03.json`

## Content requirements

### `read_daily_life`

Target: 90 new sets.

Batching rule: split the 90 new sets into three internally labelled sub-batches of 30. Validate each sub-batch before merging into the final stage file.

Each set:

- original campus/daily-life text;
- practical text type: notice, message, email, schedule update, policy note, club announcement, library/service notice;
- 2 or 3 selected-response items;
- 4 choices per item because this is the project practice shape;
- no claim that ETS mandates exactly 4 options;
- answer must be uniquely supported by the text;
- distractors plausible but textually contradicted or unsupported;
- total new items should be about 96 if matching the current 24 items / 10 sets pattern.

### `reading_comprehension`

Target: 90 new sets.

Batching rule: split the 90 new sets into three internally labelled sub-batches of 30. Validate each sub-batch before merging into the final stage file.

Each set:

- original academic passage;
- 120-220 words unless template validator says otherwise;
- 4 items per passage;
- 4 choices per item;
- item mix: main idea, detail, inference, vocabulary-in-context, function/purpose;
- answer uniquely supported by passage;
- avoid real ETS passages/questions.

## Import flow

Run dry-run first:

```powershell
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03
```

Then apply:

```powershell
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03 --apply
```

Then idempotency:

```powershell
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03 --apply
```

Expected:

- first apply writes `180` sets;
- second apply writes `0` and duplicate-skips `180`;
- all rows remain `draft`;
- no active changes.

## Verification

The verifier must assert:

- source count = DB count;
- `read_daily_life` total draft after expansion = `100`;
- `reading_comprehension` total draft after expansion = `100`;
- no source-outside-DB rows;
- no DB-outside-source rows for this stage;
- every item has exactly 4 choices;
- every answer hits choice id/text;
- every set is draft;
- no deprecated type.

## Required commands

```powershell
npx tsx scripts/verify-toefl-reading-expansion.ts --source
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03 --apply
npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03 --apply
npx tsx scripts/verify-toefl-reading-expansion.ts --db
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:toefl-task-alignment
npm run lint
npx tsc --noEmit --incremental false
```

## Acceptance

- 180 new draft reading sets imported.
- Reading total is 100+100 draft.
- Semantic self-review says PASS/REVIEW/REJECT for all 180 newly authored reading sets.
- No promote.
- TOEFL `paperReady=false`.

---

# F2: TOEFL Reading Semantic Audit and Optional Promote

## Goal

Audit all 200 TOEFL Reading draft sets (`100 read_daily_life`, `100 reading_comprehension`) and optionally promote only after user/Codex approval.

## Files

- Create:
  - `scripts/audit-toefl-reading-semantics.ts`
  - `reports/toefl-reading-semantic-audit-2026-07-03.md`
  - `reports/toefl-reading-semantic-audit-2026-07-03.json`
- If promoting:
  - create exact manifest `reports/toefl-reading-promote-manifest-2026-07-03.json`
  - create final report `reports/toefl-reading-promotion-2026-07-03.md`

## Semantic audit checklist

Review 100% of Reading sets:

- passage is coherent and original;
- question corresponds to passage;
- exactly one correct answer;
- distractors are plausible but wrong;
- no answer by trivial word overlap only;
- no stale wording such as "last sentence" after passage edits;
- vocabulary-in-context answer matches local meaning;
- difficulty is TOEFL-appropriate;
- no repeated passage skeletons or near-duplicate item stems.

## Promote gate

Do **not** promote unless the user explicitly says:

```text
Promote TOEFL Reading reviewed manifest.
```

If approved:

- promote exact manifest only;
- do not promote by broad task/type;
- `read_daily_life` active delta must be exactly `+100`;
- `reading_comprehension` active delta must be exactly `+100`;
- no unrelated rows change.

## Required commands

Without promote:

```powershell
npx tsx scripts/audit-toefl-reading-semantics.ts
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run audit:qbank-v2-coverage
npm run lint
npx tsc --noEmit --incremental false
```

With approved promote:

```powershell
npm run promote:qsets-v2 -- --manifest=reports/toefl-reading-promote-manifest-2026-07-03.json
npm run promote:qsets-v2 -- --manifest=reports/toefl-reading-promote-manifest-2026-07-03.json --apply
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run smoke:active-serve
npm run audit:qbank-v2-coverage
```

## Acceptance

- All promoted rows, if any, are semantically reviewed PASS.
- No `paperReady=true`.
- TOEFL Reading专项 can be practiced after promote.
- Full mock remains closed.

---

# F2B: TOEFL Active Text-Task Top-Up to 100

## Goal

Bring the already-usable non-audio TOEFL text tasks up to 100 reviewed items each:

- `complete_the_words`: current 70 active, add 30 draft, then optional promote to 100 active.
- `email_writing`: current 60 active, add 40 draft, then optional promote to 100 active.
- `academic_discussion`: current 60 active, add 40 draft, then optional promote to 100 active.

Do not touch `build_a_sentence` in this phase.

## Files

- Create:
  - `data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-complete-the-words-30.json`
  - `data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-email-writing-40.productive.json`
  - `data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-discussion-40.productive.json`
- Create:
  - `scripts/verify-toefl-text-topup.ts`
  - `reports/toefl-text-topup-2026-07-03.md`
  - `reports/toefl-text-topup-2026-07-03.json`

## Content requirements

### `complete_the_words`

Target: 30 new sets.

Each set:

- original 25-55 word context;
- one partially masked target word;
- no definition-only template;
- target word must exist in dictionary if `word_id` is required by importer;
- no full answer word may appear in client stimulus before answer;
- difficulty appropriate for TOEFL level 6;
- broad letter/topic coverage, not just a/b/k or previous weak letters.

### `email_writing`

Target: 40 new prompts.

Each prompt:

- clear TOEFL-style campus email task;
- asks for 2-3 concrete actions/details;
- non-official rubric-scored answer placeholder;
- `official=false`;
- `wordLimit` must be project guidance, not claimed official ETS requirement;
- no duplicate core scenario against the existing 60.

### `academic_discussion`

Target: 40 new prompts.

Each prompt:

- professor question plus two student views when the existing template expects that shape;
- original academic/social topic;
- no duplicate core scenario against the existing 60;
- reference points are scoring guidance, not a model answer;
- rubric linked to TOEFL writing.

## Import flow

Use the objective importer for complete words:

```powershell
npm run import:authored-qsets-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-complete-the-words-30.json --stage=toefl-text-topup-2026-07-03
npm run import:authored-qsets-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-complete-the-words-30.json --stage=toefl-text-topup-2026-07-03 --apply
npm run import:authored-qsets-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-complete-the-words-30.json --stage=toefl-text-topup-2026-07-03 --apply
```

Use the productive importer for email/discussion if the project requires separate productive import:

```powershell
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-email-writing-40.productive.json --stage=toefl-text-topup-2026-07-03
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-email-writing-40.productive.json --stage=toefl-text-topup-2026-07-03 --apply
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-email-writing-40.productive.json --stage=toefl-text-topup-2026-07-03 --apply
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-discussion-40.productive.json --stage=toefl-text-topup-2026-07-03
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-discussion-40.productive.json --stage=toefl-text-topup-2026-07-03 --apply
npm run import:authored-productive-v2 -- --file=data/generated-question-sets/toefl-text-topup-2026-07-03/toefl-discussion-40.productive.json --stage=toefl-text-topup-2026-07-03 --apply
```

Expected:

- first successful imports write exactly 110 new draft sets/prompts total;
- idempotent rerun writes 0;
- no active changes unless separately approved.

## Optional promote gate

Do not promote unless the user explicitly approves:

```text
Promote TOEFL text top-up manifest.
```

If approved:

- promote exact manifest only;
- active delta:
  - `complete_the_words`: +30
  - `email_writing`: +40
  - `academic_discussion`: +40
- final active counts: all three = 100.

## Required commands

```powershell
npx tsx scripts/verify-toefl-text-topup.ts --source
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:rubrics
npm run validate:toefl-task-alignment
npm run lint
npx tsc --noEmit --incremental false
```

After import:

```powershell
npx tsx scripts/verify-toefl-text-topup.ts --db
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run lint
npx tsc --noEmit --incremental false
```

## Acceptance

- 110 new draft records imported.
- Source-to-DB exact verification passes.
- No duplicate scenario or answer leak.
- No promote unless explicitly approved.
- TOEFL full mock remains closed.

---

# F3: TOEFL Listening Expansion from 10+10 to 100+100

## Goal

Expand TOEFL listening active pools:

- `choose_a_response`: current 10 active, target 100 active, add +90.
- `listening_comprehension`: current 10 active, target 100 active, add +90.

## Files

- Create:
  - `data/generated-question-sets/toefl-listening-expansion-2026-07-03/toefl-choose-a-response-90.json`
  - `data/generated-question-sets/toefl-listening-expansion-2026-07-03/toefl-listening-mcq-90.json`
- Create/update:
  - `scripts/verify-toefl-listening-expansion.ts`
  - `reports/toefl-listening-expansion-2026-07-03.md`
  - `reports/toefl-listening-expansion-2026-07-03.json`

## Requirements

For every new listening set:

- original script/transcript;
- answer is supported by audio script;
- no transcript leaks before answer;
- generated audio asset linked to stimulus;
- active audio only after machine and human review;
- `choose_a_response` one item per set;
- `listening_comprehension` three items per set unless current template says otherwise;
- 4 choices per item because this is the project practice shape.
- expected new content volume is `90 + 90 = 180` listening sets total before any promote.

## Audio flow

Use the existing audio pipeline and existing reports as examples:

- `reports/toefl-listening-pilot-2026-07-01.md`
- `reports/toefl-listening-content-audit-2026-07-02.md`
- `reports/toefl-listening-promotion-2026-07-02.md`

If credentials/provider are unavailable, stop and report `audio_missing`. Do not fake audio rows.

If `generate:audio-assets` does not support `--stage`, do not pretend it ran. Either add a small, reviewed stage/filter option to the audio generator in this phase, or stop and report the exact missing script support.

## Required commands

```powershell
npx tsx scripts/verify-toefl-listening-expansion.ts --source
npm run import:authored-qsets-v2 -- --stage=toefl-listening-expansion-2026-07-03
npm run import:authored-qsets-v2 -- --stage=toefl-listening-expansion-2026-07-03 --apply
npm run generate:audio-assets -- --stage=toefl-listening-expansion-2026-07-03 --apply
npm run validate:audio-assets
npx tsx scripts/verify-toefl-listening-expansion.ts --db
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run smoke:active-serve
npm run lint
npx tsc --noEmit --incremental false
```

Promote only after human audio review and explicit approval.

## Acceptance

- 180 new listening sets exist as draft first: 90 `choose_a_response` and 90 `listening_comprehension`.
- 180 matching audio assets exist and pass validation before any listening promote.
- After approved promote, both TOEFL listening task types have 100 active sets.
- Client payload has signed audio URL and no transcript.
- TOEFL full mock still closed.

---

# F4: Build a Sentence Scoring / Equivalence

## Goal

Decide whether `build_a_sentence` will become active or stay permanently draft-only.

Current:

- 10 draft.
- Renderer/session payload exists.
- It shows canonical/reference order only.
- `scoring_not_ready` blocks promote.

Target if enabled:

- scoring/equivalence contract implemented;
- 100 reviewed draft sets;
- 100 active only after validation.

## Required product decision

Before coding scoring, ask user/Codex:

```text
Do we want build_a_sentence to be machine-scored now?
If yes, choose one:
1. Exact canonical order only, with clear UI wording that this is project scoring.
2. Accepted sequences list per item.
3. Rule-based equivalence for movable adjuncts/PPs.
4. Keep blocked and do not include it in active TOEFL.
```

Do not guess.

## If option 4 is chosen

- Keep `scoring_not_ready`.
- Keep promote guard.
- Update release/readiness docs.
- Do not generate more.

## If option 1/2/3 is chosen

Files likely touched:

- `lib/papers/scoring.ts`
- `lib/practice/session-builder.ts`
- `components/practice/renderers/BuildSentenceRenderer.tsx`
- `scripts/validate-practice-answer-contracts.ts`
- `lib/exam-task-templates/shape.ts`
- import/source JSON for 90 more items.

Required behavior:

- no pre-submit answer leak;
- submit user order;
- score according to chosen contract;
- show canonical/reference and acceptable alternatives after submit;
- record attempts without fabricated correctness outside the chosen contract;
- promote guard only unlocks after validator proves scoring-ready.

Required commands:

```powershell
npx tsx scripts/validate-practice-answer-contracts.ts
npm run validate:practice-session
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run lint
npx tsc --noEmit --incremental false
```

Acceptance:

- If still blocked, docs clearly say so.
- If enabled, 100 reviewed sets and scoring tests pass.

---

# F5: TOEFL Speaking Pipeline

## Goal

Decide and implement the actual speaking path before promoting `listen_and_repeat` or `interview_speaking`.

Current:

- `listen_and_repeat`: 10 draft.
- `interview_speaking`: 10 draft.
- `inputMode='speak'` now routes to free-text/transcript path, preventing choice/spell fallback.
- No microphone capture/storage/ASR/audio scoring exists.
- `/api/scoring/speaking` is transcript-only estimate.
- Promote guard rejects `speaking_pipeline_not_ready`.

Target:

- 100 sets per speaking type.
- prompt audio ready.
- user response flow decided.
- scoring is honest and non-official.
- promote only when `speaking_ready=true` is justified.

## Required product decisions

Ask the user before implementing:

1. Should Ocean English record user microphone audio?
2. If yes, should audio be:
   - not stored, only transcribed in browser/session;
   - temporarily stored;
   - permanently stored in user-owned private storage?
3. Which ASR provider should be used?
4. Is transcript-only scoring acceptable for first release?
5. Should speaking be available only as practice, not mock-paper scoring, in the first release?

## Implementation if approved

Files likely touched:

- `components/practice/renderers/SpeakingRenderer.tsx` or extend `FreeTextRenderer`
- `components/practice/PracticeRunner.tsx`
- `app/api/scoring/speaking/route.ts`
- `lib/scoring/score-speaking.ts`
- `lib/practice/attempt-recorder.ts`
- `scripts/validate-practice-answer-contracts.ts`
- `scripts/smoke-speaking-practice.ts`
- speaking source JSON expansion to +90/+90.

Rules:

- no microphone capture without consent UI;
- no audio storage without privacy decision;
- no official score claim;
- if transcript-only, label it clearly;
- `listen_and_repeat` prompt audio must be available before active;
- `interview_speaking` prompt audio or text prompt format must be decided.

Required commands:

```powershell
npm run validate:rubrics
npx tsx scripts/validate-practice-answer-contracts.ts
npm run validate:practice-session
npx tsx scripts/smoke-speaking-practice.ts
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit --incremental false
```

Acceptance:

- If no product decision, remain blocked and document.
- If implemented, both speaking tasks have 100 reviewed draft sets and a verified runtime flow.
- Promote only with explicit approval.

---

# F6: TOEFL Full Mock Readiness Gate

## Goal

Decide when TOEFL full/mini paper can open.

Current required state:

- Keep `paperReady=false`.

Only consider setting true when:

- Reading has enough active reviewed sets.
- Listening has enough active reviewed sets and active audio.
- Writing active tasks are enough for a coherent paper.
- Build-a-sentence is either active with scoring or explicitly excluded by product decision.
- Speaking is either active with pipeline or explicitly excluded by product decision.
- `generatePaper({ examId:'toefl', mode:'full' })` can build a non-fragmented paper without unrelated fallback.

## Files

- `lib/exam-specs/specs.ts`
- `lib/papers/paper-generator.ts`
- `scripts/validate-paper-generator.ts`
- `reports/toefl-paper-readiness-2026-07-03.md`

## Required commands

```powershell
npm run validate:papers
npm run validate:papers:full
npm run smoke:papers
npm run validate:toefl-task-alignment
npm run audit:qbank-v2-coverage
npm run lint
npx tsc --noEmit --incremental false
```

Acceptance:

- If not ready, report exact blockers and leave `paperReady=false`.
- If ready, set `paperReady=true`, run paper smoke, and verify no answer/transcript leak.

---

# F7: Optional IELTS Expansion

## Goal

IELTS is currently MISSING 4 cells. Do not start unless the user explicitly says to build IELTS.

Target if approved:

- IELTS listening: 50
- IELTS reading: 50
- IELTS writing essay: 50
- IELTS speaking interview: 50

Required first step:

- Research official IELTS format from authoritative sources.
- Create `docs/superpowers/specs/2026-07-03-ielts-format-and-qbank-scope.md`.
- Ask user whether IELTS should be:
  1. learning-mode only,
  2. full mock,
  3. coming-soon with no content yet.

Do not generate IELTS content before this decision.

---

# F8: Word-Universe and v2 Active-Pool Cleanup

## Goal

Clean up remaining v2 word-universe warnings without destabilizing current v1/v2 hybrid practice.

Current observation:

- Active TOEFL word-universe has substantial gen content for selected types.
- Many level/task active-pool warnings remain for word-universe drill types because v2 active is not complete across all levels.
- This does not block TOEFL full mock directly.

Recommended target only if user asks for v2-only word-universe:

- For each active level 1-8 and each retained word-universe type, at least 50 active reviewed v2 items, or a documented fallback to v1.

Tasks:

- Audit which `/drill` and `/quiz` paths still rely on v1 fallback.
- Decide whether v1 fallback is accepted long-term.
- If replacing, generate/premote by level/type in small batches.
- Keep `qb`/DeepSeek sources blocked unless user explicitly accepts them.

Required commands:

```powershell
npm run audit:wu-source
npm run validate:wu-promote-guards
npm run validate:practice-session
npm run smoke:active-serve
npm run lint
npx tsc --noEmit --incremental false
```

---

# F9: Final Full-Product Audit

## Goal

After any of F1-F8 changes, rerun the whole product audit.

Required commands:

```powershell
npm run validate:dictionary
npm run validate:question-types
npm run validate:exam-specs
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:audio-assets
npm run validate:papers
npm run validate:rubrics
npm run validate:learning-loop
npm run validate:data-quality
npm run audit:vocab-levels
npm run audit:qbank-v2-coverage
npm run analyze:lexigraph
npm run verify:toefl-current
npm run smoke:papers
npm run smoke:full-routes
npm run smoke:paper-e2e
npm run smoke:learning-loop-e2e
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

Reports to update:

- `reports/qbank-production-final-summary.md`
- `reports/qbank-production-issue-ledger.md`
- `reports/qbank-v2-coverage-audit.md`
- `reports/release-readiness-2026-07-03.md`

Final classification must list:

- ACTIVE_READY
- DRAFT_READY_NOT_PROMOTED
- BLOCKED_AUDIO
- BLOCKED_SPEC
- BLOCKED_RUNTIME
- INSUFFICIENT_CONTENT
- COMING_SOON

Do not call the project complete while TOEFL full mock or IELTS remains blocked/coming-soon.

---

## First Prompt to Send Claude fable5

Copy this:

```text
You are working in D:\ai-studio\ocean-english.

Read docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md completely before editing.

Execute F0 only first: Baseline Refresh and Report Reconciliation.

Do not generate new questions, do not promote anything, do not change TOEFL paperReady, and do not touch IELTS content in F0.

Your F0 job is to make the coverage/audit reports agree with the current verified TOEFL state:
- read_daily_life has 10 draft sets / 24 items;
- reading_comprehension has 10 draft sets / 40 items;
- validate:toefl-task-alignment treats both as spec-confirmed draft-only;
- TOEFL full/mini mock remains closed with paperReady=false.

Run all F0 commands, record real exit codes, update only F0-owned reports/scripts, commit only F0-owned files, then stop and return the handoff report.

If any DB count differs from the plan, or any command fails, stop and report exact evidence instead of guessing.
```
