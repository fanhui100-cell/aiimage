# TOEFL Expansion Window A: Complete the Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add exactly 40 new, original TOEFL 2026 `complete_the_words` draft sets so the confirmed pool reaches 50, with strict source/DB validation and no activation.

**Architecture:** This window owns only one new authored source directory, one stage-specific verifier, and one stage-specific report. It must reuse the existing template, shape, importer, and database schema without modifying shared infrastructure. All records remain `draft`; the canonical cross-package verifier and final reports are updated only after both parallel windows finish.

**Tech Stack:** TypeScript, Node/tsx, Supabase/Postgres, JSON authored sources, existing v2 question-bank scripts.

---

## 0. Paste This Entire Document Into Claude Code

You are **Window A** in a two-window parallel production run. You have no useful chat history. Treat this document as the complete and binding specification. Do not infer requirements from memory and do not broaden scope.

### Parallel Ownership

You exclusively own:

- `data/generated-question-sets/toefl-2026-expansion-a/`
- `scripts/verify-toefl-complete-words-expansion.ts`
- `reports/toefl-2026-complete-words-expansion-a.md`
- `reports/toefl-2026-complete-words-expansion-a.json`

You must not modify:

- `scripts/verify-toefl-pilot.ts`
- `scripts/import-authored-question-sets-v2.ts`
- `scripts/import-authored-productive-tasks-v2.ts`
- `lib/exam-task-templates/shape.ts`
- `data/exam-task-templates/*.json`
- `reports/qbank-production-final-summary.md`
- `reports/qbank-production-issue-ledger.*`
- `reports/toefl-2026-non-audio-*`
- frontend files, API routes, schema, rate limits, audio code, paper generator, scoring code
- Window B's directory, verifier, or reports

If a required change appears to need a forbidden file, stop this window and report the exact blocker. Do not quietly edit shared infrastructure.

## 1. Hard Preconditions

- [ ] Confirm this worktree was created from a checkpoint commit containing all accepted Phase 1-13 and production work.
- [ ] Confirm this is not the same filesystem directory used by Window B.
- [ ] Confirm `.env.local` exists locally and remains untracked.
- [ ] Run `git status --short` and save the starting output in your stage report.
- [ ] Run `npx tsx scripts/qbank-v2-snapshot.ts`.

Expected database baseline:

```text
totalSets = 4878
activeTotal = 0
antonym_choice = 0
cet_cloze = 0
complete_the_words draft = 10
```

- [ ] Run `npx tsx scripts/verify-toefl-pilot.ts` before any write.
- [ ] Confirm it exits 0 and reports exactly 10 existing `toefl-complete-the-words` draft sets.

Hard stop if any baseline count differs, any active/deprecated set exists, or the canonical verifier fails.

## 2. Official Scope

Use only the already-confirmed ETS 2026 specification embodied by:

- `reports/toefl-2026-non-audio-spec-check.md`
- `.firecrawl/toefl-spec-2026.md`
- `data/exam-task-templates/toefl-complete-the-words.json`
- `lib/exam-task-templates/shape.ts` branch `complete_words`

Confirmed characteristics:

- TOEFL Reading task: `Complete the Words`
- academic language use
- CEFR target B1-C1+
- machine scored, max 1 point per item
- one partially masked word restored in context
- no options and no rubric

Do not add claims not present in those sources. Do not copy ETS sample questions or published test text.

## 3. Exact Production Target

Create exactly **40 new sets**, not 39 and not 41. Combined with the existing 10, the DB target is exactly 50 draft sets.

Use this distribution:

| Domain | Sets |
|---|---:|
| biology and ecology | 5 |
| earth and environmental science | 5 |
| physics and technology | 5 |
| medicine and health | 5 |
| history and archaeology | 5 |
| economics and social science | 5 |
| psychology and education | 5 |
| arts and humanities | 5 |

Difficulty intent:

