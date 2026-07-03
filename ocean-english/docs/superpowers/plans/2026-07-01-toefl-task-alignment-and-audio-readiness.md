# TOEFL Task Alignment And Audio Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock TOEFL 2026 task types to the product's v2 question-bank schema so专项练习、模考、晋级、音频门控不会错接题型。

**Architecture:** Treat `lib/exam-specs/specs.ts` as the public exam structure source, `data/exam-task-templates/*.json` as authoring shape contracts, and the v2 database as runtime state. Add one read-only validator that checks the TOEFL spec, templates, current pilot DB rows, and blocker states without promoting or mutating any question data.

**Tech Stack:** Next.js/TypeScript, Supabase PostgREST, v2 question bank tables, authored-template import pipeline.

---

## Current TOEFL Contract

TOEFL is `status: active` for专项练习, but `paperReady: false` for full/mini mock exams. That means individual task practice may serve active task pools, while `/api/papers` must return `paper_not_ready` for TOEFL full/mini until reading/listening/speaking objective pools are complete and audio-reviewed.

| TOEFL section | Task type | Template | Shape / input | Runtime state | Gate |
|---|---|---|---|---|---|
| Reading | `complete_the_words` | `toefl-complete-the-words` | `complete_words` / `spell` | Active pool exists | Session must not send stimulus containing full answer word |
| Reading | `read_daily_life` | `toefl-read-daily-life` | `reading_multi` / `choice` | Stopped/blocked | `official_spec_unverified` |
| Reading | `reading_comprehension` | `toefl-academic-reading` | `reading_multi` / `choice` | Stopped/blocked for TOEFL academic reading | `official_spec_unverified` |
| Listening | `choose_a_response` | `toefl-choose-a-response` | `listening_multi` / `listen` | 10 draft pilot sets | `audio_missing` until stable reviewed audio exists |
| Listening | `listening_comprehension` | `toefl-listening-mcq` | `listening_multi` / `listen` | 10 draft pilot sets / 30 items | `audio_missing` until stable reviewed audio exists |
| Writing | `build_a_sentence` | `toefl-build-a-sentence` | `build_sentence` / `multi_blank` | Draft only | `scoring_not_ready`; canonical answer is not a unique legal sequence |
| Writing | `email_writing` | `toefl-email-writing` | `free_text_rubric` / rubric | Active pool exists | `official=false`, TOEFL writing rubric |
| Writing | `academic_discussion` | `toefl-academic-discussion` | `free_text_rubric` / rubric | Active pool exists | `official=false`, TOEFL writing rubric |
| Speaking | `listen_and_repeat` | `toefl-listen-and-repeat` | `speak_prompt` / `speak` | Draft pilot exists | `audio_missing` and `speaking_pipeline_not_ready` |
| Speaking | `interview_speaking` | `toefl-interview-speaking` | `speak_prompt` / `speak` | Draft pilot exists | `audio_missing` and `speaking_pipeline_not_ready` |

## Files

- Create: `scripts/validate-toefl-task-alignment.ts`
  - Read-only validator for TOEFL spec/template/DB alignment.
  - Writes `reports/toefl-task-alignment-validation.json`.
  - Exits non-zero on structural mismatch.
- Modify: `package.json`
  - Add `validate:toefl-task-alignment`.
- Create: `docs/superpowers/plans/2026-07-01-toefl-task-alignment-and-audio-readiness.md`
  - This technical plan and operating guide.

## Task 1: Add A TOEFL Alignment Validator

- [x] **Step 1: Define expected task matrix**

The validator must encode the table above as data, not scattered assertions. Each row must include section, task type, template id, expected answer shape, expected item count, and current readiness gate.

- [x] **Step 2: Validate static contracts**

The script must assert:

- `getExamSpec('toefl')` exists.
- `status === 'active'`.
- `paperReady === false`.
- Every TOEFL task type in the matrix appears in the correct TOEFL section.
- Each expected template JSON exists.
- Template `examIds` contains `toefl`.
- Template `taskType` and `answerSchema.shape` match the matrix.
- Listening templates use `optionCount: 4`.
- `toefl-build-a-sentence` carries `generation.scoringNotReady === true`.

- [x] **Step 3: Validate current listening pilot DB state**

The script must read stage `toefl-listening-pilot-2026-07-01` and assert:

- Exactly 10 `choose_a_response` draft sets.
- Exactly 10 `listening_comprehension` draft sets.
- Exactly 40 total items across the two tasks.
- Every set has one linked stimulus.
- Every item is draft.
- Every item has `input_mode='listen'`.
- Every choice item has 4 options and a non-empty answer.
- There are 0 active TOEFL sets for `choose_a_response` and 0 active TOEFL sets for `listening_comprehension`.

- [x] **Step 4: Validate blocker discipline**

The script must assert:

- TOEFL full/mini mock remains disabled by `paperReady=false`.
- Listening pilot is draft-only until active audio exists.
- `build_a_sentence` is still scoring-blocked.
- `read_daily_life` and TOEFL academic reading remain `official_spec_unverified`.

## Task 2: Wire NPM Script

- [x] Add this script to `package.json`:

```json
"validate:toefl-task-alignment": "npx tsx scripts/validate-toefl-task-alignment.ts"
```

## Task 3: Run Verification

- [x] Run:

```powershell
npm run validate:toefl-task-alignment
npm run validate:exam-specs
npm run validate:question-types
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:audio-assets
npm run qa:qsets-v2
npm run lint
npx tsc --noEmit
```

Expected: all exit 0. If a remote DB check is temporarily noisy, rerun once and record the first failure plus the final result in the final response.

## Execution Notes

- Do not promote TOEFL listening draft content in this phase.
- Do not generate or upload audio in this phase.
- Do not bypass `official_spec_unverified` for TOEFL reading tasks.
- Do not flip `paperReady` to true.
- Do not weaken transcript isolation: practice payload must not include listening transcript before answer reveal, and `complete_the_words` must not include the full answer word through `stimulus`.

## Next Phase After This

If this validator passes, the next executable phase is audio readiness:

1. Choose TTS provider and voice policy.
2. Generate audio for stage `toefl-listening-pilot-2026-07-01`.
3. Upload to Supabase Storage as private objects.
4. Insert `audio_assets` as `machine_checked`.
5. Human-listen all 20 assets.
6. Mark reviewed assets `active`.
7. Run promote dry-run for `choose_a_response` and `listening_comprehension`.

Only after those gates pass should TOEFL listening be considered for active promotion.
