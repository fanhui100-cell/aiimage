# 八档统一 + ECDICT 词库完善 — 设计方案（2026-06-26）

> 目标：把项目的「等级/档位」体系从「硬编码 7 档 + IELTS 二等公民 + 多套副本」收口为**单一 8 档真源**，并用 **ECDICT(MIT) + 独立 SAT 表**按词形还原重打全库等级，修掉派生形错挂；同步调整 onboarding/今日/词库/宇宙/词图/阅读/报告所有界面。
> 本文件是**设计稿**，落地前需 owner 拍板第 6 节的决策。

---

## 1. 现状诊断（为什么乱）

**三套并存、互不对齐的等级模型，全部硬编码 7 档：**
1. `lib/levels.ts` `LEVELS`(7 条) — 名义真源，但被复制了 ≥5 份。
2. `lib/exam-specs`：`ExamId`(7 字面量) + `ExamLevel=1..7`（**编译期封死**），`normalizeExamId` **排除 ielts/gre**。
3. `store/lexiStore` `Profile.{level,band,targetExam}` + 另一套 `BAND_CEFR(1-8)` + `EXAM_BANDS`(唯一含 IELTS 的表) —— 与 1 的 `LEVEL_CEFR(1-7)` 冲突。

**重复副本（改一处必漏其余）**：`lib/levels.ts` / `OnboardingScreen`(LEVELS+WORD_BANK+BAND_N+VERIFY) / `report.ts`(LEVEL_NAMES+VOCAB_FLOOR+LEVEL_TOTALS) / `DictionaryVaultScreen`(LEVEL_NAMES) / `lexiverse catalog.js`(belt 7) / `ReferenceLexiverseFrame`(belt 数组×2) / `LexiGraphFrame`(BELTS 7) / `ReadingScreen`(LV 7) 各自硬编码。

**IELTS = 二等公民**：UI 第 8 张卡(`kind:'theme', band:null`)，但 `lib/levels.ts`/`exam-specs`/宇宙等级带/词图/阅读/报告全排除它；只在 `dictionary ExamTag` + 宇宙「考试前沿」星座以横切标签存在。**SAT = 第 7 档一等公民**(全链路有)。

**两个结构性坑**：
- `levelToBand = min(level+1, 8)`：level 8 → band 9，越界 `BAND_CEFR(1..8)`。
- 词库等级来自 **KyleBing 七档词表**（派生形覆盖不全）→ 派生形(quickly/cultural)只在超大托福表里 → 错挂 `primary_level=6/TOEFL`（详见 `reports/ui-issues-fixes-2026-06-26.md` ⑤b）。

---

## 2. 规范模型（统一真源）

### 2.1 单一 8 档配置 = `lib/levels.ts`（唯一真源）
`LEVELS` 扩为 8 条，所有界面/脚本一律 import 它，**删除全部重复副本**：

| level | key | zh | examTag | CEFR | 词库源 |
|---|---|---|---|---|---|
| 1 | zhongkao | 初中 | (null) | A2 | ECDICT `zk` |
| 2 | gaokao | 高中 | GAOKAO | B1 | ECDICT `gk` |
| 3 | cet4 | 四级 | CET-4 | B1 | ECDICT `cet4` |
| 4 | cet6 | 六级 | CET-6 | B2 | ECDICT `cet6` |
| 5 | kaoyan | 考研 | KAOYAN | B2 | ECDICT `ky` |
| 6 | toefl | 托福 | TOEFL | C1 | ECDICT `toefl` |
| 7 | sat | SAT | SAT | C1 | 独立 SAT 表 |
| 8 | ielts | 雅思 | IELTS | B2-C1 | ECDICT `ielts` |

每条新增字段：`cefrRank`(用于难度敏感逻辑，见 2.3)、`source`/`license`（ECDICT=MIT / SAT 表来源）。

### 2.2 合并 level / band 为单一维度（建议）
退役 `band = level+1` 偏移与 `BAND_CEFR`，统一用 `level`(1-8) 单维。`profile.band` 保留为只读派生(=level)以兼容存量，最终移除。**需 lexiStore persist v5→v6 迁移**（旧 level 1-7 不变；旧「targetExam=IELTS 的某 1-7 档」用户迁移为 level=8）。

### 2.3 关键设计：level-id ≠ 难度（用 CEFR 表难度）
IELTS 的 CEFR 是 **B2-C1**，与六级/考研/托福重叠，**并不比 SAT 难**。所以「level 8」只是**目录档号**，不是难度排名。凡是「难度敏感」的逻辑（词汇量累计基线、阅读难度、宇宙金色轨道顺序、定级升档梯度）一律改用 `cefrRank`（A2=1…C1=5），而非原始 level 数字。这样既满足「8 档统一 UI」，又不把 IELTS 谎报成「最难」。

