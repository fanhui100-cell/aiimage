# LexiOcean 前端设计统一规格文档

**日期:** 2026-06-07  
**目标:** 让所有功能区页面在视觉上显得高级且互相协调，同时不动正在外部设计的三个视角界面。

---

## 1. Scope 边界

### 冻结（此次不改）
| 路由 | 原因 |
|------|------|
| `/` | 主界面，用 Claude design 单独设计 |
| `/universe/*` | 星图视角，用 Claude design 单独设计 |
| `/lexiverse/*` | Lexiverse 3D 宇宙，已有完整 Liquid Glass 设计系统 |

### 本次改动范围（全部功能区）
`/study` · `/chat` · `/memory` · `/dictionary` · `/quiz` · `/exam`  
`/word/[slug]` · `/profile` · `/scan` · `/scan/history/*`  
`/reading` · `/pronunciation` · `/lexigraph` · `/onboarding`  
全局: `layout.tsx` · `globals.css` · `Navbar.tsx` · `site.ts`

---

## 2. 设计原则

### 2.1 字体系统
- **主字体:** `Space Grotesk` — 所有正文、标题、UI 标签
- **等宽字体:** `Space Mono` — 代码标签、monospace 场景（现在 pages 里的 `ui-monospace` 全部替换）
- **加载方式:** `next/font/google` 在 `layout.tsx` 里加载，通过 CSS 变量 (`--font-sans`, `--font-mono`) 注入
- `globals.css` 里 `font-family` 改为 `var(--font-sans), system-ui, sans-serif`（保留 system-ui 作 fallback）

### 2.2 颜色与 Token 用法
所有页面颜色只能用 CSS 变量（`globals.css` 里已定义）或已有的 rgba 值（作为 token 语义使用），禁止引入新的硬编码颜色。

现有 token：
```
--bg-deep, --bg-ocean
--particle-cyan, --particle-mint, --particle-gold
--accent-blue, --accent-violet
--text-primary, --text-secondary
--glass-bg, --glass-border, --glass-bg-hover, --glass-border-hover
--section-head-color
```

### 2.3 组件层级规则
每个功能区页面都必须符合：

```
AppShell         ← 提供 Navbar + 背景
  PageShell      ← 提供 maxWidth + 水平 padding
    SectionHeader  ← 分区标题（已有组件）
    GlassCard      ← 卡片容器（已有组件）
    Button         ← 所有操作按钮（已有组件）
    EmptyState     ← 空状态（已有组件）
```

**禁止** 在这些层级内使用 inline style 设置 color / background / border / padding / fontSize，改用 Tailwind 类或 CSS 变量。

### 2.4 动效标准
- **入场:** `framer-motion` 的 `motion.div` + `initial/animate`，`opacity: 0→1` + `y: 8→0`，`duration: 0.3`
- **卡片列表:** stagger，相邻卡片间隔 `0.05s`（delay = index × 0.05）
- **Hover:** `whileHover={{ y: -2 }}`，不加其他变化（保持克制）
- **答题反馈:** 正确用 `scale: 1→1.02` + 绿色 border flash；错误用 `x: [-4,4,-4,0]` shake
- **页面不加全局 AnimatePresence 路由过渡**（防止和 3D 页面冲突），每个页面内部各自处理入场

### 2.5 "高级不违和"原则
- 不在功能区引入任何 Lexiverse 专用的 3D/粒子效果
- 功能区使用**低调的 Glass 风格**：微弱的毛玻璃背景 + 细边框 + 柔光色
- accent color 选用已有 brand 色，不自创新颜色
- 中英双语标注保持现有模式不变

---

## 3. 全局层变更（Phase 1）

### 3.1 `layout.tsx`
**当前状态:** 5 行，只有 `<html lang="zh-CN"><body>{children}</body></html>`

**变更:**
```tsx
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})
```

Body 加 `className={`${spaceGrotesk.variable} ${spaceMono.variable}`}`。  
在 `</body>` 前加 `<Toaster theme="dark" position="bottom-right" />`。  
不加全局 Suspense（Next.js App Router 页面各自负责自己的 Suspense）。

### 3.2 `globals.css`
```css
/* 替换 */
font-family: ui-sans-serif, system-ui, sans-serif;

/* 改为 */
font-family: var(--font-sans), system-ui, sans-serif;

/* 所有 ui-monospace 全局替换为 */
font-family: var(--font-mono), ui-monospace, monospace;
```

