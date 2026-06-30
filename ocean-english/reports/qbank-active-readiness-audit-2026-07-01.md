# 题库上线前晋级审计报告（qbank active-readiness）

- 日期：2026-07-01
- 范围：ocean-english question_sets v2（draft → active 晋级前审计）
- 性质：**只读审计**（§1–§9）。审计后按复审要求做了 2 项硬阻断代码修复（§10），仅改代码/脚本，**未 promote、未 active、未改表结构/前端/限流、未调 DeepSeek、未生成新题**。
- 结论先行（已按复审修正措辞，不再宣称「全部未触发」）：**未发现** active 退役题型 / 答案键错误 / 听力 transcript 泄露 / productive 冒充官方；**但发现 active TOEFL complete_the_words 存在答案文本下发风险（P1，已可被用户触达）**，以及 promote/RPC 对 `input_mode='speak'` 题型的门控盲区（P1）、word-universe 选词代表性失衡（P1）。前两者属上线安全问题，**已在审计后修复并验证（见 §10）**；选词偏斜需首批分层抽样 + 中期补词。**本阶段不进入 promote**——交 Codex 复审。

---

## 0. 改动文件 / 是否写库

| 项 | 值 |
|---|---|
| 是否写数据库 | **未改任何题库行/状态、未 promote**；仅经授权更新了 promote RPC function 定义（§10.2，`CREATE OR REPLACE`，不动表结构/数据） |
| 审计阶段（§1–§9） | 只读：跑现有 validate/qa/audit + 只读 SQL，未改任何文件 |
| 代码修改（§10 复审硬阻断） | `lib/practice/session-builder.ts`、`scripts/promote-question-sets-v2.ts`、`scripts/validate-practice-session.ts`、`supabase/sql/p5-question-bank-promotion-rpc.sql` |
| 新增文件 | `reports/qbank-active-readiness-audit-2026-07-01.md`、`.json` |
| 被动刷新文件 | `reports/*.json`（validate/qa/audit 命令运行副产物，非手动改库） |

---

## 1. 全库总量与状态分布

| 维度 | 数量 |
|---|---|
| question_sets 总数 | **5623** |
| draft | **3630** |
| active | **1993** |
| rejected | 0（无 rejected 状态） |
| active items | 3173 |

### task_type × status（sets / items）

| task_type | active sets/items | draft sets/items |
|---|---|---|
| reading_comprehension | 467 / 1200 | — |
| listening_comprehension | 224 / 671 | — |
| para_match | 150 / 150 | 200 / 200 |
| essay_writing | 150 / 150 | — |
| applied_writing | 150 / 150 | — |
| cloze_passage | 150 / 150 | 200 / 200 |
| banked_cloze | 108 / 108 | 200 / 200 |
| translation_zh_en | 106 / 106 | — |
| seven_select | 100 / 100 | 200 / 200 |
| grammar_fill | 98 / 98 | 200 / 200 |
| complete_the_words | 70 / 70 | — |
| email_writing | 60 / 60 | — |
| academic_discussion | 60 / 60 | — |
| continuation_writing | 50 / 50 | — |
| translation_en_zh | 50 / 50 | — |
| cloze_choice | — | 200 / 200 |
| collocation_choice | — | 200 / 200 |
| confusable_choice | — | 200 / 200 |
| def_to_word | — | 200 / 200 |
| en_to_zh | — | 200 / 200 |
| zh_to_en | — | 200 / 200 |
| synonym_choice | — | 200 / 200 |
| synonym_substitute | — | 200 / 200 |
| cloze_spell | — | 200 / 200 |
| word_form | — | 200 / 200 |
| zh_to_word_spell | — | 200 / 200 |
| listen_to_meaning | — | 200 / 200 |
| dictation_spell | — | 200 / 200 |
| build_a_sentence | — | 10 / 10 |
| interview_speaking | — | 10 / 10 |
| listen_and_repeat | — | 10 / 10 |

### exam / level / task_type 覆盖（draft，level：中考1 高考2 四级3 六级4 考研5 托福6 SAT7 雅思8）

