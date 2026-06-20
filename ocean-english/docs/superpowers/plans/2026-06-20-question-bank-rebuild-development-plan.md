# Ocean English Question Bank Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Ocean English 从“以单词题为主的练习入口”升级为“单词宇宙驱动的七档考试题库系统”，让初中/高中/CET-4/CET-6/考研/TOEFL/SAT 都能按真实考试结构训练、组卷、诊断、回流到背词闭环。

**Architecture:** 先建立唯一的考试规格层和题库 v2 数据契约，再让 `/drill`、`/quiz`、`/reading`、`/listening`、`/speaking`、`/writing` 逐步消费同一套 session/attempt/paper API。旧 `question_bank` 不立刻删除，先通过迁移脚本和兼容 adapter 过渡，避免一次性重写把现有 16.9 万题练习能力打断。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Supabase/Postgres、Zustand、Supabase Storage/预渲染音频、现有 `scripts/*.ts` 数据管线。

---

## 1. 这次应该从哪里开始

不要先改界面，也不要先批量重生成题库。正确顺序是：

1. 先把“七档考试真实结构”变成代码里的唯一规格源。
2. 再把题库 schema 从“单题 + type + level tag”升级到“考试/板块/任务/题组/材料/目标词/技能”的结构。
3. 然后让页面按新规格发起练习，而不是各自硬编码题型。
4. 最后分批重建题库、听力音频、模拟卷和学习闭环。

现在项目最大的风险不是题少，而是“题库有量，但题型语义和页面入口没有统一契约”。如果直接继续往 `question_bank` 塞题，会让 `/drill`、`/quiz`、`/mock-exam` 的分叉越来越深。

## 2. 当前项目结构判断

### 2.1 现有主入口

| 入口 | 当前文件 | 当前职责 | 改造判断 |
|---|---|---|---|
| 今日 | `app/today/page.tsx` + `components/screens/TodayBento.tsx` | 学习主线入口，按 path 引导学词/练习/阅读/复习 | 保留，后续接 `DailyPlanEngine` |
| 单词宇宙 | `app/lexiverse/page.tsx` + `components/lexiverse/ReferenceLexiverseFrame.tsx` | 品牌核心，可视化词库 | 必须变成题库和背词的主入口之一 |
| 专练 | `app/drill/page.tsx` + `components/screens/drill/DrillScreen.tsx` | 自选练习、限时试炼、模拟考试 | 应成为“专项训练 + 模拟卷”的总控台 |
| 测验 | `app/quiz/page.tsx` + `components/quiz/LexiverseQuizClient.tsx` | 单词测验 runner，支持 URL 参数 | 后续降级为统一 PracticeRunner 的 route wrapper |
| 阅读 | `app/reading/page.tsx` + `components/screens/ReadingScreen.tsx` | 从 `reading_passages` / `question_bank` 展示文章和理解题 | 保留体验，数据源改为 v2 passage/question set |
| 听力 | `app/listening/page.tsx` + `components/screens/ListeningScreen.tsx` | 主要基于单词/浏览器 TTS 的听辨 | 要拆成“单词听辨”和“考试听力题组” |
| 口语/写作 | `app/speaking/page.tsx`、`app/writing/page.tsx` | AI 场景口语、用词造句批改 | 保留为技能场景，新增考试任务模式和 rubric |
| 报告/复习 | `app/report/page.tsx`、`app/memory/page.tsx`、`components/screens/ReviewHub.tsx` | SRS/弱项/错题 | 需要接 question attempts 和 skill states |

### 2.2 题库相关文件

| 文件 | 当前状态 | 问题 |
|---|---|---|
| `supabase/sql/p1-question-bank.sql` | `question_bank` 单表为主 | 缺 `exam_id`、`section_id`、`task_type`、`stimulus_id`、`question_set_id`、`subskills`、`target_words`、`rubric` |
| `types/question-bank.ts` | 旧题型 union 很长 | 与 DB 实际 `def_to_word` 命名不完全一致，且没有考试结构模型 |
| `app/api/questions/route.ts` | 自选练习 API | 按 `type/theme_tags` 抽题，无法表达真实考试板块 |
| `app/api/mock-exam/route.ts` | 模拟卷 API | 只按 `paper-specs` 的 type/level 抽题，没有 paper instance 和精确 section/subskill |
| `lib/mock-exam/paper-specs.ts` | 后端 mock paper 规格 | 与前端 `drill-data.ts` 重复 |
| `components/screens/drill/drill-data.ts` | 前端等级/题型/模拟卷配置 | 题型数量是静态展示，和真实 DB/考试规格不是同一来源 |
| `components/screens/drill/drill-questions.ts` | `/drill` 题目 adapter | 和 `/quiz` 的 `mapBankRow` 逻辑重复 |
| `components/quiz/LexiverseQuizClient.tsx` | `/quiz` runner | 内部有 `EXAM_TO_LEVEL`、`DRILL_TYPE_MAP`，说明规格散落在页面层 |
| `app/api/reading/route.ts` | 阅读列表/详情 | 仍从 `question_bank.audio_ref` 派生正文，已部分接 `reading_passages` |

### 2.3 现有学习闭环是否弄好

结论：单词级闭环已经有骨架，考试题库闭环还没有完成。

已经具备：

| 能力 | 证据 |
|---|---|
| 单词状态机 | `store/lexiStore.ts` 有 `markCorrect`、`markWrong`、`reviewGrade`、`recordDimPass` |
| SRS 调度 | `lib/srs/schedule.ts` 有 FSRS-like `gradeSrs` |
| 今日动线 | `TodayBento.tsx` 和 `lib/today/today-paths.tsx` |
| 错题本 | `wrongAnswers`、`addWrongAnswer` |
| 测验历史 | `addQuizSession` |
| 阅读中的点词 | `ReadingScreen.tsx` 可查词、阅读后答题 |

缺口：

| 缺口 | 后果 |
|---|---|
| 没有持久化 `question_attempts` | 无法精确统计“哪类题/哪个技能/哪个考试板块弱” |
| 没有 `paper_instances` | 模拟卷无法复盘完整卷面、section、计时、题源 |
| 技能维度过粗 | `recognize/spell/listen` 不足以覆盖 CET/SAT/TOEFL 的真实 subskills |
| 题目和目标词绑定浅 | `word_id` 只能表示一个词，篇章题/听力题/写作题无法表达目标词角色 |
| 听力没有稳定音频资产 | 浏览器 TTS 可做单词发音，不适合正式听力题组 |
| `/drill`、`/quiz`、`/mock-exam` runner 重复 | 后续维护成本高，容易出现“页面显示有题，实际抽不到题” |

建议目标：

- 单词闭环完成度：从约 70% 提到 90%。
- 考试题库闭环完成度：从约 35% 提到 85%。
- 模拟卷可信度：从“按 type 拼题”升级为“按官方结构 + 题组 + 分数规则组卷”。

## 3. 当前词库容量是否对应真实等级

### 3.1 当前数据库统计

统计时间：2026-06-20。只读 head/count 查询。

