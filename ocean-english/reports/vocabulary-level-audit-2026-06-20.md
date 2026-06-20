# Vocabulary Level Audit — 2026-06-20

> Generated: 2026-06-20T07:42:04.986Z
> Source: dictionary_words + dictionary_* relation tables (read-only, service role).
> **No DB writes were performed.**

Total words in `dictionary_words`: **28602**

## 1. Coverage summary

`levels-incl` = words where the level ∈ `levels` (syllabus coverage; the training denominator). `primary` = words whose `primary_level` equals the level. 覆盖率分母 = `levels-incl`。

| lv | exam | label | target | primary | levels-incl | def | ex | mnem | infl | ety | collo | syn | ant |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | zhongkao | 中考 | ~1900 | 1989 | 1989 | 100% | 100% | 94% | 79% | 89% | 90% | 84% | 64% |
| 2 | gaokao | 高考 | ~3500 | 1924 | 3743 | 100% | 100% | 94% | 80% | 91% | 86% | 83% | 67% |
| 3 | cet4 | CET-4 | ~4500 | 1819 | 4609 | 100% | 99% | 96% | 80% | 93% | 82% | 86% | 73% |
| 4 | cet6 | CET-6 | ~5500 | 2120 | 4243 | 100% | 94% | 96% | 76% | 96% | 69% | 81% | 74% |
| 5 | kaoyan | 考研 | ~5500 | 1086 | 5896 | 100% | 86% | 95% | 73% | 93% | 70% | 75% | 62% |
| 6 | toefl | TOEFL | curated | 8038 | 13632 | 100% | 76% | 94% | 54% | 93% | 45% | 58% | 53% |
| 7 | sat | SAT | curated | 11625 | 14381 | 100% | 31% | 91% | 21% | 85% | 13% | 25% | 26% |

## 2. Per-level recommendations

- **lv1 中考 (zhongkao)** — levels includes 1 覆盖 1989，接近目标约 1900
- **lv2 高考 (gaokao)** — levels includes 2 覆盖 3743 已超目标约 3500，核查是否过宽；primary_level=2 仅 1924，远少于 levels includes 3743：训练务必按 levels includes，不能只看 primary_level
- **lv3 CET-4 (cet4)** — levels includes 3 覆盖 4609，接近目标约 4500；primary_level=3 仅 1819，远少于 levels includes 4609：训练务必按 levels includes，不能只看 primary_level
- **lv4 CET-6 (cet6)** — levels includes 4 覆盖 4243 < 目标约 5500，缺口约 1257，建议合法补标 levels（只增不覆盖）；primary_level=4 仅 2120，远少于 levels includes 4243：训练务必按 levels includes，不能只看 primary_level
- **lv5 考研 (kaoyan)** — levels includes 5 覆盖 5896 已超目标约 5500，核查是否过宽；primary_level=5 仅 1086，远少于 levels includes 5896：训练务必按 levels includes，不能只看 primary_level
- **lv6 TOEFL (toefl)** — 无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量；primary_level=6 仅 8038，远少于 levels includes 13632：训练务必按 levels includes，不能只看 primary_level
- **lv7 SAT (sat)** — 无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量；primary_level=7 仅 11625，远少于 levels includes 14381：训练务必按 levels includes，不能只看 primary_level

## 3. Key findings

- **CET-6 direct coverage gap:** `levels includes 4` = 4243 vs target ~5500. Gap ≈ 1257; backfill `levels` to ~5500.
- **Postgraduate (考研) logic:** `primary_level=5` = 1086 (looks small) but `levels includes 5` = 5896. Training/recommendation must use `levels includes 5`, not `primary_level=5`.
- **`primary_level` vs `levels includes` mismatch:** lv2(1924→3743), lv3(1819→4609), lv4(2120→4243), lv5(1086→5896), lv6(8038→13632), lv7(11625→14381).

### Data integrity

- Invalid level tags (outside 1-7): 0
- Duplicate level tags within a word: 0
- `primary_level` not present in `levels`: 0
- Words with no level at all (primary null & levels empty): 1

## 4. Recommended import/backfill actions

- Backfill `dictionary_words.levels` (add-only) from canonical syllabus lists for any level whose `levels-incl` is below target — priority CET-6.
- Keep `primary_level` as the lowest level; fix words where `primary_level` is not contained in `levels`.
- Backfill missing essential materials (definitions first, then examples/inflections/collocations) for already-tagged words before adding new words.
- Store every target list under `data/vocabulary-targets/` with `source_name/source_url/license_note/exam_id/level/kind` (see that README).
- (follow-up, later backfill phase) Export a `missing_by_field` sample — concrete `word_id`s missing examples / collocations / antonyms etc. — so backfill can target exact words instead of aggregate percentages.

## 5. What must NOT be imported blindly

- Do **not** treat TOEFL/SAT as having a fixed official complete word list — use curated academic / high-utility coverage only.
- Do **not** overwrite existing definitions, examples, mnemonics, synonyms, antonyms, etymology, or collocations — backfill is add-only.
- Do **not** expand a level just to hit a number; respect syllabus boundaries (avoid over-wide `levels`).
- Do **not** auto-generate synonyms/antonyms to fill coverage — missing is better than wrong relations.
- Do **not** import any list without a real `license_note`.
