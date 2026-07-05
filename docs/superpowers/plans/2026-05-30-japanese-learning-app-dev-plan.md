# 日语学习套件 开发计划文档

> 关联分析文档：`docs/superpowers/specs/2026-05-30-japanese-learning-app-analysis.md`
> 日期：2026-05-30

---

## 一、技术栈决策

### 1.1 推荐架构（最终选型）

```
┌─────────────────────────────────────────────────────────────┐
│                    用户端（双平台）                           │
│  浏览器（Web SaaS）      Tauri 桌面 App（Win/Mac）           │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────────────────────────┐
│                  前端（共用代码库）                            │
│  Next.js 14 + TypeScript + App Router                        │
│  ├── 星图渲染：React Three Fiber + D3-force                  │
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
│  ├── 日语 NLP：fugashi + unidic-lite + jamdict              │
│  ├── PDF 处理：PyMuPDF + EasyOCR                            │
│  ├── AI 集成：anthropic SDK（Claude API）                    │
│  ├── 向量计算：sentence-transformers + UMAP + HDBSCAN        │
│  └── 任务队列：Celery + Redis（批量生成用）                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  数据层                                       │
│  PostgreSQL 15 + pgvector 扩展                               │
│  Redis（缓存 + 任务队列）                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 选型理由

| 技术 | 选择 | 理由 |
|------|------|------|
| 前端框架 | Next.js 14 | App Router，支持 SSR/SSG，工作区已用 |
| 3D 渲染 | React Three Fiber | Three.js React 封装，WebGL 性能，星图必需 |
| 力导向布局 | D3-force | 业界标准，在 Web Worker 运行不阻塞 UI |
| 后端语言 | Python | 日语 NLP 生态最完整（MeCab/fugashi/sudachi） |
| API 框架 | FastAPI | 异步，自动文档，工作区已用 |
| 数据库 | PostgreSQL + pgvector | 支持向量相似度查询，词向量存储 |
| 桌面端 | Tauri | 比 Electron 轻 10 倍，复用 Web 代码，Rust 系统层 |
| AI | Claude API | 中文 Mnemonic 生成质量最高，支持中日混合 |
| OCR | EasyOCR | 已在本机安装，支持日语 |

---

## 二、数据库设计

### 2.1 核心表结构

```sql
-- 单词表
CREATE TABLE words (
    id              SERIAL PRIMARY KEY,
    kanji           TEXT NOT NULL,          -- 漢字表記
    kana            TEXT NOT NULL,          -- ひらがな読み
    romaji          TEXT,                   -- Romaji
    word_type       TEXT,                   -- noun/verb_u/verb_ru/i_adj/na_adj/adverb/particle
    jlpt_level      SMALLINT,              -- 5=N5, 4=N4, ... 1=N1
    frequency_rank  INTEGER,               -- 使用频率排名
    
    -- 词卡内容（AI 生成）
    meaning_zh      TEXT,
    meaning_en      TEXT,
    scenario_json   JSONB,                 -- [{text, examples:[]}]
    etymology_json  JSONB,                 -- {type, breakdown, ancient_meaning}
    mnemonic_text   TEXT,
    examples_json   JSONB,                 -- [{ja, ja_furigana, zh, level}]
    relations_json  JSONB,                 -- {synonyms:[], antonyms:[], superord:[], subord:[], confused:[]}
    
    -- 星图定位
    embedding       vector(768),           -- sentence-transformer 向量
    map_x           FLOAT,                 -- 星图 2D 坐标
    map_y           FLOAT,
    cluster_id      INTEGER,
    cluster_name    TEXT,                  -- WORK/HOME/NATURE/EMOTION...
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    card_generated  BOOLEAN DEFAULT FALSE
);

-- 语法点表
CREATE TABLE grammar_points (
    id              SERIAL PRIMARY KEY,
    pattern         TEXT NOT NULL,         -- e.g. "〜ば"
    name_zh         TEXT,                  -- 假定形
    name_en         TEXT,                  -- Conditional
    category        TEXT,                  -- CONDITION/MODALITY/CAUSE...
    jlpt_level      SMALLINT,
    explanation_zh  TEXT,
    examples_json   JSONB,
    
    map_x           FLOAT,
    map_y           FLOAT,
    cluster_id      INTEGER
);

