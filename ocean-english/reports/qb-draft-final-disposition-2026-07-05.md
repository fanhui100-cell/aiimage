# Legacy `qb:` Draft Final Disposition — Report (2026-07-05)

**Phase 12（post-v1 plan Task 4）.** 固定决策：不删除 `qb:` 行；保持不可 promote。

## 最终处置状态（确认，无需新操作）

| 检查 | 结果 |
|---|---|
| active WU `qb:` 计数 | **0**（active 351 全 gen，badProvenance 0） |
| draft WU `qb:` 计数 | 600（三型各 200；另 gen draft 33） |
| 600 条 qb draft 封存标记覆盖 | **600/600**：`mark-qb-word-universe-draft-blocked --dry-run` → candidates 600 · already-marked 600 · to-mark **0**（即每行都已带 `doNotPromote:true` + `blockedReason:'legacy_qb_not_for_promotion'`） |
| Promote 双门 | ① 来源门 `word_universe_non_gen_source`（首要拒因，guards 验证依赖）② `do_not_promote` 通用门 ③ 服务端 RPC 来源等价校验 |
| guards 验证 | PASS：qb draft 样本 → `rejected:word_universe_non_gen_source`；gen draft → eligible（门不误伤） |

## 本阶段操作

**零 DB 写入、零 promote、零代码改动**——上一轮（commit `b838bc9`）已完成标记 apply + 幂等验证；
本阶段为最终处置确认轮：重跑 dry-run 证明 600/600 已封存、审计与守卫全绿。

计划文件列表中的 `mark-qb-word-universe-draft-blocked.ts` / `audit-word-universe-source-distribution.ts`
无需修改（现行为已满足全部验收）。

小提示（工具行为记录）：`npm run audit:wu-source -- --status=draft` 中的 `--status=draft` 会被 npm script
内置的 `--status=active` 覆盖（argValue 取首个匹配）——draft 审计需直接
`npx tsx scripts/audit-word-universe-source-distribution.ts --status=draft`。

## 物理清退（rejected/删除）为何不做

`validate:wu-promote-guards` 依赖「取一条 qb draft 样本验证来源门」——无样本即报错。
物理清退需先改该验证器的样本策略，属 owner 决策；当前「draft + 双标记 + 双门」已满足
「不可 promote、可审计、可回溯」的治理目标。

## Validation

| Command | Exit |
|---|---|
| `npx tsx scripts/audit-word-universe-source-distribution.ts --status=draft` | 0（qb 600 全 draft） |
| `npm run audit:wu-source -- --fail-on-qb-active` | 0（active qb=0） |
| `npx tsx scripts/mark-qb-word-universe-draft-blocked.ts --dry-run` | 0（600/600 已标记，0 待处理） |
| `npm run validate:wu-promote-guards` | 0（PASS） |
| `npm run validate:qbank-v2` | 0（active 2854/4684） |
| `npm run qa:qsets-v2` | 0 |
