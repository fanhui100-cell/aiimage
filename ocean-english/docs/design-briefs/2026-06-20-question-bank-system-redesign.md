# Ocean English 题库系统完整设计方案

日期：2026-06-20  
目标：围绕“单词宇宙”这个核心卖点，重建一套能服务 7 档考试、支持听力/阅读/写作/口语/翻译、能生成模拟卷、能形成学习闭环的题库系统。  
原则：不存储盗版真题原文；学习真实考试题型、任务结构、评分方式，生成/编写原创题目。

---

## 1. 一句话方案

Ocean English 不应该做成普通刷题站，而应该做成：

> 以单词宇宙为主入口，以真实考试任务为骨架，以 SRS + 错因诊断 + 题库召回为闭环的“词汇驱动型考试训练系统”。

也就是：

- 用户从一个词、一组词、一个星系进入，可以练识记、词形、语境、真题型、输出。
- 用户从一个考试等级进入，可以按真实考试板块做专项和完整模拟卷。
- 两个入口背后使用同一套题库、同一套学习状态、同一套错因诊断。

---

## 2. 当前项目状态判断

### 2.1 已经具备的能力

项目现在已经有不错的闭环雏形：

| 模块 | 当前文件/能力 | 判断 |
|---|---|---|
| 词状态机 | `store/lexiStore.ts` | 有 `learning/review/weak/mastered`，可继续作为核心 |
| SRS 调度 | `lib/srs/schedule.ts` | 有 FSRS 风格的 `again/hard/good/easy` 调度 |
| 今日学习 | `components/screens/TodayBento.tsx` | 能按 daily goal、due、weak 组织今日动线 |
| 复习中心 | `components/screens/ReviewHub.tsx` | 有到期、薄弱、错题三个入口 |
| 题库表 | `supabase/sql/p1-question-bank.sql` | 已有 `question_bank`，但 schema 偏词汇练习 |
| 专练入口 | `components/screens/drill/DrillScreen.tsx` | 能按等级/题型抽题 |
| 普通题库 API | `app/api/questions/route.ts` | 能按 `level/type/types/exam` 过滤题 |
| 模拟卷 API | `app/api/mock-exam/route.ts` | 有初步组卷器 |
| 错题同步 | `app/api/user/wrong-answers/route.ts` | 能保存词级错题 |
| 学习进度同步 | `app/api/user/study-progress/route.ts` | 能同步 XP、streak、week_xp |

### 2.2 还没有真正闭合的地方

| 问题 | 当前表现 | 影响 |
|---|---|---|
| 题库不是考试任务模型 | `question_bank.type` 是平铺题型，没有 `exam/section/task/subskill` | 不能严肃诊断“高考七选五弱”或“SAT transitions 弱” |
| 单词和题的绑定太浅 | 多数题只有 `word_id/normalized_word`，没有 `sense_id/target_words/role` | 无法从单词宇宙精准进入真实题型 |
| 模拟卷不够真 | `mock-exam` 主要按 `type + level` 抽题，不足以按真实 section/subtype 装配 | 做出来像“拼题”，不像真卷 |
| 主观题缺失 | 写作、翻译、口语基本被 `skipped` 或 coming soon | 高考、CET、考研、TOEFL 都不完整 |
| 听力只是半接入 | 现在多依赖 `audio_ref`/浏览器 TTS，缺少标准音频资产表 | 不能支持真听力训练、精听、音频证据 |
| 错因粒度太粗 | 错题多记录到 word/question，缺 subskill、section、evidence | 不能自动安排针对性补练 |
| 技能统计不严肃 | 部分结果页能力条像展示估算，不来自真实 `subskill` 聚合 | 用户会看到分数，但不知道怎么提升 |
| 题库和前端规格重复 | `drill-data.ts` 和 `paper-specs.ts` 各有一套规格 | 容易再次漂移 |

