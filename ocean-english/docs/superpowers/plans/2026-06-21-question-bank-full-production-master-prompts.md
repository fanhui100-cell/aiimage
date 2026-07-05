# Ocean English Question Bank Full Production Master Prompts

给 Claude Code 使用。目标是把 Ocean English 的 v2 题库从当前 G1 状态，逐步补齐到“7 档考试 + 单词宇宙 + 主观任务 + 模拟卷 + 学习闭环”可验证状态。

执行方式已调整为 **Claude Code 自审连续推进模式**：

- 每个阶段做完后，Claude Code 必须先按本文件的 self-review checklist 自审。
- 自审全绿时，自动进入下一个阶段，不需要等 Codex 逐阶段复审。
- 每个阶段仍要写阶段 summary，保留命令、退出码、DB 写入、抽检样本、QA 结果。
- 只有遇到 hard stop condition 才停下来问用户。
- 全部阶段完成后，再把总报告交给 Codex 做最终全量复审。

当前已知状态：

- v2 schema 已应用。
- G1 已完成：`en_to_zh` 迁移 200 sets / 200 items / 200 target_words，全部 `draft`，`active=0`。
- Codex 已复审 G1 通过。
- `exam_specs` / `exam_sections` / `task_templates` / `rubrics` 表当前为空，需要后续 seed。
- 听力稳定音频管线目前只支持规划，不支持真实音频 apply。
- 不得生成或迁移退役题型：`antonym_choice`、`cet_cloze`。

## Global Hard Rules

> IMPORTANT OVERRIDE: use **skip-forward mode** for this long production run. This override supersedes any older wording in this file that says to stop on every QA failure. Ordinary QA/content/write issues should be recorded, isolated, skipped, and revisited later. Only non-skippable hard stops should halt the whole run.

### Execution Discipline: Do Not Drift

Claude Code must follow this document strictly. Do not improvise alternate workflows, do not merge phases, and do not skip required validation because a previous command "looked fine".

Before starting each stage:

1. Re-read the current stage section in this document.
2. Identify the exact target `examId`, `level`, `taskType`, template, status, and batch size.
3. Confirm whether the stage is migration, generation, metadata seed, audio, promote, audit, or cleanup.
4. State the planned commands before running any `--apply`.
5. Confirm the stage does not require frontend/rate-limit/schema changes unless explicitly allowed.

During each stage:

1. Run only the commands required by the stage.
2. Do not widen `--limit`, add extra task types, or combine multiple task types unless this document says so.
3. Do not write `active` outside G8 promote.
4. Do not generate content outside the target exam/level/task.
5. Do not use deprecated or alias-only question types.
6. Do not silently change templates, answer schema, scoring scale, or task mapping.

After each stage:

1. Run the stage-required validators.
2. Do DB spot checks.
3. Run the self-review gate.
4. Write stage summary and issue ledger updates.
5. Only then continue, skip-forward, or hard-stop.

If instructions conflict, choose the stricter rule and record the conflict in the issue ledger.

### Question-Type Specification Lock

When generating or migrating question content, Claude Code must strictly obey the corresponding type specification. If generated content does not fit the shape, reject or skip it. Do not "massage" a bad shape into another type.

Required shapes:

1. `reading_comprehension`
   - Has a readable passage/stimulus unless it is an SAT short-passage single item.
   - Each item has a clear prompt, 4 choices when objective, and one correct answer.
   - Subskills should be tagged when possible: detail, inference, main_idea, vocab_in_context, evidence, purpose, structure.

2. `listening_comprehension`
   - Must have listening stimulus and transcript/source text retained only for review/QA.
   - No practice payload may reveal transcript before answer.
   - No active promotion without active audio.

3. `banked_cloze`
   - Passage with exactly the required blank count.
   - Bank size and answer count must match template.
   - Answers are indexes or stable ids into the bank, never free-floating text.
   - Distractors must be plausible and not duplicate the correct answer.

4. `seven_select`
   - Passage with 5 blanks and 7 options for Gaokao-style tasks unless template says otherwise.
   - Answers count equals blank count.
   - Answers are in range and not duplicated unless the official-style variant explicitly allows reuse.
   - Options must be sentence/paragraph connectors, not random vocabulary definitions.

5. `para_match`
   - Has paragraphs and statements.
   - `statements.length === itemCount`.
   - `answers.length === itemCount`.
   - Paragraph count is valid and answers are in range.
   - No duplicated answer unless the variant explicitly permits it.

6. `cloze_passage`
   - Passage with ordered blanks.
   - Each blank has choices and exactly one correct choice.
   - Answers align to blank order.
   - Do not use retired `cet_cloze`.

7. `grammar_fill`
   - Passage with ordered blanks.
   - Each blank has answer and acceptable alternatives if needed.
   - Word form, tense, agreement, preposition, article, conjunction, or derivation must be explainable.

