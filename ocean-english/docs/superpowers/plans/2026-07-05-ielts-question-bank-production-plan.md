# IELTS Question Bank Production Plan (2026-07-05)

**Status:** IELTS 保持 `coming_soon`（`paperReady` 不设 true）；本计划只规划 draft 题库建设。任何 promote / 开卷均需 owner 单独批准。

## 1. 官方格式依据（仅官方来源，2026-07-05 复核）

事实全部核对自 ielts.org 官方页面（British Council 页面当日超时，以 ielts.org 为准）：

| 部分 | 官方格式 | 来源 |
|---|---|---|
| Listening | 4 部分 × 10 题 = 40 题，~30 分钟（纸笔另有 10 分钟誊写；机考仅短复查窗口）；只听一遍、多口音；6 大题型（MCQ / matching / plan-map-diagram labelling / form-note-table-flow-chart-summary completion / sentence completion / short answer）；每题 1 分换算 band | https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening |
| Academic Reading | 3 篇长文 40 题，60 分钟（含誊写）；2150-2750 词；来源为书籍/期刊/杂志/报纸/**网络资源**（非专业读者向）；11 种题型（MCQ、TFNG、YNNG、matching info/headings/features/sentence endings、sentence/summary/note/table/flow-chart completion、diagram label、short answer） | https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading |
| Writing | Task 1 图表描述 ≥150 词 ≤20 分钟；Task 2 议论文 ≥250 词 ≤40 分钟；**Task 2 权重两倍**；评分四标准 TA/TR·CC·LR·GRA | https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing |
| Speaking | 3 部分共 11-14 分钟：P1 访谈 4-5 分；P2 长陈述（1 分钟准备 + **至多 2 分钟**，P2 全程 3-4 分钟）；P3 讨论 4-5 分；评分四标准 FC·LR·GRA·P | https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking |
| Scoring | 0-9 band（半分制）；无及格线；总分为四项平均（.25 进半分、.75 进整分）；成绩两年有效 | https://www.ielts.org/take-a-test/your-results/ielts-scoring-in-detail |

版权红线：**绝不抄袭剑桥/官方真题**；所有内容 Claude 原创，仅模仿官方格式。

## 2. 目标规模

| 类型 | Pilot（本期已完成） | 一期目标（Part C1） | 最终目标 |
|---|---|---|---|
| Academic Reading passages | **5**（MCQ 子集，各 6 题） | 100 篇（每篇 10-13 题） | 200+ |
| Writing Task 1 | **10** prompts | 100 | 150+ |
| Writing Task 2 | **10** prompts | 100 | 150+ |
| Speaking prompt sets（P1+P2+P3） | **10** | 100 | 150+ |
| Listening | 0（无音频授权） | 100 draft **脚本**（不产音频，除非 owner 批准供应商/成本） | 200+ |

## 3. 技术路径

- **Reading（已就位）**：模板 `ielts-academic-reading-mcq`（reading_multi，4 选 1 × 6 题，550-950 词）。
  **缺口**：TFNG / YNNG / matching / completion 等官方题型需要新的 answer shape（`shape.ts` 扩展 + 渲染器）——一期先扩 MCQ 池，题型多样化列为一期后半段的独立决策。
- **Writing（已就位）**：走 productive 导入（`essay_writing`，rubric `ielts:writing` 四标准等权，fullScore 9）。Task 1/Task 2 暂以 prompt 文案 + `wordLimit` 区分；是否拆独立 task_type（如 `report_writing`）留给 owner 决策。
- **Speaking（已就位）**：productive 导入（`interview_speaking`，rubric `ielts:speaking`，转写-only 边界与 TOEFL 相同——不上传/不存储录音）。
- **Listening（未开工）**：需 owner 批准 TTS 供应商与成本后走既有 R6 音频管线；无音频的听力永不 active（既有硬门）。
- **元数据**：所有行 `exam_id='ielts'`、`level=8`、`status='draft'`、`qa_flags.source='original_authored'`、`authored='claude'`；productive `answer.official=false`。

## 4. 批次纪律（每批 20 套）

source file → source QA（shapeToItems/importer 校验）→ dry-run → apply → 幂等重跑 → DB QA（`qa:qsets-v2` + `validate:qbank-v2`）→ 人工抽查 ≥5 套 → 批报告。

## 5. 开放前必须满足（IELTS mock 开启 gate）

1. Reading ≥100 篇且题型覆盖 ≥3 种官方题型；2. Listening 有 active 音频且抽查通过；3. Writing/Speaking 各 ≥100 且 rubric 评分链路验证；4. `validate:papers` 增加 IELTS 出卷断言；5. owner 明确批准 `status='active'` + `paperReady=true`。
在此之前 IELTS 组卷恒 `exam_coming_soon`，专项恒受控空态，绝不回退 TOEFL/SAT/CET。
