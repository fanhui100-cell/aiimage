# Word-Universe TOEFL L6 扩容补题报告（gen draft）

- 日期：2026-07-01
- 目标：为 TOEFL level 6 续补 Claude 原创 word-universe 题；三型各 +30，共 90 draft。
- **未 promote、未 active、未调用 DeepSeek、未改前端/schema/限流。** 全部写 draft，交 Codex 复审。

## 1. 是否写库

**是，只写 draft**：90 条 question_sets + 90 items + 90 target_words，全部 status=draft、`gen:` + `qa_flags.source=original_authored/authored=claude/provider=claude-authored`。active=0。

## 2. 新增文件

- `data/generated-question-sets/wu-toefl-l6-expansion-2026-07-01/def_to_word.json`
- `data/generated-question-sets/wu-toefl-l6-expansion-2026-07-01/synonym_choice.json`
- `data/generated-question-sets/wu-toefl-l6-expansion-2026-07-01/confusable_choice.json`
- `reports/word-universe-toefl-l6-expansion-2026-07-01.md`

stage = `wu-toefl-l6-expansion-2026-07-01`。

## 3. 每型新增数量

def_to_word 30 + synonym_choice 30 + confusable_choice 30 = **90**。

## 4. 字母覆盖分布（重点补薄弱字母）

| 题型 | 覆盖字母 |
|---|---|
| def_to_word | g,h,i,j,l,m,n,o,p,q,r,s,t,u,v（15） |
| synonym_choice | g,h,i,j,l,m,n,o,p,q,r,s,t,v（14） |
| confusable_choice | c,d,e,f,g,h,i,l,m,p,r,s,t,v,w（15） |

- 薄弱字母 **g/h/i/j/l/m/n/o 全部覆盖**；未再堆 a/b/k。

## 5. 与现有 gen target word 去重结果

**`dup_vs_existing_gen = 0`** —— 90 个新目标词（按题型）与现有 gen（wu-pz + wu-abk）**零重复**。撰写前已查现有 gen 词池并规避。

## 6. dry-run / apply / 幂等复跑

| 题型 | dry-run | apply | 幂等复跑 |
|---|---|---|---|
| def_to_word | ok 30 / reject 0 | wrote 30 | wrote 0 / dup-skip 30 |
| synonym_choice | ok 30 / reject 0 | wrote 30 | wrote 0 / dup-skip 30 |
| confusable_choice | ok 30 / reject 0 | wrote 30 | wrote 0 / dup-skip 30 |

## 7. rebalance 与 answer-position 守卫

- 撰写时答案默认首位（A30/B0/C0/D0），`rebalance --apply` 后：三型 **A8/B8/C7/D7**。
- re-dry-run **changed 0**（收敛）。
- `audit-answer-position --status=draft`：三型 A8/B8/C7/D7（最高位 27% < 40%），**exit 0**。
- 正确性实查：answer 仍命中、def/conf 答案词仍=target（answer_word_changed=0）、全 draft。

## 8. DB 实查结果

| 项 | 值 |
|---|---|
| sets / items / target_words | 90 / 90 / 90 |
| active / draft | 0 / 90 |
| 三型 | def 30 / synonym 30 / confusable 30 |
| answer 不在 choices | 0 |
| choices≠4 或重复 | 0 |
| non_gen | 0 |
| deprecated | 0 |
| blocked | 0 |
| word_id null | **0** |
| dup_vs_existing_gen | **0** |

## 9. word_id null 清单

**0 条** —— 全部 90 目标词均在 dictionary_words（含 germinate/haphazard/lucrative/obstinate/eminent/elicit/discreet/temporal 等）。无「常见词在库却 null」异常。

## 10. PASS / REVIEW / REJECT

- **PASS = 90（全部）；REVIEW = 0；REJECT = 0**。
- 逐条自审：答案唯一、def 干扰同词性/语义域接近不送分、synonym 强同义（非 loose）、confusable 真易混（拼写/同音/派生近似）、释义准确、TOEFL L6 合理。

## 11. 代表性样本（TOEFL L6 合理性）

| 题型 | 样本 | 为何符合 L6 |
|---|---|---|
| def | mitigate 减轻→[mitigate/aggravate/provoke/sustain] | 学术/讲座高频动词，干扰同为 v 且语义邻域 |
| def | plausible 貌似合理→[plausible/absurd/dubious/flawless] | 论证/推理核心形容词 |
| def | rigorous 严格严谨→[rigorous/lenient/casual/vague] | 科研/学术描述高频 |
| syn | haphazard→random | 强同义，学术描述「随意/无序」 |
| syn | imminent→impending | 强同义，学术/新闻「逼近」 |
| syn | mitigate→alleviate | TOEFL 写作高频「减轻」 |
| conf | eminent / imminent / prominent / permanent | 经典 -minent 易混，词汇考点 |
| conf | elicit / illicit / explicit / solicit | 经典 -licit 易混 |
| conf | discreet / discrete / discredit / discard | 学术常见易混对 |
| conf | temporal / temporary / temperate / tempest | 学术易混 |

synonym 全部为强同义（如 obscure→vague、profound→deep、staunch→loyal），未使用 resilient→tough 一类偏宽关系。confusable 全部为真易混（同音/拼写/派生近似），无无关词凑数。

## 12. 所有命令 exit code（全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2164 不变，新题为 draft） |
| `npm run qa:qsets-v2` | 0（gen draft 2093→2183 = +90 纳入无错） |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npm run audit:wu-source` | 0（active 全 gen / qb 0 / badProvenance 0） |
| `npm run validate:wu-promote-guards` | 0（PASS） |
| import dry-run/apply/幂等 | reject 0 / wrote 90 / dup-skip 90 |
| `rebalance --apply` + re-dry-run | changed 87 → 0（收敛） |

## 13. 声明与下一步

- **未 promote、未 active、未调用 DeepSeek、未改前端/schema/限流。**
- wu-toefl-l6-expansion 90 draft 均衡就绪；`gen:`/original_authored，可被门控识别为可 promote 来源。
- 现 TOEFL L6 gen 池：active 171 + draft（wu-pz/wu-abk 剩余 + 本批 90）≈ 每型可 promote 空间充足。
- 下一步（等复审）：可从本批 PASS 程序化小批 promote（`--words --stage=wu-toefl-l6-expansion-2026-07-01`），或继续扩容 / SAT L7 pilot。**不自行进入 promote。**
