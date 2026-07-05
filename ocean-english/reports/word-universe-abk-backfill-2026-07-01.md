# Word-Universe 第三阶段补题报告（k + a/b，Claude 原创 → draft）

- 日期：2026-07-01
- 目标：补 k 字母缺口、为 a/b 补 Claude 原创题（减少旧 qb 依赖）；三型各覆盖。
- **未 promote、未 active、未调用 DeepSeek、未抄真题/版权材料。** 全部写 draft，交 Codex 复审后再考虑第三批 promote。

---

## 1. 新增文件

- `data/generated-question-sets/wu-abk-2026-07-01/def_to_word.json`
- `data/generated-question-sets/wu-abk-2026-07-01/synonym_choice.json`
- `data/generated-question-sets/wu-abk-2026-07-01/confusable_choice.json`
- `reports/word-universe-abk-backfill-2026-07-01.md`（本文件）

stage = `wu-abk-2026-07-01`。

## 2. 是否写库

**是，只写 draft**：84 条 question_sets + 84 items + 84 target_words，全部 status=draft、legacy_id `gen:`、qa_flags `source=original_authored/authored=claude`。**active=0。**

## 3. 每型新增数量

| 题型 | a | b | k | 合计 |
|---|---|---|---|---|
| def_to_word | 10 | 10 | 8 | 28 |
| synonym_choice | 10 | 10 | 8 | 28 |
| confusable_choice | 10 | 10 | 8 | 28 |
| **合计** | **30** | **30** | **24** | **84** |

## 4. k / a / b 覆盖

- **k：24**（每型 8，达成 ≥24 目标）——k 字母缺口已补。
  - def k：keen, kindle, kinetic, kinship, knack, knit, kingdom, kidney
  - synonym k：keen, kindle, knack, keep, knit, kin, knotty, keenly
  - confusable k：knight, knot, knead, kernel, knack, kin, knob, kneel
- **a/b：60**（每型 20，达成 ≥60 目标）。
- 总新增 **84**（达成 ≥84 目标）。

## 5. dry-run / apply / 幂等

| 题型 | dry-run | apply | 幂等复跑 |
|---|---|---|---|
| def_to_word | ok 28 / reject 0 | wrote 28 | wrote 0 / dup-skip 28 |
| synonym_choice | ok 28 / reject 0 | wrote 28 | wrote 0 / dup-skip 28 |
| confusable_choice | ok 28 / reject 0 | wrote 28 | wrote 0 / dup-skip 28 |

幂等已由 DB 实查复核：stage 总 sets=84（非 168），证明二次 apply 未重复写。

## 6. answer position 分布（重排后）

撰写时答案默认在首位（A28/B0/C0/D0），`rebalance-wu-choices.ts --stage=wu-abk-2026-07-01 --apply` 重排后：

```
✓ draft|def_to_word:       A7/B7/C7/D7 (n=28, 25%)
✓ draft|synonym_choice:    A7/B7/C7/D7 (n=28, 25%)
✓ draft|confusable_choice: A7/B7/C7/D7 (n=28, 25%)
全部均衡（无单位置超 40%）   guard EXIT 0
```

收敛证明：apply 后再 dry-run **changed 0**；正确性实查 answer 仍命中、def/conf 答案词仍=target（answer_word_changed=0）、全 draft、bad_choices 0。

## 7. PASS / REVIEW / REJECT

- **PASS = 84（全部）**；**REVIEW = 0；REJECT = 0**。
- 本批为 Claude 逐题撰写并自审：答案唯一、synonym 强同义（非 loose，干扰非同义）、confusable 真易混（拼写/同音相近，如 affect/effect、ascent/assent、knight/night、kernel/colonel）、def 干扰同词性且释义唯一、中文释义准确、TOEFL level 6 合理。
- PASS 清单（按字母）：
  - **def_to_word**：absorb, abrupt, abundant, accelerate, accumulate, accurate, adapt, adequate, adjacent, advocate / beneficial, brief, broaden, burden, barrier, boost, boundary, brittle, bias, bulk / keen, kindle, kinetic, kinship, knack, knit, kingdom, kidney
  - **synonym_choice**：abrupt→sudden, abundant→plentiful, accurate→precise, adequate→sufficient, alter→modify, ambiguous→unclear, apparent→obvious, arbitrary→random, assess→evaluate, abolish→eliminate / beneficial→advantageous, brisk→lively, broaden→widen, boost→enhance, brittle→fragile, blend→mix, bold→daring, barren→infertile, bewilder→confuse, bolster→support / keen→eager, kindle→ignite, knack→aptitude, keep→retain, knit→bind, kin→relatives, knotty→complex, keenly→eagerly
  - **confusable_choice**：adapt, affect, accept, access, allusion, ascent, averse, allude, aspire, ascribe / berth, beside, bazaar, breath, board, beneficial, brake, bald, baron, boulder / knight, knot, knead, kernel, knack, kin, knob, kneel

## 8. DB 实查结果

| 项 | 值 |
|---|---|
| sets / items / target_words | 84 / 84 / 84 |
| active / draft | 0 / 84 |
| 三型数量 | def 28 / synonym 28 / confusable 28 |
| answer 不在 choices | 0 |
| choices≠4 或有重复 | 0 |
| non_gen | 0 |
| deprecated | 0 |
| blocked | 0 |
| word_id null | **0** |

## 9. word_id null 清单

**0 条**——全部 84 个目标词均在 dictionary_words 中（含 averse/allude/ascribe/boulder/knave 无，knell 仅作干扰未做 target；keenly/knotty/bolster/bewilder 等均在库）。无"常见词在库却 null"的异常，无需调查。

## 10. 所有命令 exit code（全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2104 · items 3284 · 错误 0；新题为 draft 不影响 active） |
| `npm run qa:qsets-v2` | 0（gen draft 2009→2093 = +84 纳入检查无错） |
| `npm run validate:practice-session` | 0 |
| import dry-run/apply/幂等 | reject 0 / wrote 84 / dup-skip 84 |
| `rebalance --apply` + re-dry-run | changed 81 → changed 0（收敛） |
| `audit-answer-position --status=draft` | 0（三型 A7/B7/C7/D7） |

## 11. 安全声明

- **未 promote、未 active**：wu-abk-2026-07-01 全 84 条 status=draft，active=0。
- **未调用 DeepSeek**：全部 Claude 原创。
- **未抄真题/版权材料**：题干为通用中文释义/英文单词，选项为词表内常见词。

## 12. 下一步建议

- 交 Codex 复审本批 draft；通过后可从 PASS 中做**第三批小批 promote**（沿用程序化 `--words` 选 id + active 答案位置守卫 + 每型 ≤20 + 跨字母分层）。
- a/b 现已有 gen: 原创题，后续可逐步用其**替换/补充**旧 qb 来源的 a/b active 题（需单独一轮"下线 qb a/b active + 上线 gen a/b"的迁移，建议 Codex 确认策略后再做）。
- k 字母补题完成（24 条）；如需更多可继续扩量。
