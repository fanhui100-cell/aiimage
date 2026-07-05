# TOEFL Promote — Reading (F2) + Text top-up (F2B) → active (2026-07-04)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md`
(F2 + F2B promote gates). Owner approval: user selected "Promote TOEFL Reading (198)" and
"Promote TOEFL text top-up (110)" via the F3-boundary decision prompt.

## 1. What was promoted

**308 draft sets → active** in two exact manifests, each promoted through the atomic
`promote_question_sets_v2` RPC (re-validates every set server-side; all-or-nothing txn):

| manifest | taskType | promoted | active before | active after |
|---|---|---:|---:|---:|
| reading (198) | read_daily_life | +100 | 0 | **100** |
| reading (198) | reading_comprehension (toefl academic) | +98 | 0 | **98** |
| text (110) | complete_the_words | +30 | 70 | **100** |
| text (110) | email_writing | +40 | 60 | **100** |
| text (110) | academic_discussion | +40 | 60 | **100** |

RPC result both runs: **candidates = eligible = promoted, rejected 0.**

**Held back (draft):** the 2 pilot academic `reading_comprehension` REVIEW sets
(`gen:toefl-academic-reading:set:claude:1mdm4aa` = plankton Q4, `…:1y6294l` = desert Q4 — weak-inference
restatement). Excluded from the manifest by deterministic legacy-id recompute; they stay draft until
their Q4 stems are rewritten. Hence reading_comprehension active = 98, not 100.

## 2. Exact-manifest mechanism

- `scripts/build-toefl-reading-promote-manifest.ts` — queries level-6 draft read_daily_life (100) +
  reading_comprehension (100), recomputes the 2 REVIEW pilot legacy-ids from the pilot source and
  excludes them → `reports/toefl-reading-promote-manifest-2026-07-03.json` (`setIds[]` = 198).
- `scripts/build-toefl-text-topup-promote-manifest.ts` — collects the 110 stage sets →
  `reports/toefl-text-topup-promote-manifest-2026-07-03.json` (`setIds[]` = 110).
- `scripts/promote-question-sets-v2.ts` — added a reviewed `--manifest=<path>` flag that reads
  `setIds[]` (equivalent to `--ids` but auditable and avoids an unreadable multi-thousand-char command
  line). Everything else in the promote guard/RPC is unchanged.

## 3. Post-promote state

- **Active sets: 2364 → 2672 (+308).** Active items: 3564 → 4316. `paperReady` = **false** (unchanged).
- `antonym_choice` = 0 · `cet_cloze` = 0.
- Coverage matrix (49 rows): READY_ACTIVE 40 · BLOCKED 5 · MISSING 4 (IELTS) · PILOT_DRAFT 0 · THIN 0.
  - The 2 TOEFL Reading cells are now **READY_ACTIVE** (100 / 98 active).
  - The 2 TOEFL listening cells are **BLOCKED `audio_incomplete`** — expected: F3 added 90 draft each
    that have no active audio yet. They return to READY_ACTIVE only after audio is generated, reviewed,
    and those sets are promoted.

## 4. Validator update (necessary, not a regression)

`validate:toefl-task-alignment` previously hard-asserted the reading pilot stage must be `draft`
(the pre-promote contract). After the owner-approved promote that became a false failure (74 errors).
Updated to the new contract: read_daily_life pilot = 10 active; reading_comprehension pilot = 8 active
+ 2 held REVIEW draft; item status matches set status; `readiness` for both reading tasks →
`active_ok`; `blockerSummary` records reading as reviewed-active with 2 held. `paperReady=false` still
asserted. Re-run: **errors=0**.

## 5. Commands and exit codes (all 0)

| command | exit |
|---|---:|
| `build-toefl-reading-promote-manifest.ts` | 0 (100 rdl + 98 rc, 2 excluded) |
| `promote:qsets-v2 --manifest=…reading… ` (dry-run) | 0 (198 eligible, 0 rejected) |
| `promote:qsets-v2 --manifest=…reading… --apply` | 0 (**promoted 198**) |
| `build-toefl-text-topup-promote-manifest.ts` | 0 (30+40+40) |
| `promote:qsets-v2 --manifest=…text… ` (dry-run) | 0 (110 eligible, 0 rejected) |
| `promote:qsets-v2 --manifest=…text… --apply` | 0 (**promoted 110**) |
| `validate:qbank-v2` | 0 (active 2672 · items 4316 · 错误 0) |
| `validate:practice-session` | 0 |
| `smoke:active-serve` | 0 (active stimulus all active; no transcript leak) |
| `validate:papers` | 0 |
| `validate:toefl-task-alignment` | 0 (after promote-aware update) |
| `audit:qbank-v2-coverage` + `validate:coverage-audit` | 0 |
| `lint` · `tsc --noEmit` | 0 · 0 |

## 6. Result

TOEFL Reading 专项 (read_daily_life + academic reading_comprehension) and the three text tasks
(complete_the_words / email_writing / academic_discussion) are now **active and practiceable in 专项
mode**. TOEFL full/mini mock remains closed (`paperReady=false`). Next: F3 listening audio generation
(owner-approved) → machine_checked → listening review → listening promote.
