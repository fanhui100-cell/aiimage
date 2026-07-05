# Word Universe v2 Source Cleanup — Report (2026-07-05)

**Task 5 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**

## 审计结果（before/after 相同的不变量）

- **active 100% gen：** 351 active（三型各 117），`qb=0 / migrated_v1=0 / other=0`，badProvenance=0。
- `audit:wu-source --fail-on-qb-active` → exit 0（before/after 均绿）。

## 旧 qb: draft 处理（本任务的 DB 写入）

**目标集合：** WU 三型（def_to_word / synonym_choice / confusable_choice）· `legacy_id like 'qb:%'` · `status='draft'` → **600 行**（三型各 200）。

**方案选择：** 计划优先项是改 `status='rejected'`（schema 允许），但 `validate:wu-promote-guards`
需要 qb draft 样本持续验证来源门（无样本即报错）——即应用层不完全容忍全量 rejected。
故按计划备选：**保持 draft，加封存标记**（不删除）：

```
qa_flags.doNotPromote  = true
qa_flags.blockedReason = 'legacy_qb_not_for_promotion'
```

**manifest 式执行（`scripts/mark-qb-word-universe-draft-blocked.ts`，新增）：**

| 轮次 | candidates | dup-skip | updated | failures | exit |
|---|---|---|---|---|---|
| `--dry-run` | 600 | 0 | 0 | 0 | 0 |
| `--apply` ① | 600 | 0 | **600** | 0 | 0 |
| `--apply` ②（幂等验证） | 600 | **600** | **0** | 0 | 0 |

逐行 merge qa_flags（保留原 stage/source 等字段）；报告 `reports/mark-qb-wu-draft-blocked-report.json`。

## Promote 守卫加固

`scripts/promote-question-sets-v2.ts` 新增通用守卫：`qa_flags.doNotPromote===true → 拒 'do_not_promote'`。
置于 WU 来源门**之后**——qb WU draft 的首要拒因仍是 `word_universe_non_gen_source`
（`validate:wu-promote-guards` 依赖该 reason，验证不受影响）；`doNotPromote` 作为任何未来封存行的兜底。
未弱化任何既有 blocked/deprecated/source 门。

## 练习选题确认

- `validate:practice-session` → 0 错误（v2 active 优先；无 v2 命中时不做无关随机回退）。
- `smoke:active-serve` → PASS（active set stimulus 全 active 0/2003 违例；听力带签名 audioUrl、不下发 transcript）。

## Files changed

| File | Change |
|---|---|
| `scripts/mark-qb-word-universe-draft-blocked.ts` | 新增：幂等封存标记脚本（--dry-run/--apply）。 |
| `scripts/promote-question-sets-v2.ts` | 新增 `do_not_promote` 通用拒因（置于 WU 来源门后）。 |
| `reports/mark-qb-wu-draft-blocked-report.json` | apply manifest 快照。 |
| `reports/word-universe-v2-cleanup-2026-07-05.md` | 本报告。 |

`scripts/audit-word-universe-source-distribution.ts` / `scripts/validate-word-universe-promote-guards.ts` 未改（现行为已满足验收）。

## DB writes / promote

- **DB 写入：600 行 `question_sets.qa_flags` merge**（加 2 个键；不改 status、不删行、不动 items）。
- **Promote：0。** active 2854/4684 不变。

## Validation

| Command | Exit |
|---|---|
| `npm run audit:wu-source -- --fail-on-qb-active` | 0（active qb=0） |
| `npm run validate:wu-promote-guards` | 0（PASS；qb→word_universe_non_gen_source，gen→eligible） |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |
| `npm run validate:qbank-v2` | 0（active 2854/4684） |
| `npm run qa:qsets-v2` | 0 |
| `npm run lint` / `npx tsc --noEmit` | 0 / 0 |

## Residual

- 600 条 qb draft 现为「draft + 双封存标记 + 双 promote 门」。若未来想物理清退（rejected/删除），需先改
  `validate:wu-promote-guards` 的 qb 样本策略——留待 owner 决定。
