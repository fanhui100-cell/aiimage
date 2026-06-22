# TOEFL 2026 试产 — 已停止（官方规格未确认）

本目录的题包**已按执行文档 §3.4「无法确认则停止该题型」停止**，其 DB draft sets 已删除（`scripts/remove-blocked-templates.ts --apply`）。源文件保留于此，内容本身经复审抽查答案键无误，仅因**官方 Blueprint 未确认规格**而停产。

| 文件 | taskType | 停止原因（official_spec_unverified） |
|---|---|---|
| toefl-read-daily-life.json | read_daily_life | ETS 2026 Blueprint 未给定 Reading MCQ **选项数**（§3.2 要求确认「选项数」）。"2-item and 3-item sets" 已确认，但选项数未确认。 |
| toefl-academic-reading.json | reading_comprehension(toefl) | ETS Blueprint 未给定 **选项数**，且「每篇题数」未确认（官方仅给 items 5–15/claim，非每篇）。原用 4 选 1 + 每篇 3–4 题均为假设。 |

## 重新启用条件

待 ETS 官方明确给出 Reading MCQ 的**选项数**与（学术阅读）**每篇题数**后：
1. 按官方数字修正 template（optionCount、perStimulusItems）与本目录源文件。
2. 更新 `reports/toefl-2026-non-audio-spec-check.md`，移除 `official_optioncount_unverified`。
3. 将源文件移回 `data/generated-question-sets/toefl-2026-pilot/`，重新 dry-run → 抽查 → `--apply`。

不得在官方确认前凭记忆/惯例（如「TOEFL 一向 4 选 1」）恢复生产。
