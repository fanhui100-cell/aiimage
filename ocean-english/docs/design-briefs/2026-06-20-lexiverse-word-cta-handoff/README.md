# Handoff: Lexiverse 词详情页 · 聚焦 CTA + 导航闭环（Phase 7）

## Overview
本包交付 **Lexiverse 词详情页**（路由 `/lexiverse/word/[slug]`）的重设计。用户在 `/lexiverse` 的 3D 单词宇宙里点击一颗「星球」（= 一个单词）后，跳转到这个整页词详情页。本期目标：

1. 把原来那排**无层级的 5 个并排按钮**，换成一个**有主次的聚焦 CTA 组**（`WordPracticeActions`）。
2. 让**词条之间可互相跳转**（近义词/反义词/搭配/同星系词 → 点击进入该词的星球）。
3. 加一套完整**导航 + 关闭页面**闭环（桌面浮动导航条、移动底部 Tab、关闭 ✕ / Esc / 后退、关闭后回到星图）。
4. 整体提升到**高级感深空视觉**（行星球体、星空、编辑级排版、微交互）。

> 本期**不触碰** 3D 渲染与 `ReferenceLexiverseFrame` 的 postMessage/origin 逻辑。

## About the Design Files
`prototype/` 里的文件是用 **HTML + React(JSX，通过浏览器内 Babel)** 做的**设计参考稿**——表达最终的样子与交互，**不是**可直接照搬进生产的代码。你的任务是：**用目标代码库（`ocean-english`，Next.js + React + TypeScript）已有的模式与组件，把这些设计在真实环境里重新实现**。具体而言，复用现有的 `components/lexiverse/liquid-ui` 原语、现有路由、现有 store（`lexiStore`）与现有 3D 宇宙 iframe——不要把原型里的「星图替身 / 内联样式 / window 全局挂载」搬进去。

## Fidelity
**高保真（hifi）。** 颜色、字号、字重、间距、圆角、阴影、悬浮态、动效都是最终意图，应**像素级**还原，但落地用代码库自有的 liquid-ui 组件与 Tailwind/CSS 体系，而非原型里的内联 style。

## 目标代码库锚点（ocean-english）
- 页面：`app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx` —— **改造对象**。
- 设计原语：`components/lexiverse/liquid-ui/index.tsx` —— 复用 `LiquidGlassPanel / LiquidGlassCard / LiquidActionButton / LiquidIconButton / LiquidBadge` 等，**不新增设计 token**。
- 新增建议：
  - `components/lexiverse/WordPracticeActions.tsx`（聚焦 CTA 组）
  - `components/lexiverse/word-nav/ProductNav.tsx`、`BottomNav.tsx`（导航）
  - `lib/lexiverse/word-practice-links.ts`（纯 URL 构造器）
- Store：`lexiStore`（`ensureWord(word,'lookup')`、`addToReview(id)`、`isInReview(id)`）—— 复用，不新增 API。
- 3D 宇宙：`ReferenceLexiverseFrame`（`/lexiverse`）—— **不改**。原型里的 `CosmosMap` 仅为「关闭后回到哪里」的可视化替身。

---

## Screens / Views

### 1. 词详情页（Word Detail）— 主屏
**Purpose**：用户查看一个单词，并从这里发起练习 / 进入词图 / 加入今日 / 跳到相关词。

**Layout（桌面）**：垂直单列，内容居中，`max-width: 960px`。从上到下：
1. **ProductNav**（sticky 浮动玻璃条，`top:14px`，圆角 16）
2. 面包屑（Space Mono，12px）
3. **Hero 卡**（圆角 22，玻璃，渐变描边顶光）：右上来源胶囊；左侧行星球体 + 右侧词头（状态 eyebrow / 大标题 / 中文释义 / 发音行 + badges）；其下 **WordPracticeActions**。
4. **释义 + 例句**：2 列网格 `1.1fr 1fr`（释义卡 / 例句卡）。
5. **信息网格**：`repeat(auto-fit, minmax(210px,1fr))`，5 张卡（近义/反义/搭配/考试等级/主题）。
6. **同星系词条 Rail**：flex wrap 词条。

**Layout（移动，≤480px 容器宽）**：全部单列；Hero 内行星与词头纵向堆叠；释义/例句单列；信息卡单列；顶部精简 ProductNav + 底部 BottomNav Tab 栏。

