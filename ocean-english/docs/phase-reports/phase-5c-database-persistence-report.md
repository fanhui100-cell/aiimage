# Phase 5C: Database Persistence for Core Learning Data — Report

**Date:** 2026-06-02
**Branch:** feat/lexiocean-phase1
**Status:** Complete

---

## 1. Executive Summary

Phase 5C adds Supabase cloud persistence for core learning data while maintaining full backward compatibility with the existing localStorage-first architecture. Logged-in users get automatic background sync; logged-out users continue using localStorage unchanged.

---

## 2. Files Added

| File | Purpose |
|------|---------|
| `supabase/sql/phase-5c-core-learning.sql` | SQL schema: 10 tables + RLS policies + indexes + profile trigger |
| `supabase/README.md` | Setup guide for Supabase project configuration |
| `types/database.ts` | Lightweight TypeScript types for DB schema |
| `lib/sync/learning-sync.ts` | Fire-and-forget sync utility functions |
| `components/auth/CloudSyncProvider.tsx` | Zustand store subscriber that triggers cloud sync on auth user |
| `components/auth/ProfileCloudStats.tsx` | Profile page cloud data stats widget |
| `app/api/user/preferences/route.ts` | GET/PUT user learning level |
| `app/api/user/study-progress/route.ts` | GET/PUT XP, streak, progress |
| `app/api/user/saved-words/route.ts` | POST/DELETE saved word entries |
| `app/api/user/review-words/route.ts` | PUT batch upsert SM-2 review words |
| `app/api/user/wrong-answers/route.ts` | POST batch insert wrong answers |
| `app/api/user/quiz-history/route.ts` | POST quiz session + attempts |
| `app/api/user/stats/route.ts` | GET aggregated cloud data counts |

## 3. Files Modified

| File | Change |
|------|--------|
| `components/layout/AppShell.tsx` | Wrapped `<main>` in `<CloudSyncProvider>` |
| `app/profile/page.tsx` | Replaced placeholder with `<ProfileCloudStats />` |

---

## 4. Database SQL

**File:** `supabase/sql/phase-5c-core-learning.sql`

**Tables created (10):**
- `profiles` — extends auth.users, auto-created via trigger
- `user_learning_preferences` — userLevel, daily_goal
- `user_study_progress` — XP, streaks, totalWordsLearned
- `saved_words` — vocabulary saves (unique per user+word)
- `review_words` — SM-2 state (unique per user+word)
- `word_review_events` — SM-2 audit log
- `wrong_answers` — incorrect quiz/scan answers
- `quiz_sessions` — completed quiz sessions
- `quiz_attempts` — per-question attempts
- `user_usage_limits` — rate limit tracking (future)

**To activate:** Copy SQL → Supabase SQL Editor → Run

---

## 5. Core Data Sync Coverage

| Data | Cloud Sync | Method | Dedup |
|------|-----------|--------|-------|
| `userLevel` | ✅ | PUT /api/user/preferences | ON CONFLICT user_id DO UPDATE |
| `savedWords` | ✅ | POST /api/user/saved-words | ON CONFLICT user_id,word_id IGNORE |
| `reviewWords` | ✅ | PUT /api/user/review-words | ON CONFLICT user_id,word_id DO UPDATE (updated_at) |
| `wrongAnswers` | ✅ | POST /api/user/wrong-answers | INSERT (newest only per change) |
| `quizHistory` | ✅ | POST /api/user/quiz-history | INSERT per session |
| `studyProgress` | ✅ | PUT /api/user/study-progress | ON CONFLICT user_id DO UPDATE |
| SM-2 conflict | ✅ | last-write-wins via `updated_at` | Upsert uses updated_at |

---

## 6. RLS and Security Notes

- All 10 tables have RLS enabled
- Policy: `auth.uid() = user_id` for ALL operations
- `user_id` always comes from `supabase.auth.getUser()` — never from client input
- No service_role key in client code
- No sensitive data exposed in error responses
- `profiles` auto-created via SECURITY DEFINER trigger (safe pattern)