- 12 sets broadly B1
- 16 sets broadly B2
- 12 sets broadly C1

This distribution is editorial guidance, not an official TOEFL quota. Do not write it into user-facing exam claims.

## 4. Source File

Create:

`data/generated-question-sets/toefl-2026-expansion-a/toefl-complete-the-words-40.json`

The top-level structure must be:

```json
{
  "template": "toefl-complete-the-words",
  "level": 6,
  "sets": []
}
```

Each set must contain exactly:

```json
{
  "passage": "Original English academic context.",
  "targetWord": "example",
  "maskedForm": "exa____",
  "explain_zh": "Explain why the context and visible letters support the answer."
}
```

Do not add generated IDs or timestamps. The importer derives deterministic legacy IDs from the raw JSON record.

## 5. Content Rules

Every set must satisfy all of the following:

1. Passage has 15-55 English words under the repository's `countWords()` rule; prefer 20-50.
2. Passage is original and academically framed, not copied or lightly paraphrased from a known source.
3. `targetWord` occurs as a whole word exactly once in the source passage.
4. `targetWord` is an ordinary English lexical word, not a proper noun, acronym, number, hyphen puzzle, or obscure spelling curiosity.
5. `maskedForm.length === targetWord.length`.
6. Every visible character in `maskedForm` matches the same target-word position exactly.
7. Use `_` only for missing letters.
8. Hide at least 2 letters and at least 30% of the word, but never hide every letter.
9. Keep enough visible letters plus semantic context to make the intended word reasonably recoverable.
10. Avoid a passage where another same-length word with the same visible letters fits equally well.
11. Use the grammatically correct inflected form required by the sentence.
12. Do not overuse definition frames such as `is called X`, `known as X`, or `scientists call this X`; use at most 8 of 40.
13. Do not repeat a target word from the existing 10-set pilot or elsewhere in this new file.
14. `explain_zh` must discuss both the context clue and the visible-letter pattern.
15. No answer may appear unmasked in the final mapped prompt.

Before authoring, read the existing 10 records and build a private set of their target words. Do not modify that existing file.

## 6. Authoring Workflow

Author in four internal batches of 10. Do not import any batch separately; the DB write happens only after all 40 pass source review.

For each batch:

- [ ] Write 10 records.
- [ ] Check spelling in a trusted dictionary already available in the project or standard English references.
- [ ] Reconstruct each target from `maskedForm` manually.
- [ ] Read the masked passage without looking at `targetWord`; reject ambiguous items.
- [ ] Confirm domain and difficulty variety.
- [ ] Scan for repeated sentence frames and repeated target words.
- [ ] Record rejected/replaced drafts in the stage report, but do not import them.

Claude must author the content directly. Do not call DeepSeek or any external generation API. Do not scrape or copy real test questions. Web research may only confirm general facts; facts used in passages must be noncontroversial and paraphrased originally.

## 7. Stage-Specific Verifier

Create `scripts/verify-toefl-complete-words-expansion.ts`.

It must be read-only and must:

1. Load the existing template and the new 40-record source.
2. Run every source record through `shapeToItems()`.
3. Fail unless exactly 40 source records pass.
4. Check domain count metadata maintained locally in the verifier or companion constants: exactly 5 per required domain. Do not write domain claims to DB unless existing schema already supports them without infrastructure changes.
5. Check target words are unique across the new 40 and do not overlap the existing pilot 10.
6. Check each target occurs exactly once in the raw passage.
7. Check mask hidden-letter ratio and minimum hidden count.
8. Derive the exact importer legacy ID using the same FNV-1a `hashId` and input string:

```text
template|level|JSON.stringify(raw)
```

9. Query each expected DB set after apply and require exactly one set and one item.
10. Compare `input_mode`, mapped prompt, choices, and answer exactly against `shapeToItems()` output.
11. Require `input_mode='spell'`, choices empty, status draft, and no active set.
12. Perform a reverse check: no DB set with this expansion source/stage may exist outside the expected legacy-ID set.
13. Assert global `active=0`, `antonym_choice=0`, and `cet_cloze=0`.
14. Exit 1 on every mismatch or DB error. Never catch and ignore validation exceptions.