8. Word universe choice types
   - Correct answer must correspond to the target word.
   - Choices must include the answer exactly once.
   - Distractors must not be synonyms so close that multiple answers become valid.

9. Word universe spelling/form types
   - Answer text must be present and normalizable.
   - Acceptable alternatives must be explicit if more than one form is valid.

10. Productive tasks
    - Prompt only; do not fabricate a single "official answer".
    - Must attach rubric/scoring contract.
    - Score is an estimate only, never official.

If any content violates its shape:

- keep it `draft` if already written,
- record `content_quality` or `qa_failed`,
- skip the batch/type/template,
- continue only if the bad content is isolated.

### High-Risk Stop Protocol

If a problem is too risky to skip, stop immediately and output:

1. Stage and batch.
2. Exact command that failed.
3. Exit code or API/DB error.
4. Affected table(s).
5. Affected legacy_id / ids.
6. Whether any rows were written.
7. Whether any rows are active.
8. Whether rollback/demotion was attempted.
9. Current validator results.
10. Recommended next action.

### Dependency Guard

Skip-forward does not mean later stages may pretend missing prerequisites exist. Before each stage, Claude Code must check whether the stage depends on earlier skipped work.

Dependency rules:

1. If G1D metadata seed is skipped or failed, do not run active promotion for exam-bound papers. Continue only with draft generation/migration that does not require DB metadata.
2. If a task type has unresolved `qa_failed` or `content_quality` major issues, do not promote that task type.
3. If audio generation is skipped or missing, do not promote listening/speaking sets.
4. If rubric seed/scoring is missing, do not promote productive tasks that require rubric.
5. If coverage audit is missing, do not declare any level complete.
6. If validator scripts are unavailable, do not write or promote data that validator would have checked.

If a dependent stage is skipped because prerequisites are missing, record `schema_needed`, `audio_missing`, `rubric_missing`, or `dependency_missing` in the issue ledger and continue to the next independent stage.

### Pre-Write Snapshot

Before every command that can write DB rows (`--apply`, seed, promote, demote, audio upload), Claude Code must capture a small snapshot and include it in the stage summary:

1. Target tables.
2. Current row counts by `status`.
3. Current row counts by target `task_type`.
4. Current active count for the target task.
5. Current deprecated count for `antonym_choice` and `cet_cloze`.
6. Planned write count and status.

After the write, capture the same counts again. If the delta is not explainable, record `write_error` and stop unless the unexpected rows can be safely isolated.

### Content Quality Thresholds

For generated question content, use strict thresholds:

1. Pilot batch: sample at least 10 sets or all sets if fewer than 10.
2. Expanded batch: sample at least 10% of sets, minimum 10, maximum 30.
3. If any sampled set has a definite answer-key error, mark the whole batch `contained`, do not promote, and record `qa_failed`.
4. If sampled serious errors exceed 5%, skip that template/task type until fixed.
5. If minor wording/style issues exceed 15%, keep batch draft and record `content_quality`.
6. If copyright/source originality is uncertain, keep batch draft and record `content_quality` with severity `major`.

Serious errors include:

- wrong answer key
- multiple valid answers where the schema expects one
- answer out of range
- missing/invalid stimulus
- level grossly mismatched
- copied real exam content
- transcript leak in listening practice payload

### AI Generation Controls

When generating with AI:

Default generation provider is **Claude Code itself**, not DeepSeek.

1. Do not call DeepSeek for G3/G4/G5 unless the user explicitly approves paid DeepSeek generation in that turn.
2. Claude-authored content must still use the existing template shape and validator; do not free-form generate outside template schema.
3. Output generated batches as machine-parseable JSON artifacts first, then import/validate them. Do not write hand-waved prose directly into DB.
4. Reject non-JSON, partial JSON, or schema-mismatched output.
5. Do not auto-repair semantic answer errors by guessing; regenerate or mark the item rejected.
6. Do not ask any model to reproduce real exam questions.
7. Use small batches; if Claude-authored quality becomes unstable, record issue and skip generation.
8. Store generation provenance in `legacy_id`, `qa_flags`, or report summary, e.g. `source_type=claude_authored_practice`.
9. If an existing script only supports DeepSeek apply, do not use that path for Claude generation. Add or use a JSON import/seed path that writes only `draft`.

Claude-authored generation workflow:

1. Generate JSON to a local artifact under `data/generated-question-sets/<stage>/<template-or-task>.json`.
2. Validate JSON shape locally.
3. Import to v2 as `draft`.
4. Run `qa:qsets-v2`, `validate:qbank-v2`, `validate:practice-session`, and `validate:papers`.
5. Spot-check samples and record results.

### Definition of Complete

Do not call the whole question bank "complete" unless all of these are true:

