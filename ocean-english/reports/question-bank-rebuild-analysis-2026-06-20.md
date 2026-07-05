# Ocean English 7档题库重建分析

日期：2026-06-20  
范围：lv1 初中/中考、lv2 高中/高考、lv3 CET-4、lv4 CET-6、lv5 考研、lv6 TOEFL、lv7 SAT  
目标：不受现有题库限制，从真实考试题型倒推“应该练什么、怎么建题库、如何验收质量”。

## 0. 总结结论

如果题库要重做，建议不要再以“背单词题型”为中心，而要改成“考试任务蓝图”为中心：

1. 每个等级先有一份 `ExamSpec`，定义真实考试的板块、题量、时间、分值、题型、输入材料、答案形式、评分规则。
2. 所有题目必须挂到某个真实考试任务上，例如 `CET4/listening/short_news_mcq`、`SAT/rw/craft_words_in_context`、`NMET/writing/continuation_writing`。
3. 单词练习仍然保留，但降级为“基础训练层”，不能充当题库主体。真正能提分的是语篇、任务、限时、评分标准和错因反馈。
4. 同义词、反义词、词形、拼写、听写这些题型只在对应考试真实考查时进入主线；否则只能作为辅助训练。
5. 题库必须以“套卷 + 专项”双轨建设：用户平时刷专项，阶段性做完整模拟卷，系统用真实分值权重给诊断。

现有截图里的题型更像“词汇学习中心”，而不是“七档真实考试训练中心”。它可以作为词汇模块保留，但不适合作为新题库的主干。

## 1. 依据来源

本报告参考的核心官方/准官方来源：

- 初中/中考：教育部《义务教育英语课程标准（2022年版）》；北京/上海/苏州等地中考真题或考试院评析。
- 高中/高考：中国教育考试网 2024 高考综合改革适应性测试英语科新课标试卷与评析；中国教育在线历年高考英语真题汇总。
- CET-4/CET-6：中国教育考试网 CET4/CET6 笔试结构、分数解释与考试大纲。
- 考研：中国研究生招生信息网/考试大纲资料；英语一/英语二真题结构。
- TOEFL：ETS 官方 TOEFL iBT Test Content and Structure，2026 sample test pages。
- SAT：College Board 官方 Digital SAT Structure、Reading and Writing Section、Digital SAT sample/practice tests。

参考卷链接见：`reports/exam-format-vs-question-bank-audit-2026-06-20.md` 的“7档真实参考卷/样题链接”。

## 2. 重建题库的总架构

### 2.1 题库分三层

| 层级 | 作用 | 例子 | 是否计入考试能力 |
|---|---|---|---|
| 基础层 | 词汇、拼写、词形、语法点、发音、搭配 | 英译中、中译英、词形变化、短语搭配 | 只作为基础能力，不直接代表考试分 |
| 任务层 | 对应真实考试小题型 | CET 选词填空、SAT words in context、高考七选五、考研新题型 | 是 |
| 套卷层 | 按真实时间、题量、分值组成完整卷 | CET4 模拟卷、SAT RW 双模块、TOEFL 四技能整套 | 是，诊断主依据 |

### 2.2 每题必须有的字段

建议统一题库 schema，不同题型扩展不同字段：

```ts
type ExamQuestion = {
  id: string;
  level: "lv1" | "lv2" | "lv3" | "lv4" | "lv5" | "lv6" | "lv7";
  exam: "zhongkao" | "nmet" | "cet4" | "cet6" | "kaoyan_en1" | "kaoyan_en2" | "toefl_ibt_2026" | "sat_digital";
  section: string;
  task_type: string;
  subtype?: string;
  skill: "vocabulary" | "grammar" | "reading" | "listening" | "speaking" | "writing" | "translation" | "integrated";
  subskills: string[];
  stimulus: {
    text?: string;
    passages?: string[];
    audio_url?: string;
    transcript?: string;
    image_url?: string;
    table_data?: unknown;
    word_count?: number;
    audio_duration_sec?: number;
  };
  stem: string;
  options?: Array<{ key: string; text: string }>;
  answer: unknown;
  scoring: {
    points: number;
    auto_gradable: boolean;
    rubric_id?: string;
    partial_credit?: boolean;
  };
  explanation: {
    correct_rationale: string;
    distractor_rationales?: Record<string, string>;
    evidence_spans?: Array<{ passage_id?: string; start: number; end: number }>;
  };
  difficulty: {
    target_level: string;
    estimated: "easy" | "medium" | "hard";
    calibrated_p?: number;
  };
  metadata: {
    topic: string[];
    genre?: string;
    cefr?: string;
    source_trace: string;
    license_status: "original" | "public_official_linked" | "licensed" | "internal_mock";
    reviewed_by_human: boolean;
    version: number;
    status: "draft" | "reviewed" | "active" | "retired";
  };
};
```