-- 语法点关系表（星图中的连线）
CREATE TABLE grammar_relations (
    from_id         INTEGER REFERENCES grammar_points(id),
    to_id           INTEGER REFERENCES grammar_points(id),
    relation_type   TEXT,                  -- PREREQUISITE/SIMILAR/OPPOSITE/EXTENDS
    strength        FLOAT DEFAULT 1.0,    -- 连线粗细
    PRIMARY KEY (from_id, to_id)
);

-- 词语关系表（词汇星图连线）
CREATE TABLE word_relations (
    from_id         INTEGER REFERENCES words(id),
    to_id           INTEGER REFERENCES words(id),
    relation_type   TEXT,                  -- SYNONYM/ANTONYM/SUPERORD/SUBORD/CONFUSED
    strength        FLOAT DEFAULT 1.0,
    PRIMARY KEY (from_id, to_id)
);

-- JLPT 考题表
CREATE TABLE jlpt_questions (
    id              SERIAL PRIMARY KEY,
    source_file     TEXT,                  -- 来源 PDF 文件名
    level           SMALLINT,             -- 1-5
    year            SMALLINT,
    section         TEXT,                  -- 语法/词汇/读解/听解
    question_num    SMALLINT,
    question_json   JSONB,                 -- 完整题目结构
    analysis_json   JSONB,                 -- AI 解析结果
    audio_offset_ms INTEGER,              -- 听力题音频时间戳
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 用户学习记录（SaaS 版）
CREATE TABLE user_word_progress (
    user_id         UUID,
    word_id         INTEGER REFERENCES words(id),
    status          TEXT DEFAULT 'new',   -- new/learning/known/mastered
    review_count    INTEGER DEFAULT 0,
    last_reviewed   TIMESTAMPTZ,
    PRIMARY KEY (user_id, word_id)
);
```

### 2.2 索引

```sql
CREATE INDEX ON words (jlpt_level);
CREATE INDEX ON words (cluster_id);
CREATE INDEX ON words USING ivfflat (embedding vector_cosine_ops);  -- 向量相似度查询
CREATE INDEX ON words (map_x, map_y);  -- 空间查询
```

---

## 三、后端 API 设计

### 3.1 端点列表

```
词汇 API
GET  /api/words                          # 词表（支持 jlpt_level/cluster/search 过滤）
GET  /api/words/{id}                     # 单词详情（含完整词卡）
GET  /api/words/{id}/conjugations        # 动词变形表
GET  /api/words/search?q=               # 搜索（支持中/日/英）
GET  /api/words/similar?word_id=&n=10   # 语义相似词

星图 API
GET  /api/map/nodes                     # 所有节点坐标（分页，视口裁剪）
GET  /api/map/nodes?bbox=x1,y1,x2,y2   # 视口内节点
GET  /api/map/edges                     # 所有连线（稀疏化）
GET  /api/map/clusters                  # 集群列表+中心坐标

语法 API
GET  /api/grammar                       # 语法点列表
GET  /api/grammar/{id}                  # 语法点详情
GET  /api/grammar/{id}/related          # 相关语法点

JLPT API
POST /api/jlpt/upload                   # 上传 PDF
GET  /api/jlpt/questions/{session_id}   # 获取解析后题目
POST /api/jlpt/answer                   # 提交答案，获取解析
GET  /api/jlpt/sessions                 # 历史刷题记录

PDF 阅读 API
POST /api/pdf/upload                    # 上传日语 PDF
POST /api/pdf/analyze-word              # 点击生词，获取词义
POST /api/pdf/scan-paragraph            # 全段落扫描

AI 生成 API（内部/管理用）
POST /api/admin/generate-card/{word_id} # 生成单个词卡
POST /api/admin/generate-batch          # 批量生成
POST /api/admin/recompute-embeddings    # 重算向量
POST /api/admin/recluster               # 重新聚类
```

### 3.2 关键业务逻辑

**动词变形生成器**（Python 实现）：
```python
def conjugate_verb(kanji: str, kana: str, verb_type: str) -> dict:
    """
    verb_type: "u" (五段) / "ru" (一段) / "suru" / "kuru"
    返回所有变形形式的 dict
    """
    forms = {
        "masu":        # 丁寧形
        "te":          # て形
        "ta":          # た形（過去）
        "nai":         # ない形
        "ba":          # ば形（条件）
        "tara":        # たら形
        "volitional":  # 意向形（〜よう/〜おう）
        "imperative":  # 命令形
        "potential":   # 可能形
        "passive":     # 受身形
        "causative":   # 使役形
        "caus_pass":   # 使役受身形
        "te_iru":      # ている（进行/状态）
        "te_oku":      # ておく（预先）
        "te_shimau":   # てしまう（完了/遗憾）
    }
    # 实现五段/一段/不规则规则...
    return forms
```

**PDF 解析 Pipeline**：
```python
async def parse_jlpt_pdf(file_bytes: bytes) -> dict:
    # 1. PyMuPDF 提取文字
    doc = fitz.open(stream=file_bytes)
    text_blocks = extract_blocks_with_positions(doc)
    
    # 2. 判断是否为扫描版
    if needs_ocr(doc):
        text_blocks = await ocr_with_easyocr(doc)
    
    # 3. Claude 解析结构
    response = await claude.messages.create(
        model="claude-sonnet-4-6",
        messages=[{
            "role": "user",
            "content": JLPT_PARSE_PROMPT.format(text=text_blocks)
        }]
    )
    return parse_structured_output(response)
```

---

## 四、前端核心模块实现

### 4.1 星图渲染（最核心）

```typescript
// 技术方案：React Three Fiber + D3-force + Web Worker

// Web Worker 负责布局计算（不阻塞 UI）
// star-map-worker.ts
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';

self.onmessage = (e) => {
  const { nodes, edges } = e.data;
  const simulation = forceSimulation(nodes)
    .force('link', forceLink(edges).id(d => d.id).strength(0.1))
    .force('charge', forceManyBody().strength(-30))
    .force('center', forceCenter(0, 0))
    .stop();
  
  // 预计算布局
  for (let i = 0; i < 300; i++) simulation.tick();
  self.postMessage({ nodes: simulation.nodes() });
};

// 主线程：React Three Fiber 渲染
// StarMap.tsx
function StarNode({ word, position, color, isSelected }) {
  const glowRef = useRef();
  
  return (
    <group position={position}>
      {/* 发光球体 */}
      <mesh onClick={() => onWordSelect(word)}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* 光晕效果（后期处理）*/}
      <Bloom threshold={0} luminanceThreshold={0.1} />
    </group>
  );
}
```

**性能策略**：
- `instancedMesh`：5000+ 节点用单次 draw call 渲染
- 视口剔除：只渲染相机可见范围内节点
- LOD：缩放 < 0.1 时只显示集群中心球，不渲染单个词
- 懒加载：先加载词的坐标，词卡内容按需请求

### 4.2 词卡详情面板

```typescript
// WordCard.tsx - 结构化展示词卡数据
interface WordCard {
  kanji: string;
  kana: string;
  meaning: { zh: string; en: string };
  scenario: ScenarioItem[];
  etymology: Etymology;
  mnemonic: string;
  examples: Example[];
  relations: Relations;
}

