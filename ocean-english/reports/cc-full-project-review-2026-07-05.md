# CC 全项目审查报告 - 2026-07-05

> 范围：`D:\ai-studio\ocean-english`。方法：按 `docs/cc-full-project-review-checklist-2026-07-05.md` 做基于证据的审查。
> 编排方式：8 组自动化门禁，共 29 条命令并记录退出码；12 个并行代码审查维度；除 `build_a_sentence` 外，所有 P0/P1 都做了对抗验证（`build_a_sentence` 的验证器触发会话 token 限制，见“未验证”）；另有一次 Lexiverse 单词聚焦专项深挖。
> 审查对象是**当前工作区**（包含未提交改动）和**线上 Supabase 数据**（只读）。本次审查没有修改代码，没有执行 DB reset、delete 或 promote。

## 总体结论

- **结论：条件通过 / CONDITIONAL PASS**。原 P0 `/api/mock-exam` 泄露已在代码层堵住；主要代码级安全/正确性问题已经修复并需要运行时复核。当前不再是上线阻塞状态，但仍有 P1-2 审计轨迹决策项、内容/音频生产任务、考试语境 CTA 诚实化、闭环 e2e 恢复等条件项。
- **条件项：**提交前必须完成本报告的 Fixes Applied 对照、运行时 smoke 验证，并保留 P1-2 为 owner decision。内容/音频覆盖不足不得在 UI 或报告中宣传为完整覆盖。

> 审查时点的原始结论为 **阻塞 / BLOCKED**（1 个已确认 P0 + 2 个 P1）；下方问题清单保留审查时点的原始发现与证据，修复状态见 `## Fixes Applied`。

### 验证后优先级调整

| 问题 | 初始级别 | 对抗验证后 |
|---|---|---|
| `/api/mock-exam` 泄露 answerKey 和 transcript（未鉴权） | P1 | **P0**（已确认。P0 判定不取决于 UI 是否接入；匿名 key 已复现） |
| 结构化/自由文本 `isCorrect=undefined` 污染 `skill_states` | P1 | **P1**（已确认。完整链路静态确定） |
| Playwright 复用 `:3000` 且无应用身份检查 | P1 | **P3**（已反驳。手动本地工具，不在 CI；spec 会断言应用特有标记，外部服务会明显失败） |
| `build_a_sentence` 状态漂移 | P1 | **P1**（仅审查层高置信；对抗验证器触发会话限制，见“未验证”） |

---

## 已验证通过范围

| 范围 | 证据 | 结果 |
|---|---|---|
| 基础质量门禁 | `npm run lint` exit 0，无 warning；`npx tsc --noEmit --incremental false` exit 0，无类型错误 | 通过 |
| 考试规格与题型分类 | `validate:exam-specs` 覆盖 8 个 spec，level 1-8 各一次，IELTS 为 `coming_soon`；`validate:question-types` 显示废弃题型为 antonym_choice/cet_cloze，errors 0 | 通过 |
| TOEFL 边界 | `build_a_sentence` active=0，`antonym_choice+cet_cloze`=0，speaking excluded；`validate:toefl-task-alignment` errors 0 warnings 0。注：`verify:toefl-current` pilot 期望基线已于 2026-07-05 同步（契约对象 + flag 已清 + **收紧为 draft-only** + 新增组卷器排除静态断言 3/3；draft 规模锁 10→30，承认已提交的 C3 批次 `e7e17cf`），**恢复 exit 0** | 通过 |
| 试卷 answerKey 剥离 | 对 toefl/cet4/gaokao/sat 的 full/mini/section 调用 `toClientPaper` 做线上探测：客户端 payload **不携带** answerKey，服务端保留用于判分；`smoke:paper-e2e` 14/14 断言通过 | 通过 |
| 听力原文剥离（v2/papers） | `smoke:active-serve` 通过：听力只下发签名 `audioUrl`，无 `textEn`/transcript；generator 对音频题省略 `textEn`，`toClientPaper` 再次剥离，形成双层保护 | 通过 |
| IELTS 门控 | `smoke:papers`：IELTS mini/full 都以 `exam_coming_soon` 拒绝；不会从其他考试抽 IELTS 题 | 通过 |
| 废弃/口语题型 | `validate:practice-session`：`antonym_choice` 返回空；`listen_and_repeat`/`interview_speaking` 返回受控空态；`qbank-v2-snapshot` 显示 build_a_sentence/listen_and_repeat/interview_speaking 仅 draft，active=0 | 通过 |
| QBank v2 结构完整性 | `validate:qbank-v2`：2,854 个 active sets，4,684 个 active items，errors 0；每个 active set 至少 1 个 active item；0 个 orphan active item | 通过 |
| Word Universe 来源治理 | `audit:wu-source`：active 351，其中 gen 351 / qb 0 / migrated_v1 0，badProvenance 0；`validate:wu-promote-guards` 强制拒绝非 gen 来源 | 通过 |
| 词典数据质量 | `validate:data-quality`：definition_en 中文污染 0/56,602，bad-word 黑名单 0，死链 syn/ant 0/0，collocations 31,069 | 通过 |
| Dictionary API 完整度 | `/word/[slug]` 返回 definitions/examples/inflections/syn/ant/collocations/levels；`/search` 支持 q/level/exam/prefix/pagination+total；`/relations` 支持双向关系和派生族 | 通过 |
| 单词详情查找（线上 DB） | benefit/inevitable/serendipity 都能解析并返回丰富数据；`notarealwordxyz` 返回 null 并进入友好空态；搜索 q=benefit 能定位，乱输返回 0 | 通过 |
| Lexiverse 单词聚焦（§4.5） | Dock 生成 `/lexiverse?word=&returnTo=`；`ReferenceLexiverseFrame.tsx:205-233` 解析 galaxy 并 `router.replace` 到 `?galaxy=`，iframe 从 Universe 切换到 Galaxy；`lv:focus-word` 到 `openWord` 到 `field.select` + `flyTo` + glow + card；focus-miss 显示可见提示 | 通过（静态验证） |
| iframe postMessage 安全 | 父页面 `ReferenceLexiverseFrame.tsx:237` 和 iframe `wu-bridge.js:126,234` 都校验 `event.origin`；所有 post 都指定具体 origin，没有使用 `'*'` | 通过 |
| AI 评分与音频隐私 | writing/translation/speaking 都走 rubric，并带 `isEstimate:true`；speaking **拒绝音频上传**（`400 audio_upload_not_supported`）；没有路由接收或持久化用户麦克风音频；mock/real provider 开关默认 mock | 通过 |
| 音频资产（v2） | `validate:audio-assets` / `validate:audio-pipeline` 通过，包含 no-transcript-leak 存储检查；21 个 active CET6 listening sets 都有 active hash 路径音频，缺失 0 | 通过 |
| 路由存在性 | `smoke:full-routes` 通过；checklist 中 25 个路由都能解析，2 个为预期 redirect：`/word/[slug]` 到 `/dictionary?word=`，`/exam` 到 `/drill` | 通过 |
| UI 编码 | app/components/lib/e2e 的 U+FFFD 全量扫描为 0；GBK 乱码特征扫描为 0；唯一损坏字符在一个未被 app 路由引用的 2.7MB vendored 英文文件中 | 通过 |

