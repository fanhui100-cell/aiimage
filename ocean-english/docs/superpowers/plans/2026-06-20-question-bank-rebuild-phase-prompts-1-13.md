# Ocean English Question Bank Rebuild Phase Prompts 1-13

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide copy-ready Claude Code prompts for Phases 1-13 of the Ocean English question-bank rebuild, so each phase can be implemented, reviewed, and accepted independently.

**Architecture:** Phase 0 established taxonomy governance. Phases 1-13 now move from shared exam specs to vocabulary audit, v2 schema, session APIs, UI runners, migration, audio, mock papers, content generation, subjective scoring, and the learning loop. Existing v1 routes remain available until their replacements are verified.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase/Postgres, existing `question_bank`, future v2 question-bank tables, scripts under `scripts/*.ts`, reports under `reports/*.md`, docs under `docs/**/*.md`.

---

## Global Rules For Every Phase

Copy these rules together with every phase prompt:

```md
Global rules:
1. Work only on the current phase. Do not start later phases.
2. Do not physically delete existing `question_bank` data unless the current phase explicitly says to create a backup and retire rows.
3. Do not copy real exam passages, real exam questions, or copyrighted exam material into this repo. Use official/public sources only as format references.
4. Do not change DeepSeek route rate-limiting unless the user explicitly reopens that topic.
5. Do not silently edit unrelated dirty files.
6. Preserve v1 routes and old user flows until the phase explicitly migrates them.
7. New generated question content must start as `draft` or inactive unless the phase explicitly allows activation.
8. If a phase has visible UI changes and the user has not explicitly approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause before editing UI.
9. Every completion report must include: changed files, DB changes, frontend changes, commands run with exit codes, risks, and exact next-step recommendation.
```

## Phase 1 Prompt: Single Exam-Spec Source

```md
You are implementing Ocean English question-bank rebuild Phase 1: single exam-spec source.

Goal:
Create one canonical TypeScript source for the 7 exam/level structures, without changing visible UI yet.

Hard scope:
- Do not change database data.
- Do not change `/drill` UI.
- Do not change `/quiz` UI.
- Do not create question-bank v2 tables yet.
- Do not bulk generate or migrate questions.
- Do not copy real exam content.

Read first:
- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-claude-handoff.md`
- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-development-plan.md`
- `docs/design-briefs/2026-06-20-question-bank-system-redesign.md`
- `reports/exam-format-vs-question-bank-audit-2026-06-20.md`
- `reports/question-bank-rebuild-analysis-2026-06-20.md`
- `lib/mock-exam/paper-specs.ts`
- `components/screens/drill/drill-data.ts`
- `lib/question-bank/question-type-taxonomy.ts`

Create:
- `lib/exam-specs/types.ts`
- `lib/exam-specs/specs.ts`
- `lib/exam-specs/level-map.ts`
- `lib/exam-specs/index.ts`
- `app/api/exam-specs/route.ts`
- `scripts/validate-exam-specs.ts`
- `reports/exam-specs-phase1.md`

Modify:
- `package.json`

Implementation details:
1. In `lib/exam-specs/types.ts`, define:
   - `ExamId = 'zhongkao' | 'gaokao' | 'cet4' | 'cet6' | 'kaoyan' | 'toefl' | 'sat'`
   - `ExamLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7`
   - `ExamSkill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'translation' | 'integrated'`
   - `QuestionGroupMode = 'single' | 'rows' | 'passages' | 'paper'`
   - `ExamTaskType` should use or align with `EXAM_TASK_TYPES` from `lib/question-bank/question-type-taxonomy.ts`.
   - `ExamSectionSpec` with: `id`, `labelZh`, `labelEn`, `skill`, `taskTypes`, `groupMode`, `itemCount`, `points`, `timeLimitSec?`, `requiresAudio?`, `requiresRubric?`, `notes?`.
   - `ExamSpec` with: `id`, `level`, `labelZh`, `labelEn`, `version`, `sourceUrls`, `totalMinutes`, `fullScore`, `scoringScale`, `sections`, `status`.

2. In `lib/exam-specs/specs.ts`, define exactly 7 specs:
   - `zhongkao`
   - `gaokao`
   - `cet4`
   - `cet6`
   - `kaoyan`
   - `toefl`
   - `sat`

   Requirements:
   - Preserve current compatible exam keys used by `/drill` and `lib/mock-exam/paper-specs.ts`.
   - Use the existing audit docs as source material.
   - Store source URLs from the audit docs in `sourceUrls`.
   - `kaoyan` must not include listening or speaking sections.
   - `sat` must focus on Reading & Writing and must not include listening/speaking/writing essay.
   - `toefl` must include reading, listening, speaking, and writing sections as target structure even if the current product has coming-soon pools.
   - No section may list `antonym_choice` or `cet_cloze`.

3. In `lib/exam-specs/level-map.ts`, export:
   - `LEVEL_TO_EXAM_ID`
   - `EXAM_ID_TO_LEVEL`
   - `normalizeExamId(input: string): ExamId | null`
   - `examIdToThemeTag(id: ExamId): string`
   - `examIdToDisplayName(id: ExamId): string`

4. In `lib/exam-specs/index.ts`, re-export the public API:
   - all types
   - `EXAM_SPECS`
   - `getExamSpec(id)`
   - `listExamSpecs()`
   - level-map helpers

5. In `app/api/exam-specs/route.ts`, add:
   - `GET /api/exam-specs` returns `{ ok: true, data: listExamSpecs() }`.
   - `GET /api/exam-specs?id=cet4` returns a single spec or `{ ok:false, error:'unknown_exam' }` with HTTP 200.
   - Do not require auth.

6. In `scripts/validate-exam-specs.ts`, fail non-zero if:
   - There are not exactly 7 specs.
   - Exam ids are duplicated.
   - Levels are not 1-7 exactly once.
   - Any section has no `taskTypes`.
   - Any section includes `antonym_choice` or `cet_cloze`.
   - Any `taskTypes` entry is not either an exam task type or an explicitly allowed temporary word-universe fallback with a `notes` explanation.
   - Any `sourceUrls` array is empty.
   - `kaoyan` includes listening/speaking.
   - `sat` includes listening/speaking.
   - `toefl` lacks reading/listening/speaking/writing.

7. In `package.json`, add:
   - `"validate:exam-specs": "npx tsx scripts/validate-exam-specs.ts"`

8. In `reports/exam-specs-phase1.md`, include:
   - The 7 specs summary table.
   - Differences between current mock specs and new canonical specs.
   - Any temporary fallback task types.
   - Confirmation that no frontend visible behavior changed.
   - Confirmation that no DB data changed.

Required verification:
- `npm run validate:exam-specs`
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`
- `npx tsx scripts/backend-regression.test.ts`