### 2.3 套题必须有的字段

```ts
type ExamPaperSpec = {
  exam: string;
  version: string;
  sections: Array<{
    section: string;
    task_type: string;
    item_count: number;
    time_limit_min?: number;
    points: number;
    selection_rules: unknown;
  }>;
};
```

题库系统不要让前端自己拼题型。前端只读 `ExamSpec`，这样不会出现“界面显示有 TOEFL 听力，但 API 查不到题”的漂移。

### 2.4 单词宇宙驱动题库

Ocean English 的核心卖点是“单词宇宙”，所以新题库不应该做成普通考试刷题站。更好的结构是“双主线”：

| 主线 | 用户心智 | 入口 | 题库组织方式 |
|---|---|---|---|
| 单词宇宙主线 | 我要把词真正记住、用起来 | 单词宇宙、今日词群、词卡详情 | 从 word/sense 出发，进入识记、语境、考试题型、输出任务 |
| 考试备考主线 | 我要冲某个等级/考试 | 等级页、专项页、套卷页 | 从 ExamSpec 出发，按真实考试板块练 |

这两条线必须共享同一套题库，区别只是入口不同：

```text
同一道题
  从单词宇宙进入：这是 practice 这个词在 SAT words in context 里的用法
  从 SAT 进入：这是 Craft and Structure / Words in Context 的一道题
```

#### 2.4.1 单词节点应该成为题库索引中心

每个词不是只存中文释义，而应该是一个可训练节点：

```ts
type WordNode = {
  id: string;
  lemma: string;
  senses: Array<{
    sense_id: string;
    pos: string;
    definition_zh: string;
    definition_en?: string;
    example: string;
    exam_levels: string[];
    frequency_band?: string;
  }>;
  pronunciation: {
    ipa?: string;
    audio_url?: string;
    syllables?: string[];
  };
  forms: {
    plural?: string;
    past?: string;
    past_participle?: string;
    present_participle?: string;
    comparative?: string;
    superlative?: string;
    derivatives?: string[];
  };
  memory: {
    root?: string[];
    affixes?: string[];
    etymology?: string;
    mnemonic?: string;
    image_url?: string;
  };
  relations: {
    synonyms?: Array<{ word_id: string; sense_id?: string; strength: "strong" | "loose" }>;
    antonyms?: Array<{ word_id: string; sense_id?: string; strength: "strong" | "loose" }>;
    collocations?: string[];
    word_family?: string[];
    confusion_set?: string[];
  };
  srs: {
    user_state?: "new" | "learning" | "reviewing" | "mastered";
    next_review_at?: string;
  };
};
```

关键点：同义词/反义词必须挂到 `sense_id`，不能只挂 lemma。比如 `light` 的“轻的”和“光”不是同一个关系网络。

#### 2.4.2 从一个词进入时，应该出现 5 级训练阶梯

| 阶梯 | 训练形态 | 例子 | 目的 |
|---|---|---|---|
| 1 识别 | 释义、发音、拼写、词性 | 看释义选词、听音选词、看中文拼写 | 先认得 |
| 2 结构 | 词形、词根词缀、派生、搭配 | decide/decision/decisive，make a decision | 知道怎么变 |
| 3 语境 | 单句/短文填空、易混辨析 | choose / select / elect 的语境区别 | 会选对 |
| 4 真题任务 | 按等级进入真实题型 | SAT words in context、CET 选词填空、高考语法填空 | 会考试 |
| 5 输出 | 造句、翻译、写作、口语 | 用 target word 写一句高分句，TOEFL email 中使用 | 会使用 |

所以“单词入口”不只是再加一个按钮，而是每个词详情页都应该有：