| 等级 | 当前 `primary_level` 本档新增词 | 当前 `levels` 大纲覆盖词 | 判断 |
|---|---:|---:|---|
| lv1 初中/中考 | 1,989 | 1,989 | 够，接近新课标 1,600 + 扩展 100-300 |
| lv2 高中/高考 | 1,924 | 3,743 | 够，覆盖高中 3,000 + 扩展 |
| lv3 CET-4 | 1,819 | 4,609 | 基本够，接近四级 4,500 量级 |
| lv4 CET-6 | 2,120 | 4,243 | 偏少；若按六级 5,500 量级，直接标签少约 1,200-1,400 |
| lv5 考研 | 1,086 | 5,896 | 总量够；训练必须按 `levels`，不能只看 `primary_level` |
| lv6 TOEFL | 8,038 | 13,632 | 量很大；关键不是补量，是学术领域和任务绑定 |
| lv7 SAT | 11,625 | 14,381 | 量很大；关键不是背大词表，而是 high-utility words in context |

补充数据：

| 指标 | 当前数量 |
|---|---:|
| `dictionary_words` | 28,602 |
| `dictionary_definitions` | 56,602 |
| `dictionary_synonyms` | 44,632 |
| `dictionary_antonyms` | 19,524 |
| `dictionary_etymology` | 25,130 |
| `word_mnemonics` | 26,321 |
| `dictionary_collocations` | 31,069 |
| `question_bank` total | 170,244 |
| `question_bank` active | 169,744 |
| `question_bank` draft | 500 |

### 3.2 真实需求口径

| 等级 | 真实词库量口径 | 当前是否够 | 处理 |
|---|---|---|---|
| 初中/中考 | 义务教育英语课标 2022 词汇表约 1,600，另可扩展 100-300 | 够 | 做官方词表覆盖 audit，补漏不扩量 |
| 高中/高考 | 普通高中课标 2017/2020 词汇表约 3,000，另可扩展 200 | 够 | 按课标 3,000 做 canonical set，避免过宽 |
| CET-4 | 四级常见口径约 4,500 词 + 短语 | 基本够 | 核对 CET4 源列表，补短语/搭配和听力词块 |
| CET-6 | 六级常见口径约 5,500 词 + 短语 | 直接 lv4 标签偏少 | 从 CET6 源文件/合法词表补齐 `levels`，目标 5,500 左右 |
| 考研 | 考试大纲常见表述约 5,500 词及相关附表 | 够 | 训练按 `levels includes 5`，不要按本档新增 |
| TOEFL | ETS 不提供固定官方词表；考四技能学术英语 | 量够 | 建 academic/domain/task tags，不追求“官方完整词表” |
| SAT | College Board 不提供传统固定词表；RW 考 high-utility words in context | 量够 | 建 SAT RW 高频语境词/修辞/语法标签，减少孤立同反义题 |

参考来源：

- 义务教育英语课程标准 2022：`https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf`
- 普通高中课程标准 2017 年版 2020 修订通知：`https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html`
- CET 官方考试大纲入口：`https://cet.neea.edu.cn/xhtml1/folder/16113/1588-1.htm`
- 考研英语大纲样本文档：`https://m.juyingonline.com/upload/202209/21/202209211109069702.pdf`
- ETS TOEFL iBT Test Content：`https://www.ets.org/toefl/test-takers/ibt/about/content.html`
- College Board SAT Reading and Writing：`https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing`
- College Board SAT RW Specifications：`https://satsuite.collegeboard.org/k12-educators/about/alignment/reading`

## 4. 当前题库问题和重建方向

### 4.1 当前题型数量

| 题型 | active 数量 | 主要用途 | 判断 |
|---|---:|---|---|
| `en_to_zh` | 14,611 | 认词 | 量大，但不是考试真题型 |
| `zh_to_en` | 14,567 | 产出识别 | 量大，适合背词，不适合模拟卷主体 |
| `def_to_word` | 14,567 | 释义选词 | DB 实际命名，需与 TS 类型统一 |
| `cloze_choice` | 14,126 | 单句完形/语境词 | 可保留为词汇语境题 |
| `zh_to_word_spell` | 14,581 | 拼写 | 背词必需 |
| `cloze_spell` | 14,100 | 语境拼写 | 背词必需 |
| `word_form` | 10,044 | 词形变化 | 初中/高中/写作有价值 |
| `listen_to_meaning` | 14,581 | 单词听辨 | 背词听力，不是正式听力 |
| `dictation_spell` | 14,581 | 单词听写 | 背词听写，不是正式听力 |
| `listening_comprehension` | 5,923 | 听力理解 | 需要按真实题组重构和接音频资产 |
| `reading_comprehension` | 13,401 | 阅读理解 | 量够，但需要按考试 section/task/subskill 重标 |
| `banked_cloze` | 208 | CET 选词填空 | 数量偏少，且需要全量答案键复核 |
| `seven_select` | 161 | 高考/考研新题型 | 数量偏少，需扩充并按考试区分 |
| `para_match` | 437 | CET 段落匹配/考研新题型 | 可用，但需要题组化 |
| `grammar_fill` | 219 | 高考语法填空 | 偏少，需要扩到 600+ 题组 |
| `collocation_choice` | 330 | 搭配 | 偏少，但适合词汇练习，不应冒充真实考试主体 |
| `antonym_choice` | 301 | 反义词 | 偏少；SAT/TOEFL 不应以此为主 |

### 4.2 题库重建原则

1. 单词宇宙练习和考试题库分层。
   - 单词宇宙：认词、拼写、听辨、词形、搭配、同反义、例句、造句。
   - 考试题库：按真实 section/task/subskill 训练。

2. 所有题目必须有 `question_set` 或 `single` 的归属。
   - 单词题可以是 single。
   - 阅读、听力、七选五、选词填空、段落匹配必须是 set。

3. 所有考试任务必须可以追踪到：
   - `exam_id`
   - `section_id`
   - `task_type`
   - `subskills`
   - `stimulus_id`
   - `target_words`
   - `difficulty_band`
   - `qa_status`

4. 模拟卷只从“通过该考试 section QA 的 active 题组”抽题。

5. 不复制真题原文和原题。
   - 可以参考官方结构和公开样题形式。
   - 内容必须是原创、授权或公版。

## 5. 七档应该实现的题型

### lv1 初中/中考

目标：词汇基础、语法基础、短篇阅读、短对话听力、书面表达入门。

必须题型：

| 模块 | 题型 |
|---|---|
| 单词宇宙 | 英译中、中译英、看释义选词、看中文拼写、听音选义、听写、词形变化 |
| 语法/词法 | 单项选择、词形/语法填空、句子补全、易混辨析 |
| 完形 | 整篇完形 10-15 空 |
| 阅读 | 短篇阅读选择、任务型阅读/回答问题 |
| 听力 | 短对话、长对话、短文理解、听填信息 |
| 写作 | 看图/提示作文、邮件/通知类短文 |

第一版最小题库：

