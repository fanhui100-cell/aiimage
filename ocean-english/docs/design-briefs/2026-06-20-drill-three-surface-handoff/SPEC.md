# Phase 6 · /drill 三面重排 — 设计规格（SPEC）

> 配套 `mock/`（可交互设计稿）+ `CC_PROMPT.md`（实现起手）。本文件给 UI / 文案 / 组件 / 约束的完整决策。
> **考试专项排版最终只用「手风琴」**；早期探索的「主从 / 总览」已废弃，不要实现。

---

## 0. 三面与去留决策

| 顶部切换 | 数据源 | = 原 surface |
|---|---|---|
| **单词宇宙练习** | `WORD_UNIVERSE_TYPES` + 现有出题接口 | 自选练习(self)，题型白名单收紧 |
| **考试专项**（新·核心） | `GET /api/exam-specs` + `GET /api/practice/session`(task) | — |
| **模拟试卷** | `GET /api/mock-exam` + canonical exam-specs | 模拟考试(mock) |

**智能复习 (→/memory)：保留为入口，移出三选一主切换。** 改为三面顶部一条独立细 entry（`.lx-reviewentry`），点按跳 `/memory`。理由：它是「跳转聚合页」而非「出题面」，与三面并列会稀释主切换语义；常驻 entry 既不丢入口，又让三面纯粹是三种出题方式。

---

## 1. 三面布局规格（复用 / 新增 lx-* 类）

### 复用（不改）
- 容器 / 排版：`lx`, `lx-aurora`, `lx-scroll`, `lx-pad / lx-pad-d`, `lx-eyebrow / lx-h1 / lx-sub`, `lx-step*`
- 单词宇宙面：`lx-lvgrid/lx-lv*`、`lx-fam*/lx-chips/lx-chip*`、`lx-recipes/lx-recipe`、`lx-resume`、`lx-launch/lx-lcard*`、`lx-launchdock/lx-split/lx-splitbtn`、`lx-sheet*`、`lx-banknote`
- 模拟试卷面：`lx-exam-grid/lx-exam*`、`lx-paper*`、`lx-soonbanner`
- 来自 `DrillShared`：`Ic`、`LevelGrid`、`TypePicker`、`MobileChrome`、`Aurora`

### 新增（见 `mock/redesign.css`，可并入 drill-merged 或单独文件）
- `lx-reviewentry*` — 智能复习细 entry
- `lx-surfacesw.v2` + `.thumb` — 三面切换升级（滑动高亮 + 三色 teal/blue/violet）
- `lx-es-*` — 考试专项整面（strip / 手风琴 / task 卡 / 状态 pill / 路由脚注）
- `lx-empty*` — 统一空态 `DrillEmptyState`
- `lx-toast` — 任务跳转 / 动作反馈（可选）

### 三面色相
单词宇宙 = teal（沿用 self），考试专项 = blue（`--blue-ink`），模拟试卷 = violet。考试专项面在根 `.lx` 加 `.face-exam` 把 `--accent*` 切到 blue。

### 字体注意（已在 mock 修正）
标题 `.lx-h1` 内的强调 `<em>` 用**正体 Noto Serif SC**（`font-style:normal`）+ 同色 18% 高亮托底，**不要用 Newsreader italic** —— 中文无斜体字形会被合成「假斜体」歪斜。规则见 redesign.css 顶部 `.lx .lx-h1 em`。

---

## 2. 单词宇宙练习面（self 改造）

保留：等级 `LevelGrid` + 技能族 `TypePicker`（4→3 族：识记/拼写/听辨）+ 双启动卡（自由练 / 限时试炼）+ resume + 移动端坞/抽屉。**全部沿用现有组件**，唯一变化是题型白名单：

```ts
// 题型 = TYPES.filter(t => isWordUniverseType(t.key) && !isDeprecatedQuestionType(t.key))
// 结果 13 型，分属 recognize / spell / listen 三族：
//   recognize: en_to_zh, zh_to_en, def_to_word, synonym_choice, synonym_substitute,
//              confusable_choice, collocation_choice, cloze_choice
//   spell:     zh_to_word_spell, cloze_spell, word_form
//   listen:    listen_to_meaning, dictation_spell
// 不出现：阅读族(reading_comprehension/cloze_passage/seven_select/banked_cloze/para_match)、
//        grammar_fill、listening_comprehension（这些归考试专项）、
//        speak/produce(AI 族)、antonym_choice/cet_cloze(退役)
```

