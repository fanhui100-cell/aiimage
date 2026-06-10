# 界面优化5 · 阶段 2 交接 (Phase 2 Handoff)

> 给接手会话（建议 fable5）。先读根目录 `AGENTS.md`（本版 Next.js 与训练数据有差异，写代码前查 `node_modules/next/dist/docs/`）。

## 当前状态

- **分支**：`feat/jiemian5-phase1`
- **暂存**：`stash@{0}`（之前的在制品，**不要动**）
- **规格包**：`C:\Users\fanhu\Downloads\界面优化5.zip`
  - `docs/实施方案 A · 数据闭环与系统缝合.html` — A1–A7 代码级 spec（diff 风格：绿=新增，删除线=删除）
  - `docs/实施方案 B · 界面与引导优化.html` — 阶段 3 用
  - `docs/微交互 Demo · 参数即规格.html` — 阶段 4 用
  - `PROMPTS.md` — 分阶段提示词；`README.md` — 总览
- **验证基线**：`npx tsc --noEmit` 源码零错误；`cd ocean-english && npx next build` 通过（54 页）。
  - 注意：用户常开着 `next dev`（锁 `.next`）；`tsc` 报的 `.next/types/validator.ts` 错误是陈旧生成物，过滤 `^\.next/` 即可。
  - build/typecheck 必须 `cd ocean-english` 后执行。

## 已完成

### 阶段 1（A1–A3）— commit `4ac4109`
真 SRS（`lib/srs/schedule.ts` 四档 SM-2、`reviewGrade`、`getDue` 时间派生、persist **v2** 迁移）；真进度（`daily/streakData/recordActivity/getTodayProgress`，删假 xp/streak/studiedToday）；错题链路（`?word=` 单词测验、Quiz/Exam 结构化错题、考试超时计错、`ReviewHub` 三 tab + `WrongAnswerList`、LearnScreen「还不熟」队尾重现、复习徽标=到期+错题）。

### 阶段 2 已做的部分
- `095d8d2` **A4 地基**：`lib/dictionary/entry-adapter.ts` 的 `toWordEntry(dw, source)`；`lexiStore.ensureWord(dw, source, state?)`（已存在不重置进度）；`WordEntry` 加 `addedAt/source/saved`；词详情「加入学习」走 `ensureWord`（旧 learningStore 调用暂留）。
- `9b889f9` **A4 收藏统一**：`lexiStore.getSaved/isSaved/setSaved`；`SaveWordButton`/`WordCard`/`app/scan/page.tsx` 收藏时**双写** `setSaved`；`MeScreen` 收藏 tab 改读 `getSaved()`。
- `9f2087c` **A6 干扰项**：`distractorsFor` 改同词性 band±1 真实释义，删 `DISTRACTORS` 固定池。

### 关键设计决策：dual-write 中间态
`lexiStore` 已是 UI/状态机权威源；`learningStore` 暂留作**云同步镜像**。原因：`savedWords`/`reviewWords` 与 `components/auth/CloudSyncProvider.tsx`（增量 diff 上传 Supabase）深度耦合。**必须等 A7 把 CloudSyncProvider 改成监听 `lexiStore.words` 后，才能安全删 learningStore。** 这是包里"先代理→再迁移→最后删壳"的中间态，不是疏漏。

## 剩余工作（按依赖顺序）

### A4 收尾
- persist 升 **v3** + `migrate`：吸收旧 `localStorage['lexiocean-learning']`（reviewWords→词条 SRS 字段、savedWords→`saved`、streak 取大者）。见 spec A4-5。
- 启动时 `hydrateMissingEntries()`：对 `zh===''` 的 stub 词条调 `/api/dictionary/word/[slug]` 补内容。
- `userLevel` 并入 `lexiStore.profile`（band≤3 beginner / ≤6 intermediate / 其他 advanced）。
- 逐个迁移其余 `useLearningStore` 读取点（`grep useLearningStore` 共 ~24 文件：chat/lexigraph/lexiverse/profile/TodayMissionPanel 等），最后删 learningStore 壳。
- 18 个种子词转「零网络离线兜底包」（id 换词典 slug，仅词库空且断网时注入）；删 `EXTRA_DICT`、伪登录 `login/logout`、`studyOne`(已删)。

### A5 今日包个性化（依赖 A4 的 id 统一）
- 新建 `app/api/dictionary/recommend/route.ts`（band→CEFR 窗口、examTag 优先、frequencyRank 排序、exclude 已有词；**ExamKey 'CET4' 与词典 ExamTag 'CET-4' 需映射表**）。
- `lexiStore.todayPack{date,recommendedIds}` + `buildTodayPack()`（每日一次，新/复/弱 40/35/25 配比）；**getToday() 重写**为读 todayPack（会动 Home/Today/Learn/Quiz 四处消费方，谨慎）；失败降级：种子兜底→只剩复习薄弱+UI 明示。
- Onboarding `finish()` 写齐 `userLevel` + `await buildTodayPack()` 再跳转；ExamScreen 题池按 band±1 过滤。

### A6 测验合并（依赖 A4）
- `/quiz` 内部换 `LexiverseQuizClient` 引擎（四模式）+ 状态机写回（`markCorrect/markWrong` + `recordActivity('quizzed')` + 错题；词不在库静默跳过）；`/lexiverse/quiz` 路由 301 → `/quiz`。
- `distractorsFor` 已完成（见上）。

### A7 云同步与清理
- Supabase 新表 `word_states`（user_id+word_id 主键 + state/streak/ease/interval/next_review_at/saved/source/updated_at）。
- 新端点 `app/api/user/word-states/route.ts`（GET 全量 / POST 批量 upsert）。
- `CloudSyncProvider` 改监听合并 store 的 `words`，1.5s 防抖 diff 上传；`lib/sync/learning-hydration.ts` 合并：updated_at 新者胜、nextReviewAt 取更早者。
- 删除清单：learningStore（代理期结束后）、KnowledgeScreen/WordsScreen（阶段3替换前暂留）、`LevelGate`、`CatPet/*`+`catStore`、`HomeLearningCTA`、`AIGuideButton`、`app/universe`、`app/explore`；根目录 `smoke-*.log`/`tsconfig.tsbuildinfo` 进 `.gitignore`。
- `e2e/learning-loop.spec.ts` Playwright 8 例（见 spec A7-3）。

## 阶段 2 验收（全做完后）
词典任意词「加入学习」→ 今日包/复习/宇宙/词库四处同状态；全局唯一 XP/streak/错题本；定级 B1→今日包 B1±1 且每日更新、断网降级不白屏；测验四模式驱动状态机、干扰项同词性同难度；旧用户双 localStorage 合并无重复词、复习时间保留；登录用户换浏览器云端恢复；`grep useLearningStore` == 0 或仅剩代理壳；Playwright 8 绿。

## 约束（每节都遵守）
先读文件再改；每小节一个 commit（`A4: …`/`A5: …`）；spec 与现场冲突以现场类型/API 为准并在 commit 记录偏离；渐进迁移、每步 `next build` 通过、禁止一次性删 learningStore；不动 UI 布局（阶段3的事）；不引入新颜色/字体/emoji。
