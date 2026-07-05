# Lexiverse 优化 · 分阶段实施方案

> **配套分析**：[lexiverse-roadmap.md](./lexiverse-roadmap.md)（闭环/词库/题库）、[exam-resources-research.md](./exam-resources-research.md)（等级资源）、记忆 `lexiverse-learning-loop`（实测库 + 真 gap）。
> **目标**：把"已建但没接通的存量"接进 UI → 补"社交驱动"维度 → 补"内容深度"，让引导式闭环 + 单一功能（只练考试/阅读/某档单词）都完善。
> **更新**：2026-06-15　状态：**实施方案，待逐阶段执行**。

---

## 0. 协作约定（重要 — 决定怎么交接）

每个任务标注归属。**前端/页面一律先定"数据契约"，再交 Claude Design 按契约做 UI，做完回来我按契约植入。**

| 标记 | 含义 | 谁做 |
|---|---|---|
| 🔧 **后端/数据/逻辑** | API、Supabase、store、脚本、算法 | 我（Claude Code） |
| 🎨 **前端/页面** | 新页面、组件、改版、视觉/交互 | **你 → Claude Design** |
| 🔌 **植入/联调** | 把 Design 产物接上数据契约、装进路由、连 store | 我（Design 回来后） |
| ✅ **验收** | 怎么验证这步真的成了 | — |

> **数据契约 = 前后端之间的合同**：我在 🔧 里定好 API 返回结构 / 组件 props 的 TypeScript 接口；Claude Design 拿这个接口做 UI（用 mock 数据填充即可）；我拿回来后把真实数据按同一接口喂进去。**契约不变，前后端可并行。**

---

## 1. 🎨 设计交付总清单（给 Claude Design 的总账）

下面是**全部需要 Design 的页面/组件**，按阶段分。你可以一次性或分批交付。每项的详细规格 + 数据契约在对应阶段任务里。

| # | 阶段 | 页面/组件 | 类型 | 路由 |
|---|---|---|---|---|
| D1 | P1 | **阅读板块改版**（列表 + 文章+理解题视图 + 分档筛选） | 改版 | `/reading` |
| D2 | P1 | **学习报告页**（记忆矩阵 + 遗忘曲线 + 词汇量估算 + 维度雷达） | 新增 | `/report`（新） |
| D3 | P1 | **定级结果页·词汇量反馈卡**（onboarding 结果页增段） | 改段 | onboarding 结果步 |
| D4 | P1 | **按档刷词入口卡**（首页/词库选档 → 纯单档学习会话） | 新增组件 | `/learn?level=N` 复用 |
| D5 | P2 | **排行榜页**（周榜/总榜/连击榜 + 我的名次） | 新增 | `/leaderboard`（新） |
| D6 | P2 | **学习小组**（小组列表 + 小组详情 + 打卡墙） | 新增 | `/groups`（新，多页） |
| D7 | P3 | **单词卡配图槽**（词详情 + 闪卡 + 题目加图位） | 改组件 | 多处 |
| D8 | P3 | **AI 口语对话页**（场景选择 + 语音对话 + 反馈卡） | 新增 | `/speaking`（新） |
| D9 | P3 | **词根串记视图**（一个词根 → 一串词的学习页） | 新增 | `/roots`（新） |

> 设计统一沿用现有 `theme-light` 体系与现有组件风格（见 `components/screens/SharedUI`、各 `*.css`）。每个新页面需含：加载态、空态、错误态。

---

## 2. Phase 0 — 修破链（纯 🔧，无需 Design，先做）

> 三处已确诊的 bug/退化，纯后端，1-2 天，立刻让"今日练考试""高频选词"恢复正常。

### Task 0.1：今日「应试」path 取题改走 level（弃坏掉的 exam_tags 依赖）

**背景**：`exam_tags` 全库仅 ~700/140k 有值（GAOKAO/IELTS=0），但题目都有 `theme_tags: lvN`。`/exam` 走 level 正常，今日 path 的 quiz `exam-practice` 走 exam_tags → 命中近 0。

**Files:**
- Modify: `components/quiz/LexiverseQuizClient.tsx:196-197`

- [ ] **Step 1**：把 exam-practice 的取题从 exam_tags 改为 level（与 ExamScreen 一致）。

