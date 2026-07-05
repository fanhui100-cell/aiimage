# Ocean English Question Bank Rebuild Claude Code Handoff Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Ocean English's question-bank system in reviewable phases, with Claude Code completing one phase at a time and Codex reviewing before the next phase is issued.

**Architecture:** Keep the existing `question_bank` usable while introducing better taxonomy, exam specs, v2 schema, practice sessions, audio assets, mock papers, and learning-loop diagnostics. Treat Lexiverse as the core word-learning entry, and let exam practice grow from the word universe instead of becoming a separate generic quiz site.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, existing `question_bank`, future question-bank v2 tables, scripts under `scripts/*.ts`, reports under `reports/*.md`.

---

## Collaboration Rules

Codex and Claude Code should work in this loop:

1. Codex gives only one phase prompt at a time.
2. The user sends that phase prompt to Claude Code.
3. Claude Code completes the phase and reports changed files, verification commands, database changes, risks, and unresolved items.
4. The user sends Claude Code's result back to Codex.
5. Codex reviews the diff and verification results.
6. Codex either asks for fixes or gives the next phase prompt.

Hard constraints:

- Do not physically delete existing `question_bank` data unless a later phase explicitly asks for a backed-up migration or retirement step.
- Do not change DeepSeek route rate-limiting in this rebuild unless the user explicitly reopens that topic.
- Do not copy real exam passages, real exam questions, or copyrighted exam content into the project. Use official format references only, then generate original or licensed content.
- Keep old routes and old APIs usable until their replacements are verified.
- Every phase must be independently reviewable and reversible.
- Claude Code must never silently edit unrelated dirty files.

## Mandatory Frontend Design Gate

Any phase that changes visible UI, route structure, navigation, page layout, CTA text, controls, answer interaction, practice flow, result screens, CSS, or component composition must stop before implementation and tell the user first.

Claude Code must output a block titled:

```md
FRONTEND_CHANGE_NOTICE
- Routes/pages affected:
- Existing user flow:
- Proposed user flow:
- Visible UI changes:
- Components likely touched:
- Data/API dependencies:
- Empty/loading/error states:
- Accessibility/responsive concerns:
- Acceptance criteria:
```

Then Claude Code must pause frontend implementation. The user will send that notice to Claude Design. After Claude Design returns a design/spec, the user can send it back to Claude Code for implementation.

Allowed before Claude Design:

- Reading frontend files.
- Writing backend/API/schema/scripts/tests that do not alter visible UI.
- Writing the `FRONTEND_CHANGE_NOTICE`.

Not allowed before Claude Design:

- Changing pages, components, CSS, navigation, visible labels, layout, answer controls, or route-level behavior.

If the visible change is only hiding a deprecated button or removing an obsolete option, Claude Code still must notify the user. The user can explicitly approve "follow existing design and implement" if Claude Design is unnecessary.

## Overall Phase Roadmap

| Phase | Name | Main Goal | Frontend Design Gate |
|---|---|---|---|
| 0A | Taxonomy baseline, backend only | Classify current question types, prevent deprecated types from backend/default exam pools, generate UI design notice | Notice only |
| 0B | Taxonomy UI cleanup | Hide deprecated types from `/drill` and `/quiz` after design approval | Required |
| 1 | Single exam-spec source | Build `lib/exam-specs` as the only source for seven-level exam structures | Usually no UI |
| 2 | Vocabulary level audit | Check whether each level's word coverage matches real exam needs, especially CET-6 and postgraduate English | No |
| 3 | Question-bank v2 schema | Add v2 tables/contracts for exams, sections, tasks, stimuli, sets, attempts, audio, rubrics | No |
| 4 | Practice Session API | Build unified session and attempt APIs for word practice, exam tasks, sections, and papers | No |
| 5 | PracticeRunner | Create one frontend runner for choice, spell, multi-blank, matching, listening, speaking, free text | Required |
| 6 | `/drill` redesign | Split into Word Universe Practice, Exam Task Practice, Mock Papers | Required |
| 7 | Lexiverse word entry | Add word-detail and galaxy entry points into word practice and exam-style practice | Required |
| 8 | Migrate old bank to v2 | Migrate usable v1 questions into v2 draft/reviewed/active states | No |
| 9 | Listening audio assets | Build stable audio pipeline and player for real listening tasks | Required for player |
| 10 | Mock paper generator | Generate reproducible section-based papers and diagnostics | Required |
| 11 | Question-type expansion | Fill real exam gaps by task template, without copying real exam content | No, except if new UI states appear |
| 12 | Subjective scoring | Add writing, translation, speaking rubrics and scoring APIs | Required |
| 13 | Learning loop | Connect attempts to word state, skill state, wrong-answer queues, Today, Review, Report | Required |

