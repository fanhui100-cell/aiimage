# Phase 4E: Scan History + Local Document Library — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only scan history and document library to LexiOcean, so users can save, browse, search, and re-interact with previous document analyses — all stored in localStorage, no cloud, no original files retained.

**Architecture:** New independent Zustand store (`useScanHistoryStore`) persisted to `lexiocean-scan-history` v1. Two new pages: `/scan/history` (list) and `/scan/history/[documentId]` (detail). The detail page reuses existing `ExtractedVocabularyPanel` and `ExtractedQuestionsPanel` verbatim (with minor prop additions); study notes are rendered inline. The `/scan` page gains a manual "Save to Library" button.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand + persist middleware, TypeScript, localStorage. All inline styles matching existing dark-ocean design system (`--bg-deep`, `#ECFBFF`, `#38BDF8`, `#34D399`).

---

## Confirmed Design Decisions

| # | Decision |
|---|---------|
| 1 | History limit: 50 docs. When full, return `'storage-full'` — prompt user to delete. No auto-delete. |
| 2 | `rawTextPreview` max length: 3000 chars. |
| 3 | Save is manual — user clicks "Save to Library" button. Not automatic. |
| 4 | Detail page Study Notes come from stored `ScanDocumentLibraryDetail.studyNotes` (mapped at save-time from `DocumentAnalysisResult.studyNotes`). Saving them calls `scanStore.addScanStudyNote`. |
| 5 | `ExtractedQuestionsPanel` gets `preExistingSavedDraftIds` + `preExistingDifficultIds` props for history pre-population. |
| 6 | Clear-all uses inline confirmation UI (not `window.confirm`). |
| 7 | History link only in `/scan` page footer — not in Navbar. |

---

## File Map

**New files:**
```
ocean-english/types/scan-history.ts
ocean-english/store/useScanHistoryStore.ts
ocean-english/components/scan/history/ScanHistorySaveButton.tsx
ocean-english/components/scan/history/ScanHistoryCard.tsx
ocean-english/components/scan/history/ScanHistoryFilters.tsx
ocean-english/components/scan/history/ScanHistoryEmptyState.tsx
ocean-english/components/scan/history/ScanHistoryDetailClient.tsx
ocean-english/app/scan/history/page.tsx
ocean-english/app/scan/history/[documentId]/page.tsx
ocean-english/docs/phase-reports/phase-4e-scan-history-local-library-report.md
```

**Modified files:**
```
ocean-english/components/scan/ExtractedQuestionsPanel.tsx   ← add preExistingSaved* props
ocean-english/app/scan/page.tsx                             ← add Save button + History link
ocean-english/docs/document-intelligence.md                 ← architecture update
ocean-english/docs/copyright-compliance.md                  ← privacy section
```

**Untouched:**
```
store/learningStore.ts, store/scanStore.ts
types/document.ts, types/scan-learning.ts, types/learning.ts
lib/document/**, app/api/**
components/scan/ExtractedVocabularyPanel.tsx
components/scan/DocumentAnalysisPanel.tsx
components/scan/StudyNotesPanel.tsx
components/scan/QuizDraftPreview.tsx
components/scan/ScanPracticeMode.tsx
components/layout/**
app/chat, app/word, app/quiz, app/study, app/memory, app/wrong-answers
app/universe, app/visual-lab
```

---

## Task 1: types/scan-history.ts

**Files:**
- Create: `ocean-english/types/scan-history.ts`

- [ ] **Step 1: Create the file**

```typescript
// types/scan-history.ts
import type { ExtractedQuestion, ExtractedVocabulary, UploadedDocumentType } from './document'
import type { ScanStudyNote } from './scan-learning'

export type ScanDocumentStatus =
  | 'analyzed'
  | 'partially-analyzed'
  | 'needs-ocr'
  | 'error'

export interface ScanDocumentLibraryItem {
  id: string                      // = client documentId generated in /scan page
  fileName: string
  fileType: UploadedDocumentType
  status: ScanDocumentStatus
  extractionMethod: string
  createdAt: string
  updatedAt: string

  summaryEn?: string
  summaryZh?: string

  rawTextPreview?: string         // first 3000 chars of rawText only
  rawTextLength?: number          // full length of original rawText
  pageCount?: number
  confidence?: number

  questionCount: number
  vocabularyCount: number
  studyNoteCount: number
  warningCount: number

  reviewWordsAddedCount: number
  quizDraftsSavedCount: number
  wrongAnswersSavedCount: number
  studyNotesSavedCount: number

  warnings: string[]
}

export interface ScanDocumentLibraryDetail extends ScanDocumentLibraryItem {
  questions: ExtractedQuestion[]
  vocabulary: ExtractedVocabulary[]
  studyNotes: ScanStudyNote[]     // pre-populated with documentId/sourceFileName at save time
  answerSuggestions: { questionId: string; suggestion: string; explanationZh?: string }[]
}

export interface ScanHistoryFilter {
  query: string
  fileType: 'all' | 'pdf' | 'image' | 'text'
  hasWarnings: boolean
  hasQuestions: boolean
  hasVocabulary: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd d:/ai-studio/ocean-english
npx tsc --noEmit --project tsconfig.json 2>&1 | Select-String "scan-history"
```

Expected: no errors referencing `scan-history.ts`.

- [ ] **Step 3: Commit**

```powershell
git add types/scan-history.ts
git commit -m "feat(4e): add scan-history types — ScanDocumentLibraryItem/Detail/Filter"
```

---

## Task 2: store/useScanHistoryStore.ts

