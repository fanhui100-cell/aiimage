# Exam Task Templates (Phase 11)

Generation/QA templates for the **missing real exam task types**. These are *structure +
policy* definitions — they describe how to produce **100% original** practice items that match
each exam's real task format. They contain **no real exam content**.

## Copyright policy (hard rule)

Every template declares `"copyrightPolicy": "original_only"`. The generator
(`scripts/generate-question-sets-v2.ts`) **refuses to run** any template that does not declare
`original_only`. We never copy, scrape, or store real exam passages/questions; the official
links in `reports/exam-format-vs-question-bank-audit-2026-06-20.md` are used only to mirror the
*structure* (item counts, option counts, domains/subskills), never the text.

## Template schema

| field | meaning |
|---|---|
| `templateId` | unique id (= filename without `.json`) |
| `examIds` | canonical `ExamSpec` ids this template serves (`lib/exam-specs`) |
| `taskType` | primary v2 task type (must not be deprecated); `multi_skill` for TOEFL |
| `skill` | section skill (`reading`/`grammar`/`listening`/`writing`/`speaking`/`integrated`) |
| `generation.mode` | `ai` = generator can produce drafts; `manual_seed` = needs human seeds first (TOEFL Speaking/Writing, audio) |
| `generation.promptHintZh` | the original-content prompt shape (no real-exam text) |
| `stimulusRequirements` | `kind`, word bounds, topic domains, per-stimulus item count |
| `itemCount` | scored blanks/items per set |
| `optionCount` | options per item / bank size (15 banked, 7 seven-select, 4 MCQ, 0 free-fill) |
| `answerSchema` | answer shape (`gblanks` / `bank_answers` / `statements_answers` / `single_choice` / `mixed_by_skill`) |
| `subskills` | tested subskills (drives v2 `subskills` + diagnostics) |
| `qualityRules` | per-type QA rules enforced by `scripts/qa-question-sets-v2.ts` |
| `copyrightPolicy` | must be `original_only` |

## Pipeline

1. **Dry run (default):** `npm run generate:qsets-v2 -- --template=cet-banked-cloze --count=3 --level=3`
   — validates the template, prints a generation plan, **writes nothing**.
2. **Apply (gated):** `--apply` writes **draft** v2 sets only, and only when v2 schema is applied
   and `DEEPSEEK_API_KEY` is set and `generation.mode === 'ai'`. Drafts are **never active**;
   activation requires QA + an explicitly approved batch (a later phase).
3. **QA:** `npm run qa:qsets-v2` validates the templates (always) and any generated draft sets
   (when v2 is applied).

## Templates

| file | exam | task | structure |
|---|---|---|---|
| `gaokao-grammar-fill.json` | gaokao | `grammar_fill` | 10 free-fill blanks (form + function words) |
| `gaokao-seven-select.json` | gaokao, kaoyan | `seven_select` | 7 options → 5 blanks |
| `cet-banked-cloze.json` | cet4, cet6 | `banked_cloze` | 15-word bank → 10 blanks |
| `kaoyan-reading-b.json` | kaoyan | `para_match` (+seven_select variant) | 5 statements → paragraphs; **no listening/speaking** |
| `toefl-four-skills.json` | toefl | `multi_skill` | covers Reading/Listening/Writing/Speaking; speaking + audio = manual seed |
| `sat-rw-domains.json` | sat | `reading_comprehension` | **short** 25–150-word single items across 4 RW domains |