### 2. WordPracticeActions（本期核心组件）
位于 Hero 内、词头下方。结构：
- 顶部一行：左 caption `START FROM THIS WORD · 从这个词出发`（移动端简化为「从这个词出发」）；右 题库状态点（青「本词题库 · 12 题就绪」/ 橙「本词暂无题目」）。
- 主簇（桌面横排、移动单列）：
  1. **练这个词 | 考试语境** —— 一个 **split 拼接控件**（共享外框 + 1px 分隔），表达「同一个词的两种练法」。
     - 练这个词 = **primary 实心**渐变（`linear-gradient(135deg,#9DFBFF,#7EF9FF 45%,#38BDF8)`，深字 `#04202B`，最大），靶心图标。
     - 考试语境 = **tonal** 黄（`rgba(255,214,107,.12)` / 字 `#FFD66B`），试卷图标。
  2. **词图关系** —— tonal 紫（accent `#B79BFF`）。
  3. **加入今日** —— tonal 橙（accent `#FFA85A`）；点击切换为**绿色** `#6BE0A0`「已加入今日」+ 对勾、`disabled`。
- 次级工具行（顶部细分隔线下）：`MORE` + 文字链「问 AI」「词库浏览」。
- **空池态**：练习 split 整体置灰不可点，主标改「暂无可练题目 / NO ITEMS YET」，下方橙字提示「不会用无关随机题替代」。词图关系/加入今日不受影响。

### 3. CosmosMap（星图）— 关闭后回到的视图
**原型替身**，落地即现有 `/lexiverse` 3D iframe。表达：关闭词页 → 回到星图；星图上每颗星球可点 → 进入对应词页。

---

## Interactions & Behavior

### 导航与关闭（本期新增）
- **关闭 ✕**：词页 → 回到 `returnTo`（= `/lexiverse` 星图，保留 galaxy 回跳参数）。桌面在 ProductNav 右侧（红色调，带 `ESC` 提示）；移动在顶部条右侧。
- **Esc 键**：等价关闭。
- **后退 ←**：在「词→词」跳转历史间回退；到头则回星图。
- **区段导航**（星图/今日/词库/词图）：桌面在 ProductNav，移动在底部 Tab 栏。路由 `/lexiverse`、`/today`、`/dictionary`、`/lexigraph`。原型里非星图区段弹 toast，落地直接用 Next.js `router.push`。

### 词条跳转
- 近义词 / 反义词 / 搭配 / 同星系词 = `<a href="/lexiverse/word/<slug>">`，`slug = label.toLowerCase().replace(/\s+/g,'-')`。点击进入该词页（= 它的星球）。
- 考试等级 / 主题领域**不**跳转（非单词）。
- 查无该词 → 优雅占位页（「词条数据补全中」），**不报错、不回退随机内容**。

### 练习 CTA
- 练这个词 → `/quiz?word=<id>&returnTo=<rt>`
- 考试语境 → `/quiz?word=<id>&mode=exam-practice&returnTo=<rt>`（**复用本词题库**，仅切换考试镜头；v1 无独立「按词考试题」就不建新题源，**绝不静默回退随机题**）
- 词图关系 → `/lexigraph?word=<slug>`
- 加入今日 → `lexiStore.ensureWord(word,'lookup') + addToReview(word.id)`；已加入读 `isInReview`
- 问 AI → `/chat?context=word&word=<id>&returnTo=<rt>`；词库浏览 → `/dictionary?tab=explore`

### 动效
- 入场：`.rise` —— `translateY(16px)→0`，`0.6s cubic-bezier(.22,1,.36,1)`，分段 `animation-delay`（0 / .04 / .06 / .1 / .12 / .14… / .3s）。**重要：base 状态 opacity 必须为 1**，入场只动 transform —— 避免动画时钟异常时内容空白；用 `@media (prefers-reduced-motion: no-preference)` 包裹动画。
- 行星：浮动 `7s`、光环旋转 `16s`、光晕脉冲 `5.5s`（reduced-motion 全部停）。
- 悬浮：`.lift` `translateY(-3px)`；卡片/词条悬浮变色描边发光；CTA primary 悬浮 `translateY(-2px)` + 阴影增强；星球悬浮 `scale(1.08)`。

### 响应式
- 断点按**容器宽度**（≤480px 视为窄），不是纯视口——因为词页可能嵌在不同容器里。
- 命中区 ≥44px（移动 Tab、关闭键、发音键）。

## State Management
原型用的本地 state（落地映射到 Next.js 路由 + lexiStore）：
- `view: 'word' | 'cosmos'` —— 落地由路由替代（`/lexiverse/word/[slug]` vs `/lexiverse`）。
- `hist[] / ptr` —— 词→词后退历史。落地用 `router.back()` / 浏览器历史即可，无需自管。
- `inToday` —— 落地用 `lexiStore.isInReview(id)`。
- `poolEmpty` —— 由本词题库是否为空决定（数据层）。
- `toast` —— 仅原型用；落地用代码库现有 toast。

