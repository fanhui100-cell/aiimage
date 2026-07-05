# Phase 6 · /drill 三面重排 — 交付包

> 给 Claude Code 的完整实现交付物。包含可交互设计 mock（源代码）+ 实现提示词 + 设计规格 + 约束清单。
> **最终方案：考试专项只用「手风琴」一种排版**（主从 / 总览已废弃，不要实现）。

---

## 包内文件

| 文件 | 用途 | 给谁看 |
|---|---|---|
| **`CC_PROMPT.md`** | ⭐ 实现提示词 —— 复制进 Claude Code 的起手指令，含目标 / 步骤 / 验收 / 约束 | Claude Code |
| **`SPEC.md`** | 完整设计规格 —— 三面布局、考试专项 exam→section→task 手风琴 UI、空态文案、组件落点 | Claude Code / 设计评审 |
| **`mock/`** | 可交互高保真 mock（React + Babel 单页），桌面 + 移动，所有交互真实可点 | 实现时对照像素 / 交互 |

## 如何看 mock

直接在浏览器打开 `mock/Drill 三面重排.html`。顶部「桌面 / 移动」可切换视口。三面（单词宇宙练习 / 考试专项 / 模拟试卷）顶部切换；考试专项默认手风琴，点板块行展开/收起，可多开，可「全部展开/收起」。

> mock 用前端推导演示 task 三态（可练 / 题库建设中 / 规划中）。**正式实现以 `/api/practice/session` 真值为准**，详见 SPEC.md §3。

## mock 文件结构

```
mock/
  Drill 三面重排.html   入口（按顺序加载下列脚本）
  data.jsx              数据层：等级 / 题型 / 白名单 / exam-specs / task 三态推导
  shared.jsx            共享组件：Ic 图标 / LevelGrid / WUTypePicker / DrillEmptyState / Toast / MobileChrome
  face-exam.jsx         ⭐ 考试专项（手风琴）= 本期核心
  face-wu-mock.jsx      单词宇宙练习 + 模拟试卷
  app.jsx               外壳：三面切换 + 智能复习入口 + 桌面/移动预览
  redesign.css          新增样式（lx-reviewentry / lx-surfacesw.v2 / lx-es-* / lx-empty / lx-toast）
  drill-merged.css      现有 /drill 样式（原样复制自代码库，勿改）
```

## 三面与决策速览

| 顶部切换 | = 原 surface | 数据源 |
|---|---|---|
| 单词宇宙练习 | self（题型收紧为白名单） | WORD_UNIVERSE_TYPES + 现有出题 |
| **考试专项**（新·核心） | — | `GET /api/exam-specs` + `GET /api/practice/session`(task) |
| 模拟试卷 | mock | `GET /api/mock-exam` |

- **智能复习 (→/memory)**：保留为入口，移出三选一主切换，做成三面顶部常驻细 entry。
- **task → 练习**：跳 `/quiz?mode=task&examId=…&taskType=…&level=…`，复用 PracticeRunner。
- **空池**：`source:'empty'` → 显示「题库建设中」，**绝不回退到无关词汇题**。

→ 细节全部在 `SPEC.md`；实现起手在 `CC_PROMPT.md`。
