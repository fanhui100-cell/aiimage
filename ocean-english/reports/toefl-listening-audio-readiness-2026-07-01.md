# TOEFL Listening Audio Readiness - 2026-07-01

## Scope

This phase generated stable audio assets for the TOEFL listening pilot stage:

- `toefl-listening-pilot-2026-07-01`
- `choose_a_response`
- `listening_comprehension`

It did **not** promote any question sets and did **not** mark any audio asset as active.

## Configuration

Audio pipeline:

- Provider: Azure Neural TTS
- Storage: Supabase private audio bucket
- Voice policy: TOEFL 4-accent pool from `lib/audio/voice-pools.ts`
- Inserted audio status: `machine_checked`
- Required next gate before promotion: human listening review, then `human_checked -> active`

The following configuration keys were present:

- `SUPABASE_AUDIO_BUCKET`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

No API keys or signed URLs are recorded in this report.

## Dry Run

`choose_a_response`:

- Missing audio stimuli: 10
- Synthesizable: 10
- Estimated characters: 1,835
- Estimated minutes: about 2
- Estimated over-free-tier cost: $0.00

`listening_comprehension`:

- Missing audio stimuli: 10
- Synthesizable: 10
- Estimated characters: 6,901
- Estimated minutes: about 8
- Estimated over-free-tier cost: $0.00

## Apply

`listening_comprehension`:

- planned synthesizable: 10
- synthesized: 10
- uploaded: 10
- inserted: 10
- inserted status: `machine_checked`
- failed: 0

`choose_a_response`:

- planned synthesizable: 10
- synthesized: 10
- uploaded: 10
- inserted: 10
- inserted status: `machine_checked`
- failed: 0

Final DB audit for the TOEFL listening pilot stage:

- question sets: 20
- stimuli: 20
- audio rows linked to those stimuli: 20
- audio status distribution: `machine_checked: 20`
- active audio for this stage: 0

## Promotion Gate Check

Promotion dry-run was intentionally run after machine-checked audio generation.

`choose_a_response`:

- candidates: 10
- eligible: 0
- rejected: 10
- rejection reason: `listening_without_active_audio`

`listening_comprehension`:

- candidates: 10
- eligible: 0
- rejected: 10
- rejection reason: `listening_without_active_audio`

This is the expected result. `machine_checked` audio does not unlock active question promotion.

## Validation

Passed:

- `npm run validate:audio-pipeline`
- `npm run validate:audio-assets`
- `npm run validate:toefl-task-alignment`
- `npm run promote:qsets-v2 -- --exam=toefl --task=choose_a_response --limit=10`
- `npm run promote:qsets-v2 -- --exam=toefl --task=listening_comprehension --limit=10`

## Remaining Work

The next phase is human audio review:

1. Use `npx tsx scripts/review-audio-assets.ts --exam=toefl` to obtain signed listening URLs.
2. Listen to all 20 TOEFL pilot audio files.
3. For each good file, run `--approve <assetId> --by="<reviewer>"`.
4. After a second explicit confirmation, run `--activate <assetId> --by="<reviewer>"`.
5. Re-run `npm run validate:audio-assets`.
6. Re-run promotion dry-run for both listening tasks.
7. Promote only if dry-run has 0 rejected.

Do not set TOEFL `paperReady=true` in this phase. TOEFL full/mini mock remains disabled until enough reading/listening/speaking objective sections are complete.
