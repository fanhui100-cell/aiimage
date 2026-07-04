# Mojibake Cleanup — Report (2026-07-05)

**Task 6 of `2026-07-05-remaining-qbank-toefl-mock-completion-plan.md`.**

## 结论：无需清理（no-op）

按计划模式扫描：

```
rg "鈥|锛|鏉|涓|鍚|绾|鏃|褰|妫|坋|塦|鈫|鉁|鏍|膶|瀛|闂" reports scripts docs
```

**唯一命中**是计划文档自身第 722 行——即该 grep 命令的模式文本本身，非真实乱码。

补充扫描 UTF-8 替换符（`\xEF\xBF\xBD` / `�`）：reports/scripts/docs 均 **0 命中**。

逐一核对计划点名的三个文件，中文注释/正文均清晰可读：

- `reports/toefl-full-mock-readiness-eval-2026-07-04.md` ✅
- `scripts/verify-toefl-reading-expansion.ts` ✅
- `scripts/build-toefl-reading-q4fix-promote-manifest.ts` ✅

判断：乱码已在此前的会话中被清理（或从未以计划预期的形式存在）。

## 变更

- 无逻辑改动、无 SQL 改动、无 manifest ID 改动、无题目内容改动、无验证器期望改动。
- 仅新增本报告。

## Validation

| Command | Exit |
|---|---|
| `git diff --word-diff -- scripts reports docs` | 无待审差异（本任务未改动这些文件） |
| `npm run lint` | 0（Task 5 轮已证，无新改动） |
| `npx tsc --noEmit --incremental false` | 0（同上） |
