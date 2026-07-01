# Word-Universe 第三批小批 promote（a/b/k，程序化 id）报告

- 日期：2026-07-01
- 范围：stage=wu-abk-2026-07-01 / Claude 原创 gen: draft / def_to_word·synonym_choice·confusable_choice / 每型 ≤20、总 60。
- 选 id：**程序化** `promote --words --stage --task`（join target_words.surface），零手抄 UUID。
- 边界：未碰 qb:/migrated_v1/退役/blocked；未生成新题；未改前端/schema/限流；未调 DeepSeek。

## 1. 是否写库

**是，draft→active**：本批 60 条（每型 20）draft→active。active 2104 → **2164（+60）**；wu-abk active **60**、draft **24**。

## 2. 每型 promote 数量

| 题型 | a | b | k | promoted |
|---|---|---|---|---|
| def_to_word | 7 | 7 | 6 | 20 |
| synonym_choice | 7 | 7 | 6 | 20 |
| confusable_choice | 7 | 6 | 7 | 20 |
| **合计** | **21** | **20** | **19** | **60** |

## 3. a / b / k 覆盖 —— k active 缺口已补

- **k active = 19**（def 6 + synonym 6 + confusable 7）：**k 字母首次进入 active，缺口已解决**（`has_k=1`）。
  - def k：keen, kindle, kinetic, kinship, knack, knit
  - synonym k：keen, kin, kindle, knack, knit, knotty
  - confusable k：kernel, kin, knack, knead, knight, knob, knot
- a active = 21、b active = 20。

## 4. PASS / REVIEW / REJECT

- **PASS（promote，60）**：见 §2/§3 词表。
- **REVIEW（未上线，留 draft；边界项）**：
  | 题型 | 词 | 原因 |
  |---|---|---|
  | synonym_choice | keep→retain | 偏基础（keep 过于常见，非 L6 挑战词） |
  | def_to_word | kidney | 偏普通器官名词 |
  | def_to_word | kingdom | 偏普通名词/学科边界 |
  | confusable_choice | baron | 低频/历史词 |
  | confusable_choice | bazaar | 低频/生活词 |
  | confusable_choice | berth | 低频（泊位/铺位） |
- **REJECT：0**。
- 其余未选入本批的 PASS 词（每型剩余）继续留 draft，可作后续批次。

## 5. 边界项处理结果

用户点名的 6 个边界项经人工复核后**全部判 REVIEW、未 promote、留 draft**：keep→retain（偏基础）、kidney/kingdom（偏普通）、baron/bazaar/berth（低频/生活历史）。active 中 `review_in_active=0` 已复核。

## 6. dry-run / apply

| 题型 | 解析 id | dry-run candidates/eligible/rejected | apply promoted |
|---|---|---|---|
| def_to_word | 20 | 20 / 20 / 0 | 20 |
| synonym_choice | 20 | 20 / 20 / 0 | 20 |
| confusable_choice | 20 | 20 / 20 / 0 | 20 |

每型单独 apply，走服务端 RPC `promote_question_sets_v2` 二次权威校验。

## 7. active 答案位置分布

```
✓ active|confusable_choice: A6/B5/C3/D6 (n=20, 最高位 30%)
✓ active|def_to_word:       A4/B6/C5/D5 (n=20, 最高位 30%)
✓ active|synonym_choice:    A6/B5/C5/D4 (n=20, 最高位 30%)
全部均衡（无单位置超 40%）   guard EXIT 0
```

> draft 已是 A7/B7/C7/D7；本批 20 子集叠加后三型最高位 30% < 40%，守卫通过，**无需对 active 重排**。

## 8. DB 实查

| 项 | 值 |
|---|---|
| active_total | 2164 |
| wu-abk active / draft | 60 / 24 |
| active 三型 | confusable 20 / def 20 / synonym 20 |
| non_gen | 0 |
| deprecated | 0 |
| blocked | 0 |
| non_active_items | 0 |
| review_in_active | 0 |

## 9. 服务抽查（buildPracticeSession，每型 5）

def_to_word / synonym_choice / confusable_choice：source=v2、items=5、**无 stimulus 泄露**、prompt/choices/answer 字段完整。`spotcheck-wu-promote · 错误 0`。

## 10. 所有命令 exit code（全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2164 · items 3344 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npx tsx scripts/spotcheck-wu-promote.ts` | 0 |
| `npx tsx scripts/audit-answer-position.ts --status=active` | 0（三型 < 40%） |

## 11. 声明 / 下一步

- **未生成新题、未调用 DeepSeek、未进入下一批。**
- 本批从既有 wu-abk draft 中程序化选 60 上线；**k 字母首次进入 active（19 条），k active 缺口解决**。
- wu-abk 仍余 24 draft（6 REVIEW 边界项 + 18 未选 PASS），可作后续批次。
- 三个 stage active 汇总：wu-pz 111 + wu-abk 60 = 171 条 gen: 原创 word-universe active（另 wu-pz 24 draft + wu-abk 24 draft）。
- 停下交 Codex 复审；如需继续，可复审后再从剩余 PASS + 其它字母继续小批 promote，并考虑 a/b 旧 qb→gen 迁移策略。
