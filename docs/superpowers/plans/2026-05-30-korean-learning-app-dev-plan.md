# 韩语学习套件 开发计划文档

> 关联分析文档：`docs/superpowers/specs/2026-05-30-korean-learning-app-analysis.md`
> 日期：2026-05-30
> 技术栈：Three.js + React Three Fiber（3D 星系）+ 2D 学习工作台

---

## 一、技术栈决策（最终选型）

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户端（双平台）                           │
│  浏览器（Web SaaS）          Tauri 桌面 App（Win/Mac）       │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────────────────────────┐
│                  前端（共用代码库）                            │
│  Vite + React 18 + TypeScript                                │
│  ├── 3D 星系：Three.js + React Three Fiber                   │
│  ├── 3D 布局：d3-force-3d（离线预计算 x/y/z）               │
│  ├── 图谱数据：graphology                                    │
│  ├── 后期处理：@react-three/postprocessing（Bloom/DOF）      │
│  ├── UI 组件：Shadcn/ui + Tailwind CSS                       │
│  ├── 状态管理：Zustand                                        │
│  ├── 数据请求：TanStack Query                                │
│  ├── PDF 渲染：react-pdf (pdf.js)                            │
│  └── 动画：Framer Motion                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────▼──────────────────────────────────────────┐
│                  后端                                         │
│  FastAPI (Python 3.11+)                                      │
│  ├── 韩语 NLP：konlpy (Okt/Mecab) + korean_romanizer        │
│  ├── 汉字词分析：hanja 库                                    │
│  ├── PDF 处理：PyMuPDF + PaddleOCR                          │
│  ├── AI 集成：anthropic SDK (Claude API)                     │
│  ├── TTS：edge-tts (Microsoft Edge TTS，免费)                │
│  ├── 向量计算：sentence-transformers + UMAP + HDBSCAN        │
│  └── 任务队列：Celery + Redis（批量生成用）                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  数据层                                       │
│  SQLite（MVP/桌面端）→ PostgreSQL + pgvector（SaaS版）        │
│  Redis（缓存 + 任务队列）                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.0 核心工程原则（必须贯穿全程）

> "真实 3D 星系做核心体验，但所有大规模数据、布局、标签、命中检测都必须工程化约束，不能靠 Three.js 直接硬画。"

| 原则 | 规则 |
|------|------|
| **React 管结构，Three 管对象** | React 控制场景层级和状态切换；几千个节点绝不写成 `nodes.map(n => <WordNode/>)`，用 InstancedMesh 批量处理 |
| **分层渲染，各司其职** | 节点球体→InstancedMesh；星云粒子→Points/shader；连线→LineSegments；标签→CSS2DRenderer；选中高亮→单独 mesh；汉字轨道线→独立 layer |
| **坐标离线预计算** | UMAP 3D 是坐标的主要来源（语义相近则空间相近）；d3-force-3d 仅做离线视觉微调（节点间距/边排列），启动时直接读库，绝不实时跑布局 |
| **标签极度克制** | 远景：只显示星座/分类名；中景：高频词+当前簇核心词；近景：选中节点+直接邻居；搜索后：只高亮搜索路径。绝不给每个节点都挂韩文标签 |
| **节点数量分阶段** | Phase 0→1000-2000；Phase 1→5000；Phase 2→10000+分簇加载。不要第一版就按万级实现 |
| **Zustand 管交互状态** | selectedWord / hoveredWord / searchResult / showHanjaLayer 全部放 Zustand，不放 React state |

---

### 1.2 选型理由（关键修正点）

| 技术 | 选择 | 理由 |
|------|------|------|
| **3D 渲染** | **Three.js + React Three Fiber** | 目标是真实 3D 星系（景深/轨道/粒子），必须用 Three.js；PixiJS 只能做 2.5D |
| **3D 坐标主源** | **UMAP n_components=3** | 语义嵌入→UMAP→x/y/z，语义相近的词在空间上真正相近，是星图的语义基础 |
| **3D 视觉微调** | **d3-force-3d**（仅离线）| 在 UMAP 坐标基础上做轻微力导向，改善节点间距和边排列。绝不在运行时使用 |
| **节点性能** | **InstancedMesh** | 万级节点单次 draw call，GPU 并行渲染，3D 中性能关键 |
| **文字标签** | **CSS2DRenderer / troika-three-text** | CSS2DRenderer：DOM 跟随 3D 坐标，清晰无锯齿；troika-three-text：WebGL SDF 字体，可随相机缩放。按距离 LOD 控制显示层级 |
| **相机控制** | **CameraControls** | 点击节点平滑飞行，避免用户在 3D 中迷失 |
| **图谱数据** | **graphology** | 专业图数据结构库，管理节点/边增删查 |
| **前端框架** | **Vite + React** | 桌面端（Tauri）不需要 SSR，Vite 比 Next.js 更轻，构建更快 |
| **数据库** | **SQLite → PostgreSQL** | MVP/桌面端用 SQLite 零运维；SaaS 版迁移 PostgreSQL + pgvector |
| **韩语 NLP** | **KoNLPy (Okt/Mecab)** | Python 最成熟的韩语 NLP 框架，替代日语版的 fugashi |
| **TTS** | **Edge TTS** | Microsoft 免费，韩语音质极好（SunHiNeural/InJoonNeural）|
| **OCR** | **PaddleOCR** | 韩语识别率高于 EasyOCR，且韩语 PDF 大多无需 OCR |
| **AI** | **Claude API** | 中文 Mnemonic 生成最强，한자어 汉字连接解释效果好 |
| **桌面端** | **Tauri 2.0** | 比 Electron 轻 10 倍，复用 Web 代码，Rust 系统层处理文件 |

---

## 二、数据库设计（韩语版）

### 2.1 核心表结构（SQLite 兼容语法）