Completion report:
1. Changed files.
2. DB changes: must be none.
3. Frontend visible changes: must be none.
4. Verification results with exit codes.
5. Temporary fallbacks and risks.
```

## Phase 2 Prompt: Vocabulary Level Audit

```md
You are implementing Ocean English question-bank rebuild Phase 2: vocabulary level audit.

Goal:
Audit whether the current dictionary coverage matches the seven real learning/exam levels, with special attention to CET-6 direct coverage and postgraduate English `levels` vs `primary_level`.

Hard scope:
- Do not import new word lists yet.
- Do not update database rows.
- Do not change frontend UI.
- Do not claim TOEFL/SAT have fixed official complete word lists.
- Do not overwrite existing definitions, mnemonics, examples, synonyms, antonyms, or collocations.

Read first:
- `reports/question-bank-rebuild-analysis-2026-06-20.md`
- `reports/exam-format-vs-question-bank-audit-2026-06-20.md`
- `docs/superpowers/plans/2026-06-20-question-bank-rebuild-development-plan.md`
- `lib/dictionary/exam-tag-map.ts`
- `lib/dictionary/dictionary-client.ts`
- `types/database.ts`
- `scripts/stats-all.ts`

Create:
- `data/vocabulary-targets/README.md`
- `scripts/audit-vocabulary-levels.ts`
- `reports/vocabulary-level-audit-2026-06-20.md`
- `reports/vocabulary-level-audit-2026-06-20.json`

Modify:
- `package.json`

Implementation details:
1. `data/vocabulary-targets/README.md` must define how canonical target lists will be stored later:
   - One file per source list.
   - Each source must include `source_name`, `source_url`, `license_note`, `exam_id`, `level`, and whether it is official, curated, or internal.
   - Junior/high school/CET/postgraduate can have canonical source lists.
   - TOEFL/SAT should use curated academic/high-utility coverage, not a claimed official complete vocabulary.

2. `scripts/audit-vocabulary-levels.ts` must connect to Supabase using `.env.local`.
   It must output per level:
   - `level`
   - `examId`
   - `label`
   - `targetSize`
   - `currentPrimaryLevelCount`
   - `currentLevelsIncludesCount`
   - `wordsWithDefinitions`
   - `wordsWithExamples`
   - `wordsWithMnemonics`
   - `wordsWithInflections`
   - `wordsWithEtymology`
   - `wordsWithCollocations`
   - `wordsWithSynonyms`
   - `wordsWithAntonyms`
   - `recommendation`

3. Target size guidance:
   - lv1/zhongkao: about 1600-1900.
   - lv2/gaokao: about 3000-3500.
   - lv3/cet4: about 4500.
   - lv4/cet6: about 5500.
   - lv5/kaoyan: about 5500, but use `levels includes 5`, not only `primary_level=5`.
   - lv6/toefl: curated academic/task vocabulary; do not treat as fixed official list.
   - lv7/sat: curated high-utility RW vocabulary; do not treat as fixed official list.

4. Detect and report:
   - CET-6 direct coverage gap.
   - Any level where `primary_level` count is misleading compared with `levels includes`.
   - Words tagged to a level but missing essential dictionary materials.
   - Coverage weak spots by field.
   - Duplicate or invalid level tags if detectable from local schema.

5. Add package script:
   - `"audit:vocab-levels": "npx tsx scripts/audit-vocabulary-levels.ts"`

6. Report must include:
   - Summary table.
   - "No DB writes were performed."
   - "Recommended import/backfill actions."
   - A clear list of what should not be imported blindly.

Required verification:
- `npm run audit:vocab-levels`
- `npm run lint`
- `npx tsc --noEmit`

Completion report:
1. Changed files.
2. DB changes: must be none.
3. Generated report paths.
4. Key findings: especially CET-6 and postgraduate logic.
5. Verification results with exit codes.
```

## Phase 3 Prompt: Question-Bank v2 Schema

```md
You are implementing Ocean English question-bank rebuild Phase 3: question-bank v2 schema.

Goal:
Create the SQL and TypeScript contracts for a v2 question-bank model that supports exams, sections, task templates, stimuli, question sets, question items, target words, audio, rubrics, papers, attempts, and skill states.

Hard scope:
- Create SQL, types, validators, and docs.
- Do not run SQL against production unless the user explicitly asks.
- Do not migrate v1 data yet.
- Do not change frontend UI.
- Do not delete or alter v1 `question_bank`.

Read first:
- `supabase/sql/p1-question-bank.sql`
- `types/database.ts`
- `types/question-bank.ts`
- `lib/question-bank/question-type-taxonomy.ts`
- `lib/exam-specs/types.ts`
- `lib/exam-specs/specs.ts`
- `docs/design-briefs/2026-06-20-question-bank-system-redesign.md`

Create:
- `supabase/sql/p4-question-bank-v2.sql`
- `types/question-bank-v2.ts`
- `lib/question-bank-v2/schema.ts`
- `scripts/validate-question-bank-v2.ts`
- `reports/question-bank-v2-schema-phase3.md`

Modify:
- `package.json`

SQL requirements:
1. Tables:
   - `exam_specs`
   - `exam_sections`
   - `task_templates`
   - `stimuli`
   - `audio_assets`
   - `question_sets`
   - `question_items`
   - `question_target_words`
   - `rubrics`
   - `paper_instances`
   - `paper_sections`
   - `paper_attempts`
   - `question_attempts`
   - `skill_states`
   - `daily_plan_items` if not already present

2. Required shared columns:
   - `id uuid primary key default gen_random_uuid()` unless using stable text ids for specs/templates.
   - `created_at timestamptz default now()`
   - `updated_at timestamptz default now()`
   - `status text` where relevant with allowed values like `draft`, `reviewed`, `active`, `retired`, `rejected`.

