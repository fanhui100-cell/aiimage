# Ocean English Full Flow / QBank / Vocab Audit

Date: 2026-06-30  
Scope: 题库、词库、Today、Review、Drill、Quiz/Practice、Lexiverse、Lexigraph、mock paper、learning loop。  
Mode: 只审查，不修改运行代码；本文件为审查报告。

## 0. 结论总览

项目主链路已经比上一轮稳很多：v2 题库已可服务 active 题；模考走服务端判分；听力 active 题有 active audio；阅读/听力练习不会把听力 transcript 下发；路由文件和大多数 API 均存在；词库坏词、definition_en 污染、基础关系死链门禁通过。

但仍有几类“表面能跳、实际不一定打通”的问题，需要在上线/继续扩题前处理：

1. **Today / Review 的 v2 弱项练习按钮会把 `inference` 这类技能标签当成 `taskType` 跳转，导致练习空池。**
2. **八档统一仍有残留断点：Onboarding 仍写旧 `band=level+1`，Today 自动升档可把 SAT 用户推到 IELTS，`/quiz` 仍过滤掉 level 8。**
3. **按词练习的 v2 查询方式先抽一批 active set 再过滤目标词，容易假空池或退回 v1。词宇宙“练这个词”存在误判风险。**
4. **`qa:qsets-v2` 当前失败 2873 项，说明 QA 脚本与“已 promote 的 gen active 内容 / para_match 多对一规则”不一致；它现在不能作为可靠发布门。**
5. **learning loop 浏览器级 smoke 有 1 个失败：低样本 confidence/isEstimate 合约没有完全满足。**
6. **Practice session 为了即时反馈会把答案和整篇题 review key 下发给客户端；模考已解决答案前泄，但普通练习仍是“学习模式安全级别”，不能当防作弊考试入口。**

## 1. 已验证通过的部分

### 1.1 规格 / TypeScript / DB 基础

| 检查 | 结果 |
|---|---|
| `npm run validate:exam-specs` | pass，8 specs；IELTS 为 `coming_soon`，TOEFL/SAT 为 draft |
| `npx tsc --noEmit` | pass |
| `npm run validate:qbank-v2` | pass；active sets 1993，active items 3173，errors 0 |
| `npm run validate:data-quality` | pass；definition_en CJK 0/56602，bad words 0，synonym/antonym deadlink 0，collocations 31069 |
| `npm run validate:audio-assets` | pass；active listening sets 224，active audio rows 244，draft missing audio 400 |
| `npm run validate:learning-loop` | pass；纯函数级闭环验证通过 |

### 1.2 前后端 smoke

| 检查 | 结果 |
|---|---|
| `npm run smoke:full-routes` | pass；Today/Review/Reading/Lexiverse/Lexigraph/Knowledge/Drill/Quiz/Exam/Groups 等页面和核心 API route 存在 |
| `npm run smoke:active-serve` | pass；active stimulus 均 active；CET4 reading 有 passage；CET4 listening 有 signed audioUrl；听力 session 不下发 transcript |
| `npm run smoke:paper-e2e` | pass；全卷生成、全对得满客观分、主观题 pending、重复提交 409、未登录 401、缺卷 404 |
| `npm run validate:papers` | pass，但需较长时间；第一次 124s timeout，300s 通过 |

### 1.3 题库结构与答案形状

DB targeted audit：

- `question_sets`: 5623
- `question_items`: 6803
- active sets: 1993
- draft sets: 3630
- deprecated active: 0
- active `antonym_choice`: 0
- active `cet_cloze`: 0
- item status mismatch: 0
- bad choice answer: 0
- bad spell answer: 0

说明：choice/spell 层面的“答案可判定”是绿的；语义正确性仍需抽审和题型专门 QA，因为结构正确不等于题意唯一正确。

## 2. P1 必修问题

### P1-1 Today / Review 弱项练习跳错维度

**证据**

- `lib/daily-plan/daily-plan-engine.ts` 生成卡片时 payload 是 `{ examId, skillKey }`，`skillKey` 来自诊断弱项，例如 `inference` / `listening_inference`。
- `components/screens/TodayBento.tsx:185-190` 直接跳：

```ts
router.push(`/quiz?mode=task&examId=${examId}&taskType=${skillKey}`)
```

- `components/screens/ReviewHub.tsx:111` 同样直接跳：

