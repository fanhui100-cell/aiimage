# 真题题型库 · 生成方案 spec（待确认）

> 目标：建一个**合规、无限量**的题库，喂 PracticeSession / 复习舱 / 考试。
> 配套：表迁移 `supabase/sql/p1-question-bank.sql`（你在 Supabase SQL Editor 跑一次）。

## 0. 合规红线（不可越）
- ❌ **不抓取/存储/分发真题卷原文**（CET/考研/TOEFL 题目有版权）。
- ✅ **学真题的「题型 + 考点 + 难度」（格式/思想不受版权保护），用我们富化好的词库生成 100% 原创题**。
- 入库标记：`source_type ∈ {original_curated, ai_generated_practice, exam_tagged_practice}`；`source_exam` 只能填 LexiOcean 原创集名（如 `LexiOcean-CET4-Practice-A`）。AI 生成默认 `status='draft'`、`is_reviewed=false`，审核后转 `active`。

## 1. 题型清单（请你勾选要做的）

### A. 通用题型（规则层，**免费、无 AI、数据已齐**，可现在生成）
| id | 名称 | 输入 | 数据来源（已富化） |
|---|---|---|---|
| `def_to_word` | 中文释义选词 | 选 | definitions.zh + 同档干扰项 |
| `en_to_zh` / `zh_to_en` | 英中 / 中英互译 | 选 | definitions |
| `zh_to_word_spell` | 中文 → 敲英文 | 打字 | definitions（首字母/音标提示）|
| `synonym_choice` | 同义词选择 | 选 | dictionary_synonyms（45,937 已入）|
| `cloze_choice` / `cloze_spell` | 例句填空（选/敲）| 选/打字 | dictionary_examples（挖空词头）|
| `confusable_choice` | 易混词辨析 | 选 | 形近边（编辑距离）|
| `word_form` | 词形/派生填空 | 打字 | inflections（10,045 已入）|

### B. 真题题型（AI 层 · DeepSeek，**对标格式、内容原创**）
| id | 对标 | 生成方式 |
|---|---|---|
| `cet_cloze` | CET 完形填空（原创短文 + 20 空 4 选 1）| AI 用目标档词写原创短文 |
| `cet_banked_cloze` | CET 选词填空（选词填空 15 选 10）| AI |
| `cet_translation` | CET/考研 汉译英句 | AI（给词 + 句型）|
| `kaoyan_longsent` | 考研长难句理解 | AI 原创长句 + 考点设问 |
| `toefl_vocab` | TOEFL 词汇题（语境同义替换）| AI/规则（synonyms + 例句）|
| `listening_comprehension` | 听短文 → 选择（P3）| 短文(可挂阅读文章) + TTS + AI 设问 |

> 近义辨析（nuance）后台跑完后，`synonym_choice` / `confusable_choice` 的**解析**可直接引用辨析文本，质量更高。

## 2. 生成方案
- **规则层**（`scripts/gen-questions.ts`，免费）：遍历词库按档/题型批量产 MCQ + 打字题，干扰项 = 同词性 / 同档 / 频率相近词；`status='active'`（规则题质量稳定，可直接用）。
- **AI 层**（DeepSeek，离线批处理 + 缓存 + 断点续跑）：真题题型，`status='draft'` → **我(Opus) 抽审高频档** → `active`。
- **量**：建议先做**高频核心词（stars≥4 / frequency_rank 靠前）× 通用题型**起步；真题题型先做四级/六级两档样例，确认质量再放量。

## 3. 存储
`question_bank` 表（见 `supabase/sql/p1-question-bank.sql`），字段对齐 `types/question-bank.ts`（已扩 inputMode/新题型/audioRef）。`lib/question-bank/question-bank-client.ts` 现读静态 seed，后续切到读表（保留 seed 作离线兜底）。

## 4. 待你确认
1. **题型范围**：A 全做？B 先做哪几个考试？
2. **起步规模**：先高频核心词，还是某一档（如四级）全量？
3. **AI 用量**：真题题型走 DeepSeek 全量，还是先样例我审？
4. **何时跑**：规则层可**现在就跑**（不依赖 UI）；真题题型建议等 PracticeSession 定稿对齐 inputMode 再放量。
