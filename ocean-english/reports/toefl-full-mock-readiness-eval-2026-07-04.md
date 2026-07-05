# Phase 2 — TOEFL full-mock readiness evaluation (2026-07-04, EVALUATION ONLY — NOT opened)

Owner instruction: evaluate whether TOEFL full/mini can open; report which sections enter/are excluded,
confirm safety invariants, list exactly what would need to change for `paperReady=true`, and give a
recommendation — **but do not open it, do not change `paperReady`.** Nothing in this phase writes DB
or flips any flag.

## 1. Current gate (verified, unchanged)

`spec.paperReady = false`. `generatePaper(toefl, full|mini)` returns `{paper:null, warnings:['paper_not_ready']}`
for both modes (empirically confirmed). `smoke:papers` asserts exactly this. **Not changed.**

## 2. TOEFL spec composition

4 sections: reading (obj, 50), listening (obj, 47, audio), writing (subj/rubric, 12:
build_a_sentence + email_writing + academic_discussion), speaking (subj/rubric/audio, 11:
listen_and_repeat + interview_speaking).

Generator rules that matter:
- `mini` mode = **objective sections only** (`sections.filter(!isSubjectiveSection)`), i.e. drops every
  `requiresRubric` section. For TOEFL that means **mini = reading + listening** (writing AND speaking dropped).
- `full` mode = all 4 sections.
- Each section draws **active-only** (`drawTask`/`drawProductive` both `.eq('status','active')`); a
  task type with 0 active is silently skipped; a section with no active pool at all → `insufficient_pool`.

## 3. Empirical per-section probe (mode='section', bypasses the paperReady gate read-only)

| section | drawn taskType | sets/items | drawn status | pools (active) | client answerKey leak | listening transcript leak | audioUrl |
|---|---|---|---|---|---|---|---|
| reading | reading_comprehension | 13 / 50 | all active | cw 100 · rdl 100 · rc 100 | **no** | n/a (reading passage textEn is meant to show) | — |
| listening | listening_comprehension | 16 / 47 | all active | car 100 · lc 100 | **no** | **no (textEn stripped)** | **yes (signed)** |
| writing | email_writing (subjective) | 1 / 1 | active | **build_a_sentence 0** · email 100 · disc 100 | **no** | no | — |
| speaking | — | 0 / 0 | — | **listen_and_repeat 0 · interview_speaking 0** | no | no | — · **insufficient_pool** |

## 4. Answers to the required checks

- **Pool sufficiency for a paper?** Objective sections (reading, listening) are fully sufficient (each
  draws its full item target from active pools with audio). The **writing** section is sufficient (draws
  1 productive prompt from email/discussion). The **speaking** section is **empty (0 active)**.
- **Which sections enter the mock / which are excluded?**
  - `mini` → **reading + listening** enter; writing + speaking excluded by design (objective-only).
    Fully buildable today.
  - `full` → reading + listening + writing enter and build; **speaking is structurally included but
    empty → `insufficient_pool`** ⇒ a full paper would be **fragmented**.
- **build_a_sentence excluded?** ✅ Yes, automatically — 0 active + it is `multi_blank` (not a productive
  free_text prompt), so `drawProductive` never selects it. It cannot appear in a paper.
- **speaking excluded?** ✅ From `mini` (objective-only). In `full` it is *included but empty* → the
  `full` paper is not coherent until speaking is either built+activated or formally removed.
- **Won't draw draft / blocked / review / scoring_not_ready / speaking_pipeline?** ✅ Confirmed: every
  draw path filters `status='active'`; the 2 pilot REVIEW were promoted (0 draft left in reading); the
  blocked types have 0 active. No draft/blocked content can enter.
- **Listening transcript not leaked, only signed audioUrl?** ✅ `toClientPaper` strips `stimulus.textEn`
  for listening (probe: transcript leak = no) and delivers a signed `audioUrl` (probe: yes). Reading's
  `textEn` is the passage and is correctly shown (not a leak).
- **Answers not pre-leaked?** ✅ `toClientPaper` deletes `answerKey` on every item; `drawProductive`
  sets `answerKey=null`. Probe: answerKey leak = no in all sections.

## 5. What `paperReady=true` would require (files / assertions / smokes)

Opening the mock is **not** a one-flag change, because flipping `paperReady=true` opens BOTH `full` and
`mini`, and `full` would then emit a fragmented paper (empty speaking). A coherent open needs:

1. **`lib/exam-specs/specs.ts`** — set TOEFL `paperReady: true` AND resolve speaking:
   - decide the TOEFL "full mock" definition given speaking is deferred (F5) and build_a_sentence blocked
     (F4 option 4). Cleanest: add a section-level flag (e.g. `excludeFromPaper?: true` / `comingSoon?: true`)
     on the speaking section so the paper composes reading + listening + writing without a hollow speaking
     block. (build_a_sentence needs no flag — 0-active already excludes it.)
2. **`lib/papers/paper-generator.ts`** — in `generatePaper`, filter out sections flagged
   `excludeFromPaper` for `full` (and keep the existing subjective-drop for `mini`); so `full` = reading
   + listening + writing, `mini` = reading + listening. Add a guard so an intentionally-excluded section
   never contributes `insufficient_pool`.
3. **`scripts/check-paper-api-smoke.ts`** (`smoke:papers`) — the spec-derived `expectedRefusal` currently
   maps TOEFL→`paper_not_ready`; once `paperReady=true` it must instead expect TOEFL full/mini to
   **generate** (and assert the composed sections = {reading, listening, writing}, speaking absent).
4. **`scripts/validate-toefl-task-alignment.ts`** — it hard-asserts `spec.paperReady === false`; flip to
   `true` and update `blockerSummary.paperReady` + the header contract.
5. **`scripts/validate-paper-generator.ts`** (`validate:papers`) — extend the determinism/section smoke
   to include TOEFL full+mini (built, non-fragmented, no deprecated types, listening audio present).
6. **New: TOEFL paper e2e** — mirror `smoke:paper-e2e` (currently gaokao) for TOEFL: objective
   reading+listening auto-scored, writing section flagged `needs_manual_or_ai_scoring`, submit/return
   path clean, no answer/transcript leak in the client payload.
7. **Docs** — `reports/toefl-paper-readiness-*.md` + issue ledger + coverage note flip TOEFL to
   paper-open with speaking documented as excluded-by-decision.

## 6. Recommendation — **do NOT open the TOEFL full mock yet**

- A true 4-skill TOEFL "full mock" cannot be assembled today: the **speaking section has zero active
  content** (speaking pipeline deferred, F5), so `full` is inherently fragmented. Shipping a "full TOEFL
  mock" without speaking would misrepresent the exam; shipping it with an empty speaking section is worse.
- The **mini** (objective reading + listening) **is technically buildable and safe today** (all active,
  audio + no leaks), but it cannot be opened in isolation without a code change, because `paperReady=true`
  simultaneously exposes the fragmented `full`. Opening mini-only requires the per-section/per-mode
  exclusion work in §5 anyway.
- Therefore: **keep `paperReady=false`.** The path to a coherent open is a **product decision** —
  either (a) build + activate the speaking pipeline (F5) and then open full, or (b) explicitly redefine
  the TOEFL mock to exclude speaking (and, per taste, writing), implement the §5 §1-§2 section-exclusion
  flag, add the §5 §3-§6 smokes/e2e, and open. Both are owner calls; this phase only evaluates.

## 7. Disclosure
- DB writes: **none**. `paperReady`/spec/generator: **unchanged**. This phase created only this report.
- The full/mini gate still returns `paper_not_ready`; `smoke:papers` still green with TOEFL refused.
