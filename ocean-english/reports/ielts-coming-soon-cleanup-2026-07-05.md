# IELTS Coming-Soon Cleanup — Report (2026-07-05)

**Task 4 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**

## 问题（before）

`npm run validate:rubrics` 退出 1，报 2 个错误：

```
ERROR ielts/writing 缺 rubric（skill=writing, tasks=essay_writing）
ERROR ielts/speaking 缺 rubric（skill=speaking, tasks=interview_speaking）
```

IELTS 是 `status='coming_soon'`（整卷题库未做）：组卷/专项一律受控拒（`exam_coming_soon`），
永远走不到主观评分，rubric 缺口不应阻塞门禁——但验证器把它按 active 考试同样计为错误。

## 修复（after）

`scripts/validate-rubrics.ts`：生产性 section 缺 rubric 时按 spec 状态分级——
`coming_soon` → **warning**（非阻塞，注明「组卷受控拒」）；active 考试缺 rubric 仍是 **error**。
不为 coming_soon 造假 rubric（未创建任何 IELTS rubric）。报告 JSON 新增 `warnings` 字段。

```
validate-rubrics: rubric 10 · 生产性 section 14 · 错误 0 · 警告 2
WARN ielts/writing 缺 rubric … · status=coming_soon，组卷受控拒，非阻塞
WARN ielts/speaking 缺 rubric … · status=coming_soon，组卷受控拒，非阻塞
```

退出码 1 → 0。

## 路由不回退确认（未改动，核对证据）

| 面 | 行为 | 证据 |
|---|---|---|
| IELTS 整卷（mini/full） | `exam_coming_soon` 受控拒，绝不出卷、绝不回退 | `reports/paper-api-smoke.json`（ielts mini/full 均 refusal=exam_coming_soon，`ok:true`） |
| IELTS 考试专项练习 | 受控空态 `{source:'empty', warnings:['exam_coming_soon']}` | `lib/practice/session-builder.ts:590-595`（既有门，未改） |
| IELTS Level 8 词汇面 | 允许（不受影响） | 词汇/学习档不走 exam 组卷门 |
| 不回退 TOEFL/SAT/CET | `generatePaper` 对非 active spec 直接 return，无任何 fallback 抽题路径 | `lib/papers/paper-generator.ts` status 门 |

## 确认无 IELTS 内容被激活

- 本任务只改了 1 个验证脚本的错误分级，无 DB 写入、无 promote、无 IELTS rubric/题库创建。
- IELTS spec 保持 `status: 'coming_soon'` 未动。

## Files changed

| File | Change |
|---|---|
| `scripts/validate-rubrics.ts` | coming-soon 考试缺 rubric 降级为 warning；输出/报告加 warnings。 |
| `reports/ielts-coming-soon-cleanup-2026-07-05.md` | 本报告。 |

## Validation

| Command | Exit |
|---|---|
| `npm run validate:rubrics` | 0（错误 0 · 警告 2） |
| `npm run validate:exam-specs` | 0（8 exams ok，ielts coming_soon） |
| `npm run smoke:papers` | 0（Task 1 轮：ielts mini/full = exam_coming_soon） |
| `npm run smoke:full-routes` | 0（PASS；active 2854、退役 0、听力音频全 active） |
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |
