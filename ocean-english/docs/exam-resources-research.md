# 英语等级公开资源调研 — 词库 / 题库 / 真题 / 例句 / 题型

> 范围：为 Ocean English（词渊·Lexiverse）七等级体系（初中 / 高中-GAOKAO / 四级-CET4 / 六级-CET6 / 考研-KAOYAN / 托福-TOEFL / SAT，外加 IELTS 主题星系）调研网上**公开可获取**的等级化资源。
> 方法：2026-06-14 全网检索 + 逐源核验许可证与数据结构（GitHub API / 官方页 / 学术页）。
> 配套：本文是 [lexiverse-roadmap.md](./lexiverse-roadmap.md) §3/§5/§12 的资料补充层，结论已按其「合规红线」过滤。

---

## 0. 一页结论：三个法律桶

所有资源按能否**进产品/分发**分三桶。**这是最重要的一张表**——决定每个源是「拿来用」「只参考」还是「只外链」。

| 桶 | 含义 | 本调研归入此桶的源 |
|---|---|---|
| 🟢 **可商用·可分发** | 许可证明确允许商用 + 二次分发 | ECDICT(MIT)、Tatoeba(CC-BY)、Open English WordNet(CC-BY)、Maximax67 CEFR(MIT)、CEFR-J/Octanove(CC-BY-SA)、AWL 学术词表(教育自由用)、JavaProgrammerLB/cet-word-list(MIT)、google-10000-english、wordfreq、官方考纲 PDF 里的**纯词形清单**(事实不受版权) |
| 🟡 **只参考·不分发** | 内容是版权书/爬来的/NC 协议；可看结构、对难度、做映射信号，但**不能把内容塞进产品库再发布** | DictionaryData(仓库 Apache 但内容是新东方/人教/朗文版权书)、NETEMVocabulary(CC BY-**NC**-SA)、KyleBing(无证)、mahavivo(无证)、kajweb/dict(爬有道) |
| 🔴 **只外链·禁入库** | 第三方版权内容 / 平台条款禁止抓取再分发 | RACE / CLOTH / DREAM(均「non-commercial research only」且禁止 derived data 商用)、ETS TOEFL 官方真题样卷、剑桥/British Council IELTS 真题、College Board/Khan SAT 题库、各家历年真题卷 |

> **贯穿全篇的红线（与项目既有策略一致）**：题目/文章/译文/例句/助记若出自版权书或第三方平台 → 不入库。**纯英文单词清单**（"哪些词属于 CET4"）属事实性列表，风险低，可作**分级信号**；但其**译文/例句/记忆法**是版权内容，按对应词典源（ECDICT/WordNet/Tatoeba）另取。真题一律重定义为**"真题题型"**，用原创/AI 生成内容填充。

---

## 1. 词库 / 词表（按七等级 + 通用）

### 1.1 综合多书词库（覆盖全部七级，最高 ROI 的**分级信号**源）

| 源 | 许可 | 桶 | 含什么 | 怎么用 |
|---|---|---|---|---|
| **LinXueyuanStdio/DictionaryData** ⭐ | 仓库 Apache-2.0；**内容版权书** | 🟡 | `book.csv`(400+ 词书目录，含小学/高中-人教版课标/四级/六级/考研/托福/雅思/GRE/专四专八/BEC/GMAT/新概念/朗文 Communication 3000)＋`word.csv`＋`word_translation.csv`＋`relation_book_word.zip`(书→词映射)。关系型结构干净。 | **补 ECDICT 缺的分级标签**——尤其 **SAT / 中考(初中) / 高中(人教课标3500) / 雅思**（ECDICT 七级并集仅 1 万词且无 SAT）。**只取"某词属于某级"这一布尔信号**与现有 KyleBing/ECDICT 词形做 join；译文用 ECDICT，不搬它的译文/书内容。 |
| KyleBing/english-vocabulary | 无证（已在用） | 🟡 | 四六级/考研/SAT，txt+json（词条+多释义+词组+例句） | 现状底库。建议核心字段逐步切 ECDICT(MIT) 以洗清许可。 |
| mahavivo/english-wordlists（2.4k★） | 无证 | 🟡 | 中考/高考/CET4+6（整理自 2016 四六级大纲）/考研/专四专八/GRE/TOEFL/IELTS，带音标释义 | 词表交叉校验参考；勿直接分发其释义。 |

