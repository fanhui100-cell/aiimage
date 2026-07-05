# Word-Universe 来源治理总报告

- 日期：2026-07-01
- 目标：防止 qb 误上线 + 建立来源审计门禁 + qb draft 处置方案 + gen 扩容计划。
- 性质：改脚本/校验/报告；**未改题库状态、未 promote、未下线/删除 qb、未调 DeepSeek、未改前端/schema**。

## 1. 改动文件

**脚本 / 配置：**
- `scripts/promote-question-sets-v2.ts` —— 新增 word-universe 来源硬门控。
- `scripts/audit-word-universe-source-distribution.ts` —— 新增（来源分布审计）。
- `scripts/validate-word-universe-promote-guards.ts` —— 新增（反误 promote 验证）。
- `package.json` —— 新增 `validate:wu-promote-guards`、`audit:wu-source`。

**报告：**
- `reports/word-universe-qb-draft-disposition-plan-2026-07-01.md`（D）
- `reports/word-universe-gen-expansion-plan-2026-07-01.md`（E）
- `reports/word-universe-source-governance-2026-07-01.md`（本文件，G）
- 产物：`reports/word-universe-source-distribution.json`、`reports/word-universe-promote-guards-validation.json`

## 2. 是否写库

**否。** 纯脚本/校验/报告 + 只读 SQL/回归。active 总数 2164 前后不变。

## 3. 新增脚本与 npm script

| 命令 | 作用 |
|---|---|
| `npm run audit:wu-source` | active word-universe 来源分布审计；`--fail-on-qb-active` 时 qb>0 即 exit 1 |
| `npm run validate:wu-promote-guards` | 验证 qb draft 被拒、gen draft eligible、active qb=0、退役门控在 |
| （手动）`audit-word-universe-source-distribution.ts --status=draft/all --json` | 任意状态的来源分布 + JSON |

## 4. promote 门控规则（B）

对 word-universe 三型（def_to_word / synonym_choice / confusable_choice），promote（dry-run 与 apply）必须满足全部：
- `legacy_id` 以 `gen:` 开头
- `qa_flags.source = original_authored`
- `qa_flags.authored = claude`
- `qa_flags.provider = claude-authored`

不满足 → `rejected`，reason=`word_universe_non_gen_source`。**仅对这三型生效**，不影响阅读/听力/篇章/productive 题；退役题型仍先被 `deprecated_type` 拒；`--words --stage --task` 流程保留。

## 5. active source distribution 审计结果（`audit:wu-source`）

```
word-universe source distribution · status=active · total 171
  bySource: gen 171 / qb 0 / migrated_v1 0 / other 0
  def_to_word: gen 57 / qb 0 / ...
  synonym_choice: gen 57 / qb 0 / ...
  confusable_choice: gen 57 / qb 0 / ...
  badProvenance: 0    → exit 0（--fail-on-qb-active 通过）
```

`validate:wu-promote-guards`：**PASS** —— active qb=0；qb draft → `rejected:word_universe_non_gen_source`；gen draft → `eligible(1)`；退役门控（isDeprecatedQuestionType）在，库中无退役 set。

## 6. qb draft 处置建议（D 摘要）

- qb 600 全 draft、active=0、被门控阻断上线。
- **推荐：方案①保留 draft + 门控**（零风险、已生效）。
- 后续如清理：方案②标记 `status='rejected'`（`question_sets_status_check` 已支持 draft/reviewed/active/retired/rejected，**无需改 schema**，可逆），再考虑方案③删除（需授权 + 备份）。
- 本阶段不执行。详见 [qb-draft-disposition-plan](word-universe-qb-draft-disposition-plan-2026-07-01.md)。

## 7. gen 扩容建议（E 摘要）

- 当前 gen active 171（三型各 57，a–z 全字母，仅 toefl/L6）。
- **推荐下一批：TOEFL L6 续补**（每型 +30 draft，风险最低）；次选 SAT L7 pilot（每型 30 draft）。
- IELTS L8 / 中考–考研 暂缓（词库/等级待定）。
- **不自动生成，等用户确认**。详见 [gen-expansion-plan](word-universe-gen-expansion-plan-2026-07-01.md)。

## 8. 所有命令 exit code（全部 0）

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
| `npm run validate:wu-promote-guards` | 0（PASS） |
| `npm run audit:wu-source` | 0（gen 171 / qb 0 / badProvenance 0） |

## 9. 声明

**未 promote、未下线 qb、未删除 qb、未调用 DeepSeek、未改前端、未改 schema。** 本阶段仅建立门控/审计/方案；qb draft 处置与 gen 扩容均待 Codex 复审后再决定执行。
