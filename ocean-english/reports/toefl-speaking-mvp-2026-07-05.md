# TOEFL Speaking Transcript-Only MVP — Report (2026-07-05)

**Task 1 of `2026-07-05-post-toefl-v1-remaining-product-work-plan.md`.**
固定决策：首发 transcript-only；不存储/不上传用户音频；不声称官方 TOEFL 口语分。

## 状态答复（计划要求的四问）

| 问题 | 答复 |
|---|---|
| practice-ready? | **是（转写路径）**：speak 题路由到 FreeText 转写作答 + `/api/scoring/speaking` 估分；当前 0 active → 专项请求返回受控空态（已验证不回退其它题型）。 |
| active or draft? | **全 draft**：`listen_and_repeat` 10 draft、`interview_speaking` 10 draft。**本任务未 promote**（计划默认 Do not promote，维持）。 |
| included in mock? | **否**：`smoke:papers` toefl mini=2 区 / full=3 区（阅读+听力+写作），无口语；spec `excludeFromPaper` + 组卷器 `PAPER_EXCLUDED_TASK_TYPES` 双门在位。 |
| storing audio? | **否**：无上传/存储/Storage 路径；API 显式拒音频载荷；响应恒带 `audioStorage:'none'`。 |

## 本任务改动

| File | Change |
|---|---|
| `app/api/scoring/speaking/route.ts` | 音频拒收字段列表补齐计划要求的 `audioBlob`、`file`（现共 8 个：audio/audioBlob/audioBase64/audioUrl/audioData/file/recording/recordingUrl → 400 `audio_upload_not_supported`）。 |
| `components/practice/renderers/FreeTextRenderer.tsx` | speak 题提示语更新为计划指定文案：「口语练习当前按文字转写估分；录音不会上传或保存。本结果为练习估分，不是官方 TOEFL 分数。」 |
| `scripts/validate-practice-session.ts` | 新增第 7 节：两个口语任务的专项会话断言——不回退其它题型、item 必为 `speak`、payload 无音频上传/存储指示；当前受控空态（source=empty items=0）。 |

响应契约（既有，复核）：`{ audioStorage:'none', audioScoring:'not_ready', isEstimate:true, transcriptUsed:true }` ✅。

## DB 写入 / promote

- **DB 写入：0。Promote：0。** active 2854/4684 不变。

## Validation

| Command | Exit |
|---|---|
| `npm run validate:practice-session` | 0（新增口语断言通过：两任务受控空态） |
| `npm run validate:rubrics` | 0（错误 0；IELTS coming-soon 2 警告非阻塞） |
| `npm run smoke:papers` | 0（toefl mini 2 区 / full 3 区，无口语；错误 0） |
| `npm run validate:qbank-v2` | 0（active 2854/4684） |
| `npm run lint` / `npx tsc --noEmit --incremental false` | 0 / 0 |

## Stop/Go 建议

**GO（transcript-only MVP 边界完备）**。激活口语 draft（每型 ≤10）前仍需：转写题面 QA + rubric 绑定 +
`qa_flags.speaking_ready=true` + manifest/dry-run/apply/幂等——由 owner 明确批准后执行。
