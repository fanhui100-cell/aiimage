# Phase 6A: Dictionary + Pronunciation Architecture

**Date:** 2026-06-02
**Status:** Architecture complete — ready for Phase 6B seed + Phase 6D pronunciation wiring

---

## 1. Current Dictionary State (Pre-Phase 6A)

| Item | Status | Location |
|------|--------|----------|
| Mock word data | 20 curated words | `data/mock-words.ts` |
| Word type | Fully typed | `types/word.ts` |
| /word/[slug] | Reads from getMockWord() | `app/word/[slug]/page.tsx` |
| /dictionary | Searches mockWords | `app/dictionary/page.tsx` |
| /pronunciation | "Coming Soon" placeholder | `app/pronunciation/page.tsx` |
| speechSynthesis | None | — |
| US/UK accent | None | — |
| Dictionary DB table | None | Phase 6B |
| word_pronunciations | None | Phase 6B |
| lib/dictionary/ | None | Phase 6A added |
| lib/pronunciation/ | None | Phase 6A added |

---

## 2. Phase 6A New Files

```
supabase/sql/
  phase-6a-dictionary-pronunciation-schema.sql   ← Full DB schema (13 tables)

lib/dictionary/
  dictionary-types.ts          ← DictionaryWord, DictionaryClient interface
  mock-dictionary-adapter.ts   ← MockDictionaryClient wrapping mock-words.ts
  dictionary-client.ts         ← getDictionaryClient() factory

lib/pronunciation/
  pronunciation-types.ts       ← Accent, PronunciationState, Provider interface
  speech-synthesis-provider.ts ← Browser SpeechSynthesis implementation
  pronunciation-client.ts      ← usePronunciation() React hook + accent prefs

components/pronunciation/
  PronunciationButton.tsx      ← Drop-in UI button (idle/speaking/error states)

docs/phase-reports/
  phase-6a-dictionary-pronunciation-architecture.md   ← This file
```

No existing files were modified in Phase 6A.

---

## 3. Database Schema (13 Tables)

All tables are in `supabase/sql/phase-6a-dictionary-pronunciation-schema.sql`.
**Must be run in Supabase SQL Editor after phase-5c and phase-5d SQL.**

### Public read tables (no auth required, admin-only write)

| Table | Purpose |
|-------|---------|
| `dictionary_words` | Canonical word records — the source of truth for all word data |
| `dictionary_definitions` | Per-word definitions with POS and bilingual gloss |
| `dictionary_examples` | Example sentences (separate from definitions) |
| `dictionary_etymology` | Etymology / word roots |
| `word_mnemonics` | Memory tricks (standard + evil variants, AI-generated flag) |
| `dictionary_collocations` | Common phrase patterns |
| `dictionary_synonyms` | Synonym list per word |
| `dictionary_antonyms` | Antonym list per word |
| `dictionary_scene_usages` | Contextual usage scenarios |
| `word_pronunciations` | Audio metadata and IPA per accent |
| `exam_word_tags` | TOEFL / IELTS / CET-4 / CET-6 / KAOYAN / GAOKAO exam tagging |
| `word_frequency` | Corpus frequency rank (for future sorting) |

### Per-user private tables (RLS: auth.uid() = user_id)

| Table | Purpose |
|-------|---------|
| `user_word_notes` | Personal notes, custom meanings, private memory tricks |

### Phase 7 reserved (commented out in SQL)

| Table | Purpose |
|-------|---------|
| `lexiverse_word_nodes` | 3D galaxy node positions for LexiVerse |

### Key schema decisions

1. `dictionary_words.id` is a TEXT slug (e.g., `'ubiquitous'`) — intentionally matches
   `saved_words.word_id` and `review_words.word_id`. In Phase 6B+, these can become
   optional foreign keys without a migration.
2. All public tables use RLS `FOR SELECT USING (true)` — anon users can read.
3. No INSERT/UPDATE policy on public tables = only service_role (admin) can seed data.
4. Every content row has `source_type` and `source_note` for compliance tracking.

---

## 4. Data Source Compliance Strategy

### What is allowed

| Source | Allowed | Conditions |
|--------|---------|------------|
| Original LexiOcean-authored content | ✅ | First choice for all definitions, examples |
| AI-generated content (Claude, GPT) | ✅ | Must tag `source_type = 'ai-generated'`; must flag `word_mnemonics.is_ai_generated = true`; subject to human review (`is_reviewed = false` until verified) |
| Public domain etymologies | ✅ | Tag as `'public-domain'`, include `source_note` with origin |
| CC0 / CC-BY licensed content | ✅ | After license verification; tag as `'licensed'` with `source_note` |
| LexiOcean's own mock-words.ts | ✅ | Existing Phase 6A seed for ~20 words |

