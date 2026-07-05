# Word Universe SAT L7 Pilot - First Active Promote

Date: 2026-07-01

## Summary

Promoted the first active SAT level 7 word-universe pilot batch from stage:

`wu-sat-l7-pilot-2026-07-01`

Promoted:

- `def_to_word`: 20
- `synonym_choice`: 20
- `confusable_choice`: 20
- total: 60

Remaining draft in this stage:

- `def_to_word`: 10
- `synonym_choice`: 10
- `confusable_choice`: 10
- total: 30

## Database Writes

Yes. Draft to active only.

| table | rows changed | status |
|---|---:|---|
| `question_sets` | 60 | draft -> active |
| `question_items` | 60 | draft -> active |

No source rows were generated in this promote phase.

Global active sets:

- before phase: 2254
- after phase: 2314
- delta: +60

## Candidate Selection

All IDs were selected programmatically through:

```powershell
npx tsx scripts/promote-question-sets-v2.ts --stage=wu-sat-l7-pilot-2026-07-01 --task=<TYPE> --words=<WORDS>
```

No UUIDs were hand-copied.

### Promoted Words

`def_to_word`:

```text
aberration, abstruse, acquiesce, admonish, adroit, ambivalent, antithesis, apathy,
arduous, ascertain, assiduous, austere, belie, capricious, conundrum, corroborate,
delineate, demur, discerning, disparate
```

`synonym_choice`:

```text
copious, deride, diffident, ebullient, ephemeral, incisive, innate, intrepid,
laconic, laudable, malleable, nebulous, pervasive, prodigal, quandary, refute,
skeptical, spurious, superfluous, unequivocal
```

`confusable_choice`:

```text
allude, assent, complement, discreet, illicit, formerly, principle, stationary,
precede, affect, adverse, counsel, credible, ingenious, morale, prosecute,
proscribe, waive, cite, canvass
```

### Left Draft

The remaining 30 rows were intentionally left as draft for a later review/promote pass. Some are perfectly usable but were left to keep this batch small; others deserve a fresh semantic review before any future promotion.

Examples needing review before promote:

- `eclectic -> diverse`
- `vindicate -> justify`
- `ostensible -> apparent`
- `articulate -> express`

## Dry-run Results

All dry-runs produced 0 rejected rows:

```text
def_to_word:       candidates 20 · eligible 20 · rejected 0
synonym_choice:    candidates 20 · eligible 20 · rejected 0
confusable_choice: candidates 20 · eligible 20 · rejected 0
```

## Apply Results

All applies promoted exactly the dry-run counts:

```text
def_to_word:       promoted 20
synonym_choice:    promoted 20
confusable_choice: promoted 20
```

## Post-Promote DB Integrity

Stage state after promote:

```json
{
  "sets": 90,
  "items": 90,
  "status": {
    "active": 60,
    "draft": 30
  },
  "types": {
    "confusable_choice": 30,
    "def_to_word": 30,
    "synonym_choice": 30
  },
  "itemStatus": {
    "active": 60,
    "draft": 30
  },
  "badCount": 0
}
```

Bad checks included:

- active set with non-active item;
- non-`gen:` legacy;
- missing or invalid `original_authored / claude / claude-authored` provenance.

All were 0.

## Active Answer Position Guard

Command:

```powershell
npx tsx scripts/audit-answer-position.ts --stage=wu-sat-l7-pilot-2026-07-01 --status=active
```

Result:

```text
active|confusable_choice: A7/B6/C3/D4 (n=20, max 35%)
active|def_to_word:       A4/B7/C4/D5 (n=20, max 35%)
active|synonym_choice:    A6/B5/C3/D6 (n=20, max 30%)
```

All are below the 40% threshold. No active rebalance was needed.

## Source Governance

Command:

```powershell
npm run audit:wu-source
```

Result:

```text
word-universe source distribution · status=active · total 321
bySource: gen 321 / qb 0 / migrated_v1 0 / other 0
confusable_choice: gen 107 / qb 0 / migrated_v1 0 / other 0
def_to_word:       gen 107 / qb 0 / migrated_v1 0 / other 0
synonym_choice:    gen 107 / qb 0 / migrated_v1 0 / other 0
badProvenance: 0
```

## Regression Commands

All commands completed with exit code 0:

```powershell
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:practice-session
npm run smoke:active-serve
npm run validate:question-types
npm run validate:data-quality
npm run audit:wu-source
npm run validate:wu-promote-guards
npm run lint
npx tsc --noEmit
```

Key observed outputs:

- `validate:qbank-v2`: active sets 2314 / active items 3494 / errors 0
- `qa:qsets-v2`: templates 30 / errors 0
- `validate:practice-session`: errors 0
- `smoke:active-serve`: PASS
- `validate:data-quality`: all gates passed

## Frontend Changes

None.

## Open Risks

- The remaining 30 SAT L7 pilot draft rows still need a future semantic review before promotion.
- SAT L7 word-universe coverage is now active but still small. It should be treated as a pilot, not full SAT lexical coverage.
- The broader IELTS and TOEFL audio/official-format blocked work remains unchanged.

## Recommended Next Phase

Recommended next phase: one of the following:

1. **SAT L7 pilot second pass**: review/promote the remaining 30 draft rows only if they pass semantic review.
2. **SAT L7 expansion batch 2**: author another 90 draft rows with harder SAT vocabulary before promoting more.
3. **TOEFL/IELTS blocked work**: only if the user provides official-format and audio decisions.

Given the current project direction, the safest next step is SAT L7 pilot second pass review of the remaining 30 draft rows.
