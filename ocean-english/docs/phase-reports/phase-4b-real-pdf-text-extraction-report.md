# Phase 4B — Real PDF Text Extraction Report

**Project:** LexiOcean (`d:\ai-studio\ocean-english`)
**Phase:** 4B — Real PDF Text Extraction
**Date:** 2026-06-01
**Based on:** Phase 4A Document Intelligence Foundation

---

## 1. Summary

Phase 4B enhances the PDF extraction pipeline established in Phase 4A from a basic `rawText` extractor into a full extraction system that returns **page count**, **PDF metadata**, **quality warnings**, and supports a new **two-step scan flow** where users see extraction results before committing to AI analysis.

No new dependencies were installed — `pdf-parse` (installed in Phase 4A) already provides all required data.

---

## 2. 新增文件（1个）

| 文件 | 说明 |
|---|---|
| `components/scan/PDFExtractionInfoPanel.tsx` | 提取结果中间步骤面板：文件信息、页数、元数据、质量警告、raw text 预览、"Analyze with AI"按钮 |

---

## 3. 修改文件（6个）

| 文件 | 改了什么 |
|---|---|
| `types/document.ts` | `DocumentProcessingStatus` 增加 `'extracted'`；新增 `PdfMetadata` 接口；`ExtractedDocumentData` 增加可选字段 `pageCount?` 和 `metadata?` |
| `lib/document/document-config.ts` | 新增 `minUsableTextLength: 50`（扫描件阈值）、`maxPagesWarningThreshold: 100`（过长文档阈值）、`maxTextPreviewLength: 1_000`（UI 预览截断）|
| `lib/document/providers/pdf-text-provider.ts` | 扩展 `PdfData` 接口加 `info` 字段；读取 PDF 元数据；新增三类 warning 逻辑（扫描件/页数过多/文本截断）；返回 `pageCount` 和 `metadata` |
| `app/api/document/extract/route.ts` | 移除早期的 `maxRawTextForAnalysis` 截断（现由客户端在 AI 调用前执行）；传递 `pageCount` 和 `metadata` 到响应；保留 `maxExtractedTextLength` 兜底安全上限 |
| `app/scan/page.tsx` | 新增 `extractedDoc` 状态；两步流程（`extracted` 中间态）；`runAnalysis()` 改为无参数从 `extractedDoc` 读取，在调用 AI 前截断到 `maxRawTextForAnalysis`；Demo 模式同样经过中间态 |
| `docs/document-intelligence.md` | 更新架构图、用户流程、API 参考、文件支持表、PDF 提取细节、Phase 路线图 |

---

## 4. 完全不动的文件

- `app/page.tsx` — 首页
- `components/visual/BanyanParticleHero/*` — Phase 1 视觉
- `app/universe/*`, `app/visual-lab/*` — Cosmic 占位页
- Phase 2 所有学习页面（dictionary / quiz / study / memory / exam / chat / onboarding）
- Phase 3 AI 层（`lib/ai/*`, `/api/ai/chat` 等）
- `store/learningStore.ts`
- `lib/document/document-validation.ts`, `document-extraction.ts`, `document-analysis-mapper.ts`, `document-question-parser.ts`, `document-vocabulary-extractor.ts`
- `lib/document/providers/mock-document-provider.ts`, `image-ocr-provider.ts`
- `components/scan/DocumentComplianceNotice.tsx`, `DocumentUploadPanel.tsx`, `DocumentProcessingStatus.tsx`, `ExtractedVocabularyPanel.tsx`, `ExtractedQuestionsPanel.tsx`, `StudyNotesPanel.tsx`, `DocumentAnalysisPanel.tsx`
- `/api/ai/document-analysis/route.ts`
- `docs/copyright-compliance.md`

---

## 5. 新增的 Phase 4B 能力

### 5.1 PDF 元数据提取

`pdf-text-provider.ts` 现在读取 `data.info`（pdf-parse 提供）：

| 字段 | pdf-parse 来源 | 说明 |
|---|---|---|
| `title` | `data.info.Title` | PDF 文档标题 |
| `author` | `data.info.Author` | 作者 |
| `subject` | `data.info.Subject` | 主题 |
| `creator` | `data.info.Creator` | 创建工具（如 Word / LaTeX）|
| `producer` | `data.info.Producer` | PDF 生成库 |
| `creationDate` | `data.info.CreationDate` | 原始 PDF 日期字符串 |
| `modificationDate` | `data.info.ModDate` | 最后修改日期 |

所有字段均为可选；空值不包含在响应中；所有字段均为空时 `metadata` 字段为 `null`。

### 5.2 三类提取质量 Warning

| 条件 | Warning 内容 | 影响 |
|---|---|---|
| `usableTextLength < 50` | 扫描件 / 无可选择文本 | "Analyze with AI" 按钮禁用 |
| `pageCount > 100` | 文档过长 | 仅供参考，不禁用分析 |
| `rawText.length > 20,000` | 文本已截断 | 显示截断字符数 |

### 5.3 两步扫描流程

```
extracting → extracted (new) → analyzing → ready
```

新的 `'extracted'` 状态触发 `PDFExtractionInfoPanel`，让用户在触发 AI 分析前：
- 检查提取质量
- 查看 PDF 元数据
- 预览原始提取文本（前 1,000 chars）
- 做出是否分析的决策