## Phase 0A: Taxonomy Baseline, Backend Only

Phase 0A is the first prompt to send to Claude Code now.

Purpose:

- Create a reliable question-type taxonomy.
- Prevent deprecated question types from backend/default exam pools.
- Do not change visible frontend yet.
- Produce a `FRONTEND_CHANGE_NOTICE` for Phase 0B.

### Current Type Decision

Keep as Word Universe practice types, but do not treat them as real exam task types:

- `en_to_zh`
- `zh_to_en`
- `def_to_word`
- `cloze_choice`
- `cloze_spell`
- `zh_to_word_spell`
- `word_form`
- `listen_to_meaning`
- `dictation_spell`
- `synonym_choice`
- `synonym_substitute`
- `collocation_choice`
- `confusable_choice`

Keep as real exam task types:

- `reading_comprehension`
- `listening_comprehension`
- `banked_cloze`
- `seven_select`
- `para_match`
- `cloze_passage`
- `grammar_fill`

Deprecate from default routes, recommendations, mock papers, and exam-task pools:

- `antonym_choice`
- `cet_cloze`

Keep only as compatibility aliases, not visible task types:

- `definition_to_word`
- `zh_definition_to_word`
- `listen_to_word`

### Claude Code Prompt For Phase 0A

Copy this whole block to Claude Code:

