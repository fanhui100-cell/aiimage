# Ocean English CC 全项目审查清单

> 用途：交给 CC 做系统审查时使用。目标不是直接修代码，而是产出一份带证据的审查报告：问题、风险、文件/路由位置、复现方式、建议优先级。

> 给 CC 的特别注意：从单词详情、词库、词图或练习结果页跳转到单词宇宙时，不能只验证是否打开 `/lexiverse` 宇宙视角；必须验证页面是否根据当前单词定位到该词所属的星球/星系视角，并能高亮或聚焦对应词球。

## 审查目标

请对 `D:\ai-studio\ocean-english` 做一次完整产品与代码审查，重点确认：

- 所有题库是否符合对应等级和考试水平。
- 题库架构是否符合真实考试题型和组卷结构。
- 每个页面路由、API 路由、关键按钮跳转是否正确。
- 用户能否形成学习闭环：选目标、学词、练习、错题、复习、诊断、再练习。
- 每个单词的详情、词形、词族、同反义词、词图、词宇宙、练习入口是否能跳转到正确页面。
- 当前功能是否完整，是否存在我没想到但会影响上线体验的缺口。

## 交付物

最终请输出一份 Markdown 审查报告，建议放在：

`reports/cc-full-project-review-2026-07-05.md`

报告必须包含：

- 总结结论：`通过 / 条件通过 / 阻塞`。
- P0/P1/P2/P3 问题列表，按严重程度排序。
- 每个问题都要有证据：文件路径、代码行、路由、命令输出或浏览器复现步骤。
- 已验证通过的范围，避免只列问题。
- 未验证或无法验证的范围，并说明原因。
- 建议的修复优先级和下一步执行清单。

## 审查原则

- 不要只看旧报告，必须以当前代码和当前数据库/题库状态为准。
- 不要只看数量，要看题型、难度、目标用户等级、组卷逻辑和用户路径是否匹配。
- 不要只看静态路由文件存在，要验证真实入口是否能走通。
- 不要把 `lint`、`tsc` 通过等同于产品闭环通过。
- 不要因为某个测试 `fixme` 或跳过就认为功能没问题；跳过本身要作为测试缺口记录。
- 不要打开或推广未准备好的题库内容，不要做 DB reset、批量删除、无 manifest 的 promote。

## 一、仓库与测试可信度审查

### 1.1 基础项目状态

检查：

- `package.json` 的脚本是否覆盖题库、组卷、练习、路由、音频、数据质量。
- `.env.local` 是否具备 Supabase 读写所需环境变量。
- 当前工作树是否已有未提交变化，区分用户已有变化和审查产生的报告变化。

建议命令：

```powershell
git status --short
npm run lint
npx tsc --noEmit --incremental false
```

### 1.2 Playwright/e2e 可信度

重点检查：

- `playwright.config.ts` 是否写死 `localhost:3000`。
- `reuseExistingServer: true` 是否会复用本机其他项目服务。
- e2e 是否有大量 `test.fixme`，尤其是单词详情、词图、词宇宙、错题、SRS 闭环。
- e2e 是否使用过期中文文案或旧 DOM 选择器。

必须特别审查：

- `playwright.config.ts`
- `e2e/closed-loop.spec.ts`
- `e2e/learning-loop.spec.ts`

建议记录：

- 端口 3000 是否被非本项目进程占用。
- 浏览器测试打到的页面是否真是 Ocean English，而不是其他本地服务。
- 建议改为动态端口或加入项目身份健康检查。

## 二、考试等级与题库架构审查

### 2.1 考试规格是否符合等级

审查文件：

- `lib/exam-specs/specs.ts`
- `lib/exam-specs/types.ts`
- `lib/exam-specs/level-map.ts`
- `data/exam-task-templates/*.json`

逐级检查：

- Level 1 中考：听力、语言运用、完形、阅读、写作是否合理。
- Level 2 高考：听力、阅读、七选五、完形、语法填空、应用文、读后续写是否合理。
- Level 3 CET-4：写作、听力、选词填空、长篇匹配、仔细阅读、翻译是否合理。
- Level 4 CET-6：题型是否比 CET-4 更难，阅读/听力主题和词汇难度是否提高。
- Level 5 考研：完形、阅读 A、新题型、翻译、小作文、大作文是否合理。
- Level 6 TOEFL：当前 mock v1 是否明确只开放 reading/listening/writing，speaking 和 build-a-sentence 是否排除。
- Level 7 SAT：是否只覆盖 Digital SAT RW，不误做数学或 essay。
- Level 8 IELTS：是否保持 `coming_soon`，不得抽 TOEFL/SAT/CET 题。

