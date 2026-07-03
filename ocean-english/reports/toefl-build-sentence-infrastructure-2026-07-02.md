# TOEFL Build a Sentence Infrastructure Check (2026-07-02)

## Scope

This pass only wires the practice payload/rendering path for `build_a_sentence`.
It does **not** unblock scoring, promotion, or TOEFL full mock exams.

## Changes

- Added a pure contract check to `scripts/validate-practice-answer-contracts.ts`.
- Added `reconstructBuildSentence()` in `lib/practice/session-builder.ts`.
- V2 `build_a_sentence` items now expose:
  - `inputMode: "build_sentence"`
  - `buildBody.tokens` for the renderer
  - `review.build.canonical` only as a reference order after submit
- `PracticeRunner` now defensively routes `item.type === "build_a_sentence"` to the build-sentence renderer.

## Safety Boundaries

- `build_a_sentence` remains `scoring_not_ready`.
- The promote script/RPC gate remains the authority for blocking activation.
- No DB rows were promoted or activated in this pass.
- TOEFL `paperReady=false` remains correct; full/mini TOEFL mock exams should stay closed.

## Verification

- `npx tsx scripts/validate-practice-answer-contracts.ts` -> pass
- `npm run validate:practice-session` -> pass
- `npm run validate:toefl-task-alignment` -> pass
- `npm run validate:qbank-v2` -> pass
- `npm run qa:qsets-v2` -> pass
- `npm run validate:papers` -> pass
- `npm run lint` -> pass
- `npx tsc --noEmit --incremental false` -> pass

## Next Blockers

- Define accepted-answer equivalence for `build_a_sentence`, or confirm the official interaction/scoring rule.
- Keep `build_a_sentence` draft/blocked until that scoring contract exists.
