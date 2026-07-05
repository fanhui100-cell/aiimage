# Ocean English 全项目审查报告（2026-06-16）

审查目标：前端界面、路由、导航、跳转、后端 API、Supabase SQL/安全、词库、词汇资料、词形、同义词/反义词、阅读、题库与七档等级匹配。

本报告只做审查和记录。未修改业务代码、数据库内容或词库数据；审查命令本身会刷新部分 `reports/*` 产物，并且 `scripts/audit-relations.ts` 会写 `scripts/.audit-flags.json`。

## 结论总览

当前项目可以构建，主页面在生产模式下基本可打开，词库/题库规模已经比较大，关系死链检查也比较干净。但还有几类需要优先修复的问题：

| 优先级 | 问题 | 影响 |
|---|---|---|
| P0 | `dictionary_definitions.definition_en` 大面积是中文或与 `definition_zh` 相同 | 英文释义、词汇详情、题目解释、AI/阅读上下文会被污染 |
| P0 | `/api/reading` 列表只拿 Supabase 默认前 1000 行 | 阅读页只展示 335 篇；实际 active 阅读篇约 1347 篇，TOEFL 等级被漏掉 |
| P1 | `/drill` 选择的等级/题型没有被 `/quiz` 消费 | 用户以为在刷指定等级/题型，实际 quiz 仍按个人等级或默认逻辑取题 |
| P1 | `/api/questions?limit=N` 在无 `types`/`word` 时会返回 `N*8` 窗口 | 调用方传 `limit=5` 实际拿到 40 条，可能造成题量、分页和性能异常 |
| P1 | 静态 public/reference/cache 里仍残留旧坏词 | live DB 已清理，但 Lexiverse/参考数据或重建脚本可能再次引入坏词 |
| P1 | `dictionary_collocations` 表为空，但存在 collocation 题型 | 单词详情搭配资料缺失；搭配题与词汇资料来源不一致 |
| P2 | 题型矩阵存在明显空档，需要定义“有意为空”还是“漏生成” | 七档学习体验不均衡，部分等级/题型不可用 |
| P2 | lint 当前失败 | CI 质量门不能通过，主要在 `scripts/*` 的 `any`/unused/const 问题 |
| P2 | AI 个别 route 未限流，按用户要求本轮不动 DeepSeek route 限流 | 仍是后续安全/成本风险项 |

## 审查口径和限制

- 已做：静态检查、构建、后端回归、词库校验、题库校验、Lexigraph 分析、Supabase 只读统计、生产页面探针、主要 API 探针、静态路由扫描。
- 已做：对 live DB 的坏词、死链、定义语言、例句、词源、记忆、搭配表做抽样或全量结构审查。
- 未做：用人工或 LLM 对 28,602 个单词的每条同义/反义关系逐条语义判定。当前只能确认“是否存在、是否死链、是否来自合法词表/表结构”，不能保证每个关系语义完美。
- 未做：登录态后的全部私有流程端到端点击，例如真实用户的保存、复习、错题、扫码上传、群组内页权限流。
- 未做：高成本 AI judge 全量阅读难度判分。已运行 objective 指标和无 AI judge 的文章审查。

## 验证命令

| 命令 | 结果 |
|---|---|
| `npx tsc --noEmit` | 通过，exit 0 |
| `npm run build` | 通过，exit 0 |
| `npx tsx scripts/backend-regression.test.ts` | 通过，exit 0 |
| `npm run validate:dictionary` | 通过，0 error / 0 warning |
| `npm run validate:questions` | 通过，0 error / 0 warning |
| `npm run analyze:lexigraph` | 通过，但有 262 条字段覆盖 warning |
| `npm run report:coverage` | 通过，刷新 coverage 报告 |
| `npx tsx scripts/lexiverse-level-coverage.ts` | 通过，刷新 Lexiverse coverage 报告 |
| `npx tsx scripts/stats-all.ts` | 通过，当前题库/词库全量统计见下文 |
| `npx tsx scripts/audit-bank.ts --samples` | 通过，结构缺陷 0 |
| `npx tsx scripts/qa-passages.ts --judge 0` | 通过，输出客观难度统计 |
| `npx tsx scripts/audit-relations.ts` | 通过，关系死链/非法关系 0 |
| `npm run lint` | 失败，24 problems |