// 动词变形轮（SVG 实现）
function ConjugationWheel({ verb, conjugations }) {
  const FORMS = ['て形', 'た形', 'ない形', 'ば形', ...];
  const radius = 200;
  
  return (
    <svg viewBox="-250 -250 500 500">
      {/* 中心词 */}
      <circle cx={0} cy={0} r={40} />
      <text>{verb}</text>
      
      {/* 放射状变形 */}
      {FORMS.map((form, i) => {
        const angle = (i / FORMS.length) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <>
            <line x1={0} y1={0} x2={x} y2={y} />
            <circle cx={x} cy={y} r={30} />
            <text x={x} y={y}>{conjugations[form]}</text>
          </>
        );
      })}
    </svg>
  );
}
```

### 4.3 JLPT 做题界面

```typescript
// QuizMode.tsx
function QuizMode({ session }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className="quiz-panel">
      <QuestionDisplay question={session.questions[currentQ]} />
      <OptionsGrid
        options={question.options}
        selected={selected}
        correct={showAnalysis ? question.correct : null}
        onSelect={setSelected}
      />
      {showAnalysis && (
        <AnalysisPanel
          whyCorrect={question.analysis.correct_reason}
          whyWrong={question.analysis.wrong_reasons}
          vocabulary={question.vocabulary}
          grammarPoint={question.grammar_point}
        />
      )}
    </div>
  );
}
```

---

## 五、AI Prompt 设计

### 5.1 词卡生成 Prompt

```python
WORD_CARD_PROMPT = """
你是一个日语教学专家，请为以下日语单词生成完整的学习词卡。

单词：{kanji}（{kana}）
词性：{word_type}
JLPT 级别：N{jlpt_level}

请按以下 JSON 格式输出：

{{
  "meaning_zh": "中文释义（简洁，2-10字）",
  "meaning_en": "English meaning",
  "scenario": [
    {{
      "description": "使用场景描述（中文，1句话）",
      "examples": ["具体例子1", "具体例子2"]
    }}
  ],
  "etymology": {{
    "type": "大和言葉|漢語|外来語|混種語",
    "breakdown": "词源分解说明",
    "ancient_meaning": "古义或引申过程"
  }},
  "mnemonic": "记忆故事（中文，100-150字，高情绪强度场景，最后一句高亮目标词读音）",
  "examples": [
    {{
      "ja": "日语例句",
      "ja_furigana": "例句（带振假名）",
      "zh": "中文翻译",
      "level": "N5|N4|N3|N2|N1"
    }}
  ],
  "relations": {{
    "synonyms": ["同义词1", "同义词2"],
    "antonyms": ["反义词"],
    "superordinate": ["上位词"],
    "subordinate": ["下位词"],
    "confused_with": ["容易混淆的词"]
  }}
}}

要求：
- mnemonic 必须是完整的叙事故事，不是解释
- examples 至少3个，覆盖不同语境
- 中文释义要精准，不要过度翻译
"""
```

### 5.2 JLPT PDF 解析 Prompt

```python
JLPT_PARSE_PROMPT = """
以下是从 JLPT 试卷 PDF 提取的文字内容。请解析其结构并以 JSON 格式输出。

---文字内容---
{text}
---结束---

请输出以下结构：
{{
  "level": "N5|N4|N3|N2|N1",
  "year": 年份或null,
  "sections": [
    {{
      "name": "文字・語彙|文法|読解|聴解",
      "instruction": "本题型说明",
      "questions": [
        {{
          "number": 题号,
          "question_text": "题目原文",
          "question_zh": "题目中文翻译",
          "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
          "correct_answer": "A|B|C|D",
          "explanation": {{
            "correct_reason": "为什么正确选项对",
            "wrong_reasons": {{"A": "为什么A错", "B": "...", ...}},
            "grammar_point": "考察的语法点",
            "vocabulary": [{{"word": "", "kana": "", "meaning_zh": ""}}]
          }}
        }}
      ]
    }}
  ]
}}
"""
```

---

## 六、语义聚类 Pipeline（离线运行）

```python
# cluster_words.py - 一次性离线运行，结果写入数据库

