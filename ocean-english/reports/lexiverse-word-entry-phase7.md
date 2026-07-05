# Lexiverse Word Entry — Phase 7 Report

Date: 2026-06-20
Phase: 7 — Lexiverse word entry (focused CTAs)
Branch: iter5-f1
Design: implemented per Claude Design handoff `docs/design-briefs/2026-06-20-lexiverse-word-cta-handoff/`, **scoped to the Phase-7 brief** (focused CTAs only).

## 0. Scope note (important)

Claude Design's package over-delivered vs the Phase 7 prompt (which says "Add
focused CTAs only. Do not redesign the whole Lexiverse" and "Do not add unrelated
navigation or marketing UI"). Per the user's decision, **only the in-scope core
was implemented**: the focused CTA group (`WordPracticeActions`), the URL builder,
the word cross-links, the empty-pool state, and the return flow. The handoff's
extra **ProductNav/BottomNav section navigation** and the **full-page visual
redesign** (Hero planet orb, starfield, editorial typography) were **deferred**
as out of Phase 7 scope. The CTA group itself follows the Claude Design visual
spec (split control, colors, tokens).

## 1. Changed files

| File | Type | Purpose |
|---|---|---|
| `lib/lexiverse/word-practice-links.ts` | created | Pure URL builder `buildWordPracticeLinks(word, returnTo)` (no router/store coupling) |
| `components/lexiverse/WordPracticeActions.tsx` | created | Focused CTA group: 练这个词 \| 考试语境 (split) · 词图关系 · 加入今日 + 问AI/词库浏览 |
| `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx` | modified | Replaced the old 5-button row with `<WordPracticeActions>`; pool-empty probe; Esc-to-close; InfoGrid cross-links restricted to word cells |
| `scripts/smoke-lexiverse-word-phase7.ts` | created | Playwright click-level smoke |
| `docs/design-briefs/2026-06-20-lexiverse-word-cta-handoff/**` | added | Archived design handoff |
| `reports/lexiverse-word-entry-phase7.md` | created | This report |

**Not touched:** `ReferenceLexiverseFrame.tsx` (no postMessage/origin change), 3D
scene/`LexiverseScene.tsx`, `TodayBento.tsx` (add-to-today reuses the existing
`lexiStore` path on the word page). **DB changes: none.**

> **Codex review fix (2026-06-20):** `TodayBento.tsx` had a *pre-existing*
> working-tree change (not from Phase 7) that removed the Today「试炼 / 限时测验」
> `/exam` quick tool. Restored to HEAD (`git checkout HEAD -- TodayBento.tsx`),
> so the Today→exam entry path is intact; Phase 7 leaves `TodayBento.tsx`
> unmodified vs HEAD.

## 2. Frontend visible changes

The word detail page (`/lexiverse/word/[slug]`) headword now has a single
focused CTA group (replacing the flat 5-button row):
- **练这个词 | 考试语境** — a visually-joined split control (cyan primary filled + yellow tonal lens), "two lenses of the same word pool".
- **词图关系** (purple tonal) → `/lexigraph`.
- **加入今日** (orange tonal) → toggles to **已加入今日** (green, disabled) after click.
- Secondary text links: **问 AI**, **词库浏览**.
- A pool-status indicator (青 ready / 橙 empty).
InfoGrid: 近义/反义 chips cross-link to the respective word pages. **搭配
(collocations) are phrases (e.g. "make a decision") — not dictionary word ids —
so they are intentionally NOT linkified** (Codex P2 fix, avoids 404); 考试等级/
主题/助记 likewise stay non-links.

## 3. CTA status (live / fallback)

| CTA | Status | Behavior |
|---|---|---|
| 练这个词 | **live** | `/quiz?word=<id>&returnTo=<wordpage>` → PracticeRunner word session |
| 考试语境 | **live** | `/quiz?word=<id>&mode=exam-practice&returnTo=…` — **same word pool**, exam-style lens (cloze/synonym/辨析 of that word); v1 has no per-word exam-task questions, so it intentionally does **not** open a new/random source |
| 词图关系 | **live** | `/lexigraph?word=<id>` (existing route) |
| 加入今日 | **live** | `lexiStore.ensureWord(word,'lookup') + addToReview(id)`; `isInReview(id)` drives the 已加入今日 state (v1: 今日 = 今日复习队列) |
| 问 AI / 词库浏览 | live | `/chat?context=word` / `/dictionary?tab=explore` |

`练这个词` and `考试语境` both resolve to a **word-specific** session for that
word (mapToRunnerProps is word-first); neither falls back to unrelated random
questions.

## 4. Empty-pool behavior (no silent fallback)

The page probes `GET /api/practice/session?mode=word&word=<id>&count=1` on mount.
If the word has no questions, `poolEmpty=true`: the practice split is disabled
(「暂无可练题目 / NO ITEMS YET」) with an orange hint「正在补充中——不会用无关
随机题替代」; 词图关系 and 加入今日 remain usable. Verified live: `improve` →
ready/playable; `ability` (no pool) → the PracticeRunner itself shows its
controlled empty state「该词还没有题目」(no random fallback). Old `/quiz?word=…`
links remain compatible.

## 5. Return flow

Practice links carry `returnTo = <current word page url>`. PracticeRunner's exit
button does `router.push(returnTo)` → back to the word page (verified). The page
also adds **Esc → return to the star map** (`returnTo` = `/lexiverse`, galaxy
param preserved), equivalent to the existing「Back · 返回」button. The full
ProductNav close-✕ was deferred (out of scope); the existing Back button is the
close affordance.

## 6. Security

No iframe/postMessage code was touched. `ReferenceLexiverseFrame` origin checks
are unchanged. No user-controlled external URLs are passed to the router — all
CTA targets are internal app routes built from `word.id` (encoded). Word
cross-links slugify labels to internal `/lexiverse/word/<slug>` only.

## 7. Browser smoke results

`scripts/smoke-lexiverse-word-phase7.ts` (Playwright, desktop) — **14 checks, 0 failures** (WORD=improve):
- `/lexiverse` loads, no crash.
- CTA group present (练这个词/考试语境/词图关系/加入今日).
- 练这个词 → real request `/api/practice/session?mode=word&word=improve` (not en_to_zh, not mode=task).
- Return flow: runner exit → back to `/lexiverse/word/improve`.
- 考试语境 → still `mode=word&word=improve` (word-specific, not random).
- 加入今日 → toggles to 已加入今日.
- No `pageerror` runtime crash.

## 8. Verification results (exit codes)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **pass** (exit 0) |
| `npm run lint` | **pass** (exit 0) |
| `npx tsx scripts/smoke-lexiverse-word-phase7.ts` | **pass** — 14/14 (exit 0) |

## 9. Incomplete / deferred

- **Deferred (out of Phase 7 scope):** Claude Design's ProductNav section tabs + BottomNav, and the full-page deep-space visual redesign (Hero planet orb / starfield / editorial typography). These exceed "focused CTAs only / no redesign / no unrelated nav" and should be a separate phase if wanted.
- 考试语境 currently shares the word session pool (exam-style lens); a dedicated per-word exam-task context needs the v2 question bank + a session word+taskType filter (future).
- Exact pool count ("N 题就绪") is shown as a state ("本词题库就绪") rather than a number — exact counts need a backend count endpoint.
