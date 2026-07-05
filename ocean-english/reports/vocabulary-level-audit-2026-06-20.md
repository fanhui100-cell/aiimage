# Vocabulary Level Audit — 2026-06-20

> Generated: 2026-07-03T17:57:15.304Z
> Source: dictionary_words + dictionary_* relation tables (read-only, service role).
> **No DB writes were performed.**

Total words in `dictionary_words`: **28602**

## 1. Coverage summary

`levels-incl` = words where the level ∈ `levels` (syllabus coverage; the training denominator). `primary` = words whose `primary_level` equals the level. 覆盖率分母 = `levels-incl`。

| lv | exam | label | target | primary | levels-incl | def | ex | mnem | infl | ety | collo | syn | ant |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | zhongkao | 中考 | ~1900 | 3312 | 3312 | 100% | 77% | 93% | 58% | 91% | 65% | 64% | 52% |
| 2 | gaokao | 高考 | ~3500 | 2572 | 5696 | 100% | 78% | 93% | 59% | 92% | 63% | 64% | 54% |
| 3 | cet4 | CET-4 | ~4500 | 2533 | 7427 | 100% | 77% | 94% | 59% | 94% | 61% | 65% | 58% |
| 4 | cet6 | CET-6 | ~5500 | 2330 | 8531 | 100% | 77% | 94% | 60% | 95% | 57% | 65% | 59% |
| 5 | kaoyan | 考研 | ~5500 | 884 | 8719 | 100% | 72% | 94% | 58% | 94% | 56% | 62% | 54% |
| 6 | toefl | TOEFL | curated | 7570 | 16742 | 100% | 69% | 94% | 49% | 93% | 40% | 53% | 50% |
| 7 | sat | SAT | curated | 9401 | 15322 | 100% | 32% | 91% | 21% | 86% | 14% | 26% | 28% |
| 8 | ielts | 雅思 | curated | 0 | 6759 | 100% | 76% | 94% | 60% | 96% | 56% | 65% | 59% |

## 2. Per-level recommendations

- **lv1 中考 (zhongkao)** — levels includes 1 覆盖 3312 已超目标约 1900，核查是否过宽
- **lv2 高考 (gaokao)** — levels includes 2 覆盖 5696 已超目标约 3500，核查是否过宽；primary_level=2 仅 2572，远少于 levels includes 5696：训练务必按 levels includes，不能只看 primary_level
- **lv3 CET-4 (cet4)** — levels includes 3 覆盖 7427 已超目标约 4500，核查是否过宽；primary_level=3 仅 2533，远少于 levels includes 7427：训练务必按 levels includes，不能只看 primary_level
- **lv4 CET-6 (cet6)** — levels includes 4 覆盖 8531 已超目标约 5500，核查是否过宽；primary_level=4 仅 2330，远少于 levels includes 8531：训练务必按 levels includes，不能只看 primary_level
- **lv5 考研 (kaoyan)** — levels includes 5 覆盖 8719 已超目标约 5500，核查是否过宽；primary_level=5 仅 884，远少于 levels includes 8719：训练务必按 levels includes，不能只看 primary_level
- **lv6 TOEFL (toefl)** — 无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量；primary_level=6 仅 7570，远少于 levels includes 16742：训练务必按 levels includes，不能只看 primary_level
- **lv7 SAT (sat)** — 无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量；primary_level=7 仅 9401，远少于 levels includes 15322：训练务必按 levels includes，不能只看 primary_level
- **lv8 雅思 (ielts)** — 无固定官方完整词表，按 curated 高频/学术词覆盖评估，勿按大词表盲目扩量；primary_level=8 仅 0，远少于 levels includes 6759：训练务必按 levels includes，不能只看 primary_level

## 3. Key findings

- **CET-6 direct coverage gap:** `levels includes 4` = 8531 vs target ~5500. Within range.
- **Postgraduate (考研) logic:** `primary_level=5` = 884 (looks small) but `levels includes 5` = 8719. Training/recommendation must use `levels includes 5`, not `primary_level=5`.
- **`primary_level` vs `levels includes` mismatch:** lv2(2572→5696), lv3(2533→7427), lv4(2330→8531), lv5(884→8719), lv6(7570→16742), lv7(9401→15322), lv8(0→6759).

### Data integrity

- Invalid level tags (outside 1-8): 0
- Duplicate level tags within a word: 0
- `primary_level` not present in `levels`: 0
- Words with no level at all (primary null & levels empty): 0

## 4. Recommended import/backfill actions

- Backfill `dictionary_words.levels` (add-only) from canonical syllabus lists for any level whose `levels-incl` is below target — priority CET-6.
- Keep `primary_level` as the lowest level; fix words where `primary_level` is not contained in `levels`.
- Backfill missing essential materials (definitions first, then examples/inflections/collocations) for already-tagged words before adding new words.
- Store every target list under `data/vocabulary-targets/` with `source_name/source_url/license_note/exam_id/level/kind` (see that README).
- (follow-up, later backfill phase) Export a `missing_by_field` sample — concrete `word_id`s missing examples / collocations / antonyms etc. — so backfill can target exact words instead of aggregate percentages.

## 5. What must NOT be imported blindly

- Do **not** treat TOEFL/SAT/IELTS as having a fixed official complete word list — use curated academic / high-utility coverage only.
- Do **not** overwrite existing definitions, examples, mnemonics, synonyms, antonyms, etymology, or collocations — backfill is add-only.
- Do **not** expand a level just to hit a number; respect syllabus boundaries (avoid over-wide `levels`).
- Do **not** auto-generate synonyms/antonyms to fill coverage — missing is better than wrong relations.
- Do **not** import any list without a real `license_note`.