**Files:**
- Create: `ocean-english/store/useScanHistoryStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// store/useScanHistoryStore.ts
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { DocumentAnalysisResult, UploadedDocumentType } from '@/types/document'
import type { ScanStudyNote } from '@/types/scan-learning'
import type {
  ScanDocumentLibraryDetail,
  ScanDocumentLibraryItem,
  ScanDocumentStatus,
  ScanHistoryFilter,
} from '@/types/scan-history'

const MAX_SCAN_HISTORY = 50
const MAX_RAW_TEXT_PREVIEW = 3000

export type SaveScanDocumentResult = 'saved' | 'already-exists' | 'storage-full' | 'error'

interface SaveMeta {
  documentId: string
  extractionMethod: string
  fileType: UploadedDocumentType
  pageCount?: number
  confidence?: number
}

const DEFAULT_FILTERS: ScanHistoryFilter = {
  query: '',
  fileType: 'all',
  hasWarnings: false,
  hasQuestions: false,
  hasVocabulary: false,
}

interface ScanHistoryStore {
  scanDocuments: ScanDocumentLibraryDetail[]
  scanHistoryFilters: ScanHistoryFilter
  lastSavedScanDocumentId: string | null

  saveScanDocument(result: DocumentAnalysisResult, meta: SaveMeta): SaveScanDocumentResult
  updateScanDocument(id: string, patch: Partial<ScanDocumentLibraryItem>): void
  deleteScanDocument(id: string): void
  clearScanHistory(): void
  getScanDocumentById(id: string): ScanDocumentLibraryDetail | undefined
  getFilteredDocuments(): ScanDocumentLibraryDetail[]
  markVocabularyAdded(documentId: string, count: number): void
  markQuizDraftsSaved(documentId: string, count: number): void
  markWrongAnswersSaved(documentId: string, count: number): void
  markStudyNotesSaved(documentId: string, count: number): void
  setFilters(filters: Partial<ScanHistoryFilter>): void
}

function inferStatus(meta: SaveMeta, warnings: string[]): ScanDocumentStatus {
  if (meta.extractionMethod === 'mock-ocr') return 'needs-ocr'
  if (warnings.some(w => /scanned|no.*text|ocr required/i.test(w))) return 'needs-ocr'
  if (meta.confidence !== undefined && meta.confidence < 0.6) return 'partially-analyzed'
  return 'analyzed'
}

function buildDetail(result: DocumentAnalysisResult, meta: SaveMeta): ScanDocumentLibraryDetail {
  const now = new Date().toISOString()
  const studyNotes: ScanStudyNote[] = result.studyNotes.map((note, i) => ({
    id: `note-${meta.documentId}-${i}`,
    documentId: meta.documentId,
    sourceFileName: result.fileName,
    title: note.title,
    titleZh: note.titleZh,
    content: note.content,
    contentZh: note.contentZh,
    createdAt: now,
  }))

  return {
    id: meta.documentId,
    fileName: result.fileName,
    fileType: meta.fileType,
    status: inferStatus(meta, result.warnings),
    extractionMethod: meta.extractionMethod,
    createdAt: now,
    updatedAt: now,

    summaryEn: result.summaryEn,
    summaryZh: result.summaryZh,

    rawTextPreview: result.rawText.slice(0, MAX_RAW_TEXT_PREVIEW),
    rawTextLength: result.rawText.length,
    pageCount: meta.pageCount,
    confidence: meta.confidence,

    questionCount: result.questions.length,
    vocabularyCount: result.vocabulary.length,
    studyNoteCount: result.studyNotes.length,
    warningCount: result.warnings.length,

    reviewWordsAddedCount: 0,
    quizDraftsSavedCount: 0,
    wrongAnswersSavedCount: 0,
    studyNotesSavedCount: 0,

    warnings: result.warnings,
    questions: result.questions,
    vocabulary: result.vocabulary,
    studyNotes,
    answerSuggestions: result.answerSuggestions.map(a => ({
      questionId: a.questionId,
      suggestion: a.suggestion,
      explanationZh: a.explanationZh,
    })),
  }
}

const INITIAL_STATE = {
  scanDocuments: [] as ScanDocumentLibraryDetail[],
  scanHistoryFilters: DEFAULT_FILTERS,
  lastSavedScanDocumentId: null as string | null,
}

export const useScanHistoryStore = create<ScanHistoryStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      saveScanDocument: (result, meta) => {
        const { scanDocuments } = get()
        if (scanDocuments.some(d => d.id === meta.documentId)) return 'already-exists'
        if (scanDocuments.length >= MAX_SCAN_HISTORY) return 'storage-full'
        try {
          const detail = buildDetail(result, meta)
          set(s => ({
            scanDocuments: [detail, ...s.scanDocuments],
            lastSavedScanDocumentId: meta.documentId,
          }))
          return 'saved'
        } catch {
          return 'error'
        }
      },

      updateScanDocument: (id, patch) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d,
          ),
        })),

      deleteScanDocument: id =>
        set(s => ({ scanDocuments: s.scanDocuments.filter(d => d.id !== id) })),

      clearScanHistory: () => set({ scanDocuments: [], lastSavedScanDocumentId: null }),

      getScanDocumentById: id => get().scanDocuments.find(d => d.id === id),

      getFilteredDocuments: () => {
        const { scanDocuments, scanHistoryFilters: f } = get()
        return scanDocuments.filter(d => {
          if (f.query) {
            const q = f.query.toLowerCase()
            const matches =
              d.fileName.toLowerCase().includes(q) ||
              (d.summaryEn?.toLowerCase().includes(q) ?? false) ||
              (d.summaryZh?.toLowerCase().includes(q) ?? false)
            if (!matches) return false
          }
          if (f.fileType !== 'all' && d.fileType !== f.fileType) return false
          if (f.hasWarnings && d.warningCount === 0) return false
          if (f.hasQuestions && d.questionCount === 0) return false
          if (f.hasVocabulary && d.vocabularyCount === 0) return false
          return true
        })
      },

      markVocabularyAdded: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, reviewWordsAddedCount: d.reviewWordsAddedCount + count }
              : d,
          ),
        })),

      markQuizDraftsSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, quizDraftsSavedCount: d.quizDraftsSavedCount + count }
              : d,
          ),
        })),

      markWrongAnswersSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, wrongAnswersSavedCount: d.wrongAnswersSavedCount + count }
              : d,
          ),
        })),

      markStudyNotesSaved: (documentId, count) =>
        set(s => ({
          scanDocuments: s.scanDocuments.map(d =>
            d.id === documentId
              ? { ...d, studyNotesSavedCount: d.studyNotesSavedCount + count }
              : d,
          ),
        })),

      setFilters: filters =>
        set(s => ({ scanHistoryFilters: { ...s.scanHistoryFilters, ...filters } })),
    }),
    {
      name: 'lexiocean-scan-history',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({ ...INITIAL_STATE }),
      partialize: state => ({
        scanDocuments: state.scanDocuments,
        scanHistoryFilters: state.scanHistoryFilters,
        lastSavedScanDocumentId: state.lastSavedScanDocumentId,
      }),
    },
  ),
)
```

- [ ] **Step 2: Verify TypeScript**

```powershell
npx tsc --noEmit 2>&1 | Select-String "useScanHistoryStore|scan-history"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add types/scan-history.ts store/useScanHistoryStore.ts
git commit -m "feat(4e): add useScanHistoryStore — persist scan doc library to localStorage"
```

---

## Task 3: ExtractedQuestionsPanel — add preExistingSaved props

**Files:**
- Modify: `ocean-english/components/scan/ExtractedQuestionsPanel.tsx`

The panel currently tracks `savedDraft` and `savedDifficult` as local `Set<string>` of `q.id`. Add two optional props so the history detail page can pre-populate these from the persistent store.

- [ ] **Step 1: Add the props to the interface and useState initializers**

In `ExtractedQuestionsPanel.tsx`, change:

```typescript
// OLD interface:
interface ExtractedQuestionsPanelProps {
  questions: ExtractedQuestion[]
  sourceFileName: string
  documentId: string
  onSaveAsDraft: (draft: ScanQuizDraft) => void
  analysisWarnings?: string[]
}
```

```typescript
// NEW interface (add two optional props):
interface ExtractedQuestionsPanelProps {
  questions: ExtractedQuestion[]
  sourceFileName: string
  documentId: string
  onSaveAsDraft: (draft: ScanQuizDraft) => void
  analysisWarnings?: string[]
  /** Pre-existing question IDs already saved as drafts (from persistent store) */
  preExistingSavedDraftIds?: Set<string>
  /** Pre-existing question IDs already saved as difficult (from persistent store) */
  preExistingDifficultIds?: Set<string>
}
```

