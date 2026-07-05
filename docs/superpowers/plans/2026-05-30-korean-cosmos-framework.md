# Korean Cosmos — 项目框架定义

> 本文档定义项目骨架、目录结构、启动命令和各层接口约定
> 确认此文档后即可开始 Phase 0 编码
> 日期：2026-05-30

---

## 一、项目名称与定位

```
项目名：korean-cosmos
定位：韩语宇宙词库 —— 3D 星系探索 + 2D 学习工作台
目标用户：中国韩语学习者
MVP 范围：3D 星图 + 词卡 + TTS + 한자어连线 + 변형轮
```

---

## 二、Monorepo 目录结构

```
korean-cosmos/
│
├── apps/
│   ├── web/                        # Web SaaS（Vite + React）
│   │   ├── src/
│   │   │   ├── scenes/
│   │   │   │   ├── GalaxyScene/    # Three.js 3D 星系主场景
│   │   │   │   └── StudyScene/     # 2D 学习工作台
│   │   │   ├── components/
│   │   │   │   ├── WordCard/       # 词卡详情面板
│   │   │   │   ├── Sidebar/        # 左侧词表 + 搜索
│   │   │   │   ├── Toolbar/        # 底部工具栏
│   │   │   │   └── TOPIK/          # TOPIK 做题系统（Phase 4）
│   │   │   ├── stores/
│   │   │   │   ├── mapStore.ts     # 星图状态（选中/hover/模式/搜索）
│   │   │   │   └── wordStore.ts    # 词库缓存状态
│   │   │   ├── hooks/
│   │   │   │   ├── useWordCard.ts
│   │   │   │   └── useTTS.ts
│   │   │   ├── lib/
│   │   │   │   └── api.ts          # API 客户端（TanStack Query）
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── desktop/                    # Tauri 桌面端（Phase 6）
│       ├── src-tauri/
│       │   ├── src/main.rs
│       │   └── tauri.conf.json
│       └── package.json
│
├── packages/
│   │
│   ├── galaxy-engine/              # 3D 星系渲染引擎（纯 Three.js，无 React 依赖）
│   │   ├── src/
│   │   │   ├── renderer/
│   │   │   │   ├── NodeRenderer.ts      # InstancedMesh 节点渲染
│   │   │   │   ├── EdgeRenderer.ts      # LineSegments 语义连线
│   │   │   │   ├── HanjaEdgeRenderer.ts # 汉字词根金色轨道线
│   │   │   │   ├── LabelRenderer.ts     # CSS2DRenderer 标签管理
│   │   │   │   └── ParticleRenderer.ts  # Points 星云粒子
│   │   │   ├── camera/
│   │   │   │   └── CameraFlight.ts      # 相机飞行到目标节点
│   │   │   ├── picking/
│   │   │   │   └── RaycastPicker.ts     # 节点点击命中检测
│   │   │   ├── lod/
│   │   │   │   └── LODController.ts     # 距离 LOD 控制
│   │   │   └── GalaxyEngine.ts          # 对外统一接口
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── korean-nlp/                 # 韩语语言处理（纯逻辑，无框架依赖）
│   │   ├── src/
│   │   │   ├── romanizer.ts        # 韩文罗马字转写
│   │   │   ├── jamo.ts             # 자모 分解/合成
│   │   │   └── conjugation.ts     # 변형 规则引擎（前端只读版）
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared-types/               # 前后端共享类型定义
│       ├── src/
│       │   ├── word.ts             # Word, WordCard, WordRelation
│       │   ├── grammar.ts          # GrammarPoint, GrammarRelation
│       │   ├── map.ts              # MapNode, MapEdge, Cluster
│       │   └── topik.ts            # TOPIKQuestion, TOPIKSession
│       ├── package.json
│       └── tsconfig.json
│
├── services/
│   └── api/                        # FastAPI 后端
│       ├── app/
│       │   ├── main.py
│       │   ├── routers/
│       │   │   ├── words.py
│       │   │   ├── map.py
│       │   │   ├── grammar.py
│       │   │   ├── tts.py
│       │   │   ├── topik.py        # Phase 4
│       │   │   └── pdf.py          # Phase 5
│       │   ├── services/
│       │   │   ├── nlp.py          # KoNLPy 분석
│       │   │   ├── conjugation.py  # 변형 규칙 엔진
│       │   │   ├── hanja.py        # 한자어 분석（词典数据，非算法推断）
│       │   │   ├── tts.py          # Edge TTS + 缓存
│       │   │   ├── claude.py       # Claude API 词卡生成
│       │   │   └── pdf_parser.py   # Phase 5
│       │   └── db/
│       │       ├── database.py     # SQLite 连接
│       │       └── schema.sql      # 建表语句
│       ├── scripts/
│       │   ├── import_words.py     # 导入 TOPIK 词表
│       │   ├── enrich_dict.py      # 국립국어원 API 补全
│       │   ├── generate_cards.py   # Claude 批量生成词卡
│       │   └── cluster.py          # UMAP + HDBSCAN + 汉字连线
│       └── requirements.txt
│
├── data/
│   ├── topik_wordlist.csv          # TOPIK 分级词表（原始）
│   ├── korean_cosmos.db            # SQLite 数据库
│   └── tts_cache/                  # Edge TTS 音频缓存
│
├── pnpm-workspace.yaml             # Monorepo 配置
├── package.json                    # 根 package.json
├── tsconfig.base.json              # 共享 TS 配置
└── docker-compose.yml              # Redis（任务队列，Phase 2+）
```

