# Phase 4B — Document Intelligence Enhancement: QA Report

**Date:** 2026-06-01  
**Branch:** feat/lexiocean-phase1

---

## Phase 4B: Completed Capabilities

- Two-step scan flow: `extracted` intermediate state between upload and AI analysis
- `PDFExtractionInfoPanel` component: file info, page count, PDF metadata, warnings, raw text preview
- PDF metadata extracted: title, author, subject, creator, producer, creation/modification dates
- Scanned PDF detection: < 50 chars extracted → warning + Analyze button disabled
- Long document warnings: > 100 pages, > 20k chars extracted, > 6k chars to AI
- `/api/document/extract` now returns full `rawText` + `pageCount` + `metadata`
- `DOCUMENT_CONFIG` extended: `minUsableTextLength`, `maxPagesWarningThreshold`, `maxTextPreviewLength`
- `ExtractedDocumentData` type extended: `pageCount`, `metadata: PdfMetadata`

---

## QA Audit Findings (2026-06-01)

### Bug 1 — CRITICAL: pdf-parse v2 API incompatibility

**File:** `lib/document/providers/pdf-text-provider.ts`

**Issue:** `pdf-parse` v2.4.5 exports a `PDFParse` class, not a callable function. The original code used `require('pdf-parse') as (buf: Buffer) => Promise<PdfData>` — a TypeScript cast that silences the type error but throws `TypeError: pdfParse is not a function` at Node.js runtime. Build passes (it's only a cast), but PDF extraction always fails.

**Fix:** Rewrote provider to use `new PDFParse({ data: new Uint8Array(buffer) })` with `parser.getText()` and `parser.getInfo()`, plus a `finally { parser.destroy() }` to release the pdfjs-dist worker thread.

---

### Bug 2 — CRITICAL: MIME validation accepts any `image/*` type

**File:** `lib/document/document-validation.ts`

**Issue:** `getDocumentType` used `mimeType.startsWith('image/')` which accepts `image/gif`, `image/svg+xml`, `image/bmp`, `image/tiff`, etc. — types not in `DOCUMENT_CONFIG.allowedMimeTypes`.

**Fix:** Changed to `ALLOWED_IMAGE_MIME_TYPES.has(mimeType)` where `ALLOWED_IMAGE_MIME_TYPES` is derived from `DOCUMENT_CONFIG.allowedMimeTypes`. Only `image/png`, `image/jpeg`, `image/webp` are accepted.

**Added:** Extension-based guard. File name extension is checked against `DOCUMENT_CONFIG.allowedExtensions` before MIME check, preventing drag-and-drop bypass of browser `accept` attribute.

---

### Bug 3 — MEDIUM: Extract route returns `ok:true` on hard PDF failure

**File:** `app/api/document/extract/route.ts`

**Issue:** When pdf-parse threw (corrupted file, encrypted PDF, etc.), the provider set `rawText = '[PDF extraction failed]'` and the route still returned HTTP 200 `ok:true`. Callers could treat the placeholder as valid text.

**Fix:** Added explicit check: if `result.rawText === '[PDF extraction failed]'`, return HTTP 422 `ok:false` with the provider's English warning as the error message. Scanned PDFs (no text layer but no error) still return 200 with warnings.

---

### Bug 4 — MEDIUM: mistake-analysis 400 error always lists all four field names

**File:** `app/api/ai/mistake-analysis/route.ts`

**Issue:** Error message was hardcoded as `"missing required fields: word, question, userAnswer, correctAnswer"` even when only one field was missing. Debugging is harder than needed.

**Fix:** Added `getMissingFields()` helper that enumerates which specific fields are empty/missing. Error message now reads e.g. `"Entry at index 0 is missing required fields: question"`.

---

### Bug 5 — LOW: Client component imports from server provider directory

**File:** `app/scan/page.tsx`

**Issue:** `import { DEMO_RAW_TEXT_EXPORT } from '@/lib/document/providers/mock-document-provider'` — a `'use client'` component importing from a server-side provider directory. The mock provider doesn't use server-only APIs so this doesn't cause a runtime error, but violates the architectural boundary.

**Fix:**  
- Created `lib/document/demo-text.ts` with the constant (safe for client components)
- `mock-document-provider.ts` now imports from `demo-text.ts`
- `scan/page.tsx` imports `DEMO_RAW_TEXT` from `lib/document/demo-text.ts`
- `DEMO_RAW_TEXT_EXPORT` is re-exported from the mock provider for backward compatibility

---

### Finding 6 — INFORMATIONAL: `client.chat()` injects chat-tutor system prompt

**File:** `app/api/ai/document-analysis/route.ts`

**Issue:** The real provider `chat()` implementations (e.g. `openai-provider.ts` line 46) call `buildChatTutorMessages(messages, context)` before submitting to the LLM. When document analysis is run through `chat()`, the chat-tutor system prompt would be injected — corrupting the document analysis context.

**Resolution:** This is a **mock-only phase**. Added a prominent code comment documenting the limitation. A dedicated `analyzeDocument()` provider method is required before enabling real providers for document analysis (tracked for Phase 4C).

---

### Bug 6 — LOW: Scan-saved questions have empty `userAnswer` and possibly empty `correctAnswer`

**File:** `app/scan/page.tsx`

**Issue:** `handleSaveQuestion` saved `userAnswer: ''` and `correctAnswer: question.answerSuggestion ?? ''`. When `answerSuggestion` is undefined both fields are empty strings. This passes the `WrongAnswer` type (no constraint) but would be rejected by the mistake-analysis API with 400 if those entries are ever sent for analysis. The memory page also renders "Your answer:  ✗" (blank), which is confusing UX.

**Fix:** Use descriptive non-empty placeholders:
- `userAnswer: '(not yet attempted)'`
- `correctAnswer: question.answerSuggestion || '(refer to source document)'`

These satisfy the 4-field non-empty requirement while being semantically honest about the saved state.

---

### Bug 7 — HIGH: Promise.all concurrent PDFParse calls cause DataCloneError

**File:** `lib/document/providers/pdf-text-provider.ts`

**Issue:** `Promise.all([parser.getText(), parser.getInfo()])` runs both methods concurrently on the same PDFParse instance. pdfjs-dist 5.x transfers the ArrayBuffer to its worker on the first call, leaving the buffer detached for the second concurrent call → `DataCloneError: Cannot transfer object of unsupported type`.

**Fix:** Changed to sequential `await parser.getText()` then `await parser.getInfo()`.

---

### Bug 8 — HIGH: pdfjs-dist dynamic worker require fails under Turbopack

**File:** `next.config.ts`

**Issue:** pdfjs-dist 5.x uses a dynamic `require(computedWorkerPath)` to load its worker script. Next.js 16 with Turbopack cannot statically resolve this expression at build time → runtime error: `"Setting up fake worker failed: Cannot find module as expression is too dynamic."` This caused ALL real PDF uploads to fail with 422.

This is the root cause behind what the user observed as "normal PDF → 422".

**Fix:** Added `serverExternalPackages: ['pdf-parse', 'pdfjs-dist']` to `next.config.ts`. This instructs Next.js/Turbopack to skip bundling these packages and use Node.js native `require()` at runtime, which resolves the dynamic path correctly.

**Also required:** A `DOMMatrix` global polyfill must be installed before `require('pdf-parse')` is called. pdfjs-dist 5.x uses `DOMMatrix` for page coordinate transforms; Node.js 24 does not expose it globally. The polyfill (added in `pdf-text-provider.ts`) implements the 2D matrix operations needed for text extraction.

---

## Files Modified

| File | Change type |
|------|------------|
| `lib/document/providers/pdf-text-provider.ts` | Rewrite — pdf-parse v2 API, DOMMatrix polyfill, sequential calls |
| `lib/document/document-validation.ts` | Fix — strict MIME + extension validation |
| `app/api/document/extract/route.ts` | Fix — 422 on hard PDF failure |
| `app/api/ai/mistake-analysis/route.ts` | Fix — specific field names in 400 error |
| `app/scan/page.tsx` | Fix — import from client-safe demo-text; non-empty placeholders for scan-saved questions |
| `app/api/ai/document-analysis/route.ts` | Doc — comment on chat() limitation |
| `lib/document/providers/mock-document-provider.ts` | Refactor — import demo text from shared file |
| `lib/document/demo-text.ts` | **New** — client-safe demo text constant |
| `next.config.ts` | Fix — serverExternalPackages for pdf-parse + pdfjs-dist |
| `docs/document-intelligence.md` | Update — v2 API, validation rules, 422 behavior |

---

## Build & Lint Results

```
npm run lint
→ exit 0 (no errors)

npm run build
→ ✓ Compiled successfully in 2.6s
→ ✓ TypeScript: Finished in 2.9s
→ ✓ 24/24 static pages generated
→ exit 0
```

---

## Smoke Test Results (14/14 passed)

Tests run against live dev server (fresh restart with `serverExternalPackages` config) via Node.js HTTP client:

| # | Test | Result |
|---|------|--------|
| 1 | Real text PDF (Lenovo license) → HTTP 200 | ✓ |
| 2 | Real text PDF → `ok: true` | ✓ |
| 3 | Real text PDF → rawText > 100 chars (actual: 20,000 chars) | ✓ |
| 4 | Real text PDF → `extractionMethod: pdf-parse` | ✓ |
| 5 | Real text PDF → `pageCount: 6` | ✓ |
| 6 | `image/gif` upload → HTTP 400, code `unsupported_type` | ✓ |
| 7 | `image/gif` MIME code check | ✓ |
| 8 | Corrupted PDF → HTTP 422 | ✓ |
| 9 | Corrupted PDF response `ok: false` | ✓ |
| 10 | `mistake-analysis` missing `question` → HTTP 400 | ✓ |
| 11 | Error message contains `"question"` (specific field) | ✓ |
| 12 | Error message does NOT list all 4 fields blindly | ✓ |
| 13 | `/wrong-answers` → HTTP 307/308 redirect | ✓ |
| 14 | `/wrong-answers` `Location` header = `/memory` | ✓ |

**Two-step flow** (code review only — no automated UI test):
- `handleFileUpload` sets `status('extracted')` after successful extraction
- Hard failure → HTTP 422 → `setStatus('error')` → Analyze button never reached
- `PDFExtractionInfoPanel` gates `onAnalyze` behind `hasUsableText` check
- Scanned PDF or placeholder text → `isPlaceholder=true` or `usableTextLength < 50` → button replaced with disabled message

---

## Remaining Limitations / Phase 4C Recommendations

1. **Real provider for document analysis** — needs dedicated `analyzeDocument()` method that bypasses the chat-tutor system prompt in provider `chat()` implementations.

2. **Image OCR** — `image-ocr-provider.ts` returns stub. Phase 4C: integrate Tesseract.js (client/server) or Cloud Vision.

3. **Scanned PDF path** — user sees a warning and cannot proceed. Phase 4C: offer OCR workflow or explicit "upload image directly" guidance.

4. **PDF metadata dates** — `CreationDate` returned as raw PDF date string (e.g. `D:20240101120000+00'00'`). Phase 4C: format to human-readable date in `InfoResult.dates` (pdf-parse v2 provides `DateNode`).

5. **Concurrent requests** — rate limits (10/min for extract, 5/min for analysis) are in-memory per process; not suitable for multi-process deployments. Phase 4D: Redis-backed rate limiting.

6. **`maxExtractedTextLength: 20,000` vs `maxRawTextForAnalysis: 6,000`** — the gap means extracted text is stored in state but only 30% is sent to AI. Phase 4C: consider a chunked analysis approach or increased AI context budget.