```ts
// before (L196-197):
if (mode === 'exam-practice') p.set('exam', examTag)
if (!wordParam && mode !== 'exam-practice' && profileLevel) p.set('level', String(profileLevel))

// after — exam-practice 也按 level 取题（examTag→level 映射），不再依赖空的 exam_tags：
const EXAM_TO_LEVEL: Record<string, number> = { '初中':1,'高中':2,'GAOKAO':2,'CET-4':3,'CET4':3,'CET-6':4,'CET6':4,'考研':5,'KAOYAN':5,'TOEFL':6,'SAT':7 }
if (!wordParam && profileLevel) p.set('level', String(profileLevel))
if (mode === 'exam-practice') {
  const lv = EXAM_TO_LEVEL[examTag] ?? profileLevel
  if (lv) p.set('level', String(lv))
  p.set('types', 'en_to_zh,synonym_choice,cloze_choice,confusable_choice,zh_to_word_spell,cloze_spell,reading_comprehension')
}
```

- [ ] **Step 2**：客户端兜底过滤同样别再依赖 examTags（`LexiverseQuizClient.tsx:654`）。

```ts
// before: src = usable.filter(w => (w.examTags ?? []).includes(examTag as never))
// after: 按 level 过滤（examTags 不可靠）
const lv = EXAM_TO_LEVEL[examTag] ?? profileLevel
src = lv ? usable.filter(w => (w.levels?.includes(lv)) || (w.band === lv)) : usable
```

- [ ] **Step 3 ✅**：`/today` 选"应试备考"→"今日题型练习"，确认能取到 ≥10 题（之前为空）。手测：DevTools Network 看 `/api/questions?...&level=` 返回 data.length>0。

- [ ] **Step 4**：commit `fix(quiz): exam-practice 按 level 取题，弃空 exam_tags 依赖`

### Task 0.2：recommend 选词真正"先学高频"

