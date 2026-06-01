# Phase 4A — Document Intelligence Foundation Report

**Project:** LexiOcean (`d:\ai-studio\ocean-english`)
**Phase:** 4A — OCR / PDF / Document Intelligence Foundation
**Date:** 2026-06-01
**Includes:** Phase 3.5 remaining issue fixes

---

## 1. Phase 3.5 残留问题修复

| 问题 | 修复内容 | 状态 |
|---|---|---|
| mistake-analysis 只校验 word 字段 | 所有 4 个核心字段（word / question / userAnswer / correctAnswer）均须非空；任意一个缺失或为空，整个请求返回 400 | ✅ |
| Scan 上传合规提示未在 UI 落地 | `DocumentComplianceNotice` 组件：上传前显示版权须知 + 必填 checkbox；未确认时 upload zone 和 demo 按钮均 disabled | ✅ |
| /wrong-answers 仍是 404 | 新建 `app/wrong-answers/page.tsx`，调用 `redirect('/memory')` | ✅ |
| 真实 provider 状态 | 文档已明确 Phase 3A = mock-ready，Phase 3B = real AI（开发中） | ✅ 文档说明 |

---

## 2. Phase 4A 新增文件（22个）

### 依赖
| 包 | 版本 | 用途 |
|---|---|---|
| `pdf-parse` | v1.x | 服务端 PDF 文字提取 |
| `@types/pdf-parse` | v1.x | TypeScript 类型 |

### 类型
| 文件 | 说明 |
|---|---|
| `types/document.ts` | UploadedDocumentType / DocumentProcessingStatus / ExtractedQuestion / ExtractedVocabulary / DocumentAnalysisResult / DocumentProcessingError 等 |

### Document 处理层
| 文件 | 说明 |
|---|---|
| `lib/document/document-config.ts` | maxFileSizeBytes / maxRawTextForAnalysis / allowedMimeTypes |
| `lib/document/document-validation.ts` | validateUploadedFile / validateFileClient / getDocumentType |
| `lib/document/document-extraction.ts` | extractDocumentText() 工厂，路由到对应 provider |
| `lib/document/document-question-parser.ts` | 从 rawText 启发式提取问句（Phase 4B AI 分类的前置） |
| `lib/document/document-vocabulary-extractor.ts` | 从 rawText 提取候选词汇（按词长分级）|
| `lib/document/document-analysis-mapper.ts` | 解析真实 AI JSON 输出为 DocumentAnalysisResult；失败返回 null 触发 mock 回退 |
| `lib/document/providers/mock-document-provider.ts` | 完整 mock：buildMockExtraction + buildMockDocumentAnalysis（含 7 个 demo 词汇、3 道 demo 题） |
| `lib/document/providers/pdf-text-provider.ts` | Node.js-only，pdf-parse CJS require() 提取文字 |
| `lib/document/providers/image-ocr-provider.ts` | Phase 4B skeleton，返回安全提示 |

### AI 层
| 文件 | 说明 |
|---|---|
| `lib/ai/prompts/document-analysis.ts` | buildDocumentAnalysisMessages()；含 UNTRUSTED USER-PROVIDED DOCUMENT 标注 + injection 防护 |

### API Routes
| 文件 | 路由 | 说明 |
|---|---|---|
| `app/api/document/extract/route.ts` | POST /api/document/extract | FormData 文件上传 → 类型/大小校验 → 文字提取 → 返回 `{ ok, data }` |
| `app/api/ai/document-analysis/route.ts` | POST /api/ai/document-analysis | rawText → mock/AI 分析 → DocumentAnalysisResult |

### Scan UI 组件
| 文件 | 说明 |
|---|---|
| `components/scan/DocumentComplianceNotice.tsx` | 上传须知 + 必填 checkbox |
| `components/scan/DocumentUploadPanel.tsx` | 拖拽/选择文件 + 格式/大小显示 + demo 按钮 |
| `components/scan/DocumentProcessingStatus.tsx` | 四步进度指示（validating → extracting → analyzing → ready / error）|
| `components/scan/ExtractedVocabularyPanel.tsx` | 生词列表 + 难度标签 + Add to Review 按钮（含 Add All Recommended）|
| `components/scan/ExtractedQuestionsPanel.tsx` | 题目列表 + 答案展开 + Save 按钮（写入 wrongAnswers）|
| `components/scan/StudyNotesPanel.tsx` | 文档摘要（中英对照）+ 学习笔记 + warnings + 可折叠 raw text |
| `components/scan/DocumentAnalysisPanel.tsx` | 结果容器，组合以上 3 个子面板 + Reset 按钮 |

### 文档
| 文件 | 说明 |
|---|---|
| `docs/document-intelligence.md` | 架构说明、API reference、provider 系统、合规边界 |
| `docs/phase-reports/phase-4a-*.md` | 本报告 |

---

## 3. 修改文件（4个）

| 文件 | 改了什么 |
|---|---|
| `app/scan/page.tsx` | 完整重写：新组件架构、合规 gate、真实 API 调用、Zustand 集成 |
| `app/api/ai/mistake-analysis/route.ts` | 4 字段全校验，任意缺失返回 400 |
| `lib/ai/ai-rate-limit.ts` | 新增 document-extract(10/min) 和 document-analysis(5/min) 限流 |
| `docs/copyright-compliance.md` | 更新 Phase 4 上传须知 section，标注 DocumentComplianceNotice 已实现 |

