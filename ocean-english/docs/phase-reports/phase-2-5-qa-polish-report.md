# Phase 2.5 — QA + Product Polish + Refactor Report

**Project:** LexiOcean / 深海英语学习系统  
**Phase:** 2.5 — QA + Product Polish + Refactor  
**Date:** 2026-06-01  
**Status:** ✅ Complete  
**Branch:** feat/lexiocean-phase1

---

## QA Audit Method

1. Screenshot all pages at desktop (1440×900) and mobile (390×844 — iPhone 14)
2. Code-reviewed all Phase 1 + Phase 2 files
3. Traced all state flows end-to-end (onboarding → store → dictionary → quiz → memory)
4. Identified 16 issues across 6 categories

---

## Issues Found and Fixed

### 🔴 Critical Bugs

| ID | File | Issue | Fix |
|---|---|---|---|
| B1 | `BanyanParticleSystem.tsx` | Cleanup effect disposed `material` on every `geometry` change, leaving `materialRef` pointing to a destroyed object — crash on REPLAY | Split into two effects: geometry-only cleanup + material-only unmount cleanup |
| B2 | `store/learningStore.ts` | `longestStreak` logic: when `last === today`, `max(current, 1)` could reduce a streak > 1 | Rewrote: `if last === today` → early return; streak logic now only runs on first call per day |
| B3 | `app/onboarding/page.tsx` | Only wrote to `localStorage` — Zustand `userLevel` was never updated, always `null` | Now calls `setUserLevel(selected)` from store; pre-fills selection from persisted level |
| B4 | `store/learningStore.ts` | `totalWordsLearned` counter never incremented | Added `incrementWordsLearned()` action; called from `WordDetailClient.handleAddToReview()` |
| B5 | `store/learningStore.ts` | Daily tasks never auto-reset across day boundaries | Added `autoResetDailyTasksIfNewDay()` called on Study page mount; checks `lastStudyDate !== today` |

### 🟡 Important Defects

| ID | File | Issue | Fix |
|---|---|---|---|
| D1 | `store/learningStore.ts` | No schema version — stale localStorage data crashes on schema changes | Added `version: 1` + `migrate: () => INITIAL_STATE` to persist config |
| D2 | `store/learningStore.ts` | No `resetStore` action for clearing all user data | Added `resetStore()` that spreads `INITIAL_STATE` |
| D3 | `app/scan/page.tsx` | `<style>@keyframes spin</style>` inline in JSX — hydration instability | Moved keyframes to `globals.css` alongside new `banyanPulse` keyframe |
| D4 | `config/site.ts` + Navbar | No `/study` link in navigation — Study page unreachable from any nav element | Added "Study / 学习" to `siteConfig.navigation` |
| D5 | `BanyanParticleSystem.tsx` | `window.matchMedia()` called on every render | Wrapped in `useRef(...).current` — evaluated once on mount |
| D6 | `WordDetailClient.tsx` | `handleAddToReview` called `incrementXp` but not `incrementWordsLearned` | Added `incrementWordsLearned()` call |

### 🟢 UI / Responsive Fixes

| ID | Page | Issue | Fix |
|---|---|---|---|
| U1 | Mobile homepage | Hero text used fixed `left: 48px, bottom: 80px` — overlapped module node labels on narrow screens | Changed to `clamp()` values: `left: clamp(20px, 5vw, 48px)`, `bottom: clamp(64px, 10vh, 100px)` |
| U2 | Mobile hero buttons | Long bilingual button text `"Start Learning / 开始学习"` overflowed | Added `whiteSpace: 'nowrap'` + `flexWrap: 'wrap'` on button row; reduced padding |
| U3 | Study page | Streak stat displayed `"0d"` (value baked in template string) | Changed label to "Streak (days)" / value is now plain number |
| U4 | Mobile dictionary | Filter `<select>` elements had no minimum width — wrapped weirdly on small screens | Added `minWidth: '160px'` + `flex: '1'` to select style |
| U5 | `BanyanModuleNodes.tsx` | `@keyframes banyanPulse` injected via `<Html><style>` tag inside 3D scene every render | Moved to `globals.css`, removed `<Html>` keyframe injection entirely |

