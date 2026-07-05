# Lexiverse 学习闭环 · 词库 · 题库 — 整体路线图

> 范围：ocean-english（词渊 / Lexiverse）。本文合并三轮分析：①学习闭环现状与缺口 ②七等级词库完善 ③题库/真题与练习模式体系 ④等级系统 / onboarding / 个性化 ⑤整体改动路线。
> 状态：**分析与设计稿，未改动代码**。待逐项拍板后再实施。
> 关联：LexiGraph 词图已 1:1 移植（任务A 完成），其「待接入」字段与数据接入**并入本路线** → 见 §11《LexiGraph 接入》。
> 更新：2026-06-14

---

## 0. 一句话主线
**词库富化 → 喂题库生成 → 统一练习引擎 → 学习方式(path) 把多模式编进每日闭环 → 跨维掌握驱动升档与星空镀金。**
这条线把「词库完善 + 题库真题 + 多题型 + 个性化 + 等级系统」全串起来。

---

## 1. 现状：核心闭环全景（先肯定）
主链已经闭合，且留存机制扎实：

```
定级(4步 onboarding) → 今日包(按 level+目标考试 选词)
  → 学习/速记 → 测验(真词典干扰项) → SRS 复习(SM2 遗忘曲线)
  → 错题本 → 星空点亮(lexiverse v3)
  → streak / XP / 补签(F1-3) / 学习提醒 / 周报 / 昨日回顾(F6)
```

关键实现位点：
- 定级：`components/screens/OnboardingScreen.tsx`（目标→方式→定级方式→测评/选档→结果）
- 等级：`lib/levels.ts`（7 档，已与七星系对齐）
- 中枢：`store/lexiStore.ts`（`buildTodayPack` 按 level+exam 调 `/api/dictionary/recommend`；`reviewGrade` 走 `lib/srs/schedule.ts` SM2；streak/XP/补签）
- 词典：Supabase（`dictionary_words` + definitions/examples/collocations/synonyms/antonyms/pronunciations/exam_word_tags…）

---

## 2. 闭环缺口（问题清单）

| # | 问题 | 证据 | 优先 |
|---|---|---|---|
| ⭐1 | **学习方式(path) 选了等于没选** | `OnboardingScreen.finish()` 不写 path；`Profile` 无 path 字段；`buildTodayPack` 不读 path | P0 |
| ⭐2 | **闭环偏"背单词"单线** | `getToday` 只产 recommended/review/weak 词 | P1 |
| 3 | **onboarding 不能返回上一步** | 只前进 + "跳过设置" | P0 |
| 4 | **练习全是选择/识别型** | quiz 4 模式 + `question_bank` 七型全为 `*_choice`；无打字/听力/拼写 | P1–P2 |
| 5 | **模块目录半成品** | `learning-modules.ts`：voice-sonar/reading-canopy 均 `route:'/study'` 占位；`universeRoute:'/universe/*'` 路由不存在 | P1 |
| 6 | **宇宙默认进站不个性化** | lexiverse v3 进站未按 level/目标 | P1 |

**功能在闭环中的使用情况**：

| 功能 | 能用 | 在每日闭环里 |
|---|---|---|
| 词典/推荐/今日/学习/测验/SRS/错题 | ✅ | ✅ 主链 |
| 阅读(F3) / 发音(F4) / 考试(F3) / 扫描 / 知识(F5) / AI领航(chat) | ✅ | ❌ 平行**侧路** |
| 星空 lexiverse v3 | ✅ | ✅ 动机/导航层 |

> 诊断：**功能很全，但闭环是"背单词单线"，其余板块是平行侧路；学习方式(path) 本该是把它们编进每日闭环的那根线，却没接上。**

---

## 3. 七等级词库完善方案

### 3.1 体检结论（reports/lexiverse-coverage 实测）
基础三项（中文/词性/音标）已基本完整（KyleBing 打底）。真正的坑：

| 指标 | 数字 | 含义 |
|---|---|---|
| **孤词率（无词族）** | 73%–92% | 卡片"派生放射图"对绝大多数词是空的 ← 最高 ROI |
| **假星等错配率** | 51%–61% | stars 是词长启发式，过半与真实词频差 ≥2 档 |
| **短语缺口** | 初中10% → 托福42% → SAT59% | 越高阶越缺 |
| **例句缺口** | 托福9.8% / SAT11.1% | 高阶星系缺例句 |
| **ECDICT 匹配率** | 99.6%–100% | 富化 join 几乎全命中，方案可行 |

### 3.2 数据源 → 字段（许可证全可商用，KyleBing 除外）

