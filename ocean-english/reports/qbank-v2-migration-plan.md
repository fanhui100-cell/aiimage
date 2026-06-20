# v1 → v2 Question Bank Migration Plan (Phase 8)

Date: 2026-06-20
Status: pipeline authored; **no `--apply` run** (default dry-run). v2 schema is currently
`not_applied`, so the runnable output is a *projection* of what would be migrated.

## 1. Goal & safety contract

Copy usable v1 `question_bank` rows into the v2 model (`stimuli`, `audio_assets`,
`question_sets`, `question_items`, `question_target_words`) **without deleting or mutating
v1**. Everything lands as `draft` unless an explicit, QA-passing `--status` is requested.

Hard guarantees enforced by `scripts/migrate-question-bank-v1-to-v2.ts`:

- **Dry run by default.** Writes happen only with `--apply`.
- **v1 untouched.** The script only `SELECT`s from `question_bank`.
- **Schema gate.** If the v2 write-target tables are missing: dry-run reports `not_applied`
  and exits 0; `--apply` is refused with a clear error and exit 1. Partial schema (some tables
  present) also refuses `--apply`.
- **Default `draft`.** `--status` ∈ `{draft, reviewed, active}` (anything else → exit 1).
- **`active` is fully gated (same invariants as the QA script).** Before a set is written as
  `active`, `activeInvariantFailures()` runs the **same active rules** as
  `scripts/qa-question-bank-v2-migration.ts`: not audio-dependent without stable audio; v1 source
  row was `active && is_reviewed`; not a deprecated type; grouped (`group_mode=set`) sets have a
  stimulus; every item's choice/answer shape is valid; the set→item `legacy_id` traceability chain
  is intact; and every referenced target `word_id` exists in `dictionary_words` (pre-checked
  against a loaded id set). **Any** failure → the set is **downgraded to `draft`** with all failing
  reasons recorded — QA is run *before* the write, not discovered after it.
- **Deprecated types are report-only.** `antonym_choice` / `cet_cloze` are counted and skipped,
  never migrated (and never active).
- **Idempotent & recoverable.** `legacy_id` is **`UNIQUE`** on `stimuli` / `question_sets` /
  `question_items` (see the schema), and `writeSet` writes every layer with
  `upsert(onConflict='legacy_id')`. A re-run after a partial/aborted apply (e.g. crash between the
  stimulus insert and the set insert) reuses each row by `legacy_id` instead of duplicating —
  orphan stimuli are re-used, half-written sets are completed. `question_target_words` (no natural
  key) is made idempotent by delete-by-item then insert. A set is only *skipped* when its set **and
  all** its item `legacy_id`s already exist (full migration); otherwise the recoverable upsert path
  runs.
- **No real exam content.** Only existing LexiOcean-original rows are relocated as-is.

## 2. v1 → v2 type mapping

| v1 type | v2 task_type | group_mode | input_mode | answer shape |
|---|---|---|---|---|
| `en_to_zh` | `en_to_zh` | single | choice | choice id |
| `zh_to_en` | `zh_to_en` | single | choice | choice id |
| `def_to_word` (+ aliases `definition_to_word`, `zh_definition_to_word`) | `def_to_word` | single | choice | choice id |
| `synonym_choice` | `synonym_choice` | single | choice | choice id |
| `synonym_substitute` | `synonym_substitute` | single | choice | choice id |
| `confusable_choice` | `confusable_choice` | single | choice | choice id |
| `collocation_choice` | `collocation_choice` | single | choice | choice id |
| `cloze_choice` | `cloze_choice` | single | choice | choice id |
| `zh_to_word_spell` | `zh_to_word_spell` | single | spell | answer text |
| `cloze_spell` | `cloze_spell` | single | spell | answer text |
| `word_form` | `word_form` | single | spell | answer text |
| `listen_to_meaning` | `listen_to_meaning` | single | listen | choice id · **needs audio → draft** |
| `listen_to_word` | `listen_to_word` | single | listen | choice id · **needs audio → draft** |
| `dictation_spell` | `dictation_spell` | single | listen | answer text · **needs audio → draft** |
| `reading_comprehension` | `reading_comprehension` | **set** (by passage) | choice | choice id |
| `listening_comprehension` | `listening_comprehension` | **set** (by passage) | listen | choice id · **needs audio → draft** |
| `banked_cloze` | `banked_cloze` | set | multi_blank | `number[]` indices into bank (`hint.bank`/`answers`) |
| `seven_select` | `seven_select` | set | multi_blank | `number[]` indices into bank (`hint.bank`/`answers`) |
| `cloze_passage` | `cloze_passage` | set | multi_blank | `{options,answer}[]` per blank (`hint.blanks`, lossless) |
| `grammar_fill` | `grammar_fill` | set | multi_blank | `string[]` free-fill answers (`hint.gblanks[].answer`) |
| `para_match` | `para_match` | set | matching | `number[]` statement→paragraph (`hint.statements`/`answers`) |