```ts
router.push(`/quiz?mode=task&examId=${s.examId}&taskType=${s.skillKey}`)
```

**问题**

`skillKey` 是学习诊断维度，不是题库 `task_type`。`/api/practice/session` 需要的是 `reading_comprehension`、`listening_comprehension`、`cloze_passage` 等题型。把 `inference` 当 `taskType` 会查不到 v2 题，也无法命中 v1 fallback。

**影响**

Today 的“考试专项/薄弱技能”卡片和 Review 的 v2 弱项卡片看起来能点，但可能进入空题池。学习闭环从“诊断 → 专练”断开。

**建议**

建立 `skillKey -> taskType` 映射，至少：

- `inference/main_idea/detail/vocab_in_context` → `reading_comprehension`
- `listening_inference/listening_detail` → `listening_comprehension`
- `grammar` → `grammar_fill` 或对应考试 section
- `translation_*` → `translation_zh_en` / `translation_en_zh`
- `writing_*` → `essay_writing` / `applied_writing`

同时保留 `skillKey` 作为筛选/提示，不要塞进 `taskType`。

### P1-2 Onboarding 仍写旧 `band=level+1`

**证据**

- `components/screens/OnboardingScreen.tsx:178-181`

```ts
const band = levelToBand(s.level)
setProfile({ ..., level: s.level, band, ... })
```

- `lib/levels.ts:65-70`

```ts
export function levelToBand(level: number): number {
  return Math.min(level + 1, 8)
}
```

- `store/lexiStore.ts:763-766` 的新保护只在 `p.level !== undefined && p.band === undefined` 时把 `band=level`；Onboarding 显式传了旧 band，所以保护不会生效。

**影响**

新用户定级仍可能落入旧 band 偏移。八档统一的存储语义不干净，后续 Today 推荐、词库筛选、报告统计可能继续出现隐性错档。

**建议**

Onboarding 不再传 `band`，或直接传 `band: s.level`。`levelToBand()` 作为 deprecated helper 应只用于兼容迁移，不应再用于新 profile 写入。

### P1-3 Today 自动升档会把 SAT 用户推到 IELTS

**证据**

- `store/lexiStore.ts:526-535`：只要 `lv < MAX_LEVEL` 且达标就 ready。
- `components/screens/TodayScreen.tsx:273-280`：点击后 `next = levelUp.level! + 1`。

**问题**

现在 `MAX_LEVEL=8` 后，SAT level 7 用户达标会看到升入 level 8 的入口。可是第 8 档是 IELTS 目录档 / coming soon，并不是“SAT 更难一级”。

**影响**

这会把“目录号”和“难度升级”混在一起，用户可能被自动推到未完成 IELTS。

**建议**

升档逻辑不要单纯 `level + 1`。至少：

- level 7 不自动升 8；
- IELTS 只通过显式目标考试选择进入；
- 或用 `levelDef(next).status/autoProgressionAllowed` 控制。

### P1-4 `/quiz` 仍拒绝 level 8

**证据**

- `app/quiz/page.tsx:41`

```ts
const level = levelParam && /^[1-7]$/.test(levelParam) ? Number(levelParam) : undefined
```

**影响**

即使 Drill/Universe/未来 IELTS 页面生成 `/quiz?...&level=8`，这里也会把 level 8 丢掉，随后 fallback 到考试映射或默认 CET4 level 3。表现是“URL 看起来是 IELTS/level8，实际练的不是 level8”。

**建议**

改成 1-8，并同步清理该文件 `7 档` 注释。若 IELTS 仍 blocked，应由 exam-spec/coverage 状态决定空态，而不是 silently fallback。

### P1-5 v2 DB `exam_specs` 与 TS `EXAM_SPECS` 不一致

**证据**

DB live `exam_specs` 只有 7 行：`zhongkao/gaokao/cet4/cet6/kaoyan/toefl/sat`，无 IELTS。  
SQL schema `supabase/sql/p4-question-bank-v2.sql:26` 仍限制：

```sql
status text not null default 'draft' check (status in ('draft','active','deprecated'))
```

TS `lib/exam-specs/types.ts` 已有 `coming_soon`。

**影响**

TS 层能表达 IELTS coming soon，DB v2 规格表不能表达；后续 seed IELTS 时要么失败，要么被迫写 draft，前后端门控语义不一致。

**建议**

