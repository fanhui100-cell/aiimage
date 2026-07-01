# Word-Universe qb→gen 替换策略审计

- 日期：2026-07-01
- 性质：**只读审计**。未下线 qb、未 promote、未改题库状态、未调用 DeepSeek。
- 范围：word-universe 单选题 def_to_word / synonym_choice / confusable_choice。

## 1. 是否写库

**否。** 纯只读 SQL + 只读回归命令。active 总数 2164 前后不变。

## 2. 核心结论（先行）

**active word-universe 零 qb 依赖**——171 条 active 全部是 `gen:` Claude 原创；**qb 600 条全部仍在 draft，从未 promote**（0 active）。因此 **「qb→gen 替换」的前提（active 中有 qb）不成立**：没有 qb active 需要下线/替换。

## 3. active 来源分布（A）

| 来源 | active word-universe | 说明 |
|---|---|---|
| gen:（Claude 原创） | **171** | def/synonym/confusable 各 57 |
| qb:（DeepSeek 期） | **0** | 全部在 draft |
| migrated_v1 / other | 0 | — |

三重标识一致（识别可靠）：171 全部 `legacy_id gen:` + `qa_flags.provider=claude-authored` + `source=original_authored` + `authored=claude`。

- **gen active 字母**：a21 b20 c7 d7 e6 f5 g3 h4 i4 j2 **k19** l4 m3 n3 o3 p7 q5 r6 s6 t6 u5 v5 w6 x3 y6 z5（a–z 全覆盖）。
- **gen active exam/level**：全部 toefl / level 6。

## 4. qb 统计（draft，B 结构面）

| 项 | 值 |
|---|---|
| qb 总数 | 600（def/synonym/confusable 各 200），**全部 draft** |
| 字母 | **仅 a(491) + b(109)**，无 c–z |
| exam 分布 | 跨 7 个：zhongkao / gaokao / cet4 / cet6 / kaoyan / toefl / sat |
| 结构健康 | 三型各 200：answer 命中 100%、choices 恰 4 无重复 100% |
| 答案位置 | def A46/B52/C44/D58、synonym A56/B45/C50/D49、confusable A54/B51/C49/D46（均衡，max ≈27–29%） |

## 5. qb 质量抽样（B 内容面）

分层抽样（def/synonym/confusable 各 7，跨 exam，a/b 必含）。**结论：结构健康，但内容质量明显低于 gen。**

| 问题类型 | 样本 |
|---|---|
| 送分干扰（词性混乱/生僻无关） | def `accept`（干扰 pain/let/prefer 词性乱）、`accomplishment`（daguerreotype 生僻无关）、`acoustic`（eukaryotic）、`accession`（apostasy/pediatrics 完全无关） |
| 生僻目标词/同义词 | synonym `acquit→assoil`（古语）、`acidify→acetify`、`actuate→trip`、`adequacy→adequateness` |
| **错误同义（错题）** | synonym **`activate→aerate`**：activate 激活 ≠ aerate 充气 |
| 过简送分 | confusable `are`（zhongkao） |

> 说明：以上为抽样定性画像，非全量判定；qb 全部仍在 draft、未上线，不构成 active 质量风险。**未触发「active 答案错误较多」的硬停止条件**（active 全为 gen，另经历次回归 0 错）。

## 6. 发现的问题分类

1. **来源认知偏差**：任务前提假设 active 有 qb，实际 active 零 qb（全 gen）。
2. **qb 内容质量**：送分干扰、生僻词、个别错题（activate→aerate）、过简题。
3. **qb 覆盖局限**：仅 a/b 字母（600 题挤在两个字母）；但跨 7 exam。
4. **gen 覆盖局限**：a–z 全字母、质量高，但仅 toefl / level 6。

## 7. qb vs gen 对照（C）

| 维度 | qb（draft 600） | gen（active 171） |
|---|---|---|
| 答案位置 | 均衡（DeepSeek 随机放位，max ≈29%） | 均衡（经 rebalance，5/5/5/5 或合并 <40%） |
| 内容质量 | 送分/生僻/个别错题 | 干扰同词性·语义邻域、无送分、经人工自审 |
| 字母覆盖 | 仅 a/b | a–z 全字母（含 k19、p–z） |
| exam/level | 跨 7 exam（zhongkao–sat） | 仅 toefl / level 6 |
| REVIEW/REJECT 倾向 | 抽样即见送分/生僻/错题 → REVIEW/REJECT 比例较高 | 历次抽检 PASS 为主，REVIEW 仅少数边界项 |
| 是否足以覆盖 | — | gen 已覆盖 toefl 的 a/b（41 active）并扩至 c–z；但**非-toefl exam 的 a/b 无 gen 对应** |

## 8. 替换策略（D）

| 选项 | 内容 | 评估 |
|---|---|---|
| ① 保守 | active 继续只用 gen（现状），qb 永久留 draft 不上线 | **可行、推荐** |
| ② 小批替换 | 每型下线 20 qb active + promote 等量 gen | **不适用**——无 qb active 可下线，前提不成立 |
| ③ 全面迁移 | 长期弃用 qb（不 promote），gen 逐步覆盖各 exam；qb 600 最终清理 | 长期方向，需先为非-toefl exam 生成 gen 题池 |

### 推荐：① 保守 + ③ 精神（长期弃用 qb）

理由：
1. **active 已零 qb**，无「替换」需要（前提不成立）。
2. **qb 内容质量不达标**（送分/生僻/错题 activate→aerate），不应 promote 到 active。
3. **gen 已是 active 唯一来源**且质量高、答案位置均衡。
4. 未来若要非-toefl exam 的 word-universe active，应**生成对应 exam 的 gen**（不用 qb）。
5. qb 600 draft 可保留作素材参考或最终清理（独立决策，本阶段不动）。

## 9. 候选清单（E）

**不出下线/上线清单**——无 qb active 可下线，小批替换不适用。若后续要扩非-toefl exam 的 word-universe active，属**新一轮 gen 生成任务**（非替换），届时单独出计划。

## 10. 守卫脚本建议（F，本阶段不实现）

1. **audit-active-source-distribution.ts**：断言 active word-universe 中 `qb/migrated=0`，防未来误 promote qb 到 active（当前 promote 用 `--words --stage=wu-*` 天然只解析 gen stage，安全；此守卫作纵深防御）。
2. promote 脚本可加「word-universe 来源须 `gen:`」硬校验（现有 `--gen` flag 已可，但默认不启；建议对 word-universe 强制）。
3. 现有 `audit-answer-position.ts` 已覆盖答案位置守卫，无需新增。

## 11. 命令 exit code（全部 0）

| 命令 | exit |
|---|---|
| `npx tsc --noEmit` | 0 |
| `npm run lint` | 0 |
| `npm run validate:question-types` | 0 |
| `npm run validate:data-quality` | 0 |
| `npm run validate:qbank-v2` | 0（active 2164 · items 3344 · 错误 0） |
| `npm run qa:qsets-v2` | 0 |
| `npm run validate:practice-session` | 0 |
| `npm run smoke:active-serve` | 0（PASS） |

## 12. 声明

**未下线 qb、未 promote、未改题库状态、未调用 DeepSeek。** 本阶段仅审计 + 出方案，等 Codex 复审后再决定是否执行任何替换/清理。
