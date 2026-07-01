# Word-Universe TOEFL L6 扩容 —— P1 返修报告

- 日期：2026-07-01
- 触发：复审在 wu-toefl-l6-expansion-2026-07-01 的 confusable_choice 发现 2 个 P1 多答案风险（均在 draft，无线上影响）。
- 本轮：**只返修这 2 个 P1**；P2 边界项本轮不改（见 §5）。**仍全部 draft，未 promote。**

## 1. 返修的 2 个 P1（confusable_choice）

| 词 | 题干 | 旧干扰问题 | 修复 |
|---|---|---|---|
| eminent | 杰出的，著名的 | `prominent` 也表「著名/突出」→ 双答案 | prominent → **immanent**（内在固有的，形近 -minent，不吃「著名/杰出」） |
| envelop | 包围，笼罩（动词） | `enclose` 也表「围住/包围」→ 双答案 | enclose → **envision**（设想，形近 env-，不吃「包围」） |

修复后 choices（DB 实查）：
- eminent：`immanent / imminent / eminent / permanent`（answer=eminent；三干扰均不表「著名/杰出」）
- envelop：`develop / envelope / envision / envelop`（answer=envelop；三干扰均不表「包围」）
- 两题均 4 选、distinct 4、answer 命中。

## 2. 定向删除 + 重导（不删整 task）

- 仅删 eminent/envelop 两个 set + 其 item + target_word（`def/synonym` 各 30、confusable 其余 28 均未动）。删除后 leftover=0。
- 重导：dry-run reject 0 → apply **wrote 2 / dup-skip 28** → 幂等复跑 **wrote 0 / dup-skip 30**。

## 3. rebalance + 守卫

- 重导 2 题答案默认首位，confusable 暂为 A10/B8/C5/D7 → `rebalance --apply` 后 **A8/B8/C7/D7**（changed 21，仅 confusable；def/syn 未变）。
- re-dry-run **changed 0**（收敛）。
- `audit-answer-position --status=draft`：三型 A8/B8/C7/D7（27% < 40%），**exit 0**。

## 4. 重导后完整性（DB 实查）

| 项 | 值 |
|---|---|
| sets / items / target_words | 90 / 90 / 90 |
| active / draft | 0 / 90 |
| 三型 | def 30 / synonym 30 / confusable 30 |
| answer 不在 choices | 0 |
| word_id null | 0 |
| dup_vs_existing_gen | 0 |

## 5. P2 边界项（本轮未改，留 draft 待议）

复审列出的 3 个 synonym P2（不一定错，promote 前建议人工再定）本轮**未改动**，仍 draft：
- `gauge → measure`（gauge 偏「估量/判断」，measure 更泛）
- `grim → harsh`（可通，但非最强同义）
- `linger → remain`（remain 太泛，缺 linger「逗留/迟迟不去」意味）

建议：promote 这批时，将上述 3 题排除或先人工复核确认；如需，可后续单独返修（改 answer 为更强同义或换题干）。

## 6. 回归（全部 exit 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:qbank-v2` | 0（active 2164 不变） |
| `npm run validate:practice-session` | 0 |
| `npm run audit:wu-source` | 0（active 全 gen / qb 0） |
| `npm run validate:wu-promote-guards` | 0（PASS） |
| `audit-answer-position --status=draft` | 0（三型 A8/B8/C7/D7） |
| import dry-run/apply/幂等 | reject 0 / wrote 2 / dup-skip 30 |

## 7. 声明

- 2 个 P1 双答案风险已消除；返修采用**定向删除 + 重导对应记录**，未批量删整 task。
- **仍全部 draft、未 promote、未 active、未调用 DeepSeek、未改前端/schema/限流。**
- 下一步（等复审）：可从本批 PASS 程序化小批 promote，届时排除/复核 §5 的 3 个 P2 边界项。**不自行进入 promote。**
