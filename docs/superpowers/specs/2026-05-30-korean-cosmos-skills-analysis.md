# Korean Cosmos — 技能、插件与扩展需求分析

> 分析日期：2026-05-30  
> 目标：梳理 korean-cosmos 项目可复用的现有技能/插件，以及需要新建的技能、扩展和 MCP 工具。

---

## 一、现有可用技能（直接复用）

这些 skills 已经在 `~/.pi/agent/skills/` 中，开发 korean-cosmos 时可以直接调用。

### 1.1 开发阶段每天会用到的

| Skill | 文件 | 在 korean-cosmos 中的用途 |
|---|---|---|
| `frontend-design` | `~/.pi/agent/skills/frontend-design/SKILL.md` | 复刻暗色宇宙主题 UI、词卡浮层、Sidebar、底部 Toolbar、深色/浅色模式切换 |
| `edge-tts` | `~/.pi/agent/skills/edge-tts/SKILL.md` | 生成韩语单词发音、例句朗读、TOPIK 听力音频 (`ko-KR-SunHiNeural`) |
| `pdf` | `~/.pi/agent/skills/pdf/SKILL.md` | Phase 7 处理 TOPIK PDF 导入、文本提取、解析 |
| `playwright-best-practices` | `~/.pi/agent/skills/playwright-best-practices/SKILL.md` | 星图交互自动化测试、WebGL 性能测试、UI 回归截图对比 |
| `firecrawl` 系列 | `~/.pi/agent/skills/firecrawl-*/SKILL.md` | 研究开源韩语词库、查阅 Three.js/R3F 最新文档、调研竞品 |
| `web-scraping` | `~/.pi/agent/skills/web-scraping/SKILL.md` | 爬取 국립국어원 词典数据、TOPIK 官方词表、例句资源 |

---

### 1.2 质量把控会用到的

| Skill | 用途 |
|---|---|
| `fact-checker` | 核查韩语词源、语法解释、汉字词对应关系是否准确 |
| `doublecheck` | 三层验证 pipeline 检查 AI 生成的词卡内容是否有幻觉 |
| `source-verification-workflow` | 验证 TOPIK 词表、词典数据的 License 和来源合法性 |

---

### 1.3 后期可能用到的

| Skill | 用途 |
|---|---|
| `whisper` | 如果需要做韩语听力转写 |
| `ffmpeg` | TTS 音频格式转换、拼接 |
| `xlsx` | TOPIK 词表 Excel 导入 |

---

## 二、现有技能覆盖不到的场景（需要新建 Skills）

以下 5 个 skills 目前不存在，但 korean-cosmos 开发过程中需要 Claude Code 反复执行同类操作。建议新建：

### 2.1 Skill 1：`korean-nlp`（韩语 NLP 工具集）

**为什么需要**：  
Claude Code 在开发过程中需要反复调用 kiwipiepy 做分词、罗马字转写、词性标注、変形生成，但没有一个 skill 告诉它怎么做。

**建议位置**：`~/.pi/agent/skills/korean-nlp/SKILL.md`

**Skill 内容概要**：

```markdown
---
name: korean-nlp
description: Korean NLP toolkit using kiwipiepy for tokenization, POS tagging, romanization, jamo decomposition, and conjugation. Use when the user needs to process Korean text, build word databases, or implement language features.
---

## Setup

```bash
pip install kiwipiepy korean-romanizer jamo hanja
```

## Tokenization (kiwipiepy)

```python
from kiwipiepy import Kiwi
kiwi = Kiwi()
result = kiwi.analyze("안녕하세요")  # Full analysis
tokens = kiwi.tokenize("한국어 공부")  # Simple tokenization
```

## Romanization

```python
from korean_romanizer import Romanizer
r = Romanizer("안녕하세요")
print(r.romanize())  # "annyeonghaseyo"
```

## Jamo Decomposition

```python
import jamo
jamo.decompose('한')  # ('ㅎ', 'ㅏ', 'ㄴ')
```

## Conjugation Rules

[规则引擎参考，含 7 种 불규칙 변용]
```

