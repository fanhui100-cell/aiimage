# TOEFL Speaking Pipeline Boundary (2026-07-02)

## Scope

This pass does **not** open TOEFL speaking practice or promote speaking items.
It only hardens the client-side answer-mode contract so future `input_mode="speak"`
items cannot fall through to choice/spell rendering.

## Changes

- Added `lib/practice/answer-mode.ts` as the single pure resolver for practice answer modes.
- `PracticeRunner` now consumes that resolver.
- `inputMode: "speak"` resolves to `free_text`, which is the existing transcript/AI-estimate path.
- `build_a_sentence` still resolves to `build_sentence` even though it is stored as `multi_blank`.
- `scripts/validate-practice-answer-contracts.ts` now locks:
  - `speak` -> `free_text`
  - `build_a_sentence` -> `build_sentence`
  - `listen` with choices -> `choice`
  - bare `listen` -> `spell`

## Safety Boundaries

- `listen_and_repeat` and `interview_speaking` remain blocked by `speaking_pipeline_not_ready`.
- No microphone capture, audio upload, audio storage, or automatic audio scoring was introduced.
- The current `/api/scoring/speaking` endpoint remains transcript-only and returns non-official estimates.
- TOEFL full/mini mock remains closed via `paperReady=false`.

## Verification

- `npx tsx scripts/validate-practice-answer-contracts.ts` -> pass
- `npx tsc --noEmit --incremental false` -> pass

## Remaining Unlock Requirements

Before TOEFL speaking can become active:

1. Product decision for browser microphone capture and consent UX.
2. Privacy/storage decision: no storage, temporary storage, or permanent user-owned recording storage.
3. ASR/transcript source decision and provider credentials.
4. Audio scoring contract beyond transcript-only mock/estimate.
5. Renderer/attempt recorder integration for the chosen recording/transcript flow.
6. Promote gate update only after the above exists and has passed QA.