迁移 DB check constraint 加 `coming_soon`，并 seed IELTS spec；或者明确 v2 DB 不存 coming soon，只从 TS 读 coming soon，但不要两边混用。

### P1-6 词宇宙“练这个词”的 v2 查询容易假空池

**证据**

`lib/practice/session-builder.ts:366-390` 先取 active question_sets，并限制 set/item 数：

```ts
.eq('status', 'active')
...
const { data: setsData } = await setsQ.limit(200)
...
.in('question_set_id', setIds)
.limit(count * 4)
```

然后才在 `lib/practice/session-builder.ts:393-403` 用 `question_target_words` 过滤目标词。

**问题**

word mode 应该先按目标词查 `question_target_words`，再回查 active item/set。现在是先抽一批题，再碰运气看里面有没有目标词。

**影响**

词详情页“练这个词”可能显示空池或退回 v1，即使 v2 题库里其实有这个词的 active 题。用户会觉得词宇宙入口不稳定。

**建议**

word mode v2 查询顺序改为：

1. 根据 `wordId` 或 normalized surface 查 `question_target_words`；
2. join/filter active `question_items`；
3. join/filter active `question_sets`；
4. 再按 inputMode/task/exam/level 限制和抽样。

### P1-7 learning loop e2e 有 confidence 合约失败

**证据**

`npm run smoke:learning-loop-e2e` 结果：1 failed。

失败项：

```text
样本少 → confidence=insufficient（isEstimate 应为真，UI 不展示精确分）
```

同时脚本确认：

- wrong reading → `inference`
- wrong listening → `listening_inference`
- `skill_states` materialized 7 rows
- daily plan cards generated
- unauth attempt does not write

**影响**

学习闭环主体能写入/聚合，但“低样本只显示估算、不展示精确分”的产品约束没有被 e2e 证明。报告/诊断 UI 可能过度自信。

**建议**

检查 `skill_states` 的 attempts 聚合、confidenceFor、以及 UI 是否对 `insufficient/low` 明确显示“估算”。修好后让 `smoke:learning-loop-e2e` 全绿。

### P1-8 `qa:qsets-v2` 当前失败，不能作为发布门

**证据**

`npm run qa:qsets-v2` 失败：

- errors: 2873
- 大量 `gen set ... 不应为 active（须 QA+批准）`
- 大量 `para_match item ... 答案重复`

**判断**

这不是简单“题库全坏”，而是 QA 规则和当前生产状态不一致：

- 现在已有 1859 个 generated active set，QA 仍把任何 gen active 当错误。
- `para_match` renderer 明确支持“多对一”（同一段落可匹配多个 statement），但 QA 把重复答案全部判错。

**影响**

项目现在有一条关键 QA 命令红灯。后续 CC/CI 很容易被误导：要么忽略 QA 红灯，要么错误返工合法题。

**建议**

重新定义 `qa:qsets-v2`：

- gen active 允许条件：必须有审核/晋级标记，例如 `qa_flags.promotedBy`、`reviewed_at`、promotion RPC log。
- `para_match` 是否允许重复答案必须按题型规范区分；如果是“段落信息匹配”，多对一通常可合法；如果某模板要求一一对应，再由模板 flag 控制。
- QA 报告要分 `blocking` / `needs_review` / `policy_mismatch`。

## 3. P2 中风险问题

### P2-1 Practice session 仍前置下发答案和 review key

**证据**

- `lib/practice/session-builder.ts:455-472` 给客户端 item 下发：
  - `answer`
  - `explanationZh`
  - `review` for cloze / passageCloze / sevenSelect / paraMatch
- `components/practice/PracticeRunner.tsx:243-250` 本地用 `item.answer` 判 choice。
- `components/practice/PracticeRunner.tsx:317-318` 提交后只是把已经在 item 里的 `review` 放进 state。

**判断**

这适合“学习练习的即时反馈”，但不适合“考试防作弊”。模考 `/api/papers` 已经剥答案，这是好的；普通 `/api/practice/session` 还不是同等级安全。

**建议**

如果专练只是学习模式，可以保留，但 UI/文档要明确。若要做“挑战/限时测验/排行榜”，应走 server-submit 判分或至少答后再取 review key。

### P2-2 Paper / Practice 对 exam spec status 的使用不一致

**证据**

- `lib/papers/paper-generator.ts:286-290` 只拦 `coming_soon`。
- Drill UI 会把 draft/coming soon 任务显示为不可练。
- `session-builder` 按题池实际 active 出题，不直接看 exam spec status。