> **Heterogeneous set encodings.** The five passage/set types do **not** share one v1 `hint`
> shape — `banked_cloze`/`seven_select` use `{bank,answers}`, `para_match` uses
> `{statements,answers}`, `grammar_fill` uses `{gblanks:[{answer}]}`, `cloze_passage` uses
> `{blanks:[{options,answer}]}`. `buildSetAnswer()` extracts each shape faithfully into the v2
> item's `choices` + `answer` (jsonb), losing no data; a v2 multi-blank renderer normalization is
> a later runtime concern. A row whose hint is empty/malformed is **rejected** (`set_hint_missing`
> / `set_answer_missing`), never migrated as a broken set.
| `antonym_choice` | — | — | — | **deprecated, report only** |
| `cet_cloze` | — | — | — | **deprecated, report only** |

### Grouping rules

- **Word-universe single types** → one `question_set` (`group_mode=single`) + one
  `question_item`; `question_target_words` row when the v1 row has a `word_id`.
- **`reading_comprehension` / `listening_comprehension`** → multiple v1 rows that share a
  passage (`normalized_word` = passage id, `audio_ref` = passage text) collapse into **one
  set** with a `stimulus` (`kind=passage|lecture`) and one item per question — so grouped
  items share a single stimulus.
- **Single-row whole-set types** (`banked_cloze`, `seven_select`, `cloze_passage`,
  `grammar_fill`, `para_match`) → each v1 row already encodes a full passage task
  (`audio_ref` = passage with blanks, `hint = { bank, answers }`); it becomes one set + one
  `multi_blank`/`matching` item, with the bank stored as `choices` and `hint.answers` as the
  answer array.

### legacy_id scheme (traceability + idempotency)

- single set: `qb:set:<rowId>`; its item: `qb:<rowId>`.
- passage group set: `qbgrp:<taskType>:<passageKey>`; each item: `qb:<rowId>`;
  stimulus: `qbpsg:<taskType>:<passageKey>` (or `qbpsg:<rowId>` for single-row sets).

## 3. Audio / listening handling

v1 has **no stable audio URLs** — `audio_ref` holds either passage text (rendered on screen)
or a word slug (spoken via client TTS). Therefore the migration creates **no `audio_assets`**.
Any listening-dependent set (`listening_comprehension`, `listen_to_meaning`, `listen_to_word`,
`dictation_spell`) is marked `needsAudio` and **cannot become `active`** — if `--status=active`
is requested it is downgraded to `draft` with reason `no_stable_audio`. This satisfies the
invariant "listening active rows must have audio, or stay draft."

## 4. Exam / section linkage deferred

`question_sets.exam_id` / `section_id` / `task_template_id` are left `null`. v1 `exam_tags` are
near-empty and `exam_specs` is not yet seeded into the DB, so binding now would risk FK
violations. Level is preserved from `theme_tags` (`lvN`); exam/section binding is a later phase
(after `exam_specs` is seeded).

## 5. QA gate (`scripts/qa-question-bank-v2-migration.ts`)

Independently re-reads migrated v2 rows (those with a `qb…` `legacy_id`) and asserts:

1. `choice` items have ≥2 choices and an `answer` that matches a choice id.
2. `spell/free_text/speak/listen` answers are non-empty; `multi_blank/matching` answers are
   non-empty arrays.
3. `active` grouped sets have a `stimulus_id`.
4. Every referenced `question_target_words.word_id` exists in `dictionary_words`.
5. No `active` set is a deprecated type.
6. Every `active` listening set has an `active` audio asset (else it must remain draft).
7. Migrated items keep their `legacy_id` and their parent set keeps its `legacy_id`
   (traceability chain intact).

## 6. Reports

- `reports/qbank-v2-migration-report.json` / `.md` — generated each run: counts by old v1 type,
  counts by new v2 task_type, status counts (draft/reviewed/active/rejected), rejection reasons,
  active→draft downgrade reasons, deprecated skips, sample sets, whether `--apply` ran, and the
  v2 schema state (`applied` / `not_applied` / `partial_applied`).
- `reports/qbank-v2-migration-qa.json` — generated by the QA script.

## 7. Risks before any real `--apply`

- **Schema must be applied first.** `supabase/sql/p4-question-bank-v2.sql` has never been run on
  the live DB. `--apply` is refused until it is.
- **Answer-key quality inherited.** `banked_cloze` / `seven_select` have known systemic
  answer-key issues (see `reports/passage-answer-key-repair-summary.md`). Migration relocates
  them structurally; it does not re-verify semantics. Migrating them as `active` only carries the
  already-served, repaired pool — but a fresh semantic audit is advisable before publishing.
- **No audio corpus yet.** All listening stays `draft` until a real audio pipeline exists.
- **Large apply.** First real run should use a small `--limit` and `--status=draft`, verify with
  the QA script + `validate:qbank-v2`, and only then consider `--status=active` on vetted types.
- **Exam/section linkage** is intentionally absent and must be backfilled later.