---

## 7. LocalStorage Compatibility

- `useLearningStore`, `useScanStore`, `useScanHistoryStore` — UNCHANGED
- Logged-out users: zero behavior change
- Logged-in users: localStorage writes first, cloud sync fires async after
- Supabase failure: logged as warning, never blocks local operation
- `CloudSyncProvider` renders nothing if `isSupabaseConfigured` is false

---

## 8. Known Limitations

| Item | Phase |
|------|-------|
| localStorage → DB migration UI | Phase 5.5 |
| Multi-device SM-2 conflict resolution | Phase 5D |
| Reading cloud data back to localStorage on new device | Phase 5D |
| scanHistory, document analysis, chat history sync | Phase 5D |
| DB rate limiting (user_usage_limits populated) | Phase 5D/6 |
| Supabase CLI generated types | Phase 5D (run `supabase gen types`) |
| wrongAnswers dedup by wordId+question in DB | Phase 5.5 |

---

## 9. Test Commands

### ESLint

```
> ocean-english@0.1.0 lint
> eslint

(no output — clean pass, exit 0)
```

**Result: PASS — 0 errors, 0 warnings**

---

### TypeScript (`tsc --noEmit`)

```
(no output — clean pass, exit 0)
```

**Result: PASS — 0 type errors**

---

### Production Build (`next build`)

```
▲ Next.js 16.2.6 (Turbopack)

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  Creating an optimized production build ...
✓ Compiled successfully in 2.8s
  Running TypeScript ...
  Finished TypeScript in 3.6s ...
  Collecting page data using 15 workers ...
✓ Generating static pages using 15 workers (37/37) in 340ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/ai/chat
├ ƒ /api/ai/document-analysis
├ ƒ /api/ai/mistake-analysis
├ ƒ /api/ai/quiz-generate
├ ƒ /api/ai/study-plan
├ ƒ /api/ai/word-explain
├ ƒ /api/document/extract
├ ƒ /api/user/preferences
├ ƒ /api/user/quiz-history
├ ƒ /api/user/review-words
├ ƒ /api/user/saved-words
├ ƒ /api/user/stats
├ ƒ /api/user/study-progress
├ ƒ /api/user/wrong-answers
├ ƒ /auth/callback
├ ○ /auth/login
├ ƒ /auth/logout
├ ○ /auth/signup
├ ○ /chat
├ ○ /dictionary
├ ○ /exam
├ ○ /memory
├ ○ /onboarding
├ ○ /profile
├ ○ /pronunciation
├ ○ /quiz
├ ○ /reading
├ ○ /scan
├ ○ /scan/history
├ ƒ /scan/history/[documentId]
├ ○ /study
├ ○ /universe
├ ƒ /universe/[module]
├ ○ /visual-lab/cosmic-td
├ ƒ /word/[slug]
└ ○ /wrong-answers

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Result: PASS — 37/37 pages generated, 0 errors**

Note: The `middleware` deprecation warning is pre-existing and unrelated to Phase 5C. It refers to the `middleware.ts` file convention being renamed to `proxy` in Next.js 16.

---

## 10. Recommended Codex Review Prompt

```
Project: LexiOcean / 深海英语学习系统
Path: d:/ai-studio/ocean-english

Phase 5C review. Key areas:

1. Security: Do any API routes trust client-supplied user_id? (Should: never)
2. RLS: Are all tables in phase-5c-core-learning.sql RLS-enabled?
3. Sync: Does CloudSyncProvider correctly avoid syncing when user is logged out?
4. Backwards compat: Is localStorage behavior unchanged for logged-out users?
5. Build: Does npm run build pass? Does npm run lint pass?
6. No service_role key in browser-accessible code?
7. Does profile page show cloud stats correctly?
8. Are API routes protected by auth.getUser()?
9. Does AppShell still render BanyanParticleHero / LuminousBanyanHero correctly?
10. Is CloudSyncProvider correctly cleaning up subscriptions on unmount?
```
