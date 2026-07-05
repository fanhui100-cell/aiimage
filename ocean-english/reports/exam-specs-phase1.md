# Exam Specs — Phase 1 Report

Date: 2026-06-20
Phase: 1 — Single exam-spec source (backend only)
Branch: iter5-f1

## 1. Goal recap

Create one canonical TypeScript source for the 7 exam/level structures
(`lib/exam-specs/*`) + a read-only API + a validator, **without** changing any
visible UI, DB data, or the existing `paper-specs.ts` / `drill-data.ts` static
specs. Those two static sources still drive `/drill` and `/api/mock-exam`; this
phase only establishes the future single source of truth.

## 2. The 7 specs (summary)

| id | lv | labelZh | version | minutes | fullScore (scale) | sections | status |
|---|---|---|---|---|---|---|---|
| zhongkao | 1 | 中考 | compulsory-edu-2022 | 100 | 120 (raw) | 听力 / 语言运用 / 完形 / 阅读 / 书面表达 | active |
| gaokao | 2 | 高考 | nmet-new-curriculum | 120 | 150 (150) | 听力 / 阅读 / 七选五 / 完形 / 语法填空 / 应用文 / 读后续写 | active |
| cet4 | 3 | CET-4 | cet4-current | 130 | 710 (710) | 写作 / 听力 / 选词填空 / 长篇匹配 / 仔细阅读 / 翻译 | active |
| cet6 | 4 | CET-6 | cet6-current | 130 | 710 (710) | 写作 / 听力 / 选词填空 / 长篇匹配 / 仔细阅读 / 翻译 | active |
| kaoyan | 5 | 考研 | kaoyan-en-current | 180 | 100 (100) | 完形 / 阅读A / 新题型B / 翻译 / 小作文 / 大作文 | active |
| toefl | 6 | TOEFL | toefl-ibt-2026 | 120 | 6 (1-6) | Reading / Listening / Writing / Speaking | draft |
| sat | 7 | SAT | sat-digital | 64 | 800 (200-800) | Information&Ideas / Craft&Structure / Expression / Conventions | draft |

Constraints honored: `kaoyan` has **no** listening/speaking; `sat` is RW-only
(no listening/speaking/writing-essay); `toefl` includes all four skills as
target structure; **no** section references `antonym_choice` or `cet_cloze`.

## 3. Files changed

| File | Type | Purpose |
|---|---|---|
| `lib/exam-specs/types.ts` | created | `ExamId`/`ExamLevel`/`ExamSkill`/`QuestionGroupMode`/`ScoringScale`/`ExamSpecStatus`; `OBJECTIVE_TASK_TYPES` (= taxonomy `EXAM_TASK_TYPES`), `PRODUCTIVE_TASK_TYPES`, `ALL_EXAM_TASK_TYPES`, `ExamTaskType`; `ExamSectionSpec`, `ExamSpec` |
| `lib/exam-specs/specs.ts` | created | `EXAM_SPECS` (7), `getExamSpec`, `listExamSpecs` |
| `lib/exam-specs/level-map.ts` | created | `LEVEL_TO_EXAM_ID`, `EXAM_ID_TO_LEVEL`, `normalizeExamId`, `examIdToThemeTag`, `examIdToDisplayName` |
| `lib/exam-specs/index.ts` | created | Public barrel (types + specs + level-map) |
| `app/api/exam-specs/route.ts` | created | `GET /api/exam-specs` (all) and `?id=` (single / `unknown_exam`), no auth, no DB |
| `scripts/validate-exam-specs.ts` | created | Spec invariant validator |
| `package.json` | modified | Added `validate:exam-specs` |
| `reports/exam-specs-phase1.md` | created | This report |

## 4. Database changes

**None.** No SQL, no reads/writes. The API serves static TypeScript only.

## 5. Frontend visible changes

**None.** No `components/**`, page, CSS, or route-UI change. `/drill` and
`/quiz` still use the existing `drill-data.ts` / `LexiverseQuizClient.tsx`
behavior. `lib/mock-exam/paper-specs.ts` is unchanged. The new specs are not yet
consumed by any UI.

