# Paper Smoke Performance Optimization — Report (2026-07-05)

**Task 7 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**

## Baseline（优化前）

| 指标 | 耗时 |
|---|---|
| `smoke:papers` | **>5 分钟**（前台 5m 超时被杀；后台完成） |
| `validate:papers` | ~90s（cet4 mini 15.9s · 听力 section 13.0s · toefl mini 9.5s · **toefl full 33.7s**） |

## 瓶颈定位

`drawTask` / `drawProductive` 在候选循环内**每 set 串行 2 次远程往返**
（`fetchActiveItems` 每 set 一查 + `fetchTargetWords` 每 set 一查）。TOEFL full 阅读 target=50
（约 13 set × 2 查）+ 听力 target=47（约 20 set × 2 查）+ 各主观区每候选一查——多 section、多卷叠加为主要耗时。

## 优化（`lib/papers/paper-generator.ts`）

1. **批量预取 items**：新增 `fetchActiveItemsBatch`（`.in('question_set_id', chunk)`，chunk=150 →
   单响应 <1000 行，避开 PostgREST max-rows 截断），一次取回全部候选 set 的 active items，内存分组。
2. **批量预取 target words**：对预取 items 的全部 id 一次分块 `fetchTargetWords`（原每 set 一查）。
3. **三路独立查询并行**：听力可用门（只查有无 active 音频，不现签）/ stimuli / items 批量 → `Promise.all`。
4. **drawProductive 同样批量**：stimuli + items 并行预取，循环内零远程往返。
5. 删除已无调用方的单 set 版 `fetchActiveItems`。

**安全不变量保持：**
- 音频签名纪律不变：候选阶段仅查可用性（不现签）；仅对最终抽中的听力 stimuli 小批现签；签名 URL 不进确定性比较（validator 归一化 token）。
- 选择逻辑（迭代顺序/跳过条件/终止条件）逐行未变 → 同 seed 同卷。`validate:papers:full` 确定性断言通过：「同 seed → set/item 选择完全一致」+ 归一化整卷逐字段一致。

## 结果（优化后）

| 指标 | Before | After | 目标 | 判定 |
|---|---|---|---|---|
| `validate:papers` | ~90s | **41s**（cet4 mini 10.8s · 听力 4.4s · toefl mini 6.7s · **toefl full 9.5s**） | <90s | ✅ |
| `validate:papers:full`（全量压测+确定性） | 未测（历史常超时） | **1m36s · 错误 0** | — | ✅ |
| `smoke:papers` | >5min | **2m49s · 错误 0** | preferably <120s | ⚠️ 见下 |

**toefl full 单卷 33.7s → 9.5s（-72%）。**

## smoke:papers 剩余瓶颈（>120s 的原因）

`smoke:papers` 串行生成 **8 exams × 2 modes = 14 张真实卷**（IELTS 2 次受控拒），每卷内 sections
必须**串行**（usedStimuli/usedWord 跨 section 累积 + seeded RNG 顺序 = 确定性契约），每 section
至少 2-4 次远程往返（sets → [audio门/stimuli/items 并行] → target words）。即
~60+ 次不可避免的串行远程 RTT × 平均 ~2-3s（远程 Supabase）≈ 170s。
进一步压缩需并行化 smoke 的 exam 迭代——但计划将 `check-paper-api-smoke.ts` 限定为「仅计时插桩可改」，
且并行会牺牲逐卷输出可读性，故不做，如实报告。

## Files changed

| File | Change |
|---|---|
| `lib/papers/paper-generator.ts` | 批量预取 + 三路并行（见上）；无选择逻辑/安全规则变更。 |
| `reports/paper-smoke-performance-2026-07-05.md` | 本报告。 |

`scripts/validate-paper-generator.ts` 本任务无需再改（Task 1 已加 TOEFL 断言与计时）；`check-paper-api-smoke.ts` 未改。

## Validation

| Command | Exit |
|---|---|
| `npm run validate:papers` | 0（41s） |
| `npm run validate:papers:full` | 0（1m36s，确定性通过） |
| `npm run smoke:papers` | 0（2m49s，14 卷生成、IELTS 受控拒、错误 0） |
| `npm run validate:qbank-v2` | 0（Task 5 轮；生成器为只读路径，不影响库） |
| `npm run lint` / `npx tsc --noEmit` | 0 / 0 |
