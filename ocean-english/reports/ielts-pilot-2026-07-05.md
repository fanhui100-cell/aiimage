# IELTS Pilot — Report (2026-07-05)

**Phase 11（post-v1 plan Task 3）.** 固定决策：不开 IELTS mock，只建 pilot。

## 官方来源（全部 ielts.org，2026-07-05 网络复核，含修正）

- Listening 格式：https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening
- Academic Reading 格式：https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-reading
- Writing 格式：https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing
- Speaking 格式：https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking
- 计分：https://www.ielts.org/take-a-test/your-results/ielts-scoring-in-detail

复核修正点：Reading 来源含**网络资源**；Reading 60 分钟**含**誊写（与 Listening 的纸笔另加 10 分钟不同）；Speaking P2 为「至多 2 分钟」、P2 全程 3-4 分钟（含 1 分钟准备）；band 表实为 0-9。
完整格式表见 `docs/superpowers/plans/2026-07-05-ielts-question-bank-production-plan.md`（本次新建的产线计划）。

## Pilot 计数（全部 draft，零 active）

| 类型 | 计划 | 实际导入 | 说明 |
|---|---|---|---|
| Academic Reading | 5 篇 | **5 sets / 30 items** | 原创学术短文 696-718 词 × 6 道 4 选 1（主旨/细节×2/真推断/语境词义/作者态度）；MCQ 子集，TFNG 等题型留产线阶段 |
| Writing Task 1 | 10 | **10 sets** | 图表数据以文字给出（表/线/饼/柱/流程图/生命周期图混合），≥150 词 |
| Writing Task 2 | 10 | **10 sets** | 官方四大题型混合（discuss both views / problem-solution / agree-disagree / outweigh），≥250 词 |
| Speaking | 10 | **10 sets** | 每套完整 P1 访谈 + P2 cue card（1 分钟准备/至多 2 分钟）+ P3 讨论 |
| Listening | 0 | **0** | 无音频供应商/成本授权 → pilot 不做（产线计划：先 100 draft 脚本、不产音频） |

元数据核验（DB 实测）：ielts sets = **35**（essay_writing 20 / interview_speaking 10 / reading_comprehension 5），
non-draft **0** · non-level8 **0** · 缺 `qa_flags.source='original_authored'` **0**。

## DB 写入

| 写入 | 数量 | 方式 |
|---|---|---|
| IELTS rubrics（writing + speaking，官方四标准等权，fullScore 9） | 2 inserted（另 10 既有 rubric 例行 update 镜像） | `seed:qbank-v2-metadata` dry-run → apply |
| question_sets / question_items / stimuli（reading） | 5 sets + 30 items + 5 stimuli（draft） | importer dry-run → apply(5) → 幂等重跑(5 dup-skip) |
| question_sets / question_items（productive） | 30 sets + 30 items（draft；speak/free_text 已链 ielts rubric） | dry-run → apply(30) → 幂等重跑(30 dup) |

**Promote：0。** active 2854/4684 不变。

## 代码/数据变更

| File | Change |
|---|---|
| `lib/scoring/rubrics.ts` | 新增 `ielts:writing`（TA·CC·LR·GRA 等权）与 `ielts:speaking`（FC·LR·GRA·P 等权）rubric，band 9 制，注明非官方估分。`validate:rubrics` 由 2 警告 → **0 错误 0 警告** |
| `data/exam-task-templates/ielts-academic-reading-mcq.json` | 新模板（reading_multi，6×4 选 1，550-950 词，original_only） |
| `data/generated-question-sets/ielts-pilot-2026-07-05/*` | 4 个源文件（reading a/b + WT1 + WT2 + speaking） |
| `scripts/import-authored-question-sets-v2.ts` / `import-authored-productive-tasks-v2.ts` | qa_flags 增 `source:'original_authored'`（计划要求的元数据） |
| `docs/superpowers/plans/2026-07-05-ielts-question-bank-production-plan.md` | 产线计划（规模/路径/批次纪律/开放 gate） |

## IELTS 为何仍是 coming-soon

- `status='coming_soon'`、`paperReady` 未设 → 组卷恒 `exam_coming_soon`（smoke 实证 mini/full 均受控拒）；专项恒受控空态；无跨考试回退。
- 开放前置条件见产线计划 §5：Reading ≥100 篇多题型、Listening 带 active 音频、Writing/Speaking ≥100 + 评分链路、`validate:papers` IELTS 断言、owner 明确批准。

## Validation

| Command | Exit |
|---|---|
| `npm run validate:exam-specs` | 0 |
| `npm run validate:rubrics` | 0（0 错 0 警） |
| `npm run qa:qsets-v2` | 0（gen drafts 2783→2818 = +35 pilot） |
| `npm run validate:qbank-v2` | 0（active 2854/4684 不变） |
| `npm run smoke:papers` | 0（ielts mini/full = exam_coming_soon；toefl 2/3 区不变） |
| `npm run lint` / `npx tsc --noEmit` | 0 / 0 |
