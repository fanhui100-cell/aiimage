# Lexiverse 单词入口 — Phase 7 设计报告（词详情页聚焦 CTA）

> 落地文件：`app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`、新建 `components/lexiverse/WordPracticeActions.tsx`、`lib/lexiverse/word-practice-links.ts`
> 设计稿：`lexiverse_word_cta/Lexiverse 词入口 CTA.html`（含 Live / 已加入今日 / 空池 三态切换 + 桌面/移动）

---

## 1. 与现有 5 按钮的关系 —— 决策：**结构化替换**

现状那排 5 个 `LiquidActionButton` 是无层级的并排 pill，且与本期 4 CTA 三处重复（Quiz=练、LexiGraph=词图、Add to Review=加入）。

**最终按钮集合与层级：**

| 层级 | 按钮 | 取代旧按钮 |
|---|---|---|
| **主操作（聚焦组）** | 练这个词 / 考试语境 / 词图关系 / 加入今日 | Quiz this word、Open in LexiGraph、Add to Review |
| **次级工具（降级为文字链）** | 问 AI · 词库浏览 | Ask AI、Open Vocab Browser |

→ 旧的 5 按钮整排移除，由 `WordPracticeActions` 一个组件接管。无重复、有主次。沿用 liquid-ui 风格（玻璃、细描边、12–14px 圆角、accent glow）。

---

## 2. CTA 组视觉规格

放置位置：headword（含发音/IPA/badges）**下方**，定义/例句**上方**——进入页面第一屏即是主操作区。

```
START FROM THIS WORD · 从这个词出发              ● 本词题库 · 12 题就绪
┌──────────────────────────┐  ┌──────────┐  ┌──────────┐
│ ◎ 练这个词 │ ▤ 考试语境  │  │ ⋈ 词图关系│  │ ⊕ 加入今日│
│  PRACTICE  │ EXAM CONTEXT│  │ LEXIGRAPH │  │ADD TODAY │
└──────────────────────────┘  └──────────┘  └──────────┘
─────────────────────────────────────────────────────────
MORE   ⌗ 问 AI Ask AI    ▤ 词库浏览 Browser
```

| CTA | 形态 | accent | 图标 | 链接 |
|---|---|---|---|---|
| 练这个词 | **primary 实心**（渐变填充，深色字，最大） | `#7EF9FF` 青 | 靶心 target | `/quiz?word=X&returnTo=…` |
| 考试语境 | **tonal**，与「练这个词」**拼接成 split 单元**（共享外框 + 1px 分隔） | `#FFD66B` 黄（呼应 examTags） | 试卷+对勾 | `/quiz?word=X&mode=exam-practice&returnTo=…` |
| 词图关系 | tonal 独立 pill | `#B79BFF` 紫 | 节点图 | `/lexigraph?word=slug` |
| 加入今日 | tonal 独立 pill（可切换态） | `#FFA85A` 橙 | 加号圈 | store：`ensureWord+addToReview` |

- 每个 CTA：中文主标题（13.5–15.5px 粗）+ Space Mono 英文副标（10px）双行，信息密度高但不拥挤。
- 组顶右侧 **题库状态点**：青点「12 题就绪」/ 橙点「本词暂无题目」。
- **响应式**：桌面横排 `flex-wrap`；移动端自动换行，split 单元整体保持不拆，主操作仍居首屏（移动稿已验证）。

---

## 3. 「考试语境」与「练这个词」的区分方案 —— **split 拼接，同源双镜**

不做成无关的独立题库；二者**共用本词题库**，只是「镜头」不同：

- **练这个词** = 综合背词（en→zh / cloze / synonym 全题型，主 CTA）。
- **考试语境** = 该词的语境/考试风格题（cloze·同义·辨析），副标 `EXAM CONTEXT`，黄色呼应考试标签。

视觉上把两者**拼成一个 split 控件**（左主右副、中间 1px 分隔），明确传达「同一个词的两种练法」，而非两个独立题源。文案与 `title` 提示均强调「仍来自本词题库」。**硬约束达成：考试语境永不静默回退成无关随机题。** v1 若无「按词的考试任务题」，`mode=exam-practice` 只是 word session 的考试镜头参数。

---

## 4. 空态 / 不可用态（文字表达，非仅颜色）

- **空池（本词无题）**：练习 split 单元整体置灰、不可点，主标改为 **「暂无可练题目 / NO ITEMS YET」**；组顶状态点变橙「本词暂无题目」；下方红字提示：
  > ⚠ 本词暂无可练题目，正在补充中——不会用无关随机题替代。可先「加入今日」或查看「词图关系」。
  - 词图关系 / 加入今日 **不受影响**（不依赖题库），保持可用。
  - PracticeRunner 侧已有受控空态；词详情页这层「点击前提示」避免用户跳转后才碰壁。
- **加入今日 — 已加入态**：橙 pill → 绿 `#6BE0A0` pill，文案 **「已加入今日 / IN TODAY'S QUEUE」**+ 对勾图标，`disabled`；下方绿字：「已加入今日复习队列 · 将按 SRS 节奏在『今日』出现。」状态用**文字+图标**双重表达，不只靠颜色。

---

## 5. 返回流 —— 无需额外 UI

