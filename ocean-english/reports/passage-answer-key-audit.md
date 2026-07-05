# Passage Answer Key Audit

Generated: 2026-06-17T22:41:02.510Z

Scope: active `banked_cloze` and `seven_select` rows. This report is read-only; no database rows were changed.

## Summary

| Type | Rows | Shape issue rows | Confirmed wrong rows | Confirmed wrong blanks | Ambiguous rows | AI error rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 208 | 0 | 0 | 0 | 0 | 0 |
| seven_select | 161 | 0 | 0 | 0 | 0 | 0 |

## Confirmed Wrong

No confirmed wrong answer keys found by the two-pass audit.

## Ambiguous / Needs Human Review

No ambiguous answer keys found.

## Shape Issues

No structural issues found.

## AI Errors

No AI/API errors.

## Notes

- Confirmed wrong requires two passes: pass 1 flags a blank, pass 2 confirms it.
- Ambiguous means the item should be reviewed by a human before changing the answer key.
- The script intentionally does not modify Supabase.
