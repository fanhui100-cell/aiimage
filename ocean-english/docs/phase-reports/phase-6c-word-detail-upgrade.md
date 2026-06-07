# Phase 6C: Word Detail Upgrade

**Date:** 2026-06-02
**Status:** Complete — ready for Codex review

---

## 1. Current Word Detail Flow (pre-Phase 6C)

```
/word/[slug]/page.tsx
  → getMockWord(slug)      [data/mock-words.ts, 20 words]
  → Word type              [types/word.ts]
  → WordDetailClient       [receives Word prop]
```

Fields displayed: word, phonetic (IPA), examFrequency badges, definitions (with embedded examples), etymology, mnemonics, synonyms/antonyms, collocations, sceneUsage, AI explain panel.

Missing: CEFR level, difficulty indicator, isCoreWord/isExamWord, source attribution, separate examples list, graceful null handling for optional fields.

---

## 2. New Dictionary Lookup Flow (Phase 6C)

```
/word/[slug]/page.tsx
  → getDictionaryClient().lookupWord(slug)
        ↓ CompositeDictionaryClient tries in order:
        1. CoreSeedAdapter    [data/dictionary/core-words-seed.ts, 60 words]
        2. MockDictionaryAdapter [data/mock-words.ts, 20 words]
        3. null → friendly 404
  → DictionaryWord type    [lib/dictionary/dictionary-types.ts]
  → WordDetailClient       [receives DictionaryWord prop]
```

**Total reachable words:** 80 (60 seed + 20 mock, with any duplicates resolved by seed winning).

**Failure modes:**
- Supabase not configured: no impact (dictionary is local-only in Phase 6C)
- Seed file malformed: TypeScript compile error caught at build time
- Word not in any source: 404 page with navigation links

---

## 3. Files Added

| File | Purpose |
|------|---------|
| [lib/dictionary/core-seed-adapter.ts](../../lib/dictionary/core-seed-adapter.ts) | `DictionaryClient` backed by Phase 6B seed; builds an O(1) lookup index |
| [app/api/dictionary/word/[slug]/route.ts](../../app/api/dictionary/word/[slug]/route.ts) | Public GET endpoint — word lookup by slug |
| [app/api/dictionary/search/route.ts](../../app/api/dictionary/search/route.ts) | Public GET endpoint — text + level search |

## 4. Files Modified

| File | Change |
|------|--------|
| [lib/dictionary/dictionary-client.ts](../../lib/dictionary/dictionary-client.ts) | `CompositeDictionaryClient` + `getDictionaryClient()` factory returning seed→mock chain |
| [lib/dictionary/mock-dictionary-adapter.ts](../../lib/dictionary/mock-dictionary-adapter.ts) | Extracts `examples` from `Definition.example` fields (previously `examples: []`) |
| [app/word/[slug]/page.tsx](../../app/word/[slug]/page.tsx) | Uses `getDictionaryClient().lookupWord()` instead of `getMockWord()` |
| [app/word/[slug]/WordDetailClient.tsx](../../app/word/[slug]/WordDetailClient.tsx) | Prop changed to `DictionaryWord`; full UI upgrade |

---

## 5. Dictionary View Model (DictionaryWord)

`lib/dictionary/dictionary-types.ts` (Phase 6A, unchanged in 6C):

| Field | Type | Source |
|-------|------|--------|
| `id` | string | slug, matches `saved_words.word_id` |
| `word` | string | word text |
| `phoneticIpa` | string \| null | IPA notation |
| `partOfSpeech` | string \| null | primary POS |
| `cefrLevel` | CefrLevel \| null | A1–C2 |
| `level` | WordLevel | beginner…exam-prep |
| `difficulty` | 1–5 | difficulty rating |
| `isCore` | boolean | core vocabulary flag |
| `isExamWord` | boolean | appears in exams |
| `examTags` | ExamTag[] | TOEFL, IELTS, GRE… |
| `definitions` | DictionaryDefinition[] | EN + ZH, ordered |
| `examples` | DictionaryExample[] | EN + ZH sentences |
| `etymology` | DictionaryEtymology \| null | roots + explanation |
| `mnemonics` | DictionaryMnemonic[] | standard + evil styles |
| `synonyms` | string[] | word slugs |
| `antonyms` | string[] | word slugs |
| `collocations` | DictionaryCollocation[] | phrase + example |
| `sceneUsages` | DictionarySceneUsage[] | scene + example |
| `sourceType` | DictionarySourceType | 'original' for seed |
| `sourceNote` | string \| null | attribution text |

---

## 6. Word Detail UI Upgrade

New sections added to `WordDetailClient`:

| Section | New content |
|---------|------------|
| **Header** | POS badge, CEFR badge (e.g., B2), difficulty dots (●●●○○), Core/Exam badges, exam tag chips |
| **Definitions** | `definitionEn` + `definitionZh` — paired with `examples[i]` inline |
| **Memory** | `mnemonics.find(standard)` + optional `mnemonics.find(evil)` — handles nulls gracefully |
| **Synonyms / Antonyms** | Only rendered when arrays are non-empty |
| **Collocations** | Uses `exampleEn` / `exampleZh` (was `example`) |
| **Scene Usage** | Uses `sceneUsages` (was `sceneUsage`) + `sceneEn` (was `scene`) |
| **Etymology** | Uses `word.etymology?.roots` — skips section when null |
| **Source Attribution** | Small footer note for `sourceType === 'original'` |