---

## 问题清单

### P0

**P0-1 · 遗留 `/api/mock-exam` 未鉴权泄露 answerKey 和完整听力原文**：`category: leak`，高置信，已确认（验证器用匿名 key 复现）

- 证据：
  - `app/api/mock-exam/route.ts:11`：`SEL` 包含 `answer, answer_text, audio_ref, explanation_zh`。
  - `app/api/mock-exam/route.ts:63-73`：`questions: qs` 直接返回**原始 DB 行**，没有字段剥离；`:42` 的 `GET` 没有鉴权检查。
  - `lib/supabase/server.ts:12`：路由使用 `SUPABASE_ANON_KEY`，也就是未登录请求的 RLS 角色。验证器匿名 key SELECT 返回听力行：`{answer:'a', audio_ref:"Yesterday, I found a small bird in my garden…" (219 chars, full script), explanation_zh:"细节：…"}`。
  - `lib/mock-exam/paper-specs.ts:43,53,64,74,97`：zhongkao/gaokao/cet4/cet6/toefl 都定义了 listening section；匿名 count 探测显示 zhongkao 120、gaokao 360、cet4 359、cet6 360 条 active+reviewed listening 行，因此复现样本充足。
  - `app/api/papers/route.ts:8-9`：当前新端点会剥离 answerKey；注释写明旧 `/api/mock-exam` 仍保留：“旧 /api/mock-exam 保持可用，待本 API 验证后再考虑下线”。
  - UI 未接入：在 `app/components/lib` grep `mock-exam`，只在 `lib/practice/session-builder.ts:203` 有一个注释；线上 `MockExam.tsx` 使用 `/api/papers`。这是唯一缓解因素，也是最初被归为 P1 的原因。
- 复现：`curl "http://<host>/api/mock-exam?exam=gaokao"`（无鉴权）会返回 `data.sections[listening].questions[i].answer` 答案键、`.audio_ref` 完整原文、`.explanation_zh` 解析。
- 修复：优先删除该路由，因为它已无引用；如果必须保留，就在返回前剥离 `answer/answer_text/audio_ref/explanation_zh`，只返回签名音频或 TTS handle，并对齐 `app/api/papers` 的 `toClientPaper`。**上线阻塞。**

### P1

**P1-1 · 结构化和自由文本练习记录 `isCorrect=undefined`，污染 `skill_states` 和错误类型**：`category: correctness`，高置信，已确认

- 证据：
  - `components/practice/PracticeRunner.tsx:312,329`：`submitFree` / `submitStructured` 对 multi_blank/matching/build/free_text 调用 `postAttempt(item, answer, undefined)`；带分数的路径 `finishQuestion -> postAttempt(..., correct)` 在 `:222`，**只用于** choice/spell。
  - `lib/practice/attempt-recorder.ts:93`：`is_correct = input.isCorrect ?? null`，因此写入 **NULL**。
  - `lib/learning-loop/error-classifier.ts:54`：`if (input.isCorrect) return null`；`undefined` 为 falsy，会继续落到 `TASK_TO_ERROR`，例如 cloze_passage 到 `grammar`，banked_cloze 到 `collocation`，seven_select 到 `inference`，para_match 到 `main_idea`，从而写入虚假错误类型。
  - `lib/learning-loop/skill-state-writer.ts:34`：`isCorrect: r.is_correct === true` 把 NULL 映射为 false；`skill-state-updater.ts:51-60` 会把 mastery 拉向 0；`:87` 的 `weakSkills`（阈值 0.6）随后把本来答对的技能标为弱项，污染 daily-plan 和 diagnostics。
  - 正确信号本来存在但被丢弃：`MultiBlankRenderer.tsx:81/207`、`PassageClozeRenderer:127`、`SevenSelectRenderer:202`、`ParaMatchRenderer:127` 已经为展示计算 correctness，但没有传回 attempt。
  - DB 确认这些任务类型就是 multi_blank/matching：cloze_passage 150，seven_select 100，banked_cloze 108，grammar_fill 98（multi_blank）；para_match 150（matching）。
- 复现：登录用户访问 `/quiz?mode=task&examId=cet4&taskType=cloze_passage&level=3`，所有空都答对，每次 `POST /api/practice/attempts` 仍会得到 `is_correct=null`、`error_type='grammar'`；`persistSkillStates` 会按错误聚合，降低 mastery；diagnostics 会错误标弱。P2-4 的结果页问题是同一根因的 UI 表现。
- 修复：把 renderer 计算出的整体 correctness 传入 `postAttempt`；真正不可判分的题型要显式标记 `is_correct`；`error-classifier` 遇到 `isCorrect === undefined` 时返回 null；`skill-state-writer` 对 `is_correct` 为 null 的行应跳过，而不是当错题处理。

**P1-2 · `build_a_sentence` 历史状态漂移（已决策并对齐审计轨迹）**：`category: report-consistency`，运行时已确认

- 审查时点发现（历史证据，保留供追溯）：
  - 两份 07-05 报告当时声称“scoring-ready 行：0 / 保持 blocked 10/10 (scoring_not_ready=true) / dry-run eligible 0 · rejected 10 / DB 写入 0”。
  - service-role SELECT `question_sets` 中 `task_type=build_a_sentence`：总数 10，全部 `draft`，但所有 10 条的 `scoring_not_ready` 都已清除，`qa_flags.scoringContract=accepted_sequence_exact` 已存在——flag 已清、契约已应用，与报告声称相反（promote dry-run 实际 eligible 10）。