### What is NOT allowed

| Source | Prohibited | Reason |
|--------|-----------|--------|
| Cambridge / Oxford full definitions | ❌ | Commercial copyright |
| Merriam-Webster definitions | ❌ | Commercial copyright |
| Scraped exam word lists (TOEFL official, etc.) | ❌ | Copyright + ToS violation |
| User-uploaded document content | ❌ | Privacy; stays in scan_documents.vocabulary_json |
| Scraped from commercial vocabulary apps | ❌ | Copyright |
| Bulk Wikipedia dumps without attribution | ❌ | Requires CC-BY attribution tracking |

### AI-generated content policy

- All AI-generated definitions, examples, mnemonics must have `source_type = 'ai-generated'`
- `word_mnemonics.is_reviewed = false` until human-reviewed
- AI content is acceptable for MVP but should be progressively replaced with original content
- AI content must not be presented as dictionary authority (label as "learning aid")

### Gray areas (default: do NOT import)

- CEFR level assignments — use original classification
- Corpus frequency ranks — only use public corpus data (COCA open data, BNC public)
- Exam word tagging — use our own curated list; do not import pirated exam vocabulary books

---

## 5. Pronunciation Architecture

### Provider hierarchy

```
PronunciationProvider (interface)
  └── SpeechSynthesisProvider (browser TTS) ← Phase 6D MVP
  └── PollyProvider (AWS)                   ← Phase 6E future
  └── GoogleTtsProvider (Google Cloud)      ← Phase 6E future
```

### Phase 6D MVP: Browser SpeechSynthesis

**File:** `lib/pronunciation/speech-synthesis-provider.ts`

Key design:
1. `getSpeechSynthesisProvider()` returns a singleton provider
2. `speak(text, { accent })` → selects best available English voice for accent, then speaks
3. Voice selection priority: exact locale → prefix match → any English → browser default
4. Handles Chrome's async voice loading (`voiceschanged` event + 3s timeout fallback)
5. iOS Safari stall workaround (`speechSynthesis.resume()` after 50ms)
6. Returns a Promise that resolves on `utterance.onend`

**Accent → locale mapping:**

| Accent | BCP-47 locale |
|--------|--------------|
| `us` | `en-US` |
| `uk` | `en-GB` |
| `au` | `en-AU` |
| `auto` | browser default |

### React hook: `usePronunciation()`

**File:** `lib/pronunciation/pronunciation-client.ts`

```typescript
const { speak, stop, state, isSupported } = usePronunciation()
// state: 'idle' | 'loading' | 'speaking' | 'error' | 'unsupported'
speak('ubiquitous', { accent: 'us', rate: 0.9 })
```

### PronunciationButton component

**File:** `components/pronunciation/PronunciationButton.tsx`

- Self-contained, no external dependencies beyond the pronunciation hook
- Shows ▶ idle / ■ speaking / … loading / ✕ error states
- size='sm' (icon only) or size='md' (icon + accent label)
- Returns null when browser TTS is not supported
- Can be dropped into WordDetailClient, /pronunciation page, quiz question view

### How to wire PronunciationButton into /word/[slug] (Phase 6D task)

In `app/word/[slug]/WordDetailClient.tsx`, near the phonetic display (line ~117):
```tsx
import { PronunciationButton } from '@/components/pronunciation/PronunciationButton'
// ...
<span>{word.phonetic}</span>
<PronunciationButton text={word.word} accent="us" size="sm" />
<PronunciationButton text={word.word} accent="uk" size="sm" />
```

No changes to page.tsx needed.

---

## 6. Dictionary Client Architecture

### Transition path: mock → database

```
Phase 6A (now):
  getDictionaryClient() → MockDictionaryAdapter → mock-words.ts (20 words)

Phase 6B:
  getDictionaryClient() → SupabaseDictionaryClient (if seeded) || MockDictionaryAdapter
  /word/[slug] tries DB first, falls back to mock if not found

Phase 6C:
  Full search API, pagination, exam filtering
  /api/dictionary/search/route.ts + /api/dictionary/word/[slug]/route.ts
```

### DictionaryClient interface

```typescript
interface DictionaryClient {
  lookupWord(slug: string): Promise<DictionaryWord | null>
  searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]>
  getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]>
  getCoreWords(limit?: number): Promise<DictionaryWord[]>
  readonly isLive: boolean
}
```

### DictionaryWord vs mock Word

`types/word.ts` (mock Word) is **not changed**. It continues to serve the existing
`/word/[slug]` page and quiz system.

`lib/dictionary/dictionary-types.ts` (DictionaryWord) is the Phase 6 canonical type.
`MockDictionaryAdapter` converts `Word → DictionaryWord` so callers program against
one interface regardless of backing source.

