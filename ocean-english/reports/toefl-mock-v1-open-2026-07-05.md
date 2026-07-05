# TOEFL Mock v1 Open — Report (2026-07-05)

**Task 1 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**

TOEFL 整卷模考 v1 已开启：`paperReady=false → true`，整卷含**阅读 + 听力 + 写作**；
**口语**（评分管线未就绪）与 **Build a Sentence**（判分未就绪）均从整卷排除。无 DB 写入、无 promote、无内容变更。

## Files changed

| File | Change |
|---|---|
| `lib/exam-specs/types.ts` | `ExamSectionSpec` 新增可选字段 `excludeFromPaper?: boolean` + `paperExcludedReason?: string`（整卷刻意排除板块的类型契约）。 |
| `lib/exam-specs/specs.ts` | TOEFL `paperReady: false → true`；speaking section 加 `excludeFromPaper: true, paperExcludedReason: 'speaking_pipeline_not_ready'`；写作 notes 注明 build_a_sentence 排除。 |
| `lib/papers/paper-generator.ts` | 新增 `PAPER_EXCLUDED_TASK_TYPES = {build_a_sentence, listen_and_repeat, interview_speaking}`；`generatePaper` 在 full/mini/section 三模式跳过 `excludeFromPaper` 板块（section 模式直接受控拒 `section_excluded_from_paper`）；`buildSection` 客观/主观候选均过滤排除任务。 |
| `scripts/check-paper-api-smoke.ts` | 无需改动——期望值本就由 `spec.paperReady` 自动推导；`paperReady=true` 后自动期望 TOEFL 出卷。 |
| `scripts/validate-paper-generator.ts` | 移除过时的 `toefl full → paper_not_ready` 断言；新增 `assertToeflMockV1()` 契约并接入默认 `dbSmoke` 门禁与 `--full` 压测。 |
| `scripts/validate-toefl-task-alignment.ts` | spec 断言 `paperReady === true`；新增 speaking `excludeFromPaper` / `paperExcludedReason` 断言；`blockerSummary` 记录 mock v1 开启与排除项。 |
| `components/drill/MockPaperPicker.tsx` | 模考选卷器过滤 `excludeFromPaper` 板块（不列出、不计入题量/满分）；当有排除板块时显示终简说明：「TOEFL 模考 v1：包含阅读、听力、写作；口语建设中。」 |
| `reports/toefl-mock-v1-open-2026-07-05.md` | 本报告。 |

## Exact TOEFL paper composition

来自 `reports/paper-api-smoke.json`（seed `toefl-mini` / `toefl-full`）：

| Mode | 出卷 | Sections | 内容 |
|---|---|---|---|
| `toefl mini` | ✅ generated | 2 | 阅读（reading_comprehension）+ 听力（listening_comprehension，带 audioUrl） |
| `toefl full` | ✅ generated | 3 | 阅读 + 听力 + 写作（email_writing / academic_discussion，主观区待评分） |

- `mini`：仅客观区（阅读 + 听力），无写作、无口语。
- `full`：阅读 + 听力 + 写作，**无口语板块**。
- 两模式均 `insufficientPool=false`、`warnings=[]`。

## 排除项确认

- **口语**：`speaking` section `excludeFromPaper=true`，组卷器在 full/mini/section 三模式一律跳过 → 整卷/单区均不含口语。`listen_and_repeat` / `interview_speaking` 亦在 `PAPER_EXCLUDED_TASK_TYPES`（双保险）。
- **Build a Sentence**：写作 section 保留（用 email_writing / academic_discussion），但 `build_a_sentence` 在 `PAPER_EXCLUDED_TASK_TYPES`，`drawProductive` 候选过滤后绝不被抽中——即便其未来被误置为 active 也不会进卷。
- `validate:validate-paper-generator` 的 `assertToeflMockV1` 对每个 section 的 `taskType` 与每个 `set.taskType` 双查这三个排除任务，并断言客户端视图无 `answerKey`、听力无 transcript 且带 audioUrl。

## DB writes / promote

- **DB writes：无。** 仅改代码与规格常量，未执行任何迁移、promote、status 变更。
- **Promote：无。** active 集合数量不变（`validate:qbank-v2` active sets 2854 / items 4684，与基线一致）。

## Validation

| Command | Exit | 结果 |
|---|---|---|
| `npx tsc --noEmit --incremental false` | 0 | 通过 |
| `npm run lint` | 0 | 通过 |
| `npm run smoke:papers` | 0 | TOEFL mini/full 出卷；IELTS `exam_coming_soon`；`ok:true` |
| `npm run validate:papers` | 0 | scoring 单测 + clientPaper 契约 + TOEFL mock v1 契约（见下方注） |
| `npm run validate:qbank-v2` | 0 | active sets 2854 · items 4684 · 错误 0 |
| `npm run validate:practice-session` | 0 | 错误 0 |
| `npm run validate:audio-assets` | 0 | listening active 424 · 错误 0 |
| `npm run validate:toefl-task-alignment` | 0 | errors=0 warnings=0（paperReady=true、speaking excludeFromPaper 断言通过） |

## Known limitation

这是 **TOEFL 模考 v1**，非完整四技能 TOEFL：**口语暂不进整卷**（录音转写评分管线未就绪，见 Task 3），
**Build a Sentence 暂不进整卷**（可接受语序判分未就绪，见 Task 2）。写作区当前仅抽 email_writing / academic_discussion（均主观、待 AI/人工评分）。

## Residual risks

- `smoke:papers` / `validate:papers` 远程 DB 往返较慢（TOEFL 出卷后新增真实生成）；性能优化见 Task 7。
- 报告 JSON（paper-api-smoke / toefl-task-alignment）随本次运行刷新，属本任务的预期快照，一并提交。
