# Ocean English 全量数据质量审查与 Claude Code 修复清单

审查日期：2026-06-16  
审查范围：本地词库、静态七级词表、题库、阅读文章关键词、LexiGraph 数据覆盖、词汇资料字段覆盖。  
产物用途：交给 Claude Code 继续修复。  
本次原则：只做只读审查，不修改项目数据和业务代码。

## 0. 重要限制

当前 `.env.local` 缺少 `NEXT_PUBLIC_SUPABASE_URL`，所以这次不能直接审查线上 Supabase 数据表，只能审查仓库内本地数据、导入源、静态词表、运行时 dictionary 聚合结果、题库源码和阅读文章源码。

Claude Code 修复前后需要在 Supabase URL 可用后补跑线上审查：

```bash
npx tsx scripts/stats-all.ts
npx tsx scripts/audit-bank.ts --samples
npx tsx scripts/qa-passages.ts --judge 0
```

注意：`scripts/audit-relations.ts` 会写出 `scripts/.audit-flags.json`，如需纯只读审查，先改成 dry-run 或另写只读脚本。

本轮继续遵守用户要求：DeepSeek route 限流暂时不要动。

## 1. 本地基线结果

### 1.1 dictionary import 校验

命令：

```bash
npx tsx scripts/validate-dictionary-import.ts
```

结果摘要：

| 指标 | 数值 |
| --- | ---: |
| Total words | 344 |
| Core words | 314 |
| Exam words | 204 |
| Errors | 0 |
| Warnings | 0 |
| IPA coverage | 344/344 |
| Examples coverage | 344/344 |
| Synonyms coverage | 344/344 |
| Antonyms coverage | 179/344, 52% |
| Collocations coverage | 270/344, 78% |
| Mnemonics coverage | 270/344, 78% |
| Scene usage coverage | 270/344, 78% |
| Exam tags coverage | 204/344, 59% |

CEFR 分布：

| CEFR | 数量 |
| --- | ---: |
| A2 | 36 |
| B1 | 107 |
| B2 | 128 |
| C1 | 66 |
| C2 | 7 |

### 1.2 question bank 校验

命令：

```bash
npx tsx scripts/validate-question-bank.ts
```

结果摘要：

| 指标 | 数值 |
| --- | ---: |
| Questions | 24 |
| Known dictionary ids | 378 |
| Errors | 0 |
| Warnings | 0 |

现有校验只验证结构和引用存在，不足以验证答案是否被词条数据支撑。

### 1.3 LexiGraph readiness

命令：

```bash
npx tsx scripts/analyze-lexigraph-readiness.ts
```

结果摘要：

| 指标 | 数值 |
| --- | ---: |
| Total words | 363 |
| Average edges | 10.53 |
| Adapter warnings | 262 |
| Zero-edge words | 0 |
| Low-edge words | 4 |
| Synonyms coverage | 363/363, 100% |
| Antonyms coverage | 198/363, 55% |
| Collocations coverage | 324/363, 89% |
| Tags / related coverage | 325/363, 90% |
| Exam tags coverage | 207/363, 57% |
| Scene usages coverage | 296/363, 82% |

低连接词：

| word | edges |
| --- | ---: |
| advice | 3 |
| purpose | 3 |
| suggest | 3 |
| require | 3 |

结论：LexiGraph 代码路径基本可渲染；262 个 warning 是数据覆盖问题，不是适配器代码 bug。

## 2. 运行时本地词典字段覆盖

本地运行时聚合词典共 392 个词条。字段缺口如下：

| 字段 | 缺失数量 | 严重度 | 说明 |
| --- | ---: | --- | --- |
| ipa | 0 | OK | 全覆盖 |
| defEn | 0 | OK | 全覆盖 |
| defZh | 0 | OK | 全覆盖 |
| examples | 0 | OK | 全覆盖 |
| synonyms | 0 | OK | 但有大量占位同义词，见 P0 |
| antonyms | 170 | P1 | 不应强行给所有词补反义词，但出题词必须有可靠反义词 |
| collocations | 69 | P1 | 出搭配题的词必须补齐 |
| mnemonics | 93 | P1 | 词汇资料页体验缺口 |
| etymology | 78 | P1 | 词源资料缺口 |
| inflections | 392 | P0 | 运行时 392/392 均未暴露词形 |
| sceneUsages | 102 | P1 | 场景用法缺口 |
| examTags | 156 | P2 | 等级/考试标签不完整 |
| themeTags | 116 | P2 | 主题标签不完整 |
| domainTags | 116 | P2 | 领域标签不完整 |