3. Important relationships:
   - `exam_sections.exam_id -> exam_specs.id`
   - `task_templates.exam_id -> exam_specs.id` nullable if shared
   - `question_sets.exam_id`, `section_id`, `task_template_id`, `stimulus_id`
   - `question_items.question_set_id`
   - `question_target_words.question_item_id` and optional `dictionary_words.id`
   - `audio_assets.stimulus_id`
   - `paper_sections.paper_instance_id`
   - `question_attempts.question_item_id`, `question_set_id`, `exam_id`, `section_id`
   - `skill_states.user_id`, `exam_id`, `skill_key`

4. JSON columns:
   - `choices jsonb`
   - `answer jsonb`
   - `rubric jsonb`
   - `subskills text[]`
   - `topic_tags text[]`
   - `target_word_roles text[]` only if useful; prefer normalized `question_target_words`.

5. Indexes:
   - active set lookup by `exam_id`, `section_id`, `task_type`, `status`
   - question items by `question_set_id`
   - target words by `word_id`
   - attempts by `user_id`, `answered_at`, `exam_id`, `section_id`
   - audio assets by `stimulus_id`, `status`

6. RLS:
   - Public read only for active specs/templates/stimuli/questions if the current app expects public practice access.
   - Attempts and skill states must be user-owned.
   - Do not expose other users' attempts.
   - Use conservative policies matching existing Supabase style in `supabase/sql/*.sql`.

TypeScript requirements:
1. `types/question-bank-v2.ts` exports interfaces for:
   - `ExamSpecRow`
   - `ExamSectionRow`
   - `TaskTemplateRow`
   - `StimulusRow`
   - `AudioAssetRow`
   - `QuestionSetRow`
   - `QuestionItemRow`
   - `QuestionTargetWordRow`
   - `RubricRow`
   - `PaperInstanceRow`
   - `QuestionAttemptRow`
   - `SkillStateRow`
2. `lib/question-bank-v2/schema.ts` exports runtime constants:
   - allowed statuses
   - allowed input modes
   - allowed group modes
   - allowed target word roles

Validation:
1. `scripts/validate-question-bank-v2.ts` should:
   - If v2 tables do not exist, report `not_applied` and exit 0.
   - If tables exist, validate active data integrity:
     - active `question_sets` have at least one active `question_item`.
     - grouped tasks requiring a stimulus have one.
     - active listening sets have active audio.
     - choices/answer shape matches input mode.
     - target word references exist when present.
   - Write JSON summary to `reports/question-bank-v2-validation.json`.

2. Add package script:
   - `"validate:qbank-v2": "npx tsx scripts/validate-question-bank-v2.ts"`

Report:
- Explain table responsibilities.
- Explain v1 compatibility.
- Explain whether SQL was applied. Default should be "not applied".
- List follow-up migration needs.

Required verification:
- `npm run validate:qbank-v2`
- `npm run validate:exam-specs`
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`

Completion report:
1. Changed files.
2. Whether SQL was applied. If not, say not applied.
3. RLS summary.
4. Validation results.
5. Risks before applying SQL.
```

## Phase 4 Prompt: Practice Session API

```md
You are implementing Ocean English question-bank rebuild Phase 4: unified Practice Session API.

Goal:
Create backend APIs that can build practice sessions for word practice, exam tasks, sections, and papers, while keeping old `/api/questions` available.

Hard scope:
- Do not remove `/api/questions`.
- Do not change visible frontend.
- Do not require v2 tables to be populated; support v1 fallback.
- Do not write attempts unless the user is authenticated and the target table exists.
- Do not alter DeepSeek route rate-limiting.

Read first:
- `app/api/questions/route.ts`
- `app/api/mock-exam/route.ts`
- `lib/question-bank/question-api-utils.ts`
- `lib/question-bank/question-type-taxonomy.ts`
- `types/question-bank.ts`
- `types/question-bank-v2.ts`
- `lib/exam-specs/index.ts`
- `store/lexiStore.ts`
- `app/api/user/quiz-history/route.ts`
- `app/api/user/wrong-answers/route.ts`

Create:
- `lib/practice/session-types.ts`
- `lib/practice/session-builder.ts`
- `lib/practice/attempt-recorder.ts`
- `app/api/practice/session/route.ts`
- `app/api/practice/attempts/route.ts`
- `scripts/validate-practice-session.ts`
- `reports/practice-session-api-phase4.md`

Modify:
- `package.json`

Session input contract:
```ts
export interface BuildPracticeSessionInput {
  mode: 'word' | 'task' | 'section' | 'paper'
  source?: 'v1' | 'v2' | 'auto'
  examId?: string
  sectionId?: string
  taskType?: string
  word?: string
  wordId?: string
  level?: number
  count?: number
  seed?: string
}
```

Session output contract:
```ts
export interface PracticeSessionResponse {
  ok: boolean
  source: 'v1' | 'v2' | 'empty'
  sessionId: string
  mode: string
  items: PracticeItem[]
  warnings: string[]
}
```

`PracticeItem` must include:
- `id`
- `questionItemId` optional for v2
- `legacyQuestionId` optional for v1
- `setId` optional
- `type`
- `inputMode`
- `prompt`
- `promptZh`
- `choices`
- `answer`
- `answerText`
- `stimulus`
- `audio`
- `targetWords`
- `subskills`
- `explanationZh`

Implementation tasks:
1. `session-builder.ts`
   - Build from v2 if v2 tables exist and have active data.
   - Fall back to v1 `question_bank` using existing query logic.
   - Never return deprecated types.
   - For `mode='word'`, support `word` and `wordId`.
   - For `mode='task'`, require `level` and `taskType` or infer from `examId`.
   - For empty pools, return `{ ok:true, source:'empty', items:[], warnings:['insufficient_pool'] }`.

2. `attempt-recorder.ts`
   - Accept attempt payloads for v1 or v2.
   - If v2 attempt table exists, write a row.
   - If table does not exist, return a graceful `not_applied` warning, not a 500.
   - Return suggested word updates and skill updates; do not directly mutate client Zustand.

3. API routes:
   - `POST /api/practice/session`
   - `GET /api/practice/session` with query params for simple smoke tests
   - `POST /api/practice/attempts`
   - All routes return HTTP 200 for expected empty/not_applied states and HTTP 400 for invalid input.

4. Validation script:
   - Request a word session.
   - Request a task session for `cet4` reading or available task.
   - Request a deprecated type and confirm empty/no deprecated output.
   - Validate response item shape.

5. Add package script:
   - `"validate:practice-session": "npx tsx scripts/validate-practice-session.ts"`

Report:
- Explain v1 fallback.
- Explain v2 readiness.
- Explain auth/attempt behavior.
- List empty pool behavior.

Required verification:
- `npm run validate:practice-session`
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`
- `npx tsx scripts/backend-regression.test.ts`