构建备注：`npm run build` 成功，但 Next/Turbopack 对 `app/api/document/extract/route.ts -> lib/document/document-extraction.ts -> image-ocr-provider.ts -> easyocr-provider.ts` 有文件 trace warning，原因是运行时拼接 `scripts/easyocr_extract.py` 路径。不是构建阻断，但属于部署可移植性风险。

## 前端页面、路由和导航

### 路由盘点

`app` 下共发现 39 个页面路由：

`/`, `/achievements`, `/auth/login`, `/auth/signup`, `/chat`, `/dictionary`, `/drill`, `/exam`, `/goals`, `/groups`, `/groups/[id]`, `/knowledge`, `/leaderboard`, `/learn`, `/lexigraph`, `/lexiverse`, `/lexiverse/word/[slug]`, `/listening`, `/memory`, `/onboarding`, `/profile`, `/pronunciation`, `/quiz`, `/reading`, `/reminders`, `/report`, `/roots`, `/scan`, `/scan/history`, `/scan/history/[documentId]`, `/search`, `/share`, `/speaking`, `/study`, `/today`, `/visual-lab/cosmic-td`, `/word/[slug]`, `/writing`, `/wrong-answers`。

静态链接/跳转字面量扫描到 37 个唯一内部目标，未发现明显不存在的静态路由。动态链接和登录态内按钮未做到全部真实点击。

`/study` 会跳转到 `/today`，`/wrong-answers` 会跳转到 `/memory?tab=wrong`，属于别名路由。

### 生产页面探针

使用 `next start -p 3101` 在生产模式下探针，以下页面可打开并有可见内容：

| 页面 | 状态 | 备注 |
|---|---|---|
| `/` | OK | 首页可见 |
| `/today` | OK | 今日页可见 |
| `/dictionary` | OK | 词典页可见 |
| `/drill` | OK / 有逻辑问题 | 页面可选等级和题型，但开始后参数没有被 quiz 消费 |
| `/reading` | OK / 数据截断 | 页面加载 335 篇；实际 active 阅读篇约 1347 篇 |
| `/quiz` | OK | 可显示题目 |
| `/exam` | OK | 模考页可见 |
| `/learn` | OK | 学习页可见 |
| `/roots` | OK | 词根页可见 |
| `/lexigraph` | OK | 图谱页可见 |
| `/knowledge` | OK | 知识库页可见 |
| `/leaderboard` | OK | 未登录可见空榜/提示 |
| `/groups` | OK / 401 console | 未登录时 `/api/groups` 401，UI 有登录提示 |
| `/auth/login` | OK | 登录页可见 |
| `/word/ubiquitous` | OK | 词条页可见，但释义字段问题见词库部分 |
| `/lexiverse/word/ubiquitous` | OK / 有 404 资源日志 | 页面内容可见，控制台出现一个资源 404，需要单独定位资源名 |

### 高优先级前端流程问题

#### 1. `/drill` 的等级/题型选择没有真正接到 `/quiz`

证据：

- `components/screens/LevelDrillEntry.tsx:65` 会跳到 `/quiz?level=${level}&drill=1&type=...`。
- `components/quiz/LexiverseQuizClient.tsx:163-168` 只读取 `mode`、`word`、`vs`、`yesterday`、`exam`、`returnTo`。
- `components/quiz/LexiverseQuizClient.tsx:221` 非指定单词时用的是 `profileLevel`，没有读取 URL 上的 `level`。
- 静态扫描未发现 `LexiverseQuizClient` 消费 `searchParams.get('level')` 或 `searchParams.get('type')`。

影响：用户在 `/drill` 选“中考 + 听音选词”等，进入 `/quiz` 后题源不一定锁定该等级/题型。这个属于“界面承诺”和“实际行为”不一致。

建议：

1. 在 `LexiverseQuizClient` 显式读取 `level`、`type`、`drill`。
2. 建立 Drill UI 类型到 question_bank 类型的映射，例如 `meaning -> en_to_zh/def_to_word`、`listen -> listen_to_meaning`、`spell -> dictation_spell/zh_to_word_spell`。
3. `/api/questions` 传入 `level` 和 `types`，并在返回前按 `limit` 截断。
4. 加回归测试：选择 lv1 + listen 后，API 请求必须包含 `level=1&types=listen_to_meaning`。

#### 2. `/reading` 页面数据被 Supabase 默认 1000 行截断

证据：