```sql
-- 单词表
CREATE TABLE words (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    hangul          TEXT NOT NULL,          -- 한글 표기 (e.g. 경제)
    romanization    TEXT,                   -- 로마자 표기 (e.g. gyeongje)
    pronunciation   TEXT,                   -- 발음 기호 (e.g. [경제])
    word_type       TEXT NOT NULL,          -- noun/verb/adjective/adverb/particle/expression
    word_origin     TEXT NOT NULL,          -- 고유어/한자어/외래어/혼종어
    hanja           TEXT,                   -- 漢字 (한자어만) e.g. "經濟"
    hanja_reading   TEXT,                   -- 한자 독음 e.g. "경제"
    hanja_root_1    TEXT,                   -- 첫째 한자 e.g. "경(經)"
    hanja_root_2    TEXT,                   -- 둘째 한자 e.g. "제(濟)"
    topik_level     SMALLINT,              -- 1-6 (1-2: TOPIK I, 3-6: TOPIK II)
    frequency_rank  INTEGER,               -- 사용 빈도 순위

    -- 词卡内容（AI 生成）
    meaning_zh      TEXT,                  -- 中文释义
    meaning_en      TEXT,                  -- English meaning
    scenario_json   TEXT,                  -- JSON: [{description, examples:[]}]
    etymology_json  TEXT,                  -- JSON: {type, breakdown, hanja_connection, chinese_link}
    mnemonic_text   TEXT,                  -- 记忆故事（中文，对한자어 突出汉字联系）
    examples_json   TEXT,                  -- JSON: [{ko, romanized, zh, topik_level}]
    relations_json  TEXT,                  -- JSON: {synonyms, antonyms, superord, subord, confused, particles:[]}
    conjugations_json TEXT,               -- JSON: (动词/形容词) 所有变形形式

    -- 星图定位
    map_x           REAL,                  -- 3D 星图坐标（离线预计算）
    map_y           REAL,
    map_z           REAL,                  -- 3D 专有 Z 轴坐标
    cluster_id      INTEGER,
    cluster_name    TEXT,                  -- 감정/사회/자연/일상/학문/한자어군...
    hanja_group     TEXT,                  -- 同汉字词根分组 e.g. "경(經)"

    created_at      TEXT DEFAULT (datetime('now')),
    card_generated  INTEGER DEFAULT 0      -- SQLite 用 0/1 代替 BOOLEAN
);

-- 语法点表
CREATE TABLE grammar_points (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern         TEXT NOT NULL,         -- e.g. "-면", "-아서", "-고 있다"
    name_zh         TEXT,                  -- 中文名称 e.g. "条件形"
    name_en         TEXT,                  -- Conditional
    category        TEXT,                  -- CONDITION/CAUSE/CONJUNCTION/TENSE/ASPECT/SPEECH_LEVEL
    topik_level     SMALLINT,
    explanation_zh  TEXT,
    examples_json   TEXT,
    map_x           REAL,
    map_y           REAL,
    map_z           REAL                   -- 3D Z 轴坐标
);

-- 语法关系表
CREATE TABLE grammar_relations (
    from_id         INTEGER REFERENCES grammar_points(id),
    to_id           INTEGER REFERENCES grammar_points(id),
    relation_type   TEXT,                  -- PREREQUISITE/SIMILAR/OPPOSITE/EXTENDS
    strength        REAL DEFAULT 1.0,
    PRIMARY KEY (from_id, to_id)
);

-- 词语关系表
CREATE TABLE word_relations (
    from_id         INTEGER REFERENCES words(id),
    to_id           INTEGER REFERENCES words(id),
    relation_type   TEXT,                  -- SYNONYM/ANTONYM/SUPERORD/SUBORD/CONFUSED/HANJA_ROOT
    strength        REAL DEFAULT 1.0,
    PRIMARY KEY (from_id, to_id)
);

-- TOPIK 考题表
CREATE TABLE topik_questions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file     TEXT,
    exam_session    TEXT,                  -- e.g. "제87회"
    level           TEXT,                  -- "TOPIK I" / "TOPIK II"
    grade           TEXT,                  -- "1급"-"6급"
    year            INTEGER,
    section         TEXT,                  -- 읽기/듣기/쓰기
    question_num    INTEGER,
    question_json   TEXT,                  -- 完整题目 JSON
    analysis_json   TEXT,                  -- AI 解析结果
    audio_offset_ms INTEGER,
    created_at      TEXT DEFAULT (datetime('now'))
);

-- 用户学习记录
CREATE TABLE user_word_progress (
    user_id         TEXT,
    word_id         INTEGER REFERENCES words(id),
    status          TEXT DEFAULT 'new',   -- new/learning/known/mastered
    review_count    INTEGER DEFAULT 0,
    stability       REAL,                  -- FSRS 参数
    difficulty      REAL,                  -- FSRS 参数
    due_at          TEXT,                  -- 下次复习时间
    last_reviewed   TEXT,
    PRIMARY KEY (user_id, word_id)
);
```

### 2.2 SQLite → PostgreSQL 迁移说明

MVP 阶段全用 SQLite，SaaS 上线时：
- `TEXT` 类型的 JSON 字段 → `JSONB`
- `INTEGER DEFAULT 0` → `BOOLEAN DEFAULT FALSE`
- `AUTOINCREMENT` → `SERIAL`
- 新增 `vector(768)` 列存词向量（需 pgvector 扩展）
- 新增空间索引 `(map_x, map_y)`

---

## 三、后端 API 设计（韩语版）

### 3.1 端点列表