The verifier must support a source-only mode before apply and a DB mode after apply, or clearly report `not_applied` without treating missing expected DB rows as success after the apply phase begins.

## 8. Dry Run

- [ ] Run:

```powershell
npx tsx scripts/import-authored-question-sets-v2.ts --file=data/generated-question-sets/toefl-2026-expansion-a/toefl-complete-the-words-40.json
```

Expected:

```text
parsed_ok = 40
rejected = 0
DB writes = 0
```

- [ ] Run the stage verifier in source-only mode.
- [ ] Fix every rejection; do not weaken the template or shape.
- [ ] Manually review all 40 records one final time.

## 9. Apply Once

Only after dry-run and source QA pass:

```powershell
npx tsx scripts/import-authored-question-sets-v2.ts --file=data/generated-question-sets/toefl-2026-expansion-a/toefl-complete-the-words-40.json --apply
```

Expected first apply:

```text
wrote = 40
dup = 0
all question_sets and question_items status = draft
```

Immediately rerun the same apply command.

Expected idempotency proof:

```text
wrote = 0
dup-skip = 40
```

If either expectation differs, stop. Do not delete or replace data ad hoc.

## 10. Post-Apply Verification

- [ ] Run the stage verifier in DB mode.
- [ ] Confirm total `complete_the_words` draft sets are exactly 50.
- [ ] Confirm the 40 new sets each have exactly one draft item.
- [ ] Confirm all source-to-DB payload comparisons pass.
- [ ] Run:

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:question-types
npm run lint
npx tsc --noEmit
npx tsx scripts/qbank-v2-snapshot.ts
```

Do not run or edit the canonical `verify-toefl-pilot.ts`; it still represents the pre-integration 10-set baseline and will be updated centrally after both windows finish.

Do not run global answer-position normalization because this package has no choice answers.

## 11. Reports

Create both stage-owned reports:

- `reports/toefl-2026-complete-words-expansion-a.md`
- `reports/toefl-2026-complete-words-expansion-a.json`

Include:

1. Starting commit and worktree path.
2. Changed files.
3. Source count, parsed count, rejected count.
4. Domain and intended difficulty distribution.
5. Passage word-count min/max/average.
6. Target-word and mask statistics.
7. First apply and idempotent reapply counts.
8. DB set/item/status counts.
9. Five representative legacy IDs.
10. Manual review method and any replaced records.
11. Every validation command with actual exit code.
12. Final invariants: active/deprecated counts.
13. Explicit statement: no DeepSeek, no copying, no promote, no frontend/schema/shared-infrastructure edits.
14. Files intentionally left for central integration.

## 12. Hard Stops

Stop this window immediately if any of these occurs:

- baseline is not the expected checkpoint
- active or deprecated data appears
- official specification would need guessing
- template or shape cannot express a record
- any source record is ambiguous
- dry-run rejects any record after attempted correction
- first apply writes other than exactly 40
- idempotent reapply writes any row
- source-to-DB payload differs
- another window modified an owned file
- a shared file must be changed
- partial DB write cannot be explained and safely isolated

On stop, write the exact command, error, affected files/rows, and recovery recommendation to the stage report. Do not continue around a hard stop.

## 13. Final Handoff

When complete, stop. Do not start another task. Return:

1. Changed files.
2. DB writes by table and status.
3. Dry-run/apply/idempotency counts.
4. Source and DB verifier results.
5. Domain/difficulty/word-count statistics.
6. Five sample records and legacy IDs.
7. Full command/exit-code table.
8. Any unresolved risk.
9. Confirmation that shared files and Window B files were untouched.
10. Recommendation for central Codex integration review.
