# Phase 1 — Promote the 2 rewritten TOEFL academic-reading Q4 sets (2026-07-04)

Owner instruction (2026-07-04): "Phase 1 — promote 修好的 2 条 TOEFL academic reading Q4 draft；
reading_comprehension active 98→100；不改 full mock/paperReady。"

## 1. What was promoted

The 2 pilot academic `reading_comprehension` sets whose Q4 was rewritten in commit `e880378`
(plankton / desert; restatement-style inference → genuine cross-sentence inference, independent
adversarial re-review PASS with unique answer + real inference). They were the only remaining
`reading_comprehension` drafts.

| set legacy_id | before | after |
|---|---|---|
| `gen:toefl-academic-reading:set:claude:1s9djfe` (plankton) | draft | **active** |
| `gen:toefl-academic-reading:set:claude:jyr9in` (desert) | draft | **active** |

Promoted via the exact 2-id manifest → atomic `promote_question_sets_v2` RPC (re-validated each set:
answer∈choices, 4 items, non-deprecated). Dry-run: 2 eligible / 0 rejected. Apply: **promoted 2**.

## 2. DB writes

- `question_sets`: 2 rows `draft` → `active`.
- `question_items`: their 8 items (2 sets × 4) `draft` → `active` (via the RPC, same txn).
- No stimulus/audio/other writes; no content changed (content was already rewritten + committed in `e880378`).

## 3. Active count change

- `reading_comprehension` (toefl lv6): **98 → 100 active** · draft **2 → 0**.
- Whole-bank active sets: **2852 → 2854** (+2); active items 4676 → 4684 (+8).
- `read_daily_life` unchanged (100 active). Reading 专项 is now fully 100 + 100 active, 0 held draft.

## 4. Verification (all exit 0)

| command | exit | result |
|---|---:|---|
| `build-toefl-reading-q4fix-promote-manifest.ts` | 0 | active 98 + draft 2 precondition met; 2-id manifest written |
| `promote:qsets-v2 --manifest …` (dry-run) | 0 | 2 eligible, 0 rejected |
| `promote:qsets-v2 --manifest … --apply` | 0 | **promoted 2** |
| `verify-toefl-reading-expansion.ts --db` | 0 | read_daily_life 100/0, reading_comprehension **100/0**, orphan 0 |
| `verify:toefl-current` | 0 | 100/100/100 text active; blocked/deprecated active 0 |
| `validate:qbank-v2` | 0 | **active 2854 / items 4684** · errors 0 |
| `qa:qsets-v2` | 0 | 模板 32 · errors 0 |
| `validate:practice-session` | 0 | errors 0 |
| `smoke:active-serve` | 0 | active stimulus all active (2003); listening signed URL, no transcript leak |
| `validate:toefl-task-alignment` | 0 | errors 0 |
| `lint` · `tsc --noEmit` | 0 · 0 | |

## 5. Validator contract updates (post-promote)

`heldDraftWhenActive` for reading_comprehension **2 → 0** in `verify-toefl-reading-expansion.ts`;
`READING_ACADEMIC_REVIEW_DRAFT` **2 → 0** and `blockerSummary.readingAcademicReviewHeldDraft` **2 → 0**
in `validate-toefl-task-alignment.ts`. These reflect the now-complete reading pool; both re-run green.

## 6. Guardrails

- **`paperReady` untouched = false**; full/mini mock still closed. `--expect=draft` history mode on the
  verifier is preserved for pre-promote reproduction.
- `antonym_choice`/`cet_cloze` = 0. build_a_sentence + speaking still blocked (0 active).
- This phase did **not** touch full mock or any exam spec.