| 字段 | 来源 | 许可证 |
|---|---|---|
| 词频/stars | **ECDICT** `frq`(COCA)/`bnc` → 真频分位 | MIT |
| 词形变化 | **ECDICT** `exchange`（→ 修复孤词 + 词族）| MIT |
| 英美音标 | Wiktextract(kaikki) UK/US；ECDICT/KyleBing 兜底 | CC-BY-SA |
| 中文/词性 | ECDICT translation/pos（与 KyleBing 择优）| MIT |
| 例句(英中) | **Tatoeba** | CC-BY |
| 短语搭配 | **2ndLA/english-phrases**（英文，按词头匹配）| CC-BY-SA |
| 同义/语义关系/释义 | **Open English WordNet** | CC-BY |
| 易混 | 算法（编辑距离） | — |
| 近义辨析 | WordNet gloss 差异 + AI 生成、人工审 | 生成 |

⚠️ **ECDICT 不当名单**：七级 tag 并集仅 10,666 词，且**无 SAT tag**；只做"富化 join"，名单仍用 KyleBing（含 SAT）。
⚠️ **KyleBing 未声明许可证**（已在用）；**kajweb/dict 爬有道/新东方 → 不分发**。

### 3.3 落地：现成管线 + 两处 schema 缺口
- 现成脚本可扩：`scripts/import-vocabulary.ts`（已喂 KyleBing 七档含 SAT）、`generate-relations.ts`、`coverage-report.ts`、`final-p2-vocab-schema.sql`。
- 需新增：① **词形变化**（`dictionary_words.inflections jsonb` 或 `dictionary_word_forms` 表，源 ECDICT exchange）② **近义辨析**（小表或复用 `dictionary_scene_usages`，AI 生成+审核）。
- **两层数据**：静态 `data/words-*.js`(slim：word/stars/edges/families，场景用) + 富数据进 Supabase 词典（卡片经 `/api/dictionary/word/[slug]` 读，全 App 共享）。

---

## 4. 等级系统设计
`lib/levels.ts` 7 档已与七星系对齐（examTag/wordCount 一致）。讲成**双轴**：

- **能力档 level 1-7（你在哪）** → 起点星系 + 今日新词难度窗口
- **目标考试 targetExam（你要去哪）** → 目标星系金色路线 + exam 加权选词 + 复习舱真题题型

**对齐缺口**：onboarding Step1 目标格有 IELTS/休闲、缺 初中/高中/SAT，且 IELTS 是主题星系非等级带。→ 明确"目标=主题星系，能力=等级带"，结果页画出"四级 → 托福，跨 3 座星系"的成长路径。
**升级**：用富化真实词频排序（先学高频）；**升档阈值 = 本档跨维掌握率**（如 mastered ≥ 80%），不靠手动。

---

## 5. 题库 / 真题（合规）
- **题库**：从富化词典**自动生成**，按 7 档 `word.level` 分级、真频优先高频、`draft→人工审核→active`（沿用 `question_bank` / `QuestionBankItem`）。
- **真题**：项目代码已写死策略——`QuestionBankItem.sourceExam` 注释明确"**必须 LexiOcean 原创、禁用盗版真题卷**"。→ 重定义为 **「真题题型」**：CET 完形/选词填空/翻译、考研长难句、TOEFL 词汇+听力题 等**格式**，用原创/AI 内容生成。**绝不抓真题卷（版权红线）。**

---

## 6. 练习模式体系

### 6.1 四维 × 两向（体检"还缺什么"）
单词掌握 = **形·音·义·用**，每维分 **识别(认/选)** 与 **产出(敲/写/说)**：

| | 识别（认/选）| 产出（敲/写/说）|
|---|---|---|
| **义** | ✅ 释义MCQ、英→中MCQ | ❌ 中文→敲英文 |
| **音** | ❌ 听音→选词/选义 | ❌ 听音→敲单词(听写)；✅ 跟读评分(F4) |
| **用** | ✅ 例句填空(选)；❌ 易混辨析(选) | ❌ 例句填空(敲)；❌ 听短文→选择 |
| **形** | — | ❌ 拼写/词形派生填空 |

→ 缺口集中在 **产出型(打字/拼写)** + **听力型**。现产品只覆盖"认得"，没覆盖"写得出/听得懂"。

### 6.2 完整题型清单（数据/输入/维度）