**主要用法**：

- Claude Code 做韩语词库导入时调用分词/罗马字转写。
- 做変形规则引擎时参考该 skill。
- 做完后设置 `disable-model-invocation: false`，让 AI 自动加载。

---

### 2.2 Skill 2：`threejs-galaxy`（Three.js 3D 星系渲染模式）

**为什么需要**：  
Three.js + React Three Fiber 的 InstancedMesh、Raycasting、CSS2DRenderer、Bloom 后期处理在 korean-cosmos 中是核心视觉，但 Claude Code 默认不擅长这些 API，需要一个 skill 提供通用模式和代码片段。

**建议位置**：`~/.pi/agent/skills/threejs-galaxy/SKILL.md`

**Skill 内容概要**：

```markdown
---
name: threejs-galaxy
description: Three.js and React Three Fiber patterns for building 3D galaxy/star-map visualizations. Covers InstancedMesh for thousands of nodes, CSS2DRenderer for labels, Bloom post-processing, camera flight animations, and raycasting for click detection. Use when building 3D node-graph visualizations with R3F.
---

## Key Patterns

### InstancedMesh for Thousands of Nodes
```tsx
// Single draw call for all nodes
const meshRef = useRef<InstancedMesh>(null)
const dummy = useMemo(() => new Object3D(), [])

useFrame(() => {
  nodes.forEach((node, i) => {
    dummy.position.set(node.x, node.y, node.z)
    dummy.scale.setScalar(node.size)
    dummy.updateMatrix()
    meshRef.current.setMatrixAt(i, dummy.matrix)
  })
  meshRef.current.instanceMatrix.needsUpdate = true
})

return (
  <instancedMesh ref={meshRef} args={[undefined, undefined, nodeCount]}>
    <sphereGeometry args={[1, 16, 16]} />
    <meshStandardMaterial />
  </instancedMesh>
)
```

### Raycasting with three-mesh-bvh
[代码示例]

### CSS2DRenderer for Labels
[代码示例]

### Bloom Post-Processing
[代码示例]

### Camera Flight Animation
[代码示例]
```

---

### 2.3 Skill 3：`sqlite-dev`（SQLite 开发工作流）

**为什么需要**：  
korean-cosmos 的数据库操作贯穿 Phase 0-8，从建表到导入词库到调试查询。每次都应该按固定模式执行，避免 Claude Code 胡乱操作。

**建议位置**：`~/.pi/agent/skills/sqlite-dev/SKILL.md`

**Skill 内容概要**：

```markdown
---
name: sqlite-dev
description: SQLite database management for the Korean Cosmos project. Use for creating tables, running migrations, importing word data, debugging queries, and checking schema integrity.
---

## Database Path
Always use: `data/korean_cosmos.db`

## Table Schema
[建表 SQL 全文]

## Query Patterns
[常用查询示例]
```

---

### 2.4 Skill 4：`fastapi-backend`（FastAPI 后端开发模式）

**为什么需要**：  
每次 Claude Code 添加新 API 端点时都应该参考固定的 Pydantic schema 和 FastAPI router 模式，确保前后端契约一致。

**建议位置**：`~/.pi/agent/skills/fastapi-backend/SKILL.md`

**内容概要**：FastAPI 项目结构约定、Pydantic schema 写法、router 模板、错误处理、CORS 配置。

---

### 2.5 Skill 5：`korean-dictionary-data`（韩语词典数据源指南）

**为什么需要**：  
开发过程中需要反复查词库、例句、汉字对应关系，需要一个 skill 告诉 Claude Code 去哪里查、用什么格式、License 是什么。

**建议位置**：`~/.pi/agent/skills/korean-dictionary-data/SKILL.md`

**内容概要**：