```
词汇 API
GET  /api/words                           # 词表（topik_level/cluster/origin/search 过滤）
GET  /api/words/{id}                      # 单词详情
GET  /api/words/{id}/conjugations         # 变形表（动词/形容词）
GET  /api/words/{id}/hanja-family         # 同汉字词根词汇
GET  /api/words/search?q=                 # 搜索（支持 한글/中文/英文/로마자）
GET  /api/words/similar?word_id=&n=10     # 语义相似词

星图 API
GET  /api/map/nodes                       # 所有节点坐标（分页）
GET  /api/map/nodes?bbox=x1,y1,x2,y2    # 视口内节点
GET  /api/map/edges                       # 所有连线
GET  /api/map/clusters                    # 集群列表
GET  /api/map/hanja-edges                 # 汉字词根连线（独立层）

语法 API
GET  /api/grammar                         # 语法点列表
GET  /api/grammar/{id}                    # 语法点详情
GET  /api/grammar/{id}/related            # 相关语法点

TOPIK API
POST /api/topik/upload                    # 上传 PDF
GET  /api/topik/questions/{session_id}    # 获取解析题目
POST /api/topik/answer                    # 提交答案获取解析
GET  /api/topik/sessions                  # 历史记录

PDF 阅读 API
POST /api/pdf/upload                      # 上传 PDF
POST /api/pdf/analyze-word               # 点击生词获取词义
POST /api/pdf/scan-paragraph             # 全段扫描

TTS API
GET  /api/tts/{word_id}                   # 获取单词发音（mp3 缓存）
POST /api/tts/sentence                    # 句子 TTS

AI 管理 API
POST /api/admin/generate-card/{word_id}  # 生成单个词卡
POST /api/admin/generate-batch           # 批量生成
POST /api/admin/recompute-embeddings     # 重算向量
POST /api/admin/recluster                # 重新聚类
POST /api/admin/build-hanja-edges        # 重建汉字词根连线
```

### 3.2 核心业务逻辑

**韩语变形规则引擎**：

```python
from enum import Enum

class VerbType(Enum):
    REGULAR = "규칙"
    IRREG_B = "ㅂ불규칙"   # 덥다→더워요
    IRREG_D = "ㄷ불규칙"   # 듣다→들어요
    IRREG_S = "ㅅ불규칙"   # 낫다→나아요
    IRREG_H = "ㅎ불규칙"   # 파랗다→파래요
    IRREG_L = "ㄹ불규칙"   # 살다→사세요
    IRREG_REU = "르불규칙" # 모르다→몰라요
    IRREG_U = "우불규칙"   # 푸다→퍼요

def conjugate_korean(stem: str, verb_type: VerbType, pos: str) -> dict:
    """
    stem: 동사/형용사 어간 (e.g. "먹", "가", "덥")
    verb_type: 불규칙 유형
    pos: "verb" / "adjective"
    """
    forms = {}

    # 해요체 (polite informal)
    forms["해요체_현재"] = apply_rule(stem, verb_type, "아/어요")
    forms["해요체_과거"] = apply_rule(stem, verb_type, "았/었어요")
    forms["해요체_미래"] = stem + "을 거예요"

    # 반말 (informal)
    forms["반말_현재"] = apply_rule(stem, verb_type, "아/어")
    forms["반말_과거"] = apply_rule(stem, verb_type, "았/었어")

    # 연결형 (connective)
    forms["연결_고"] = stem + "고"           # and
    forms["연결_지만"] = stem + "지만"       # but
    forms["연결_서"] = apply_rule(stem, verb_type, "아/어서")   # so/because
    forms["연결_면"] = stem + "으면" if ends_with_consonant(stem) else stem + "면"
    forms["연결_도"] = apply_rule(stem, verb_type, "아/어도")   # even if

    # 보조 동사 (auxiliary)
    forms["보조_고싶다"] = stem + "고 싶다"
    forms["보조_수있다"] = stem + ("을 수 있다" if ends_with_consonant(stem) else "ㄹ 수 있다")
    forms["보조_아야하다"] = apply_rule(stem, verb_type, "아/어야 해")

    # 관형사형 (adnominal)
    forms["관형_현재"] = stem + "는"
    forms["관형_과거"] = apply_rule(stem, verb_type, "은/ㄴ")
    forms["관형_미래"] = stem + "을" if ends_with_consonant(stem) else stem + "ㄹ"

    if pos == "verb":
        forms["피동"] = make_passive(stem, verb_type)
        forms["사동"] = make_causative(stem, verb_type)

    return forms
```

**한자어 分析服务**：

```python
import hanja

def analyze_hanja_word(hangul: str, hanja_str: str) -> dict:
    """
    分析汉字词的汉字构成及与中文的关联
    e.g. 경제(經濟) → 경(經)=경/통 + 제(濟)=제/구제
    """
    result = {
        "hanja": hanja_str,
        "breakdown": [],
        "chinese_simplified": convert_to_simplified(hanja_str),
        "chinese_pronunciation": get_mandarin_reading(hanja_str),
        "semantic_match_pct": calculate_semantic_match(hangul, hanja_str),
    }

    for i, (ko_char, hanja_char) in enumerate(zip(hangul, hanja_str)):
        result["breakdown"].append({
            "korean": ko_char,
            "hanja": hanja_char,
            "hanja_meaning": get_hanja_meaning(hanja_char),
            "chinese_char": hanja_char,  # 汉字直接对应
        })

    return result
```

**TOPIK PDF 解析 Pipeline**：

```python
async def parse_topik_pdf(file_bytes: bytes) -> dict:
    # 1. PyMuPDF 提取文字（TOPIK PDF 均为数字版，无需 OCR）
    doc = fitz.open(stream=file_bytes)
    full_text = ""
    for page in doc:
        full_text += page.get_text()

    # 2. 判断是否需要 OCR（仅旧版扫描题）
    if len(full_text.strip()) < 100:
        full_text = await ocr_with_paddleocr(doc)

    # 3. Claude 解析题目结构
    response = await claude.messages.create(
        model="claude-sonnet-4-6",
        system="你是 TOPIK 考试专家，负责解析考题结构。",
        messages=[{
            "role": "user",
            "content": TOPIK_PARSE_PROMPT.format(text=full_text[:15000])
        }]
    )
    return parse_structured_output(response)
```

**Edge TTS 服务**：