结论：当前学习闭环是“单词复习闭环”基本成型，“考试题库闭环”还没有真正成型。重做题库时应保留词状态机/SRS/Today/ReviewHub，但重建题库 schema、ExamSpec、Attempt、诊断和模拟卷系统。

---

## 3. 目标信息架构

### 3.1 双主线入口

```text
Ocean English
  今日
    今日单词宇宙复习
    今日考试任务
    今日错因补练
    今日输出任务

  单词宇宙
    星图探索
    等级词群
    主题词群
    词根词缀星系
    易混词星系
    考试高频星系
    单词详情
      记忆
      关系
      语境
      真题型练习
      输出使用

  等级备考
    lv1 初中/中考
    lv2 高中/高考
    lv3 CET-4
    lv4 CET-6
    lv5 考研
    lv6 TOEFL
    lv7 SAT

  模拟考试
    选择考试
    选择卷别/地区/版本
    完整模拟
    结果诊断
    自动补练计划

  复习
    到期
    薄弱
    错题
    考试技能弱项
```

### 3.2 单词宇宙里的练习阶梯

每个词详情页都应有 5 个训练层：

| 阶梯 | 名称 | 题型示例 | 目的 |
|---|---|---|---|
| 1 | 认得 | 英译中、看释义选词、听音选义 | 建立词义 |
| 2 | 写对 | 拼写、词形、派生、词根词缀 | 建立结构 |
| 3 | 选对 | 语境填空、易混辨析、搭配 | 建立用法 |
| 4 | 考会 | SAT words in context、CET 选词填空、高考语法填空 | 接真实考试 |
| 5 | 用出来 | 造句、翻译、写作、口语 | 形成输出 |

---

## 4. 核心数据模型

### 4.1 ExamSpec

所有考试结构必须从数据库/配置统一读取，前端和后端不能各写一份。

```ts
type ExamSpec = {
  id: string;                  // cet4, sat_digital, toefl_ibt_2026
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  label_zh: string;
  version: string;             // 2026-official, nmet-new-curriculum
  official_source_urls: string[];
  total_minutes: number;
  full_score: number;
  scoring_scale: "raw" | "710" | "100" | "1-6" | "400-800";
  sections: ExamSectionSpec[];
  status: "draft" | "active" | "deprecated";
};

type ExamSectionSpec = {
  id: string;                  // listening_short_news
  label_zh: string;
  skill: "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing" | "translation" | "integrated";
  task_type: string;
  item_count: number;
  points: number;
  time_limit_sec?: number;
  item_selection: {
    source_pool: string[];
    difficulty_mix?: Record<"easy" | "medium" | "hard", number>;
    group_by?: "passage" | "audio" | "set" | "single";
    requires_audio?: boolean;
    requires_rubric?: boolean;
  };
};
```

### 4.2 Question

新题库要从“词汇题行”升级为“考试任务题”。

```ts
type Question = {
  id: string;
  exam_id: string;
  level: number;
  section_id: string;
  task_type: string;
  subtype?: string;
  skill: string;
  subskills: string[];
  input_mode: "choice" | "spell" | "short_text" | "long_text" | "speech" | "drag_match" | "order";

  stimulus_id?: string;
  passage_id?: string;
  audio_id?: string;
  prompt: string;
  prompt_zh?: string;
  choices?: Array<{ id: string; text: string }>;
  answer: unknown;

  target_words: Array<{
    word_id: string;
    sense_id?: string;
    role: "tested_answer" | "tested_context" | "distractor" | "keyword" | "expected_output";
  }>;

  scoring: {
    points: number;
    auto_gradable: boolean;
    rubric_id?: string;
    partial_credit?: boolean;
  };

  explanation: {
    correct_rationale: string;
    distractor_rationales?: Record<string, string>;
    evidence_spans?: Array<{ stimulus_id: string; start: number; end: number }>;
  };

  difficulty: {
    estimated: "easy" | "medium" | "hard";
    calibrated_p?: number;
  };

  source: {
    source_type: "original_curated" | "ai_generated" | "licensed" | "official_sample_linked";
    source_note: string;
    license_status: "original" | "licensed" | "linked_only";
    generator_version?: string;
  };

  status: "draft" | "reviewed" | "active" | "retired";
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
};
```

