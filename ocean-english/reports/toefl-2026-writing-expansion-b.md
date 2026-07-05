# TOEFL 2026 Writing Expansion — Window B Report

**Stage:** `toefl-2026-expansion-b` · **Task types:** `email_writing`, `academic_discussion` · **Status:** all `draft`, nonofficial, **not activated**.

> **User override of the plan.** The plan specified **40 new each → total 50 each**. The user changed the target to **total 60 each per pool**, i.e. **50 new each** (`email_writing` 50 + `academic_discussion` 50, plus the existing pilot 10 → **60 each**). Because 50 is not divisible by 8 categories/domains, and the user chose "distribute evenly across 8", the matrix is **[7, 7, 6, 6, 6, 6, 6, 6]** (the first two buckets get 7, the rest 6). Source files are named `toefl-email-50.productive.json` / `toefl-discussion-50.productive.json` (the plan's `-40` names superseded by the new count). The stage verifier, merge tooling, and DB targets were all updated to match.

## 0. Codex review rework (single-record fix)

Codex review flagged **email #4 (index 3)** and **email #10 (index 9)** as semantic duplicates — both were "a part-time job causes a section time-conflict → request to switch section → ask the procedure." Fix applied (quantities unchanged at 60/60, matrix unchanged `[7,7,6,6,6,6,6,6]`):

- **Kept:** email #4 (index 3) — Psychology Friday discussion-section move (category *course scheduling, absence, deadline, clarification*).
- **Rewrote:** email #10 (index 9, category *instructor, adviser, or teaching-assistant communication*) into a different core problem with different actions: *a second-year student asks academic adviser Dr. Mensah which of two electives ("GIS" vs "Statistics for Environmental Science") better supports a specialization goal, and whether choosing one limits future courses.* No schedule conflict, no section switch, no "ask procedure."
  - Old legacy_id: `gen:productive:email_writing:set:claude:1fowteh`
  - New legacy_id: `gen:productive:email_writing:set:claude:jlyi0b`

**Targeted delete (no bulk delete):** the old record was removed by its exact legacy_id only — after asserting `qa_flags.stage='toefl-2026-expansion-b'`, `task_type='email_writing'`, `status='draft'` (all passed) — deleting its 1 `question_item` (`…:item:claude:1fowteh:0`) then the `question_set` (`93fc055e-6e56-428b-ac0f-5784d7dc8136`). No delete by task_type.

**Re-apply / idempotency (per-file email line):** apply → `wrote 1 / dup 49`; idempotent rerun → `wrote 0 / dup 50` (total lines `wrote 1 / dup 99` then `wrote 0 / dup 100`, since the unchanged 50 discussions are all dup). DB verifier after rework: **email stage sets = 50** (old deleted, new added; no source-external set), owned draft **60/60**, active 0, antonym/cet_cloze 0.

**Semantic dedup re-check (meaning-level, not string).** The rewritten task was reviewed against all 49 other new emails and the 10 pilot emails: **index 9 = DISTINCT** (course-selection counseling; explicitly not a section-switch). No same-core-problem pair exists among the 50 new emails. A full secondary scan surfaced two NEW-vs-PILOT findings, both since adjudicated:

1. **`new#31` ↔ `pilot#3`** (broken-facility object-swap) — **RESOLVED in the P1 rework below.**
2. **`new#35` (UPDATE an existing rec letter) ↔ `pilot#9` (NEW rec letter)** — **KEPT** per P2 review decision (update-vs-new is a sufficiently different task purpose).

## 0b. P1 review rework (second single-record fix)

A follow-up review marked **`new#31` ↔ `pilot#3`** as a **P1 (merge-blocking)** strong duplicate: both were "a broken campus facility → describe + how it affects me → ask when it will be repaired/fixed," differing only by object/location (library study-desk lights vs dorm heater). The P2 rec-letter pair was confirmed acceptable and left unchanged.

Fix (quantities/matrix unchanged, 60/60, `[7,7,6,6,6,6,6,6]`):
- **Rewrote** email index 31 (category *housing, dining, transportation, or campus facilities*) into a non-repair-timeline scenario: *a student whose schedule changed now drives to campus and asks the Transportation & Parking Office to obtain a student parking permit — explain the new need, ask about eligibility/cost, and ask whether a temporary permit is available while on the waitlist.* No broken facility, no "when fixed."
  - Old legacy_id: `gen:productive:email_writing:set:claude:5jxqgh`
  - New legacy_id: `gen:productive:email_writing:set:claude:161a40t`
- **Targeted delete (no bulk delete):** removed the old record by its exact legacy_id only — after asserting `qa_flags.stage='toefl-2026-expansion-b'`, `task_type='email_writing'`, `status='draft'` (all passed) — deleting its 1 `question_item` (`…:item:claude:5jxqgh:0`) then the `question_set` (`bbeac1b6-d62c-4878-92fa-a160cdc58c83`).
- **Re-apply / idempotency (per-file email line):** apply → `wrote 1 / dup 49`; idempotent rerun → `wrote 0 / dup 50`.
- **Semantic recheck:** index-31 = **DISTINCT** (parking-permit acquisition; not a broken-facility pattern; only parking/vehicle-permit prompt in either set; distinct from pilot#3 and all 60).
- **Verification:** source verifier, DB verifier (email/discussion stage=50, owned **60/60** draft, active 0, antonym/cet_cloze 0, no source-external set), qa:qsets-v2, validate:qbank-v2, validate:rubrics, validate:question-types, lint, tsc --noEmit, snapshot — all **exit 0**.

## 1. Starting commit / worktree / status

- Worktree: `D:/ai-worktrees/ocean-toefl-b` (`ocean-english`), branch **`qbank/toefl-writing`**, checkpoint **`d30f049`** (tag `qbank-v2-pre-parallel-20260622`).
- Window A: `D:/ai-worktrees/ocean-toefl-a` (`qbank/toefl-complete-words`) @ `d30f049` — **same checkpoint, separate filesystem directory** (isolation confirmed).
- `.env.local`: present, untracked.
- `git status --short` at start: clean. At handoff:
  ```
   M reports/question-bank-v2-validation.json   (validator-regenerated by §11 commands)
   M reports/question-sets-v2-qa.json            (validator-regenerated by §11 commands)
   M reports/rubrics-validation.json             (validator-regenerated by §11 commands)
  ?? data/generated-question-sets/toefl-2026-expansion-b/
  ?? reports/authored-productive-toefl-2026-expansion-b-apply-report.json   (importer-generated)
  ?? reports/authored-productive-toefl-2026-expansion-b-dryrun-report.json  (importer-generated)
  ?? scripts/verify-toefl-writing-expansion.ts
  ```

**Baseline snapshot (before any write):** `totalSets=4878`, `activeTotal=0`, `antonym_choice=0`, `cet_cloze=0`, `email_writing draft=10`, `academic_discussion draft=10` — matches the plan's expected baseline exactly. `npx tsx scripts/verify-toefl-pilot.ts` exited **0** with 10 draft for each owned task type.

## 2. Changed files

**Owned (new):**
- `scripts/verify-toefl-writing-expansion.ts` — stage verifier (source-only + `--db` modes).
- `data/generated-question-sets/toefl-2026-expansion-b/toefl-email-50.productive.json`
- `data/generated-question-sets/toefl-2026-expansion-b/toefl-discussion-50.productive.json`
- `reports/toefl-2026-writing-expansion-b.md` / `.json`

**Importer-generated:** `reports/authored-productive-toefl-2026-expansion-b-{dryrun,apply}-report.json`.
**Validator-regenerated** (side effect of the §11-mandated validators against the shared DB; not on the forbidden list, not manual edits): `reports/question-bank-v2-validation.json`, `reports/question-sets-v2-qa.json`, `reports/rubrics-validation.json`.

No forbidden shared file or Window A file was modified.

## 3. Exact source counts by task type and category/domain

**email_writing — 50**, matrix `[7,7,6,6,6,6,6,6]`:

| Category | Count |
|---|---:|
| course scheduling, absence, deadline, clarification | 7 |
| instructor, adviser, or teaching-assistant communication | 7 |
| library, laboratory, tutoring, or academic support | 6 |
| group project, presentation, club, or campus event | 6 |
| housing, dining, transportation, or campus facilities | 6 |
| application, recommendation, internship, or research opportunity | 6 |
| registration, records, fees, identification, or student services | 6 |
| complaint, repair, accessibility, safety, or conflict resolution | 6 |

**academic_discussion — 50**, matrix `[7,7,6,6,6,6,6,6]`:

| Domain | Count |
|---|---:|
| education and learning | 7 |
| technology and society | 7 |
| environment and public policy | 6 |
| economics and work | 6 |
| health and psychology | 6 |
| cities, transport, and community | 6 |
| media, culture, and ethics | 6 |
| science, research, and innovation | 6 |

Discussions use **50 distinct professor surnames + 100 distinct student given-names**, none overlapping the pilot's names; no professor/student-name combination repeats.

## 4. Duplicate-check results

- **Normalized exact dedup** (lowercase + collapsed whitespace) within the new 50 and against the existing pilot 10, for each type: **0 duplicates** (enforced by `verify-toefl-writing-expansion.ts`, which loads both new files and both pilot files; 50 distinct derived legacy IDs per type → no hash collisions).
- **Material (same-underlying-question) duplicates** found during full manual inspection and **repaired (4)** — these are echoes the normalized check cannot catch:
  1. email #7 — "sick → missed lecture → catch up" duplicated email #1 (the overused absence trope) → replaced with an alternative-format assignment request.
  2. email #30 — "booking system shows available but rejects" echoed the enrollment-error email (#38) and the squatted study-room email (#17) → replaced with a broken laundry-machine scenario.
  3. discussion #16 — "right to repair / durability mandate" duplicated discussion #13 (device durability/e-waste) → replaced with a congestion-charge question.
  4. discussion #33 — "car-free downtown zones" duplicated discussion #18 (closing streets to cars) → replaced with short-term vacation-rental limits.
- **Borderline echoes kept** (defensibly distinct policy instruments / contexts; noted for reviewer): parks-vs-housing (mandate vs single-lot), automation-retraining (responsibility vs investment target), broken-lights (study desk vs garage safety), section-move (discussion section vs course section).

## 5. Dry-run, first apply, idempotency

| Step | Result |
|---|---|
| Dry-run | `tasks 100`, DB writes `0` |
| First apply | `wrote 100`, `dup 0`, `skipped 0`; all sets/items `draft`; rubric coverage `100/100` |
| Idempotent reapply | `wrote 0`, `dup 100`, `skipped 0` |

## 6. DB set/item/status/rubric counts

- Stage `toefl-2026-expansion-b` sets: **email_writing 50**, **academic_discussion 50** (reverse-checked: no source-external set in the stage).
- Owned totals: **email_writing 60 draft / 0 active**, **academic_discussion 60 draft / 0 active** (pilot 10 + expansion 50).
- Every new item: exactly 1 per set; `input_mode='free_text'`; `choices=[]`; `answer.type='rubric_scored'`; `answer.official=false`; `rubric_id` nonempty and equal to the TOEFL writing rubric resolved from the DB (`exam_id=toefl`, `skill=writing`); `qa_flags.wordLimit` matches source.
- Source→DB deterministic 1:1: **50/50 per type** (prompt, prompt_zh, exact `answer.referencePoints`, status, level=6, task_type).

## 7. Five sample legacy IDs per task type

**email_writing:** `…:set:claude:1xmthay`, `lod9o6`, `31xwqd`, `1cwzka8`, `gn5yz8`
**academic_discussion:** `…:set:claude:1albs4g`, `1dkqrga`, `812lfk`, `bs66a8`, `1x1282i`
(full prefix: `gen:productive:<taskType>:set:claude:<tag>`)

## 8. Manual-review examples (≥5 per type)

**email_writing**
1. *course scheduling* — Two required courses (Statistics, Economics) clash on the same slot → scheduling office: explain the conflict, ask about another section/term, request degree-progress advice. Formal admin register; exactly 3 actions.
2. *library/lab/support* — Library front-desk worker reshelved a returned book in the wrong section → head librarian: explain, apologize, ask how to help locate it quickly. Subordinate→superior workplace register; apology + 3 actions.
3. *group/event* — Study-group poster uses a hard-to-read font/colour → group: raise the readability concern, suggest specific font/colour changes, ask the group to vote before the weekend. Peer semi-formal collaborative tone.
4. *application/research* — Accepted a paid research-assistant role, then found a course clashes with most lab shifts → Dr. Okafor: explain the conflict, apologize, propose continuing part-time. Professional apologetic register.
5. *complaint/conflict* — Upstairs neighbour plays loud music late at night → residence-hall manager: describe the problem, explain the impact, ask the manager to help resolve it politely. Restrained complaint register.
6. *(repaired) instructor communication* — Wants to submit the final assignment as a recorded presentation instead of a written report → Prof Alvarez: request permission, explain why the format suits the project, ask whether the same grading criteria apply.

**academic_discussion**
1. *education* — Dr. Hartman: handwriting vs typing notes. Aiden (handwriting forces you to process) vs Bianca (typing captures more, searchable). Genuinely debatable, two defensible views.
2. *technology* — Dr. Nguyen: should companies be required to retrain workers displaced by AI, or leave it to individuals/government. Otto (firms profit → bear cost) vs Pablo (individuals/public programs; mandates slow useful tech).
3. *environment* — Dr. Yamamoto: pay-as-you-throw trash fees. Celine (ties cost to behaviour, changes habits) vs Dmitri (burdens larger/low-income households).
4. *health* — Dr. Bhatt: if you can protect only one daily, sleep or exercise. Bodhi (sleep is the foundation) vs Carmen (exercise cuts stress and improves the sleep you get).
5. *science* — Dr. Okeke: basic curiosity-driven vs applied problem-solving research funding when money is tight. Ivar (basic seeds future tech) vs Juno (applied helps people sooner).
6. *(repaired) environment* — Dr. Cordova: a downtown congestion charge. Greta (cleaner air; revenue funds transit) vs Hassan (hits low-income workers hardest).

## 9. Rejected / replaced prompts

**6 tasks replaced total.** 4 during initial manual inspection (2 email, 2 discussion — reasons in §4 and JSON `duplicateChecks.repaired`), plus **1 in the Codex #4/#10 rework** (email index 9; see §0) and **1 in the P1 review rework** (email index 31; see §0b). All replacements re-passed source verification, the matrix check, dedup, and the strict DB check after apply.

## 10. Validation commands and exit codes

| Command | Exit | Note |
|---|---:|---|
| `verify-toefl-pilot.ts` (pre-write) | 0 | 10 draft each owned type |
| `qbank-v2-snapshot.ts` (baseline) | 0 | matches expected baseline |
| `verify-toefl-writing-expansion.ts` (source-only) | 0 | 50 each, matrix, dedup, legacy derivation |
| `import-…-v2.ts --stage=toefl-2026-expansion-b` (dry-run) | 0 | tasks 100, writes 0 |
| `import-… --apply` (first) | 0 | wrote 100, dup 0 |
| `import-… --apply` (idempotency) | 0 | wrote 0, dup 100 |
| `verify-toefl-writing-expansion.ts --db` | 0 | 50/50 1:1, owned 60, active 0 |
| `npm run qa:qsets-v2` | 0 | errors 0 |
| `npm run validate:qbank-v2` | 0 | active 0, errors 0 |
| `npm run validate:rubrics` | 0 | errors 0 |
| `npm run validate:question-types` | 0 | taxonomy ok |
| `npm run lint` | 0 | clean |
| `npx tsc --noEmit` | 0 | clean |
| `qbank-v2-snapshot.ts` (final) | 0 | email/discussion 60 each |

Per §11, `verify-toefl-pilot.ts` was **not** run as a final assertion (it still expects the pre-integration 10-set pools and would now report 60/70). Answer-position normalization was **not** run (productive tasks have no choice positions).

## 11. Active / deprecated invariants

Throughout: `gen active = 0`, `antonym_choice = 0`, `cet_cloze = 0`. Final snapshot: `totalSets=5038`, `email_writing draft=60`, `academic_discussion draft=60`, `activeTotal=0`.

## 12. No-DeepSeek / no-copy / no-promote / no-shared-file statement

All 100 tasks were **authored directly by Claude**; **no DeepSeek or external generation API** was used. **No copied or lightly paraphrased ETS questions** (pilot prompts were included in dedup, and overused near-canonical scenarios were identified and repaired). **No model answer or official score** was included — `answer.official=false`, `referencePoints` are scoring guidance only. **All `wordLimit` strings begin with the exact nonofficial prefix.** **All rows are `draft`; nothing was activated.** **No forbidden shared file or Window A file was modified.**

## 13. Window A drift (shared DB) — flagged for reconciliation

Before this window's apply, the shared Supabase DB showed `complete_the_words` had grown 10 → **70** (+60) and `totalSets` 4878 → 4938 (+60) — **fully explained by Window A** writing 60 `complete_the_words` drafts to the shared DB; none touched the owned writing types, and active/deprecated stayed 0 (acceptable per §1).

**Discrepancy to reconcile:** Window A reached **70 total (= 60 new)** for `complete_the_words`, while Window B applied **60 total (= 50 new)** per the user's explicit answer ("总共 60，新增 50"). The two windows appear to have interpreted the "60" change differently (A: 60 *new*; B: *total* 60). Window B followed the explicit instruction; surfaced here so central integration / the user can decide whether the pools should be symmetric.

## 14. Deferred to central integration

- `scripts/verify-toefl-pilot.ts` — still expects 10-set pools; central integration updates it after both windows finish (not edited here).
- `reports/qbank-production-final-summary.md` and `reports/qbank-production-issue-ledger.*` — central, not touched.
- Activation/promotion of these drafts — out of scope; everything remains nonofficial draft.