```markdown
## Data Sources

1. 국립국어원 표준국어대사전 API: https://stdict.korean.go.kr/
   - Free API key required
   - Contains: definition, POS, origin (고유어/한자어/외래어)
   
2. TOPIK 공식 어휘: https://topik.go.kr/
   - Official word lists by level
   
3. Tatoeba Korean: https://tatoeba.org/
   - CC BY 2.0, example sentences
   
## License Verification

Always check license before importing data.
Never include copyrighted textbook content.
```

---

## 三、建议新建的 Pi 扩展（Extensions）

Pi 的扩展系统支持注册自定义工具、监听事件、注入 UI。以下是 korean-cosmos 项目需要的扩展。

### 3.1 Extension 1：Dev Server Manager

**文件**：`.pi/extensions/korean-cosmos-dev.ts`

**功能**：

- 注册自定义工具 `start_dev_servers`：启动 Vite + uvicorn。
- 注册自定义工具 `stop_dev_servers`：停止所有开发服务。
- 注册自定义工具 `check_dev_status`：检查服务是否在运行。
- 启动时在 footer 显示服务状态。

```typescript
// 示意
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  let viteProcess: any = null;
  let uvicornProcess: any = null;

  pi.registerTool({
    name: "start_dev_servers",
    label: "Start Dev Servers",
    description: "Start Vite dev server (port 5173) and FastAPI server (port 8000)",
    parameters: Type.Object({}),
    async execute() {
      // spawn Vite and uvicorn
      return { content: [{ type: "text", text: "Servers started: Vite:5173, API:8000" }] };
    },
  });

  pi.registerTool({
    name: "stop_dev_servers",
    label: "Stop Dev Servers",
    description: "Stop all running development servers",
    parameters: Type.Object({}),
    async execute() {
      // kill processes
      return { content: [{ type: "text", text: "All servers stopped" }] };
    },
  });
}
```

---

### 3.2 Extension 2：Korean NLP Tool

**文件**：`.pi/extensions/korean-nlp-tool.ts`

**功能**：

- 注册自定义工具 `korean_tokenize`：对韩文分词。
- 注册自定义工具 `korean_romanize`：韩文转罗马字。
- 注册自定义工具 `korean_conjugate`：生成动词变形表。

让 Claude Code 在开发中能直接调用这些工具，不用每次都手写 Python 脚本。

---

### 3.3 Extension 3：Database Migration Tool

**文件**：`.pi/extensions/db-migrate.ts`

**功能**：

- 注册自定义工具 `db_migrate`：运行 SQL 迁移文件。
- 注册自定义工具 `db_query`：执行安全查询（SELECT only）。
- 注册自定义工具 `db_schema`：打印当前数据库 schema。

这能防止 Claude Code 在 bash 里直接写 sqlite3 命令时出错。

---

### 3.4 Extension 4：Playwright Test Runner（可选）

**文件**：`.pi/extensions/playwright-runner.ts`

**功能**：

- 注册自定义工具 `run_e2e_tests`：执行 Playwright 测试套件。
- 注册自定义工具 `capture_screenshot`：截取当前页面并保存为 PNG。

---

## 四、建议的 MCP 工具

> **注意**：Pi 不内置 MCP 支持，但可以通过安装 MCP server 在 Claude Code（或 IDE 集成）中使用。如果只用 pi，可以用 skill 替代 MCP。

### 4.1 推荐 MCP Server

| MCP Server | 用途 | 对应 skill 替代方案 |
|---|---|---|
| **Context7** | 查 Three.js、R3F、FastAPI、PixiJS 最新 docs | 用 `firecrawl` skill 替代 |
| **Playwright MCP** | 自动打开浏览器、截图 3D 场景、交互测试 | 用 `playwright-best-practices` skill 替代 |
| **SQLite MCP** | 在开发中直接查数据库表结构和数据 | 用 `sqlite-dev` skill 替代 |
| **Brave Search MCP** | 搜索开源韩语词典、NLP 工具 | 用 `firecrawl-search` skill 替代 |

---

