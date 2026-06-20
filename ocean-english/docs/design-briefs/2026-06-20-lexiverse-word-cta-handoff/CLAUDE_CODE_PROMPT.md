# CLAUDE_CODE_PROMPT.md
> 直接把下面整段贴给 Claude Code（在 `ocean-english` 仓库根目录运行）。它是自洽的实现指令；视觉与交互细节以同目录 `README.md` / `DESIGN_REPORT.md` / `prototype/` 为准。

---

## 角色与目标
你是在 **`ocean-english`（Next.js + React + TypeScript）** 仓库工作的资深前端。请把 `design_handoff_lexiverse_word_cta/` 中的高保真设计稿，用**本仓库已有的模式、组件与 store** 落地到生产代码。`prototype/` 是 HTML/JSX 设计参考，**不要照搬**内联样式、`window` 全局挂载或「星图替身」——改用真实路由、liquid-ui 组件与 lexiStore。

## 你要交付的改动（按此顺序）

### 1. 新建 `lib/lexiverse/word-practice-links.ts`
纯函数，无 router/store 耦合：
```ts
export function buildWordPracticeLinks(word: DictionaryWord, returnTo: string) {
  const rt = encodeURIComponent(returnTo);
  return {
    practice:    `/quiz?word=${word.id}&returnTo=${rt}`,
    examContext: `/quiz?word=${word.id}&mode=exam-practice&returnTo=${rt}`,
    graph:       `/lexigraph?word=${word.id}`,
    askAi:       `/chat?context=word&word=${word.id}&returnTo=${rt}`,
    browser:     `/dictionary?tab=explore`,
  };
}
```
参考 `prototype/actions.jsx` 顶部同名实现。

### 2. 新建 `components/lexiverse/WordPracticeActions.tsx`
聚焦 CTA 组（**本期核心**）。完整规格见 `README.md` §2 与 `prototype/actions.jsx`。要点：
- Props：`{ word, returnTo, poolEmpty, inToday, onAddToday }`。
- 用 **liquid-ui** 原语重建（`LiquidActionButton` 等），**不要**用原型的内联 `<a style=...>`。
- **练这个词 | 考试语境** 必须是一个**视觉拼接的 split 控件**（共享外框 + 1px 分隔），不是两个独立按钮。练这个词 primary 实心、最大；考试语境 tonal 黄、副标 `EXAM CONTEXT`。
- 词图关系（紫）、加入今日（橙→已加入绿，`disabled` 切换）。
- 次级文字链：问 AI、词库浏览。
- **空池态**：练习 split 整体禁用 + 文案「暂无可练题目」+ 橙字提示「不会用无关随机题替代」；其余 CTA 不受影响。
- 所有可跳转项用 Next.js `<Link>` / `router.push`。
- a11y：`<section aria-label>`、图标 `aria-hidden`、禁用态 `aria-disabled` + **文字**表达（不只靠颜色）。

### 3. 改造 `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`
- 把原来那排 **5 个并排 `LiquidActionButton`** 整体**移除**，替换为 `<WordPracticeActions … />`，放在词头（headword + IPA + badges）**下方**、释义**上方**。
- 词条互链：近义/反义/搭配/同星系词条改成 `<Link href={"/lexiverse/word/" + slugify(label)}>`；`slugify = s => s.toLowerCase().trim().replace(/\s+/g,'-')`。考试等级/主题**不**互链。
- 加入今日接 `lexiStore`：`onAddToday = () => { lexiStore.ensureWord(word,'lookup'); lexiStore.addToReview(word.id); }`；`inToday = lexiStore.isInReview(word.id)`。
- `returnTo = "/lexiverse/word/" + word.id`（透传给链接构造器）。