### 📋 Logic Fixes

| ID | Issue | Fix |
|---|---|---|
| L1 | Dictionary page initialized with blank level filter regardless of user's chosen level | `useState(userLevel ?? '')` — pre-selects user's stored level |
| L2 | `removeWrongAnswer(wordId)` deleted ALL errors for a word; the × button should delete one entry | Added `id` field to `WrongAnswer` (`wordId-timestamp`); `removeWrongAnswer(id)` now targets exact entry |
| L3 | Quiz `attempts` state never persisted — `quizHistory` always empty | Added `addQuizSession()` call in `handleNext` when quiz finishes |

---

## Store Schema (v1)

```typescript
// Persisted under localStorage key: "lexiocean-learning"
// Version: 1 — on mismatch, resets to INITIAL_STATE
{
  userLevel: LearningLevel | null          // set by onboarding
  savedWords: string[]                      // word IDs bookmarked
  reviewWords: ReviewWord[]                 // SM-2 queue
  wrongAnswers: WrongAnswer[]              // each has unique id
  quizHistory: QuizSession[]               // last 50 sessions
  studyProgress: StudyProgress             // XP, streak, totalWordsLearned
  dailyTasks: DailyTask[]                  // auto-reset on new day
  chatMessages: ChatMessage[]              // last 100 messages
}
```

---

## State Flow — After Polish

```
Onboarding
  → setUserLevel(level)          [Zustand + localStorage]
  → dictionary auto-filters to user's level

Word Detail → "+ Review"
  → addToReview(wordId)
  → saveWord(wordId)
  → incrementWordsLearned()      [studyProgress.totalWordsLearned++]
  → completeTaskUnit('vocab-5')
  → markStudyToday()             [streak + longestStreak correct]
  → incrementXp(10)

Quiz → answer correctly
  → completeTaskUnit('quiz-5')
  → incrementXp(20)
  → markStudyToday()

Quiz → answer wrong
  → addWrongAnswer({ id, wordId, question, ... })

Quiz → finish
  → addQuizSession(session)      [now actually saves history]

Memory → × on wrong answer
  → removeWrongAnswer(wa.id)     [single-entry removal]

Memory → Review → "Remember"
  → updateReview(wordId, true)   [SM-2 interval extended]
  → incrementXp(15)
  → completeTaskUnit('review-10')

Study page mount
  → autoResetDailyTasksIfNewDay() [resets if new calendar day]
```

---

## WebGL Lifecycle

```typescript
// Before: material disposed on EVERY geometry change → crash on REPLAY
useEffect(() => {
  const geo = geometry; const mat = materialRef.current
  return () => { geo.dispose(); mat?.dispose() }   // ← BUG
}, [geometry])

// After: split into two effects
useEffect(() => {
  const geo = geometry
  return () => { geo.dispose() }                   // geometry changes
}, [geometry])

useEffect(() => {
  return () => { materialRef.current?.dispose() }  // unmount only
}, [])
```

---

## Verification

| Check | Result |
|---|---|
| Desktop homepage hero | ✅ Particles + nodes + panel |
| Mobile homepage (390px) | ✅ Hero text no longer overlaps nodes |
| Dictionary with level filter | ✅ Pre-selects userLevel |
| Word detail full flow | ✅ Save → Review → XP → Streak all update |
| Quiz MCQ + feedback | ✅ Wrong answers tracked; session saved |
| Memory 3-tab interface | ✅ Single-entry removal works |
| Study page daily tasks | ✅ Auto-reset logic + streak display fixed |
| Chat mock AI | ✅ Responses + history persist |
| Scan mock OCR | ✅ No inline `<style>` hydration issue |
| Exam drill | ✅ Works unchanged |
| Onboarding sync | ✅ Zustand + pre-selects existing level |
| `npm run lint` | ✅ |
| `npm run build` | ✅ |
