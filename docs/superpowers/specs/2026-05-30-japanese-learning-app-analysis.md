# 日语学习套件 完整技术分析文档

> 原作者：@进击的柯基怪（抖音）
> 分析日期：2026-05-30
> 目标：完整复刻为独立 Web + 桌面 App 产品

---

## 一、项目全貌

原作者构建了三个紧密相连的日语学习工具，总体定位是"替代 Anki 的沉浸式日语学习系统"：

| 工具 | 名称 | 底层技术（原版） | 核心亮点 |
|------|------|----------------|---------|
| 1 | 宇宙星图词库 | 疑似 Obsidian Canvas + 自定义 CSS（推测，截图可见 CLEAR CANVAS 按钮）| 词汇以星球形态呈现，语义聚类成"星座" |
| 2 | JLPT 真题系统 | 自研桌面 App（Cockatiel） | 导入任意 JLPT PDF，AI 解析题目结构 |
| 3 | PDF 日语阅读器 | 自研桌面 App | 日语原文生词自动标注词义 |

---

## 二、系统一：宇宙星图（Universe Star Map）

### 2.1 视觉层完整拆解

从截图可以识别出以下视觉状态：

**暗黑宇宙模式**
- 纯黑背景（#000000）
- 单词节点 = 发光彩色球体，不同语义类别对应不同颜色
- 节点间细线连接（语义关联）= 星轨效果
- 整体呈银河散点分布，节点密集区是词汇星座

**浅色泡泡模式**
- 白/灰背景
- 单词节点 = 圆形气泡，带柔和光晕
- 同类别节点被更大的半透明圆圈包裹（category bubble）
- 类别标签（Work Economy / Logic / Nature / Communication 等）

**语法关系图（Grammar Map）**
- 独立视图，展示语法点之间的关系
- 节点颜色按功能分类：MODALITY / CONDITION / CAUSE / SCOPE / VOICE / TIME / POLITENESS / CONCESSION / CHANGE / EXPLANATION / ADDITION / VOLITION
- 节点大小 = 该语法点出现频率/重要性

**动词变形展开图（Verb Conjugation Wheel）**
- 中心：原形（e.g. 聞く）
- 外围放射状展开所有变形：
  - 聞いたら / 聞きます / 聞きました / 聞かせん
  - 聞こう / 聞いて / 聞け / 聞いた
  - 聞かせる / 聞かなかった / 聞いてる / 聞ける / 聞かれる / 聞かなかった
- 每个变形节点都可点击进入该形式的详情

### 2.2 词卡数据结构（从截图完整提取）

每个单词对应一张结构化词卡，包含以下字段：

```
词卡（以 涙/なみだ 和 優しい/やさしい 为例）

┌─ MEANING
│   中文：眼泪，泪珠
│   英文：tear (drop of liquid from the eye)
│
├─ SCENARIO（使用场景，3-4条）
│   表达流感动、悲伤、痛苦等情绪生理反应而流出的泪水状态
│   · 看到亲人久别重逢忍不住落泪
│   · 手术前紧张哭将流泪了
│   · 感动于电影结局的情的泪水
│
├─ ETYMOLOGY（词源）
│   大和言葉类别标注
│   词源分析（例：な（流动）+み（身体/内在）+だ（古形容词）→ 体内流出的液体）
│   古人观念关联
│   汉字组成分析
│   上位词/下位词/同义词/派生词/混淆词
│
├─ MNEMONIC（记忆故事，中文叙事）
│   一段100-200字的故事场景，将单词嵌入高情绪强度的情景中
│   故事结尾高亮目标词的读音和写法
│
└─ EXAMPLES（例句，3-5条）
    每条例句包含：
    · 日语原文（附振假名）
    · 中文翻译
    · 难度等级（JLPT N级）
```

### 2.3 左侧边栏结构

```
[JP] [EN] [汉] 切换标签（词库语言视图）
[Vocabulary ▼] [Grammar ▼] 类别切换
搜索框
────────────────
单词列表（每行）：
  汉字 · ひらがな · 中文释义
```

### 2.4 底部工具栏（疑似 Obsidian Canvas 工具栏）

原版疑似基于 Obsidian Canvas（截图底部可见 "CLEAR CANVAS" 字样，高度吻合，但未经确认），复刻版需实现同等功能：
- 缩放控制（放大/缩小/适应屏幕）
- 绘图工具（箭头/框选/自由画）
- 颜色选择器（节点颜色）
- 节点形状切换
- CLEAR CANVAS 按钮
- 锁定/解锁视图

---

## 三、系统二：JLPT 真题系统（Cockatiel）

### 3.1 界面布局

四栏并排布局（从最后两张截图分析）：