### 4.2 如果一定要用 MCP

如果开发的 IDE/Claude Code 支持 MCP（比如 VS Code + Claude Code 插件版），建议配置：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-playwright"]
    }
  }
}
```

然后在 Claude Code 中查库文档：

```txt
Context7: 查 @react-three/fiber 的 InstancedMesh 用法
Context7: 查 FastAPI 的 CORS 配置
```

---

## 五、汇总表

### 5.1 不需要新建，直接用的

| 类型 | 名称 | 用途 |
|---|---|---|
| Skill | `frontend-design` | 暗色宇宙 UI |
| Skill | `edge-tts` | 韩语 TTS |
| Skill | `pdf` | PDF 处理 |
| Skill | `playwright-best-practices` | E2E 测试 |
| Skill | `firecrawl-search` | 搜索韩语资源 |
| Skill | `firecrawl-scrape` | 抓取词典/文档 |
| Skill | `firecrawl-crawl` | 批量抓取词库 |
| Skill | `fact-checker` | 核实韩语内容 |
| Skill | `doublecheck` | AI 输出验证 |
| Skill | `source-verification-workflow` | 数据 License 验证 |

---

### 5.2 需要新建的

| 类型 | 名称 | 优先级 | 预计工作量 |
|---|---|---|---|
| Skill | `korean-nlp` | 🔴 高 | 1-2 小时 |
| Skill | `threejs-galaxy` | 🔴 高 | 2-3 小时 |
| Skill | `sqlite-dev` | 🟡 中 | 0.5 小时 |
| Skill | `fastapi-backend` | 🟡 中 | 1 小时 |
| Skill | `korean-dictionary-data` | 🟢 低 | 0.5 小时 |
| Extension | `korean-cosmos-dev.ts` | 🔴 高 | 1-2 小时 |
| Extension | `korean-nlp-tool.ts` | 🟡 中 | 1 小时 |
| Extension | `db-migrate.ts` | 🟡 中 | 0.5 小时 |
| Extension | `playwright-runner.ts` | 🟢 低 | 0.5 小时 |

---

### 5.3 MCP（可选，用 skill 可替代）

| MCP Server | 优先级 |
|---|---|
| Context7 | 🟡 中（用 firecrawl 可替代） |
| Playwright MCP | 🟡 中（有 playwright-best-practices） |
| SQLite MCP | 🟢 低（有 sqlite-dev skill） |

---

## 六、建议的创建顺序

按开发阶段逐步创建，不要一次性全部新建：

```txt
Phase 0 前（马上创建）：
  1. korean-cosmos-dev.ts 扩展（管理开发服务器）
  2. threejs-galaxy skill（Three.js 模式参考）

Phase 2 前（接数据库时创建）：
  3. sqlite-dev skill
  4. db-migrate.ts 扩展

Phase 2-3（接韩语数据时创建）：
  5. korean-nlp skill
  6. korean-nlp-tool.ts 扩展
  7. korean-dictionary-data skill

Phase 4+（接后端时创建）：
  8. fastapi-backend skill

Phase 6+（测试阶段创建）：
  9. playwright-runner.ts 扩展
```

---

## 七、结论

1. **现有 skills 能覆盖约 50%** 的开发需求（UI、TTS、PDF、测试、搜索、核查）。
2. **必须新建 5 个 skills**：`korean-nlp`、`threejs-galaxy`、`sqlite-dev`、`fastapi-backend`、`korean-dictionary-data`。
3. **建议新建 4 个 pi extensions**：dev server 管理、韩语 NLP 工具、数据库迁移工具、Playwright 测试 runner。
4. **MCP 可选**，因为现有 skills 已经能覆盖大部分 MCP 功能。

**如果要启动 Phase 0，优先级最高的两个是**：

```txt
1. korean-cosmos-dev.ts 扩展
2. threejs-galaxy skill
```

这两个能显著提高 Claude Code 在 Phase 0 生成 R3F 代码的质量和效率。
