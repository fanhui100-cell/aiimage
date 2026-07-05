# Final QBank + Learning Loop Readiness — Report (2026-07-05)

> **⚠️ 状态订正（2026-07-05，post-CC-review 复核，运行时确认；owner 已决策）：** 本文中关于 `build_a_sentence` 的"10 draft 保持 blocked；promote dry-run 证明 eligible 0 / 10 拒"已不符当前 DB：accepted-sequence 契约已应用、`scoring_not_ready` 已清除，本地 promote dry-run 现为 **eligible 10**。**owner 决策（2026-07-05）：接受现状，不回滚，不 promote，不激活**——10 条行保持 `draft` / `active=0` / 被组卷器排除；审计产物已入库（commit `35cd668`）。`npm run verify:toefl-current` 的 exit 1（pilot 期望仍为旧基线）现属**已解释状态**，跟进项为同步该校验器的 pilot 期望基线。详见 `reports/toefl-build-sentence-scoring-2026-07-05.md` 顶部订正与 `reports/cc-full-project-review-2026-07-05.md` 的 P1-2。

**Task 8（终章）of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**
**总体结论：PASS（conditional 项均为显式产品决策，非缺陷）。**

## 一、状态总览

### TOEFL 专项（全部可练）

| Task | Active | 状态 |
|---|---|---|
| complete_the_words | 100 | ✅ active |
| read_daily_life | 100 | ✅ active |
| reading_comprehension（TOEFL 份额含于全库 567） | 100 | ✅ active |
| choose_a_response | 100 | ✅ active（音频全 active） |
| listening_comprehension（TOEFL 份额含于全库 324） | 100 | ✅ active（音频全 active） |
| email_writing | 100 | ✅ active（rubric 评分） |
| academic_discussion | 100 | ✅ active（rubric 评分） |
| build_a_sentence | 0（10 draft） | 🔒 blocked：scoring_not_ready（owner F4 + 本次 infra-only 决定） |
| listen_and_repeat / interview_speaking | 0（各 10 draft） | 🔒 deferred：speaking_pipeline_not_ready（owner F5 + 本次 infra-only 决定） |

### TOEFL 模考 v1 —— 本计划核心交付 ✅ 已开启（Task 1，f8c42a5）

- `paperReady: true`；**mini = 阅读+听力（2 区）**，**full = 阅读+听力+写作（3 区）**。
- 口语板块 `excludeFromPaper`（speaking_pipeline_not_ready）；`build_a_sentence` 经组卷器 `PAPER_EXCLUDED_TASK_TYPES` 排除。
- 客户端卷无 `answerKey`、听力无 transcript、听力带签名 audioUrl（`assertToeflMockV1` 门禁断言 + smoke 全绿）。
- UI：模考选卡不再列口语区，注明「TOEFL 模考 v1：包含阅读、听力、写作；口语建设中。」

### TOEFL Speaking（Task 3，a48c822）— 转写-only 边界，未激活

- API 显式拒音频载荷（`audio_upload_not_supported`）；无音频上传/存储/Storage 对象。
- 练习 renderer（speak 题）明示「按文字转写估分；录音不会上传或保存」。
- 评分恒 `isEstimate:true` + `audioScoring:'not_ready'`。0 set 激活。

### build_a_sentence（Task 2，2f9d2d3）— 判分契约就绪，内容未激活

- `accepted_sequence_exact` 契约 + 归一化判分 + QA/promote/RPC 三重激活门已建。
- 10 draft 保持 blocked；promote dry-run 证明 eligible 0。

### IELTS（Task 4，c6f6970）— 保持 coming_soon ✅

- 组卷 `exam_coming_soon` 受控拒（mini/full 均验证）；专项受控空态；无回退到 TOEFL/SAT/CET。
- `validate:rubrics`：coming-soon rubric 缺口降级 warning → exit 0。未创建/激活任何 IELTS 内容。

### Word Universe（Task 5，b838bc9）— active 100% gen ✅

- active 351（三型各 117），qb=0，badProvenance=0。
- 600 条旧 qb: draft 全部加封存标记（`doNotPromote` + `legacy_qb_not_for_promotion`），幂等 apply 验证（二次 0 变更）；promote 加 `do_not_promote` 通用拒因。未删除任何行。

## 二、最终 DB 快照（qbank-v2-snapshot，2026-07-04T17:38Z）

