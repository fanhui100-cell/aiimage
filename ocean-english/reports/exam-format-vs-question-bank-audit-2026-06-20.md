# 7档真实考试题型 vs Ocean English 题库差异审查

> 日期：2026-06-20  
> 范围：lv1 初中 / lv2 高中高考 / lv3 CET-4 / lv4 CET-6 / lv5 考研 / lv6 TOEFL / lv7 SAT  
> 约束：本次只调查、对比、列问题；未修改题库数据，未写入 Supabase。

## 结论先行

当前项目更像“按等级分层的词汇 + 阅读 + 泛化练习题库”，还不能严格称为“7档真实考试题型模拟器”。CET-4/CET-6 和高考的客观题框架最接近真实考试；考研、TOEFL、SAT 与真实考试差距最大。

最高风险不是题量，而是“题型语义不够细”：大量题都归在 `reading_comprehension`、`listening_comprehension`、`synonym_substitute` 这类泛型里，缺少真实考试要求的 section/domain/subskill 元数据，所以即使能抽到题，也难保证像真题。

## 使用来源

| 档位 | 主要来源 | 本次只采用的信息 |
| --- | --- | --- |
| 初中/中考 | 教育部义务教育英语课程标准(2022)；北京教育考试院 2026 初中学考听说机考说明；上海教育考试院 2024 中考英语试卷评析 | 中考无全国统一卷；以课标和地方真实考试结构取样。北京听说机考含听后选择、听后回答、听后转述、短文朗读；上海卷强调真实语境、非连续文本、补全信息、书面表达。 |
| 高中/高考 | 教育部教育考试院高考英语考试大纲 PDF；2024 高考综合改革适应性测试英语科新课标卷解读 | 约 3500 词；听力、阅读、写作能力要求；新课标卷强化阅读理解、书面表达，启用语法填空、读后续写等题型。 |
| CET-4/CET-6 | 中国教育考试网 CET 笔试与分数解释 | 官方四部分：写作、听力、阅读、翻译；CET-4 听力含短篇新闻/长对话/听力篇章，CET-6 听力含长对话/听力篇章/讲话报道讲座。 |
| 考研英语 | 中国研究生招生信息网公开英语一/英语二大纲页，以及后续大纲解读页 | 英语一：180 分钟、100 分、52 题，英语知识运用、阅读理解、写作；阅读含 Part A/B/C，Part C 是英译汉。英语二：180 分钟、100 分、48 题，英语知识运用、阅读理解、英译汉、写作。 |
| TOEFL | ETS TOEFL iBT Test Content；ETS 官方 sample test 页面 | 2026 当前 TOEFL iBT 含 Reading/Listening/Writing/Speaking 四项；Reading 50 items、Listening 47、Writing 12、Speaking 11；ETS sample 明确包含四项真实过往题。 |
| SAT | College Board SAT Structure；SAT Reading & Writing；官方 digital SAT practice/sample PDFs | Digital SAT 为 Reading & Writing + Math；RW 64 分钟 54 题，两模块自适应；RW 题是短篇或双文本，每题单选，四大 domains：Information and Ideas、Craft and Structure、Expression of Ideas、Standard English Conventions。 |

重要版权边界：本报告只比较题型结构，不复制真题正文，不建议把真题原文导入题库。

## 7档真实参考卷/样题链接

> 使用说明：优先看“官方/考试院”链接确认题型结构；非官方真题汇总只作为人工对照，不建议复制题干入库。

### lv1 初中 / 中考

中考没有全国统一英语卷，建议至少对照北京听说、北京笔试、上海综合卷、广东统考四类。