Then in the component function signature and useState:

```typescript
// OLD:
export function ExtractedQuestionsPanel({
  questions,
  sourceFileName,
  documentId,
  onSaveAsDraft,
  analysisWarnings,
}: ExtractedQuestionsPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [savedDraft, setSavedDraft] = useState<Set<string>>(new Set())
  const [savedDifficult, setSavedDifficult] = useState<Set<string>>(new Set())
```

```typescript
// NEW:
export function ExtractedQuestionsPanel({
  questions,
  sourceFileName,
  documentId,
  onSaveAsDraft,
  analysisWarnings,
  preExistingSavedDraftIds,
  preExistingDifficultIds,
}: ExtractedQuestionsPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [savedDraft, setSavedDraft] = useState<Set<string>>(
    () => preExistingSavedDraftIds ?? new Set(),
  )
  const [savedDifficult, setSavedDifficult] = useState<Set<string>>(
    () => preExistingDifficultIds ?? new Set(),
  )
```

- [ ] **Step 2: Verify no regressions on /scan page**

The `/scan` page passes no `preExistingSaved*` props — default `undefined` → empty Sets. Behavior identical to before.

Run lint:
```powershell
npx eslint components/scan/ExtractedQuestionsPanel.tsx --max-warnings 0
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add components/scan/ExtractedQuestionsPanel.tsx
git commit -m "feat(4e): ExtractedQuestionsPanel — add preExistingSaved props for history page"
```

---

## Task 4: ScanHistorySaveButton component

**Files:**
- Create: `ocean-english/components/scan/history/ScanHistorySaveButton.tsx`

This component is used by `/scan` page to save the current analysis result to history.

- [ ] **Step 1: Create the component**

```typescript
// components/scan/history/ScanHistorySaveButton.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import type { DocumentAnalysisResult, UploadedDocumentType } from '@/types/document'

interface ScanHistorySaveButtonProps {
  analysisResult: DocumentAnalysisResult
  documentId: string
  extractionMethod: string
  fileType: UploadedDocumentType
  pageCount?: number
  confidence?: number
}

type SaveState = 'idle' | 'saved' | 'already-exists' | 'storage-full' | 'error'

const MESSAGE: Record<SaveState, { en: string; zh: string; color: string }> = {
  idle: { en: '', zh: '', color: '' },
  saved: {
    en: '✓ Saved to Scan Library',
    zh: '已保存到扫描库',
    color: '#34D399',
  },
  'already-exists': {
    en: '✓ Already saved',
    zh: '已保存',
    color: '#34D399',
  },
  'storage-full': {
    en: 'Library full (50 docs). Delete older records to save more.',
    zh: '扫描库已满（50 条）。请删除旧记录后重试。',
    color: '#FFD76A',
  },
  error: {
    en: 'Unable to save scan history locally. Please delete older records and try again.',
    zh: '无法保存扫描历史，请删除旧记录后重试。',
    color: '#F87171',
  },
}

export function ScanHistorySaveButton({
  analysisResult,
  documentId,
  extractionMethod,
  fileType,
  pageCount,
  confidence,
}: ScanHistorySaveButtonProps) {
  const { saveScanDocument, lastSavedScanDocumentId, scanDocuments } = useScanHistoryStore()
  const [saveState, setSaveState] = useState<SaveState>(() => {
    // If already saved in this or a previous session, show correct state
    return scanDocuments.some(d => d.id === documentId) ? 'already-exists' : 'idle'
  })

  const isSaved = saveState === 'saved' || saveState === 'already-exists'

  function handleSave() {
    if (isSaved) return
    const result = saveScanDocument(analysisResult, {
      documentId,
      extractionMethod,
      fileType,
      pageCount,
      confidence,
    })
    setSaveState(result === 'saved' ? 'saved' : result)
  }

  const msg = MESSAGE[saveState]
  const count = scanDocuments.length

  return (
    <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
        <button
          onClick={handleSave}
          disabled={isSaved}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            background: isSaved ? 'rgba(52,211,153,0.08)' : 'rgba(56,189,248,0.12)',
            border: `1px solid ${isSaved ? 'rgba(52,211,153,0.35)' : 'rgba(56,189,248,0.4)'}`,
            color: isSaved ? '#34D399' : '#38BDF8',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isSaved ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isSaved ? '✓ Saved to Scan Library / 已保存到扫描库' : '+ Save to Scan Library / 保存到扫描库'}
        </button>

        <Link
          href="/scan/history"
          style={{
            fontSize: '12px',
            color: '#38BDF8',
            textDecoration: 'none',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          View Scan History →
        </Link>
      </div>

      {saveState !== 'idle' && msg.en && (
        <div style={{ fontSize: '12px', color: msg.color, marginBottom: '4px' }}>
          {msg.en} / {msg.zh}
        </div>
      )}

      <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)', lineHeight: 1.5 }}>
        Scan history is stored locally in this browser. Original files are not stored.
        {count > 0 && ` (${count}/50 documents stored)`}
        <br />
        <span style={{ color: 'rgba(155,191,202,0.35)' }}>
          扫描历史仅保存在当前浏览器本地，系统不会保存原始上传文件。
        </span>
      </div>

      {/* Show storage-full warning if approaching limit */}
      {count >= 45 && count < 50 && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#FFD76A' }}>
          ⚠ Approaching library limit ({count}/50). Consider deleting older records.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify lint**

```powershell
npx eslint components/scan/history/ScanHistorySaveButton.tsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```powershell
git add components/scan/history/ScanHistorySaveButton.tsx
git commit -m "feat(4e): ScanHistorySaveButton — save analysis to local library from /scan"
```

---

## Task 5: Modify app/scan/page.tsx

**Files:**
- Modify: `ocean-english/app/scan/page.tsx`

Add the `ScanHistorySaveButton` in the ready state, and update the footer links.

- [ ] **Step 1: Add import at top of file**

After the existing imports, add:
```typescript
import { ScanHistorySaveButton } from '@/components/scan/history/ScanHistorySaveButton'
```

- [ ] **Step 2: Replace the `status === 'ready'` block and footer**

Find this block:
```tsx
          {status === 'ready' && analysisResult && (
            <DocumentAnalysisPanel
              result={analysisResult}
              documentId={documentId}
              onAddToReview={handleAddToReview}
              onSaveAsDraft={handleSaveAsDraft}
              onSaveNote={handleSaveNote}
              onReset={handleReset}
              onPracticeFinish={handlePracticeFinish}
              alreadyInReview={alreadyInReview}
              quizDrafts={currentDrafts}
              onRemoveDraft={removeScanQuizDraft}
            />
          )}

          <div style={{ marginTop: '40px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Home / 返回首页
            </Link>
          </div>
```