- `/api/reading` 列表逻辑在 `app/api/reading/route.ts:153-156` 查询 active `reading_comprehension`，但没有分页循环或 `.range()`。
- Supabase JS 默认最多返回 1000 行。
- API 当前返回 335 篇，等级分布：lv1 59、lv2 60、lv3 89、lv4 58、lv5 53、lv7 16、lv6 0。
- 直接分页读取 live DB active 阅读题：4038 行，按篇聚合约 1347 篇，篇章等级分布：lv1 89、lv2 92、lv3 324、lv4 90、lv5 100、lv6 324、lv7 328。

影响：阅读页漏掉大约 75% 篇章，TOEFL 文章在页面中显示为 0，用户会以为该档没有内容。

建议：

1. `/api/reading` 列表查询分页读取全部 active 阅读题，或改为数据库视图/RPC 按 `normalized_word` 聚合。
2. 给 `/api/reading?level=6` 加测试，确保 TOEFL 返回非空。
3. 页面总数、等级芯片数应与 API 全量聚合一致。

#### 3. `/groups/[id]` 无效 id 空态过薄

直接访问不存在的小组 id 时，只看到返回小组列表一类的弱提示，不像标准 404/无权限/不存在状态。建议区分：

- 未登录：登录提示。
- 小组不存在：明确“这个小组不存在或已被删除”。
- 无权限：明确“这是私有小组，需要邀请码或成员权限”。

## 后端 API 审查

### API 探针结果

| Endpoint | 结果 | 备注 |
|---|---|---|
| `/api/dictionary/search?q=ubiquitous&limit=3` | 200 | 返回 1 条 |
| `/api/dictionary/word/ubiquitous` | 200 | 词条可查，但英文释义字段是中文 |
| `/api/dictionary/relations?word=ubiquitous` | 200 | 返回空 relations，和同义词/词族来源口径不同 |
| `/api/reading` | 200 | 返回 335 篇，存在 1000 行截断问题 |
| `/api/reading?id=morning-market` | 200 + `ok:false` | 本地旧文章 id 与 live DB 不一致 |
| `/api/roots` | 200 | 返回 60 条 |
| `/api/roots?root=act` | 200 | 可查 |
| `/api/questions?limit=5` | 200 | 实际返回 40 条，limit 未最终生效 |
| `/api/lexiverse/words` | 200 | 返回 21,369 个词，少于 live DB 28,602 |
| `/api/user/stats` | 401 | 未登录预期 |
| `/api/user/word-states` | 401 | 未登录预期 |
| `/api/groups` | 401 | 未登录预期，页面有 console noise |
| `/api/leaderboard?board=weekly&limit=3` | 200 | 空榜可返回 |
| `/api/user/username-check?name=test` | 200 | 公开可查，存在枚举/限流风险 |

### 高优先级 API 问题

#### 1. `/api/questions?limit=N` 返回数量错误

证据：

- `app/api/questions/route.ts:27` 解析 `limit`。
- 有 `types` 分支在 `app/api/questions/route.ts:107` 做了 `shuffle(out).slice(0, limit)`。
- 无 `types`/`word` 的普通分支在 `app/api/questions/route.ts:122-130` 使用 `getQuestionFetchWindow(limit)` 拉大窗口，然后直接返回 `normalizeQuestionRowsForClient(rows)`，没有最终 `slice(0, limit)`。
- 实测 `/api/questions?limit=5` 返回 40 条。

影响：调用方题量、计时、分页、网络 payload 都可能偏大。

建议：普通分支也做 `shuffle(...).slice(0, limit)` 或明确将参数名改成 `fetchWindow`。推荐加测试覆盖：

- `/api/questions?limit=5` 返回 5。
- `/api/questions?types=en_to_zh&limit=5` 返回 5。
- `/api/questions?word=ability&limit=5` 行为按产品定义固定。

#### 2. `/api/lexiverse/words` 与 live DB 总词量不一致

证据：

- `app/api/lexiverse/words/route.ts:7-8` 注释写“Returns all dictionary words / No limit”。
- live DB `dictionary_words` 是 28,602 个词。
- API 当前返回 21,369 个词。

可能原因：`getAllDictionaryWords()` 使用 seed adapters/public/static 数据，而不是 live DB 全量表；或 adapter 去重/过滤丢掉了一批词。

影响：Lexiverse、Lexigraph 或词库星球视图可能不是全库，特别是托福/SAT 大词库覆盖会偏少。

