# Claude Code Prompt: Controlled Question Bank Content Production

你现在接手 Ocean English 题库内容生产。前置基础设施 Phases 1-13 已完成并经 Codex 复核：题型 taxonomy、7 档考试规格、v2 schema、practice session、runner、drill 三入口、lexiverse 单词入口、v1→v2 迁移、音频规划、整卷生成、模板生成、rubric 评分、学习闭环都已接好。

本阶段目标不是一次性生成整库，而是进入受控内容生产：先小批 draft，QA 与人工抽检通过，再交给 Codex 复审。未获批准前绝不批量扩张，绝不上 active。

## Hard Rules

1. 不改前端、不改导航、不改 UI；如你认为必须改 UI，先停下来报告。
2. 不删除 v1 `question_bank`，不破坏旧 `/api/questions`、`/api/mock-exam`、`/api/practice/session`。
3. 不生成、不迁移、不激活退役题型：`antonym_choice`、`cet_cloze`。
4. 不抄真题，不复制官方/商业题库原文；可以参考题型结构，但内容必须原创。
5. DeepSeek route 限流不要动。生成脚本可直连 DeepSeek API，但应用路由限流配置不得改。
6. 所有新增 v2 内容先写 `draft`；`active` 上架必须另开阶段，经 QA、人工抽检、Codex 复审、用户批准。
7. 默认 dry-run。任何 `--apply` 前必须说明会写哪些表、多少行、状态是什么。
8. v2 schema 未应用时，不要绕过脚本写库；先提示用户在 Supabase SQL Editor 执行 `supabase/sql/p4-question-bank-v2.sql`。
9. 听力音频管线目前只支持规划，不支持真实 apply；不要把无稳定音频的听力题上 active。
10. 若生成质量不确定，宁可拒绝/跳过，不要硬写。

## Phase G0: Preflight

先只检查，不写库：

```powershell
git status --short
npm run validate:question-types
npm run validate:exam-specs
npm run validate:data-quality
npm run validate:practice-session
npm run validate:rubrics
npm run validate:learning-loop
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run lint
npx tsc --noEmit
```

把结果汇总给用户。若 `validate:qbank-v2` 是 `not_applied`，停止内容写入，要求用户先执行 `supabase/sql/p4-question-bank-v2.sql`，然后重新跑 `npm run validate:qbank-v2`。

## Phase G1: v1 → v2 小批迁移试跑

v2 schema 确认 applied 后，先迁移一小批已有 v1 题到 v2 draft，验证整条链路。

先 dry-run：

```powershell
npm run migrate:qbank-v2 -- --limit=200 --status=draft
```

检查报告：

- `reports/qbank-v2-migration-report.md`
- `reports/qbank-v2-migration-report.json`

确认没有退役题型、没有异常拒绝原因后，再小批 apply：

```powershell
npm run migrate:qbank-v2 -- --limit=200 --status=draft --apply
npm run qa:qbank-v2-migration
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

完成后停止，汇报写入 sets/items/stimuli 数量、状态分布、拒绝原因、样本 legacy_id。不要继续扩大。

## Phase G2: 新题模板 pilot，先 dry-run

先选择结构最清晰、风险最低的模板：

1. `cet-banked-cloze`
2. `gaokao-seven-select`
3. `gaokao-grammar-fill`

每个模板先 dry-run，不写库：

```powershell
npm run generate:qsets-v2 -- --template=cet-banked-cloze --count=10 --level=3
npm run generate:qsets-v2 -- --template=gaokao-seven-select --count=10 --level=2
npm run generate:qsets-v2 -- --template=gaokao-grammar-fill --count=10 --level=2
npm run qa:qsets-v2
```

检查 `reports/question-sets-v2-generation-report.json` 与 `reports/question-sets-v2-qa.json`。确认模板合法、不会发射退役题型、copyrightPolicy 是 `original_only`。

## Phase G3: 新题模板 pilot，写 draft

只有在 G2 无异常且用户确认后，才小批写 draft。每个模板最多 10-20 组，不要一次生成大批量。

```powershell
npm run generate:qsets-v2 -- --template=cet-banked-cloze --count=10 --level=3 --apply
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
```

然后抽样审查至少 10 组：

- 题干/文章是否原创、自然、符合等级；
- answer key 是否唯一且正确；
- banked cloze 是否有足够干扰项；
- seven select 是否不靠明显词面重复偷懒；
- grammar fill 是否答案词形/时态/搭配正确；
- `question_sets.status` 与 `question_items.status` 都是 `draft`；
- `legacy_id` 前缀是 `gen:`；
- 无 `antonym_choice`、无 `cet_cloze`。

将抽样结论写入报告，停止交给 Codex 复审。

## Phase G4: 扩大前的质量门

Codex 审查通过后，才允许下一批。每批仍然小步：

- 单模板单等级每批最多 50 组；
- 每批后必须跑 `qa:qsets-v2`、`validate:qbank-v2`、`validate:practice-session`、`validate:papers`、`lint`、`tsc`；
- 每批都要更新报告：模板、等级、生成数、写入数、拒绝数、抽检样本、常见错误、是否建议继续。

优先顺序：

1. CET-4 `banked_cloze` lv3
2. 高考 `seven_select` lv2
3. 高考 `grammar_fill` lv2
4. 考研 `para_match` lv5（必须重点查段落/statement 对应）
5. SAT RW domain 小批 lv7（draft only，SAT 仍是 curated/draft 规格）
6. TOEFL 四技能只做结构/草稿，不做 active；听力需等音频管线真实接入。

## What To Report Back

每次停止时按这个格式汇报：

1. 改动文件。
2. 是否写库；写了哪些表、多少行、状态分布。
3. dry-run/apply 命令与退出码。
4. QA/validator 命令与退出码。
5. 新题样本 ID/legacy_id 与抽检结论。
6. 拒绝/降级原因。
7. 是否发现需要 Codex 修的脚本或 schema 问题。
8. 下一步建议，但不要自行继续。

## Stop Conditions

遇到以下任一情况立即停止：

- v2 schema `not_applied` 或 `partial_applied`；
- QA 出现错误；
- 生成题存在系统性 answer key 错误；
- DeepSeek 返回非 JSON 或结构不稳定；
- 任何脚本试图写 `active`；
- 发现退役题型残留；
- 需要改前端；
- 需要改 DeepSeek route 限流；
- 需要批量删除/覆盖数据。

