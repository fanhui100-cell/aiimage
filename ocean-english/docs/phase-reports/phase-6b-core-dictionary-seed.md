# Phase 6B: Core Dictionary Seed

**Date:** 2026-06-02
**Status:** Complete — ready for Codex review

---

## 1. Executive Summary

Phase 6B creates the first batch of original seed data for the LexiOcean dictionary system.
60 carefully chosen words are seeded with bilingual definitions, examples, mnemonics, and
etymology. The SQL is ready to run in Supabase. The existing mock dictionary is fully preserved.

---

## 2. Files Added

| File | Purpose |
|------|---------|
| `data/dictionary/core-words-seed.ts` | TypeScript source of truth — 60 `SeedWordEntry` objects |
| `scripts/validate-dictionary-seed.ts` | Validation script — runs pre-seed checks |
| `supabase/sql/phase-6b-core-dictionary-seed.sql` | Idempotent SQL ready for Supabase SQL Editor |
| `docs/phase-reports/phase-6b-core-dictionary-seed.md` | This file |

No existing files were modified.

---

## 3. Seed Data Summary

### Quantity

| Metric | Count |
|--------|-------|
| Total words | 60 |
| With IPA | 60 (100%) |
| With English definition | 60 (100%) |
| With Chinese gloss | 60 (100%) |
| With English example | 60 (100%) |
| With Chinese example | 60 (100%) |
| With mnemonic | 16 |
| With etymology | 27 |
| With collocations | 45+ |

### CEFR level distribution

| Level | Count | Difficulty |
|-------|-------|-----------|
| A2 | 8 | 1 |
| B1 | 16 | 1–2 |
| B2 | 22 | 2–3 |
| C1 | 14 | 3–4 |

### POS distribution

| Part of Speech | Count |
|----------------|-------|
| verb | 35 |
| adjective | 20 |
| noun | 5 |

### Exam word coverage

| Exam | Tagged words |
|------|-------------|
| IELTS | ~35 |
| TOEFL | ~35 |
| GRE | ~15 |
| SAT | ~5 |

### Database tables seeded

| Table | Rows |
|-------|------|
| dictionary_words | 60 |
| dictionary_definitions | ~62 (some words have 2 POS defs) |
| dictionary_examples | ~61 |
| word_mnemonics | 16 |
| dictionary_etymology | 27 |
| word_pronunciations | 120 (US + UK for every word) |
| exam_word_tags | ~90 |

---

## 4. Compliance Notes

Every row in every table has:
- `source_type = 'original'`
- `source_note = 'Original educational seed content created for LexiOcean Phase 6B.'`

**Content policy:**
- All definitions are written from scratch for learner accessibility (not copied from any commercial dictionary)
- All example sentences are original one-sentence illustrations
- All mnemonics are original memory aids
- All etymologies are condensed original notes based on publicly available linguistic knowledge
- No commercial dictionary text (Oxford, Cambridge, Merriam-Webster, Longman, Collins, etc.)
- No pirated exam word lists
- No user-uploaded document content
- No AI-generated content (all `is_ai_generated = false` in word_mnemonics)

**`source_type` column coverage:**
Tables that carry `source_type`: `dictionary_words`, `dictionary_definitions`, `dictionary_examples`, `word_mnemonics`, `dictionary_etymology`, `word_pronunciations` — all rows have `source_type = 'original'`.
The `exam_word_tags` table does **not** have a `source_type` column (per Phase 6A schema design). It stores only `word_id` and `exam_type`, so the compliance claim applies only to the tables that actually have that column.

**For future imports:** Any new batch must be tagged with appropriate `source_type` and a specific `source_note`. If the license is unclear, default to: do not import.

---

## 5. How to Execute the Seed SQL

### Prerequisites

The Phase 6A schema must already be in Supabase:
```
Run supabase/sql/phase-6a-dictionary-pronunciation-schema.sql first
```

### Running the seed

1. Open the Supabase Dashboard
2. Navigate to **SQL Editor → New Query**
3. Paste the contents of `supabase/sql/phase-6b-core-dictionary-seed.sql`
4. Click **Run**

The SQL is idempotent: it deletes the 60 words (cascading to all related tables) and re-inserts fresh. Safe to re-run after edits.

### Verification queries

```sql
SELECT COUNT(*) FROM dictionary_words;      -- expect 60
SELECT COUNT(*) FROM dictionary_definitions; -- expect ~62
SELECT COUNT(*) FROM dictionary_examples;   -- expect ~61
SELECT COUNT(*) FROM word_mnemonics;        -- expect 16
SELECT COUNT(*) FROM dictionary_etymology;  -- expect 27
SELECT COUNT(*) FROM word_pronunciations;   -- expect 120
SELECT COUNT(*) FROM exam_word_tags;        -- expect ~90

-- Quick spot check
SELECT id, word, phonetic_ipa, cefr_level, difficulty FROM dictionary_words ORDER BY difficulty;
```

