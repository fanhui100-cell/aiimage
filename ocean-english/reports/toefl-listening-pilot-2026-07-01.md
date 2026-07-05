# TOEFL Listening Pilot - 2026-07-01

## Scope

Created original TOEFL-style listening draft content based on official task-structure analysis, not on copied or rewritten real exam text.

This phase intentionally writes **draft only**. It does not generate audio and does not promote anything to active.

## Files

New templates:

- `data/exam-task-templates/toefl-choose-a-response.json`
- `data/exam-task-templates/toefl-listening-mcq.json`

New authored content:

- `data/generated-question-sets/toefl-listening-pilot-2026-07-01/toefl-listening-pilot.json`
- `data/generated-question-sets/toefl-listening-pilot-2026-07-01/toefl-listening-comprehension.json`

## Content Written

Stage: `toefl-listening-pilot-2026-07-01`

| Task type | Sets | Items | Status |
|---|---:|---:|---|
| `choose_a_response` | 10 | 10 | draft |
| `listening_comprehension` | 10 | 30 | draft |
| Total | 20 | 40 | draft |

Stimuli: 20 draft transcripts.

All content is Claude-authored original content. No DeepSeek calls. No real TOEFL text copied or paraphrased.

## Import

Dry-run:

- `toefl-listening-mcq`: parsed_ok 10 / reject 0
- `toefl-choose-a-response`: parsed_ok 10 / reject 0

Apply:

- Final authoritative idempotency run: wrote 0 / dup-skip 20.
- Final DB audit: 20 sets / 40 items / 20 linked stimuli.
- Orphan stimuli: 0.
- Bad answers: 0.

Note: An earlier apply was mistakenly launched twice in parallel. This caused transient unique-key warnings on stimulus legacy IDs. A follow-up DB audit confirmed the final state was consistent: all 20 sets were present, all 20 stimuli were linked, no orphan stimulus remained, and a single-process idempotency rerun returned wrote 0 / dup-skip 20.

## Readiness State

Coverage audit changed as expected:

- Before: TOEFL listening cells were `MISSING`.
- After: TOEFL `choose_a_response` and `listening_comprehension` have draft content but are `BLOCKED` by `audio_missing`.

They must not be promoted until:

1. Stable audio is generated for every stimulus.
2. Audio is manually reviewed.
3. `audio_assets.qa_status='active'` exists for the relevant stimuli.
4. Promotion dry-run reports 0 rejected.

## Verification

All checks passed:

- `npx tsx scripts/import-authored-question-sets-v2.ts --stage=toefl-listening-pilot-2026-07-01`
- `npx tsx scripts/import-authored-question-sets-v2.ts --stage=toefl-listening-pilot-2026-07-01 --apply`
- `npm run qa:qsets-v2`
- `npm run validate:qbank-v2`
- `npm run audit:qbank-v2-coverage`
- `npm run validate:practice-session`
- `npm run validate:question-types`
- `npm run validate:data-quality`
- `npm run lint`
- `npx tsc --noEmit`

## Remaining Work

Next phase should be audio pipeline work, not promotion:

- Choose TTS/audio provider and storage policy.
- Generate audio for the 20 TOEFL listening pilot stimuli.
- Human-listen QA.
- Mark audio assets active only after review.
- Then run promotion dry-run for `choose_a_response` and `listening_comprehension`.

Reading tasks `read_daily_life` and TOEFL academic `reading_comprehension` remain blocked by `official_spec_unverified`; this phase does not bypass that gate.