### 4.3 Stimulus

阅读文章、听力脚本、SAT 短文本、CET 长篇匹配文章，都应统一成材料表。

```ts
type Stimulus = {
  id: string;
  kind: "single_sentence" | "short_text" | "passage" | "multi_passage" | "notes" | "table" | "audio_script";
  title?: string;
  text: string;
  text_zh?: string;
  word_count?: number;
  genre?: string;
  topic_tags: string[];
  level: number;
  exam_ids: string[];
  source_type: string;
  status: "draft" | "reviewed" | "active";
};
```

### 4.4 AudioAsset

听力题不能只靠浏览器 TTS 临时念，要有可复用音频资产。

```ts
type AudioAsset = {
  id: string;
  stimulus_id: string;
  audio_url: string;
  transcript: string;
  voice: string;
  accent: "us" | "uk" | "mixed" | "cn";
  speed_wpm: number;
  duration_sec: number;
  pauses: Array<{ at_sec: number; duration_ms: number }>;
  audio_type: "word" | "sentence" | "dialogue" | "lecture" | "announcement" | "interview";
  tts_provider?: string;
  reviewed: boolean;
};
```

### 4.5 Attempt 与诊断

必须把“用户做过什么、错在哪里、下一步补什么”记录下来。

```ts
type QuestionAttempt = {
  id: string;
  user_id: string;
  session_id: string;
  question_id: string;
  exam_id: string;
  section_id: string;
  task_type: string;
  subskills: string[];
  target_words: Array<{ word_id: string; sense_id?: string; role: string }>;
  user_answer: unknown;
  is_correct: boolean;
  score_awarded: number;
  time_spent_sec: number;
  mistake_tags: string[];
  answered_at: string;
};
```

---

## 5. 七档题库题型设计

### 5.1 lv1 初中/中考

中考有地区差异，建议做“核心包 + 地区包”。

| 板块 | 必备题型 | 说明 |
|---|---|---|
| 词汇语法 | 语境单选、词形变化、短文填空、句子完成 | 基础准确性 |
| 完形 | 8-15 空短文完形 | 上下文逻辑、固定搭配 |
| 阅读 | 信息匹配、细节、推断、主旨、词义猜测 | 主得分区 |
| 阅读表达 | 根据短文回答、开放解释 | 北京等地区重要 |
| 写作 | 留言、邮件、建议、活动介绍，50-100 词 | 需要 rubric |
| 听说 | 听后选择、听后回答、朗读、情景问答、转述 | 地区适配 |

最低题库量：

- 完整模拟卷：30 套。
- 阅读文章：600 篇。
- 完形：250 篇。
- 阅读表达：180 篇。
- 写作题：250 个。
- 听说任务：300 组。
- 基础语法/词汇语境题：1,000 题。

### 5.2 lv2 高中/高考

按新高考全国卷主线建设。

| 板块 | 必备题型 | 说明 |
|---|---|---|
| 听力 | 短对话、长对话、独白 MCQ | 20 题左右 |
| 阅读理解 | 4 篇，多题 MCQ | 细节、推断、主旨、态度、词义 |
| 七选五 | 5 空 7 选项 | 篇章结构和衔接 |
| 完形 | 15 空四选一 | 语境和逻辑 |
| 语法填空 | 10 空，词形/无提示词 | 高考核心 |
| 应用文写作 | 邀请、通知、建议、投稿、活动介绍 | 评分标准必须可执行 |
| 读后续写 | 原文 + 两段开头 + 150 词左右续写 | 高考差异化能力 |

最低题库量：

- 完整模拟卷：40 套。
- 听力套组：400 组。
- 阅读文章：800 篇。
- 七选五：300 篇。
- 完形：350 篇。
- 语法填空：350 篇。
- 应用文：350 题。
- 读后续写：250 题。

