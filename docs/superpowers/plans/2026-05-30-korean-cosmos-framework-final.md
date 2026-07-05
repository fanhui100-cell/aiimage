# Korean Cosmos — 最终项目框架

> 基于 Pi agent 修正版，补丁：① Phase 0 标签方案 ② API bbox TODO ③ 한자어连线移入 Phase 0
> 日期：2026-05-30

---

## 一、项目定位

```
项目名：korean-cosmos
中文名：韩语宇宙词库
定位：中国韩语学习者的沉浸式词库 + 语法图谱 + TOPIK 学习工作台
核心卖点：3D 星系探索 + 한자어 汉字词星座 + 2D 高效学习工作台
```

**产品一句话**：把韩语单词、汉字词、语法、变形和 TOPIK 做成一张可以探索的宇宙星图。

**MVP 边界**：

```
必须做                    暂不做
─────────────────────    ──────────────────────
3D mock 星图             登录 / 支付
한자어 金色连线           云同步
词卡详情                  TOPIK PDF 解析
TTS 播放                  OCR
韩语变形轮                桌面端打包
搜索 / 定位
```

---

## 二、技术决策（最终定案）

| 决策 | 选择 | 理由 |
|------|------|------|
| 3D 渲染 | Three.js + React Three Fiber | 真实 3D 星系（景深/粒子/轨道），必须 Three.js |
| Phase 0 标签 | `@react-three/drei <Html>` | 最省事，无需额外库；Phase 2+ 换 troika-three-text |
| 图谱数据 | graphology | 节点/边数据结构管理 |
| 性能抽象层 | galaxy-engine（Phase 2+ 再抽）| Phase 0 直接在 GalaxyScene 内写 R3F 组件 |
| 前端框架 | Vite + React 18 + TypeScript | 显式锁 React 18，R3F 8.x 兼容性更稳 |
| UI | Tailwind 3 + shadcn/ui | 不用 `@tailwindcss/vite`，标准配置更稳 |
| 状态管理 | Zustand 4 | 星图交互状态集中管理 |
| 数据请求 | TanStack Query 5 | Phase 2+ 接真实 API 用 |
| 后端 | FastAPI + Python 3.11 | Phase 2 再建，Phase 0 纯前端 |
| 数据库 | SQLite（MVP）→ PostgreSQL + pgvector（SaaS）| 本地零运维起步 |
| 韩语 NLP | kiwipiepy | 纯 Python，Windows 直接 pip install；KoNLPy 需要 Java 依赖 |
| AI | Claude API（Haiku 批量，Sonnet 复杂任务）| 中文 Mnemonic 生成最强 |
| TTS | Edge TTS（免费）| 韩语音质好，无需 API key |
| OCR | PaddleOCR（Phase 7+）| 韩语识别率高 |
| 桌面端 | Tauri 2.0（Phase 8+）| 比 Electron 轻 10 倍 |

**工程原则（必须贯穿全程）**：

```
① React 管场景结构，Three.js 管大批量对象
  ✗  {words.map(w => <WordNode />)}
  ✓  <instancedMesh> + useEffect 写矩阵

② 3D 坐标来自数据库（UMAP 离线预计算），不实时跑力导向

③ 标签按 LOD 层级显示，不是每个节点都挂标签

④ AI 输出必须 JSON Schema 校验后才写入数据库

⑤ 피동/사동 形式必须词典验证，规则引擎只生成基础语尾

⑥ hanja 字段来自词典，不来自 hangul→hanja 算法推断
```

---

## 三、目录结构

