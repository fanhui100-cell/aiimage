# R10 Active-Promotion Candidate Manifest (2026-06-23)

> **Apply gate (master-plan R10):** promotion to `active` requires a SEPARATE explicit user instruction naming each exam / level / task / max row count. This doc is the **candidate menu + recommended order**; nothing here is promoted. Active count is currently **0**.

Promotion runs through the R9 RPC `promote_question_sets_v2` (atomic, per-set invariant-checked). Dry-run proven: `cet4 reading_comprehension` → 20 candidates / 20 eligible / 0 rejected.

## READY_DRAFT cells (34) — by exam
| exam | cells (taskType:draftCount) |
|---|---|
| zhongkao | grammar_fill:50 · cloze_passage:142 · reading_comprehension:50 · applied_writing:50 |
| gaokao | reading_comprehension:50 · seven_select:50 · cloze_passage:50 · grammar_fill:200 · applied_writing:50 · continuation_writing:50 |
| cet4 | essay_writing:50 · banked_cloze:166 · para_match:143 · reading_comprehension:67 · translation_zh_en:55 |
| cet6 | essay_writing:50 · banked_cloze:50 · para_match:57 · reading_comprehension:50 · translation_zh_en:51 |
| kaoyan | cloze_passage:58 · reading_comprehension:50 · seven_select:181 · para_match:50 · translation_en_zh:50 · applied_writing:50 · essay_writing:50 |
| toefl | complete_the_words:70 · email_writing:60 · academic_discussion:60 |
| sat | reading_comprehension × 4 domains (Information and Ideas / Craft and Structure / Expression of Ideas / Standard English Conventions):50 each |

## Recommended promotion order (by renderer/scoring readiness)

**Batch 1 — SAFE NOW (choice-based, deterministic scoring, no audio/rubric/grouped-body dependency):**
- `reading_comprehension` (all 7 exams; SAT split per 4 domains) — renders with existing `ChoiceRenderer` + passage stimulus; scored exact-match server-side. **cet4 reading_comprehension dry-run: 20/20 eligible.** Recommended first authorized batch: one exam, ≤20–50 sets.

**Batch 2 — spell objective:**
- `complete_the_words` (toefl, 70) — `SpellRenderer`, deterministic.

**Batch 3 — GROUPED (needs R3 session body-assembly first; R10-coupled):**
- `banked_cloze` / `cloze_passage` / `grammar_fill` / `seven_select` / `para_match` — the R3 MultiBlank/Matching renderers exist but the **session route doesn't yet assemble clozeBody/matchBody/buildBody** (deferred to R10 where it's testable with active data). Promote together with that wiring, per cell.

**Batch 4 — PRODUCTIVE (needs rubric coverage + free-text UI, R3 done):**
- `essay_writing` / `applied_writing` / `continuation_writing` / `translation_*` / `email_writing` / `academic_discussion` — FreeTextRenderer ready; confirm each set's rubric_id + resolve the answer-key-leak architecture for exam content before active.

**Batch 5 — LISTENING (needs audio active + read-side):**
- `cet4 listening_comprehension` (67) — content 100% semantic-reviewed (1 fixed); audio synthesized (5 active + 62 machine_checked). Before promote: (a) human-listen the 62 → activate; (b) apply p7 (transcript lockout); (c) the session listening-review transcript delivery.
- Other listening cells (zhongkao/gaokao/cet6) — **MISSING content**, need R7 authoring first.

## Invariants (all enforced by the RPC, re-validated this session)
draft-only · not deprecated · not scoring_not_ready/official_spec_unverified · items draft + answer valid · grouped⇒stimulus · choice⇒answer∈choices · multi_blank/matching⇒non-empty array · productive⇒rubric · listening⇒active audio · atomic + idempotent.

## To authorize a batch
Tell Claude Code, e.g.: **"R10: promote cet4 / lv3 / reading_comprehension, max 20"** → a per-set manifest is generated for review → promoted via the RPC → active delta verified.