1. All 13 word universe types have draft coverage and at least one reviewed active pilot batch where appropriate.
2. All active exam levels have objective-task draft coverage for every canonical section.
3. Active pools exist only for QA-passed tasks.
4. Listening active pools have active audio.
5. Productive tasks have rubrics and safe scoring disclaimers.
6. `/api/practice/session` works for word/task modes.
7. `/api/papers` can either generate a paper or return a clear `insufficient_pool` without wrong fallback.
8. `daily-plan` and `diagnostics` return controlled results.
9. `validate:*`, `qa:*`, lint, and tsc pass.
10. Issue ledger has no unresolved `blocking` issues.

Use terms precisely:

- `draft coverage`: content exists but is not user-facing active.
- `active pilot`: small QA-passed active batch.
- `complete`: meets all criteria above.
Do not use `complete` for draft-only TOEFL/SAT pools.

### Skip-Forward Policy

Claude Code should continue through later independent tasks when a problem is isolated to one batch, one type, one template, or one stage.

Allowed to skip and continue:

1. A batch/type/template fails QA, but all affected rows are still `draft`.
2. A write fails before creating usable rows.
3. A task needs frontend/design/rate-limit/schema work outside the current data-production scope.
4. Listening/speaking content lacks stable audio; keep it `draft`, skip active promotion, continue non-audio work.
5. A source pool is empty or insufficient; record it, skip that pool, continue.
6. Generated content quality is poor; do not promote it, record samples, continue to the next batch.

Skipping is allowed only after the issue is recorded in the issue ledger and the current batch is contained. Never skip silently.

### Issue Ledger

Maintain these files for the entire run:

- `reports/qbank-production-issue-ledger.md`
- `reports/qbank-production-issue-ledger.json`

Append an entry whenever anything fails, is skipped, or needs later repair. Required fields:

- `id`: stable id, e.g. `G4-cet4-banked-001`
- `stage`
- `batch`
- `examId`
- `level`
- `taskType`
- `severity`: `info` | `minor` | `major` | `blocking`
- `category`: `qa_failed` | `write_error` | `active_error` | `deprecated_type` | `schema_needed` | `frontend_needed` | `rate_limit_needed` | `content_quality` | `insufficient_pool` | `audio_missing` | `script_bug`
- `summary`
- `evidence`: command, exit code, legacy_id, sample rows, error text
- `containment`: what was done to isolate the bad batch
- `continueDecision`: `skipped_batch` | `skipped_type` | `skipped_stage` | `continued` | `stopped`
- `needsFixLater`: true/false
- `status`: `open` | `contained` | `fixed` | `wontfix`

Every stage summary must include the new issue count, unresolved issue count, open `major` / `blocking` issues, and whether it continued cleanly or continued by skip-forward.

### Non-Skippable Hard Stops

The following are not safe to skip. Stop unless you can perform minimal containment and re-run validators successfully:

1. DB connection or permissions fail and the write state cannot be verified.
2. v2 schema is `partial_applied` or structurally inconsistent.
3. Idempotency breaks and duplicate rows cannot be explained by legacy ids.
4. Bad rows were written as `active` and cannot be immediately demoted to `draft` or `rejected`.
5. `antonym_choice` or `cet_cloze` was written as `active` and cannot be immediately isolated.
6. Validator scripts are broken, so data safety cannot be checked.
7. A fix would require bulk deletion/overwrite.
8. A security issue can affect current users.

For `active_error` or `deprecated_type` contamination: if safe, immediately demote affected rows to `draft` or `rejected`, record the issue, re-run validators, and continue only after the contaminated rows are no longer active.

1. 每个阶段只做本阶段任务，完成后先自审；自审通过则自动进入下一阶段，不等待 Codex。
2. 默认 dry-run。任何 `--apply` 前必须说明会写哪些表、多少行、什么状态。
3. 所有新内容先写 `draft`。`active` 只能在专门的 promote 阶段做。
4. 不抄真题、不复制官方/商业题库原文。只能参考题型结构，内容必须原创。
5. 不动 DeepSeek route 限流。
6. 不改前端，除非阶段明确要求且用户批准。
7. 不删除 v1 `question_bank`，不破坏旧 `/api/questions`、`/api/mock-exam`、`/api/practice/session`。
8. 不生成、不迁移、不激活 `antonym_choice`、`cet_cloze`。
9. 听力没有稳定音频前不得转 `active`。
10. 任何 QA / validator 失败，立即停止。
11. 每个阶段都要输出人工 summary，不要依赖会被复跑覆盖的临时 JSON 作为唯一记录。

## Canonical Type Matrix

### Word Universe Types

这些服务核心卖点“单词宇宙 / 背单词”。

1. `en_to_zh`
2. `zh_to_en`
3. `def_to_word`
4. `cloze_choice`
5. `cloze_spell`
6. `zh_to_word_spell`
7. `word_form`
8. `listen_to_meaning`
9. `dictation_spell`
10. `synonym_choice`
11. `synonym_substitute`
12. `collocation_choice`
13. `confusable_choice`

