# PROMPT —— 给 Claude Code 的实现提示词

> 把下面整段贴给 Claude Code（在 `ocean-english` 仓库根目录运行）。它与同目录的 `README.md` / `CONSTRAINTS.md` / `references/` / `css/` 配套。

---

你在 `ocean-english`（Next.js App Router + React + TypeScript + Tailwind + Supabase）仓库里工作。请实现 **Phase 5：把 `/quiz` 迁移到统一 Practice Session API 的可复用 `PracticeRunner`，并叠加「高级版」视觉**。

**先读**：本目录 `README.md`（完整规格、数据契约、五状态/六 renderer、令牌、验收标准）、`CONSTRAINTS.md`（硬约束）、`references/PracticeRunner Premium.html`（主参照，hi-fi 可交互）、`references/PracticeRunner 走查.html`（五状态 + 六 renderer + 建设中占位）。`references/` 里的 HTML 是**设计参照**，不是要拷贝的代码 —— 用仓库既有的 `.pr-v2` class、globals 令牌与 `next/font` 字体重建。

## 必做约束（违反即返工）
1. **复用** `components/quiz/practice-session.css` 的 `.pr-v2` 视觉骨架与全部 globals 令牌；**不新增颜色**、不引入新设计系统。
2. 保留 `/quiz` **全部旧 URL 参数**可用（见 README §4），旧链接绝不 404/崩溃。
3. **退役题型永不渲染**：`antonym_choice`、`cet_cloze`（filter 双保险；`cet_cloze` 旧缓存重映 `cloze_choice`）。
4. 保留 `components/quiz/LexiverseQuizClient.tsx` 作 legacy fallback；**不删、不碰 `/drill`**。
5. 每答一题 `POST /api/practice/attempts`；返回 `storage:'none'` **不得**打断本地计分；`wordUpdates` 由客户端应用到 `lexiStore`（`markCorrect`/`markWrong`/`recordDimPass`），runner 不直接写 store。
6. `multi_blank`/`matching` 无数据 → **受控「建设中」占位**，不报错、不计分。

## 步骤
1. **`components/practice/practice-types.ts`**：对齐 `lib/practice/session-types.ts` 的 `PracticeItem` / `PracticeSessionResponse` / `RecordAttemptInput` / `RecordAttemptResponse`，并定义 runner 内部的会话/单题状态类型（README §8）。
2. **`components/practice/PracticeRunner.tsx`**（client）：
   - props：`initialMode`、`word`、`level`、`examId`、`taskType`、`count`、`legacySearchParams`。
   - 取数：`GET /api/practice/session`（按 mode 拼 query），管理 `loading / empty / error / play / results` 五态（README §5.1，复用 `LoadingState`、`.results`、`.cta`）。
   - 作答：每题 `POST /api/practice/attempts`，本地维护 `results`，应用 `wordUpdates` 到 `lexiStore`。
   - 键盘：`1-4`/`a-d` 选项、作答后 `Enter` 下一题。
3. **`components/practice/PracticeFrame.tsx`**：`<main className="theme-light pr-v2"><div className="pr-app">…</div></main>` 外壳。
4. **`components/practice/renderers/*`**（按 `inputMode` 路由，README §5.2）：`ChoiceRenderer`、`SpellRenderer`、`ListeningRenderer`、`FreeTextRenderer`、`MultiBlankRenderer`、`MatchingRenderer`。
   - **SpellRenderer 务必照 README §7 的拼写修复**：Enter 处理里 `e.stopPropagation()` + `isComposing/keyCode===229` 守卫 + 输入过滤 `/[^a-zA-Z '\-]/g`；Levenshtein `d===1` 一次容错。
   - Choice 用真 `<button aria-pressed>`；listening transcript 仅答题后显示；free_text 不自动判分（中性反馈）。
5. **`app/quiz/page.tsx`**：把旧参数映射成 `PracticeRunner` props（README §4）渲染 runner；`vs` / `yesterday` / `wrong-answer-booster` 仍走 `LexiverseQuizClient` legacy 路径（flag/fallback），验证通过前不删 legacy。
6. **视觉高级化**：把 `css/practice-session-premium.css` 放到 `components/quiz/practice-session-premium.css`，在 runner 里 `import './practice-session.css'` 之后 `import './practice-session-premium.css'`。桌面两栏「任务栏」(`.pr-rail`) 默认**不**做，留作后续。
7. **无障碍**：选项键盘可达 + `aria-pressed`；spell/free-text 配 `<label>`；loading/results `aria-live`；不可用态 `aria-disabled` + 文字（不只颜色）。
8. **进场动画**：可见态做基样式，从隐藏态用 `@keyframes` 进入（README §7），避免动画不跑时卡隐藏。

## 自检（对照 README §12 验收）
- 跑通 4 条 URL：`?word=ability`、`?mode=reading-practice&level=3`、`?mode=listening-practice&level=3`、`?mode=exam-practice&drill=synant&level=7`。
- 拼写题：回车只提交不跳题、容错一次、挡中文/输入法。
- `npm run validate:practice-session`、`lint`、`tsc` 全过。
- 旧链接/退役题型/空错占位逐项验证。

实现时如对数据形态有疑问，以 `lib/practice/session-types.ts` 与 `app/api/practice/**` 的真实代码为准。
