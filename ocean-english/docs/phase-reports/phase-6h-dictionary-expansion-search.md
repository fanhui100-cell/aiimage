# Phase 6H-A: Dictionary DB Wiring + Core Word Import Pipeline

**Status:** Complete — ready for Codex review  
**Date:** 2026-06-03  
**Previous:** Phase 6F (LexiGraph Polish + Motivation Lite)

---

## 1. Executive Summary

Phase 6H-A is complete and ready for Codex review.

The dictionary system is now wired to Supabase (with graceful fallback), 74 original expanded words have been added, a compliant import/validation/SQL pipeline is established, and the `/dictionary` page now queries the search API rather than the static mock word list.

Total dictionary coverage: **154 words** (74 expanded + 60 Phase 6B core + 20 mock, deduplicated).

---

## 2. Files Added

| File | Purpose |
|------|---------|
| `lib/dictionary/dictionary-import-types.ts` | `DictionaryImportWord` type + `toDbSourceType()` mapping |
| `data/dictionary/import/core-words-expanded.ts` | 74 original expanded words in import format |
| `lib/dictionary/expanded-seed-adapter.ts` | `DictionaryClient` backed by expanded seed |
| `lib/dictionary/supabase-dictionary-client.ts` | `DictionaryClient` backed by Supabase (graceful fallback) |
| `scripts/validate-dictionary-import.ts` | Import data compliance validator |
| `scripts/generate-dictionary-seed-sql.ts` | SQL generator for Supabase seeding |
| `supabase/sql/phase-6h-core-dictionary-seed.sql` | Generated seed SQL (run manually in Supabase) |
| `docs/superpowers/plans/2026-06-02-phase-6h-dictionary-expansion.md` | Implementation plan |

---

## 3. Files Modified

| File | Change |
|------|--------|
| `lib/dictionary/dictionary-client.ts` | Updated factory chain: Supabase → expanded → core → mock |
| `app/api/dictionary/search/route.ts` | Added `difficulty` query param |
| `app/dictionary/page.tsx` | API-driven search replacing static `mockWords` |
| `package.json` | Added `validate:dictionary` script |

---

## 4. Dictionary Data Coverage

| Source | Words | CEFR | Content |
|--------|-------|------|---------|
| Phase 6H expanded seed | 74 | A2–C2 | A2(10) B1(20) B2(20) C1(17) C2(7) |
| Phase 6B core seed | 60 | A2–C1 | A2(8) B1(16) B2(22) C1(14) |
| Phase 1 mock | 20 | varied | GRE/exam vocabulary |
| **Total (deduplicated)** | **154** | A2–C2 | — |

**Field coverage for Phase 6H expanded seed:**
- 74/74 have IPA
- 74/74 have English definition
- 74/74 have Chinese definition
- 74/74 have English example + Chinese translation
- 44/74 are core words
- 47/74 are exam words with exam tags
- 0/74 have collocations (can be added in Phase 6H-B)
- 0/74 have mnemonics (can be added in Phase 6H-B)

---

## 5. Data Source Compliance

| Field | Value |
|-------|-------|
| `sourceType` | `original_seed` |
| `sourceNote` | "Original educational content created for LexiOcean Phase 6H expansion." |
| Commercial dictionaries used | No |
| Pirated exam word lists | No |
| User-uploaded content | No |
| AI-generated content | None in Phase 6H-A (all original) |

Compliance enforced at two levels:
1. `toDbSourceType()` throws if `user_private` is passed — cannot reach the DB
2. Validation script checks for blocked source strings (oxford, cambridge, etc.)

---

## 6. Import / Validation Pipeline

**Type:** `lib/dictionary/dictionary-import-types.ts` → `DictionaryImportWord`

**Data:** `data/dictionary/import/core-words-expanded.ts`

**Validate:**
```bash
npm run validate:dictionary
# → npx tsx scripts/validate-dictionary-import.ts
```

Output:
```
════ Dictionary Import Validator ════
Total words:   74   Core words: 44   Exam words: 47
Errors: 0   Warnings: 0
CEFR distribution: A2:10 B1:20 B2:20 C1:17 C2:7
✓ All checks passed.
```

Checks performed: word not empty, normalizedWord format, ≥1 en + ≥1 zh definition, examples present, sourceType valid, sourceNote required, no blocked commercial strings, exam tag consistency, duplicate detection.

---

## 7. Seed SQL / Upsert Script

**Generator:** `scripts/generate-dictionary-seed-sql.ts`  
**Output:** `supabase/sql/phase-6h-core-dictionary-seed.sql`

**To seed Supabase (manual step):**
1. Ensure `phase-6a-dictionary-pronunciation-schema.sql` has been applied
2. Copy `supabase/sql/phase-6h-core-dictionary-seed.sql` content
3. Paste into Supabase SQL Editor → Run

**Stats:** 74 words, 74 definitions, 74 examples, 222 synonyms, 156 antonyms, 133 exam tags.

**To regenerate after editing the seed:**
```bash
npx tsx scripts/generate-dictionary-seed-sql.ts
```