```
┌──────────────┬────────────────┬────────────────┬──────────────────┐
│  PDF 原卷    │  QUIZ MODE     │  STUDY MODE    │  SCAN MODE / AI  │
│  渲染视图    │  做题界面      │  学习界面      │  分析结果        │
└──────────────┴────────────────┴────────────────┴──────────────────┘
```

### 3.2 SCAN MODE（AI 扫描模式）

用户导入 JLPT PDF → AI 自动解析：

```json
{
  "section_instruction": "...",
  "questions": [
    {
      "number": 1,
      "text": "問1 ___に入るものを選べ",
      "options": ["A", "B", "C", "D"],
      "correct": "B",
      "analysis": "...",
      "vocabulary": [...],
      "grammar_point": "..."
    }
  ],
  "reading_passages": [...],
  "overall_analysis": "..."
}
```

AI 输出格式支持：PURE TEXT 和 RAW JSON 两种模式

### 3.3 QUIZ MODE（做题模式）

- 逐题展示
- 选择答案后：
  - 显示正确答案
  - 解释每个选项为什么对/错
  - OVERALL ANALYSIS：分析本题考察的语法/词汇点
- 支持 N5-N1 全等级

### 3.4 STUDY MODE（学习模式）

- 题目翻译视图
- 从题目中提取的 VOCABULARY 列表：
  - 汉字 | 假名 | 词义（英/中）
  - 可点击单词跳转到词库

### 3.5 PDF 渲染功能

- 支持 JLPT 官方试卷 PDF 格式
- 音频播放器（听力部分）：
  - 播放/暂停/快进/慢速
  - 进度条
  - 原文跟踪显示

---

## 四、系统三：PDF 日语阅读器

### 4.1 功能流程

```
导入 PDF（小说/漫画/论文）
      ↓
渲染日语原文
      ↓
用户点击生词 / Quick Scan 全文扫描
      ↓
红色连线 → 右侧分析面板
      ↓
ANALYSIS REPORT：
  · 段落原文
  · 中文翻译
  · VOCABULARY 列表（词+读音+中英义）
```

### 4.2 已识别的技术难点

- 日语竖排文本（縦書き）支持
- 扫描版 PDF 需要 OCR（非文字 PDF）
- 词语边界识别（日语没有空格）

---

## 五、技术难点完整分析

### 难点 1：星图渲染性能 ⭐⭐⭐⭐

**问题**：词库可能有 5000-15000 个节点，同时渲染会卡顿

**解决方案**：
- 使用 WebGL 渲染（Three.js / React Three Fiber）而非 SVG/Canvas 2D
- D3-force 仅负责计算节点位置（在 Web Worker 中运行）
- Three.js 负责渲染（支持 GPU 加速）
- Level of Detail (LOD)：缩放级别低时合并相邻节点为一个大球
- 视口裁剪：只渲染屏幕内可见节点

### 难点 2：语义聚类算法 ⭐⭐⭐⭐⭐

**问题**：如何自动将词汇聚类成 WORK/HOME/NATURE 等语义群？

**解决方案（Pipeline）**：
```
1. 为每个单词生成向量嵌入
   → sentence-transformers 多语言模型（paraphrase-multilingual-mpnet-base-v2）

2. UMAP 降维（高维→2D/3D）
   → 保留语义邻近关系

3. HDBSCAN 密度聚类
   → 自动发现集群数量，不需要预设

4. 用 Claude API 为每个集群命名
   → 输入：集群内前20个词 → 输出：类别名称（WORK/NATURE/EMOTION...）

5. 存储位置（x, y）和 cluster_id 到数据库
   → 前端直接读取，无需实时计算
```

### 难点 3：日语形态分析（NLP Pipeline）⭐⭐⭐

**问题**：日语无空格，需要分词 + 词性标注 + 词形还原

**工具链**：
```python
# 服务端（Python）
fugashi + unidic-lite  →  分词 + 词性（POS tagging）
jamdict               →  JMdict 词典查询
sudachipy             →  高精度分词（可选，更准确）

# 客户端（浏览器，可选）
kuromoji.js           →  轻量分词（无需请求服务器）
wanakana              →  假名/罗马字转换
```

### 难点 4：动词变形自动生成 ⭐⭐

**问题**：展示动词所有变形形式（て形、た形、ば形、可能形、被动形、使役形...）

**解决方案**：日语基础活用形可算法实现，但需要异常词表：
- する / くる 不规则须单独处理
- 行く → 行って（音便特例，非一般规则）
- 敬语形式（召し上がる等）需词典支持
- 建议：规则引擎生成候选 + 单元测试覆盖异常词表

```python
# 动词分类（Group 1 / 2 / Irregular）
# 变形规则（约30种形式）
# 库：japanese-conjugator（Python）或自实现规则引擎
```

无需存储，实时计算，每次打开动词节点动态生成 Conjugation Wheel。