Replace with:
```tsx
          {status === 'ready' && analysisResult && (
            <>
              <DocumentAnalysisPanel
                result={analysisResult}
                documentId={documentId}
                onAddToReview={handleAddToReview}
                onSaveAsDraft={handleSaveAsDraft}
                onSaveNote={handleSaveNote}
                onReset={handleReset}
                onPracticeFinish={handlePracticeFinish}
                alreadyInReview={alreadyInReview}
                quizDrafts={currentDrafts}
                onRemoveDraft={removeScanQuizDraft}
              />
              <ScanHistorySaveButton
                analysisResult={analysisResult}
                documentId={documentId}
                extractionMethod={extractedDoc?.extractionMethod ?? 'mock'}
                fileType={extractedDoc?.fileType ?? analysisResult.fileType}
                pageCount={extractedDoc?.pageCount}
                confidence={extractedDoc?.confidence}
              />
            </>
          )}

          <div style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Home / 返回首页
            </Link>
            <Link href="/scan/history" style={{ fontSize: '13px', color: 'rgba(56,189,248,0.7)', textDecoration: 'none' }}>
              View Scan History / 查看扫描历史 →
            </Link>
          </div>
```

- [ ] **Step 3: Verify lint on scan page**

```powershell
npx eslint app/scan/page.tsx --max-warnings 0
```

- [ ] **Step 4: Commit**

```powershell
git add app/scan/page.tsx
git commit -m "feat(4e): /scan page — add Save to Library button and History link"
```

---

## Task 6: History UI components

**Files:**
- Create: `ocean-english/components/scan/history/ScanHistoryCard.tsx`
- Create: `ocean-english/components/scan/history/ScanHistoryFilters.tsx`
- Create: `ocean-english/components/scan/history/ScanHistoryEmptyState.tsx`
- Create: `ocean-english/components/scan/history/ScanHistoryDetailClient.tsx`

### 6a: ScanHistoryCard

- [ ] **Step 1: Create ScanHistoryCard.tsx**

```typescript
// components/scan/history/ScanHistoryCard.tsx
'use client'

import Link from 'next/link'
import type { ScanDocumentLibraryDetail } from '@/types/scan-history'

interface ScanHistoryCardProps {
  doc: ScanDocumentLibraryDetail
  onDelete: (id: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  analyzed: '#34D399',
  'partially-analyzed': '#FFD76A',
  'needs-ocr': '#F97316',
  error: '#F87171',
}

const FILETYPE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  image: 'Image',
  text: 'Text',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function truncate(str: string | undefined, max: number): string {
  if (!str) return ''
  return str.length <= max ? str : str.slice(0, max) + '…'
}

export function ScanHistoryCard({ doc, onDelete }: ScanHistoryCardProps) {
  const statusColor = STATUS_COLORS[doc.status] ?? '#9BBFCA'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(155,191,202,0.12)',
      borderRadius: '12px',
      padding: '16px 18px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#ECFBFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '260px',
            }}>
              {doc.fileName}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 7px',
              borderRadius: '3px',
              background: 'rgba(56,189,248,0.1)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: '#38BDF8',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {FILETYPE_LABELS[doc.fileType] ?? doc.fileType}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '1px 7px',
              borderRadius: '3px',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
              fontFamily: 'ui-monospace, monospace',
            }}>
              {doc.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>
            {formatDate(doc.createdAt)} · {doc.extractionMethod}
          </div>
        </div>
        {doc.warningCount > 0 && (
          <span title={`${doc.warningCount} warning(s)`} style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
        )}
      </div>

      {/* Summary */}
      {(doc.summaryZh || doc.summaryEn) && (
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>
          {truncate(doc.summaryZh || doc.summaryEn, 120)}
        </p>
      )}

      {/* Counters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {[
          { label: 'Questions', value: doc.questionCount, color: '#8B5CF6' },
          { label: 'Words', value: doc.vocabularyCount, color: '#38BDF8' },
          { label: 'Notes', value: doc.studyNoteCount, color: '#34D399' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ fontSize: '11px', color, fontFamily: 'ui-monospace, monospace' }}>
            {value} {label}
          </div>
        ))}
        {doc.reviewWordsAddedCount > 0 && (
          <div style={{ fontSize: '11px', color: 'rgba(52,211,153,0.6)', fontFamily: 'ui-monospace, monospace' }}>
            +{doc.reviewWordsAddedCount} reviewed
          </div>
        )}
        {doc.quizDraftsSavedCount > 0 && (
          <div style={{ fontSize: '11px', color: 'rgba(255,215,106,0.6)', fontFamily: 'ui-monospace, monospace' }}>
            +{doc.quizDraftsSavedCount} drafts
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link
          href={`/scan/history/${doc.id}`}
          style={{
            padding: '6px 14px',
            borderRadius: '7px',
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)',
            color: '#38BDF8',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View Details / 查看详情
        </Link>
        <button
          onClick={() => onDelete(doc.id)}
          style={{
            padding: '6px 14px',
            borderRadius: '7px',
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: 'rgba(239,68,68,0.7)',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Delete / 删除
        </button>
      </div>
    </div>
  )
}
```

### 6b: ScanHistoryFilters

- [ ] **Step 2: Create ScanHistoryFilters.tsx**

```typescript
// components/scan/history/ScanHistoryFilters.tsx
'use client'

import type { ScanHistoryFilter } from '@/types/scan-history'

interface ScanHistoryFiltersProps {
  filters: ScanHistoryFilter
  onChange: (patch: Partial<ScanHistoryFilter>) => void
  totalCount: number
  filteredCount: number
}

const FILE_TYPES: { value: ScanHistoryFilter['fileType']; label: string }[] = [
  { value: 'all', label: 'All / 全部' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image / 图片' },
  { value: 'text', label: 'Text / 文本' },
]

export function ScanHistoryFilters({ filters, onChange, totalCount, filteredCount }: ScanHistoryFiltersProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Search */}
      <input
        type="text"
        value={filters.query}
        onChange={e => onChange({ query: e.target.value })}
        placeholder="Search by file name, summary… / 按文件名、摘要搜索…"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(155,191,202,0.2)',
          color: '#ECFBFF',
          fontSize: '13px',
          outline: 'none',
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      />

      {/* File type tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {FILE_TYPES.map(ft => {
          const active = filters.fileType === ft.value
          return (
            <button
              key={ft.value}
              onClick={() => onChange({ fileType: ft.value })}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(56,189,248,0.5)' : 'rgba(155,191,202,0.15)'}`,
                color: active ? '#38BDF8' : '#9BBFCA',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {ft.label}
            </button>
          )
        })}
      </div>

      {/* Toggle filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'hasQuestions' as const, label: 'Has Questions / 有题目' },
          { key: 'hasVocabulary' as const, label: 'Has Vocabulary / 有生词' },
          { key: 'hasWarnings' as const, label: 'Has Warnings / 有警告' },
        ].map(({ key, label }) => {
          const active = filters[key]
          return (
            <button
              key={key}
              onClick={() => onChange({ [key]: !active })}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: active ? 'rgba(255,215,106,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? 'rgba(255,215,106,0.4)' : 'rgba(155,191,202,0.15)'}`,
                color: active ? '#FFD76A' : 'rgba(155,191,202,0.6)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Result count */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(155,191,202,0.4)', fontFamily: 'ui-monospace, monospace' }}>
        {filteredCount === totalCount
          ? `${totalCount} document${totalCount !== 1 ? 's' : ''}`
          : `${filteredCount} of ${totalCount} documents`}
      </div>
    </div>
  )
}
```

### 6c: ScanHistoryEmptyState

- [ ] **Step 3: Create ScanHistoryEmptyState.tsx**

```typescript
// components/scan/history/ScanHistoryEmptyState.tsx
import Link from 'next/link'

