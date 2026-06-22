# TOEFL iBT 2026 非音频题型官方规格核验

**核验日期：** 2026-06-22
**核验人：** Claude Code
**阶段：** TOEFL 2026 非音频题型试产（每类 10 sets，draft-only）

## 官方来源

1. ETS 官方《Test Content and Structure》页：`https://www.ets.org/toefl/test-takers/ibt/about/content.html`
2. **ETS 官方《TOEFL iBT Test Blueprint and Specifications Document（2026 Update）》PDF：**
   `https://www.ets.org/content/dam/ets-org/pdfs/toefl/toefl-ibt-test-specifications-2026.pdf`（权威规格主依据）
3. 样题页 `sample-test-jan-2026-1.html` 为邮件表单墙，无法直接取样题——未作为规格来源。

> 仅采用 ETS 官方页面与官方 Blueprint/Specifications 文档；未使用任何培训机构、博客、论坛或二手题库。
> 官方文档注明规格在正式发布前可能有 minor revisions。

## 总体结构（官方核验）

- 评分：四个分项 + 总分，**1–6 量表**（2 年过渡期另给 0–120 可比分）。
- Reading 段共 50 题、约 18–21 分钟（+9 分钟 router），两阶段自适应。
- Writing 段共 12 题、约 23 分钟，线性（所有考生同一套题）。
- Machine Scored = 选择/规则匹配（exact match / 预定义逻辑）；AI Scored = 构答（写作/口语），rubric 评分。

## 六种非音频题型规格

### A. Complete the Words（→ taskType `complete_the_words`）
- **官方目的：** Process academic written texts for meaning and form；subskill「use word-ordering rules, lexical knowledge, and reading comprehension to construct meaningful text」。
- **输入材料：** 学术语境短文/句群（Academic language use）。
- **作答方式：** 在语境中补全词形（拼写/词形/阅读识别），机器评分（规则匹配/exact match）。
- **官方题数：** 每份测试 30 项（本阶段试产 10 sets）。
- **CEFR：** B1–C1+。**篇幅：** 与 Reading 文本难度一致，简单文本 15–50 词。
- **答案结构：** 恢复上下文中唯一正确的完整词形（masked 部分字母 + 已显示字母）。
- **评分：** Machine，max 1 pt/项。**rubric：** 否。
- **taskType：** `complete_the_words` · **template：** `toefl-complete-the-words` · **shape：** `complete_words`（独立 shape）。
- **与现有 schema 差异：** 现有无 complete_words shape，需新增独立 shape（masked form / 已显示字母位置 / 唯一可恢复答案校验）；不得复用普通 spell。

### B. Read in Daily Life（→ taskType `read_daily_life`）
- **官方目的：** Read and comprehend information presented in a variety of formats；subskill「Understand short non-academic written texts」。
- **输入材料：** 短的非学术实用文本（**官方举例：sign、menu、email、social media post**）；Social Interpersonal 语境。
- **作答方式：** MCQ（机器评分）。官方明确为 **2-item 和 3-item sets**（每篇材料配 2 或 3 题）。
- **官方题数：** 该 claim 下 5–15 项（本阶段试产 10 sets）。
- **CEFR：** A1–C1。**篇幅：** 简单文本 15–50 词（与 Reading 难度梯度一致）。
- **答案结构：** 每题 4 选 1，唯一正确（⚠️ 官方 Blueprint 未逐题给定选项数，采用 TOEFL 通行 4 选 1 设计，已在 ledger 记 `official_optioncount_unverified`，作为可调设计参数）。
- **评分：** Machine，max 1 pt/题。**rubric：** 否。
- **taskType：** `read_daily_life` · **template：** `toefl-read-daily-life` · **shape：** `reading_multi`（复用，含 materialType 白名单与 word_count 范围）。
- **与现有 schema 差异：** 复用 reading_multi（passage+questions），新增 template 携带 materialType 白名单与 TOEFL 短文 word_count 范围。

### C. Read an Academic Passage（→ taskType `reading_comprehension`）
- **官方目的：** Understand academic text by identifying main ideas, key details, inferred meanings, idea relationships, and rhetorical structures。
- **输入材料：** 原创学术说明文（Academic 语境）；不得复用 CET/高考/考研文章冒充。
- **作答方式：** MCQ（机器评分）。
- **官方题数：** 该 claim 下 5–15 项（本阶段试产 10 sets）。
- **CEFR：** B1–C2。**篇幅：** 复杂学术文本可至 200 词（官方 Text Difficulty：复杂文本 up to 200 words；难度 Lexile 800–1360+ / FK 7.4–20.0）。
- **答案结构：** 每题 4 选 1，唯一正确；每篇至少含 1 题 inference/organization 等高阶理解题。
- **评分：** Machine，max 1 pt/题。**rubric：** 否。
- **taskType：** `reading_comprehension` · **template：** `toefl-academic-reading`（TOEFL 专属篇幅 + passageType=toefl_academic）· **shape：** `reading_multi`（复用）。
- **与现有 schema 差异：** 复用 reading_multi；新增 TOEFL 专属 template（篇幅上下限、qa_flags.passageType）。

