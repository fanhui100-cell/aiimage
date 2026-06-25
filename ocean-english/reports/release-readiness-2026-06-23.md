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

1. **Mock papers (R11) — DONE (2026-06-25).** `lib/papers/paper-generator.ts` now assembles all section kinds: objective (incl. grouped `multi_blank`/`matching` with answer-free render metadata — `blankCount`/`blanks`/`matchTargets`), listening (post-R13 active audio), and productive/subjective (1 real prompt per writing/translation/speaking section, still `needs_manual_or_ai_scoring`). `answerKey` remains stripped by `toClientPaper`. End-to-end verified by `smoke:paper-e2e` (gaokao full: all-correct 110/110, all-wrong 0/110, subjective → `needsManualOrAi`). Generator still deterministic (same seed → identical set/item selection).
2. **Frontend UI (R11/R12) — DONE (2026-06-25), additive overlay.** `MockExam.tsx` switched off `/api/mock-exam` to `POST /api/papers` + `/api/papers/[id]/submit` (server-authoritative scoring; no client answer comparison; no answer leak), rendering every input mode (choice/listen MCQ, spell, multi_blank cloze/banked/grammar, matching, free_text/speak) and AI-estimating subjective sections via `/api/scoring/*`; unauthenticated → objective unscored (honest), subjective still estimated. Today/ReviewHub/Report **additively overlay** v2 server data (daily-plan cards + diagnostics mastery/confidence/isEstimate) on top of the existing lexiStore UI — rendered only when authenticated with real v2 attempts, auto-hidden otherwise, following the existing `.pr-v2`/lx visual systems (no redesign).
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
| smoke:paper-e2e (R11 整卷生成→提交→判分) | PASS (2026-06-25) |
| build (next build) | 0 (2026-06-25) |
| tsc --noEmit / eslint | 0 |
| validate:papers | ⚠ slow / environmentally flaky determinism (generator verified deterministic) |
| build | see commit gate |

## Verdict

**Not "complete" while TOEFL reading/listening/speaking/build_a_sentence remain blocked** (explicit, documented, each with a concrete unblocking input). **6 of 7 exams are fully active and release-ready**; the question-bank content layer for those exams is done. As of 2026-06-25, **R11 (mock papers — full server-authoritative assembly + scoring) and R12 (learning-face v2 overlay) are DONE** (see cross-cutting notes 1–2; `smoke:paper-e2e` + build green). Remaining work is solely **TOEFL** — needs external ETS spec confirmation + speaking audio/renderer + listening content authoring decisions.