- 影响范围：**可控**。这些 set 全程保持 `draft`，`paper-generator` 按 task type 排除 `build_a_sentence`，server activation RPC 仍然把关。缺陷从来不是线上泄露，而是审计轨迹与 DB 不一致。
- **处置（owner 决策，2026-07-05）：接受现状，不回滚 DB，不 promote，不激活。**审计轨迹已对齐：
  - 契约数据与 apply 报告（`data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json`、`reports/build-sentence-accepted-sequences-apply-report.json`）及 `reports/promote-qsets-v2-report.json`（eligible 10 现状）**均已入库**（commit `35cd668`），不再有未记录写入。
  - 两份 07-05 报告顶部已加“状态订正 + 已决策”横幅，正文历史声称保留但已被横幅覆盖说明。
  - 运行时复核与收尾（2026-07-05）：pilot 期望基线**已同步**——契约对象逐字段断言（canonical 锚定源记录 + acceptedSequences 与已审定契约一致）、`scoring_not_ready` 须已清除、status **收紧为 draft-only**（旧基线允许 active）、新增组卷器 `PAPER_EXCLUDED_TASK_TYPES` 静态断言、draft 规模锁更新 10→30（承认已提交 C3 批次 `e7e17cf`，20 条同为 contract-ready draft）。`npm run verify:toefl-current` **恢复 exit 0**。
  - **仍然禁止对 `build_a_sentence` 执行 `promote --apply`**，直至 owner 明确批准激活且 server RPC 确认行为。

### P2

**P2-1 · 词形变化卡片直接显示原始 key “pp”/“ing”，没有中文标签（所有动词）**：`word-forms`
- `DictionaryVaultScreen.tsx:58` 的 `FORM_ZH` 缺少 `pp`/`ing`；`:217` 使用 `FORM_ZH[k] ?? k`，因此显示原始 key。DB 中确实使用 `pp`/`ing`（样例 `run={pp:run, ing:running, past:ran, third:runs}`；2000 词样本 pp=236、ing=232）。当前会显示 “pp run / ing running”，预期应是“过去分词 / 现在分词”。
- 修复：给 `FORM_ZH` 增加 `pp -> 过去分词`、`ing -> 现在分词`。这是纯标签映射问题，数据本身正确。

**P2-2 · LexiGraph 反义 / ANTONYM 区域结构性为空**：`relations-consistency`
- `app/api/dictionary/relations/route.ts:43-98` 只查 `word_relations`，而其中 antonym 行为 0；真正的 `dictionary_antonyms` 有 19,524 行，但未被读取。`LexiGraphScreen.tsx:96-98` 只从 `type==='antonym'` 填充 ant sector，因此永远是 “—”，即使 `/dictionary?word=ability` 能显示反义词。
- 修复：在 `/relations` 中合并中心词的 `dictionary_antonyms`，或让 LexiGraph 像 DictionaryVault 一样使用 `word.antonyms`。

**P2-3 · “派生词族 · Family” 卡片显示近义词和搭配，不是真派生词；小图也把 derivative 错染成近义**：`word-forms`
- `DictionaryVaultScreen.tsx:363-367` 的“派生词族”来自 `synonyms` + `collocations`，没有使用 derivatives。真实 `word_relations type='derivative'` 有 2,014 行，例如 strict -> strictly，在 LexiGraph 中能正确渲染为词形。`:172` 的 `relKind()` 把 `derivative` 映射成 `syn`，导致派生词显示为绿色近义，而不是金色词形/派生。
- 修复：把 `/relations` 的 derivative payload 接到 Family 卡片；给 derivative 单独的 `relKind`，例如 `form`/gold。

**P2-4 · 结构化/自由文本 session 的结果页显示 0/total，并虚假提示错题已保存**：`correctness`，与 P1-1 同根因
- `PracticeRunner.tsx:188-223` 的 `finishQuestion` 是唯一会 append 到 `S.results` 并调用 `addWrongAnswer` 的路径，但只被 choice/spell 调用；structured/free submit 从不调用它。结果环会显示 0/total、+0 XP；`:419-426` 的 banner “{wrong} 个错词已存入错词本”会出现，但 `addWrongAnswer` 实际没有运行。
- 修复：为 structured/free item 记录逐题结果，或明确标记为 ungraded/excluded；只有在 `addWrongAnswer` 真正运行时才显示错题本提示。

**P2-5 · 核心 vocab/word-drill 题型没有 v2 池，只能走 v1，attempt 不会进入服务端记录**：`coverage`
- en_to_zh/zh_to_en/cloze_choice/cloze_spell/synonym_substitute/listen_to_meaning/dictation_spell/word_form/zh_to_word_spell 没有 active v2 set。`attempt-recorder.ts:73-77`：v1 item 没有 `questionItemId`，会返回 `v1_attempt_no_v2_target`，不会插入 `question_attempts`，因此这些 session 不会进入 skill_states/diagnostics，只进入客户端 lexiStore SRS。
- 修复：为核心 vocab 类型补 v2 池；或按 `legacyQuestionId` 持久化 v1 attempt；或在产品上明确披露这些练习只是 practice-only，不进入诊断。

**P2-6 · v2 单词级题库很薄：只有 255 个词（0.9%）有 active v2 target-word linkage，且全部来自 Word Universe**：`completeness`
- `question_target_words` 到 active item+set 的数量为 351，distinct `word_id` 只有 255，占 28,602 个词的 0.9%，且仅为 `synonym_choice/confusable_choice/def_to_word`（各 117）。阅读、听力、cloze、写作 set 没有贡献任何 active target-word link。`session-builder.ts:609-617`：先取 v2，否则 `buildFromV1`；v1 有 165,380 条 active+reviewed 行。结论：非 WU 词基本都由 v1 提供，**word-mode 对约 99% 的词来说仍是 v1 loop，不能称为完整 v2 word loop**。
- 修复：不要把 word-mode 描述成完成的 v2 loop；要么从考试内容 set 回填 `question_target_words`，要么明确说明非 WU 词的 per-word practice 是 v1-first；把 distinct-v2-word coverage 作为显式指标追踪。

**P2-7 · “考试语境 / EXAM CONTEXT” CTA 是死 lens：实际与普通练习完全相同，还过度承诺 cloze/exam-style items**：`misleading-cta`
- `word-practice-links.ts:19` 生成 `/quiz?word=<id>&mode=exam-practice`，但 `app/quiz/page.tsx:52` 的 `if (word) return {mode:'word', word}` 早于 `:79` 的 `mode==='exam-practice'` 分支，因此 `mode` 被丢弃。两个 CTA 得到完全相同的 word session。`WordPracticeActions.tsx:117` tooltip 承诺 “cloze · 同义 · 辨析”，但约 99% 的词没有对应 per-word v2 bank。Badge “本词题库就绪”只由 `poolEmpty` 驱动，只要 v1 有 item 就为真。
- 修复：让 exam-context lens 真的生效，在 `mapToRunnerProps` 中处理 `mode==='exam-practice'` 且带 `word` 的情况；或合并两个 CTA 并移除 tooltip 承诺。当前没有泄露或随机题风险，因为两者走同一个 word pool。

