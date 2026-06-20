# banked_cloze / seven_select 答案键复核交接

生成时间：2026-06-17

本轮只做审计与报告生成，未修改 Supabase 数据。

## 文件

- 完整逐题明细：`reports/passage-answer-key-audit.md`
- 机器可读明细：`reports/passage-answer-key-audit.json`
- 可复跑脚本：`scripts/audit-passage-answer-keys.ts`
- 断点缓存：`scripts/.passage-answer-key-audit-cache.json`

复跑命令：

```bash
npx tsx scripts/audit-passage-answer-keys.ts --concurrency=4
```

从头重跑：

```bash
npx tsx scripts/audit-passage-answer-keys.ts --fresh --concurrency=4
```

## 总览

| 题型 | active 行数 | 结构问题行 | 两轮确认错行 | 两轮确认错空 | ambiguous 行 | AI/API 错误 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| banked_cloze | 325 | 9 | 76 | 145 | 108 | 0 |
| seven_select | 544 | 0 | 317 | 553 | 262 | 0 |

结论：两类题都不是抽样噪声。`banked_cloze` 存在答案键错位、词性/搭配错误、候选词重复；`seven_select` 存在大量句子选项错配，很多题是 2-5 个空整体错位。

## 按等级/考试分布

| 题型 / 考试 / 等级 | 行数 | 确认错行 | 确认错空 | ambiguous 行 | 结构问题行 |
| --- | ---: | ---: | ---: | ---: | ---: |
| banked_cloze / CET-4 / lv3 | 166 | 35 | 77 | 49 | 7 |
| banked_cloze / CET-6 / lv4 | 159 | 41 | 68 | 59 | 2 |
| seven_select / 中考 / lv1 | 181 | 122 | 225 | 69 | 0 |
| seven_select / 高考 / lv2 | 182 | 102 | 164 | 90 | 0 |
| seven_select / KAOYAN / lv5 | 181 | 93 | 164 | 103 | 0 |

## 最高优先级样例

### banked_cloze

- `banked_cloze-bp-cet4-abb8sp`：9 个确认错空
- `banked_cloze-bp-cet4-97omvw`：8 个确认错空
- `banked_cloze-bp-cet6-ieu49r`：7 个确认错空
- `banked_cloze-bp-cet4-110rpdd`：6 个确认错空
- `banked_cloze-bp-cet4-s1784g`：6 个确认错空
- `banked_cloze-bp-cet6-i7kf9s`：6 个确认错空

### seven_select

- `seven_select-sp-kaoyan-1ond3r3`：5 个确认错空
- `seven_select-sp-中考-k287eb`：5 个确认错空
- `seven_select-sp-中考-x3otpm`：5 个确认错空
- `seven_select-sp-中考-x80hez`：5 个确认错空
- `seven_select-sp-高考-msk5nx`：5 个确认错空

## 修复建议

1. 不要直接删除 ambiguous。只处理 `confirmedWrong`。
2. 对确认错空 >= 4 的题，优先整题重算答案键；这类通常是候选项顺序或答案数组整体错位。
3. 对确认错空 1-3 的题，可以逐空替换 `hint.answers[blank - 1]` 为报告中的 `suggestedIndex`。
4. 对 `shapeIssues` 中的重复候选词，优先重生成整题或替换重复干扰项；不要只改答案键。
5. 修复后必须复跑：

```bash
npx tsx scripts/audit-passage-answer-keys.ts --fresh --concurrency=4
npx tsc --noEmit
npm run lint
```

目标不是让 ambiguous 归零，而是让 `confirmed wrong rows/blanks` 和 `shape issue rows` 归零或进入人工豁免清单。
