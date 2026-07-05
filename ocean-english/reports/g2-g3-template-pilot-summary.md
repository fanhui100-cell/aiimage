# G2 + G3 — New Template Dry-Runs & Claude-Authored Pilot Draft Summary

Date: 2026-06-21 · Branch: iter5-f1
**Generation provider: Claude-authored JSON, DeepSeek not used.**

## G2 — New Template Dry-Runs (read-only, no writes, no DeepSeek)
All 6 templates dry-run exit 0. `generate:qsets-v2` dry-run validates template + prints plan; it
never calls DeepSeek and never writes.

| Template | taskType | exams | mode | policy | shape |
|---|---|---|---|---|---|
| cet-banked-cloze | banked_cloze | cet4/cet6 | ai | original_only | bank_answers 15/10 |
| gaokao-seven-select | seven_select | gaokao/kaoyan | ai | original_only | bank_answers 7/5 |
| gaokao-grammar-fill | grammar_fill | gaokao | ai | original_only | gblanks 10 |
| kaoyan-reading-b | para_match | kaoyan | ai | original_only | statements_answers |
| sat-rw-domains | reading_comprehension | sat | ai | original_only | single_choice 4 |
| toefl-four-skills | multi_skill | toefl | **manual_seed** | original_only | mixed_by_skill |

- `qa:qsets-v2` exit 0 (template QA + shape fixtures pass; no gen sets yet at that point).
- TOEFL = manual_seed → cannot auto-apply (matches doc requirement). No deprecated types.

## G3 — Pilot Draft (Claude-authored JSON → importer → draft)
Per user override, content is **Claude-authored**, not DeepSeek. New importer
`scripts/import-authored-question-sets-v2.ts` (+ pkg `import:authored-qsets-v2`):
- default dry-run; `--apply` writes **draft only**; reuses `shapeToItems` strict validation
  (bad shape rejected, never written); idempotent by deterministic content hash; `gen:…:claude:`
  legacy ids; `qa_flags.provider=claude-authored`. No DeepSeek, no frontend change.

Authored files under `data/generated-question-sets/g3/` (2 sets each, intentionally small for a
quality-first pilot — full pilot sampling = all sets, per Content Quality Thresholds):
- `gaokao-grammar-fill-lv2.json` — 2 × (10 blanks: tense/voice/non-finite/relative/article/derivation/connector)
- `cet-banked-cloze-lv3.json` — 2 × (~260-word passage, 15-word bank, 10 answers, 5 distractors)
- `gaokao-seven-select-lv2.json` — 2 × (5 gaps, 7 sentence options, 2 distractors)

### Apply + QA (real exit codes)
| Step | Result |
|---|---|
| import dry-run | parsed_ok 6 · reject 0 |
| import --apply | wrote 6 draft · reject 0 |
| qa:qsets-v2 | EXIT 0 · gen draft sets 6 / items 6 / errors 0 |
| validate:qbank-v2 | EXIT 0 · active 0 |
| validate:practice-session | EXIT 0 |
| validate:papers | EXIT 0 |
| idempotency re-apply | wrote 0 · dup-skip 6 |

### DB verification (gen:…:claude: sets)
- banked_cloze ×2: multi_blank, 15 choices / 10 answers, draft.
- grammar_fill ×2: multi_blank, 0 choices / 10 gblank answers, draft.
- seven_select ×2: multi_blank, 7 choices / 5 answers, draft.
- All status draft (set+item), legacy prefix `gen:`, provider=claude-authored.

### Manual content spot-check (all 6, author-attested)
- Passages 100% original (hand-authored, no real-exam copying).
- Answer keys verified unique & correct; distractors plausible; ambiguity points (e.g. banked
  blank 4 "absolutely essential") deliberately disambiguated; passage matches each item.
- Level-appropriate (gaokao lv2, cet4 lv3).

### Counts after G3
banked_cloze 202 / seven_select 202 / grammar_fill 202 draft (migrated 200 + authored 2 each).
Total v2 sets 3740, active 0, deprecated 0.

## Self-review
1. Scope ✓ 2. Status ✓ (all draft) 3. Deprecated ✓ (0/0; importer hard-rejects) 4. QA ✓ (all exit 0)
5. DB ✓ (+6 explainable, idempotent) 6. Content ✓ (original, verified keys) 7. Report ✓

SELF-REVIEW PASS — continuing to G4
