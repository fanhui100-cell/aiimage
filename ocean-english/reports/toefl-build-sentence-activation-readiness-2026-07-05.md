# TOEFL Build-a-Sentence Activation Readiness — Report (2026-07-05)

**Phase 10（post-v1 plan Task 2）.** 固定决策：accepted-sequence 精确匹配，不做宽泛语法等价。

## 结果总览

| 问题 | 答复 |
|---|---|
| 就绪行数 | **10/10**（全部携带合法 `accepted_sequence_exact` 契约，promote dry-run 全 eligible） |
| 仍 blocked 行数 | 0（`scoring_not_ready` flag 已按 manifest 从 10 个 set 清除） |
| RPC 是否改动/应用 | SQL **已改**（见下），**未应用**——需 owner 在 Supabase 重新执行 `p5-question-bank-promotion-rpc.sql`；应用前任何 `--apply` promote 会被旧 RPC 以 `multiblank_answer_empty` 拒绝（fail-safe 方向，不会误放行） |
| 是否 promote | **0（未 promote）**——10 行保持 draft，激活等待 owner 明确批准 |
| mock 是否仍排除 | **是**：`smoke:papers` toefl mini=2 区 / full=3 区；组卷器 `PAPER_EXCLUDED_TASK_TYPES` 与 `assertToeflMockV1` 双查通过（与 active 状态无关） |

## 内容审定（诚实性说明）

10 条 pilot 句全部为 **V + 直接宾语 + 介词短语论元** 的固定结构（compare/provide/supply…X with/of/on/to/into Y）。
PP 为论元不可前置、宾语较轻不可重 NP 移位 → **每句 genuinely acceptable 的语序只有 canonical 一种**。
故 `acceptedSequences = [canonical]`（每句 1 条），拒绝为凑 2-4 条而添加会导致错误判对的假等价语序。
（计划的 “2 to 4 accepted sequences” 条件是 “if genuinely acceptable” —— 本批不满足该条件；
Part C3 扩产新题将专门设计含可前置状语的句子以产生真实 2-4 条语序。）
解释文案维持「参考语序，非唯一合法解 / 非官方 TOEFL 答案」，`official:false`。

## 执行记录（manifest 式）

源清单：`data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json`（新增，含逐句 why_single 审定理由）。
脚本：`scripts/apply-build-sentence-accepted-sequences.ts`（新增；校验 canonical 与 DB 现存排列一致、全排列合法、句子拼接一致、契约过 `isBuildSentenceAnswer`）。

| 轮次 | entries | updated | dup-skip | failed | exit |
|---|---|---|---|---|---|
| `--dry-run` | 10 | 0(would-update 10) | 0 | 0 | 0 |
| `--apply` ① | 10 | **10** | 0 | 0 | 0 |
| `--apply` ②（幂等） | 10 | 0 | **10** | 0 | 0 |

DB 写入：10 × `question_items.answer`（legacy 下标排列 → 契约对象）+ 10 × `question_sets.qa_flags`
（删 `scoring_not_ready`、加 `scoringContract:'accepted_sequence_exact'`）。**不改 status（保持 draft）。**

## 守卫升级（三个显式拒因，客户端 + RPC 对齐）

| 拒因 | 触发条件 | 实现 |
|---|---|---|
| `build_sentence_scoring_not_ready` | `qa_flags.scoring_not_ready===true` 且 task=build_a_sentence | `promote-question-sets-v2.ts`（原 generic `scoring_not_ready` 细化） |
| `accepted_sequences_missing` | answer 缺失或仍是 legacy 数组 | 客户端 + RPC SQL |
| `accepted_sequence_invalid` | answer 是对象但形状非法（scoring/official/canonical/长度不齐等） | 客户端 + RPC SQL |

RPC SQL（`supabase/sql/p5-question-bank-promotion-rpc.sql`）：`multi_blank` 非空数组检查豁免
build_a_sentence 的对象 answer（不静默放行——紧接专用块全字段校验）；新增 build_a_sentence 专用校验块。
**待 owner 在 Supabase 重新应用后**，跑 `npx tsx scripts/validate-promotion-rpc.ts` 复核。

## Promote dry-run 证据

```
promote DRY-RUN [task=build_a_sentence limit=10]
candidates 10 · eligible 10 · promoted 0 · reasonCounts {}
```

## Validation

| Command | Exit |
|---|---|
| `npm run qa:qsets-v2` | 0 |
| `npx tsx scripts/promote-question-sets-v2.ts --task=build_a_sentence --limit=10`（dry-run） | 0（10/10 eligible） |
| `npm run validate:qbank-v2` | 0（active 2854/4684 不变） |
| `npm run validate:practice-session` | 0 |
| `npm run validate:papers` | 0（assertToeflMockV1 过） |
| `npm run smoke:papers` | 0（toefl full 3 区，无 build_a_sentence） |
| `npm run lint` | 0（两次瞬时失败系外部进程在仓库根创建/删除临时文件与 eslint 枚举竞态，`_tmp_sample.cjs`/`_dictcheck_tmp.ts`/`__probe2.ts`；等待后重跑干净） |
| `npx tsc --noEmit --incremental false` | 0 |

## Stop/Go 建议

**GO（activation-ready）**。实际激活（promote 10 行 → active 专项可练）前需：
① owner 在 Supabase 应用更新后的 RPC SQL；② `validate-promotion-rpc.ts` 复核；③ owner 对该批 promote 的明确批准。
即便激活，mock v1 仍排除该任务（需另行明确批准才进卷）。