All sections use graceful null/empty guards — no undefined or empty-array renders.

---

## 7. Learning Actions Compatibility

| Action | Implementation | Status |
|--------|---------------|--------|
| Add to Review | `addToReview(word.id, word.word)` | ✅ unchanged |
| Save Word | `SaveWordButton wordId={word.id} word={word.word}` | ✅ unchanged |
| Quiz This | `router.push('/quiz?word=' + word.id)` | ✅ unchanged |
| Ask AI | POST `/api/ai/word-explain` with `word.word` | ✅ unchanged |
| SM-2 review | Uses `word.id` as string key in `review_words` | ✅ unchanged |
| Cloud sync | Phase 5C sync uses `wordId` string — no FK | ✅ unaffected |

**wordId stability:** `DictionaryWord.id` is the slug (e.g., `'ubiquitous'`). This matches the existing `saved_words.word_id` and `review_words.word_id` TEXT columns. No duplicates, no remapping needed.

---

## 8. Mock Fallback Compatibility

- `data/mock-words.ts` is **not changed**
- `MockDictionaryAdapter` is still used (now as second fallback)
- The 20 mock words are reachable at `/word/[slug]` as before
- The mock adapter now correctly populates `examples[]` by extracting from `Definition.example`
- If a word exists in both seed (60) and mock (20), the seed version wins (tried first)

---

## 9. API Routes Added

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/dictionary/word/[slug]` | GET | None | Single word lookup |
| `/api/dictionary/search` | GET | None | Text + level search |

Both routes are public (dictionary is read-only, no user data). They use `getDictionaryClient()` so Phase 6D can upgrade to Supabase without changing the routes.

Search params: `?q=text&level=B2&limit=20&offset=0`

---

## 10. Compliance Notes

- All 60 seed words have `sourceType = 'original'`
- Source attribution shown at bottom of word detail page
- No commercial dictionary text
- No pirated exam word lists
- AI explain result clearly labeled, not presented as dictionary authority
- User-uploaded scan vocabulary does not enter the dictionary

---

## 11. Known Limitations

| Item | Deferred to |
|------|-------------|
| `/dictionary` page still uses `mockWords` directly (not DictionaryClient) | Phase 6E |
| Supabase `dictionary_words` not yet wired | Phase 6D+ |
| PronunciationButton not yet on word detail page | Phase 6D |
| Full-text search (`pg_trgm`, search vectors) | Phase 6E |
| Scene usages empty for 60 seed words | Phase 6E content expansion |
| Synonyms/antonyms link to /word/[slug] — may 404 if not in dictionary | Known, acceptable |
| No word-to-word navigation (prev/next) | Phase 6E |

---

## 12. Phase 6D Recommendation

Phase 6D (Pronunciation MVP):
1. Wire `PronunciationButton` into `WordDetailClient` (2 lines — already architected in Phase 6A)
2. Upgrade `/pronunciation/page.tsx` from "Coming Soon" to live demo
3. Add `AccentSelector` for persistent US/UK preference

---

## 13. Codex Review Checklist

```
Review Phase 6C of ocean-english (Word Detail Upgrade).

Focus areas:
1. Lookup chain: verify getDictionaryClient() in dictionary-client.ts returns a
   CompositeDictionaryClient with CoreSeedAdapter first, MockDictionaryAdapter second.
   Confirm lookupWord() returns the first non-null result.
2. CoreSeedAdapter: verify seedToDictionaryWord() maps all SeedWordEntry fields correctly;
   verify the O(1) index is deduplicated; verify cefrToLevel() mapping is correct.
3. Mock adapter: verify examples are now extracted from Definition.example (not []).
4. WordDetailClient: verify prop type is DictionaryWord (not Word); verify all nullable
   fields (etymology, mnemonics, phoneticIpa) are guarded; verify learning actions still
   use word.id and word.word.
5. Learning compatibility: confirm addToReview(word.id, word.word) and
   SaveWordButton wordId={word.id} are unchanged and use the slug-format id.
6. API routes: verify /api/dictionary/word/[slug] and /api/dictionary/search need no auth;
   verify search respects MAX_LIMIT=50; verify bad slug returns 400/404.
7. No regressions: confirm data/mock-words.ts, types/word.ts, app/quiz, app/scan,
   app/memory, app/dictionary are unchanged.
8. Build: confirm npm run lint and npm run build both pass with 0 errors.

Files to review:
- lib/dictionary/core-seed-adapter.ts
- lib/dictionary/dictionary-client.ts
- lib/dictionary/mock-dictionary-adapter.ts (examples fix)
- app/word/[slug]/page.tsx
- app/word/[slug]/WordDetailClient.tsx
- app/api/dictionary/word/[slug]/route.ts
- app/api/dictionary/search/route.ts
```