| 指标 | 值 |
|---|---|
| 总 sets | 6517 |
| active sets | **2854**（items 4684） |
| draft sets | 3663 |
| 退役 active（antonym_choice / cet_cloze） | **0 / 0** |
| WU active by source | gen 351 / qb 0 / migrated 0 / other 0 |

## 三、各阶段 DB 写入与 promote

| Task | DB 写入 | Promote |
|---|---|---|
| 1 TOEFL mock v1 | 0 | 0 |
| 2 build_a_sentence | 0 | 0（dry-run 证明 10/10 拒） |
| 3 speaking 边界 | 0 | 0 |
| 4 IELTS 清理 | 0 | 0 |
| 5 WU 清理 | **600 行 qa_flags merge**（manifest：dry-run 600 → apply 600 → rerun 0；报告存档） | 0 |
| 6 mojibake | 0（no-op，已清洁） | 0 |
| 7 组卷性能 | 0（只读路径优化） | 0 |
| **合计** | **600 行 qa_flags（唯一写入，幂等、有 manifest）** | **0** |

active 2854 全程不变（2852→2854 的 +2 为本计划开始前的既有漂移，非本次产生）。

## 四、终轮全量门禁（全部 exit 0）

| Command | Exit | Command | Exit |
|---|---|---|---|
| `lint` | 0 | `tsc --noEmit` | 0 |
| `validate:qbank-v2` | 0 | `qa:qsets-v2` | 0 |
| `validate:practice-session` | 0 | `validate:audio-assets` | 0 |
| `validate:papers`（41s） | 0 | `validate:papers:full`（1m36s，确定性过） | 0 |
| `smoke:papers`（2m49s） | 0 | `smoke:active-serve` | 0 |
| `validate:exam-specs` | 0 | `validate:question-types` | 0 |
| `validate:data-quality` | 0 | `validate:rubrics`（0 错 2 警） | 0 |
| `audit:wu-source --fail-on-qb-active` | 0 | `validate:wu-promote-guards` | 0 |
| `smoke:paper-e2e` | 0 | `smoke:full-routes` | 0 |
| `validate:toefl-task-alignment` | 0 | | |

**Final Stop Conditions 逐条核验：** TOEFL 卷无 build_a_sentence/口语任务 ✅ · 听力客户端无 transcript ✅ ·
客户端无 answerKey ✅ · IELTS 无跨考试抽题 ✅ · WU active qb=0 ✅ · 退役 active=0 ✅ ·
qbank-v2 无 active 完整性错误 ✅ · 无部分成功的 promote apply（本计划 0 promote）✅。

## 五、Commits（本计划全部 7 个）

| Commit | 内容 |
|---|---|
| `f8c42a5` | feat: open TOEFL mock v1 without speaking |
| `2f9d2d3` | feat: add build sentence accepted sequence scoring |
| `a48c822` | feat: add transcript-only TOEFL speaking boundary |
| `c6f6970` | fix: make IELTS coming-soon validation explicit |
| `b838bc9` | chore: guard legacy qb word-universe drafts |
| `a786829` | docs: record mojibake scan result (no-op) |
| `d33ab32` | perf: batch paper generator fetches |

（+ 本报告与刷新的验证 JSON 快照随 Task 8 提交。）

## 六、剩余用户决策

1. **口语上线路径**（F5 复审）：是否采集录音、存储/隐私模型、ASR 供应商、转写估分能否作首发、专项 vs 模考评分。
2. **build_a_sentence 激活**（F4 复审）：为 10 条 draft 补 2-4 条可接受语序 → 清 flag → 升级 promote RPC 识别契约对象 → promote。
3. **IELTS 题库建设启动时点**（当前 coming_soon 干净受控）。
4. **600 条 qb: WU draft 的最终处置**：现为「draft+双标记+双门」；若要物理 rejected/清退，需先调整 `validate:wu-promote-guards` 的 qb 样本策略。
5. **smoke:papers 耗时**（2m49s）：如需 <120s，需允许并行化 smoke 的 exam 迭代（超出本计划授权范围）。

## 七、已知残留风险

- TOEFL mock v1 是三技能卷（非官方四技能结构）——UI 已如实标注，评分为客观分+主观待评分，不冒充官方分。
- 远程 DB 延迟波动会影响 smoke/validate 绝对耗时（结构性 RTT 已在 Task 7 报告量化）。
