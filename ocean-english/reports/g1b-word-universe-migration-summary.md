# G1B — Word-Universe v1 → v2 Draft Migration Summary

Date: 2026-06-21
Branch: iter5-f1
Scope: controlled content production, batch **G1B**. Migrate the remaining 12 word-universe /
vocabulary-drill task types from v1 `question_bank` into v2 as **draft** (`--limit=200` each,
single-type commands). No new generation, no `active`, no source/schema/frontend changes.

Follows **G1** (`en_to_zh`, 200 draft, Codex-approved).

## Preflight (read-only, confirmed clean)

- `validate:qbank-v2` = 0 (applied), `qa:qbank-v2-migration` = 0, `validate:practice-session` = 0.
- `en_to_zh` v2 draft sets = 200; all migrated active sets = 0; `antonym_choice`/`cet_cloze` v2 = 0.

## Migration result

Each type: `migrate:qbank-v2 --types=<TYPE> --limit=200 --status=draft` (dry-run) → `--apply`.
Every type: **v1 rows 200 → 200 sets / 200 items, 0 rejected, 0 deprecated.**

| # | Task type | sets | items | target_words | input_mode | status |
|---|---|---:|---:|---:|---|---|
| — | en_to_zh (G1) | 200 | 200 | 200 | choice | draft |
| 1 | zh_to_en | 200 | 200 | 200 | choice | draft |
| 2 | def_to_word | 200 | 200 | 200 | choice | draft |
| 3 | cloze_choice | 200 | 200 | 200 | choice | draft |
| 4 | cloze_spell | 200 | 200 | 200 | spell | draft |
| 5 | zh_to_word_spell | 200 | 200 | 200 | spell | draft |
| 6 | word_form | 200 | 200 | 200 | spell | draft |
| 7 | listen_to_meaning | 200 | 200 | 200 | listen (choice) | draft |
| 8 | dictation_spell | 200 | 200 | 200 | listen (spell) | draft |
| 9 | synonym_choice | 200 | 200 | 200 | choice | draft |
| 10 | synonym_substitute | 200 | 200 | 200 | choice | draft |
| 11 | collocation_choice | 200 | 200 | 200 | choice | draft |
| 12 | confusable_choice | 200 | 200 | 200 | choice | draft |

**Total migrated v2 (incl. G1): 2600 sets / 2600 items / 2600 target_words, all `draft`, `active` = 0.**

## Post-migration QA / validators

| Command | Result |
|---|---|
| `qa:qbank-v2-migration` | ✅ 0 — migrated 2600 sets / 2600 items, 0 errors |
| `validate:qbank-v2` | ✅ 0 — active sets 0 / active items 0 |
| `validate:practice-session` | ✅ 0 (first run hit a transient exit 1 under migration-write load; clean on re-run) |
| `validate:papers` | ✅ 0 |

## DB spot-check (3 samples per type)

- All sampled sets and items are `draft`; `active` = 0 for every type.
- Choice types: `answer` ∈ `choices` (4 options). e.g. `en_to_zh-abandon` lv2 `ans="d"` ch=4.
- Spell types: `answer` is a valid `answerText` word form. e.g. `word_form-abandon` → `abandons`,
  `word_form-abandonment` → `abandonments`.
- Listen types: `listen_to_meaning` = listen + 4 choices (answer is a choice id); `dictation_spell`
  = listen + spelled answer.
- Every sampled item has ≥1 `question_target_words` row (role `tested_answer`).
- Aggregate over samples: **badAnswer = 0, noTargetWord = 0.**

## Idempotency

Re-applied (legacy_id unique): `cloze_choice`, `word_form`, `synonym_choice`, `confusable_choice`
→ each **wrote 0, dup-skip 200**. No duplicate writes.

## Confirmations

- migrated `active` sets = **0** (draft only).
- `antonym_choice` / `cet_cloze` in v2 = **0** (deprecated never migrated).
- No source code, schema, frontend, or DeepSeek-route changes. No new content generated.

## Notes

- Background loop logging occasionally dropped a `v1 rows` summary line (npm-wrapper output
  buffering); each was re-run directly to confirm the underlying data — no data discrepancy.
- `--limit=200` without `--types` only hits the leading `antonym_choice` id-segment (0 migrated);
  all G1B runs used `--types=<TYPE>` (carried over from the G1 finding).

## Next step (not auto-continued)

Awaiting Codex review of these 2400 drafts. Then either **G1C** (exam-objective migration:
reading / listening / banked_cloze / seven_select / para_match / cloze_passage / grammar_fill →
draft; listening stays non-active without audio per Phase 9; grouped types need stimulus / answer-key
spot-checks) or **G2** (new-question template dry-runs). No activation; no audio activation.
