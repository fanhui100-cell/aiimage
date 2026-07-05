# TOEFL 2026 非音频题型试产：Claude Code 严格执行提示词

> 执行者：Claude Code
>
> 执行日期：2026-06-22 起
>
> 工作目录：`ocean-english`
>
> 阶段目标：完成 TOEFL 2026 六种非音频题型的基础设施和小批试产，每类恰好 10 sets，完成后停止并交 Codex 复审。

## 0. 最高优先级执行纪律

必须严格按照本文档执行。本文档是本阶段唯一任务边界，不得擅自更改目标、扩展范围或跳过检查。

1. 开始前完整阅读本文档，不得只读取局部章节。
2. 按本文档规定的题型顺序逐包执行。
3. 每包必须完成：官方规格核验、template、shape、fixtures、源文件校验、dry-run、人工自审、draft 导入、DB QA、幂等复跑和 issue ledger 更新。
4. 当前包没有通过全部检查时，不得开始下一包。
5. 每类只允许试产 10 sets，不得自行扩到 50。
6. 不得调用 DeepSeek 或其他外部生成 API。内容由 Claude 亲自原创。
7. 不得复制、改写、翻译或近似复刻 ETS 真题及官方样题原文。
8. 全部内容只能写为 `draft`，不得出现任何 `active` 写入。
9. 不执行任何 promote 命令。
10. 不做听力、口语、音频生成、音频上传或音频存储。
11. 不改前端、不改限流、不做无关重构。
12. 不得用普通旧题型假冒 TOEFL 新题型。
13. 如遇非阻断问题，写入 issue ledger，隔离当前失败包后继续其他已确认题型。
14. 如触发本文档的硬性停止条件，立即停止整个任务，输出错误位置、影响范围、已写入数据和恢复建议。
15. 完成六包后立即停止，等待 Codex 复审。

## 1. 前置依赖门禁

TOEFL 生产开始前，必须确认上一阶段生产性 importer 修复已经完成。逐项实测，不得只引用旧报告。

### 1.1 必须满足

- productive importer 的 old/new hash 向后兼容。
- 无 `sourceText` 的历史 prompt-only task 重跑不会生成重复题。
- 有 `sourceText` 的翻译/续写 task 使用包含源文的稳定 hash。
- source JSON 与 DB 存在可解释的一一对应关系。
- 已废弃 G5 pilot 已删除、归档或加入明确 exclude manifest。
- 已存在 `verify-productive-tasks.ts`，并校验生产性题规格。
- productive stimulus 写入 `word_count`。
- 中文材料字符数写入 `qa_flags.sourceCharCount` 或等价受校验字段。
- importer 重跑时新增写入为 0，或全部命中明确的 dup-skip。
- `active=0`。
- `antonym_choice=0`。
- `cet_cloze=0`。

### 1.2 前置验证

必须运行：

```powershell
npx tsx scripts/verify-productive-tasks.ts
npm run validate:qbank-v2
npx tsx scripts/qbank-v2-snapshot.ts
```

如任一前置条件失败：

- 不开始 TOEFL 内容生产。
- 先修复上一阶段问题。
- 生成阻断报告。
- 修复后重新执行本节全部门禁。

## 2. 本阶段允许范围

只允许处理以下六种 TOEFL 2026 非音频题型：

1. `complete_the_words`
2. `read_daily_life`
3. `reading_comprehension`
4. `build_a_sentence`
5. `email_writing`
6. `academic_discussion`

最终数量要求：

| 题型 | 目标 sets | exam_id | level | 状态 |
|---|---:|---|---:|---|
| `complete_the_words` | 10 | `toefl` | 6 | `draft` |
| `read_daily_life` | 10 | `toefl` | 6 | `draft` |
| `reading_comprehension` | 10 | `toefl` | 6 | `draft` |
| `build_a_sentence` | 10 | `toefl` | 6 | `draft` |
| `email_writing` | 10 | `toefl` | 6 | `draft` |
| `academic_discussion` | 10 | `toefl` | 6 | `draft` |

本阶段合计恰好 60 sets。不得擅自增加。

