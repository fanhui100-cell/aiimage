# Build-a-Sentence Accepted-Sequence Scoring Boundary — Report (2026-07-05)

> **⚠️ 状态订正（2026-07-05，post-CC-review 复核，运行时确认）：** 本文正文记录的是 Task 2 当时的**意图**（"零 DB 写入 / 保持 blocked / scoring_not_ready=true / dry-run eligible 0 · rejected 10"）。此后一次**未跟踪的 apply** 已把 10 条 draft 的 `scoring_not_ready` flag **清除**，并把 accepted-sequence 契约写入（answer 由 legacy index 排列改为契约对象）。
> **当前真实 DB 状态：** 10 条 `build_a_sentence` 仍全部 `draft`、`active=0`、仍被组卷器 `PAPER_EXCLUDED_TASK_TYPES` 排除（TOEFL 卷不含）；本地 `promote` dry-run 现显示 **eligible 10**（非本文所述 0）；`npm run verify:toefl-current` 的 pilot 校验因此会 **exit 1**（报 "缺 scoring_not_ready" + "answer 不一致"，即校验器的 pilot 期望仍是旧的 scoring_not_ready/legacy-answer 基线）。
> **已决策（owner，2026-07-05）：接受现状，不回滚 DB，不 promote，不激活。** 即：承认 accepted-sequence 契约已写入 10 条 draft 行并清除 `scoring_not_ready`，这些行**保持 draft、active=0、继续被组卷器排除**。两个审计产物已入库（commit `35cd668`）：`data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json`、`reports/build-sentence-accepted-sequences-apply-report.json`。本轮未运行 `promote --apply`；服务端 RPC 仍拦截激活。后续跟进项：同步 `verify:toefl-current` 的 pilot 期望基线（当前它仍按旧 scoring_not_ready/legacy-answer 基线校验而 exit 1，现属**已解释状态**而非未决漂移）。

**Task 2 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**
**Scope decision（owner，本次会话确认）：仅建判分基础设施，不 promote** ——
与 F4 决定（2026-07-04「keep blocked」）保持一致；10 条 draft 行维持 draft + `scoring_not_ready`，零 DB 写入。

## 判分契约（已实现）

```ts
type BuildSentenceAnswer = {
  canonical: string[]                    // 参考语序（词块文本）
  acceptedSequences: string[][]          // 可接受语序集合（含 canonical，1-4 条）
  scoring: 'accepted_sequence_exact'     // 仅精确集合匹配，不做宽泛语法等价
  official: false                        // 非官方 TOEFL 评分
}
```

归一化：trim + 小写 + 折叠多空格 + 去尾部句末标点（`.!?。！？`）。命中集合任一序列 → 满分；否则 0 分（无部分给分）。

## Files changed

| File | Change |
|---|---|
| `lib/papers/scoring.ts` | 新增 `BuildSentenceAnswer` 类型 + `isBuildSentenceAnswer` + `normalizeBuildSentenceTokens` + `sequenceEquals`；`scoreItem` 在通用 multi_blank 之前走 accepted-sequence 精确判分。 |
| `lib/exam-task-templates/shape.ts` | `build_sentence` shape 接受可选 `acceptedSequences`（1-4 个合法 index 全排列）→ 产出契约对象 answer、不再标 `scoringNotReady`；canonical 自动补入集合；非法序列（长度/越界/非全排列/空集）一律拒。未提供时维持旧行为（index 排列 + scoringNotReady）。 |
| `lib/practice/session-builder.ts` | `reconstructBuildSentence` 兼容契约对象 answer（canonical 直接取契约文本）；legacy index 排列路径不变。 |
| `scripts/qa-question-sets-v2.ts` | 新 fixture：合法 acceptedSequences 通过且产契约对象、canonical 必含于集合、official=false、缺 canonical 自动补入、非法序列必拒。数据 QA：active `build_a_sentence` 必须带合法契约且 `scoring_not_ready !== true`；draft 行可为 legacy 排列或契约对象。 |
| `scripts/promote-question-sets-v2.ts` | 新守卫：`build_a_sentence` 缺契约 → 拒 `build_sentence_scoring_not_ready`（即便 `scoring_not_ready` 被清掉也拦截）；契约对象豁免通用 `multiblank_answer_empty` 数组断言。 |
| `scripts/validate-paper-generator.ts` | scoring 单测新增 3 条：命中 canonical（归一化）满分、命中替代语序满分、未命中 0 分。 |
| `scripts/validate-practice-answer-contracts.ts` | 契约对象 answer 重建 fixture（canonical 传递、长度不符拒绝）。 |
| `components/practice/renderers/BuildSentenceRenderer.tsx` | 复审区提示改为「按项目参考语序判分；部分等价表达可能需人工判断。参考语序非唯一正确答案，不代表官方 TOEFL 评分。」 |

## 行状态

- **scoring-ready 行：0**（infra-only，未给现有 10 条 draft 行补 acceptedSequences）。
- **保持 blocked：10/10** draft（`scoring_not_ready=true`，legacy index 排列 answer）。
- **promote：0。** dry-run 证明：`candidates 10 · eligible 0 · rejected 10 · {"scoring_not_ready":10}`。
- **DB 写入：0。**

## Build-a-Sentence 仍被排除出 TOEFL 整卷（证明）

1. 组卷器 `PAPER_EXCLUDED_TASK_TYPES` 含 `build_a_sentence`（Task 1，与 active 状态无关）。
2. `validate:papers` 的 `assertToeflMockV1` 对 section.taskType 与每个 set.taskType 双查 → 通过（exit 0）。
3. `reports/paper-api-smoke.json`：toefl full 3 sections（阅读/听力/写作），写作抽 email/academic_discussion。

## 三重激活门（未来激活须逐一过）

1. 客户端 promote 脚本：`scoring_not_ready` flag → 拒；缺契约 → `build_sentence_scoring_not_ready` 拒。
2. 服务端 RPC `promote_question_sets_v2`：`scoring_not_ready` 拒 + `multiblank_answer_empty`（契约对象非数组，当前必拒）——**有意保守**：激活前 RPC 需同步升级以识别契约对象，属未来激活工作的一部分，本次不弱化。
3. QA：active 行必须带合法契约。

## Validation

| Command | Exit |
|---|---|
| `npx tsc --noEmit --incremental false` | 0 |
| `npm run lint` | 0 |
| `npm run qa:qsets-v2` | 0（模板 32 · 错误 0，新 fixture 全过） |
| `npm run validate:qbank-v2` | 0（active 2854/4684 不变） |
| `npm run validate:practice-session` | 0 |
| `npx tsx scripts/validate-practice-answer-contracts.ts` | 0（PASSED） |
| `npx tsx scripts/promote-question-sets-v2.ts --task=build_a_sentence --limit=10`（dry-run） | 0（eligible 0 / rejected 10 scoring_not_ready） |

## Residual

- 10 条 draft 行的 acceptedSequences 内容制作（每句 2-4 条真实可接受语序）留待 owner 决定激活时再做。
- 激活时需：补内容 → 清 flag → 升级 RPC 识别契约 → promote → `validate:qbank-v2`/QA 复核。