- **zhongkao(1)**：cloze_passage 142、confusable_choice 70、+13 类 word-universe 共约 466
- **gaokao(2)**：grammar_fill 200、word-universe 共约 626
- **cet4(3)**：banked_cloze 166、para_match 143、word-universe 共约 511
- **cet6(4)**：para_match 57、banked_cloze 34、word-universe 共约 219
- **kaoyan(5)**：seven_select 181、cloze_passage 58、word-universe 共约 142
- **toefl(6)**：word-universe 共约 716 + build_a_sentence 10 + interview_speaking 10 + listen_and_repeat 10
- **sat(7)**：word-universe 共约 658
- **ielts(8)**：无 draft（coming_soon，整卷题库待建）

> 关键标记统计：`antonym_choice`/`cet_cloze` = **0**（active+draft）；`scoring_not_ready` = **10**（全部 toefl build_a_sentence，全在 draft）；`official_spec_unverified` / `audio_missing` / `paper_not_ready` **不作为 qa_flag 存在**（前者由 promote 脚本防御性检查、后两者运行时派生）。

---

## 2. 晋级候选分级

> 合计 draft 3630 = A 1200 + B 2000 + C 430 + D 0。

### A. READY_CANDIDATE = 1200

词义/拼写映射明确的 word-universe 单选题：**def_to_word 200、en_to_zh 200、zh_to_en 200、synonym_choice 200、synonym_substitute 200、confusable_choice 200**。

满足全部 A 硬条件：非退役、status=draft、无 hard-blocked flag、answer 100% 命中 choice id、选项文本无重复（无多解）、无音频依赖、无 transcript、无中文污染、不属 scoring_not_ready/audio_missing。

**Promote 附带条件（非无条件放行）**：
1. **跨字母分层抽样**——目标词 88% 是字母 a（见 §4 / P1），整批 promote 会把偏斜带入 active。首批必须跨字母抽样。
2. 每小批前抽查干扰项质量。

### B. REVIEW_REQUIRED = 2000

| 子类 | 题型 / 数量 | 需人工抽查的原因 |
|---|---|---|
| 语境/搭配选择 | cloze_choice 200、collocation_choice 200 | 题干自然度与干扰项质量参差（样本见 §3）：cloze_choice 干扰项常词性不搭（易排除）；collocation prompt 过于稀疏（如仅 "him"） |
| 拼写 | cloze_spell 200、word_form 200、zh_to_word_spell 200 | spell 精确匹配判分；word_form/zh_to_word_spell 可能存在多个正确形式（learned/learnt、一个中文对多个英文词）→ 单解判分有误判风险（多解契约需确认，否则个案降 D） |
| 篇章 | banked_cloze 200、para_match 200、seven_select 200、cloze_passage 200、grammar_fill 200 | 素材 **migrated_v1**（见 §4 来源），原创性/版权需抽查；语义答案（同义改写、信息匹配）需人工确认 |

### C. BLOCKED = 430

| 题型 / 数量 | 原因 |
|---|---|
| listen_to_meaning 200、dictation_spell 200 | **audio_missing**：input_mode=listen，但 stimulus 上 active 音频 = 0（0/200） |
| listen_and_repeat 10 | **audio_missing + 口语管线**：input_mode=speak、stimulus_id 全 null（无音频源） |
| interview_speaking 10 | **口语评分管线未就绪**：speak 作答，自动评分（ASR+评分）未验证 |
| build_a_sentence 10 | **scoring_not_ready**：qa_flags 标记；仅 canonical answer，无等价判分契约 |

### D. DELETE_OR_REWORK = 0（整类）

未发现需整类删除的批次。个案在 B 的人工抽查中逐条处理：cloze_choice 1 条重复 prompt、collocation_choice 稀疏 prompt、部分弱干扰项；word_form/zh_to_word_spell 的多解条目在 review 时可能降为 D。

---

## 3. 重点抽检样本与结论

