# Word-Universe 首批小批 promote 报告

- 日期：2026-07-01
- 范围：从上一阶段 Claude 原创（`gen:`）word-universe draft 中，选最稳的一小批上线 active。
- 边界遵守：未调 DeepSeek、未 promote `qb:`/migrated_v1/blocked/听力口语篇章/退役题；未改前端/schema/限流；未批量上线；每型 ≤20、总 ≤60。

| 项 | 值 |
|---|---|
| 是否写库 | **是**：promote 60 条 draft→active（set+item）；过程含一次自查修正（xenon→weather，见 §6） |
| promote 题型/数量 | def_to_word 20 + synonym_choice 20 + confusable_choice 20 = **60** |
| active 变化 | **1993 → 2053（+60）** |
| wu-pz draft 变化 | 补题后 120 → promote 后 **60** |
| 混入 qb 来源 | **否**（non_gen active = 0） |
| 混入退役题型 | **否**（deprecated active = 0） |
| blocked flag | **否**（scoring_not_ready active = 0） |
| active set 下挂 draft item | **否**（non_active_items = 0） |

---

## 1. 候选池（上一阶段 gen: 新增）

| 题型 | 候选池 | 全 draft | 全 gen: | 退役 | blocked | answer 命中 | 坏选项 |
|---|---|---|---|---|---|---|---|
| def_to_word | 40 | ✓ | ✓ | 0 | 0 | 40/40 | 0 |
| synonym_choice | 40 | ✓ | ✓ | 0 | 0 | 40/40 | 0 |
| confusable_choice | 40 | ✓ | ✓ | 0 | 0 | 40/40 | 0 |

字母分布：a/b 为现有 qb；本批 gen 覆盖 c–z，p–z 每字母 ≥2。

---

## 2. 首批挑选（每型 20，全部 p–z）

跨字母分层、优先 p–z（之前完全缺失）、同首字母 ≤2、无重复词、不选边界/弱干扰/多解。

- **def_to_word(20)**：pragmatic, prudent, quaint, quell, resilient, reticent, scrupulous, sporadic, tenacious, transient, ubiquitous, unprecedented, versatile, volatile, wane, wary, xenophobic, yearn, yield, zenith
- **synonym_choice(20)**：pragmatic, prolific, prudent, quell, resilient, reticent, scrupulous, sporadic, tenacious, transient, ubiquitous, versatile, volatile, wane, wary, xenophobic, yearn, yield, zealous, zenith
- **confusable_choice(20)**：persecute, precede, quiet, quote, rational, recede, sensible, stationary, thorough, tortuous, unanimous, urban, vocation, wander, weather, xenophobia, yearn, yoke, zeal, zenith

代表性 legacy_id：`gen:def_to_word:set:claude:*`、`gen:synonym_choice:set:claude:*`、`gen:confusable_choice:set:claude:*`（全 `gen:` / Claude 原创）。

---

## 3. 人工抽检结论（逐条）

| 题型 | PASS | REVIEW（排除，未上线） | REJECT |
|---|---|---|---|
| def_to_word | 39 | 1：xeric（生僻专业生态词、word_id 不在库） | 0 |
| synonym_choice | 37 | 3：quaint→charming（语义松）、unprecedented→unparalleled（语义偏移）、xeric→arid（生僻） | 0 |
| confusable_choice | 38 | 2：veracious（生僻低频）、xenon（整组生僻科学词） | 0 |

抽检维度：
- def_to_word：释义准确、唯一答案、干扰同词性/语义域、无送分、释义不过宽多解 → 选中 20 全 PASS。
- synonym_choice：同义关系强（非 loose）、干扰非同义、唯一 → 排除语义偏松/偏移项。
- confusable_choice：易混词真易混（多为经典混淆对）、题干能区分、唯一、干扰非无关、解释含区分点 → 排除生僻整组。

REVIEW 项仍留在 draft（未上线），待返工或弃用。

---

## 4. dry-run（显式 set id，每型单跑）

为避免按 task_type 宽泛一把抓，给 promote 脚本加 `--ids`（显式 set uuid）。三型：

| 题型 | candidates | eligible | rejected |
|---|---|---|---|
| def_to_word | 20 | 20 | 0 |
| synonym_choice | 20 | 20 | 0 |
| confusable_choice | 20 | 20 | 0 |