所有练习类 CTA 均带 `returnTo=/lexiverse/word/<slug>`（保留 galaxy 参数回跳）。PracticeRunner 顶部「退出/返回」按 returnTo 回到词详情页。**确认：词详情页侧不需新增返回 UI。**

---

## 6. iframe —— **不触碰**

默认**不**改 `ReferenceLexiverseFrame` 的 postMessage / 导航。本期 CTA 仅落在词详情页（点星球进入后）。**不**在星球级加 CTA，避免引入新的导航事件面。若未来要做星球级 CTA，须维持严格 origin 校验、白名单化导航目标（不接受任意 URL），届时另开。

---

## 7. a11y

- 所有 CTA 为可键盘的 `<a>`/`<button>`；链接用真实 `href`。
- 所有图标 `aria-hidden`，含义由文字承载。
- 不可用态：`aria-disabled` + **文字**说明（「暂无可练题目」「已加入今日」），不靠颜色单独区分。
- `<section aria-label="Word practice actions">` 包裹整组。

---

## 8. 给 Claude Code 的约束清单

1. **不动 3D / 场景**：本期零改动 Lexiverse 3D 与星图渲染。
2. **不弱化 postMessage 安全**：`ReferenceLexiverseFrame` 严格 origin 校验保持不变，不接受任意导航目标。
3. **不造新题**：`mode=exam-practice` 仅为 word session 的考试镜头参数，复用本词题库；v1 无「按词考试任务题」就不要新建题源。
4. **不破坏旧链接**：`/quiz?word=` 旧链接、`/lexiverse` iframe 流、`/lexigraph?word=`、`/dictionary?tab=explore` 全部保持兼容。
5. **绝不把按词练习回退成随机题**：空池一律走受控空态（PracticeRunner 空态 + 词详情页点击前提示），禁止静默替换为无关题。
6. **复用 liquid-ui**：不新增设计 token；新组件沿用 `LIQUID` 配色/圆角/玻璃质感与现有 accent（青/黄/紫/橙/绿）。
7. **store 路径复用**：加入今日 = 现有 `lexiStore.ensureWord(word,'lookup') + addToReview(word.id)`，已加入态读 `isInReview`。若产品要区分「今日」与「复习」语义且无独立 store 路径，则「加入今日」按受控不可用态处理并在此报告标注——**当前 v1 视「今日 = 今日复习队列」，直接复用现有路径，无需新 API。**

---

## 8.5 词条跳转 & 响应式（本次补充）

- **词条点击跳转星球**：近义词 / 反义词 / 搭配 / 同星系词语的每个词条都是 `<a href="/lexiverse/word/<slug>">`，点击进入该词的词详情页（=它在宇宙里的「星球」），`slug = word.toLowerCase().replace(/\s+/g,'-')`。考试等级 / 主题领域**不**跳转（非单词）。落地时复用现有词典 slug 规则；查无该词走 `resolveWord` 的受控空态页（「词条数据补全中」，不报错）。
- **移动端**：单列布局；练习 split 单元整行铺满（练这个词 | 考试语境 各占一半），词图关系 + 加入今日并为两列；信息卡片单列；行星球体缩小、与词头纵向堆叠；释义/例句单列。断点按容器宽度（≤480px 视为窄）。

## 8.6 导航 & 关闭页面（本次补充）

词详情页是从星图点击星球进入的**整页路由**，因此需要明确的「进入—返回—关闭」闭环：

- **顶部产品导航（桌面）**：浮动玻璃条 = Logo｜后退｜区段标签（星图/今日/词库/词图）｜**关闭 ✕**。区段标签复用既有路由 `/lexiverse`、`/today`、`/dictionary`、`/lexigraph`（原型里非星图区段只弹提示，落地直接用真实路由）。
- **移动端**：顶部精简条（后退 ←｜词头｜关闭 ✕）+ **底部 Tab 栏**（星图/今日/词库/词图），符合移动 App 习惯；命中区 ≥44px。
- **关闭 ✕** → 回到 `returnTo`（即星图 `/lexiverse`，含 galaxy 回跳参数）；**Esc** 等价关闭；**后退** 在词→词跳转间回退，到头则回星图。
- **星图（CosmosMap）是原型替身**：演示「关闭后回到哪里」「点星球进入词」。**落地时星图就是现有 `/lexiverse` 的 3D iframe，不要重建**——词页只需新增 Close(→returnTo) 与 Back，不改 `ReferenceLexiverseFrame` 的 postMessage/origin。
- **a11y**：导航均为 `<button>/<a>`，图标 `aria-hidden`，焦点可见（focus-visible 描边）。

## 9. 组件接口（落地参考）

```ts
// lib/lexiverse/word-practice-links.ts
buildWordPracticeLinks(word, returnTo): {
  practice, examContext, graph, askAi, browser
}

// components/lexiverse/WordPracticeActions.tsx
<WordPracticeActions
  word={word}
  returnTo={`/lexiverse/word/${word.id}`}
  poolEmpty={boolean}        // 本词题库是否为空 → 控制练习 split 的空态
  inToday={isInReview}       // 复用现有 isInReview
  onAddToday={handleAddToReview}  // 复用现有 ensureWord+addToReview
/>
```
