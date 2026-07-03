# Word-Universe TOEFL L6 扩容 —— 小批 promote 报告

- 日期：2026-07-01
- 范围：stage=wu-toefl-l6-expansion-2026-07-01 / gen: Claude 原创 / def_to_word·synonym_choice·confusable_choice / 每型 ≤20、总 60。
- 选 id：**程序化** `promote --words --stage --task`，零手抄 UUID。
- 边界：只 promote gen:/original_authored/claude；未碰 qb/migrated/blocked/退役；全 toefl L6；未生成新题、未调 DeepSeek、未改前端/schema/音频/路由。

## 1. 是否写库

**是，draft→active**：本批 60 条（每型 20）draft→active。

## 2. promote 总数与 active 变化

- promote：def_to_word 20 + synonym_choice 20 + confusable_choice 20 = **60**。
- active 总数：**2164 → 2224（+60）**。
- wu-toefl-l6-expansion：active 60 / draft 30（90-60）。
- active word-universe（gen）：171 → **231**（def/synonym/confusable 各 77）。

## 3. 每型 promote 词表（全 PASS）

- **def_to_word（20）**：gauge, germinate, haphazard, hinder, hoard, imminent, inept, intricate, jolt, jovial, lucrative, mitigate, mundane, notorious, novice, obscure, obstinate, profound, rigorous, tangible
- **synonym_choice（20）**：germinate, haphazard, hinder, imminent, inept, intricate, jolt, jovial, lucrative, meager, mitigate, mundane, notorious, novice, obscure, obstinate, profound, rigorous, scarce, tangible
- **confusable_choice（20）**：cite, compliment, discreet, dual, elicit, elude, eminent, envelop, flaunt, formally, grate, hoarse, idle, incite, mediate, morale, prophecy, rein, summit, temporal

## 4. 人工内容复核

对 60 条逐条复核，结论 **PASS 60 / REVIEW 0 / REJECT 0**。重点：
- **def_to_word**：释义唯一、干扰同词性且不吃题干（如 mitigate→[mitigate/aggravate/provoke/sustain]、obstinate→[obstinate/compliant/docile/timid]）。
- **synonym_choice**：均强同义（germinate→sprout、imminent→impending、mitigate→alleviate、obscure→vague、profound→deep、rigorous→strict），无 loose synonym（已排除 §5 的 4 项）。
- **confusable_choice**：均真形近/音近易混，且无第二选项满足题干；`eminent`（干扰 immanent/imminent/permanent，均不表「著名」）与 `envelop`（干扰 develop/envelope/envision，均不表「包围」）为上一轮已修的双答案题，本次复核确认单答案。
- 全部 answer 命中 choices、4 选无重复、无生僻到不适合 L6 的词。

## 5. 被排除的 P2 边界项（仍 draft，未上线）

| 题型 | 边界项 | 排除原因 |
|---|---|---|
| synonym_choice | gauge → measure | gauge 偏「估量/判断」，measure 更泛，非最强同义 |
| synonym_choice | grim → harsh | 可通但非最强同义 |
| synonym_choice | linger → remain | remain 太泛，缺 linger「逗留/迟迟不去」意味 |
| synonym_choice | plausible → credible | 复审点名再看；虽词典多为强同义，但遵循「不确定留 draft」保守排除 |

- 因排除 4 项，synonym 候选池为 26，**只 promote 20 通过复核项，未凑边界题**。
- DB 复查 `p2_in_active = 0`（4 项均未上线）。

## 6. dry-run / apply

| 题型 | 解析 id | dry-run candidates/eligible/rejected | apply promoted |
|---|---|---|---|
| def_to_word | 20 | 20 / 20 / 0 | 20 |
| synonym_choice | 20 | 20 / 20 / 0 | 20 |
| confusable_choice | 20 | 20 / 20 / 0 | 20 |

## 7. active 答案位置分布（守卫）

```
✓ active|confusable_choice: A5/B5/C4/D6 (n=20, 30%)
✓ active|def_to_word:       A4/B5/C5/D6 (n=20, 30%)
✓ active|synonym_choice:    A7/B3/C3/D7 (n=20, 35%)
全部均衡（无单位置超 40%）   guard EXIT 0
```

- 三型最高位 30–35% < 40%，**未做 rebalance**（子集叠加即达标，无需重排；answer_word_changed 无需变动）。

## 8. 来源 / 状态检查（DB 实查）

| 项 | 值 |
|---|---|
| active_total | 2224 |
| l6 active / draft | 60 / 30 |
| active 三型 | def 20 / synonym 20 / confusable 20 |
| non_gen | 0 |
| qb（active word-universe） | 0（audit:wu-source） |
| deprecated | 0 |
| blocked | 0 |
| non_active_items | 0 |
| p2_in_active | 0 |

## 9. 所有验证命令 exit code

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2224 · items 3404 · 错误 0） |
| `npm run qa:qsets-v2` | 0（首跑进程崩溃码 0xC0000409，属 Windows tsx/node 退出噪音；**重跑错误 0 / exit 0**，逻辑正常） |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npm run audit:wu-source` | 0（active 全 gen / qb 0 / badProvenance 0） |
| `npm run validate:wu-promote-guards` | 0（PASS） |

## 10. 下一步建议（不执行）

- 本批 60 已上线；wu-toefl-l6-expansion 余 30 draft（含 4 个 P2 + 26 未选 PASS）。
- 若继续：可先对 4 个 P2 边界项单独返修（改更强同义或换题干）再考虑上线；其余未选 PASS 可作下一小批。
- 也可转向 SAT L7 pilot（见 gen-expansion-plan）。
- **本轮未 commit（按用户要求）；未进入下一批。** 停下交 Codex 复审。