同时在 `:root` 里补充 `--font-sans` 和 `--font-mono` 占位（为服务端渲染 fallback）：
```css
--font-sans: 'Space Grotesk';
--font-mono: 'Space Mono';
```

### 3.3 `Navbar.tsx` + `site.ts` — More 菜单重构

**当前问题:** `navigationMore` 有 10 项，全部平铺。

**方案:** 保持 6 个主导航项不变。More 下拉菜单改为**分组显示**：

```
── 工具 ──────────────────
  Dictionary / 词典
  LexiGraph / 词汇星图
  Scan / 文档扫描

── Lexiverse 系列 ─────────
  Lexiverse Quiz
  Vocabulary Browser
  Word Universe

── 未来功能 ─────────────
  Reading Canopy  (Coming Soon 灰色)
  Voice Sonar     (Coming Soon 灰色)
```

实现方式：在 `site.ts` 里为 `navigationMore` 里的每一项加可选的 `group` 字段和 `comingSoon: boolean`。Navbar 里按 group 分组渲染，`comingSoon` 的项用 50% opacity 渲染，不可点击但显示标签。

---

## 4. 功能区页面变更（Phase 2）

### 4.1 `/memory` — 全面重构

**当前问题:** 原生 button Tab 栏，卡片 inline style 堆砌，无动效。

**Tab 栏:**
- 用 `GlassPanel` 包裹，三个 Tab 按钮改为 `Button` 组件的 variant（active/inactive）
- active tab 有 `--accent-blue` 底色，其余透明

**单词卡片:**
- 改用 `GlassCard` 组件包裹
- 加 stagger 入场动画
- 卡片展开/收起答案改用 Framer Motion `AnimatePresence`（高度动画）

**空状态:**
- 三个 Tab 分别有对应的 `EmptyState`（saved tab: 引导去 dictionary；review tab: 引导去 quiz；wrong tab: 引导去练习）

**统计区:**
- Tab 顶部加一行轻量统计 pill：`已保存 N 词` · `待复习 N 词` · `错题 N 道`

### 4.2 `/dictionary` — 筛选器升级

**当前问题:** 原生 `<select>` 做 CEFR、难度、考试类型筛选，视觉割裂。

**Pill 选择器组件（新建 `components/ui/PillFilter.tsx`）:**
```tsx
// 单选/多选两种模式
// 样式参考 Lexiverse vocab 里现有的 FilterPill 实现
<PillFilter
  options={cefrOptions}
  value={cefrFilter}
  onChange={setCefrFilter}
  multiSelect
/>
```

Pill 样式：`border-radius: 999px`，未选中时 `--glass-bg` 背景，选中时 `--accent-blue` + `rgba(56,189,248,0.15)` 背景。

**搜索区:**
- 搜索输入框结果加高亮（匹配字母 `--accent-blue` 着色）

**词卡:**
- CEFR 等级加彩色小徽章（A1-A2 绿，B1-B2 蓝，C1-C2 紫）
- 加载中：骨架屏（灰色动画方块）替代 "Loading..."

### 4.3 `/quiz` — 题目体验升级

**当前问题:** 无进度感知，无答题动效，无完成状态。

**顶部进度条:**
```tsx
// 细条 + 题号标注
<div style="height: 3px; background: --glass-border">
  <motion.div style="background: --accent-blue; width: {progress}%" />
</div>
<span>题目 {current}/{total}</span>
```

**答题动效（Framer Motion）:**
- 答对：选项卡片 `backgroundColor` 过渡到 `rgba(52,211,153,0.15)`，border 变绿，scale `1→1.02`
- 答错：选项卡片 `x: [-4, 4, -4, 0]` shake，border 变红

**完成状态:**
- 显示得分卡（score / total，百分比，鼓励文案）
- 两个 CTA：重做一遍 / 去 Memory 看错题
- 得分 ≥ 80% 时加 confetti（用 canvas-confetti 或纯 CSS 粒子，轻量实现）

### 4.4 `/exam` — 组件化

**当前问题:** 题型选择卡全用 inline style，答题区按钮全用 inline style。

**变更:**
- 6 个考试类型卡改用 `GlassCard` 包裹 + 选中状态用 `--accent-blue` border
- 答题选项按钮改用 `Button` 组件（variant: ghost），答对/错状态通过 className prop 控制

---

## 5. 中等成熟度页面polish（Phase 3）

### 5.1 `/chat` — 消息气泡组件化