### 难点 5：JLPT PDF 结构解析 ⭐⭐⭐⭐

**问题**：JLPT 试卷 PDF 格式每年不同，版式复杂，有图片选项、听力题等

**解决方案**：
```
1. PyMuPDF (fitz) 提取文字和位置坐标
2. 用坐标推断版式（题号位置、选项列、阅读文章区域）
3. Claude API 做语义级结构解析（比规则更鲁棒）
4. 结果缓存：同一 PDF 不重复解析
```

### 难点 6：日语 OCR ⭐⭐⭐

**问题**：部分 PDF 是扫描图片，无文字层

**解决方案**：
- EasyOCR（已安装在此机器：`C:\Users\fanhu\.EasyOCR\model`）
- 支持日语 + 英语混合识别
- 竖排文字需要旋转处理

### 难点 7：词卡数据批量生成 ⭐⭐

**问题**：词库有上万个词，每个词卡需要 ETYMOLOGY/MNEMONIC/SCENARIO/EXAMPLES

**解决方案**：
```python
# 批量生成 Pipeline（离线运行，一次性）
words = load_jlpt_wordlist()  # N5→N1 约5000词

for word in words:
    card = claude.messages.create(
        model="claude-haiku-4-5-20251001",  # 用 Haiku 降低成本
        messages=[{"role": "user", "content": WORD_CARD_PROMPT.format(word=word)}]
    )
    db.save(word, card)

# 估算：5000词 × $0.001/词 ≈ $5 全量生成
```

### 难点 8：跨平台桌面打包 ⭐⭐⭐

**解决方案**：Tauri 2.0
- Rust 编写系统层（文件访问、系统音频）
- WebView 渲染前端（复用 Web 代码）
- 产物：Windows .exe / Mac .dmg，体积约 5-15MB（vs Electron 150MB+）

---

## 六、开源数据资源清单

| 数据集 | 内容 | License | 链接/说明 |
|--------|------|---------|---------|
| JMdict (EDICT) | 20万+日英词条，含词性/读音 | CC BY-SA | jmdict-s.apan.net |
| jlpt-vocab | N5-N1 分级词表 | 公开 GitHub 仓库多个 | 搜索 "jlpt vocab list github" |
| Tatoeba | 日语例句+中文/英文翻译 | CC BY 2.0 | tatoeba.org |
| KanjiVG | 汉字笔顺 SVG | CC BY-SA | kanjivg.tagaini.net |
| JmdictFurigana | 带振假名的词典 | CC BY-SA | GitHub: Doublevil/JmdictFurigana |
| JLPT official samples | 官方样题 PDF | 免费获取 | jlpt.jp |
| Wikipedia JP | 大规模日语语料（用于训练嵌入）| CC BY-SA | dumps.wikimedia.org |
| chiVe | 日语词向量（fastText）| Apache 2.0 | GitHub: WorksApplications/chiVe |

---

## 七、外部 API 和服务

| 服务 | 用途 | 费用 |
|------|------|------|
| Claude API (Anthropic) | 词卡生成 / JLPT 题目解析 / PDF 分析 | 按 token 计费 |
| Claude Haiku 4.5 | 批量词卡生成（低成本） | ~$0.001/词卡 |
| Claude Sonnet 4.6 | 复杂 PDF 结构解析 | 按需调用 |

无需其他付费第三方 API，全部数据可本地化。

---

## 八、项目规模评估

| 模块 | 代码量估算 | 开发周期（独立开发） |
|------|-----------|-------------------|
| 星图可视化核心 | ~3000 行 TS | 3-4 周 |
| 词卡详情组件 | ~1500 行 TS | 1 周 |
| 语法图 + 动词轮 | ~2000 行 TS | 2 周 |
| 后端 API + NLP | ~2500 行 Python | 2-3 周 |
| 数据库设计 + 迁移 | ~500 行 SQL | 3 天 |
| 词卡数据生成 Pipeline | ~800 行 Python | 1 周 |
| JLPT PDF 解析系统 | ~2000 行 Python | 2-3 周 |
| PDF 阅读器前端 | ~1500 行 TS | 1-2 周 |
| Tauri 桌面打包 | ~500 行 Rust/config | 1 周 |
| **合计** | **~14,300 行** | **约 4-5 个月** |

---

## 九、总结

**完全可行**。核心技术全部成熟，无需突破性创新：
- 星图 = Three.js + D3 力导向（有大量开源示例）
- 词卡 = Claude API 批量生成（成本极低）
- JLPT 解析 = Claude + PyMuPDF（主要是 prompt 工程）
- 桌面端 = Tauri 封装 Web（成熟方案）

最大风险是**星图交互体验**（缩放/动画/性能调优），这部分需要最多迭代时间。