Completion report:
1. Changed files.
2. DB changes.
3. API examples tested.
4. Verification results.
5. Known limitations.
```

## Phase 5 Prompt: PracticeRunner

```md
You are implementing Ocean English question-bank rebuild Phase 5: unified PracticeRunner.

Frontend rule:
- This phase changes visible UI. If the user has not explicitly approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause.
- If the user approves direct implementation, follow the existing `practice-session.css` and `/quiz` visual language; do not redesign the product.

Goal:
Create a reusable frontend PracticeRunner that consumes `/api/practice/session` and can render the core input modes. Migrate `/quiz` first while keeping old links working.

Hard scope:
- Do not redesign `/drill`.
- Do not remove `LexiverseQuizClient` until the new runner is verified.
- Do not break old `/quiz?word=...`, `/quiz?mode=reading-practice`, `/quiz?mode=listening-practice`, or drill query links.
- Do not migrate `/drill` in this phase unless required for a smoke check.

Read first:
- `components/quiz/LexiverseQuizClient.tsx`
- `components/quiz/practice-session.css`
- `app/quiz/page.tsx`
- `components/screens/drill/QuestionStem.tsx`
- `components/screens/drill/drill-questions.ts`
- `lib/practice/session-types.ts`
- `app/api/practice/session/route.ts`
- `store/lexiStore.ts`

Create:
- `components/practice/PracticeRunner.tsx`
- `components/practice/PracticeFrame.tsx`
- `components/practice/renderers/ChoiceRenderer.tsx`
- `components/practice/renderers/SpellRenderer.tsx`
- `components/practice/renderers/MultiBlankRenderer.tsx`
- `components/practice/renderers/MatchingRenderer.tsx`
- `components/practice/renderers/ListeningRenderer.tsx`
- `components/practice/renderers/FreeTextRenderer.tsx`
- `components/practice/practice-types.ts`
- `reports/practice-runner-phase5.md`

Modify:
- `app/quiz/page.tsx`
- optionally `components/quiz/LexiverseQuizClient.tsx` as fallback/legacy wrapper

Implementation tasks:
1. `PracticeRunner.tsx`
   - Accept props: `initialMode`, `word`, `level`, `examId`, `taskType`, `count`, `legacySearchParams`.
   - Fetch `/api/practice/session`.
   - Show loading, empty, error, play, and results states.
   - Submit attempts to `/api/practice/attempts` when a question is answered.
   - Keep local result tracking even if attempt API returns `not_applied`.

2. Renderers:
   - `ChoiceRenderer` for single choice.
   - `SpellRenderer` for exact/tolerant spelling.
   - `MultiBlankRenderer` can show a controlled unavailable state if no v2 multi-blank shape exists yet.
   - `MatchingRenderer` can show a controlled unavailable state if no matching shape exists yet.
   - `ListeningRenderer` supports audioRef/audioUrl and transcript only after answer.
   - `FreeTextRenderer` collects text and marks as submitted, but does not auto-score unless scoring API exists.

3. `/quiz` integration:
   - Preserve old URL params and map them to PracticeRunner input.
   - If session API returns empty, show the existing empty visual style.
   - Keep `LexiverseQuizClient` available as a legacy fallback behind a simple flag or fallback path if needed.

4. Accessibility:
   - Choice buttons keyboard accessible.
   - Inputs have labels.
   - Loading and results states are screen-reader friendly.

5. Report:
   - Which old `/quiz` paths were verified.
   - Which renderers are complete and which are placeholder/unavailable states.
   - Whether legacy fallback remains.

Required verification:
- `npm run validate:practice-session`
- `npm run lint`
- `npx tsc --noEmit`
- Browser smoke:
  - `/quiz?word=ability`
  - `/quiz?mode=reading-practice&level=3`
  - `/quiz?mode=listening-practice&level=3`
  - `/quiz?mode=exam-practice&drill=synant&level=7`

Completion report:
1. Changed files.
2. Frontend visible changes.
3. API dependencies.
4. Browser smoke results.
5. Verification results.
6. Legacy fallback status.
```

## Phase 6 Prompt: `/drill` Redesign Into Three Practice Surfaces

```md
You are implementing Ocean English question-bank rebuild Phase 6: `/drill` three-surface redesign.

Frontend rule:
- This phase changes visible UI. If the user has not explicitly approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause.
- If approved, follow the current `/drill` design language and avoid a full visual redesign.

Goal:
Reorganize `/drill` into three clear surfaces: Word Universe Practice, Exam Task Practice, and Mock Papers, all driven by canonical specs and safe question pools.

Hard scope:
- Do not generate new question content.
- Do not remove existing practice capability.
- Do not silently fallback from an exam task into an unrelated word drill.
- Do not use deprecated types.

Read first:
- `components/screens/drill/DrillScreen.tsx`
- `components/screens/drill/drill-data.ts`
- `components/screens/drill/MockExam.tsx`
- `components/screens/drill/drill-questions.ts`
- `components/screens/drill/DrillShared.tsx`
- `lib/exam-specs/index.ts`
- `app/api/exam-specs/route.ts`
- `app/api/practice/session/route.ts`

Create:
- `components/drill/WordUniversePracticePicker.tsx`
- `components/drill/ExamTaskPicker.tsx`
- `components/drill/MockPaperPicker.tsx`
- `components/drill/DrillEmptyState.tsx`
- `reports/drill-three-surface-phase6.md`

Modify:
- `components/screens/drill/DrillScreen.tsx`
- `components/screens/drill/drill-data.ts` only if still needed
- `components/screens/drill/MockExam.tsx`

Implementation tasks:
1. Add three top-level surfaces:
   - `单词宇宙练习`
   - `考试专项`
   - `模拟试卷`

2. Word Universe Practice:
   - Uses word-universe types from taxonomy.
   - Keeps existing family/type picker behavior where reasonable.
   - Never shows `antonym_choice` or `cet_cloze`.

3. Exam Task Practice:
   - Reads exam structure from `/api/exam-specs` or `lib/exam-specs`.
   - Shows exam -> section -> task.
   - If a task has no active pool, show `题库建设中` instead of falling back to unrelated types.

