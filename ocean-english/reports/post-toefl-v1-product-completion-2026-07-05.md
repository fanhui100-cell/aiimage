# Post TOEFL v1 Product Completion — Report (2026-07-05)

**Phase 15（post-v1 plan Task 7）+ Part B gate（大规模生成前置门）。总体结论：PASS——Part A 全部 15 个阶段完成，全门 16 命令 exit 0，Part C 大规模 draft 生产解锁。**

## 一、产品状态总览

| 领域 | 状态 |
|---|---|
| TOEFL 专项 | 7 任务可练（阅读×3 / 听力×2 / 写作×2 各 100 active）；build_a_sentence/口语 draft 有边界 |
| TOEFL mock v1 | **开启**：mini=阅读+听力（2 区），full=阅读+听力+写作（3 区）；口语与 build_a_sentence 双门排除；客户端无 answerKey、听力无 transcript |
| TOEFL speaking | transcript-only MVP 完备：API 拒 8 种音频字段、UI 非官方声明、受控空态断言入门禁；**0 active**（激活待 owner） |
| Build-a-Sentence | **activation-ready**：10/10 draft 携带 accepted_sequence_exact 契约、promote dry-run 全 eligible、三重拒因（客户端+RPC SQL 对齐）；**0 promote**；RPC SQL 待 owner 在 Supabase 重应用 |
| IELTS | **coming_soon 不变**：pilot 35 draft（阅读 5/30 题 + WT1 10 + WT2 10 + 口语 10）+ 2 rubric + 产线计划（官方 ielts.org 引用）；组卷恒 exam_coming_soon、无跨考试回退 |
| Word Universe | active 351 = 100% gen（qb 0，badProvenance 0）；600 旧 qb draft 封存（600/600 双标记 + 双 promote 门） |
| 旧 qb draft | 最终处置=「不删除、不可 promote」确认完毕；物理清退需 owner 决策 |
| Paper smoke 性能 | 生成器批量取数（toefl full 33.7s→9.5s）+ smoke 并行 3（**169s→61s**，<120s 达标）；validate:papers 41s |
| 人工复审队列 | 110 样本（5 组）+ checklist 就绪，待复审回填 |

## 二、Part B 全门（= Phase 15 final gates，全部 exit 0）

| Command | Exit | Command | Exit |
|---|---|---|---|
| lint | 0 | tsc --noEmit | 0 |
| validate:qbank-v2 | 0 | qa:qsets-v2 | 0 |
| validate:practice-session | 0 | validate:audio-assets | 0 |
| validate:papers | 0 | smoke:papers | 0（61s） |
| smoke:active-serve | 0 | smoke:full-routes | 0 |
| validate:exam-specs | 0 | validate:question-types | 0 |
| validate:data-quality | 0 | validate:rubrics | 0（0 错 0 警） |
| audit:wu-source --fail-on-qb-active | 0 | validate:wu-promote-guards | 0 |

无需解释的警告：无（rubrics 警告已被 IELTS rubric 消除）。

## 三、本计划（Phases 9-15）DB 写入与 promote 汇总

| Phase | DB 写入 | Promote |
|---|---|---|
| 9 口语 MVP | 0 | 0 |
| 10 build-sentence 就绪 | 20 行（10 answer 契约 + 10 qa_flags 清 flag；draft 保持） | 0 |
| 11 IELTS pilot | 2 rubrics + 35 draft sets（+35 items +5 stimuli） | 0 |
| 12 qb 处置确认 | 0 | 0 |
| 13 smoke 并行 | 0 | 0 |
| 14 复审队列 | 0 | 0 |
| **合计** | **全部 manifest 式、幂等验证、draft-only** | **0** |

Active 全程不变：**2854 sets / 4684 items**。draft 6517→6552（+35 IELTS pilot）。

## 四、剩余用户决策

1. **RPC SQL 重应用**（build-sentence 契约校验）——应用后跑 `validate-promotion-rpc.ts`。
2. **build_a_sentence promote 批准**（10 行 → 专项 active；mock 仍排除）。
3. **口语激活批准**（QA + speaking_ready + manifest）。
4. **IELTS listening 音频供应商/成本**（Part C1 听力只产 draft 脚本）。
5. **人工复审队列回填与行动**。
6. **qb draft 物理清退与否**。

## 五、Worktree

本报告提交后 clean（时间戳级 JSON 已 restore；4 个状态快照 JSON——qbank-v2-validation(+35)/qa(33 模板)/rubrics(12)/wu-source(active 351)——作为本计划终态一并提交）。
另见工作区曾出现外部进程（Codex 复审会话）刷新报告与创建临时文件的痕迹（`_tmp_sample.cjs` 等与 eslint 竞态）——均已妥善处理，不影响本计划产物。

## 六、Commits（本计划 7 个 + 收尾）

`fdae050`（P9 speaking MVP）· `35cd668`（P10 build-sentence readiness）· `9fcacdf`（P11 IELTS pilot）·
`9d2dc0f`（P12 qb disposition）· `a26f953`（P13 smoke parallel）· `872046c`（P14 review queue）· 本报告 commit（P15）。

**→ Part B 通过，进入 Part C 大规模 draft 生产。**
