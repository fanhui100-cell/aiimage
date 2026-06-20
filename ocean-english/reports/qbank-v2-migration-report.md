# v1 → v2 Question Bank Migration Report

Generated: 2026-06-20T14:45:35.740Z

- Mode: **DRY RUN (no writes)**
- Requested target status: `draft`
- v2 schema: **not_applied**
- v1 rows scanned: 170244
- Sets planned: 156733 · items planned: 169609

> v2 表尚未应用：以上为「投影计划」，未写任何数据。应用 schema 后再用 --apply 实际迁移。

## Status counts

| Status | Count |
| --- | ---: |
| active | 0 |
| reviewed | 0 |
| draft | 156733 |
| rejected | 0 |

## Counts by old v1 type

| v1 type | Rows |
| --- | ---: |
| en_to_zh | 14611 |
| dictation_spell | 14581 |
| listen_to_meaning | 14581 |
| zh_to_word_spell | 14581 |
| def_to_word | 14567 |
| zh_to_en | 14567 |
| cloze_choice | 14126 |
| cloze_spell | 14100 |
| reading_comprehension | 13401 |
| synonym_choice | 10913 |
| word_form | 10044 |
| synonym_substitute | 9072 |
| listening_comprehension | 5923 |
| confusable_choice | 2346 |
| seven_select | 544 |
| para_match | 437 |
| cloze_passage | 341 |
| cet_cloze | 334 |
| collocation_choice | 330 |
| banked_cloze | 325 |
| antonym_choice | 301 |
| grammar_fill | 219 |

## Counts by new v2 task_type (sets)

| v2 task_type | Sets |
| --- | ---: |
| en_to_zh | 14611 |
| dictation_spell | 14581 |
| listen_to_meaning | 14581 |
| zh_to_word_spell | 14581 |
| def_to_word | 14567 |
| zh_to_en | 14567 |
| cloze_choice | 14126 |
| cloze_spell | 14100 |
| synonym_choice | 10913 |
| word_form | 10044 |
| synonym_substitute | 9072 |
| reading_comprehension | 4471 |
| confusable_choice | 2346 |
| listening_comprehension | 1977 |
| seven_select | 544 |
| para_match | 437 |
| cloze_passage | 341 |
| collocation_choice | 330 |
| banked_cloze | 325 |
| grammar_fill | 219 |

## Rejection reasons

None.

## Active → draft downgrades

None (or status != active).

## Deprecated (report only, never migrated)

- `antonym_choice`: 301 (skipped)
- `cet_cloze`: 334 (skipped)

## Sample migrated sets

| set legacy_id | old type | v2 task_type | group | status | items |
| --- | --- | --- | --- | --- | ---: |
| qb:set:banked_cloze-bp-cet4-10asoyz | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-10mjsqu | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-10qooc6 | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-10thho6 | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-10y7zxv | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-110rpdd | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-115fefh | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-116vnxg | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-12hxn3l | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-13g7yuu | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-147m7t2 | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14d35ui | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14jb9nt | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14pqnks | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14qnu4n | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14t18fy | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-14tcv0n | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-150nbrb | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-15a4c4q | banked_cloze | banked_cloze | set | draft | 1 |
| qb:set:banked_cloze-bp-cet4-15h4r3n | banked_cloze | banked_cloze | set | draft | 1 |