```
korean-cosmos/
│
├── apps/
│   ├── web/                              # Phase 0-7 主开发入口
│   │   ├── src/
│   │   │   ├── scenes/
│   │   │   │   ├── GalaxyScene/
│   │   │   │   │   ├── GalaxyScene.tsx   # R3F Canvas 根组件
│   │   │   │   │   ├── WordNodes.tsx     # InstancedMesh 节点
│   │   │   │   │   ├── SemanticEdges.tsx # 普通语义连线 LineSegments
│   │   │   │   │   ├── HanjaEdges.tsx    # 한자어 金色连线（Phase 0 就有）
│   │   │   │   │   ├── WordLabels.tsx    # <Html> 标签，近景才显
│   │   │   │   │   ├── CameraRig.tsx     # 相机控制 + 节点飞行
│   │   │   │   │   └── galaxy-utils.ts  # 颜色/大小计算工具
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
│   │   │   │   └── Layout/
│   │   │   │       └── AppShell.tsx
│   │   │   │
│   │   │   ├── mock/                     # Phase 0 假数据，接真实 API 后废弃
│   │   │   │   ├── words.ts
│   │   │   │   ├── edges.ts
│   │   │   │   └── clusters.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── mapStore.ts           # selectedNodeId/showHanjaLayer/mode/searchQuery
│   │   │   │   └── wordStore.ts          # 词库缓存
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
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   │
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── desktop/                          # Phase 8+ Tauri
│       ├── src-tauri/
│       │   ├── src/main.rs
│       │   └── tauri.conf.json
│       └── package.json
│
├── packages/
│   ├── shared-types/                     # 前后端共享类型
│   │   ├── src/
│   │   │   ├── word.ts
│   │   │   ├── grammar.ts
│   │   │   ├── map.ts
│   │   │   ├── topik.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── korean-nlp/                       # 前端轻量韩语逻辑
│   │   ├── src/
│   │   │   ├── romanizer.ts
│   │   │   ├── jamo.ts
│   │   │   ├── conjugation.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── galaxy-engine/                    # Phase 2+ 再抽象，Phase 0 不用
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
│   └── api/                              # Phase 2+ 再建
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
│       │   │   ├── nlp.py                # kiwipiepy
│       │   │   ├── conjugation.py
│       │   │   ├── hanja.py              # 词典驱动
│       │   │   ├── tts.py                # Edge TTS + 缓存
│       │   │   ├── claude.py
│       │   │   └── pdf_parser.py         # Phase 7+
│       │   ├── db/
│       │   │   ├── database.py
│       │   │   └── schema.sql
│       │   └── schemas/                  # Pydantic schemas
│       │       ├── word.py
│       │       ├── map.py
│       │       └── tts.py
│       │
│       ├── scripts/
│       │   ├── init_db.py                # 建表 + 初始数据
│       │   ├── import_words.py
│       │   ├── enrich_dict.py            # 국립국어원 API 补全
│       │   ├── generate_cards.py         # Claude 批量词卡
│       │   └── cluster.py               # UMAP + HDBSCAN + 汉字连线
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
└── docker-compose.yml                    # Phase 6+ Redis 可选
```

---

## 四、共享类型定义

```typescript
// packages/shared-types/src/map.ts

export type WordOrigin = 'native' | 'sino_korean' | 'loanword' | 'hybrid';

export interface MapNode {
  id: number;
  hangul: string;
  romanization: string;
  word_origin: WordOrigin;
  topik_level: 1 | 2 | 3 | 4 | 5 | 6;
  meaning_zh?: string;
  map_x: number;
  map_y: number;
  map_z: number;
  cluster_id: number;
  cluster_name: string;
  cluster_color?: string;
  hanja?: string;
  hanja_group?: string;        // e.g. "경(經)"
  frequency_rank?: number;
}

export type MapEdgeType =
  | 'SYNONYM' | 'ANTONYM' | 'HYPERNYM' | 'HYPONYM'
  | 'CONFUSED' | 'HANJA_ROOT' | 'COLLOCATION'
  | 'CONJUGATION' | 'PARTICLE_PATTERN' | 'SAME_TOPIC';

export interface MapEdge {
  id: string;
  source: number;
  target: number;
  relation_type: MapEdgeType;
  strength: number;             // 0-1，控制连线粗细/透明度
  visible_by_default?: boolean;
}

export interface Cluster {
  id: number;
  name: string;
  name_zh?: string;
  center_x: number;
  center_y: number;
  center_z: number;
  color: string;
  word_count: number;
}
```

```typescript
// packages/shared-types/src/word.ts

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
  relations: {
    synonyms: number[];         // word IDs，不是字符串
    antonyms: number[];
    related: number[];
    confused?: number[];
  };
  conjugations?: ConjugationTable;
  particles?: ParticlePattern[];
  collocations?: Collocation[];
  // AI 元数据
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
  hanja_meaning: string;
}

export interface Example {
  sentence_ko: string;
  sentence_zh: string;
  romanization?: string;
  topik_level?: number;
  source?: string;
}

export interface ParticlePattern {
  particle: string;
  meaning_zh: string;
  example: string;
}
```

---

## 五、API 端点