- 单词宇宙：每词 5-7 个练习。
- 完形：300 篇。
- 阅读：500 篇，每篇 3-5 题。
- 听力：300 套短材料，预渲染音频。
- 写作 prompts：120 个，rubric 4 个维度。

### lv2 高中/高考

目标：高考真实结构，特别是阅读、七选五、完形、语法填空、应用文、读后续写。

必须题型：

| 模块 | 题型 |
|---|---|
| 听力 | 短对话/长对话/独白，20 题结构 |
| 阅读 | 阅读理解 A，应用文/说明文/议论文/记叙文 |
| 七选五 | 5 空 7 选项，逻辑衔接、主题句、过渡句 |
| 完形 | 整篇 15 空，词义辨析 + 上下文 |
| 语法填空 | 10 空，自由填词和词形变化 |
| 写作 | 应用文写作 |
| 读后续写 | 情节续写、衔接、语言质量 |

第一版最小题库：

- 阅读：800 篇。
- 七选五：300 篇。
- 完形：300 篇。
- 语法填空：600 篇/题组。
- 听力：400 套材料。
- 写作/续写：各 150 个 prompt。

### lv3 CET-4

目标：CET-4 真实板块训练，不能只做单词选择。

必须题型：

| 模块 | 题型 |
|---|---|
| 写作 | 短文写作 |
| 听力 | 短篇新闻、长对话、听力篇章 |
| 阅读 | 选词填空、长篇阅读匹配、仔细阅读 |
| 翻译 | 汉译英段落 |
| 词汇 | 四级核心词的语境题、搭配、词形 |

第一版最小题库：

- 听力新闻：300 组。
- 长对话：250 组。
- 听力篇章：250 组。
- 选词填空：400 篇。
- 长篇匹配：300 篇。
- 仔细阅读：600 篇。
- 翻译：200 段。
- 写作：200 题。

### lv4 CET-6

目标：CET-6 的抽象文本、讲座/报告听力、学术阅读和翻译。

必须题型：

| 模块 | 题型 |
|---|---|
| 写作 | 议论文/图表/观点类 |
| 听力 | 长对话、篇章、讲座/报告 |
| 阅读 | 选词填空、长篇匹配、仔细阅读 |
| 翻译 | 汉译英段落，文化/社会/科技 |
| 词汇 | 学术词汇语境、搭配、同义替换 |

第一版最小题库：

- 听力：900 组，讲座/报告比例提高。
- 选词填空：500 篇。
- 长篇匹配：350 篇。
- 仔细阅读：700 篇。
- 翻译：250 段。
- 写作：250 题。
- 词库补齐：直接 lv4/CET6 目标覆盖到约 5,500。

### lv5 考研

目标：区分英语一/英语二，重点是阅读、翻译、写作；没有听力。

必须题型：

| 模块 | 英语一 | 英语二 |
|---|---|---|
| 完形 | 20 空 | 20 空 |
| 阅读 A | 4 篇 20 题 | 4 篇 20 题 |
| 阅读 B | 新题型：排序/小标题/匹配 | 小标题/匹配等 |
| 翻译 | 英译汉，长难句/段落 | 英译汉，难度略低 |
| 写作 | 小作文 + 大作文 | 小作文 + 图表/议论文 |

第一版最小题库：

- 阅读 A：1,000 篇。
- 完形：400 篇。
- 新题型：500 篇，按类型拆。
- 翻译：400 段。
- 写作：小作文 180、大作文 220。
- 长难句专项：2,000 句，可绑定目标词和句法标签。

### lv6 TOEFL

目标：按 ETS 2026 后 TOEFL iBT 结构，四技能都要做，不要只做阅读/听力。

必须题型：

| Section | Task |
|---|---|
| Reading | Complete the Words、Read in Daily Life、Read an Academic Passage |
| Listening | Listen and Choose a Response、Conversation、Announcement、Academic Talk |
| Writing | Build a Sentence、Write an Email、Write for an Academic Discussion |
| Speaking | Listen and Repeat、Take an Interview |

第一版最小题库：

- Reading：1,000 组，覆盖日常/学术两类。
- Listening：1,000 组，必须有音频资产。
- Writing：500 题，带 rubric 和 AI scoring。
- Speaking：500 题，带录音、转写和评分。
- Academic domains：biology、history、psychology、education、business、environment、technology。

### lv7 SAT

目标：Digital SAT Reading & Writing，不要做老 SAT 大词同义题。

必须题型：

| Domain | 题型 |
|---|---|
| Information and Ideas | Central Ideas and Details、Command of Evidence、Inferences |
| Craft and Structure | Words in Context、Text Structure and Purpose、Cross-Text Connections |
| Expression of Ideas | Rhetorical Synthesis、Transitions |
| Standard English Conventions | Boundaries、Form/Structure/Sense |

模拟卷：

- 2 modules。
- 每 module 27 题。
- 总 54 题，64 分钟。
- 每题独立短 passage 或 passage pair，25-150 words。

第一版最小题库：

- Words in Context：800 题。
- Evidence/Inference/Central Idea：1,200 题。
- Rhetorical Synthesis/Transitions：800 题。
- Grammar/Conventions：1,200 题。
- Cross-text：300 题。

## 6. 目标数据模型

第一阶段不要直接删除 `question_bank`。新增 v2 表，旧表继续服务旧入口，迁移完成后再降级。

### 6.1 新增核心表

Create: `supabase/sql/p4-question-bank-v2.sql`

```sql
CREATE TABLE IF NOT EXISTS exam_specs (
  id TEXT PRIMARY KEY,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 7),
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  version TEXT NOT NULL,
  source_urls TEXT[] DEFAULT '{}',
  total_minutes INT,
  total_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','deprecated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_sections (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exam_specs(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  skill TEXT NOT NULL CHECK (skill IN ('vocabulary','grammar','reading','listening','speaking','writing','translation')),
  minutes INT,
  score NUMERIC,
  item_count INT,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS task_templates (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exam_specs(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES exam_sections(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  subskills TEXT[] DEFAULT '{}',
  input_mode TEXT NOT NULL CHECK (input_mode IN ('choice','spell','free_text','speak','listen','matching','multi_blank')),
  group_mode TEXT NOT NULL CHECK (group_mode IN ('single','set','paper')),
  answer_schema JSONB NOT NULL DEFAULT '{}',
  min_pool INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS stimuli (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('passage','dialogue','lecture','announcement','table','image','sentence','word')),
  title TEXT,
  text_en TEXT,
  text_zh TEXT,
  topic_tags TEXT[] DEFAULT '{}',
  domain_tags TEXT[] DEFAULT '{}',
  level INT CHECK (level BETWEEN 1 AND 7),
  word_count INT,
  source_type TEXT NOT NULL DEFAULT 'original',
  source_note TEXT,
  qa_status TEXT NOT NULL DEFAULT 'draft' CHECK (qa_status IN ('draft','machine_checked','human_checked','active','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audio_assets (
  id TEXT PRIMARY KEY,
  stimulus_id TEXT REFERENCES stimuli(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  duration_ms INT,
  accent TEXT,
  voice_id TEXT,
  provider TEXT,
  checksum TEXT,
  qa_status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exam_specs(id),
  section_id TEXT REFERENCES exam_sections(id),
  template_id TEXT REFERENCES task_templates(id),
  stimulus_id TEXT REFERENCES stimuli(id),
  level INT NOT NULL CHECK (level BETWEEN 1 AND 7),
  task_type TEXT NOT NULL,
  difficulty_band INT CHECK (difficulty_band BETWEEN 1 AND 5),
  estimated_minutes NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','deprecated','rejected')),
  qa_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_items (
  id TEXT PRIMARY KEY,
  set_id TEXT REFERENCES question_sets(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  prompt_zh TEXT,
  choices JSONB DEFAULT '[]',
  answer JSONB NOT NULL,
  explanation_zh TEXT,
  subskills TEXT[] DEFAULT '{}',
  target_words JSONB DEFAULT '[]',
  difficulty_band INT CHECK (difficulty_band BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft','deprecated','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_item_id TEXT NOT NULL REFERENCES question_items(id),
  paper_instance_id UUID,
  answer JSONB NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC,
  duration_ms INT,
  error_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  exam_id TEXT NOT NULL REFERENCES exam_specs(id),
  seed TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('mini','section','full')),
  section_order JSONB NOT NULL,
  question_set_ids TEXT[] NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS skill_states (
  user_id UUID NOT NULL,
  exam_id TEXT NOT NULL,
  skill_key TEXT NOT NULL,
  mastery NUMERIC NOT NULL DEFAULT 0,
  attempts INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, exam_id, skill_key)
);
```