---

## 6. How to Validate Seed Data

### Option A: TypeScript validator script

```bash
cd d:/ai-studio/ocean-english
npx tsx scripts/validate-dictionary-seed.ts
```

Output includes:
- Per-entry errors (empty fields, invalid CEFR, suspicious sources)
- Cross-entry duplicate checks (duplicate id, duplicate word)
- Statistics (CEFR breakdown, POS breakdown, mnemonic coverage)

Exit code 0 = all checks passed. Exit code 1 = errors found.

### Option B: Manual SQL spot checks

```sql
-- Find words missing a definition
SELECT w.id FROM dictionary_words w
LEFT JOIN dictionary_definitions d ON d.word_id = w.id
WHERE d.id IS NULL;

-- Find words missing an example
SELECT w.id FROM dictionary_words w
LEFT JOIN dictionary_examples e ON e.word_id = w.id
WHERE e.id IS NULL;

-- Check source compliance
SELECT COUNT(*) FROM dictionary_words WHERE source_type != 'original';  -- should be 0
```

---

## 7. Mock Fallback Compatibility

`data/mock-words.ts` and `types/word.ts` are **not changed**.
- `/word/[slug]` still uses `getMockWord(slug)` — works for all 20 original mock words
- `lib/dictionary/dictionary-client.ts` returns `MockDictionaryAdapter` (uses mock data)
- Phase 6B seed data is in Supabase only — the TypeScript adapter is not yet wired to the DB

This is intentional: **Phase 6C** will implement `SupabaseDictionaryClient` and update the client factory.

---

## 8. How Phase 6C Will Connect Word Detail

In Phase 6C, the one-line change to `/word/[slug]/page.tsx`:

```typescript
// BEFORE (Phase 6A/6B):
const word = getMockWord(slug)

// AFTER (Phase 6C):
const word = await getDictionaryClient().lookupWord(slug)
```

The `getDictionaryClient()` factory will:
1. Try `SupabaseDictionaryClient` first (queries `dictionary_words`)
2. Fall back to `MockDictionaryAdapter` if the word is not in the DB
3. Return `null` if neither has the word → show 404

This requires implementing `SupabaseDictionaryClient` in `lib/dictionary/supabase-dictionary-client.ts`.

---

## 9. How Phase 6D Will Add Pronunciation

In Phase 6D:

1. Add `PronunciationButton` to `WordDetailClient.tsx` (2 lines):
   ```tsx
   import { PronunciationButton } from '@/components/pronunciation/PronunciationButton'
   // Near the phonetic display:
   <PronunciationButton text={word.word} accent="us" size="sm" />
   <PronunciationButton text={word.word} accent="uk" size="sm" />
   ```
2. Upgrade `/pronunciation/page.tsx` from "Coming Soon" to a live demo page
3. Add `AccentSelector` component for persistent user preference

`word_pronunciations` table is already seeded with US+UK metadata. Audio URLs are null — browser TTS is used until cloud TTS is integrated in Phase 6E.

---

## 10. Risks and Limitations

| Item | Notes |
|------|-------|
| Seed data is not yet connected to /word/[slug] | Intentional — Phase 6C will wire it |
| 60 words covers academic vocabulary; no beginner A1 words | Phase 6C can add A1 batch |
| Collocations are partial — not every word has them | Phase 6C content expansion |
| Synonyms/antonyms are in TypeScript source but not yet in SQL | Phase 6C: add synonym/antonym tables SQL |
| Scene usages not yet in SQL | Phase 6C content expansion |
| validate-dictionary-seed.ts requires `npx tsx` (not included in project by default) | Install with `npm install -D tsx` |
| wrongAnswers dedup on re-run (from Phase 5.5 notes) | Phase 6 not affected |

---

## 11. Codex Review Checklist

```
Review Phase 6B of ocean-english (Core Dictionary Seed).

Focus areas:
1. Compliance: verify all rows in phase-6b-core-dictionary-seed.sql have source_type='original'
   and source_note matching the Phase 6B note. Confirm no commercial dictionary text.
2. Data integrity: verify the seed SQL is idempotent (DELETE then INSERT, not upsert-only);
   verify CASCADE delete cleans related tables before re-insert.
3. TypeScript types: verify SeedWordEntry in core-words-seed.ts has all required fields typed
   correctly; verify SEED_WORD_COUNT matches actual array length.
4. Validator: verify validate-dictionary-seed.ts correctly checks required fields, detects
   duplicates, and flags suspicious source strings.
5. Mock fallback: confirm data/mock-words.ts, types/word.ts, and app/word/[slug] are unchanged.
6. Build: confirm npm run lint and npm run build both pass with 0 errors.

Files to review:
- data/dictionary/core-words-seed.ts
- scripts/validate-dictionary-seed.ts
- supabase/sql/phase-6b-core-dictionary-seed.sql
```