```
GET  /api/health

# 星图数据
GET  /api/map/nodes
     # TODO Phase 3+：加 ?bbox=x1,y1,z1,x2,y2,z2&cluster_id=&lod=1|2|3 支持分批加载
GET  /api/map/edges
GET  /api/map/clusters
GET  /api/map/search?q=

# 词汇
GET  /api/words/{id}
GET  /api/words/{id}/conjugations
GET  /api/words/search?q=

# TTS（POST，有副作用）
POST /api/tts
     Body: { text: string, language: "ko", voice?: string }
     Response: { audio_url: string, cached: boolean }

# AI 词卡生成（内部管理用）
POST /api/ai/word-card/{id}

# Phase 7+ 扩展
POST /api/documents/upload
POST /api/topik/parse
GET  /api/topik/sessions/{id}
```

---

## 六、Phase 0 Mock 数据格式

```typescript
// apps/web/src/mock/words.ts
import type { MapNode } from '@korean-cosmos/shared-types';

const CLUSTER_NAMES = ['감정','사회','자연','일상','학문','한자어','추상','기타'];
const CLUSTER_COLORS = ['#FF6B9D','#4FC3F7','#A5D6A7','#FFD54F','#CE93D8','#FFD700','#80DEEA','#BCAAA4'];
const ORIGINS = ['native','sino_korean','loanword','hybrid'] as const;
const SAMPLE_WORDS = ['경제','사랑','학교','시간','문화','자연','감동','행복','음악','여행'];

export const MOCK_NODES: MapNode[] = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  hangul: SAMPLE_WORDS[i % SAMPLE_WORDS.length],
  romanization: 'sample',
  word_origin: ORIGINS[i % 4],
  topik_level: ((i % 6) + 1) as 1|2|3|4|5|6,
  meaning_zh: '示例释义',
  map_x: (Math.random() - 0.5) * 300,
  map_y: (Math.random() - 0.5) * 300,
  map_z: (Math.random() - 0.5) * 300,
  cluster_id: i % 8,
  cluster_name: CLUSTER_NAMES[i % 8],
  cluster_color: CLUSTER_COLORS[i % 8],
  hanja: i % 4 === 1 ? '經濟' : undefined,
  hanja_group: i % 4 === 1 ? '경(經)' : undefined,
}));

// apps/web/src/mock/edges.ts
export const MOCK_SEMANTIC_EDGES = Array.from({ length: 1000 }, (_, i) => ({
  id: `s-${i}`,
  source: Math.floor(Math.random() * 500),
  target: Math.floor(Math.random() * 500),
  relation_type: 'SYNONYM' as const,
  strength: Math.random() * 0.5 + 0.2,
}));

// 한자어 金色连线（Phase 0 就包含，核心差异化）
export const MOCK_HANJA_EDGES = Array.from({ length: 100 }, (_, i) => ({
  id: `h-${i}`,
  source: (i * 4) % 500,       // 只连 sino_korean 节点
  target: (i * 4 + 4) % 500,
  relation_type: 'HANJA_ROOT' as const,
  strength: 0.8,
}));
```

---

## 七、Zustand Store 约定

```typescript
// apps/web/src/stores/mapStore.ts
import { create } from 'zustand';

interface MapStore {
  // 选中状态
  selectedNodeId: number | null;
  hoveredNodeId: number | null;
  setSelectedNode: (id: number | null) => void;
  setHoveredNode: (id: number | null) => void;

  // 图层控制
  showHanjaLayer: boolean;
  toggleHanjaLayer: () => void;

  // 模式
  mode: '3d-galaxy' | '2d-study';
  setMode: (mode: '3d-galaxy' | '2d-study') => void;

  // 搜索
  searchQuery: string;
  searchResults: number[];    // 高亮的 node IDs
  setSearch: (q: string, results: number[]) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setHoveredNode: (id) => set({ hoveredNodeId: id }),
  showHanjaLayer: false,
  toggleHanjaLayer: () => set((s) => ({ showHanjaLayer: !s.showHanjaLayer })),
  mode: '3d-galaxy',
  setMode: (mode) => set({ mode }),
  searchQuery: '',
  searchResults: [],
  setSearch: (searchQuery, searchResults) => set({ searchQuery, searchResults }),
}));
```

---

## 八、初始化命令（Windows PowerShell）

