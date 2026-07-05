# Large QBank Production — Final Report (2026-07-05)

Controlling prompt: `docs/superpowers/plans/2026-07-05-full-remaining-work-and-large-qbank-production-prompt.md`.

**总体结论：Part A（15 阶段产品/治理）全部完成并通过；Part B 全门 16/16 exit 0；Part C 大规模 draft 生产已启动并取得可验证进展（IELTS 215 draft + Build-a-Sentence 30 契约就绪），因子代理机群触发账号会话限流（重置 09:20 Asia/Shanghai）而未跑满第一阶段全部目标。所有已产内容 draft-only、原创、幂等入库、0 promote、全门绿。**

## 1. 生成计数（本 run 新增，按 exam/task）

| 轨道 | 新增 draft | 第一阶段目标 | 进度 |
|---|---|---|---|
| IELTS Reading（reading_comprehension，MCQ 6 题/篇） | +45（pilot 5 + b1 20 + b2 20） | 100 篇 | 45% |
| IELTS Writing（essay_writing，Task 1+Task 2） | +100（pilot 20 + b1 40 + b2 40） | 100+100 | 50%（100/200） |
| IELTS Speaking（interview_speaking，P1+P2+P3） | +50（pilot 10 + b1 20 + b2 20） | 100 | 50% |
| IELTS Listening（listening_comprehension，draft 脚本，无音频） | +20（b1 20） | 100 脚本 | 20% |
| TOEFL Build-a-Sentence（accepted_sequence_exact 契约） | +20（c3-b1；总 30） | 100 | 30% |
| TOEFL Speaking 扩产 | 0（未启动） | 100+100 | 0% |
| Word Universe 扩产（TOEFL/SAT） | 0（未启动） | +300 / +150 | 0% |
| Coverage top-up | 0（未启动） | 各 cell ≥50 | 0% |

## 2. Active / Draft 计数（DB 实测）

- **总 sets 6752**：active **2854**（全程不变）· draft **3898**（本 run +215 IELTS +20 build-sentence，其余为历史）。
- IELTS：essay_writing 100 draft · interview_speaking 50 draft · reading_comprehension 45 draft · listening_comprehension 20 draft（**全 draft，0 active**）。
- build_a_sentence：30 draft（全 accepted_sequence_exact 契约就绪，0 active，组卷器排除）。
- **Active 增量：0。Promote：0。**

## 3. DB 表与写入行数（本 run 全部 draft）

| 表 | 写入 | 说明 |
|---|---|---|
| question_sets | +235（IELTS 215 + build-sentence 20） | draft |
| question_items | IELTS reading 45×6=270 + listening 20×3=60 + writing/speaking 各 1/set=150 + build-sentence 20×1 | draft |
| stimuli | IELTS reading 45 + listening 20（=65 passage/script） | draft |
| rubrics | +2（ielts:writing / ielts:speaking，seed 镜像） | — |
| question_items.answer（build-sentence 10 pilot，Phase 10） | 10（legacy 排列→契约对象） | draft 保持 |

## 4. Promote 计数

**0。** 全程无 promote。build-sentence promote 为 dry-run（10/10 eligible）。

## 5. 批次 QA 结果

每批 source QA（shapeToItems/importer）→ dry-run → apply → 幂等重跑（全 dup-skip）→ DB QA。
所有批次 `qa:qsets-v2` / `validate:qbank-v2` 0 错误；reject 0；幂等重跑均 0 新增。

## 6. 人工复审发现

Phase 14 复审队列（110 样本）已生成待回填（`reports/content-human-review-sample-2026-07-05.json`）。
本 run 对每批 IELTS 抽查 ≥5 套（阅读推断题真推断、听力答案可从脚本闭环、写作 prompt 数据自洽、口语三段完整）——未见 P0/P1；两处子代理自报并自修（archaeology 段落误植 distractor、explain_zh 内 ASCII 引号破坏 JSON）。

## 7. 剩余 blocked cells / 未完成目标

- IELTS Reading +55、Writing +100、Speaking +50、Listening +80 脚本（达第一阶段 100/各）。
- IELTS 其它官方题型（TFNG/YNNG/matching/labelling/completion）——需扩 `shape.ts` answer shape（产线计划已列为后续阶段）。
- TOEFL Speaking +100+100；Build-a-Sentence +70；Word Universe TOEFL +300 / SAT +150；Coverage top-up——**均未启动**。
- 阻断原因：子代理机群账号会话限流（09:20 Asia/Shanghai 重置）；主循环单线程 inline 无法在预算内产出剩余约 900 条而不牺牲质量。

## 8. 剩余用户决策

1. 会话限流重置后是否续跑子代理机群完成 Part C 剩余目标（推荐；机制已验证：模板 + 导入 + 幂等 + 批 QA 全通）。
2. IELTS listening 音频供应商/成本（当前只产 draft 脚本，永不 active 直到有 active 音频）。
3. build_a_sentence promote 批准（30 契约就绪；RPC SQL 待 Supabase 重应用）。
4. TOEFL 口语激活批准。
5. IELTS 非 MCQ 题型 shape 扩展排期。

## 9. Commit 列表（本 run）

产品/治理：`fdae050`（P9）`35cd668`（P10）`9fcacdf`（P11）`9d2dc0f`（P12）`a26f953`（P13）`872046c`（P14）`2984d8b`（P15）
大规模生产：`19a8c77`（IELTS C1 batches 1-2，160 sets）`e7e17cf`（build-sentence C3 b1，+20）· 本报告 commit。

## 10. Worktree

本报告与 3 个终态快照 JSON（audio-assets/question-bank-v2/question-sets-v2-qa，反映新增 draft）提交后 clean。
纯时间戳/计时 report JSON 已 restore。两个 `.md`（qbank-production-final-summary / self-review-audit）为 session 起始既有 dirty、非本 run 产物，未触碰。仓库根外部进程临时文件（`_tmp_*` 等，Codex 复审会话与 eslint 竞态）非本计划产物。

## Part D 质量标准符合性（抽查确认）

客观题答案唯一命中、选项去重、干扰项同域可信；阅读推断题非复述、篇幅 600-900 词、题量match 模板；听力脚本原创、答案由脚本支撑、**无 active 音频绝不 active**、练习态不下发 transcript；写作/口语 prompt 清晰、rubric 绑定、referencePoints 仅评分参考、`official=false`、无官方范文；WU 未新增（本 run）。**Part F 停止条件全程未触发。**