### 1.2 官方考纲（权威名单，PDF 公开；纯词形可用）

| 等级 | 权威来源 | 说明 |
|---|---|---|
| 初中 | 义务教育英语课程标准词汇表（约 1600 词） | 课标附录，公开。 |
| 高中(GAOKAO) | 普通高中英语课程标准 **3500 词**（2017 版 2020 修订，含义教 1500） | 项目 levels.ts 高中档 6008 词偏大，可用 3500 课标校准"必背核心"。开源镜像：Jimmy-xuzimo/gaokao-vocab（实收 3817）。 |
| CET-4 / CET-6 | **全国大学英语四、六级考试大纲（2016 修订版）** PDF（cet.neea.edu.cn 官方） | 官方无释义词表，权威名单。开源整理：**JavaProgrammerLB/cet-word-list (MIT)**、liut969/CET（近五年真题高频）。 |
| 考研(KAOYAN) | 全国硕士研究生招生考试英语（一）大纲词汇 **5530 词** | 名单公开。频率见 1.4。 |
| TOEFL / SAT / IELTS | 无官方"考纲词表"（非大纲制考试） | 用语料频率 + CEFR + AWL 合成（见 1.3/1.4），名单参考 1.1/1.5。 |

### 1.3 CEFR 分级映射（直接喂 levels.ts 的 `LEVEL_CEFR`，对齐国际三考）

| 源 | 许可 | 含什么 | 怎么用 |
|---|---|---|---|
| **Maximax67/Words-CEFR-Dataset** ⭐ | **MIT** | 每个英文单词的 CEFR(A1–C2) + 词元/词干/词性 + n-gram 频率（基于 CEFR-J） | 🟢 干净商用。给全库词打 CEFR，校准 `LEVEL_CEFR`（现为手工 1→A2…7→C1）与升档窗口；为 TOEFL/SAT/IELTS 这类无大纲考试提供"难度锚"。 |
| openlanguageprofiles/olp-en-cefrj | Octanove C1/C2 部分 **CC-BY-SA 4.0**；CEFR-J 部分循 CEFR-J 条款 | CEFR-J 词汇/语法 profile + Octanove C1C2 词表 | CEFR 词表本体。商用走 Octanove(CC-BY-SA) 或上面的 MIT 衍生版更稳。 |

### 1.4 真实词频（修 levels.ts "假星等"，决定先学哪个词）

| 源 | 许可 | 桶 | 用途 |
|---|---|---|---|
| **ECDICT** `frq`(COCA)/`bnc`（已在路线图） | MIT | 🟢 | 主力真频，定 stars 分位、选词高频优先。 |
| rspeer/wordfreq | MIT/数据 CC-BY-SA | 🟢 | 多源融合频率，交叉校验。 |
| first20hours/google-10000-english | MIT | 🟢 | 高频兜底、最常用词起步表。 |
| hermitdave/FrequencyWords | CC-BY-SA | 🟢 | OpenSubtitles 频率（口语向）。 |
| **exam-data/NETEMVocabulary** | **CC BY-NC-SA** | 🟡 | **考研专项词频**（5530 词，按约 200 套四六级/考研/专四专八试卷文本统计排序）。**NC 不可商用分发**——只作"考研档选词顺序"的**离线参考**校准，不入库。 |

### 1.5 单考种专用词表（多为 🟡/参考）