**背景**：[collectRecommendedWords](../lib/dictionary/recommendation.ts#L92-L111) 收够 limit 即停在首页，只在首~200词内按 freq 排。`frequency_rank` 现 100% 填充，应让 DB 直接按频率出。

**Files:**
- Modify: `lib/dictionary/dictionary-client.ts`（searchWords/supabase adapter 加排序）
- Modify: `lib/dictionary/recommendation.ts`（信任 DB 顺序，仍做 level/exam 加权）

- [x] **Step 1**：`WordSearchOptions` 增 `primaryLevel?` + `orderBy?:'frequency'`；Supabase adapter：`orderBy==='frequency'` → `.order('frequency_rank', asc, nullsLast)`；`primaryLevel` → `.eq('primary_level', l)`（与 gen-questions 同口径，避免低档停用词污染）。
- [x] **Step 2**：`recommendation.ts`：level 已知 → `searchWords({primaryLevel:level, orderBy:'frequency'})`；仅 band → 维持原排序。收够即停 OK（首页已是本档高频）。
- [x] **Step 3**：加功能词过滤 `isStudyWord`（剔除 art/prep/conj/pron 等 POS），新词不推停用词。**单档刷词（1.4）= 直接按所选 level 调同一路径，primary_level 天然单档，无需 strict 参数。**
- [x] **Step 4 ✅**：实测 `primary_level=eq.3&order=frequency_rank.asc` 返回 issue/community/economic/source…（本档高频实义词）；level 1 过滤后留 be/have/do/say，剔除 the/of/a/in/it。tsc 0 错。
- [ ] **Step 5**：commit（待用户确认）`fix(recommend): primary_level 高频选词 + 功能词过滤`

### Task 0.3：修 learning-modules 路由指向

**Files:** Modify `config/learning-modules.ts`

- [ ] **Step 1**：`voice-sonar.route` `'/study'`→`'/pronunciation'`；`reading-canopy.route` `'/study'`→`'/reading'`。其余 `/universe/*` universeRoute 若无对应路由，暂保留但不依赖。
- [ ] **Step 2 ✅**：模块卡点击进入正确页面。
- [ ] **Step 3**：commit `fix(modules): 阅读/发音模块指向真实路由`

---

## 3. Phase 1 — 接通存量 + 可视化（高 ROI）

### Task 1.1 / D1：阅读板块接 DB（让"只练阅读"成立）

**背景**：`/reading` 只读静态 5 篇（缺 L1/L5/L7），DB 里 240 阅读理解题 + 108 听力短文没被用，读完无理解检验。

#### 🔧 后端（✅ 已完成，2026-06-15）
**实际做法（免迁移、立即可用）**：不建新表，直接读 `question_bank`（`type='reading_comprehension'`，全 active，660 题 / 7 档各约 90，约 220 篇），按 `normalized_word`（= 篇 id）聚合成「篇」，`audio_ref` = 短文正文。
- [x] Create: `app/api/reading/route.ts` — `?level=N` 列表 / `?id=<篇 id>` 单篇+题；keyWords = 短文实词 ∩ `dictionary_words`；选项去字母前缀。
- [x] **实测通过**：`?level=3` → 31 篇；`?id=…` → title/正文/47 keyWords/3 题（选项+answer）。`tsc` 0 错。
- [ ] **（后续可选升级，非阻塞）** 建 `reading_passages` 表（title/title_zh/passage_zh/key_words）+ 改 `gen-reading.ts` 落表（它现在**丢弃了生成的标题与中文翻译**）+ 批量补 L1/L5/L7 篇数 → 届时 `/api/reading` 优先读表、回退 question_bank，契约不变只填更好的值。

**🔧 数据契约（已实现并实测 ✅，D1 按此做 UI）：**
```ts
// GET /api/reading?level=3  → { ok:true, data: ReadingListItem[] }
interface ReadingListItem {
  id: string            // 篇 id（= question_bank.normalized_word）
  title: string         // 暂用短文首句派生（reading_passages 升级后换真标题）
  level: number; minutes: number
  questionCount: number // 该篇理解题数（实测每篇 3 题）
  newRate?: number      // 生词率 0-100：前端用 store 词状态自行算（后端不返回）
}
// GET /api/reading?id=<篇 id> → { ok:true, data: ReadingDetail } | { ok:false, data:null }
interface ReadingDetail {
  id: string; title: string; level: number; minutes: number
  paragraphs: string[]          // 正文按段（多数为 1 段）
  keyWords: string[]            // 文中实词 ∩ 词典（slug，点击查词；实测每篇约 40-50 个）
  questions: ReadingQuestion[]
}
interface ReadingQuestion {
  id: string; prompt: string; promptZh?: string  // promptZh 多为「阅读短文，回答下面的问题」
  choices: { id: string; text: string }[]        // id ∈ a|b|c|d，text 已去掉字母前缀
  answer: string                                  // 'a'|'b'|'c'|'d'，对应某 choices.id
  explanationZh?: string
}
```
> ⚠️ 与初版契约的差异（D1 据此调整）：**去掉 `titleZh` 与列表的 `keyWordCount`**（现数据未存中文标题）；`title` 为首句派生；`answer/choices.id` 用宽松 `string`（值仍是 a-d）。这些在 reading_passages 升级后只会变更好，不破坏 UI。

#### 🎨 前端（D1 — 交 Claude Design）
**改版 `/reading`，三个视图：**
1. **列表视图**：顶部**分档筛选**（初中/高中/四级/六级/考研/托福/SAT/全部 chips）；文章卡显示 `title`（英文，首句派生）/时长 `minutes`/右侧大号生词率 `newRate%`/「`questionCount` 题」。**暂无中文标题**（titleZh 待后端升级再加）。沿用现有卡片风格（参考 [ReadingScreen.tsx](../components/screens/ReadingScreen.tsx) 现有列表）。
2. **阅读视图**：正文（段落），文中 `keyWords` 高亮可点→词浮层（**复用现有 WordPopup 交互**，加入学习）。底部「读完，做理解题 →」。
3. **理解题视图**：2-4 道选择题，答完出对错 + 解析 + 「本篇掌握度」小结，回流错题。
- **状态**：加载/空（该档暂无文章）/错误。
- **数据**：按上面 `ReadingListItem` / `ReadingDetail` / `ReadingQuestion` 契约（Design 用 mock 填充）。

#### 🔌 植入（Design 回来后我做）
- [ ] 把组件接 `/api/reading`；查词浮层接现有 `/api/dictionary/word/[slug]` + `ensureWord(...,'reading')`；理解题答对/错接 `markCorrect/markWrong/addWrongAnswer`；读完 + 答题 → `markActivityDone('reading')` 让今日"精读"path 真实完成（不再点击即完成）。
- [ ] ✅ 选"考研"档能看到文章（补档后），读完能做题，错题进错题本，今日精读卡真实点亮。

### Task 1.2：Tatoeba 真句接入（"真实语境"低成本版）

**背景**：例句目前 AI/合成；Tatoeba（CC-BY 可商用，见 exam-resources 调研）是真句。纯 🔧，**无需 Design**（仅在词卡例句旁加个"真实语境"小标，可选）。

**Files:** Modify `scripts/enrich-tatoeba.ts`（已存在）、`scripts/enrich-supabase.ts`；落 `dictionary_examples`。

- [ ] **Step 1**：跑 enrich-tatoeba 扩量，给高阶档（托福/SAT/考研，例句缺口最大）补真句，`source='tatoeba'` 标注。
- [ ] **Step 2**：词卡/题目例句优先取 `source='tatoeba'`。
- [ ] **Step 3 ✅**：托福档例句缺失率（现 9.8%）下降；抽查例句为真实句。
- [ ] （可选 🎨）词卡例句加「真实语境 · Tatoeba」小标——若要，归入 D7 一起做。

### Task 1.3 / D2 + D3：学习报告（记忆矩阵 + 词汇量估算）

**背景**：SRS 数据已在 store，但无记忆矩阵/遗忘曲线/词汇量反馈（对标墨墨/扇贝）。

#### 🔧 后端/逻辑
**Files:**
- Create: `lib/analytics/report.ts`（纯函数：从 store 的 words/history/quizHistory 算指标）
- Modify: `lib/levels.ts`（导出词汇量估算函数）

- [ ] **Step 1**：`estimateVocab(level, masteredCount, probeResult)` → 估算词汇量数字（用档位词频跨度 × 掌握率）。
- [ ] **Step 2**：`buildReport(words, history)` → 返回**数据契约**：
```ts
interface LearnReport {
  vocabEstimate: number                 // 估算词汇量
  byState: Record<WordState, number>    // 各状态词数（locked..mastered）
  retention: { day:number; recalled:number; total:number }[]  // 遗忘曲线点
  matrix: { word:string; ease:number; interval:number; due:number }[] // 记忆矩阵
  dims: { dim:'recognize'|'spell'|'listen'; rate:number }[]   // 跨维掌握率
  streak: number; xp: number; heatmap: Record<string, number> // 日期→活动数
}
```

#### 🎨 前端
- **D2 学习报告页 `/report`（新）**：① 顶部词汇量大数字 + 「较上周 +X」；② 记忆矩阵（按 ease/interval 散点或网格，对标墨墨记忆矩阵）；③ 遗忘曲线折线；④ 维度雷达（认/拼/听）；⑤ 活动热力图（可复用现有热力图组件）。状态：数据不足时的空态（新用户）。数据按 `LearnReport` 契约。
- **D3 定级结果页加段**：onboarding 最后一步结果卡里加「你的词汇量约 **X** 词 · 处于 **〔档〕**」+ 一句"达到〔目标考试〕还需约 Y 词"。改 [OnboardingScreen.tsx](../components/screens/OnboardingScreen.tsx) 结果步。

#### 🔌 植入
- [ ] `/report` 页接 `buildReport(useLexiStore...)`；导航加入口（"我的"或今日页）；结果页接 `estimateVocab`。
- [ ] ✅ 新用户看到合理空态；老用户看到真实矩阵/曲线/词汇量。

### Task 1.4 / D4：按档刷词独立入口（"只练某档单词"）

**背景**：无独立"选档→只刷该档新词"会话；只能靠 profile.level（且 ±1 渗透）。Task 0.2 已加 `strict` 参数。

#### 🔧 后端
- [ ] `/api/dictionary/recommend` 已按 `level` 走 primary_level 单档（P0 完成）；drill 仅需前端传所选 `level` 调用，**不写 profile**。

#### 🎨 前端（D4）
- **入口卡**（放词库/首页）：选档（7 档 chips）+「开始刷这档新词」。复用现有 `/learn` 闪卡流，但 URL 带 `?level=N&drill=1`，**不改用户定级 profile**（临时会话）。
- 会话结束小结："本档今日刷 N 词 / 累计掌握 M / 本档共 K"。

#### 🔌 植入
- [ ] `/learn` 读 `?level&drill`：drill 模式调 recommend `{level, strict:true, mode:'drill'}`，词入库 source 标 `drill`，**不动 profile.level**；小结数从该档统计算。
- [ ] ✅ 设定级是"高中"的用户，能单独刷"四级"一组词而不改自己的定级。

---

## 4. Phase 2 — 驱动（社交 + 算法）

> 子系统较独立，**执行前各自展开为独立 TDD 细案**。此处给目标 + 后端骨架 + 设计规格 + 数据契约。

### Task 2.1 / D5：排行榜（最易起量的社交）

#### 🔧 后端
**Files:** Create `supabase/sql/leaderboard.sql`（视图/物化视图）、`app/api/leaderboard/route.ts`
- [ ] 用户表已有 XP/streak（云同步）；建周榜（按本周 XP 增量）/总榜/连击榜视图。
- [ ] **数据契约**：
```ts
// GET /api/leaderboard?board=weekly|total|streak&scope=global|group
interface LeaderRow { rank:number; userId:string; name:string; avatar?:string; value:number; isMe:boolean }
interface LeaderboardResp { ok:true; board:string; rows:LeaderRow[]; me:LeaderRow|null }
```

#### 🎨 前端（D5）`/leaderboard`（新）
- 三 tab（周榜/总榜/连击）；前三名领奖台 + 列表；**我的名次卡置顶/吸底**；自己高亮。空态（无数据）。数据按 `LeaderboardResp`。

#### 🔌 植入
- [ ] 接 API；今日/我的页加入口；XP 写入时刷新榜。✅ 多账号看到排名变化。

### Task 2.2 / D6：学习小组 / 好友打卡

#### 🔧 后端
**Files:** Create `supabase/sql/groups.sql`（groups / group_members / checkins）、`app/api/groups/route.ts`、`app/api/groups/[id]/route.ts`
- [ ] 表：group(id,name,desc,owner,memberCount)、group_member(group_id,user_id,joined_at)、checkin(user_id,date,learned,group_id)。
- [ ] **数据契约**：
```ts
interface Group { id:string; name:string; desc:string; memberCount:number; joined:boolean }
interface GroupDetail extends Group { members:{ userId:string;name:string;streak:number;todayDone:boolean }[]; wall:{ userId:string;name:string;date:string;learned:number }[] }
```

#### 🎨 前端（D6，多页）`/groups`（列表）+ `/groups/[id]`（详情）
- 列表：我的小组 + 发现小组 + 「创建小组」。详情：成员打卡墙（今日谁打卡了/连续天）、小组排行、加入/退出。空态/未登录态。

#### 🔌 植入
- [ ] 接 API；打卡复用现有 streak/`recordActivity`；小组排行复用 2.1 的 `scope=group`。✅ 建组、加入、打卡墙更新。

### Task 2.3：SRS 升级 FSRS（纯 🔧，无 Design）

**背景**：现用朴素 SM2（[lib/srs/schedule.ts](../lib/srs/schedule.ts)）。FSRS 按词难度+用户记忆建模（对标墨墨），开源、可 drop-in。

**Files:** Modify `lib/srs/schedule.ts`、`store/lexiStore.ts`（WordEntry 加 `stability/difficulty` 字段 + migrate v6）
- [ ] **Step 1**：引入 FSRS 参数模型，`gradeSrs` 改输出 stability/difficulty/nextReviewAt；保留 `ReviewGrade` 四档接口不变（调用方零改）。
- [ ] **Step 2**：store migrate v5→v6：旧词从 interval/ease 估算初始 stability/difficulty。
- [ ] **Step 3**：`previewIntervals` 同步改。
- [ ] **Step 4 ✅**：复习一轮，nextReviewAt 间隔更贴合答题表现；回归测试 [scripts/backend-regression.test.ts](../scripts/backend-regression.test.ts) 通过。
- [ ] **Step 5**：commit `feat(srs): SM2 → FSRS 记忆模型`

---

## 5. Phase 3 — 内容深度（差异化）

> 每项执行前展开独立细案。此处给规格 + 契约 + 设计要求。

### Task 3.1 / D7：单词配图（对标百词斩视觉记忆）
- 🔧 `scripts/gen-word-images.ts`：AI 批量生成每词一图（先高频档），存 Supabase Storage，`dictionary_words.image_url`。数据契约：词卡数据加 `imageUrl?:string`。
- 🎨 D7：词详情/闪卡/题目加**配图槽**（有图显示，无图优雅降级为现状）。改 [WordDetailClient](../app/word/[slug]/WordDetailClient.tsx)、闪卡、ExamScreen 题卡。
- 🔌 接 image_url；懒加载 + 占位。✅ 高频词有图，无图不破版。

### Task 3.2 / D8：AI 口语对话（对标 ELSA AI）
- 🔧 `app/api/ai/conversation/route.ts`：场景化对话（复用现有 AI provider + chat-tutor prompt 扩展）；语音识别用现有 Web Speech（F4 已用，见 [lib/pronunciation](../lib/pronunciation)）；返回回合 + 发音/用词反馈。
- 🎨 D8 `/speaking`（新）：场景选择（点餐/面试/考试口语…）→ 语音对话气泡 + 录音按钮 + 实时反馈卡（发音分/用词建议）。状态：麦克风权限/识别失败。
- 🔌 接 API + Web Speech；接 F4 评分；✅ 完成一段场景对话拿到反馈。

### Task 3.3 / D9：词根串记（对标不背/百词斩词根）
- 🔧 用 ECDICT 词形 + WordNet + 现有 LexiGraph 词图，建"词根→词族"数据；`app/api/roots/route.ts`。
- 🎨 D9 `/roots`（新）：一个词根（如 -spect-）展开一串词 + 共享词义脉络，可整组加入学习。
- 🔌 接词图数据 + `ensureWord`。✅ 选词根能带学一串词。

### Task 3.4：补考研档 + 真题题型（纯 🔧）
- 🔧 跑 `enrich-*` 给考研档补富数据（现 dict 仅 239 词）；跑 `gen-questions/gen-reading/gen-listening --apply` 把考研档（lv5 题仅 2454）+ 真题题型（reading 240/listening 324/cloze 334）扩到与其它档同量级。
- ✅ 考研档 dict/题量与其它档接近；reading/listening/cloze 题型各上千。

### Task 3.5 / D-mini：PWA + Web Push
- 🔧 加 `manifest.json` + service worker（Next 配置）；Web Push 订阅表 + 发送（复用现有 [ReminderSetting](../components/me/ReminderSetting.tsx)）。
- 🎨 小改：安装引导 + 通知授权卡。
- 🔌 接订阅 + 定时推送。✅ 可安装、到点收到复习推送。

---

## 6. 依赖与执行顺序

```
P0（修破链，纯后端，先做）
  └─> P1（接通存量；D1/D2/D3/D4 可并行交 Design）
        ├─ 1.1 阅读接 DB ── 依赖 0.x 无
        ├─ 1.2 Tatoeba ── 独立
        ├─ 1.3 报告/词汇量 ── 独立
        └─ 1.4 单档刷词 ── 依赖 0.2 的 strict
  └─> P2（驱动；2.1→2.2 有序，2.3 独立）
  └─> P3（内容深度；各自独立，3.4 纯后端可随时插队）
```

- **可立刻并行交 Design 的**：D1、D2、D3、D4（P1 全部）。建议先交 **D1（阅读）** —— 它把"只练阅读"从最弱直接拉到可用，ROI 最高。
- **纯后端我可独立推进、不等 Design 的**：P0 全部、1.2 Tatoeba、2.3 FSRS、3.4 补考研档。

---

## 7. 自检（spec 覆盖）

- ✅ 引导学等级单词：0.2（高频）+1.4（单档）+1.3（词汇量反馈）。
- ✅ 只练考试：0.1（修今日 exam path）+ /exam 已完善 + 3.4（补考研/真题题型）。
- ✅ 只练阅读：1.1（接 DB + 理解题 + 分档 + 补档）。
- ✅ 只练某档单词：1.4。
- ✅ 对标缺口：真句 1.2、配图 3.1、社交 2.1/2.2、记忆算法 2.3、统计可视化 1.3、口语 3.2、词根 3.3、沉浸内容 1.1/3.4、移动触达 3.5。
- ⏳ 每个 P2/P3 子系统执行前再展开为含完整代码步骤的独立 TDD 细案。
</content>