> 「升档」机制只沿**基础梯**(初中→高中→四级→六级)自动晋级；**考研/托福/SAT/雅思是用户「选定的目标档」**（按考试大纲选词），不靠 mastery 自动跨入。

### 2.4 查询口径硬规则（owner 复审 #1，必须贯彻）
**凡「按某档取词/统计/星系归属/推荐」一律用 `levels ∋ L`（大纲全量口径），绝不能用 `primary_level = L`。**
因为 `primary_level = min(levels)`：一个雅思词常同时是 CET/托福词，如 `levels=[4,6,8]` → `primary_level=4`。若按 `primary_level=8` 查 IELTS，会**漏掉绝大多数雅思词**。
- `primary_level` 仅用于「该词的单一主标签」展示（词库行标签、词图 chip）。
- 词库「按等级」(已是 `syllabus`=levels∋L)、推荐 `exactLevelScore`(已是 `levels.includes`)、宇宙星系归属/统计、报告分档计数 —— 全部走 `levels ∋ L`。落地时逐一核对每个消费点确认用的是 `levels∋L` 而非 `primary_level=L`。

---

## 3. 词库数据方案（ECDICT 重打全库等级）

### 3.1 源
- **ECDICT**(`skywind3000/ECDICT`, MIT, ~76 万词)：`tag` 列 `zk/gk/cet4/cet6/ky/toefl/ielts` → level 1/2/3/4/5/6/8；`exchange` 列(`0:`=词基)做**词形还原继承**；`frq`/`bnc` 做排序。
- **SAT**(level 7)：ECDICT 无 SAT 标签 → 用独立开源 SAT 表（沿用现有 KyleBing SAT，或 GitHub 开源表，需 license_note）。

### 3.2 重打逻辑（核心交付：新脚本 `retag-dictionary-levels`）
对 `dictionary_words` 每个词：
1. 在 ECDICT 查该词；查不到则用 `exchange` 的 `0:` 取**词基**再查（quickly→quick）。
2. `levels[]` = 命中的全部 tag 映射档（**含词基继承**：quickly 继承 quick 的 zk/gk → levels 含 1,2）。
3. `primary_level` = `min(levels)`（最早接触档；quickly→1，不再是 6）。
4. SAT/IELTS：SAT 表命中 → 并入 level 7；ECDICT ielts → level 8。
5. `tags`(examTags) 按 levels 派生。
6. **保留人工 override**：带 `curated`/`manual` 标记的词不被覆盖（白名单）。

默认 **dry-run**：打印「会改多少词、quickly/cultural 等前后对比、各档计数」，自检（levels 非空、primary_level∈levels、override 未动）通过后再 `--apply`。

### 3.3 ECDICT IELTS 标签偏宽 → 必出三张审计表（owner 复审 #5）
ECDICT 的 `ielts` tag 偏宽，**不能只看 tag 就把词当 IELTS 核心词**。retag 脚本 dry-run 必须输出三类审计表供人工把关后再 apply：
1. **ielts-only**：`levels=[8]`（仅雅思、无更低档）的词 —— 重点排查是否有**常见词被误标成雅思专属**（类比 quickly 被误标托福）。
2. **ielts + lower-level**：`levels` 同时含 8 与更低档（如 [4,6,8]）—— 合理的大纲重叠词。
3. **primary_level changes**：重打前后 `primary_level` 变化的词清单 —— 防大面积漂移，逐档 diff。
若 ielts-only 里出现大量常见词，需收紧映射（如要求 ECDICT 同时无 zk/gk/cet4 才计 IELTS 专属，或叠加频率阈值）。

### 3.4 SAT 词表 license 先定（owner 复审 #6，阻塞前置）
SAT(level 7) 用独立表，**license 必须先确认才导入**：默认沿用仓库现有 KyleBing SAT(4460)，落 `source_name='KyleBing/english-vocabulary'` + `license_note`（确认其 license 条款）。**未确认 license 前不导入任何新 SAT 表。**

### 3.5 校验
`audit-vocabulary-levels.ts` 扩 8 档；retag 前后 diff 报告（三表）；`smoke:active-serve`/`validate:qbank-v2` 回归。

---

## 4. 各界面调整

### 4.1 Onboarding（`OnboardingScreen.tsx`）
- 删除组件内 `LEVELS/WORD_BANK/BAND_N/VERIFY` 副本 → import `lib/levels.ts`。
- `GOALS`：IELTS 从 `kind:'theme', band:null` 改 `kind:'band', level:8`，成为可直选、可作目标、进成长路径的一等档；保留 casual。
- 测评 `estLevel`/clamp `1..7` → 基于 `LEVELS.length`(=8)；定级边界判断 `L<7` → `L<MAX`。
- 成长路径 `BAND_GAL` 7 站 → 8 站（含雅思），**按 cefrRank 排序**而非 level 号（雅思落在六级/托福附近，不在末端最难处）。
- L8 探测词改从 ECDICT `tag=ielts` 抽，不再手填。

