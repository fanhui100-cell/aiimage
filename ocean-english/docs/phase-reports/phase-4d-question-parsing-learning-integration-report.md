# Phase 4D — AI Question Parsing + Learning Integration Report

**Date:** 2026-06-01  
**Branch:** feat/lexiocean-phase1

---

## Phase 4D: Completed Capabilities

- **`ScanQuizDraft` type** — structured quiz draft from document analysis (AI suggestion + compliance warning)
- **`ScanStudyNote` type** — study note extracted from AI analysis output
- **`scanStore`** — independent Zustand persist store (`lexiocean-scan`) for quiz drafts + study notes, 100-item cap, dedup by prompt+fileName
- **`ExtractedQuestionsPanel`** enhanced — two actions per question: "Save as Quiz Draft (+Draft)" and "Save as Difficult (Difficult)"; AI suggestion compliance disclaimer on every answer reveal
- **`ExtractedVocabularyPanel`** enhanced — accepts `alreadyInReview` prop; shows "✓ In Review" for pre-existing words, "✓ Added" for session-added words, "+ Review" for untracked
- **`StudyNotesPanel`** enhanced — "+ Save Note" button per study note; calls `onSaveNote` callback
- **`QuizDraftPreview`** — shows saved drafts list for current document; "Start Practice" opens inline practice mode
- **`ScanPracticeMode`** — minimal question-by-question flashcard: show question, reveal AI suggestion on demand, navigate with Prev/Next, finish button; AI disclaimer on each reveal
- **`DocumentAnalysisPanel`** updated — passes new callbacks; renders `QuizDraftPreview` when drafts exist
- **`app/scan/page.tsx`** updated — wires `scanStore` actions + `learningStore` XP/task updates on all new interactions; computes `alreadyInReview` from persistent `reviewWords`; `currentDrafts` derived from store
- **`app/study/page.tsx`** updated — "Recent Scan Notes" section (latest 5, with remove button)
- **`docs/document-intelligence.md`** — Phase Roadmap updated

---

## New Files

| File | Purpose |
|------|---------|
| `types/scan-learning.ts` | `ScanQuizDraft`, `ScanStudyNote`, `SaveScanActionResult` |
| `store/scanStore.ts` | Scan-specific Zustand persist store |
| `components/scan/QuizDraftPreview.tsx` | Quiz draft list + Start Practice button |
| `components/scan/ScanPracticeMode.tsx` | Inline flashcard practice mode |

## Modified Files

| File | Change |
|------|--------|
| `components/scan/ExtractedQuestionsPanel.tsx` | `+Draft` + `Difficult` buttons; AI disclaimer |
| `components/scan/ExtractedVocabularyPanel.tsx` | `alreadyInReview` prop; three-state button |
| `components/scan/StudyNotesPanel.tsx` | `+Save Note` button |
| `components/scan/DocumentAnalysisPanel.tsx` | New callbacks + `QuizDraftPreview` |
| `app/scan/page.tsx` | `scanStore` integration; `alreadyInReview` derivation |
| `app/study/page.tsx` | Recent Scan Notes section |
| `docs/document-intelligence.md` | Phase roadmap updated |

---

## Architecture Decisions

### Independent `scanStore` — no learningStore migration risk

The existing `learningStore` has `migrate: () => INITIAL_STATE` — any version bump wipes user data. Phase 4D keeps the learning store completely unchanged and stores all new scan-specific data in `store/scanStore.ts` with its own `name: 'lexiocean-scan'` key.

### No new API routes

All save actions (quiz draft, difficult question, study note, vocabulary) are client-side Zustand operations. The existing `/api/ai/document-analysis` already outputs the structured data needed. Adding a separate `/api/ai/question-parsing` would add complexity without benefit.

### `alreadyInReview` dedup

The scan page computes `new Set(reviewWords.map(r => r.wordId))` from the persistent store and passes it to `ExtractedVocabularyPanel`. Words already tracked by the spaced repetition engine show a "✓ In Review" state instead of offering "+Review" again. The `addToReview` store action already silently deduplicates, but the visual feedback was missing in Phase 4A-4C.

### Practice Mode: show/reveal only (no scoring)

`ScanPracticeMode` shows the question, user thinks about it, then reveals the AI suggestion. No answer input, no scoring, no automatic wrong-answer recording. This keeps the practice mode honest (AI suggestions are not official answers) and avoids polluting `wrongAnswers` with auto-generated incorrect entries.

### AI suggestion compliance

Every answer reveal in both `ExtractedQuestionsPanel` and `ScanPracticeMode` shows:
> ⚠ AI-generated suggestion. Not an official answer. Verify before using for exam practice.

The `ScanQuizDraft.copyrightWarning` field forwards any copyright warnings from `DocumentAnalysisResult.warnings` to the draft, so the warning persists even after the analysis session ends.

---

## Lint / Build Results

```
npm run lint → 0 errors, 0 warnings
npm run build → TypeScript clean, 24/24 pages, exit 0
```

---

## Smoke Test Results — 19/19 passed

| # | Test | Result |
|---|------|--------|
| 1 | /scan page HTTP 200 | ✓ |
| 2 | /study page HTTP 200 | ✓ |
| 3 | PNG mock-ocr HTTP 200 ok:true | ✓ |
| 4 | Real PDF HTTP 200 ok:true | ✓ |
| 5 | Real PDF extractionMethod:pdf-parse | ✓ |
| 6 | Real PDF rawText > 1000 chars | ✓ |
| 7 | GIF HTTP 400 | ✓ |
| 8 | document-analysis HTTP 200 ok:true | ✓ |
| 9 | document-analysis returns questions array | ✓ |
| 10 | document-analysis returns vocabulary array | ✓ |
| 11 | document-analysis returns studyNotes array | ✓ |
| 12 | document-analysis: 3 questions, 7 vocab, 2 notes | ✓ |
| 13 | mistake-analysis missing question → HTTP 400 | ✓ |
| 14 | mistake-analysis error message contains "question" | ✓ |
| 15 | /wrong-answers → 307/308 | ✓ |
| 16 | /wrong-answers Location: /memory | ✓ |
| + 3 additional from Phase 4C regression suite | ✓ |

---

## Phase 4E Recommendations

1. **Real Vision OCR** — uncomment `GeminiVisionOCRProvider.extractText()`, install `@google/generative-ai`, set `AI_PROVIDER=gemini`
2. **Real document analysis provider** — add `analyzeDocument()` method to `AIProvider` interface that bypasses the chat-tutor system prompt in `client.chat()`
3. **Quiz draft → /quiz integration** — build a `ScanQuizRunner` page or route (`/quiz?source=scan`) that adapts `ScanQuizDraft[]` into the quiz engine; requires extending `QuizQuestion` or using a parallel flow
4. **`wrongAnswers` → mistake-analysis** — scan-sourced difficult questions currently have `userAnswer: '(not yet attempted)'`; add a filter in the mistake-analysis call to skip entries without real answers, or offer a dedicated "Review Difficult Questions" flow
5. **scanStudyNotes → export** — allow users to export saved notes as plain text or copy to clipboard from `/study`
6. **ScanQuizDraft dedup by content hash** — current dedup is by `prompt+fileName`; collisions possible if the same prompt appears across different source documents
