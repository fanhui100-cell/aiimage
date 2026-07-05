# 设计 Brief · P1 — TodayScreen 按「学习方式 path」改版

> 交付给 **Claude Design**。设计语言：**浅色「纸感」**（`app/globals.css .theme-light`：`--paper/--ink/--teal-ink`，衬线中文 `--font-serif-zh`）。
> 载体：**React 屏**（改 `components/screens/TodayScreen.tsx`）。**只设计，不写代码**；完成后交回我植入。
> 统一规范见 `docs/superpowers/specs/2026-06-07-frontend-design-unification.md`。

---

## 1. 背景与目标
今日页现在不分 path（onboarding 选的"学习方式"现在没生效，P0 会把 `profile.path` 接上）。本次让今日页**按 path 编排不同的"今日活动卡"**——把阅读/发音/考试等侧路真正编进每日闭环（解决"闭环偏背单词单线"）。

`path` 四值：`full 全面掌握` / `words 速记词汇` / `reading 精读提升` / `exam 应试备考`。

## 2. 四种 path 的"今日活动卡"编排（核心）
今日页 = 一组**活动卡**的有序列表，不同 path 用不同卡集合/顺序/配比：

| path | 活动卡编排（从上到下） |
|---|---|
| **全面 full** | 今日新词 → 练习(PracticeSession) → 阅读任务 → 复习到期 → 小结 |
| **速记 words** | 今日新词(放大/卡片速刷为主) → 快速自测 → 复习到期（**无阅读**） |
| **精读 reading** | 今日精读文章(带生词) → 文中取词学习 → 练习 → 复习 |
| **应试 exam** | 今日真题/题型练习 → 错题强化 → 目标考试进度 → 复习 |

> 卡片本身（新词卡/复习卡/测验卡/阅读卡/真题卡）大体复用现有视觉，**重点是"按 path 给出 4 套编排版式"**，并在页眉标明当前 path（可一键切换/去"我的"改）。

## 3. 功能（改 / 加 / 删）
- ✏️ **今日页按 `profile.path` 渲染对应编排**（4 版）。
- ➕ **页眉显示当前学习方式** + 切换入口（跳"我的/重新定级"或就地切）。
- ➕ **阅读任务卡**（精读 path）、**真题/题型卡**（应试 path）——把这两类侧路拉进今日。
- ✏️ 保留现有"今日进度/streak/每日目标"区。
- ❌ 不删现有功能。

## 4. 数据契约（交我对接）
- 输入：`profile.path`（P0 接上）+ `profile.dailyGoal` + 今日包 `getToday()`（recommended/review/weak 词）。
- 各活动卡的数据：今日新词数、复习到期数、（精读）今日文章、（应试）今日题型/目标考试进度。
- 设计只需给"4 版编排 + 各卡版式 + 空/完成态"，数据我接。

## 5. 状态（设计要覆盖）
- 四种 path 各一版编排稿。
- 每版的：未开始 / 进行中 / 今日已完成（庆祝/小结）/ 空（无到期复习）。
- 移动端单列。

## 6. 设计令牌 & 交付清单
- 令牌：theme-light（`--paper #F2EFE9`、`--teal-ink #0E8C7A`、衬线中文）；圆角 14–22；缓动 `cubic-bezier(0.22,1,0.36,1)`；复用 `components/screens/SharedUI`。
- 交付：4 版 path 编排 ×（进行中/完成/空）+ 移动端；组件层级 + 中英文案；交互说明；明确 React 屏 + theme-light 令牌。
