# Word-Universe 首批小批 promote（retry，程序化 id）报告

- 日期：2026-07-01
- 范围：stage=wu-pz-2026-07-01 / Claude 原创 gen: draft / def_to_word·synonym_choice·confusable_choice / 每型 ≤20、总 60。
- 关键改进：**禁止手抄 UUID**，按 (stage, task_type, word) 程序化解析 set id；active 答案位置均衡到 5/5/5/5。
- 边界：未碰 qb:/migrated_v1/退役/blocked/REVIEW 项；未改前端/schema/限流。
- 说明：本批 promote 已用此程序化方法执行（见前序 promote 报告），本报告按 retry 格式完整记录候选/排除/dry-run/apply/守卫/回归，并补做了 active 答案位置 5/5/5/5 均衡。

| 项 | 值 |
|---|---|
| 是否写库 | 是：promote 60 draft→active；active 20/型 重排至 A5/B5/C5/D5（只改选项顺序+answer 字母） |
| active 变化 | 1993 → **2053（+60）** |
| wu-pz | active 60 / draft 60 |
| 选 id 方式 | **程序化**：promote 脚本 `--words --stage --task`，内部 join target_words.surface 解析（零手抄 UUID） |

---

## 1. 候选池审计（DB 实查）

| 题型 | 候选池 draft | 全 draft | 全 gen: | 退役 | blocked | answer 命中 | 4选无重复 |
|---|---|---|---|---|---|---|---|
| def_to_word | 40 | ✓ | ✓ | 0 | 0 | ✓ | ✓ |
| synonym_choice | 40 | ✓ | ✓ | 0 | 0 | ✓ | ✓ |
| confusable_choice | 40 | ✓ | ✓ | 0 | 0 | ✓ | ✓ |

每题 target_words 恰 1、source=original_authored/authored=claude。

---

## 2. 排除清单（REVIEW，未进 promote）

| 题型 | 排除 | 原因 |
|---|---|---|
| synonym_choice | quaint→charming | 语义偏松 |
| synonym_choice | unprecedented→unparalleled | 语义偏移（史无前例≠无与伦比） |
| synonym_choice | xeric→arid | 生僻 |
| confusable_choice | xenon | 整组生僻科学词 |
| confusable_choice | veracious | 生僻低频 |
| def_to_word | xeric | 生僻、word_id 不在库 |

程序化核对：候选中 review 词命中数 = **0**。

---

## 3. 候选清单（active 60，按 answer position）

> 全部 PASS、gen: 原创、答案位置三型均 A5/B5/C5/D5。

### def_to_word（A5/B5/C5/D5）
| pos | words |
|---|---|
| A | scrupulous, sporadic, unprecedented, versatile, yearn |
| B | prudent, ubiquitous, volatile, xenophobic, yield |
| C | pragmatic, quaint, quell, reticent, zenith |
| D | resilient, tenacious, transient, wane, wary |

### synonym_choice（A5/B5/C5/D5；answer=同义词）
| pos | word→answer |
|---|---|
| A | pragmatic→practical, prolific→productive, scrupulous→meticulous, sporadic→occasional, volatile→unstable |
| B | prudent→cautious, quell→suppress, reticent→reserved, tenacious→persistent, wary→cautious |
| C | resilient→tough, versatile→adaptable, wane→diminish, yield→surrender, zenith→peak |
| D | transient→fleeting, ubiquitous→omnipresent, xenophobic→intolerant, yearn→long, zealous→fervent |

### confusable_choice（A5/B5/C5/D5）
| pos | words |
|---|---|
| A | rational, stationary, thorough, tortuous, unanimous |
| B | recede, wander, xenophobia, yearn, zeal |
| C | quote, sensible, urban, vocation, weather |
| D | persecute, precede, quiet, yoke, zenith |

（含 weather、不含 xenon；含 def/syn 的 quaint/unprecedented 是 def 题型 PASS，非被排除的 synonym 版本。set_id 完整映射见 `reports/word-universe-first-promote-2026-07-01.json` 及 DB。）

字母覆盖：60 条全部 p–z（每型跨 p,q,r,s,t,u,v,w,x,y,z），同一首字母不超 3。

---

## 4. 人工抽查

逐条标注（上轮已抽检 + 本轮程序化核对）：def 39PASS/1REVIEW、synonym 37PASS/3REVIEW、confusable 38PASS/2REVIEW；**只 PASS 进 promote**。维度：释义/同义/易混准确、唯一答案、干扰同词性/语义域或真形近、无多解、中文释义准确。REVIEW 项见 §2，全部留 draft。

---

## 5. promote dry-run / apply（程序化 --words）

| 题型 | 解析 id | dry-run candidates/eligible/rejected | apply promoted |
|---|---|---|---|
| def_to_word | 20 | 20 / 20 / 0 | 20 |
| synonym_choice | 20 | 20 / 20 / 0 | 20 |
| confusable_choice | 20 | 20 / 20 / 0 | 20 |

每型单独 apply，走服务端 RPC `promote_question_sets_v2` 二次权威校验。

---

## 6. apply 后 active 守卫

- wu-pz active = **60**，三型各 **20** ✓
- active 中 REVIEW 项 = 0 ✓
- **答案位置均衡**（`audit-answer-position.ts --status=active`）：

```
✓ active|confusable_choice: A5/B5/C5/D5 (n=20, 最高位占比 25%)
✓ active|def_to_word:       A5/B5/C5/D5 (n=20, 最高位占比 25%)
✓ active|synonym_choice:    A5/B5/C5/D5 (n=20, 最高位占比 25%)
全部均衡（无单位置超 40%）   EXIT 0
```

> 达成 5/5/5/5 的方法：active 20 子集继承全 40 均衡后初始为最高位 40%（过守卫但非理想），故对 active 20 做局部重排（`rebalance-wu-choices.ts --status=active`，只改选项顺序+answer 字母）→ A5/B5/C5/D5；apply 后再 dry-run **changed 0**（收敛）；实查 answer 仍命中、def/conf 答案词仍=target（0 改变，语义未动）、全 active、non_gen=0、blocked=0、non_active_items=0。

---

## 7. 回归（命令 + 退出码，全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2053 · items 3233 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run validate:papers` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npx tsx scripts/spotcheck-wu-promote.ts` | 0（三型各抽 5，source=v2、无 stimulus 泄露、字段完整） |
| `npx tsx scripts/audit-answer-position.ts --status=active` | 0（三型 A5/B5/C5/D5） |

---

## 8. 结论 / 下一步

- 首批 60（每型 20，全 p–z、全 PASS、全 gen: 原创）已上线 active；**答案位置三型均 A5/B5/C5/D5（25%）**；REVIEW 项零混入；来源/状态/语义全部干净；回归 + 守卫全绿。
- **选 id 全程程序化**（`--words` 按 word 解析），杜绝上轮 UUID 手抄误读。
- **不进入第二批**。停下交 Codex 复审。后续第二批可覆盖 c–o 字母 + 补 k，沿用程序化选 id + active 答案位置守卫。
