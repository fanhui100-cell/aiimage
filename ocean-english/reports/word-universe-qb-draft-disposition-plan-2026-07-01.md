# qb draft 处置方案（word-universe）

- 日期：2026-07-01
- 性质：**方案报告，本阶段不执行任何处置**（不删除、不改状态、不 promote）。

## 1. 现状

- qb: word-universe（def_to_word/synonym_choice/confusable_choice）共 **600 条，全部 draft，active=0**。
- 结构健康（answer 命中 / 4 选无重复 / 答案位置均衡），但抽样发现内容质量问题（见 §3）。
- 已由 promote 门控（`word_universe_non_gen_source`）+ audit 守卫阻断其误上线。

## 2. 为什么暂不删除

1. **可作历史素材 / 对照样本**：与 gen 原创对照，用于评估生成质量、回溯迁移历史。
2. **删除是不可逆数据操作**：一旦删除无法恢复，风险高。
3. **当前不服务用户**：qb 全 draft，session/paper 只取 active，用户永远抽不到 qb。留存无线上风险。

## 3. 为什么暂不 promote

1. **内容质量问题**（抽样）：送分干扰（accept 干扰 pain/let、accomplishment 干扰 daguerreotype 生僻无关）、生僻同义词（acquit→assoil、acidify→acetify）、**错误同义（activate→aerate）**、过简题（are）。
2. **DeepSeek 来源策略未授权**：项目规则倾向 Claude 原创；qb 为 DeepSeek 期产物。
3. **已被门控硬阻断**：即使误操作，promote 脚本也会以 `word_universe_non_gen_source` 拒绝。

## 4. 三个处置方案

| 方案 | 操作 | 可行性 / 风险 |
|---|---|---|
| ① 保留 draft + promote 门控 | 不动数据，靠门控阻断上线 | **可行、零风险、推荐**。qb 不服务用户，门控 + 审计守卫双保险 |
| ② 标记 rejected（归档态） | `UPDATE status='rejected'`（`question_sets_status_check` 允许 draft/reviewed/active/retired/rejected，**schema 已支持**） | 可行、可逆（可改回 draft）；能把 qb 从「draft 候选池」中显式移出，减少误选面。需写库（本阶段不执行） |
| ③ 最终删除 | 删除 sets+items+target_words | 不可逆；**需用户明确授权 + 先导出备份** |

## 5. 推荐

- **当前：方案 ①（保留 draft + 门控）** —— 零风险、已生效（门控 + 审计守卫已验证 qb 无法上线）。
- **后续（如需清理）**：先方案 ②（标记 rejected，把 qb 移出 draft 候选池，可逆），观察一段时间无回退需求后，再考虑方案 ③（导出备份 → 小批删除）。
- 任何写库处置都需用户明确授权。

## 6. 声明

本阶段**未删除、未改状态、未 promote qb**。仅出方案，等 Codex 复审后再决定是否执行 ②/③。
