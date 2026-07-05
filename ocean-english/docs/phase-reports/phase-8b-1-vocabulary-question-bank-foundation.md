# Phase 8B-1 Vocabulary + Question Bank Foundation Report

## 1. Executive Summary

Phase 8B-1 is complete as a content and data-foundation pass.

This phase adds a 150-word original vocabulary batch, graph-ready dictionary metadata, a lightweight Vocabulary Drill question bank, validators for both dictionary import data and question bank data, and small client helpers for future Quiz/LexiGraph integration.

No LexiGraph UI, word detail UI, dictionary UI, quiz UI, scan pipeline, AI provider, CatPet, payment, or admin functionality was implemented or refactored.

## 2. Files Added

- `data/dictionary/import/core-words-150-batch-1.ts`
- `types/question-bank.ts`
- `data/question-bank/original-vocab-drill-lite.ts`
- `lib/question-bank/question-bank-client.ts`
- `scripts/validate-question-bank.ts`
- `docs/phase-reports/phase-8b-1-vocabulary-question-bank-foundation.md`

## 3. Files Modified

- `lib/dictionary/dictionary-import-types.ts`
- `lib/dictionary/expanded-seed-adapter.ts`
- `scripts/validate-dictionary-import.ts`
- `package.json`

## 4. Vocabulary Expansion

- Added `CORE_WORDS_150_BATCH_1` with exactly 150 original seed entries.
- Integrated the new batch into `ExpandedSeedDictionaryClient`.
- Search and lookup now include the Phase 8B-1 batch through the existing composite dictionary chain.
- Each entry includes required learning fields:
  - `word`
  - `normalizedWord`
  - `ipa`
  - `partOfSpeech`
  - English and Chinese learner definitions
  - English and Chinese learner examples
  - `difficultyLevel`
  - `cefrLevel`
  - `sourceType`
  - `sourceNote`

## 5. LexiGraph Readiness

Dictionary import types now reserve graph-ready metadata:

- `synonyms`
- `antonyms`
- `collocations`
- `relatedWords`
- `themeTags`
- `domainTags`
- `examTags`
- `sceneUsage`
- `wordFamily`
- `root`
- `prefix`
- `suffix`

The expanded seed adapter maps these fields into the existing `DictionaryWord` shape without changing LexiGraph UI code.

## 6. Question Bank Lite

Added `ORIGINAL_VOCAB_DRILL_LITE` with 24 original curated vocabulary drill questions.

Covered question styles:

- English definition -> choose word
- Chinese/learner definition -> choose word
- EN -> ZH learner meaning
- ZH -> EN learner meaning
- synonym choice
- antonym choice
- collocation choice

Question source model supports:

- `original_curated`
- `ai_generated_practice`
- `scan_private_practice`
- `exam_tagged_practice`

Only `original_curated` is used in this public seed file.

## 7. Validators

Dictionary validator:

- Validates empty required fields.
- Detects duplicate IDs and words across import seed groups.
- Scans source notes, definitions, examples, graph fields, and tags for suspicious commercial/source strings.
- Exits with code 1 on errors.

Question bank validator:

- Validates required fields.
- Detects duplicate question IDs.
- Checks source type allowlist.
- Checks exactly four choices.
- Checks answer matches a choice ID.
- Checks linked `wordId` exists in known seed dictionaries.
- Scans question text and metadata for suspicious commercial/source strings.
- Exits with code 1 on errors.

## 8. Compliance Notes

- All new dictionary entries are original LexiOcean educational seed content.
- All new question bank items are original curated practice questions.
- No commercial dictionary text is included.
- No pirated or copied exam questions are included.
- No user scan/upload content is added to public seed data.
- Scan vocabulary policy is unchanged.

## 9. Known Limitations

- Phase 8B-1 does not integrate the new question bank into the Quiz UI.
- Chinese fields in the new 150-word batch are lightweight learner placeholders to keep this foundation pass encoding-safe.
- IPA values in the new batch are lightweight placeholder-style pronunciations and should be refined in a later pronunciation/content quality pass.
- No Supabase seed SQL was generated for the 150-word batch in this phase.

## 10. Test Commands

```bash
npm run validate:dictionary
npm run validate:questions
npx tsc --noEmit
npm run lint
npm run build
npx tsx -e "import { getDictionaryClient } from './lib/dictionary/dictionary-client'; import { getVocabularyDrillQuestions } from './lib/question-bank/question-bank-client'; (async()=>{ const client=getDictionaryClient(); const word=await client.lookupWord('adjust'); const search=await client.searchWords('adjust', { limit: 5 }); const qs=getVocabularyDrillQuestions(3); console.log(JSON.stringify({ lookupWord: word?.word ?? null, lookupId: word?.id ?? null, searchCount: search.length, questions: qs.length, firstQuestion: qs[0]?.id }, null, 2)); })();"
```

Results:

- `npm run validate:dictionary` -> 224 import words, 0 errors, 0 warnings.
- `npm run validate:questions` -> 24 questions, 0 errors, 0 warnings.
- `npx tsc --noEmit` -> 0 errors.
- `npm run lint` -> 0 errors.
- `npm run build` -> successful, 46 routes.
- Smoke check -> `adjust` lookup OK, search OK, Vocabulary Drill client OK.