## 3. 官方规格核验

写代码或题目之前，必须先核验 TOEFL 2026 官方任务结构。

### 3.1 必读项目文件

- `lib/exam-specs/specs.ts`
- `lib/exam-specs/types.ts`
- `reports/exam-format-vs-question-bank-audit-2026-06-20.md`
- `reports/question-bank-rebuild-analysis-2026-06-20.md`
- `docs/design-briefs/2026-06-20-question-bank-system-redesign.md`
- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-development-plan.md`

### 3.2 官方来源

优先使用 `lib/exam-specs/specs.ts` 的 TOEFL `sourceUrls`，只核验 ETS 官方页面和官方样题说明。

不得将培训机构、博客、论坛或二手题库作为唯一规格来源。

### 3.3 必须先生成规格报告

创建：

`reports/toefl-2026-non-audio-spec-check.md`

每种题型必须记录：

- 官方任务名称。
- 官方任务目的。
- 输入材料形态。
- 作答方式。
- 题数和选项数。
- 篇幅、句长或材料长度。
- 答案结构。
- 自动评分或 rubric 评分方式。
- 项目对应 taskType。
- 所需 template。
- 所需 shape。
- 是否需要 rubric。
- 官方来源链接。
- 核验日期。
- 与现有项目 schema 的差异。

### 3.4 无法确认时的处理

如果某题型无法从官方来源确认：

- 在 issue ledger 记录 `official_spec_unverified`。
- 停止该题型。
- 不得凭记忆或猜测设计题型。
- 可以继续其他已确认题型。

## 4. 数据、类型与 schema 原则

开始每类题型前检查：

- `types/question-bank-v2.ts`
- `lib/question-bank-v2/schema.ts`
- `lib/question-bank/question-type-taxonomy.ts`
- `lib/exam-specs/types.ts`
- `lib/exam-specs/specs.ts`
- `lib/exam-task-templates/shape.ts`
- `lib/practice/session-types.ts`
- `lib/practice/session-builder.ts`
- `lib/papers/paper-generator.ts`
- `lib/papers/scoring.ts`

约束：

1. 只允许 additive 修改。
2. 不删除或重命名既有字段。
3. 不改变 v1 行为。
4. 不改变退役题型策略。
5. 不把 TOEFL 新题映射成语义错误的旧题型。
6. 如果现有 schema 无法准确表达题型，先记录设计问题，再做最小、向后兼容的 shape 扩展。
7. 如需要前端 renderer，先输出 `FRONTEND_CHANGE_NOTICE`，不在本阶段自行实现前端。
8. renderer 未就绪的题保持 draft，并在 `qa_flags` 标记 `renderer_not_ready`。
9. 自动评分未就绪的题保持 draft，并标记 `scoring_not_ready`。

## 5. Package A：complete_the_words

### 5.1 目标

- 目录：`data/generated-question-sets/toefl-complete-words-pilot/`
- template：`toefl-complete-the-words`
- taskType：`complete_the_words`
- level：6
- sets：10
- status：`draft`

### 5.2 题型要求

- 必须是语境中的词形、拼写和阅读识别任务。
- 不得做成孤立单词听写。
- 每组必须有原创文本或完整句群。
- 被补全词必须能由上下文推断。
- 缺失字母和保留字母规则必须与官方规格一致。
- 答案必须恢复为上下文中正确的完整词形。
- 不允许多个合理拼写答案。
- 不用冷僻专有名词凑题。
- prompt 不得直接泄露答案。

### 5.3 独立 shape

建立独立 shape，例如 `complete_words`。不得直接复用普通 `spell` 逃避建模。

Shape 必须检查：

- passage 非空。
- targetWord 非空。
- masked form 非空。
- masked form 与答案长度一致。
- 已显示字母位置与答案一致。
- 缺失位置数量正确。
- answer 代回后可恢复正确文本。
- answer 唯一。
- 大小写和标点规则明确。
- level=6。
- exam=toefl。
- status=draft。

### 5.4 fixtures

至少包含：

- 合法 fixture：accept。
- passage 为空：reject。
- answer 为空：reject。
- masked form 长度不一致：reject。
- 已显示字母与答案冲突：reject。
- 多答案或无法恢复：reject。

## 6. Package B：read_daily_life

### 6.1 目标

- 目录：`data/generated-question-sets/toefl-daily-life-pilot/`
- template：`toefl-read-daily-life`
- taskType：`read_daily_life`
- level：6
- sets：10
- status：`draft`

### 6.2 材料类型

必须覆盖多种原创实用文本：

- 邮件。
- 通知。
- 公告。
- 短消息。
- 活动安排。
- 校园服务说明。
- 日程。
- 规则或指引。

### 6.3 内容要求

- 每份材料原创。
- 材料长度按官方核验结果写入专属 template。
- 测试目的、细节、行动要求、时间地点和隐含意图。
- 不能全部是照抄原句的细节题。
- 每题恰好 4 options。
- 只有一个正确答案。
- 干扰项来自材料中的相近信息，但可明确排除。
- `stimuli.word_count` 必须写入。
- `qa_flags.materialType` 必须来自白名单。

### 6.4 shape 校验

- materialType 白名单。
- passage 非空。
- question 数量符合官方规格。
- 每题 exactly 4 options。
- option 文本非空且不重复。
- answer 命中 option id。
- word_count 在 template 范围内。
- subskills 合法。

## 7. Package C：TOEFL academic reading_comprehension

### 7.1 目标

- 目录：`data/generated-question-sets/toefl-academic-reading-pilot/`
- template：`toefl-academic-reading`
- taskType：`reading_comprehension`
- level：6
- sets：10
- status：`draft`

### 7.2 内容要求

- 必须是原创学术说明文。
- 不得复用 CET、高考或考研文章冒充 TOEFL。
- 主题至少覆盖生命科学、地球科学、历史、社会科学和艺术史。
- 不能要求专业背景知识才能作答。
- 题型按照官方核验结果覆盖：
  - factual information
  - inference
  - vocabulary in context
  - purpose/function
  - organization/main idea
  - 其他经官方确认的题型
- 每篇题数按官方规格或已记录的试点约束。
- 每题 4 选 1，唯一正确。
- 干扰项必须合理，不得明显荒谬。
- `qa_flags.domain` 或 `qa_flags.passageType` 必须明确标识 TOEFL academic。
- `stimuli.word_count` 必须写入。

### 7.3 shape 校验

- 使用 TOEFL 专属篇幅上下限。
- passage 非空。
- 每篇题数正确。
- 每题 options=4。
- answer 命中 options。
- options 不重复。
- subskill 分布合法。
- 每篇至少包含一题 inference、organization 或其他官方确认的高阶理解题。
- 不得挂 CET、考研或通用宽松模板。

## 8. Package D：build_a_sentence

### 8.1 目标

- 目录：`data/generated-question-sets/toefl-build-sentence-pilot/`
- template：`toefl-build-a-sentence`
- taskType：`build_a_sentence`
- level：6
- sets：10
- status：`draft`

### 8.2 官方形态优先

必须先根据官方规格确定：

- 是否为词块排序。
- 是否提供固定 chunks。
- 每个 chunk 是否只能使用一次。
- 是否允许额外词。
- 标点和大小写如何处理。
- 是否存在多个语法等价答案。
- 自动评分需要何种 normalization。

不得在官方形态未确认时直接实现普通自由输入框。

### 8.3 独立 shape

不得使用普通 `free_text` 假装已支持，除非官方规格确认且项目评分能力准确。

Shape 必须检查：

- tokens/chunks 非空。
- chunk id 唯一。
- token 使用次数约束。
- canonical answer 合法。
- 可接受等价答案集合合法。
- prompt 不泄露答案。
- normalization 规则明确。
- 自动评分判定可重复。

如果无法可靠自动评分：

- status 保持 draft。
- `qa_flags.scoring_not_ready=true`。
- 不得伪造唯一答案。
- 记录 blocking issue，等待后续评分设计。

## 9. Package E：email_writing

### 9.1 目标

- 目录：`data/generated-question-sets/toefl-email-pilot/`
- template：`toefl-email-writing`
- taskType：`email_writing`
- level：6
- sets：10
- status：`draft`
- input_mode：`free_text`
- rubric 覆盖：100%

### 9.2 每题必须包含

- sender/recipient relationship。
- situation。
- communicative purpose。
- 2-4 个必须回应的要点。
- 官方规格对应的建议长度或时间。
- tone 要求。
- `referencePoints`。
- `wordLimit`。
- `scoringFocus`，或在 referencePoints 中清楚表达评分重点。

### 9.3 内容要求

- 全部场景原创。
- 覆盖询问、解释、建议、请求、投诉、安排和回应等多种意图。
- 指令必须清楚，不能只写“写一封邮件”。
- 不提供范文。
- 不提供唯一答案。
- answer 必须是：

```json
{
  "type": "rubric_scored",
  "official": false
}
```

- `rubric_id` 必须存在。
- referencePoints 只用于评分，不锁死表达方式。

## 10. Package F：academic_discussion

### 10.1 目标

- 目录：`data/generated-question-sets/toefl-discussion-pilot/`
- template：`toefl-academic-discussion`
- taskType：`academic_discussion`
- level：6
- sets：10
- status：`draft`
- input_mode：`free_text`
- rubric 覆盖：100%

### 10.2 每题必须包含

- professor question。
- academic 或社会话题。
- 至少两位学生的不同观点。
- 要求考生表达并支持自己的观点。
- `referencePoints`。
- `wordLimit` 或官方时间指导。
- `scoringFocus`，或在 referencePoints 中清楚表达评分重点。

### 10.3 内容要求

- 话题适合一般考生，不依赖专业知识。
- 两位学生观点必须不同。
- 学生观点不能替考生完成整篇回答。
- 考生可以同意、反对或提出第三种观点。
- 不提供官方范文。
- 不设唯一答案。
- 主题至少覆盖教育、科技、社会、环境、城市、文化和工作中的多个领域。
- `rubric_id` 必须存在。

## 11. 每包固定执行流程

六包必须按照以下顺序执行：

1. 官方规格确认。
2. 写入或修正专属 template。
3. 实现独立或准确复用的 shape。
4. 添加 valid/invalid fixtures。
5. 跑 shape fixtures。
6. Claude 亲自原创恰好 10 sets。
7. 跑 source-side verify。
8. importer dry-run。
9. 人工抽查至少 5 sets。
10. dry-run 和人工抽查都通过后，执行 `--apply` 写 draft。
11. 跑 DB-side QA。
12. 重复执行同一 apply 命令，必须写入 0 或全部 dup-skip。
13. 更新 issue ledger。
14. 当前包全部通过后，才开始下一包。

题型执行顺序固定为：

1. `complete_the_words`
2. `read_daily_life`
3. `reading_comprehension`
4. `build_a_sentence`
5. `email_writing`
6. `academic_discussion`

## 12. 每包校验命令

客观题包必须运行：

```powershell
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run audit:qbank-v2-coverage
```

生产性题包额外运行：

```powershell
npm run validate:rubrics
npx tsx scripts/verify-productive-tasks.ts
```

如新增专属 verifier，必须运行并记录真实退出码。

## 13. 人工自审要求

每类至少抽查 5 sets，并在阶段报告逐项回答：

- 是否符合官方题型，而非普通练习题。
- 难度是否符合 TOEFL。
- 是否存在多个合理答案。
- 干扰项是否合理。
- 是否复制或近似复刻官方题。
- prompt 是否泄露答案。
- rubric/referencePoints 是否只用于评分。
- word_count 是否正确。
- 中文材料 sourceCharCount 是否正确。
- 数据是否全部 draft。
- UI 未支持时是否保持不可见或不可选。
- scoring 未支持时是否正确标记 `scoring_not_ready`。

## 14. 最终全量校验

六包完成后必须执行：

```powershell
npx tsx scripts/verify-authored-lengths.ts
npx tsx scripts/verify-productive-tasks.ts
npm run qa:qsets-v2
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:rubrics
npm run validate:question-types
npm run validate:data-quality
npm run audit:qbank-v2-coverage
npm run lint
npx tsc --noEmit
npx tsx scripts/qbank-v2-snapshot.ts
```

如有答案位置可被猜测的客观选择题，在内容全部导入后执行现有确定性均衡工具：

```powershell
npx tsx scripts/normalize-authored-answer-positions.ts --apply
npx tsx scripts/normalize-authored-answer-positions.ts
```

第二次 dry-run 必须证明 `BEFORE == AFTER`，才能声称答案位置已经均衡。

## 15. 报告与交付物

必须生成：

- `reports/toefl-2026-non-audio-pilot-summary.md`
- `reports/toefl-2026-non-audio-pilot-validation.json`
- 更新 `reports/qbank-production-issue-ledger.md`
- 更新 `reports/qbank-production-issue-ledger.json`

报告必须包含：

1. 官方规格来源和核验日期。
2. 六类题型的 template 和 shape。
3. 每类源文件数量。
4. fixtures 结果。
5. dry-run 命令及退出码。
6. apply 命令及退出码。
7. 幂等复跑命令及结果。
8. DB sets/items/stimuli 数量。
9. word_count 范围。
10. 中文材料 sourceCharCount 范围。
11. rubric 覆盖率。
12. rejected/skip 原因。
13. 每类至少 5 个 legacy_id 样本。
14. 每类人工抽查结论。
15. active 和 deprecated 状态。
16. renderer 未就绪项。
17. scoring 未就绪项。
18. 是否建议扩量到每类 50。
19. 剩余 open gaps。
20. 所有最终验证命令的真实退出码。

## 16. Issue Ledger 规则

每个问题必须立即写入 ledger，至少包括：

- id。
- stage/package。
- taskType。
- severity。
- category。
- summary。
- affected files/rows。
- containment。
- continueDecision。
- status。
- required follow-up。

不得依赖聊天上下文记忆问题。

## 17. 硬性停止条件

出现以下任一情况，停止对应题型；带“全局停止”的条件必须停止整个任务。

1. 官方规格无法确认。
2. 需要复制真题才能实现。
3. shape 无法准确表达题型。
4. 自动评分可能误判，但实现仍伪造唯一答案。
5. rubric 缺失。
6. source 或 prompt 泄露答案。
7. QA 无法验证客观题答案唯一性。
8. source JSON 与 DB 不一致。
9. importer 重跑产生重复数据。
10. 内容落入错误 template/domain。
11. 发现疑似官方题目文本。
12. 发现 DeepSeek 或其他外部生成 API 调用。
13. `active != 0`：全局停止。
14. `antonym_choice != 0`：全局停止。
15. `cet_cloze != 0`：全局停止。
16. 发生不可恢复的 partial write：全局停止。
17. 需要大范围前端/schema/限流重构。
18. 未经批准试图扩量到每类 50：全局停止。

停止时必须输出：

- 触发条件。
- 出错命令。
- 真实退出码。
- 已写入表和行数。
- 是否存在污染 draft。
- 清理或恢复方案。
- 仍未执行的包。

## 18. 完成标准

只有全部满足，才能报告本阶段完成：

- 六类题型各恰好 10 sets。
- 合计恰好 60 sets。
- 全部 `draft`。
- `active=0`。
- `antonym_choice=0`。
- `cet_cloze=0`。
- 客观题答案唯一。
- 生产性题 rubric 覆盖率 100%。
- source-side verify 退出 0。
- DB QA 退出 0。
- importer 幂等复跑写入 0。
- source JSON 与 DB 一致。
- 无官方题目复制。
- 没有未记录的 QA failure。
- 报告和 issue ledger 已更新。
- 最终 lint 和 tsc 退出 0。

## 19. 最终停止指令

完成本文档规定的六类题型、60 sets 和全部验证后：

1. 立即停止。
2. 不扩量到 50。
3. 不开始听力或口语。
4. 不生成音频。
5. 不执行 promote。
6. 不提交 commit，除非用户另行明确要求。
7. 输出完整阶段报告，交给 Codex 复审。
