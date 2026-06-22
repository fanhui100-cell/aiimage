# G1D — Seed v2 Metadata Tables Summary

Date: 2026-06-21 · Branch: iter5-f1 · Stage type: **metadata seed** (no question content)
Generation provider: Claude-authored JSON, DeepSeek not used. (G1D seeds canonical TS metadata; no generation.)

## Goal
Mirror TS canonical specs/templates/rubrics into the v2 DB metadata tables to support attribution,
paper assembly, and reports.

## Changes
- New script `scripts/seed-question-bank-v2-metadata.ts` (default dry-run; `--apply` writes;
  idempotent upsert; reads `lib/exam-specs` EXAM_SPECS, `data/exam-task-templates/*.json`,
  `lib/scoring/rubrics` RUBRICS; writes **no** question content; no frontend change).
- New package script `seed:qbank-v2-metadata`.

## Pre-write snapshot
- exam_specs 0 · exam_sections 0 · task_templates 0 · rubrics 0 (all empty, as doc expected).

## Apply result / post-write counts
| Table | After | Required | Note |
|---|---:|---|---|
| exam_specs | 7 | 7 | all 7 levels |
| exam_sections | 38 | = canonical section total | id = `${examId}_${sectionId}` (globally unique) |
| task_templates | 6 | ≥ 6 | the 6 data/exam-task-templates JSON; multi-exam → exam_id null |
| rubrics | 10 | 10 | inserted 10 / updated 0; upsert by (exam_id, skill) |

## Validators (real exit codes)
| Command | Exit | Result |
|---|---|---|
| validate:qbank-v2 | 0 | active sets 0 · errors 0 |
| validate:exam-specs | 0 | 7 exams · errors 0 |
| validate:rubrics | 0 | 10 rubrics · 12 productive sections · errors 0 |
| validate:papers | 0 | cet4 mini/full insufficient_pool (controlled; no active pool yet) |

## Idempotency
Re-apply `--apply` → rubrics **inserted 0 / updated 10**; specs/sections/templates upsert-by-id
(no new rows). Counts unchanged (7/38/6/10).

## Notes / decisions
- Metadata rows use status `active` (canonical specs/templates/rubrics ARE the metadata) — distinct
  from question content, which remains `draft`. No `question_sets` were promoted.
- `task_templates.exam_id` = single examId when template is exam-specific, else null (cross-exam shared:
  cet-banked-cloze [cet4,cet6], gaokao-seven-select [gaokao,kaoyan]). `section_id` left null (safe).
- `exam_sections.selection_mode` maps directly from spec `groupMode` (single/rows/passages/paper).

## Self-review
1. Scope ✓ (metadata only; no content/frontend/limit changes). 2. Status ✓ (no question_sets active).
3. Deprecated ✓ (exam-specs validator confirms no antonym_choice/cet_cloze in any section).
4. QA ✓ (4 validators exit 0). 5. DB ✓ (counts match plan; idempotent). 6. Content ✓ (faithful TS mirror).
7. Report ✓ (this file + ledger).

SELF-REVIEW PASS — continuing to G2