## 3. P0 必修问题

### P0-1. 严重占位词汇资料仍存在

`data/dictionary/import/core-words-150-batch-1.ts` 仍在批量生成模板化词条。典型位置：

| 文件 | 行 | 问题 |
| --- | ---: | --- |
| `data/dictionary/import/core-words-150-batch-1.ts` | 33 | 英文释义模板化：`to ${word} means to take a clear action connected with ${theme} in a learning or work context.` |
| `data/dictionary/import/core-words-150-batch-1.ts` | 70 | 同义词模板化：`${word} related idea` |

需要修复：

1. 不要保留 `related idea`、`${word} context`、`${word} strategy`、`learning or work context`、`中文搭配例句` 这类占位文本。
2. 对 150 个核心词逐词补真实英文释义、中文释义、同义词、常用搭配、例句、词源/记忆法。
3. 同义词必须是真实可替换或近义关系，不能用 “word related idea” 兜底。
4. 搭配必须是自然英语搭配，不能用 “word context / word strategy” 兜底。
5. 反义词只在确有稳定反义关系时补，不要为所有词硬造反义词。

本地审查发现大量宽泛占位命中，其中最严重的是这批 150 个生成词。样例词包括：

| 样例 word id | 问题类型 |
| --- | --- |
| adjust | 模板释义 / 模板同义词 / 模板搭配 |
| alternative | 模板释义 / 模板同义词 / 模板搭配 |
| apparent | 模板释义 / 模板同义词 / 模板搭配 |
| appropriate | 模板释义 / 模板同义词 / 模板搭配 |
| aspect | 模板释义 / 模板同义词 / 模板搭配 |
| assemble | 模板释义 / 模板同义词 / 模板搭配 |
| assign | 模板释义 / 模板同义词 / 模板搭配 |
| assist | 模板释义 / 模板同义词 / 模板搭配 |
| attain | 模板释义 / 模板同义词 / 模板搭配 |
| authority | 模板释义 / 模板同义词 / 模板搭配 |
| category | 模板释义 / 模板同义词 / 模板搭配 |
| comment | 模板释义 / 模板同义词 / 模板搭配 |
| commit | 模板释义 / 模板同义词 / 模板搭配 |
| compensate | 模板释义 / 模板同义词 / 模板搭配 |
| compile | 模板释义 / 模板同义词 / 模板搭配 |
| component | 模板释义 / 模板同义词 / 模板搭配 |
| compound | 模板释义 / 模板同义词 / 模板搭配 |
| conduct | 模板释义 / 模板同义词 / 模板搭配 |
| contrast | 模板释义 / 模板同义词 / 模板搭配 |
| convert | 模板释义 / 模板同义词 / 模板搭配 |
| coordinate | 模板释义 / 模板同义词 / 模板搭配 |
| criteria | 模板释义 / 模板同义词 / 模板搭配 |
| crucial | 模板释义 / 模板同义词 / 模板搭配 |
| design | 模板释义 / 模板同义词 / 模板搭配 |

验收标准：

```bash
npx tsx scripts/validate-dictionary-import.ts
npx tsx scripts/analyze-lexigraph-readiness.ts
```

并新增或增强占位检测，确保上述占位字符串 0 命中。

### P0-2. 运行时词形 inflections 全缺失

本地运行时词典 392 个词条中，`inflections` 缺失 392 个。

数据库层已有相关 schema，例如 `supabase/sql/p1-nuance-inflections.sql`，但本地 dictionary import / runtime adapter 没有把词形资料完整暴露出来。

需要修复：

1. 明确词形数据源，优先使用项目已有 ECDICT / exchange 字段或可靠词形表。
2. 将词形写入本地导入数据或运行时 adapter。
3. 覆盖常见动词三单、过去式、过去分词、现在分词，名词复数，形容词比较级/最高级。
4. 不可数名词、无常规变形词、短语词条要允许 documented exception，不要伪造词形。
5. 题型 `word_form` 必须只从有可靠词形的词中抽题。

验收标准：

| 指标 | 目标 |
| --- | ---: |
| runtime inflections 缺失 | 0，或仅保留 documented exception |
| word_form 题 | 100% 使用有可靠词形的词 |
| irregular verbs | 单独抽样校验通过 |

### P0-3. 本地题库答案与词条资料不一致

