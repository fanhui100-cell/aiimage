# Content Human Review Queue — Report (2026-07-05)

**Phase 14（post-v1 plan Task 6）.** 目标：为机器无法完全认证的语义质量建立人工复审队列。**本任务只读，未改 DB。**

## 采样（确定性：按 set id 升序等距抽取，可复现）

| 组 | 池（active） | 抽样 | 覆盖 task types |
|---|---|---|---|
| TOEFL reading | 300 | 20 | reading_comprehension / read_daily_life / complete_the_words |
| TOEFL listening | 200 | 20 | choose_a_response / listening_comprehension（含 active 音频 storage_path） |
| TOEFL writing prompts | 200 | 20 | email_writing / academic_discussion |
| Word Universe active gen | 351 | 30 | def_to_word / synonym_choice / confusable_choice |
| SAT reading | 200 | 20 | reading_comprehension（四 domain 池） |
| **合计** | 1251 | **110** | |

## 队列文件

`reports/content-human-review-sample-2026-07-05.json` —— 每个样本含：

- setId / legacyId / taskType / examId / level / **sourceStage**（qa_flags.stage）
- stimulus（kind/title/textEn ≤1500 字符）；听力附 **audioPath**（active 音频 storage_path）
- items（≤3 条）：inputMode / prompt / promptZh / choices / **answer** / explanationZh
- 每样本内嵌 reviewer checklist：

```text
verdict: PASS / REVIEW / REJECT
answer_unique?          （答案唯一？）
distractors_plausible?  （干扰项可信？）
level_appropriate?      （难度贴合档位？）
copy_original?          （原创、无真题痕迹？）
audio_natural?          （听力朗读自然？非听力为 n/a）
notes
```

## 复审要点建议（按组）

- **TOEFL reading**：推断题是否真推断（非复述）；complete_the_words 遮盖是否唯一可恢复。
- **TOEFL listening**：口语体是否自然；干扰项是否「听起来合理」；音频与 transcript 一致性抽听。
- **TOEFL writing**：prompt 是否清晰、无争议预设；referencePoints 是否只是评分参考（非官方范文）。
- **Word Universe**：同义是否强同义；易混词是否真实易混；释义不泄答案且不被干扰项吃掉。
- **SAT reading**：短文本单题的 domain 归属是否准确；证据型题是否可从文本闭环。

## 后续

复审结果（PASS/REVIEW/REJECT + notes）回填该 JSON 后交回；是否据此下架/返修由 owner 决定（本任务不行动）。

## DB 写入 / promote

**0 / 0**（纯只读采样）。