**P2-8 · 等级/字母浏览中点击多词条目会进入空态（词存在但跳转 slug 错）**：`bad-jump`
- `DictionaryVaultScreen.tsx:607-608` 使用带空格 lemma 跳转（`dw.word.toLowerCase()`），但 id 是连字符形式，例如 `carbon dioxide` 的 id 是 `carbon-dioxide`；lookup 使用 `.eq('id', slug)`（`supabase-dictionary-client.ts:280`）。共有 24 个多词条目。`lookupWord('carbon dioxide')` 返回 null，`lookupWord('carbon-dioxide')` 正常。
- 修复：跳转使用 `dw.id`，不要用带空格 lemma（`:627` 也同样处理）。

**P2-9 · 存在两套分裂的单词详情体验；`/lexiverse/word/[slug]` 已孤岛化，缺词时硬 404**：`inconsistency`
- `app/lexiverse/word/[slug]/page.tsx:12` 中 `if (!word) notFound()`，触发 Next 404；主详情体验会显示友好空态。主 Lexiverse flow 链到 `/dictionary?word=`（`ReferenceLexiverseFrame.tsx:269`），不是这个页面；它的入口基本只有自己页面里的 chip。它还是一套暗色 cosmic UI，而主词库是 light vault；Back 返回 `/lexiverse`。
- 修复：像 `/word/[slug]` 一样把 `/lexiverse/word/[slug]` redirect 到 `/dictionary?word=[slug]`；或者至少把 `notFound()` 改成友好空态。

**P2-10 · `closed-loop.spec.ts` 全部禁用（4/4 `test.fixme`），被审查的闭环没有任何运行中的 e2e 覆盖**：`test-coverage`
- `playwright test --list`：closed-loop.spec.ts:48/136/169/205 都是 `test.fixme`；grep 统计 5 个 fixme（这里 4 个，learning-loop.spec.ts:115 1 个）。被跳过的正是本次审查重点闭环：detail↔graph↔universe、宇宙内 SRS grading、错题红边、celebrate cruise。`:203-204` 还引用了过时文案“在词图中展开”/“在宇宙中查看”。
- 修复：基于当前 UI 重写 4 个 fixme case（dock button + v3 iframe 用 `frameLocator`），让这些闭环进入回归覆盖；不要弱化断言。按照 checklist，skip 本身就是**测试缺口**，不能算通过。

**P2-11 · Active listening audio 只存在于 CET6；其他 active 考试的听力 section 为空或降级到 TTS**：`coverage`
- active v2 listening set 只有 `cet6 lv4 = 21`。`specs.ts:34/59/86/164` 声明 zhongkao/gaokao/cet4/toefl 都有 active listening 且 `requiresAudio:true`。`paper-generator.ts:252` 会跳过无音频 listening set，导致 `buildSection` 返回 empty + `insufficient_pool`；`session-builder.ts:82,98` 的 v1 fallback 使用统一浏览器 TTS。TOEFL 4-accent pool（`voice-pools.ts:15-24`）没有被使用，因为 TOEFL listening audio active=0。
- 修复：把 active listening audio 扩展到 zhongkao/gaokao/cet4/toefl；或在 mock UI 中明确披露这些考试听力暂不可用（现在只是未展示 warning）。在 TOEFL listening audio 存在前，不能声称 TOEFL 口音区分已经可用。

**P2-12 · 错题红边（共错红边）可视化孤岛化：`/lexigraph` iframe 原型没有接回错题本→再练→状态变化视觉闭环**：`product-loop-gap`
- `components/lexigraph-v2/LexiGraphScreen.tsx` 没有 importer（grep exit 1）；`app/lexigraph/page.tsx` 渲染 `LexiGraphFrame`（public/lexigraph-reference iframe），该 iframe 不再暴露 `[data-wrong-edges]`。`closed-loop.spec.ts:166-168` 也记录了这点。
- 修复：在 iframe/bridge 中重新暴露 wrong-edges，并恢复 closed-loop 第 3 个测试；或正式下线该功能并移除孤立组件和过时测试。

**P2-13 · `/api/ai/writing` 和 `/api/ai/conversation` 会真实调用 DeepSeek，但没有 rate limit**：`abuse-cost-safety`
- `app/api/ai/writing/route.ts:15-34` 和 `app/api/ai/conversation/route.ts:27-56` 从 key check 直接进入 `fetch('https://api.deepseek.com/...')`，没有先调用 `checkRateLimit`；其他 6 个 AI route 和 3 个 scoring route 都先调用了 `checkRateLimit`。当 `DEEPSEEK_API_KEY` 设置后，这是匿名成本/滥用风险。
- 修复：在两个 POST handler 顶部加 `checkRateLimit(rateLimitKey('ai-writing'|'ai-conversation', getClientIP(req)), LIMIT)`。

### P3

