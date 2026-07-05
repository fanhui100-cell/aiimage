# 界面优化5 · 交接文档（四阶段全部完成 ✅）

> 先读根目录 `AGENTS.md`（本版 Next.js 与训练数据有差异，写代码前查 `node_modules/next/dist/docs/`）。
> 规格包：`C:\Users\fanhu\Downloads\界面优化5_extracted\design_handoff_ocean_english_overhaul\`

## 状态总览（2026-06-11）

- **分支**：`feat/jiemian5-phase1`（基于 master，待人工 review 合并）
- **阶段 1**（A1-A3 止血）`4ac4109` ✅
- **阶段 2**（A4-A7 缝合）`2972c5a..86adc6f` ✅（9 commits）
- **阶段 3**（B1/B2/B3/B6/B7/B9/B10 界面）`24514f0..9e25316` ✅（8 commits）
- **阶段 4**（微交互 Demo01-11 全量）`924e53d..9326db7` ✅（4 commits）
- **验证基线**：`npx tsc --noEmit` 零错误；`npx next build` 51 页通过；
  `npx playwright test` 8/8 绿。三项均需 `cd ocean-english` 后执行；
  `tsc` 报的 `.next/types/validator.ts` 错误是陈旧生成物，过滤 `^\.next/` 即可。
  Playwright 复用项目 dev server（本版 Next 同项目仅允许一个 dev 实例）。

## 架构现状（接手必读）

- **单一 store**：`store/lexiStore.ts`（persist `lexi-store-v1` **v5**）。
  words（7 状态机+SRS+内容缓存+saved/source）、daily/history(366天归档)/streakData/xp、
  todayPack、wrongAnswers/quizHistory/chatMessages、profile(userLevel/onboardedAt)。
  learningStore 已删除，`grep useLearningStore` == 0。
- **云同步**：CloudSyncProvider 监听 lexiStore——words diff 1.5s 防抖批量
  POST `/api/user/word-states`，移出词条 DELETE；登录水合
  `lib/sync/learning-hydration.ts`（updated_at 新者胜、nextReviewAt 取更早；
  云端为空且本地有词时一次性全量补传）。`word_states` 表 SQL 已在 Supabase 执行。
- **导航**：`lib/product-flow/nav.ts` 唯一词表（PRIMARY_NAV 5 + TOOL_NAV 6）；
  移动端标准 5 tab；FocusBackButton 聚焦页悬浮返回。
- **今日闭环**：buildTodayPack（每日一次，40/35/25，断网降级种子包+重试条）；
  今日页三步真实判定；全闭环出 DailyRecapCard（html-to-image 导出）。
- **词库**：DictionaryScreen 双 tab（我的词 ?state= / 探索词典 cefr+exam 分页）；
  `/lexiverse/vocab`、`/lexiverse/quiz` 已 308 收敛。
- **微交互**：参数全部照 Demo 文档（答题弹跳/shake、chip morph、环粒子、
  数字滚动 NumberRoll、stagger、噪点、阴影两档 token、光斑漂移、160ms 过场、
  3D 翻卡、衬线呼吸）；键盘可走完 学(Space/1/2)→测(1-4/Enter)→复(Space/1-4)；
  prefers-reduced-motion 全局降级（globals.css 通配规则 + NumberRoll/template 各自处理）。

## 记录的 spec 偏离（累计）

1. recommend/search 响应用现场 `{ ok, data }` 约定（非 spec 的 `{ words }`）。
2. 永久重定向用 Next redirects() 的 308（语义等价 301）。
3. wrongAnswers 平移在 A7 而非 A4（云同步耦合）。
4. search 的 cefr/exam 过滤为取 500 池后置过滤（WordSearchOptions 无 cefr 字段）。
5. 「继续上次」卡省略阅读级（阅读页是建设中占位页，无进度数据）。
6. 衬线呼吸只作用于无 inline lineHeight 的 h1/h2（inline 样式优先级更高）；
   标题下边距 +40% 未做全局替换（边距均为 inline）。
7. B8-3 celebrate=1 星球脉冲未做（需深改 3D 场景，已有 Ribbon 展示；后置）。
8. 单词无题空状态动作为「查看词条」（详情页内有加入学习，语义等价 spec 的[加入学习]）。
9. A6-3 题型按词龄升级（听音/拼写）spec 标注第 6 周+，未做。

## 待人工验证 / 后续事项

- 登录用户换浏览器云端恢复（代码+表就绪，需真实账号走一遍）。
- 旧端点 `/api/user/saved-words`、`/api/user/review-words` 已无调用方，
  确认无老客户端后可删；`localStorage['lexiocean-learning']` 旧 key 下个版本清。
- Lighthouse 对比（动效均为 transform/opacity，预期不降分；未实测）。
- 暗色主题已删开关（globals 的 [data-theme=night] token 保留为 inert 基础）。