### 6.2 目标词绑定格式

`question_items.target_words` 示例：

```json
[
  {
    "word_id": "sustainable",
    "surface": "sustainable",
    "role": "tested_answer",
    "sense_key": "adj:able-to-continue",
    "dimension": "meaning_in_context"
  },
  {
    "word_id": "resource",
    "surface": "resources",
    "role": "context_support",
    "dimension": "reading"
  }
]
```

这个结构解决三个问题：

- 篇章题可以绑定多个词。
- 词形变化可以记录 surface 和 lemma。
- 一个词的不同义项可以后续区分。

## 7. 前端应该怎么改

### 7.1 `/today`

Modify:

- `components/screens/TodayBento.tsx`
- `lib/today/today-paths.tsx`
- Create `lib/daily-plan/daily-plan-engine.ts`
- Create `app/api/daily-plan/route.ts`

改法：

1. 今日不再只显示硬编码 meta，如“10 题”“1 篇”。
2. 今日计划从 `DailyPlanEngine` 读取：
   - 到期词 SRS。
   - 弱技能。
   - 目标考试倒计时。
   - 最近模拟卷错区。
   - 单词宇宙未点亮词。
3. 增加一个更明显的单词宇宙入口：
   - 文案：`继续点亮单词宇宙`
   - 跳转：`/lexiverse?focus=today`
   - 参数含：`level`、`due`、`weak`、`goal`
4. 今日的“考试练习”跳转到 `/drill?tab=exam&exam=<targetExam>`。

验收：

- 新用户定级后进入 `/today`，能看到“单词宇宙 + 今日词 + 考试专项 + 复习”。
- 无题库的等级不会显示空练习，而是显示“先学词/先补题”的状态。

### 7.2 `/lexiverse`

Modify:

