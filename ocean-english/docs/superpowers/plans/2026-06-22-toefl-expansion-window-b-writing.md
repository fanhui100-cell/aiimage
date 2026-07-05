# TOEFL Expansion Window B: Email and Academic Discussion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exactly 40 new TOEFL 2026 `email_writing` drafts and 40 new `academic_discussion` drafts so both confirmed pools reach 50, with full rubric metadata and no activation.

**Architecture:** This window owns one new productive stage directory, one stage-specific verifier, and stage-specific reports. It reuses the existing productive importer and TOEFL writing rubric without changing shared infrastructure. All content remains draft and explicitly nonofficial; the canonical verifier and final summary are updated centrally after both windows finish.

**Tech Stack:** TypeScript, Node/tsx, Supabase/Postgres, JSON productive-task sources, existing rubric and v2 question-bank pipeline.

---

## 0. Paste This Entire Document Into Claude Code

You are **Window B** in a two-window parallel production run. You have no useful chat history. Treat this document as the complete and binding specification. Do not infer requirements from memory and do not broaden scope.

### Parallel Ownership

You exclusively own:

- `data/generated-question-sets/toefl-2026-expansion-b/`
- `scripts/verify-toefl-writing-expansion.ts`
- `reports/toefl-2026-writing-expansion-b.md`
- `reports/toefl-2026-writing-expansion-b.json`

You must not modify:

- `scripts/verify-toefl-pilot.ts`
- either authored importer
- rubric definitions, scoring engine, API routes, templates, shape code, schema
- `reports/qbank-production-final-summary.md`
- `reports/qbank-production-issue-ledger.*`
- `reports/toefl-2026-non-audio-*`
- frontend, paper generator, rate limits, audio code
- Window A's directory, verifier, or reports

If any requirement appears to need a forbidden file, stop and report the blocker. Do not edit shared infrastructure.

## 1. Hard Preconditions

- [ ] Confirm this worktree was created from the same accepted checkpoint commit as Window A.
- [ ] Confirm this is not Window A's filesystem directory.
- [ ] Confirm `.env.local` exists locally and remains untracked.
- [ ] Save `git status --short` in the stage report.
- [ ] Run `npx tsx scripts/qbank-v2-snapshot.ts`.

Expected database baseline before either expansion writes:

```text
totalSets = 4878
activeTotal = 0
antonym_choice = 0
cet_cloze = 0
email_writing draft = 10
academic_discussion draft = 10
```

Because Window A may write concurrently, `totalSets` may increase by up to 40 after this initial snapshot. That is acceptable only if the new rows are `complete_the_words` draft rows from Window A. Any other unexplained drift is a hard stop.

- [ ] Run `npx tsx scripts/verify-toefl-pilot.ts` before any expansion write.
- [ ] Confirm it exits 0 and reports 10 existing drafts for each owned task type.

## 2. Official Scope

Use only:

- `reports/toefl-2026-non-audio-spec-check.md`
- `.firecrawl/toefl-spec-2026.md`
- existing pilot source files
- existing TOEFL writing rubric in `lib/scoring/rubrics.ts`

Confirmed characteristics:

### Write an Email

- academic navigational language use
- multi-sentence response to a common academic-context situation
- AI/rubric scored, max 5 points
- CEFR target B1-C2

### Write for an Academic Discussion

- academic language use
- paragraph response with a clear, supported argument
- AI/rubric scored, max 5 points
- CEFR target B1-C2

ETS does not provide a binding word count in the locally retained Blueprint. Every `wordLimit` must begin exactly with:

```text
Project guidance (not an official TOEFL requirement):
```

Do not present project guidance as official scoring policy.

## 3. Exact Production Target

Create exactly:

- 40 new `email_writing` tasks
- 40 new `academic_discussion` tasks

Combined with the existing 10 in each pool, final DB targets are:

```text
email_writing draft = 50
academic_discussion draft = 50
```

Do not create `build_a_sentence`, reading, listening, speaking, or any other task type.

## 4. Source Files

Create:

- `data/generated-question-sets/toefl-2026-expansion-b/toefl-email-40.productive.json`
- `data/generated-question-sets/toefl-2026-expansion-b/toefl-discussion-40.productive.json`

Email top-level structure:

```json
{
  "examId": "toefl",
  "level": 6,
  "skill": "writing",
  "taskType": "email_writing",
  "tasks": []
}
```

Discussion top-level structure:

