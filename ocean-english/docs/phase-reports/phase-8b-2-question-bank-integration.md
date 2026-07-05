# Phase 8B-2 Question Bank Integration + Quiz Center Lite Report

## 1. Executive Summary

Phase 8B-2 is complete.

The Phase 8B-1 Question Bank Lite is now connected to the existing quiz flow through a lightweight Vocabulary Drill mode. `/quiz` still defaults to the existing Quick Quiz behavior, while `/quiz?mode=vocabulary-drill` starts a five-question original curated vocabulary drill session.

No store schema, Supabase sync schema, AI provider, Scan pipeline, LexiGraph UI, Reading practice, Exam platform, or large visual system was changed.

## 2. Files Added

- `lib/quiz/quiz-question-adapter.ts`
- `lib/question-bank/question-bank-session-builder.ts`
- `components/quiz/QuizModeSelector.tsx`
- `components/quiz/QuizSourceBadge.tsx`
- `docs/phase-reports/phase-8b-2-question-bank-integration.md`

## 3. Files Modified

- `lib/question-bank/question-bank-client.ts`
- `app/quiz/page.tsx`

## 4. Question Bank Client

`getQuestionBankItems()` now supports:

- `questionType`
- `questionTypes`
- `wordId`
- `normalizedWord`
- `difficultyLevel`
- `examTag`
- `themeTag`
- `sourceType`
- `skillTag`
- `limit`

The public Vocabulary Drill seed remains `original_curated` only.

## 5. Quiz Session Builder

`questionBankItemToQuizQuestion()` converts a `QuestionBankItem` into the existing `QuizQuestion` shape:

- `id` -> question bank item id
- `type` -> `multiple-choice`
- `wordId` -> item word id
- `word` -> normalized word
- `question` -> prompt
- `options` -> item choices
- `correctAnswer` -> choice id (`a`, `b`, `c`, or `d`)
- `explanation` -> item explanation
- `explanationZh` -> item `explanationZh` or `sourceNote`

The mapping matches the existing quiz engine, which checks `selected === current.correctAnswer` using option ids.

`buildVocabularyDrillSession()` builds a five-question drill by default, supports filters, and deduplicates mixed question sources.

## 6. Quiz Page Integration

`/quiz` behavior:

- `/quiz` keeps the existing Quick Quiz default.
- `/quiz?mode=vocabulary-drill` starts Vocabulary Drill.
- `/quiz?mode=vocabulary-drill&word=adjust` tries word-specific question bank items first.
- `/quiz?mode=vocabulary-drill&difficulty=3` filters by difficulty level.

The page includes a lightweight mode selector:

- Quick Quiz
- Vocabulary Drill
- Review Quiz
- Wrong Answer Booster

Review Quiz and Wrong Answer Booster link to the existing Memory flows instead of introducing a new engine.

## 7. Wrong Answers / Quiz History Compatibility

The existing quiz answer flow is preserved:

- Wrong answers still call `addWrongAnswer()`.
- Completed sessions still call `addQuizSession()`.
- Correct answers still award XP and complete the daily quiz task.

No changes were made to:

- `QuizSession`
- `QuizAttempt`
- `WrongAnswer`
- `learningStore`
- Supabase quiz sync schema

## 8. Fallback Strategy

Vocabulary Drill source order:

1. Filtered original curated question bank items.
2. Broader original curated Vocabulary Drill items if the word-specific or difficulty-specific set is too small.
3. Existing mock quiz fallback.

If question bank content is insufficient, the session still renders instead of crashing.

## 9. Compliance Notes

- Original curated question bank items remain distinct from mock quiz items.
- `sourceType` and `sourceNote` are preserved in question bank data.
- No commercial dictionary content was added.
- No pirated exam content was added.
- `scan_private_practice` remains reserved and is not connected.
- No user-uploaded scan content is publicized.

## 10. Known Limitations

- This is not a full Quiz Center UI.
- Reading Practice is not implemented.
- Exam Platform is not implemented.
- AI-generated quiz flow is not connected.
- Scan private practice is not connected.
- Supabase quiz sync has a pre-existing limitation where `correct_answer` is not reliably represented in the attempt payload; this is intentionally left for Phase 8B-2.1.
- Quiz history does not persist source metadata because this phase intentionally avoided store/schema changes.

## 11. Test Commands

```bash
npm run validate:questions
npm run lint
npm run build
```

Additional smoke check:

```bash
npx tsx -e "import { getQuestionBankItems } from './lib/question-bank/question-bank-client'; import { buildVocabularyDrillSession } from './lib/question-bank/question-bank-session-builder'; console.log(JSON.stringify({ typeFiltered: getQuestionBankItems({ questionType: 'definition_to_word', limit: 50 }).length, wordFiltered: getQuestionBankItems({ normalizedWord: 'adjust' }).length, difficultyFiltered: getQuestionBankItems({ difficultyLevel: 3, limit: 50 }).length, session: buildVocabularyDrillSession({ count: 5, difficultyLevel: 3 }).map(q=>q.id) }, null, 2));"
```

## 12. Recommended Codex Review Prompt

Review Phase 8B-2 of ocean-english (Question Bank Integration + Quiz Center Lite).

Focus areas:

1. Verify `QuestionBankQuery` supports `questionType`, `questionTypes`, `wordId`, `normalizedWord`, `difficultyLevel`, `examTag`, `themeTag`, `sourceType`, and `skillTag`.
2. Verify `questionBankItemToQuizQuestion()` maps `correctAnswer` to the existing quiz engine's expected option id, not choice text.
3. Verify `buildVocabularyDrillSession()` defaults to 5 questions and falls back to mock quiz when question bank content is insufficient.
4. Verify `/quiz` default behavior remains Quick Quiz.
5. Verify `/quiz?mode=vocabulary-drill`, `/quiz?mode=vocabulary-drill&word=adjust`, and `/quiz?mode=vocabulary-drill&difficulty=3` are supported.
6. Verify wrong answers still enter `learningStore.wrongAnswers`.
7. Verify completed sessions still enter `learningStore.quizHistory`.
8. Verify no schema changes were made to `QuizSession`, `QuizAttempt`, `WrongAnswer`, learningStore, Supabase sync, Auth, migration, Scan, AI provider, LexiGraph, Dictionary, or Word Detail.
9. Verify no commercial dictionary content, pirated exam content, or scan-private content was introduced.
10. Confirm `npm run validate:questions`, `npm run lint`, and `npm run build` pass.
