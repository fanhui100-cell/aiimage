# TOEFL Reading Pilot - 2026-07-02

## Scope

This phase advances the remaining TOEFL Reading blocker from "official spec unverified" to "spec-confirmed draft pilot".

No TOEFL full/mini mock exam was opened. `paperReady=false` remains correct because TOEFL still lacks enough reviewed active Reading/Speaking coverage for a complete paper.

## Official Spec Basis

Primary source checked:

- ETS TOEFL iBT Test Specifications, 2026 edition.

Relevant interpretation:

- TOEFL Reading includes `Complete the Words`, `Read in Daily Life`, and `Read an Academic Passage`.
- `Read in Daily Life` is specified as selected-response 2-item and 3-item sets.
- `Read an Academic Passage` is an allowed Reading task within the Reading claim range.
- The current 4-option MCQ shape is a project practice format for machine-scored training. It must not be described as the exact ETS UI if ETS does not publish that detail for every task variant.

## Content Added

Stage:

- `toefl-reading-pilot-2026-07-02`

Files:

- `data/generated-question-sets/toefl-reading-pilot-2026-07-02/toefl-read-daily-life.json`
- `data/generated-question-sets/toefl-reading-pilot-2026-07-02/toefl-academic-reading.json`

Draft DB rows:

- `read_daily_life`: 10 sets, 24 items
- `reading_comprehension`: 10 sets, 40 items
- Total: 20 sets, 64 items

All rows are draft. No active promotion was performed.

## Quality Contract

- Original authored content only.
- No copying from ETS sample items.
- Daily-life passages use practical campus/social text types.
- Academic passages are 120-200 words after shape validation.
- Every item has 4 choices and exactly one answer key matching a choice.
- No retired question types.
- No audio dependency.

## Commands Run

- `npx tsx scripts/import-authored-question-sets-v2.ts --stage=toefl-reading-pilot-2026-07-02`
- `npx tsx scripts/import-authored-question-sets-v2.ts --stage=toefl-reading-pilot-2026-07-02 --apply`
- second `--apply` idempotency check: wrote 0 / dup-skip 20
- semantic rework: fixed one academic-reading prompt that referred to `"by itself" in the last sentence` after the passage had been extended; re-imported with `--replace --apply`
- `npm run validate:toefl-task-alignment`
- `npm run qa:qsets-v2`
- `npm run validate:qbank-v2`
- `npm run validate:practice-session`
- `npm run validate:papers`

## Semantic Review

All 20 sets were reviewed after import.

Result:

- PASS: 20
- REVIEW: 0
- REJECT: 0

One wording issue was found and fixed before final validation:

- Academic Reading / glass-bead passage / Q4: removed a stale location phrase (`in the last sentence`) after the passage was lengthened. The intended answer and options were unchanged.

## Current TOEFL Status

Active and user-reachable:

- `complete_the_words`
- `email_writing`
- `academic_discussion`
- `choose_a_response`
- `listening_comprehension`

Draft pilot added this phase:

- `read_daily_life`
- `reading_comprehension`

Still blocked:

- `build_a_sentence`: scoring/equivalence contract not ready.
- `listen_and_repeat` / `interview_speaking`: speaking capture, privacy, storage, and scoring pipeline not ready.

Still closed:

- TOEFL full/mini mock exam. Keep `paperReady=false`.

## Next Safe Step

Do not promote the new Reading pilot yet. Recommended next step:

1. Run a semantic review on all 20 Reading sets.
2. Fix any weak distractors or ambiguous answers.
3. Promote a small pilot only after review.
4. Keep TOEFL paper mock closed until Reading + Speaking coverage is complete enough for a coherent paper.