| 题型 | 输入 | 维度 | 数据来源 | 现状 |
|---|---|---|---|---|
| 释义/英中 选义 | 选 | 义·认 | translation | ✅ |
| **中文→敲英文** | 打字 | 义→形·产出 | translation（容错+首字母/音标提示）| ❌ |
| **听音→选词/选义** | 听+选 | 音·认 | TTS / audio_url | ❌ |
| **听音→敲单词(听写)** | 听+打字 | 音+形·产出 | TTS / audio_url | ❌ |
| **听短文→选择题** | 听+选 | 听力理解 | F3 文章 + TTS + AI 生成题 | ❌ |
| 例句填空(选) | 选 | 用·认 | examples 挖空 | ✅ |
| **例句填空(敲)** | 打字 | 用·产出 | examples | ❌ |
| **易混词辨析** | 选 | 形/用 | 易混边(富化) | ❌ |
| **同义替换** | 选/敲 | 义/用 | synonyms + 例句 | ❌ |
| **词形/派生填空** | 打字 | 形 | 词形变化(ECDICT exchange) | ❌ |
| 跟读/口语评分 | 录音 | 说 | audio + Web Speech | ✅ F4 |
| 限时闯关/连击 | 包装层 | 全 | 任意题型外壳 | ❌ |

> 听力题**不需新音频资产**：浏览器 `speechSynthesis` 可读单词/句子/短文；单词级还可用 `audio_url`。

---

## 7. Onboarding 重构
1. **每步加「← 上一步」** + 点进度条回跳，保留已选（state 都在，零风险）。
2. **path 真正落地**：存进 profile 并驱动今日页（见 §8）。
3. **结果页"为你定制"摘要**：起点星系 + 目标星系 + 每日 X 词 + 路径 + 预计周期 → 「开始学习」。
4. 定级建议设为必经（保留跳过 = 默认档 + 提示可补测）。

---

## 8. 个性化（把用户的所有选择用起来）
- **path → 活动配比**：速记=认型快刷；全面=形音义用混合+听写；精读=例句敲+听短文；应试=真题题型+exam 过滤。
- **level + targetExam → 选词 + 目标星系**（已有选词，补目标星系金色路线）。
- **复习舱多维轮换**：同词不同轮换维度考（认→拼→听）；**mastered 跨维通过才镀金** → 星空金色才有含金量。
- **lexiverse 词卡自测**可选模式（听/拼/选）；宇宙默认按 level/目标进站。

---

## 9. 对标同类 · 差距

| 维度 | 同类 | 我们 | 建议 |
|---|---|---|---|
| 定级测试 | Duolingo 测试定级 | ✅ 二分+自评 | 加"词汇量估算"反馈 |
| 间隔复习 | 墨墨记忆矩阵 | ✅ SM2 | 够用 |
| **多练习模式** | 百词斩/扇贝/不背：听/拼/例句/拼图 | ❌ 仅 MCQ | **加打字+听力(见§6)** |
| 语境例句 | 不背单词：海量真人例句 | 机械 | 富化接 Tatoeba |
| 听写/跟读 | — | F4 发音评分 | 加 dictation/shadowing |
| 打卡/补签/streak | Duolingo streak+freeze | ✅ streak+XP+补签 | **强项** |
| 社交/排行榜 | 扇贝学习小组 | ❌ | 增长功能(P4) |
| 游戏化路径 | Duolingo 线性 path | **星空(差异化)** | 强化"今天去哪颗星"指引 |

---

## 10. 整体改动方案（架构分层）

| 层 | 改动 |
|---|---|
| **① 数据层** | 扩 `question_bank`：加 `input_mode('choice'\|'spell'\|'speak'\|'order')` + 新 type(`zh_to_word_spell`/`listen_to_word`/`dictation_spell`/`cloze_spell`/`confusable_choice`/`synonym_substitute`/`word_form`/`listening_comprehension`) + `audio_ref`；新 `listening_passages` 表。词库富化(§3) 提供燃料 + `inflections`/辨析 两张缺口表。 |
| **② 生成层** | 扩题库生成器：按 7 档逐词产多维题(draft)；听力题走 TTS；短文题挂 F3 文章。 |
| **③ 练习引擎层（最大）** | 现 quiz 全 MCQ。建**统一 `PracticeSession`**：选择 / **文本输入**(Levenshtein 容错+提示) / **音频播放** / 录音(复用 F4) / 短文。`QuizQuestion` 加 `inputMode+audio`。 |
| **④ 闭环/个性化层** | today pack 按 path 产"活动配比"；复习舱多维轮换；mastered 多维门槛。 |
| **⑤ 等级/宇宙层** | 题难度按 level；升档自适应；词卡自测选模式；宇宙默认按 level/目标进站。 |

---

## 11. 分阶段路线

