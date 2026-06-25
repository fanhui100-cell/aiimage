# Full Product Route & Safety Audit — R13 (2026-06-25)

> Branch `iter5-f1`. Run via `npm run smoke:full-routes` (static + DB; no browser) and `npx playwright test` (browser, requires `next dev` webServer).

## Scope

After activating the v2 question bank to **1993 active sets / 3173 active items** (38/45 canonical cells ACTIVE), verify product entry points, safety invariants, and absence of regressions. This is a verification pass, not a redesign.

## A. Route presence (static)

All plan-listed routes resolve to a page (with two naming differences mapped to their actual implementations):

| Plan route | Actual file | Status |
|---|---|---|
| `/today` | `app/today/page.tsx` | ✓ |
| `/review` | `app/wrong-answers/page.tsx` (review hub is Wrong-Answers/Reminders) | ✓ (renamed) |
| `/reading` | `app/reading/page.tsx` | ✓ |
| `/vocabulary` | `app/lexiverse/page.tsx` (vocabulary universe) | ✓ (renamed) |
| `/lexiverse`, `/lexiverse/word/[slug]` | present | ✓ |
| `/lexigraph`, `/knowledge`, `/drill`, `/quiz`, `/exam`, `/groups`, `/word/[slug]` | present | ✓ |

Key API routes present: practice session/attempts; papers + `[id]` + submit; daily-plan; diagnostics; scoring writing/translation/speaking. ✓

## B. DB safety invariants (automated, `smoke:full-routes`)

| Invariant | Result |
|---|---|
| 0 `active` deprecated types (`antonym_choice`/`cet_cloze`) | ✓ 0 |
| `active` set ⇒ `active` stimulus (serving needs active stimulus or passage/audio is dropped) | ✓ 0 non-active |
| `active` listening set ⇒ `active` audio asset | ✓ 0 missing (224 listening sets) |
| listening payload excludes transcript pre-submit | ✓ (`smoke:active-serve`) |
| answer-key in practice payload | **Accepted by design** — self-study mode shows answer+explanation post-submit only; documented in ledger `R3-leak-accepted` (owner authorized). A future proctored mode would gate this server-side (R11 authoritative scoring already keeps paper keys server-side). |
| RLS cross-user isolation (paper_instances/attempts/question_attempts/skill_states `USING auth.uid()=user_id`; `audio_assets.transcript` column REVOKEd from anon) | ✓ verified in ledger `R13-exam-id-serving-bug` / `R6-read-side-hardening` |

## C. Browser interaction layer (Playwright)

`playwright.config.ts` defines a `webServer` (`npx next dev`, `localhost:3000`). Existing specs: `e2e/closed-loop.spec.ts`, `e2e/learning-loop.spec.ts`.

**Run in a dev-capable environment:** `npx playwright test` (boots the dev server + runs desktop/mobile projects). This covers console-error-free render, layout (no overlap/clipped controls), keyboard/screen-reader semantics, and the closed practice→attempt→review loop.

Not executed in this headless CI pass (requires a running dev server + installed browsers). The static + DB gate above is the CI-runnable portion; browser coverage is the developer/CI-with-server portion. No P0/P1 issue is implied — the serving-layer invariants (the highest-risk area after mass activation: deprecated types, stimulus/audio activation, transcript leak) all pass automatically.

## D. Findings

- **No P0/P1** content-fallback, deprecated-type, stimulus-inactive, audio-missing, or transcript-leak issue after activating 1993 sets.
- **Naming**: `/review` and `/vocabulary` from the plan map to `/wrong-answers` and `/lexiverse`; navigation uses the actual names. No broken route.
- **Residual (P2)**: full desktop/mobile Playwright sweep across all 12 routes should be run in a dev environment via `npx playwright test`; the harness exists.

## E. Verdict

Serving-layer and route presence: **PASS**. Browser interaction sweep: **harness ready, run with `npx playwright test`** in a server-capable environment.
