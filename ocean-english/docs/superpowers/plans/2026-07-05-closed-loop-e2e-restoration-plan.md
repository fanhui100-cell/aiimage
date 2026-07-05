# Closed-Loop E2E Restoration Plan (2026-07-05)

> **Track split from** `docs/superpowers/plans/2026-07-05-post-cc-review-conditional-pass-development-plan.md` (Task 7).
> **Purpose:** Restore executable Playwright coverage for the user loops that are currently `test.fixme` in `e2e/closed-loop.spec.ts` (CC-review P2-10). Owner decided (2026-07-05) to run this as an independent track rather than inline, to avoid rushed/flaky rewrites.

## Decisions already recorded (2026-07-05)

- **Wrong-edge (共错红边): DE-SCOPED.** The only carrier `components/lexigraph-v2/LexiGraphScreen.tsx` was orphaned (no route import) and the live `/lexigraph` iframe never exposed it. The component and its e2e case (old test 3) were removed. Do **not** re-add wrong-edge assertions unless the feature is reinstated as a product decision.

## Remaining fixme cases to rewrite (against current v3 UI)

All three assume the current stack: `/word/[slug]`→`/dictionary?word=` redirect, `/lexigraph` and `/lexiverse` are v3 iframes, onboarding is a 5-step flow (goal→path→channel→assess→result with explicit "下一步 →" CTAs).

1. **定级→今日包→学→练→celebrate 巡航→次日到期** — rewrite against the 5-step onboarding and the v3 `Universe.html` celebrate cruise (`?celebrate=1`); assert `todayPack.recommendedIds`, `daily.quizzed`, cruise overlay, and next-day due queue.
2. **宇宙就地评分 → SRS 间隔增长** — the v2 globals (`window.__galaxy` / `.lv2-grades` / `.lv2-review`) are gone; drive the v3 in-iframe review pod (`wu-ui.focusWord` + 复习舱 multi-choice) via `frameLocator`, then assert store SRS (`interval`↑, `nextReviewAt` future).
3. **词详情 ↔ 词图 ↔ 宇宙 三向带词跳转** — **runtime-verified feasible on 2026-07-05** (see the review report's Runtime smoke): `/dictionary?word=accept` → 词图关系 CTA → `/lexigraph?word=accept` → 宇宙 CTA → `/lexiverse?word=accept&galaxy=…` with the word ball focused. Rewrite with current DOM (DictionaryVaultScreen dock buttons + v3 iframe `frameLocator`), replacing the stale `在词图中展开`/`在宇宙中查看 ✦` copy and `.lv2-dock` selectors.

## Required harness hardening (do first)

- Add a Playwright `globalSetup` app-identity/health check so the suite fails loudly if `:3000` is a foreign server (CC-review P1 → downgraded P3, but still worth doing): assert an app-unique marker (e.g. `localStorage['lexi-store-v1']` write path or a `/api/dictionary/recommend` shape) before running.
- Consider binding e2e to a dedicated port with `reuseExistingServer: false` in CI.

## Validation

```powershell
npx playwright test e2e/closed-loop.spec.ts --project=chromium
```

Expected: the suite executes real tests (not all-fixme); each rewritten case asserts against current v3 UI without stale copy/selectors.

## Definition of Done

- Cases 1/2/4 rewritten and passing against current UI; no `test.fixme` remains in `closed-loop.spec.ts` except intentionally-deferred ones (documented).
- `globalSetup` identity check present.
- No reference to the removed wrong-edge feature.