```python
import edge_tts
import asyncio

async def generate_tts(text: str, voice: str = "ko-KR-SunHiNeural") -> bytes:
    """
    voice options:
      ko-KR-SunHiNeural  (여성 표준어)
      ko-KR-InJoonNeural (남성 표준어)
    """
    communicate = edge_tts.Communicate(text, voice)
    audio_bytes = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_bytes += chunk["data"]
    return audio_bytes

# 缓存策略：词语 TTS 生成后存为 mp3 文件，下次直接返回文件
```

---

## 四、前端核心模块（韩语版）

### 4.1 星图渲染（Three.js + React Three Fiber 方案）

```typescript
// 技术方案：Three.js + React Three Fiber + d3-force-3d（离线预计算）+ CSS2DRenderer

// --- 图谱数据管理（graphology 仍然负责数据结构）---
import Graph from 'graphology';

const graph = new Graph({ multi: false, type: 'undirected' });
words.forEach(word => {
  graph.addNode(word.id, {
    x: word.map_x, y: word.map_y, z: word.map_z,  // 已预计算的 3D 坐标
    label: word.hangul,
    color: getNodeColor(word.word_origin),
    size: getNodeSize(word.topik_level),
    word_origin: word.word_origin,
    hanja_group: word.hanja_group,
  });
});
```

```tsx
// --- 核心 3D 场景 StarMap.tsx ---
import { Canvas } from '@react-three/fiber';
import { CameraControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';

export function StarMap() {
  return (
    <Canvas camera={{ position: [0, 0, 200], fov: 60 }}>
      {/* 星云粒子背景 */}
      <Stars radius={500} depth={100} count={8000} factor={4} />

      {/* 节点层：InstancedMesh 渲染万级节点 */}
      <WordNodes words={words} onSelect={handleSelect} />

      {/* 连线层：普通语义关联 */}
      <SemanticEdges edges={semanticEdges} />

      {/* 汉字词根金色轨道线（独立层，可切换） */}
      {showHanjaLayer && <HanjaEdges edges={hanjaEdges} />}

      {/* CSS2DRenderer 文字标签（DOM 渲染，始终清晰） */}
      <WordLabels words={visibleWords} camera={camera} />

      {/* 相机控制：旋转/缩放 + 点击节点平滑飞行 */}
      <CameraControls ref={cameraRef} />

      {/* 后期处理 */}
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.3} />
        <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} />
      </EffectComposer>
    </Canvas>
  );
}
```

```tsx
// --- InstancedMesh 节点渲染（性能核心）---
function WordNodes({ words, onSelect }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    words.forEach((word, i) => {
      dummy.position.set(word.map_x, word.map_y, word.map_z);
      dummy.scale.setScalar(getNodeSize(word.topik_level));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, new THREE.Color(getNodeColor(word.word_origin)));
    });
    meshRef.current!.instanceMatrix.needsUpdate = true;
    meshRef.current!.instanceColor!.needsUpdate = true;
  }, [words]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, words.length]}
      onClick={handleRaycast}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial emissiveIntensity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}
```

```tsx
// --- 点击节点：相机平滑飞行过去 ---
function handleNodeClick(word: Word, cameraControls: CameraControls) {
  cameraControls.fitToBox(
    new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(word.map_x, word.map_y, word.map_z),
      new THREE.Vector3(20, 20, 20)
    ),
    true  // enableTransition = true → 平滑动画
  );
  setSelectedWord(word);
}
```

```typescript
// --- 节点颜色按词汇来源区分（韩语版）---
function getNodeColor(word_origin: string): string {
  const colors = {
    '고유어': '#4FC3F7',  // 蓝色（纯韩语词）
    '한자어': '#FFD700',  // 金色（汉字词——对中国用户最重要）
    '외래어': '#A5D6A7',  // 绿色（外来语）
    '혼종어': '#CE93D8',  // 紫色（混合词）
  };
  return colors[word_origin] ?? '#FFFFFF';
}
```

**LOD 策略（分层渲染，性能+可读性双保证）**：

| 距离 | 节点 | 标签显示 |
|------|------|---------|
| 远景（> 200）| 缩小至 0.3x | 只显示 cluster 名称（감정 / 사회...）|
| 中景（80-200）| 缩小至 0.6x | 显示当前 cluster 高频词（Top 10）|
| 近景（< 80）| 正常 1.0x | 显示选中节点 + 直接邻居标签 |
| 搜索后 | 目标节点高亮 | 只显示搜索结果路径上的词 |

```typescript
// 节点 LOD（InstancedMesh scale 控制）
useFrame(({ camera }) => {
  words.forEach((word, i) => {
    const dist = camera.position.distanceTo(
      new THREE.Vector3(word.map_x, word.map_y, word.map_z)
    );
    const lodScale = dist > 200 ? 0.3 : dist > 80 ? 0.6 : 1.0;
    dummy.scale.setScalar(lodScale * getNodeSize(word.topik_level));
    dummy.updateMatrix();
    meshRef.current!.setMatrixAt(i, dummy.matrix);
  });
  meshRef.current!.instanceMatrix.needsUpdate = true;
});

// 标签 LOD（Zustand 控制显示列表）
const { cameraDistance, selectedWord, searchResults } = useStarMapStore();
const visibleLabels = useMemo(() => {
  if (searchResults.length > 0) return searchResults;           // 搜索路径
  if (cameraDistance < 80) return selectedWord?.neighbors ?? []; // 近景邻居
  if (cameraDistance < 200) return clusterCoreWords;             // 中景核心词
  return [];                                                     // 远景不显标签
}, [cameraDistance, selectedWord, searchResults]);
```

**한자어模式切换**（韩语版独有）：
```tsx
// 显示/隐藏汉字词根金色轨道线
{showHanjaLayer && (
  <lineSegments>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[hanjaEdgePositions, 3]} />
    </bufferGeometry>
    <lineBasicMaterial color="#FFD700" transparent opacity={0.6} />
  </lineSegments>
)}
```

### 4.2 词卡详情面板（韩语版）