4. Mock Papers:
   - Uses current mock API or future paper generator if available.
   - Shows coming-soon for TOEFL/SAT if pools are not ready.
   - Never uses deprecated types.

5. State migration:
   - Old localStorage config should be filtered through taxonomy.
   - If old config becomes empty, reset to a safe default and show no crash.

6. Report:
   - Screens changed.
   - New user flow.
   - Empty-state behavior.
   - Compatibility with old practice run.

Required verification:
- `npm run validate:exam-specs`
- `npm run validate:question-types`
- `npm run lint`
- `npx tsc --noEmit`
- Browser smoke:
  - `/drill` desktop
  - `/drill` mobile viewport
  - Word Universe practice starts
  - Exam Task empty pool is controlled
  - Mock paper picker opens and does not expose deprecated types

Completion report:
1. Changed files.
2. Frontend visible changes.
3. Browser smoke results.
4. Validation results.
5. Known limitations.
```

## Phase 7 Prompt: Lexiverse Word Entry

```md
You are implementing Ocean English question-bank rebuild Phase 7: Lexiverse word entry.

Frontend rule:
- This phase changes visible UI. If the user has not explicitly approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause.
- If approved, keep the current Lexiverse visual style and add focused CTAs only.

Goal:
Make Lexiverse the main word-learning entry into the question bank: from a word or planet, users can practice the word, see exam-style contexts, explore word graph, and add work to Today.

Hard scope:
- Do not rewrite the 3D Lexiverse scene.
- Do not change postMessage security.
- Do not create new question content.
- Do not break existing `/lexiverse` iframe/reference flow.

Read first:
- `app/lexiverse/page.tsx`
- `components/lexiverse/ReferenceLexiverseFrame.tsx`
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`
- `components/lexiverse/LexiverseScene.tsx`
- `store/lexiStore.ts`
- `lib/practice/session-types.ts`
- `app/api/practice/session/route.ts`
- `lib/dictionary/dictionary-client.ts`
- `components/screens/TodayBento.tsx`

Create:
- `components/lexiverse/WordPracticeActions.tsx`
- `lib/lexiverse/word-practice-links.ts`
- `reports/lexiverse-word-entry-phase7.md`

Modify:
- `app/lexiverse/word/[slug]/LexiverseWordDetailClient.tsx`
- `components/lexiverse/ReferenceLexiverseFrame.tsx` only if needed for safe navigation events
- optionally `components/screens/TodayBento.tsx` if adding-to-today is already supported

Implementation tasks:
1. Add word-detail action group:
   - `练这个词`
   - `考试语境`
   - `词图关系`
   - `加入今日`

2. Link behavior:
   - `练这个词` -> `/quiz?word=<word>`
   - `考试语境` -> `/quiz?word=<word>&mode=exam-practice` or the PracticeRunner equivalent.
   - `词图关系` -> existing lexigraph route if available.
   - `加入今日` should use existing store/API if available; if not available, show controlled unavailable feedback and report the missing backend.

3. Security:
   - If iframe postMessage is touched, keep strict origin checks.
   - Do not accept arbitrary navigation targets from iframe messages.

4. Empty states:
   - If no word-specific questions exist, show a controlled empty state.
   - Do not fallback to unrelated random questions for a word-specific CTA.

5. Report:
   - Which CTAs are live.
   - Which are fallback/unavailable.
   - How the user returns to Lexiverse after practice.

Required verification:
- `npm run lint`
- `npx tsc --noEmit`
- Browser smoke:
  - `/lexiverse`
  - `/lexiverse/word/<known-word>`
  - Click `练这个词`
  - Return flow works

Completion report:
1. Changed files.
2. Frontend visible changes.
3. Browser smoke results.
4. Any incomplete CTA behavior.
```

## Phase 8 Prompt: Migrate v1 Question Bank To v2

```md
You are implementing Ocean English question-bank rebuild Phase 8: migrate usable v1 question_bank rows into v2.

Goal:
Create a safe migration pipeline that copies valid v1 data into v2 draft/reviewed/active structures without deleting v1 rows.

Hard scope:
- Do not delete v1 `question_bank`.
- Do not mark migrated rows active unless they pass validation.
- Do not migrate known deprecated types into active v2 pools.
- Do not run large apply mode unless user explicitly approves.
- Do not copy real exam content.

Read first:
- `types/question-bank.ts`
- `types/question-bank-v2.ts`
- `lib/question-bank/question-type-taxonomy.ts`
- `app/api/questions/route.ts`
- `scripts/validate-question-bank-v2.ts`
- `scripts/audit-passage-answer-keys.ts`
- `reports/passage-answer-key-repair-summary.md`

Create:
- `scripts/migrate-question-bank-v1-to-v2.ts`
- `scripts/qa-question-bank-v2-migration.ts`
- `reports/qbank-v2-migration-plan.md`
- `reports/qbank-v2-migration-report.json`
- `reports/qbank-v2-migration-report.md`

Implementation tasks:
1. Migration script supports:
   - Dry run by default.
   - `--apply` only writes to v2.
   - `--limit=N`.
   - `--types=a,b`.
   - `--status=draft|reviewed|active`, default `draft`.

2. Mapping:
   - `en_to_zh` -> word meaning choice.
   - `zh_to_en` -> reverse word choice.
   - `def_to_word` -> definition-to-word choice.
   - `zh_to_word_spell` -> spelling.
   - `cloze_choice` -> sentence cloze choice.
   - `cloze_spell` -> sentence cloze spell.
   - `word_form` -> word form fill.
   - `listen_to_meaning` -> word audio meaning.
   - `dictation_spell` -> word dictation.
   - `collocation_choice` -> collocation choice.
   - `reading_comprehension` -> grouped reading set by passage id.
   - `listening_comprehension` -> grouped listening set by audio/stimulus id, but keep draft if no stable audio.
   - `banked_cloze`, `seven_select`, `para_match`, `cloze_passage`, `grammar_fill` -> grouped sets.
   - `antonym_choice` and `cet_cloze` -> retired/draft report only, not active.

3. QA:
   - Validate choices count.
   - Validate answer exists.
   - Validate grouped rows share stimulus.
   - Validate target word exists when referenced.
   - Validate no deprecated type enters active.

4. Reporting:
   - Counts by old type.
   - Counts by new task type.
   - Draft/rejected/active counts.
   - Rejection reasons.
   - Sample migrated rows.

Required verification:
- Dry run migration with a small limit.
- `npm run validate:qbank-v2`
- `npm run lint`
- `npx tsc --noEmit`

Completion report:
1. Changed files.
2. Whether `--apply` was run. Default must be no unless approved.
3. Migration counts.
4. Rejection reasons.
5. Validation results.   
```