### Exam Objective Types

1. `reading_comprehension`
2. `listening_comprehension`
3. `banked_cloze`
4. `seven_select`
5. `para_match`
6. `cloze_passage`
7. `grammar_fill`

### Productive / Subjective Types

1. `applied_writing`
2. `continuation_writing`
3. `essay_writing`
4. `translation_zh_en`
5. `translation_en_zh`
6. `build_a_sentence`
7. `email_writing`
8. `academic_discussion`
9. `complete_the_words`
10. `read_daily_life`
11. `choose_a_response`
12. `listen_and_repeat`
13. `interview_speaking`

### Deprecated / Never Generate

1. `antonym_choice`
2. `cet_cloze`
3. Alias-only names: `definition_to_word`、`zh_definition_to_word`、`listen_to_word`

## Exam Coverage Matrix

### Level 1: Zhongkao

- `listening_comprehension`
- `grammar_fill`
- `cloze_passage`
- `reading_comprehension`
- `applied_writing`

### Level 2: Gaokao

- `listening_comprehension`
- `reading_comprehension`
- `seven_select`
- `cloze_passage`
- `grammar_fill`
- `applied_writing`
- `continuation_writing`

### Level 3: CET-4

- `essay_writing`
- `listening_comprehension`
- `banked_cloze`
- `para_match`
- `reading_comprehension`
- `translation_zh_en`

### Level 4: CET-6

- `essay_writing`
- `listening_comprehension`
- `banked_cloze`
- `para_match`
- `reading_comprehension`
- `translation_zh_en`

### Level 5: Kaoyan

- `cloze_passage`
- `reading_comprehension`
- `seven_select`
- `para_match`
- `translation_en_zh`
- `applied_writing`
- `essay_writing`

### Level 6: TOEFL

- `complete_the_words`
- `read_daily_life`
- `reading_comprehension`
- `choose_a_response`
- `listening_comprehension`
- `build_a_sentence`
- `email_writing`
- `academic_discussion`
- `listen_and_repeat`
- `interview_speaking`

TOEFL 先做 `draft`，听力/口语不能 active，直到稳定音频与评分闭环完成。

### Level 7: SAT

SAT Digital RW 用 `reading_comprehension` 承载四个 domain：

- Information and Ideas
- Craft and Structure
- Expression of Ideas
- Standard English Conventions

SAT 先做 `draft`，不要声称官方完整题库。

---

# G1B: Word Universe v1 to v2 Draft Migration

## Status Gate

Before running G1B, Claude Code must check whether this stage has already been completed by a previous standalone run.

G1B is considered complete only if all 12 target types below satisfy one of these:

- migrated successfully with expected draft rows, or
- has a documented empty/skip reason in the issue ledger or stage summary.

For migrated types, verify:

- sets/items are `draft`
- active count from this stage is 0
- deprecated type count is 0
- target words exist where expected
- QA/validator passed
- idempotency was checked

If G1B is already complete and verifiable, do **not** rerun migration. Write this in the stage summary:

`G1B already completed — skipping to G1C`

Then continue directly to G1C.

If G1B is incomplete, unverifiable, or partially complete, run only the missing/incomplete target types. Do not rerun already verified types unless idempotency verification is explicitly needed.

## Goal

继续迁移剩余 12 个单词宇宙题型。每个题型 200 条，全部 `draft`。

## Target Types

1. `zh_to_en`
2. `def_to_word`
3. `cloze_choice`
4. `cloze_spell`
5. `zh_to_word_spell`
6. `word_form`
7. `listen_to_meaning`
8. `dictation_spell`
9. `synonym_choice`
10. `synonym_substitute`
11. `collocation_choice`
12. `confusable_choice`

## Commands Per Type

```powershell
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft --apply
npm run qa:qbank-v2-migration
npm run validate:qbank-v2
npm run validate:practice-session
```

每完成 3 个类型后，任选最近一个类型复跑 apply，验证幂等：预期写入 0 / dup-skip 命中。

## Required Checks

- 每类 set/item 全部 `draft`
- active = 0
- 每个 item 有 target word
- 选择题 answer 在 choices 中
- 拼写/词形题 answer 可判定
- 无 `antonym_choice` / `cet_cloze`

完成后执行阶段自审。若自审全绿，自动进入 G1C；若失败，停止并报告。

---

# G1C: Existing Exam Objective v1 to v2 Draft Migration

## Goal

迁移已有 v1 考试客观题到 v2 draft。不要生成新题。

## Target Types

1. `reading_comprehension`
2. `listening_comprehension`
3. `banked_cloze`
4. `seven_select`
5. `para_match`
6. `cloze_passage`
7. `grammar_fill`