建议：明确 Lexiverse 的数据源口径。如果产品目标是“全库星球”，应接 live DB 或生成等量缓存；如果只展示精选词，应改注释、UI 文案和统计口径。

#### 3. `/api/reading?id=morning-market` 与本地旧文章不一致

`lib/reading/articles.ts` 仍有旧本地文章 id，例如 `morning-market`，但 live API 以 question_bank 的 `normalized_word`/生成 id 为准。这个不一定影响生产页面，但会误导测试、文档或后续开发。

建议：保留一种阅读数据源，或把本地 fixture 移到明确的 test/mock 目录。

### 安全和限流

- 用户态数据 route 基本有 `authGetUser`：群组、scan、user prefs/stats/review/wrong、chat messages/sessions 等。
- 内容型公开 route 合理：dictionary、roots、questions、reading、lexiverse 等。
- `/api/ai/chat`、document-analysis、mistake-analysis、quiz-generate、study-plan、word-explain 有 `checkRateLimit`。
- `/api/ai/conversation`、`/api/ai/writing` 未看到限流。用户已明确“DeepSeek route 限流先暂时不要动”，因此本报告只列为 deferred risk，不作为本轮修复项。
- `/api/user/username-check` 公开用 service role 查用户名，建议至少加轻量限流，避免用户名枚举。
- `/api/questions` 公开返回答案。练习场景可以接受；如果用于正式考试/排行榜，应改成服务端判分或提交后返回答案。

## 词库与词汇资料

### live DB 全量统计

`npx tsx scripts/stats-all.ts` 当前输出：

| 指标 | 数量 |
|---|---:|
| 单词总数 | 28,602 |
| 中考 | 1,989 |
| 高考 | 1,924 |
| CET4 | 1,819 |
| CET6 | 2,120 |
| 考研 | 1,086 |
| 托福 | 8,038 |
| SAT | 11,625 |
| 未分级 | 1 |
| 释义条数 | 56,602 |
| 同义词 | 45,776 条，覆盖 11,282 词（39.4%） |
| 反义词 | 19,559 条，覆盖 10,461 词（36.6%） |
| 词源 | 25,459 条，覆盖 25,459 词（89.0%） |
| 词根记忆 | 26,321 条，覆盖 26,312 词（92.0%） |
| 词族 derivative | 2,014 边 |
| 形近易混 confusable | 7,032 条 |
| 同义候选 synonym-candidate | 3,072 条 |

### P0：英文释义字段几乎全是中文

只读抽查 live DB `dictionary_definitions`：

| 检查项 | 数量 |
|---|---:|
| definitions 总数 | 56,602 |
| `definition_en` 含中文字符 | 56,441 |
| `definition_en === definition_zh` | 56,465 |
| 受影响单词数 | 28,460 |
| 空 `definition_en` | 0 |

样例：

- `ubiquitous.definition_en` 是“到处存在的/普遍存在的；无所不在的”。
- `actually.definition_en` 是“实际上；竟然”。
- `conduct.definition_en` 多条也是中文释义。

影响：

- 词条页可能把中文当英文释义展示。
- `def_to_word`、英文解释、AI prompt、知识库/阅读词汇解释如果引用 `definition_en`，会得到中文。
- coverage 看起来是 100%，但真实英文释义覆盖接近不存在。

建议：

1. 数据层把 `definition_en` 和 `definition_zh` 彻底分开。没有英文释义时宁可置空/null，也不要复制中文。
2. UI 层避免渲染重复内容：如果 `definition_en` 含 CJK 或等于 `definition_zh`，展示为中文释义，不标为 English definition。
3. 题库生成层禁止把中文 `definition_en` 用作英文释义题干。
4. 加数据门禁：`definition_en` 含 CJK 比例超过阈值时 CI 失败。

### 词源、记忆、例句、搭配

| 数据 | 检查结果 | 问题 |
|---|---|---|
| 例句 | `dictionary_examples` 20,174 条；英文例句含中文 0 | 有 21 条空 sentence pair，需要清理 |
| 词源 | 25,459 条，placeholder 0 | 覆盖率高 |
| 记忆 | `word_mnemonics` 26,321 条；另有 `dictionary_mnemonics` 10,497 条 | 存在双表/命名口径不一致，需要确认 UI/API 用哪张 |
| 搭配 | `dictionary_collocations` 0 条 | 词条搭配资料为空，但题库有 collocation 题 |