import numpy as np
from sentence_transformers import SentenceTransformer
import umap
import hdbscan
from anthropic import Anthropic

def run_clustering_pipeline():
    # 1. 加载所有单词
    words = db.query("SELECT id, kanji, meaning_zh, meaning_en FROM words")
    
    # 2. 生成嵌入向量（使用多语言模型）
    model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
    texts = [f"{w.kanji} {w.meaning_zh} {w.meaning_en}" for w in words]
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True)
    
    # 3. UMAP 降维到 2D（星图坐标）
    reducer = umap.UMAP(n_components=2, metric='cosine', n_neighbors=15)
    coords_2d = reducer.fit_transform(embeddings)
    
    # 4. HDBSCAN 聚类
    clusterer = hdbscan.HDBSCAN(min_cluster_size=20, min_samples=5)
    cluster_ids = clusterer.fit_predict(embeddings)
    
    # 5. 用 Claude 为每个集群命名
    claude = Anthropic()
    cluster_names = {}
    for cid in set(cluster_ids):
        if cid == -1: continue  # 噪点
        sample_words = [words[i].kanji for i, c in enumerate(cluster_ids) if c == cid][:20]
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            messages=[{
                "role": "user",
                "content": f"这些日语词汇属于同一语义类别：{', '.join(sample_words)}\n请用2-3个英文单词命名这个类别（如 WORK/NATURE/EMOTION）："
            }]
        )
        cluster_names[cid] = response.content[0].text.strip()
    
    # 6. 写回数据库
    for i, word in enumerate(words):
        db.execute("""
            UPDATE words SET
                map_x = %s, map_y = %s,
                cluster_id = %s, cluster_name = %s,
                embedding = %s
            WHERE id = %s
        """, (coords_2d[i][0], coords_2d[i][1],
              int(cluster_ids[i]), cluster_names.get(cluster_ids[i], 'OTHER'),
              embeddings[i].tolist(), word.id))
    
    print(f"聚类完成：{len(set(cluster_ids))} 个集群")
