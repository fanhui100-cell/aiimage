# Korean Cosmos — 项目框架定义（修正版，可直接给 Claude Code 执行）

> 本文档是在 `2026-05-30-korean-cosmos-framework.md` 基础上的修正版。  
> 目标：降低 Phase 0 开发风险，统一技术栈，明确 Claude Code 的执行边界。  
> 日期：2026-05-30

---

## 一、项目名称与定位

```txt
项目名：korean-cosmos
中文名：韩语宇宙词库 / 韩语星图学习系统
定位：中国韩语学习者的沉浸式词库 + 语法图谱 + TOPIK 学习工作台
首版重点：3D 星图 + 词卡详情 + 한자어 连线 + TTS + 韩语变形轮
```

### 1.1 产品一句话

> 把韩语单词、汉字词、语法、变形和 TOPIK 学习材料做成一张可以探索的宇宙星图。

### 1.2 MVP 范围

MVP 不做完整 TOPIK/PDF 系统，先证明核心视觉和学习体验：

```txt
必须做：
1. 3D mock 星图
2. 左侧词表与搜索
3. 节点点击打开词卡
4. 한자어 金色连线层
5. TTS 播放与缓存
6. 韩语基础变形轮
7. 深色宇宙视觉

暂不做：
1. 登录/支付
2. 云同步
3. TOPIK PDF 解析
4. OCR
5. 桌面端打包
6. 大规模真实词库
```

---

## 二、关键技术决策

### 2.1 先做 Web，后做桌面

```txt
Phase 0-5：只做 apps/web
Phase 6+：再加 Tauri 桌面端
```

原因：

- Web 端调试快。
- Three.js/R3F 在浏览器调试更方便。
- 先把核心交互稳定下来，再封装桌面端。

---

### 2.2 Phase 0 先用 React Three Fiber，不急着抽 galaxy-engine

原框架中 `packages/galaxy-engine` 设计为纯 Three.js 引擎，但 Phase 0 同时使用 R3F 组件，会增加抽象复杂度。

修正策略：

```txt
Phase 0-1：
  在 apps/web/src/scenes/GalaxyScene 内直接实现 R3F 星图。

Phase 2 之后：
  当节点渲染、边渲染、点击交互稳定后，再抽出 packages/galaxy-engine。
```

原则：

> 先让东西跑起来，再做架构抽象。

---

### 2.3 版本锁定：React 18 + R3F 8 + Tailwind 3

为避免依赖不兼容，锁定稳定组合：

```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "three": "0.165.x",
  "@react-three/fiber": "8.x",
  "@react-three/drei": "9.x",
  "@react-three/postprocessing": "2.x",
  "tailwindcss": "3.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x",
  "python": "3.11+",
  "fastapi": "0.111.x"
}
```

注意：

- 暂不使用 `@tailwindcss/vite`。
- shadcn/ui 当前与 Tailwind 3 组合更稳。

---

### 2.4 韩语 NLP 首选 kiwipiepy

原框架使用 KoNLPy，但 KoNLPy 在 Windows 上可能涉及 Java、JPype、MeCab-ko 安装问题。

MVP 首选：

```txt
kiwipiepy
korean-romanizer
jamo
hanja
```

KoNLPy 后期作为可选增强。

---

## 三、修正版 Monorepo 目录结构