**影响**

同一个考试/section 在 Drill、Practice、Paper 三处可能出现不同空态：有的按 spec status 禁，有的按题池有无出。

**建议**

统一规则：

- `active` exam: 可从 active pool 出；
- `draft`: 仅内部/预览可出；
- `coming_soon`: 所有用户入口空态；
- 例外必须显式传 `preview=true/internal=true`。

### P2-3 `para_match` 重复答案规则需要定稿

**证据**

- `lib/practice/session-builder.ts:341` 注释写明 para_match 是“多对一”。
- `components/practice/renderers/ParaMatchRenderer.tsx` UI 也允许一个 paragraph 被多次选择。
- QA 当前把重复答案判错，导致大量错误。

**建议**

按考试类型明确：

- CET/考研长匹配若允许多个题对应同段，则 QA 不应禁止重复。
- 若某个模板确实要求每段最多用一次，则在 template/qa_flags 加 `uniqueParagraphUse: true` 再校验。

### P2-4 lint 受非运行导出目录影响

**证据**

`npm run lint` 失败来源包括：

- `stitch-export/frontend-pages-source-2026-06-26/...`
- `scripts/backfill-active-stimuli.cjs`
- `scripts/backfill-exam-id-v2.cjs`

**影响**

常规 CI/本地验证被非运行态导出和 CJS 工具脚本污染。

**建议**

- `stitch-export/` 移到 docs artifact 或加入 eslint ignore。
- CJS 脚本加针对 `.cjs` 的 eslint override，或转 ESM。

### P2-5 legacy quiz 仍有 IELTS/GRE 老映射

**证据**

`components/quiz/LexiverseQuizClient.tsx` 仍有：

```ts
IELTS: 6, GRE: 7
```

**影响**

虽然主 `/quiz` 已转 PracticeRunner，但 legacy fallback 仍可能在特殊 URL（vs/yesterday/wrong-answer-booster）中被触发。IELTS/GRE 会被误映射。

**建议**

同步清理 legacy 映射，或明确 legacy 不支持 IELTS/GRE 并显示空态。

### P2-6 部分脚本仍写死 1-7

发现：

- `scripts/migrate-question-bank-v1-to-v2.ts` regex `lv([1-7])`
- `scripts/stats-all.ts` 只统计 lv1..lv7
- `scripts/qa-passages.ts` loop `lv<=7`

**影响**

后续迁移/统计/QA 可能漏掉 IELTS level 8。

**建议**

统一从 `LEVELS` / `MAX_LEVEL` 派生，不再脚本内写死 7。

### P2-7 `validate:practice-session` 存在样本依赖

现象：

- 第一次失败：随机/样本词 `rear` 没有 target word questions。
- 第二次通过：`word("optical") source=v1 items=6`。

**影响**

这个 validator 可能因抽到的词不同而红绿不稳定。

**建议**

用固定 fixture word，或者先查有 active target word 的样本再验证；不要依赖随机词。

## 4. P3 数据和覆盖缺口

### 4.1 Canonical coverage

`npm run audit:qbank-v2-coverage` pass：

- EXPECTED matrix: 49 rows
- MISSING: 6
- THIN: 0
- READY_ACTIVE: 38
- BLOCKED: 5

MISSING：

- TOEFL `choose_a_response`
- TOEFL `listening_comprehension`
- IELTS `listening_comprehension`
- IELTS `reading_comprehension`
- IELTS `essay_writing`
- IELTS `interview_speaking`

BLOCKED：

- TOEFL `read_daily_life`: official_spec_unverified
- TOEFL `reading_comprehension`: official_spec_unverified
- TOEFL `build_a_sentence`: scoring_not_ready
- TOEFL `listen_and_repeat`: audio_missing
- TOEFL `interview_speaking`: audio_missing

### 4.2 词库八档数据

DB 统计：

- dictionary_words total: 28602
- `levels` includes 8: 6759
- `primary_level = 8`: 0

抽样：

- `quickly`: primary_level 1, levels [1,2,3,5,6], tags GAOKAO/CET-4/KAOYAN/TOEFL
- `cultural`: primary_level 1, levels [1,2,3,4,5,6,8], tags GAOKAO/CET-4/CET-6/KAOYAN/TOEFL/IELTS
- `concerned`: primary_level 2, levels [2,3,4,5,6,8]
- `criterion`: primary_level 2, levels [2,4,5,6,8]
- `vibration`: primary_level 3, levels [3,4,5,6,7,8]