```typescript
interface KoreanWordCard {
  hangul: string;
  romanization: string;
  pronunciation: string;
  word_origin: '고유어' | '한자어' | '외래어' | '혼종어';
  hanja?: string;           // 한자어专有
  hanja_breakdown?: {       // 한자어专有
    korean: string;
    hanja: string;
    hanja_meaning: string;
    chinese_char: string;
  }[];
  chinese_connection?: string; // 中文汉字关联说明
  topik_level: number;
  meaning: { zh: string; en: string };
  scenario: ScenarioItem[];
  etymology: KoreanEtymology;
  mnemonic: string;
  examples: KoreanExample[];
  relations: KoreanRelations;
  conjugations?: ConjugationTable; // 动词/形容词专有
  particles?: ParticleUsage[];     // 韩语专有：助词搭配
}

// 词卡布局
function WordCardPanel({ word }: { word: KoreanWordCard }) {
  return (
    <div className="word-card">
      <header>
        <h1>{word.hangul}</h1>
        <span className="romanization">[{word.romanization}]</span>
        <Badge variant={word.word_origin}>{word.word_origin}</Badge>
        <TopikBadge level={word.topik_level} />
        <TTSButton wordId={word.id} />
      </header>

      {/* 한자어 专属区块 */}
      {word.hanja && (
        <HanjaSection
          hanja={word.hanja}
          breakdown={word.hanja_breakdown}
          chineseConnection={word.chinese_connection}
        />
      )}

      <MeaningSection zh={word.meaning.zh} en={word.meaning.en} />
      <ScenarioSection items={word.scenario} />
      <EtymologySection etymology={word.etymology} />
      <MnemonicSection text={word.mnemonic} />
      <ExamplesSection examples={word.examples} />

      {/* 韩语专有：助词搭配 */}
      <ParticleSection word={word.hangul} particles={word.particles} />

      {/* 动词/形容词变形轮 */}
      {word.conjugations && (
        <ConjugationWheel
          word={word.hangul}
          conjugations={word.conjugations}
        />
      )}

      <RelationsSection relations={word.relations} />
    </div>
  );
}
```

### 4.3 변형 Wheel（变形轮）

```typescript
// 韩语变形轮——比日语版更多形式
function ConjugationWheel({ word, conjugations }) {
  const FORM_GROUPS = [
    { label: '해요체', forms: ['해요체_현재', '해요체_과거', '해요체_미래'] },
    { label: '반말', forms: ['반말_현재', '반말_과거'] },
    { label: '연결형', forms: ['연결_고', '연결_지만', '연결_서', '연결_면', '연결_도'] },
    { label: '보조동사', forms: ['보조_고싶다', '보조_수있다', '보조_아야하다'] },
    { label: '관형사형', forms: ['관형_현재', '관형_과거', '관형_미래'] },
    { label: '피/사동', forms: ['피동', '사동'] },
  ];

  // 分组放射状布局（比日语版多一层）
  return (
    <svg viewBox="-300 -300 600 600">
      <circle cx={0} cy={0} r={45} className="center-node" />
      <text className="center-text">{word}</text>
      {FORM_GROUPS.map((group, gi) => (
        <g key={group.label} transform={`rotate(${(gi / FORM_GROUPS.length) * 360})`}>
          <GroupLabel label={group.label} radius={120} />
          {group.forms.map((form, fi) => {
            const angle = ((gi + fi * 0.15) / FORM_GROUPS.length) * 2 * Math.PI;
            const r = 200;
            return (
              <ConjugationNode
                key={form}
                text={conjugations[form]}
                x={Math.cos(angle) * r}
                y={Math.sin(angle) * r}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
```

---

## 五、AI Prompt 设计（韩语版）

### 5.1 词卡生成 Prompt

```python
KOREAN_WORD_CARD_PROMPT = """
你是韩语教学专家，面向中国韩语学习者，请为以下韩语单词生成完整学习词卡。

单词：{hangul}
发音：[{pronunciation}]
词性：{pos_ko}（{pos_zh}）
词汇类型：{word_origin}
TOPIK级别：{topik_level}级
{hanja_info}

请按以下 JSON 格式输出：

{{
  "meaning_zh": "中文释义（简洁，2-8字）",
  "meaning_en": "English meaning",
  "scenario": [
    {{
      "description": "使用场景（中文，1句话）",
      "examples": ["场景描述1", "场景描述2"]
    }}
  ],
  "etymology": {{
    "type": "고유어|한자어|외래어|혼종어",
    "breakdown": "词源分解（고유어：词根分析；한자어：汉字意义；외래어：来源语言+词）",
    "chinese_connection": "与中文的关联（仅한자어填写）：例如：경제(經濟)与中文'经济'完全相同，경(經)=经、제(濟)=济"
  }},
  "mnemonic": "记忆故事（中文，100-150字，对한자어 必须利用中文汉字做联想桥梁，对고유어 使用场景联想，最后一句高亮词的발음）",
  "examples": [
    {{
      "ko": "韩语例句",
      "romanized": "로마자 표기",
      "zh": "中文翻译",
      "topik_level": "1|2|3|4|5|6"
    }}
  ],
  "relations": {{
    "synonyms": ["동의어1", "동의어2"],
    "antonyms": ["반의어"],
    "superordinate": ["상위어"],
    "subordinate": ["하위어"],
    "confused_with": ["혼동어"],
    "common_particles": ["은/는", "이/가", "을/를"]
  }}
}}

重要规则：
- 如果是 한자어，etymology.chinese_connection 必须详细填写汉字联系
- mnemonic 对 한자어 必须利用中文汉字记忆（这是中国用户最强的记忆锚点）
- examples 至少3条，覆盖不同语境和敬语级别
- common_particles 列出该词最常用的助词搭配
"""
```

### 5.2 TOPIK 解析 Prompt

