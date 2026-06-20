# Passage Answer Key Repair Summary

Date: 2026-06-18

Scope:
- `question_bank.type = banked_cloze`
- `question_bank.type = seven_select`
- Only `status = active` rows were audited and served-facing rows were changed.

## What Was Fixed

Initial full audit found widespread answer-key issues in the two multi-blank passage types:

| Type | Initial active rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks |
|---|---:|---:|---:|---:|
| banked_cloze | 325 | 9 | 76 | 145 |
| seven_select | 544 | 0 | 317 | 553 |

Repair strategy:

1. Structural problems were fixed first: answer length, bank length, duplicate options, and out-of-range answer indexes.
2. Rows with safe deterministic replacements had `hint.answers` patched directly.
3. Rows requiring a full option-bank rewrite were repaired by a DeepSeek repair pass with schema validation and retry feedback.
4. Rows still confirmed wrong after repair were moved out of serving by setting `status = draft` and `is_reviewed = false`.
5. Ambiguous rows were not deleted automatically. They are listed in audit reports for human review because they are not confirmed wrong.

## Database Changes Applied

| Operation | Count |
|---|---:|
| Rows updated by direct or AI-assisted answer-key repair | 382 |
| Unrepairable rows deactivated in initial repair pass | 20 |
| Rows deactivated after post-repair audit | 332 |
| Rows deactivated after additional fresh audit wave 1 | 56 |
| Rows deactivated after additional fresh audit wave 2 | 31 |
| Rows deactivated after additional fresh audit wave 3 | 21 |
| Rows deactivated after additional fresh audit wave 4 | 22 |
| Rows deactivated during 2026-06-18 follow-up review | 18 |

Final active serving pool after these changes:

| Type | Active rows |
|---|---:|
| banked_cloze | 208 |
| seven_select | 161 |
| Total | 369 |

Follow-up serving gate:

- `/api/questions` now requires `status = active` and `is_reviewed = true`.
- `/api/mock-exam` now requires `status = active` and `is_reviewed = true`.
- Current database check found `0` active rows with `is_reviewed = false` and `0` active rows with `is_reviewed IS NULL`.

## Final Structural Check

`reports/passage-answer-key-final-structure-check.json`

```json
{
  "activeReviewedRows": 369,
  "counts": {
    "seven_select": 161,
    "banked_cloze": 208
  },
  "structuralIssueRows": 0,
  "samples": []
}
```

This means the remaining active rows have:

- expected option-bank length
- expected answer count
- no duplicate option-bank entries
- no duplicate answer indexes
- no answer indexes outside the option bank

The current `reports/passage-answer-key-audit.md/json` files were refreshed with `--skip-ai` after the last deactivation wave so they reflect the current active serving pool structurally. The last full AI semantic audit before the final deactivation wave is preserved as `reports/passage-answer-key-audit-before-fourth-deactivate.md/json`.

## Important Residual Risk

Fresh AI audits repeatedly surfaced new semantic answer-key issues after previous confirmed-wrong rows were removed. This strongly suggests the original generated `banked_cloze` and `seven_select` corpus has systemic answer-key quality problems, especially semantic fit, tense/collocation fit, and paragraph-position fit.

Because of that, this repair should be treated as:

- safe removal of all rows confirmed wrong in the completed audit waves
- structural cleanup of the remaining active rows
- not a mathematical proof that every remaining semantic answer is perfect

For production quality, the best next data task is to regenerate these two question types from source passages with a deterministic answer-key generation pipeline, then require a data gate before publishing active rows.

## Generated Files

- `scripts/audit-passage-answer-keys.ts`
- `scripts/apply-passage-answer-key-fixes.ts`
- `reports/passage-answer-key-audit.md`
- `reports/passage-answer-key-audit.json`
- `reports/passage-answer-key-audit-before-fix.md`
- `reports/passage-answer-key-audit-before-fix.json`
- `reports/passage-answer-key-audit-after-fix-before-deactivate.md`
- `reports/passage-answer-key-audit-after-fix-before-deactivate.json`
- `reports/passage-answer-key-fix-report.json`
- `reports/passage-answer-key-final-structure-check.json`
- backup files matching `reports/passage-answer-key-*-backup.json`