---

## 8. Repository Lookup Flow

```
getDictionaryClient().lookupWord("ability")
  1. SupabaseDictionaryClient
       → if NEXT_PUBLIC_SUPABASE_URL configured + table exists → DB row
       → else → null (falls through)
  2. ExpandedSeedAdapter
       → found in 74-word expanded seed → DictionaryWord
  3. CoreSeedAdapter
       → not found (ability is a 6H word) → null
  4. MockDictionaryAdapter
       → not found → null
  5. → null (404)

getDictionaryClient().lookupWord("accept")   [Phase 6B word]
  1. SupabaseDictionaryClient → null (falls through)
  2. ExpandedSeedAdapter → null (not in expanded)
  3. CoreSeedAdapter → found → DictionaryWord
```

All adapters fail gracefully. No user-visible errors. No adapter throws.

---

## 9. API Routes

### GET /api/dictionary/word/[slug]
- Unchanged — already worked via `getDictionaryClient().lookupWord()`
- Automatically gains expanded seed + Supabase words via updated chain
- Returns 404 + `{ok:false, message}` if not found

### GET /api/dictionary/search
- **New params:** `difficulty` (1-5)
- All params: `q`, `level`, `difficulty`, `limit` (max 50, default 20), `offset`
- Returns: `{ok, query, total, data: DictionaryWord[]}`
- No auth required

---

## 10. Page Integration

### /dictionary
- Now fetches from `/api/dictionary/search` (useEffect + 300ms debounce on query)
- Initial load: 80 words (no filters)
- Level and difficulty filters trigger immediately
- `DictionaryWord → Word` adapter (`toWordCardProp`) preserves WordCard compatibility
- Empty/not-found states handled clearly

### /word/[slug]
- Unchanged — automatically gains 74 new words via the updated lookup chain
- Fallback chain continues to work if Supabase not configured

### /lexigraph
- Unchanged — automatically gains 74 new words
- Synonym/collocation nodes resolve via getDictionaryClient() chain

---

## 11. Scan Vocabulary Policy

Scan-extracted vocabulary is **not** written to `dictionary_words`. This policy is unchanged.

Phase 6H-B (future): lightweight lookup to match extracted words against the dictionary for stable wordIds. Low priority — no breaking change needed now.

---

## 12. Known Limitations

- **Supabase not seeded by default.** Run `phase-6h-core-dictionary-seed.sql` manually in Supabase SQL Editor. Until then, system works fully offline via expanded + core + mock seeds.
- **Search results are lightweight.** For Supabase search results, related arrays (examples, mnemonics, collocations, etc.) are empty — only loaded on `lookupWord()`. Acceptable for card display.
- **No collocations or mnemonics in expanded seed.** Can be added in Phase 6H-B.
- **No audio URLs.** `word_pronunciations` rows would have `audio_url = null`. Browser TTS used via PronunciationButton.
- **No pg_trgm fuzzy search.** ILIKE is sufficient for ≤500 words. Add GIN index for larger scale.
- **CompositeDictionaryClient singleton.** Env vars are captured at first call. Static at Next.js startup — no issue in practice.

---

## 13. Test Commands

```bash
# Validate import data compliance
npm run validate:dictionary
# → 74 words, 0 errors, 0 warnings ✓

# Lint
npm run lint
# → No errors ✓

# Build
npm run build
# → Build successful, 46 routes, TypeScript OK ✓

# Regenerate seed SQL (if expanded seed changes)
npx tsx scripts/generate-dictionary-seed-sql.ts
```

---

## 14. Recommended Codex Review Prompt

```
Review Phase 6H-A dictionary expansion for LexiOcean at d:/ai-studio/ocean-english.

Key changes:
1. lib/dictionary/dictionary-import-types.ts — DictionaryImportWord type + source mapping
2. data/dictionary/import/core-words-expanded.ts — 74 original words in import format
3. lib/dictionary/expanded-seed-adapter.ts — DictionaryClient for expanded seed
4. lib/dictionary/supabase-dictionary-client.ts — Supabase-backed client with graceful fallback
5. lib/dictionary/dictionary-client.ts — updated factory chain (Supabase→expanded→core→mock)
6. scripts/validate-dictionary-import.ts — import validation script
7. scripts/generate-dictionary-seed-sql.ts — SQL generator
8. supabase/sql/phase-6h-core-dictionary-seed.sql — generated seed SQL
9. app/api/dictionary/search/route.ts — added difficulty param
10. app/dictionary/page.tsx — API-driven search replacing static mockWords

Focus areas:
- Does SupabaseDictionaryClient fail gracefully on all error paths (unconfigured, table missing, query error)?
- Is the DictionaryWord → Word adapter in page.tsx type-safe and complete?
- Any risk of wordId collision between expanded seed (6H) and Phase 6B core seed?
- Does the validation script catch all compliance issues described in the spec?
- Is the generated SQL idempotent and safe to run multiple times?
- Does the /dictionary page debounce correctly without stale closure bugs?
```
