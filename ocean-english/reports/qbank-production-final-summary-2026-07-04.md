> **⚠️ SUPERSEDED (2026-07-05):** Point-in-time snapshot. TOEFL is now `paperReady=true` (mock v1 opened — see `reports/toefl-mock-v1-open-2026-07-05.md` and `reports/final-qbank-learning-loop-readiness-2026-07-05.md`); active-set counts have moved (2672→2854). Statements below such as "TOEFL paperReady=false / paper_not_ready" reflect 2026-07-04 state only and no longer match `lib/exam-specs/specs.ts`. Do not read this as current status.

# Question Bank Production — Final Summary (F9 audit, 2026-07-04)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md`.
Branch: `iter5-f1`. This run executed F0→F3 + F2/F2B promote + F3 audio + F4/F5 decisions + F9 audit.

## 1. Live totals

- **Active sets 2672 · active items 4316** (was 2364/3564 at run start). Draft 3845.
- Coverage canonical matrix (49 rows): **READY_ACTIVE 40 · BLOCKED 5 · MISSING 4 (all IELTS) · PILOT_DRAFT 0 · THIN 0.**
- `antonym_choice` = 0 · `cet_cloze` = 0 (any status). **TOEFL `paperReady` = false** (full/mini mock closed).

## 2. Final classification

### ACTIVE_READY (practiceable now)
- Six non-TOEFL exams unchanged: zhongkao / gaokao / cet4 / cet6 / kaoyan / SAT — all canonical cells active.
- **TOEFL 专项 (newly active this run):**
  - `read_daily_life` 100 active · `reading_comprehension` (academic) 98 active
  - `complete_the_words` 100 · `email_writing` 100 · `academic_discussion` 100
  - `choose_a_response` 10 active · `listening_comprehension` 10 active (2026-07-02 pilot, active audio)

### DRAFT_READY_NOT_PROMOTED (content done, awaiting owner promote)
- **TOEFL listening +180** (`choose_a_response` 90 draft, `listening_comprehension` 90 draft) — authored,
  validated, and now with **`machine_checked` Azure TTS audio** (180 files, ~free). Promote pending a
  human listen-review + "Promote TOEFL listening reviewed manifest".
- **2 pilot academic `reading_comprehension` REVIEW sets** held draft (plankton/desert Q4 weak inference).

### BLOCKED_AUDIO
- The 180 listening drafts are coverage-BLOCKED `audio_incomplete` until their machine_checked audio is
  reviewed→active and the sets are promoted. (Not a defect — the intended gated state.)

### BLOCKED_RUNTIME / product-decision-excluded
- `build_a_sentence` — BLOCKED `scoring_not_ready` (F4 owner decision: option 4, keep blocked). 10 draft.
- `listen_and_repeat` / `interview_speaking` — BLOCKED `speaking_pipeline_not_ready` (F5 owner decision:
  defer). 10 draft each. No mic/storage/ASR/scoring pipeline built.

### BLOCKED_SPEC
- None remaining. The former `official_spec_unverified` on TOEFL Reading was resolved in F0
  (`spec_confirmed_project_practice_shape`) and the content is now active.

### INSUFFICIENT_CONTENT
- None in the canonical matrix (THIN 0).

### COMING_SOON
- **IELTS (lv8)** — 4 canonical cells MISSING (0 content), `status=coming_soon`. Not started (owner has
  not approved IELTS; F7 deferred). Papers correctly refuse with `exam_coming_soon`.

## 3. F9 audit — commands and exit codes

| command | exit | note |
|---|---:|---|
| validate:dictionary | 0 | 344 words, errors 0 |
| validate:question-types | 0 | taxonomy ok, deprecated=2 tracked |
| validate:exam-specs | 0 | 8 exams |
| validate:qbank-v2 | 0 | active 2672 / items 4316 · errors 0 |
| validate:practice-session | 0 | |
| validate:audio-assets | 0 | 180 new machine_checked rows, errors 0 |
| validate:papers | 0 | |
| validate:rubrics | **1** | **pre-existing IELTS gap only** (`ielts/writing`, `ielts/speaking` — coming-soon, deferred; not this run) |
| validate:learning-loop | 0 | |
| validate:data-quality | 0 | 0 zh-contamination, 0 dead links |
| audit:vocab-levels | 0 | |
| audit:qbank-v2-coverage + validate:coverage-audit | 0 | |
| analyze:lexigraph | 0 | |
| verify:toefl-current | 0 | after promote-aware update (100/100/100, reading active) |
| smoke:papers | 0 | after controlled-refusal update; **TOEFL→paper_not_ready, IELTS→exam_coming_soon** |
| smoke:full-routes | 0 | active 2672, 0 deprecated active, active listening all have audio |
| smoke:paper-e2e | 0 | gaokao full submit/score 110/110 |
| smoke:learning-loop-e2e | 0 | |
| smoke:active-serve | 0 | no transcript leak |
| lint · tsc · build | 0 · 0 · 0 | Next.js build clean |