---

## 5. apply 小批 + 复查

每型单独 `--apply`（走服务端 RPC `promote_question_sets_v2` 二次权威校验）：def 20 / syn 20 / conf 20，均 `promoted=N, rejected=0`。

复查（SQL）：active 1993→2053(+60)、def/syn/conf 各 active 20、wu-pz draft 60、**non_gen=0 / deprecated=0 / non_active_items=0 / blocked=0**；active 词清单与人工 PASS 清单逐字一致。

---

## 6. 执行偏差与修正（诚实记录）

- **问题**：整理 confusable id 清单时，误把 `xenon` 的 set_id（`163ad43b`）当作 `weather` 写入候选，导致首批**误 promote xenon（抽检 REVIEW）、漏 weather（PASS）**。
- **发现**：第 7 步 active 服务抽查（spotcheck）抽到 confusable “氙 xenon”，与 PASS 清单不符。
- **修正**：SQL 将 xenon（set+item）撤回 `draft`；用 promote 脚本补 apply `weather`（`1704befb`，dry-run 1/1/0 → promoted 1）。
- **修正后**：confusable active 20 严格等于 PASS 清单（含 weather、不含 xenon）；active 总数仍 2053；xenon 回 draft、item 同步 draft（无 active-set/draft-item 不一致）。修正涉及 DB 改动后重跑 qbank-v2 / qa:qsets-v2 / practice-session / spotcheck 均 exit 0。
- **根因/改进**：`--ids` 依赖人工手抄清单，易 id 误读。建议下批由脚本按 `(stage, task_type, word)` 程序化取 id，避免手抄。

---

## 7. 回归验证（命令 + 退出码，全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0（TSC-CLEAN） |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0（污染 0/56602） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:qbank-v2` | 0（active sets 2053 · items 3233 · 错误 0） |
| `npm run validate:practice-session` | 0 |
| `npm run validate:papers` | 0（smoke 门禁；未跑 papers:full） |
| `npm run smoke:active-serve` | 0（PASS） |
| `npm run audit:qbank-v2-coverage` | 0（sets 5743 · draft 3690 · active 2053） |
| `npx tsx scripts/spotcheck-wu-promote.ts` | 0 |

---

## 8. /api/practice/session 抽查（buildPracticeSession，每型 5）

- def_to_word：source=v2、items=5、全部无 stimulus、prompt+4choices+answer 完整。
- synonym_choice：source=v2、items=5、无 stimulus、字段完整。
- confusable_choice：source=v2、items=5、无 stimulus、字段完整（修正后不再出现 xenon）。

说明：word-universe 为 choice 题、无 stimulus，不存在 transcript/材料泄露面；answer 作为学习模式即时反馈下发，符合现有「学习模式安全级」说明（防作弊考试走 /api/papers 服务端判分）。

---

## 9. 残留问题 / 下一步

- **字母 k** 仍无 word-universe 题（gen 与 qb 均 0）——后续补点。
- a/b 仍为 qb(DeepSeek) 来源，本批未触及。
- REVIEW 项（xeric/veracious/xenon/quaint→charming/unprecedented→unparalleled）仍在 draft，需返工或弃用。
- 首批 60 全为 p–z；c–o 的 gen 题尚未上线，可作第二批。
- **是否进入第二批**：**暂缓**。先交 Codex 复审本批。复审通过后，第二批建议：覆盖 c–o + 补 k，并改进 id 选取（脚本按 word 程序化取 id，避免手抄误读）。

---

## 10. 停止条件核对

| 停止条件 | 是否触发 |
|---|---|
| 候选混入 qb: | 否 |
| 候选混入退役题型 | 否 |
| answer 不在 choices | 否 |
| 多解 | 否 |
| 明显错词/错义 | 否（xenon 非错题，但属 REVIEW 误选，已自查撤回） |
| dry-run rejected > 0 | 否 |
| apply 后 active 数不对 | 否（2053 正确） |
| item/set 状态不一致 | 否 |
| validate/qbank/qa 失败 | 否 |
| 需改 schema/前端/限流 | 否 |

**结论**：首批 60（每型 20，全 p–z）已干净上线 active，门禁全绿、服务抽查通过；执行中一次 id 误读已自查修正。**就此停止，交 Codex 复审，不进入第二批。**
