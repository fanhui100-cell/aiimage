# Handoff: PracticeRunner（/quiz 迁移 + 视觉高级化）

> Phase 5 · 把 `/quiz` 的数据层迁移到统一 Practice Session API，并把练习屏视觉升级到「高级版」。
> 本包内的 HTML 是**设计参照（design references）**，不是要直接拷进生产的代码 —— 请在目标代码库（Next.js + React 的 `ocean-english`）里，用其既有组件与设计令牌**重建**这些设计。

---

## 1. Overview

- **现状**：`/quiz` 是全站唯一测验入口，由 `components/quiz/LexiverseQuizClient.tsx` 自己出题（内含 `mapBankRow` / `EXAM_TO_LEVEL` / `DRILL_TYPE_MAP`，打 `/api/questions`）。视觉骨架在 `components/quiz/practice-session.css` 的 `.pr-v2`。
- **目标**：
  1. **数据层迁移** —— 新建可复用的 `PracticeRunner`，改为消费 Phase 4 的 `GET /api/practice/session`，每题作答 `POST /api/practice/attempts`；保留全部旧 URL 参数与退役题型屏蔽。`LexiverseQuizClient` 留作 legacy fallback，本阶段不删、不碰 `/drill`。
  2. **视觉高级化** —— 在不改 `.pr-v2` 设计语言（同一套 globals 令牌）的前提下，叠加一层 premium 观感（渐变发丝边卡片、流光进度条、选项光泽、底部抽屉等）。提供 drop-in overlay：`css/practice-session-premium.css`。

## 2. About the Design Files / Fidelity

**High-fidelity（hi-fi）**。颜色、字体、间距、交互均为最终值，请像素级重建，**复用代码库既有的 `.pr-v2` class、globals 令牌与字体**（已由 `next/font` 注入），不要引入新设计系统、不要新增颜色。

参照文件（见 `references/`）：
| 文件 | 用途 |
|---|---|
| `PracticeRunner Premium.html` | **主参照**：可交互 hi-fi 练习流（选择/拼写/听音 + 结算），桌面两栏 + 移动单栏响应式 |
| `PracticeRunner 走查.html` | 五状态 + 六 renderer + 「建设中」占位的静态走查（标注了复用 class） |
| `Practice 对比 · Mobile vs Desktop.html` | 桌面 1180 / 移动 390 并排对照（design canvas） |
| `Premium · 移动端.html` | iPhone 框内的移动端布局 |

> 注：主参照是**纯前端 mock**，自带 5 道示例题；真实数据来自 session API。combo/score 动画、即时反馈文案允许与现有 `LexiverseQuizClient` 略有差异（重实现），但 §6 列出的项必须 1:1。

## 3. 数据契约（必须对齐 —— Phase 4 已落地）

### `GET /api/practice/session`
Query：`mode`(word|task|section|paper)、`source`(v1|v2|auto)、`examId`、`sectionId`、`taskType`、`word`、`wordId`、`level`、`count`、`seed`。
预期空/未就绪 → **HTTP 200** `source:'empty'`；非法输入 → HTTP 400。

返回 `PracticeSessionResponse`：
```ts
{ ok:boolean; source:'v1'|'v2'|'empty'; sessionId:string; mode:string; items:PracticeItem[]; warnings:string[] }
```
`PracticeItem`：
```ts
{ id:string; questionItemId?:string; legacyQuestionId?:string; setId?:string;
  type:string; inputMode:string;            // inputMode: 'choice' | 'spell' | 'listen' (+ v2: 'free_text' | 'multi_blank' | 'matching')
  prompt:string; promptZh?:string;
  choices?:{id:string;text:string}[]; answer?:string|string[]|null; answerText?:string;
  stimulus?:{kind?;title?;textEn?;textZh?;audioUrl?};
  audio?:{url?:string;transcript?:string}|null;
  targetWords:{wordId?;surface?;role?;senseKey?;dimension?}[];
  subskills:string[]; explanationZh?:string }
```
`warnings` 实际枚举：`insufficient_pool`、`missing_word`、`missing_task_type`、`deprecated_type`、`no_v1_pool_for_task`、`unknown_section`、`no_v1_pool_for_section`、`unknown_exam`、`v1_paper_approximation`、`v2_unavailable_or_empty`。