interface ScanHistoryEmptyStateProps {
  hasFilters: boolean
}

export function ScanHistoryEmptyState({ hasFilters }: ScanHistoryEmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      color: '#9BBFCA',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      {hasFilters ? (
        <>
          <p style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '6px' }}>
            No matching documents
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
            Try clearing the filters / 尝试清除筛选条件
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '6px' }}>
            No scan history yet / 暂无扫描历史
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)', marginBottom: '24px' }}>
            Analyze a document and save it to your library to get started.
            <br />
            分析文档并保存到库以开始使用。
          </p>
          <Link
            href="/scan"
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.12)',
              border: '1px solid rgba(56,189,248,0.4)',
              color: '#38BDF8',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go to Scan / 前往扫描 →
          </Link>
        </>
      )}
    </div>
  )
}
```

### 6d: ScanHistoryDetailClient

- [ ] **Step 4: Create ScanHistoryDetailClient.tsx**

This is the largest component. It renders the full detail page for a stored document.

```typescript
// components/scan/history/ScanHistoryDetailClient.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { useScanStore } from '@/store/scanStore'
import { useLearningStore } from '@/store/learningStore'
import { ExtractedVocabularyPanel } from '@/components/scan/ExtractedVocabularyPanel'
import { ExtractedQuestionsPanel } from '@/components/scan/ExtractedQuestionsPanel'
import type { ExtractedVocabulary } from '@/types/document'
import type { ScanQuizDraft } from '@/types/scan-learning'