`dictionary_collocations` 为空是明显数据缺口。当前 `collocation_choice` 题型有 606 行（统计口径含全部状态），但单词详情样例里的 `collocations` 为空。建议统一来源：

- 如果搭配来自 ECDICT phrases，应同步/映射到 `dictionary_collocations`。
- 如果搭配题有独立生成来源，应回填到词汇资料，避免“题里有、词条没有”。

### 同义词/反义词

`scripts/audit-relations.ts` 结果：

| 表 | 总量 | 死链 | 非法/伪造 | 自环 |
|---|---:|---:|---:|---:|
| `dictionary_synonyms` | 45,776 | 0 | 0 | 0 |
| `dictionary_antonyms` | 19,559 | 0 | 0 | 0 |
| derivative family roots | 1,551 | 0 | 0 | - |

结构层面干净，说明当前关系没有明显坏词 id 或不存在的目标词。

语义层面仍有可疑样例：

- `coherent` 的 synonyms 中出现 `tenacious`。`tenacious` 更接近“顽强/固执”，不应作为 `coherent`（连贯/一致）的强同义词。

建议：

1. 对 synonyms/antonyms 增加二级置信度字段或来源字段。
2. 对 `synonym_choice`、`synonym_substitute` 只使用高置信关系。
3. 后续可跑一次 AI/WordNet/权威词典交叉审查，输出“语义可疑关系”清单，不要自动删除。

### 坏词/错词

live DB 中没有查到此前已知坏词：

`rusia`, `guilde`, `lvory`, `aluminumal`, `distingusihed`, `phosphorusp`, `undersize d`, `oxygen o`, `iron fe`, `sulfur disoxide`。

但静态 public/reference/cache 仍有残留：

| 坏词 | 残留位置 |
|---|---|
| `rusia` | `public/lexigraph-reference/data/words-chuzhong-full.js`, `public/lexiverse-reference-v3/data/words-junior.js`, `scripts/.vocab-cache/*` |
| `guilde` | `scripts/.vocab-cache/ai-examples.json`, `scripts/.vocab-cache/ecdict.csv`, `scripts/.vocab-cache/orig-static/words-toefl.js`, `scripts/.vocab-cache/TOEFL_2.json`, `scripts/.vocab-cache/relations.json` |
| `lvory` | 同 TOEFL cache/public 原始数据链路 |
| `aluminumal` | `public/lexigraph-reference/data/words-sat-full.js`, `scripts/.vocab-cache/orig-static/words-sat.js`, `scripts/.vocab-cache/SAT_3.json`, `scripts/.vocab-cache/relations.json` |
| `distingusihed` | 同 SAT cache/public 原始数据链路 |
| `phosphorusp` | 同 SAT cache/public 原始数据链路 |
| `undersize d` | SAT cache/orig-static |
| `oxygen o` | SAT cache/orig-static |
| `iron fe` | SAT cache/orig-static |
| `sulfur disoxide` | SAT cache/orig-static |

影响：只要某些页面或脚本仍读 public/reference/cache，这些坏词可能再次出现在 Lexiverse/Lexigraph 或重建产物中。

建议：从源头词表修复后，全量重建 `public/lexigraph-reference`、`public/lexiverse-reference-v3`、`scripts/.vocab-cache`，并加坏词黑名单扫描。

## 题库与七档等级

### 当前题库矩阵

`scripts/stats-all.ts` 当前统计：159,282 题，22 种题型。

