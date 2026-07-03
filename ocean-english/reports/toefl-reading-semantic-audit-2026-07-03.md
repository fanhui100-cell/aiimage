# F2 — TOEFL Reading Semantic Audit (2026-07-03)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md` (Phase F2)
Branch: `iter5-f1`. Scope: **all 200 TOEFL Reading draft sets** = 100 `read_daily_life` + 100
`reading_comprehension` (20 pilot from 2026-07-02 + 180 from F1). **No DB writes. No promote.**

## 1. Outcome

- Mechanical audit (`scripts/audit-toefl-reading-semantics.ts`): **0 errors**, 36 informational warnings.
- LLM adversarial semantic review (100% of sets, independent reviewers): **0 REJECT**, **2 REVIEW**.
- Both Reading cells now classify **`READY_DRAFT`** in the coverage matrix (self-healed from
  `PILOT_DRAFT` once each pool reached 100 ≥ threshold 50). No script change was needed.
- **Promote gate NOT triggered** — the required instruction "Promote TOEFL Reading reviewed manifest"
  was not given, so no promote manifest was created and no row changed to active.

## 2. Mechanical audit results (exit 0)

| taskType | draft | non-draft | items | pos A/B/C/D | word violations |
|---|---:|---:|---:|---|---:|
| read_daily_life | 100 | 0 | 250 | 79/58/58/55 | 0 |
| reading_comprehension | 100 | 0 | 400 | 130/90/90/90 | 0 |

Checks that passed for all 200 sets: totals 100+100 & all draft; every item exactly 4 distinct
options; answer hits exactly one choice id; stimulus word count within template bounds (DL 12-70,
AC 120-200); items-per-set within range (DL 2-3, AC 4); **0 exact-duplicate passages**; **0
near-duplicate pairs** (token-set Jaccard ≥ 0.60); **0 stale-wording hits** ("last sentence", "the
chart", "the diagram", "paragraph above", "as shown above"); 0 deprecated types. Correct-answer
position share per task type is within 15-35% for all four positions.

### The 36 warnings (informational, not blocking)

All 36 are the "word-overlap-solvable" heuristic on `read_daily_life` items where the correct
option restates a fact from a short notice (e.g. "Store them in the lockers by the entrance"). For
**locate-information / literal-comprehension** items on practical daily-life texts (signs, notices,
menus), a correct option that echoes the text is legitimate item design, not a defect — the
independent LLM review confirmed these are proper recall items at level 6. No academic item tripped
this heuristic. These are recorded for transparency, not treated as failures.

## 3. LLM adversarial semantic review

Two independent adversarial passes over the F1 180 (during F1) plus one pass over the 20 pilot sets
(during F2) checked: single defensible answer, wrong key, answer leakage, weak/also-true distractor,
vocab-in-context match, stale reference, word-overlap-only, near-duplicate scenario.

| segment | sets | REJECT | REVIEW | note |
|---|---:|---:|---:|---|
| F1 `read_daily_life` (90) | 90 | 0 | 0 | 4 near-dups were caught + rewritten **before** F1 import |
| F1 `reading_comprehension` (90) | 90 | 0 | 0 | clean |
| pilot `read_daily_life` (10) | 10 | 0 | 0 | clean |
| pilot `reading_comprehension` (10) | 10 | 0 | **2** | see below |

### The 2 REVIEW items (pilot academic, correctly keyed — kept draft, excluded from promote)

1. **pilot academic set 7 (plankton), Q4** — inference-labeled item whose keyed answer ("Plankton
   may stay nearer the surface in daylight") is a near-verbatim synonym-swap of the passage sentence
   "When fish are absent … remain closer to the surface even during daylight". Correct, but tests
   restatement rather than inference.
2. **pilot academic set 9 (desert animals), Q4** — inference-labeled item whose keyed answer ("Some
   species may need to adjust their behavior again") restates "If nights become warmer, species …
   may need to shift their behavior again". Correct, but trivially given away.

Neither is wrong; both are **soft design weaknesses**. Per §1.2 they remain draft and **must be
excluded from any future TOEFL Reading promote manifest** until the Q4 stems are rewritten to demand
a genuine inference step. They belong to the pilot stage (`toefl-reading-pilot-2026-07-02`), not F1.

## 4. Self-review table (§1.2)

| taskType | authored/audited | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|
| read_daily_life | 100 | 100 | 0 | 0 | 100 | 0 |
| reading_comprehension | 100 | 98 | 2 | 0 | 100 | 0 |

The two REVIEW items were imported in a prior phase (pilot); F2 authored nothing. A promote manifest,
if/when approved, would include only the 98 PASS academic sets + 100 PASS daily-life sets and exclude
the 2 REVIEW pilot sets.

## 5. Commands and exit codes (all 0)

| command | exit |
|---|---:|
| `npx tsx scripts/audit-toefl-reading-semantics.ts` | 0 (errors 0 · warnings 36) |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:qbank-v2` | 0 (active 2364 · 错误 0) |
| `npm run validate:practice-session` | 0 |
| `npm run validate:papers` | 0 |
| `npm run audit:qbank-v2-coverage` | 0 (READY_DRAFT 2 · PILOT_DRAFT 0 · READY_ACTIVE 40 · BLOCKED 3 · MISSING 4) |
| `npm run validate:coverage-audit` | 0 |
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |

## 6. Active / deprecated counts

- Active sets total: **2364** (unchanged — no promote). `antonym_choice` = 0 · `cet_cloze` = 0.

## 7. TOEFL paperReady

Still **`false`**. Full/mini mock closed.

## 8. Promote decision

**Not promoted.** Awaiting the explicit user instruction:

> Promote TOEFL Reading reviewed manifest.

On approval, the manifest will target exactly the 198 PASS sets (excluding the 2 pilot REVIEW items),
with `read_daily_life` active delta +100 and `reading_comprehension` active delta +98, and re-run the
listed validators + `smoke:active-serve`. Until then all 200 sets remain draft.

## 9. Recommendation

Proceed to **F2B: TOEFL active text-task top-up** (complete_the_words +30, email_writing +40,
academic_discussion +40, all draft, no promote). Return to Reading promote only when the user
approves the manifest (and, if we want the 2 REVIEW items included, after their Q4 stems are rewritten).
