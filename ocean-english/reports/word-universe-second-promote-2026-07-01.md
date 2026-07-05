# Word-Universe 第二批小批 promote（c–o，程序化 id）报告

- 日期：2026-07-01
- 范围：stage=wu-pz-2026-07-01 / Claude 原创 gen: draft / def_to_word·synonym_choice·confusable_choice / 优先 c–o、试补 k。
- 选 id：**程序化** `promote --words --stage --task`（join target_words.surface），零手抄 UUID。
- 边界：未碰已 active 60、qb:/migrated_v1/退役/blocked/REVIEW 项；未改前端/schema/限流；未生成新题。

| 项 | 值 |
|---|---|
| 是否写库 | 是：promote 51 draft→active（每型 17） |
| active 变化 | 2053 → **2104（+51）** |
| wu-pz | active 60 → **111**（三型各 37）；draft 60 → **9** |
| 本批 promoted | def_to_word 17 + synonym_choice 17 + confusable_choice 17 = **51** |

---

## 1. 候选池统计（stage=wu-pz draft，promote 前）

| 题型 | draft 候选 | c–o PASS | REVIEW（排除） | 非-c-o p-z PASS（本批不取） | k |
|---|---|---|---|---|---|
| def_to_word | 20 | 17 | 1（xeric） | 2（prolific, zealous） | **0** |
| synonym_choice | 20 | 17 | 3（quaint→charming, unprecedented→unparalleled, xeric→arid） | 0 | **0** |
| confusable_choice | 20 | 17 | 2（xenon, veracious） | 1（principle） | **0** |

候选池健康：set/item 全 draft、answer 全命中、choices 恰 4 无重复、target_words 恰 1、非退役、非 blocked、全 gen:/original_authored/authored=claude。

> **k 字母仍缺（k=0）**：三型 draft 均无 k 开头目标词。按要求不硬造、不临时生成，明确报告 k=0。

---

## 2. 每型 PASS / REVIEW / REJECT

- **REJECT：0**（无答案错误 / answer 不在 choices / 多解）。
- **PASS（进 promote，各 17，全 c–o）**：
  - def_to_word：candid, cogent, diligent, dwindle, eloquent, elusive, frugal, gregarious, hamper, impeccable, indolent, jeopardize, lethargic, lucid, meticulous, nimble, obsolete
  - synonym_choice：candid→frank, cogent→persuasive, diligent→industrious, dwindle→shrink, earnest→sincere, eloquent→articulate, fervent→ardent, frugal→thrifty, gregarious→sociable, hamper→hinder, hostile→antagonistic, impeccable→flawless, jeopardize→endanger, lucid→clear, meticulous→careful, nimble→agile, obsolete→outdated
  - confusable_choice：complement, conscious, council, decent, desert, device, eligible, emigrate, flair, formerly, gorilla, hardy, ingenious, loose, moral, naval, official
- **REVIEW（排除，留 draft）**：def xeric；synonym quaint→charming / unprecedented→unparalleled / xeric→arid；confusable xenon / veracious。
  - 程序化核对：候选中 REVIEW 词命中 = 0；apply 后 active 中 REVIEW 项 = **0**。

---

## 3. c–o 覆盖 / k

- **def_to_word（17）**：c,d,e,f,g,h,i,j,l,m,n,o = **12 字母**（c–o，缺 k）
- **synonym_choice（17）**：c,d,e,f,g,h,i,j,l,m,n,o = **12 字母**
- **confusable_choice（17）**：c,d,e,f,g,h,i,l,m,n,o = **11 字母**（c–o，缺 j、k）
- **k：仍缺（0）** —— 池内无 k 词，本批未补；建议后续单独生成 k 字母 Claude 原创题再走 promote。

同一首字母不过度集中（多数 1–3 条/字母）。

---

## 4. dry-run / apply（程序化 --words）

| 题型 | 解析 id | dry-run candidates/eligible/rejected | apply promoted |
|---|---|---|---|
| def_to_word | 17 | 17 / 17 / 0 | 17 |
| synonym_choice | 17 | 17 / 17 / 0 | 17 |
| confusable_choice | 17 | 17 / 17 / 0 | 17 |

每型单独 apply，走服务端 RPC `promote_question_sets_v2` 二次权威校验。

---

## 5. apply 后 active 守卫

- wu-pz active 60 → **111**（三型各 **37** = 首批 20 + 本批 17）✓
- non_gen=0 / deprecated=0 / blocked=0 / non_active_items=0 / **review_in_active=0** ✓
- **答案位置分布**（`audit-answer-position --status=active`，每型 n=37）：

```
✓ active|confusable_choice: A10/B9/C7/D11 (最高位 30%)
✓ active|def_to_word:       A11/B7/C13/D6 (最高位 35%)
✓ active|synonym_choice:    A6/B10/C10/D11 (最高位 30%)
全部均衡（无单位置超 40%）   EXIT 0
```

> 首批 active 已是 5/5/5/5；本批 17 子集的位置叠加后，三型最高位 30–35% 均 < 40%，守卫通过，**无需对 active 重排**。

---

## 6. 服务抽查（buildPracticeSession，每型 5）

- def_to_word / synonym_choice / confusable_choice：source=v2、items=5、**无 stimulus 泄露**、prompt/choices/answer 字段完整。`spotcheck-wu-promote · 错误 0`。

---

## 7. 回归（命令 + 退出码，全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2104 · items 3284 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npx tsx scripts/spotcheck-wu-promote.ts` | 0 |
| `npx tsx scripts/audit-answer-position.ts --status=active` | 0（三型 < 40%） |

---

## 8. 结论 / 残留

- 第二批 **51 条 c–o**（每型 17，全 PASS、全 gen: 原创）已上线；wu-pz active 共 **111**（三型各 37）；答案位置守卫全过（< 40%）；REVIEW 零混入；来源/状态/语义干净；回归 + 服务抽查全绿。
- 选 id 全程**程序化**，无手抄 UUID。
- **残留**：
  - **k 仍缺（0）**：池内无 k 词，未硬造；需后续单独补 k 原创题。
  - draft 余 9 = 6 REVIEW（xeric×2 / quaint→charming / unprecedented→unparalleled / xenon / veracious）+ 3 非-c-o p-z PASS（prolific / zealous / principle，本批聚焦 c–o 未取）。
  - a/b 仍为旧 qb 来源（未触及）。
- **不进入第三批、不生成新题**。停下交 Codex 复审。
