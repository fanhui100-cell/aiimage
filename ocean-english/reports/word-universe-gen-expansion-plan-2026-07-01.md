# Word-Universe gen 扩容计划

- 日期：2026-07-01
- 性质：**计划文档，不自动生成下一批**。等用户确认后再执行。

## 1. 当前 gen active 覆盖

- **171 active**（def_to_word / synonym_choice / confusable_choice 各 57）。
- **字母**：a–z 全覆盖（含 k19、p–z、c–o）。
- **exam/level**：**仅 toefl / level 6**。
- 另有少量 gen draft（wu-pz + wu-abk 未 promote 的 PASS + REVIEW 边界项）可继续小批 promote。

## 2. 可扩方向

| 方向 | 说明 | 词表可复用性 |
|---|---|---|
| A. 继续扩 toefl / level 6 | 每型从 57 扩到 ~100 active，加深覆盖（更多学术/campus/science 词） | 直接续写 toefl 词 |
| B. 扩 SAT / level 7 | academic / test-like 高阶词（SAT R&W 词汇） | 需选 SAT 级词，**不可直接复用 toefl 词**（难度/考纲不同） |
| C. 扩 IELTS / level 8 | 需先确认 IELTS 词库/定位（IELTS 现为 coming_soon 学习档） | 待 IELTS 词库/定位确认后再做 |
| D. 扩 中考/高考/CET/考研 | 按对应等级（1–5）重写 | **不可直接复用 TOEFL 词**；须按各等级词表与难度重出 |

## 3. 推荐下一批（二选一）

| 选项 | 内容 | 优先级 | 风险 | 人工审查 |
|---|---|---|---|---|
| ① SAT L7 pilot | 每型 30 draft（academic/test-like SAT 词），先不 promote | 中 | 中：SAT 词更难，需避免生僻/GRE 级；confusable 的 SAT 级形近对较难凑 | 每型抽 ≥10，重点看难度是否 SAT 级、synonym 不松、confusable 真易混 |
| ② TOEFL L6 续补 | 每型再补 30 draft（继续 toefl L6），加深现有覆盖 | 高 | 低：与现有同级同源，质量把控成熟 | 每型抽 ≥10，避免与已有 60 active 词重复 |

- **推荐先做 ②（TOEFL L6 续补）**：风险最低、与现有 active 同级、可快速扩大 toefl word-universe 题量到每型 ~90；同时保持全程 gen 原创 + 答案位置均衡 + 程序化 promote 流程。
- ① SAT L7 pilot 可作第二优先，验证跨等级出题质量后再规模化。
- C（IELTS）/D（中考–考研）暂缓，待词库/定位确认。

## 4. 执行前提（无论哪批）

1. 全程 Claude 原创（gen:），不调 DeepSeek、不抄真题。
2. 沿用管线：撰写 JSON → import dry-run/apply draft → rebalance 均衡 → 守卫 → 回归。
3. 写入必带 `qa_flags.source=original_authored / authored=claude / provider=claude-authored`（否则被 promote 门控 `word_universe_non_gen_source` 拒）。
4. promote 时程序化 `--words --stage --task` 选 id + 人工 PASS 抽查 + active 答案位置守卫。

## 5. 声明

**本阶段不生成任何新题、不 promote。** 仅出计划，等用户确认下一批方向后再执行。
