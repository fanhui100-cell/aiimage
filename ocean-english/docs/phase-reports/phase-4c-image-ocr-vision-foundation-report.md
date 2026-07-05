# Phase 4C — Image OCR / Vision Foundation Report

**Date:** 2026-06-01  
**Branch:** feat/lexiocean-phase1

---

## Phase 4C: Completed Capabilities

- `OCRProvider` interface with `OCRInput` / `OCRResult` / `OCRExtractionMethod` types
- `MockOCRProvider` — deterministic demo text, confidence 0.85, full pipeline coverage
- `GeminiVisionOCRProvider` + `OpenAIVisionOCRProvider` — ready-to-activate skeletons with inline implementation comments
- `createVisionOCRProvider()` factory — reads `AI_PROVIDER` env var, returns provider or null
- `image-ocr-provider.ts` rewritten — Vision → mock fallback, confidence warning, length cap
- `ImageOCRInfoPanel` component — shows OCR method, confidence, warnings, collapsible text preview, Analyze button
- `PDFExtractionInfoPanel` updated — scanned PDF now shows "export as image" guidance
- `/api/document/extract` — now returns `confidence` field; image path fully functional
- `ExtractedDocumentData.confidence?: number` — backward-compatible new field
- `ExtractionMethod` extended — `'mock-ocr'` and `'vision-ocr'` added
- `DOCUMENT_CONFIG.ocrConfidenceWarningThreshold = 0.6` — low-confidence warning threshold
- `docs/document-intelligence.md` — OCR Provider Architecture section added
- `docs/copyright-compliance.md` — Image OCR data handling and Vision API safety rules added

---

## New Files

| File | Purpose |
|------|---------|
| `lib/document/providers/ocr-types.ts` | `OCRProvider`, `OCRInput`, `OCRResult`, `OCRExtractionMethod` |
| `lib/document/providers/mock-ocr-provider.ts` | Mock OCR — demo text, confidence 0.85 |
| `lib/document/providers/vision-ocr-provider.ts` | Gemini + OpenAI Vision skeletons + factory |
| `components/scan/ImageOCRInfoPanel.tsx` | Image OCR result panel for /scan page |

## Modified Files

| File | Change |
|------|--------|
| `types/document.ts` | `confidence?: number`; `ExtractionMethod` extended |
| `lib/document/document-config.ts` | `ocrConfidenceWarningThreshold: 0.6` |
| `lib/document/providers/image-ocr-provider.ts` | Full OCR pipeline — Vision → mock fallback |
| `lib/document/document-extraction.ts` | `mimeType` field added to `DocumentExtractionInput` |
| `app/api/document/extract/route.ts` | `confidence` in response; `mimeType` forwarded |
| `components/scan/PDFExtractionInfoPanel.tsx` | Scanned PDF "export as image" suggestion |
| `app/scan/page.tsx` | `ImageOCRInfoPanel` imported; `fileType === 'image'` fork |
| `docs/document-intelligence.md` | OCR architecture section |
| `docs/copyright-compliance.md` | Image OCR compliance rules |

---

## Technical Decisions

### No new npm dependencies

All real Vision API providers (`@google/generative-ai`, `openai`) and Tesseract.js are deferred to Phase 4D. Phase 4C only requires the skeleton structure and mock path — zero new packages, zero build risk.

### OCR provider bound to `AI_PROVIDER`

Vision provider selection reuses the existing `AI_PROVIDER` env var (not a separate `OCR_PROVIDER`). When `AI_PROVIDER=gemini`, `GeminiVisionOCRProvider` is instantiated. Since it throws `notImplemented()`, the `image-ocr-provider.ts` catch block falls back to `MockOCRProvider` automatically. This means the mock path works for all `AI_PROVIDER` values in Phase 4C.

### Scanned PDF fallback: guidance only

Automatic PDF → image conversion requires `sharp` or `canvas` (native modules, install risk). Phase 4C adds a visible guidance message in `PDFExtractionInfoPanel` suggesting users export pages as PNG/JPG and re-upload. Automatic conversion is tracked for Phase 4D.

### `ImageOCRInfoPanel` vs extending `PDFExtractionInfoPanel`

Created as a separate component to keep concerns isolated: image OCR results differ structurally (no pageCount/metadata, has confidence). The `/scan` page forks on `fileType === 'image'`. Existing PDF path is unchanged.

---

## Lint / Build Results

```
npm run lint
→ 0 errors, 2 warnings (intentionally unused _ params in notImplemented stubs)
→ exit 0

npm run build  
→ ✓ TypeScript clean
→ ✓ 24/24 static pages
→ exit 0
```

---

## Smoke Test Results — 16/16 passed

| # | Test | Result |
|---|------|--------|
| 1 | PNG upload → HTTP 200 | ✓ |
| 2 | PNG upload → `ok: true` | ✓ |
| 3 | PNG upload → `fileType: image` | ✓ |
| 4 | PNG upload → `extractionMethod: mock-ocr` | ✓ |
| 5 | PNG upload → rawText populated (353 chars demo text) | ✓ |
| 6 | PNG upload → `confidence: 0.85` in response | ✓ |
| 7 | PNG upload → warnings array non-empty | ✓ |
| 8 | Real PDF (Lenovo license) → HTTP 200 | ✓ |
| 9 | Real PDF → `ok: true` | ✓ |
| 10 | Real PDF → `fileType: pdf` | ✓ |
| 11 | Real PDF → `extractionMethod: pdf-parse` | ✓ |
| 12 | Real PDF → rawText > 1000 chars | ✓ |
| 13 | `image/gif` → HTTP 400 | ✓ |
| 14 | `image/gif` → `code: unsupported_type` | ✓ |
| 15 | `/wrong-answers` → 307/308 | ✓ |
| 16 | `/wrong-answers` → `Location: /memory` | ✓ |

---

## Phase 4D Recommendations

1. **Activate Gemini Vision OCR** — install `@google/generative-ai`, uncomment implementation in `vision-ocr-provider.ts`, set `AI_PROVIDER=gemini` + `GEMINI_API_KEY`
2. **Activate OpenAI Vision OCR** — install `openai`, uncomment implementation, set `AI_PROVIDER=openai` + `OPENAI_API_KEY`
3. **Tesseract.js local OCR** — evaluate WASM bundle size and Node.js worker compatibility before adding
4. **Scanned PDF auto-conversion** — use `sharp` to render PDF pages as images for automatic OCR fallback
5. **Real `analyzeDocument()` provider method** — document analysis route currently uses `client.chat()` which injects chat-tutor system prompt; needs a dedicated method
6. **OCR confidence from real API** — Gemini Vision does not natively return a confidence score; consider parsing output quality heuristically or using a dedicated OCR service (Google Cloud Vision) that returns per-character confidence