## Batch Rule

每个类型单独跑，每批最多 200 set。听力只写 `draft`，不得 active。

## Commands Per Type

```powershell
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft --apply
npm run qa:qbank-v2-migration
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

## Spot Check

每个类型至少抽 5 组：

- `task_type`
- `level`
- `status`
- stimulus 是否存在
- passage / bank / answers / statements 结构是否符合题型
- answer key 是否可判定
- target words 是否合理

## Special Checks

- `banked_cloze`: bank 数量、空数量、answers 索引必须一致。
- `seven_select`: 选项数量与答案数量必须一致，答案不可重复或越界。
- `para_match`: statements 数、paras 数、answers 范围必须一致。
- `cloze_passage`: 每空选项与答案必须对应。
- `grammar_fill`: 每空答案和可接受答案必须明确。
- `listening_comprehension`: 没有 active 音频，保持 draft。

完成后执行阶段自审。若自审全绿，自动进入 G1D；若失败，停止并报告。

---

# G1D: Seed v2 Metadata Tables

## Goal

把 TS canonical specs/templates/rubrics 同步到 v2 DB 元数据表，支持后续正式归因、组卷、report。

当前这些表可能为空：

- `exam_specs`
- `exam_sections`
- `task_templates`
- `rubrics`

## Implementation

如尚无脚本，新增：

- `scripts/seed-question-bank-v2-metadata.ts`
- package script: `seed:qbank-v2-metadata`

脚本要求：

- 默认 dry-run
- `--apply` 才写库
- 幂等 upsert
- 写入 canonical `lib/exam-specs`
- 写入 `data/exam-task-templates`
- 写入 `lib/scoring/rubrics`
- 不写 question content
- 不改前端

## Commands

```powershell
npm run seed:qbank-v2-metadata
npm run seed:qbank-v2-metadata -- --apply
npm run validate:qbank-v2
npm run validate:exam-specs
npm run validate:rubrics
npm run validate:papers
```

## Required Counts

- `exam_specs`: 7
- `exam_sections`: 与 canonical specs sections 总数一致
- `task_templates`: 至少覆盖 6 个现有模板
- `rubrics`: 10

完成后执行阶段自审。若自审全绿，自动进入 G2；若失败，停止并报告。

---

# G2: New Template Dry Runs

## Goal

只做新题模板 dry-run，不写库，不调用 DeepSeek apply。

This stage is also the place to verify Claude-authored generation readiness. If the current generator only supports DeepSeek for `--apply`, do not use it for paid generation. Instead, prepare a Claude-authored JSON artifact workflow:

- generate JSON locally under `data/generated-question-sets/g2/`
- validate against template shape
- keep dry-run only
- do not write DB

## Templates

1. `cet-banked-cloze`
2. `gaokao-seven-select`
3. `gaokao-grammar-fill`
4. `kaoyan-reading-b`
5. `sat-rw-domains`
6. `toefl-four-skills`

## Commands

```powershell
npm run generate:qsets-v2 -- --template=cet-banked-cloze --count=10 --level=3
npm run generate:qsets-v2 -- --template=gaokao-seven-select --count=10 --level=2
npm run generate:qsets-v2 -- --template=gaokao-grammar-fill --count=10 --level=2
npm run generate:qsets-v2 -- --template=kaoyan-reading-b --count=10 --level=5
npm run generate:qsets-v2 -- --template=sat-rw-domains --count=10 --level=7
npm run generate:qsets-v2 -- --template=toefl-four-skills --count=10 --level=6
npm run qa:qsets-v2
```

## Required Checks

- dry-run 不写库
- `copyrightPolicy=original_only`
- 不发射退役题型
- 模板 schema 与题型一致
- TOEFL 如为 `manual_seed` 或需要音频，不能自动 apply

完成后执行阶段自审。若自审全绿，自动进入 G3；若失败，停止并报告。

---

# G3: New Template Pilot Draft Apply

## Goal

只对低风险模板小批生成并写 `draft`。每个模板最多 10-20 组。

Generation provider: **Claude Code authored JSON**, not DeepSeek. Do not call DeepSeek in this stage unless the user explicitly approves paid DeepSeek generation.

## First Pilot Order

1. `cet-banked-cloze` lv3 count 10
2. `gaokao-seven-select` lv2 count 10
3. `gaokao-grammar-fill` lv2 count 10

## Commands

```powershell
npm run generate:qsets-v2 -- --template=cet-banked-cloze --count=10 --level=3
# If the script is DeepSeek-only for apply, do NOT run --apply.
# Create/validate/import Claude-authored JSON draft via a safe JSON import path instead.
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

对每个模板重复。不要一次跑多个模板。

## Manual Spot Check

每个模板至少抽 10 组：