- **SAT**：lrojas94/SAT-Words（freevocabulary.com 抓取，JSON）、sunh423/SAT-Vocabulary-Study-Tool（6000 词）、KokeCacao/Barron3500 — 均无清晰商用证，作名单参考。SAT 官方不发词表，正路 = 频率+CEFR(C1/C2)+学术词合成。
- **IELTS / 学术**：**AWL（Academic Word List, Coxhead 570 词族）** ⭐——wgtn.ac.nz / eapfoundation 公开，**教育用途自由**，学界标准；适合 IELTS/托福/SAT 学术星系的"学术核心层"。镜像：lzrk/nglsh IELTS-4000、fanhongtao/IELTS。还有 AVL/AKL（lpmi-13/machine_readable_wordlists）。
- **GitHub Topics 聚合**：`toefl-words` / `cet4-words` / `c-level-english` 下大量等级词表，多无证，作参考。

---

## 2. 题库 / 真题 / 例题（题型 ≠ 真题卷）

> **核心认知**：项目代码已写死「禁用盗版真题卷，只做真题**题型**」。下列学术数据集虽是"真考题"，但许可证全部**禁止商用/禁止分发衍生**，故只能作**题型与 JSON schema 的设计参照**，不能把题面/文章入库。真正入库的题由富化词典 + AI **原创生成**。

### 2.1 学术考题数据集（🔴 只参考结构，不入库）

| 数据集 | 规模 | 来源 | 许可 | 对本项目的价值 |
|---|---|---|---|---|
| **RACE**（CMU） | 28k 篇 / 100k 题 | 中国**初中+高中**英语考试阅读理解 | non-commercial research only；禁 derived data 商用 | 阅读理解**四选一题型 + 难度分层（RACE-M 初中 / RACE-H 高中）**的黄金参照；JSON 字段(article/questions/options/answers)可照搬做**我们自己的** schema。 |
| **CLOTH**（CMU） | 7,131 篇 / 99,433 题 | 中国初高中考试**完形填空**（教师命题） | non-commercial research only | **完形填空题型 + 挖空策略**参照（考词汇/推理/语法的空怎么设）。喂我们 cloze 生成器的"出题逻辑"。 |
| DREAM | 10,197 题 / 6,444 对话 | EFL 考试**对话型**阅读 | research | 听力/对话理解题型参照（接 F3 文章 + TTS 生成听力题）。 |
| RACE-C / QuAIL | college / 15k 题 | 大学英语考试 / 多类型 | research | 进阶难度与"多推理类型"参照。 |

> 实操：把 RACE/CLOTH 当**题型说明书**——读 5–10 题理解"中高考阅读/完形长什么样、选项怎么设干扰"，然后让 AI 按这套**格式**对**我们富化词典里的词/Tatoeba 例句/F3 自有文章**原创出题。绝不复制其文章。

### 2.2 官方练习/样题（🔴 只外链 + 对题型；权威但版权方所有）

| 考试 | 官方免费资源 | 用法 |
|---|---|---|
| TOEFL iBT | ETS 官方：Test Prep 页、**Sample Test**、TOEFL ITP Practice PDF、TOEFL Essentials Practice | 学习入口**外链**；研读官方题型做生成模板。禁抓题入库。 |
| IELTS | ielts.org「Sample test questions」、British Council「free practice tests」(听读写说全) | 同上，外链 + 题型参照。 |
| SAT | **College Board Question Bank + Bluebook**、**Khan Academy Digital SAT**（官方合作，免费） | 官方免费练习，**引导用户去官方平台**；研读自适应数字 SAT 的 R&W/Math 题型。 |
| CET 四六级 | **NEEA 官方考试大纲 PDF**（cet.neea.edu.cn）含题型说明与样题 | 大纲 = 公开权威，题型描述可直接用于生成器。 |

---

## 3. 例句 / 语料（🟢 可入库）