```json
{
  "examId": "toefl",
  "level": 6,
  "skill": "writing",
  "taskType": "academic_discussion",
  "tasks": []
}
```

Each task must contain:

```json
{
  "prompt": "Complete original English prompt.",
  "promptZh": "Accurate Chinese summary, not an answer.",
  "referencePoints": ["Scoring focus 1", "Scoring focus 2", "Scoring focus 3", "Scoring focus 4"],
  "wordLimit": "Project guidance (not an official TOEFL requirement): ..."
}
```

No official answer, model essay, unique translation, or fabricated ETS score may be included.

## 5. Email Content Matrix

Produce exactly 40 emails, five in each category:

| Category | Count |
|---|---:|
| course scheduling, absence, deadline, clarification | 5 |
| instructor, adviser, or teaching-assistant communication | 5 |
| library, laboratory, tutoring, or academic support | 5 |
| group project, presentation, club, or campus event | 5 |
| housing, dining, transportation, or campus facilities | 5 |
| application, recommendation, internship, or research opportunity | 5 |
| registration, records, fees, identification, or student services | 5 |
| complaint, repair, accessibility, safety, or conflict resolution | 5 |

Every email prompt must:

1. Identify sender role, recipient, relationship, and situation.
2. Require exactly 3-4 communicative actions.
3. Make tone/register assessable.
4. Avoid requiring specialist or culture-specific knowledge.
5. Differ materially from all existing 10 prompts and the other 39 new prompts.
6. Avoid merely swapping names, dates, or objects in the same scenario.
7. Use project guidance of roughly 90-140 words, clearly labelled nonofficial.
8. Include 4-6 `referencePoints` covering task completion, organization, tone, grammar, and vocabulary.
9. Keep `referencePoints` as scoring guidance, not a hidden model answer.

## 6. Academic Discussion Content Matrix

Produce exactly 40 discussions, five in each domain:

| Domain | Count |
|---|---:|
| education and learning | 5 |
| technology and society | 5 |
| environment and public policy | 5 |
| economics and work | 5 |
| health and psychology | 5 |
| cities, transport, and community | 5 |
| media, culture, and ethics | 5 |
| science, research, and innovation | 5 |

Every discussion must include:

1. A professor framing a genuinely debatable question.
2. Two named students giving distinct, defensible viewpoints.
3. No false factual premise and no one obviously absurd viewpoint.
4. A prompt requiring the test taker to state and support an opinion and add to the discussion.
5. Sufficient contrast to permit agreement, disagreement, synthesis, or a third position.
6. No repeated professor/student-name combination within the 40.
7. No topic duplicated from the existing pilot 10 unless the underlying policy question is materially different.
8. Project guidance of roughly 100 or more words, explicitly labelled nonofficial.
9. 4-6 `referencePoints` covering position, support, engagement with a peer, organization, grammar, and vocabulary.

## 7. Quality and Safety Rules

For all 80 tasks:

- Claude authors the content directly.
- No DeepSeek or external generation API.
- No copied or lightly paraphrased ETS questions.
- No model answer or official score claim.
- No sensitive personal-data scenario requiring disclosure.
- No partisan persuasion prompt tied to a current real-world candidate.
- No discriminatory premise or stereotyped role assignment.
- No prompt whose answer depends on current law, current prices, or unstable facts.
- `promptZh` must accurately summarize the task but must not solve it.
- All prompts must be unique under normalized lowercase whitespace.
- Existing pilot prompts must also be included in duplicate detection.

Author in eight batches of 10: four email batches and four discussion batches. After each batch, self-review every prompt before moving on.

## 8. Stage-Specific Verifier

Create `scripts/verify-toefl-writing-expansion.ts` as a read-only verifier.

It must:

1. Load both new files and both existing pilot files for duplicate detection.
2. Require exactly 40 new tasks per type.
3. Validate top-level exam/level/skill/taskType fields.
4. Require nonempty `prompt`, `promptZh`, 4-6 nonempty `referencePoints`, and nonempty `wordLimit`.
5. Require every `wordLimit` to begin with the exact nonofficial prefix.
6. Reject normalized duplicate prompts within new files or against existing pilot prompts.
7. Validate the email and discussion category matrices exactly.
8. Reproduce productive importer hash compatibility:
   - no source text: hash `examId|taskType|level|prompt`
   - source text present: hash `examId|taskType|level|prompt|sourceTextZh|sourceTextEn`