```txt
korean-cosmos/
│
├── apps/
│   ├── web/                              # Phase 0-5 主开发入口
│   │   ├── src/
│   │   │   ├── scenes/
│   │   │   │   ├── GalaxyScene/
│   │   │   │   │   ├── GalaxyScene.tsx   # R3F Canvas 根组件
│   │   │   │   │   ├── WordNodes.tsx     # InstancedMesh 节点渲染
│   │   │   │   │   ├── SemanticEdges.tsx # 普通语义连线
│   │   │   │   │   ├── HanjaEdges.tsx    # 한자어 金色连线
│   │   │   │   │   ├── WordLabels.tsx    # 近景标签
│   │   │   │   │   ├── CameraRig.tsx     # 相机控制和聚焦
│   │   │   │   │   └── galaxy-utils.ts
│   │   │   │   └── StudyScene/           # Phase 3+ 2D 学习工作台
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── WordCard/
│   │   │   │   │   ├── WordCard.tsx
│   │   │   │   │   └── WordCardSkeleton.tsx
│   │   │   │   ├── Sidebar/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── WordListItem.tsx
│   │   │   │   ├── Toolbar/
│   │   │   │   │   └── BottomToolbar.tsx
│   │   │   │   ├── Layout/
│   │   │   │   │   └── AppShell.tsx
│   │   │   │   └── TOPIK/                # Phase 7+
│   │   │   │
│   │   │   ├── mock/
│   │   │   │   ├── words.ts
│   │   │   │   ├── edges.ts
│   │   │   │   └── clusters.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── mapStore.ts
│   │   │   │   └── wordStore.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useWordCard.ts
│   │   │   │   └── useTTS.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── theme.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── local.ts
│   │   │   │
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── desktop/                          # Phase 8+ Tauri 桌面端
│       ├── src-tauri/
│       │   ├── src/main.rs
│       │   └── tauri.conf.json
│       └── package.json
│
├── packages/
│   ├── shared-types/                     # 前后端共享类型定义
│   │   ├── src/
│   │   │   ├── word.ts
│   │   │   ├── grammar.ts
│   │   │   ├── map.ts
│   │   │   ├── topik.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── korean-nlp/                       # 前端可用的轻量韩语逻辑
│   │   ├── src/
│   │   │   ├── romanizer.ts
│   │   │   ├── jamo.ts
│   │   │   ├── conjugation.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── galaxy-engine/                    # Phase 2+ 再抽象
│       ├── src/
│       │   ├── renderer/
│       │   ├── camera/
│       │   ├── picking/
│       │   ├── lod/
│       │   └── GalaxyEngine.ts
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   └── api/                              # FastAPI 后端
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/
│       │   │   ├── words.py
│       │   │   ├── map.py
│       │   │   ├── grammar.py
│       │   │   ├── tts.py
│       │   │   ├── topik.py              # Phase 7+
│       │   │   └── pdf.py                # Phase 7+
│       │   ├── services/
│       │   │   ├── nlp.py                # kiwipiepy 分析
│       │   │   ├── conjugation.py
│       │   │   ├── hanja.py              # 词典驱动，不做纯算法猜测
│       │   │   ├── tts.py                # Edge TTS + 缓存
│       │   │   ├── claude.py             # AI 词卡生成
│       │   │   └── pdf_parser.py
│       │   ├── db/
│       │   │   ├── database.py
│       │   │   └── schema.sql
│       │   └── schemas/
│       │       ├── word.py
│       │       ├── map.py
│       │       └── tts.py
│       │
│       ├── scripts/
│       │   ├── init_db.py
│       │   ├── import_words.py
│       │   ├── enrich_dict.py
│       │   ├── generate_cards.py
│       │   └── cluster.py
│       └── requirements.txt
│
├── data/
│   ├── topik_wordlist.csv
│   ├── korean_cosmos.db
│   └── tts_cache/
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── docker-compose.yml                    # Phase 6+ 可选
```

---

## 四、共享类型约定

### 4.1 MapNode

```typescript
export type WordOrigin = 'native' | 'sino_korean' | 'loanword' | 'hybrid';

export interface MapNode {
  id: number;
  hangul: string;
  romanization: string;
  pronunciation?: string;

  word_origin: WordOrigin;
  topik_level: 1 | 2 | 3 | 4 | 5 | 6;

  meaning_zh?: string;
  meaning_en?: string;
  pos?: string;

  map_x: number;
  map_y: number;
  map_z: number;

  cluster_id: number;
  cluster_name: string;
  cluster_color?: string;

  hanja?: string;
  hanja_group?: string;      // e.g. "경(經)"

  frequency_rank?: number;
  mastery?: number;          // 0-1，复习掌握度
  review_due?: boolean;
  is_favorite?: boolean;
  source?: string;
}
```

---

### 4.2 MapEdge

```typescript
export type MapEdgeType =
  | 'SYNONYM'
  | 'ANTONYM'
  | 'HYPERNYM'
  | 'HYPONYM'
  | 'CONFUSED'
  | 'HANJA_ROOT'
  | 'COLLOCATION'
  | 'CONJUGATION'
  | 'PARTICLE_PATTERN'
  | 'SAME_TOPIC';

export interface MapEdge {
  id: string;
  source: number;
  target: number;
  relation_type: MapEdgeType;
  strength: number;          // 0-1，控制连线粗细/透明度
  visible_by_default?: boolean;
}
```