| 阶段 | 内容 | 依赖 |
|---|---|---|
| **P0** | path 接线 + onboarding 返回键 + 目标↔七星系对齐 + 结果页定制摘要 | 无（纯前端，小改大收益）|
| **P1** | 词库富化(供数据) + 扩 question_bank schema + **统一 PracticeSession（先支持打字）** + 宇宙默认进站　·　**LexiGraph：词条卡接富化字段（词频排名/英美双音标/词形变化/例句）+ 关系充实让词网变密** | P0 + 富化 |
| **P2** | 新题型：**中→敲英 / 听音→敲 / 听音→选** + 例句填空(敲) + 易混辨析　·　**LexiGraph：同义辨析 NUANCE + 真题 EXAM 块接 question_bank** | P1 |
| **P3** | **听短文→选择(passage)** + 真题题型(应试) + 跨维 mastered + 升档自适应　·　（LexiGraph 金环/学会/错词已在任务A接通） | P2 |
| **P4** | 限时闯关/连击、社交/排行榜等增长功能　·　**LexiGraph：全量词表/星系 JSON（stars 真频）+ 发音接 API** | P3 |

### LexiGraph 接入（并入本路线）
LexiGraph 词图（任务A 已 1:1 移植，`public/lexigraph-reference/` + 桥）目前词条卡读 `WU_DATA` + 占位字段。其「待接入」全部 = Task B 数据的消费端，**不单独立项**，随对应阶段落地。

**接入机制（二选一）**：(a) 桥按词头 fetch `/api/dictionary/word/[slug]` 富化卡片（同 wu-bridge enrichDetail 模式，推荐）；(b) 重生成 `public/lexigraph/<list>.json` 带富字段。

| LexiGraph 待接入字段/功能 | 数据来源（Task B） | 阶段 |
|---|---|---|
| 词频排名 # | 真实词频(ECDICT frq 分位) | P1 |
| 英 / 美 双音标 | Wiktextract UK/US | P1 |
| 词形变化 FORMS | ECDICT exchange | P1 |
| 例句（缺时占位） | Tatoeba 英中句对 | P1 |
| 派生/形近 词网稀疏（孤词率 73–92%） | 富化关系(WordNet/exchange/编辑距离) | P1 |
| 同义辨析 NUANCE | WordNet + AI 生成 | P2 |
| 真题 EXAM 块 | question_bank 生成 | P2 |
| 全量词表/星系 JSON（非 cet4 单包） | 数据管线 §五 | P4 |
| 发音按钮 | pronunciation API（现 speechSynthesis 已可用） | P4 |

> **已在任务A 接通、无需 Task B**：宇宙→`/lexiverse`、词典→`/word/[slug]`、`?word=` 定位、真 SRS→节点金环、学会→入库 / 错词→写回 SRS、收藏/错词 ↔「我的星云」（同源 localStorage）。

---

## 12. 合规与许可证
- 可商用：ECDICT(MIT)、Tatoeba(CC-BY)、Open English WordNet(CC-BY)、2ndLA(CC-BY-SA)、Wiktextract(CC-BY-SA)、wordfreq/SUBTLEX(CC-BY-SA)。
- ⚠️ KyleBing 未声明许可证（已在用，建议确认或核心字段切 ECDICT）。
- ⚠️ kajweb/dict 爬有道/新东方 → 仅人工参考，不分发。
- ⚠️ 真题：禁用盗版真题卷，只做"真题题型"原创/AI 生成（代码已有此策略）。

---

## 13. 待拍板的决策点
1. 词表归属：KyleBing 现状只富化，还是并入 ECDICT/DictionaryData 扩量？
2. 富数据落 Supabase 词典（推荐，卡片已在读）还是塞回静态 JSON？
3. 例句源：Tatoeba（许可证干净）还是沿用 KyleBing json-sentence？
4. 近义辨析 / 题库的 AI 生成是否用项目现配 AI provider？
5. 实施顺序：先 P0（纯前端小改）还是先富化词库（供后续题库）？

---

## 附：参考资料
- 词库源：[ECDICT](https://github.com/skywind3000/ECDICT)、[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)、[2ndLA/english-phrases](https://github.com/2ndLA/english-phrases)、[Open English WordNet](https://github.com/globalwordnet/english-wordnet)、[Tatoeba](https://tatoeba.org/en/downloads)、[wordfreq](https://github.com/rspeer/wordfreq)
- 对标：[扇贝/百词斩/墨墨/不背对比](https://www.woshipm.com/evaluating/4425622.html)、[Duolingo onboarding](https://userguiding.com/blog/duolingo-onboarding-ux)、[Duolingo streak](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f)
- 体检报告：`reports/lexiverse-coverage.md`
