# 迭代5 · F3 各板块数据源审计报告

> 2026-06-12 · 分支 iter5-f1
> 真实源定义：词 = Supabase dictionary（14,624 词）· 关系 = word_relations · 用户状态 = lexiStore · 错题 = wrongAnswers

## 数据源前后对照

| 板块 | 之前 | 之后 |
|---|---|---|
| 考试 /exam | 题池 = 本地 store 词（levels±1 过滤已有）；store 太薄时题少 | 本地池 <10 词自动从 dictionary recommend(level±1) 补抽真词入池（ensureWord 'today-pack'/recommended）；干扰项 distractorsFor（同档释义）不变 |
| 阅读 /reading | **coming-soon 占位页**（无任何功能） | 真实阅读器：4 篇原创短文（CC0，7 档分级 2/3/4/6）；列表按**真实生词率**排序（keyWords ∩ 用户词状态）；文内词典词下划线可点 → 浮层真实词典释义中英+例句 + 「加入学习」ensureWord(source:'reading')；已读标记 localStorage |
| AI 导学 /chat | context 只发 userLevel；失败兜底 getMockAiResponse 预制假回复；硬编码 6 词正则 auto-add | 首条背景消息注入**真实学习数据**（L 档位/今日包前 10 词/薄弱词 8/最近错题 5 含错选）；删 mock 兜底（失败显示诚实错误文案）；删 6 词正则假行为 |
| 扫描 /scan | 点词入库已走 ensureWord('scan')（P5-A5）；已入库词只有 In Review 按钮态 | 词汇面板每词显示**当前学习状态 chip**（STATE_META 统一状态色，读 store） |
| 发音 /pronunciation | 练习池 = 学习中+今日包+复习（已是真词） | 池序改为 今日包 → **薄弱词** → 学习中 → 复习（spec 优先级）；评分系统 F4 实现 |

## mock/seed/DEMO 残留清单与处置

| 文件 | 运行时引用 | 处置 |
|---|---|---|
| data/mock-chat.ts | ~~app/chat~~ 已删引用 | 文件保留无引用（可后续清理） |
| data/mock-quiz.ts | 仅 lib/question-bank/question-bank-session-builder.ts | 该 builder **无任何页面消费**（死代码），不在运行时路径 |
| data/mock-words.ts | lib/dictionary/mock-dictionary-adapter.ts | **保留**：composite 词典链第 4 兜底（Supabase/seed 全不可用时离线可用），符合「离线兜底注明理由」 |
| lib/document/demo-text.ts (DEMO_RAW_TEXT) | app/scan 演示模式按钮 | **保留**：显式用户选择的演示模式，warnings 中英文明示「Demo mode」 |
| lib/document/providers/mock-*-provider.ts | document provider 链兜底 | **保留**：无 OCR/解析服务时的占位 provider，extractionMethod 标记 'mock' 可溯源 |
| data/mock-exam-questions.ts / mock-scan.ts | 无 | 死文件，不在运行时路径 |

## 验收
- 五板块展示数据全部可溯源到 dictionary/store ✓
- 新用户空态：阅读列表生词率 100%（全未学）、考试自动补抽词典词、发音池空时空状态 ✓
- npm run build 零错误 ✓
