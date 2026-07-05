# F0 — Baseline Refresh and Report Reconciliation (2026-07-03)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md` (Phase F0)
Branch: `iter5-f1`. Commit: the commit introducing this file (see `git log --follow reports/f0-baseline-reconciliation-2026-07-03.md`).

## 1. Goal and outcome

Coverage audit and TOEFL task-alignment reports contradicted each other: coverage still hard-blocked
TOEFL Reading (`read_daily_life`, `reading_comprehension`) as `BLOCKED / official_spec_unverified`,
while `validate:toefl-task-alignment` + `reports/toefl-reading-pilot-2026-07-02.md` treat both as
spec-confirmed draft-only (`draft_ready`).

**Resolved.** Coverage now classifies both cells as **`PILOT_DRAFT`** with reasons
`spec_confirmed_project_practice_shape, needs_90_more`. The wording explicitly records that the
**4-option MCQ reading shape is the project practice format, NOT a claimed exact ETS UI**.
`official_spec_unverified` is no longer emitted by any script (it remains only as a defensive
promote-guard check in `scripts/promote-question-sets-v2.ts` / promotion RPC, and in historical
reports/plans, which were intentionally left untouched).

Matrix delta (49 rows, totals unchanged):

| bucket | before | after |
|---|---:|---:|
| READY_ACTIVE | 40 | 40 |
| BLOCKED | 5 | 3 (`build_a_sentence` scoring_not_ready; 2 speaking audio_missing) |
| PILOT_DRAFT | — (new) | 2 (both TOEFL Reading cells) |
| MISSING | 4 (all IELTS) | 4 |
| THIN | 0 | 0 |

`PILOT_DRAFT` semantics: keyed to `SPEC_CONFIRMED_PILOT` cells only (not a blanket THIN rename);
below `READY_THRESHOLD=50` it reports `needs_{100−pool}_more` toward the master-plan target
`PILOT_TARGET=100`; at pool ≥ 50 the cell self-heals into the ordinary `READY_DRAFT` path
(validated by fixture 8c), so no code change is needed after F1 lands 100+100 draft.

## 2. Changed files

- `scripts/audit-question-bank-v2-coverage.ts` — `SPEC_BLOCKED`→`SPEC_CONFIRMED_PILOT`,
  new `PILOT_DRAFT` state + `PILOT_TARGET=100`, report sections/state counts extended.
- `scripts/validate-coverage-audit.ts` — new fixture 8 (PILOT_DRAFT reasons, no
  `official_spec_unverified`, self-heal to READY_DRAFT at 100, non-pilot stays THIN);
  structure fixtures updated (empty pilot cells → MISSING; `build_a_sentence` stays
  BLOCKED/scoring_not_ready).
- `reports/qbank-v2-coverage-audit.md` / `.json` — regenerated from live DB.
- `reports/toefl-task-alignment-validation.json` — regenerated (errors=0 warnings=0, `paperReady=false`).
- `reports/qbank-production-issue-ledger.md` — new 2026-07-03 CURRENT STATE note; TOEFL reading
  bullet marked superseded (`official_spec_unverified` → `spec_confirmed_project_practice_shape`),
  stale TOEFL listening "MISSING" bullet corrected to 专项-active 10+10, speaking bullet updated to
  `speaking_pipeline_not_ready` boundary state.
- Bundled required-command dependencies from the previous (uncommitted) checkpoint, without which
  the committed tree cannot run `npm run validate:toefl-task-alignment`:
  `package.json` (one script entry), `scripts/validate-toefl-task-alignment.ts`,
  `data/exam-task-templates/toefl-choose-a-response.json`, `data/exam-task-templates/toefl-listening-mcq.json`.
- `reports/f0-baseline-reconciliation-2026-07-03.md` — this report.

## 3. DB writes

**No DB writes.** All commands are read-only audits/validators.

## 4. Content counts before/after

Unchanged: sets 6047 · items 7291 · active 2364 · draft 3683.
Confirmed per plan: `read_daily_life` 10 draft / 24 items; `reading_comprehension` 10 draft / 40 items.

## 5. Content self-review

No content authored in F0.

| taskType | authored | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|
| (none) | 0 | 0 | 0 | 0 | 0 | 0 |

## 6. Commands and exit codes

| command | exit |
|---|---:|
| `git status --short` | 0 |
| `npm run validate:toefl-task-alignment` (baseline) | 0 |
| `npm run audit:qbank-v2-coverage` (baseline) | 0 |
| `npm run audit:qbank-v2-coverage` (post-change regen) | 0 |
| `npm run validate:coverage-audit` | 0 |
| `npm run validate:toefl-task-alignment` (post-change regen) | 0 |
| `npm run validate:qbank-v2` | 0 (active sets 2364 · active items 3564 · errors 0) |
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |

## 7. Active / deprecated counts

- Active sets total: **2364** (active items 3564).
- `antonym_choice` = **0** (0 rows in actual grid, any status).
- `cet_cloze` = **0** (0 rows in actual grid, any status).

## 8. Skipped items

- None within F0 scope.
- Note: the working tree carries earlier-checkpoint changes NOT owned by F0 and NOT committed here
  (e.g. `components/practice/PracticeRunner.tsx`, `lib/practice/session-builder.ts`,
  `lib/practice/answer-mode.ts`, `scripts/validate-practice-session.ts`,
  `scripts/validate-practice-answer-contracts.ts`, TOEFL pilot data dirs, various report JSONs).
  They belong to the 2026-07-01/02 TOEFL alignment/boundary checkpoint and await their own commit
  decision. Only the four files strictly required to run F0 commands were bundled (see §2).
- Historical reports/plans mentioning `official_spec_unverified` were intentionally not rewritten
  (they are dated records); the ledger marks the wording as superseded.

## 9. TOEFL paperReady

Still **`false`** — asserted hard by `validate:toefl-task-alignment` (errors=0) and echoed in
`reports/toefl-task-alignment-validation.json` (`staticSummary.paperReady=false`,
`blockerSummary.paperReady=false`). TOEFL full/mini mock remains closed.

## 10. Self-review checklist (§1.1)

- [x] Phase-owned files created/modified (§2)
- [x] Every required command run with real exit code recorded (§6, all 0)
- [x] Content self-review: N/A — zero items authored (§5)
- [x] Phase report written under `reports/`
- [x] No REVIEW/REJECT item imported (nothing imported)
- [x] No promote, no active-row change, no DB write
- [x] `paperReady=false` verified
- [x] No hard-stop condition triggered

## 11. Recommendation

Proceed to **F1: TOEFL Reading expansion to 100+100 draft** (author 90 `read_daily_life` +
90 `reading_comprehension` sets in 30-set sub-batches, import draft-only with dry-run →
apply → idempotency check; no promote). Coverage will then self-heal these two cells to
`READY_DRAFT` without further script changes.