| 题型 | 中考 | 高考 | CET4 | CET6 | 考研 | 托福 | SAT | 合计 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| zh_to_word_spell | 2243 | 1772 | 1138 | 2297 | 280 | 4646 | 2200 | 14576 |
| listen_to_meaning | 2289 | 1773 | 1130 | 2306 | 282 | 4582 | 2201 | 14563 |
| dictation_spell | 2301 | 1787 | 1167 | 2304 | 277 | 4593 | 2121 | 14550 |
| def_to_word | 2217 | 1741 | 1142 | 2296 | 276 | 4631 | 2241 | 14544 |
| en_to_zh | 2252 | 1752 | 1142 | 2347 | 275 | 4526 | 2245 | 14539 |
| zh_to_en | 2224 | 1737 | 1150 | 2329 | 274 | 4555 | 2242 | 14511 |
| cloze_spell | 2205 | 1726 | 1097 | 2204 | 274 | 4542 | 2090 | 14138 |
| cloze_choice | 2167 | 1722 | 1088 | 2215 | 266 | 4457 | 2184 | 14099 |
| synonym_choice | 1908 | 1423 | 977 | 1821 | 228 | 2896 | 1735 | 10988 |
| word_form | 1825 | 1432 | 908 | 1732 | 221 | 2842 | 1184 | 10144 |
| synonym_substitute | 1489 | 1132 | 729 | 1436 | 195 | 2487 | 1564 | 9032 |
| reading_comprehension | 222 | 48 | 1131 | 394 | 274 | 986 | 1046 | 4101 |
| listening_comprehension | 301 | 254 | 93 | 347 | 1706 | 1178 | 158 | 4037 |
| confusable_choice | 1178 | 322 | 209 | 242 | 0 | 628 | 47 | 2626 |
| para_match | 0 | 0 | 251 | 216 | 174 | 0 | 0 | 641 |
| collocation_choice | 96 | 96 | 96 | 120 | 96 | 55 | 47 | 606 |
| antonym_choice | 76 | 69 | 78 | 114 | 57 | 46 | 40 | 480 |
| seven_select | 62 | 108 | 0 | 0 | 225 | 0 | 0 | 395 |
| cet_cloze | 0 | 0 | 78 | 79 | 55 | 47 | 46 | 305 |
| grammar_fill | 0 | 231 | 0 | 0 | 0 | 0 | 0 | 231 |
| cloze_passage | 60 | 22 | 0 | 0 | 19 | 0 | 0 | 101 |
| banked_cloze | 0 | 0 | 60 | 15 | 0 | 0 | 0 | 75 |

### 题库结构审查

`audit-bank` 扫描 159,282 题，结构缺陷 0：

- 空释义：0。
- placeholder “的学习含义”：0。
- placeholder “中文释义:”：0。
- deduped defect rows：0。

`validate:questions` 对本地静态 bank 只检查 24 题，不能代表 live DB。建议把 live DB 结构审查纳入 CI，不能只依赖本地 24 题。

### 等级和题型匹配问题

需要产品定义确认以下空档是否“有意为空”：

- `confusable_choice` 考研为 0。
- `para_match` 只覆盖 CET4/CET6/考研。
- `seven_select` 只覆盖中考/高考/考研。
- `grammar_fill` 只有高考。
- `cloze_passage` 只有中考/高考/考研，数量少。
- `banked_cloze` 只有 CET4/CET6，且数量少。
- `listen_to_word` 在代码类型定义或产品预期中出现过，但 live DB 题型矩阵没有该类型。

这些不一定都是 bug，但需要写成明确矩阵，否则 UI 随机抽题时会出现“某档没有题”的体验问题。

### 阅读难度

`qa-passages --judge 0` 客观指标显示整体随等级上升，但 TOEFL 的 hard-word rate 与 CET4/CET6/考研不完全拉开。建议后续用抽样 AI judge 或人工规则检查 TOEFL/SAT 阅读是否真的达到目标难度。

更关键的是 API 截断问题：active 阅读题 4038 行，约 1347 篇；页面只显示 335 篇。这个比难度微调更优先。

## Lexiverse / Lexigraph / 知识库

### Lexigraph

`npm run analyze:lexigraph`：

- Total words：363。
- Avg edges：10.53。
- Zero-edge words：0。
- Low-edge words：4（`advice`, `purpose`, `suggest`, `require`，各 3 edges）。
- Adapter warnings：262。

warnings 主要是字段覆盖不足，不是代码崩溃：

- antonyms 覆盖约 55%。
- examTags 覆盖约 57%。
- collocations 覆盖约 89%。
- tags/related 覆盖约 90%。
- CEFR 有空档。

建议作为数据增强任务处理，不要为了消 warning 伪造反义词/搭配。

### Lexiverse 等级词库覆盖

`scripts/lexiverse-level-coverage.ts`：

- Parsed ECDICT heads：14,617；matched：14,597。
- 七档 local field gaps 中，phrases 和 isolated/families 是主要缺口。
- ECDICT tag hit：TOEFL 约 49.5%，SAT 没有对应 tag。
- fake star mismatch 偏高，说明一些星级/难度推断不是权威数据。

建议：

1. TOEFL/SAT 的标签和星级不要只依赖 ECDICT tag。
2. Lexiverse 如果展示“等级宇宙”，需要明确用 live DB primary_level 还是静态 adapter level。
3. 对 isolated 高的等级补 relations 或在 UI 上避免暗示全部有关系网。