- `components/lexiverse/ReferenceLexiverseFrame.tsx`
- `components/lexiverse/PlanetDetailPanel.tsx`
- `components/lexiverse/ReferenceLexiverseNavPanel.tsx`
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`

改法：

1. 星球详情增加 4 个学习入口：
   - `记这个词`：加入 SRS。
   - `练这个词`：`/quiz?word=<slug>&source=lexiverse`
   - `放进真题型`：`/drill?scope=word&word=<slug>&tab=exam`
   - `看词图`：`/lexigraph?word=<slug>&returnTo=/lexiverse`
2. 星系视图增加考试过滤：
   - 初中/高考/CET4/CET6/考研/TOEFL/SAT。
   - 推荐优先按 `levels includes targetLevel`，不是只按 `primary_level`。
3. 单词详情页展示：
   - 词义/词形/词根/记忆/同反义/搭配。
   - `这个词在哪些题型出现`。
   - `最近做错这个词的题`。
   - `一键练 5 题`。

验收：

- 从任意星球可以进入单词练习。
- 完成练习后 SRS 和宇宙星球状态刷新。
- 考研用户能在宇宙里看到 `levels includes 5` 的目标词，而不是只看到 1,086 个本档新增词。

### 7.3 `/drill`

Modify:

- `components/screens/drill/DrillScreen.tsx`
- `components/screens/drill/drill-data.ts`
- `components/screens/drill/MockExam.tsx`
- `components/screens/drill/drill-questions.ts`
- Create `components/drill/ExamTaskPicker.tsx`
- Create `components/drill/WordUniversePracticePicker.tsx`
- Create `components/drill/MockPaperPicker.tsx`

改成三层：

| Tab | 用途 | 数据源 |
|---|---|---|
| 单词宇宙练习 | 背词、拼写、词形、听辨、搭配 | word state + question_items single |
| 考试专项 | 按考试/板块/任务/subskill 练 | exam_specs + task_templates |
| 模拟试卷 | mini/section/full paper | paper generator |

重点：

- 不再在 `drill-data.ts` 写死 `PAPER_SPECS`。
- 前端只展示 `GET /api/exam-specs` 返回的结构。
- `TypePicker` 的题型来自 `task_templates`。
- 如果某个 task pool 不足，显示“建设中/可练 mini”，不要假装可用。

验收：

- CET-4 用户能看到听力、阅读、翻译、写作、词汇专项。
- SAT 用户看到的是 RW 四大 domain，而不是“同义/反义/完形”。
- TOEFL 用户看到四技能。

### 7.4 `/quiz`

Modify:

- `components/quiz/LexiverseQuizClient.tsx`
- Create `components/practice/PracticeRunner.tsx`
- Create `components/practice/renderers/ChoiceRenderer.tsx`
- Create `components/practice/renderers/MultiBlankRenderer.tsx`
- Create `components/practice/renderers/MatchingRenderer.tsx`
- Create `components/practice/renderers/FreeTextRenderer.tsx`
- Create `components/practice/renderers/SpeakingRenderer.tsx`
- Create `components/practice/renderers/ListeningRenderer.tsx`

改法：

1. `/quiz` 保留 URL 兼容。
2. 内部不再自己写 `DRILL_TYPE_MAP` 和 `EXAM_TO_LEVEL`。
3. 用 `PracticeRunner` 消费 `PracticeSession`：

```ts
export interface PracticeSession {
  id: string
  mode: 'word' | 'task' | 'section' | 'paper'
  examId?: string
  sectionId?: string
  items: PracticeItem[]
}
```

4. 每题提交都调用 `POST /api/practice/attempts`。
5. 只有 `target_words` 里 `role=tested_answer` 或 `tested_context` 的词才更新 SRS。

验收：

- `/quiz?word=sustainable` 仍可用。
- `/quiz?mode=reading-practice` 转成新 session。
- 错题进入 `question_attempts` 和旧 wrongAnswers 双写过渡。

### 7.5 `/reading`

Modify:

- `components/screens/ReadingScreen.tsx`
- `app/api/reading/route.ts`
- Create `app/api/reading/[id]/attempts/route.ts`

改法：

1. 列表从 `stimuli/question_sets` 读取。
2. 文章详情读取：
   - `stimulus.text_en`
   - `stimulus.text_zh`
   - `question_items`
   - `target_words`
3. 保留当前“点词查词”的体验。
4. 做题结果写入 `question_attempts`。
5. 对应词回流：
   - 错在词义题：该词 `markWrong`。
   - 错在主旨/推断：不强行罚某个词，只更新 `skill_states`。

验收：

- 阅读文章可以按 level/exam/task 过滤。
- 做完文章能看到“错因：词义/推断/证据/主旨”。

### 7.6 `/listening`

Modify:

- `components/screens/ListeningScreen.tsx`
- Create `app/api/listening/route.ts`
- Create `components/practice/audio/AudioPlayer.tsx`

改法：

1. 单词听辨继续可用，但作为“单词宇宙听力”。
2. 考试听力必须读取 `audio_assets.url`。
3. 浏览器 TTS 只作为 fallback，不用于正式考试听力。
4. 听力题组支持：
   - 只能播放 N 次。
   - 先听后看题/边听边题，按 task 配置。
   - transcript 默认提交后才展示。

验收：

- 一套 CET 听力题可以播放音频、答题、提交、记录错因。
- 无音频资产的听力题不能 active。

### 7.7 `/speaking` 和 `/writing`

Modify:

- `components/screens/SpeakingScreen.tsx`
- `components/screens/WritingScreen.tsx`
- Create `lib/rubrics/rubric-types.ts`
- Create `app/api/writing/score/route.ts`
- Create `app/api/speaking/score/route.ts`

改法：

1. 保留 AI 自由练。
2. 增加考试任务模式：
   - TOEFL Speaking。
   - TOEFL Writing。
   - 高考应用文/续写。
   - CET/考研写作/翻译。
3. 主观题评分必须产出结构化结果：

```json
{
  "score": 4,
  "maxScore": 6,
  "rubric": {
    "taskFulfillment": 4,
    "language": 3,
    "organization": 4,
    "vocabulary": 4
  },
  "feedbackZh": ["论点清楚", "时态需要统一"],
  "targetWordsUsed": ["sustainable"]
}
```

验收：

- 主观题不会只显示一段聊天式反馈。
- 写作/口语结果进入 `question_attempts`，并更新 `skill_states`。

### 7.8 `/report` 和 `/memory`

Modify:

- `components/screens/ReportScreen.tsx`
- `components/screens/ReviewHub.tsx`
- `components/screens/WrongAnswerList.tsx`
- Create `lib/diagnostics/skill-diagnostics.ts`

改法：

1. 报告分三层：
   - 单词掌握。
   - 考试技能。
   - 模拟卷趋势。
2. 错题不只按 word 分组，还按：
   - exam
   - section
   - task_type
   - subskill
   - error_type
3. 复习入口增加：
   - 到期词。
   - 错题词。
   - 弱技能题组。
   - 最近模拟卷错区。

验收：

- 用户能看到“CET-4 选词填空弱”而不是只看到“识记 60%”。
- 点击弱项能直接进入对应练习。

## 8. 后端/API 应该怎么改

### Task 1: 建唯一考试规格源

**Files:**

- Create: `lib/exam-specs/types.ts`
- Create: `lib/exam-specs/level-map.ts`
- Create: `lib/exam-specs/specs.ts`
- Create: `scripts/validate-exam-specs.ts`
- Modify: `package.json`
- Later Modify: `lib/mock-exam/paper-specs.ts`
- Later Modify: `components/screens/drill/drill-data.ts`

- [ ] **Step 1: 定义类型**

`lib/exam-specs/types.ts`

```ts
export type ExamId = 'zhongkao' | 'gaokao' | 'cet4' | 'cet6' | 'kaoyan' | 'toefl' | 'sat'
export type SkillKey = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'translation'
export type InputMode = 'choice' | 'spell' | 'free_text' | 'speak' | 'listen' | 'matching' | 'multi_blank'
export type GroupMode = 'single' | 'set' | 'paper'

export interface ExamTaskSpec {
  id: string
  taskType: string
  nameZh: string
  inputMode: InputMode
  groupMode: GroupMode
  subskills: string[]
  minPool: number
}

export interface ExamSectionSpec {
  id: string
  nameZh: string
  nameEn: string
  skill: SkillKey
  minutes?: number
  score?: number
  itemCount?: number
  tasks: ExamTaskSpec[]
}

export interface ExamSpec {
  id: ExamId
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7
  nameZh: string
  nameEn: string
  version: string
  totalMinutes?: number
  totalScore?: number
  sourceUrls: string[]
  sections: ExamSectionSpec[]
}
```

- [ ] **Step 2: 写七档 specs**

`lib/exam-specs/specs.ts` 必须包含七档，且 TOEFL/SAT 使用 2026 当前结构：

```ts
import type { ExamSpec } from './types'

export const EXAM_SPECS: ExamSpec[] = [
  // zhongkao, gaokao, cet4, cet6, kaoyan, toefl, sat
]

