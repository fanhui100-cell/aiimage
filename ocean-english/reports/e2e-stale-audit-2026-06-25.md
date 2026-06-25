# E2E Suite Audit — Playwright (2026-06-25)

> First full run of `npx playwright test` in a dev-server env (R13 had only run the static route/DB smoke and deferred the browser layer). Branch `iter5-f1`.

## Result

| Before | After |
|---|---|
| 4 passed / **8 failed** | **5 passed / 7 skipped (fixme) / 0 failed** |

All 8 failures were **pre-existing stale specs, not R11/R12 regressions**. Proof: reverting `TodayBento.tsx` + `ReviewHub.tsx` to the pre-R11 commit `dd0a7e9` and re-running produced the **identical** 4 learning-loop failures; the 4 closed-loop failures touch only routes whose components R11/R12 never changed (`/onboarding`, `/lexiverse`, `/lexigraph`, `/word`). The specs date from 界面优化5 阶段2 and were never updated through the 界面优化4/5 Bento redesign, lexiverse v3, the lexigraph iframe move, and the `/quiz` migration to the real practice-session API.

## Per-test classification (8 failures)

| Test | Root cause class | Disposition |
|---|---|---|
| learning-loop `复习评「记得」` (:136) | **stale text** — wait-anchor `词汇掌握率` (that string is on MeScreen, not the review-complete screen) | **FIXED** → `复习完成` + `总掌握率` (flow + store assertions intact, verified green) |
| learning-loop `定级→今日页推荐区` (:72) | **behavior change** — `/today`(TodayBento) no longer auto-calls `buildTodayPack` on mount (only HomeScreen/Onboarding do); e2e has no login + store not on `window` → can't drive | `test.fixme` |
| learning-loop `次日重置` (:198) | **behavior change** — same as :72 (`buildTodayPack` auto-trigger left `/today` with the retired TodayScreen) | `test.fixme` |
| learning-loop `测验答错→weak` (:106) | **data precondition** — `inevitable` has no `active`+`is_reviewed` row in the rebuilt `question_bank` → real session API returns empty pool | `test.fixme` |
| closed-loop `定级→…→celebrate 巡航` (:45) | **stale flow + selectors** — onboarding is now 5 steps with explicit 「下一步 →」 CTAs + `四级` selector ambiguity (WordRotate title vs goal card); downstream celebrate still v2 iframe | `test.fixme` |
| closed-loop `宇宙就地评分` (:131) | **stale (v2→v3 iframe)** — `window.__galaxy`/`.lv2-grades` gone; scoring now `wu-ui.focusWord` + review-pod MCQ | `test.fixme` |
| closed-loop `记忆图谱红边` (:161) | **removed feature / product gap** — red-edge (`data-wrong-edges`) lives only on orphaned `LexiGraphScreen.tsx` (no route imports it); `/lexigraph` now renders an iframe prototype that doesn't expose it | `test.fixme` |
| closed-loop `词详情↔词图↔宇宙` (:195) | **stale (redirects + v3 iframe)** — `/word`→`/dictionary` redirect, `/lexigraph`+`/lexiverse` are iframe shells; `.lv2-dock` + old copy gone; bridge also drops `?word=` | `test.fixme` |

Per-test current-UI selector/behavior mappings (the precise replacements) were produced by an 8-agent investigation; see the fixme comment on each test for the one-line cause and the un-fixme requirement.

## Product findings surfaced (decisions for the owner)

1. **Memory-graph red-edge visualization is orphaned.** `components/lexigraph-v2/LexiGraphScreen.tsx` (the only component rendering co-error red edges + the 语义图谱/记忆图谱 toggle) has no route importing it; `/lexigraph` renders the iframe prototype (界面优化10 1:1 移植) which never rebuilt this feature. Decide: restore it (and expose a count via postMessage/data-attr for e2e), or retire the test.
2. **`/today` no longer auto-builds the today-pack.** TodayBento reads the cached pack only; `buildTodayPack` auto-trigger now lives on HomeScreen/Onboarding. Decide: should opening `/today` rebuild a stale/next-day pack (add a mount effect like the retired TodayScreen had), or is cache-only intended?
3. **`/quiz?mode=word` needs question-bank-backed words.** After the bank rebuild, word-mode practice serves the real session API, so a word with no `active`+`reviewed` rows shows the empty state. E2E for this flow needs a seeded fixture or a known-good word, not a dictionary-only word like `inevitable`.

## Recommendation

These 8 specs cover the **v1 lexiStore single-word learning loop**, which is orthogonal to the v2 question-bank master plan. Properly rebuilding the 7 fixme'd tests is a scoped effort (v3 iframe-internal driving + the 3 product decisions above + a question_bank e2e fixture), not a quick text-swap. Recommend deciding the 3 product questions first, then rebuilding the suite against current UI. The R11/R12 work itself is covered by tsc/eslint/build + the `smoke:*` gates (all green) and is unaffected.

## Aside (not blocking)

Dev-mode `Hydration failed` warnings appear in the Playwright WebServer log (e.g. time-of-day greeting / `Date.now()` at render). Pre-existing, dev-only; `next build` is clean and no test fails on it.