```python
TOPIK_PARSE_PROMPT = """
以下是从 TOPIK 试卷 PDF 提取的文字内容。请解析其完整结构。

---文字内容---
{text}
---结束---

输出 JSON 格式：
{{
  "exam_session": "第X回（例：제87회）",
  "level": "TOPIK I | TOPIK II",
  "sections": [
    {{
      "name": "읽기 | 듣기 | 쓰기",
      "has_audio": false,
      "questions": [
        {{
          "number": 题号,
          "question_text": "题目原文（韩语）",
          "question_zh": "中文翻译",
          "options": {{"1": "...", "2": "...", "3": "...", "4": "..."}},
          "correct_answer": "1|2|3|4",
          "explanation": {{
            "correct_reason": "为什么答案正确（中文）",
            "wrong_reasons": {{"1": "...", "2": "...", "3": "..."}},
            "grammar_point": "考察语法点（若有）",
            "key_vocabulary": [
              {{"hangul": "", "hanja": "", "meaning_zh": "", "topik_level": 1}}
            ]
          }}
        }}
      ]
    }}
  ]
}}
"""
```

### 5.3 한자어 批量预处理 Prompt

```python
HANJA_ANALYSIS_PROMPT = """
请分析以下韩语汉字词，提取汉字信息，面向中国用户学习。

韩语词：{hangul}
汉字：{hanja}

输出 JSON：
{{
  "hanja_breakdown": [
    {{
      "korean_syllable": "경",
      "hanja_char": "經",
      "simplified_chinese": "经",
      "hanja_core_meaning": "经过、经营、经线",
      "related_korean_words": ["경험(經驗)", "경쟁(競爭)", "경로(經路)"]
    }},
    {{
      "korean_syllable": "제",
      "hanja_char": "濟",
      "simplified_chinese": "济",
      "hanja_core_meaning": "救济、帮助、度过",
      "related_korean_words": ["구제(救濟)", "경제(經濟)"]
    }}
  ],
  "chinese_word": "经济",
  "semantic_similarity": "完全相同|近似|部分相同|不同",
  "memory_tip": "中文'经济'≈ 韩语 경제，发音和意义都非常接近，中国人天然易记"
}}
"""
```

---

## 六、语义聚类 Pipeline（韩语版）

```python
# cluster_korean_words.py

import numpy as np
from sentence_transformers import SentenceTransformer
import umap
import hdbscan
from anthropic import Anthropic
import sqlite3
import hanja

def build_hanja_edges(conn):
    """
    构建汉字词根连线（韩语版独有）
    将同词根的汉字词在图谱上连线
    """
    cursor = conn.cursor()
    words = cursor.execute(
        "SELECT id, hangul, hanja FROM words WHERE word_origin='한자어' AND hanja IS NOT NULL"
    ).fetchall()

    # 按第一个汉字分组
    hanja_groups = {}
    for word_id, hangul, hanja_str in words:
        if hanja_str:
            first_char = hanja_str[0]
            if first_char not in hanja_groups:
                hanja_groups[first_char] = []
            hanja_groups[first_char].append(word_id)

    # 同组内两两连线
    edges_inserted = 0
    for root, word_ids in hanja_groups.items():
        if len(word_ids) > 1:
            for i in range(len(word_ids)):
                for j in range(i+1, min(i+6, len(word_ids))):  # 最多连5个避免过密
                    try:
                        cursor.execute("""
                            INSERT OR IGNORE INTO word_relations
                            (from_id, to_id, relation_type, strength)
                            VALUES (?, ?, 'HANJA_ROOT', 0.8)
                        """, (word_ids[i], word_ids[j]))
                        edges_inserted += 1
                    except:
                        pass

    conn.commit()
    print(f"汉字词根连线：{edges_inserted} 条，覆盖 {len(hanja_groups)} 个词根")


def run_clustering_pipeline():
    conn = sqlite3.connect("korean_learning.db")

    # 1. 加载单词
    words = conn.execute(
        "SELECT id, hangul, meaning_zh, meaning_en, word_origin FROM words"
    ).fetchall()

    # 2. 生成嵌入（多语言模型，支持韩语）
    model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
    texts = [
        f"{w[1]} {w[2] or ''} {w[3] or ''}"
        for w in words
    ]
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)

    # 3. UMAP 降维 → 星图 3D 坐标（3D 星系模式必须有 z 轴）
    reducer = umap.UMAP(n_components=3, metric='cosine', n_neighbors=15, min_dist=0.1)
    coords_3d = reducer.fit_transform(embeddings)

    # 4. HDBSCAN 聚类
    clusterer = hdbscan.HDBSCAN(min_cluster_size=15, min_samples=5)
    cluster_ids = clusterer.fit_predict(embeddings)

    # 5. Claude 为集群命名（韩语语义类别）
    claude = Anthropic()
    cluster_names = {}
    for cid in set(cluster_ids):
        if cid == -1: continue
        sample = [words[i][1] for i, c in enumerate(cluster_ids) if c == cid][:20]
        resp = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            messages=[{
                "role": "user",
                "content": f"这些韩语词汇属于同一语义类别：{', '.join(sample)}\n"
                           f"请用2-3个英文词命名该类别（例：EMOTION / SOCIETY / NATURE / DAILY_LIFE / ACADEMIC）："
            }]
        )
        cluster_names[cid] = resp.content[0].text.strip()

    # 6. 写回数据库（含 3D 坐标 x/y/z）
    for i, word in enumerate(words):
        conn.execute("""
            UPDATE words SET
                map_x = ?, map_y = ?, map_z = ?,
                cluster_id = ?, cluster_name = ?
            WHERE id = ?
        """, (float(coords_3d[i][0]), float(coords_3d[i][1]), float(coords_3d[i][2]),
              int(cluster_ids[i]), cluster_names.get(cluster_ids[i], 'OTHER'),
              word[0]))

    conn.commit()
    print(f"聚类完成：{len(cluster_names)} 个集群")

    # 7. 构建汉字词根连线（韩语版专有步骤）
    build_hanja_edges(conn)
    conn.close()
```

---

## 七、数据准备 Pipeline

### 7.1 数据来源与优先级