### 5.3 lv3 CET-4

按官方 CET4 笔试结构。

| 板块 | 必备题型 | 说明 |
|---|---|---|
| 写作 | 短文写作 | 15% |
| 听力 | 短篇新闻 7、长对话 8、听力篇章 10 | 35% |
| 阅读 | 选词填空 10、长篇匹配 10、仔细阅读 10 | 35% |
| 翻译 | 汉译英段落 | 15% |

最低题库量：

- 完整模拟卷：50 套。
- 写作题：400 个。
- 短篇新闻：300 组。
- 长对话：300 组。
- 听力篇章：300 组。
- 选词填空：350 篇。
- 长篇匹配：300 篇。
- 仔细阅读：700 篇。
- 汉译英段落：400 段。

### 5.4 lv4 CET-6

结构类似 CET4，但材料更难，听力有讲座/报道/讲话。

| 板块 | 必备题型 | 说明 |
|---|---|---|
| 写作 | 议论文、图表、社会议题 | 论证要求更高 |
| 听力 | 长对话、听力篇章、讲话/报道/讲座 | CET6 重点 |
| 阅读 | 选词填空、长篇匹配、仔细阅读 | 抽象、学术、评论类 |
| 翻译 | 汉译英段落 | 句法更复杂 |

最低题库量：

- 完整模拟卷：50 套。
- 写作题：450 个。
- 长对话：350 组。
- 听力篇章：350 组。
- 讲座/报道：350 组。
- 选词填空：400 篇。
- 长篇匹配：350 篇。
- 仔细阅读：800 篇。
- 汉译英段落：450 段。

### 5.5 lv5 考研

必须拆成英语一和英语二，不能只叫“考研”。

| 板块 | 英语一 | 英语二 |
|---|---|---|
| 完形 | 20 空 | 20 空 |
| 阅读 A | 4 篇 x 5 题 | 4 篇 x 5 题 |
| 阅读 B | 七选五、排序、小标题/匹配 | 小标题/匹配等 |
| 翻译 | 划线长难句英译汉 | 短文段落英译汉 |
| 小作文 | 书信、通知、告示、纪要 | 类似 |
| 大作文 | 图画/议论文 | 图表/数据/说明议论 |

最低题库量：

- 英语一完整模拟卷：40 套。
- 英语二完整模拟卷：40 套。
- 完形：各 300 篇。
- 阅读 A：英一 800 篇，英二 700 篇。
- 阅读 B：英一 300 篇，英二 250 篇。
- 翻译：英一 400 组划线句，英二 350 段。
- 小作文：各 300 个。
- 大作文：各 300 个。

### 5.6 lv6 TOEFL

必须按 ETS 2026 新 TOEFL iBT 四技能任务建设。

| 板块 | 必备题型 |
|---|---|
| Reading | Complete the Words、Read in Daily Life、Read an Academic Passage |
| Listening | Listen and Choose a Response、Conversation、Announcement、Academic Talk |
| Writing | Build a Sentence、Write an Email、Write for an Academic Discussion |
| Speaking | Listen and Repeat、Take an Interview |

最低题库量：

- 完整模拟体验：30 套。
- Complete the Words：2,000 题。
- Read in Daily Life：500 组。
- Academic Passage：500 篇。
- Choose Response：800 题。
- Conversation：400 组。
- Announcement：300 组。
- Academic Talk：400 组。
- Build a Sentence：1,000 题。
- Email Writing：300 题。
- Academic Discussion：300 题。
- Listen and Repeat：1,000 句。
- Interview Speaking：500 题。

### 5.7 lv7 SAT

Digital SAT 英语只做 Reading and Writing，不做听力、口语、作文。

| 官方域 | 必备题型 |
|---|---|
| Information and Ideas | central ideas/details、textual evidence、quantitative evidence、inference |
| Craft and Structure | words in context、text structure/purpose、cross-text connections |
| Expression of Ideas | transitions、rhetorical synthesis |
| Standard English Conventions | boundaries、form/structure/sense |