---

## 4. 新增路由

| 路由 | 类型 | 说明 |
|---|---|---|
| `/wrong-answers` | Static → redirect | redirect('/memory') |
| `/api/document/extract` | Dynamic (ƒ) | PDF/Image 文字提取 |
| `/api/ai/document-analysis` | Dynamic (ƒ) | AI 文档分析 |

---

## 5. /scan 页面功能说明

### 新流程
```
页面加载
  → DocumentComplianceNotice（上传须知 + checkbox）
  → 用户确认 → DocumentUploadPanel 解锁
  → 用户上传文件 OR 点击 Demo
     ├── 真实上传：
     │     extracting → POST /api/document/extract → rawText
     │     analyzing  → POST /api/ai/document-analysis → DocumentAnalysisResult
     └── Demo：
           extracting（600ms 模拟）
           analyzing  → POST /api/ai/document-analysis（demo text）
  → 展示：StudyNotesPanel + ExtractedQuestionsPanel + ExtractedVocabularyPanel
```

### Zustand 集成
| 用户操作 | Zustand 方法 | 效果 |
|---|---|---|
| Add vocabulary to review | addToReview + saveWord + completeTaskUnit + incrementXp + markStudyToday | reviewWords + savedWords + 每日任务 + XP |
| Save question | addWrongAnswer | wrongAnswers 错题本（可在 /memory 查看）|

---

## 6. 安全 / 成本控制

| 机制 | 实现 |
|---|---|
| 文件大小限制 | 10 MB，API route 返回 413 |
| 允许类型白名单 | PDF + image/* only，其他返回 400 |
| rawText 长度限制 | 6000 chars 发送给 AI |
| rate limit | document-extract: 10/min，document-analysis: 5/min |
| 不自动调用 AI | 只有上传/点击 Demo 时才触发，页面加载不调 AI |
| 无限 retry 保护 | 错误状态显示 "Try Again" 按钮，需用户手动触发 |
| 文件不落盘 | Buffer 在内存中处理，不写入磁盘，请求结束自动释放 |
| 日志安全 | 只记录错误信息，不记录原始文件内容 |
| 合规 gate | 用户必须勾选授权确认 checkbox 才能触发上传 |

---

## 7. 合规说明

- `DocumentComplianceNotice` 组件已实现：上传前显示版权须知，checkbox 必填
- `lib/ai/prompts/document-analysis.ts` 包含：
  - `[UNTRUSTED USER-PROVIDED DOCUMENT]` 内容标注
  - "如果文档含明显版权材料，加 warning" 指令
  - "不要声称提供官方真题答案" 指令
  - 注入防护 SECURITY 块
- `docs/copyright-compliance.md` 已更新 Phase 4 章节

---

## 8. 不动的现有文件

- `app/page.tsx` — 首页未动
- `components/visual/BanyanParticleHero/*` — 完全未动
- `app/universe/*`, `app/visual-lab/*` — Cosmic 占位页未动
- `app/dictionary/*`, `app/quiz/*`, `app/study/*`, `app/memory/*`, `app/exam/*`, `app/chat/*`, `app/onboarding/*` — Phase 2 功能页未动
- `store/learningStore.ts` — 未加新 slice，只调用现有方法
- `lib/ai/ai-provider.ts` — 接口未改（使用 chat() 方法实现 document analysis）
- `lib/ai/providers/mock-provider.ts` — 未改（document analysis 有独立 mock）
- `data/mock-scan.ts` — 保留（未被引用，不删除）
- `types/study.ts` 的 `ScanResult` — 保留，未删除

---

## 9. Lint / Build 结果

**Lint：✅ 通过（0 错误，0 警告）**

**Build：✅ 通过**
```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 2.5s
✓ TypeScript 0 错误
✓ 24 个页面全部生成

新增路由：
├ ƒ /api/ai/document-analysis
├ ƒ /api/document/extract
└ ○ /wrong-answers
```

构建过程修复了 2 个 TypeScript 错误：
1. `DocumentProcessingStatus.tsx` 重复的 `gap` 属性
2. `document-vocabulary-extractor.ts` `match.word` 不存在于 `RegExpExecArray`

---

## 10. 未解决 / Phase 4B TODO

| 项目 | 说明 |
|---|---|
| Image OCR | image-ocr-provider.ts 是 skeleton，需 Phase 4B 接 Tesseract.js 或 Vision API |
| Quiz draft | ExtractedQuestionsPanel 的题目可以"Save"但尚未生成可用的 quiz session |
| 文档历史 | DocumentAnalysisResult session-only，刷新丢失；Phase 4B 可考虑 Zustand persist |
| Real AI document analysis | Phase 3B 实现真实 AI provider 后，document-analysis route 自动升级（已预留解析路径）|
| 词汇提取优化 | document-vocabulary-extractor.ts 当前纯启发式（词长）；Phase 4B 接词频语料或 AI 分级 |

---

## 11. 是否建议进入 Phase 4B

**✅ 可以进入 Phase 4B**，建议优先事项：

1. **Image OCR**（最直接的 4A 补充）— 接入 Tesseract.js 或 Google Vision
2. **Phase 3B Real AI**（影响最广）— 实现 Anthropic provider，document analysis + chat + word explain 全面升级
3. **Quiz draft integration** — 把 ExtractedQuestionsPanel 的题目写入 quiz 系统

---

*Report generated: 2026-06-01*