- **P3-1 · SAT/TOEFL task practice 未显式传 `taskType` 时，会出现中文释义式孤立词汇练习（仅 API 路径）。** `session-builder.ts:462-478` 的 set-first 查询只过滤 `status=active + exam_id`，WU drills（exam_id=sat/toefl, section_id=null）会进入候选，违反 SAT spec “Words in Context，非孤立同义词”（`specs.ts:188`）。UI 的 `ExamTaskPicker` 总是传 spec `taskType`，所以不可从正常 UI 到达；只有直接请求 `/api/practice/session?mode=task&examId=sat` 且不带 taskType 时会出现。修复：在 set-first 分支中把 `task_type` 限定为该考试 objective section 的 taskTypes。
- **P3-2 · `specs.ts:8` 头部注释过期，仍写 TOEFL/SAT 为 `status='draft'`，**但 `:158/:185` 已经是 `'active'`。更新注释。
- **P3-3 · `difficulty_band` 在 6/7 个考试中 100% 为 null 且未使用**，`lib/` 无消费方，`paper-generator` 中也没有 difficulty 引用。当前难度只是按 level 做结构区分。要么填充并接入，要么记录为 deprecated。
- **P3-4 · 大多数 active v2 set 每 set 只有 1 个 item**，WU + word-linked 类型平均 1，导致 per-word 深度较浅、重复性强。应增加每词 item 深度，并在 coverage audit 中展示 pool depth。
- **P3-5 · 缺词空态会渲染整套假详情脚手架和无效“加入学习库”CTA。** `DictionaryVaultScreen.tsx:376/407/418` 对不存在的词仍渲染 mnemonic/etymology/AI placeholder；`:249` 的 `onAdd` 被 `if(word)` guard 掉，点击静默无效。应改成紧凑 not-found card。
- **P3-6 · 等级浏览（`syllabus=full`）在高等级中会先展示基础词**，因为 `.contains('levels',[n])` 后按 `frequency_rank` 排序，多等级词携带所有 tag。应在 band 内按 primary_level 排序，或给 UI 加说明。
- **P3-7 · 模考结果缺少“弱项→推荐练习”跳转；drill 的“去复习薄弱词”回到配置页而不是复习页。** `MockExam.tsx:483-486` 的结果没有 practice CTA；`DrillScreen.tsx:348-349` 把 `onReview` 连到 `setPhase('config')`。应增加 weak-section practice CTA，并把 `BResult.onReview` 路由到 `/memory`。
- **P3-8 · TOEFL writing section 通过 `placeholder.taskTypes` 把已排除的 `build_a_sentence` 字符串泄露到客户端 payload。** `paper-generator.ts:348` 设置 `placeholder.taskTypes = sec.taskTypes` 时未过滤，而候选抽题在 `:343` 已过滤。这里只是元数据，没有 answerKey/question 泄露；如果 UI 把 placeholder.taskTypes 渲染成“已覆盖任务”，则升级为 P2。修复：使用同一 excluded-type predicate 过滤。
- **P3-9 · 死代码 `LexiverseShell` + `PlanetDetailPanel` 带过期路由注释。** `PlanetDetailPanel.tsx:12` 声称 `/word/[slug]`，但当前 live route 使用 iframe。删除，或接到 build switch 后面；修正过期注释。
- **P3-10 · live galaxy planet card 没有 per-word `/quiz?word=` 跳转**，而是使用 iframe 内 review pod，后者确实写入真实 SRS。`wu-ui.js:465-467`。这可能是设计选择，但需要对齐 spec §4.6 与实现。
- **P3-11 · focus-miss fallback 会落到第一个 galaxy，但提示写“已带你到它所属星系”。** `ReferenceLexiverseFrame.tsx:212-213` 中 `target = gid || referenceGalaxies[0]?.id`。应去掉 fallback，或弱化文案。
- **P3-12 · 07-04 的总结仍声明 `paperReady=false` / 项目未完成，但已被 07-05 覆盖且未标记。** `reports/qbank-production-final-summary-2026-07-04.md:10,119`、`self-review-audit-2026-07-04.md:33,37`。应加 “SUPERSEDED by …-2026-07-05” 横幅。
- **P3-13 · `public/lexiverse-reference-v3/data/words-toefl.js` 有 1 个 U+FFFD。** 它位于英文 Daguerre bio 中，替代了一个 en-dash；该文件是未被 `app/` 路由引用的 2.7MB vendored 文件。可以删除死资产或修字符。非上线阻塞。
- **P3-14 · v1 listening fallback 会把完整 transcript 放进 `item.audio.url`。** `session-builder.ts:98` 用它做 TTS source，不会在答题前显示，也不在 `validate-audio-assets` 覆盖范围内。对学习模式可接受，但绝不能把 `buildFromV1` 接入防作弊/mock surface；应扩展 validator，断言 v1 listening 不把 transcript 放到客户端字段中。
- **P3-15 · AI 输出没有过滤逐字版权复现。** 当前只有 prompt instruction，`docs/copyright-compliance.md:30-31,120-128` 的 output-filtering 未落实。规模化启用真实 AI 输出前，应实现文档中写的过滤和用户举报机制。

---

## 单词系统审查

- **Dictionary -> detail：**绿色。统一到 `/dictionary?word=<slug>`（`DictionaryVaultScreen`）；`/word/[slug]` 会 redirect 到这里。线上 DB 验证 benefit/inevitable/serendipity 可解析；`notarealwordxyz` 进入友好空态；搜索、字母浏览、等级浏览、syllabus 浏览分页稳定。**缺口：**24 个多词条目使用带空格 lemma 跳转，导致空态（P2-8）。
- **Detail -> Lexiverse：**绿色（端到端静态验证）。**会落到该词自己的星球/星系视角，而不是普通宇宙总览。** Dock 到 `/lexiverse?word=&returnTo=`；`ReferenceLexiverseFrame.tsx:205-233` 解析单词所属 galaxy 并 `router.replace` 到 `?galaxy=`，iframe 从 Universe 切到 Galaxy；galaxy ready 后发送 `lv:focus-word`，再到 `openWord`、`field.select`、`flyTo`（镜头飞入）、glow marker 和完整 word card；单词不在 galaxy 时显示可见 amber focus-miss chip；`returnTo` chip 可回到词库当前词。**未用浏览器验证：**实际 WebGL camera/glow 渲染效果；但代码路径完整。**P3：**focus-miss fallback 文案问题（P3-11）。
- **Lexiverse -> dictionary / lexigraph / quiz：**绿色。Planet “open entry” 到 `/dictionary?word=`；“词图”到 `/lexigraph?word=`；review pod 写真实 SRS；iframe postMessage origin 校验。**P3：**galaxy card 没有 per-word `/quiz?word=` 跳转（P3-10）。
- **Detail -> quiz：**基本绿色，但有一个缺陷。“练这个词”到 `/quiz?word=&returnTo=`；当 word pool 为空时 practice button 为 `aria-disabled` 且无 href，不会随机 fallback。**缺陷：**“考试语境” CTA 因 `quiz/page.tsx:52` 在看到 `?word=` 后丢弃 `mode=exam-practice`，最终与普通 session 完全相同（P2-7）。
- **Forms/derivatives：**有缺陷。词形数据正确，但标签损坏（“pp”/“ing”，P2-1）；“派生词族”卡片展示 synonyms/collocations，而不是真 derivatives，并且颜色分类错误（P2-3）；form-chip 跳转逻辑本身避免了 404（500+200 样本中 chip 都能解析到真实词）。
- **Synonyms/antonyms：**混合。Dictionary detail 的近义/反义 chip 100% 能解析到真实词；缺失时降级为空态。**不一致：**LexiGraph 的反义 sector 永远为空，因为 `/relations` 不读取 `dictionary_antonyms`（P2-2）。
- **Empty state：**主体验绿色，`notarealwordxyz` 进入友好空态；但孤岛页面 `/lexiverse/word/[slug]` 会硬 404（P2-9），主空态还会过度渲染假脚手架和无效 CTA（P3-5）。

---

## 题库 / 考试审查

