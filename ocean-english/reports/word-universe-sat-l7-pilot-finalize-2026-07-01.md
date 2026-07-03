# Word Universe SAT L7 Pilot Finalize - 2026-07-01

## Summary

Finalized the SAT L7 word-universe pilot stage `wu-sat-l7-pilot-2026-07-01`.

- Started this phase with 60 active / 30 draft.
- Promoted 28 safe residual draft items:
  - `def_to_word`: 10
  - `confusable_choice`: 10
  - `synonym_choice`: 8
- Reworked the remaining 2 synonym boundary items, then promoted them:
  - `eclectic`: `diverse` -> `wide-ranging`
  - `vindicate`: `justify` -> `exonerate`
- Final stage state: 90 active / 0 draft.

No DeepSeek calls. No deprecated types. No QB-source active content.

## Semantic Decisions

The first residual promote intentionally excluded `eclectic` and `vindicate` because the original answers were too broad:

- `eclectic -> diverse` was directionally related but not precise enough.
- `vindicate -> justify` was acceptable only in a broad argumentative sense.

Both were repaired while still in `draft`:

- `eclectic -> wide-ranging`
- `vindicate -> exonerate`

After source and DB were aligned, both passed dry-run promotion and were promoted.

## DB State

Stage `wu-sat-l7-pilot-2026-07-01`:

| Type | Active | Draft | Total |
|---|---:|---:|---:|
| `def_to_word` | 30 | 0 | 30 |
| `synonym_choice` | 30 | 0 | 30 |
| `confusable_choice` | 30 | 0 | 30 |

Integrity checks:

- Sets: 90
- Items: 90
- Target words: 90
- Bad answers: 0
- Active set with non-active item: 0

## Answer Position Guard

`npx tsx scripts/audit-answer-position.ts --stage=wu-sat-l7-pilot-2026-07-01 --status=active`

Result:

- `confusable_choice`: A8 / B8 / C7 / D7
- `def_to_word`: A8 / B8 / C7 / D7
- `synonym_choice`: A8 / B8 / C7 / D7

All max shares are 27%, below the 40% guard.

## Source Governance

`npm run audit:wu-source -- --status=active --fail-on-qb-active`

Result:

- Active word-universe total: 351
- gen: 351
- qb: 0
- migrated_v1: 0
- badProvenance: 0

SAT contributes 90 active word-universe items after this phase.

## Verification

All checks passed:

- `npm run validate:qbank-v2`
- `npm run qa:qsets-v2`
- `npm run validate:practice-session`
- `npm run smoke:active-serve`
- `npm run validate:question-types`
- `npm run validate:data-quality`
- `npm run audit:wu-source -- --status=active --fail-on-qb-active`
- `npm run validate:wu-promote-guards`
- `npm run lint`
- `npx tsc --noEmit`

## Remaining Notes

This closes the SAT L7 pilot stage. No draft remains in this stage.

Further expansion should be a new stage, not a continuation of this pilot:

- SAT L7 word-universe expansion batch 2, or
- TOEFL/IETLS blocked work after audio/spec decisions.