- `记忆`：词义、发音、拼写、词根、词源、助记。
- `关系`：同义、反义、搭配、词族、易混词。
- `考试`：这个词在七档考试中分别怎么考。
- `练习`：从基础到考试任务的一键训练。
- `输出`：造句、翻译、写作、口语使用。

#### 2.4.3 题目也要反向绑定单词

新题库每道题都应该记录它训练了哪些词，而不是只记录题型：

```ts
type WordLinkedQuestion = ExamQuestion & {
  target_words: Array<{
    word_id: string;
    sense_id?: string;
    role: "tested_answer" | "tested_context" | "distractor" | "reading_keyword" | "writing_expected";
  }>;
};
```

这样可以实现：

- 在单词宇宙点一个词，看到它能练的所有真实题型。
- 用户做错一道阅读题，系统知道是主旨问题、定位问题，还是 `claim/evidence/assume` 这类词族没掌握。
- 今日复习不再只有闪卡，可以自动混入“这个词在真实考试里怎么出现”。

#### 2.4.4 七档考试里的“单词宇宙”接法

| 等级 | 单词宇宙应该接入的真实任务 |
|---|---|
| lv1 初中 | 语境单选、完形、阅读词义猜测、阅读表达关键词、写作常用表达 |
| lv2 高中 | 完形、语法填空、阅读同义转述、七选五衔接词、应用文/续写高分表达 |
| lv3 CET-4 | 选词填空、长篇匹配同义替换、仔细阅读词义题、段落翻译核心表达 |
| lv4 CET-6 | 抽象词汇选词填空、讲座/报道关键词、阅读论证词、翻译高级表达 |
| lv5 考研 | 阅读核心抽象词、长难句关键词、完形逻辑词、翻译句法词、写作主题词 |
| lv6 TOEFL | Complete the Words、Daily Life/Academic Reading 关键词、听力学术词、口写输出词 |
| lv7 SAT | Words in Context、Transitions、Rhetorical Synthesis、Conventions 中的语法/逻辑词 |

这能保留项目最惊艳的“宇宙探索感”：用户不是在刷一堆孤立题，而是在把一个词从星球节点一路推进到真实考试场景。

#### 2.4.5 推荐的信息架构

```text
首页
  今日
    今日单词宇宙复习
    今日考试专项
    今日输出任务

单词宇宙
  星图探索
  等级词群
  主题词群
  词根词缀星系
  易混词星系
  考试高频星系

等级备考
  lv1 初中/中考
  lv2 高中/高考
  ...

词卡详情
  记忆
  关系
  例句
  真题语境
  练这个词
  加入今日
```

#### 2.4.6 单词入口如何和题库生成结合

重做题库时，建议每道题的生成顺序改成：

1. 选择考试任务：例如 SAT `words_in_context`。
2. 选择目标词义：例如 `practice` 的 noun sense 或 verb sense。
3. 生成符合考试的材料和题干。
4. 生成干扰项，干扰项必须来自同等级、同词性、可混淆但语境不合适的词。
5. 写入 `target_words` 和 `sense_id`。
6. 通过自动门禁：词义匹配、答案唯一、难度合规、题型合规。

这样既保证“单词宇宙”是主入口，又不会牺牲真实考试题型。

## 3. lv1 初中/中考

### 3.1 真实考试特点

中考没有全国统一英语卷，各省市题型差异大，但核心能力一致：基础语法词汇、语篇理解、信息提取、开放表达、部分地区听说机考。北京 2024 中考笔试示例包括单项填空、完形填空、阅读理解、阅读表达、文段表达；上海考试院评析强调真实情境、综合运用与核心素养。

### 3.2 应该练的题型

| 模块 | 必做题型 | 训练目的 |
|---|---|---|
| 语法词汇 | 语境单选、短文填空、词形变化、句子完成 | 基础准确性，不能只背孤立词义 |
| 完形 | 8-15 空短文完形，四选一 | 上下文、逻辑、固定搭配、情感态度 |
| 阅读 | 信息匹配、细节题、推断题、主旨题、词义猜测题 | 中考主要得分区 |
| 阅读表达 | 根据短文回答问题、开放解释题 | 把“看懂”转成“能表达” |
| 写作 | 50-100 词应用/介绍/建议/邮件/留言 | 真实输出，需评分 rubric |
| 听力/听说 | 听后选择、听后回答、朗读、情景问答、转述 | 地区适配，北京等地很重要 |