本地静态题库共 24 题，结构校验通过，但语义/资料支撑校验发现 4 个问题：

| question id | 类型 | 问题 | 当前答案 | 当前词条资料 |
| --- | --- | --- | --- | --- |
| `vdl-conduct-collocation-007` | collocation_choice | 正确搭配不在词条 collocations 中 | conduct research | `conduct context`, `conduct strategy` |
| `vdl-crucial-syn-008` | synonym_choice | 答案语义正确，但词条同义词是占位 | essential | `crucial-related-idea` |
| `vdl-arbitrary-ant-019` | antonym_choice | 答案未被词条资料支撑，且语义偏松 | planned | 空 |
| `vdl-coherent-syn-021` | synonym_choice | 答案语义正确，但词条同义词是占位 | logical | `coherent-related-idea` |

需要修复：

1. 补真实词条资料，使题库答案能被 dictionary relation 支撑。
2. 对 `arbitrary` 的反义词重新审题，建议使用更稳定的候选：`systematic`、`deliberate`、`reasoned`、`principled`，并同步词条 antonyms。
3. 增强 `scripts/validate-question-bank.ts`：  
   - synonym_choice 的正确答案必须出现在词条 synonyms 或 relation 表中。  
   - antonym_choice 的正确答案必须出现在词条 antonyms 或 relation 表中。  
   - collocation_choice 的正确答案必须出现在词条 collocations 中。  
   - 如题目允许“语义正确但不在词条中”，必须有 explicit override 和人工说明。

### P0-4. 阅读文章关键词未进入本地词典

4 篇阅读文章共 60 个关键词，所有关键词都出现在文章正文中，但 46 个关键词不在当前本地 dictionary 中。这样会影响阅读关键词点击、词汇资料联动、阅读后生词收集、Lexiverse/LexiGraph 关系扩展。

| article id | 缺失关键词 |
| --- | --- |
| `morning-market` | arrange, drift, customer, favorite, crowd, vendor, comfortable, bakery, noise |
| `oceans-memory` | vast, archive, sediment, preserve, ancient, reconstruct, reveal, fragile, disturb, accumulate, urgent |
| `quiet-power-of-habit` | trivial, inspiration, surpass, mechanism, repetition, marginally, undeniable, implication, consistency, absurd, accumulation, intensity |
| `language-and-machines` | comprehension, innate, proliferation, merely, summarize, fluency, contend, mimicry, manipulate, obscure, formidable, proficiency, luxury, reside |

需要修复：

1. 如果这些词是阅读课目标词，加入 dictionary 并补齐基础资料。
2. 如果不是目标词，把 `keyWords` 替换为已入库词或只保留需要讲解的词。
3. 统一大小写和词形：例如正文中是变形词时，关键词应能解析到 lemma。

验收标准：

| 指标 | 目标 |
| --- | ---: |
| 阅读 keyWords 可解析到词典 | 100% |
| keyWords 出现在正文或可由 lemma 映射 | 100% |

## 4. 静态七级词表问题

七级静态词表规模：

| level | total | null example | suspicious mojibake rows | no phrase |
| --- | ---: | ---: | ---: | ---: |
| junior | 1987 | 5 | 18 | 211 |
| senior | 3743 | 28 | 28 | 559 |
| cet4 | 4544 | 34 | 37 | 799 |
| cet6 | 3991 | 61 | 34 | 1079 |
| kaoyan | 5047 | 45 | 47 | 928 |
| toefl | 10367 | 809 | 56 | 4309 |
| sat | 4464 | 467 | 21 | 2630 |

`suspicious mojibake rows` 是编码/特殊字符可疑行，需要行级复核，不建议批量删除。

### 4.1 已确认坏词 / 错词

