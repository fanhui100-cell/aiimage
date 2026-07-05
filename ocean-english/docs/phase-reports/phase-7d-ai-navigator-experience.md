# Phase 7D — AI Navigator Experience Upgrade

**Date:** 2026-06-03  
**Branch:** feat/lexiocean-phase1  
**Status:** Complete ✓

---

## Summary

Phase 7D upgraded `/chat` from a context-blind generic chat page into a full **AI Navigator / AI 导学中心**. Context from Word Detail, LexiGraph, Wrong Answers, and Study Hub flows into `/chat` via URL query parameters. The chat page reads these params, resolves the context from existing Zustand stores, and surfaces a context panel + adaptive prompt shortcuts.

All existing AI safety rules (system message stripping, rate limits, safe errors, malformed JSON → 400) remain fully intact. No new AI providers, no new database tables, no complex agents.

---

## Files Added

### `lib/ai-navigator/`

| File | Purpose |
|------|---------|
| `ai-navigator-types.ts` | `AINavigatorContext` union type, `PromptShortcut` interface |
| `ai-navigator-context.ts` | `resolveNavigatorContext()` — reads URL params, looks up store, returns context. Always returns `free_chat` as fallback |
| `ai-navigator-prompts.ts` | `PROMPT_SHORTCUTS` array + `buildShortcutPrompt()` — generates user-facing prompt text per context |
| `ai-navigator-route-utils.ts` | `chatHrefWord()`, `chatHrefLexigraphWord()`, `chatHrefWrongAnswer()`, `chatHrefStudyGoal()` — helpers (available for future use) |

### `components/ai-navigator/`

| File | Purpose |
|------|---------|
| `AINavigatorHeader.tsx` | Title + bilingual subtitle + context badge + Clear button |
| `AINavigatorContextPanel.tsx` | Context card (word / lexigraph_word / wrong_answer / study_goal) with back links |
| `AINavigatorPromptShortcuts.tsx` | 6 shortcut buttons, enabled/disabled per context type |

### `docs/phase-reports/`

- `phase-7d-ai-navigator-experience.md` — this file

---

## Files Modified

| File | Change |
|------|--------|
| `app/chat/page.tsx` | Full refactor: Suspense boundary, `useSearchParams`, context resolution, new sub-components. Chat fetch logic preserved exactly. |
| `app/memory/page.tsx` | Wrong answer "Ask AI" link: `/chat` → `/chat?context=wrong_answer&id={wa.id}` |
| `app/word/[slug]/WordDetailClient.tsx` | Added "Ask in Chat →" link: `/chat?context=word&word={word.id}` |
| `components/lexigraph/LexiGraphPanel.tsx` | Added "Ask AI in Chat" link: `/chat?context=lexigraph_word&word={word.id}` |
| `components/study/AINavigatorPanel.tsx` | Main CTA: `/chat` → `/chat?context=study_goal` |

---

## Context Types Implemented

| Type | URL | Data source | Context panel |
|------|-----|------------|---------------|
| `word` | `?context=word&word=xxx` | URL param | Word name + back to Word Detail + LexiGraph link |
| `lexigraph_word` | `?context=lexigraph_word&word=xxx` | URL param | Word name + back to LexiGraph |
| `wrong_answer` | `?context=wrong_answer&id=xxx` | `useLearningStore().wrongAnswers` lookup | Question / my answer / correct answer |
| `study_goal` | `?context=study_goal` | `useLearningStore()` stats | Streak / XP / saved / due counts |
| `free_chat` | `/chat` (bare) | — | None |

Deferred (no scan context in Phase 7D): `scan_document`, `scan_question`, `quiz_result`.

---

## Prompt Shortcuts

| ID | Label | Context aware | Send / Fill |
|----|-------|--------------|-------------|
| `explain_word` | Explain this word | word/lexigraph_word/wrong_answer → uses word | Auto-send |
| `break_sentence` | Break down a sentence | always; word context prefixes it | Fill input only |
| `explain_mistake` | Explain my mistake | wrong_answer only (disabled otherwise) | Auto-send |
| `generate_quiz` | Generate a quiz | word/wrong_answer → uses word | Auto-send |
| `study_plan` | Make a study plan | study_goal → uses stats | Auto-send |
| `summarize_doc` | Summarize a document | Disabled (scan deferred) | — |

All generated prompts capped at 400 chars, well under the server-side 2000-char limit.

---

## Safety Compliance

- No system role from client: unchanged — `/api/ai/chat` still strips any `role: 'system'` messages
- No rawText in prompts: wrong answer context uses only `word`, `question`, `userAnswer`, `correctAnswer` (each ≤ 300 chars)
- No URL overflow: `word` clamped to 100 chars, `id` to 50 chars
- Rate limits: all shortcuts call the same `/api/ai/chat` endpoint (30/min per IP)
- Safe error: `normalizeProviderError` + `safeErrorPayload` untouched
- Malformed JSON → 400: API routes untouched

---

## Verification

- `next build` — passed, `/chat` renders as static `○`
- `eslint` on all changed files — 0 warnings, 0 errors
- All existing pages unbroken: `/dictionary`, `/word/[slug]`, `/lexigraph`, `/scan`, `/memory`, `/quiz`, `/study`
- Fallback to `free_chat` if wrong_answer ID not found (graceful, no crash)

---

## Files Not Touched

All stores, all API routes (`lib/ai/*`, `app/api/ai/*`), Phase 5 auth/Supabase, dictionary, scan pipeline, quiz engine, pronunciation, exam, profile, companion/cat-pet.