---

## 三、核心接口约定

### 3.1 共享类型（shared-types）

```typescript
// map.ts —— 星图核心数据结构
export interface MapNode {
  id: number;
  hangul: string;
  romanization: string;
  word_origin: 'goyu' | 'hanja' | 'oerae' | 'honsong';
  topik_level: 1 | 2 | 3 | 4 | 5 | 6;
  map_x: number;
  map_y: number;
  map_z: number;
  cluster_id: number;
  cluster_name: string;
  hanja_group?: string;   // 汉字词根，如 "경(經)"
}

export interface MapEdge {
  source: number;         // word id
  target: number;         // word id
  relation_type: 'SYNONYM' | 'ANTONYM' | 'SUPERORD' | 'SUBORD' | 'CONFUSED' | 'HANJA_ROOT';
  strength: number;       // 0-1，控制连线粗细
}

export interface Cluster {
  id: number;
  name: string;           // 감정 / 사회 / 자연 / 일상 / 학문
  center_x: number;
  center_y: number;
  center_z: number;
  color: string;          // hex
  word_count: number;
}

// word.ts —— 词卡详情
export interface WordCard {
  id: number;
  hangul: string;
  romanization: string;
  pronunciation: string;
  word_origin: string;
  hanja?: string;
  hanja_breakdown?: HanjaChar[];
  topik_level: number;
  meaning_zh: string;
  meaning_en: string;
  scenario: ScenarioItem[];
  etymology: Etymology;
  mnemonic: string;
  examples: Example[];
  relations: Relations;
  conjugations?: ConjugationTable;   // 동사/형용사 only
  particles?: string[];              // 常用助词搭配
  ai_generated: boolean;             // 标注 AI 生成字段
}

export interface HanjaChar {
  korean_syllable: string;
  hanja_char: string;
  simplified_chinese: string;
  hanja_meaning: string;
}
```

### 3.2 GalaxyEngine 对外接口

```typescript
// packages/galaxy-engine/src/GalaxyEngine.ts

export interface GalaxyEngineOptions {
  container: HTMLElement;
  onNodeClick: (nodeId: number) => void;
  onNodeHover: (nodeId: number | null) => void;
}

export class GalaxyEngine {
  constructor(options: GalaxyEngineOptions) {}

  // 数据加载
  loadNodes(nodes: MapNode[]): void {}
  loadEdges(edges: MapEdge[], type: 'semantic' | 'hanja'): void {}
  loadClusters(clusters: Cluster[]): void {}

  // 视图控制
  focusNode(nodeId: number, animated?: boolean): void {}
  focusCluster(clusterId: number): void {}
  setHanjaLayerVisible(visible: boolean): void {}
  setMode(mode: '3d-galaxy' | '2d-study'): void {}

  // 高亮
  highlightNode(nodeId: number): void {}
  highlightPath(nodeIds: number[]): void {}
  clearHighlight(): void {}

  // 销毁
  dispose(): void {}
}
```

### 3.3 API 端点约定

```
GET  /api/map/nodes           → MapNode[]（含 x/y/z）
GET  /api/map/edges           → MapEdge[]（语义 + 汉字两类）
GET  /api/map/clusters        → Cluster[]

GET  /api/words/:id           → WordCard
GET  /api/words/:id/conjugations → ConjugationTable
GET  /api/words/search?q=     → MapNode[]（高亮用）

GET  /api/tts/:id             → audio/mpeg（缓存后直接返回文件）
```

