# Paper Smoke Parallelization — Report (2026-07-05)

**Phase 13（post-v1 plan Task 5）.** 目标：`smoke:papers` < 120s，不弱化任何安全断言。

## 结果

| 指标 | Before（串行） | After（并行 3） | 目标 |
|---|---|---|---|
| `smoke:papers` 总耗时 | **169s**（2m49s） | **61s**（组卷部分 51.7s） | <120s ✅ |
| 生成卷数 / 错误 | 14 / 0 | 14 / 0 | 不变 ✅ |

## 实现（`scripts/check-paper-api-smoke.ts`）

- **exam×mode 级并行**：16 个 (exam, mode) 任务进有界并发池，**并发 3**（防 Supabase 限流；不做无界并行）。
- **确定性保持**：种子仍为 `${examId}-${mode}`（与串行版逐字节一致）；单卷内部不并行（section 顺序与 seed 抽取顺序不变——那是 `generatePaper` 内部逻辑，本改动不触碰）。
- **输出顺序保持**：任务按原顺序建立，结果按原顺序合并——rows/控制台输出与串行版逐行一致。
- **断言原样保留**（逐项核验）：
  - IELTS mini/full → `exam_coming_soon` ✅（实测 refusal 命中）
  - active 考试 → 必须出卷或显式 `insufficient_pool` ✅
  - TOEFL mini/full → 出卷（2 区 / 3 区）✅
  - `unknown_exam` 永不可接受 ✅（推导逻辑未动）
  - 退役题型 / 听力 transcript 泄露 / 主观区 scoring 标记检查（`checkPaper`）✅（并行下按任务归集错误，无交错：JS 单线程 + checkPaper 同步）

`scripts/validate-paper-generator.ts` 无需共享 helper（未改）。

## Validation

| Command | Exit |
|---|---|
| `npm run smoke:papers` | 0（61s · 14 卷 · 错误 0 · ielts 受控拒） |
| `npm run validate:papers` | 0（toefl mini 7.4s / full 9.9s） |
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |

## DB 写入 / promote

无（smoke 只读）。