- 文章原创、自然、符合等级
- answer key 唯一且正确
- 干扰项合理
- 不靠词面重复偷懒
- passage 与题目对应
- set/item 全 `draft`
- `legacy_id` 前缀 `gen:`
- 无退役题型

完成后执行阶段自审。若自审全绿，自动进入 G4；若失败，停止并报告。

---

# G4: Expand Exam Objective Draft Pools

## Goal

逐步补齐 7 档考试客观题 draft 池。每批最多 50 组。

Generation provider: **Claude Code authored JSON**, not DeepSeek. For every batch, generate local JSON artifacts first, validate shape, then import as `draft`. If the import path does not exist, add a small safe importer rather than calling DeepSeek.

## Batch Priority

### Level 1 Zhongkao

1. `grammar_fill` count 50
2. `cloze_passage` count 50
3. `reading_comprehension` count 50
4. `listening_comprehension` count 30 draft only

### Level 2 Gaokao

1. `seven_select` count 50
2. `grammar_fill` count 50
3. `cloze_passage` count 50
4. `reading_comprehension` count 50
5. `listening_comprehension` count 30 draft only

### Level 3 CET-4

1. `banked_cloze` count 50
2. `para_match` count 50
3. `reading_comprehension` count 50
4. `listening_comprehension` count 30 draft only

### Level 4 CET-6

1. `banked_cloze` count 50
2. `para_match` count 50
3. `reading_comprehension` count 50
4. `listening_comprehension` count 30 draft only

### Level 5 Kaoyan

1. `cloze_passage` count 50
2. `reading_comprehension` count 50
3. `seven_select` count 30
4. `para_match` count 50

### Level 6 TOEFL

Draft only:

1. `reading_comprehension` count 30
2. `complete_the_words` count 30
3. `read_daily_life` count 30
4. `choose_a_response` count 30 draft only
5. `listening_comprehension` count 30 draft only

### Level 7 SAT

Draft only:

1. Information and Ideas count 50
2. Craft and Structure count 50
3. Expression of Ideas count 50
4. Standard English Conventions count 50

SAT 用 `reading_comprehension` 承载，但必须在 metadata / tags / qa_flags 中标出 domain。

## After Every Batch

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run lint
npx tsc --noEmit
```

每批都执行阶段自审。若该批自审全绿，自动进入下一批；G4 全部批次完成后自动进入 G5。若失败，停止并报告。

---

# G5: Productive Tasks Draft Pools

## Goal

补齐写作、翻译、口语、TOEFL 特殊生产性任务的 draft prompts。此阶段不自动评分批量结果，不上 active。

Generation provider: **Claude Code authored prompts**, not DeepSeek. Produce structured JSON prompt sets locally, validate rubric linkage, then import as `draft`.

## Targets

### Zhongkao

- `applied_writing`

### Gaokao

- `applied_writing`
- `continuation_writing`

### CET-4 / CET-6

- `essay_writing`
- `translation_zh_en`

### Kaoyan

- `applied_writing`
- `essay_writing`
- `translation_en_zh`

### TOEFL

- `build_a_sentence`
- `email_writing`
- `academic_discussion`
- `listen_and_repeat`
- `interview_speaking`

## Batch Rule

每种任务每批 20-30 个 draft prompt。

## Required QA

- rubric 能匹配
- prompt 原创
- 评分提示不冒充官方分
- TOEFL speaking 不存音频，只做文字/转写任务草稿
- translation 有 sourceText 和参考要点，但不把唯一译文写死成“唯一正确”

## Commands

如现有 `generate:qsets-v2` 不支持这些任务，不要调用 DeepSeek 硬造。先补 Claude-authored JSON 模板/导入路径，或记录 `schema_needed` / `script_bug` 后跳过该任务继续。

完成后执行阶段自审。若自审全绿，自动进入 G6；若失败，停止并报告。

---

# G6: Audio Pipeline Implementation and Listening Draft Upgrade

## Goal

接入真实音频生成/上传/QA，使听力题可以从 draft 进入可候选状态。

## Stop Before Coding If Missing

如果没有以下配置，立即停止：

- `SUPABASE_AUDIO_BUCKET`
- `AUDIO_TTS_API_KEY`
- 明确 TTS provider

## Implementation Requirements

若用户批准实现：

- 补全 `scripts/generate-audio-assets.ts`
- 真实合成音频
- 上传 Supabase Storage
- 写 `audio_assets`，初始 `qa_status=machine_checked`
- 不直接 active
- transcript 不得在练习 session 提前下发

## Commands

```powershell
npm run generate:audio-assets -- --limit=20
npm run generate:audio-assets -- --limit=20 --apply
npm run validate:audio-assets
npm run validate:practice-session
npm run validate:papers
```

完成后执行阶段自审。若自审全绿，自动进入 G7；若失败，停止并报告。

---

# G7: Coverage Audit and Gap Filling

## Goal

统计每个等级、每个题型、每个 section 的 draft/active 覆盖，找缺口再补。

## Required Script

如不存在，新增：

- `scripts/audit-question-bank-v2-coverage.ts`
- package script: `audit:qbank-v2-coverage`

报告输出：

- `reports/qbank-v2-coverage-audit.md`
- `reports/qbank-v2-coverage-audit.json`

## Metrics

按 exam/level/section/task_type 统计：

- draft sets
- active sets
- items
- stimuli
- audio coverage
- rubric coverage
- target word coverage
- insufficient pool warnings

## Commands

```powershell
npm run audit:qbank-v2-coverage
npm run validate:qbank-v2
npm run validate:papers
```

完成后执行阶段自审。若自审全绿，自动进入 G8；若失败，停止并报告。

---

# G8: Promote Draft to Active in Small Batches

## Goal

把通过 QA 的 draft 小批转 active。此阶段必须单独审批。

## Implementation

如不存在，新增 promote 脚本：

- `scripts/promote-question-sets-v2.ts`
- package script: `promote:qsets-v2`

要求：

- 默认 dry-run
- `--apply` 才更新状态
- 可按 `--exam`、`--level`、`--task`、`--limit`
- 写 active 前必须跑 active invariant
- 听力必须有 active audio
- 主观题必须有 rubric
- 退役题型硬拒

## Commands

```powershell
npm run promote:qsets-v2 -- --level=3 --task=banked_cloze --limit=20
npm run promote:qsets-v2 -- --level=3 --task=banked_cloze --limit=20 --apply
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