最低题库量：

- RW 自适应模拟：40 套。
- Information and Ideas：3,000 题。
- Craft and Structure：2,500 题。
- Expression of Ideas：1,800 题。
- Standard English Conventions：2,500 题。
- 图表/数据题：600 题。
- 双文本题：600 题。

---

## 6. 听力系统怎么做

### 6.1 听力不要只做 TTS 播放

现在项目可用浏览器 TTS 播放单词/短文本，这是 MVP 可以接受，但完整题库要有“音频资产层”：

```text
听力材料文本 -> 审核文本 -> 生成音频 -> 音频 QA -> 入 audio_assets -> 题目引用 audio_id
```

### 6.2 听力材料类型

| 类型 | 用在哪些等级 | 结构 |
|---|---|---|
| 单词发音 | 所有等级基础层 | word audio |
| 句子听写 | 初中/高中/TOEFL 基础 | sentence audio |
| 短对话 | 中考、高考、CET | 2 人对话 + 1-3 题 |
| 长对话 | 高考、CET4/6、TOEFL | 2 人对话 + 4-5 题 |
| 新闻/报道 | CET4/6 | news/report + MCQ |
| 公告 | TOEFL | announcement + MCQ |
| 学术讲座 | CET6/TOEFL | lecture/talk + MCQ |
| 面试口语提示 | TOEFL Speaking | prompt audio + speech answer |

### 6.3 音频生产流程

1. 生成或人工编写听力脚本。
2. 自动检查词数、语速目标、话轮数、考试等级、敏感内容。
3. 用 TTS 生成音频，优先用稳定的服务端 TTS，不依赖浏览器。
4. 存储到 Supabase Storage 或对象存储。
5. 写入 `audio_assets`。
6. 自动跑音频 QA：
   - 文件可访问。
   - 时长与脚本长度匹配。
   - transcript 非空。
   - speed_wpm 在目标范围。
   - 同一 set 的题目能引用同一 audio。
7. 题目引用 `audio_id`，不是直接放一段文本让浏览器念。

### 6.4 听力交互设计

听力题前端必须支持：

- 播放次数策略：练习可无限，模拟卷按真实规则限制或记录次数。
- 进度条：练习可显示；模拟卷可隐藏或弱化。
- transcript：练习后显示；模拟中不显示。
- 精听模式：逐句播放、跟读、听写、查看关键词。
- 错因：没听到关键词、数字时间错误、态度误判、推断错误、词汇不熟。

---

## 7. 模拟试卷怎么做

### 7.1 组卷器不能只按 type 抽题

目标组卷逻辑：

```text
选择 ExamSpec
  -> 按 section 顺序遍历
  -> 根据 section.item_selection 找候选题
  -> 按 group_by 选择整组材料
  -> 控制难度比例、题量、主题去重
  -> 生成 PaperInstance
  -> 用户作答
  -> 按 section scoring 评分
  -> 输出诊断和补练计划
```

### 7.2 PaperInstance

```ts
type PaperInstance = {
  id: string;
  user_id?: string;
  exam_id: string;
  spec_version: string;
  seed: string;
  sections: Array<{
    section_id: string;
    question_ids: string[];
    stimulus_ids: string[];
    audio_ids: string[];
    points: number;
    time_limit_sec?: number;
  }>;
  created_at: string;
};
```

### 7.3 模拟卷评分

| 题型 | 评分方式 |
---|---|
| 选择题 | 自动判分 |
| 拼写/短填空 | 标准答案 + 容错规则，模拟卷严格，练习可宽松 |
| 多空题 | 每空计分，支持局部得分 |
| 匹配/排序 | 每项计分 |
| 写作 | rubric + AI 初评 + 可选人工复核 |
| 翻译 | rubric + 关键词/句法点 + AI 评分 |
| 口语 | 音频转写 + 发音/流利度/内容/语法评分 |

