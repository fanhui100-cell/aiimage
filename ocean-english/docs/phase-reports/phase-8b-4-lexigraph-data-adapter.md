# Phase 8B-4 LexiGraph Data Adapter Report

## 1. Executive Summary

Phase 8B-4 is complete.

This phase adds a pure dictionary-to-graph data adapter for future LexiGraph / universe map work. It converts `DictionaryWord` data into graph-ready nodes, edges, relation summaries, metadata, and warnings.

No LexiGraph UI, `/lexigraph` page, layout, Liquid Glass UI, 3D universe, Scan pipeline, AI provider, Auth, Supabase, migration, Dictionary UI, Word Detail UI, Quiz, or git commit was changed.

## 2. Files Added

- `types/lexigraph-data.ts`
- `lib/lexigraph/lexigraph-data-adapter.ts`
- `docs/phase-reports/phase-8b-4-lexigraph-data-adapter.md`

## 3. Files Modified

- None.

## 4. Data Types

`types/lexigraph-data.ts` defines a separate Phase 8B-4 data model:

- `LexiGraphDataNodeType`
- `LexiGraphDataEdgeType`
- `LexiGraphDataNode`
- `LexiGraphDataEdge`
- `LexiGraphRelationSummary`
- `LexiGraphData`
- `LexiGraphDataAdapterOptions`

The existing `types/lexigraph.ts` was intentionally not modified because it serves the current Phase 6D UI model.

## 5. Adapter Design

`buildLexiGraphData(word, options)` is a pure function:

- No React
- No store access
- No layout assignment
- No API/network call
- No UI dependency

It creates:

- center word node
- synonym nodes / edges
- antonym nodes / edges
- collocation nodes / edges
- tag-derived related nodes / edges
- exam tag nodes / edges
- optional metadata nodes for CEFR and difficulty
- relation summary
- warnings

## 6. Metadata Strategy

By default, difficulty and CEFR are stored only on the center word node metadata:

- `difficultyLevel`
- `cefrLevel`
- `isCoreWord`
- `isExamWord`
- `examTags`
- `tags`
- `sourceType`
- `sourceNote`
- `partOfSpeech`

The adapter supports `includeMetadataNodes?: boolean`. When enabled, it can generate `cefr` and `difficulty` nodes/edges. Default is off.

## 7. Relation Mapping

Mapping rules:

- `word.synonyms` -> `synonym` nodes and edges
- `word.antonyms` -> `antonym` nodes and edges
- `word.collocations` -> `collocation` nodes and edges
- `word.tags` -> `related` nodes and edges
- `word.examTags` -> `exam` nodes and edges
- `word.cefrLevel` -> center metadata by default
- `word.difficulty` -> center metadata by default

Because `DictionaryWord` currently merges theme/domain/related/wordFamily import fields into `tags`, tag-derived nodes are marked:

```ts
metadata: {
  sourceField: 'tags',
  inferredRelation: true
}
```

## 8. Fallback / Warning Behavior

The adapter does not throw for missing optional relation groups.

Warnings can include:

- no synonym relations
- no antonym relations
- no collocation relations
- no tag-derived related relations
- exam word with no exam tags
- missing CEFR metadata

This keeps the data model usable for sparse dictionary entries.

## 9. Smoke Results

Smoke tested with real dictionary words:

- `algorithm`
- `dashboard`
- `heritage`

Example result for `algorithm`:

- nodes: 12
- edges: 11
- synonyms: 2
- antonyms: 1
- collocations: 2
- related: 4
- exams: 2
- warnings: 0

Metadata node option smoke:

- default metadata nodes: 0
- `includeMetadataNodes: true` generated CEFR and difficulty nodes

## 10. Compatibility Notes

No existing LexiGraph UI mapper was changed:

- `types/lexigraph.ts` unchanged
- `lib/lexigraph/lexigraph-data-mapper.ts` unchanged
- `lib/lexigraph/lexigraph-layout.ts` unchanged
- `/lexigraph` unchanged

Future UI work can either:

- consume the new `LexiGraphData` model directly, or
- bridge it into the existing UI model in a later phase.

## 11. Test Commands

```bash
npx tsc --noEmit
npm run validate:dictionary
npm run validate:questions
npm run lint
npm run build
```

Results:

- `npx tsc --noEmit` -> passed
- `npm run validate:dictionary` -> passed, 344 import words, 0 errors, 0 warnings
- `npm run validate:questions` -> passed, 24 questions, 0 errors, 0 warnings
- `npm run lint` -> passed
- `npm run build` -> passed, 46 routes

Build note:

- Next.js still reports the existing `middleware` convention deprecation warning. This is unrelated to Phase 8B-4.

## 12. Known Limitations

- Theme/domain/related/wordFamily cannot be separated cleanly from `DictionaryWord` yet because they are currently merged into `tags`.
- Adapter does not check whether synonym/antonym labels exist as dictionary words.
- Adapter does not assign layout positions.
- Adapter does not render UI.
- Adapter does not create full multi-word graph traversal.
- Scene usage is not currently represented as a dedicated node type in this Phase 8B-4 model.

## 13. Recommended Codex Review Prompt

Review Phase 8B-4 of ocean-english (LexiGraph Data Adapter).

Focus areas:

1. Verify `types/lexigraph-data.ts` is separate from existing `types/lexigraph.ts`.
2. Verify no existing LexiGraph UI files or `/lexigraph` route were modified.
3. Verify `buildLexiGraphData()` is a pure dictionary-to-graph adapter with no React/store/layout dependency.
4. Verify center node metadata includes difficultyLevel, cefrLevel, isCoreWord, isExamWord, examTags, tags, sourceType, sourceNote, and partOfSpeech.
5. Verify difficulty and CEFR nodes are not generated by default.
6. Verify `includeMetadataNodes: true` can generate difficulty / CEFR nodes.
7. Verify synonyms, antonyms, collocations, tags, and examTags produce graph-ready nodes and edges.
8. Verify tag-derived related nodes include `metadata.sourceField = 'tags'` and `metadata.inferredRelation = true`.
9. Verify relationSummary counts edges correctly.
10. Verify sparse fields produce warnings instead of crashes.
11. Confirm `npm run validate:dictionary`, `npm run validate:questions`, `npm run lint`, and `npm run build` pass.
