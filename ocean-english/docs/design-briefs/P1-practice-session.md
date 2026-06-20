# 设计 Brief · P1 — 统一练习屏 PracticeSession

> 交付给 **Claude Design**。设计语言：**深色「液态玻璃 / 星空」**（对齐 `public/lexiverse-reference-v3/lexiverse-ui/liquid-glass.css` + `components/lexiverse/liquid-ui`，Space Grotesk/Mono，青金紫）。
> 载体：**React 屏**（不是原型 HTML）。**只设计，不写代码**；完成后交回我植入。
> 统一规范见 `docs/superpowers/specs/2026-06-07-frontend-design-unification.md`，别引入第三套风格。

---

## 1. 这是什么 / 替代什么
新建统一练习屏，**替代/升级现有 `components/quiz/LexiverseQuizClient.tsx`**（现在全是选择题）。
它是 Task B 的练习引擎入口：今日页/复习舱/词卡自测/考试都进它。**本 P1 brief 只覆盖 P1 范围的两种输入**：① 选择题 ② **打字输入**（新）。后续 P2 的听力/听写题卡是"题卡变体"，复用本屏骨架（本 brief 预留位置即可，不画 P2 题型）。

## 2. 屏幕结构（一屏一题，固定骨架）
1. **顶部**：进度（第 n/总）+ 连击数 combo + 计分/XP + 退出。
2. **题干区 prompt**：根据题型显示——单词 / 中文释义 / 例句挖空（高亮空格）/（P2 预留：音频播放控件位）。
3. **输入区**（两种，P1）：
   - **选择题**：2×2 或 1 列选项卡。
   - **打字输入**（新）：输入框 + **提示行**（首字母 `c _ _ _ _ e` / 可选音标 `/krɪ'et/`）+ 提交键；要有**容错**视觉（拼写接近时提示"差一个字母"而非直接判错）。
4. **即时反馈**：对（绿色 ✓ + 连击 +1）/ 错（红色 + **显示正解** + 一行解析）；打字题错误时高亮**差异字母**。
5. **结算页**：得分 n/总 + 用时 + 本轮 XP + 「再来一轮 / 返回」+（错题自动入错词本提示）。

## 3. 功能（改 / 加 / 删）
- ➕ **打字输入模式**（容错 + 首字母/音标提示 + 差异高亮）——P1 的核心新增。
- ➕ **连击 / 计分 / 结算页**（现版较弱）。
- ✏️ 题干区**预留音频控件位**（P2 听力题用），P1 不显示。
- ✏️ 复用现有 liquid-ui（`LiquidGlassCard/Panel`、`LiquidActionButton`、`LiquidSegmentedControl`、`LiquidBadge`）。
- ❌ 不删模式，但把现 4 模式（词汇速记/句子练习/应试/错题）收编进同一骨架。

## 4. P1 要覆盖的题型（都用上面骨架）
| 题型 | 题干 | 输入 |
|---|---|---|
| 释义选义 | 单词 | 选择 |
| 英→中 / 中→英 | 单词/中文 | 选择 |
| **中文→敲英文** | 中文释义 | **打字**（首字母/音标提示+容错） |
| 例句填空（选） | 例句挖空 | 选择 |

## 5. 数据契约（题目对象 / 会话结果 —— 交我对接 question_bank）
```ts
type InputMode = 'choice' | 'spell'           // P2 再加 'speak'|'listen'
interface PracticeQuestion {
  id: string; wordId: string; word: string
  type: 'def_to_word'|'en_to_zh'|'zh_to_en'|'zh_to_word_spell'|'cloze_choice'
  inputMode: InputMode
  prompt: string; promptZh?: string           // 题干（中文释义/例句挖空文本）
  options?: { id:'a'|'b'|'c'|'d'; text:string }[]   // choice 用
  answer: string                               // 正解（词/选项 id）
  hint?: { initials?: string; ipa?: string }   // spell 提示
  explanation?: string; explanationZh?: string
  audioRef?: string                            // P2 预留
}
interface PracticeResult { attempts:{wordId:string;correct:boolean}[]; score:number; total:number; xp:number; combo:number }
```

## 6. 状态（设计要覆盖）
- 题目：选择题（默认/hover/选中/对/错+正解）；打字题（空/输入中/对/错+差异高亮/容错提示）。
- 全局：进度、连击、加载、空（无题可练）、结算页。
- 移动端单列。

## 7. 设计令牌 & 交付清单
- 令牌：`liquid-glass.css`（青 `#7EF9FF` / 金 `#FFD66B` / 紫 `#7C5CFF` / 玫 `#FF8FA8`），Space Grotesk/Mono；缓动 `cubic-bezier(0.22,1,0.36,1)`，hover 0.16–0.18s。
- 交付：各状态稿 + 移动端；组件层级 + 中英文案；交互/动效说明（选中、判对判错、连击动效、打字容错提示）；明确 React 屏 + 用 liquid-glass 令牌。
