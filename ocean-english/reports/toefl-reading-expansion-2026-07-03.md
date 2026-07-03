# F1 — TOEFL Reading Expansion to 100+100 Draft (2026-07-03)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md` (Phase F1)
Branch: `iter5-f1`. Commit: the commit introducing this file.
Stage: `toefl-reading-expansion-2026-07-03`. Generation provider: **Claude-authored JSON, DeepSeek not used.**

## 1. Goal and outcome

Expand TOEFL Reading from 10+10 pilot draft to **100+100 draft**. Done:

| taskType | sets before | sets after | items before | items after | status |
|---|---:|---:|---:|---:|---|
| `read_daily_life` | 10 draft | **100 draft** | 24 | 250 (+226) | all draft |
| `reading_comprehension` (toefl academic) | 10 draft | **100 draft** | 40 | 400 (+360) | all draft |

No promote. TOEFL `paperReady=false` unchanged.

## 2. Authoring method and sub-batches

Per plan, each task type was authored in 3 internally labelled sub-batches of 30, each with a
disjoint material/topic allocation to prevent cross-batch duplicates:

- `read_daily_life`: A = sign/notice/label · B = email/message · C = menu/schedule/social_media_post/advertisement.
- `reading_comprehension`: A = biology/environment/earth_science · B = history/humanities/social_science · C = physics/psychology/astronomy-technology.

Every sub-batch was structurally validated (4 options, answer∈options, distinct options,
word-count bounds, 2-3 items DL / exactly 4 items academic) before merging into the two final
stage files. Correct-answer positions were deliberately balanced: final distribution across all
586 items is A=147 · B=146 · C=148 · D=145.

All passages are original (no ETS/real-exam text, no real brands/people); the 4-option MCQ is the
project practice shape (`spec_confirmed_project_practice_shape`), not a claimed exact ETS UI.

## 3. Semantic self-review (§1.2)

Two independent adversarial review passes (one per stage file, 100% of sets) checked: single
defensible answer, wrong keys, answer leakage, weak/also-true distractors, vocab-in-context match,
stale references, word-overlap-only answers, near-duplicate scenarios. Plus my own review of every
flagged item and all replacement sets.

Findings: academic 90/90 clean (0 defects). Daily-life had **4 near-duplicate scenarios** across
sub-batches (shuttle timetable, study-room rules, language-partner program, printing quota — batch C
duplicating A/B scenarios). All 4 were **rejected and replaced before import** with fresh scenarios
(farmers market, movie night, smart lockers, photo contest), then the whole file re-verified.

| taskType | authored | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|
| read_daily_life | 94 | 90 | 0 | 4 (replaced pre-import, never imported) | 90 | 0 |
| reading_comprehension | 90 | 90 | 0 | 0 | 90 | 0 |

The imported manifest is 100% PASS. No REVIEW/REJECT item was imported.

## 4. Import flow and DB writes

| step | result |
|---|---|
| dry-run | parsed_ok 180 · reject 0 (exit 0) |
| apply #1 | **wrote 180** · dup-skip 0 (90+90, exit 0) — matches plan expectation exactly |
| apply #2 (idempotency) | wrote **0** · dup-skip **180** (exit 0) — matches plan expectation exactly |

DB writes: `stimuli` +180 draft, `question_sets` +180 draft, `question_items` +586 draft.
All rows `status='draft'`, `qa_flags.stage='toefl-reading-expansion-2026-07-03'`,
`provider='claude-authored'`. No active changes anywhere.

## 5. Verification (scripts/verify-toefl-reading-expansion.ts)

`--source` (exit 0): 90+90 sets parse through `shapeToItems`; every item exactly 4 choices; every
answer hits a choice id; DL 2-3 items/set, academic exactly 4; no in-source duplicate content hash;
no deprecated type.

`--db` (exit 0): source→DB forward 1:1 by deterministic legacy_id 90/90 + 90/90, all draft, correct
stage flag; DB→source reverse: stage sets 180 = expected 180, **orphan 0** (no source-outside-DB, no
DB-outside-source); whole-bank totals `read_daily_life` draft = **100**, `reading_comprehension`
draft = **100**; per-item 4 choices + answer∈choices + item draft; stage active = 0.

## 6. Commands and exit codes (all 0)

| command | exit |
|---|---:|
| `npx tsx scripts/verify-toefl-reading-expansion.ts --source` | 0 |
| `npm run import:authored-qsets-v2 -- --stage=toefl-reading-expansion-2026-07-03` (dry-run) | 0 |
| `... --apply` (first) | 0 (wrote 180) |
| `... --apply` (second) | 0 (wrote 0 · dup-skip 180) |
| `npx tsx scripts/verify-toefl-reading-expansion.ts --db` | 0 |
| `npm run qa:qsets-v2` | 0 (模板 32 · 错误 0) |
| `npm run validate:qbank-v2` | 0 (active 2364 sets / 3564 items · 错误 0) |
| `npm run validate:practice-session` | 0 (错误 0) |
| `npm run validate:papers` | 0 (错误 0) |
| `npm run validate:toefl-task-alignment` | 0 (errors=0 warnings=0) |
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |

## 7. Active / deprecated counts

- Active sets total: **2364** (unchanged — F1 wrote draft only).
- `antonym_choice` = **0** · `cet_cloze` = **0** (no rows any status).

## 8. Skipped items

None. Note: the plan's "total new items should be about 96" for `read_daily_life` appears to be an
arithmetic slip — matching the pilot's 24-items/10-sets ratio over 90 new sets gives ~216; actual
new DL items = 226 (mix of 2- and 3-question sets), academic = 360 (4 × 90), consistent with the
template contracts (`perStimulusItemsRange [2,3]` / `perStimulusItems 4`).

## 9. TOEFL paperReady

Still **`false`** (asserted by `validate:toefl-task-alignment`, errors=0). Full/mini mock closed.

## 10. Self-review checklist (§1.1)

- [x] Phase-owned files created (2 stage JSONs, verifier, 2 reports, import reports)
- [x] All required commands run, real exit codes recorded (§6)
- [x] Every authored item semantically self-reviewed; imported manifest 100% PASS (§3)
- [x] Phase report written under `reports/`
- [x] No REVIEW/REJECT item imported; 4 REJECTs replaced pre-import
- [x] No promote; write counts matched expectations exactly (180 / 0+180 dup)
- [x] `paperReady=false` verified; no hard-stop condition

## 11. Recommendation

Proceed to **F2: TOEFL Reading semantic audit** (audit all 200 draft sets including the 20 pilot
sets, produce audit report + optional promote manifest). Promote itself stays gated on the explicit
user instruction "Promote TOEFL Reading reviewed manifest."