**Only red: `validate:rubrics` (2 IELTS errors)** — a pre-existing coming-soon scaffolding gap, out of
this run's scope. Every other audit command is green.

## 4. Validator/smoke maintenance done this run (stale contracts → current reality)

The owner-approved content growth + promotes made several point-in-time verifiers assert obsolete
counts. Updated (not gamed — they now match the approved state):
- `validate-toefl-task-alignment.ts`: reading pilot expected active (10 rdl / 8 rc + 2 held REVIEW draft),
  readiness `active_ok`; `paperReady=false` still asserted.
- `verify-toefl-current.ts` + `verify-toefl-pilot.ts` + `verify-toefl-complete-words-expansion.ts` +
  `verify-toefl-writing-expansion.ts`: text-task totals 70/60/60 → 100/100/100; reading no longer
  "stopped"; `read_daily_life`/`choose_a_response` removed from the blocked-active denylist (both
  legitimately active); F2B stage recognized.
- `check-paper-api-smoke.ts`: accept the generator's full controlled-refusal set
  (`paper_not_ready`/`exam_coming_soon`/…), not only `insufficient_pool`.
- `audit-question-bank-v2-coverage.ts` + `validate-coverage-audit.ts` (F0): `official_spec_unverified`
  → `spec_confirmed_project_practice_shape` / `PILOT_DRAFT`, self-healing to READY_DRAFT/READY_ACTIVE.
- `promote-question-sets-v2.ts`: added reviewed `--manifest` flag.

### 4b. Owner review response (2026-07-04, post-F9)

The owner's review found 4 issues; all fixed in the review-response commit:
- **P1 stage verifiers were false-red post-promote** (this section's original claim "verifier suite
  maintained" was incomplete): `verify-toefl-reading-expansion.ts` + `verify-toefl-text-topup.ts` still
  hard-required draft. Now **phase-aware** (`--db [--expect=active|draft]`, default `active` = the
  approved contract): per-set status must equal the expected phase, items match set status, and exact
  active counts asserted — Reading **100/98 (+2 held REVIEW draft)**, Text **100/100/100**. Both re-run
  green. Fixing this exposed and fixed a real aggregation bug: the reading verifier's whole-bank query
  lacked a `level=6` filter, so cross-exam `reading_comprehension` (cet4/SAT…, 465 active) leaked into
  its totals — previously masked because only TOEFL had drafts.
- **P1 dirty working tree**: the 2026-06-23→07-02 checkpoint leftovers (speak-boundary runtime code,
  pilot source data, plans, reports, lexivault cleanup) are now committed with explicit provenance
  (`0629711`). All F0–F9 validations ran with that code present, so the committed tree reproduces the
  verified state; ocean-english is clean.
- **P2 machine-local absolute path** in `build-toefl-reading-promote-manifest.ts`: scratchpad id-file
  output removed (manifest JSON is the only durable artifact). Both manifest builders now also check
  preconditions BEFORE writing, so a post-promote rerun exits 1 without overwriting the committed
  historical manifests.
- **P2 papers smoke over-wide refusal set**: now derives the single acceptable refusal per exam from
  its spec (IELTS→`exam_coming_soon` only, TOEFL→`paper_not_ready` only, active exams must generate or
  `insufficient_pool`); `unknown_exam`/`v2_not_applied` are errors; generating a paper for a
  must-refuse exam is an error. Re-run green.

## 5. Project completeness (per plan's final rule)

The plan says: *do not call the project complete while TOEFL full mock or IELTS remains
blocked/coming-soon.* Both still hold:
- **TOEFL full/mini mock: closed** (`paperReady=false`; smoke confirms `paper_not_ready`). Opening it (F6)
  needs listening active (audio review + promote) and a product decision that the paper composes
  acceptably while excluding build_a_sentence + speaking (both owner-excluded).
- **IELTS: coming_soon** (F7 not started; owner approval required).

So the project is **not** declared complete. What this run delivered: TOEFL Reading + text tasks live in
专项 practice, TOEFL listening content + audio staged for review, and all blockers explicitly classified.

## 6. Outstanding owner actions

1. **Listen-review** the 180 machine_checked listening audio files → activate → "Promote TOEFL listening
   reviewed manifest" (unblocks listening 专项 to 100+100 active).
2. (Optional) rewrite the 2 pilot academic REVIEW Q4 stems, then promote → reading_comprehension 100 active.
3. **F6 full-mock decision**: after listening is active, decide whether TOEFL full/mini opens while
   excluding build_a_sentence + speaking.
4. **F7 IELTS**: approve/deny IELTS build.
5. (Housekeeping) seed IELTS rubrics or scope `validate:rubrics` to active exams to clear its 2 errors.