### `POST /api/practice/attempts`
Body `RecordAttemptInput`（至少 `questionItemId` 或 `legacyQuestionId` 之一，否则 400）：
```ts
{ source?; questionItemId?; legacyQuestionId?; setId?; examId?; sectionId?; taskType?;
  subskills?; answer:unknown; isCorrect?; score?; durationMs?; errorType?; targetWords? }
```
返回 `RecordAttemptResponse`：
```ts
{ ok; recorded:boolean; storage:'v2'|'none'; warnings:string[];
  wordUpdates:{wordId;isCorrect;dimension?}[]; skillUpdates:{examId;skillKey;delta}[] }
```
- `storage:'none'`（v2 表未应用 / 未认证 / 仅 v1 题）**不得**打断本地计分。
- 客户端把 `wordUpdates` 应用到 `lexiStore`（`markCorrect`/`markWrong`/`recordDimPass`），runner **不**直接写 store。

## 4. 旧 URL 参数 → PracticeRunner props（`app/quiz/page.tsx` 负责映射）

全部保留可用，旧链接绝不 404/崩溃：
| 旧参数 | 映射 |
|---|---|
| `?word=ability` | `mode:'word'`, `word` |
| `?word&vs=B` | vs 辨析 —— 走 legacy（客户端拉两词生成二选一），**不**强行进 session |
| `?yesterday=1` | 昨日回顾 —— legacy 客户端出题 |
| `?mode=vocabulary-drill\|sentence-practice` | task / 词汇练习（level=profileLevel 或显式） |
| `?mode=reading-practice&level=3` | `mode:'task'`, `taskType:'reading_comprehension'`, `level` |
| `?mode=listening-practice&level=3` | `mode:'task'`, `taskType:'listening_comprehension'`, `level` |
| `?mode=exam-practice&drill=synant&level=7` | task via `DRILL_TYPE_MAP['synant'] = ['synonym_choice','synonym_substitute']` + level（`EXAM_TO_LEVEL[exam]` 或 profileLevel） |
| `?mode=wrong-answer-booster` | 错题 —— legacy 客户端 |
| `?exam=IELTS` | `examId` |
| `?level=`、`?drill=<key>`、`?returnTo=` | 透传保留 |

**退役题型永不渲染**：`antonym_choice`、`cet_cloze`（后端默认已不下发，前端 filter 双保险；`cet_cloze` 旧缓存重映到 `cloze_choice`）。

## 5. 五状态 + 六 Renderer（视觉规格）

### 5.1 五状态（全部复用 `.pr-v2`）
| 状态 | 结构 / 复用 | 触发 / 文案 |
|---|---|---|
| **loading** | 复用 `<LoadingState message="Loading Practice…" />`（`role=status` `aria-live=polite`） | fetch session 期间 |
| **empty** | `.results.fade-up` 居中：`h2`(serif-zh) + `p` + ModeSwitch + `.cta` | `source:'empty'`，文案见下 |
| **error** | 同 empty 容器 + `.res-actions`(`.cta` 重试 + `.cta.ghost` 返回)；`role=alert` | fetch 抛错；**不得白屏** |
| **play** | `topbar`(exit+pbar+pcount+combo+score) → `eyebrow`+`tag` → `prompt` → 输入区 → 反馈 → `qfoot`/cta | 答题中 |
| **results** | `.res-hero`(ring SVG)+`h2` → `.res-stats`(用时/最高连击/XP) → `.wrongbook` → `.res-actions` | 完成 |

**空态文案**（按 warnings 取首个命中）：
- `insufficient_pool` → 「暂时没有可练习的题目」/「当前等级或题型下题量不足，换个练习试试。」
- `v2_unavailable_or_empty` → 「题库建设中」/「这个题型还在准备，先练别的吧。」
- `missing_word`（`?word=` 无题）→「该词还没有题目，去词典看看。」
- listening/reading 无题 →「当前等级暂时没有听力/阅读短文题（可切到其它练习）。」
- 兜底 →「暂时没有可练习的题目。」

**错误态文案**：「题目加载失败」/「网络或服务异常，请重试。」/ 按钮「重试」(`.cta`) +「返回今日」(`.cta.ghost`)。