- `def_to_word` 是 DB 实际命名（`definition_to_word` 等是别名，勿作独立题型）。
- 旧 `localStorage`/旧配方经双过滤；为空 → 安全默认（不预选）。

---

## 3. 考试专项面（核心）— exam → section → task（手风琴）

### 数据
`GET /api/exam-specs` → `ExamSpec[]`。层级 `exam.sections[].taskTypes[]`：**一个 section 的每个 taskType = 一张 task 卡**（多数 section 单 task；如考研 Part B 的 `[seven_select, para_match]` = 2 张卡）。

### 桌面布局（手风琴）
```
[考试 strip：7 档横向 chip，可滚动]                ← .lx-es-strip / .lx-es-exam(.on/.soon)
[手风琴工具条：「{考试} · N 板块 · M 任务」  全部展开/收起]  ← .lx-es-accbar
┌─ 板块行（可点展开） ─────────────────── 状态chip ▸┐  ← .lx-es-accrow / .lx-es-acchead
│  ▾ 展开体：task 卡网格 + 路由脚注                   │  ← .lx-es-accwrap>.lx-es-accinner>.lx-es-accbody
├─ 板块行 ──────────────────────────────────────────┤
│  …（可多开）                                        │
└────────────────────────────────────────────────────┘
```

**手风琴交互**
- 默认展开第 1 个板块；切换考试 → 复位到该考试第 1 板块。
- **支持多个板块同时展开**（点头部 toggle）；工具条「全部展开 / 全部收起」。
- 平滑高度：`grid-template-rows: 0fr → 1fr` 纯 CSS 过渡（无需 JS 测量）。`aria-expanded` 同步。
- **折叠态也带状态 chip**（`.lx-es-hchip`）：可练 N / 题库建设中 / 规划中 —— 不展开即可扫读每板块状态。
- 工具条显示当前考试名做上下文锚点（strip 滚走也知在看哪档）。

### 移动布局
- strip 横滚（scroll-snap）；手风琴板块竖排堆叠（天然适配窄屏，不需横向 rail）；task 卡单列。
- 头部英文副标 `em` 在窄屏隐藏，内边距收紧（见 redesign.css `.lx.phone .lx-es-acchead`）。
- 考试专项移动端**不需要**单词宇宙那种「悬浮开练坞」——每张可练 task 卡自带「开始练习」。

### task 卡三态（**关键约束：空池绝不回退**）
选卡台用 taxonomy + 池信息预标注；**点击可练卡时再以 `/api/practice/session` 真值为准**。

```ts
function deriveTaskState(exam, taskType) {
  if (exam.status === 'draft')          return 'build'  // toefl/sat 整档建设中
  if (isProductiveTaskType(taskType))   return 'plan'   // 写作/翻译/口语 → 规划中(待v2)
  if (isExamTaskType(taskType))         return poolCount(exam.id, taskType) > 0 ? 'ok' : 'build'
  return 'build'
}
// section 整体态：任一候选 ok → ok；全 plan → plan；否则 build（折叠 chip 用）
```

| 态 | pill | 卡内 | 动作 |
|---|---|---|---|
| `ok` 可练 | 绿 + 脉冲点 | `{count} 题在库` | 「开始练习 →」按钮 |
| `build` 题库建设中 | 金 | 迷你说明（见文案） | 无按钮 |
| `plan` 规划中 | 紫 | 迷你说明（见文案） | 无按钮 |

task 卡含：skill 图标 + 中/英标题 + 标签行（skill / groupMode / 题量 / 分值 / 需音频 / 需评分）+ 三态底部。

> **题量来源**：mock 用前端 `typeCount(taskType, examLevel)` 占位演示三态。**正式实现请后端给 `ExamSectionSpec` 补 `poolStatus:'ok'|'empty'` + `itemAvailable:number`**（由 exam-specs 接口预计算），前端读真值替换；补全前用 `deriveTaskState` 渲染、点击以 session 兜底。

### task → 开始练习
**跳 `/quiz`，复用 PracticeRunner**（不在 /drill 内联新答题流）：
```
/quiz?mode=task&examId={exam.id}&taskType={taskType}&level={exam.level}
```
- `examId` 传字符串 id（`cet4` 等）；session API 校验：task 模式需 `examId` 或显式 `level`，两者都给最稳。
- PracticeRunner 内 `GET /api/practice/session(mode:'task')`；`source:'empty'` → runner 内显示同一 `DrillEmptyState`（双保险），不出无关词汇题。

---

## 4. 模拟试卷面

