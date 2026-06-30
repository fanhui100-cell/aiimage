# Word-Universe 选项重排（消除答案位置偏斜）报告

- 日期：2026-07-01
- 触发：复审 P1 —— Claude 撰写的 wu-pz-2026-07-01 这批答案位置严重偏斜（def 偏 B、synonym 偏 B、confusable 偏 A），直接上线会露规律。
- 本轮动作：① 回退上轮误上线的 60 active→draft；② 对全 120 draft 重排 choices 均衡 A/B/C/D；③ 验证收敛 + 门禁。**未重新 promote**（交复审确认后再做）。

| 项 | 值 |
|---|---|
| 是否写库 | **是**：60 active→draft 回退；120 draft 的 choices/answer 重排（不改题干/语义/target/status） |
| 新增脚本 | `scripts/rebalance-wu-choices.ts`（确定性、幂等、只改 choices+answer） |
| active 变化 | 2053 → **1993**（回退 60；wu-pz 现 0 active / 120 draft） |

---

## 1. 回退已 promote 的 60（按复审授权）

复审实查显示 wu-pz active=0，但实际上轮首批已 promote 60（带未修 P1 偏斜）。经确认按"promote 前必须先修偏斜"，将这 60 条（set+item）回退 draft：active 2053→1993、wu_active=0、wu_draft=120、无 active-set/draft-item 不一致。

---

## 2. 重排：答案位置偏斜 → 均衡

`rebalance-wu-choices.ts` 对每题型按 set_id 排序，序号 % 4 决定答案目标位置；干扰项按文本字母序填充。**只改 question_items.choices 顺序与 answer 字母**。

| 题型 | before | after |
|---|---|---|
| def_to_word | A3 / B28 / C7 / D2 | **A10 / B10 / C10 / D10** |
| synonym_choice | A3 / B37 / C0 / D0 | **A10 / B10 / C10 / D10** |
| confusable_choice | A38 / B2 / C0 / D0 | **A10 / B10 / C10 / D10** |

apply：rows 120 · changed 118（2 条原本已在目标位）。

---

## 3. 收敛证明（幂等）

apply 后再次 dry-run：**rows 120 · changed 0**，三型 before=after=A10/B10/C10/D10 —— 证明重排已收敛、再次运行不产生任何改动。

---

## 4. 重排正确性验证（DB 实查，120 条）

| 校验 | 结果 |
|---|---|
| answer 仍命中某 choice id | 0 不命中 ✓ |
| choices 恰 4 且文本无重复 | 0 坏 ✓ |
| def/confusable 的答案词仍 = target word（证明只换位置未改答案词） | 0 改变 ✓ |
| status 仍全 draft（重排未碰 status） | 0 非 draft ✓ |

即：选项文本集合不变、答案词不变、题干/释义/target/status 不变，仅答案位置由偏斜变均衡。

---

## 5. 门禁（全部 exit 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0（TSC-CLEAN） |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:qbank-v2` | 0（active 1993 · items 3173 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |

---

## 6. 对复审其余意见的处理

- **P2｜导入器 legacy hash 偏粗**（`hashId(taskType|word|examId)`）：已记录。当前"每词每型 1 题"无碰撞；后续若同词多版本，建议改为含 stage 或 prompt/choices hash。本轮未改导入器（不影响已入库数据）。
- **P2｜字母覆盖未闭环**：k 仍缺；a/b 仍为旧 qb 来源。列为后续补点（补 k + 用 gen 替换/补充 a/b）。
- **P3｜偏宽同义/库外词**：quaint→charming、resilient→tough、xeric/xenophobic/xenophobia 等，上轮抽检已标 REVIEW 或仅作补字母；**这些不在首批 promote 候选**。promote 前会再确认是否符合 TOEFL 词表策略。

---

## 7. 状态与下一步

- 当前：wu-pz 全 120 draft，答案位置三型均 A10/B10/C10/D10；active 1993（已回退）。
- **未重新 promote**。重排已完成、收敛证明、门禁全绿，具备 promote 条件。
- 鉴于近两轮发现的两个我的失误（答案偏斜、上轮 xenon id 误读），**就此停下交 Codex 复审**重排结果；复审确认后再进入小批 promote。
- 小批 promote 时的改进：候选 id 改为按 `(stage, task_type, word)` 程序化选取（不再手抄），跨字母分层 + 人工抽查后 apply。

**结论**：P1 答案位置偏斜已修复并验证收敛；回退了带偏斜的 60 active。当前全 draft、均衡、门禁绿。停止，交复审，不自行 promote。