**MessageBubble（用户消息 vs AI 消息）:**
- AI 消息：左对齐，`--glass-bg` 背景，`--particle-cyan` 细左边框
- 用户消息：右对齐，`rgba(56,189,248,0.08)` 背景
- 两者均用 `GlassCard` 或统一的 `MessageBubble` 组件，消除 inline style
- AI 打字中：加三点脉冲动画（`motion.span` 的 scale 动画）

### 5.2 `/study` — 面板动效

**8 个 Panel 组件加 stagger 入场:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, duration: 0.3 }}
>
  <PanelComponent />
</motion.div>
```

面板本身加 `whileHover={{ y: -2 }}` + CSS transition，不改内部业务逻辑。

### 5.3 `/word/[slug]` — 发音 + 词义区提升

**发音区:**
- 播放按钮点击后显示脉冲动画圈（2-3 个同心圆扩散，CSS `@keyframes`）
- US/UK 切换 Pill 改用 `PillFilter` 组件

**词义/近义词区:**
- 近义词、反义词 chip：hover 时 `cursor: pointer` + border 变亮，点击跳转 `/word/[word]`

### 5.4 `/profile` — 补全 AppShell

**当前问题:** 未使用 AppShell，没有 Navbar。

**变更:**
- 包裹在 `AppShell` + `PageShell` 里（maxWidth: 700）
- Account 信息卡、Sync 状态卡、ProfileCloudStats 均改用 `GlassCard` 组件
- Sign out 按钮改用 `Button` 组件（variant: destructive，红色）

### 5.5 `/onboarding` — 等级选择卡组件化

**当前问题:** 等级选择全用 inline style button。

**变更:**
- 每个等级选项改用 `GlassCard` 包裹（替换 button 的 inline style）
- 选中状态：GlassCard 接受 `selected` prop，内部控制 border color
- 确认按钮改用 `Button` 组件（variant: primary）

---

## 6. 不改的内容（明确边界）

- `/reading` 和 `/pronunciation`：已经使用 PageShell + GlassCard + EmptyState，只需字体 token 生效即可，无需其他改动
- `/lexigraph`：委托给 `LexiGraphPage` 组件，该组件本身质量未知，但不在核心路径上，本次只确保字体 token 生效
- `/scan` 和 `/scan/history/*`：结构已合理，本次只确保字体 token 生效，不改面板逻辑
- `/auth/login` 和 `/auth/signup`：功能性页面，不在本次 scope 内

---

## 7. 新增组件

| 组件 | 位置 | 说明 |
|------|------|------|
| `PillFilter` | `components/ui/PillFilter.tsx` | 可复用的 Pill 筛选器，单选/多选，用于 dictionary、word 页面 |
| `Skeleton` | `components/ui/Skeleton.tsx` | 骨架屏，用于卡片/列表加载状态 |

不新建其他组件——优先复用现有 GlassCard、Button、EmptyState、SectionHeader。

---

## 8. 安装依赖

| 包 | 用途 | 安装 |
|----|------|------|
| `sonner` | Toast 通知 | `npm install sonner` |
| `canvas-confetti` | Quiz 完成 confetti（可选） | `npm install canvas-confetti` + `@types/canvas-confetti` |

`framer-motion` 已安装（Lexiverse 使用中）。

---

## 9. 不做的事

- **不改 Lexiverse 任何文件**
- **不引入新的颜色或 token**
- **不加全局路由过渡动画**（防止和 3D 页面冲突）
- **不重构业务逻辑**（只改视觉/组件层）
- **不改数据库或 API**
- **不删除现有 inline style 中有业务逻辑的条件判断**（如答对/答错颜色这类状态逻辑要保留，只是抽到组件 props 里）

---

## 10. 实施顺序建议

```
Phase 1（全局基础）
  1. layout.tsx 字体 + Toaster
  2. globals.css token 替换
  3. site.ts + Navbar More 菜单分组

Phase 2（低成熟度页面，影响最大）
  4. /memory 重构
  5. /dictionary Pill 筛选器
  6. /quiz 进度 + 动效
  7. /exam 组件化

Phase 3（中等成熟度 polish）
  8. /profile 加 AppShell
  9. /onboarding 组件化
  10. /chat MessageBubble
  11. /study stagger 动效
  12. /word/[slug] 发音动效 + synonym chips

新增组件（穿插进行）
  PillFilter（第5步前）
  Skeleton（第5步前）
```

预估总工时：约 30-35h，可按 Phase 分批合并 PR。
