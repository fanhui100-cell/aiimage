# Word-Level v2 Coverage Expansion Plan (2026-07-05)

> **Track split from** `docs/superpowers/plans/2026-07-05-post-cc-review-conditional-pass-development-plan.md` (Task 6).
> **Purpose:** Close the CC-review P2-5 / P2-6 gap — active v2 `question_target_words` coverage is currently only ~255 distinct words (0.9% of the 28,602-word dictionary), all from the 3 Word-Universe types, so per-word practice is v1-fallback for ~99% of words. This is a **content/data production track**, deliberately kept out of the safety-fix branch.

## Goal

Raise real per-word v2 coverage so that word-mode practice is a genuine v2 loop (records `question_attempts` / `skill_states`) for the words users actually reach, and stop relying on v1 fallback for high-frequency exam vocabulary.

## Initial Target (first measurable milestone)

Initial target: raise active v2 `question_target_words` coverage from 255 distinct words to at least 2,000 distinct words, prioritizing high-frequency CET4/CET6/TOEFL/SAT words and words surfaced in Dictionary/Lexiverse entry points.

## Global Constraints

- No DB reset, delete, or `promote --apply` without explicit owner approval.
- Every promoted set must be `gen:` provenance (Word-Universe governance) and pass `audit:wu-source --fail-on-qb-active`.
- Until coverage is sufficient, product copy must keep disclosing v1 fallback (see the post-CC-review plan Task 6 Step 3): "部分单词练习仍使用旧题库补位".
- Track distinct-v2-word coverage as an explicit metric so progress is measurable and not overstated.

## Work Outline (fill in per batch)

1. **Measure baseline** — snapshot distinct `word_id` with active v2 `question_target_words`, broken down by exam/level; confirm the 255 figure and record the coverage metric.
2. **Prioritize word list** — high-frequency CET4/CET6/TOEFL/SAT vocabulary + words reachable from Dictionary/Lexiverse entry points; exclude words that already have active v2 linkage.
3. **Generate + QA in draft** — author `gen:` sets that carry real `question_target_words` links (not just Word-Universe drills); keep everything draft until QA passes.
4. **Promote in owner-approved batches** — manifest-driven, dry-run → apply → rerun-0, per existing promote guards; never bulk-promote without a manifest.
5. **Re-measure + update disclosure** — once coverage passes a milestone, update coverage audit and relax the v1-fallback disclosure only for the covered scope.

## Validation Commands (run each batch)

```powershell
npm run validate:qbank-v2
npm run qa:qsets-v2
npm run validate:practice-session
npm run audit:qbank-v2-coverage
```

Additionally, before promoting Word-Universe-sourced sets:

```powershell
npm run audit:wu-source -- --fail-on-qb-active
npm run validate:wu-promote-guards
```

## Definition of Done (first milestone)

- Active v2 distinct-word coverage ≥ 2,000, recorded in `reports/qbank-v2-coverage-audit.md`.
- `validate:practice-session` shows word-mode for covered high-frequency words resolves `source=v2` (not v1).
- Product copy for covered scope no longer implies v1 fallback; uncovered scope still discloses it honestly.