### 3.3 不建议作为主线的题型

- 直接反义词选择：中考很少直接这样考，应该融入阅读词义和语境选择。
- 单纯“看中文拼写”：可做基础训练，但不能代表中考能力。
- 同义替换：要放在阅读同义转述、任务型阅读证据定位中，而不是孤立词表题。

### 3.4 重建实现

初中题库应做“地区通用核心 + 地区适配包”：

- `zhongkao_core`：语法单选、完形、阅读、阅读表达、写作。
- `zhongkao_beijing`：加强阅读表达、二选一写作、听说机考任务。
- `zhongkao_shanghai`：加强首字母/语篇填空、概要/综合阅读表达。
- `zhongkao_jiangsu`：加强完形、阅读表达、词汇运用。

最低建设量建议：

| 类型 | 最低量 |
|---|---:|
| 完整模拟卷 | 30 套 |
| 语法/词汇语境题 | 1,000 题 |
| 完形短文 | 250 篇 |
| 阅读文章 | 600 篇 |
| 阅读表达文章 | 180 篇 |
| 写作题 | 250 个 |
| 听说任务 | 300 组 |

## 4. lv2 高中/高考

### 4.1 真实考试特点

新高考英语核心结构是：听力、阅读理解、七选五、语言运用、写作。中国教育考试网的高考综合改革适应性测试说明指出，听力为选择题，阅读包括选择题和匹配题，语言运用包括选择题和填空题，写作包括应用文写作和读后续写；新课标卷取消短文改错，加入读后续写。

### 4.2 应该练的题型

| 模块 | 必做题型 | 真实对应 |
|---|---|---|
| 听力 | 短对话/长对话/独白 MCQ | 高考听力 |
| 阅读理解 | 4 篇左右，多题 MCQ | 细节、推理、主旨、态度、词义 |
| 七选五 | 5 空 7 选项 | 篇章结构、衔接、主题句 |
| 完形填空 | 15 空，四选一 | 语境、逻辑、搭配、情感 |
| 语法填空 | 10 空，无选项/有词形变化 | 语法结构和语篇运用 |
| 应用文写作 | 通知、邀请、建议信、投稿、活动介绍 | 15 分左右 |
| 读后续写 | 350 词以内材料 + 两段续写 | 综合读写、情节推进、语言表达 |

### 4.3 不建议作为主线的题型

- 单词英译中/中译英只能作为词汇基础，不是高考主任务。
- 反义词、同义词孤立选择不应进入高考专项。
- 段落匹配不能泛化为所有高中阅读；高考核心是七选五，不是 CET 长篇匹配。

### 4.4 重建实现

高考题库应围绕“新课标全国卷”建主线，再扩展地方卷：

| 类型 | 最低量 |
|---|---:|
| 完整模拟卷 | 40 套 |
| 听力套组 | 400 组 |
| 阅读文章 | 800 篇 |
| 七选五文章 | 300 篇 |
| 完形文章 | 350 篇 |
| 语法填空短文 | 350 篇 |
| 应用文写作题 | 350 个 |
| 读后续写题 | 250 个 |

高考题库一定要有写作评分 rubric：

- 应用文：任务完成度、内容要点、语体、结构、语言准确性。
- 读后续写：情节合理性、与原文衔接、人物动机、语言质量、两段结构。

## 5. lv3 CET-4

### 5.1 真实考试特点

官方 CET4 笔试结构：写作 1 题 15%；听力短篇新闻 7 题、长对话 8 题、听力篇章 10 题，共 35%；阅读包括选词填空 10 题、长篇阅读匹配 10 题、仔细阅读 10 题，共 35%；翻译为汉译英段落翻译 1 题 15%。

### 5.2 应该练的题型

