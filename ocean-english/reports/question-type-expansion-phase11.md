# Question-Type Expansion Pipelines — Phase 11 Report

Date: 2026-06-20
Phase: 11 — generation templates + QA for missing real exam task types; deprecated-generator cleanup
Branch: iter5-f1
Frontend: **none**.

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `data/exam-task-templates/README.md` | created | Template schema + pipeline + copyright policy |
| `data/exam-task-templates/gaokao-grammar-fill.json` | created | gaokao `grammar_fill` (10 free-fill blanks) |
| `data/exam-task-templates/gaokao-seven-select.json` | created | gaokao/kaoyan `seven_select` (7→5) |
| `data/exam-task-templates/cet-banked-cloze.json` | created | cet4/cet6 `banked_cloze` (15→10) |
| `data/exam-task-templates/kaoyan-reading-b.json` | created | kaoyan `para_match` Part B (no listening/speaking) |
| `data/exam-task-templates/toefl-four-skills.json` | created | TOEFL four-skill coverage (speaking/audio = manual seed) |
| `data/exam-task-templates/sat-rw-domains.json` | created | SAT short RW single items, 4 domains |
| `scripts/generate-question-sets-v2.ts` | created | Dry-run-default generator; `--template/--count/--level/--apply`; draft-only; gated |
| `scripts/qa-question-sets-v2.ts` | created | Shape fixtures + template QA (always) + draft data QA (when v2 applied) |
| `lib/exam-task-templates/shape.ts` | created | **Shared, pure, strict** generated-result → v2-item mapping/validation (generator + QA both use) |
| `scripts/run-gen-vocab-ai.sh` | modified | Collocation-only label; dropped default `--active` (no auto-active) |
| `reports/question-type-expansion-phase11.md` | created | This report |
| `package.json` | modified | Added `generate:qsets-v2` + `qa:qsets-v2` |
| `scripts/gen-exam-questions.ts` | modified | **Stops emitting `cet_cloze`** → emits `cloze_choice` |
| `scripts/gen-questions.ts` | modified | **Removed `antonym_choice`** generation (+ orphaned `antsOf`) |
| `scripts/gen-vocab-ai.ts` | modified | **Removed `antonym_choice`** (type/prompt/write) — even with `--active` |
| `scripts/run-gen-q.sh` | modified | No longer advertises `antonym_choice` |

## 2. Was any generation applied?

**No.** `generate:qsets-v2` is **dry-run by default** and writes **draft only** on `--apply`.
`--apply` is hard-gated and **refused** here: it requires v2 schema applied + `DEEPSEEK_API_KEY`
+ `generation.mode === 'ai'`. Verified:
- `--apply toefl-four-skills` → refused (`manual_seed`), exit 1.
- `--apply cet-banked-cloze` → refused (v2 `stimuli` not applied), exit 1.
- Drafts, when ever written, carry `status='draft'` + `qa_status='draft'` and `legacy_id` prefix
  `gen:<template>:…` — **never active**.

## 3. Deprecated generator cleanup

| Script | Before | After |
|---|---|---|
| `gen-exam-questions.ts` | emitted `type: 'cet_cloze'` | emits `type: 'cloze_choice'` (non-deprecated twin) |
| `gen-questions.ts` | pushed `antonym_choice` rows | block removed; `antsOf` helper removed |
| `gen-vocab-ai.ts` | wrote `antonym_choice` (incl `--active`) | antonym path removed; only `collocation_choice` |
| `run-gen-q.sh` | echo "adds antonym_choice…" | echo updated; antonym retired |

Grep confirms **no remaining deprecated emissions** (only retirement comments):
`type: 'cet_cloze'` / `base(w,'antonym_choice')` / `type: 'antonym_choice'` → none.

**Wrapper cleanup (Codex P2):** `run-gen-vocab-ai.sh` no longer says "antonym + collocation" (now
"collocation only · draft") and **dropped its default `--active`** — the old v1 wrapper now writes
draft by default; activation requires a deliberate, post-review `--active` re-run.

## 4. QA results

