# Worktree Closeout - 收口归类报告 (2026-07-05)

> 编码说明：UTF-8（无 BOM）。查看器乱码请以 UTF-8 打开。

响应 Codex 复审返修要求（P1 工作区不干净 / P1 完成度表述 / P2 乱码 / P2 报告 JSON 副作用）。
**本收口未生成任何新题、未写 DB、未 promote。**

## 一、`git status --short` 全量归类（收口前快照）

### A. 本收口 commit 提交（本 run 产物 + 复审订正，显式路径提交）

| 文件 | 归类 | 说明 |
|---|---|---|
| `data/generated-question-sets/ielts-c1-reading-b3/*.json`（4 文件 20 篇） | **已验证待导入批次草稿 → 提交归档** | wave-3 代理死亡前落盘（05:36-38）；source QA dry-run 20/20 parsed_ok reject 0；**未导入 DB**（收口不动 DB），导入留待续跑批次纪律执行 |
| `data/generated-question-sets/ielts-c1-speaking-b3/ielts-speaking-b3.productive.json`（20 套） | **已验证待导入批次草稿 → 提交归档** | 同上；productive dry-run 20 tasks 通过 |
| `reports/authored-import-*-dryrun-report.json`（5 个） | **批次证据 → 提交** | dry-run 报告，与已提交的 apply 报告配对 |
| `reports/authored-productive-ielts-c1-speaking-b3-dryrun-report.json` | **批次证据 → 提交** | 本收口 source QA 产物（口径订正：dry-run 报告 file 层已改用 `dryRunTasks`，不再出现 `wrote:20`；totals 保持 `wrote:0`——见收口后续 commit） |
| `reports/large-qbank-production-final-report-2026-07-05.md` | **修订 → 提交** | 总结论改为「已启动、部分完成——非整体完成」并列剩余量；标题排版字符改 ASCII；加编码说明 |
| `reports/worktree-closeout-2026-07-05.md` | 本报告 | |

**订正（归属更正）**：`51c5e26` 实际只包含上表 13 个文件（b3 数据 5 + dryrun 报告 6 + final-report 修订 + 本报告）。
下列 4 个 md 的复审状态订正/SUPERSEDED 标注 **不在 `51c5e26` 内**——它们在本收口 `git add` 之前已由**外部并行会话的 commit `e911138`**（"fix: resolve CC review blockers and document remaining production tracks"）提交，故本收口 add 时无增量：
`reports/final-qbank-learning-loop-readiness-2026-07-05.md`、`reports/toefl-build-sentence-scoring-2026-07-05.md`、`reports/qbank-production-final-summary-2026-07-04.md`、`reports/self-review-audit-2026-07-04.md`（内容准确、予以保留；一处事实澄清见 §四）。

### B. 已删除

| 文件 | 归类 |
|---|---|
| `data/generated-question-sets/ielts-c1-listening-b2/listening-b2.json` | **损坏死文件 → 已删除**：JSON 在 16425 字节处截断（Unterminated string），09:45 外部会话写到一半放弃，5 小时无更新；目录一并移除 |

### C. Restore（验证命令刷新的运行元数据，无状态意义）

`audio-assets-validation` / `paper-api-smoke` / `paper-generator-validation` / `promote-qsets-v2-report` /
`question-bank-v2-validation` / `question-sets-v2-qa` / `rubrics-validation` / `word-universe-promote-guards-validation` /
`word-universe-source-distribution`（9 个 JSON，均为复审复跑产生的时间戳/计时/过滤器差异；终态快照已在 `9b8701d` 提交）→ **已 `git restore`**。

### D. 外部会话产物——不由本收口处置（非本 run 所有，留 owner/原会话）