---

## 四、初始化命令

```bash
# 1. 创建项目根目录
mkdir korean-cosmos && cd korean-cosmos

# 2. 初始化 pnpm monorepo
pnpm init
echo "packages:\n  - 'apps/*'\n  - 'packages/*'\n  - 'services/*'" > pnpm-workspace.yaml

# 3. 创建 Web App
pnpm create vite apps/web --template react-ts

# 4. 安装前端核心依赖
cd apps/web
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing
pnpm add postprocessing three-mesh-bvh troika-three-text
pnpm add d3-force-3d graphology
pnpm add zustand @tanstack/react-query
pnpm add framer-motion react-pdf
pnpm add tailwindcss @tailwindcss/vite
pnpm add lucide-react
pnpm add -D @types/three vitest

# 5. 安装 shadcn/ui
pnpm dlx shadcn@latest init

# 6. 创建后端
cd ../../services/api
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn anthropic pymupdf konlpy korean-romanizer
pip install hanja jamo edge-tts sentence-transformers umap-learn hdbscan
pip install aiofiles aiosqlite

# 7. 初始化数据库
python scripts/init_db.py

# 8. 启动开发环境
# 终端1：前端
cd apps/web && pnpm dev

# 终端2：后端
cd services/api && uvicorn app.main:app --reload --port 8000
```

---

## 五、Phase 0 最小可运行目标

完成以下内容即算 Phase 0 Done，可以截图验证视觉效果：

```
apps/web/src/
├── scenes/
│   └── GalaxyScene/
│       ├── GalaxyScene.tsx      # Canvas 根，含 Stars + EffectComposer
│       ├── WordNodes.tsx         # InstancedMesh，1000 mock 节点
│       ├── SemanticEdges.tsx     # LineSegments，mock 连线
│       ├── HanjaEdges.tsx        # LineSegments，金色 mock 轨道线
│       └── WordLabels.tsx        # CSS2DRenderer，近景标签
├── components/
│   ├── WordCard/
│   │   └── WordCard.tsx          # mock 词卡数据展示
│   └── Sidebar/
│       └── Sidebar.tsx           # mock 词表 + 搜索框（仅 UI）
├── stores/
│   └── mapStore.ts               # selectedNodeId / showHanjaLayer / mode
└── App.tsx                       # 场景切换入口
```

**mock 数据格式（hardcoded，不需要后端）**：
```typescript
// src/mock/words.ts
export const MOCK_NODES: MapNode[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  hangul: ['경제', '사랑', '학교', '시간', '문화', '자연', '감동'][i % 7],
  romanization: 'sample',
  word_origin: (['goyu', 'hanja', 'oerae', 'honsong'] as const)[i % 4],
  topik_level: ((i % 6) + 1) as 1|2|3|4|5|6,
  map_x: (Math.random() - 0.5) * 400,
  map_y: (Math.random() - 0.5) * 400,
  map_z: (Math.random() - 0.5) * 400,
  cluster_id: i % 8,
  cluster_name: ['감정','사회','자연','일상','학문','한자어','기타','추상'][i % 8],
}));
```

---

## 六、各层技术版本锁定

```json
{
  "three": "0.165.x",
  "@react-three/fiber": "8.x",
  "@react-three/drei": "9.x",
  "@react-three/postprocessing": "2.x",
  "troika-three-text": "0.49.x",
  "d3-force-3d": "3.x",
  "graphology": "0.25.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x",
  "tailwindcss": "3.x",
  "python": "3.11+",
  "fastapi": "0.111.x",
  "anthropic": "0.28.x"
}
```

---

## 七、文档索引

| 文档 | 路径 | 用途 |
|------|------|------|
| 韩语版分析文档 | `specs/2026-05-30-korean-learning-app-analysis.md` | 系统功能拆解、技术难点分析 |
| 韩语版开发计划 | `plans/2026-05-30-korean-learning-app-dev-plan.md` | 技术栈、数据库、API、阶段计划 |
| 补充文档 | `specs/2026-05-30-learning-app-addendum.md` | 版权核查、MVP 标准、执行策略 |
| 项目框架 | `plans/2026-05-30-korean-cosmos-framework.md` | 目录结构、接口约定、初始化命令 |
| 日语版分析（参考）| `specs/2026-05-30-japanese-learning-app-analysis.md` | 原型参考，已弃用 |
| 日语版计划（参考）| `plans/2026-05-30-japanese-learning-app-dev-plan.md` | 原型参考，已弃用 |