每次只 promote 一个 level + task，小批 20-50。每个 promote 批次执行阶段自审；自审全绿则继续下一个 promote 批次。G8 全部计划完成后自动进入 G9。若失败，停止并报告。

---

# G9: Full Paper Readiness

## Goal

确认各等级可以组卷或明确展示“题库建设中”，不能用无关题型顶替。

## Tests

对每个 exam：

```powershell
node scripts/check-paper-api-smoke.mjs
```

如果脚本不存在，新增只读 smoke，覆盖：

- `POST /api/papers { examId, mode:'mini' }`
- `POST /api/papers { examId, mode:'full' }`
- `GET /api/practice/session?mode=task&examId=...`

## Acceptance

- active 池足够的 section 能出题
- 不足时返回 `insufficient_pool`
- 不抽退役题型
- 听力无 transcript 泄露
- 主观题为 rubric/待评分，不伪装客观题

完成后执行阶段自审。若自审全绿，自动进入 G10；若失败，停止并报告。

---

# G10: Learning Loop End-to-End Validation

## Goal

用真实 v2 active 题验证闭环：

作答 → attempt → word mastery → skill state → error type → daily plan → diagnostics。

## Required Tests

如不存在，新增 e2e 或 script：

- `scripts/smoke-learning-loop-v2.ts`

覆盖：

1. word mode 作答正确/错误
2. task mode 作答错误
3. `question_attempts` 写入
4. `skill_states` 更新
5. `daily_plan` 有 reason
6. `diagnostics` 按时间升序 EMA
7. 听力 inference 错归 `listening_inference`

## Commands

```powershell
npm run validate:learning-loop
npm run validate:practice-session
npx tsx scripts/smoke-learning-loop-v2.ts
```

完成后执行阶段自审。若自审全绿，自动进入 G11；若失败，停止并报告。

---

# G11: Vocabulary Coverage Repair

## Goal

补齐词库等级和词汇资料覆盖，支持单词宇宙和高阶考试。

## Known Issues

- CET-6 词量覆盖不足，需要合法补标 levels。
- TOEFL/SAT 是 curated，不得声称官方完整。
- 高阶词搭配、例句、词形、反义覆盖偏弱。

## Commands

```powershell
npm run audit:vocab-levels
npm run validate:data-quality
```

如要导入新词表：

- 必须放入 `data/vocabulary-targets`
- 必须注明 source_name/source_url/license_note/exam_id/level/kind
- 不得盲目覆盖 `primary_level`
- 只增补 `levels`
- 导入后跑 data-quality gate

完成后执行阶段自审。若自审全绿，自动进入 G12；若失败，停止并报告。

---

# G12: Final Cleanup Before Wide Release

## Goal

收口遗留问题，准备正式使用。

## Tasks

1. 旧 `/api/mock-exam` 性能评估：保留、优化或迁移到 `/api/papers`。
2. `DictionaryVaultScreen` toast 的 `dangerouslySetInnerHTML` 改为 React 文本渲染。
3. 清理临时 reports，仅保留人工 summary 和必要 JSON。
4. 确认 dirty worktree 分批提交。
5. 全量运行：

```powershell
npm run validate:question-types
npm run validate:exam-specs
npm run validate:data-quality
npm run qa:qbank-v2-migration
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:audio-assets
npm run validate:rubrics
npm run validate:learning-loop
npm run lint
npx tsc --noEmit
```