9. Derive every expected `gen:productive:<taskType>:set:claude:<tag>` legacy ID.
10. After apply, require one draft set and exactly one item per expected source task.
11. Compare DB payload to source:
    - set `task_type`, level, status
    - `qa_flags.wordLimit`
    - item `input_mode='free_text'`
    - prompt and prompt_zh
    - exact `answer.referencePoints`
    - `answer.type='rubric_scored'`
    - `answer.official=false`
    - nonempty rubric_id matching the TOEFL writing rubric resolved from DB
12. Reverse-check that the expansion stage contains no source-external set.
13. Assert owned task totals are exactly 50 after apply.
14. Assert global active/deprecated counts remain zero.
15. Exit 1 on DB errors or any mismatch; never ignore exceptions.

The verifier must support source-only pre-apply validation and strict DB validation after apply.

## 9. Dry Run

Run:

```powershell
npx tsx scripts/import-authored-productive-tasks-v2.ts --stage=toefl-2026-expansion-b
```

Expected:

```text
email_writing tasks = 40
academic_discussion tasks = 40
DB writes = 0
```

Then run the stage verifier in source-only mode. Fix content, never weaken validation.

Before apply, manually inspect at least:

- 10 email prompts, spanning all 8 categories
- 10 discussion prompts, spanning all 8 domains
- every prompt flagged by duplicate or length checks

## 10. Apply and Idempotency

Only after source QA passes:

```powershell
npx tsx scripts/import-authored-productive-tasks-v2.ts --stage=toefl-2026-expansion-b --apply
```

Expected first apply:

```text
wrote = 80
dup = 0
all sets/items draft
rubric coverage = 80/80
```

Immediately rerun the exact apply command.

Expected:

```text
wrote = 0
dup = 80
```

Any other result is a hard stop. Do not use delete/reimport to hide a mismatch.

## 11. Post-Apply Verification

- [ ] Run the stage verifier in strict DB mode.
- [ ] Confirm `email_writing=50 draft` and `academic_discussion=50 draft`.
- [ ] Confirm all 80 new items have rubric IDs, `free_text`, and `official=false`.
- [ ] Confirm exact prompt, promptZh, referencePoints, and wordLimit source→DB consistency.
- [ ] Run:

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:rubrics
npm run validate:question-types
npm run lint
npx tsc --noEmit
npx tsx scripts/qbank-v2-snapshot.ts
```

Do not edit or run the canonical `verify-toefl-pilot.ts` as a final assertion; it still expects the pre-integration 10-set pools. Central integration will update it after both windows finish.

Do not run answer-position normalization; productive tasks have no choice positions.

## 12. Reports

Create:

- `reports/toefl-2026-writing-expansion-b.md`
- `reports/toefl-2026-writing-expansion-b.json`

Include:

1. Starting commit/worktree/status.
2. Changed files.
3. Exact source counts by task type and category/domain.
4. Duplicate-check results against the existing pilot and new content.
5. Dry-run, first apply, and idempotency counts.
6. DB set/item/status/rubric counts.
7. Five sample legacy IDs per task type.
8. At least five detailed manual-review examples per type.
9. Rejected/replaced prompt counts and reasons.
10. Actual validation commands and exit codes.
11. Active/deprecated invariants.
12. Explicit no-DeepSeek/no-copy/no-promote/no-shared-file statement.
13. Files deferred to central integration.

## 13. Hard Stops

Stop immediately if:

- baseline or worktree isolation is wrong
- active/deprecated data exists
- any prompt is copied or suspiciously close to published material
- rubric is missing
- nonofficial guidance is presented as official
- source count is not exactly 40+40
- dry-run or source verifier fails
- first apply writes other than exactly 80
- idempotent reapply writes any row
- source→DB payload differs
- duplicate prompts remain
- a shared or Window A file must be changed
- unexplained DB drift involves owned task types
- partial write cannot be safely explained

Write the blocker, command, affected rows/files, and recovery recommendation to the stage report. Do not improvise around a hard stop.

## 14. Final Handoff

When complete, stop and return:

1. Changed files.
2. DB writes by table/status/type.
3. Source matrix totals.
4. Dry-run/apply/idempotency proof.
5. Exact source→DB verifier result.
6. Rubric and nonofficial-answer coverage.
7. Manual-review samples.
8. Full command/exit-code table.
9. Open risks.
10. Confirmation that shared files and Window A files were untouched.
11. Recommendation for central Codex integration review.
