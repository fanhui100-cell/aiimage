# Word-Universe 答案位置：当前状态澄清 + 守卫脚本（P2）

- 日期：2026-07-01
- 触发：复审反馈「active 60 答案位置严重偏斜，P1 未修，已进入 active」。
- 本报告：用独立守卫脚本 + DB 实查澄清当前真实状态，并交付复审 P2 要求的「答案位置分布检查」守卫。

---

## 1. 关键澄清：当前 wu-pz 没有 active、draft 已均衡

复审实查显示 active 60 偏斜（synonym 偏 B、confusable 偏 A）+ weather active/xenon draft。**这是上一轮（首批 promote）之后、本人回退轮之前的过时快照**。当前真实状态（本轮 DB 实查 + 守卫脚本双重确认）：

```
answer-position audit · stage=wu-pz-2026-07-01 · max-share=0.40
  ✓ draft|confusable_choice: A10/B10/C10/D10 (n=40, 最高位占比 25%)
  ✓ draft|def_to_word:       A10/B10/C10/D10 (n=40, 最高位占比 25%)
  ✓ draft|synonym_choice:    A10/B10/C10/D10 (n=40, 最高位占比 25%)
全部均衡（无单位置超 40%）
```

- wu-pz **active = 0**（守卫脚本 --status=active 无任何分组数据）。
- wu-pz **draft = 120**，三型答案位置均 **A10/B10/C10/D10**（最高位 25%，理想均衡）。

即：**没有偏斜的 active 题，draft 已均衡。** 复审担心的"偏斜进入 active"在当前 DB 不成立。

---

## 2. 时间线（解释快照差异）

| 轮次 | 动作 | wu-pz 结果 |
|---|---|---|
| 首批 promote 轮 | 选 60 promote（含 xenon 误读修正） | **60 active（偏斜）** + 60 draft |
| ← 复审本条消息实查点 | 看到 60 active 偏斜、weather active | （此快照） |
| 回退+重排轮（本人已完成，见 [word-universe-rebalance-2026-07-01.md](word-universe-rebalance-2026-07-01.md)） | 回退 60 active→draft；重排全 120 → A10/B10/C10/D10 | **0 active / 120 draft 均衡** |
| 本轮 | 守卫脚本 + 实查确认 | 0 active / 120 draft 均衡 ✓ |

复审的 active 60 偏斜实查，是回退轮**之前**的状态；回退轮已把这 60 条（带偏斜）退回 draft 并连同其余 60 一起重排均衡。**P1 实质已解决。**

---

## 3. 交付复审 P2：答案位置分布守卫（补 QA 盲区）

复审指出现有 QA 不拦截「答案位置偏斜」。新增 [scripts/audit-answer-position.ts](../scripts/audit-answer-position.ts)：
- 按 `stage × status × task_type` 统计 choice 题答案位置 A/B/C/D 分布；
- 单位置占比超阈值（默认 40%，4 选理想 25%）即判偏斜，**退出码 1**；
- 可作 promote 后守卫 / 报告步骤（`--status=active` 专查上线题）。

用法：`npx tsx scripts/audit-answer-position.ts --stage=wu-pz-2026-07-01 [--status=active] [--max-share=0.45]`

建议：下次 promote 后将本守卫纳入 spotcheck，active 偏斜则拦截。

---

## 4. 回应复审其余意见

- **P2｜--ids 需程序化选 id**：完全认同。上轮 xenon/weather 手抄 UUID 误读证明人工清单高风险。下批 promote 候选将由脚本按 `(stage, task_type, word)` 程序化生成 set id，不再手抄。本轮不 promote，故未涉及。
- **P2｜hash 偏粗 / 字母 k 缺 / a-b 仍 qb**：已在前序报告记录，列为后续补点。

---

## 5. 门禁（全部 exit 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0（含新守卫脚本，TSC-CLEAN） |
| `npm run lint` | 0 |
| `npm run validate:qbank-v2` | 0（active 1993 · items 3173 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npx tsx scripts/audit-answer-position.ts --stage=wu-pz-2026-07-01` | 0（三型均衡 25%） |

---

## 6. 结论 / 下一步

- **当前 DB 状态**：wu-pz 全 120 draft、三型答案位置 A10/B10/C10/D10 均衡、0 active；active 总数 1993（已回退首批）。
- **P1 答案偏斜已解决**（回退轮完成 + 本轮守卫脚本独立证实）；偏斜的 active 不复存在。
- **P2 守卫脚本已交付**（补 QA 盲区）。
- **不进入第二批 promote**。停下交 Codex 复审；确认后再进入小批 promote，届时：候选 id 程序化生成（不手抄）、跨字母分层、人工抽查、promote 后跑答案位置守卫（active 偏斜即拦截）。

> 若复审希望首批这批均衡题最终进入 active：那是一次新的小批 promote（当前 draft 已均衡，可安全 promote），请在复审确认后我再执行——本轮严格遵守"不进入第二批/不自行 promote"。
