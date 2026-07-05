# TOEFL iBT 2026 非音频题型试产 — 总结报告

**日期：** 2026-06-22
**分支：** `iter5-f1`
**执行：** Claude Code（按 `docs/superpowers/plans/2026-06-22-toefl-2026-non-audio-pilot-claude-execution-prompt.md`）
**模式：** 严格 draft-only —— 不 promote、不 commit、不调 DeepSeek、不碰音频、不改前端/限流
**生成方：** Claude 亲撰原创 JSON（claude-authored），不复制任何 ETS 真题

---

## 0. 复审修订（2026-06-22，Codex 复审反馈 → 已修复）

首轮 6 包试产经 Codex 复审「暂不通过」，提出 P1×3 + P2×3。已逐项修复，**仍保持 draft-only、未扩量、未 promote、未 commit**：

| # | 问题 | 修复 |
|---|---|---|
| P1-1 | 违反 §3.4「规格未确认即停止」：Reading 选项数、Academic 每篇题数无官方依据却继续生产 | **停止 read_daily_life + academic_reading**：删 20 draft/67 items/20 stimuli，源移至 `toefl-2026-pilot-blocked/` + README，记 `official_spec_unverified` |
| P1-2 | build_a_sentence 可被误晋级（promote 不检查 scoring_not_ready） | promote 脚本加硬拦截（scoring_not_ready / official_spec_unverified 一律拒绝）；验证 build_a_sentence eligible 0/rejected 10 |
| P1-3 | build_a_sentence 答案非唯一语序 | **二次修订（复审追加）：** 论元 PP 可前置，靠改句追求绝对唯一不可行 → 不再声称「唯一语序」；将 answer 定义为 **canonical/参考语序（非唯一合法解）**，依赖 scoring_not_ready + promote 硬拦截兜底，待实现可接受排列集合或确认 ETS 判分规则后再解锁 |
| P2-4 | read_daily_life materialType 白名单未真正校验 | 随 P1-1 停止 read_daily_life 而消解 |
| P2-5 | 专项 verifier 仅比数量、非精确一致 | **二次修订（复审追加）：** verify-toefl-pilot 改为**复刻 importer 确定性 hashId 算 legacy_id，逐条 1:1 比对 payload**（input_mode/prompt/choices/answer）、断言**每 set 恰 1 item**、complete_words 断言 input_mode==='spell'、双向（DB 无源外 set）+ 已停题型断言 0。能抓出「旧数据配新源」 |
| P2-6 | 写作字数非官方口径 | Email/Discussion wordLimit 改为 `Project guidance (not an official TOEFL requirement)` 措辞，删 20 重导 |

**修订后保留 4 个已确认题型（各 10 draft）；2 个 MCQ 阅读题型已停止待官方规格确认。** 全套校验复跑全绿（下文 §5）。

## 1. 成果概览（修订后）

**保留 4 个已确认非音频题型，每类恰好 10 sets = 共 40 sets**，全部 `draft`、`active=0`、`level=6`、`exam=toefl`。

| 包 | taskType | template | shape | 管线 | sets | items | 评分 |
|---|---|---|---|---|---|---|---|
| A | complete_the_words | toefl-complete-the-words | **complete_words（新）** | 客观 importer | 10 | 10 | 机器（exact match） |
| D | build_a_sentence | toefl-build-a-sentence | **build_sentence（新）** | 客观 importer | 10 | 10 | 机器（**scoring_not_ready**；answer=canonical/参考语序，非唯一解） |
| E | email_writing | toefl-email-writing（仅文档） | free_text + rubric | 生产性 importer | 10 | 10 | AI/rubric（max 5） |
| F | academic_discussion | toefl-academic-discussion（仅文档） | free_text + rubric | 生产性 importer | 10 | 10 | AI/rubric（max 5） |

**已停止（official_spec_unverified，源保留于 blocked 目录）：** B read_daily_life、C academic_reading（reading_comprehension·toefl）—— 官方未确认选项数 / 每篇题数。

DB 总量：**totalSets 4878**（停止 2 型 −20），draft 4878，active 0。

## 2. 官方规格核验（§3）

前置门禁通过后，先从 **ETS 官方《TOEFL iBT Test Blueprint and Specifications Document 2026》PDF** 核验全部 6 题型（任务名/目的/语境/题数/评分方式/CEFR/篇幅梯度），写入 `reports/toefl-2026-non-audio-spec-check.md`。两个未能逐题确认的细节记为**可调设计参数**（不阻断）：

- `official_optioncount_unverified`：官方 Blueprint 未逐题给定 Reading MCQ 选项数 → 采用 TOEFL 通行 **4 选 1**。
- `build_sentence_scoring_not_ready`：Build a Sentence 官方为机器评分，但本项目的词块重构归一/等价判定能力未确认 → 导入即标 `qa_flags.scoring_not_ready=true`，保持 draft，**不伪造唯一答案**。

## 3. 各包要点