| 抽检对象 | 样本 | 结论 |
|---|---|---|
| **SAT reading_comprehension**（active） | "Most histories of flight begin with the Wright brothers. Yet…Otto Lilienthal…" 主旨题，答案"Lilienthal 应获更多认可"，干扰项"技术细节"合理；marathon-chart 推断题 | 原创学术短文，题型正确、干扰项有质量 → **合格**。但 section_id 全 null，无 4-domain 细分（P2），无法按 domain 抽检 |
| **TOEFL complete_the_words**（active 70） | "…gathers faint light…Without such a **telescope**…"→answer telescope；"…increase in prices **inflation**…"→answer inflation | 结构正确（prompt 挖空、首字母提示）。**但 stimulus.text_en 100% 含完整答案词，prompt 0% 含**——若渲染层下发 stimulus 文本即泄露答案（P1，见 §5） |
| **TOEFL email_writing**（active） | "You are a student in Professor Lee's history class…part-time job interview 撞期…Write an email…" answer={type:rubric_scored, official:false, note:"…never official"} | 情境真实、标注规范 → **合格** |
| **TOEFL academic_discussion**（active） | "Your professor is teaching…media and society…Dr. Patel:…" rubric_scored / official:false | 标准 TOEFL 学术讨论格式 → **合格** |
| **essay_writing**（active） | "Write a short essay of 120-180 words…online resources for self-study…" rubric_scored / official:false | CET 风格议论文 → **合格** |
| **word-universe choice**（draft） | synonym_choice accordingly→consequently(干扰 barely/lightly/moreover)；def_to_word 橡子→acorn；en_to_zh abusive→辱骂的；zh_to_en 声学→acoustics | 答案唯一、释义准确 → **结构合格**；但选词偏 a（P1） |
| **cloze_choice**（draft） | "She's not only a great dramatic [BLANK]…"→actress(干扰 repairs/bookshelf/decline)；"Since we were babies, [BLANK]"→actually | 干扰项常词性不搭、个别句自然度弱 → **REVIEW** |
| **collocation_choice**（draft） | prompt 仅 "him"，choices ask himself/he/his/him→him | prompt 过于稀疏，缺语境 → **REVIEW** |
| **para_match**（active kaoyan） | 7-9 段文章 + 5 句总结，answer=段落号[3,1,5,2,4]（0-based，指向段落非选项） | answer 段号全部落在段落范围内（0 越界）→ **判分正确**；语义匹配质量需人工抽查 |
| **synonym_substitute**（draft） | "The path ends off 「abruptly」."→suddenly | 全角「」高亮目标词（设计，非污染），答案准确 → 合格 |

---

## 4. 来源、代表性、同质化

- **source_type（stimulus）**：active = original_authored 1439 + migrated_v1 134；draft 有 stimulus 的 1020 中 **migrated_v1 1000 / original_authored 20**。→ draft 篇章素材几乎全是 v1 迁移，**原创性/版权需抽查**（P2）。
- **word_count 达标**：banked_cloze 105–271、cloze_passage 87–349、para_match 263–749、seven_select 70–259；无极端过短/过长（最短 zhongkao seven_select 70 词，初中可接受）。
- **同质化/换皮**：draft choice 题完全相同 prompt 的重复 ≈ 0（仅 cloze_choice 1 条）。**无换皮**。
- **选词代表性（P1）**：word-universe 目标词首字母分布 —— **a：358 词 / 2316 次出现（≈88%）**，b 118、c–o 个位到二十几，**p–z 完全为 0**。词库按字典序导入前段，非按词频/考纲均衡 → 代表性失衡。

---

## 5. 问题列表（P0/P1/P2/P3）

**P0：无。**（无 active 退役题型、无 active 答案错误、无听力 transcript 泄露、无 productive 冒充官方。）

**P1：**
1. **word-universe 选词偏斜**（~2200 draft）：88% 字母 a、无 p–z。Promote 必须跨字母分层抽样；中期应按词频/考纲重平衡选词。
2. **complete_the_words 答案泄露风险**（active 70）：stimulus.text_en 100% 含完整答案词，prompt 0% 含；input_mode=spell 被 session-builder 当非听力 → 可能把 stimulus 文本下发客户端 = 泄露答案。需确认渲染层对「spell + 有 stimulus」不下发 text_en。
3. **promote/RPC 对 speak 题型的音频门控盲区**：[promote-question-sets-v2.ts](../scripts/promote-question-sets-v2.ts) 与 [p5-question-bank-promotion-rpc.sql](../supabase/sql/p5-question-bank-promotion-rpc.sql) 的「听力需 active audio」只认 `task_type=listening_comprehension` 或 `input_mode='listen'`，**不含 `input_mode='speak'`**；listen_and_repeat（需音频）/interview_speaking（需口语评分）仅被检查 rubric → 可能被误判 eligible。本阶段不 promote 故未触发；建议显式 BLOCK 或扩展门控（属 RPC 改动，本阶段未执行）。