建议命令：

```powershell
npm run validate:exam-specs
npm run validate:question-types
npm run validate:toefl-task-alignment
npm run validate:rubrics
```

### 2.2 题库 v2 完整性

审查：

- active/draft 数量是否合理。
- active set 是否都有 active items。
- deprecated task type 是否没有 active。
- blocked/deferred 题型是否不会进入练习或模考。
- `question_target_words` 是否足以支持单词级练习。

建议命令：

```powershell
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:coverage-audit
npx tsx scripts/qbank-v2-snapshot.ts
```

重点风险：

- 如果 active v2 中真实词 target-word 链路不足，单词详情页显示“题库就绪”可能不可靠。
- 如果 word mode 主要依赖 v1 fallback，需要报告这不是完整 v2 闭环。

### 2.3 题目难度与等级匹配

抽样审查每个等级：

- 词汇是否超纲或过低。
- 阅读篇幅是否符合对应考试。
- 听力文本是否符合考试场景。
- 选项是否有明显错误、多个正确答案、解释不匹配。
- TOEFL/SAT 是否避免中文考试风格题。
- 中考/高考是否避免过度学术化。

建议抽样：

- 每个 active exam + taskType 至少抽 5 组。
- TOEFL/SAT 每个 active taskType 至少抽 10 组。
- 听力题必须核对 audio/transcript/stimulus。

## 三、组卷与练习闭环审查

### 3.1 模考组卷

审查文件：

- `lib/papers/paper-generator.ts`
- `lib/papers/scoring.ts`
- `lib/papers/submit-paper.ts`
- `app/api/papers/route.ts`
- `app/api/papers/[id]/route.ts`
- `app/api/papers/[id]/submit/route.ts`

检查：

- `paperReady=false` 的考试是否拒绝组卷。
- `coming_soon` 的 IELTS 是否拒绝组卷。
- TOEFL mock v1 是否不包含 `build_a_sentence`、`listen_and_repeat`、`interview_speaking`。
- 听力题是否只下发 signed `audioUrl`，不泄露 transcript。
- client paper 是否不下发 `answerKey`。
- full/mini/section 模式是否符合产品定义。

建议命令：

```powershell
npm run validate:papers
npm run smoke:papers
npm run smoke:paper-e2e
```

### 3.2 练习 session

审查文件：

- `lib/practice/session-builder.ts`
- `lib/practice/session-types.ts`
- `lib/practice/attempt-recorder.ts`
- `app/api/practice/session/route.ts`
- `app/api/practice/attempts/route.ts`
- `components/practice/**`
- `app/quiz/page.tsx`

检查：

- `mode=word` 是否能用当前词生成练习。
- `mode=task` 是否按 examId/taskType/level 抽题，不跨等级乱抽。
- `mode=section` 是否按 section 抽题。
- deprecated 题型是否永远返回 empty。
- 空题池是否给可控 empty state，不跳随机无关题。
- 作答后是否写入 attempts、wordUpdates、skillUpdates。
- 错题是否进入错题本。
- SRS 状态是否更新。

建议命令：

```powershell
npm run validate:practice-session
npm run smoke:active-serve
npm run smoke:learning-loop-e2e
```

## 四、单词系统专项审查

这是本次审查的重点之一。

### 4.1 单词详情主入口

必须明确当前产品主入口：

- `/word/[slug]` 当前重定向到 `/dictionary?word=[slug]`。
- `/dictionary?word=[slug]` 是词库/详情综合页。
- `/lexiverse/word/[slug]` 是词宇宙里的独立词详情页。

检查：

- 用户从搜索、词库、词宇宙、词图、练习结束页进入单词时，是否进入同一个主详情体验。
- 两套详情页是否信息一致。
- 两套详情页是否都有返回路径。
- 不存在 404、空白页、跳到错误单词。

重点文件：