| 源 | 许可 | 用途 |
|---|---|---|
| **Tatoeba**（路线图已选） | CC-BY | 英中句对，补托福/SAT 高阶例句缺口（实测托福例句缺 9.8%）。署名即可入库。 |
| Open English WordNet | CC-BY | 释义 gloss + 同义/语义关系 → 近义辨析、同义替换题燃料。 |
| 2ndLA/english-phrases | CC-BY-SA | 短语搭配（补高阶短语缺口，SAT 缺 59%）。 |
| 财经/医学英中平行语料（JOHD、ParaMed/NEJM 等） | 各 CC | 领域例句备选，一般用不到。 |

> 例句优先 Tatoeba（许可干净）；KyleBing 的 json-sentence 例句因无证，逐步替换。

---

## 4. 发音 / 音频（做听力题/跟读）

| 源 | 许可 | 结论 |
|---|---|---|
| 浏览器 `speechSynthesis` TTS（路线图已用） | — | 🟢 **首选**：单词/句子/短文即时朗读，听力题**零音频资产**即可上线。 |
| Wiktionary / Wikimedia Commons 单词音频 | CC-BY-SA / 公有 | 🟢 真人发音，可下载，需署名。 |
| Forvo | **CC BY-NC-SA** | 🟡 **NC**，不可商用，跳过。 |

---

## 5. 各考试题型/结构（事实性，可直接用于"真题题型"生成器）

> 结构是事实、不受版权保护——这是项目「真题题型」策略的合法落点。下列为命题模板。

- **CET-4 / CET-6**（2016 改革后四大块）：写作 15% · 听力 35% · 阅读 35% · 翻译 15%（段落汉译英）。阅读含选词填空 / 长篇匹配 / 仔细阅读。**现版已无完形**。四六级仅听力题型不同。
- **考研英语（一/二）**：完形填空 10 分(20×0.5) · 阅读 Part A 40 分(4 篇×5×2) · 新题型 Part B 10 分 · 翻译 Part C（英语一 10 分长难句 / 英语二 15 分段落）· 写作（小作文 10 + 大作文，英语一 20 / 英语二 15）。英一英二主要差在翻译与作文难度/分值。
- **TOEFL iBT**：Reading / Listening / Speaking / Writing 四项，各 0–30，总分 0–120。阅读多篇学术文章 + 多题型（事实/推理/词汇/插句/小结）。
- **SAT（数字版 2024+）**：Reading & Writing + Math 两大模块，**模块自适应**，总分 400–1600。R&W 短文＋单题，含词汇语境、循证、文法。
- **IELTS**：Listening / Reading / Writing / Speaking，Band 0–9；分 Academic 与 General Training（阅读/写作不同）。
- **初中/高中（中高考）**：单选(语法词汇) · 完形填空 · 阅读理解(四选一，见 RACE/CLOTH 题型) · 七选五 · 语法填空 · 短文改错 · 书面表达。

---

## 6. 给 Ocean English 的落地建议（接 roadmap 阶段）

| 资源 | 桶 | 接入动作 | roadmap 阶段 |
|---|---|---|---|
| **DictionaryData 书→词映射** | 🟡 | 离线提取"词→等级布尔信号"，补 ECDICT 缺的 **SAT/初中/高中课标/雅思** 标签；只取成员关系，不搬内容 | P1 词库富化 |
| **Maximax67 CEFR (MIT)** | 🟢 | 全库打 CEFR；校准 `lib/levels.ts` 的 `LEVEL_CEFR` 与升档窗口 | P1 |
| **ECDICT frq + wordfreq** | 🟢 | 真词频定 stars/选词顺序（修 51–61% 假星等） | P1 |
| **AWL 570 词族** | 🟢 | 标"学术核心"，强化托福/SAT/IELTS 学术层与目标星系 | P1–P2 |
| **NETEM 考研词频** | 🟡 | 仅离线参考，校准考研档选词顺序，不入库 | P1（参考） |
| **Tatoeba / WordNet / 2ndLA** | 🟢 | 补例句/同义辨析/短语（已在路线图） | P1–P2 |
| **RACE / CLOTH / DREAM** | 🔴 | 读样题→定义我方阅读/完形/听力题型 schema + 干扰项策略，AI 原创出题 | P2–P3 |
| **官方样题（ETS/BC/CollegeBoard/NEEA）** | 🔴 | 外链 + 研读题型做生成模板；考纲 PDF 取权威词表/题型描述 | P2–P3 |
| **speechSynthesis / Wiktionary 音频** | 🟢 | 听力题与跟读音源 | P2–P4 |