## Phase 9 Prompt: Listening Audio Assets

```md
You are implementing Ocean English question-bank rebuild Phase 9: listening audio assets.

Goal:
Create a stable audio asset pipeline for listening tasks so formal listening practice does not rely only on browser TTS.

Hard scope:
- Do not regenerate all listening content by default.
- Do not activate listening sets without audio.
- Do not break word-level pronunciation/TTS fallback.
- Do not change DeepSeek route rate-limiting.

Read first:
- `lib/pronunciation/word-audio.ts`
- `components/screens/PronunciationScreen.tsx`
- `components/screens/drill/MockExam.tsx`
- `types/question-bank-v2.ts`
- `supabase/sql/p4-question-bank-v2.sql`
- `scripts/gen-listening.ts`

Create:
- `lib/audio/audio-asset-client.ts`
- `scripts/generate-audio-assets.ts`
- `scripts/validate-audio-assets.ts`
- `components/practice/audio/AudioPlayer.tsx`
- `reports/audio-assets-phase9.md`

Modify:
- `package.json`
- `components/practice/renderers/ListeningRenderer.tsx` if Phase 5 exists

Implementation tasks:
1. `audio-asset-client.ts`
   - Fetch audio metadata by `stimulus_id` or `audio_asset_id`.
   - Return transcript only when the caller requests post-answer/review mode.
   - Gracefully fallback for word-level audio.

2. `generate-audio-assets.ts`
   - Dry run by default.
   - Supports `--apply`, `--limit`, `--exam`, `--task`.
   - Reads listening stimuli from v2 if available; otherwise reports `not_applied`.
   - Writes files to Supabase Storage only in `--apply`.
   - Writes `audio_assets` rows with URL, transcript, duration, provider, voice, checksum.

3. `validate-audio-assets.ts`
   - Fails if active listening sets lack audio.
   - Allows draft listening sets without audio.
   - Checks URL, transcript, duration, checksum, provider.

4. `AudioPlayer.tsx`
   - Accessible controls.
   - Handles loading/error.
   - Supports practice mode replay and mock mode controlled replay count if provided.

5. Add package script:
   - `"validate:audio-assets": "npx tsx scripts/validate-audio-assets.ts"`

Required verification:
- `npm run validate:audio-assets`
- `npm run validate:qbank-v2`
- `npm run lint`
- `npx tsc --noEmit`
- Browser smoke for one listening practice route if available.

Completion report:
1. Changed files.
2. Whether audio generation was applied.
3. Storage/database writes, if any.
4. Validation results.
5. Listening tasks still missing audio.
```

## Phase 10 Prompt: Mock Paper Generator

```md
You are implementing Ocean English question-bank rebuild Phase 10: mock paper generator.

Goal:
Generate reproducible paper instances from canonical ExamSpec and active question pools, with section scoring and review data.

Hard scope:
- Do not use unrelated fallback tasks when a pool is insufficient.
- Do not include deprecated types.
- Do not copy real exam content.
- Do not remove the old `/api/mock-exam` until the new API is verified.

Read first:
- `lib/exam-specs/index.ts`
- `app/api/mock-exam/route.ts`
- `lib/mock-exam/paper-specs.ts`
- `types/question-bank-v2.ts`
- `components/screens/drill/MockExam.tsx`
- `lib/practice/session-builder.ts`

Create:
- `lib/papers/paper-generator.ts`
- `lib/papers/scoring.ts`
- `lib/papers/paper-types.ts`
- `app/api/papers/route.ts`
- `app/api/papers/[id]/route.ts`
- `scripts/validate-paper-generator.ts`
- `reports/mock-paper-generator-phase10.md`

Modify:
- `package.json`
- optionally `components/screens/drill/MockExam.tsx` if user has approved UI changes

Implementation tasks:
1. `POST /api/papers`
   - Body: `{ examId, mode: 'mini' | 'section' | 'full', sectionId?, seed? }`
   - Returns `{ ok, paperInstanceId?, paper, warnings }`.
   - If pool is insufficient, return `ok:true` with `warnings:['insufficient_pool']` and no crash.

2. `paper-generator.ts`
   - Iterates canonical ExamSpec sections.
   - Draws grouped sets for passage/audio/group tasks.
   - Draws single items for word/sentence tasks.
   - Avoids duplicate stimuli in one paper.
   - Avoids over-repeating target words.
   - Uses deterministic seed.
   - Never draws deprecated types.

3. `scoring.ts`
   - Objective choice exact scoring.
   - Multi-blank partial scoring if shape exists.
   - Matching partial scoring if shape exists.
   - Free text/speaking/writing returns `needs_manual_or_ai_scoring` until Phase 12.
   - Section and total score summary.

4. Validation script:
   - Generate CET4 mini/section/full if pools allow.
   - Generate kaoyan section.
   - Confirm same seed gives same paper.
   - Confirm deprecated types absent.

5. Add package script:
   - `"validate:papers": "npx tsx scripts/validate-paper-generator.ts"`

Required verification:
- `npm run validate:papers`
- `npm run validate:exam-specs`
- `npm run validate:qbank-v2`
- `npm run lint`
- `npx tsc --noEmit`

Completion report:
1. Changed files.
2. API examples.
3. Pool insufficiency behavior.
4. Verification results.
5. Whether old `/api/mock-exam` remains active.
```

## Phase 11 Prompt: Question-Type Expansion Pipelines