## Design Tokens（精确值）
**颜色**
| 用途 | 值 |
|---|---|
| 主色 青 cyan | `#7EF9FF`（primary 渐变 `#9DFBFF→#7EF9FF→#38BDF8`，深字 `#04202B`） |
| 考试 黄 | `#FFD66B` |
| 词图 紫 | `#B79BFF` |
| 加入今日 橙 | `#FFA85A` |
| 已加入 绿 | `#6BE0A0` |
| 关闭 / 反义 粉红 | `#FF8FA8` / `#FFB4C2` |
| 搭配 绿 | `#6BE0A0` |
| 主题 蓝 | `#9AD8FF` |
| 正文 | `#ECFBFF` / 次 `#9FB6C6` / 弱 `#6F8AA0` |
| 背景 | 径向渐变 `#0a1326→#050711→#020205` |
| 玻璃面板 bg | `rgba(10,14,24,0.62)`；边 `rgba(126,249,255,0.14)` |

**学习状态色**（行星颜色）：mastered `#7EF9FF`、recommended `#FFD66B`、learning `#38BDF8`、review `#FFA85A`、weak `#FF8FA8`、unknown `#9FB6C6`、locked `#52617A`。

**字体**：`Space Grotesk`（400/500/600/700，正文与标题）；`Space Mono`（400/700，eyebrow / IPA / 代码味标签）。
**字号**：大标题 `clamp(58px,7.2vw,96px)`（移动 `clamp(46px,15vw,66px)`）；释义 22/19px；例句 16.5px；正文 13–15px；eyebrow 10px（letter-spacing .16–.18em）。**最小正文 ≥12px。**
**圆角**：面板 22 / 卡片 18 / 控件 12–14 / 小元素 9–11 / 圆按钮 50%。
**阴影**：面板 `0 30px 80px rgba(0,0,0,.5)`；卡片 `0 10px 30px rgba(0,0,0,.35)`；primary CTA `0 10px 30px rgba(126,249,255,.16)`。
**玻璃**：`backdrop-filter: blur(18–22px) saturate(1.15–1.2)`。

## Assets
- 无位图资源。所有图标为内联 stroke SVG（`stroke-width 1.8–1.9`，currentColor）——落地建议替换为代码库现有图标库（lucide 等）等价图标。
- 行星 / 星空 = 纯 CSS 渐变 + canvas 绘制（原型用）。落地中行星视觉可保留为 CSS；星空背景与 3D 宇宙由现有 `/lexiverse` 提供，词页本身仅需深空渐变背景即可。
- 字体走 Google Fonts（已在代码库则复用其加载方式）。

## Files（prototype/）
| 文件 | 内容 |
|---|---|
| `Lexiverse 词入口 CTA.html` | 入口，按顺序加载下列脚本 |
| `liquid-ui.jsx` | liquid-ui 原语的设计参考移植（对应 `components/lexiverse/liquid-ui`） |
| `actions.jsx` | **WordPracticeActions** + `buildWordPracticeLinks`（核心） |
| `nav.jsx` | ProductNav / BottomNav / CosmosMap（导航 + 星图替身） |
| `cosmos.jsx` | Starfield / PlanetOrb + 入场/行星动画 CSS |
| `words.jsx` | 示例词库 + `resolveWord(slug)`（演示词条跳转与占位态） |
| `word-data.jsx` | 状态色映射等 |
| `page.jsx` | 页面组装 + 设计评审外壳（状态/桌面移动切换——**非产品**） |

> 注意：`page.jsx` 顶栏的「Live/已加入/空池 + 桌面/移动」切换器是**设计评审工具**，不要实现进产品。

## 实现约束清单（务必遵守）
1. 不动 3D / 星图渲染；不弱化 `ReferenceLexiverseFrame` 的 origin 校验。
2. 不造新题：`mode=exam-practice` 仅复用本词题库的考试镜头。
3. **绝不把按词练习回退成随机题**；空池走受控空态。
4. 复用 liquid-ui，不新增设计 token。
5. 加入今日复用 `ensureWord+addToReview`；已加入读 `isInReview`（v1 视「今日 = 今日复习队列」）。
6. 旧链接全兼容（`/quiz?word=`、`/lexigraph?word=`、`/dictionary?tab=explore`、`/lexiverse` iframe 流）。
7. 入场动画 base opacity=1（只动 transform）；尊重 prefers-reduced-motion。
8. 详细设计依据见同级 `DESIGN_REPORT.md` 与 `CLAUDE_CODE_PROMPT.md`。