### 5.2 六 Renderer（按 `inputMode` 路由）
| Renderer | inputMode | 规格 |
|---|---|---|
| **ChoiceRenderer** | `choice` | `.opts/.opt`，真 `<button aria-pressed>`；锁定后正解 `.correct`、误选 `.wrong`、其余 `.locked`(降透明)；`.mk` 勾/叉。`reading_comprehension`/`listening_comprehension` 也走它，仅 stem 不同（短文块 / 播放钮 + 题干） |
| **SpellRenderer** | `spell` | `.spell/.lg-input` + `.hintrow/.hint-initials`；Levenshtein `d===1` **一次**容错 `.tol` → 再错 `.bad` + `.diffrow`(`.difftxt .ok/.no`) + `.answer-line`；input 配 visually-hidden `<label>` |
| **ListeningRenderer** | `listen` | 播放钮（复用 ListenPlay 渐变圆 + `speakSmart`/TTS）+ 内层 Choice/Spell；**transcript 仅答题后显示**（`.transcript` 块） |
| **FreeTextRenderer** | `free_text`(v2) | `<textarea class=lg-input>` + `<label>`；收集文本→标记 submitted；无评分 API 时**不判分**，用中性 `.feedback.note`「已提交 · 暂不判分」，不计 combo |
| **MultiBlankRenderer** | `multi_blank`(v2,无数据) | 「建设中」占位（见 5.3） |
| **MatchingRenderer** | `matching`(v2,无数据) | 同上占位 |

### 5.3 「建设中」受控占位（multi_blank / matching）
复用 `.prompt.muted`（虚线边、降饱和）；`aria-disabled="true"`，文字本身表达不可用（不只靠颜色）；该题不发 attempt、不计分、不计对错；底部 CTA「跳过 →」。
- 标题：**该题型暂不可用**
- 副文案：**题库建设中，先用其它题型练习**

## 6. 可接受差异 vs 必须 1:1

- **可接受微差**：combo/score 入场与 bump 动画时序、即时反馈措辞、XP 计算细节（runner 是同 CSS 重实现）。
- **必须 1:1**：`.pr-v2` 全部 class 与色彩语义（teal=对 / rose=错 / gold=连击）、`.opt.correct/.wrong` 标记、spell 一次容错行为、结算环 + `.res-stats` + `.wrongbook`、键盘 `1-4 / a-d` 选项 + 作答后 `Enter` 下一题、退役题型不渲染。

## 7. Interactions & Behavior（含已踩坑的修复，务必照做）

- **选项**：`<button>`，键盘 `1-4`/`a-d` 选；`aria-pressed`。触摸端把 `:hover` 效果包在 `@media (hover:hover)`，避免触屏「卡住 hover」；加 `:active` 轻按。
- **拼写提交（关键 bug 修复）**：input 的 `keydown` 处理 Enter 时必须
  1. `e.stopPropagation()` —— 否则同一次 Enter 会冒泡到全局监听触发 `next()`，导致「一次回车既提交又跳题」；
  2. `if (e.isComposing || e.keyCode===229) return` —— 忽略中文输入法确认候选词的回车；
  3. 输入过滤：`value.replace(/[^a-zA-Z '\-]/g,'')` —— 拼写题只收拉丁字母/空格/连字符/撇号，挡掉中文。
  作答锁定后再按 Enter 才进下一题（此时 input 已 `disabled`，由全局监听处理）。
- **进场动画规则**：可见态作为基样式，从隐藏态用 `@keyframes` 动画进入（gate 在 `[data-active]` / `@media (prefers-reduced-motion: no-preference)`）。**切忌**把「隐藏」设为基样式靠 transition/animation 才显形 —— 动画一旦不跑（reduced-motion / 被暂停），内容会卡在隐藏态（移动端底部抽屉就踩过这个坑：用 `transform:translateY(0)` 作基样式 + `@keyframes` 从 `101%` 滑入）。
- **听力**：点击播放钮 `speakSmart(word,'us',{slow})`；`listening_comprehension` 用 slow。
- **结算环**：`<circle>` 的 `strokeDashoffset` 初值=整圈周长 `C`，挂载后 `requestAnimationFrame` 设到目标值（`transition` 画出来）。

## 8. State Management

会话级：`step('play'|'results')`、`idx`、`score`、`xp`、`combo`、`maxCombo`、`results:QuizAttempt[]`、`startedAt/completedAt`。
单题级：`locked`、`picked`、`correct`、`spellTried`、`spellPhase('' |'tol'|'bad'|'good')`、`spellDiffAns`。
- 每题作答 → `POST attempts` → 用返回的 `wordUpdates` 调 `lexiStore`；`storage:'none'` 不影响本地计分。
- 完成整组才标记今日动线（exam→mock / wrong→wrong / vocab|sentence→practice）。
- 同步锁 `lockRef` 防一题内重复提交（严格模式双调用安全）。

## 9. Design Tokens（globals :root · 米白日光，**勿新增颜色**）