export function getExamSpec(id: string): ExamSpec | null {
  return EXAM_SPECS.find((spec) => spec.id === id) ?? null
}
```

- [ ] **Step 3: 加验证脚本**

`scripts/validate-exam-specs.ts` 验证：

- 7 档都存在。
- 每个 section 有 task。
- 每个 task 有 `minPool`。
- SAT 有 4 个 RW domain。
- TOEFL 有 Reading/Listening/Writing/Speaking。
- 考研没有 listening/speaking。

- [ ] **Step 4: package script**

`package.json` 添加：

```json
"validate:exam-specs": "npx tsx scripts/validate-exam-specs.ts"
```

- [ ] **Step 5: 验证**

Run:

```bash
npm run validate:exam-specs
```

Expected:

```text
exam specs ok: 7 exams
```

### Task 2: 新建题库 v2 schema

**Files:**

- Create: `supabase/sql/p4-question-bank-v2.sql`
- Create: `types/question-bank-v2.ts`
- Create: `scripts/validate-question-bank-v2.ts`
- Modify: `package.json`

- [ ] **Step 1: 建 SQL migration**

使用第 6 节 SQL 作为基础。必须加索引：

```sql
CREATE INDEX IF NOT EXISTS idx_exam_sections_exam ON exam_sections(exam_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_exam ON task_templates(exam_id);
CREATE INDEX IF NOT EXISTS idx_stimuli_level_kind ON stimuli(level, kind);
CREATE INDEX IF NOT EXISTS idx_question_sets_exam_task ON question_sets(exam_id, task_type, status);
CREATE INDEX IF NOT EXISTS idx_question_sets_stimulus ON question_sets(stimulus_id);
CREATE INDEX IF NOT EXISTS idx_question_items_set ON question_items(set_id, status);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_created ON question_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_states_user_exam ON skill_states(user_id, exam_id);
```

- [ ] **Step 2: 建 TS 类型**

`types/question-bank-v2.ts` 导出与 SQL 对齐的 interface。

- [ ] **Step 3: 建验证脚本**

`scripts/validate-question-bank-v2.ts` 检查：

- active `question_sets` 必须至少有 1 个 active `question_items`。
- `group_mode=set` 的 task 必须有 `stimulus_id`。
- listening task 必须有 active `audio_assets`。
- answer JSON schema 和 input_mode 匹配。
- active 题目的 `target_words` 中 `word_id` 必须存在于 `dictionary_words`。

- [ ] **Step 4: package script**

```json
"validate:qbank-v2": "npx tsx scripts/validate-question-bank-v2.ts"
```

### Task 3: 词库等级 audit 和补词策略

**Files:**

- Create: `scripts/audit-vocabulary-levels.ts`
- Create: `reports/vocabulary-level-audit-2026-06-20.md`
- Create directory: `data/vocabulary-targets/`
- Modify later: `scripts/import-vocabulary.ts`

- [ ] **Step 1: 建目标词表配置**

`data/vocabulary-targets/README.md` 说明：

- 初中/高中/CET/考研可以维护 canonical source。
- TOEFL/SAT 不写“官方完整词表”，只维护 curated academic/high-utility set。
- 每个 source 文件必须有 license/source_note。

- [ ] **Step 2: audit 脚本输出**

`scripts/audit-vocabulary-levels.ts` 输出：

```json
{
  "level": 4,
  "name": "CET-6",
  "targetSize": 5500,
  "currentSyllabus": 4243,
  "currentPrimary": 2120,
  "missingFromCanonical": [],
  "levelTagMismatch": [],
  "recommendation": "补齐 direct CET6 levels 到约 5500；训练时可包含 CET4 prerequisite。"
}
```

- [ ] **Step 3: 修正业务口径**

后续所有“目标考试词库”使用：

```ts
// 考试大纲覆盖
word.levels?.includes(targetLevel)

// 本档新增词
word.primaryLevel === targetLevel
```

不能混用。

验收：

- CET6 audit 明确给出缺口。
- 考研 audit 显示 `levels=5` 够，不再误判只剩 1,086。
- TOEFL/SAT audit 显示“无官方固定词表，按 curated high-utility coverage 评估”。

### Task 4: 统一 practice session API

**Files:**

- Create: `app/api/practice/session/route.ts`
- Create: `app/api/practice/attempts/route.ts`
- Create: `lib/practice/session-builder.ts`
- Create: `lib/practice/attempt-recorder.ts`
- Modify later: `app/api/questions/route.ts`

- [ ] **Step 1: session builder 输入**

```ts
export interface BuildPracticeSessionInput {
  mode: 'word' | 'task' | 'section' | 'paper'
  examId?: string
  sectionId?: string
  taskType?: string
  wordId?: string
  level?: number
  count?: number
}
```

- [ ] **Step 2: session builder 输出**

```ts
export interface PracticeItem {
  id: string
  questionItemId: string
  setId: string
  inputMode: string
  stimulus?: {
    kind: string
    textEn?: string
    textZh?: string
    audioUrl?: string
    title?: string
  }
  prompt: string
  promptZh?: string
  choices?: { id: string; text: string }[]
  answerSchema: unknown
  explanationZh?: string
  targetWords: unknown[]
  subskills: string[]
}
```

- [ ] **Step 3: attempts 双写过渡**

提交到 `question_attempts`，同时对旧 `lexiStore` 所需数据返回：

```json
{
  "ok": true,
  "wordUpdates": [
    {"wordId": "sustainable", "grade": "good", "dimension": "meaning_in_context"}
  ],
  "skillUpdates": [
    {"examId": "cet4", "skillKey": "reading.banked_cloze", "delta": 0.02}
  ]
}
```

验收：

- `/quiz` 和 `/drill` 都能从同一个 session API 拿题。
- 每题提交都有 DB attempt。

### Task 5: 统一 PracticeRunner

**Files:**

- Create: `components/practice/PracticeRunner.tsx`
- Create: `components/practice/PracticeFrame.tsx`
- Create: `components/practice/renderers/ChoiceRenderer.tsx`
- Create: `components/practice/renderers/MultiBlankRenderer.tsx`
- Create: `components/practice/renderers/MatchingRenderer.tsx`
- Create: `components/practice/renderers/FreeTextRenderer.tsx`
- Create: `components/practice/renderers/SpeakingRenderer.tsx`
- Create: `components/practice/renderers/ListeningRenderer.tsx`
- Modify: `app/quiz/page.tsx`
- Modify later: `components/screens/drill/DrillScreen.tsx`

- [ ] **Step 1: 先让 `/quiz` 用 PracticeRunner**

`app/quiz/page.tsx` 仍保留原路由，但渲染新 runner。

- [ ] **Step 2: renderer 分 input mode**

| input_mode | renderer |
|---|---|
| choice | `ChoiceRenderer` |
| spell | `FreeTextRenderer` with exact/tolerant spelling |
| multi_blank | `MultiBlankRenderer` |
| matching | `MatchingRenderer` |
| listen | `ListeningRenderer` |
| speak | `SpeakingRenderer` |
| free_text | `FreeTextRenderer` |

- [ ] **Step 3: 保留旧 `LexiverseQuizClient` 兼容**

旧组件先不要删，改成 fallback 或 deprecated route component。等 `/drill` 全部迁移后再删。

验收：

- `/quiz?word=...` 可用。
- `/quiz?mode=reading-practice` 可用。
- `/quiz?mode=listening-practice` 可用。

### Task 6: 重建 `/drill`

**Files:**

- Modify: `components/screens/drill/DrillScreen.tsx`
- Create: `components/drill/ExamTaskPicker.tsx`
- Create: `components/drill/WordUniversePracticePicker.tsx`
- Create: `components/drill/MockPaperPicker.tsx`
- Create: `app/api/exam-specs/route.ts`

- [ ] **Step 1: `GET /api/exam-specs`**

返回：

```json
{
  "ok": true,
  "data": [
    {
      "id": "cet4",
      "level": 3,
      "nameZh": "CET-4",
      "sections": []
    }
  ]
}
```

- [ ] **Step 2: `/drill` 三 tab**

```text
单词宇宙练习 | 考试专项 | 模拟试卷
```

- [ ] **Step 3: task pool 不足状态**

前端显示：

```text
题库建设中：当前 active 题组 98 / 建议 500
可先练 Mini 模式
```

验收：

- TOEFL 和 SAT 不再只是 comingSoon 灰掉；可以显示各 section 建设进度。
- CET4/CET6 真实 section 可点击专项。

### Task 7: 听力资产管线

**Files:**

- Create: `scripts/generate-audio-assets.ts`
- Create: `scripts/validate-audio-assets.ts`
- Create: `lib/audio/audio-asset-client.ts`
- Create: `components/practice/audio/AudioPlayer.tsx`
- Modify: `supabase/sql/p4-question-bank-v2.sql`

- [ ] **Step 1: 听力材料先有 script**

每个 listening stimulus 必须有：

```json
{
  "kind": "conversation",
  "text_en": "A: ...\nB: ...",
  "topic_tags": ["campus", "schedule"],
  "domain_tags": ["daily-life"]
}
```

- [ ] **Step 2: 生成音频**

音频写入 Supabase Storage，`audio_assets.url` 存可访问 URL。

- [ ] **Step 3: QA**

`scripts/validate-audio-assets.ts` 检查：

- active listening set 必须有 audio。
- transcript 非空。
- duration_ms 合理。
- checksum 非空。
- audio provider/voice_id 非空。

验收：

- 正式听力题不再依赖浏览器临时 TTS。
- 音频缺失时题组不能 active。

### Task 8: 模拟卷生成器

**Files:**

- Create: `lib/papers/paper-generator.ts`
- Create: `lib/papers/scoring.ts`
- Create: `app/api/papers/route.ts`
- Create: `app/api/papers/[id]/route.ts`
- Modify: `components/screens/drill/MockExam.tsx`

- [ ] **Step 1: 生成 paper instance**

`POST /api/papers` body:

```json
{
  "examId": "cet4",
  "mode": "full",
  "seed": "optional"
}
```

返回 `paperInstanceId` 和 sections。

- [ ] **Step 2: 组卷规则**

1. 按 `exam_specs.sections` 顺序。
2. 对 set 型题目按 `question_sets` 抽。
3. 对 single 型题目按 `question_items` 抽。
4. 同一卷避免重复 `stimulus_id`、重复 `target_words` 过多、重复 topic。
5. pool 不足时返回 `insufficient_pool`，不要静默 fallback 到不相关题型。

- [ ] **Step 3: 评分**

`lib/papers/scoring.ts` 支持：

- objective：正确/错误。
- multi_blank：每空计分。
- matching：每匹配计分。
- free_text/speak：rubric 分。
- scaled：按 exam spec 折算。

验收：

- CET4 full paper 能生成固定结构。
- 同 seed 生成同一卷。
- 交卷后可复盘每个 section。

### Task 9: 题库生成和迁移

**Files:**

- Create: `scripts/migrate-question-bank-v1-to-v2.ts`
- Create: `scripts/generate-question-sets-v2.ts`
- Create: `scripts/qa-question-sets-v2.ts`
- Create: `data/exam-task-templates/*.json`
- Create: `reports/qbank-v2-migration-report.md`

- [ ] **Step 1: 迁移旧单词题**

旧题型映射：

| old type | new task_type | group_mode |
|---|---|---|
| `en_to_zh` | `word_meaning_choice` | single |
| `zh_to_en` | `word_reverse_choice` | single |
| `def_to_word` | `definition_to_word_choice` | single |
| `zh_to_word_spell` | `word_spelling` | single |
| `listen_to_meaning` | `word_audio_meaning` | single |
| `dictation_spell` | `word_dictation` | single |
| `word_form` | `word_form_fill` | single |
| `collocation_choice` | `collocation_choice` | single |

- [ ] **Step 2: 迁移旧篇章题**

按 `normalized_word` 聚合：

| old type | stimulus kind | new task_type |
|---|---|---|
| `reading_comprehension` | passage | reading_mcq |
| `listening_comprehension` | dialogue/lecture | listening_mcq |
| `cloze_passage` | passage | passage_cloze |
| `seven_select` | passage | sentence_insertion |
| `banked_cloze` | passage | banked_cloze |
| `para_match` | passage | paragraph_matching |
| `grammar_fill` | passage/sentence | grammar_fill |

- [ ] **Step 3: 只迁移 QA 通过的 active 题**

旧题如果 answer/choices/stimulus 缺失，迁到 draft，并记录到 report。

- [ ] **Step 4: 重建缺口题型**

优先顺序：

1. CET4/CET6 banked_cloze。
2. 高考 grammar_fill/seven_select。
3. 考研 reading B/new type。
4. TOEFL listening/speaking/writing。
5. SAT RW domains。

验收：

- v2 中所有 active set 都能被 PracticeRunner 渲染。
- 老 v1 题库仍可 fallback。

### Task 10: 学习闭环升级

**Files:**

- Create: `lib/learning-loop/word-mastery.ts`
- Create: `lib/learning-loop/skill-state-updater.ts`
- Create: `lib/daily-plan/daily-plan-engine.ts`
- Modify: `app/api/practice/attempts/route.ts`
- Modify: `components/screens/TodayBento.tsx`
- Modify: `components/screens/ReportScreen.tsx`
- Modify: `components/screens/ReviewHub.tsx`

- [ ] **Step 1: 每题 attempt 更新三个状态**

```text
QuestionAttempt -> WordState
QuestionAttempt -> SkillState
QuestionAttempt -> Wrong/Error Queue
```

- [ ] **Step 2: 错因分类**

`error_type` 枚举：

```text
unknown_word
wrong_sense
collocation
word_form
grammar
inference
main_idea
evidence
listening_detail
listening_inference
pronunciation
fluency
organization
translation_accuracy
```

- [ ] **Step 3: DailyPlanEngine**

输入：

- profile level/exam/path。
- due words。
- weak words。
- weak skills。
- exam date。
- last paper result。

输出：

```json
[
  {"kind":"lexiverse_words","count":12,"reason":"到期词 + 未点亮核心词"},
  {"kind":"exam_task","examId":"cet4","taskType":"banked_cloze","count":1,"reason":"最近正确率 48%"},
  {"kind":"review","count":8,"reason":"SRS 到期"}
]
```

验收：

- 今日计划能解释为什么推荐这项。
- 做错 banked_cloze 后，第二天能推荐 banked_cloze 或相关词汇修复。

## 9. 题库重建路线

### Phase 0: 冻结证据和保护现状

- [ ] 新建分支。
- [ ] 运行 `npm run lint`、`npx tsc --noEmit`、`npm run validate:data-quality`。
- [ ] 导出当前题库统计到 `reports/qbank-before-v2.json`。
- [ ] 不删除旧 `question_bank`。

### Phase 1: 规格统一

- [ ] 完成 `lib/exam-specs/*`。
- [ ] `drill-data.ts` 和 `paper-specs.ts` 改为从 specs 派生。
- [ ] 删除重复静态 count，改为 API 返回。
- [ ] `validate:exam-specs` 加入 CI。

### Phase 2: Schema v2 和兼容 API

- [ ] 执行 `p4-question-bank-v2.sql`。
- [ ] 建 `question-bank-v2.ts`。
- [ ] 建 `practice/session` 和 `practice/attempts` API。
- [ ] 旧 `/api/questions` 保持可用。

### Phase 3: 迁移旧题到 v2

- [ ] 单词题迁移。
- [ ] 阅读题组迁移。
- [ ] 听力题组迁移为 draft，等音频资产补齐。
- [ ] 生成迁移报告。

### Phase 4: 前端 runner 统一

- [ ] 新 `PracticeRunner`。
- [ ] `/quiz` 接入。
- [ ] `/drill` 自选练习接入。
- [ ] `/reading` 接入。
- [ ] `/listening` 接入。

### Phase 5: 单词宇宙入口升级

- [ ] 星球详情加入 4 个 CTA。
- [ ] 单词详情展示题型覆盖。
- [ ] Lexiverse 支持目标考试词库视图。
- [ ] 完成练习后星球状态刷新。

### Phase 6: 补齐高优先级题型

优先做：

1. 高考 `grammar_fill` 从 219 扩到 600+。
2. 高考 `seven_select` 从 60 扩到 300+。
3. CET4 `banked_cloze` 从 110 扩到 400+。
4. CET6 `banked_cloze` 从 98 扩到 500+。
5. 考研 reading B 从 200 左右扩到 500+。
6. TOEFL/SAT 按新真实结构建 v2，不沿用老 type。

### Phase 7: 听力音频

- [ ] 为 CET/高考/中考先生成音频。
- [ ] 为 TOEFL task 生成多口音 academic/daily audio。
- [ ] 音频 QA 通过后再 active。

### Phase 8: 模拟卷

- [ ] CET4/CET6 full paper。
- [ ] 高考 full paper。
- [ ] 考研英语一/二。
- [ ] TOEFL adaptive/section mock。
- [ ] SAT 2-module RW mock。

### Phase 9: 主观题

- [ ] 写作 rubric。
- [ ] 翻译 rubric。
- [ ] 口语 rubric。
- [ ] AI scoring + 本地 fallback + 人审开关。

### Phase 10: 报告和学习闭环

- [ ] `question_attempts` 驱动 skill state。
- [ ] Report 显示考试板块雷达。
- [ ] ReviewHub 能进入弱技能训练。
- [ ] DailyPlanEngine 替代硬编码今日 meta。

## 10. 补词计划

### 10.1 先不补的情况

这些档位不应该盲目扩词：

- 初中：当前 1,989 已足够。重点是课标覆盖校验。
- 高中：当前 3,743 已足够。重点是 3,000 核心和高考高频排序。
- TOEFL：当前 13,632 已很多。重点是 academic domain、collocation、listening/writing usage。
- SAT：当前 14,381 已很多。重点是 Words in Context 和修辞/语法任务，不是继续堆大词。

### 10.2 必须处理的情况

CET-6：

- 当前 `levels includes 4` = 4,243。
- 六级目标应接近 5,500 量级。
- 建议补齐到 5,500 左右，优先补：
  - CET6 源文件中被过滤/未入库词。
  - ECDICT/合法词表中 CET6 tag 但 DB 未标 lv4 的词。
  - 六级高频学术词、短语、搭配。

考研：

- 当前 `primary_level=5` = 1,086，看起来少。
- 但 `levels includes 5` = 5,896，实际大纲覆盖够。
- 需要修页面和推荐逻辑，避免只按 `primary_level` 展示。

### 10.3 补词流程

1. `audit-vocabulary-levels.ts` 生成缺口。
2. 人工确认 source license。
3. `import-vocabulary.ts` 支持只更新 `levels/tags/source_word_list`，不覆盖已有释义。
4. 对新增词补：
   - definition_zh。
   - definition_en 只填真实英文释义，不能中文污染。
   - examples。
   - phonetic。
   - inflections。
   - collocations。
   - mnemonics。
5. 同反义词不强行生成，缺就缺，避免错关系。

验收：

- `validate:data-quality` 过。
- `validate:vocab-levels` 过。
- CET6 direct syllabus 达到目标范围。

## 11. 容易忽略但必须做的点

| 点 | 为什么重要 | 处理 |
|---|---|---|
| 版权 | 真题原文/题目不能直接搬 | 只模仿结构，内容原创/授权/公版 |
| TOEFL 2026 结构变化 | 旧 TOEFL 题型会误导 | 以 ETS 当前 Test Content 为准 |
| SAT 不再是大词同义题 | 当前同义替换无法代表 SAT | 做 4 RW domains，词汇只放 Words in Context |
| 题组不是单题 | banked/seven/matching/reading/listening 必须整组 | v2 `question_sets` |
| 音频不能靠浏览器 TTS | 正式听力需要稳定音频 | `audio_assets` + storage |
| 主观题不能只聊天 | 写作/口语/翻译需要 rubric | rubric JSON + scoring API |
| `primary_level` 与 `levels` | 本档新增和目标大纲不是一回事 | 页面明确区分 |
| 旧 type 命名债务 | `definition_to_word` vs `def_to_word` | v2 统一，v1 adapter 兼容 |
| 难度校准 | AI 生成题难度不稳定 | attempt pass rate 回写 estimated difficulty |
| 题目退役 | 错题或低质题不能直接删 | `deprecated/rejected` 状态 |
| 空池 fallback | 不能把 SAT 空池 fallback 成同义题 | pool 不足要显示建设中 |

## 12. 验收标准

### 12.1 数据验收

- `npm run validate:exam-specs` 通过。
- `npm run validate:qbank-v2` 通过。
- `npm run validate:vocab-levels` 通过。
- `npm run validate:data-quality` 通过。
- active listening set 音频覆盖 100%。
- active set 没有缺 answer、缺 choices、缺 stimulus。

### 12.2 功能验收

- 从 `/today` 能进入：
  - 单词宇宙。
  - 目标考试专项。
  - 复习。
  - 模拟卷。
- 从 `/lexiverse` 任意词能进入：
  - 练这个词。
  - 真题型语境。
  - 词图。
  - 复习。
- `/drill` 能按 exam/section/task 练。
- `/quiz` 兼容旧链接。
- `/reading` 和 `/listening` 写入 attempts。
- `/report` 能展示 exam skill 弱项。

### 12.3 内容验收

- 初中/高中/CET/考研题型与真实考试结构一致。
- TOEFL 使用 ETS 当前四技能 task。
- SAT 使用 College Board RW 四大 domain。
- 模拟卷按 section 组卷，不按散题拼凑。
- 主观题有 rubric，不只给一句 AI 反馈。

## 13. 推荐执行顺序

最稳的 8 个开发包：

1. **Spec Pack**：`lib/exam-specs` + 验证脚本。
2. **Schema Pack**：`p4-question-bank-v2.sql` + TS 类型。
3. **Vocab Audit Pack**：等级词库 audit，先修 CET6/考研口径。
4. **Practice API Pack**：session + attempts。
5. **Practice Runner Pack**：统一渲染 choice/spell/matching/multi_blank/listen/free_text。
6. **Drill UI Pack**：三 tab 专练台。
7. **Lexiverse Entry Pack**：单词宇宙入口和词详情练习。
8. **Paper + Diagnostics Pack**：模拟卷、报告、DailyPlanEngine。

不要在 Pack 1-4 完成前大规模生成新题。否则新题还是会落到旧结构里，后面要再迁移一次。