### 4. 新建导航：`components/lexiverse/word-nav/ProductNav.tsx` + `BottomNav.tsx`
见 `README.md` §「导航与关闭」与 `prototype/nav.jsx`：
- **ProductNav**（桌面 sticky 浮动玻璃条）：Logo｜后退｜区段标签（星图/今日/词库/词图）｜**关闭 ✕**（红调，带 ESC 提示）。区段用 `router.push` 到 `/lexiverse`、`/today`、`/dictionary`、`/lexigraph`。
- **移动**：顶部精简条（后退｜词头｜✕）+ **BottomNav** 底部 Tab 栏（4 项，命中区 ≥44px）。
- **关闭** = `router.push(returnTo)`（默认回 `/lexiverse` 星图，保留 galaxy 参数）。**Esc** 绑 `keydown` 等价关闭（组件卸载时解绑）。**后退** = `router.back()`。
- 响应式按**容器宽度**判断 narrow（用 `ResizeObserver` 或 `@container`），≤480px 走移动布局。

### 5. 视觉细节（hifi 还原）
- 颜色 / 字体 / 字号 / 圆角 / 阴影 / 玻璃模糊：严格按 `README.md` §Design Tokens。复用 liquid-ui 既有 token，缺的再用 Tailwind 任意值补，但**不要新造设计语言**。
- 行星球体（PlanetOrb）：可保留为 CSS 渐变 + 光环/光晕（见 `prototype/cosmos.jsx`），颜色绑学习状态色。
- 词页背景用深空径向渐变即可；**全屏星空与 3D 宇宙由现有 `/lexiverse` 提供，不要在词页重建 canvas 星空**。
- 入场动画：`.rise` 只动 `translateY`，**base `opacity:1`**；用 `prefers-reduced-motion: no-preference` 包裹；分段 delay 见 README。行星/光环/光晕动画在 reduced-motion 下停。
- 图标：把原型内联 SVG 换成仓库现有图标库（如 lucide）的等价图标。

## 硬约束（不可违反）
1. **不动** 3D 渲染与 `ReferenceLexiverseFrame` 的 postMessage / origin 校验。
2. **不造新题**：`mode=exam-practice` 只是本词题库的考试镜头参数；v1 无独立「按词考试题」就不要新建题源。
3. **绝不**把按词练习静默回退成无关随机题；本词无题 → 受控空态（CTA 禁用 + 文案）。
4. **不新增设计 token**；复用 `components/lexiverse/liquid-ui`。
5. 加入今日复用现有 `ensureWord + addToReview`，已加入读 `isInReview`；v1 视「今日 = 今日复习队列」，**不新增 store API**。
6. 保持旧链接兼容：`/quiz?word=`、`/lexigraph?word=`、`/dictionary?tab=explore`、`/lexiverse` iframe 流。
7. 不要实现 `prototype/page.jsx` 里的「Live/已加入/空池 + 桌面/移动」评审切换器——那是设计工具，非产品。

## 验收清单（完成后自查）
- [ ] 词头下方是有主次的 CTA 组，旧 5 按钮已移除，无功能重复。
- [ ] 练这个词 / 考试语境为拼接 split；链接分别带 `&mode=exam-practice`。
- [ ] 加入今日点击后变「已加入今日」（绿、禁用），刷新后由 `isInReview` 保持。
- [ ] 空池态：练习禁用 + 文案提示，词图/加入今日仍可用，**无随机题回退**。
- [ ] 近义/反义/搭配/同星系词条点击跳到对应 `/lexiverse/word/<slug>`；查无走占位态不报错。
- [ ] 桌面 ProductNav + 移动 BottomNav 均可用；关闭 ✕ / Esc / 后退 行为正确，关闭回到星图。
- [ ] 移动端（≤480px 容器）单列、无横向滚动、命中区 ≥44px。
- [ ] 入场动画在 reduced-motion / 首屏异常下内容仍可见（base opacity=1）。
- [ ] a11y：键盘可达、焦点可见、禁用态有文字说明、图标 aria-hidden。
- [ ] 颜色/字体/间距与 `README.md` Design Tokens 一致。

## 参考阅读
- `README.md` —— 屏幕/组件/token/交互全量说明。
- `DESIGN_REPORT.md` —— 设计决策依据（为何 split、为何替换 5 按钮、空态策略、返回流、安全约束）。
- `prototype/*.jsx` —— 像素与交互的事实来源（注意：是设计参考，非生产代码）。
