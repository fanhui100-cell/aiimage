# F2B — TOEFL Active Text-Task Top-Up to 100 (2026-07-03)

Driver: `docs/superpowers/plans/2026-07-03-toefl-and-remaining-qbank-fable5-master-prompt.md` (Phase F2B)
Branch: `iter5-f1`. Stage: `toefl-text-topup-2026-07-03`.
Generation provider: **Claude-authored JSON, DeepSeek not used.**

## 1. Goal and outcome

Bring the three usable non-audio TOEFL text tasks toward 100 reviewed items each by adding draft
content (no promote):

| taskType | active before | added draft | draft+active after | target (post-promote) |
|---|---:|---:|---:|---:|
| `complete_the_words` | 70 | +30 | **100** | 100 active |
| `email_writing` | 60 | +40 | **100** | 100 active |
| `academic_discussion` | 60 | +40 | **100** | 100 active |

110 new draft records total. **No promote** — active counts unchanged (still 70/60/60 active; the +30/+40/+40 are draft). `build_a_sentence` untouched.

## 2. Authoring method

Three parallel Claude authors, each with the full exclusion list of existing content:

- `complete_the_words` (+30): original 15-55 word academic passages, one target word each, uniquely
  recoverable from context. Every target word is DISTINCT from the existing 70 (verified against the
  live DB list) and from each other; broad first-letter/topic spread. `maskedForm` was generated
  mechanically (show first letter + alternating interior letters) to guarantee shape validity, so no
  `shown_letter_mismatch` / `masked_length` rejects are possible.
- `email_writing` (+40): fresh campus email scenarios, each with a clear recipient + 2-3 explicit
  actions, and 5 Chinese rubric-guidance bullets. All distinct from the existing 60 core scenarios.
- `academic_discussion` (+40): fresh debatable topics, each with a professor question + two named
  students holding opposing views, and 5 Chinese rubric-guidance bullets. All distinct from the
  existing 60 topics.

`wordLimit` on productive tasks is explicit **project guidance** ("not an official TOEFL
requirement"), never a claimed official ETS rule. Productive `answer` is a non-official
rubric-scored placeholder (`official=false`) — verified in DB.

## 3. Semantic self-review (§1.2)

- `complete_the_words`: an independent adversarial reviewer checked all 30 for unique
  recoverability, target-in-passage, cue strength, and letter traps (e.g. neurons vs neutron,
  irrigation vs irritation, magma vs magna, latitude vs altitude) — **0 defects, all 30 sound**.
- `email_writing` / `academic_discussion`: authored against explicit exclusion lists and validated
  structurally (40/40 each, exactly 5 referencePoints, 2-3 actions / professor+two-students, no
  in-batch duplicates, no scenario on the avoid-list).

| taskType | authored | PASS | REVIEW | REJECT | imported draft | promoted active |
|---|---:|---:|---:|---:|---:|---:|
| complete_the_words | 30 | 30 | 0 | 0 | 30 | 0 |
| email_writing | 40 | 40 | 0 | 0 | 40 | 0 |
| academic_discussion | 40 | 40 | 0 | 0 | 40 | 0 |

Imported manifest is 100% PASS.

## 4. Import flow and DB writes

| step | complete_the_words | email+discussion |
|---|---|---|
| dry-run | parsed_ok 30 · reject 0 | tasks 80 |
| apply #1 | wrote **30** · dup 0 | wrote **80** · dup 0 |
| apply #2 (idempotency) | wrote **0** · dup 30 | wrote **0** · dup 80 |

DB writes: `stimuli` +30 (complete_the_words passages), `question_sets` +110 draft,
`question_items` +110 draft. Productive items carry `input_mode='free_text'`, non-null `rubric_id`
(toefl/writing rubric), and `answer.official=false`. No active changes.

## 5. Verification (scripts/verify-toefl-text-topup.ts)

`--source` (exit 0): CW 30 through `shapeToItems(complete_words)`, target-in-passage exactly once,
mask valid, words 15-55, distinct targets; email/discussion 40/40, prompt non-empty, exactly 5
referencePoints, wordLimit present, discussion has professor+two-students, no in-batch dup.

`--db` (exit 0): source→DB forward 1:1 for all three (30/30, 40/40, 40/40), all draft + correct
stage; whole-bank draft+active totals **100 / 100 / 100**; productive items free_text + rubric_id +
`official=false`; reverse stage sets 110 = expected 110, **orphan 0**; stage active = 0.

## 6. Commands and exit codes

| command | exit |
|---|---:|
| `verify-toefl-text-topup --source` | 0 |
| `import:authored-qsets-v2 --file=…complete-the-words-30.json --stage` (dry-run) | 0 |
| `… --apply` ×2 | 0 (wrote 30 → wrote 0/dup 30) |
| `import:authored-productive-v2 --stage` (dry-run) | 0 |
| `… --apply` ×2 | 0 (wrote 80 → wrote 0/dup 80) |
| `verify-toefl-text-topup --db` | 0 |
| `qa:qsets-v2` | 0 (模板 32 · 错误 0) |
| `validate:qbank-v2` | 0 (active 2364 · 错误 0) |
| `validate:practice-session` | 0 |
| `validate:rubrics` | **1** — see note below (pre-existing IELTS gap, NOT F2B) |
| `validate:toefl-task-alignment` | 0 (errors=0 warnings=0) |
| `lint` | 0 |
| `tsc --noEmit --incremental false` | 0 |

### validate:rubrics note (not an F2B regression, not a hard-stop for F2B)

`validate:rubrics` exits 1 with exactly two errors: `ielts/writing 缺 rubric` and
`ielts/speaking 缺 rubric`. Evidence this is pre-existing and out of F2B scope:
- IELTS productive sections have been in `EXAM_SPECS` since a committed baseline (commit 8bf10e3,
  "IELTS coming_soon"); F2B added **zero** IELTS content.
- `reports/rubrics-validation.json` was already modified in the working tree at session start (the
  2026-07-01/02 checkpoint that scaffolded IELTS specs without seeding IELTS rubrics).
- F2B's own additions are TOEFL **writing** tasks, and `toefl/writing` rubric exists — the DB verify
  confirmed every new email/discussion item has a non-null `rubric_id` and `answer.official=false`.

Per the master plan, IELTS is coming-soon and must not be built without explicit approval (F7), so
seeding IELTS rubrics is deliberately deferred. This failure is therefore recorded, not "fixed", and
`reports/rubrics-validation.json` is left out of the F2B commit (it is the IELTS checkpoint's
artifact, not F2B-owned).

## 7. Active / deprecated counts

- Active sets total: **2364** (unchanged — F2B wrote draft only).
- `antonym_choice` = 0 · `cet_cloze` = 0.

## 8. Optional promote gate

**Not promoted.** Awaiting the explicit user instruction:

> Promote TOEFL text top-up manifest.

On approval, the manifest would target exactly the 110 new PASS sets, active delta
complete_the_words +30 / email_writing +40 / academic_discussion +40, final active 100/100/100.

## 9. TOEFL paperReady

Still **`false`**. Full/mini mock closed.

## 10. Recommendation

Two Reading task types (F1/F2) and three text tasks (F2B) now sit at 100 draft/active each, pending
promote approval. Next per plan is **F3: TOEFL Listening expansion** (choose_a_response +90,
listening_comprehension +90, draft-first with audio pipeline). F3 depends on the audio generator
supporting a stage/filter and on audio credentials; if `generate:audio-assets` lacks `--stage`
support or credentials are unavailable, F3 stops and reports the exact missing capability rather than
faking audio.