| level | index | 当前 word | 当前释义 | 建议处理 |
| --- | ---: | --- | --- | --- |
| junior | 1018 | Rusia | 鲁西亚（地名） | 大概率应为 `Russia`；如非目标词，删除 |
| kaoyan | 4814 | a. | n. 天主教徒 | word 字段损坏；应恢复真实词，疑似 `Catholic` |
| toefl | 5009 | guilde | n. 行会, 协会 | 改为 `guild` |
| toefl | 6714 | lvory | n. 象牙 | 改为 `ivory` |
| sat | 4424 | AluminumAl | n. 铝 | 改为 `aluminum`，化学符号单独字段或删除粘连 |
| sat | 4426 | distingusihed | adj. 著名的， 卓越的 | 改为 `distinguished` |
| sat | 4433 | PhosphorusP | n. 磷 | 改为 `phosphorus`，化学符号单独字段或删除粘连 |
| sat | 4441 | undersize d | adj. 较一般为小的， 不够大的 | 改为 `undersized` |
| sat | 4446 | Oxygen O | n. 氧 | 改为 `oxygen`，化学符号单独字段或删除粘连 |
| sat | 4448 | Iron Fe | n. 铁 | 改为 `iron`，化学符号单独字段或删除粘连 |
| sat | 4460 | sulfur disoxide | n. 二氧化硫 | 改为 `sulfur dioxide` |

### 4.2 坏词重复位置

除源词表外，以下 public/cache 复制文件也包含重复坏词，需要同步修复，不能只改一个源：

| 文件 | 问题 |
| --- | --- |
| `public/lexigraph-reference/data/words-chuzhong-full.js` | `rusia` |
| `public/lexigraph-reference/data/words-sat-full.js` | `aluminumal`, `distingusihed`, `phosphorusp` |
| `scripts/.vocab-cache/enriched/words-junior.json` | junior 坏词缓存 |
| `scripts/.vocab-cache/enriched/words-sat.json` | SAT 坏词缓存 |
| `scripts/.vocab-cache/enriched/words-toefl.json` | TOEFL 坏词缓存 |

需要修复：

1. 找到真正源头数据，修源头后重建 public/cache。
2. 所有词表新增坏词扫描规则：
   - 禁止 `a.` 这类词性缩写进入 word 字段。
   - 禁止化学符号粘连：`AluminumAl`、`PhosphorusP`。
   - 禁止明显拼写错误：`guilde`、`lvory`、`distingusihed`。
   - 禁止 word 中间异常空格：`undersize d`。
3. 对 `null example` 和 `no phrase` 不要求一次全部补完，但应至少对高频/会出题词补齐。

## 5. 题型完整性与七级水平匹配

项目类型定义中可见的题型包括：

| 类型 | 用途 |
| --- | --- |
| definition_to_word | 英文释义选词 |
| zh_definition_to_word | 中文释义选词 |
| en_to_zh | 英译中 |
| zh_to_en | 中译英 |
| synonym_choice | 同义词选择 |
| antonym_choice | 反义词选择 |
| collocation_choice | 搭配选择 |
| zh_to_word_spell | 中文释义拼写 |
| cloze_choice | 单句完形选择 |
| cloze_spell | 单句完形拼写 |
| word_form | 词形变化 |
| confusable_choice | 易混词辨析 |
| synonym_substitute | 同义替换 |
| listen_to_word | 听音选词 |
| listen_to_meaning | 听音选义 |
| dictation_spell | 听写拼写 |
| listening_comprehension | 听力理解 |
| reading_comprehension | 阅读理解 |
| cloze_passage | 篇章完形 |
| seven_select | 七选五 |
| banked_cloze | 选词填空 |
| para_match | 段落匹配 |
| grammar_fill | 语法填空 |

目前本地静态 question bank 只有 24 题，分布如下：

| 类型 | 数量 |
| --- | ---: |
| definition_to_word | 16 |
| zh_definition_to_word | 1 |
| en_to_zh | 1 |
| zh_to_en | 1 |
| collocation_choice | 1 |
| synonym_choice | 2 |
| antonym_choice | 2 |

结论：

1. 本地静态题库远远不足以覆盖所有七级和所有题型。
2. 需要线上 DB 审查才能确认实际生产题库是否完整。
3. 如果线上题库也是类似覆盖，则七级题型体系不完整。

建议按等级建立覆盖矩阵：

| level | 对应水平 | 必查内容 |
| --- | --- | --- |
| lv1 | 初中 | 基础释义、英中互选、听音、简单拼写、简单阅读 |
| lv2 | 高中 | 释义、搭配、词形、完形、阅读理解 |
| lv3 | CET-4 | 同义替换、搭配、词形、阅读、听力、选词填空 |
| lv4 | CET-6 | 高阶同义替换、篇章完形、阅读、听力、段落匹配 |
| lv5 | 考研 | 长难句阅读、同义替换、完形、语法填空、段落匹配 |
| lv6 | TOEFL | 学术词汇、听力理解、阅读理解、同义改写、篇章题 |
| lv7 | SAT | 高阶词义、语境推断、修辞/逻辑阅读、高阶同反义 |

