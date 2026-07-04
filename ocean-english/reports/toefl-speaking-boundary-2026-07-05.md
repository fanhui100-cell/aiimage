# TOEFL Speaking Transcript-Only Practice Boundary — Report (2026-07-05)

**Task 3 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**
**Scope decision（owner，本次会话确认）：仅巩固转写边界基础设施，不激活任何口语题** ——
与 F5 决定（2026-07-04「defer speaking」）保持一致；零 DB 写入。

## 边界状态（全部满足）

| 边界 | 状态 | 证据 |
|---|---|---|
| 不上传音频 | ✅ | API 显式拒绝音频字段（本次新增，见下） |
| 不存储音频 | ✅ | 无任何 Storage 写入路径；响应恒带 `audioStorage:'none'` |
| 不建 Storage 对象 | ✅ | `app/api/scoring/speaking/route.ts` 全程无 Storage 调用 |
| 接受打字/粘贴转写 | ✅ | FreeTextRenderer textarea（speak 题专用提示语，本次新增） |
| 转写-only 评分 | ✅ | `scoreSpeaking` 仅收 `text`；`transcriptUsed:true` |
| `audioScoring:'not_ready'` | ✅ | `lib/scoring/score-speaking.ts` 恒定返回 |
| `isEstimate:true` | ✅ | `SubjectiveScore.isEstimate: true`（类型级恒真） |
| 不进 TOEFL 整卷 | ✅ | Task 1：speaking section `excludeFromPaper` + `PAPER_EXCLUDED_TASK_TYPES` |

## Files changed

| File | Change |
|---|---|
| `app/api/scoring/speaking/route.ts` | 新增显式音频载荷拒绝：`audio` / `audioBase64` / `audioUrl` / `audioData` / `recording` / `recordingUrl` 任一非空 → 400 `{ok:false, error:'audio_upload_not_supported'}`；转写请求不受影响（此前只是静默忽略）。 |
| `components/practice/renderers/FreeTextRenderer.tsx` | speak 题（`item.inputMode==='speak'`）专用视图：标签「口语」、引导语「按提示口头作答，并以文字转写提交」、显著隐私提示「口语练习当前按文字转写估分；录音不会上传或保存。」、专用 placeholder。写作题视图不变。 |

未改动（已满足要求，核对确认）：`lib/scoring/score-speaking.ts`（转写-only + not_ready + 恒 isEstimate）、
`lib/practice/session-builder.ts`（只抽 active；口语 10+10 全 draft → 受控空态）、
`scripts/promote-question-sets-v2.ts`（speak 题无 `speaking_ready=true` → 拒 `speaking_pipeline_not_ready`，2026-07-02 已有）。

## 激活状态

- **口语 set 激活：0。** `listen_and_repeat` 10 draft、`interview_speaking` 10 draft，无一 active。
- **音频存储：无。** 本仓库不存在口语录音上传/保存路径；本次把「静默忽略」升级为「显式拒绝」。
- **TOEFL 整卷仍排除口语：** `smoke:papers` toefl full = 3 sections（阅读/听力/写作），`assertToeflMockV1` 双查通过。
- **DB 写入：0。**

## Validation

| Command | Exit | 备注 |
|---|---|---|
| `npx tsc --noEmit --incremental false` | 0 | |
| `npm run lint` | 0 | |
| `npm run validate:practice-session` | 0 | 错误 0 |
| `npm run validate:qbank-v2` | 0 | active 2854/4684 不变（Task 2 轮已证） |
| `npm run validate:rubrics` | 1 | **预先存在**的 IELTS coming-soon 缺口（ielts/writing、ielts/speaking 缺 rubric）——与本任务无关，Task 4 专项修复 |

## Residual

- `validate:rubrics` 的 IELTS 失败由 Task 4 处理（coming-soon 降级为 warning）。
- 未来激活口语需 owner 决策：录音是否采集、存储/隐私模型、ASR 供应商、转写估分是否可上首发、专项 vs 模考评分——然后 renderer 录音（本地）+ 同意 UI + `speaking_ready` 置位 + promote。