```
Step 1: 导入 TOPIK 官方词表（结构化数据，基础）
  → topik.go.kr 或 GitHub TOPIK 词表项目
  → 约 7000-10000 词，已按等级分类

Step 2: 补充词典数据（读音、词性、汉字）
  → 국립국어원 표준국어대사전 API（免费，需申请 key）
  → 补全 romanization / hanja / pos

Step 3: 识别汉字词
  → hanja Python 库自动标注 word_origin
  → 提取 hanja 字段

Step 4: 批量生成词卡（Claude Haiku）
  → 7000词 × ~$0.001 ≈ $7 全量生成
  → 先跑 TOPIK I (2000词) 验证质量

Step 5: 生成嵌入 + 聚类 + 汉字连线
  → run cluster_korean_words.py

Step 6: 批量预生成 TTS（可选，Edge TTS 免费）
  → 7000词 × 1-2秒音频 ≈ 存储约 200MB
```

### 7.2 导入脚本示意

```python
# import_topik_words.py

import sqlite3
import requests
from hanja import translate

def import_topik_wordlist(csv_path: str, db_path: str):
    conn = sqlite3.connect(db_path)

    with open(csv_path, 'r', encoding='utf-8') as f:
        for line in f:
            hangul, topik_level, pos = line.strip().split(',')

            # 识别词汇类型
            hanja_str = translate(hangul, 'substitution')
            word_origin = detect_origin(hangul, hanja_str)

            conn.execute("""
                INSERT OR IGNORE INTO words
                (hangul, word_origin, hanja, topik_level, word_type)
                VALUES (?, ?, ?, ?, ?)
            """, (hangul, word_origin, hanja_str if word_origin == '한자어' else None,
                  int(topik_level), pos))

    conn.commit()
    print(f"导入完成")
```

---

## 八、开发阶段划分（韩语版）

### Phase 0：3D 星系视觉原型（1-2 周，最优先）

> 先用 mock 数据验证 3D 视觉效果，确认星系体验达标后再接真实数据。

- [ ] Vite + React + TypeScript 项目初始化
- [ ] Three.js + React Three Fiber 基础场景
- [ ] 1000-2000 个 mock 单词节点（随机 x/y/z 坐标，随机颜色分组，不追求更多）
- [ ] `InstancedMesh` 渲染节点 + 发光效果（Bloom）
- [ ] `Stars`（@react-three/drei）粒子背景
- [ ] `CameraControls`：旋转/缩放 + 点击节点平滑飞行
- [ ] `CSS2DRenderer` 文字标签（相机近处才显示）
- [ ] mock 语义连线 + mock 汉字金色轨道线
- [ ] Depth of Field 景深效果
- [ ] 右侧 mock 词卡详情面板弹出
- [ ] 深色星系 / 浅色 2D 泡泡模式切换

**验收标准**：1000-2000 mock 节点稳定 60fps，点击节点相机平滑飞过去，标签 LOD 正确分层，视觉效果达到"宇宙感"。Phase 0 不考虑真实数据，只验证技术可行性。

---

### Phase 1：数据基础（2-3 周）

- [ ] 搭建 SQLite 数据库（参考本文 Schema，含 map_z 字段）
- [ ] 导入 TOPIK 词表（先 TOPIK I 约 2000词，验证完再扩展）
- [ ] 调用 국립국어원 API 补全读音/词性/汉字
- [ ] 用 hanja 库标注 word_origin + 提取 hanja 字段
- [ ] 运行词卡批量生成 Pipeline（Claude Haiku）
- [ ] 运行语义聚类（UMAP `n_components=3`，输出 x/y/z）
- [ ] 汉字词根连线生成
- [ ] 搭建 FastAPI 基础结构，实现 `/api/map/nodes`（含 map_z）

**验收标准**：API 返回带 3D 坐标的 2000 个词节点，汉字词金色连线数据正确

---

### Phase 2：接入真实词库（2-3 周）

- [ ] 将 Phase 0 mock 数据替换为 SQLite 真实词库
- [ ] graphology 从 API 加载真实节点（含 3D 坐标）
- [ ] 集群颜色 / 大小按真实 cluster_id 渲染
- [ ] 真实语义连线 + 汉자어 金色轨道线数据接入
- [ ] 左侧词表侧边栏（含搜索 + 来源筛选 + TOPIK级别筛选）
- [ ] 한자어 模式切换按钮（显示/隐藏金色轨道线层）
- [ ] 集群 Bubble（2D 模式下的透明大圆圈 + 类别标签）
- [ ] 性能优化：LOD 距离调优，确保 7000 词 60fps

**验收标准**：5000 节点稳定 60fps（7000 词分批加载），汉字词金色连线正确显示，标签 LOD 分层清晰，搜索可定位节点并平滑飞行过去

---

### Phase 3：词卡 + 变形轮（2 周）

- [ ] 词卡详情面板（全字段展示）
- [ ] 한자어 专属区块（汉字分解 + 中文联系）
- [ ] Edge TTS 播放按钮（단어 발음）
- [ ] 助词搭配展示（particles）
- [ ] 韩语变形规则引擎（Python）
- [ ] 变形轮 SVG 组件（多层分组放射状）
- [ ] 语法关系图（复用 Three.js 场景，独立相机视角）

**验收标准**：点击任意词卡显示完整信息，동사 변형轮正确展开所有形式

---

### Phase 4：TOPIK 真题系统（2-3 周）

- [ ] PDF 上传 + PyMuPDF 文字提取
- [ ] Claude API TOPIK 结构解析
- [ ] Quiz Mode（做题 + 답안 해설）
- [ ] Study Mode（학습 + 어휘 목록）
- [ ] Scan Mode（AI 全卷分析）
- [ ] 음성 파일 播放器（듣기 部分）
- [ ] 做题历史记录 + 错题本

**验收标准**：上传 TOPIK II 4급 PDF，Quiz Mode 完整答题并查看解析

---

### Phase 5：PDF 阅读器（2 周）