1. [教育部：义务教育英语课程标准(2022年版)](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf)（官方课标，不是真题卷）
2. [北京教育考试院：2026 初三全年大事与英语听说机考四类题型](https://www.bjeea.cn/html/ksb/zhongzhaozhuanban/2025/1016/87326.html)（官方说明）
3. [上海市教育考试院：2024 上海中考英语试卷专家评析](https://www.shmeea.edu.cn/page/03500/20240618/18593.html)（官方评析）
4. [2024 北京中考英语试题及答案](https://www.gaokzx.com/gk/zhongkao/126361.html)（非官方真题整理）
5. [2024 上海中考英语试题](https://www.zizzs.com/gk/shitiku/166510.html)（非官方真题整理）

### lv2 高中 / 高考

高考要区分新课标全国卷、北京/上海/天津等自主命题卷。项目若做“高考”统一档，至少应以新课标全国卷为主，再兼容地方卷差异。

1. [中国教育考试网：2024 高考综合改革适应性测试英语科新课标卷](https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm)（官方样卷/适应性测试）
2. [教育部教育考试院：高考英语考试大纲 PDF](https://gaokao.neea.edu.cn/res/Home/structure/ef1746d46e7129defd766cc21029b521.pdf)（官方能力要求）
3. [中国教育在线：高考试题英语频道](https://gaokao.eol.cn/shiti/yy/)（非官方/媒体汇总）
4. [2024 高考新课标 I 卷英语试题及答案](https://www.gaokzx.com/gk/shitiku/123367.html)（非官方真题整理）
5. [2024 全国高考试卷及答案汇总](https://www.jhgk.cn/trendDetails.htm?id=53fc317f-cd9b-40ac-bf9c-33c7151028ae)（非官方真题汇总）

### lv3 CET-4

CET 官方主要公开结构和大纲，近年完整真题多在第三方整理站；对照时先按中国教育考试网结构核题型比例。

1. [中国教育考试网：CET4 笔试结构](https://cet.neea.edu.cn/xhtml1/report/16123/196-1.htm)（官方结构）
2. [中国教育考试网：CET 官网](https://cet.neea.edu.cn/)（官方入口）
3. [WeHUSTER：CET4 历年真题](https://www.wehuster.com/cet4)（非官方真题整理）
4. [WordCram：CET4 真题库](https://www.wordcram.com.cn/exams/cet4)（非官方真题整理）
5. [英语真题在线：CET4 真题在线/PDF](https://zhenti.burningvocabulary.cn/cet4)（非官方真题整理）

### lv4 CET-6

六级与四级阅读结构相同，但听力子类不同：六级含长对话、听力篇章、讲话/报道/讲座。

1. [中国教育考试网：CET6 笔试结构](https://cet.neea.edu.cn/xhtml1/report/16123/201-1.htm)（官方结构）
2. [中国教育考试网：CET 笔试总览](https://cet.neea.edu.cn/xhtml1/folder/16113/1586-1.htm)（官方结构）
3. [WeHUSTER：CET6 历年真题](https://www.wehuster.com/cet6)（非官方真题整理）
4. [WordCram：CET6 真题库](https://wordcram.com.cn/zhenti-cet6)（非官方真题整理）
5. [英语真题在线：CET6 真题在线/PDF](https://zhenti.burningvocabulary.cn/cet6)（非官方真题整理）

### lv5 考研

考研必须拆英语一/英语二。官方/研招网页适合确认结构；近年完整真题多由媒体或题库站整理。

1. [研招网：2013 年考研英语一大纲](https://yz.chsi.com.cn/kyzx/en/201209/20120918/343670177.html)（官方/研招结构）
2. [研招网：2013 年考研英语二大纲](https://yz.chsi.com.cn/kyzx/en/201210/20121023/353891830.html)（官方/研招结构）
3. [中国教育在线：2025 考研英语一真题及答案](https://kaoyan.eol.cn/shiti/yingyu/202412/t20241226_2648402.shtml)（非官方真题整理）
4. [WordCram：考研英语一真题库](https://wordcram.com.cn/exams/kaoyan)（非官方真题整理）
5. [英语真题在线：考研英语一/二历年真题](https://zhenti.burningvocabulary.cn/kaoyan)（非官方真题整理）

### lv6 TOEFL

TOEFL 建议只看 ETS 官方来源，尤其注意 2026 后结构与评分口径已变化。

1. [ETS：TOEFL iBT Test Content and Structure](https://www.ets.org/toefl/test-takers/ibt/about/content.html)（官方当前结构）
2. [ETS：TOEFL Sample Test Jan 2026 - 1](https://www.ets.org/toefl/test-takers/ibt/prepare/sample-test-jan-2026-1.html)（官方完整样测入口）
3. [ETS：TOEFL Sample Test Jan 2026 - 2](https://www.in.ets.org/toefl/test-takers/ibt/prepare/sample-test-jan-2026-2.html)（官方完整样测入口）
4. [ETS：Sample the TOEFL iBT Test](https://www.eu.ets.org/toefl/test-takers/ibt/prepare/sample-test.html)（官方 40 分钟样测，含四项真实过往题）
5. [ETS：TOEFL iBT Test Preparation](https://www.ets.org/toefl/test-takers/ibt/prepare.html)（官方备考资源入口）

### lv7 SAT

SAT 建议只看 College Board 官方来源。项目若只做英语，应对齐 Reading & Writing，不做 Math 也要在产品文案里写清楚。

1. [College Board：How the SAT Is Structured](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure)（官方结构）
2. [College Board：The Reading and Writing Section](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing)（官方 RW domains）
3. [College Board：Digital SAT Sample Questions and Explanations PDF](https://satsuite.collegeboard.org/media/pdf/digital-sat-sample-questions.pdf)（官方样题）
4. [College Board：SAT Practice Test #5 PDF](https://satsuite.collegeboard.org/media/pdf/sat-practice-test-5-digital.pdf)（官方完整练习卷）
5. [College Board：SAT Practice Test #10 PDF](https://satsuite.collegeboard.org/media/pdf/sat-practice-test-10-digital.pdf)（官方完整练习卷）

## 项目当前题库快照

只读统计口径：`question_bank.status = active` 且 `is_reviewed = true`，等级按当前取题接口实际使用的 `theme_tags: lvN` 统计。

| 项目 | 数量 |
| --- | ---: |
| active + reviewed 总题量 | 165,380 |
| 题型种类 | 22 |
| lv1 初中 | 12,197 |
| lv2 高中/高考 | 27,143 |
| lv3 CET-4 | 22,914 |
| lv4 CET-6 | 23,367 |
| lv5 考研 | 7,089 |
| lv6 TOEFL | 58,610 |
| lv7 SAT | 14,060 |

整篇/考试型题目：

| 题型 | 总行数 | 题组/篇数 | lv1 | lv2 | lv3 | lv4 | lv5 | lv6 | lv7 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| reading_comprehension | 19,293 | 4,471 | 2,255 | 2,285 | 3,149 | 2,638 | 3,104 | 3,294 | 2,568 |
| listening_comprehension | 1,559 | 522 | 120 | 360 | 359 | 360 | 360 | 0 | 0 |
| cloze_passage | 542 | 341 | 286 | 198 | 0 | 0 | 58 | 0 | 0 |
| seven_select | 179 | 161 | 50 | 66 | 0 | 0 | 63 | 0 | 0 |
| banked_cloze | 208 | 208 | 0 | 0 | 110 | 98 | 0 | 0 | 0 |
| para_match | 747 | 437 | 0 | 0 | 143 | 296 | 308 | 0 | 0 |
| grammar_fill | 414 | 219 | 0 | 414 | 0 | 0 | 0 | 0 | 0 |

## 总体问题

### P0. TOEFL 结构已过期且题库没有 TOEFL 听力

ETS 2026 当前 TOEFL iBT 是 Reading、Listening、Writing、Speaking 四项，并且题量/时间/评分已变化。项目的 `lib/mock-exam/paper-specs.ts` 仍是旧式 `fullPoints: 120`、只规划 Reading/Listening、`minutes: 54`，并且 `comingSoon: true`。

更关键的是，当前取题口径下 lv6 的 `listening_comprehension = 0`。也就是说 TOEFL 等级虽有大量词汇/阅读/单词题，但没有可用于 TOEFL Listening 的听力理解题组。

建议：TOEFL 不应只修数量。应按 ETS 2026 重新定义四项 section/task type，并把现有 lv6 题标注为“TOEFL 词汇/阅读训练”，不要冒充完整 TOEFL 模拟。

### P0. SAT 不是长篇阅读卷，当前模型不贴近 Digital SAT

真实 Digital SAT RW 是 54 道短篇单题，两模块自适应，覆盖四大 domain；很多题是句子补全、修辞目标、标准英语、信息图表、双文本关系等。项目目前 lv7 主要是 `reading_comprehension` + 词汇/同义替换，且 mock spec 用 `passages: 18` 拼出 54 题。这会把 SAT 做成“长篇阅读+词汇题”，不是 Digital SAT RW。

建议：SAT 需要新增 domain 元数据和题型：Words in Context、Text Structure/Purpose、Cross-Text Connections、Command of Evidence、Transitions、Rhetorical Synthesis、Boundaries/Form/Structure/Sense、information graphics 等。Math 可继续不做，但 RW 不能只靠 `reading_comprehension`。

### P0. 考研混入听力，且英语一/英语二没有拆分

考研英语笔试没有听力，但当前 lv5 有 `listening_comprehension = 360`，自由专练也可能出现考研听力。模拟卷 spec 没放听力，这是好事；但题库与练习入口仍会让用户误以为“考研英语有听力理解”。

另外项目只有一个 `kaoyan` 档，真实考试至少要区分英语一/英语二：英语一阅读 Part C 是画线句英译汉，Part B 有三类备选；英语二有英译汉独立段落、Part B 两类备选，写作分值也不同。

建议：拆成 `kaoyan-1` / `kaoyan-2` exam spec；把 lv5 听力从考试型入口隐藏或改名为“能力拓展听力”，不要进入考研模拟/推荐题型。

### P1. 写作、翻译、口语这些真实考试核心板块基本缺席

高考缺应用文写作与读后续写；CET 缺写作与汉译英段落翻译；考研缺英译汉和两篇写作；TOEFL 缺 Writing/Speaking；部分中考地区缺听说输出与书面表达。这些不是小题型，而是真实考试的大板块。

项目目前有 `app/api/ai/writing`、`components/screens/SpeakingScreen.tsx` 等能力苗头，但它们没有接入 `question_bank` 的考试 section，也没有评分 rubric 与分项计分。

建议：不要把所有主观题硬塞入 MCQ 题库。可以单独建 `exam_tasks` / `productive_tasks`，存 prompt、rubric、sample answer、AI feedback schema。

### P1. `reading_comprehension` 太泛，无法保证真题风格

真实考试阅读会明确考主旨、细节、推断、词义猜测、结构、态度、作者意图、证据、修辞目的、图表信息等。项目生成脚本 `scripts/gen-reading.ts` 只是按等级生成原创短文 + 多个选择题，当前题库里没有稳定的 `subskill/domain` 字段来保证每套卷的分布。

结果：CET/高考/考研/TOEFL/SAT 都能抽到 reading，但“像不像该考试”不可控。

建议：给每道题补 `exam_section`、`real_task_type`、`subskill`、`domain`、`source_format_version`。组卷时按这些字段配比，而不是只按 `type + lvN` 抽题。

### P1. 前端静态计数与真实 API 取题口径不一致

`/api/questions` 与 `/api/mock-exam` 当前都按 `theme_tags: lvN` 过滤等级。  
但 `components/screens/drill/drill-data.ts` 里仍维护了一份静态 `TYPES.by` 和 `PAPER_SPECS`，数值与当前数据库不一致。例如当前 API 口径下 lv6/lv7 的 `listening_comprehension` 都是 0，但静态数据里 TOEFL/SAT 听力仍显示有量。

影响：用户可能在 drill UI 看到某等级某题型“可用”，点进去却抽不到题；mock 说明里的“真实结构”也可能与后端 spec 漂移。

建议：删除/弱化静态计数，前端从后端实时 `/api/question-stats` 或构建时快照读取；`lib/mock-exam/paper-specs.ts` 与 `components/screens/drill/drill-data.ts` 应合并为单一来源。

## 分档对比

### lv1 初中 / 中考

真实考试：没有全国统一中考英语卷。官方层面应按义务教育英语课程标准命题，地方卷差异很大。北京样本突出听说机考，题型包括听后选择、听后回答、听后转述、短文朗读；上海真实卷评析显示听力、词汇语篇、非连续文本阅读、补全信息、书面表达等。

项目当前：有听力理解、阅读理解、整篇完形、七选五、词汇/拼写/词形题。mock spec 包含听力、完形、阅读、语法替代题。

差距：

- 缺少听后回答、听后转述、朗读短文等口语输出题。
- 缺少书面表达/开放回答。
- 用 `confusable_choice`、`synonym_choice` 替代中考语法/语言运用，和真实卷不完全同构。
- 中考应按地区配置，不能只有一个全国统一 `zhongkao` spec。

### lv2 高中 / 高考

真实考试：官方大纲要求约 3500 词，考听力、阅读、写作等能力；新课标卷强化阅读理解、书面表达，启用语法填空、读后续写等题型。

项目当前：有听力、阅读、七选五、完形、语法填空，客观题框架在 7 档里最接近真实高考。

差距：

- 缺应用文写作和读后续写。
- `reading_comprehension` 缺少主旨/细节/推断/词义/结构/态度等子技能配比。
- `grammar_fill` 有 414 行/219 组，但需要支持变体答案、大小写、时态/词形多答案判定。
- 高考新课标卷阅读分值和题量调整后，mock spec 里的分值/题量需要重新按最新使用省份版本核对。

### lv3 CET-4

真实考试：中国教育考试网公布 CET-4 笔试结构：写作；听力含短篇新闻、长对话、听力篇章；阅读含选词填空、长篇匹配、仔细阅读；翻译为汉译英段落翻译。

项目当前：有 `listening_comprehension`、`banked_cloze`、`para_match`、`reading_comprehension`，客观题大类齐全。

差距：

- 缺写作、翻译。
- 听力没有分短篇新闻/长对话/篇章三类。
- 仔细阅读应是 2 篇共 10 题，项目按 passage 聚合抽题，需保证每篇题数和总题数稳定。
- `banked_cloze` 只有 110 组，且这类题此前已发现答案键风险，仍建议后续全量复核。

### lv4 CET-6

真实考试：CET-6 与 CET-4 大结构相同，但听力分为长对话、听力篇章、讲话/报道/讲座。

项目当前：有 CET-6 客观题大类：听力、选词填空、长篇匹配、仔细阅读。

差距：

- 缺写作、翻译。
- 听力未拆长对话/篇章/讲座，无法保证六级听力风格。
- 六级阅读难度和素材应明显高于四级，当前只靠 lv4 和 AI prompt 分级，不足以保证真实难度曲线。

### lv5 考研

真实考试：英语一/二均 180 分钟、100 分；英语一为英语知识运用、阅读理解、写作三部分，阅读含 A/B/C，其中 C 是英译汉；英语二为英语知识运用、阅读理解、英译汉、写作四部分。阅读 A 通常为 4 篇，每篇 5 题；Part B 是新题型。

项目当前：mock spec 包含 cloze、Reading A、新题型 Part B；没有把听力放进 mock spec。

差距：

- lv5 题库和自由练习有 `listening_comprehension = 360`，考试语义错误。
- `paper-specs.ts` 里考研 Reading A 配置 `passages: 7, questions: 20`，真实应按 4 篇 * 5 题建模。现在用更多篇数凑题，会破坏真卷节奏。
- 英语一/英语二没有拆分。
- 缺翻译和写作。
- Part B 需要明确 7选5、排序、小标题/匹配等不同变体，不能只统称 `para_match`/`seven_select`。

### lv6 TOEFL

真实考试：ETS 当前 TOEFL iBT 2026 结构是 Reading 50、Listening 47、Writing 12、Speaking 11，约两小时，评分改为 1-6 scale，过渡期同时给 0-120 comparable score。

项目当前：TOEFL mock 标为 `comingSoon`，这点是正确的；但 spec 仍是旧式 120 分、只含 Reading/Listening。题库里 lv6 有很多词汇和阅读，但当前口径没有 TOEFL 听力理解题。

差距：

- 真实 TOEFL 四项缺两项半：Speaking/Writing 没有，Listening 没有可用题组。
- Reading 题型不是 ETS 当前的 Complete the Words / Read in Daily Life / Academic Passage 组合。
- 评分体系过期。
- 项目 lv6 题量大，但主要是词汇/拼写/同义替换，不等于 TOEFL 题库。

### lv7 SAT

真实考试：Digital SAT Reading & Writing 是 64 分钟 54 题，两模块自适应；题目以 25-150 词短文本或双文本 + 单题为主，四大 domain 覆盖阅读、修辞、表达修改、标准英语。

项目当前：SAT mock 标为 `comingSoon`，但 spec 用 `reading_comprehension + synonym_substitute` 拼 54 题；lv7 题库有阅读、词汇、同义替换和基础拼写类题。

差距：

- 缺四大 domain 元数据和配比。
- 缺 Standard English Conventions / Expression of Ideas 这两大写作语言域。
- 缺图表/表格信息题。
- 缺模块自适应与难度路由。
- 当前长篇 reading_comprehension 不符合 Digital SAT 的短文本单题形态。

## 建议修复路线

### 第一批：别让用户误会

1. TOEFL/SAT 保持 mock `comingSoon`，但把说明改成“词汇/阅读训练已可用，完整真题结构未接入”。
2. 考研自由练习隐藏 `listening_comprehension`，或改名为“拓展听力”，不要挂在考研考试型题目下。
3. 前端题型数量不要再使用 `drill-data.ts` 静态旧数，改读后端统计。
4. `paper-specs.ts` 和 `drill-data.ts` 合并为单一 exam spec，避免结构双写。

### 第二批：建立真实考试 schema

新增或补充以下字段，不建议继续只靠 `type + lvN`：

- `exam_key`: zhongkao/beijing-zhongkao/shanghai-zhongkao/gaokao/cet4/cet6/kaoyan1/kaoyan2/toefl-ibt-2026/sat-digital
- `exam_section`: reading/listening/writing/speaking/translation/use_of_english
- `real_task_type`: 真实题型，例如 CET4-short-news、SAT-words-in-context、TOEFL-academic-talk
- `subskill`: main_idea/detail/inference/vocab_in_context/structure/attitude/rhetoric/grammar_boundaries 等
- `format_version`: 例如 `toefl-2026`, `sat-digital`, `gaokao-new-curriculum`
- `stimulus_kind`: passage/dialogue/lecture/table/graph/email/discussion/prompt

### 第三批：按真实题型补题，不要只补数量

优先级：

1. SAT RW：先做 College Board 四大 domain 的题型模板和生成/审核门禁。
2. TOEFL 2026：按 ETS 当前 task type 重建四项，至少先补 Listening 和 Writing/Speaking task schema。
3. 考研：拆英语一/英语二，修 Reading A 为 4 篇 * 5 题，补翻译/写作任务。
4. CET：听力拆官方子类，补写作/翻译主观任务。
5. 高考：补应用文写作/读后续写；阅读和语法填空增加可接受答案与子技能。
6. 中考：拆地区版本，至少北京听说与上海综合卷两套模板，不要伪装全国统一卷。

## 不建议做的事

- 不建议导入或复制真题全文。真题可用于结构研究、比例校验、rubric 对齐，但题库内容应保持原创或来自授权来源。
- 不建议用“同义词题/词汇题”填补 SAT/TOEFL 的真实题型空缺。
- 不建议只看 active 题量判断覆盖度。没有真实 section/domain 标记，题量再大也可能不像真题。
- 不建议继续维护多份静态题型矩阵。当前已经出现 UI 可用性与 API 实际可抽题不一致。