| 模块 | 必做题型 | 训练目的 |
|---|---|---|
| 写作 | 短文写作/议论文/现象解释/图表或情景作文 | CET 写作固定板块 |
| 听力短篇新闻 | 新闻 2-3 则 + MCQ | 抓主旨、数字、原因、结果 |
| 听力长对话 | 校园/生活/工作对话 + MCQ | 场景推断、态度、细节 |
| 听力篇章 | 短文独白 + MCQ | 主旨、细节、推断 |
| 选词填空 | 15 词选 10 空 | 词性、搭配、语篇逻辑 |
| 长篇阅读 | 10 句信息匹配到段落 | 快速定位、同义改写 |
| 仔细阅读 | 2 篇文章，每篇 5 题 | 细节、推断、态度、主旨 |
| 段落翻译 | 汉译英，中国文化/社会主题 | 句法、词汇、表达准确性 |

### 5.3 不建议作为主线的题型

- “听写”不是 CET4 笔试主流题型，可作为听力精听辅助。
- “反义词选择”几乎不对应 CET4 真题。
- “单句词义选择”应改造成选词填空、仔细阅读词义题、翻译表达。

### 5.4 重建实现

| 类型 | 最低量 |
|---|---:|
| 完整模拟卷 | 50 套 |
| 写作题 | 400 个 |
| 短篇新闻听力 | 300 组 |
| 长对话听力 | 300 组 |
| 听力篇章 | 300 组 |
| 选词填空 | 350 篇 |
| 长篇阅读匹配 | 300 篇 |
| 仔细阅读文章 | 700 篇 |
| 汉译英段落 | 400 段 |

选词填空必须存 `bank_words`、`blank_positions`、`answer_by_blank`、`pos_tags`、`distractor_reason`，否则很容易出现答案键错位。

## 6. lv4 CET-6

### 6.1 真实考试特点

官方 CET6 与 CET4 板块相同，但听力材料类型不同：长对话 8 题、听力篇章 7 题、讲话/报道/讲座 10 题；阅读仍是选词填空、长篇阅读、仔细阅读；写作和翻译占比不变。CET6 的语篇更学术、更抽象，推断和态度题更重。

### 6.2 应该练的题型

| 模块 | 必做题型 | 与 CET4 的差别 |
|---|---|---|
| 写作 | 议论文、图表、社会/教育/科技议题 | 论证深度更高 |
| 长对话 | 学术/工作/社会议题 | 细节密度更高 |
| 听力篇章 | 说明/议论短文 | 推断更重 |
| 讲座/报道 | lecture/report/talk MCQ | CET6 特色重点 |
| 选词填空 | 抽象主题 15 选 10 | 词汇和句法更难 |
| 长篇阅读 | 段落匹配 | 同义转述跨度更大 |
| 仔细阅读 | 学术/评论类文章 | 态度、论证、推理 |
| 段落翻译 | 更复杂的中国文化/社会/科技主题 | 长句组织能力 |

### 6.3 不建议作为主线的题型

- CET6 不应该和 CET4 共用同一批阅读材料后只改等级。
- 不能用普通“阅读理解 1 篇 1 题”代替仔细阅读、长篇匹配和选词填空。
- “近义词/反义词”只能作为词汇基础，不代表 CET6 真题。

### 6.4 重建实现

| 类型 | 最低量 |
|---|---:|
| 完整模拟卷 | 50 套 |
| 写作题 | 450 个 |
| 长对话听力 | 350 组 |
| 听力篇章 | 350 组 |
| 讲座/报道听力 | 350 组 |
| 选词填空 | 400 篇 |
| 长篇阅读匹配 | 350 篇 |
| 仔细阅读文章 | 800 篇 |
| 汉译英段落 | 450 段 |

质量验收重点：

- 选词填空每个空必须只有一个最佳答案。
- 长篇匹配必须有足够强的同义改写，不能句子原文复制。
- 仔细阅读干扰项要有“局部正确但整体错误”的真实迷惑性。

## 7. lv5 考研

### 7.1 真实考试特点

考研英语是笔试，没有听力、没有口语。必须拆成英语一和英语二两个分支，不能只做一个“考研”等级。

英语一常见结构：

- 英语知识运用：完形 20 题。
- 阅读理解 A：4 篇文章，每篇 5 题。
- 阅读理解 B：新题型 5 题，常见段落填空、排序、小标题/匹配。
- 翻译：英译汉，英语一通常为文中划线句翻译。
- 写作：小作文 + 大作文。

英语二结构相近，但翻译通常是短文段落英译汉，写作大作文更偏图表/图画/数据说明，分值结构与英语一不同。

