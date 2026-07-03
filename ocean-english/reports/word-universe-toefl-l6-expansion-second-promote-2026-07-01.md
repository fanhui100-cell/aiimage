# Word Universe TOEFL L6 Expansion Second Promote - Codex Handoff

Date: 2026-07-01

## Summary

Codex was asked to complete the remaining draft cleanup and second small promote for stage:

`wu-toefl-l6-expansion-2026-07-01`

Important handoff note: when Codex began execution, the stage was already in the final promoted state. There were no remaining draft rows to promote:

- stage total sets: 90
- active: 90
- draft: 0
- task split:
  - `def_to_word`: 30 active
  - `synonym_choice`: 30 active
  - `confusable_choice`: 30 active

Codex therefore did not run another `--apply` promote. This report records the verified final state.

## Database Write Status

Codex did not perform additional database writes in this handoff.

The database state at review time showed that the remaining 30 rows had already been promoted externally / before this handoff check:

- global active sets: 2254
- active word-universe source audit: 261 gen / 0 qb / 0 migrated_v1 / 0 other
- bad provenance: 0

## P2 Boundary Items

The four previously flagged synonym boundary items now have this final state:

| word | final answer | status | Codex assessment |
|---|---:|---|---|
| `gauge` | `estimate` | active | acceptable; closer to "judge/estimate" than broad `measure` |
| `grim` | `bleak` | active | acceptable in TOEFL-style contexts such as outlook/news/prospect |
| `linger` | `loiter` | active | acceptable; preserves "stay around / remain without leaving" better than broad `remain` |
| `plausible` | `credible` | active | acceptable; common strong dictionary synonym, distractors are clearly wrong |

DB spot check:

```text
grim       set=active item=active answer=bleak
gauge      set=active item=active answer=estimate
plausible  set=active item=active answer=credible
linger     set=active item=active answer=loiter
```

## Active Answer Position Guard

Command:

```powershell
npx tsx scripts/audit-answer-position.ts --stage=wu-toefl-l6-expansion-2026-07-01 --status=active
```

Result:

```text
active|confusable_choice: A8/B8/C6/D8 (n=30, max 27%)
active|def_to_word:       A7/B8/C7/D8 (n=30, max 27%)
active|synonym_choice:    A10/B6/C5/D9 (n=30, max 33%)
```

All are below the 40% threshold. No rebalance was needed by Codex.

## Provenance Guard

Command:

```powershell
npm run audit:wu-source
```

Result:

```text
word-universe source distribution · status=active · total 261
bySource: gen 261 / qb 0 / migrated_v1 0 / other 0
confusable_choice: gen 87 / qb 0 / migrated_v1 0 / other 0
def_to_word:       gen 87 / qb 0 / migrated_v1 0 / other 0
synonym_choice:   gen 87 / qb 0 / migrated_v1 0 / other 0
badProvenance: 0
```

Command:

```powershell
npm run validate:wu-promote-guards
```

Result:

```text
wu-promote-guards: PASS · errors 0
active qb=0 · qb draft -> rejected:word_universe_non_gen_source · gen draft -> eligible(1)
```

## Integrity Checks

DB spot check for this stage:

- `sets=90`
- `active=90`
- `draft=0`
- `activeByType`:
  - `def_to_word=30`
  - `synonym_choice=30`
  - `confusable_choice=30`
- active set with non-active item: 0
- answer id missing from choices: 0
- `def_to_word` / `confusable_choice` answer text not matching target word: 0

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

- `validate:qbank-v2`: active sets 2254 / active items 3434 / errors 0
- `qa:qsets-v2`: templates 30 / errors 0
- `validate:practice-session`: errors 0
- `smoke:active-serve`: PASS
- `validate:data-quality`: all gates passed

## Final State

The TOEFL L6 expansion stage is fully active:

- `wu-toefl-l6-expansion-2026-07-01`: 90 active / 0 draft
- global word-universe active gen: 261
- global word-universe active qb: 0

No remaining action is required for this stage unless product/content review wants to revise individual synonym choices later.

## Recommended Next Step

Move to the next content expansion stage rather than continuing this stage:

1. Start a SAT L7 Word Universe pilot, or
2. Start the next TOEFL L6 expansion batch with new words, or
3. Begin TOEFL missing section content work (reading/listening/speaking), which is larger and may require external specification/audio decisions.

For lowest risk, the recommended next step is a SAT L7 pilot in draft only.