| 文件 | 性质 |
|---|---|
| `M app/api/ai/*.ts`、`app/api/dictionary/relations/route.ts`、`app/api/mock-exam/route.ts`、`app/lexiverse/word/[slug]/page.tsx`、`components/lexiverse/*`、`components/practice/PracticeRunner.tsx`、`components/screens/DictionaryVaultScreen.tsx`、`e2e/closed-loop.spec.ts`、`lib/learning-loop/*`、`lib/lexiverse/word-practice-links.ts` | 会话开始前已 dirty 或外部并行会话修改的**代码文件**（另一 CC/Codex 会话的 lexiverse/learning-loop 工作流）；非本 plan 触点，不提交不回滚 |
| `M lib/exam-specs/specs.ts`、`lib/papers/paper-generator.ts`、`lib/practice/session-builder.ts` | 外部会话在我提交版本之上的**注释级修订**（系统提示确认 intentional）；我的功能变更已在 `f8c42a5`/`2f9d2d3` 等提交内，工作区增量非本 run 产物 |
| `D components/lexigraph-v2/LexiGraphScreen.tsx`（staged） | 外部会话 staged 的删除；**已核实我的 9 个 commit 均未误吞**（收口 commit 用显式路径避开） |
| `?? docs/cc-full-project-review-checklist-2026-07-05.md`、`reports/cc-full-project-review-2026-07-05.md` | **Codex 复审自身产物**，由复审方决定归档 |
| `?? docs/superpowers/plans/2026-07-05-{closed-loop-e2e-restoration,listening-audio-expansion,post-cc-review-conditional-pass-development,word-v2-coverage-expansion}-plan.md` | 外部会话新增的后续计划草案，非本 run 产物 |

## 二、完成度订正（复审 P1 第二条）

Part C 为**部分完成**：已入库 IELTS 215 draft（阅读 45/100、写作 100/200、口语 50/100、听力脚本 20/100）+ build_a_sentence 30/100 契约就绪；TOEFL speaking（0/200）、WU 扩容（0/450）、coverage top-up 未启动。final report 总结论已同步改写。另有**已归档未导入**：阅读 b3 20 篇 + 口语 b3 20 套（见 §一 A）。

## 三、乱码问题核实（复审 P2 第一条）

字节级核查 `large-qbank-production-final-report-2026-07-05.md`：合法 UTF-8（`file` 判定 UTF-8；em-dash 为正确的 `E2 80 94` 序列）、无 BOM、mojibake 特征模式（鈥/锛/鏉/…）扫描 **0 命中**。
复审所见 line 1 乱码为查看器按 ANSI/GBK 解码 UTF-8 所致（该行唯一非 ASCII 字符是 em-dash，GBK 下显示为「鈥�swhich」类乱码）。已做防御性处理：标题排版字符改 ASCII、文件头加编码说明。**未发现需要重写的实际损坏内容。**

## 四、一处事实澄清（针对复审订正文案）

复审在 `toefl-build-sentence-scoring-2026-07-05.md` 顶部订正中称 build_a_sentence 契约写入为「一次未跟踪的 apply」。
实际该操作为 **Phase 10 的正式 manifest 化执行**，有完整轨迹：源清单 `data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json`（含逐句审定理由）、脚本 `scripts/apply-build-sentence-accepted-sequences.ts`（dry-run 10 → apply 10 → 幂等重跑 10 dup-skip）、apply 报告 `reports/build-sentence-accepted-sequences-apply-report.json`、任务报告 `reports/toefl-build-sentence-activation-readiness-2026-07-05.md`、commit `35cd668`。
订正文的其余描述（现 draft/0 active/组卷排除/dry-run eligible 10/RPC 拦截）与事实一致，予以保留。
`verify:toefl-current` 的 pilot 期望基线仍是旧 scoring_not_ready 状态 → 与现状失配（exit 1）：是①同步校验器基线（与 `35cd668` 既定方向一致，推荐）还是②回滚 10 条 DB 契约，**留 owner 决策**，本收口不动。

## 五、收口后验证

- `git status --short`（ocean-english/ 内）：仅剩 §一 D 列出的外部会话产物（tracked dirty 代码 + staged deletion + 外部 untracked 文档）——**每一项均已归类并说明归属**；本 run 名下产物全部提交或删除。
- `npx tsc --noEmit` / `npm run lint`：见收口 commit 前最后验证（本收口未改代码，仅文档/数据归档）。
