# IELTS b3 归档草稿导入 - Phase 1 报告 (2026-07-05)

> 编码说明：UTF-8（无 BOM）。查看器乱码请以 UTF-8 打开。

**目标：导入已归档（commit `51c5e26`）但未入库的 reading-b3 20 篇 + speaking-b3 20 套。不生成新题、不 promote、不 active。**

## 执行记录

| 步骤 | Reading b3 | Speaking b3 |
|---|---|---|
| 源文件 | `ielts-c1-reading-b3/*.json`（4 文件） | `ielts-c1-speaking-b3/ielts-speaking-b3.productive.json` |
| dry-run | parsedOk **20** / reject **0** / exit 0 | tasks **20**（dryRunTasks 20）/ exit 0 |
| apply | wrote **20** / dup-skip 0 / exit 0 | wrote **20** / dup 0 / exit 0 |
| 幂等复跑 | wrote **0** / dup-skip **20** / exit 0 | wrote **0** / dup **20** / exit 0 |

## DB 实查（导入后）

| 检查项 | 结果 |
|---|---|
| IELTS reading draft | 45 → **65**（+20）✅ |
| IELTS speaking draft | 50 → **70**（+20）✅ |
| IELTS active | **0** ✅ |
| 非 draft set / 非 draft item | **0 / 0** ✅ |
| meta 完整性（level=8 + source=original_authored + authored=claude + provider=claude-authored） | 不合规 **0** ✅ |

IELTS 全量：essay_writing 100 · interview_speaking 70 · reading_comprehension 65 · listening_comprehension 20 = **255 draft / 0 active**。

## 声明

- 新题生成：0（仅导入既有归档）。Promote：0。未触碰 TOEFL/WU active、paperReady、RPC。
- 机器可读版：`reports/ielts-b3-import-2026-07-05.json`。