## 6. Differences vs current static mock specs (`paper-specs.ts`)

- **Productive sections added as target structure:** writing/translation (cet4/cet6/kaoyan), applied + continuation writing (gaokao), writing (zhongkao), and TOEFL writing/speaking — all previously `skipped` / absent in `paper-specs.ts`.
- **kaoyan:** cloze now `cloze_passage` (was `cet_cloze`, retired in Phase 0A); Reading A modeled as 4 passages × 5 questions (the static spec used `passages: 7, questions: 20`); translation + small/large writing added.
- **toefl:** rebuilt to ETS 2026 four-skill structure with `1-6` scale (static spec was old `fullPoints: 120`, 54 min, Reading/Listening only).
- **sat:** rebuilt to the four Digital-SAT RW domains carried by `reading_comprehension` short-text MCQ (static spec used `reading_comprehension + synonym_substitute`, `passages: 18`).
- **cet4/cet6/gaokao/zhongkao:** objective structure preserved and compatible; writing/translation/continuation added.

## 7. Temporary fallbacks & modeling notes

- **No word-universe fallback task types were used** — every section's `taskTypes` is a real exam task type, so the validator's fallback path is not exercised.
- **Objective carriers pending v2 metadata (not fallbacks):**
  - TOEFL Listening subtypes (Conversation/Announcement/Academic Talk) are carried by `listening_comprehension`; `choose_a_response` is listed but has no v1 bank.
  - TOEFL Reading Academic Passage is carried by `reading_comprehension`; `complete_the_words` / `read_daily_life` have no v1 bank.
  - SAT's four domains are all carried by `reading_comprehension` (short-text MCQ); real domain/subskill metadata is deferred to the v2 schema (Phase 3).
- **Productive task types** (`applied_writing`, `continuation_writing`, `essay_writing`, `translation_zh_en`, `translation_en_zh`, `build_a_sentence`, `email_writing`, `academic_discussion`, `listen_and_repeat`, `interview_speaking`, etc.) are declared as structure positions only; they have no v1 question bank and will be backed by v2 schema + generation in later phases.

## 8. Verification results (exit codes)

| Command | Result |
|---|---|
| `npm run validate:exam-specs` | **pass** — `exam specs ok: 7 exams`, errors 0 (exit 0) |
| `npm run validate:question-types` | **pass** — `taxonomy ok`, errors 0 (exit 0) |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npm run lint` | **pass** — exit 0 |
| `npx tsx scripts/backend-regression.test.ts` | **pass** — exit 0 |

API smoke (dev server): `GET /api/exam-specs` → `ok:true` with 7 specs;
`?id=cet4` → single spec; `?id=nope` → `{ok:false,error:"unknown_exam"}` (HTTP 200).

## 9. Risks / open items

- **Points/itemCount are representative approximations** for some sections (gaokao varies by province/version; CET 710 split is rounded to integers). TOEFL/SAT use `points: 0` because they don't use fixed per-section scoring (TOEFL 1-6; SAT module-adaptive IRT). These must be reconciled against the latest official specs before papers are generated.
- **kaoyan is a single spec**, not yet split into 英语一/英语二 (the audit recommends splitting). Phase 1 keeps one `kaoyan` per the "exactly 7 specs" requirement; a later phase can split it.
- **SAT domain/subskill metadata is deferred** to the v2 schema (Phase 3); domains are currently only expressed via `section.id`/`notes`.
- **Two spec sources still coexist** (`exam-specs/*` vs `paper-specs.ts`/`drill-data.ts`). Migrating `/drill` and `/api/mock-exam` to consume `exam-specs` is intentionally out of scope here and left to later UI phases.

## 10. Next-step recommendation

Proceed to **Phase 2: Vocabulary level audit** (`scripts/audit-vocabulary-levels.ts`
+ report). It is backend/no-UI, can reuse `examIdToThemeTag`/`EXAM_ID_TO_LEVEL`
from this phase, and addresses the CET-6 / 考研 `primary_level` vs `levels`
coverage question. Hold for Codex review of Phase 1 first.