---

### 4.3 Cluster

```typescript
export interface Cluster {
  id: number;
  name: string;              // 감정 / 사회 / 자연 / 일상 / 학문
  name_zh?: string;
  center_x: number;
  center_y: number;
  center_z: number;
  color: string;
  word_count: number;
}
```

---

### 4.4 WordCard

```typescript
export interface WordCard {
  id: number;
  hangul: string;
  romanization: string;
  pronunciation: string;

  word_origin: WordOrigin;
  hanja?: string;
  hanja_breakdown?: HanjaChar[];

  topik_level: number;
  pos?: string;
  meaning_zh: string;
  meaning_en?: string;

  scenario: ScenarioItem[];
  etymology?: Etymology;
  mnemonic?: string;
  examples: Example[];
  relations: Relations;

  conjugations?: ConjugationTable;
  particles?: ParticlePattern[];
  collocations?: Collocation[];

  ai_generated: boolean;
  ai_model?: string;
  prompt_version?: string;
  verified?: boolean;
  updated_at?: string;
}

export interface HanjaChar {
  korean_syllable: string;
  hanja_char: string;
  simplified_chinese?: string;
  traditional_chinese?: string;
  hanja_meaning: string;
}

export interface Example {
  sentence_ko: string;
  sentence_zh: string;
  romanization?: string;
  audio_url?: string;
  source?: string;
}

export interface ScenarioItem {
  title: string;
  description: string;
}

export interface Relations {
  synonyms: number[];
  antonyms: number[];
  related: number[];
  confused?: number[];
}

export interface ParticlePattern {
  particle: string;
  meaning_zh: string;
  example: string;
}

export interface Collocation {
  phrase: string;
  meaning_zh: string;
}
```

---

## 五、API 端点约定

FastAPI 使用 `{id}` 路径参数，不使用 `:id`。

```txt
GET  /api/health

GET  /api/map/nodes
GET  /api/map/edges
GET  /api/map/clusters
GET  /api/map/search?q=

GET  /api/words/{id}
GET  /api/words/{id}/conjugations
GET  /api/words/search?q=

POST /api/tts
Body: {
  text: string,
  language: "ko",
  voice?: string
}
Response: {
  audio_url: string,
  cached: boolean
}

POST /api/ai/word-card/{id}
Response: WordCard
```

后期扩展：

```txt
POST /api/documents/upload
GET  /api/documents/{id}/pages/{page}
POST /api/topik/parse
GET  /api/topik/sessions/{id}
```

---

## 六、Phase 0 最小可运行目标

### 6.1 Phase 0 目标

Phase 0 的目标不是完成产品，而是证明：

```txt
3D 星图视觉可行
+ 拖拽缩放可用
+ 节点点击可打开词卡
+ 한자어 连线层可切换
```

### 6.2 Phase 0 范围

```txt
节点数量：500 个 mock 节点
边数量：1000 条 mock 语义边
한자어边：100 条 mock 金色边
后端：不需要
数据库：不需要
AI：不需要
TTS：不需要真实播放，只放按钮
```

### 6.3 Phase 0 文件清单

```txt
apps/web/src/
├── scenes/GalaxyScene/
│   ├── GalaxyScene.tsx
│   ├── WordNodes.tsx
│   ├── SemanticEdges.tsx
│   ├── HanjaEdges.tsx
│   ├── WordLabels.tsx
│   └── CameraRig.tsx
│
├── components/
│   ├── WordCard/WordCard.tsx
│   ├── Sidebar/Sidebar.tsx
│   └── Toolbar/BottomToolbar.tsx
│
├── mock/
│   ├── words.ts
│   ├── edges.ts
│   └── clusters.ts
│
├── stores/mapStore.ts
├── App.tsx
└── index.css
```

### 6.4 Phase 0 验收标准

