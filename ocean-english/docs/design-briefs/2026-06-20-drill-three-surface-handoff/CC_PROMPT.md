# Claude Code 实现提示词 · Phase 6 /drill 三面重排

> 把本文件作为起手指令交给 Claude Code。配套 `SPEC.md`（完整规格）+ `mock/`（可交互设计稿）。
> 在仓库 `ocean-english/` 下实现。**先读 SPEC.md 与 mock 源码，再动手。**

---

## 你的任务

把 `/drill` 从现有三 surface（自选练习 / 智能复习 / 模拟考试）重排为三面，全部由 canonical specs + 安全题池驱动：

1. **单词宇宙练习** — 在原「自选练习(self)」基础上，把题型白名单收紧为 `WORD_UNIVERSE_TYPES`；其余能力（等级 / 技能族 / 自由练 / 限时试炼 / resume / 移动端坞与抽屉）全部保留。
2. **考试专项**（新面，本期核心）— 读 `GET /api/exam-specs`，按 `exam → section → task` 三层选择，**用手风琴排版**（板块整行堆叠、点开内联任务卡）。task 卡分三态：可练 / 题库建设中 / 规划中。
3. **模拟试卷** — 沿用 `MockExamPicker`，改读 canonical exam-specs；TOEFL/SAT(draft) coming-soon。

外加：**智能复习 (→/memory)** 保留为入口但移出三选一，做成三面顶部常驻细 entry。

---

## 硬约束（违反即返工）

1. **沿用现有 /drill 视觉语言**（`lx-*` 类、`DrillShared` 的 `LevelGrid`/`TypePicker`/`Ic` 等），不做整页重设计。新增样式只走 mock 里的 `lx-reviewentry / lx-surfacesw.v2 / lx-es-* / lx-empty / lx-toast`。
2. **不生成新题。** 只读现有题库 / specs。
3. **不移除现有练习能力**（自由练 / 限时试炼 / 模拟考 / 复习入口必须都还在）。
4. **考试任务空池绝不静默回退。** `/api/practice/session` 返回 `source:'empty'` → 显示「题库建设中」空态，**绝不用无关词汇题顶替**。选卡台与 PracticeRunner 两端都要兜底。
5. **退役题型零出现。** `antonym_choice` / `cet_cloze` 不得出现在任何面、任何题源、任何推荐。
6. **单词宇宙题型仅限 `WORD_UNIVERSE_TYPES`。** 用 `isWordUniverseType(t) && !isDeprecatedQuestionType(t)` 双过滤。
7. **生产性任务**（写作/翻译/口语，见 `PRODUCTIVE_TASK_TYPES`）→ 「规划中」态，不伪装可练、不接客观题库。
8. **draft 考试**（TOEFL/SAT）→ 整档「题库建设中」，不可开始。
9. **a11y**：surface / exam / section / task 全部是可键盘 `<button>`（`role="tab"` + `aria-selected` / `aria-expanded`）；空态 `role="status"`，不可用状态以**文字**表达（不能只靠颜色）。
10. **响应式**：桌面 + 移动都要可用；移动端沿用现有「悬浮开练坞 + 设置抽屉」语义（单词宇宙面），考试专项移动端手风琴竖排。

---

## 推荐实现步骤

1. **读上下文**（务必先做）：
   - `SPEC.md`（本包）—— 完整 UI / 文案 / 组件落点
   - `mock/face-exam.jsx` + `mock/redesign.css` —— 考试专项手风琴的最终结构与样式
   - 仓库内真源：`lib/question-bank/question-type-taxonomy.ts`、`lib/exam-specs/{types,specs}.ts`、`lib/practice/session-types.ts`、`app/api/practice/session/route.ts`、现有 `components/screens/drill/{DrillScreen,DrillShared,MockExam}.tsx` + `drill-merged.css`

2. **加 task 池真值（关键）**：当前 `ExamSectionSpec` 没有题量/池状态字段。两选一：
   - **(推荐) 后端补字段**：给 `ExamSectionSpec` 增 `poolStatus?: 'ok'|'empty'` 与 `itemAvailable?: number`，由 `GET /api/exam-specs` 按「板块首选客观 taskType × 等级」预计算填充；前端直接读。
   - **(临时) 前端探测**：对当前展开板块的首选 taskType 调 `GET /api/practice/session?mode=task&examId=…&taskType=…&level=…&count=1`，看 `source` 是否 `empty` / `items.length`。
   - 在补全前，前端按 SPEC §3 的 `deriveTaskState`（taxonomy + draft + productive 判定）渲染，点击仍以 session 真值兜底。