### 4.2 今日（`TodayBento` + `today-paths` + `buildTodayPack`）
- `LEVEL_NAMES` 索引 8 = 雅思（修当前「满级占位」死值）→ IELTS 用户 `goalDir/examName` 正确显示雅思方向。
- `WOD`(每日一词) 3 段桶 → 改从词库按档动态取（或扩 8 档桶）。
- `buildTodayPack` 透传 level 1-8；`/api/dictionary/recommend` 的 `parseLevel` 上限 7→8（否则 level 8 被丢成 null）。
- 重打等级后 `levelDef(8).wordCount` 才显示真实雅思词量（否则回退四级数）。

### 4.3 词库（`DictionaryVaultScreen`）
- `LEVEL_NAMES` 改从 `LEVELS` 派生（保留 0 空哨兵，1-based）；按等级 chips/计数 `[1..7]`→`[1..8]`（随数据自动扩）。
- `/api/dictionary/search` `syllabus`/`numericLevel` 上限 7→8；`supabase-dictionary-client` 两处 `±1 .filter(x<=7)`→`<=8`。
- 行标签去重：雅思档词的 CEFR(B2-C1) 与档名「雅思」并存时避免「雅思·C1·IELTS」重复。

### 4.4 宇宙（`catalog.js` + `ReferenceLexiverseFrame`）
- `catalog.js`：`ielts` 从 `exam-frontier` 迁入 `level-belt`，给 `pathOrder`(**按 cefrRank 插序**，建议在 toefl 附近而非 sat 之后) + `dataFile:'data/words-ielts.js'` + 真实 `wordCount`；更新顶部注释/文案「seven→eight galaxies」。
- 新增 `data/words-ielts.js`，并（若全库重打）**按重打后的 DB 重生 8 个 `words-*.js`**。**按 §2.4 口径：每个 `words-{档}.js` = `levels ∋ 该档` 的词（大纲全量、星系间可重叠），而非 `primary_level=该档`** —— 否则 IELTS 星系只剩 ielts-only 稀疏词、漏掉绝大多数雅思词。星系 `wordCount` 随之是「大纲重叠计数」（跨星系求和 > 唯一词数，属预期）。`galaxyForWord` 用于 `?word=` 聚焦仍取 min-level 星系即可（词在该星系也在场）；但「该词所属星系/星系统计」按 `levels∋L` 计。
- `ReferenceLexiverseFrame` 两处 belt 数组 + clamp 7→8 → **抽成由 `lib/levels.ts` 派生的单一 level→galaxyId 映射**，消除重复。
- 对齐 `catalog.wordCount` 与 `lib/levels.ts wordCount` 口径。

### 4.5 词图（`LexiGraphFrame` / `LexiGraphScreen`）
- `BELTS` 加 `{slug:'ielts',label:'雅思'}` + `words-ielts-full.js`；`beltForLevel` 上限 7→8。
- `LV_ZH` 加 `8:'雅思'`（纯展示，跟随 `dict.primaryLevel`，重打后自动正确）。

### 4.6 阅读（`ReadingScreen` + `app/api/reading`）
- `LV`/chips `[1..7]`→`[1..8]`（从 `LEVELS` 派生）；雅思阅读篇 `reading_passages.level=8`/`theme_tags lv8`。
- 难度公式改用 `cefrRank` 而非 `level*11`（顺带修 ⑤ 阅读难度问题的根）。

### 4.7 报告（`ReportScreen` + `report.ts`）
- `VOCAB_FLOOR/LEVEL_NAMES/LEVEL_TOTALS` 改从 `LEVELS` 单源派生；`estimateVocab/levelProgress` clamp/迭代 `1..8`。
- 词汇量累计基线按 **cefrRank** 单调，避免「雅思插 SAT 后」破坏累计假设。

---

## 5. 题库 / exam-specs 边界（分期）

- **本期**：IELTS 成为一等**学习档**（词库/推荐/词典/宇宙/词图/阅读/报告/onboarding）。`exam-specs` 加 `ielts`(ExamId+ExamLevel 8+别名+DISPLAY_NAMES+ScoringScale '1-9')，解除 `normalizeExamId` 阻断 —— 但**不立即做 IELTS 整卷题库**。
- **加 IELTS 到 exam-specs 后必须门控（owner 复审 #2，硬要求）**：给 IELTS 的 exam-spec 标 `status:'coming_soon'`（或 `'draft'`）。`/drill`(ExamTaskPicker) 与 `/papers`(paper-generator) **必须据此过滤/置灰 IELTS 入口、显示「建设中」，绝不能渲染空卷、更不能回退到别的题型/别的考试的题**。paper-generator 对 `coming_soon` 考试直接返回 `{paper:null, warnings:['exam_coming_soon']}`；ExamTaskPicker 显示 soon 态禁用。
- **后期**：IELTS 整卷题库（exam-spec 四板块 L/R/W/S + 原创题 + 听力/口语音频）与 TOEFL 阻塞同属内容大工程，单独排期。`theme_tags lv8` 暂不要求有题。
- GRE/专四专八：维持「考试前沿」横切标签，**不**纳入 8 档（除非 owner 另定）。

