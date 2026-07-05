# Question-Bank v2 Schema — Phase 3 Report

Date: 2026-06-20
Phase: 3 — Question-bank v2 schema (SQL + contracts + validator)
Branch: iter5-f1

## 1. Goal recap

Define the SQL and TypeScript contracts for a v2 question-bank model (exams,
sections, task templates, stimuli, audio, question sets/items, target words,
rubrics, papers, attempts, skill states, daily plan) **without** touching v1
`question_bank`, **without** running SQL against the database, and **without**
any frontend change.

## 2. SQL application status

**NOT APPLIED.** `supabase/sql/p4-question-bank-v2.sql` was authored but not
executed against any database. The validator confirms this: it reports
`not_applied` with all 15 tables missing (see §6). Applying it requires the user
to run the file once in the Supabase SQL Editor. The file is idempotent
(`CREATE TABLE/INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`).

## 3. Tables & responsibilities

| Table | id | Responsibility |
|---|---|---|
| `exam_specs` | text | 7-档考试规格（DB 镜像，可由 `lib/exam-specs` seed） |
| `exam_sections` | text | 板块（skill / selection_mode / 分值 / 时长 / 是否需音频·rubric） |
| `task_templates` | text | 题型任务模板（input_mode / group_mode / answer_schema / min_pool），`exam_id` 可空=跨档共享 |
| `stimuli` | uuid | 材料（passage/dialogue/lecture/announcement/table/sentence…），含 qa_status |
| `audio_assets` | uuid | 听力音频（url/transcript/duration/accent/checksum/qa_status） |
| `rubrics` | uuid | 主观题评分量规（`criteria` jsonb） |
| `question_sets` | uuid | 题组（single 题也建为单题组），挂 exam/section/template/stimulus |
| `question_items` | uuid | 题目（choices/answer jsonb，input_mode，可挂 rubric_id） |
| `question_target_words` | uuid | 题目↔目标词归一化绑定（role/sense_key/dimension），可选 `word_id`→`dictionary_words` |
| `paper_instances` | uuid | 模拟卷实例（用户拥有，seed/mode/status/score） |
| `paper_sections` | uuid | 卷面分区（含 `user_id` 反范式化便于 RLS） |
| `paper_attempts` | uuid | 整卷提交结果（用户拥有） |
| `question_attempts` | uuid | 单题作答（用户拥有，诊断核心：exam/section/task/subskills/error_type） |
| `skill_states` | (user_id,exam_id,skill_key) | 用户×考试×技能 掌握度 |
| `daily_plan_items` | uuid | 今日计划项（用户拥有；此前不存在，新建） |

Traceability: `stimuli` / `question_sets` / `question_items` carry a nullable
`legacy_id` so the Phase 8 migration can preserve v1 `question_bank.id`.

## 4. v1 compatibility

- v1 `question_bank` (and `listening_passages`) are **unchanged**; all v1 routes
  keep working. v2 is purely additive (new tables, new files).
- `lib/exam-specs` (Phase 1, TS source of truth) and the v2 `exam_specs` table
  are aligned by stable text ids; the table is a DB mirror that a later phase can
  seed from `lib/exam-specs`. No collision with v1.
- Runtime enums live once in `lib/question-bank-v2/schema.ts`; both the SQL
  `CHECK` constraints and the TS `Row` types follow it.

## 5. RLS summary

- **Public read of active content only:** `exam_specs` / `task_templates` /
  `rubrics` (`status='active'`), `stimuli` / `audio_assets` (`qa_status='active'`),
  `question_sets` / `question_items` (`status='active'`). `exam_sections` is
  structural → `USING (true)`. `question_target_words` is **read-restricted to
  active parents** — its `question_item` *and* that item's `question_set` must be
  `active` — so draft/rejected items never leak `tested_answer`/`distractor`
  words.
- **User-owned (read+write self only):** `paper_instances`, `paper_sections`,
  `paper_attempts`, `question_attempts`, `skill_states`, `daily_plan_items` —
  `FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  matching the existing `phase-5c-core-learning.sql` style. No user can read
  another user's attempts. `paper_sections` carries a denormalized `user_id` so
  its RLS doesn't need a join.
- Service role (used by generators/migration/validator) bypasses RLS for writes;
  draft content stays invisible to the public client.

## 6. Validation results (exit codes)

| Command | Result |
|---|---|
| `npm run validate:qbank-v2` | **pass** — `not_applied`, all 15 tables missing, exit 0; wrote `reports/question-bank-v2-validation.json` |
| `npm run validate:exam-specs` | **pass** — exit 0 |
| `npm run validate:question-types` | **pass** — exit 0 |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npm run lint` | **pass** — exit 0 |

When the SQL is later applied, `validate:qbank-v2` switches to `applied` and
checks: active sets have ≥1 active item; `group_mode='set'` tasks have a
stimulus; active listening sets have active audio; `choices/answer` shape matches
`input_mode`; `question_target_words.word_id` references exist in
`dictionary_words`.

**Half-applied schema is now a failure:** if some v2 tables exist but others are
missing (e.g. a migration that errored mid-way on a FK/RLS), the validator
reports `partial_applied`, lists present/missing tables, and **exits 1** — so a
half-built schema cannot pass CI. Only an all-15-missing state is the benign
`not_applied` (exit 0).

## 7. Follow-up migration needs

- Seed `exam_specs` / `exam_sections` / `task_templates` from `lib/exam-specs`
  (a small seeder), so the DB mirror matches the TS source.
- Phase 8: migrate v1 `question_bank` rows into `question_sets` / `question_items`
  using `legacy_id`, with structurally-broken rows landing in `draft`/`rejected`.
- Phase 9: populate `audio_assets` before any listening set can go `active`.
- Phase 4: build the practice session / attempts API on top of these tables
  (writes via service role / authenticated user).

## 8. Risks before applying SQL

- **`exam_specs` table name** is new in the DB; confirm no pre-existing table of
  that name before applying (the validator showed all 15 absent, so it is safe).
- Foreign keys reference `profiles(id)` and `dictionary_words(id)`; both must
  exist (they do, per existing schema) before applying.
- The `updated_at` trigger creates a shared function `qbank_v2_set_updated_at()`;
  re-running the file replaces triggers idempotently.
- RLS public-read is gated on `active`; if the app ever needs to read `draft`
  specs publicly (e.g. coming-soon TOEFL/SAT structure), it should read from
  `lib/exam-specs` (TS) rather than loosening RLS.
- Applying SQL is a database change — must be done explicitly by the user; this
  phase intentionally leaves it unapplied.