3. **建组件**（命名对照 mock，便于移植）：
   ```
   Modify  components/screens/drill/DrillScreen.tsx        // 三面切换 + ReviewEntry（对照 mock app.jsx）
   Create  components/drill/WordUniversePracticePicker.tsx // = self 面 + 白名单 TypePicker（对照 face-wu-mock）
   Create  components/drill/ExamTaskPicker.tsx             // ⭐ 手风琴 exam→section→task（对照 face-exam）
   Create  components/drill/MockPaperPicker.tsx            // 包 MockExamPicker / 读 exam-specs（对照 face-wu-mock）
   Create  components/drill/DrillEmptyState.tsx            // 统一空态 build/plan/exam（对照 shared.jsx）
   Reuse   components/screens/drill/DrillShared.tsx        // Ic / LevelGrid / TypePicker / typeSummary…
   CSS     drill-merged.css + 追加 redesign.css 段（可整段并入或单独文件）
   ```

4. **task → 练习跳转**：可练卡点击 →
   ```
   /quiz?mode=task&examId={exam.id}&taskType={taskType}&level={exam.level}
   ```
   PracticeRunner 内部调 `GET /api/practice/session(mode:'task')`；空池在 runner 内同样显示 DrillEmptyState（双保险）。
   注意：session API 校验要求 task 模式带 `examId`（字符串 id，如 `cet4`）或显式 `level`；务必传 `examId`。

5. **健壮性**：旧 `localStorage`（如 `lexiB.lastConfig`）与旧推荐配方，经 `isWordUniverseType` + `!isDeprecatedQuestionType` 过滤；过滤后为空 → 安全默认（不预选），不崩溃。

---

## 验收清单

- [ ] 三面顶部切换可用，滑块高亮跟随；智能复习为顶部常驻 entry（跳 /memory），不占三选一。
- [ ] 单词宇宙练习题型 = 13 型（识记/拼写/听辨三族），无 read/grammar 考试题型、无 AI 题型、无退役题型。
- [ ] 考试专项：7 档 strip + 手风琴板块，点开内联任务卡；可多开 + 全部展开/收起。
- [ ] task 三态正确：阅读/听力等客观任务在有池等级显示「可练 + 题量 + 开始练习」；空池显示「题库建设中」；写作/翻译/口语显示「规划中」；TOEFL/SAT 整档「题库建设中」。
- [ ] 可练 task 跳 `/quiz?mode=task&...`，PracticeRunner 正常出题；构造空池场景时 runner 显示空态而非无关词汇题。
- [ ] 模拟试卷：客观题整卷；TOEFL/SAT coming-soon 置灰、CTA 禁用。
- [ ] 移动端三面均可用：切换不溢出、手风琴竖排、单词宇宙坞/抽屉照常。
- [ ] a11y：键盘可达 + 焦点态可见；空态有文字。
- [ ] `validate:exam-specs` / `validate:question-types` / `lint` / `tsc` 全过；/drill 桌面 + 移动 smoke 通过。

---

## 文案（直接用，勿改）

**空态 DrillEmptyState（三 variant）**
- `build` 题库建设中：「该任务的 active 题组数量不足，正在装配。题库就绪后这里会自动可练，期间不会用无关词汇题顶替。」
- `plan` 规划中 · 待生产性任务支持：「写作 / 翻译 / 口语等生产性任务需要 v2 评分（rubric / 录音）支持，结构位已就绪，将随生成阶段开放。」
- `exam` 该考试题库建设中：「官方结构已确立，产品题库仍在装配；以下为规划结构草案，就绪后即可一键接入练习。」

**task 卡内迷你态**
- build：「该 active 题组不足，正在装配；就绪后自动可练，期间不用无关词汇题顶替。」
- plan：「生产性任务（{skill}）需 v2 评分支持，结构位已就绪，随生成阶段开放。」

**模拟试卷 coming-soon**
- 「{考试} 题库建设中 · 以下为规划结构草案；题库就绪后即可一键接入。」

> 其余 UI 文案、状态 pill 文字、路由脚注以 mock 与 SPEC.md 为准。