- **等级匹配：**绿色。8 个考试 spec 模型一致，level 1-8，IELTS coming_soon，SAT 限定为 4 个 Digital R&W domain，kaoyan 无 listening/speaking。内容抽样确认结构难度递进：zhongkao 140 词叙事 < CET-6 306 词学术；TOEFL/SAT 是 authentic-style，没有中文考试风格题泄入 TOEFL/SAT paper。**P3：**`difficulty_band` 未使用（P3-3）；SAT/TOEFL 无 taskType 的 API-only 路径会出现 off-spec vocab drills（P3-1）。
- **题型架构：**绿色。2,854 个 active sets，4,684 个 active items；废弃题型 antonym_choice、cet_cloze 均为 active 0 且 draft 0；blocked/deferred 的 build_a_sentence、listen_and_repeat、interview_speaking 仅 draft，active 0，因此不会进入练习/mock。`audit:qbank-v2-coverage` 报 MISSING 4 / BLOCKED 3，这是非阻塞覆盖缺口。
- **TOEFL：**绿色。Mock v1 只开放 reading/listening/writing；`excludeFromPaper=speaking_pipeline_not_ready`；`build_a_sentence` 已排除，active=0。**P3：**placeholder.taskTypes 元数据仍列出 build_a_sentence（P3-8）。**P1：**`build_a_sentence` 审计轨迹漂移（P1-2）。**P2：**TOEFL listening audio 尚无 active（P2-11）。
- **IELTS：**绿色。状态为 `coming_soon`；`smoke:papers` 对 mini/full 都以 `exam_coming_soon` 拒绝；不会从其他考试抽题；lv8 vocab primary=0，与状态一致。
- **SAT：**绿色。只包含 Digital R&W，没有 math/essay/listening/speaking；单文本题型 authentic，干扰项干净且单正确。**P3：**无 taskType 的 API-only 路径可出现 WU vocab drills（P3-1）。
- **Word Universe：**绿色。active 351，100% `gen:` 来源，qb 0，badProvenance 0；promote guards 拒绝非 gen。**但**它是 active per-word v2 linkage 的唯一来源，只有 255 个词（0.9%），因此 word-mode 对约 99% 的词仍是 v1（P2-6）。

---

## 用户闭环审查

- **Onboarding -> today：**绿色（代码层）。`validate:learning-loop` 可生成 plan cards（word_review/mistake_fix/exam_task/new_words/output）；goal -> today -> learn -> practice -> feedback 已接通。
- **Learn -> quiz：**choice/spell 判分绿色。**P1：**structured/free-text 会污染 skill_states（P1-1），结果页显示 0/total（P2-4）。
- **Wrong answers：**部分通过。choice/spell 错题会进入错题本；structured/free-text 会虚假声称进入错题本（P2-4）；wrong-edge 可视化孤岛化（P2-12）。
- **SRS：**客户端绿色，grade -> interval -> nextReviewAt -> getDue 正常；review pod 和 memory queue 写真实 SRS。服务端 skill-state 累积被 structured/free-text 污染（P1-1），且 v1-only vocab drills 不写入服务端（P2-5）。
- **Mock paper：**绿色且安全。`smoke:paper-e2e` 14/14，通过 full-correct 110/110、subjective -> needsManualOrAi、duplicate submit 409、unauth 401、missing 404；服务端权威判分，会重新取答案，不信任客户端。**P2：**非 CET6 listening section 为空（P2-11）。
- **Diagnostics：**机制绿色，包括 error-typing、skill_states materialization、low-sample estimation；但输入会被 structured/free-text 污染（P1-1）。Mock result 缺少 weakness -> practice 跳转（P3-7）。
- **Scan：**绿色（代码层）。Scan 保存到 history，并有 no-file-storage 隐私说明；extract -> add-to-learn/practice 已接通。

---

## 已运行命令

以下 29 条门禁命令均 exit 0。“warn” 表示命令退出 0，但发现了非阻塞缺口。

| 命令 | Exit | 说明 |
|---|---:|---|
| `npm run lint` | 0 | 通过：无 warnings/errors |
| `npx tsc --noEmit --incremental false` | 0 | 通过：0 个类型错误 |
| `npm run validate:exam-specs` | 0 | 通过：8 个 specs，IELTS coming_soon，errors 0 |
| `npm run validate:question-types` | 0 | 通过：废弃 antonym_choice/cet_cloze，errors 0 |
| `npm run validate:rubrics` | 0 | warning：IELTS writing/speaking rubric 缺口（coming_soon，controlled-reject） |
| `npm run validate:toefl-task-alignment` | 0 | 通过：errors 0 warnings 0 |
| `npm run verify:toefl-current` | 0 | 通过（2026-07-05 基线同步后）：pilot 契约断言 10/10（accepted_sequence_exact + flag 已清 + draft-only 收紧）、build_a_sentence draft=30（10 pilot + 20 C3 `e7e17cf`）/active=0、组卷器排除静态断言 3/3。此前曾 exit 1（旧 scoring_not_ready/legacy-answer 基线与 P1-2 已决策契约现状不符，见 P1-2 处置记录） |
| `npm run validate:qbank-v2` | 0 | 通过：2,854 active sets / 4,684 items，errors 0 |
| `npm run qa:qsets-v2` | 0 | 通过：32 templates，errors 0 |
| `npm run validate:coverage-audit` | 0 | 通过：fixtures 与 report cross-check 全部通过 |
| `npm run audit:qbank-v2-coverage` | 0 | warning：MISSING 4 / BLOCKED 3 / 88 active-pool warnings（非阻塞） |
| `npm run audit:vocab-levels` | 0 | warning：lv8 IELTS primary 0（预期）；illegal levels 0 |
| `npx tsx scripts/qbank-v2-snapshot.ts` | 0 | 通过：speaking/build_a_sentence 仅 draft |
| `npm run validate:papers` | 0 | 通过：errors 0；toefl full 13.2s |
| `npm run smoke:papers` | 0 | 通过：7 个 active exams 可生成；IELTS refused |
| `npm run smoke:paper-e2e` | 0 | 通过：14/14 assertions |
| `npm run validate:practice-session` | 0 | 通过：deprecated/speaking -> controlled empty |
| `npm run smoke:active-serve` | 0 | 通过：signed audio，无 answerKey/transcript leak |
| `npm run smoke:learning-loop-e2e` | 0 | 通过：error-typing + skill_states + daily-plan |
| `npm run validate:learning-loop` | 0 | 通过：errors 0 |
| `npm run validate:dictionary` | 0 | 通过：344 seed words，errors 0 warnings 0 |
| `npm run validate:data-quality` | 0 | 通过：中文污染 0，dead links 0 |
| `npm run analyze:lexigraph` | 0 | warning：262 adapter warnings，4 low-edge words（非阻塞） |
| `npm run validate:audio-assets` | 0 | 通过：0 errors |
| `npm run validate:audio-pipeline` | 0 | 通过：包含 no-transcript-leak storage check |
| `npm run review:audio-assets` | 0 | 通过：hash-only storage paths |
| `npm run audit:wu-source` | 0 | 通过：active 351，gen 351，qb 0，badProvenance 0 |
| `npm run validate:wu-promote-guards` | 0 | 通过：强制拒绝 non-gen |
| `npm run smoke:full-routes` | 0 | 通过：全部路由存在，0 deprecated active types |

