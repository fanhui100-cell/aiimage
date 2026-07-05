# Word-Universe 多字母补题报告（Claude 原创 → draft）

- 日期：2026-07-01
- 目标：补一批 **Claude 原创、非 DeepSeek、覆盖缺失字母（尤其 p–z）** 的 word-universe 题，写入 **draft**，为后续跨字母小批 promote 准备候选。
- 性质：写入 **draft only**。**未 promote、未 active、未调用 DeepSeek、未复制真题、未改前端/限流**。完成即停，交 Codex 复审。

---

## 0. 改动文件 / 是否写库

| 项 | 值 |
|---|---|
| 是否写数据库 | **是，仅写 draft**：新增 120 条 question_sets + 120 items + 120 target_words（全部 status=draft）。未 promote、未 active、未改表结构。 |
| 新增脚本 | `scripts/import-authored-word-universe.ts`（dry-run/apply、shape 校验、词库 word_id 处理、失败回滚） |
| 新增内容 | `data/generated-question-sets/wu-pz/{def_to_word,synonym_choice,confusable_choice}.json`（各 40 题） |
| 新增报告 | 本文件 + `reports/authored-word-universe-apply-report.json` |

---

## 1. 每型生成数量

| 题型 | 写入 draft | reject（最终） |
|---|---|---|
| def_to_word | 40 | 0 |
| synonym_choice | 40 | 0 |
| confusable_choice | 40 | 0 |
| **合计** | **120** | **0** |

全部 `legacy_id` 前缀 `gen:`（Claude 原创），`qa_flags = {generated:true, authored:'claude', provider:'claude-authored', stage:'wu-pz-2026-07-01', source:'original_authored', template:<taskType>}`。examId=toefl，level=6。

样本 legacy_id：
- `gen:def_to_word:set:claude:<hash>`（item `gen:def_to_word:item:claude:<hash>`）
- `gen:synonym_choice:set:claude:<hash>`
- `gen:confusable_choice:set:claude:<hash>`

---

## 2. 字母覆盖

本批目标词首字母（每型 40）：覆盖 **c–z**（a/b 沿用现有 qb 大库，不重复补）。

- **p–z 全覆盖且每字母 ≥2**：p9 q6 r6 s6 t6 u6 v6 w6 x6 y6 z6（三型合计，gen）✓ 满足"p–z 至少各 2 词"硬要求。
- c–o 薄弱字母补充：c7 d7 e6 f5 g3 h4 i4 j2 l4 m3 n3 o3（gen）。
- def_to_word / synonym_choice 各覆盖 23 个首字母；confusable_choice 覆盖 22 个。

补后这三个题型整体字母分布（draft，gen + 现有 qb）：
- a/b：现有 qb（a 491、b 109）
- c–z：本批 gen 覆盖
- **唯一缺口：字母 k**（gen 与 qb 均 0）。k 开头 toefl 级词稀少（keen/kindle/knack 等），列为后续补点，不阻断本批。

---

## 3. 抽查结果（DB 内实查）

- **answer→id 映射全部正确**：如 def "谨慎的"→prudent(a)、def "顶点"→zenith(b)、confusable "引用"→quote(b)、synonym prudent→cautious(a)、synonym zenith→peak(b)。
- **结构合规**：每题 4 选项、答案唯一命中某 choice、选项文本去重无重复（importer 硬校验 + dry-run 全过）。
- **干扰项质量**：def/synonym 干扰同词性且语义邻域（如 prudent 干扰 hasty/timid/lavish 均形容词）；confusable 干扰为真实形近词（如 tortuous 干扰 torturous/tortoise/torrent）。
- **中文释义准确且唯一对应答案**：释义只匹配答案词，不匹配任一干扰项（人工逐题撰写）。
- **word_id 落库**：在词库的词落 `word_id`（如 prudent/zenith/quote）；生僻补充词（xenophobia/xeric/xenon 等不在 dictionary_words）正确留 `null`，`surface` 仍保留——不阻断、不产生 FK 脏数据。
- **完整性**：3 型各 40 条均带 item + target_word，无"set 无 item/tw"的脏记录。

---

## 4. 是否有 rejected

最终 reject = 0。过程中修复 2 个 importer 缺陷（均已清理重做，无脏数据残留）：

1. **difficulty_band 越界**：误设为 level(6)，但该列 CHECK 约束为 1–5（CEFR rank，非 level 1–8）。改为留 `null`（与现有 toefl 题一致）。
2. **word_id FK 失败 + 无事务脏数据**：word_id FK→`dictionary_words(id)`，生僻补充词不在词库导致 insert 失败；且 importer 原无回滚，set+item 已写后 tw 失败留下 5 条脏记录。修复：apply 前预查词库（在库才落 word_id，否则 null）；writeDraft 加失败回滚（item/tw 失败即删除已写 set/item）。脏数据已 SQL 清理后整批重导。

---

## 5. 门禁结果（全部 exit 0）

| 命令 | 结果 |
|---|---|
| `npx tsc --noEmit` | TSC-CLEAN |
| `npm run lint` | exit 0 |
| `npm run validate:question-types` | errors 0 |
| `npm run validate:data-quality` | 全过（definition_en 污染 0/56602） |
| `npm run qa:qsets-v2` | 错误 0；gen draft sets 1889→**2009**（+120 已纳入数据 QA 无错） |
| `npm run validate:qbank-v2` | 错误 0（active 1993 不变——本批只加 draft） |
| `npm run validate:practice-session` | 错误 0（含 complete_the_words 泄露断言仍通过） |

---

## 6. 是否可进入下一步小批 promote

**可以**，且本批已解除此前的两个阻断：
- 之前 def_to_word/synonym_choice 库内仅 a 词、无法跨字母 → 现 toefl 有 gen: 跨 c–z 候选，可跨字母分层抽样。
- 之前候选全是 qb:(DeepSeek) → 现有 gen:(Claude 原创) 候选可选。

**建议首批 promote 范围**（待 Codex 复审通过后）：
- 从本批 **gen:** 题选，单 exam（toefl）、单题型、每型 ≤20 条，**跨字母分层抽样**（覆盖 p–z + c–o，不集中单一字母）。
- 先 `promote --task=<type> --limit` dry-run 看 eligible/rejected，人工抽查 ≥10 条，再 `--apply`，apply 后跑 qbank-v2 / qa:qsets-v2 / practice-session / papers / smoke:active-serve。
- 注意：promote 脚本/RPC 现按 limit 选（DB 顺序），如需严格跨字母可在 promote 前用 SQL 选定 gen: 跨字母 set 清单（promote 脚本目前不支持显式 id 列表，可作为下一步小改点）。

---

## 7. 需继续补题 / 缺口

- **字母 k**：三型均缺，建议后续补（keen/kindle/knack/knit 等）。
- a/b 仍为 qb(DeepSeek) 来源——若策略要求全 Claude 原创，需后续用 gen: 重补 a/b 替换。
- 其余字母 c–z 已有 gen: 覆盖，可继续按需扩量。

---

## 8. 结论

Claude 原创 120 题已干净写入 draft，覆盖 c–z（p–z 全部 ≥2），门禁全绿，无脏数据。**本阶段就此停止，不进入 promote**，交 Codex 复审；复审通过后再做跨字母小批 promote 试运行。