每个 active level + active type 应有最低题量阈值。建议先用保守阈值：

| 类型组 | 每等级最低题量建议 |
| --- | ---: |
| 基础词义类 | 每级 >= 100 |
| 同义/反义/搭配类 | 每级 >= 50，且只从有资料词抽题 |
| 拼写/词形类 | 每级 >= 50，且必须有词形资料 |
| 阅读/听力/篇章类 | 每级 >= 20 篇或套 |

## 6. 同义词 / 反义词专项要求

当前风险不是“没有给所有词补同反义”，而是“题库和图谱可能把占位或不稳定关系当作真实关系”。

Claude Code 修复时需要区分：

| 场景 | 处理方式 |
| --- | --- |
| 词本身确有稳定同义词 | 补入 synonyms |
| 词本身确有稳定反义词 | 补入 antonyms |
| 只有语境反义或程度相反 | 不要硬补，改用例句/搭配解释 |
| 出同义题 | 正确答案必须在 synonyms/relation 中 |
| 出反义题 | 正确答案必须在 antonyms/relation 中 |
| LexiGraph 低连接 | 优先补真实 related / collocation / synonym，不造假边 |

必须避免的错误：

1. 把相关词当同义词。
2. 把上下义词当同义词。
3. 把“同主题词”当同义词。
4. 为抽题硬造反义词。
5. 同义题的正确答案和词条 synonyms 不一致。
6. 反义题的正确答案和词条 antonyms 不一致。

## 7. 需要新增或增强的审查脚本

建议 Claude Code 增加一个只读脚本，例如：

```bash
npx tsx scripts/audit-vocab-quality-local.ts
```

输出至少包括：

1. runtime dictionary 总词数。
2. 每个字段覆盖率。
3. 占位字符串命中明细。
4. 每个题型的题量分布。
5. 每个等级的题量分布。
6. 每道同义/反义/搭配题是否被词条资料支撑。
7. 阅读文章 keyWords 是否在词典中。
8. 静态七级词表坏词扫描。
9. LexiGraph zero-edge / low-edge / missing relation 字段。
10. 导出 Markdown 或 JSON 报告，方便回归比较。

建议新增 CI 校验：

```bash
npm run lint
npx tsc --noEmit
npx tsx scripts/validate-dictionary-import.ts
npx tsx scripts/validate-question-bank.ts
npx tsx scripts/analyze-lexigraph-readiness.ts
npx tsx scripts/audit-vocab-quality-local.ts
```

## 8. 验收清单

修复完成后，至少满足：

| 项目 | 验收标准 |
| --- | --- |
| 占位词汇资料 | `related idea`、`word context`、`word strategy`、模板释义 0 命中 |
| 词形 | runtime dictionary 有词形资料；无词形词有 documented exception |
| 题库资料支撑 | 同义/反义/搭配题正确答案 100% 被词条资料或 relation 支撑 |
| 阅读关键词 | 100% 可解析到 dictionary lemma |
| 七级坏词 | 已确认坏词全部修复，public/cache 同步重建 |
| LexiGraph | zero-edge = 0；low-edge 词有人工解释或补边 |
| 静态校验 | `validate-dictionary-import`、`validate-question-bank`、`analyze-lexigraph-readiness` 通过 |
| 线上 DB | Supabase URL 可用后，`stats-all`、`audit-bank`、`qa-passages --judge 0` 结果附到修复说明 |

## 9. 不要做的事

1. 不要为了消除 warning 编造同义词、反义词、词源或搭配。
2. 不要只改 public/cache 副本而不改源数据。
3. 不要让题库正确答案和词条资料脱节。
4. 不要在本轮改 DeepSeek route 限流。
5. 不要把 Supabase 未审查部分写成“已通过”。

## 10. 本次审查命令记录

已运行：

```bash
npx tsx scripts/validate-dictionary-import.ts
npx tsx scripts/validate-question-bank.ts
npx tsx scripts/analyze-lexigraph-readiness.ts
```

另外运行了只读 inline TS 审查，覆盖：

1. runtime dictionary 字段覆盖。
2. 本地 question bank 答案与词条资料一致性。
3. reading article keyWords 与 dictionary 对齐。
4. 七级静态词表坏词、空例句、缺 phrase、可疑编码行统计。

未运行线上 DB 审查，原因：缺少 `NEXT_PUBLIC_SUPABASE_URL`。