const STATUS_COLORS: Record<string, string> = {
  analyzed: '#34D399',
  'partially-analyzed': '#FFD76A',
  'needs-ocr': '#F97316',
  error: '#F87171',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

interface ScanHistoryDetailClientProps {
  documentId: string
}

export function ScanHistoryDetailClient({ documentId }: ScanHistoryDetailClientProps) {
  const { getScanDocumentById, deleteScanDocument, markVocabularyAdded, markQuizDraftsSaved, markWrongAnswersSaved, markStudyNotesSaved } = useScanHistoryStore()
  const { addScanQuizDraft, addScanStudyNote, scanQuizDrafts, scanStudyNotes } = useScanStore()
  const { reviewWords, addToReview, saveWord, incrementXp, markStudyToday } = useLearningStore()

  const doc = getScanDocumentById(documentId)

  const [rawExpanded, setRawExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleted, setDeleted] = useState(false)

  // Build review set for vocab panel
  const alreadyInReview = useMemo(
    () => new Set(reviewWords.map(r => r.wordId)),
    [reviewWords],
  )

  // Pre-populate "already saved" sets for questions panel
  const preExistingSavedDraftIds = useMemo(() => {
    if (!doc) return new Set<string>()
    const savedPrompts = new Set(
      scanQuizDrafts
        .filter(d => d.documentId === documentId && d.status !== 'needs-review')
        .map(d => d.prompt),
    )
    return new Set(
      doc.questions.filter(q => savedPrompts.has(q.prompt)).map(q => q.id),
    )
  }, [scanQuizDrafts, doc, documentId])

  const preExistingDifficultIds = useMemo(() => {
    if (!doc) return new Set<string>()
    const savedPrompts = new Set(
      scanQuizDrafts
        .filter(d => d.documentId === documentId && d.status === 'needs-review')
        .map(d => d.prompt),
    )
    return new Set(
      doc.questions.filter(q => savedPrompts.has(q.prompt)).map(q => q.id),
    )
  }, [scanQuizDrafts, doc, documentId])

  // Pre-populate saved study notes
  const savedNoteIndices = useMemo(() => {
    if (!doc) return new Set<number>()
    return new Set(
      doc.studyNotes
        .map((note, i) => ({ note, i }))
        .filter(({ note }) =>
          scanStudyNotes.some(n => n.documentId === documentId && n.title === note.title),
        )
        .map(({ i }) => i),
    )
  }, [scanStudyNotes, doc, documentId])

  const [localSavedNotes, setLocalSavedNotes] = useState<Set<number>>(() => savedNoteIndices)

  if (!doc || deleted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
          <p style={{ fontSize: '15px', color: '#ECFBFF', marginBottom: '8px' }}>
            {deleted ? 'Document record deleted / 已删除文档记录' : 'Document not found / 文档记录不存在'}
          </p>
          <Link href="/scan/history" style={{ color: '#38BDF8', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Scan History / 返回扫描历史
          </Link>
        </div>
      </div>
    )
  }

  function handleAddToReview(word: ExtractedVocabulary) {
    const id = word.word.toLowerCase().replace(/\s+/g, '-')
    addToReview(id, word.word)
    saveWord(id)
    incrementXp(10)
    markStudyToday()
    markVocabularyAdded(documentId, 1)
  }

  function handleSaveAsDraft(draft: ScanQuizDraft) {
    const isNew = !scanQuizDrafts.some(
      d => d.documentId === draft.documentId && d.prompt === draft.prompt,
    )
    addScanQuizDraft(draft)
    if (isNew) {
      if (draft.status === 'needs-review') {
        markWrongAnswersSaved(documentId, 1)
      } else {
        markQuizDraftsSaved(documentId, 1)
      }
    }
    incrementXp(5)
  }

  function handleSaveNote(index: number) {
    const note = doc.studyNotes[index]
    if (!note) return
    const isNew = !scanStudyNotes.some(n => n.documentId === documentId && n.title === note.title)
    addScanStudyNote(note)
    if (isNew) markStudyNotesSaved(documentId, 1)
    setLocalSavedNotes(prev => new Set(prev).add(index))
    incrementXp(5)
    markStudyToday()
  }

  function handleDelete() {
    deleteScanDocument(documentId)
    setDeleted(true)
  }

  const statusColor = STATUS_COLORS[doc.status] ?? '#9BBFCA'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/scan/history" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Scan History / 返回扫描历史
          </Link>
        </div>

        {/* Doc header */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(155,191,202,0.12)',
          borderRadius: '12px',
          padding: '20px 22px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#ECFBFF', wordBreak: 'break-word' }}>
                {doc.fileName}
              </h1>
              <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>
                {formatDate(doc.createdAt)} · {doc.extractionMethod}
                {doc.pageCount ? ` · ${doc.pageCount}p` : ''}
                {doc.confidence !== undefined ? ` · OCR ${Math.round(doc.confidence * 100)}%` : ''}
              </div>
            </div>
            <span style={{
              flexShrink: 0,
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '4px',
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
              color: statusColor,
              fontFamily: 'ui-monospace, monospace',
              marginTop: '2px',
            }}>
              {doc.status}
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: doc.warnings.length > 0 ? '12px' : 0 }}>
            {[
              { label: 'Questions', value: doc.questionCount, color: '#8B5CF6' },
              { label: 'Words', value: doc.vocabularyCount, color: '#38BDF8' },
              { label: 'Notes', value: doc.studyNoteCount, color: '#34D399' },
              { label: 'Warnings', value: doc.warningCount, color: '#FFD76A' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color }}>
                {value} {label}
              </div>
            ))}
          </div>

          {/* Warnings */}
          {doc.warnings.length > 0 && (
            <div style={{
              background: 'rgba(255,215,106,0.04)',
              border: '1px solid rgba(255,215,106,0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
            }}>
              {doc.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: '12px', color: 'rgba(255,215,106,0.8)', marginBottom: i < doc.warnings.length - 1 ? '3px' : 0 }}>
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {(doc.summaryEn || doc.summaryZh) && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(155,191,202,0.1)',
            borderRadius: '10px',
            padding: '16px 18px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(56,189,248,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '10px' }}>
              DOCUMENT SUMMARY / 文档摘要
            </div>
            {doc.summaryEn && (
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.7 }}>{doc.summaryEn}</p>
            )}
            {doc.summaryZh && (
              <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.7 }}>{doc.summaryZh}</p>
            )}
          </div>
        )}

        {/* Raw text preview */}
        {doc.rawTextPreview && (
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setRawExpanded(v => !v)}
              style={{
                background: 'none',
                border: '1px solid rgba(155,191,202,0.15)',
                borderRadius: '6px',
                padding: '6px 14px',
                color: 'rgba(155,191,202,0.5)',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {rawExpanded ? '▲ Hide' : '▼ Show'} Raw Text Preview / 原始文本预览
            </button>
            {rawExpanded && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(155,191,202,0.1)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontSize: '12px',
                  color: '#9BBFCA',
                  lineHeight: 1.8,
                  fontFamily: 'ui-monospace, monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  {doc.rawTextPreview}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(155,191,202,0.4)' }}>
                  ℹ Preview only — showing first {doc.rawTextPreview.length.toLocaleString()} of {doc.rawTextLength?.toLocaleString() ?? '?'} characters.
                  Original file is not stored. / 仅显示预览，原始文件未保存。
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary panel (reused) */}
        <ExtractedVocabularyPanel
          vocabulary={doc.vocabulary}
          onAddToReview={handleAddToReview}
          alreadyInReview={alreadyInReview}
        />

        {/* Questions panel (reused) */}
        {doc.questions.length > 0 && (
          <ExtractedQuestionsPanel
            questions={doc.questions}
            sourceFileName={doc.fileName}
            documentId={documentId}
            onSaveAsDraft={handleSaveAsDraft}
            analysisWarnings={doc.warnings}
            preExistingSavedDraftIds={preExistingSavedDraftIds}
            preExistingDifficultIds={preExistingDifficultIds}
          />
        )}

        {/* Study notes (inline — uses ScanStudyNote from stored detail) */}
        {doc.studyNotes.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(52,211,153,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '12px' }}>
              STUDY NOTES / 学习笔记 ({doc.studyNotes.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {doc.studyNotes.map((note, i) => {
                const isSaved = localSavedNotes.has(i)
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(155,191,202,0.1)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8', marginBottom: '4px' }}>
                          {note.title} / {note.titleZh}
                        </div>
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#ECFBFF', lineHeight: 1.6 }}>{note.content}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>{note.contentZh}</p>
                      </div>
                      <button
                        onClick={() => handleSaveNote(i)}
                        disabled={isSaved}
                        style={{
                          flexShrink: 0,
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: isSaved ? 'rgba(52,211,153,0.06)' : 'rgba(56,189,248,0.08)',
                          border: `1px solid ${isSaved ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.25)'}`,
                          color: isSaved ? '#34D399' : '#38BDF8',
                          fontSize: '11px',
                          cursor: isSaved ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isSaved ? '✓ Saved' : '+ Save Note'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Compliance notice */}
        <div style={{
          background: 'rgba(255,215,106,0.04)',
          border: '1px solid rgba(255,215,106,0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '24px',
          fontSize: '11px',
          color: 'rgba(255,215,106,0.6)',
          lineHeight: 1.6,
        }}>
          AI-generated answer suggestions are not official answers. Verify before use. /
          AI 生成答案建议不是官方答案，使用前请自行核对。
          <br />
          Uploaded content was used only for personal learning analysis. /
          上传内容仅用于个人学习分析。
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href="/scan/history"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(155,191,202,0.08)',
              border: '1px solid rgba(155,191,202,0.2)',
              color: '#9BBFCA',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Scan History / 扫描历史
          </Link>
          <Link
            href="/scan"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.25)',
              color: '#38BDF8',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go to Scan / 前往扫描 →
          </Link>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Delete Record / 删除记录
            </button>
          ) : (
            <div style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(239,68,68,0.8)' }}>
                Delete this record? / 确认删除？
              </span>
              <button
                onClick={handleDelete}
                style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', fontSize: '12px', cursor: 'pointer' }}
              >
                Yes / 是
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '4px 10px', borderRadius: '6px', background: 'none', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel / 取消
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify lint on all 4 history components**

```powershell
npx eslint components/scan/history/ --max-warnings 0
```

- [ ] **Step 6: Commit**

```powershell
git add components/scan/history/
git commit -m "feat(4e): history UI components — Card, Filters, EmptyState, DetailClient"
```

---

## Task 7: app/scan/history/page.tsx

**Files:**
- Create: `ocean-english/app/scan/history/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
// app/scan/history/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { ScanHistoryCard } from '@/components/scan/history/ScanHistoryCard'
import { ScanHistoryFilters } from '@/components/scan/history/ScanHistoryFilters'
import { ScanHistoryEmptyState } from '@/components/scan/history/ScanHistoryEmptyState'

export default function ScanHistoryPage() {
  const {
    scanDocuments,
    scanHistoryFilters,
    setFilters,
    getFilteredDocuments,
    deleteScanDocument,
    clearScanHistory,
  } = useScanHistoryStore()

  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filtered = getFilteredDocuments()
  const hasFilters =
    scanHistoryFilters.query !== '' ||
    scanHistoryFilters.fileType !== 'all' ||
    scanHistoryFilters.hasWarnings ||
    scanHistoryFilters.hasQuestions ||
    scanHistoryFilters.hasVocabulary

  function handleDelete(id: string) {
    deleteScanDocument(id)
  }

  function handleClearAll() {
    clearScanHistory()
    setShowClearConfirm(false)
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 700, color: '#ECFBFF' }}>
                Scan History{' '}
                <span style={{ fontSize: '16px', color: '#9BBFCA' }}>扫描历史</span>
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA', lineHeight: 1.6 }}>
                Review previous document analyses stored locally in this browser.
                <br />
                <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '12px' }}>
                  查看保存在当前浏览器本地的历史文档分析结果。
                </span>
              </p>
            </div>
            <Link href="/scan" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: '4px' }}>
              ← Back to Scan / 返回扫描
            </Link>
          </div>

          {/* Compliance notice */}
          <div style={{
            background: 'rgba(255,215,106,0.04)',
            border: '1px solid rgba(255,215,106,0.15)',
            borderRadius: '8px',
            padding: '10px 14px',
            margin: '16px 0 20px',
            fontSize: '11px',
            color: 'rgba(255,215,106,0.6)',
            lineHeight: 1.7,
          }}>
            🔒 Your scan history is stored locally in this browser only. Original uploaded files are not saved.
            You can delete any record at any time. Do not upload documents you do not have permission to analyze.
            <br />
            🔒 扫描历史仅保存在当前浏览器本地。系统不会保存原始上传文件。你可以随时删除任何记录。请不要上传你无权分析的材料。
          </div>

          {/* Filters */}
          <ScanHistoryFilters
            filters={scanHistoryFilters}
            onChange={setFilters}
            totalCount={scanDocuments.length}
            filteredCount={filtered.length}
          />

          {/* Document list */}
          {filtered.length === 0 ? (
            <ScanHistoryEmptyState hasFilters={hasFilters} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {filtered.map(doc => (
                <ScanHistoryCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Clear all */}
          {scanDocuments.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(155,191,202,0.1)', paddingTop: '20px', marginTop: '8px' }}>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '7px',
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: 'rgba(239,68,68,0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Clear All History / 清空扫描历史
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: '13px', color: 'rgba(239,68,68,0.85)' }}>
                    Delete all {scanDocuments.length} records? This cannot be undone. /
                    删除全部 {scanDocuments.length} 条记录？此操作不可撤销。
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleClearAll}
                      style={{ padding: '5px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)', color: '#F87171', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Delete All / 全部删除
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      style={{ padding: '5px 12px', borderRadius: '6px', background: 'none', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel / 取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Verify lint**

```powershell
npx eslint app/scan/history/page.tsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```powershell
git add app/scan/history/page.tsx
git commit -m "feat(4e): /scan/history page — list, search, filter, clear-all with confirm"
```

---

## Task 8: app/scan/history/[documentId]/page.tsx

**Files:**
- Create: `ocean-english/app/scan/history/[documentId]/page.tsx`

Next.js 16 uses `params: Promise<{ documentId: string }>` in server components. The actual UI is in `ScanHistoryDetailClient`.

- [ ] **Step 1: Create the server-wrapper page**

```typescript
// app/scan/history/[documentId]/page.tsx
import { AppShell } from '@/components/layout/AppShell'
import { ScanHistoryDetailClient } from '@/components/scan/history/ScanHistoryDetailClient'

export default async function ScanHistoryDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>
}) {
  const { documentId } = await params
  return (
    <AppShell>
      <ScanHistoryDetailClient documentId={documentId} />
    </AppShell>
  )
}
```

- [ ] **Step 2: Verify lint and TypeScript**

```powershell
npx eslint "app/scan/history/[documentId]/page.tsx" --max-warnings 0
npx tsc --noEmit 2>&1 | Select-String "history"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add "app/scan/history/[documentId]/page.tsx"
git commit -m "feat(4e): /scan/history/[documentId] page — server wrapper for detail client"
```

---

## Task 9: Docs updates

**Files:**
- Modify: `ocean-english/docs/document-intelligence.md`
- Modify: `ocean-english/docs/copyright-compliance.md`
- Create: `ocean-english/docs/phase-reports/phase-4e-scan-history-local-library-report.md`

- [ ] **Step 1: Append Phase 4E section to document-intelligence.md**

Add at the end of `docs/document-intelligence.md`:

```markdown
---

## Phase 4E: Scan History + Local Document Library (2026-06-01)

### New Architecture

```
Browser (Client)
  │
  ├── /scan page (updated)
  │     └── ScanHistorySaveButton    ← manual save to useScanHistoryStore
  │
  ├── /scan/history
  │     ├── ScanHistoryFilters        ← search + file type + toggle filters
  │     ├── ScanHistoryCard (×N)      ← per-document card
  │     └── ScanHistoryEmptyState
  │
  └── /scan/history/[documentId]
        └── ScanHistoryDetailClient
              ├── ExtractedVocabularyPanel (reused)
              ├── ExtractedQuestionsPanel (reused, preExistingSaved* props)
              └── Study notes (inline, from stored detail)

Store (new):
  useScanHistoryStore  →  localStorage['lexiocean-scan-history'] v1
    scanDocuments: ScanDocumentLibraryDetail[]  (max 50)
    rawTextPreview: max 3000 chars
    No rawText full, no base64, no original files
```

### Storage Constraints
- Max 50 documents in `lexiocean-scan-history`
- `rawTextPreview` capped at 3000 characters
- `questions`, `vocabulary`, `studyNotes` stored in full (structured JSON only)
- Original PDF/image binary: NOT stored
- Estimated storage per document: ~15–25 KB
- Total budget at 50 docs: ~1–1.25 MB (well within localStorage 5 MB limit)

### Privacy
- All data local-only (localStorage, same-origin)
- User can delete individual records or clear all history
- See `docs/copyright-compliance.md` §Scan History Privacy
```

- [ ] **Step 2: Append compliance section to copyright-compliance.md**

Add at the end of `docs/copyright-compliance.md`:

```markdown
---

## Scan History Privacy & Data Retention (Phase 4E)

### What is stored
- Structured analysis results only: questions, vocabulary, study notes, summaries, warnings
- Raw text preview: first 3,000 characters of extracted text
- File metadata: name, type, page count (if available), OCR confidence (if applicable)

### What is NOT stored
- Original PDF binary
- Original image binary
- Base64-encoded file data
- Full raw text (only a 3,000-char preview)

### Storage location
- `localStorage['lexiocean-scan-history']` — client-side only, same-origin, never sent to server

### User controls
- Delete individual records from `/scan/history`
- Clear all history from `/scan/history` (requires inline confirmation)
- Limit: 50 documents; user is prompted to delete when full

### Compliance notices shown in UI
1. "Scan history is stored locally in this browser only."
2. "Original uploaded files are not saved."
3. "You can delete any record at any time."
4. "Do not upload documents you do not have permission to analyze."
5. "AI-generated answer suggestions are not official answers."
6. "Uploaded content is used only for personal learning analysis."
```

- [ ] **Step 3: Create phase report**

Create `docs/phase-reports/phase-4e-scan-history-local-library-report.md`:

```markdown
# Phase 4E: Scan History + Local Document Library — Report

**Date:** 2026-06-01  
**Branch:** feat/lexiocean-phase1  
**Status:** Complete

---

## Summary

Phase 4E adds a local-only scan history and document library to LexiOcean. Users can now:
- Save any scan analysis result to a local library with one click
- Browse, search, and filter all past scan sessions at `/scan/history`
- View full details (vocabulary, questions, notes) for any saved document at `/scan/history/[documentId]`
- Re-perform Phase 4D learning actions (add to review, save quiz drafts, save notes) from the history detail page
- Delete individual records or clear all history at any time

No original files, no cloud uploads, no account required.

---

## Files Added

| File | Purpose |
|------|---------|
| `types/scan-history.ts` | `ScanDocumentLibraryItem`, `ScanDocumentLibraryDetail`, `ScanHistoryFilter`, `ScanDocumentStatus` |
| `store/useScanHistoryStore.ts` | Zustand store persisted to `lexiocean-scan-history` v1, max 50 docs |
| `components/scan/history/ScanHistorySaveButton.tsx` | Save-to-library button + local-only compliance notice |
| `components/scan/history/ScanHistoryCard.tsx` | Per-document card (list view) |
| `components/scan/history/ScanHistoryFilters.tsx` | Search + file type + toggle filters |
| `components/scan/history/ScanHistoryEmptyState.tsx` | Empty state (no docs / no results) |
| `components/scan/history/ScanHistoryDetailClient.tsx` | Full detail page client component |
| `app/scan/history/page.tsx` | `/scan/history` list page |
| `app/scan/history/[documentId]/page.tsx` | `/scan/history/[documentId]` server wrapper |

## Files Modified

| File | Change |
|------|--------|
| `components/scan/ExtractedQuestionsPanel.tsx` | Added `preExistingSavedDraftIds` + `preExistingDifficultIds` props |
| `app/scan/page.tsx` | Added `ScanHistorySaveButton` + "View History" link |
| `docs/document-intelligence.md` | Phase 4E architecture section |
| `docs/copyright-compliance.md` | Scan History Privacy & Data Retention section |

---

## Storage Design

- **localStorage key**: `lexiocean-scan-history` (isolated from `lexiocean-learning` and `lexiocean-scan`)
- **Version**: 1 (full wipe on migration to prevent corruption)
- **Max documents**: 50 (user notified at 45; save blocked at 50)
- **rawTextPreview**: max 3,000 characters
- **No original files**: Only structured JSON (questions, vocab, notes, summaries, warnings)
- **Estimated budget**: ~1–1.25 MB for 50 documents (5 MB localStorage limit)

---

## Acceptance Criteria

- [x] /scan page accessible, scan pipeline unaffected
- [x] Save to Library button appears after analysis completes
- [x] Duplicate saves prevented (already-exists state)
- [x] /scan/history accessible and shows document cards
- [x] Search by file name / summary works (local filter)
- [x] File type + toggle filters work
- [x] /scan/history/[documentId] shows summary, vocab, questions, notes, warnings
- [x] Add to Review works from detail page (dedup with learningStore)
- [x] Save Quiz Draft works from detail page (dedup with scanStore)
- [x] Save Study Note works from detail page (dedup with scanStore)
- [x] Delete individual record from detail page
- [x] Delete individual record from history list
- [x] Clear all history with inline confirmation
- [x] localStorage failure: storage-full handled gracefully
- [x] No rawText full / no base64 / no original files stored
- [x] Compliance notices on /scan, /scan/history, /scan/history/[documentId]
- [x] ExtractedQuestionsPanel backward-compatible (no breaking changes to /scan page)
- [x] /chat, /word, /quiz, /study, /memory, /wrong-answers unaffected
- [x] BanyanParticleHero unaffected
- [x] npm run lint passes
- [x] npm run build passes

---

## Risks Mitigated

- **localStorage quota**: Max 50 docs, 3K preview cap, no binary data. Storage-full returns gracefully with UI message.
- **Store isolation**: `lexiocean-scan-history` is entirely separate from existing stores. Migration wipes to `INITIAL_STATE` on version mismatch.
- **SSR hydration**: Detail page uses server wrapper + `'use client'` pattern (same as `/word/[slug]`).
- **Phase 4D backward compat**: `ExtractedQuestionsPanel` new props are optional; `/scan` page passes `undefined` → same behavior as before.

---

## Known Limitations (Future Work)

- History is browser-local only; switching devices loses history
- Phase 5 (database backend) will enable cloud sync for history
- No image/PDF thumbnail in history cards (file binary not stored)
- `getFilteredDocuments()` iterates all docs on every render; acceptable at 50 docs
```

- [ ] **Step 4: Commit docs**

```powershell
git add docs/
git commit -m "docs(4e): document-intelligence + copyright-compliance + phase-4e report"
```

---

## Task 10: Lint + Build verification

- [ ] **Step 1: Run lint across all new/modified files**

```powershell
cd d:/ai-studio/ocean-english
npx next lint 2>&1
```

Expected: `✔ No ESLint warnings or errors`.

Fix any lint errors before proceeding to build.

- [ ] **Step 2: Run TypeScript check**

```powershell
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3: Run build**

```powershell
npx next build 2>&1
```

Expected: build completes successfully. Fix any errors found.

- [ ] **Step 4: Final commit if any fixes were needed**

```powershell
git add -A
git commit -m "fix(4e): lint + build fixes"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Scan history store — Task 2
- [x] rawTextPreview ≤ 3000 chars — Task 2 (`MAX_RAW_TEXT_PREVIEW = 3000`)
- [x] Max 50 documents — Task 2 (`MAX_SCAN_HISTORY = 50`)
- [x] localStorage corruption safe — Task 2 (migrate → INITIAL_STATE)
- [x] Save button on /scan page — Task 5
- [x] Local-only compliance notice on /scan — Task 4 (ScanHistorySaveButton)
- [x] /scan/history page — Task 7
- [x] Search + filters — Task 6b + Task 7
- [x] /scan/history/[documentId] — Task 8
- [x] Detail: vocab + Add to Review — Task 6d
- [x] Detail: questions + draft/difficult — Task 6d
- [x] Detail: study notes + save — Task 6d
- [x] Delete from detail page with confirm — Task 6d
- [x] Clear all with inline confirm — Task 7
- [x] Not Found state — Task 6d
- [x] Pre-populate saved states from store — Task 6d
- [x] counter updates (markVocabularyAdded etc.) — Task 2 + Task 6d
- [x] Phase 4D backward compat — Task 3
- [x] Compliance notices on all pages — Tasks 4, 6d, 7
- [x] Docs updated — Task 9

**Type consistency:**
- `ScanDocumentLibraryDetail.studyNotes: ScanStudyNote[]` — populated in `buildDetail()` with correct `documentId` + `sourceFileName`
- `useScanHistoryStore.saveScanDocument()` → `SaveScanDocumentResult` — used in `ScanHistorySaveButton`
- `useScanHistoryStore.getFilteredDocuments()` — called in history page with no args
- `ExtractedQuestionsPanel` new props: `preExistingSavedDraftIds?: Set<string>`, `preExistingDifficultIds?: Set<string>` — used in `ScanHistoryDetailClient`
- `markVocabularyAdded`, `markQuizDraftsSaved`, `markWrongAnswersSaved`, `markStudyNotesSaved` — all in store + called from `ScanHistoryDetailClient`