```txt
视觉：
- 页面打开后显示暗色宇宙背景
- 中间有 500 个发光节点
- 节点之间有细线连接
- 한자어 金色连线可开关

交互：
- 鼠标拖拽可旋转/平移视角
- 滚轮可缩放
- 点击节点，右侧/浮层显示 WordCard
- 左侧列表点击单词，相机聚焦该节点
- 搜索关键词可过滤/高亮节点

性能：
- 普通开发机上保持基本流畅
- 无明显内存泄漏
- 切换 한자어 层不卡死
```

---

## 七、初始化命令（修正版）

### 7.1 创建项目

```bash
mkdir korean-cosmos
cd korean-cosmos
pnpm init
```

### 7.2 pnpm workspace

```bash
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

Windows PowerShell 可用：

```powershell
@"
packages:
  - 'apps/*'
  - 'packages/*'
"@ | Set-Content pnpm-workspace.yaml
```

### 7.3 创建 Web App

```bash
pnpm create vite apps/web --template react-ts
cd apps/web
```

如果 Vite 默认安装 React 19，强制切回 React 18：

```bash
pnpm add react@18.3.1 react-dom@18.3.1
pnpm add -D @types/react@18 @types/react-dom@18
```

### 7.4 安装前端依赖

```bash
pnpm add three@0.165 @react-three/fiber@8 @react-three/drei@9 @react-three/postprocessing@2
pnpm add postprocessing three-mesh-bvh troika-three-text
pnpm add d3-force-3d graphology
pnpm add zustand@4 @tanstack/react-query@5
pnpm add framer-motion lucide-react clsx tailwind-merge
pnpm add -D @types/three vitest
```

### 7.5 Tailwind 3 + shadcn/ui

```bash
pnpm add -D tailwindcss@3 postcss autoprefixer
pnpm dlx tailwindcss init -p
pnpm dlx shadcn@latest init
```

不要在 MVP 使用：

```txt
@tailwindcss/vite
```

### 7.6 后端初始化（Phase 2 再做）

```bash
mkdir -p services/api
cd services/api
python -m venv venv
```

Windows：

```powershell
venv\Scripts\activate
```

macOS/Linux：

```bash
source venv/bin/activate
```

安装依赖：

```bash
pip install fastapi uvicorn pydantic aiosqlite aiofiles
pip install anthropic pymupdf edge-tts sentence-transformers umap-learn hdbscan
pip install kiwipiepy korean-romanizer jamo hanja
```

---

## 八、Phase 路线图

### Phase 0：R3F mock 3D 星图

目标：

```txt
500 mock 节点 + 1000 mock 边 + 点击词卡 + 한자어 层切换
```

不做：

```txt
后端、数据库、真实词库、AI、TTS
```

---

### Phase 1：词卡 UI + Sidebar + 搜索

目标：

```txt
左侧词表
搜索框
词卡详情
节点聚焦
类别筛选
```

---

### Phase 2：FastAPI + SQLite + 真实词库

目标：

```txt
初始化 SQLite
导入 500-1000 个真实 TOPIK 词
提供 /api/map/nodes 和 /api/words/{id}
```

---

### Phase 3：TTS 缓存

目标：

```txt
POST /api/tts
Edge TTS 生成韩语发音
本地缓存 mp3
重复播放走缓存
```

---

### Phase 4：한자어 词根连线

目标：

```txt
从词典字段读取 Hanja
生成 HANJA_ROOT 边
星图中金色显示
点击词根高亮相关词
```

注意：

```txt
不要靠 hangul → hanja 纯算法推断。
必须使用带汉字字段的词典数据。
```

---

### Phase 5：韩语变形轮

目标：

```txt
动词/形容词打开变形轮
基础语尾变化规则生成
不规则变化进入规则表
被动/使动需要词典校验
```

---

### Phase 6：AI 词卡生成

目标：

```txt
AI 生成 scenario / mnemonic / examples
Pydantic 校验
保存 ai_model / prompt_version / verified 字段
用户可编辑
```

---

### Phase 7：TOPIK / PDF 系统

目标：

```txt
PDF 阅读
TOPIK 题目结构化
Quiz Mode
Study Mode
Scan Mode
```

---

### Phase 8：Tauri 桌面端

目标：

```txt
把稳定 Web App 封装为桌面 App
支持本地文件访问
支持离线词库
```

---

## 九、Claude Code 执行策略

### 9.1 总原则

不要让 Claude Code 一次性做完整系统。

错误指令：

```txt
帮我实现 korean-cosmos 完整项目。
```

正确指令：

```txt
只实现 Phase 0 的 GalaxyScene。使用 mock 数据，不接后端，不做 AI，不做数据库。
```

---

### 9.2 Phase 0 推荐 Prompt

```txt
请在 apps/web 中实现 Phase 0：R3F mock 3D 星图。