**判断**

`primary_level` 保留“最早/最基础等级”语义是可以的，但所有 IELTS/8 档展示和统计必须使用 `levels includes 8`，不能用 `primary_level=8`。如果某处还按 primary_level 统计第 8 档，会显示 0。

## 5. 界面/流程打通情况

### Today

已通：

- Today pack 可调用推荐。
- v2 daily plan API 存在，卡片可显示。

断点：

- v2 exam_task 卡片用 `skillKey` 当 `taskType`，会空池。
- 自动升档可进入 IELTS。

### Review

已通：

- ReviewHub 页面存在。
- v2 diagnostics/weak skills panel 可叠加。

断点：

- 弱项练习同样用 `skillKey` 当 `taskType`。

### Drill / 专练

已通：

- 三面设计和考试专项 picker 已接 canonical specs。
- `/drill` 跳 `/quiz?mode=task&examId&taskType&level` 的主路径是正确的。

风险：

- `/quiz` level 8 丢失。
- spec status 与 paper/practice 状态规则需统一。

### Quiz / Practice

已通：

- active reading/listening 可服务。
- v2 listening 不前泄 transcript。
- attempts 可写，learning loop 纯函数验证通过。

风险：

- 普通 practice 答案/review key 前置下发。
- word mode v2 查询顺序导致假空池。
- low confidence e2e 失败。

### Lexiverse / 单词宇宙

已通：

- 词典点词进宇宙的 focusWord 问题已修过。
- 词详情 CTA 存在。

风险：

- “练这个词”依赖 word mode；v2 查询目标词方式有假空池风险。
- 如果 fallback 到 v1，v2 新题目标词覆盖不能被充分利用。

### Mock Exam / Papers

已通：

- server-authoritative paper generation/submission 通过 e2e。
- 答案不前泄。

风险：

- `validate:papers` 时间较长，CI 需给足 timeout。
- spec status 规则需统一。

## 6. 建议修复顺序

1. **修 Today/Review 弱项练习映射**：`skillKey -> taskType`，保留 `skillKey` 作为 subskill filter/提示。
2. **修八档残留断点**：Onboarding 不传旧 band；Today level-up 不自动 7→8；`/quiz` 接受 1-8；legacy IELTS/GRE 映射清理。
3. **修 word mode v2 查询**：先查 target words，再回查 active item/set。
4. **重写 qsets QA 政策**：允许已审核 gen active；para_match 重复规则模板化。
5. **修 learning-loop e2e confidence**：低样本必须 `isEstimate`，UI 不显示精确分。
6. **统一 spec status 门控**：Drill/Practice/Papers 对 `active/draft/coming_soon` 行为一致。
7. **清理 lint/CI 噪音**：ignore `stitch-export/`，处理 CJS 脚本。
8. **补覆盖缺口**：TOEFL listening / IELTS 四项 / TOEFL blocked 项按外部规格与音频决策推进。

## 7. 给 CC 的简短执行口径

不要直接扩大题库。先修流程断链和验证门：

1. TodayBento + ReviewHub：不要把 `skillKey` 直接作为 `taskType`；新增映射函数和测试。
2. 八档残留：Onboarding、Today level-up、`/quiz`、legacy quiz、脚本 1-7 全查全修。
3. session-builder word mode：改为 target-word-first 查询，补一个能证明目标词不假空池的 validator。
4. `qa:qsets-v2`：让它在当前 promoted active 状态下能真实表达错误；不要用旧政策制造 2873 假红。
5. `smoke:learning-loop-e2e` 必须全绿。

完成后再跑：

```powershell
npm run validate:exam-specs
npx tsc --noEmit
npm run validate:qbank-v2
npm run validate:practice-session
npm run validate:papers
npm run validate:data-quality
npm run validate:audio-assets
npm run validate:learning-loop
npm run qa:qsets-v2
npm run audit:qbank-v2-coverage
npm run smoke:full-routes
npm run smoke:active-serve
npm run smoke:learning-loop-e2e
npm run smoke:paper-e2e
npm run lint
```

其中 `qa:qsets-v2`、`smoke:learning-loop-e2e`、`lint` 当前不是全绿，修复后必须变绿。