In Phase 6B, `/word/[slug]/page.tsx` can be updated to call `getDictionaryClient().lookupWord(slug)`
instead of `getMockWord(slug)` — a one-line change.

### savedWords / reviewWords compatibility

`saved_words.word_id` and `review_words.word_id` are both TEXT columns matching
`dictionary_words.id` (also TEXT slug). No schema migration needed in Phase 6B.
Phase 6C can add an optional FK constraint.

---

## 7. Phase 6B Implementation Plan (Core Dictionary Seed)

**Goal:** Seed the 20 existing mock words into `dictionary_words` and related tables.

Tasks:
1. [ ] Run phase-6a SQL in Supabase
2. [ ] Create `scripts/seed-mock-words.ts` — reads mock-words.ts, inserts via service_role
3. [ ] Implement `SupabaseDictionaryClient` in `lib/dictionary/supabase-dictionary-client.ts`
4. [ ] Update `getDictionaryClient()` to return Supabase client when configured + seeded
5. [ ] Update `/word/[slug]/page.tsx` to use `getDictionaryClient()` (1-line change)
6. [ ] Verify /word/[slug] still works with mock fallback if DB is empty
7. [ ] Run lint + tsc + build

**Seed approach:** Service-role API route or admin script — NOT user-facing migration.

---

## 8. Phase 6C Implementation Plan (Search + Dictionary API)

**Goal:** Real dictionary search via Supabase full-text search.

Tasks:
1. [ ] Create `app/api/dictionary/search/route.ts`
2. [ ] Create `app/api/dictionary/word/[slug]/route.ts`
3. [ ] Add `tsvector` full-text search index to `dictionary_words`
4. [ ] Update `/dictionary/page.tsx` to call `/api/dictionary/search`
5. [ ] Add pagination to dictionary page
6. [ ] Optionally: add exam-tag filter to dictionary page

---

## 9. Phase 6D Implementation Plan (Pronunciation MVP)

**Goal:** Working pronunciation in /word/[slug] and /pronunciation page.

Tasks:
1. [ ] Wire `PronunciationButton` into `WordDetailClient` (1 import + 2 JSX lines)
2. [ ] Add `AccentSelector` component (US / UK toggle saved to localStorage)
3. [ ] Wire pronunciation into example sentences in WordDetailClient
4. [ ] Update `/pronunciation/page.tsx` from "Coming Soon" to live demo page
5. [ ] Add pronunciation to quiz question display (optional)
6. [ ] Test on Safari/iOS (speechSynthesis quirks handled in provider)

---

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Browser TTS quality varies across OS | Medium | Fallback to any English voice; document limitation |
| Safari iOS speechSynthesis requires user gesture | Medium | Only trigger from button click (already the design) |
| Chrome loads voices asynchronously | Medium | Handled in speech-synthesis-provider.ts with voiceschanged event |
| DB empty in Phase 6B breaks /word | Low | MockDictionaryAdapter fallback always present |
| AI-generated content quality | Medium | is_reviewed = false flag; human review queue in Phase 6C |
| Copyright in etymology content | High | Only use original or clearly public-domain content; each row has source_note |
| scan-extracted words polluting dictionary | Low | Architecture explicitly separates scan vocabulary from dictionary_words |

---

## 11. Codex Review Checklist

```
Review Phase 6A of ocean-english (Dictionary + Pronunciation Architecture).

Focus:
1. Schema: verify phase-6a-dictionary-pronunciation-schema.sql has correct RLS —
   dictionary_words should be public read (USING true) with NO user INSERT/UPDATE policy.
   user_word_notes should have RLS auth.uid() = user_id.
2. Mock adapter: verify mock-dictionary-adapter.ts imports from @/data/mock-words and
   @/types/word correctly; check that mockWordToDictionaryWord handles null/undefined fields safely.
3. Speech synthesis: verify speech-synthesis-provider.ts handles voiceschanged async loading,
   iOS Safari resume() workaround, and that speak() returns a proper Promise.
4. PronunciationButton: verify it returns null when isSupported is false (no broken UI on
   unsupported browsers); check aria attributes.
5. No regressions: verify mock-words.ts, types/word.ts, app/word/[slug], app/quiz,
   app/dictionary, app/scan are all unchanged.
6. Build: confirm npm run lint and npm run build both pass.

Files to review:
- supabase/sql/phase-6a-dictionary-pronunciation-schema.sql
- lib/dictionary/dictionary-types.ts
- lib/dictionary/mock-dictionary-adapter.ts
- lib/dictionary/dictionary-client.ts
- lib/pronunciation/pronunciation-types.ts
- lib/pronunciation/speech-synthesis-provider.ts
- lib/pronunciation/pronunciation-client.ts
- components/pronunciation/PronunciationButton.tsx
```