### 知识库

页面生产探针可打开。此前 XSS/崩溃问题据说已在 WIP 中修复；本轮未改文件。建议后续重点检查：

- 例句高亮是否完全用 React 渲染而不是 `dangerouslySetInnerHTML`。
- 正则高亮是否转义用户输入。
- API 返回含 HTML 的释义/例句时是否统一 escape。

## lint / 构建 / 测试基础设施

### lint 当前失败

`npm run lint` 失败，24 problems：

- `components/home/HomeScreen.tsx:59:10`：`HomeHeader` 未使用。
- 多个 `scripts/*` 使用 `any`。
- `scripts/add-missing-words.ts` 有 `prefer-const`。
- `scripts/qa-mnemonics.ts` 有 unused `STOP`。

建议：

1. 如果脚本目录也要进 CI，就修掉这些 lint。
2. 如果脚本是一次性工具，给 `scripts/**/*` 单独配置宽松规则，但不要让 lint 长期红。

### Playwright/e2e

`playwright.config.ts` 固定 `baseURL: http://localhost:3000`，并用 `npx next dev`。当前机器已有 Next dev lock 时，会被转到其他端口或启动失败。本轮没有跑官方 `npx playwright test`，改用生产服务自定义 Playwright 探针。

建议：CI 用固定端口且启动前清理 lock；本地可允许 `PORT` 环境变量。

## 给 Claude Code 的修复清单

### 第一批：会直接影响用户体验或题源正确性的 bug

1. 修 `/api/reading` 列表分页。
   - 读取全部 active `reading_comprehension`，或数据库端聚合。
   - 加 `/api/reading?level=6` 非空测试。
   - 页面 TOEFL chip 应显示约 324 篇，而不是 0。

2. 修 `/drill -> /quiz` 参数接线。
   - `LexiverseQuizClient` 读取 `level/type/drill/count/len`。
   - Drill 类型映射到 question_bank 类型。
   - 加请求断言测试。

3. 修 `/api/questions` limit。
   - 普通分支返回前也 `slice(0, limit)`。
   - 加 3 个分支测试。

4. 修 `definition_en` 数据污染。
   - 数据迁移：中文复制字段置空或回填真实英文。
   - UI fallback：CJK 或重复时不作为英文释义展示。
   - 题库生成器禁止使用中文 `definition_en` 生成英文定义题。

### 第二批：数据一致性和覆盖

5. 清理 public/reference/cache 坏词并重建。
   - 包括 `rusia`, `guilde`, `lvory`, `aluminumal`, `distingusihed`, `phosphorusp`, `undersize d`, `oxygen o`, `iron fe`, `sulfur disoxide`。

6. 统一 collocation 数据源。
   - 回填 `dictionary_collocations`，或让词条详情从 phrases/题库来源读取。
   - 搭配题与词条搭配资料必须一致。

7. 明确七档题型矩阵。
   - 对每个等级定义可用题型。
   - UI 只展示有题的题型；空档要么补题，要么标记“不支持”。

8. 统一 mnemonic 表。
   - `word_mnemonics` 与 `dictionary_mnemonics` 的职责、读写方、迁移方向要明确。

### 第三批：安全、CI 和维护

9. 修 lint 或调整脚本 lint 策略。

10. 处理 `document/extract` 的 EasyOCR trace warning。
    - 部署环境确认 Python 脚本可访问。
    - 动态导入或运行时 provider 分离。

11. `username-check` 加轻量限流。

12. AI conversation/writing 限流先记录为 deferred。
    - 用户已要求 DeepSeek route 限流暂时不要动，本项不要混入本轮修复。

13. 把 live DB 数据质量检查做成 CI/脚本门禁。
    - `definition_en` CJK 比例。
    - static cache 坏词黑名单。
    - relation dead links。
    - `/api/questions?limit=5` 数量。
    - `/api/reading` 全量篇章数和 lv6 非空。

## 最终判断

项目主流程不是“打不开”的状态；构建、TypeScript、后端回归和主要页面探针都能跑通。但数据层有几个会直接影响学习体验和可信度的问题：

- 英文释义字段污染最严重。
- 阅读 API 截断会隐藏大批文章。
- Drill 选择没有接到 Quiz 会让用户刷错题源。
- 静态坏词缓存可能把已修复的 DB 问题重新带回来。

建议先修 P0/P1，再做语义级同义/反义审查和题库难度精调。