### 7.4 模拟卷结果页

不要只显示总分，要显示：

- 总分、各 section 分。
- 与目标线差距。
- subskill 雷达图。
- 错题证据定位。
- 影响最大 5 个弱项。
- 需要回炉的词/词群。
- 下一次复习计划。
- 生成一键补练包。

示例：

```text
CET-4 模拟卷结果
  总分估算：456 / 710
  听力：137 / 249
  阅读：178 / 249
  写作翻译：141 / 212

最大失分：
  1. 长篇匹配同义转述
  2. 短篇新闻数字/原因题
  3. 选词填空词性判断

自动补练：
  - 选词填空 3 篇
  - 新闻听力 5 组
  - 高频词性词族 20 个
```

---

## 8. 学习闭环设计

### 8.1 目标闭环

```text
定级/目标考试
  -> 今日计划
  -> 单词宇宙学习
  -> 真实题型练习
  -> 作答记录
  -> 错因诊断
  -> SRS 调度
  -> 错题/弱项补练
  -> 模拟卷验证
  -> 调整今日计划
```

### 8.2 三类状态要统一

当前项目主要有“词状态”。重建后要有三层状态：

| 状态 | 例子 | 用途 |
|---|---|---|
| WordState | `learning/review/weak/mastered` | 单词记忆 |
| SkillState | `sat.transitions = weak` | 考试技能 |
| ExamState | `cet4.mock_score = 456` | 目标考试进度 |

### 8.3 SRS 如何升级

当前 `gradeSrs` 可继续用于词级复习，但要扩展为：

- 词级 SRS：这个词什么时候复习。
- 题型 SRS：这个 task_type 是否需要重新练。
- 错因 SRS：某类错误多久后重测。

示例：

```text
用户错了 CET4 选词填空：
  target word: sustainable
  mistake: pos_misjudge
  subskill: banked_cloze.pos_and_context

系统动作：
  sustainable -> word state 降为 weak，1 小时后回点
  banked_cloze.pos_and_context -> skill state 降低
  今日补练 -> 加 2 道词性题 + 1 篇选词填空
```

### 8.4 今日计划生成

今日页建议由 `DailyPlanEngine` 生成：

```ts
type DailyPlan = {
  date: string;
  user_goal: string;
  cards: Array<{
    kind: "word_review" | "new_words" | "exam_task" | "mistake_fix" | "output";
    title: string;
    payload: unknown;
    estimated_minutes: number;
    priority: number;
  }>;
};
```

生成规则：

1. 先放到期 SRS。
2. 再放薄弱词。
3. 再放目标考试的高权重弱项。
4. 再放新词。
5. 每天至少一个输出任务。
6. 模拟卷后 3 天内优先修复模拟卷弱项。

---

## 9. 题库生成系统

### 9.1 生成顺序

不要先生成“题”，要先生成“材料和任务”：

```text
ExamSpec -> TaskTemplate -> Stimulus -> QuestionSet -> Question -> QA -> Active
```

### 9.2 TaskTemplate

每种题型要有模板约束：

```ts
type TaskTemplate = {
  task_type: string;
  exam_ids: string[];
  input_mode: string;
  stimulus_requirements: {
    min_words?: number;
    max_words?: number;
    audio_required?: boolean;
    option_count?: number;
    blank_count?: number;
  };
  answer_schema: unknown;
  validation_rules: string[];
  rubric_id?: string;
};
```

### 9.3 质量门禁

入库前必须检查：

- task_type 是否属于该 ExamSpec。
- level 是否匹配。
- 选择题是否只有一个最佳答案。
- 干扰项是否有解释。
- 阅读题是否有 evidence span。
- 听力题是否有 audio + transcript。
- 写作/翻译/口语是否有 rubric。
- 多空题答案数量是否与空数量一致。
- banked cloze 是否有词性标签和唯一答案。
- SAT 是否为 25-150 词短文本。
- 考研是否没有听力/口语。
- TOEFL 是否覆盖四技能。