- [ ] PDF 渲染（react-pdf）
- [ ] 点击生词 → KoNLPy 分词 → 词库查询
- [ ] 连线 + 右侧分析面板
- [ ] Quick Scan 段落分析

**验收标准**：导入韩语小说 PDF，点击생词显示词义和汉字信息

---

### Phase 6：桌面端 + 打磨（2 周）

- [ ] Tauri 2.0 项目配置
- [ ] 本地文件访问（直接打开本地 PDF）
- [ ] 离线词库缓存（核心词库内嵌 SQLite）
- [ ] Windows .exe + Mac .dmg 打包
- [ ] 自动更新（Tauri updater）

---

## 九、项目目录结构

```
korean-cosmos/
├── frontend/                    # Vite + React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── StarMap/
│   │   │   │   ├── StarMap.tsx           # Three.js Canvas + 场景根
│   │   │   │   ├── WordNodes.tsx         # InstancedMesh 节点渲染
│   │   │   │   ├── SemanticEdges.tsx     # 语义连线 LineSegments
│   │   │   │   ├── HanjaEdges.tsx        # 汉字词根金色轨道线
│   │   │   │   ├── WordLabels.tsx        # CSS2DRenderer 文字标签
│   │   │   │   ├── GraphManager.ts       # graphology 图数据管理
│   │   │   │   └── cameraUtils.ts        # CameraControls 飞行工具
│   │   │   ├── WordCard/
│   │   │   │   ├── WordCard.tsx
│   │   │   │   ├── HanjaSection.tsx     # 한자어 专属
│   │   │   │   ├── ConjugationWheel.tsx
│   │   │   │   └── ParticleSection.tsx  # 助词搭配
│   │   │   ├── Grammar/
│   │   │   │   └── GrammarMap.tsx
│   │   │   └── TOPIK/
│   │   │       ├── QuizMode.tsx
│   │   │       ├── StudyMode.tsx
│   │   │       └── ScanMode.tsx
│   │   ├── stores/
│   │   │   ├── mapStore.ts      # 星图状态（选中节点/缩放/模式）
│   │   │   └── wordStore.ts     # 词库状态
│   │   └── lib/
│   │       ├── api.ts
│   │       └── korean-utils.ts  # 韩语工具函数
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── words.py
│   │   │   ├── grammar.py
│   │   │   ├── topik.py
│   │   │   ├── pdf.py
│   │   │   └── tts.py
│   │   ├── services/
│   │   │   ├── nlp.py           # KoNLPy 분석
│   │   │   ├── conjugation.py   # 한국어 변형 엔진
│   │   │   ├── hanja_service.py # 한자어 분석
│   │   │   ├── pdf_parser.py    # PyMuPDF + PaddleOCR
│   │   │   ├── tts_service.py   # Edge TTS
│   │   │   └── claude_service.py
│   │   └── db/
│   │       └── database.py      # SQLite 连接 + 查询
│   ├── scripts/
│   │   ├── import_topik_words.py  # 导入词表
│   │   ├── fetch_dict_api.py      # 국립국어원 API
│   │   ├── generate_cards.py      # 批量生成词卡
│   │   └── cluster_words.py       # 聚类 + 汉字连线
│   └── requirements.txt
│
├── desktop/                     # Tauri 桌面端
│   ├── src-tauri/
│   │   ├── src/main.rs
│   │   └── tauri.conf.json
│   └── package.json
│
├── data/
│   ├── topik_wordlist.csv       # TOPIK 分级词表
│   └── korean_learning.db       # SQLite 数据库
│
└── docker-compose.yml           # Redis（任务队列）
```

---

## 十、关键依赖清单

### Python (requirements.txt)

```
fastapi==0.111.0
uvicorn==0.30.0
anthropic==0.28.0
pymupdf==1.24.0
paddleocr==2.7.0
konlpy==0.6.0
korean-romanizer==0.3.0
hanja==0.13.3
jamo==0.4.1
edge-tts==6.1.9
sentence-transformers==3.0.0
umap-learn==0.5.6
hdbscan==0.8.38
scikit-learn==1.5.0
numpy==1.26.4
aiofiles==23.2.1
celery==5.4.0
redis==5.0.6
requests==2.31.0
```

### JavaScript (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "three": "^0.165.0",
    "@react-three/fiber": "^8.16.0",
    "@react-three/drei": "^9.105.0",
    "@react-three/postprocessing": "^2.16.0",
    "postprocessing": "^6.36.0",
    "three-mesh-bvh": "^0.7.4",
    "troika-three-text": "^0.49.0",
    "d3-force-3d": "^3.0.5",
    "graphology": "^0.25.4",
    "graphology-types": "^0.24.7",
    "react-pdf": "^9.1.0",
    "framer-motion": "^11.2.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.40.0",
    "shadcn-ui": "latest",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.390.0"
  },
  "devDependencies": {
    "vite": "^5.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vitest": "^1.6.0"
  }
}
```

---

## 十一、成本估算

| 项目 | 一次性成本 | 月运营成本（SaaS） |
|------|-----------|------------------|
| 词卡批量生成（7000词 × Haiku） | ~$7 | 无 |
| 聚类计算（本地 CPU/GPU） | 免费 | 无 |
| 국립국어원 API | 免费（申请 key） | 免费 |
| Edge TTS 音频生成（7000词） | 免费 | 无 |
| SQLite 数据库（桌面端） | 免费 | 无 |
| TOPIK 解析（Claude Sonnet，按需）| - | ~$5-20/月 |
| **合计启动成本** | **<$15** | 服务器为主 |

---

## 十二、下一步行动

1. **申请 국립국어원 표준국어대사전 API key**（免费，约1-2天审批）
2. **下载 TOPIK 历年真题 PDF**（topik.go.kr，全部免费）
3. **找到 TOPIK 分级词表**（GitHub 上有多个版本，选其中一个）
4. 执行 `Phase 1：数据基础`，先跑通 TOPIK I（2000词）完整 Pipeline
5. 用 N2 级词汇验证：한자어 连线效果 + 词卡 mnemonic 质量
