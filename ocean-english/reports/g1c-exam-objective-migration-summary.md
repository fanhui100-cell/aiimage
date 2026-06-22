# G1C — Existing Exam-Objective v1 → v2 Draft Migration Summary

Date: 2026-06-21 · Branch: iter5-f1 · Stage type: **migration** (draft only, no generation)
Generation provider: Claude-authored JSON, DeepSeek not used. (G1C is pure v1→v2 migration; no generation at all.)

## Scope
Migrate the 7 existing v1 exam-objective task types into v2 as **draft** (`--types=<T> --limit=200
--status=draft`, single-type). Listening stays draft (no audio per G6 gate). No new content,
no `active`, no schema/frontend/DeepSeek changes.

## Pre-write snapshot (before apply)
- totalSets 2600, all `draft`; active 0; deprecated antonym_choice 0 / cet_cloze 0.
- No exam-objective types present yet (only 13 word-universe × 200).

## Migration result (apply)
| Type | v1 rows | sets | items | rejected | deprecated |
|---|---:|---:|---:|---:|---:|
| reading_comprehension | 200 | 67 | 200 | 0 | 0 |
| listening_comprehension | 200 | 67 | 200 | 0 | 0 |
| banked_cloze | 200 | 200 | 200 | 0 | 0 |
| seven_select | 200 | 200 | 200 | 0 | 0 |
| para_match | 200 | 200 | 200 | 0 | 0 |
| cloze_passage | 200 | 200 | 200 | 0 | 0 |
| grammar_fill | 200 | 200 | 200 | 0 | 0 |

**Delta +1134 sets / +1400 items.** reading/listening group by passage (67 sets / 200 items each).

## Post-write snapshot (after apply)
- totalSets **3734** (= 2600 + 1134), all `draft`. activeTotal **0**.
- deprecated antonym_choice **0** / cet_cloze **0**.
- Delta fully explainable (matches planned write exactly).

## QA / validators (real exit codes, not piped)
| Command | Exit | Result |
|---|---|---|
| qa:qbank-v2-migration | 0 | migrated sets 3734 · items 4000 · errors 0 |
| validate:qbank-v2 | 0 | active sets 0 · active items 0 · errors 0 |
| validate:practice-session | 0 | clean on re-run (see ledger G1C-vps-flaky) |
| validate:papers | 0 | cet4 mini/full = insufficient_pool (controlled) |

## Idempotency
Re-applied `grammar_fill` (legacy_id unique) → **0 written / dup-skip 200**.

## Structural spot-check (3 sets/type, `qbank-v2-spotcheck.ts`, sets_with_issues 0)
- reading_comprehension: choice, 4 choices, answer hits choice id, stimulus=passage. ✓
- listening_comprehension: listen, 4 choices, stimulus=lecture (transcript retained for QA only). ✓
- banked_cloze: multi_blank, 10 answer indices into 15-word bank, no dups, in range. ✓
- seven_select: multi_blank, 5 answer indices into 7 options, no dups. ✓
- para_match: matching, 10 paragraph indices (duplicate targets are legitimate for matching). ✓
- cloze_passage: multi_blank, per-blank `{options[4], answer=index-string}` — scoring `looseEq`
  numeric coercion (scoring.ts) resolves index form; faithful v1 structure. ✓
- grammar_fill: multi_blank, flat array of 10 non-empty answer strings. ✓

## Confirmations
- active sets = **0** (draft only). deprecated antonym_choice/cet_cloze = **0**.
- No source/schema/frontend/DeepSeek changes. Faithful v1 structure-preserving migration.
- New read-only helper scripts added (no content writes): `qbank-v2-snapshot.ts`, `qbank-v2-spotcheck.ts`.

## Issues
- 1 new minor (`G1C-vps-flaky`, insufficient_pool, open, pre-existing word coverage gap → G11).
- Unresolved blocking/major: **0**.

## Self-review
1. Scope ✓ (migration only; no frontend/limit/active/v1-delete). 2. Status ✓ (all draft, active 0).
3. Deprecated ✓ (0/0). 4. QA ✓ (all required validators exit 0; one flaky surface explained).
5. DB ✓ (delta +1134 explainable; idempotent dup-skip). 6. Content ✓ (faithful v1, answer keys
determinable across all 7 shapes). 7. Report ✓ (this file + ledger).

SELF-REVIEW PASS — continuing to G1D
