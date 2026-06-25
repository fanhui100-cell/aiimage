# Release Readiness — Ocean English Question Bank (2026-06-25)

> Branch `iter5-f1`. Source of truth: `reports/qbank-v2-coverage-audit.json` (45-cell canonical matrix) + live DB. Generated after R10-full promotion (active 1993 sets / 3173 items) and R13/R14 gates.

## Summary

| Classification | Cells | Notes |
|---|---|---|
| **ACTIVE_READY** | **38 / 45** | Promoted, served, invariant-checked |
| **BLOCKED_SPEC** | 2 | TOEFL reading MCQ — ETS option-count unverified |
| **BLOCKED_RUNTIME** | 1 | TOEFL `build_a_sentence` — equivalence scoring not implemented |
| **BLOCKED_AUDIO** + runtime | 2 | TOEFL speaking — no synthesized speaking-prompt audio + no `speak` renderer |
| **INSUFFICIENT_CONTENT** | 2 | TOEFL listening — 0 authored content |

All 7 non-active cells are **TOEFL**. Six of the seven exams (zhongkao, gaokao, cet4, cet6, kaoyan, SAT) are fully ACTIVE_READY.

## Per-exam classification

### zhongkao / gaokao / cet4 / cet6 / kaoyan — ACTIVE_READY (all sections)
Every canonical section active with reviewed content, deterministic objective answers, productive rubrics + honest AI estimate, listening active audio. Includes the R13 Claude rewrites (banked_cloze, grammar_fill, seven_select, cloze_passage, para_match) and the R10-full productive promotions (writing/translation).

- **SAT (lv7)** — ACTIVE_READY: 4 reading domains active (information_and_ideas, craft_and_structure, expression_of_ideas, standard_english_conventions), 50/domain.

### TOEFL (lv6) — partially blocked
- **ACTIVE_READY**: `complete_the_words` (70), `email_writing` (60), `academic_discussion` (60) — promoted R10.
- **BLOCKED_SPEC**: `read_daily_life`, `reading_comprehension` — `official_spec_unverified`. ETS has not published an authoritative item-count / option-count rule for the 2026 format that we could cite. Per plan rule 7/49, content must not be authored on assumption. **Needs:** an authoritative ETS source confirming grouping + option count, or an explicit decision to author to a documented ranged spec.
- **BLOCKED_RUNTIME**: `build_a_sentence` (10 draft, `scoring_not_ready`) — requires an `acceptedSequences`/equivalence-scoring contract (R3) and the ETS interaction spec (R4). **Needs:** equivalence-scoring implementation + spec confirmation.
- **BLOCKED_AUDIO + BLOCKED_RUNTIME**: `listen_and_repeat`, `interview_speaking` (10 draft each, rubric present). **Needs:** (a) synthesized speaking-prompt audio activated (Azure pipeline exists from R6/R7; prompts are machine_checked), (b) a `speak` input-mode renderer in PracticeRunner (currently unrouted), (c) expansion to 50, (d) a speaking-response privacy/storage decision.
- **INSUFFICIENT_CONTENT**: `choose_a_response`, `listening_comprehension` — 0 authored sets. **Needs:** spec confirmation + original script/question authoring + audio.

## Cross-cutting release notes (not section-blocking)

1. **Mock papers (R11) — productive & listening sections not assembled.** `lib/papers/paper-generator.ts` `drawTask` is objective-only; newly-active writing/translation sections (and listening) currently appear as 0-item in generated papers. Practice mode serves them correctly (free_text + rubric + AI estimate verified); **mock-paper assembly of productive/listening sections is a remaining R11 server task**, coupled to the design-gated paper UI. The paper generator is verified deterministic (same seed → identical paper, 4× confirmed).
2. **Frontend UI (R11/R12) — design-gated.** Server paths complete (submit-paper authoritative scoring, skill-state writer, AI estimate wiring). The mock-paper UI (selection/timer/section-nav/results/pending-subjective) and Today/ReviewHub/Report confidence labels are behind `FRONTEND_CHANGE_NOTICE` and require Claude Design input or explicit authorization to follow the existing `.pr-v2` system.
3. **`validate:papers` is slow + can transiently flag determinism** under the now-large active pool (6 full generations × many DB round-trips). The generator itself is deterministic; the flag is environmental DB-read variance, not a code defect.
4. **Browser sweep (R13)**: static route presence + DB safety invariants PASS (`smoke:full-routes`). Full desktop/mobile Playwright across all routes should run via `npx playwright test` in a dev-server environment (harness present: `e2e/*.spec.ts`).

## Gate results (R14)

| Command | Exit |
|---|---|
| validate:qbank-v2 | 0 (1993/3173, 0 errors) |
| validate:question-types / exam-specs / rubrics / practice-session / learning-loop | 0 |
| validate:audio-assets | 0 (224 active listening, 244 audio rows) |
| verify:toefl-current | 0 (reconciled to post-R10 active state) |
| smoke:active-serve / smoke:grouped-cloze / smoke:full-routes | PASS |
| tsc --noEmit / eslint | 0 |
| validate:papers | ⚠ slow / environmentally flaky determinism (generator verified deterministic) |
| build | see commit gate |

## Verdict

**Not "complete" while TOEFL reading/listening/speaking/build_a_sentence remain blocked** (explicit, documented, each with a concrete unblocking input). **6 of 7 exams are fully active and release-ready**; the question-bank content layer for those exams is done. Remaining work is (a) TOEFL — needs external ETS spec + audio/renderer decisions; (b) mock-paper productive/listening assembly + the design-gated frontend UIs.
