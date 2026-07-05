# G4 + G5 — Exam-Objective & Productive Draft Pools Summary

Date: 2026-06-21 · Branch: iter5-f1
**Generation provider: Claude-authored JSON, DeepSeek not used.**

## G4 — Expand Exam-Objective Draft Pools
Strategy: G1C migration already provides bulk draft coverage for most exam-objective pools
(banked_cloze 202 / seven_select 202 / para_match 200 / cloze_passage 200 / grammar_fill 202;
reading 67 / listening 67). The importer-ready **gap** was SAT (no v1 data), so this pass authored
a SAT domain seed.

### SAT seed (Claude-authored, `data/generated-question-sets/g4/sat-rw-domains-lv7.json`)
- 8 draft reading_comprehension sets, lv7, 2 per domain, evenly distributed:
  Information and Ideas 2 · Craft and Structure 2 · Expression of Ideas 2 · Standard English Conventions 2.
- domain stored in `qa_flags.domain` + `topic_tags` (per doc SAT requirement).
- Importer enhanced to carry an optional per-set `domain`.
- Apply: wrote 8 · reject 0. qa:qsets-v2 / validate:qbank-v2 / validate:papers EXIT 0. All draft.

### G4 recorded gaps (ledger)
- `G4-toefl-special` (major): complete_the_words / read_daily_life / choose_a_response have no
  template+shape support → need new templates+validators (not fabricated). Skipped type.
- `G4-reading-multilevel` (major): multi-level reading_comprehension thin outside cet4; multi-question
  reading needs a multi-item authored shape. Ongoing.

## G5 — Productive Task Draft Pools
New importer `scripts/import-authored-productive-tasks-v2.ts` (+ pkg `import:authored-productive-v2`):
- default dry-run; `--apply` draft only; taskType must be productive; requires a seeded rubric for
  (examId, skill) else skips (`rubric_missing`); links `question_items.rubric_id`; stores a
  **non-official reference placeholder** answer (NOT a single official answer); idempotent; no DeepSeek.

### Authored prompts (`data/generated-question-sets/g5/*.productive.json`)
| examId | taskType | skill | count |
|---|---|---|---:|
| zhongkao | applied_writing | writing | 2 |
| gaokao | continuation_writing | writing | 1 |
| cet4 | essay_writing | writing | 1 |
| cet4 | translation_zh_en | translation | 1 |
| kaoyan | translation_en_zh | translation | 1 |

- Apply: wrote 6 draft · skipped 0. All 6 items rubric-linked; answer = reference placeholder
  (`official:false`, score is an estimate). validate:qbank-v2 / practice-session / papers / rubrics
  EXIT 0. Idempotent re-apply dup 6. All draft.
- Translation tasks carry a `sourceTextZh`/`sourceTextEn` stimulus + referencePoints; **no** fixed
  "official translation" is written.

### G5 recorded gap (ledger)
- `G5-toefl-productive` (minor): TOEFL writing (build_a_sentence/email_writing/academic_discussion)
  deferred; TOEFL speaking (listen_and_repeat/interview_speaking) blocked by audio (G6). Importer
  supports them; ongoing.

## Self-review
1. Scope ✓ (draft authoring + importers only; no frontend/DeepSeek/active). 2. Status ✓ (all draft).
3. Deprecated ✓ (0/0). 4. QA ✓ (validators EXIT 0). 5. DB ✓ (writes explainable, idempotent).
6. Content ✓ (original prompts/passages; objective keys verified; productive = no official answer).
7. Report ✓ (this file + ledger). Gaps honestly recorded, not fabricated.

SELF-REVIEW SKIP-FORWARD — TOEFL special/productive + multi-level reading recorded as open; continuing to G6
