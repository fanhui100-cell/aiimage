# Post-CC-Review PR Closeout — 2026-07-05

> 收尾治理任务报告：把 iter5-f1 分支的审查报告、校验器、PR 范围和工作区状态整理到一致、可合并状态。
> 全程约束遵守情况：**无 DB reset/delete/promote、无题库内容修改、无新题生成、未调用 DeepSeek、IELTS 未打开、TOEFL active / Word Universe active / paperReady 未改动。**

## 1. 本轮做了什么

| Phase | 内容 | 结果 |
|---|---|---|
| 0 | 状态核验（git 状态、改动分类、报告存在性） | 无停止条件；4 个脏 JSON 确认 timestamp-only |
| 1 | 主审查报告一致性核查 | 已是统一口径（e056273 修过），本阶段零修改；Phase 2 后做了联动更新 |
| 2 | 同步 `verify:toefl-current` pilot 期望基线 | **恢复 exit 0**。pilot 断言从"scoring_not_ready=true + legacy index answer"更新为"accepted_sequence_exact 契约对象（canonical 锚定源记录 + acceptedSequences 与已审定契约逐一比对）+ flag 已清 + **status 收紧为 draft-only**（旧基线允许 active，这里是收紧非放宽）"；draft 规模锁 10→30（承认已提交 C3 批次 `e7e17cf`，import 记录见 51c5e26 的 dryrun 报告）；新增组卷器 `PAPER_EXCLUDED_TASK_TYPES` 静态断言（build_a_sentence / listen_and_repeat / interview_speaking 3/3）。speaking excluded、retired 0 active、answerKey 不前泄等其余门禁**原样保留** |
| 3 | 运行时 smoke（127.0.0.1:3107，非 3000） | 5/5 PASS，详见 `reports/post-cc-runtime-smoke-2026-07-05.md`（含 `/lexiverse?word=benefit` 本轮走 focus-miss 可控降级分支的差异说明） |
| 4 | PR 范围清理 | 见 §2/§3；识别出并行 IELTS 生产会话的文件并排除 |
| 5 | 全量回归 | 14/14 exit 0 + 8 项安全确认全过（§8） |
| 6 | 本报告 + 收尾 commit | 见下 |

## 2. 本轮改动文件（追加 commit 纳入 PR）

- `scripts/verify-toefl-pilot.ts` — build_a_sentence pilot 期望基线同步（契约断言，draft-only 收紧，canonical 防篡改锚定）
- `scripts/verify-toefl-current.ts` — draft 规模锁 10→30 + 组卷器排除静态断言 + 过时注释同步
- `reports/cc-full-project-review-2026-07-05.md` — 6 处联动更新（"exit 1 已解释/基线待同步" → "基线已同步，恢复 exit 0"）
- `reports/post-cc-runtime-smoke-2026-07-05.md` — 新增，第二轮运行时 smoke 证据
- `reports/post-cc-review-pr-closeout-2026-07-05.md` — 本报告

## 3. 排除文件（不纳入 PR）

- **timestamp-only validator JSON（6 个，逐一 diff 验证仅 generatedAt/计时行）**：`authored-import-ielts-c1-reading-b3-dryrun-report.json`、`authored-productive-ielts-c1-speaking-b3-dryrun-report.json`、`question-bank-v2-validation.json`、`question-sets-v2-qa.json`、`paper-generator-validation.json`、`toefl-task-alignment-validation.json`
- **仓库根无关项**：`.claude/settings.local.json`、`.claude/scheduled_tasks.lock`、`korean-cosmos` submodule、`.agents/skills/`、`.claude/skills/`、`.firecrawl/`、根 `reports/`、`shanju/`、`test-results/`、`tmp/`、`ocean-english-lexiverse-poetrycloud-spike/`
- **并行 IELTS 生产会话的文件（非本轮工作，留给其会话自行提交）**：`data/generated-question-sets/ielts-c1-{listening-b2, reading-b4, speaking-b4, speaking-b5, writing-b3, writing-b4}/` 与 7 个 `reports/authored-*-ielts-c1-*-{apply,dryrun}-report.json`。**说明**：这些文件在本任务 Phase 0 之后出现，证明有另一会话在并行导入 IELTS **draft**（apply-report 存在）；已确认 IELTS active 仍为 0（见 §7），不触发停止条件，但如实报告。
- ~~待 owner 确认~~ **已确认（owner，2026-07-05）：`docs/cc-full-project-review-checklist-2026-07-05.md` 纳入 PR**（审查清单输入文档，随收尾一并入库留档）