要求：
1. 使用 React 18 + TypeScript + @react-three/fiber。
2. 使用 mock 数据，500 个节点，1000 条语义边，100 条 한자어 金色边。
3. 实现暗色宇宙背景。
4. 节点使用 InstancedMesh 渲染。
5. 普通边使用 LineSegments，颜色低透明白色。
6. 한자어 边使用金色 LineSegments，可通过 Zustand 状态开关。
7. 左侧 Sidebar 显示 mock 单词列表和搜索框。
8. 点击节点或列表项，设置 selectedNodeId，并显示 WordCard。
9. 底部 Toolbar 有：显示/隐藏 한자어 层、重置视角、深色模式按钮。
10. 不实现后端、不实现数据库、不实现 TTS、不实现 AI。

请先创建文件结构，再逐步实现组件。
```

---

## 十、开发验收标准

### 10.1 Phase 0 验收

```txt
pnpm dev 能启动
浏览器无 TypeScript 报错
页面有 3D 星图
拖拽缩放正常
点击节点出现词卡
한자어 层可开关
```

### 10.2 Phase 2 验收

```txt
FastAPI 能启动
SQLite 有 words / word_cards / map_edges / clusters 表
/api/map/nodes 正常返回
/api/words/{id} 正常返回
前端可以从 API 加载真实节点
```

### 10.3 Phase 3 验收

```txt
POST /api/tts 可生成韩语音频
第二次播放命中缓存
前端点击播放按钮可播放音频
```

---

## 十一、风险与规避

### 11.1 3D 星图过早复杂化

风险：

- InstancedMesh、拾取、标签、LOD 同时做，容易卡住。

规避：

```txt
Phase 0 不做完美拾取。
可以先使用简单 raycast 或列表点击联动。
LOD 和 BVH 放 Phase 2+。
```

---

### 11.2 韩语汉字词识别错误

风险：

- Hangul 转 Hanja 高度歧义。

规避：

```txt
只使用词典明确给出的 hanja 字段。
没有 hanja 字段的词，不强行归为 한자어。
```

---

### 11.3 AI 生成内容胡编

风险：

- 词源、例句、记忆故事可能不准确。

规避：

```txt
AI 字段必须标记 ai_generated。
保留 ai_model / prompt_version。
允许用户编辑和 verified 标记。
词源类内容尽量来自词典，AI 只做学习辅助表达。
```

---

### 11.4 TOPIK / PDF 过早进入

风险：

- PDF 解析会显著拉长 MVP 周期。

规避：

```txt
Phase 7 之前不要做 PDF。
先把星图 + 词卡 + TTS + 한자어 做完整。
```

---

## 十二、文档索引

| 文档 | 路径 | 用途 |
|---|---|---|
| 韩语版分析文档 | `specs/2026-05-30-korean-learning-app-analysis.md` | 系统功能拆解、技术难点分析 |
| 韩语版开发计划 | `plans/2026-05-30-korean-learning-app-dev-plan.md` | 技术栈、数据库、API、阶段计划 |
| 原框架文档 | `plans/2026-05-30-korean-cosmos-framework.md` | 原始框架定义 |
| 当前修正版 | `plans/2026-05-30-korean-cosmos-framework-revised.md` | 可直接给 Claude Code 执行的修正版 |
| 补充文档 | `specs/2026-05-30-learning-app-addendum.md` | 版权核查、MVP 标准、执行策略 |

---

## 十三、最终建议

正式编码时优先顺序：

```txt
1. Phase 0 mock 星图跑通
2. Sidebar + WordCard 交互顺滑
3. 接真实词库
4. 加 TTS
5. 加 한자어 层
6. 加变形轮
7. 加 AI 词卡
8. 最后才做 TOPIK/PDF/Tauri
```

核心原则：

> 不要一开始追求完整系统。先把“看到就想用”的宇宙星图做出来，再逐步补数据和学习能力。
