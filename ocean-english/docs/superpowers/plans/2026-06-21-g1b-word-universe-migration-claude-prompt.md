# Claude Code Prompt: G1B Word Universe v1 → v2 Draft Migration

你现在执行 Ocean English 题库生产的 **G1B 阶段**。

Codex 已复审 G1：`en_to_zh` 已迁移 200 个 `question_sets`、200 个 `question_items`、200 个 `question_target_words`，全部 `draft`，`active=0`，退役题型 0，QA 全过。

本阶段目标：继续迁移剩余 **单词宇宙 / 背词练习题型**，每个题型小批 200 条，全部写 `draft`。不要生成新题，不要上 active，不要改前端。

## Hard Rules

1. 只迁移 v1 已有题到 v2 draft；不要调用 DeepSeek，不要生成新题。
2. 每个题型必须单独跑，不允许一个命令混合多个类型。
3. 每个题型最多 `--limit=200`。
4. 每个题型流程：dry-run → apply → QA/validator → 抽样 → 停止记录。
5. 所有写入必须是 `draft`；若发现 active 写入，立即停止。
6. 不迁移退役题型：`antonym_choice`、`cet_cloze`。
7. 不改源码、不改 schema、不改前端、不改 DeepSeek route 限流。
8. 不提交临时 JSON 报告，除非用户明确要求；可写人工 summary。
9. 如果某个题型 v1 没有可迁移题，记录为 empty/skip，不要硬造。

## Target Types

按这个顺序迁移剩余单词宇宙题型：

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

`en_to_zh` 已完成 200 条，不要重复作为本阶段目标。

## Preflight

先确认环境与 G1 状态：

```powershell
npm run validate:qbank-v2
npm run qa:qbank-v2-migration
npm run validate:practice-session
```

然后用 service role 查询确认：

- `en_to_zh` v2 draft sets = 200
- `en_to_zh` v2 active sets = 0
- `antonym_choice` / `cet_cloze` v2 sets = 0

只做确认，不改数据。

## Per-Type Procedure

对每个目标类型 `<TYPE>` 执行：

### 1. Dry-run

```powershell
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft
```

检查 `reports/qbank-v2-migration-report.json`：

- `apply` 必须是 `false`
- `requestedStatus` 必须是 `draft`
- `countsByOldType` 只应包含 `<TYPE>`
- `deprecated` 必须为空或 0
- `rejectionReasons` 如有必须解释
- `setsPlanned` / `itemsPlanned` 如果是 0，要判断是已迁移、无源数据，还是脚本问题

### 2. Apply

只有 dry-run 正常时才 apply：

```powershell
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft --apply
```

apply 后立即跑：

```powershell
npm run qa:qbank-v2-migration
npm run validate:qbank-v2
npm run validate:practice-session
```

### 3. DB Spot Check

每个类型抽查至少 3 条：

- `question_sets.legacy_id`
- `question_sets.task_type`
- `question_sets.status`
- `question_sets.level`
- 对应 `question_items.status`
- `question_items.prompt`
- `question_items.choices`
- `question_items.answer`
- `question_target_words.word_id`
- `question_target_words.role`

确认：

- set/item 都是 `draft`
- active 数为 0
- 每个 item 至少有 1 个 target word
- answer 能在 choices 中找到，或拼写类题有可判定 answer
- 没有退役题型

### 4. Idempotency Check

每完成 3 个题型后，任选最近一个题型复跑同一个 apply 命令：

```powershell
npm run migrate:qbank-v2 -- --types=<TYPE> --limit=200 --status=draft --apply
```

预期：写入 0，dup-skip 命中已有 legacy。若出现重复写入，立即停止。

## Stop After This Batch

完成 12 个类型后停止，不进入 G2。

如果中途出现下列任一情况，立即停止：

- QA 或 validator 报错
- 出现 active 写入
- 出现退役题型
- item 没有 answer 或 answer 不能判定
- target word 缺失
- 某类型系统性结构异常
- 需要改脚本/schema/前端

## Report Format

完成后按这个格式汇报给用户和 Codex：

1. 改动文件：是否有源码改动；是否只产生报告。
2. DB 写入汇总：每个题型写入 sets/items/target_words 数量，全部状态。
3. 每个题型 dry-run/apply 命令与退出码。
4. QA/validator 命令与退出码。
5. 每个题型至少 3 个样本 legacy_id 与抽检结论。
6. 拒绝/跳过/降级原因。
7. active 总数确认。
8. 退役题型总数确认。
9. 幂等复跑结果。
10. 下一步建议：继续 G1C 考试客观题迁移，还是转 G2 新题模板 dry-run。

不要自行继续下一阶段。
