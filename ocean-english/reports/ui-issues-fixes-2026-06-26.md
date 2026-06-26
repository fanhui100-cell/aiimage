# UI/数据问题修复 — 2026-06-26

用户在运行中的 app 报的 5 个问题，经 5-agent 只读诊断定位根因后修复。全部 tsc/eslint/next build 0。

| # | 问题 | 根因 | 修复 | 验证 |
|---|---|---|---|---|
| ① | 点词进宇宙只到星球总览、不飞到该词星球 | 入口传词形非 slug；父框 galaxyForWord 未传 levels、store galaxy(语义簇) 与 v3 星系 id 不交集 → 兜底到首星系；focusWord 找不到静默 return | DictionaryVaultScreen 传 slug；ReferenceLexiverseFrame 用 `galaxyForWord(galaxy, levels)` + 未入库词 fetch `/api/dictionary/word/<slug>` 拿 levels 推「等级带星系」（其 dataFile 装该档完整真词表，focusWord 即能命中飞入）；wu-bridge 未命中回报 `lv:focus-miss` → 父框可见提示，不再静默 | build 0；词典 word API 实测返回 levels/primaryLevel（benefit=[2..6]/concerned=[6]/ubiquitous=[6,7]）→ 可解析到对应等级带星系 |
| ② | 遗忘曲线「每条都一样」 | ForgettingCurve 只画「全词平均间隔 S」决定的单条艾宾浩斯示意曲线，完全没用每词 SRS 状态 | 同卡叠加**每词真实风险散点**：以 `elapsed=interval−dueInDays` 为 t、各词 interval 为稳定性算保持率 R 打点（越右下越红=越该复习），标题改「个人遗忘曲线·每词风险」，曲线降为半透明背景，并提示「约 N 词进入高风险区」。仅用现有 matrix 字段，零 store/接口改动 | build 0 |
| ③ | 阅读各等级「生词率」都一样 | 它根本不是「不认识词÷文章词数」，而是 `难度=等级×11+min(18,关键词/分钟)` 代理，等级主导 → 同档同值；再乘(1−已掌握)而新用户已掌握≈0 | 按用户选择**改名为「难度」**（最小、诚实），不再误称生词率；修正误导注释 | build 0 |
| ④ | 「全部词库」只显示 500 | total 靠「翻全表逐页累加」算，每页带 join 慢(冷启~3s) > 默认 2.5s 超时 → 第 2 页超时返空 → 循环提前结束，total 冻在第 1 页 500 | 新增 `DictionaryClient.countWords`（Supabase `select count:'exact',head:true` 单次请求，过滤链与 searchWords 一致）；`collectDictionarySearchResults` 无 cefr 后置过滤时走「单次精确 count + 单页取数」，不再翻全表；超时放宽 8s | **实测 total=28602**（不再 500） |
| ⑤ | 按等级计数对不上、考研档列出一堆「托福」词 | 按等级用「±1 档并集」(考研=4/5/6 共 16213) + `primary_level DESC` 排序 → 托福(primary=6)词排考研词前；标签忠实显示其 primary_level=托福 | 按用户选择改「**大纲全量**」口径：API 加 `?syllabus=L` → `levels 含 L`（quickly 等 levels=[6] 不含 5 → 正确排除）；排序改 frequency_rank ASC（不再 primary_level DESC）；行标签按等级浏览时显示**当前浏览档**而非 primary_level | **实测 考研=5896**，返回词 levels 均含 5、标签显「考研」、quickly 已排除 |

## 待审计（非本次可纯前端修）

- **⑤b 数据注入错误**：`quickly`(fr=679)/`cultural`/`concerned` 等极常见词被打成 `primary_level=6 / levels=[6] / tags=[TOEFL]`；连 `a/to/her` 也带 `levels∋5`(考研)。属七档 `primary_level`/`levels`/exam tags 的注入/映射错误，需审计导入脚本后重算修数据。大纲全量口径 + 当前档标签已让 UI 不再误导，但底层等级数据仍需订正。

## 文件
- ① `components/lexiverse/ReferenceLexiverseFrame.tsx`、`public/lexiverse-reference-v3/wu-bridge.js`、`components/screens/DictionaryVaultScreen.tsx`(cosmos 传 slug)
- ② `components/screens/ForgettingCurve.tsx`
- ③ `components/screens/ReadingScreen.tsx`
- ④ `lib/dictionary/{dictionary-types,dictionary-client,supabase-dictionary-client,search-utils}.ts`、`app/api/dictionary/search/route.ts`
- ⑤ 同 ④ + `components/screens/DictionaryVaultScreen.tsx`(syllabus 口径 + 标签)
