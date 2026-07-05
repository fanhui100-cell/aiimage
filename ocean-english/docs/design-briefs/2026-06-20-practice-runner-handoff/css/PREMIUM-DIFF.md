# Phase 5 视觉升级 · 回灌 diff（handoff）

把 `PracticeRunner Premium.html` 的「高级感」沉淀成**可交付的最小改动**。原则：**纯叠加、零结构破坏**。

## 1. 怎么接（一行 import）

在 `LexiverseQuizClient.tsx` / 未来的 `PracticeRunner.tsx` 里，**在现有 base 之后**追加一行：

```ts
import './practice-session.css'
import './practice-session-premium.css'   // ← 新增，必须在 base 之后
```

- `practice-session-premium.css` 全部选择器都以 `.pr-v2` 开头，只覆盖既有 class 的**观感**，不改 class 名、不改 DOM。
- 不接也能跑（base 独立完整）；接了就升级。可随时回退（删一行）。

## 2. 改了什么（视觉，零行为）

| 区域 | 升级点 | 复用的既有 class |
|---|---|---|
| 背景 | 纸面径向光晕（teal/gold 极淡） | `.pr-v2` |
| 进度条 | 青绿渐变 + 流光 shimmer | `.pbar` / `.pbar i` |
| 题干卡 | 渐变发丝边 + 顶部柔光 + 大字（clamp）+ teal 下划线 | `.prompt` / `.word` / `.zh` / `.cloze` |
| eyebrow | `::after` 渐隐分割线（**不需要新 DOM**） | `.eyebrow` |
| 选项 | 层次投影 + hover 光泽扫过 + 选中发光 | `.opt` / `.opt.correct` |
| 拼写 | 更厚输入 + 4px 聚焦/容错/对错环 | `.lg-input` 及 `.tol/.bad/.good` |
| 反馈 | 平滑上浮入场（替换硬跳，仍由 `.show` 触发） | `.feedback.show` |
| CTA | 更深青绿投影 | `.cta` |
| 结算 | 更大环 + bento 投影 | `.res-hero .ring` / `.res-stat` / `.wrongbook` |

## 3. 两处「想要更好」的可选钩子（非必须，加了更顺）

1. **未选中项淡出**：作答后给非正解/非错选项保留既有 `.locked` 即可触发 `opacity:.55`（已写在 overlay）。无需新 class。
2. **结算环描边动画**：给结算页那个目标 `<circle>` 加 `className="pr-ring"`，并让 `strokeDashoffset` 初值=整圈周长 `C`、挂载后用 `requestAnimationFrame` 设到目标值。overlay 已提供 `transition`。

> 这两个都是渐进增强，不加不影响。

## 4. 桌面两栏「任务栏」（结构性，默认不启用）

这一项**不是纯 CSS**，需要新增 markup，单列出来：

- 外层 `<main class="pr-v2">` → `<main class="pr-v2 has-rail">`。
- 在 `.pr-app` 内、左侧加 `<aside class="pr-rail">…</aside>`（当前练习 pill / 等级 / 来源 / 进度点阵 / 得分·连击·正确率·XP 四宫格）。
- 把现有 `topbar + qbody + qfoot` 包进一层 `<div class="pr-stage">`。
- `≥980px` 显示两栏；`<980px` 自动回落现有单栏（`.pr-rail` 隐藏，连击/分数继续留在 `topbar`）。
- overlay 里 `@media(min-width:980px) .pr-v2.has-rail …` 已备好样式骨架；`.pr-panel` 提供发丝边卡片。

**建议**：先合入 §2 的纯视觉 overlay（低风险、立竿见影），桌面任务栏作为后续单独一个改动评估。

## 5. 约束（沿用 Phase 5 主约束）

- 仍只复用 `.pr-v2` 视觉语言与 globals token，无新颜色。
- 不碰 `/drill`；旧 URL/退役题型规则不变。
- `prefers-reduced-motion` 下流光/入场动画自动关闭（overlay 已处理）。
- `lint / tsc / validate:practice-session` 应无影响（纯 CSS 追加 + 可选 className）。

## 文件
- `practice-session-premium.css` — 叠加层（drop-in）
- 交互参照：`../PracticeRunner Premium.html`（桌面+移动可点）
- 并排对照：`../Practice 对比 · Mobile vs Desktop.html`