### 7.2 应该练的题型

| 模块 | 必做题型 | 训练目的 |
|---|---|---|
| 完形 | 约 240-350 词 20 空四选一 | 逻辑、搭配、语篇连贯 |
| 阅读 A | 4 篇高密度议论文/说明文，5 题/篇 | 考研最大分值区 |
| 阅读 B | 七选五、排序、小标题/匹配 | 篇章结构和逻辑 |
| 翻译 英一 | 划线长难句英译汉 | 句法拆解、准确表达 |
| 翻译 英二 | 短文段落英译汉 | 语篇理解、中文表达 |
| 小作文 | 书信、通知、告示、纪要等 | 应用文格式和语体 |
| 大作文 | 英一图画/议论文，英二图表/说明议论 | 论证结构和表达 |

### 7.3 不建议作为主线的题型

- 听力、发音评分、口语场景都不应该出现在考研主线。
- 词汇题不能做成四六级式单项词汇选择；考研词汇主要在阅读、完形、翻译里考。
- 如果不拆英语一/英语二，题库诊断会误导用户。

### 7.4 重建实现

| 类型 | 英语一最低量 | 英语二最低量 |
|---|---:|---:|
| 完整模拟卷 | 40 套 | 40 套 |
| 完形文章 | 300 篇 | 300 篇 |
| 阅读 A 文章 | 800 篇 | 700 篇 |
| 阅读 B 新题型 | 300 篇 | 250 篇 |
| 翻译题 | 400 组划线句 | 350 段 |
| 小作文题 | 300 个 | 300 个 |
| 大作文题 | 300 个 | 300 个 |

考研题库还需要长难句训练，但它应该挂在阅读/翻译证据链下：

- 句子结构标注。
- 主干/从句/插入语拆解。
- 翻译评分点。
- 对应原文题目证据。

## 8. lv6 TOEFL

### 8.1 真实考试特点

ETS 官方 2026 TOEFL iBT 结构已经是四技能新任务体系：Reading、Listening、Writing、Speaking。官方列出的任务包括 Reading 的 Complete the Words、Read in Daily Life、Read an Academic Passage；Listening 的 Listen and Choose a Response、Conversation、Announcement、Academic Talk；Writing 的 Build a Sentence、Write an Email、Write for an Academic Discussion；Speaking 的 Listen and Repeat、Take an Interview。官方也说明 2026 后采用 1-6 分量表，并在过渡期提供 0-120 对照。

### 8.2 应该练的题型

| 模块 | 必做题型 | 训练目的 |
|---|---|---|
| Reading | Complete the Words | 拼写/词形/语境识别，不是普通背词 |
| Reading | Read in Daily Life | 实用文本阅读，如邮件、公告、说明 |
| Reading | Academic Passage | 学术语篇主旨、细节、推断、结构 |
| Listening | Choose a Response | 听懂短互动并选择自然回应 |
| Listening | Conversation | 校园/生活对话理解 |
| Listening | Announcement | 公告信息提取 |
| Listening | Academic Talk | 学术讲座听力 |
| Writing | Build a Sentence | 句法组织 |
| Writing | Write an Email | 实用写作 |
| Writing | Academic Discussion | 观点表达与回应 |
| Speaking | Listen and Repeat | 语音、节奏、准确复述 |
| Speaking | Take an Interview | 即时口语回答 |

### 8.3 不建议作为主线的题型

- 旧 TOEFL 的“长篇阅读 + 传统综合口语/综合写作”不能再当唯一主线。
- “词汇同义替换”只是一小部分，不能代表 TOEFL。
- TOEFL 必须有口语和写作评分，否则不完整。

### 8.4 重建实现

| 类型 | 最低量 |
|---|---:|
| 完整模拟体验 | 30 套 |
| Reading Complete the Words | 2,000 题 |
| Read in Daily Life | 500 组 |
| Academic Passage | 500 篇 |
| Listening Choose Response | 800 题 |
| Conversation | 400 组 |
| Announcement | 300 组 |
| Academic Talk | 400 组 |
| Build a Sentence | 1,000 题 |
| Email Writing | 300 题 |
| Academic Discussion Writing | 300 题 |
| Listen and Repeat | 1,000 句 |
| Interview Speaking | 500 题 |