- **A complete_the_words**：8 学术领域 15–55 词原创短文 + 1 个目标词（migration/aqueducts/inflation/durable/biodiversity/diseases/conductor/acquisition/supernova/urbanization）。新建独立 `complete_words` shape：passage 存完整上下文（词数准确）、targetWord 须为词且在文中出现、maskedForm 长度==targetWord 且已显示字母一致、缺失数 1..len-1、目标词所有整词出现都替换为 maskedForm（**不泄露未遮盖副本**）。不复用普通 spell。
- **B read_daily_life**：9 种非学术材料（notice/menu/email/sign/social_media_post/schedule/label/advertisement/message），Social Interpersonal 语境，2–3 题/篇，共 27 题。复用 reading_multi + 新 template（materialTypes 白名单、12–70 词）。
- **C academic reading**：10 篇原创学术说明文（142–172 词），各 4 题（共 40），每篇含 inference 或 organization 高阶题。复用 reading_multi + 新 template（passageType=toefl_academic、120–200 词）。**不复用 CET/高考/考研文章冒充。**
- **D build_a_sentence**：10 组打乱词块重构通顺句，answer 为全排列（每块恰用一次、顺序≠原序），**定义为 canonical/参考语序，非唯一合法解**（论元 PP 可前置）。新建 `build_sentence` shape（chunks 互异、全排列、prompt 不泄露成句、meta.scoringNotReady）。全部标 **scoring_not_ready 10/10** + promote 硬拦截兜底。
- **E email_writing**：10 个 Academic Navigational 情境邮件（改约/续借/小组/报修/志愿/退课/实验室/答疑/补证/求推荐信），交代关系/情境/目的/要点。走生产性管线，**rubric 10/10、free_text 10/10、official=false 10/10**，referencePoints 为评分指引非范文。
- **F academic_discussion**：10 个学术讨论（每个含教授提问 + 两位学生不同观点），要求己见+论据+回应同学。**rubric 10/10、free_text 10/10、official=false 10/10**，无范文/唯一答案。

## 4. 每包流程（§11，全部执行）

每包均：官方规格确认 → template → shape（新建或准确复用）→ fixtures → 跑 fixtures → Claude 亲撰恰好 10 → 源侧/dry-run 结构校验 → 人工抽查 → `--apply` 写 draft → DB QA → **幂等复跑（wrote 0/全 dup-skip）** → 更新 ledger，当前包全绿才进下一包。

## 5. 最终全量校验（§14）—— 全部 EXIT 0

| 校验 | 结果 |
|---|---|
| 答案位置 normalize（objective MCQ） | **applied 1067 choice items；re-run dry-run BEFORE==AFTER 逐桶相同（a241/b273/c281/d272），幂等收敛已证** |
| verify-productive-tasks | 0 |
| verify-authored-lengths | 0 |
| verify-toefl-pilot（专项强校验） | 0（**保留 4 包各 10 draft/0 active**；源↔DB 确定性逐条 1:1 + 完整 payload 比对；D scoring_not_ready 10/10；E/F rubric_id=预期/free_text/official=false/referencePoints/wordLimit/promptZh 全一致；已停 2 型为 0） |
| qa:qsets-v2 | 0（模板 22） |
| validate:qbank-v2 / practice-session / papers | 0 / 0 / 0 |
| audit:qbank-v2-coverage | 0 |
| validate:rubrics / question-types / data-quality | 0 / 0 / 0 |
| lint / tsc --noEmit | 0 / 0 |
| **promote 拦截测试（build_a_sentence）** | **candidates 10 → eligible 0 → rejected 10（reason scoring_not_ready）** |

**硬停不变量：** 全库 `active=0`、`antonym_choice=0`、`cet_cloze=0`。

## 6. Coverage 影响（修订后）

MISSING **9**、THIN **4**：保留的 4 个 TOEFL 非音频 cell 为 THIN（各 10，试产规模）。**9 个 MISSING = 7 个 requiresAudio**（各级 listening + TOEFL 听力/口语，G6-audio 阻塞，范围外）**+ 2 个已停止的 TOEFL 阅读题型**（read_daily_life、academic_reading，待官方确认选项数/每篇题数后恢复）。

## 7. 基础设施改动（additive，向后兼容）

- 新 shape：`complete_words`、`build_sentence`（`ShapeResult.meta.scoringNotReady`）。
- 新 template：4 个客观 + 2 个文档型（E/F 生产性管线直接读 examId/skill/taskType，不消费 template）。
- 新脚本：`scripts/spotcheck-authored.ts`（入库形态抽查）、`scripts/verify-toefl-pilot.ts`（专项 DB 校验）。
- 修复 **qa dataQa 分页**：原 `.like('gen:%').limit(4000)` 被 PostgREST max-rows=1000 截断、只抽样前 1000 个 gen set；改 range 分页拉全量（真实 gen sets 1000→1164，新题确被纳入校验）。
- qa templateQa 的 TOEFL 四技能要求放宽：仅对声明 skills[] 的综合型模板强制，单题型/文档型模板跳过（综合型仍校验）。
- 客观 importer 据 shape meta 写 `qa_flags.scoring_not_ready`。

## 8. 范围与移交

- **未 promote、未 commit、未扩到 50**；音频题型（listening/speaking）未尝试。
- 全部保持 draft，等待人工内容评审后再考虑 promote。
- **移交 Codex 复审。**

## 9. 关联文档

- 官方规格核验：`reports/toefl-2026-non-audio-spec-check.md`
- 机器校验记录：`reports/toefl-2026-non-audio-pilot-validation.json`
- Issue ledger：`reports/qbank-production-issue-ledger.md`（`TOEFL-*` 条目）