## 4. DB 写入

**本轮无任何 DB 写入。** 只读操作：service-role SELECT（契约形状采样、IELTS active/draft 计数）+ 各 validator 的只读查询。并行 IELTS 会话的 draft 导入非本任务所为（见 §3）。

## 5. verify:toefl-current

**恢复 exit 0** ✓（基线同步后连续两次运行确认）。关键输出：pilot 契约 10/10 一致（accepted_sequence_exact · draft-only）、`build_a_sentence draft=30 / active=0`、阻塞/退役 active=0、`PAPER_EXCLUDED_TASK_TYPES` 静态断言 3/3、gen active=2720。

## 6. P1-2 当前状态

**已决策并收尾完毕**：owner 决策（2026-07-05）接受现状，不回滚 DB，不 promote，不激活；审计产物入库（`35cd668`）；两份 07-05 专项报告带"已决策"订正横幅；校验器基线已同步且恢复 exit 0；30 条 build_a_sentence（10 pilot + 20 C3）全部 draft、active=0、组卷器排除。`promote --apply` 仍被禁止，直至 owner 批准且 server RPC 确认。

## 7. IELTS 当前状态

- `lib/exam-specs/specs.ts`：**coming_soon**（validate:exam-specs 确认："ielts (lv8, coming_soon)"）
- DB 只读计数：**active = 0**，draft = 425（并行生产会话持续导入 draft 中，未打开）
- `smoke:papers` 口径（本日早间已验）：IELTS mini/full 均以 `exam_coming_soon` 拒绝

## 8. 全部命令 exit code

| 命令 | exit |
|---|---:|
| `npm run lint` | 0 |
| `npx tsc --noEmit --incremental false` | 0 |
| `npm run validate:exam-specs` | 0 |
| `npm run validate:qbank-v2` | 0 |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run validate:papers` | 0 |
| `npm run validate:rubrics` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:toefl-task-alignment` | 0 |
| `npm run verify:toefl-current` | **0**（本轮由 1 修复） |
| `npm run smoke:full-routes` | 0 |
| `npm run smoke:active-serve` | 0 |
| （补充）`npm run audit:wu-source` | 0（gen 351 / qb 0 / badProvenance 0） |

八项确认：① IELTS coming_soon ✓ ② IELTS active=0 ✓ ③ build_a_sentence 全 draft / active=0 ✓ ④ 无 promote ✓ ⑤ Word Universe active 无改动（351 全 gen）✓ ⑥ TOEFL active 无非预期改动（gen active=2720，100/100/100）✓ ⑦ 无 answerKey/transcript 前泄（active-serve + mock-exam smoke ×4）✓ ⑧ 无 retired types active（antonym_choice/cet_cloze=0）✓

## 9. 剩余后续任务

1. **IELTS 题库生产续跑** — 并行会话进行中（draft=425），保持 coming_soon 直至内容/rubric/组卷就绪
2. **IELTS / TOEFL 听力音频供应商与成本决策** — 见 `2026-07-05-listening-audio-expansion-plan.md`
3. **Word-level v2 coverage 扩大**（255 → ≥2,000 词）— 见 `2026-07-05-word-v2-coverage-expansion-plan.md`
4. **Build-a-Sentence promote 是否批准** — owner 决策项；批准前需确认 server RPC 契约识别
5. **非 MCQ IELTS 官方题型实现** — IELTS 开放前的产品工作
6. （小项）closed-loop e2e 三条用例重写（`2026-07-05-closed-loop-e2e-restoration-plan.md`）；**[P3，owner 确认不阻塞合并]** `galaxyForWord` 多等级词选带稳定性（smoke 报告 §检查项 4：优先按 `primaryLevel` 选带并优先选静态词表实含该词的星系）

## 10. 是否建议合并 PR

**建议合并**（本 commit 推送后）。理由：全部 15 条门禁 exit 0（含此前唯一红灯 `verify:toefl-current`）；主审查报告、两份专项报告、校验器、DB 状态四者口径一致；运行时 smoke 5/5；PR 范围干净（无 `.claude/*`、无 submodule、无 timestamp JSON、无并行会话文件）。合并不影响并行 IELTS 生产（其文件不在本 PR）。