```md
You are implementing Ocean English question-bank rebuild Phase 11: question-type expansion pipelines.

Goal:
Create safe generation templates and QA scripts for missing real exam task types. Do not bulk activate new content in this phase unless the user explicitly approves a batch.

Hard scope:
- Do not copy real exam content.
- Do not bulk apply active rows by default.
- Do not generate deprecated `antonym_choice` or `cet_cloze`.
- Do not change DeepSeek route rate-limiting.
- Do not make AI output active without QA.

Read first:
- `reports/question-bank-rebuild-analysis-2026-06-20.md`
- `reports/exam-format-vs-question-bank-audit-2026-06-20.md`
- `scripts/gen-reading.ts`
- `scripts/gen-listening.ts`
- `scripts/gen-banked.ts`
- `scripts/gen-sevenselect.ts`
- `scripts/gen-paramatch.ts`
- `scripts/gen-grammar.ts`
- `scripts/gen-cloze.ts`
- `scripts/qa-passages.ts`
- `lib/exam-specs/index.ts`
- `lib/question-bank/question-type-taxonomy.ts`

Create:
- `data/exam-task-templates/README.md`
- `data/exam-task-templates/gaokao-grammar-fill.json`
- `data/exam-task-templates/gaokao-seven-select.json`
- `data/exam-task-templates/cet-banked-cloze.json`
- `data/exam-task-templates/kaoyan-reading-b.json`
- `data/exam-task-templates/toefl-four-skills.json`
- `data/exam-task-templates/sat-rw-domains.json`
- `scripts/generate-question-sets-v2.ts`
- `scripts/qa-question-sets-v2.ts`
- `reports/question-type-expansion-phase11.md`

Modify:
- `package.json`
- Existing generator scripts only to block deprecated outputs and route future generation through templates.

Implementation tasks:
1. Template JSON files:
   - Define `examIds`, `taskType`, `stimulusRequirements`, `itemCount`, `optionCount`, `answerSchema`, `subskills`, `qualityRules`, `copyrightPolicy`.
   - Include explicit "original content only" policy.

2. Generator:
   - Dry run by default.
   - Supports `--template`, `--count`, `--level`, `--apply`.
   - Writes draft v2 sets only when `--apply`.
   - Does not support deprecated types.
   - Refuses to run if template asks for copied real exam content.

3. QA:
   - Validates answer counts.
   - Validates choices and answer uniqueness.
   - Validates banked cloze blank count and option count.
   - Validates seven-select has 5 blanks and 7 options when applicable.
   - Validates SAT tasks are short RW-style items, not long generic reading passages.
   - Validates kaoyan has no listening/speaking.
   - Validates TOEFL includes four-skill template coverage.

4. Patch old generators:
   - `scripts/gen-exam-questions.ts` must no longer generate `cet_cloze`.
   - `scripts/gen-questions.ts` must not generate `antonym_choice` by default.
   - `scripts/gen-vocab-ai.ts` must not write `antonym_choice`, especially with `--active`.
   - `scripts/run-gen-q.sh` must not advertise `antonym_choice`.

5. Add package scripts:
   - `"generate:qsets-v2": "npx tsx scripts/generate-question-sets-v2.ts"`
   - `"qa:qsets-v2": "npx tsx scripts/qa-question-sets-v2.ts"`

Required verification:
- Dry run one template without writing.
- `npm run qa:qsets-v2`
- `npm run validate:question-types`
- `npm run validate:exam-specs`
- `npm run lint`
- `npx tsc --noEmit`

Completion report:
1. Changed files.
2. Whether any generation was applied. Default should be no.
3. Deprecated generator cleanup results.
4. QA results.
5. Recommended first real generation batch.
```

## Phase 12 Prompt: Subjective Scoring