完成后生成最终总报告，停止，并交给用户转 Codex 做最终全项目审查。

---

# Self-Review Gate For Every Stage

每个阶段结束后，Claude Code 必须自己执行以下自审。全部通过才允许自动进入下一阶段。

## Required Self-Review Checklist

1. Scope check:
   - 本阶段没有做超出阶段范围的改动。
   - 没有改前端，除非本阶段明确允许。
   - 没有改 DeepSeek route 限流。
   - 没有删除 v1 数据。

2. Status check:
   - 新写内容状态符合阶段要求。
   - draft 阶段没有写 active。
   - promote 阶段只 promote 经过 QA 的小批内容。
   - 听力无稳定 active audio 时没有 active。

3. Deprecated check:
   - `antonym_choice` count = 0。
   - `cet_cloze` count = 0。
   - alias-only 类型没有被当作正式题型写入。

4. QA check:
   - 本阶段要求的 QA/validator 全部 exit 0。
   - 若有 warning，已解释且不是阻断。
   - 抽检样本结构正确。

5. DB check:
   - 写入表、写入行数、状态分布可解释。
   - 幂等复跑没有重复插入。
   - target word / stimulus / audio / rubric 关系符合题型要求。

6. Content quality check:
   - 生成内容原创，不抄真题。
   - answer key 正确、唯一、可判定。
   - 题目难度与 level 对应。
   - 干扰项合理，不靠明显词面重复偷懒。

7. Report check:
   - 已写阶段 summary。
   - 记录命令、退出码、样本、拒绝/跳过/降级原因。
   - 记录下一阶段是否自动继续。

## Auto-Continue Rule

Apply skip-forward mode here as well:

- If all checks pass, continue normally.
- If checks fail only for a contained/skippable issue, add the issue to the ledger, mark the current batch/type/stage as skipped, and continue to the next independent task.
- If a non-skippable hard stop remains unresolved, stop and report.

Use these summary endings:

- `SELF-REVIEW PASS — continuing to <NEXT_STAGE>`
- `SELF-REVIEW SKIP-FORWARD — issue recorded, continuing to <NEXT_STAGE>`
- `SELF-REVIEW HARD-STOP — waiting for user/Codex`

如果以上 7 项全部通过：

- 在阶段 summary 末尾写：`SELF-REVIEW PASS — continuing to <NEXT_STAGE>`。
- 自动进入下一阶段。

如果任一项失败：

- 立即停止。
- 在报告末尾写：`SELF-REVIEW BLOCKED — waiting for user/Codex`。
- 不进入下一阶段。

---

# Final Repair Pass

After G1B-G12 have been attempted, Claude Code must do a final repair pass before handing the run back to the user/Codex:

1. Open `reports/qbank-production-issue-ledger.md` and `.json`.
2. Group unresolved issues by severity and category.
3. Fix all safe `minor` / `major` issues that do not require user approval.
4. Re-run the validators required by the affected stages.
5. Leave issues open only when they require product/design/user approval, external credentials, or deliberate data deletion.
6. Produce a final report with:
   - completed stages
   - skipped stages/batches
   - fixed issues
   - unresolved issues
   - commands and exit codes
   - DB final counts by status and task type
   - whether each exam level is `draft coverage`, `active pilot`, or `incomplete`
   - remaining prerequisites for levels that are not complete

Then stop and hand the final report to the user for Codex review.

## Final Handoff Package

The final handoff to user/Codex must include:

1. `reports/qbank-production-final-summary.md`
2. `reports/qbank-production-issue-ledger.md`
3. `reports/qbank-production-issue-ledger.json`
4. Final DB counts:
   - by table
   - by status
   - by task type
   - by level/exam
5. Final command log:
   - command
   - exit code
   - timestamp
   - key output summary
6. Samples:
   - at least 3 sample legacy ids per completed type
   - at least 5 generated-set samples per generated template
7. Known limitations:
   - draft-only pools
   - skipped tasks
   - audio gaps
   - vocabulary gaps
   - frontend/schema/rate-limit follow-ups
8. Exact request for Codex review:
   - what to verify
   - which files/reports to inspect
   - which DB counts to re-query

---

# Universal Report Format For Every Stage

每个阶段结束后必须按此格式汇报：

1. 阶段编号与目标。
2. 改动文件。
3. 是否写 DB；写了哪些表、多少行、状态分布。
4. dry-run / apply 命令与退出码。
5. QA / validator 命令与退出码。
6. 样本 legacy_id / DB 抽检结论。
7. 拒绝、跳过、降级原因。
8. active 总数确认。
9. 退役题型总数确认。
10. 是否发现脚本/schema/数据问题。
11. 下一步建议。
12. 明确说明：已停止，等待 Codex 审查。
