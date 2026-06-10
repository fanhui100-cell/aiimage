# 界面优化5 · 阶段 2 交接 (Phase 2 Handoff)

> 先读根目录 `AGENTS.md`（本版 Next.js 与训练数据有差异，写代码前查 `node_modules/next/dist/docs/`）。

## 当前状态：阶段 2（A4–A7）已全部完成 ✅

- **分支**：`feat/jiemian5-phase1`
- **暂存**：`stash@{0}`（更早的在制品，**不要动**）
- **规格包**：`C:\Users\fanhu\Downloads\界面优化5.zip`（已解压至 `C:\Users\fanhu\Downloads\界面优化5_extracted\`）
  - `docs/实施方案 B · 界面与引导优化.html` — **阶段 3 用**
  - `docs/微交互 Demo · 参数即规格.html` — 阶段 4 用
- **验证基线**：`npx tsc --noEmit` 零错误；`npx next build` 通过（53 页）；
  `npx playwright test` 8/8 绿（复用 dev server，本版 Next 同项目仅允许一个 dev 实例）。
  - `tsc` 报的 `.next/types/validator.ts` 错误是陈旧生成物，过滤 `^\.next/` 即可。
  - build/typecheck/test 都要 `cd ocean-english` 后执行。

## 阶段 2 提交清单（按序）

| commit | 内容 |
|---|---|
| `2972c5a` | A4 persist v3：吸收旧 `lexiocean-learning`（reviewWords→SRS、savedWords→saved、streak/xp 取大者）+ `hydrateMissingEntries()` 启动补 stub |
| `d034918` | A4 userLevel 并入 `profile`（`bandToLevel`：≤3 beginner / ≤6 intermediate / 其他 advanced） |
| `6f41864` | A4 读取点迁移：userLevel/saved/review/进度全部改读 lexiStore（当时写仍双发） |
| `ea94d84` | A4 种子词改零网络兜底包（id→词典 slug，persist v4 重映射）；删 EXTRA_DICT、伪登录 |
| `3d19d26` | A5 今日包个性化：`/api/dictionary/recommend` + `exam-tag-map` + `todayPack/buildTodayPack`、`getToday()` 重写、Onboarding/ExamScreen 接入 |
| `38a730d` | A6 测验合并：/quiz 换四模式引擎 + 状态机写回；`/lexiverse/quiz` 308→/quiz；删 QuizScreen |
| `dbd8ea5` | A7 lexiStore 增 practice/chat 切片 + persist v5 |
| `b82df28` | A7 云同步切 lexiStore（word_states 表/端点/hydration/CloudSyncProvider 重写）+ 删 learningStore 及死代码 |
| `86adc6f` | A7 Playwright 学习闭环 8 例（全绿） |

## 关键现状（接手必读）

- **单一 store**：`grep useLearningStore` == 0，`store/learningStore.ts` 已删除。
  lexiStore（persist `lexi-store-v1` **v5**）持有：words（7 状态机 + SRS + 内容缓存 +
  saved/source）、daily/streakData/xp、todayPack、wrongAnswers/quizHistory/chatMessages、profile(含 userLevel)。
- **云同步**：`CloudSyncProvider` 监听 lexiStore——words 引用 diff → 1.5s 防抖批量
  POST `/api/user/word-states`；错题/测验史/进度/聊天沿用旧端点；登录时
  `lib/sync/learning-hydration.ts` GET 全量合并（updated_at 新者胜、nextReviewAt 取更早）。
- **⚠️ 需手动执行**：`supabase/sql/jiemian5-word-states.sql` 尚未在 Supabase SQL Editor
  跑过——不执行则 word-states 同步 500（fire-and-forget，仅 console.warn，不影响本地）。
- **离线兜底**：新用户词库为空；`injectOfflineSeedIfEmpty()`（AppShell 启动）仅在词典
  请求失败且词库为空时注入 18 个种子词（id=词典 slug、source='seed'）。
- **记录的 spec 偏离**：recommend 响应用现场 `{ ok, data }` 约定；/lexiverse/quiz 用
  Next redirects() 的 308（语义等价 301）；wrongAnswers 平移发生在 A7 而非 A4。

## 留给后续阶段

- **阶段 3（实施方案 B）**：界面与引导优化。KnowledgeScreen / WordsScreen 仍在线，
  待 B7 新词库页替换后删除；LexiverseQuizClient 结果页文案仍指向 Lexiverse（UI 措辞）；
  MeScreen 头像为静态文案（伪登录已删，可接 Supabase user）。
- **旧端点清理（A8/择机）**：`/api/user/saved-words`、`/api/user/review-words` 已无
  调用方，确认 word_states 表上线且老客户端绝迹后可删；`localStorage['lexiocean-learning']`
  旧 key 暂不删（migrate 还要读），下个版本清。
- **A6-3 题型按词龄升级**（听音/拼写，spec 标注第 6 周+，可后置）。

## 阶段 2 验收对照

- 词典任意词「加入学习」→ 今日包/复习/宇宙/词库同状态 ✅（e2e #8）
- 全局唯一 XP/streak/错题本 ✅（learningStore 已删）
- 定级 B1 → 今日包 B1±1、每日更新、断网降级不白屏 ✅（e2e #1/#7 + 种子兜底）
- 测验四模式驱动状态机、干扰项同词性同难度 ✅（e2e #3 + A6 commit）
- 旧用户双 localStorage 合并无重复词、复习时间保留 ✅（v3/v5 migrate）
- 登录用户换浏览器云端恢复 ⚠️ 代码就绪，**待 SQL 执行后人工验证**
- `grep useLearningStore` == 0 ✅；Playwright 8 绿 ✅

## 约束（沿用）

先读文件再改；每小节一个 commit；spec 与现场冲突以现场为准并在 commit 记录偏离；
每步 `next build` 通过；不动 UI 布局（阶段3）；不引入新颜色/字体/emoji。