- `app/word/[slug]/page.tsx`
- `app/dictionary/page.tsx`
- `components/screens/DictionaryVaultScreen.tsx`
- `app/lexiverse/word/[slug]/page.tsx`
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`

### 4.2 词库到单词详情

检查：

- `/dictionary?word=benefit` 是否能定位 benefit。
- 搜索结果点击后 URL 是否变为正确 `?word=`。
- 词库目录中按等级、按字母浏览时点击词条是否定位到详情。
- 如果词不存在，是否有友好 empty state，而不是无响应。

重点文件：

- `components/screens/DictionaryVaultScreen.tsx`
- `app/api/dictionary/word/[slug]/route.ts`
- `app/api/dictionary/search/route.ts`

建议抽样词：

- `benefit`
- `inevitable`
- `serendipity`
- 一个 CET-4 词
- 一个 TOEFL 词
- 一个 IELTS 词
- 一个 SAT 词
- 一个不存在的词，如 `notarealwordxyz`

### 4.3 单词词形与词族

检查：

- `inflections` 是否正确展示复数、过去式、过去分词、现在分词、三单、比较级、最高级。
- 没有 DB inflections 时，规则生成的词形是否合理。
- 派生词族是否来自真实 relations，而不是把搭配误当单词。
- 词形 chip 是否应该可跳转：如果词形有独立词条，应能跳；如果只是变化形式，应显示但不跳，避免 404。
- 词形变化是否参与练习和词图。

重点文件：

- `components/screens/DictionaryVaultScreen.tsx`
- `app/api/dictionary/relations/route.ts`
- `lib/dictionary/supabase-dictionary-client.ts`
- `data/dictionary/**`
- `supabase/sql/*dictionary*`

### 4.4 同义词、反义词、搭配跳转

检查：

- 同义词/反义词 chip 是否跳到对应词条。
- 不存在的同义词/反义词是否有降级处理。
- 搭配短语是否不误跳单词详情。
- 词宇宙详情页与词库详情页的同反义词行为是否一致。

重点文件：

- `components/screens/DictionaryVaultScreen.tsx`
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`
- `app/api/dictionary/relations/route.ts`

### 4.5 词库到词宇宙

检查：

- 词库 dock 的“宇宙”按钮是否跳到 `/lexiverse?word=[slug]&returnTo=...`。
- `/lexiverse?word=[slug]` 是否真的消费 `word` 参数，并进入该词所属 galaxy。
- 跳转到单词宇宙后，是否定位到该词所属的星球/星系视角，而不是停留在默认宇宙总览。
- 所属星球视角是否能聚焦或高亮当前词球，并保留用户从原页面返回的路径。
- 如果词不在当前 galaxy，是否给 `focus-miss` 提示。
- `returnTo` 是否能返回词库当前词。

重点文件：

- `components/screens/DictionaryVaultScreen.tsx`
- `components/lexiverse/ReferenceLexiverseFrame.tsx`
- `public/lexiverse/**` 或当前 iframe 静态资源目录

### 4.6 词宇宙到词库/词详情/词图/练习

检查：

- 在词宇宙中点击词球，是否能打开词详情 panel。
- panel 的“打开词条”是否跳 `/dictionary?word=[slug]`。
- “词图”是否跳 `/lexigraph?word=[slug]`。
- “练习”是否跳 `/quiz?word=[slug]&returnTo=...`。
- “加入复习”是否写入 SRS。
- iframe postMessage 是否有 origin 校验。

重点文件：

- `components/lexiverse/ReferenceLexiverseFrame.tsx`
- `components/lexiverse/PlanetDetailPanel.tsx`
- `components/lexiverse/LexiverseShell.tsx`

### 4.7 词详情到练习/考试语境/词图/AI

检查：

- “练这个词”是否跳 `/quiz?word=[slug]&returnTo=...`。
- “考试语境”是否跳 `/quiz?word=[slug]&mode=exam-practice&returnTo=...`。
- “词图关系”是否跳 `/lexigraph?word=[slug]`。
- “问 AI”是否跳 `/chat?context=word&word=[slug]&returnTo=...`。
- 如果该词无题，按钮是否禁用，不应跳随机无关题。

重点文件：

- `lib/lexiverse/word-practice-links.ts`
- `components/lexiverse/WordPracticeActions.tsx`
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`
- `app/quiz/page.tsx`

### 4.8 单词 API 与数据质量

检查：

- `/api/dictionary/word/[slug]` 返回完整字段：definitions、examples、inflections、synonyms、antonyms、collocations、examTags、levels、primaryLevel。
- `/api/dictionary/search` 支持 query、level、exam、prefix、pagination。
- `/api/dictionary/relations` 能双向返回 relation，并支持 derivative family。
- 单词释义是否有中文污染、空释义、坏词、重复词条。

建议命令：

```powershell
npm run validate:data-quality
npm run validate:dictionary
npm run analyze:lexigraph
```

## 五、页面路由与用户闭环审查

### 5.1 路由存在性

检查所有核心页面：

- `/`
- `/onboarding`
- `/today`
- `/learn`
- `/quiz`
- `/memory`
- `/wrong-answers`
- `/dictionary`
- `/word/[slug]`
- `/lexiverse`
- `/lexiverse/word/[slug]`
- `/lexigraph`
- `/drill`
- `/exam`
- `/reading`
- `/listening`
- `/speaking`
- `/writing`
- `/scan`
- `/scan/history`
- `/groups`
- `/profile`
- `/report`
- `/goals`
- `/chat`

建议命令：

```powershell
npm run smoke:full-routes
```

### 5.2 用户闭环

至少验证这些闭环：

- 新用户 onboarding -> 设置目标 -> 今日计划 -> 学新词 -> 练习 -> 完成反馈。
- 单词详情 -> 加入学习 -> 今日/记忆队列可见。
- 单词详情 -> 练习 -> 答错 -> 错题本 -> 再练 -> 错题状态变化。
- 复习到期 -> 评分 -> SRS interval 更新 -> 下次到期。
- 词库 -> 单词详情 -> 词宇宙 -> 返回词库当前词。
- 词宇宙 -> 词球 -> 词详情 -> 词图 -> 练习。
- 模考 -> 提交 -> 成绩/解析 -> 弱项诊断 -> 推荐练习。
- 扫描文档 -> 提取词/题 -> 加入学习/练习 -> 历史记录。

## 六、UI 文案与编码审查

检查：

- 是否存在 mojibake 乱码，如 `鈥`、`璇`、`鍔`、`鐨`、`寮`、`闂`、`涓` 等。
- 用户可见中文是否正常。
- 报告、脚本注释、测试名称乱码是否影响维护。
- e2e 是否因为乱码文案而选择器失效。

建议命令：

```powershell
rg "鈥|璇|鍔|鐨|寮|闂|涓" app components lib scripts docs reports e2e
```

注意：

- 只改文案/注释时不能改业务逻辑。
- 题目内容如果是数据库题干，修复前要先确认来源和影响范围。

## 七、AI、评分与隐私边界

### 7.1 写作/翻译/口语评分

审查：

- 写作评分是否依赖 rubric。
- 翻译评分是否能返回可解释反馈。
- 口语当前是否只支持 transcript-only。
- 是否拒绝或忽略音频上传，避免误存用户音频。
- `mock` provider 与真实 provider 的开关是否安全。

重点文件：

- `app/api/scoring/writing/route.ts`
- `app/api/scoring/translation/route.ts`
- `app/api/scoring/speaking/route.ts`
- `lib/scoring/**`
- `lib/ai/**`

### 7.2 内容安全与版权

检查：

- 题库是否为原创/生成/合法来源。
- 是否避免复刻真题。
- 生成题是否有 source/provenance。
- AI 提示词是否要求原创内容。

重点文件：

- `docs/copyright-compliance.md`
- `lib/ai/prompts/**`
- `scripts/audit-*`
- `reports/*source*`

## 八、音频与听力审查

检查：

- active 听力题是否都有 active audio。
- audio URL 是否签名或安全可访问。
- 练习/模考 payload 是否不泄露 transcript。
- 音频长度、口音、语速是否符合对应考试。
- TOEFL/CET/高考/中考听力场景是否区分。

建议命令：

```powershell
npm run validate:audio-assets
npm run validate:audio-pipeline
npm run review:audio-assets
npm run smoke:active-serve
```

## 九、数据报告一致性审查

检查：

- `reports/*.md` 与当前代码状态是否一致。
- 是否存在旧报告说 `paperReady=false`，但代码已 `paperReady=true` 的状态漂移。
- validation JSON 是否只是 timestamp 变化。
- 最新 readiness report 是否覆盖 TOEFL mock v1、IELTS coming soon、Word Universe source。

建议命令：

```powershell
rg "paperReady=false|paper_not_ready|coming_soon|TOEFL|IELTS|build_a_sentence|listen_and_repeat|interview_speaking" reports docs lib scripts
git status --short reports
```

## 十、Word Universe / Lexiverse 来源治理

检查：

- active Word Universe 是否 100% `gen:` 来源。
- active `qb:` 是否为 0。
- legacy `qb:` draft 是否不能 promote。
- 词宇宙练习是否优先走 active v2，不随机回退旧题。
- 无题词是否显示可控空态。

建议命令：

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
npm run validate:practice-session
npm run smoke:active-serve
```

## 十一、性能与可靠性审查

检查：

- `/api/practice/session?mode=word&word=...` 是否在常见词上响应稳定。
- `/dictionary?word=...` 首屏是否被慢 API 阻塞。
- `/lexiverse?word=...` 是否受 iframe 加载影响过久。
- paper generator 是否有串行 DB/Storage 调用。
- dev/e2e 是否因为端口或远程 DB 慢而不稳定。

建议命令：

```powershell
Measure-Command { npm run validate:papers }
Measure-Command { npm run smoke:papers }
```

建议浏览器抽样：

- `/dictionary?word=benefit`
- `/word/benefit`
- `/lexiverse/word/benefit`
- `/lexiverse?word=benefit`
- `/lexigraph?word=benefit`
- `/quiz?word=benefit`
- `/api/dictionary/word/benefit`
- `/api/practice/session?mode=word&word=benefit&count=1`

## 十二、推荐验证命令清单

基础门禁：

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:question-types
npm run validate:exam-specs
npm run validate:rubrics
npm run validate:practice-session
npm run validate:data-quality
```

组卷与听力：

```powershell
npm run validate:papers
npm run smoke:papers
npm run validate:audio-assets
npm run validate:audio-pipeline
npm run smoke:active-serve
```

TOEFL / Word Universe：

```powershell
npm run validate:toefl-task-alignment
npm run verify:toefl-current
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

路由与浏览器：

```powershell
npm run smoke:full-routes
npx playwright test
```

如果 Playwright 失败，先确认：

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

必要时改用未占用端口，并确保浏览器打到的是 Ocean English 项目。

## 十三、问题优先级定义

P0 阻塞：

- 模考泄露 answerKey 或听力 transcript。
- IELTS coming soon 却抽了其他考试题。
- TOEFL mock 出现 speaking 或 build-a-sentence。
- active 题库存在 deprecated task type。
- 单词/练习接口大面积 500。
- 用户音频被上传或存储但产品没有明确授权。

P1 高优先级：

- 单词详情、词库、词宇宙、词图之间关键跳转断裂。
- word mode 练习主要依赖旧 v1 fallback，且 UI 误称 v2/题库就绪。
- e2e 打错本地服务导致测试结果不可信。
- 大量用户可见中文乱码。
- TOEFL/IELTS/SAT 状态与报告/文案不一致。

P2 中优先级：

- 部分等级题型池不足但 UI 未说明。
- 词形/派生词展示不完整或不能合理跳转。
- 搜索、分页、按等级浏览体验不稳定。
- 空题池提示不够清楚。

P3 低优先级：

- 报告注释乱码。
- 旧文档状态未归档。
- 性能优化、测试重构、文案统一。

## 十四、最终报告模板

```markdown
# CC Full Project Review - 2026-07-05

## Overall Verdict

- Verdict:
- Reason:
- Blocking issues:
- Conditional risks:

## Verified Green Areas

| Area | Evidence | Result |
|---|---|---|

## Findings

### P0

### P1

### P2

### P3

## Word System Review

- Dictionary -> detail:
- Detail -> Lexiverse: must land on the word's own planet/galaxy view, not only the generic universe overview.
- Lexiverse -> dictionary:
- Detail -> quiz:
- Forms/derivatives:
- Synonyms/antonyms:
- Empty state:

## QBank / Exam Review

- Level alignment:
- Task architecture:
- TOEFL:
- IELTS:
- SAT:
- Word Universe:

## User Loop Review

- Onboarding -> today:
- Learn -> quiz:
- Wrong answers:
- SRS:
- Mock paper:
- Diagnostics:

## Commands Run

| Command | Exit Code | Notes |
|---|---:|---|

## Not Verified

| Area | Reason | Next step |
|---|---|---|

## Recommended Next Actions

1.
2.
3.
```