```powershell
# 1. 创建根目录
mkdir korean-cosmos
cd korean-cosmos

# 2. 初始化 pnpm monorepo
pnpm init

# 3. pnpm workspace 配置
@"
packages:
  - 'apps/*'
  - 'packages/*'
"@ | Set-Content pnpm-workspace.yaml

# 4. 创建 Web App
pnpm create vite apps/web --template react-ts
cd apps/web

# 5. 锁定 React 18（Vite 可能默认装 React 19）
pnpm add react@18.3.1 react-dom@18.3.1
pnpm add -D @types/react@18 @types/react-dom@18

# 6. 安装 Three.js + R3F
pnpm add three@0.165 @react-three/fiber@8 @react-three/drei@9 @react-three/postprocessing@2
pnpm add postprocessing three-mesh-bvh troika-three-text
pnpm add d3-force-3d graphology

# 7. 安装前端工具库
pnpm add zustand@4 "@tanstack/react-query@5"
pnpm add framer-motion lucide-react clsx tailwind-merge

# 8. Tailwind 3 + shadcn/ui（不用 @tailwindcss/vite）
pnpm add -D tailwindcss@3 postcss autoprefixer
pnpm dlx tailwindcss init -p
pnpm dlx shadcn@latest init

# 9. 类型声明
pnpm add -D @types/three vitest

# ──────────────── Phase 2+ 才建后端 ────────────────
# cd ../../services/api
# python -m venv venv
# .\venv\Scripts\Activate.ps1
# pip install fastapi uvicorn pydantic aiosqlite aiofiles
# pip install anthropic pymupdf edge-tts
# pip install sentence-transformers umap-learn hdbscan
# pip install kiwipiepy korean-romanizer jamo hanja
```

---

## 九、阶段划分

| Phase | 名称 | 核心目标 | 需要后端 |
|-------|------|---------|---------|
| **0** | R3F Mock 星图 | 500 mock 节点 + 한자어连线 + 词卡弹出 + 相机飞行 | ❌ |
| **1** | UI 完善 | Sidebar + 搜索 + 词卡详情 + 类别筛选 + 深色主题 | ❌ |
| **2** | FastAPI + SQLite | 建库 + 导入真实词库 + API 接入前端 | ✅ |
| **3** | TTS | Edge TTS 生成 + 本地缓存 + 播放按钮 | ✅ |
| **4** | 변형轮 | 韩语变形规则引擎 + 变形轮 SVG | ✅ |
| **5** | AI 词卡 | Claude Haiku 批量生成 + JSON 校验 + 用户可编辑 | ✅ |
| **6** | 语义聚类 | UMAP 3D 坐标 + HDBSCAN + 한자어词根连线数据化 | ✅ |
| **7** | TOPIK / PDF | PDF 解析 + Quiz/Study/Scan Mode | ✅ |
| **8** | Tauri 桌面端 | 封装 Web App + 本地文件访问 + 离线词库 | ✅ |

---

## 十、Phase 0 验收标准

```
视觉
  ✓ 暗色宇宙背景，500 个发光节点
  ✓ 节点按词汇来源分色（native=蓝 / sino_korean=金 / loanword=绿 / hybrid=紫）
  ✓ 普通语义连线（低透明白色）
  ✓ 한자어 金色连线，可通过 Toolbar 开关

交互
  ✓ 鼠标拖拽旋转，滚轮缩放
  ✓ 点击节点 → WordCard 弹出
  ✓ 左侧列表点击 → 相机平滑飞行到该节点
  ✓ 搜索框输入 → 高亮匹配节点

性能
  ✓ 普通开发机 60fps
  ✓ 切换 한자어 层无卡顿
  ✓ 无控制台报错

启动
  ✓ pnpm dev 一键启动
  ✓ 无 TypeScript 报错
```

---

## 十一、版本锁定

```json
{
  "react": "18.3.1",
  "three": "0.165.x",
  "@react-three/fiber": "8.x",
  "@react-three/drei": "9.x",
  "@react-three/postprocessing": "2.x",
  "tailwindcss": "3.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x",
  "python": "3.11+",
  "fastapi": "0.111.x",
  "anthropic": "0.28.x"
}
```

---

## 十二、文档索引

| 文档 | 路径 |
|------|------|
| 韩语版分析文档 | `specs/2026-05-30-korean-learning-app-analysis.md` |
| 韩语版开发计划 | `plans/2026-05-30-korean-learning-app-dev-plan.md` |
| 补充文档（版权/MVP/执行）| `specs/2026-05-30-learning-app-addendum.md` |
| **最终框架（本文档）** | `plans/2026-05-30-korean-cosmos-framework-final.md` |