```md
You are implementing Ocean English question-bank rebuild Phase 0A: taxonomy baseline, backend only.

Important process rule:
- Do not change visible frontend in this phase.
- Do not edit `components/**`, page components, route UI, CSS, visible labels, navigation, answer controls, or frontend layout.
- You may read frontend files to understand impact.
- If a frontend change is needed, write a `FRONTEND_CHANGE_NOTICE` in the report and stop. The user will send it to Claude Design before frontend implementation.

Goals:
1. Do not physically delete any `question_bank` data.
2. Create a shared question-type taxonomy.
3. Stop deprecated types from backend/default exam pools.
4. Keep old data compatible.
5. Do not change DeepSeek route rate-limiting.
6. Do not create question-bank v2 schema in this phase.
7. Do not regenerate question-bank data.

Read these files first:
- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-development-plan.md`
- `docs/design-briefs/2026-06-20-question-bank-system-redesign.md`
- `lib/mock-exam/paper-specs.ts`
- `app/api/questions/route.ts`
- `app/api/mock-exam/route.ts`
- `types/question-bank.ts`
- `components/screens/drill/drill-data.ts` read-only
- `components/quiz/LexiverseQuizClient.tsx` read-only

Tasks:

1. Create `lib/question-bank/question-type-taxonomy.ts`.
   Export:
   - `WORD_UNIVERSE_TYPES`
   - `EXAM_TASK_TYPES`
   - `DEPRECATED_QUESTION_TYPES`
   - `ALIAS_ONLY_QUESTION_TYPES`
   - `isWordUniverseType(type: string): boolean`
   - `isExamTaskType(type: string): boolean`
   - `isDeprecatedQuestionType(type: string): boolean`
   - `isAliasOnlyQuestionType(type: string): boolean`
   - `isSelectableQuestionType(type: string): boolean`

   Required contents:
   - `DEPRECATED_QUESTION_TYPES` includes `antonym_choice` and `cet_cloze`.
   - `ALIAS_ONLY_QUESTION_TYPES` includes `definition_to_word`, `zh_definition_to_word`, `listen_to_word`.
   - `WORD_UNIVERSE_TYPES` includes `def_to_word`.

2. Modify `lib/mock-exam/paper-specs.ts`.
   - Remove `cet_cloze` from all mock-paper candidate type lists.
   - Do not add `antonym_choice` anywhere.
   - If postgraduate cloze needs a temporary fallback, use `cloze_passage` first and `cloze_choice` only as a clearly commented temporary fallback.
   - Import/use taxonomy helpers where appropriate.

3. Modify `app/api/mock-exam/route.ts`.
   - Filter `DEPRECATED_QUESTION_TYPES` out when drawing questions.
   - Do not fallback to deprecated types.
   - If a section has no valid pool after filtering, return an empty/insufficient section with a clear note instead of silently using deprecated types.

4. Modify `app/api/questions/route.ts`.
   - Default random/multi-type queries must not return deprecated types.
   - Explicit `type=antonym_choice` or `type=cet_cloze` should return HTTP 200 with an empty result or clear empty payload, not HTTP 500.
   - Word-specific queries should also filter deprecated types by default unless an existing compatibility path requires otherwise. If compatibility is kept, add a short comment explaining why.

5. Modify `types/question-bank.ts`.
   - Do not necessarily remove deprecated union members because old DB rows still exist.
   - Add comments marking `antonym_choice` and `cet_cloze` deprecated for new exam/practice entry points.
   - Clarify that `def_to_word` is the actual DB type used for definition-to-word questions, while `definition_to_word` is alias-only if present.

6. Create `scripts/validate-question-type-taxonomy.ts`.
   The script must fail with a non-zero exit code if:
   - `DEPRECATED_QUESTION_TYPES` does not include `antonym_choice` and `cet_cloze`.
   - `ALIAS_ONLY_QUESTION_TYPES` does not include `definition_to_word`, `zh_definition_to_word`, `listen_to_word`.
   - `def_to_word` is not included in `WORD_UNIVERSE_TYPES`.
   - `lib/mock-exam/paper-specs.ts` still contains `cet_cloze` in section candidate type arrays.
   - `lib/mock-exam/paper-specs.ts` contains `antonym_choice`.

7. Modify `package.json`.
   Add:
   - `"validate:question-types": "npx tsx scripts/validate-question-type-taxonomy.ts"`

8. Create `reports/question-type-taxonomy-phase0a.md`.
   Include:
   - Current classification table.
   - Files changed.
   - Confirmation that no DB data was deleted.
   - Confirmation that no visible frontend was changed.
   - Backend behavior changes for deprecated types.
   - A `FRONTEND_CHANGE_NOTICE` for Phase 0B covering `/drill` and `/quiz`.

Required verification:
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`

If lint or tsc fails because of unrelated existing WIP, do not fix unrelated files. Report the exact failures and whether Phase 0A files are clean.

Completion report must include:
1. Changed files.
2. Database changes: must be none.
3. Frontend visible changes: must be none.
4. Verification command results.
5. The `FRONTEND_CHANGE_NOTICE`.
6. Any unresolved risks.
```

### Phase 0A Codex Review Checklist

Codex should verify:

- [ ] No frontend files were modified.
- [ ] No delete SQL or destructive DB operation was added.
- [ ] `lib/question-bank/question-type-taxonomy.ts` exists and classifies all required types.
- [ ] `lib/mock-exam/paper-specs.ts` no longer uses `cet_cloze` or `antonym_choice`.
- [ ] `/api/questions` filters deprecated types by default.
- [ ] `/api/mock-exam` filters deprecated types and does not fallback to them.
- [ ] `types/question-bank.ts` documents deprecated and alias-only naming.
- [ ] `npm run validate:question-types` passes.
- [ ] `npm run lint` and `npx tsc --noEmit` pass, or failures are clearly unrelated.
- [ ] `reports/question-type-taxonomy-phase0a.md` includes `FRONTEND_CHANGE_NOTICE`.

## Phase 0B: Taxonomy UI Cleanup

Do not send the Claude Code implementation prompt until Claude Design has handled the `FRONTEND_CHANGE_NOTICE`, or until the user explicitly says to follow the existing design and implement without a separate visual pass.

User approval recorded on 2026-06-20: for this narrow UI cleanup, skip Claude Design and let Claude Code follow the existing `/drill` and `/quiz` design language directly. Use the default design decision: remove retired cards completely, keep concise empty states, and do not redesign the pages.

### Claude Design Brief For Phase 0B

Send this block to Claude Design first:

```md
You are designing Ocean English question-bank rebuild Phase 0B: frontend cleanup for deprecated question types.

Context:
- Phase 0A already changed backend behavior.
- `/api/questions` and `/api/mock-exam` now filter deprecated types: `antonym_choice` and `cet_cloze`.
- No database rows were deleted.
- Now the frontend must stop offering those retired types.

Routes affected:
- `/drill`
- `/quiz`

Existing behavior:
- `/drill` shows `反义词` (`antonym_choice`) in the Recognize family.
- `/drill` shows `完形填空` (`cet_cloze`) in the Read family.
- `/drill` frontend mock-paper spec for 考研 uses `cet_cloze` as the first cloze candidate.
- `/quiz` accepts `antonym_choice`, maps `synant` to `['synonym_choice', 'antonym_choice']`, has prompt text for `antonym_choice`, and remaps `cet_cloze` to `cloze_choice`.

Design decision needed:
- Preferred option: remove the retired cards completely from normal pickers, because they are not useful user choices anymore.
- Alternative option: show disabled deprecated chips only if you think the user needs to understand why counts changed.

Design requirements:
- Keep the current visual language. This is not a full redesign.
- Do not add marketing copy or tutorials.
- Do not change the overall `/drill` information architecture.
- Make empty-pool states calm and explicit: `题库建设中`, `该题型暂不可用`, or equivalent short copy.
- On mobile, no layout jump or overflowing chips.
- If disabled chips are used, the disabled state must not be conveyed by color only; include text and `aria-disabled`.

Expected output:
1. Recommended choice: remove vs disabled chip.
2. Exact visible copy for empty states.
3. Any small interaction notes for `/drill` and `/quiz`.
4. Any constraints Claude Code must follow.
```

### Claude Code Prompt For Phase 0B

Use this only after Claude Design returns the design notes. If the user explicitly approves "follow existing design and implement", use the default design decision below: remove retired cards completely and keep concise empty states.

Copy this whole block to Claude Code:

```md
You are implementing Ocean English question-bank rebuild Phase 0B: taxonomy UI cleanup.

Prerequisites:
- Phase 0A is complete and passed Codex review.
- Backend already filters deprecated types through `lib/question-bank/question-type-taxonomy.ts`.
- The user has either provided Claude Design notes for this phase or explicitly approved following the existing design.

Hard scope:
1. Do not change database data.
2. Do not modify DeepSeek route rate-limiting.
3. Do not do question-bank v2 schema.
4. Do not redesign `/drill` or `/quiz` beyond retired type cleanup and empty-state polish.
5. Do not touch unrelated dirty files.
6. Do not alter generated question content.
7. Keep old `/quiz` links loadable where possible.

Read first:
- `reports/question-type-taxonomy-phase0a.md`
- `lib/question-bank/question-type-taxonomy.ts`
- `components/screens/drill/drill-data.ts`
- `components/screens/drill/DrillScreen.tsx`
- `components/screens/drill/drill-questions.ts`
- `components/screens/drill/MockExam.tsx`
- `components/quiz/LexiverseQuizClient.tsx`
- `app/api/questions/route.ts`
- `app/api/mock-exam/route.ts`

Implementation tasks:

1. Update `/drill` visible type data in `components/screens/drill/drill-data.ts`.
   - Remove `antonym_choice` from the exported visible `TYPES`.
   - Remove `cet_cloze` from the exported visible `TYPES`.
   - Update the kaoyan `PAPER_SPECS` cloze section from:
     `['cet_cloze', 'cloze_passage', 'cloze_choice']`
     to:
     `['cloze_passage', 'cloze_choice']`
   - Keep `cloze_choice`, `cloze_passage`, `synonym_choice`, `synonym_substitute`, `collocation_choice`, and all Word Universe practice types that Phase 0A kept.
   - If a displayed count or banknote mentions total type count, adjust it only if it is currently hard-coded and visibly wrong after removing two types.

2. Update `/drill` safeguards in `components/screens/drill/drill-questions.ts`.
   - Remove `cet_cloze` from `BANK_ASK`.
   - Remove `antonym_choice` from `BANK_ASK`.
   - Remove the `cet_cloze -> cloze_choice` display remap from new/default flows.
   - Add a local guard using the Phase 0A taxonomy if practical, or a small local set, so `buildSession()` does not request retired types even if an old UI state or localStorage config contains them.
   - If all requested types are retired after filtering, return an empty list so the existing empty state is shown.

3. Update `/drill` flow in `components/screens/drill/DrillScreen.tsx` only if needed.
   - Existing empty state text is acceptable, but align copy with design notes if provided.
   - When loading the last config or recipe, filter retired types so users cannot resume an old `antonym_choice` / `cet_cloze` run.
   - Do not change the full layout, navigation, or visual system.

4. Update mock exam frontend mirror.
   - `components/screens/drill/MockExam.tsx` must never display `cet_cloze` as the selected source for kaoyan cloze.
   - Existing `该考试暂无可用题` / `题库建设中` empty states can remain unless design notes say otherwise.

5. Update `/quiz` mappings in `components/quiz/LexiverseQuizClient.tsx`.
   - Remove `antonym_choice` from `PType`.
   - Remove `antonym_choice` from `TYPE_LABEL`.
   - Remove `antonym_choice` from `DIM_OF`.
   - Change `DRILL_TYPE_MAP.synant` from `['synonym_choice', 'antonym_choice']` to `['synonym_choice', 'synonym_substitute']` or just `['synonym_choice']`. Prefer `['synonym_choice', 'synonym_substitute']` if both are supported by the existing renderer.
   - Remove `antonym_choice` from `BANK_ASK`.
   - Remove `cet_cloze` from `BANK_ASK`.
   - Keep legacy `cet_cloze -> cloze_choice` compatibility only inside `mapBankRow()` if it is needed to avoid crashing old links or old cached rows. If kept, add a one-line comment that backend no longer serves `cet_cloze` by default and this is legacy-only.
   - If `mapBankRow()` receives `antonym_choice`, return `null` instead of rendering it.

6. Add or update validation.
   - Update `scripts/validate-question-type-taxonomy.ts` so it also fails if:
     - `components/screens/drill/drill-data.ts` visible `TYPES` contains `antonym_choice` or `cet_cloze`.
     - `components/screens/drill/drill-data.ts` `PAPER_SPECS` section candidate arrays contain `cet_cloze` or `antonym_choice`.
     - `components/quiz/LexiverseQuizClient.tsx` `DRILL_TYPE_MAP` contains `antonym_choice` or `cet_cloze`.
   - It may still allow the literal string `cet_cloze` inside a clearly marked legacy-only `mapBankRow()` compatibility comment/path.

7. Create `reports/question-type-taxonomy-phase0b.md`.
   Include:
   - Claude Design decision or the user's explicit approval to follow existing design.
   - Files changed.
   - Confirmation that no DB data was changed.
   - Confirmation that retired types are no longer startable from `/drill`.
   - Confirmation that `/quiz` default flows no longer advertise retired types.
   - Verification command results.
   - Any known legacy compatibility left in place.

Required verification:
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`
- `npx tsx scripts/backend-regression.test.ts`

Browser / Playwright smoke:
- Start the dev server if it is not already running.
- Open `/drill`.
- Confirm the type picker does not show `反义词` for `antonym_choice`.
- Confirm the type picker does not show `完形填空` for `cet_cloze`; `篇章完形`, `选词填空`, or other non-retired read types may remain.
- Confirm kaoyan mock cloze does not use `cet_cloze`.
- Open `/quiz?mode=exam-practice&drill=synant&level=7`.
- Confirm it loads or shows a controlled empty state, and does not request/render `antonym_choice`.

Completion report must include:
1. Changed files.
2. Database changes: must be none.
3. Frontend visible changes implemented.
4. Validation command results with exit codes.
5. Browser smoke results.
6. Legacy compatibility left behind, if any.
7. Unresolved risks.
```

### Phase 0B Codex Review Checklist

Codex should verify:

- [ ] `components/screens/drill/drill-data.ts` no longer exposes `antonym_choice` or `cet_cloze` in visible `TYPES`.
- [ ] Frontend `PAPER_SPECS` no longer contains `cet_cloze`.
- [ ] `/drill` cannot start retired types through picker, recipe, last-config resume, or family select.
- [ ] `components/screens/drill/drill-questions.ts` filters retired types before calling `/api/questions`.
- [ ] `/quiz` default mappings no longer include `antonym_choice` or `cet_cloze`.
- [ ] Legacy `cet_cloze` compatibility, if kept, is isolated and documented.
- [ ] Empty states are controlled and do not produce blank screens.
- [ ] `npm run validate:question-types` passes with new frontend checks.
- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx tsx scripts/backend-regression.test.ts` passes.
- [ ] Browser smoke for `/drill` and `/quiz` passes.

## Later Phase Summaries

Full copy-ready Claude Code prompts for Phases 1-13 are maintained here:

- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-phase-prompts-1-13.md`

Phase 1: Single exam-spec source.

- Create `lib/exam-specs/types.ts`.
- Create `lib/exam-specs/specs.ts`.
- Create `lib/exam-specs/level-map.ts`.
- Create `app/api/exam-specs/route.ts`.
- Create `scripts/validate-exam-specs.ts`.
- Make backend specs the source of truth before frontend consumes them.

Phase 2: Vocabulary level audit.

- Create `scripts/audit-vocabulary-levels.ts`.
- Create `reports/vocabulary-level-audit-2026-06-20.md`.
- Check `primary_level` versus `levels`.
- Confirm CET-6 direct coverage gap and postgraduate coverage logic.
- Do not blindly expand TOEFL/SAT word lists because they do not have fixed official lists like CET-style syllabi.

Phase 3: Question-bank v2 schema.

- Add SQL for `exam_specs`, `exam_sections`, `task_templates`, `stimuli`, `audio_assets`, `question_sets`, `question_items`, `question_target_words`, `rubrics`, `paper_instances`, `question_attempts`, `skill_states`.
- Add TypeScript contracts.
- Add validation script for active v2 integrity.
- Keep v1 fallback.

Phase 4: Practice Session API.

- Create unified session builder.
- Create attempt recorder.
- Support modes: word, task, section, paper.
- Return target words and subskills for learning-loop updates.

Phase 5: PracticeRunner.

- Requires Claude Design first.
- Render input modes: choice, spell, multi-blank, matching, listening, speaking, free text.
- Keep old `/quiz` compatible while migrating.

Phase 6: `/drill` redesign.

- Requires Claude Design first.
- Split into Word Universe Practice, Exam Task Practice, Mock Papers.
- Show construction progress instead of silently falling back to wrong task types.

Phase 7: Lexiverse word entry.

- Requires Claude Design first.
- Add "practice this word", "exam-style contexts", "word graph", and "add to today" entries from galaxy/word detail.

Phase 8: Migrate old bank to v2.

- Migrate clean v1 word questions and passage question sets.
- Put structurally broken rows into draft/rejected, not active.
- Preserve old IDs for traceability.

Phase 9: Listening audio assets.

- Build text-to-audio pipeline.
- Store audio in stable assets, not browser-only TTS.
- Validate transcript, duration, URL, checksum, and active listening coverage.

Phase 10: Mock paper generator.

- Generate paper instances from ExamSpec.
- Support seeds, section timing, scoring, and review.
- Do not use unrelated fallback tasks when a pool is insufficient.

Phase 11: Question-type expansion.

- Fill high-priority gaps: Gaokao grammar/seven-select, CET banked cloze, postgraduate Reading B, TOEFL four-skill tasks, SAT RW domains.
- All new content must be original, licensed, or public-domain, not copied real exam content.

Phase 12: Subjective scoring.

- Requires Claude Design for writing/speaking/translation flows.
- Add rubrics, scoring API, cost controls, review states, and retries.

Phase 13: Learning loop.

- Requires Claude Design for Today, Review, Report changes.
- Connect attempts to WordState, SkillState, ExamState, wrong-answer queues, and DailyPlanEngine.