### 待拍板（补充 roadmap §13）
1. **SAT/初中/高中/雅思分级标签**：用 DictionaryData 的成员信号（🟡 只取布尔，译文走 ECDICT）还是另找 🟢 源？
2. **CEFR 映射**：切到 Maximax67(MIT) 数据，替换 levels.ts 手工 `LEVEL_CEFR`？
3. **考研词频**：NETEM(NC) 仅离线参考，还是统一回 ECDICT frq 保持全库一证？
4. **题型 schema**：是否照 RACE/CLOTH 字段（article/questions/options/answers/分难度）设计我方 `question_bank` 的阅读/完形/听力新类型？

---

## 附：源清单（含许可证核验）

**🟢 可商用可分发**
- ECDICT — https://github.com/skywind3000/ECDICT （MIT）
- Tatoeba — https://tatoeba.org/en/downloads （CC-BY）
- Open English WordNet — https://github.com/globalwordnet/english-wordnet （CC-BY）
- Maximax67/Words-CEFR-Dataset — https://github.com/Maximax67/Words-CEFR-Dataset （MIT）✅API 核验
- CEFR-J / Octanove — https://github.com/openlanguageprofiles/olp-en-cefrj （Octanove CC-BY-SA）
- AWL（Coxhead 570）— https://www.wgtn.ac.nz/lals/resources/academicwordlist ; https://www.eapfoundation.com/vocab/academic/awllists/
- JavaProgrammerLB/cet-word-list — https://github.com/JavaProgrammerLB/cet-word-list （MIT，源自 2016 大纲）✅
- wordfreq — https://github.com/rspeer/wordfreq ; first20hours/google-10000-english ; hermitdave/FrequencyWords
- 官方考纲 PDF：CET 大纲 https://cet.neea.edu.cn ；高中课标 3500；考研大纲 5530（纯词形清单）

**🟡 只参考不分发**
- LinXueyuanStdio/DictionaryData — https://github.com/LinXueyuanStdio/DictionaryData （仓库 Apache-2.0，**内容为新东方/人教/朗文版权书**）✅API 核验
- exam-data/NETEMVocabulary — https://github.com/exam-data/NETEMVocabulary （**CC BY-NC-SA**）✅API 核验（NOASSERTION=BY-NC-SA 4.0）
- KyleBing/english-vocabulary（无证，已在用）; mahavivo/english-wordlists（无证，2.4k★）
- SAT：lrojas94/SAT-Words ; sunh423/SAT-Vocabulary-Study-Tool ; KokeCacao/Barron3500
- IELTS：lzrk/nglsh ; fanhongtao/IELTS

**🔴 只外链禁入库**
- RACE — https://www.cs.cmu.edu/~glai1/data/race/ （non-commercial research only，禁 derived 商用）✅核验
- CLOTH — https://www.cs.cmu.edu/~glai1/data/cloth/ （同上）✅核验
- DREAM — https://dataset.org/dream/ ; RACE-C ; QuAIL
- TOEFL：https://www.ets.org/toefl/test-takers/ibt/prepare.html
- IELTS：https://ielts.org/take-a-test/preparation-resources/sample-test-questions ; https://takeielts.britishcouncil.org
- SAT：https://satsuite.collegeboard.org/practice ; https://www.khanacademy.org/digital-sat
- Forvo 音频（CC BY-NC-SA，NC）