```md
You are implementing Ocean English question-bank rebuild Phase 12: subjective scoring for writing, translation, and speaking.

Frontend rule:
- This phase may change visible UI. If the user has not approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause before UI changes.

Goal:
Add rubric-based scoring contracts and APIs for writing, translation, and speaking tasks, with cost controls and reviewable feedback.

Hard scope:
- Do not modify existing DeepSeek route rate-limiting.
- Do not create unlimited AI scoring endpoints.
- Do not store raw microphone audio without user action and clear storage path.
- Do not claim official scores; label scores as practice estimates.

Read first:
- `components/screens/SpeakingScreen.tsx`
- `app/writing/page.tsx` if present
- `lib/ai/ai-rate-limit.ts`
- `lib/ai/ai-errors.ts`
- `lib/ai/providers/*`
- `types/question-bank-v2.ts`
- `lib/exam-specs/index.ts`

Create:
- `lib/scoring/rubric-types.ts`
- `lib/scoring/rubrics.ts`
- `lib/scoring/score-writing.ts`
- `lib/scoring/score-translation.ts`
- `lib/scoring/score-speaking.ts`
- `app/api/scoring/writing/route.ts`
- `app/api/scoring/translation/route.ts`
- `app/api/scoring/speaking/route.ts`
- `scripts/validate-rubrics.ts`
- `reports/subjective-scoring-phase12.md`

Modify:
- `package.json`
- PracticeRunner free-text/speaking renderers only if UI has been approved

Implementation tasks:
1. Rubrics:
   - Define reusable dimensions: task achievement, accuracy, vocabulary, grammar, organization, coherence, pronunciation, fluency, translation accuracy.
   - Define exam-specific rubric presets for gaokao, cet4, cet6, kaoyan, toefl.
   - SAT should not get writing/speaking scoring unless a future product scope adds it.

2. APIs:
   - Validate input length.
   - Require authenticated user if current project pattern supports it; otherwise enforce conservative anonymous limits in route code without touching DeepSeek global rate-limit route.
   - Return structured feedback: score, dimensions, strengths, issues, next practice recommendation.
   - If real AI provider is unavailable, return mock/estimated feedback with clear `provider:'mock'`.

3. Speaking:
   - If audio transcription is unavailable, support text transcript scoring first and report audio scoring as not ready.
   - Do not break existing pronunciation screen.

4. Validation:
   - `scripts/validate-rubrics.ts` checks every subjective section in ExamSpec has a rubric.
   - Checks each rubric dimension has labels, scale, and descriptions.

5. Package script:
   - `"validate:rubrics": "npx tsx scripts/validate-rubrics.ts"`

Required verification:
- `npm run validate:rubrics`
- `npm run lint`
- `npx tsc --noEmit`
- API smoke for one writing scoring request using mock provider if needed.

Completion report:
1. Changed files.
2. Any frontend changes.
3. AI provider behavior.
4. Cost/rate safety summary.
5. Verification results.
```

## Phase 13 Prompt: Learning Loop And Diagnostics

```md
You are implementing Ocean English question-bank rebuild Phase 13: learning loop and diagnostics.

Frontend rule:
- This phase changes Today, Review, and Report UI. If the user has not approved skipping design, output `FRONTEND_CHANGE_NOTICE` and pause before UI changes.

Goal:
Connect practice attempts to WordState, SkillState, ExamState, wrong-answer queues, DailyPlanEngine, ReviewHub, and Report so users get a real closed learning loop.

Hard scope:
- Do not rewrite the whole store.
- Do not remove existing SRS behavior.
- Do not fabricate diagnostics without attempt data.
- Do not show skill scores as precise if they are estimated from sparse data.

Read first:
- `store/lexiStore.ts`
- `lib/srs/schedule.ts`
- `components/screens/TodayBento.tsx`
- `components/screens/ReviewHub.tsx`
- `app/report/page.tsx`
- `components/study/DailyRecapCard.tsx`
- `app/api/user/study-progress/route.ts`
- `app/api/user/wrong-answers/route.ts`
- `app/api/user/quiz-history/route.ts`
- `lib/practice/attempt-recorder.ts`
- `types/question-bank-v2.ts`

Create:
- `lib/learning-loop/word-mastery.ts`
- `lib/learning-loop/skill-state-updater.ts`
- `lib/learning-loop/error-classifier.ts`
- `lib/daily-plan/daily-plan-engine.ts`
- `app/api/daily-plan/route.ts`
- `app/api/diagnostics/route.ts`
- `scripts/validate-learning-loop.ts`
- `reports/learning-loop-phase13.md`

Modify:
- `lib/practice/attempt-recorder.ts`
- `components/screens/TodayBento.tsx` if UI approved
- `components/screens/ReviewHub.tsx` if UI approved
- `app/report/page.tsx` or report components if UI approved
- `package.json`

Implementation tasks:
1. `word-mastery.ts`
   - Convert practice attempts into word-level updates.
   - Respect existing SRS grades.
   - Map correct/incorrect attempts into dimensions: recognize, spell, listen, context, output.

2. `skill-state-updater.ts`
   - Update exam skill state by `examId`, `sectionId`, `taskType`, and `subskills`.
   - Use conservative smoothing; do not overreact to one attempt.
   - Return confidence level based on sample size.

3. `error-classifier.ts`
   - Define error types:
     `unknown_word`, `wrong_sense`, `collocation`, `word_form`, `grammar`, `inference`, `main_idea`, `evidence`, `listening_detail`, `listening_inference`, `pronunciation`, `fluency`, `organization`, `translation_accuracy`.
   - Classify from question metadata and answer result.
   - If uncertain, use `unknown`.

4. `daily-plan-engine.ts`
   - Input: due words, weak words, weak skills, recent attempts, user goal, exam target.
   - Output cards:
     - `word_review`
     - `new_words`
     - `exam_task`
     - `mistake_fix`
     - `output`
     - `mock_review`
   - Each card must include reason text and estimated minutes.

5. APIs:
   - `/api/daily-plan` returns plan cards.
   - `/api/diagnostics` returns word/skill/exam diagnostics.
   - If v2 tables are not applied, return graceful partial diagnostics from existing data.

6. UI if approved:
   - Today should show why each task is recommended.
   - ReviewHub should include weak skill practice, not only due/weak/wrong words.
   - Report should show section/subskill diagnostics with confidence labels.

7. Validation:
   - `scripts/validate-learning-loop.ts` runs deterministic sample attempts through word mastery, skill updater, and daily plan engine.
   - Fails if an incorrect attempt produces no review/repair signal.

8. Add package script:
   - `"validate:learning-loop": "npx tsx scripts/validate-learning-loop.ts"`

Required verification:
- `npm run validate:learning-loop`
- `npm run validate:practice-session`
- `npm run lint`
- `npx tsc --noEmit`
- Browser smoke if UI changed:
  - `/today`
  - `/memory` or ReviewHub route
  - `/report`

Completion report:
1. Changed files.
2. DB changes.
3. Frontend visible changes.
4. Learning-loop sample results.
5. Verification results.
6. Remaining gaps.
```

## Sequential Review Rule

Do not hand Phase N+1 to Claude Code until:

- Claude Code has completed Phase N.
- Codex has reviewed the diff.
- Required verification for Phase N has passed or failures are clearly unrelated and accepted by the user.
- Any frontend design gate for Phase N has been handled or explicitly waived by the user.

## After Phase 13: Controlled Question Production

Completing Phases 1-13 means the project has the infrastructure to rebuild the question bank safely:

- canonical exam specs
- vocabulary level audit
- v2 schema
- practice session API
- frontend runner
- drill surfaces
- Lexiverse word entry
- migration path
- audio assets
- mock paper generator
- generation templates
- subjective scoring
- learning-loop diagnostics

It does not mean the full seven-level question bank should be generated automatically in one run. Actual content production must happen in controlled batches after the pipelines and validators exist.

Recommended ownership:

- Claude Code implements generation scripts, templates, validators, migration tools, and dry-run reports.
- Codex reviews script logic, generated samples, QA reports, and activation decisions.
- The user approves expensive or large `--apply` runs.
- Either Claude Code or Codex can run approved generation batches, but every run must produce reports and backups where data is changed.

Default generation policy:

1. Dry run first.
2. Generate only one exam level and one task type per batch.
3. Write new generated content as `draft`.
4. Run structure QA.
5. Run semantic/answer-key QA for sampled and high-risk tasks.
6. Promote to `reviewed` or `active` only after Codex review and user approval.
7. Never activate listening tasks without audio assets.
8. Never activate subjective tasks without rubrics.
9. Never generate or activate deprecated `antonym_choice` or `cet_cloze`.
10. Never copy real exam passages or questions.

Suggested content-production batches after Phase 13:

| Batch | Scope | Default owner | Activation rule |
|---|---|---|---|
| G1 | Migrate clean v1 word drills to v2 | Claude Code script, Codex review | reviewed after validator passes |
| G2 | Migrate clean v1 reading/listening/passage sets to v2 draft | Claude Code script, Codex review | active only after answer-key QA |
| G3 | Gaokao grammar fill + seven-select expansion | Approved generation run | draft first, sample review |
| G4 | CET4/CET6 banked cloze + para match expansion | Approved generation run | draft first, full answer-key QA for multi-blank |
| G5 | Kaoyan cloze + Reading B expansion | Approved generation run | draft first, strict task-shape QA |
| G6 | TOEFL reading/listening/writing/speaking task banks | Approved generation run | audio/rubric required before active |
| G7 | SAT Reading & Writing domain banks | Approved generation run | domain validator required before active |
| G8 | Mock paper pools and score calibration | Codex/Claude Code jointly | active only when pool sufficiency passes |

Codex should produce the exact batch prompt when the project reaches content production. Do not ask Claude Code to "generate the full question bank" as a single task.