沿用 `MockExamPicker`（`lx-exam-grid` + `lx-paper`），改读 canonical exam-specs（客观题板块）替代旧 `PAPER_SPECS`，口径统一。
- TOEFL/SAT（`status:'draft'`）→ `lx-soonbanner` + 置灰 `lx-exam.soon` + CTA disabled。
- 题源经 `bestTask`（板块首个可练客观 taskType）取，**绝不暴露退役题型**；生产性任务板块标「主观题 · 不计入客观卷」。

---

## 5. 空态 / coming-soon 确切文案（`DrillEmptyState`）

统一组件，三 variant（`role="status"`，文字表达不可用，非仅颜色）：

| variant | 标题 | 正文 |
|---|---|---|
| `build` | **题库建设中** | 该任务的 active 题组数量不足，正在装配。题库就绪后这里会自动可练，期间不会用无关词汇题顶替。 |
| `plan` | **规划中 · 待生产性任务支持** | 写作 / 翻译 / 口语等生产性任务需要 v2 评分（rubric / 录音）支持，结构位已就绪，将随生成阶段开放。 |
| `exam` | **该考试题库建设中** | 官方结构已确立，产品题库仍在装配；以下为规划结构草案，就绪后即可一键接入练习。 |

task 卡内迷你态：
- build：`该 active 题组不足，正在装配；就绪后自动可练，期间不用无关词汇题顶替。`
- plan：`生产性任务（{skill}）需 v2 评分支持，结构位已就绪，随生成阶段开放。`

模拟试卷 coming-soon：`{考试} 题库建设中 · 以下为规划结构草案；题库就绪后即可一键接入。`

---

## 6. 约束清单（不可违反）

1. 沿用 `lx-*` 与 `DrillShared`，不整页重设计；新增类只走 `lx-reviewentry / lx-surfacesw.v2 / lx-es-* / lx-empty / lx-toast`。
2. 单词宇宙白名单：`isWordUniverseType(t) && !isDeprecatedQuestionType(t)` 双过滤；永不出现 `antonym_choice / cet_cloze` 与考试任务/AI 题型。
3. 考试任务空池：`source:'empty'` → `DrillEmptyState(build)`，**绝不静默回退无关词汇题**；选卡台 + runner 两端兜底。
4. 生产性任务 → `plan` 态，不伪装可练、不接客观题库。
5. draft 考试 TOEFL/SAT 整档 `build`/coming-soon，不可开始。
6. 不生成新题、不移除现有练习能力（自由练/限时试炼/模考/复习入口全保留）。
7. 退役题型零出现；模拟卷题源经 `bestTask` 选可练客观 taskType。
8. 旧数据健壮：旧 localStorage / 旧配方经 taxonomy 过滤；为空 → 安全默认，不崩溃。
9. a11y：surface/exam/section/task 均为可键盘 `<button>`（`role="tab"`/`aria-selected`/`aria-expanded`）；空态 `role="status"`，状态以文字表达，状态圆点 `aria-hidden`。
10. 响应式：桌面手风琴多开；移动 strip 横滚 + 手风琴竖排 + 单词宇宙坞/抽屉；两视口均可用不崩溃。
11. 校验：`validate:exam-specs` / `validate:question-types` / `lint` / `tsc` 全过；/drill 桌面 + 移动 smoke 通过。

---

## 7. 组件落点

```
Modify  components/screens/drill/DrillScreen.tsx        // 三面切换 + ReviewEntry（对照 mock/app.jsx）
Create  components/drill/WordUniversePracticePicker.tsx // = self 面 + 白名单 TypePicker（对照 face-wu-mock.jsx）
Create  components/drill/ExamTaskPicker.tsx             // ⭐ 手风琴 exam→section→task（对照 face-exam.jsx）
Create  components/drill/MockPaperPicker.tsx            // 包 MockExamPicker / 读 exam-specs（对照 face-wu-mock.jsx）
Create  components/drill/DrillEmptyState.tsx            // 统一空态 build/plan/exam（对照 shared.jsx）
Reuse   components/screens/drill/DrillShared.tsx        // Ic / LevelGrid / TypePicker / typeSummary…
Reuse   drill-merged.css + 追加 redesign.css 段
```

mock 中函数命名与上表对照：`WordUniverseFace / ExamSpecialtyFace（手风琴）+ TaskCard / MockPaperFace / DrillEmptyState / SurfaceSwitch / ReviewEntry`，可直接对照移植。

> mock 为演示用 React+Babel 单页；生产实现请按仓库现有 TSX 组件规范落地，数据从真实接口取，不要把 mock 的 `data.jsx` 静态数据照搬进生产。