---

## 6. 迁移与风险

- **TS 破坏性**：`ExamLevel=1..7`→`1..8` 是编译期 breaking，所有 `Record<ExamLevel,…>` 字面量(level-map/specs)必须补 8，否则 tsc 报错（也是好事：强制全覆盖）。
- **DB 约束迁移（owner 复审 #4，必须列入任务）**：现有 SQL 多处 `CHECK (level BETWEEN 1 AND 7)`（旧 schema、`preferences`、`grammar_points`、可能还有 `dictionary_words`/`reading_passages` 等）会**拒绝 level=8 写入**。须全仓 grep `BETWEEN 1 AND 7` / `<= 7` / `level.*7` 的 SQL 约束，改为 `... AND 8`，写成迁移 SQL（与 persist v6 同批）。不补 DB 约束 → 雅思档写库直接被拒。
- **「高 level=更难」全扫（owner 复审 #3，专项任务）**：§2.3 定了用 `cefrRank` 表难度，但实施时必须**逐一扫**所有「拿 level 数值当难度」的点：排序、颜色映射、报告词汇量基线/进度、推荐打分、阅读难度公式、宇宙金色轨道顺序、onboarding 升档梯度。建一个 grep 清单(`level *11`/`level >`/`sort.*level`/`level.*color` 等)逐处确认改用 cefrRank，不漏。
- **persist 迁移 v5→v6**：`profile.level/band` 语义变；旧 IELTS 用户(level 1-7+targetExam=IELTS)→ level 8。需写迁移函数 + 测试。
- **静态资产双轨**：`catalog.js`/`words-*.js` 是 public 原型资产，不在 TS build 链，重打须同步重生，否则宇宙与 DB 不一致。
- **ECDICT ielts 偏宽**：可能把通用词打成 L8；需 curated 把关（与 README「勿盲目扩量」一致）。
- **多 tag 归档**：统一「`levels`=union、`primary_level`=min」，并出重打前后 diff 防大面积漂移。

### 落地顺序（建议）
0. **前置**：确认 SAT 表 license(§3.4)；全仓 grep 出「level-as-difficulty」清单(§6 复审#3) 与 `CHECK level BETWEEN 1 AND 7` 的 SQL 约束清单(复审#4)。
1. `lib/levels.ts` 扩 8 档（含 cefrRank）+ 消除 6 处副本（纯前端/类型，先绿 tsc/build）。
2. `exam-specs` 扩 8 档 + IELTS `status:'coming_soon'` 门控(drill/papers) + recommend/search 上限 7→8 + **DB 约束迁移 SQL(1..7→1..8)**。
3. ECDICT 重打脚本（dry-run → **审三表**(§3.3) → apply），按 `levels∋L` 口径。
4. 各界面 import 单源 + 8 档 + **难度逻辑改 cefrRank**（onboarding/today/dict/report/reading），逐处核对 §2.4 用 `levels∋L`。
5. 宇宙/词图静态资产按 `levels∋L` 重生 + IELTS 入带。
6. persist v6 迁移 + 全门回归（tsc/eslint/build/smokes/validate）。

---

## 7. 决策（已锁定 2026-06-26）

1. **IELTS 定位**：✅ **A** — level-id=8 作目录档号；难度一律用 CEFR(B2-C1) 表达，按 `cefrRank` 在托福附近排序，**不**谎报为最难。
2. **level/band**：✅ **A** — 合并为单一 `level` 1-8，退役 `band=level+1` 偏移与 `BAND_CEFR`；需 lexiStore persist **v5→v6 迁移**。
3. **ECDICT 重打方式**：✅ **A** — 以 ECDICT 为权威「受控全量重算」`levels/primary_level/tags` + 词形还原继承 + 保留人工 override 白名单（豁免 vocabulary-targets README 的 add-only 硬规则，需在脚本注释/报告写明豁免依据）。
4. **IELTS 题库范围**：✅ **A** — 本期只做**学习档**（词库/推荐/词典/宇宙/词图/阅读/报告/onboarding）+ exam-specs 解阻断；**IELTS 整卷题库(题+音频)留后期**，与 TOEFL 阻塞同列。
5. **SAT 表来源**：默认沿用现有 KyleBing SAT(4460 词，已在仓库 `.vocab-cache`)，license_note 标 KyleBing/MIT；如后续要换指定开源表再议。