TOEFL 需要单独建设音频资产：

- 音频文本、语速、口音、时长、停顿点。
- 口语评分：发音、流利度、完整性、语法词汇、任务完成。
- 写作评分：任务回应、组织、语言准确性、发展充分度。

## 9. lv7 SAT

### 9.1 真实考试特点

Digital SAT 的英语部分是 Reading and Writing，不考听力、不考口语、不考作文。College Board 官方说明：RW 部分 64 分钟，54 题，分成两个 32 分钟模块；题目是 25-150 词短文本或双文本，每题一个选择题；四大内容域是 Information and Ideas、Craft and Structure、Expression of Ideas、Standard English Conventions。考试是模块自适应。

### 9.2 应该练的题型

| 官方域 | 需要实现的题型 | 训练目的 |
|---|---|---|
| Information and Ideas | central ideas/details | 抓主旨和关键细节 |
| Information and Ideas | command of evidence textual | 找证据支持结论 |
| Information and Ideas | command of evidence quantitative | 读图表/数据并配文本 |
| Information and Ideas | inference | 合理推断 |
| Craft and Structure | words in context | 语境词义，不是孤立同义词 |
| Craft and Structure | text structure and purpose | 作者目的、结构功能 |
| Craft and Structure | cross-text connections | 双文本观点关系 |
| Expression of Ideas | transitions | 逻辑连接词 |
| Expression of Ideas | rhetorical synthesis | 根据笔记合成句子 |
| Standard English Conventions | boundaries | 句界、标点、run-on |
| Standard English Conventions | form/structure/sense | 动词、代词、修饰、平行、主谓一致 |

### 9.3 不建议作为主线的题型

- SAT 不应该做长篇阅读理解。现在是真短文本一题一问。
- SAT 不应该有听力、拼写、英译中、中译英、反义词选择。
- “同义替换”要改成 `words in context`，选项必须在语境中都可能有词典义，但只有一个符合上下文。

### 9.4 重建实现

| 类型 | 最低量 |
|---|---:|
| 完整 RW 自适应模拟 | 40 套 |
| Information and Ideas | 3,000 题 |
| Craft and Structure | 2,500 题 |
| Expression of Ideas | 1,800 题 |
| Standard English Conventions | 2,500 题 |
| 图表/数据题 | 600 题 |
| 双文本题 | 600 题 |

SAT 必须实现模块逻辑：

- Module 1：easy/medium/hard 混合。
- Module 2：根据 Module 1 表现进入 easier 或 harder module。
- 题目按官方域分组，域内难度递增。
- 诊断不能只给总分，要给四大域能力画像。

## 10. 现有截图题型的去留建议

| 现有题型方向 | 处理建议 | 原因 |
|---|---|---|
| 英译中/中译英/看释义选词 | 保留为基础层 | 适合背词，不适合作为考试题库主体 |
| 近义词/同义替换 | 只保留 SAT words in context、阅读同义转述 | 孤立近义词题不贴近多数真实考试 |
| 反义词 | 基础层低频保留 | 真实考试很少直接考 |
| 易混辨析 | 保留并接入语境题 | 对中考/高考/CET/考研都有帮助 |
| 搭配 | 保留，但用于完形/选词填空/写作评分 | 孤立搭配不如语篇搭配 |
| 看中文拼写/单句完形拼 | 基础层保留 | 初中和 TOEFL Complete the Words 可用 |
| 词形变化 | 初中/高考语法填空主线，其他等级辅助 | 不能全等级通用 |
| 语法填空 | 高考主线，初中地区适配 | CET/考研/SAT 不应泛用 |
| 听音选义/听写 | 基础层/精听层 | CET/高考/TOEFL 要改成真实听力任务 |
| 阅读理解 | 必须拆 subtype | 不同考试阅读不是一种题 |
| 完形填空 | lv1/lv2/lv5 主线 | CET 是 banked cloze，不同 |
| 七选五 | lv2/lv5 英一部分主线 | 不应全等级通用 |
| 选词填空 | CET 主线 | 与普通完形不同 |
| 段落匹配 | CET 长篇阅读、考研新题型 | 不应泛化 |
| 发音评分/AI 口语 | TOEFL 主线，初中/高中地区适配，CET optional | SAT/考研不要 |
| 用词造句/AI 批改 | 写作基础层 | 要接入真实写作 rubric |