额外执行了只读 DB 探测（anon + service-role SELECT），用于复现 P0 泄露、确认 target-word coverage（255/28,602）、inflection keys、antonym-table rows（19,524）和 build_a_sentence 状态。

---

## 未验证

| 范围 | 原因 | 下一步 |
|---|---|---|
| 浏览器真实渲染（Lexiverse WebGL camera/glow、实际 404 页面、redirect runtime） | 本次审查没有启动 dev server 或浏览器，只做了只读静态代码 + DB 审查 | 在**非 3000** 端口运行 `next dev`，并实际驱动 `/lexiverse?word=accept`、`/dictionary?word=notarealwordxyz`、`/word/benefit` |
| Playwright e2e suite 执行 | 需要运行中的 server；且 `closed-loop.spec.ts` 4/4 都是 `test.fixme`，本次审查的闭环即使跑也不会执行 | 增加 app-identity globalSetup，重写 fixme cases，然后运行 `npx playwright test` |
| ~~`build_a_sentence` 对抗验证~~（已于 2026-07-05 运行时确认并决策） | 专项对抗验证器当时触发会话 token 限制未返回；**post-review 复核已运行时证实**：`npm run verify:toefl-current` exit 1，pilot 校验报 10 条 `build_a_sentence` "缺 scoring_not_ready" + "answer 不一致"，即 flag 已清除、契约已应用（仍全部 draft、active=0）。P1-2 由高置信升为**已确认** | **owner 已决策（2026-07-05）：接受现状，不回滚，不 promote，不激活**；产物已入库（`35cd668`）；pilot 期望基线已同步，门禁**已恢复 exit 0** |
| dictionary/practice/relations 的 HTTP route 行为 | 需要运行 server；本次是从 route 代码、底层 client 和 DB read 推理 | 对运行中的 server 请求 `/api/dictionary/word/benefit`、`/api/practice/session?mode=word&word=benefit`、`/api/dictionary/relations` |
| 音频主观质量（口音、语速、考试场景匹配） | 已验证存在性、签名和无泄露，但没有实际听音频 | 等非 CET6 listening audio 存在后，每个考试抽样试听 |
| 真实 DeepSeek provider 行为 | 当前环境没有实际调用 live API key；只验证了 mock/real switch 结构 | 在 staging 中加入 rate limit 后 smoke 真实 provider 路径（P2-13） |
| 性能计时（§11） | 本次没有运行 `Measure-Command`；generator 计时只是顺带捕获：`validate:papers` 中 toefl full 13.2s、mini 8.5s | 运行 `Measure-Command { npm run validate:papers }` / `{ npm run smoke:papers }`，并浏览器抽样 `/dictionary?word=` first-paint |

---

## Fixes Applied

| Finding | Status | Files / evidence | Verification |
|---|---|---|---|
| P0-1 `/api/mock-exam` 泄露 answerKey/transcript | Fixed in code | `app/api/mock-exam/route.ts` narrows `SEL` to non-answer fields only | Runtime smoke required: response must not contain `answer`, `answer_text`, `audio_ref`, `explanation_zh` |
| P1-1 / P2-4 ungraded attempts corrupt mastery/results | Mitigated in code | `error-classifier.ts` only classifies explicit wrong answers; `skill-state-writer.ts` skips `is_correct=null`; `PracticeRunner.tsx` scores only graded results | `npm run validate:practice-session`; manual structured/free-text smoke |
| P2-1/P2-3/P2-8 dictionary forms/family/jumps | Fixed in code | `DictionaryVaultScreen.tsx` adds `pp/ing` labels, true derivative family, id-based multi-word navigation | Manual dictionary smoke for `carbon-dioxide` and a verb with `pp/ing` |
| P2-2 antonyms missing from `/relations` | Fixed in code | `app/api/dictionary/relations/route.ts` merges `dictionary_antonyms` | Runtime smoke `/api/dictionary/relations?word=ability` should include `antonym` |
| P2-9 missing `/lexiverse/word/[slug]` hard 404 | Fixed in code | `app/lexiverse/word/[slug]/page.tsx` redirects missing words to `/dictionary?word=` | Browser smoke `/lexiverse/word/notarealwordxyz` |
| P2-13 AI writing/conversation no rate limit | Fixed in code | `app/api/ai/writing/route.ts`, `app/api/ai/conversation/route.ts` call `checkRateLimit` | `npm run lint`; targeted route smoke if `DEEPSEEK_API_KEY` is configured |
| P2-7 "考试语境" CTA overclaims | Mitigated in UI | `WordPracticeActions.tsx` renders disabled "考试语境补充中" badge instead of an active exam-context link; `word-practice-links.ts` no longer builds `mode=exam-practice` | `npm run lint`; `rg "cloze · 同义 · 辨析"` returns nothing |
| P3-1 SAT/TOEFL no-taskType API path off-spec | Fixed in code | `lib/practice/session-builder.ts` constrains exam sessions to objective spec task types | `npm run validate:practice-session` |
| P3-8 placeholder task type leak | Fixed in code | `lib/papers/paper-generator.ts` filters deprecated and excluded task types | `npm run validate:papers` |
| P3-2/P3-9/P3-11/P3-12 stale comments/copy/reports | Fixed in docs/copy | `specs.ts`, `PlanetDetailPanel.tsx`, `ReferenceLexiverseFrame.tsx`, two 2026-07-04 reports | `rg "paperReady=false|所属星系|/word/\[slug\]"` review |

Runtime smoke on 2026-07-05 (dev server `127.0.0.1:3107`, non-3000 port):