```

---

## 七、Tauri 桌面端配置

```toml
# tauri.conf.json 关键配置
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": true,           # 本地文件读写（PDF 导入）
        "scope": ["$DOCUMENT/*", "$DOWNLOAD/*"]
      },
      "dialog": {
        "open": true           # 文件选择对话框
      },
      "protocol": {
        "asset": true          # 本地资源访问
      }
    },
    "bundle": {
      "identifier": "com.yourapp.japanese-learning",
      "targets": ["msi", "dmg", "deb"]
    }
  }
}
```

---

## 八、开发阶段划分

### Phase 1：数据基础（2-3 周）

- [ ] 搭建 PostgreSQL + pgvector
- [ ] 导入 JMdict 词典数据（N5-N1 约 8000 词）
- [ ] 运行词卡批量生成 Pipeline（Claude Haiku）
- [ ] 运行语义聚类 Pipeline，生成星图坐标
- [ ] 实现动词变形生成器（算法）
- [ ] 搭建 FastAPI 基础结构

**验收标准**：`GET /api/map/nodes` 返回带坐标的词节点列表

---

### Phase 2：星图核心（3-4 周）

- [ ] React Three Fiber 基础渲染（节点 + 连线）
- [ ] D3-force 布局（Web Worker）
- [ ] 缩放/平移交互（OrbitControls）
- [ ] 节点发光效果（Bloom post-processing）
- [ ] 集群 Bubble 渲染（透明圆圈）
- [ ] 深色星空 / 浅色泡泡主题切换
- [ ] 节点点击 → 词卡面板弹出
- [ ] 左侧词表侧边栏（含搜索）
- [ ] 性能优化（instancedMesh, LOD）

**验收标准**：5000个节点 60fps 流畅渲染，支持点击查看词卡

---

### Phase 3：词卡与语法图（2 周）

- [ ] 词卡详情面板（全字段展示）
- [ ] 音频朗读按钮（TTS API 或预录音）
- [ ] 动词变形轮（SVG/Canvas）
- [ ] 语法关系图（独立视图，复用星图渲染层）
- [ ] 单词关系连线（点击词节点，高亮相关词）

**验收标准**：点击任意词汇显示完整词卡，动词变形轮正确展开

---

### Phase 4：JLPT 真题系统（3 周）

- [ ] PDF 上传 + PyMuPDF 文字提取
- [ ] EasyOCR 备用路径（扫描版 PDF）
- [ ] Claude API 题目结构解析
- [ ] Quiz Mode 界面（做题 + 解析）
- [ ] Study Mode 界面（学习 + 词表）
- [ ] Scan Mode 界面（AI 全文分析）
- [ ] 音频播放器（听力部分）
- [ ] 做题历史记录

**验收标准**：上传任意 JLPT N3 PDF，完成一节答题并查看解析

---

### Phase 5：PDF 阅读器（2 周）

- [ ] PDF 渲染（pdf.js / react-pdf）
- [ ] 日语竖排文本处理
- [ ] 点击词语 → fugashi 分词 → JMdict 查词
- [ ] 红线连接 + 右侧分析面板
- [ ] Quick Scan 全段落分析

**验收标准**：导入日语小说 PDF，点击生词显示词义

---

### Phase 6：桌面端 + 打磨（2 周）

- [ ] Tauri 项目初始化
- [ ] 本地文件访问（无需上传，直接读取本地 PDF）
- [ ] 离线模式（核心词库可本地缓存）
- [ ] Windows .exe + Mac .dmg 打包
- [ ] 安装包测试

---

## 九、项目目录结构

```
japanese-learning-app/
├── frontend/                   # Next.js 前端
│   ├── app/
│   │   ├── page.tsx            # 主页（星图）
│   │   ├── jlpt/              # JLPT 系统
│   │   └── reader/            # PDF 阅读器
│   ├── components/
│   │   ├── StarMap/
│   │   │   ├── StarMap.tsx     # 主渲染组件
│   │   │   ├── StarNode.tsx    # 单个节点
│   │   │   ├── Edges.tsx       # 连线
│   │   │   └── worker.ts       # D3 Web Worker
│   │   ├── WordCard/
│   │   │   ├── WordCard.tsx
│   │   │   └── ConjugationWheel.tsx
│   │   ├── Grammar/
│   │   │   └── GrammarMap.tsx
│   │   └── JLPT/
│   │       ├── QuizMode.tsx
│   │       ├── StudyMode.tsx
│   │       └── ScanMode.tsx
│   └── lib/
│       ├── api.ts              # API 客户端
│       └── store.ts            # Zustand 状态
│
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── words.py
│   │   │   ├── grammar.py
│   │   │   ├── jlpt.py
│   │   │   └── pdf.py
│   │   ├── services/
│   │   │   ├── nlp.py          # fugashi + jamdict
│   │   │   ├── conjugation.py  # 动词变形
│   │   │   ├── pdf_parser.py   # PyMuPDF + EasyOCR
│   │   │   └── claude_service.py
│   │   └── models/
│   │       └── database.py
│   ├── scripts/
│   │   ├── import_jmdict.py    # 导入词典数据
│   │   ├── generate_cards.py   # 批量生成词卡
│   │   └── cluster_words.py    # 语义聚类
│   └── requirements.txt
│
├── desktop/                    # Tauri 桌面端
│   ├── src-tauri/
│   │   ├── src/main.rs
│   │   └── tauri.conf.json
│   └── package.json
│
└── docker-compose.yml          # PostgreSQL + Redis
```

---

## 十、关键依赖清单

### Python (requirements.txt)
```
fastapi==0.111.0
uvicorn==0.30.0
anthropic==0.28.0
pymupdf==1.24.0
easyocr==1.7.1
fugashi==1.3.0
unidic-lite==1.0.8
jamdict==0.4.4
sentence-transformers==3.0.0
umap-learn==0.5.6
hdbscan==0.8.38
scikit-learn==1.5.0
numpy==1.26.4
psycopg2-binary==2.9.9
pgvector==0.3.0
celery==5.4.0
redis==5.0.6
```

### JavaScript (package.json)
```
next: 14.x
react: 18.x
typescript: 5.x
@react-three/fiber: 8.x
@react-three/drei: 9.x
@react-three/postprocessing: 2.x  # Bloom 发光效果
three: 0.165.x
d3-force: 3.x
react-pdf: 9.x
framer-motion: 11.x
zustand: 4.x
@tanstack/react-query: 5.x
wanakana: 5.x
shadcn/ui: latest
tailwindcss: 3.x
```

---

## 十一、成本估算

| 项目 | 一次性成本 | 月运营成本（SaaS） |
|------|-----------|------------------|
| 词卡批量生成（5000词 × Claude Haiku） | ~$5 | 无 |
| 聚类计算（本地 GPU/CPU） | 免费 | 无 |
| PostgreSQL（自托管） | 免费 | 服务器费用 |
| JLPT 解析（按需 Claude Sonnet） | - | ~$10-50/月 |
| EasyOCR（本地运行） | 免费 | 无 |
| **合计启动成本** | **<$20** | 服务器为主 |

---

## 十二、下一步

1. 确认目录结构后，执行 `Phase 1：数据基础`
2. 从 JMdict 导入词典数据开始（无需 AI，纯数据工程）
3. 再生成词卡（需要 Claude API key）
4. 建议用 N5 词汇（800词）先跑通完整 Pipeline，验证效果再扩展