### 9.4 AI 生成策略

| 内容 | 可 AI 生成 | 必须复核 |
|---|---|---|
| 原创阅读文章 | 是 | 事实、难度、题目答案 |
| 听力脚本 | 是 | 自然度、音频、答案 |
| 选择题 | 是 | 唯一答案、干扰项 |
| 写作题 | 是 | 任务真实度 |
| 评分 rubric | 可辅助 | 必须人工确定 |
| 同义/反义关系 | 可建议 | 必须语义复核 |

AI 生成题不要直接 active，必须 `draft -> auto_validated -> reviewed -> active`。

---

## 10. 前端产品设计

### 10.1 单词宇宙页

增加“练这个词”入口：

```text
单词详情
  记忆卡
  关系图
  例句
  考试出现方式
    初中：完形/阅读词义
    高考：语法填空/完形/写作表达
    CET：选词填空/翻译
    考研：阅读/翻译长难句
    TOEFL：Complete the Words/Academic Reading/Speaking
    SAT：Words in Context/Transitions
  开始训练
    5 分钟基础
    10 分钟真题型
    加入今日
```

### 10.2 等级备考页

```text
等级页
  真实考试结构
  我的当前能力
  推荐下一步
  专项训练
  完整模拟
  高频词宇宙
```

### 10.3 练习页

统一练习页要支持：

- choice
- spell
- short text
- long writing
- speaking recording
- drag match
- ordering
- multi-blank
- passage group
- audio group

### 10.4 复习页

复习页不只复习词，还要复习：

- 到期词。
- 薄弱词。
- 错题。
- 弱 subskill。
- 模拟卷错因。
- 输出任务重写。

---

## 11. 后端/API 设计

### 11.1 建议 API

| API | 作用 |
|---|---|
| `GET /api/exam-specs` | 返回 7 档考试结构 |
| `GET /api/questions` | 专项题查询，支持 exam/section/task/subskill/word |
| `POST /api/question-attempts` | 保存每题作答 |
| `POST /api/paper-instances` | 创建模拟卷 |
| `GET /api/paper-instances/:id` | 获取卷子 |
| `POST /api/paper-attempts` | 提交整卷 |
| `GET /api/diagnostics` | 返回能力诊断 |
| `GET /api/daily-plan` | 生成今日计划 |
| `POST /api/audio-assets/generate` | 生成听力音频 |
| `POST /api/writing/score` | 写作评分 |
| `POST /api/speaking/score` | 口语评分 |

### 11.2 数据库新增表

建议新增：

- `exam_specs`
- `exam_sections`
- `task_templates`
- `stimuli`
- `audio_assets`
- `question_sets`
- `question_target_words`
- `rubrics`
- `paper_instances`
- `paper_attempts`
- `question_attempts`
- `skill_states`
- `daily_plans`

现有 `question_bank` 可迁移为新 `questions` 或逐步加字段。

---

## 12. 实施路线

### Phase 1：统一规格与数据模型

目标：先把“题库是什么”定义清楚。

- 建 `exam_specs` 和 `exam_sections`。
- 把 7 档真实考试结构录入。
- 建 `task_templates`。
- 扩展 question schema：`exam_id/section_id/task_type/subskills/stimulus_id/audio_id/target_words/scoring`。
- 前端从 `ExamSpec` 读结构，不再维护重复配置。

### Phase 2：单词宇宙入口

目标：把单词作为题库入口。

- 给 dictionary word 增 `sense_id`。
- 建 `question_target_words`。
- 单词详情页加“真题型练这个词”。
- 今日页混入“这个词的真实考试题”。

### Phase 3：客观题专项

目标：先把自动判分题做完整。

- 初中/高考：完形、阅读、七选五、语法填空。
- CET：选词填空、长篇匹配、仔细阅读。
- 考研：完形、阅读 A/B。
- SAT：四域短文本选择题。
- TOEFL：Reading/Listening 客观题。

