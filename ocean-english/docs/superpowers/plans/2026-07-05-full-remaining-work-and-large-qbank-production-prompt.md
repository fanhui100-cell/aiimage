# Full Remaining Work + Large QBank Production Prompt

> Give this document to Claude Code. It must follow the phases in order, self-review after each phase, and only enter large-scale question generation after all product/governance phases pass.

## Mission

Finish all remaining product tasks first, then start large-scale question-bank draft production. Do not modify this document during execution; use it as the controlling prompt.

## Non-Negotiable Rules

- Do not call DeepSeek.
- Do not copy real exam questions. New content must be original and only model official formats.
- Do not promote content unless explicitly instructed by the user for that batch.
- All new questions are `draft` first.
- Every batch must follow: source file -> source QA -> dry-run -> apply -> idempotency rerun -> DB QA -> report.
- Every phase must self-review before continuing.
- If any P0/P1 issue appears, stop and report. Do not continue.
- All active/promote actions require an explicit manifest.
- IELTS must never fall back to TOEFL/SAT/CET content.
- TOEFL speaking, TOEFL Build-a-Sentence, and IELTS full mock must not accidentally go live before their gates are met.
- Keep a clear record of DB writes, promote counts, active/draft deltas, and validation exit codes.

---

## Part A: Finish Remaining Product Tasks First

Use these existing plans as source-of-truth context:

1. `docs/superpowers/plans/2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`
2. `docs/superpowers/plans/2026-07-05-post-toefl-v1-remaining-product-work-plan.md`

Do not skip phases.

### Product/Governance Phase List

Complete these in order:

1. TOEFL mock v1收口
2. `build_a_sentence` accepted-sequence scoring infrastructure
3. TOEFL speaking transcript-only boundary
4. IELTS coming-soon cleanup
5. Word Universe v2 source cleanup
6. mojibake/report comment cleanup
7. paper smoke performance optimization
8. final readiness report
9. TOEFL speaking MVP
10. `build_a_sentence` activation readiness
11. IELTS pilot plan + pilot
12. legacy `qb:` draft final disposition
13. paper smoke parallelization
14. content human review queue
15. final product completion report

### Required Self-Review After Every Phase

After each phase, output:

```md
## Phase X Self-Review

- Changed files:
- DB writes:
- Promote count:
- Active/draft delta:
- Validation commands and exit codes:
- P0/P1 found:
- Residual risks:
- Continue to next phase: yes/no
```

If `P0/P1 found` is not `none`, stop.

---

## Part B: Gate Before Large-Scale Generation

Only enter Part C if all Part A phases pass and the following full gate exits 0:

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

Warnings may be acceptable only if clearly explained and non-blocking. Any error blocks generation.

---

## Part C: Large-Scale Draft Question Production

All large-scale production is draft-only unless the user separately approves promote.

### C1. IELTS Large Draft Production

#### Preconditions

- IELTS pilot has passed.
- IELTS remains `coming_soon`.
- IELTS mock remains closed.
- No fallback to TOEFL/SAT/CET.
- All content is original.

#### Target Counts

| IELTS Type | First-Stage Target |
|---|---:|
| Academic Reading passages | 100 passages |
| Reading items | 10-13 items per passage |
| Writing Task 1 | 100 prompts |
| Writing Task 2 | 100 prompts |
| Speaking prompt sets | 100 sets |
| Listening scripts | 100 draft scripts; no audio unless user separately approves provider/cost |

#### Required Metadata

Every IELTS row must have:

```json
{
  "exam_id": "ielts",
  "level": 8,
  "status": "draft",
  "qa_flags": {
    "source": "original_authored",
    "authored": "claude"
  }
}
```

Productive tasks must use `answer.official=false`.

Listening without audio must never become active.

#### Batch Size

Use batches of 20 sets.

For each batch:

1. Write source file.
2. Run source QA.
3. Run dry-run.
4. Apply.
5. Rerun apply for idempotency.
6. Run DB QA.
7. Manually inspect at least 5 sets.
8. Write batch report.

#### Report

After all IELTS first-stage targets are complete, write:

`reports/ielts-large-draft-production-2026-07-05.md`

---

### C2. TOEFL Speaking Expansion

#### Preconditions

- Transcript-only speaking boundary is complete.
- No user audio is stored.
- Speaking remains excluded from TOEFL mock unless separately approved.

#### Target Counts

| TOEFL Speaking Type | Target |
|---|---:|
| `listen_and_repeat` | 100 draft |
| `interview_speaking` | 100 draft |

#### Requirements

- Original content only.
- Draft only.
- No active unless separately approved.
- Each item has clear scoring reference points.
- `answer.official=false`.
- `audioScoring='not_ready'`.
- `audioStorage='none'`.
- No user audio upload/storage logic.

#### Batch Size

25 items per batch.

#### Report

`reports/toefl-speaking-large-draft-production-2026-07-05.md`

---