```
--paper #f2efe9   --paper-2 #ece8df   --card #fbf9f4   --card-2 #ffffff
--ink #14191e     --ink-sub #4a5a66   --ink-muted #8a97a2
--line rgba(20,30,40,.10)   --line-strong rgba(20,30,40,.16)
--teal-ink #0e8c7a   --teal-bg rgba(14,140,122,.08)   (premium 新增局部 --teal-deep #0a6e5f)
--gold-ink #b3781f   --gold-bg rgba(179,120,31,.10)
--rose-ink #bf4a30   --rose-bg rgba(191,74,48,.09)
--shadow-rest 0 1px 2px rgba(20,30,40,.05),0 4px 14px -8px rgba(20,30,40,.08)
--shadow-hover 0 2px 4px rgba(20,30,40,.06),0 12px 28px -12px rgba(20,30,40,.16)
字体（next/font 注入）：--font-serif 'Instrument Serif' · --font-serif-zh 'Noto Serif SC'
  · --font-news 'Newsreader' · --font-sans 'Space Grotesk'/'Noto Sans SC' · --font-mono 'Space Mono'
--ease cubic-bezier(.22,1,.36,1)
```
premium overlay 局部新增（仅作用域 `.pr-v2`，见 `css/practice-session-premium.css`）：`--elev-1`、`--elev-2`、`--teal-glow`。

## 10. 品牌（网页端 —— 用真实品牌样式）

来源 `config/site.ts`（`projectName:'Lexiverse'`、`projectNameZh:'词渊'`）与 `components/layout/Navbar.tsx` Logo：
- Wordmark：`Lexi` + 斜体青绿 `verse` —— `font-family:var(--font-serif)`（Instrument Serif），weight 400，`letter-spacing:.01em`，`verse` 用 `font-style:italic; color:var(--teal-ink)`。
- 副名：`词渊` —— `font-family:var(--font-mono)`，10px，`letter-spacing:.12–.14em`，`color:var(--ink-muted)`。
- 应用内头部 Logo **无图标**（landing 才有 teal SVG mark）。其它处用「词渊 <em>Lexiverse</em>」写法。**不要**自造图标/wordmark。

## 11. 视觉高级化（premium overlay）

`css/practice-session-premium.css` 是**纯叠加**：在 `import './practice-session.css'` 之后再 import 即可，全部选择器以 `.pr-v2` 开头、只升级既有 class 观感、不改 class 名/DOM。详见 `css/PREMIUM-DIFF.md`。桌面两栏「任务栏」是结构性改动（需新增 `.pr-rail` markup），默认不启用、作为后续单独评估。

## 12. Acceptance Criteria

- `/quiz?word=ability` 可加载且可作答（word session, v1）。
- `/quiz?mode=reading-practice&level=3`、`?mode=listening-practice&level=3` 经 session API 渲染阅读/听力 stem。
- `/quiz?mode=exam-practice&drill=synant&level=7` 加载或受控空态（synant→synonym_choice/synonym_substitute；无退役题型）。
- 旧链接不 404/崩溃；退役题型不渲染。
- 每答一题发 attempt；`not_applied`（storage:'none'）不破坏本地计分。
- multi_blank/matching 无数据显示受控占位，非报错。
- 拼写题：回车只提交不跳题、容错一次、挡中文/输入法。
- `validate:practice-session` / lint / tsc 全过；4 条 URL browser smoke 通过。

## 13. Files（本包）
- `README.md`（本文，自足）
- `PROMPT.md` —— 给 Claude Code 的逐步实现提示词
- `CONSTRAINTS.md` —— 硬约束清单
- `css/practice-session-premium.css` —— drop-in 视觉叠加层
- `css/PREMIUM-DIFF.md` —— 叠加层接法与改动说明
- `references/*.html` —— 4 个 hi-fi 设计参照（+ `design-canvas.jsx`、`ios-frame.jsx` 依赖）

### 目标代码库需创建 / 修改
- **新建**：`components/practice/PracticeRunner.tsx`、`PracticeFrame.tsx`、`renderers/{Choice,Spell,Listening,FreeText,MultiBlank,Matching}Renderer.tsx`、`practice-types.ts`
- **修改**：`app/quiz/page.tsx`（渲染 runner、映射旧参数）
- **新增样式**：`components/quiz/practice-session-premium.css`（本包 overlay）
- **复用不 fork**：`components/quiz/practice-session.css`、`components/lexiverse/LoadingState.tsx`、`store/lexiStore`
- **保留**：`components/quiz/LexiverseQuizClient.tsx`（legacy fallback）