### Phase 4：听力资产

目标：听力从 TTS 临时播放升级为资产系统。

- 建 `audio_assets`。
- 生成并存储音频。
- 听力练习支持 transcript/精听/错因。
- CET/高考/TOEFL 听力专项可用。

### Phase 5：主观题评分

目标：补齐写作、翻译、口语。

- 建 `rubrics`。
- 写作评分：高考、CET、考研、TOEFL。
- 翻译评分：CET、考研。
- 口语评分：TOEFL、初高中地区听说。

### Phase 6：模拟卷

目标：生成真正按结构的卷。

- 建 `paper_instances`。
- 按 ExamSpec 组卷。
- 支持整卷计时、分 section 提交、结果诊断。
- SAT 实现 RW 双模块自适应。
- TOEFL 实现 2026 四技能模拟体验。

### Phase 7：学习闭环升级

目标：从“做题”变成“自动提分路径”。

- 保存所有 attempts。
- 生成 skill states。
- 错因回流到词、题型、技能。
- DailyPlanEngine 自动安排补练。
- 模拟卷后生成 3 日修复计划。

---

## 13. 验收标准

### 13.1 数据验收

- 每个 active question 必须属于一个 ExamSpec section。
- 每个 active question 至少有一个 subskill。
- 80% 以上题目有 target_words；阅读主旨题可只挂关键词。
- 听力题 100% 有 audio_id 和 transcript。
- 主观题 100% 有 rubric。
- 多空题 100% 通过答案键校验。

### 13.2 功能验收

- 从单词详情能进入该词相关练习。
- 从等级页能进入真实考试专项。
- 每个等级能生成一套结构正确的模拟卷。
- 做错题后能进入错因补练。
- 今日页能显示“到期词 + 考试弱项 + 输出任务”。
- 模拟卷结果能给 section/subskill/word 三层诊断。

### 13.3 质量验收

- SAT 题不出现长篇阅读。
- 考研不出现听力/口语。
- TOEFL 不缺写作/口语。
- CET4/6 选词填空不是普通完形。
- 高考必须有读后续写。
- CET/考研必须有翻译。
- 听力音频不能只有文字 TTS fallback。

---

## 14. 容易忽略的点

1. **版权**：不能把真题原文爬下来入库，只能链接参考或做原创仿真题。
2. **sense 粒度**：同义反义、题目 target word 必须到词义层，不然多义词会污染。
3. **地区差异**：中考/高考要支持地区包，不能假装全国完全一致。
4. **卷别差异**：考研必须拆英语一/英语二。
5. **考试更新**：TOEFL 2026 结构已变，要加 version。
6. **音频可迁移**：音频不能依赖浏览器语音，部署/移动端会不稳定。
7. **主观题成本**：写作/口语评分会带来 AI 成本，要有限流和缓存。
8. **诊断可信度**：能力图必须来自真实 attempts，不要用展示层估算。
9. **错因体系**：错题不只是“这个词错了”，要知道为什么错。
10. **题目退役**：题目发现错误要能 `retired`，不能硬删导致历史记录断链。
11. **A/B 难度校准**：AI 估难度不够，最终要用用户作答数据校准。
12. **前后端单一真源**：ExamSpec 必须后端一份，前端读取，不能重复写配置。

---

## 15. 最终建议

短期不要直接“把现有题库再扩一批”。更稳的重建顺序是：

1. 先建 ExamSpec 和 TaskTemplate。
2. 再把单词宇宙接到 `question_target_words`。
3. 先做自动判分客观题。
4. 再做听力资产。
5. 再做写作/翻译/口语评分。
6. 最后做完整模拟卷和学习闭环诊断。

这样项目会保留最惊艳的卖点：用户在单词宇宙里探索、记忆、建立关系；同时每一个词都能被送进真实考试任务里验证。它不是“背词 App + 刷题页”，而是“从词汇宇宙长出考试能力”的产品。