### C3. TOEFL Build-a-Sentence Expansion

#### Preconditions

- Accepted-sequence scoring contract is implemented.
- Promote guard/RPC can recognize valid accepted-sequence contracts.
- Build-a-Sentence remains excluded from TOEFL mock unless separately approved.

#### Target

- Expand `build_a_sentence` to 100 draft rows.

#### Requirements

- 5-10 chunks per item.
- 2-4 `acceptedSequences` per item.
- `canonical` must be included in `acceptedSequences`.
- Do not claim a unique official answer.
- Do not implement broad grammar equivalence.
- QA must verify permutations are legal.
- Draft only unless separately approved.

#### Batch Size

20 items per batch.

#### Report

`reports/toefl-build-sentence-large-draft-production-2026-07-05.md`

---

### C4. Word Universe Expansion

#### Targets

TOEFL L6:

| Type | Additional Draft Target |
|---|---:|
| `def_to_word` | +100 |
| `synonym_choice` | +100 |
| `confusable_choice` | +100 |

SAT L7:

| Type | Draft Target |
|---|---:|
| `def_to_word` | 50 |
| `synonym_choice` | 50 |
| `confusable_choice` | 50 |

#### Requirements

Every new Word Universe row must be:

```json
{
  "legacy_id": "gen:...",
  "qa_flags": {
    "source": "original_authored",
    "authored": "claude",
    "provider": "claude-authored"
  }
}
```

Rules:

- Active `qb:` count must remain 0.
- Answer positions must be balanced.
- Synonyms must be strong synonyms, not loose associations.
- Confusables must be genuinely confusable.
- Definitions must not be answer-leaking or eaten by distractors.
- Words must exist in the dictionary unless explicitly reviewed and accepted.

After each batch:

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

Also run the answer-position audit if present.

#### Report

`reports/word-universe-large-draft-expansion-2026-07-05.md`

---

### C5. Coverage Audit Top-Up

Run:

```powershell
npm run audit:qbank-v2-coverage
```

Use the audit output to top up non-blocked `MISSING` / `THIN` cells.

Targets:

- Each active-ready objective cell: at least 50 sets.
- Each productive prompt cell: at least 50 prompts.

Do not top up:

- deprecated types
- `official_spec_unverified`
- `audio_missing` active content
- `speaking_pipeline_not_ready` active content
- IELTS active content unless its coming-soon state has been separately changed by user approval

#### Report

`reports/qbank-coverage-topup-2026-07-05.md`

---

## Part D: Quality Standards For Every New Question

### Objective Questions

- Correct answer must be unique.
- Answer must hit choices.
- Choices must be distinct.
- Distractors must be plausible and same register/part-of-speech where applicable.
- No giveaway distractors.
- No double answers.
- Explanation must not name the wrong option letter.
- Difficulty must match the exam level.

### Reading

- Passage must be original.
- Question must be supported by passage.
- Inference questions must require inference, not direct restatement.
- Main idea/detail/vocabulary/function questions must be distinct.
- Item count must match template.
- Word count must match template.
- No copied real exam content.

### Listening

- Script must be original.
- Questions must match script.
- No active listening without audio.
- Transcript must not be sent before answer/review mode.

### Writing / Speaking

- Prompt must be clear.
- Rubric must match.
- Reference points are scoring guidance only.
- `official=false`.
- No official sample answer.
- No single "official" translation or essay.

### Word Universe

- Target word should exist in dictionary.
- Synonym must be strong.
- Confusable must be real.
- Definition must uniquely point to answer.
- Word should fit the exam level.
- Answer positions must be balanced.

---

## Part E: Required Commands Per Batch

Every batch must at least run:

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run lint
npx tsc --noEmit --incremental false
```

If audio is involved:

```powershell
npm run validate:audio-assets
```

If papers are involved:

```powershell
npm run validate:papers
npm run smoke:papers
```

If Word Universe is involved:

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

---

## Part F: Stop Conditions

Stop immediately if any of these happen:

- Active `antonym_choice` or `cet_cloze`.
- Active Word Universe row with `qb:` source.
- IELTS draws TOEFL/SAT/CET questions.
- Draft content is accidentally promoted.
- Listening content becomes active without audio.
- Transcript leaks before answer/review.
- `answerKey` leaks to client.
- Large double-answer pattern appears.
- QA errors cannot be explained.
- DB apply count differs from manifest count.
- Any required command exits non-zero without a documented non-blocking reason.

---

## Part G: Final Delivery

After all generation is complete, run:

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

Then write:

`reports/large-qbank-production-final-report-2026-07-05.md`

The final report must include:

1. Generated counts by exam/task.
2. Active/draft counts by exam/task.
3. DB tables and row counts written.
4. Promote counts, if any.
5. Batch QA results.
6. Human review findings.
7. Remaining blocked cells.
8. Remaining user decisions.
9. Commit list.
10. Worktree status.

After final report, stop and hand off to Codex for review.