### D. Build a Sentence（→ taskType `build_a_sentence`）
- **官方目的：** Reconstruct sentences with appropriate grammar；subskill「Reconstruct a range of sentence structures」。
- **输入材料：** 提供词块/词，考生按语法规则重构句子（Social Interpersonal 语境）。
- **作答方式：** 词块排序/重构，**Machine Scored**（规则匹配）。
- **官方题数：** 10 项（本阶段试产 10 sets）。**CEFR：** A1–C2。
- **答案结构（官方意图）：** 词块的正确语序；官方机器评分可能接受多个等价排列。**本项目实现：仅存 canonical/参考语序（非唯一合法解），未实现「可接受排列集合」**——故标 `scoring_not_ready`，不作自动判分（见下「自动评分就绪性」）。
- **评分：** Machine，max 1 pt/项。**rubric：** 否。
- **⚠️ 自动评分就绪性：** 官方为机器评分，但本项目当前评分引擎对词块重构的 normalization/等价判定能力未确认。按执行文档 §8.3，本包导入后将标记 `qa_flags.scoring_not_ready=true`，保持 draft，不伪造唯一答案。
- **taskType：** `build_a_sentence` · **template：** `toefl-build-a-sentence` · **shape：** `build_sentence`（独立 shape：chunks 非空且互异、answer 为合法全排列且每块恰用一次、prompt 不泄露成句；**未实现等价排列集合校验** → scoring_not_ready）。
- **与现有 schema 差异：** 现有无 build_sentence shape，需新增；不得用普通 free_text 假装支持。

### E. Write an Email（→ taskType `email_writing`）
- **官方目的：** Write effective responses to common situations in academic contexts；subskill「Write appropriate multi-sentence text」。
- **输入材料：** 情境邮件提示（sender/recipient relationship、situation、communicative purpose、要点）；Academic Navigational 语境。
- **作答方式：** 构答（多句邮件），**AI Scored / rubric**，input_mode=free_text。
- **官方题数：** 1 项/测试（本阶段试产 10 sets）。**CEFR：** B1–C2。
- **答案结构：** 非官方答案占位 `{type:"rubric_scored", official:false}` + referencePoints；不提供范文/唯一答案。
- **评分：** AI/rubric，**max 5 pts**。**rubric：** 是（toefl/writing rubric，覆盖 100%）。
- **taskType：** `email_writing` · **template：** `toefl-email-writing` · 走 productive importer（free_text）。
- **与现有 schema 差异：** 复用 productive importer + toefl/writing rubric；新增 template。

### F. Write for an Academic Discussion（→ taskType `academic_discussion`）
- **官方目的：** Write academic paragraph text that present a clear, well-supported argument using varied grammar and vocabulary。
- **输入材料：** professor question + academic/社会话题 + 至少两位学生不同观点；Academic 语境。
- **作答方式：** 构答（段落论证），**AI Scored / rubric**，input_mode=free_text。
- **官方题数：** 1 项/测试（本阶段试产 10 sets）。**CEFR：** B1–C2。
- **答案结构：** 非官方占位 + referencePoints；考生可同意/反对/第三观点；不设唯一答案、不提供范文。
- **评分：** AI/rubric，**max 5 pts**。**rubric：** 是（toefl/writing rubric，覆盖 100%）。
- **taskType：** `academic_discussion` · **template：** `toefl-academic-discussion` · 走 productive importer（free_text）。
- **与现有 schema 差异：** 复用 productive importer + toefl/writing rubric；新增 template。

## 核验结论

- 六种非音频题型的官方任务名称、目的、语境、评分方式、CEFR、篇幅梯度已从官方 Blueprint/Specifications 文档核验。
- Email / Academic Discussion 走现有 productive 管线（free_text + rubric），toefl/writing rubric 已存在（validate:rubrics 0）。
- complete_words / build_sentence 需新增独立 shape。

## 复审修订（2026-06-22，Codex 复审反馈）

复审指出：§3.2 要求逐型确认「选项数」，§3.4 要求「无法确认则停止该题型」。据此重判两个 MCQ 题型：

- **read_daily_life — 已停止（`official_spec_unverified`）。** 官方 Blueprint 仅以「selected-response formats (e.g., multiple choice)」描述，**未给定 Reading MCQ 选项数**；"2-item and 3-item sets" 已确认，但选项数未确认。原按 4 选 1 生产属凭惯例假设，违反 §3.4 → **停止该题型，删除其 10 个 draft，源文件移至 `data/generated-question-sets/toefl-2026-pilot-blocked/`**。
- **academic_reading（reading_comprehension·toefl）— 已停止（`official_spec_unverified`）。** 除选项数未确认外，官方仅给 items 5–15/claim（整段 claim），**未给定每篇题数**；原用「每篇 3–4 题」属假设 → 同样停止，删除 10 个 draft，源移至 blocked。
- 重新启用条件：待 ETS 官方明确给出 Reading MCQ 选项数与（学术阅读）每篇题数后，按官方数字修正 template+源文件，移回 pilot 目录重导（见 blocked 目录 README）。**不得在官方确认前凭记忆/惯例恢复。**

仍保留并已修复的细节：

- **`build_sentence_scoring_not_ready`（含 P1 复审二次修订）：** Build a Sentence 官方为机器评分，本项目词块重构等价判定/可接受排列集合**未实现** → 保持 draft + `qa_flags.scoring_not_ready=true`，并给 `promote-question-sets-v2.ts` 加硬拦截（scoring_not_ready 一律拒绝晋级，已实测 eligible 0/rejected 10）。**答案定位为 canonical/参考语序，非唯一合法解**——英语论元 PP 可前置（如 "On their success, the manager congratulated the team."），靠改句子追求绝对唯一不可行，故不再声称「唯一语序」；当前 answer 仅作参考排序，待实现可接受排列集合或确认 ETS 实际交互/判分规则后再解锁评分。
- **写作字数为项目建议，非官方口径：** Email「约 90–120 词」、Discussion「约 100 词以上」在官方 Blueprint **无明确依据**，已改写为 `Project guidance (not an official TOEFL requirement)` 措辞，不表现为考试硬规则。

修订后本试产保留 **4 个已确认题型**：complete_the_words、build_a_sentence、email_writing、academic_discussion（各 10 draft）。