`npm run qa:qsets-v2` → **exit 0**, 6 templates, **0 errors** (`not_applied`; data QA skipped — no v2).
Template QA enforced (and passing):
- `copyrightPolicy === 'original_only'` and non-deprecated `taskType` for all 6.
- `banked_cloze` = 15 options / 10 blanks; `seven_select` = 7 options / 5 blanks; `grammar_fill` =
  `gblanks` with `blanks === itemCount`, `optionCount === 0`.
- **SAT** templates are **short RW single items** (`maxWords ≤ 200`, `perStimulusItems === 1`, 4
  domains) — not long generic reading passages.
- **kaoyan** templates have **no listening/speaking** (skill/taskType/skills checked).
- **TOEFL** template **covers all four skills** (reading/listening/writing/speaking).

When v2 is applied + drafts generated, data QA additionally checks: choices/answer uniqueness,
answer-in-choices, multi_blank/matching answer arrays, and per-type counts (banked 15/10, seven 7/5),
and asserts no `gen:` set is `active`.

### Strict shape validation (Codex P1 — fixed)

The generated-result → v2-item mapping/validation now lives in **one shared pure module**
(`lib/exam-task-templates/shape.ts`) used by both the generator and QA, so **bad structure can
never be written as draft**. For `para_match` (`statements_answers`) it strictly enforces:
`statements.length === itemCount`, `answers.length === itemCount`, `paras` is an integer with
`itemCount ≤ paras ≤ optionCount`, every answer is an integer in `[0, paras)`, and answers are
distinct. `paras` is persisted in `question_sets.qa_flags.paras` so the **data QA** re-checks the
range/count/uniqueness on already-written drafts (template-agnostic: answer count = statement count).
A **pure-function fixture** in `qa:qsets-v2` proves the bad cases are rejected — verified directly:
`2 statements → REJECT(statements_count)`, `answers [99,…] → REJECT(answer_out_of_range)`,
`missing paras → REJECT(paras_invalid)`, valid `5/5 paras=6 → ACCEPT` (plus banked_cloze count
fixtures).

## 5. Verification results (exit codes)

| Command | Result |
|---|---|
| `generate:qsets-v2 --template=cet-banked-cloze --count=3 --level=3` (dry-run) | ✅ exit 0, plan printed, no writes |
| `generate:qsets-v2 --template=toefl-four-skills --apply` | ✅ exit 1 (manual_seed refused) |
| `generate:qsets-v2 --template=cet-banked-cloze --apply` | ✅ exit 1 (v2 not_applied refused) |
| `generate:qsets-v2 --template=does-not-exist` | ✅ exit 1 |
| `npm run qa:qsets-v2` | ✅ exit 0 |
| `npm run validate:question-types` | ✅ exit 0 |
| `npm run validate:exam-specs` | ✅ exit 0 |
| `npm run lint` | ✅ exit 0 |
| `npx tsc --noEmit` | ✅ exit 0 |

> Note: the two new scripts use `process.exitCode` (not `process.exit()`) after Supabase queries to
> avoid an intermittent Windows libuv teardown assertion; exit codes are now deterministic.

## 6. Recommended first real generation batch

Start with the **structured, deterministic, QA-checkable** types where the format is unambiguous and
v1 already proves feasibility — generated as **draft**, then QA'd and human-spot-checked before any
activation (a separate approved batch):

1. **`cet-banked-cloze`** (cet4 lv3, cet6 lv4) — clearest 15→10 structure, strong QA coverage.
   `generate:qsets-v2 --template=cet-banked-cloze --count=20 --level=3 --apply` → `qa:qsets-v2`.
2. **`gaokao-seven-select`** (gaokao lv2) — 7→5, then reuse for kaoyan Part B.
3. **`gaokao-grammar-fill`** (gaokao lv2) — free-fill; needs acceptable-answer-set review.

**Defer:** `kaoyan-reading-b` (long passages need stronger paraphrase QA), `sat-rw-domains` (short-RW
authoring + domain balance + Words-in-Context rigor), and `toefl-four-skills` (manual seed; speaking
+ listening need audio/rubric — gated behind Phase 9 audio + a rubric phase). Activation of any batch
requires the `qa:qsets-v2` data QA to pass on the drafts **and** explicit user approval.