- `/api/mock-exam?exam={gaokao|zhongkao|cet4|cet6}&seed=1`: `ok:true`, and the responses contain **no** `answer`, `answer_text`, `audio_ref`, `explanation_zh`, or `hint` keys. **Follow-up caught at runtime:** the first smoke found `hint.blanks[].answer/.explain`（语法填空/完形的逐空答案+解析）still leaking through the JSONB `hint` field; `hint` was removed from `SEL` (`app/api/mock-exam/route.ts`) and all four exams re-verified clean.
- `/dictionary?word=carbon-dioxide`: HTTP 200（多词条 id 直达，不再落空态）。
- `/lexiverse/word/notarealwordxyz`: HTTP 307 → `/dictionary?word=notarealwordxyz`。
- `/word/benefit`: HTTP 307 → `/dictionary?word=benefit`。
- `/api/dictionary/relations?word=ability`: 返回 2 条 `type:"antonym"`（inability/incapacity）——P2-2 修复运行时确认。
- `/lexiverse?word=benefit`（Playwright/chromium 真实浏览器）：URL 被改写为 `?word=benefit&galaxy=senior`，iframe src 切换为 `Lexiverse Galaxy.html?galaxy=senior`（非 Universe 总览），无 focus-miss 提示，iframe 内可见 `DIV.wu-label.is-active: benefit`（词球激活选中）及打开的词卡 `H1: benefit`——**"落到该词所属星球/星系视角并聚焦词球"已运行时确认**。

---

## Remaining Decisions And Deferred Production

| Item | Why not auto-fixed | Current mitigation | Next owner decision |
|---|---|---|---|
| P1-2 `build_a_sentence` audit drift（**运行时已确认**：`verify:toefl-current` exit 1） | ~~owner decision~~ **已决策（owner，2026-07-05）：接受现状，不回滚 DB，不 promote，不激活** | 两份 07-05 报告已订正为已决策状态；所有 set 仍 draft/active=0/组卷器排除；审计产物已入库（commit `35cd668`）；未 `promote --apply` | ✅ 跟进项已完成（2026-07-05）：pilot 期望基线已同步（契约断言 + draft-only 收紧 + 组卷排除静态断言），门禁已恢复 exit 0 |
| P2-5/P2-6 thin v2 word coverage | Requires generating/backfilling content and target-word links | UI/report must disclose non-WU words mostly use v1 fallback | Plan a word-level v2 coverage expansion batch |
| P2-11 non-CET6 listening audio missing | Requires audio/content production and human QA | UI/report must disclose listening availability by exam | Plan audio generation/import/QA for zhongkao, gaokao, CET4, TOEFL |
| P2-7 "考试语境" CTA | Current link behaves the same as normal word practice | Hide or soften the CTA now; do not promise cloze/exam-style coverage | Build real exam-context mode only after target-word coverage exists |
| P2-12 wrong-edge visualization | ~~product decision~~ **已决策（2026-07-05, owner）：DE-SCOPE** | 孤儿组件 `components/lexigraph-v2/LexiGraphScreen.tsx` 已删除，e2e 测试3（红边）已移除；线上 `/lexigraph` iframe 不再宣称该特性 | 已完成（如需恢复该特性再单独立项） |
| P2-10 closed-loop e2e restore | Requires Playwright rewrite against v3 UI | owner 决定作为独立 track；已建 `docs/superpowers/plans/2026-07-05-closed-loop-e2e-restoration-plan.md`（含 3 条待重写用例 + 已运行时验证的词跳转路径 + globalSetup 身份校验） | 按该 track 排期重写 1/2/4 |

> **附注（P2-2 状态更新）：** 审查时点 P2-2 记录“LexiGraph 反义 sector 恒空（`/relations` 未读 `dictionary_antonyms`）”。修复分两处落地：(a) `/api/dictionary/relations` 已合并 `dictionary_antonyms`（运行时确认返回 `type:"antonym"`），使 mini-graph 与任何 `/relations` 消费方都能拿到反义边；(b) 承载空反义 sector 的 `LexiGraphScreen` 组件已随 wrong-edge de-scope 删除，故该组件级 sector 问题一并消解。

---

## 建议下一步

1. **[P0，上线阻塞] 关闭 `/api/mock-exam` 泄露。**删除未引用路由，或剥离 `answer/answer_text/audio_ref/explanation_zh`，只返回 signed/TTS handle。之后重新 grep `app/`，确认没有客户端依赖它。
2. **[P1] 修复 structured/free-text scoring 链路。**把 renderer 计算出的 correctness 传入 `postAttempt`；让 `error-classifier` 在 `isCorrect` 为 undefined 时返回 null；让 `skill-state-writer` 跳过 null 行。这个改动会同时修复 mastery、error typing、结果百分比和错题本虚假提示（P1-1 + P2-4）。
3. **[P1-2 收尾项 — ✅ 已完成（2026-07-05）] 同步 `verify:toefl-current` 的 pilot 期望基线。**已把 pilot 期望更新为"契约对象 + flag 已清 + **draft-only 收紧**"，并新增组卷器排除静态断言与 draft 规模锁 10→30（C3 批次 `e7e17cf`）；`verify:toefl-current` 已**恢复 exit 0**。激活仍被禁止：不 `promote --apply`，直至 owner 批准且 server RPC 确认。
4. **[P2，状态诚实] 停止宣传完整 v2 word loop。**修复“考试语境”死 lens（P2-7），纠正 word-mode v1 fallback 的披露（P2-6），修复多词条目跳转（P2-8）、词形/派生标签和反义 sector 缺口（P2-1/P2-2/P2-3）。
5. **[P2，覆盖度] 决定听力策略。**要么把 active listening audio 扩展到 CET6 之外，要么在 mock UI 中披露各考试听力可用性（P2-11）；同时为核心 vocab drills 回填 v2 pool，或披露 v1-only，使 diagnostics 能看到这些 attempts（P2-5）。
6. **[P2，测试可信度] 恢复 closed-loop e2e。**基于当前 UI 增加 app-identity health check，重写并启用闭环测试（P2-10 + P3 Playwright hardening），并重新接入或下线 wrong-edge 可视化（P2-12）。
7. **[P3，清理项] 批量处理低风险问题：**过期 `specs.ts` 注释、07-04 被覆盖报告横幅、死代码 LexiverseShell/PlanetDetailPanel、focus-miss 文案、两个 AI route 的 rate limit、删除或修复未使用的 `words-toefl.js` 资产。

---

### 附录：审查方法与可信度说明

- 共运行 24 个子代理：23 个完成，1 个验证代理触发会话 token 限制。除 `build_a_sentence` 外，每个 P0/P1 都由独立代理以“尝试反驳”的方式做了对抗再验证；Playwright 的 P1 就是在此过程中被降为 P3。
- 发现基于**当前工作区**和**线上 Supabase**只读查询。当前工作区包含未提交 `M lib/papers/paper-generator.ts`（CRLF-only / empty numstat）以及 8 个 modified `reports/*.json`（仅 timestamp 变化，不是有意义漂移）。
- 按 checklist 原则：绿色门禁（lint/tsc/validators）**不能等同于产品闭环通过**。本报告中的 P0/P1 都是在门禁之外发现的；被 skipped/fixme 的测试记录为覆盖缺口，不算通过。