**P2：**
4. **SAT 无 domain**（active 200）：section_id 全 null，无 4-domain 细分，无法按 domain 组卷/抽检。建议补 domain 元数据。
5. **spell 多解风险**（word_form/zh_to_word_spell 400 draft）：精确匹配可能误判等价形式。确认等价判分契约，否则个案降 D。
6. **migrated_v1 来源未核**（~1000 draft 篇章）：原创性/版权抽查后再 promote。

**P3：**
7. `official_spec_unverified` 在 spec 中被提及，但 DB 无此 qa_flag 键（promote 脚本仍防御性检查）；`audio_missing`/`paper_not_ready` 同样非 qa_flag（派生）。仅记录，无需动作。

---

## 6. 专项确认（指令检查项）

| 检查项 | 结果 |
|---|---|
| 是否有退役题型混入 | **否**（antonym_choice/cet_cloze active+draft = 0） |
| 是否有答案错误（active） | **否**（choice answer 全命中、index 全在范围；para_match「越界」为误报，已用段落数复核） |
| 是否有题型规格不符 | SAT 无 domain（P2）；complete_the_words 材料含答案（P1） |
| 音频阻断 | listen_to_meaning/dictation_spell/listen_and_repeat 共 410 draft 无 active 音频 → BLOCKED |
| rubric 阻断 | build_a_sentence 无 rubric（scoring_not_ready）→ BLOCKED；其余 productive 100% 有 rubric |
| official_spec 阻断 | 无（DB 无该 flag；active productive official 全 = false） |
| QA 是否漏明显坏题 | 未漏「结构/答案坏题」（gates 全 0）；但 QA **未覆盖** 选词代表性、complete_the_words 泄露、speak 音频门控（已在 P1/P2 记录） |

---

## 7. 必跑命令结果（全部 exit 0）

| 命令 | 结果 |
|---|---|
| `npm run lint` | exit 0 |
| `npx tsc --noEmit` | **TSC-CLEAN**（实跑，7s；本审计未改 .ts） |
| `npm run validate:question-types` | errors 0；word-universe 13 类；退役 antonym_choice/cet_cloze 已登记 |
| `npm run validate:qbank-v2` | applied；active sets 1993 / items 3173；errors 0 |
| `npm run qa:qsets-v2` | applied；模板 30；errors 0 |
| `npm run audit:qbank-v2-coverage` | sets 5623 / draft 3630 / active 1993；EXPECTED MISSING 6 THIN 0 READY_ACTIVE 38 BLOCKED 5；ACTUAL active-pool warnings 94 |
| `npm run validate:practice-session` | errors 0；退役被拒；toefl/sat task v2 正常下发 |
| `npm run validate:papers` | errors 0（smoke 门禁：cet4 mini 12.4s / 听力 section 11.8s） |
| `npm run validate:data-quality` | 全过；definition_en 中文污染 0/56602 |
| `npm run validate:papers:full` | **未作为门禁运行**（手动慢测/压测，耗时受远程 DB/Storage 状态影响） |

> §7 备注：`npx tsc --noEmit` 本轮实跑 = TSC-CLEAN（7s）。本审计未改任何 .ts。

---

## 8. 建议下一步

- **首批可 promote 的小批范围**（人工抽查通过后）：从结构最确定、已有 active 同类佐证的客观词汇单选起步——**def_to_word / synonym_choice / confusable_choice，每型约 20 条，跨字母分层抽样（不可整批 a），单 exam 单批**，`--apply` 严格小批。
- **需人工复核**：cloze_choice / collocation_choice（自然度+干扰项）；全部篇章 draft（migrated_v1 来源 + 语义答案）；word_form / zh_to_word_spell（多解契约）。
- **需继续补题**：word-universe 字母 p–z（当前为 0）；SAT domain 元数据；listen_to_meaning/dictation_spell/listen_and_repeat 的音频资产。
- **必须保持 BLOCKED**：listen_to_meaning、dictation_spell、listen_and_repeat、interview_speaking、build_a_sentence（共 430），直到音频/口语评分管线就绪。
- **promote 前先修 P1**：complete_the_words 渲染泄露确认、promote/RPC speak 音频门控（需复核 RPC）。

---

## 9. 停止条件核对