### 5.4 rawText 截断逻辑重构

**Phase 4A（问题）：** API 路由将 rawText 截断到 `maxRawTextForAnalysis: 6,000` 后返回给客户端 → 用户无法在预览中看到完整文本

**Phase 4B（修复）：**

| 位置 | 截断上限 | 目的 |
|---|---|---|
| `pdf-text-provider.ts` | `maxExtractedTextLength: 20,000` | 保护内存，全文提取上限 |
| `/api/document/extract` | `maxExtractedTextLength`（兜底安全）| API 层保护 |
| `app/scan/page.tsx` `runAnalysis()` | `maxRawTextForAnalysis: 6,000` | AI 输入前截断 |
| `PDFExtractionInfoPanel` 预览 | `maxTextPreviewLength: 1,000` | UI 显示 |

---

## 6. PDFExtractionInfoPanel 功能说明

| 区块 | 显示条件 | 内容 |
|---|---|---|
| File Info | 始终 | 文件名、类型、提取方式、文本长度、页数（有则显示）|
| PDF Metadata | 至少一个字段有值 | title / author / subject 等 |
| 扫描件警告 | `usableTextLength < 50` | 橙色警告面板，说明 OCR 计划 |
| 长文档警告 | 文本将被 AI 截断 | 黄色提示，说明截断字符数 |
| Extraction Warnings | warnings 数组非空 | 来自 provider 的全部警告 |
| Raw Text Preview | `hasUsableText = true` | 可折叠，显示前 1,000 chars |
| "Analyze with AI" 按钮 | `hasUsableText = true` | 点击后进入 analyzing 状态 |
| "AI analysis requires text" 提示 | `hasUsableText = false` | 替代分析按钮 |
| "Upload Different File" 按钮 | 始终 | 返回 idle 状态 |

---

## 7. 扫描件检测逻辑

```typescript
// 识别内部占位符文本（以 [ 开头、] 结尾的字符串）
const isPlaceholder = rawTrimmed.startsWith('[') && rawTrimmed.endsWith(']')
const usableTextLength = isPlaceholder ? 0 : rawTrimmed.length
const hasUsableText = usableTextLength >= DOCUMENT_CONFIG.minUsableTextLength // 50
```

| 场景 | rawText 值 | `usableTextLength` | 结果 |
|---|---|---|---|
| 正常文本 PDF | 真实文字 | ≥50 | 显示分析按钮 |
| 完全无文本 | `[No extractable text found in PDF]` | 0 | 扫描件警告 |
| 提取失败 | `[PDF extraction failed]` | 0 | 扫描件警告 |
| 极少文本（页码等）| 1-49 chars | 1-49 | 扫描件警告 |

---

## 8. 没有变化的依赖

| 包 | 版本 | 状态 |
|---|---|---|
| `pdf-parse` | v1.x | 已有（Phase 4A 安装），Phase 4B 无新增依赖 |

Phase 4B **不需要安装任何新包**。

---

## 9. Lint / Build 结果

**Lint：✅ 通过（0 错误，0 警告）**

**Build：✅ 通过**
```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 4.4s
✓ TypeScript 0 错误
✓ 24 个页面全部生成（路由表与 Phase 4A 完全一致，无新增路由）
```

---

## 10. 验收标准检查

| 验收项 | 状态 |
|---|---|
| /scan 页面可访问 | ✅ |
| PDF 上传后可提取文本型 PDF 的文本 | ✅ pdf-parse 提取 |
| 图片上传走 safe mock，不崩溃 | ✅ image-ocr-provider skeleton |
| 扫描件 PDF 无文本时有明确 warning | ✅ 橙色警告面板，禁用分析按钮 |
| PDF 页数显示 | ✅ pageCount 字段 |
| PDF metadata 显示（有则显示） | ✅ PDFExtractionInfoPanel metadata 区块 |
| rawText preview 可见 | ✅ 可折叠预览 |
| rawText 可以进入 document analysis | ✅ 用户点击按钮触发 |
| 长文本有截断 / warning | ✅ 三层截断 + warning |
| malformed request 不返回 500 | ✅ 400/413 safe errors |
| provider error 不暴露内部错误 | ✅ console.error server-side only |
| 不破坏 /chat AI | ✅ 未动 |
| 不破坏 /word AI Explain | ✅ 未动 |
| 不破坏 dictionary / quiz / memory / study | ✅ 未动 |
| 不破坏 BanyanParticleHero | ✅ 未动 |
| 不破坏 Cosmic Universe Placeholder | ✅ 未动 |
| npm run lint 通过 | ✅ |
| npm run build 通过 | ✅ |
| docs/document-intelligence.md 更新 | ✅ |
| Phase 4B 报告生成 | ✅ 本报告 |

---

## 11. Phase 4C 建议优先事项

1. **Image OCR** — 接入 Tesseract.js（纯 Node.js，服务端安全）或 Google Cloud Vision API
2. **Quiz draft integration** — `ExtractedQuestionsPanel` 的题目写入 quiz session
3. **文档历史** — session 内支持多次扫描结果浏览

---

*Report generated: 2026-06-01*