## 11. 题库生成与验收流程

### 11.1 生成流程

1. 建 `ExamSpec`：每个等级/考试一份官方结构。
2. 建 `TaskTemplate`：每种题型一套模板、评分规则、字段约束。
3. 生成或人工编写材料：先语篇/音频/写作情境，再生成题目。
4. 答案键校验：所有多空题、匹配题、排序题必须自动校验一遍结构，再 AI/人工语义复核。
5. 难度校准：先按规则估难度，再用用户作答数据校准。
6. 上线状态：`draft -> reviewed -> active`，不能直接进 active。

### 11.2 自动门禁

每次入库必须过这些检查：

- 题目必须有 `exam/section/task_type/subskill`。
- 题型必须存在于该等级的 `ExamSpec`。
- 多选项题必须只有一个最佳答案，且干扰项有理由。
- banked cloze/七选五/段落匹配必须检查答案键数量、重复、错位。
- 阅读题必须有证据句或证据段。
- 写作/口语/翻译必须有 rubric。
- 音频题必须有 transcript、duration、speed/accent metadata。
- SAT 题干文本必须是短文本，不能混入长篇阅读。
- 考研等级不能出现听力/口语。
- TOEFL 等级不能缺 speaking/writing。

## 12. 重做优先级

### 第一阶段：先做“考试骨架”

必须先完成：

1. `ExamSpec` 表。
2. 每档 task_type 白名单。
3. 前端练习入口按真实考试板块重排。
4. 套卷生成器按 `ExamSpec` 出题。
5. 基础词汇题从主线降为“基础训练”。

### 第二阶段：先补最影响真实度的题型

优先级最高：

1. TOEFL 2026 四技能新任务。
2. SAT Digital RW 四域短文本题。
3. 高考应用文 + 读后续写。
4. 考研英语一/英语二拆分。
5. CET4/6 听力与翻译。

### 第三阶段：补数据质量与自适应

1. 按真实分值权重给诊断。
2. 用户错题归因到 subskill，而不是只归到单词。
3. 套卷和专项共用同一题库，不再维护两套来源。
4. 所有题目进入 `reviewed` 前至少一次 AI 复核 + 抽样人工复核。

## 13. 最关键的产品形态建议

新的练习页不要继续只按“识记、拼写、听力、阅读”这种学习动作分组，而应该同时支持“单词宇宙入口”和“考试入口”。其中单词宇宙要放在更醒目的位置，因为这是项目的主要卖点。

```text
入口 A：单词宇宙
  选择词 / 词群 / 星系
    记忆这个词
    看关系网络
    在真实考试题型中练这个词
    加入今日复习
    输出使用

入口 B：等级备考
  选择等级 -> 选择考试/卷别 -> 选择板块 -> 选择专项或套卷

lv7 SAT
  Reading & Writing
    Information and Ideas
    Craft and Structure
    Expression of Ideas
    Standard English Conventions
    Full Adaptive RW Practice

lv5 考研
  英语一
    完形
    阅读 A
    阅读 B 新题型
    翻译
    小作文
    大作文
    全真模拟
  英语二
    ...
```

这样用户看到的是两条很清楚的路径：

- “我要背这个词”：从单词宇宙进入，系统把它带到识记、语境、真实题型和输出。
- “我要考这个等级”：从等级备考进入，系统按真实考试板块训练。

两条路径背后必须是同一个题库，否则会再次出现词汇库、练习题、套卷数据互相割裂的问题。

## 14. 最终判断

如果 Ocean English 要真正服务七档考试，题库不能只做词汇题的扩展版。正确方向是：

- 初中：地区适配的综合语言能力。
- 高中：新高考听读写与读后续写。
- CET4：写作、新闻/对话/篇章听力、三类阅读、汉译英。
- CET6：更高难度的 CET4 结构，特别是讲座/报道听力和深层阅读。
- 考研：英语一/英语二拆分，无听力口语，重阅读、翻译、写作。
- TOEFL：2026 四技能新任务，必须有口语写作评分。
- SAT：Digital SAT RW 四大域短文本题和自适应模块。

现有词汇题型可以继续存在，但它们应成为“备考前置能力训练”，不应再定义七档题库本身。