| 停止条件 | 是否触发 | 说明 |
|---|---|---|
| active 中退役题型 | 否 | 0 |
| active 中答案错误 | 否 | para_match「越界」为我初版判分模型误用 choices 长度所致的误报，已用段落数复核 = 0 越界 |
| promote 脚本绕过 blocked | 否（但有盲区） | 标准题型双重门控严格；speak 题型音频门控盲区记为 P1，本阶段不 promote 未触发 |
| QA 漏掉明显坏题 | 否 | gates 全 0；未覆盖维度已记录 |
| 听力 active 缺 audioUrl / 泄露 transcript | 否 | 224/224 有 active 音频；客户端 transcript 隔离 smoke 已验 |
| **active 答案文本泄露（非 transcript）** | **是 → 已修** | **complete_the_words：stimulus.text_en 含完整答案词且会下发到客户端 payload（active 可触达）。已在 §10 修复并加断言** |
| productive 冒充官方 | 否 | 626/626 official=false + 有 rubric |
| 大批量同质化/换皮 | 部分 | 无换皮；但 word-universe 选词偏 a（P1） |
| 需 schema/前端/限流改动 | 否 | speak 门控修复涉及 promote 脚本 + RPC function（CREATE OR REPLACE，不动表结构/前端/限流），见 §10 |

**最终结论**：审计完成。**未发现** active 退役题型 / 答案键错误 / 听力 transcript 泄露 / productive 冒充官方；**但发现并已修复** active complete_the_words 答案文本下发风险与 promote/RPC speak 门控盲区（§10）。剩余 P1（word-universe 选词偏斜）需首批分层抽样 + 中期补词。**本阶段不进入 promote**，报告交 Codex 复审；待 RPC apply（§10 待办）后重跑相关检查。

---

## 10. 审计后修复记录（复审要求的 2 项硬阻断）

> 仅改代码/脚本；未 promote、未 active、未改表结构/前端/限流。

### 10.1 complete_the_words 答案文本泄露（active，已修 + 已验证）
- **现象**：`buildPracticeSession(toefl, complete_the_words)` 的 payload 里 `stimulus.textEn` = 含完整答案词的整句（如 answer=telescope，stimulus.textEn="…Without such a telescope…"）；prompt 是挖空版不含答案，但 stimulus 把答案下发到了客户端。
- **修复**：[session-builder.ts](../lib/practice/session-builder.ts) — `input_mode='spell'` 或 `task_type='complete_the_words'` 的题整体不下发 stimulus（prompt 已自带挖空题面；stimulus 仅含答案文本、无展示价值）。`dictation_spell` 是 `input_mode='listen'`，走听力分支、其音频不受影响。
- **验证**：[validate-practice-session.ts](../scripts/validate-practice-session.ts) 新增断言——complete_the_words 每个 item 不带 stimulus，且 payload 序列化后不含完整答案词。`npm run validate:practice-session` = 错误 0（仍出题 items=4）。

### 10.2 promote/RPC 对 speak 题型门控盲区（已修，RPC apply 待授权）
- **现象**：音频/就绪门控只认 `task_type=listening_comprehension` 或 `input_mode='listen'`；`input_mode='speak'`（listen_and_repeat 需音频源、interview_speaking 需 ASR+评分管线）只检查 rubric → 可能被误判 eligible。
- **修复（两处保持一致）**：
  - [promote-question-sets-v2.ts](../scripts/promote-question-sets-v2.ts)：任一 item `input_mode='speak'` 且 `qa_flags.speaking_ready!==true` → reject `speaking_pipeline_not_ready`。
  - [p5-question-bank-promotion-rpc.sql](../supabase/sql/p5-question-bank-promotion-rpc.sql)：RPC 内同规则（`CREATE OR REPLACE FUNCTION`，不动表结构）。
  - 管线就绪后由人工置 `qa_flags.speaking_ready=true` 才放行。
- **验证（TS 层）**：dry-run `promote --task=listen_and_repeat` 与 `--task=interview_speaking` 各 10 候选 → eligible 0 / rejected 10 / reason `speaking_pipeline_not_ready`（修复前会 eligible）。
- **验证（RPC 层，已 apply）**：经用户授权，RPC 已 apply 到生产（migration `promote_rpc_speak_pipeline_gate`；`CREATE OR REPLACE FUNCTION`，幂等、未动表结构/数据）。直接调 RPC 传一个 listen_and_repeat draft set → 返回 `rejected / speaking_pipeline_not_ready`，且该 set 状态仍 `draft`（rejected 不改状态）。第二道防线生效，与 TS 层一致。
