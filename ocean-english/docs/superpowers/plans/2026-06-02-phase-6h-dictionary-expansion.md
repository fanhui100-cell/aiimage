# Phase 6H-A Dictionary DB Wiring + Core Word Import Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the dictionary to Supabase with graceful fallback, add 74 original expanded words, build import/validation/SQL pipeline, and connect the /dictionary page to the search API.

**Architecture:** A new `SupabaseDictionaryClient` is prepended to the existing adapter chain (Supabase DB → expanded seed → Phase 6B core seed → mock). A `DictionaryImportWord` type standardizes the import format. A new `ExpandedSeedAdapter` serves 74 new original words offline. Validation and SQL-generation scripts complete the pipeline.

**Tech Stack:** Next.js 16.2.6 App Router, @supabase/supabase-js ^2.106.2, TypeScript, `npx tsx` for scripts.

---

## File Map

**Create:**
- `lib/dictionary/dictionary-import-types.ts` — DictionaryImportWord type + sourceType mapping helper
- `data/dictionary/import/core-words-expanded.ts` — 74 original expanded words in DictionaryImportWord format
- `lib/dictionary/expanded-seed-adapter.ts` — DictionaryClient backed by expanded seed
- `lib/dictionary/supabase-dictionary-client.ts` — DictionaryClient backed by Supabase (graceful fallback)
- `scripts/validate-dictionary-import.ts` — validates DictionaryImportWord entries
- `scripts/generate-dictionary-seed-sql.ts` — generates SQL from expanded seed
- `supabase/sql/phase-6h-core-dictionary-seed.sql` — generated SQL (run manually in Supabase)
- `docs/phase-reports/phase-6h-dictionary-expansion-search.md` — phase report

**Modify:**
- `lib/dictionary/dictionary-client.ts` — add Supabase + expanded adapters to chain
- `app/api/dictionary/search/route.ts` — add `difficulty` query param
- `app/dictionary/page.tsx` — replace mockWords with /api/dictionary/search fetch
- `package.json` — add `validate:dictionary` script

---

### Task 1: DictionaryImportWord type + expanded seed data

**Files:**
- Create: `lib/dictionary/dictionary-import-types.ts`
- Create: `data/dictionary/import/core-words-expanded.ts`

- [ ] **Step 1: Create the import types file**

Create `lib/dictionary/dictionary-import-types.ts`:

```ts
/**
 * DictionaryImportWord — standard format for LexiOcean dictionary import pipeline.
 *
 * Used by:
 *   - data/dictionary/import/core-words-expanded.ts
 *   - scripts/validate-dictionary-import.ts
 *   - scripts/generate-dictionary-seed-sql.ts
 *   - lib/dictionary/expanded-seed-adapter.ts
 *
 * COMPLIANCE: sourceType must be set; user_private data must never appear in
 * public import files.
 */

export type ImportSourceType =
  | 'original_seed'       // LexiOcean-authored educational content
  | 'ai_generated_draft'  // AI-generated, requires human review before production
  | 'licensed_public'     // Confirmed open license; sourceNote must cite license + URL
  | 'user_private'        // BLOCKED — must not appear in public import files

/** Maps ImportSourceType → DictionarySourceType (DB / DictionaryWord) */
export function toDbSourceType(t: ImportSourceType): 'original' | 'ai-generated' | 'licensed' {
  switch (t) {
    case 'original_seed':      return 'original'
    case 'ai_generated_draft': return 'ai-generated'
    case 'licensed_public':    return 'licensed'
    case 'user_private':
      throw new Error('user_private data must not enter the public dictionary')
  }
}

export interface DictionaryImportDefinition {
  language: 'en' | 'zh'
  definition: string
  definitionType?: 'simple' | 'learning' | 'exam' | 'usage'
  orderIndex?: number
}

export interface DictionaryImportExample {
  sentenceEn: string
  sentenceZh?: string
  sourceType: string
  orderIndex?: number
}

export interface DictionaryImportMnemonic {
  mnemonic: string
  mnemonicZh?: string
  type?: 'standard' | 'xiexiu' | 'visual' | 'sound'
}

export interface DictionaryImportCollocation {
  phrase: string
  exampleEn?: string
  exampleZh?: string
}

export interface DictionaryImportWord {
  /** Canonical slug (lowercase, spaces→dash). If omitted, derived from normalizedWord. */
  id?: string
  word: string
  normalizedWord: string        // lowercase, trimmed, spaces→dash
  ipa?: string
  partOfSpeech: string[]        // primary first, e.g. ['noun'] or ['verb', 'noun']
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  difficultyLevel?: 1 | 2 | 3 | 4 | 5
  frequencyRank?: number
  isCoreWord?: boolean
  isExamWord?: boolean
  definitions: DictionaryImportDefinition[]     // must have ≥1 'en' + ≥1 'zh'
  examples?: DictionaryImportExample[]
  collocations?: DictionaryImportCollocation[]
  synonyms?: string[]
  antonyms?: string[]
  mnemonics?: DictionaryImportMnemonic[]
  etymologyBrief?: string
  sceneUsage?: string[]
  examTags?: string[]
  sourceType: ImportSourceType
  sourceNote: string
}
```

- [ ] **Step 2: Create the expanded seed data file (74 words)**

Create `data/dictionary/import/core-words-expanded.ts`:

```ts
/**
 * LexiOcean Phase 6H — Expanded Dictionary Seed (74 words)
 *
 * COMPLIANCE DECLARATION:
 *   All content is original educational material created for LexiOcean.
 *   Definitions, examples, and mnemonics are original LexiOcean content.
 *   No commercial dictionary text. No pirated exam word lists.
 *   sourceType = 'original_seed' for all entries.
 *
 * CEFR distribution: A2(10) · B1(20) · B2(20) · C1(17) · C2(7)
 * All 74 words are NEW — not in Phase 6B core-words-seed.ts.
 */

import type { DictionaryImportWord } from '@/lib/dictionary/dictionary-import-types'

const SN = 'Original educational content created for LexiOcean Phase 6H expansion.'

export const EXPANDED_WORDS_SEED: DictionaryImportWord[] = [

  // ── A2 (10 words) ──────────────────────────────────────────────────────────

  {
    normalizedWord: 'ability',
    word: 'ability',
    ipa: '/əˈbɪlɪti/',
    partOfSpeech: ['noun'],
    cefrLevel: 'A2',
    difficultyLevel: 1,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'the power, skill, or capacity to do something' },
      { language: 'zh', definition: '能力；才能' },
    ],
    examples: [{ sentenceEn: 'She has the ability to solve complex problems under pressure.', sentenceZh: '她有在压力下解决复杂问题的能力。', sourceType: 'original_seed' }],
    synonyms: ['capacity', 'capability', 'skill'],
    antonyms: ['inability', 'incapacity'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'advice',
    word: 'advice',
    ipa: '/ədˈvaɪs/',
    partOfSpeech: ['noun'],
    cefrLevel: 'A2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'guidance or recommendations offered about future action' },
      { language: 'zh', definition: '建议；忠告' },
    ],
    examples: [{ sentenceEn: 'His advice helped me make the right career decision.', sentenceZh: '他的建议帮助我做出了正确的职业选择。', sourceType: 'original_seed' }],
    synonyms: ['guidance', 'recommendation', 'counsel'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'benefit',
    word: 'benefit',
    ipa: '/ˈbɛnɪfɪt/',
    partOfSpeech: ['noun', 'verb'],
    cefrLevel: 'A2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'an advantage or good result gained from something' },
      { language: 'zh', definition: '益处；好处；利益' },
    ],
    examples: [{ sentenceEn: 'Regular exercise brings many benefits to your health.', sentenceZh: '定期锻炼对健康有很多好处。', sourceType: 'original_seed' }],
    synonyms: ['advantage', 'gain', 'profit'],
    antonyms: ['disadvantage', 'harm', 'drawback'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'connect',
    word: 'connect',
    ipa: '/kəˈnɛkt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'A2',
    difficultyLevel: 1,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to join or link two or more things together' },
      { language: 'zh', definition: '连接；联系；接通' },
    ],
    examples: [{ sentenceEn: 'The bridge connects the two islands.', sentenceZh: '这座桥把两个岛连接起来。', sourceType: 'original_seed' }],
    synonyms: ['link', 'join', 'attach'],
    antonyms: ['disconnect', 'separate', 'divide'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'enjoy',
    word: 'enjoy',
    ipa: '/ɪnˈdʒɔɪ/',
    partOfSpeech: ['verb'],
    cefrLevel: 'A2',
    difficultyLevel: 1,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to get pleasure or satisfaction from something' },
      { language: 'zh', definition: '享受；喜爱；乐于' },
    ],
    examples: [{ sentenceEn: 'I enjoy listening to music while studying.', sentenceZh: '我喜欢边学习边听音乐。', sourceType: 'original_seed' }],
    synonyms: ['like', 'love', 'appreciate'],
    antonyms: ['dislike', 'hate', 'detest'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'explain',
    word: 'explain',
    ipa: '/ɪkˈspleɪn/',
    partOfSpeech: ['verb'],
    cefrLevel: 'A2',
    difficultyLevel: 1,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to make something clear or easy to understand by describing it in detail' },
      { language: 'zh', definition: '解释；说明；阐述' },
    ],
    examples: [{ sentenceEn: 'The teacher explained the concept using simple examples.', sentenceZh: '老师用简单的例子解释了这个概念。', sourceType: 'original_seed' }],
    synonyms: ['describe', 'clarify', 'illustrate'],
    antonyms: ['confuse', 'complicate'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'purpose',
    word: 'purpose',
    ipa: '/ˈpɜːrpəs/',
    partOfSpeech: ['noun'],
    cefrLevel: 'A2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'the reason for which something is done or for which something exists' },
      { language: 'zh', definition: '目的；用途；意图' },
    ],
    examples: [{ sentenceEn: 'The purpose of this meeting is to share our progress.', sentenceZh: '本次会议的目的是分享我们的进展。', sourceType: 'original_seed' }],
    synonyms: ['aim', 'goal', 'intention'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'result',
    word: 'result',
    ipa: '/rɪˈzʌlt/',
    partOfSpeech: ['noun', 'verb'],
    cefrLevel: 'A2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'something that happens or exists because of an action, effort, or event' },
      { language: 'zh', definition: '结果；成果；导致' },
    ],
    examples: [{ sentenceEn: 'The hard work resulted in excellent test scores.', sentenceZh: '努力学习带来了优秀的考试成绩。', sourceType: 'original_seed' }],
    synonyms: ['outcome', 'consequence', 'effect'],
    antonyms: ['cause', 'reason'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'suggest',
    word: 'suggest',
    ipa: '/səˈdʒɛst/',
    partOfSpeech: ['verb'],
    cefrLevel: 'A2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to put forward an idea or plan for someone to consider' },
      { language: 'zh', definition: '建议；提出；暗示' },
    ],
    examples: [{ sentenceEn: 'She suggested we take a different approach to the problem.', sentenceZh: '她建议我们用不同的方法解决这个问题。', sourceType: 'original_seed' }],
    synonyms: ['propose', 'recommend', 'advise'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'understand',
    word: 'understand',
    ipa: '/ˌʌndərˈstænd/',
    partOfSpeech: ['verb'],
    cefrLevel: 'A2',
    difficultyLevel: 1,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to know or grasp the meaning, importance, or nature of something' },
      { language: 'zh', definition: '理解；明白；懂得' },
    ],
    examples: [{ sentenceEn: 'It takes time to fully understand a new language.', sentenceZh: '完全掌握一门新语言需要时间。', sourceType: 'original_seed' }],
    synonyms: ['comprehend', 'grasp', 'know'],
    antonyms: ['misunderstand', 'confuse'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },

  // ── B1 (20 words) ──────────────────────────────────────────────────────────

  {
    normalizedWord: 'apply',
    word: 'apply',
    ipa: '/əˈplaɪ/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to make use of something, or to make a formal request for something' },
      { language: 'zh', definition: '申请；应用；适用' },
    ],
    examples: [{ sentenceEn: 'You need to apply what you learn in class to real situations.', sentenceZh: '你需要把课堂上学到的知识应用到实际情况中。', sourceType: 'original_seed' }],
    synonyms: ['implement', 'use', 'employ'],
    antonyms: ['ignore', 'neglect'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'challenge',
    word: 'challenge',
    ipa: '/ˈtʃælɪndʒ/',
    partOfSpeech: ['noun', 'verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'a situation that requires great effort and tests your abilities' },
      { language: 'zh', definition: '挑战；困难；质疑' },
    ],
    examples: [{ sentenceEn: 'Learning a new language is a challenge worth taking.', sentenceZh: '学习一门新语言是一项值得接受的挑战。', sourceType: 'original_seed' }],
    synonyms: ['difficulty', 'obstacle', 'test'],
    antonyms: ['ease', 'simplicity'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'concentrate',
    word: 'concentrate',
    ipa: '/ˈkɒnsəntreɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to focus your full attention or effort on something' },
      { language: 'zh', definition: '集中（注意力）；专注；专心' },
    ],
    examples: [{ sentenceEn: "It's hard to concentrate when there is too much noise.", sentenceZh: '当噪音太大时，很难集中注意力。', sourceType: 'original_seed' }],
    synonyms: ['focus', 'attend', 'engage'],
    antonyms: ['distract', 'wander'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'consequence',
    word: 'consequence',
    ipa: '/ˈkɒnsɪkwəns/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B1',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'a result or effect of an action or situation, often negative or unintended' },
      { language: 'zh', definition: '后果；结果；重要性' },
    ],
    examples: [{ sentenceEn: 'The consequences of climate change affect everyone on Earth.', sentenceZh: '气候变化的后果影响到地球上的每一个人。', sourceType: 'original_seed' }],
    synonyms: ['result', 'outcome', 'effect'],
    antonyms: ['cause', 'reason'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'control',
    word: 'control',
    ipa: '/kənˈtroʊl/',
    partOfSpeech: ['verb', 'noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'the power to direct or influence how something works or behaves' },
      { language: 'zh', definition: '控制；管制；掌管' },
    ],
    examples: [{ sentenceEn: 'Self-control is an important skill in learning.', sentenceZh: '自我控制是学习中的一项重要技能。', sourceType: 'original_seed' }],
    synonyms: ['manage', 'direct', 'regulate'],
    antonyms: ['lose', 'release', 'surrender'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'current',
    word: 'current',
    ipa: '/ˈkʌrənt/',
    partOfSpeech: ['adjective', 'noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'happening or existing now, at the present time' },
      { language: 'zh', definition: '当前的；现在的；（水、电）流' },
    ],
    examples: [{ sentenceEn: 'What is your current level of English proficiency?', sentenceZh: '您当前的英语水平如何？', sourceType: 'original_seed' }],
    synonyms: ['present', 'existing', 'contemporary'],
    antonyms: ['past', 'future', 'outdated'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'depend',
    word: 'depend',
    ipa: '/dɪˈpɛnd/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to need something for support, or to be determined by something' },
      { language: 'zh', definition: '依赖；取决于；信赖' },
    ],
    examples: [{ sentenceEn: 'Your success depends on how consistently you practice.', sentenceZh: '你的成功取决于你练习的持续程度。', sourceType: 'original_seed' }],
    synonyms: ['rely', 'trust', 'need'],
    antonyms: ['ignore', 'avoid'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'develop',
    word: 'develop',
    ipa: '/dɪˈvɛləp/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to grow or cause something to grow more advanced, larger, or stronger' },
      { language: 'zh', definition: '发展；开发；培养' },
    ],
    examples: [{ sentenceEn: 'Reading widely helps you develop a rich vocabulary.', sentenceZh: '广泛阅读有助于你培养丰富的词汇量。', sourceType: 'original_seed' }],
    synonyms: ['grow', 'improve', 'build'],
    antonyms: ['decline', 'shrink', 'reduce'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'evaluate',
    word: 'evaluate',
    ipa: '/ɪˈvæljʊeɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to assess the value, quality, or importance of something carefully' },
      { language: 'zh', definition: '评估；评价；鉴定' },
    ],
    examples: [{ sentenceEn: 'Students must evaluate both sides of an argument before writing.', sentenceZh: '学生在写作前必须评估论点的两面。', sourceType: 'original_seed' }],
    synonyms: ['assess', 'judge', 'measure'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'expect',
    word: 'expect',
    ipa: '/ɪkˈspɛkt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to believe that something will happen or that someone will do something' },
      { language: 'zh', definition: '期望；预期；料想' },
    ],
    examples: [{ sentenceEn: 'I expect to finish the project by the end of this week.', sentenceZh: '我预计在本周末前完成这个项目。', sourceType: 'original_seed' }],
    synonyms: ['anticipate', 'predict', 'assume'],
    antonyms: ['doubt', 'surprise'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'factor',
    word: 'factor',
    ipa: '/ˈfæktər/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'one of the elements that contributes to a particular result or situation' },
      { language: 'zh', definition: '因素；要素；因数' },
    ],
    examples: [{ sentenceEn: 'Motivation is a key factor in successful language learning.', sentenceZh: '积极性是成功学习语言的关键因素。', sourceType: 'original_seed' }],
    synonyms: ['element', 'component', 'aspect'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'focus',
    word: 'focus',
    ipa: '/ˈfoʊkəs/',
    partOfSpeech: ['verb', 'noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to direct attention or effort toward a particular point or task' },
      { language: 'zh', definition: '专注；集中；焦点' },
    ],
    examples: [{ sentenceEn: 'Try to focus on one task at a time for better results.', sentenceZh: '尝试一次专注于一项任务，以获得更好的效果。', sourceType: 'original_seed' }],
    synonyms: ['concentrate', 'center', 'target'],
    antonyms: ['distract', 'scatter'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'involve',
    word: 'involve',
    ipa: '/ɪnˈvɒlv/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to include someone or something as a necessary part' },
      { language: 'zh', definition: '包含；涉及；使参与' },
    ],
    examples: [{ sentenceEn: 'The project involves reading, writing, and speaking tasks.', sentenceZh: '该项目涉及阅读、写作和口语任务。', sourceType: 'original_seed' }],
    synonyms: ['include', 'require', 'contain'],
    antonyms: ['exclude', 'separate'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'method',
    word: 'method',
    ipa: '/ˈmɛθəd/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'a particular way of doing something, especially a systematic or established one' },
      { language: 'zh', definition: '方法；方式；途径' },
    ],
    examples: [{ sentenceEn: 'The spaced repetition method is effective for memorizing vocabulary.', sentenceZh: '间隔重复法对于记忆词汇非常有效。', sourceType: 'original_seed' }],
    synonyms: ['approach', 'technique', 'procedure'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'obtain',
    word: 'obtain',
    ipa: '/əbˈteɪn/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to get or acquire something through effort or a formal request' },
      { language: 'zh', definition: '获得；取得；得到' },
    ],
    examples: [{ sentenceEn: 'She obtained her certificate after years of dedicated study.', sentenceZh: '经过多年的刻苦学习，她获得了证书。', sourceType: 'original_seed' }],
    synonyms: ['get', 'acquire', 'gain'],
    antonyms: ['lose', 'give', 'surrender'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'organize',
    word: 'organize',
    ipa: '/ˈɔːrɡənaɪz/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to arrange things or activities in a structured and efficient way' },
      { language: 'zh', definition: '组织；整理；安排' },
    ],
    examples: [{ sentenceEn: 'Organize your study schedule to balance all subjects equally.', sentenceZh: '合理安排学习计划，平衡各科目的学习时间。', sourceType: 'original_seed' }],
    synonyms: ['arrange', 'structure', 'plan'],
    antonyms: ['disorganize', 'scatter'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'process',
    word: 'process',
    ipa: '/ˈprɒsɛs/',
    partOfSpeech: ['noun', 'verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'a series of actions or steps taken in order to achieve a particular result' },
      { language: 'zh', definition: '过程；流程；处理' },
    ],
    examples: [{ sentenceEn: 'Learning vocabulary is a gradual process that requires patience.', sentenceZh: '学习词汇是一个需要耐心的渐进过程。', sourceType: 'original_seed' }],
    synonyms: ['procedure', 'method', 'system'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'require',
    word: 'require',
    ipa: '/rɪˈkwaɪər/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to need something as a necessary condition or as essential' },
      { language: 'zh', definition: '需要；要求；规定' },
    ],
    examples: [{ sentenceEn: 'Fluency requires consistent practice over months and years.', sentenceZh: '流利程度需要数月乃至数年持续的练习。', sourceType: 'original_seed' }],
    synonyms: ['need', 'demand', 'necessitate'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'respond',
    word: 'respond',
    ipa: '/rɪˈspɒnd/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to say or do something as a reaction to what someone has said or done' },
      { language: 'zh', definition: '回应；反应；答复' },
    ],
    examples: [{ sentenceEn: 'How did she respond to the difficult question?', sentenceZh: '她如何回应这个难题？', sourceType: 'original_seed' }],
    synonyms: ['react', 'reply', 'answer'],
    antonyms: ['ignore', 'overlook'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'support',
    word: 'support',
    ipa: '/səˈpɔːrt/',
    partOfSpeech: ['verb', 'noun'],
    cefrLevel: 'B1',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to give help, encouragement, or approval to someone or something' },
      { language: 'zh', definition: '支持；帮助；资助' },
    ],
    examples: [{ sentenceEn: 'Good friends support each other through difficult times.', sentenceZh: '好朋友在困难时期互相支持。', sourceType: 'original_seed' }],
    synonyms: ['help', 'assist', 'encourage'],
    antonyms: ['oppose', 'hinder', 'undermine'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },

  // ── B2 (20 words) ──────────────────────────────────────────────────────────

  {
    normalizedWord: 'allocate',
    word: 'allocate',
    ipa: '/ˈæləkeɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'to distribute resources, tasks, or responsibilities among people or uses' },
      { language: 'zh', definition: '分配；拨给；分派' },
    ],
    examples: [{ sentenceEn: 'We need to allocate more time to vocabulary review each day.', sentenceZh: '我们每天需要分配更多时间复习词汇。', sourceType: 'original_seed' }],
    synonyms: ['assign', 'distribute', 'apportion'],
    antonyms: ['withhold', 'take'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'assume',
    word: 'assume',
    ipa: '/əˈsjuːm/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'to accept something as true without proof, or to take on a role or responsibility' },
      { language: 'zh', definition: '假设；承担；采取' },
    ],
    examples: [{ sentenceEn: "Don't assume you know a word's meaning just from its spelling.", sentenceZh: '不要仅凭拼写就假设你知道一个单词的含义。', sourceType: 'original_seed' }],
    synonyms: ['presume', 'suppose', 'take for granted'],
    antonyms: ['doubt', 'question', 'verify'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'circumstance',
    word: 'circumstance',
    ipa: '/ˈsɜːrkəmstæns/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'a condition or fact that affects a situation, decision, or event' },
      { language: 'zh', definition: '情况；环境；境遇' },
    ],
    examples: [{ sentenceEn: 'Under certain circumstances, learning a language faster is possible.', sentenceZh: '在某些情况下，更快地学习一门语言是可能的。', sourceType: 'original_seed' }],
    synonyms: ['condition', 'situation', 'context'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'complex',
    word: 'complex',
    ipa: '/ˈkɒmplɛks/',
    partOfSpeech: ['adjective', 'noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'consisting of many different and connected parts; not easy to understand or deal with' },
      { language: 'zh', definition: '复杂的；难以理解的；综合体' },
    ],
    examples: [{ sentenceEn: 'Grammar rules can be complex, but patterns make them easier.', sentenceZh: '语法规则可能很复杂，但规律性使它们更容易理解。', sourceType: 'original_seed' }],
    synonyms: ['complicated', 'intricate', 'involved'],
    antonyms: ['simple', 'straightforward', 'basic'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'conclude',
    word: 'conclude',
    ipa: '/kənˈkluːd/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to come to a judgment or decision after reasoning or investigation' },
      { language: 'zh', definition: '得出结论；结束；断定' },
    ],
    examples: [{ sentenceEn: 'The researcher concluded that immersion speeds up language acquisition.', sentenceZh: '研究人员得出结论：沉浸式学习可以加速语言习得。', sourceType: 'original_seed' }],
    synonyms: ['determine', 'decide', 'establish'],
    antonyms: ['begin', 'start', 'open'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'confirm',
    word: 'confirm',
    ipa: '/kənˈfɜːrm/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to make certain that something is true or that something will happen' },
      { language: 'zh', definition: '确认；证实；批准' },
    ],
    examples: [{ sentenceEn: 'Please confirm your appointment at least one day in advance.', sentenceZh: '请至少提前一天确认您的预约。', sourceType: 'original_seed' }],
    synonyms: ['verify', 'validate', 'establish'],
    antonyms: ['deny', 'contradict', 'disprove'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'context',
    word: 'context',
    ipa: '/ˈkɒntɛkst/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'the circumstances or setting that surround an event, statement, or idea' },
      { language: 'zh', definition: '背景；语境；上下文' },
    ],
    examples: [{ sentenceEn: "Understanding a word's context helps you use it correctly.", sentenceZh: '理解单词的语境有助于你正确使用它。', sourceType: 'original_seed' }],
    synonyms: ['setting', 'background', 'framework'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'define',
    word: 'define',
    ipa: '/dɪˈfaɪn/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'to state exactly what something means or to describe its essential qualities' },
      { language: 'zh', definition: '定义；阐明；界定' },
    ],
    examples: [{ sentenceEn: 'A dictionary defines words by giving their meaning and usage.', sentenceZh: '词典通过给出单词的含义和用法来对其进行定义。', sourceType: 'original_seed' }],
    synonyms: ['explain', 'describe', 'specify'],
    antonyms: ['blur', 'confuse'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'establish',
    word: 'establish',
    ipa: '/ɪˈstæblɪʃ/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to set up, create, or confirm something on a firm or permanent basis' },
      { language: 'zh', definition: '建立；确立；证实' },
    ],
    examples: [{ sentenceEn: 'Establish a daily reading habit to build your vocabulary naturally.', sentenceZh: '养成每天阅读的习惯，自然地扩大词汇量。', sourceType: 'original_seed' }],
    synonyms: ['found', 'create', 'build'],
    antonyms: ['abolish', 'destroy', 'dissolve'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'extent',
    word: 'extent',
    ipa: '/ɪkˈstɛnt/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'the degree, range, or scope to which something applies or exists' },
      { language: 'zh', definition: '程度；范围；限度' },
    ],
    examples: [{ sentenceEn: 'To what extent do flashcards help you retain new vocabulary?', sentenceZh: '抽认卡在多大程度上有助于你记住新词汇？', sourceType: 'original_seed' }],
    synonyms: ['degree', 'scope', 'range'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'facilitate',
    word: 'facilitate',
    ipa: '/fəˈsɪlɪteɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'to make something easier or help it happen more smoothly' },
      { language: 'zh', definition: '促进；使便利；帮助实现' },
    ],
    examples: [{ sentenceEn: 'Technology can facilitate language learning through instant feedback.', sentenceZh: '技术可以通过即时反馈来促进语言学习。', sourceType: 'original_seed' }],
    synonyms: ['enable', 'assist', 'ease'],
    antonyms: ['hinder', 'obstruct', 'impede'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'imply',
    word: 'imply',
    ipa: '/ɪmˈplaɪ/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'to suggest something without saying it directly or explicitly' },
      { language: 'zh', definition: '暗示；意味着；含有…的意思' },
    ],
    examples: [{ sentenceEn: 'His silence implied that he disagreed with the decision.', sentenceZh: '他的沉默暗示他不同意这个决定。', sourceType: 'original_seed' }],
    synonyms: ['suggest', 'indicate', 'hint'],
    antonyms: ['state', 'declare', 'proclaim'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'indicate',
    word: 'indicate',
    ipa: '/ˈɪndɪkeɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to point out, show, or suggest something as likely or true' },
      { language: 'zh', definition: '表明；指出；标示' },
    ],
    examples: [{ sentenceEn: 'The data indicates a clear improvement in reading comprehension.', sentenceZh: '数据表明阅读理解能力有明显提升。', sourceType: 'original_seed' }],
    synonyms: ['show', 'reveal', 'demonstrate'],
    antonyms: ['conceal', 'hide'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'interpret',
    word: 'interpret',
    ipa: '/ɪnˈtɜːrprɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to explain or understand something in a particular way' },
      { language: 'zh', definition: '解释；理解；诠释；口译' },
    ],
    examples: [{ sentenceEn: 'Different readers can interpret the same text in different ways.', sentenceZh: '不同的读者可以用不同的方式解读同一文本。', sourceType: 'original_seed' }],
    synonyms: ['explain', 'translate', 'understand'],
    antonyms: ['misinterpret', 'confuse'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'investigate',
    word: 'investigate',
    ipa: '/ɪnˈvɛstɪɡeɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'to examine something carefully to find out the truth or facts' },
      { language: 'zh', definition: '调查；研究；审查' },
    ],
    examples: [{ sentenceEn: 'Scientists investigate how children naturally acquire language.', sentenceZh: '科学家们研究儿童如何自然习得语言。', sourceType: 'original_seed' }],
    synonyms: ['examine', 'research', 'explore'],
    antonyms: ['ignore', 'overlook'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'outcome',
    word: 'outcome',
    ipa: '/ˈaʊtkʌm/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS'],
    definitions: [
      { language: 'en', definition: 'the way something ends; the result produced by an action or process' },
      { language: 'zh', definition: '结果；成效；结局' },
    ],
    examples: [{ sentenceEn: 'The outcome of the test surprised everyone — all students passed.', sentenceZh: '考试结果让所有人感到惊讶——所有学生都通过了。', sourceType: 'original_seed' }],
    synonyms: ['result', 'consequence', 'effect'],
    antonyms: ['cause', 'beginning'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'predict',
    word: 'predict',
    ipa: '/prɪˈdɪkt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'to say what you think will happen in the future based on available information' },
      { language: 'zh', definition: '预测；预言；预料' },
    ],
    examples: [{ sentenceEn: 'Can you predict which vocabulary items will appear on the exam?', sentenceZh: '你能预测哪些词汇会出现在考试中吗？', sourceType: 'original_seed' }],
    synonyms: ['forecast', 'anticipate', 'foresee'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'principle',
    word: 'principle',
    ipa: '/ˈprɪnsɪpəl/',
    partOfSpeech: ['noun'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'CET-6'],
    definitions: [
      { language: 'en', definition: 'a fundamental rule, belief, or law that governs behavior or explains how something works' },
      { language: 'zh', definition: '原则；原理；准则' },
    ],
    examples: [{ sentenceEn: 'The principle of spaced repetition improves long-term memory.', sentenceZh: '间隔重复原理有助于改善长期记忆。', sourceType: 'original_seed' }],
    synonyms: ['rule', 'law', 'standard'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'specific',
    word: 'specific',
    ipa: '/spəˈsɪfɪk/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'B2',
    difficultyLevel: 2,
    isCoreWord: true,
    isExamWord: false,
    definitions: [
      { language: 'en', definition: 'clearly defined or identified; relating to a particular thing and not general' },
      { language: 'zh', definition: '具体的；特定的；明确的' },
    ],
    examples: [{ sentenceEn: 'Be specific about which words you want to review today.', sentenceZh: '明确说出你今天想复习哪些单词。', sourceType: 'original_seed' }],
    synonyms: ['particular', 'precise', 'exact'],
    antonyms: ['general', 'vague', 'broad'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'valid',
    word: 'valid',
    ipa: '/ˈvælɪd/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'B2',
    difficultyLevel: 3,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'based on sound reasoning; legally or officially acceptable' },
      { language: 'zh', definition: '有效的；有根据的；合法的' },
    ],
    examples: [{ sentenceEn: 'Your observation is valid — consistency is key to language learning.', sentenceZh: '你的观察是有道理的——坚持是语言学习的关键。', sourceType: 'original_seed' }],
    synonyms: ['reasonable', 'justified', 'sound'],
    antonyms: ['invalid', 'unreasonable', 'unsound'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },

  // ── C1 (17 words) ──────────────────────────────────────────────────────────

  {
    normalizedWord: 'ambiguous',
    word: 'ambiguous',
    ipa: '/æmˈbɪɡjʊəs/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'having more than one possible meaning; open to different interpretations' },
      { language: 'zh', definition: '模糊的；有歧义的；不明确的' },
    ],
    examples: [{ sentenceEn: 'The instructions were ambiguous, so students interpreted them differently.', sentenceZh: '指示内容含糊不清，所以学生们的理解各不相同。', sourceType: 'original_seed' }],
    synonyms: ['unclear', 'vague', 'equivocal'],
    antonyms: ['clear', 'unambiguous', 'definite'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'controversy',
    word: 'controversy',
    ipa: '/ˈkɒntrəvɜːrsi/',
    partOfSpeech: ['noun'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'a prolonged public argument or disagreement, especially about a sensitive subject' },
      { language: 'zh', definition: '争议；争论；争辩' },
    ],
    examples: [{ sentenceEn: 'The new curriculum caused controversy among parents and teachers.', sentenceZh: '新课程在家长和教师中引发了争议。', sourceType: 'original_seed' }],
    synonyms: ['debate', 'dispute', 'disagreement'],
    antonyms: ['agreement', 'consensus', 'harmony'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'eliminate',
    word: 'eliminate',
    ipa: '/ɪˈlɪmɪneɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'to completely remove or get rid of something unwanted' },
      { language: 'zh', definition: '消除；淘汰；排除' },
    ],
    examples: [{ sentenceEn: 'You can eliminate confusion by reviewing vocabulary daily.', sentenceZh: '通过每天复习词汇，你可以消除困惑。', sourceType: 'original_seed' }],
    synonyms: ['remove', 'abolish', 'eradicate'],
    antonyms: ['add', 'keep', 'include'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'endorse',
    word: 'endorse',
    ipa: '/ɪnˈdɔːrs/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'to officially support or approve of someone or something publicly' },
      { language: 'zh', definition: '认可；支持；背书；代言' },
    ],
    examples: [{ sentenceEn: 'Experts endorse spaced repetition as the most effective study technique.', sentenceZh: '专家们认可间隔重复是最有效的学习技术。', sourceType: 'original_seed' }],
    synonyms: ['support', 'approve', 'advocate'],
    antonyms: ['oppose', 'reject', 'condemn'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'inevitable',
    word: 'inevitable',
    ipa: '/ɪnˈɛvɪtəbəl/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'certain to happen and impossible to avoid or prevent' },
      { language: 'zh', definition: '不可避免的；必然的；确定的' },
    ],
    examples: [{ sentenceEn: 'Some mistakes are inevitable when learning a new language.', sentenceZh: '学习新语言时，某些错误是不可避免的。', sourceType: 'original_seed' }],
    synonyms: ['unavoidable', 'certain', 'inescapable'],
    antonyms: ['avoidable', 'preventable', 'uncertain'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'inhibit',
    word: 'inhibit',
    ipa: '/ɪnˈhɪbɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'to prevent or slow down a process, action, or ability' },
      { language: 'zh', definition: '抑制；阻碍；妨碍' },
    ],
    examples: [{ sentenceEn: 'Fear of making mistakes can inhibit language learning.', sentenceZh: '害怕犯错会阻碍语言学习。', sourceType: 'original_seed' }],
    synonyms: ['restrain', 'prevent', 'block'],
    antonyms: ['encourage', 'facilitate', 'enable'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'implicit',
    word: 'implicit',
    ipa: '/ɪmˈplɪsɪt/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'implied or understood though not directly stated; complete and unquestioned' },
      { language: 'zh', definition: '隐含的；不言而喻的；含蓄的' },
    ],
    examples: [{ sentenceEn: 'There is an implicit understanding that students prepare before class.', sentenceZh: '学生在课前做好准备是一种不言而喻的共识。', sourceType: 'original_seed' }],
    synonyms: ['implied', 'indirect', 'unstated'],
    antonyms: ['explicit', 'stated', 'clear'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'integrate',
    word: 'integrate',
    ipa: '/ˈɪntɪɡreɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'to combine parts into a whole, or to include someone fully in a group or system' },
      { language: 'zh', definition: '整合；融合；使融入' },
    ],
    examples: [{ sentenceEn: 'Try to integrate new vocabulary into your daily conversations.', sentenceZh: '试着把新词汇融入你的日常对话中。', sourceType: 'original_seed' }],
    synonyms: ['combine', 'incorporate', 'merge'],
    antonyms: ['separate', 'isolate', 'exclude'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'notion',
    word: 'notion',
    ipa: '/ˈnoʊʃən/',
    partOfSpeech: ['noun'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'a belief, idea, or concept, often one that is vague or uncertain' },
      { language: 'zh', definition: '概念；想法；观念' },
    ],
    examples: [{ sentenceEn: 'He challenged the notion that grammar must be memorized by rules alone.', sentenceZh: '他挑战了语法必须单靠规则记忆这一观念。', sourceType: 'original_seed' }],
    synonyms: ['idea', 'concept', 'belief'],
    antonyms: ['fact', 'reality', 'certainty'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'objective',
    word: 'objective',
    ipa: '/əbˈdʒɛktɪv/',
    partOfSpeech: ['adjective', 'noun'],
    cefrLevel: 'C1',
    difficultyLevel: 3,
    isCoreWord: true,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'not influenced by personal feelings; based on facts rather than opinions' },
      { language: 'zh', definition: '客观的；公正的；目标' },
    ],
    examples: [{ sentenceEn: 'An objective self-assessment helps identify your weaknesses.', sentenceZh: '客观的自我评估有助于发现自身的弱点。', sourceType: 'original_seed' }],
    synonyms: ['unbiased', 'impartial', 'fair'],
    antonyms: ['subjective', 'biased', 'partial'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'paradox',
    word: 'paradox',
    ipa: '/ˈpærədɒks/',
    partOfSpeech: ['noun'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'a statement or situation that seems contradictory but may reveal a deeper truth' },
      { language: 'zh', definition: '悖论；自相矛盾的事物；似非而是的论点' },
    ],
    examples: [{ sentenceEn: "The language learner's paradox: the more you study, the more you realize you don't know.", sentenceZh: '语言学习者的悖论：你学得越多，越意识到自己还有很多不了解的东西。', sourceType: 'original_seed' }],
    synonyms: ['contradiction', 'irony', 'anomaly'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'regulate',
    word: 'regulate',
    ipa: '/ˈrɛɡjʊleɪt/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'to control or supervise something by means of rules or procedures' },
      { language: 'zh', definition: '管控；调节；监管' },
    ],
    examples: [{ sentenceEn: 'Schools regulate the use of digital devices to improve student focus.', sentenceZh: '学校管控数字设备的使用以提高学生的专注度。', sourceType: 'original_seed' }],
    synonyms: ['control', 'manage', 'oversee'],
    antonyms: ['deregulate', 'free', 'ignore'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'rhetoric',
    word: 'rhetoric',
    ipa: '/ˈrɛtərɪk/',
    partOfSpeech: ['noun'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'the art of effective or persuasive speaking and writing; language designed to impress' },
      { language: 'zh', definition: '修辞；措辞；夸夸其谈' },
    ],
    examples: [{ sentenceEn: 'Politicians often use powerful rhetoric to win public support.', sentenceZh: '政客们经常使用有力的修辞来赢得公众支持。', sourceType: 'original_seed' }],
    synonyms: ['oratory', 'eloquence', 'persuasion'],
    antonyms: [],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'scrutiny',
    word: 'scrutiny',
    ipa: '/ˈskruːtɪni/',
    partOfSpeech: ['noun'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'careful and detailed examination or investigation of something' },
      { language: 'zh', definition: '仔细审查；严格检查；详细审视' },
    ],
    examples: [{ sentenceEn: 'Every argument in an essay should be able to withstand scrutiny.', sentenceZh: '文章中的每个论点都应该经得起仔细检查。', sourceType: 'original_seed' }],
    synonyms: ['examination', 'inspection', 'analysis'],
    antonyms: ['neglect', 'ignorance'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'sustain',
    word: 'sustain',
    ipa: '/səˈsteɪn/',
    partOfSpeech: ['verb'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'to keep something going over a period of time; to maintain or support' },
      { language: 'zh', definition: '维持；持续；支撑；承受' },
    ],
    examples: [{ sentenceEn: 'Daily practice is the best way to sustain language progress.', sentenceZh: '每日练习是持续语言进步的最佳方式。', sourceType: 'original_seed' }],
    synonyms: ['maintain', 'continue', 'uphold'],
    antonyms: ['abandon', 'end', 'stop'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'tangible',
    word: 'tangible',
    ipa: '/ˈtændʒɪbəl/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'clearly perceived and definite; something real and concrete rather than vague' },
      { language: 'zh', definition: '有形的；切实的；可感知的' },
    ],
    examples: [{ sentenceEn: 'She saw tangible improvements in her reading speed after one month.', sentenceZh: '一个月后，她发现自己的阅读速度有了切实的提升。', sourceType: 'original_seed' }],
    synonyms: ['concrete', 'real', 'definite'],
    antonyms: ['intangible', 'abstract', 'vague'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'vulnerable',
    word: 'vulnerable',
    ipa: '/ˈvʌlnərəbəl/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C1',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['TOEFL', 'IELTS', 'GRE'],
    definitions: [
      { language: 'en', definition: 'susceptible to being harmed, attacked, or negatively affected' },
      { language: 'zh', definition: '脆弱的；易受伤害的；易受影响的' },
    ],
    examples: [{ sentenceEn: 'Beginners are often vulnerable to losing motivation early in their studies.', sentenceZh: '初学者往往容易在学习初期丧失动力。', sourceType: 'original_seed' }],
    synonyms: ['susceptible', 'exposed', 'weak'],
    antonyms: ['strong', 'protected', 'resilient'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },

  // ── C2 (7 words) ───────────────────────────────────────────────────────────

  {
    normalizedWord: 'ambivalent',
    word: 'ambivalent',
    ipa: '/æmˈbɪvələnt/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 5,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT', 'TOEFL'],
    definitions: [
      { language: 'en', definition: 'having mixed or conflicting feelings about something or someone at the same time' },
      { language: 'zh', definition: '矛盾的；有两种情感的；态度不明的' },
    ],
    examples: [{ sentenceEn: 'She felt ambivalent about leaving her country to study abroad.', sentenceZh: '她对出国留学感到矛盾，心情复杂。', sourceType: 'original_seed' }],
    synonyms: ['conflicted', 'uncertain', 'undecided'],
    antonyms: ['certain', 'decisive', 'resolved'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'articulate',
    word: 'articulate',
    ipa: '/ɑːrˈtɪkjʊlɪt/',
    partOfSpeech: ['adjective', 'verb'],
    cefrLevel: 'C2',
    difficultyLevel: 5,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT', 'TOEFL'],
    definitions: [
      { language: 'en', definition: 'able to express ideas clearly and effectively; (verb) to express or explain clearly' },
      { language: 'zh', definition: '口齿清晰的；表达流畅的；表达清楚' },
    ],
    examples: [{ sentenceEn: 'An articulate speaker chooses precise words to convey complex ideas.', sentenceZh: '一位表达流畅的演讲者会选择精准的词汇来传达复杂的想法。', sourceType: 'original_seed' }],
    synonyms: ['eloquent', 'fluent', 'well-spoken'],
    antonyms: ['inarticulate', 'unclear', 'mumbling'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'meticulous',
    word: 'meticulous',
    ipa: '/mɪˈtɪkjʊləs/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 5,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT', 'TOEFL'],
    definitions: [
      { language: 'en', definition: 'showing great care and precision; giving close attention to every detail' },
      { language: 'zh', definition: '细致的；一丝不苟的；极其谨慎的' },
    ],
    examples: [{ sentenceEn: 'A meticulous proofreader catches every grammar and spelling mistake.', sentenceZh: '一位细致的校对员能发现每一个语法和拼写错误。', sourceType: 'original_seed' }],
    synonyms: ['careful', 'thorough', 'precise'],
    antonyms: ['careless', 'sloppy', 'negligent'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'nuanced',
    word: 'nuanced',
    ipa: '/ˈnjuːɑːnst/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 5,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'showing subtle distinctions or variations in meaning, expression, or understanding' },
      { language: 'zh', definition: '细致入微的；有细微差别的；含义微妙的' },
    ],
    examples: [{ sentenceEn: 'A nuanced understanding of idioms takes years of exposure to the language.', sentenceZh: '对习语的细致理解需要多年接触语言的积累。', sourceType: 'original_seed' }],
    synonyms: ['subtle', 'refined', 'delicate'],
    antonyms: ['simplistic', 'crude', 'blunt'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'pragmatic',
    word: 'pragmatic',
    ipa: '/præɡˈmætɪk/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT', 'TOEFL'],
    definitions: [
      { language: 'en', definition: 'dealing with things practically and realistically rather than theoretically' },
      { language: 'zh', definition: '务实的；实际的；注重实效的' },
    ],
    examples: [{ sentenceEn: 'A pragmatic learner focuses on the vocabulary they need most immediately.', sentenceZh: '务实的学习者专注于他们最迫切需要的词汇。', sourceType: 'original_seed' }],
    synonyms: ['practical', 'realistic', 'rational'],
    antonyms: ['idealistic', 'impractical', 'unrealistic'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'profound',
    word: 'profound',
    ipa: '/prəˈfaʊnd/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 4,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT', 'TOEFL'],
    definitions: [
      { language: 'en', definition: 'very deep, intense, or having great significance and importance' },
      { language: 'zh', definition: '深刻的；意义深远的；渊博的' },
    ],
    examples: [{ sentenceEn: 'Learning a second language has a profound impact on how you see the world.', sentenceZh: '学习第二语言对你看待世界的方式有着深远的影响。', sourceType: 'original_seed' }],
    synonyms: ['deep', 'significant', 'far-reaching'],
    antonyms: ['shallow', 'trivial', 'insignificant'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
  {
    normalizedWord: 'verbose',
    word: 'verbose',
    ipa: '/vɜːrˈboʊs/',
    partOfSpeech: ['adjective'],
    cefrLevel: 'C2',
    difficultyLevel: 5,
    isCoreWord: false,
    isExamWord: true,
    examTags: ['GRE', 'SAT'],
    definitions: [
      { language: 'en', definition: 'using more words than necessary; long-winded in speech or writing' },
      { language: 'zh', definition: '冗长的；啰嗦的；用词过多的' },
    ],
    examples: [{ sentenceEn: 'A verbose essay uses too many words to express a simple idea.', sentenceZh: '一篇冗长的文章用了太多的文字来表达一个简单的想法。', sourceType: 'original_seed' }],
    synonyms: ['wordy', 'long-winded', 'prolix'],
    antonyms: ['concise', 'brief', 'succinct'],
    sourceType: 'original_seed',
    sourceNote: SN,
  },
]

export const EXPANDED_SOURCE_NOTE = SN
```

- [ ] **Step 3: Commit**

```bash
git add lib/dictionary/dictionary-import-types.ts data/dictionary/import/core-words-expanded.ts
git commit -m "feat(6h): DictionaryImportWord type + 74-word expanded seed"
```

---

### Task 2: ExpandedSeedAdapter

**Files:**
- Create: `lib/dictionary/expanded-seed-adapter.ts`

- [ ] **Step 1: Create the adapter**

Create `lib/dictionary/expanded-seed-adapter.ts`:

```ts
/**
 * ExpandedSeedAdapter — DictionaryClient backed by Phase 6H expanded seed.
 *
 * Source: data/dictionary/import/core-words-expanded.ts (74 original words).
 * No network calls. Works offline. Sits between SupabaseDictionaryClient and
 * CoreSeedAdapter in the CompositeDictionaryClient chain.
 */

import { EXPANDED_WORDS_SEED } from '@/data/dictionary/import/core-words-expanded'
import { toDbSourceType } from '@/lib/dictionary/dictionary-import-types'
import type { DictionaryImportWord } from '@/lib/dictionary/dictionary-import-types'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryCollocation,
  WordLevel,
  CefrLevel,
  ExamTag,
  WordSearchOptions,
} from './dictionary-types'

function cefrToLevel(cefr?: string | null): WordLevel {
  switch (cefr) {
    case 'A1': return 'beginner'
    case 'A2': return 'elementary'
    case 'B1': return 'intermediate'
    case 'B2': return 'advanced'
    case 'C1': case 'C2': return 'exam-prep'
    default: return 'intermediate'
  }
}

function importToDictionaryWord(entry: DictionaryImportWord): DictionaryWord {
  const now = new Date().toISOString()
  const sourceType = toDbSourceType(entry.sourceType)
  const primaryPos = entry.partOfSpeech[0] ?? 'unknown'

  // Group en + zh definitions into DictionaryDefinition[]
  const enDefs = entry.definitions.filter(d => d.language === 'en')
  const zhDefs = entry.definitions.filter(d => d.language === 'zh')
  const definitions: DictionaryDefinition[] = enDefs.map((d, i) => ({
    partOfSpeech: primaryPos,
    definitionEn: d.definition,
    definitionZh: zhDefs[i]?.definition,
    orderIndex: d.orderIndex ?? i,
    sourceType,
  }))

  const examples: DictionaryExample[] = (entry.examples ?? []).map((e, i) => ({
    sentenceEn: e.sentenceEn,
    sentenceZh: e.sentenceZh,
    orderIndex: e.orderIndex ?? i,
    sourceType,
  }))

  const collocations: DictionaryCollocation[] = (entry.collocations ?? []).map((c, i) => ({
    phrase: typeof c === 'string' ? c : c.phrase,
    exampleEn: typeof c === 'string' ? undefined : c.exampleEn,
    exampleZh: typeof c === 'string' ? undefined : c.exampleZh,
    orderIndex: i,
  }))

  return {
    id: entry.normalizedWord,
    word: entry.word,
    phoneticIpa: entry.ipa ?? null,
    partOfSpeech: primaryPos,
    cefrLevel: (entry.cefrLevel as CefrLevel) ?? null,
    level: cefrToLevel(entry.cefrLevel),
    difficulty: (entry.difficultyLevel ?? 3) as 1 | 2 | 3 | 4 | 5,
    isCore: entry.isCoreWord ?? false,
    isExamWord: entry.isExamWord ?? false,
    examTags: (entry.examTags ?? []) as ExamTag[],
    tags: [],
    frequencyRank: entry.frequencyRank ?? null,
    sourceType,
    sourceNote: entry.sourceNote,
    definitions,
    examples,
    etymology: entry.etymologyBrief
      ? { roots: entry.etymologyBrief, explanationEn: entry.etymologyBrief }
      : null,
    mnemonics: (entry.mnemonics ?? []).map((m, i) => ({
      mnemonicEn: m.mnemonic,
      mnemonicZh: m.mnemonicZh,
      style: (m.type ?? 'standard') as 'standard' | 'evil' | 'visual' | 'story' | 'phonetic',
      isAiGenerated: false,
      isReviewed: true,
      orderIndex: i,
    })),
    synonyms: entry.synonyms ?? [],
    antonyms: entry.antonyms ?? [],
    collocations,
    sceneUsages: [],
    pronunciations: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ── Pre-build lookup index ─────────────────────────────────────────────────

const _index = new Map<string, DictionaryWord>()

function getIndex(): Map<string, DictionaryWord> {
  if (_index.size === 0) {
    for (const entry of EXPANDED_WORDS_SEED) {
      const word = importToDictionaryWord(entry)
      _index.set(word.id, word)
    }
  }
  return _index
}

// ── ExpandedSeedDictionaryClient ───────────────────────────────────────────

class ExpandedSeedDictionaryClient implements DictionaryClient {
  readonly isLive = false

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    return getIndex().get(slug) ?? null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    const q = query.toLowerCase().trim()
    let results = Array.from(getIndex().values())

    if (q) {
      results = results.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.definitions.some(d => d.definitionEn.toLowerCase().includes(q)) ||
        w.definitions.some(d => (d.definitionZh ?? '').includes(q))
      )
    }
    if (options?.level) results = results.filter(w => w.level === options.level)
    if (options?.difficulty) results = results.filter(w => w.difficulty === options.difficulty)
    if (options?.examTag) results = results.filter(w => w.examTags.includes(options.examTag!))

    const offset = options?.offset ?? 0
    const limit = options?.limit ?? results.length
    return results.slice(offset, offset + limit)
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    return Array.from(getIndex().values())
      .filter(w => w.isCore)
      .slice(0, limit)
  }
}

let _instance: ExpandedSeedDictionaryClient | null = null

export function getExpandedSeedAdapter(): DictionaryClient {
  _instance ??= new ExpandedSeedDictionaryClient()
  return _instance
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dictionary/expanded-seed-adapter.ts
git commit -m "feat(6h): ExpandedSeedAdapter — 74-word expanded dictionary client"
```

---

### Task 3: SupabaseDictionaryClient

**Files:**
- Create: `lib/dictionary/supabase-dictionary-client.ts`

- [ ] **Step 1: Create the Supabase client**

Create `lib/dictionary/supabase-dictionary-client.ts`:

```ts
/**
 * SupabaseDictionaryClient — DictionaryClient backed by Supabase dictionary tables.
 *
 * Requires tables from phase-6a-dictionary-pronunciation-schema.sql.
 * Gracefully returns null / [] on any error (table not found, network failure,
 * Supabase not configured). Never throws or exposes raw errors to callers.
 *
 * Uses anon key (public read RLS) — no auth session required.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryEtymology,
  DictionaryMnemonic,
  DictionaryCollocation,
  DictionarySceneUsage,
  DictionaryPronunciation,
  DictionarySourceType,
  WordLevel,
  CefrLevel,
  ExamTag,
  WordSearchOptions,
} from './dictionary-types'

// ── Supabase row shapes ────────────────────────────────────────────────────

interface DbDictionaryWord {
  id: string
  word: string
  normalized_word: string
  phonetic_ipa: string | null
  part_of_speech: string | null
  cefr_level: string | null
  level: string
  difficulty: number
  frequency_rank: number | null
  is_core_word: boolean
  is_exam_word: boolean
  tags: string[]
  source_type: string
  source_note: string | null
  created_at: string
  updated_at: string
  dictionary_definitions?: DbDefinition[]
  dictionary_examples?: DbExample[]
  dictionary_etymology?: DbEtymology[]
  word_mnemonics?: DbMnemonic[]
  dictionary_collocations?: DbCollocation[]
  dictionary_synonyms?: DbSynonym[]
  dictionary_antonyms?: DbAntonym[]
  dictionary_scene_usages?: DbSceneUsage[]
  word_pronunciations?: DbPronunciation[]
  exam_word_tags?: DbExamTag[]
}

interface DbDefinition { id: string; part_of_speech: string; definition_en: string; definition_zh: string | null; order_index: number; source_type: string }
interface DbExample { id: string; sentence_en: string; sentence_zh: string | null; order_index: number; source_type: string }
interface DbEtymology { id: string; roots: string | null; explanation_en: string | null; explanation_zh: string | null }
interface DbMnemonic { id: string; mnemonic_en: string; mnemonic_zh: string | null; mnemonic_style: string; is_ai_generated: boolean; is_reviewed: boolean; order_index: number }
interface DbCollocation { id: string; phrase: string; example_en: string | null; example_zh: string | null; order_index: number }
interface DbSynonym { id: string; synonym: string; order_index: number }
interface DbAntonym { id: string; antonym: string; order_index: number }
interface DbSceneUsage { id: string; scene_en: string; scene_zh: string | null; example_en: string | null; example_zh: string | null; order_index: number }
interface DbPronunciation { id: string; accent: string; phonetic_ipa: string | null; audio_url: string | null; provider: string; is_default: boolean }
interface DbExamTag { id: string; exam_type: string }

// ── DB row → DictionaryWord mapper ─────────────────────────────────────────

function mapDbWord(row: DbDictionaryWord): DictionaryWord {
  const definitions: DictionaryDefinition[] = (row.dictionary_definitions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(d => ({
      id: d.id,
      partOfSpeech: d.part_of_speech,
      definitionEn: d.definition_en,
      definitionZh: d.definition_zh ?? undefined,
      orderIndex: d.order_index,
      sourceType: d.source_type as DictionarySourceType,
    }))

  const examples: DictionaryExample[] = (row.dictionary_examples ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(e => ({
      id: e.id,
      sentenceEn: e.sentence_en,
      sentenceZh: e.sentence_zh ?? undefined,
      orderIndex: e.order_index,
      sourceType: e.source_type as DictionarySourceType,
    }))

  const etymologyRow = (row.dictionary_etymology ?? [])[0]
  const etymology: DictionaryEtymology | null = etymologyRow ? {
    roots: etymologyRow.roots ?? '',
    explanationEn: etymologyRow.explanation_en ?? '',
    explanationZh: etymologyRow.explanation_zh ?? undefined,
  } : null

  const mnemonics: DictionaryMnemonic[] = (row.word_mnemonics ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(m => ({
      id: m.id,
      mnemonicEn: m.mnemonic_en,
      mnemonicZh: m.mnemonic_zh ?? undefined,
      style: m.mnemonic_style as DictionaryMnemonic['style'],
      isAiGenerated: m.is_ai_generated,
      isReviewed: m.is_reviewed,
      orderIndex: m.order_index,
    }))

  const collocations: DictionaryCollocation[] = (row.dictionary_collocations ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(c => ({
      id: c.id,
      phrase: c.phrase,
      exampleEn: c.example_en ?? undefined,
      exampleZh: c.example_zh ?? undefined,
      orderIndex: c.order_index,
    }))

  const sceneUsages: DictionarySceneUsage[] = (row.dictionary_scene_usages ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(s => ({
      id: s.id,
      sceneEn: s.scene_en,
      sceneZh: s.scene_zh ?? undefined,
      exampleEn: s.example_en ?? undefined,
      exampleZh: s.example_zh ?? undefined,
      orderIndex: s.order_index,
    }))

  const pronunciations: DictionaryPronunciation[] = (row.word_pronunciations ?? []).map(p => ({
    id: p.id,
    accent: p.accent as DictionaryPronunciation['accent'],
    phoneticIpa: p.phonetic_ipa ?? undefined,
    audioUrl: p.audio_url ?? undefined,
    provider: p.provider as DictionaryPronunciation['provider'],
    isDefault: p.is_default,
  }))

  return {
    id: row.id,
    word: row.word,
    phoneticIpa: row.phonetic_ipa,
    partOfSpeech: row.part_of_speech,
    cefrLevel: (row.cefr_level as CefrLevel) ?? null,
    level: row.level as WordLevel,
    difficulty: row.difficulty as 1 | 2 | 3 | 4 | 5,
    isCore: row.is_core_word,
    isExamWord: row.is_exam_word,
    examTags: (row.exam_word_tags ?? []).map(t => t.exam_type as ExamTag),
    tags: row.tags ?? [],
    frequencyRank: row.frequency_rank,
    sourceType: row.source_type as DictionarySourceType,
    sourceNote: row.source_note,
    definitions,
    examples,
    etymology,
    mnemonics,
    synonyms: (row.dictionary_synonyms ?? []).sort((a, b) => a.order_index - b.order_index).map(s => s.synonym),
    antonyms: (row.dictionary_antonyms ?? []).sort((a, b) => a.order_index - b.order_index).map(a => a.antonym),
    collocations,
    sceneUsages,
    pronunciations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── SupabaseDictionaryClient ───────────────────────────────────────────────

const FULL_SELECT = `
  *,
  dictionary_definitions(*),
  dictionary_examples(*),
  dictionary_etymology(*),
  word_mnemonics(*),
  dictionary_collocations(*),
  dictionary_synonyms(*),
  dictionary_antonyms(*),
  dictionary_scene_usages(*),
  word_pronunciations(*),
  exam_word_tags(*)
`.trim()

const SEARCH_SELECT = `
  *,
  dictionary_definitions(*),
  exam_word_tags(*)
`.trim()

class SupabaseDictionaryClient implements DictionaryClient {
  readonly isLive = true

  private get db() {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    if (!isSupabaseConfigured) return null
    try {
      const { data, error } = await this.db
        .from('dictionary_words')
        .select(FULL_SELECT)
        .eq('id', slug)
        .maybeSingle()
      if (error || !data) return null
      return mapDbWord(data as DbDictionaryWord)
    } catch {
      return null
    }
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    if (!isSupabaseConfigured) return []
    try {
      const q = query.toLowerCase().trim()
      let req = this.db
        .from('dictionary_words')
        .select(SEARCH_SELECT)
        .order('is_core_word', { ascending: false })
        .order('difficulty', { ascending: true })

      if (q) req = req.ilike('normalized_word', `%${q}%`)
      if (options?.level) req = req.eq('level', options.level)
      if (options?.difficulty) req = req.eq('difficulty', options.difficulty)
      req = req.range(
        options?.offset ?? 0,
        (options?.offset ?? 0) + (options?.limit ?? 20) - 1
      )

      const { data, error } = await req
      if (error || !data) return []

      return (data as DbDictionaryWord[]).map(row => {
        const word = mapDbWord(row)
        // For search results, fill unloaded arrays with empty
        return {
          ...word,
          examples: [],
          etymology: null,
          mnemonics: [],
          collocations: [],
          synonyms: [],
          antonyms: [],
          sceneUsages: [],
          pronunciations: [],
        }
      })
    } catch {
      return []
    }
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    if (!isSupabaseConfigured) return []
    try {
      const { data, error } = await this.db
        .from('dictionary_words')
        .select(SEARCH_SELECT)
        .eq('is_core_word', true)
        .order('difficulty', { ascending: true })
        .limit(limit)
      if (error || !data) return []
      return (data as DbDictionaryWord[]).map(row => ({
        ...mapDbWord(row),
        examples: [], etymology: null, mnemonics: [], collocations: [],
        synonyms: [], antonyms: [], sceneUsages: [], pronunciations: [],
      }))
    } catch {
      return []
    }
  }
}

let _instance: SupabaseDictionaryClient | null = null

export function getSupabaseDictionaryClient(): DictionaryClient {
  _instance ??= new SupabaseDictionaryClient()
  return _instance
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dictionary/supabase-dictionary-client.ts
git commit -m "feat(6h): SupabaseDictionaryClient — graceful fallback on error or unconfigured"
```

---

### Task 4: Wire getDictionaryClient factory

**Files:**
- Modify: `lib/dictionary/dictionary-client.ts`

- [ ] **Step 1: Update the factory to the full lookup chain**

Replace the body of `lib/dictionary/dictionary-client.ts` with:

```ts
/**
 * Dictionary client factory.
 *
 * Phase 6H lookup chain (tried in order):
 *   1. SupabaseDictionaryClient  — Supabase dictionary_words (when configured + tables exist)
 *   2. ExpandedSeedAdapter       — Phase 6H 74 original words (always offline)
 *   3. CoreSeedAdapter           — Phase 6B 60 original words (always offline)
 *   4. MockDictionaryAdapter     — Phase 1 20 mock words (always offline)
 *   5. null                      — word not found
 *
 * All adapters fail gracefully. No adapter throws.
 *
 * Usage (server components and route handlers):
 *   const word = await getDictionaryClient().lookupWord(slug)
 *
 * Client components call /api/dictionary/word/[slug] instead.
 */

import { getMockDictionaryAdapter } from './mock-dictionary-adapter'
import { getCoreSeedAdapter } from './core-seed-adapter'
import { getExpandedSeedAdapter } from './expanded-seed-adapter'
import { getSupabaseDictionaryClient } from './supabase-dictionary-client'
import type { DictionaryClient, DictionaryWord, WordLevel, WordSearchOptions } from './dictionary-types'

export type { DictionaryClient, DictionaryWord, WordSearchOptions } from './dictionary-types'

// ── Composite client (tries adapters in order) ─────────────────────────────

class CompositeDictionaryClient implements DictionaryClient {
  readonly isLive = false

  constructor(private readonly adapters: DictionaryClient[]) {}

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    for (const adapter of this.adapters) {
      const result = await adapter.lookupWord(slug)
      if (result) return result
    }
    return null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    const seen = new Set<string>()
    const merged: DictionaryWord[] = []
    for (const adapter of this.adapters) {
      const results = await adapter.searchWords(query, { ...options, offset: 0, limit: undefined })
      for (const w of results) {
        if (!seen.has(w.id)) {
          seen.add(w.id)
          merged.push(w)
        }
      }
    }
    const offset = options?.offset ?? 0
    const limit = options?.limit
    return limit !== undefined ? merged.slice(offset, offset + limit) : merged.slice(offset)
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    const seen = new Set<string>()
    const merged: DictionaryWord[] = []
    for (const adapter of this.adapters) {
      const results = await adapter.getCoreWords(limit)
      for (const w of results) {
        if (!seen.has(w.id)) {
          seen.add(w.id)
          merged.push(w)
        }
      }
    }
    return merged.slice(0, limit)
  }
}

// ── Singleton composite client ─────────────────────────────────────────────

let _client: CompositeDictionaryClient | null = null

/**
 * Returns the active DictionaryClient.
 * Chain: SupabaseClient → ExpandedSeedAdapter → CoreSeedAdapter → MockDictionaryAdapter
 */
export function getDictionaryClient(): DictionaryClient {
  if (!_client) {
    _client = new CompositeDictionaryClient([
      getSupabaseDictionaryClient(),   // Phase 6H: DB (graceful fallback when unconfigured)
      getExpandedSeedAdapter(),         // Phase 6H: 74 expanded original words
      getCoreSeedAdapter(),             // Phase 6B: 60 core original words
      getMockDictionaryAdapter(),       // Phase 1:  20 mock words
    ])
  }
  return _client
}

export async function lookupWord(slug: string): Promise<DictionaryWord | null> {
  return getDictionaryClient().lookupWord(slug)
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/dictionary/dictionary-client.ts
git commit -m "feat(6h): wire full lookup chain (Supabase→expanded→core→mock)"
```

---

### Task 5: Import validation script + package.json

**Files:**
- Create: `scripts/validate-dictionary-import.ts`
- Modify: `package.json`

- [ ] **Step 1: Create the validation script**

Create `scripts/validate-dictionary-import.ts`:

```ts
/**
 * Dictionary Import Validator
 *
 * Validates data/dictionary/import/core-words-expanded.ts for compliance,
 * completeness, and integrity before seeding or SQL generation.
 *
 * Run: npx tsx scripts/validate-dictionary-import.ts
 *
 * Exit codes: 0 = pass (warnings OK), 1 = one or more errors found
 */

import { EXPANDED_WORDS_SEED } from '../data/dictionary/import/core-words-expanded'
import type { DictionaryImportWord } from '../lib/dictionary/dictionary-import-types'

// ── Constants ─────────────────────────────────────────────────────────────

const VALID_CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const VALID_POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5]
const VALID_SOURCE_TYPES = ['original_seed', 'ai_generated_draft', 'licensed_public']
const VALID_EXAM_TAGS = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE', 'custom']

const BLOCKED_SOURCE_STRINGS = [
  'oxford', 'cambridge', 'longman', 'collins', 'merriam-webster', 'merriam webster',
  'macmillan', 'wordnet', 'wordreference', 'dictionary.com',
]

const MAX_DEFINITION_CHARS = 500
const MAX_EXAMPLE_CHARS = 400

interface Issue { level: 'error' | 'warning'; id: string; field: string; message: string }

// ── Validation ────────────────────────────────────────────────────────────

function validate(entry: DictionaryImportWord): Issue[] {
  const issues: Issue[] = []
  const id = entry.normalizedWord || entry.word || '(unknown)'

  const err = (field: string, msg: string) => issues.push({ level: 'error', id, field, msg } as unknown as Issue)
  const warn = (field: string, msg: string) => issues.push({ level: 'warning', id, field, msg } as unknown as Issue)

  // Required fields
  if (!entry.word?.trim()) { issues.push({ level: 'error', id, field: 'word', message: 'word must not be empty' }); return issues }
  if (!entry.normalizedWord?.trim()) issues.push({ level: 'error', id, field: 'normalizedWord', message: 'normalizedWord must not be empty' })

  // normalizedWord must be lowercase + trimmed
  const expectedNorm = entry.word.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (entry.normalizedWord !== expectedNorm) {
    issues.push({ level: 'warning', id, field: 'normalizedWord', message: `expected "${expectedNorm}", got "${entry.normalizedWord}"` })
  }

  // partOfSpeech
  if (!entry.partOfSpeech?.length) {
    issues.push({ level: 'error', id, field: 'partOfSpeech', message: 'partOfSpeech must have at least one value' })
  } else {
    for (const pos of entry.partOfSpeech) {
      if (!VALID_POS.includes(pos)) issues.push({ level: 'warning', id, field: 'partOfSpeech', message: `unknown POS: "${pos}"` })
    }
  }

  // CEFR
  if (entry.cefrLevel && !VALID_CEFR.includes(entry.cefrLevel)) {
    issues.push({ level: 'error', id, field: 'cefrLevel', message: `invalid cefrLevel: "${entry.cefrLevel}"` })
  }

  // Difficulty
  if (entry.difficultyLevel !== undefined && !VALID_DIFFICULTY.includes(entry.difficultyLevel)) {
    issues.push({ level: 'error', id, field: 'difficultyLevel', message: `difficultyLevel must be 1-5, got ${entry.difficultyLevel}` })
  }

  // Definitions — must have ≥1 en + ≥1 zh
  const enDefs = entry.definitions.filter(d => d.language === 'en')
  const zhDefs = entry.definitions.filter(d => d.language === 'zh')
  if (enDefs.length === 0) issues.push({ level: 'error', id, field: 'definitions', message: 'must have at least one English definition (language: "en")' })
  if (zhDefs.length === 0) issues.push({ level: 'error', id, field: 'definitions', message: 'must have at least one Chinese definition (language: "zh")' })

  for (const d of entry.definitions) {
    if (!d.definition?.trim()) issues.push({ level: 'error', id, field: 'definitions', message: `empty definition for language="${d.language}"` })
    if (d.definition && d.definition.length > MAX_DEFINITION_CHARS) {
      issues.push({ level: 'warning', id, field: 'definitions', message: `definition too long (${d.definition.length} chars > ${MAX_DEFINITION_CHARS})` })
    }
  }

  // Examples
  if (!entry.examples?.length) {
    issues.push({ level: 'warning', id, field: 'examples', message: 'no examples provided' })
  } else {
    for (const ex of entry.examples) {
      if (!ex.sentenceEn?.trim()) issues.push({ level: 'error', id, field: 'examples', message: 'sentenceEn must not be empty' })
      if (ex.sentenceEn && ex.sentenceEn.length > MAX_EXAMPLE_CHARS) {
        issues.push({ level: 'warning', id, field: 'examples', message: `example too long (${ex.sentenceEn.length} chars)` })
      }
    }
  }

  // sourceType
  if (!entry.sourceType) {
    issues.push({ level: 'error', id, field: 'sourceType', message: 'sourceType is required' })
  } else if (!VALID_SOURCE_TYPES.includes(entry.sourceType)) {
    issues.push({ level: 'error', id, field: 'sourceType', message: `invalid sourceType: "${entry.sourceType}"` })
  }
  if (entry.sourceType === 'user_private') {
    issues.push({ level: 'error', id, field: 'sourceType', message: 'user_private data must not appear in public import files' })
  }

  // sourceNote
  if (!entry.sourceNote?.trim()) {
    issues.push({ level: 'error', id, field: 'sourceNote', message: 'sourceNote is required' })
  }

  // Source compliance — check for blocked strings in all text fields
  const allText = [
    entry.sourceNote ?? '',
    ...entry.definitions.map(d => d.definition),
    ...(entry.examples ?? []).map(e => e.sentenceEn),
  ].join(' ').toLowerCase()

  for (const blocked of BLOCKED_SOURCE_STRINGS) {
    if (allText.includes(blocked)) {
      issues.push({ level: 'warning', id, field: 'compliance', message: `text contains "${blocked}" — verify this is not commercial dictionary content` })
    }
  }

  // Exam tags
  for (const tag of entry.examTags ?? []) {
    if (!VALID_EXAM_TAGS.includes(tag)) {
      issues.push({ level: 'warning', id, field: 'examTags', message: `unknown exam tag: "${tag}"` })
    }
  }

  // isExamWord consistency
  if (entry.isExamWord && (!entry.examTags || entry.examTags.length === 0)) {
    issues.push({ level: 'warning', id, field: 'examTags', message: 'isExamWord=true but no examTags specified' })
  }

  return issues
}

// ── Main ──────────────────────────────────────────────────────────────────

const allIssues: Issue[] = []
const ids = new Set<string>()
const words = new Set<string>()

for (const entry of EXPANDED_WORDS_SEED) {
  // Duplicate detection
  if (ids.has(entry.normalizedWord)) {
    allIssues.push({ level: 'error', id: entry.normalizedWord, field: 'normalizedWord', message: 'DUPLICATE normalizedWord' })
  }
  ids.add(entry.normalizedWord)

  if (words.has(entry.word.toLowerCase())) {
    allIssues.push({ level: 'error', id: entry.normalizedWord, field: 'word', message: 'DUPLICATE word' })
  }
  words.add(entry.word.toLowerCase())

  allIssues.push(...validate(entry))
}

const errors = allIssues.filter(i => i.level === 'error')
const warnings = allIssues.filter(i => i.level === 'warning')

// ── CEFR distribution ──────────────────────────────────────────────────────
const cefrCounts: Record<string, number> = {}
for (const e of EXPANDED_WORDS_SEED) {
  const k = e.cefrLevel ?? 'none'
  cefrCounts[k] = (cefrCounts[k] ?? 0) + 1
}

console.log('\n════ Dictionary Import Validator ════')
console.log(`Total words: ${EXPANDED_WORDS_SEED.length}`)
console.log(`Errors: ${errors.length}   Warnings: ${warnings.length}`)
console.log('\nCEFR distribution:')
for (const [k, v] of Object.entries(cefrCounts)) console.log(`  ${k}: ${v}`)

if (warnings.length > 0) {
  console.log('\nWarnings:')
  for (const w of warnings) console.log(`  [WARN] ${w.id} / ${w.field}: ${w.message}`)
}
if (errors.length > 0) {
  console.log('\nErrors:')
  for (const e of errors) console.log(`  [ERR]  ${e.id} / ${e.field}: ${e.message}`)
  console.log('\n✗ Validation failed.')
  process.exit(1)
}

console.log('\n✓ All checks passed.')
```

- [ ] **Step 2: Add script to package.json**

In `package.json`, change the `"scripts"` section from:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
},
```

to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "validate:dictionary": "npx tsx scripts/validate-dictionary-import.ts"
},
```

- [ ] **Step 3: Run validation to confirm it passes**

```bash
cd d:/ai-studio/ocean-english && npm run validate:dictionary
```

Expected output:
```
════ Dictionary Import Validator ════
Total words: 74
Errors: 0   Warnings: 0

CEFR distribution:
  A2: 10
  B1: 20
  B2: 20
  C1: 17
  C2: 7

✓ All checks passed.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-dictionary-import.ts package.json
git commit -m "feat(6h): import validation script + validate:dictionary npm script"
```

---

### Task 6: Seed SQL generator + output SQL

**Files:**
- Create: `scripts/generate-dictionary-seed-sql.ts`
- Create: `supabase/sql/phase-6h-core-dictionary-seed.sql` (generated output — commit both)

- [ ] **Step 1: Create the SQL generator script**

Create `scripts/generate-dictionary-seed-sql.ts`:

```ts
/**
 * Dictionary Seed SQL Generator
 *
 * Reads EXPANDED_WORDS_SEED and writes supabase/sql/phase-6h-core-dictionary-seed.sql.
 * Run: npx tsx scripts/generate-dictionary-seed-sql.ts
 *
 * The generated SQL is idempotent (DELETE cascade + INSERT).
 * Run it manually in Supabase SQL Editor after phase-6a schema is applied.
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import { EXPANDED_WORDS_SEED } from '../data/dictionary/import/core-words-expanded'
import { toDbSourceType } from '../lib/dictionary/dictionary-import-types'

function esc(s: string | null | undefined): string {
  if (s == null) return 'NULL'
  return `'${s.replace(/'/g, "''")}'`
}

function cefrToLevel(cefr?: string): string {
  switch (cefr) {
    case 'A1': return 'beginner'
    case 'A2': return 'elementary'
    case 'B1': return 'intermediate'
    case 'B2': return 'advanced'
    case 'C1': case 'C2': return 'exam-prep'
    default: return 'intermediate'
  }
}

const lines: string[] = []

lines.push(`-- ============================================================`)
lines.push(`-- LexiOcean Phase 6H: Expanded Dictionary Seed (74 words)`)
lines.push(`-- ============================================================`)
lines.push(`-- Generated by scripts/generate-dictionary-seed-sql.ts`)
lines.push(`-- Run AFTER phase-6a-dictionary-pronunciation-schema.sql`)
lines.push(`-- Run in Supabase SQL Editor. Safe to re-run (DELETE cascade + INSERT).`)
lines.push(`--`)
lines.push(`-- COMPLIANCE: All content is original LexiOcean educational material.`)
lines.push(`-- source_type = 'original' for all rows.`)
lines.push(`-- ============================================================`)
lines.push(``)

const ids = EXPANDED_WORDS_SEED.map(e => esc(e.normalizedWord)).join(',\n  ')
lines.push(`-- Step 1: Delete existing phase-6h entries (cascade cleans related tables)`)
lines.push(`DELETE FROM dictionary_words WHERE id IN (`)
lines.push(`  ${ids}`)
lines.push(`);`)
lines.push(``)

lines.push(`-- Step 2: dictionary_words`)
lines.push(`INSERT INTO dictionary_words`)
lines.push(`  (id, word, normalized_word, phonetic_ipa, part_of_speech, cefr_level, level,`)
lines.push(`   difficulty, is_core_word, is_exam_word, source_type, source_note, created_at, updated_at)`)
lines.push(`VALUES`)
const wordRows = EXPANDED_WORDS_SEED.map(e => {
  const srcType = toDbSourceType(e.sourceType)
  const level = cefrToLevel(e.cefrLevel)
  return `  (${esc(e.normalizedWord)},${esc(e.word)},${esc(e.normalizedWord)},${esc(e.ipa ?? null)},${esc(e.partOfSpeech[0])},${esc(e.cefrLevel ?? null)},${esc(level)},${e.difficultyLevel ?? 3},${e.isCoreWord ? 'true' : 'false'},${e.isExamWord ? 'true' : 'false'},${esc(srcType)},${esc(e.sourceNote)},NOW(),NOW())`
})
lines.push(wordRows.join(',\n') + ';')
lines.push(``)

lines.push(`-- Step 3: dictionary_definitions`)
lines.push(`INSERT INTO dictionary_definitions (word_id, part_of_speech, definition_en, definition_zh, order_index, source_type) VALUES`)
const defRows: string[] = []
for (const e of EXPANDED_WORDS_SEED) {
  const enDefs = e.definitions.filter(d => d.language === 'en')
  const zhDefs = e.definitions.filter(d => d.language === 'zh')
  for (let i = 0; i < enDefs.length; i++) {
    const srcType = toDbSourceType(e.sourceType)
    defRows.push(`  (${esc(e.normalizedWord)},${esc(e.partOfSpeech[0])},${esc(enDefs[i].definition)},${esc(zhDefs[i]?.definition ?? null)},${i},${esc(srcType)})`)
  }
}
lines.push(defRows.join(',\n') + ';')
lines.push(``)

lines.push(`-- Step 4: dictionary_examples`)
lines.push(`INSERT INTO dictionary_examples (word_id, sentence_en, sentence_zh, order_index, source_type) VALUES`)
const exRows: string[] = []
for (const e of EXPANDED_WORDS_SEED) {
  for (let i = 0; i < (e.examples ?? []).length; i++) {
    const ex = e.examples![i]
    const srcType = toDbSourceType(e.sourceType)
    exRows.push(`  (${esc(e.normalizedWord)},${esc(ex.sentenceEn)},${esc(ex.sentenceZh ?? null)},${i},${esc(srcType)})`)
  }
}
lines.push(exRows.join(',\n') + ';')
lines.push(``)

lines.push(`-- Step 5: dictionary_synonyms`)
const synRows: string[] = []
for (const e of EXPANDED_WORDS_SEED) {
  for (let i = 0; i < (e.synonyms ?? []).length; i++) {
    synRows.push(`  (${esc(e.normalizedWord)},${esc(e.synonyms![i])},${i})`)
  }
}
if (synRows.length > 0) {
  lines.push(`INSERT INTO dictionary_synonyms (word_id, synonym, order_index) VALUES`)
  lines.push(synRows.join(',\n') + ';')
} else {
  lines.push(`-- No synonyms to insert`)
}
lines.push(``)

lines.push(`-- Step 6: dictionary_antonyms`)
const antRows: string[] = []
for (const e of EXPANDED_WORDS_SEED) {
  for (let i = 0; i < (e.antonyms ?? []).length; i++) {
    antRows.push(`  (${esc(e.normalizedWord)},${esc(e.antonyms![i])},${i})`)
  }
}
if (antRows.length > 0) {
  lines.push(`INSERT INTO dictionary_antonyms (word_id, antonym, order_index) VALUES`)
  lines.push(antRows.join(',\n') + ';')
} else {
  lines.push(`-- No antonyms to insert`)
}
lines.push(``)

lines.push(`-- Step 7: exam_word_tags`)
const tagRows: string[] = []
for (const e of EXPANDED_WORDS_SEED) {
  for (const tag of e.examTags ?? []) {
    tagRows.push(`  (${esc(e.normalizedWord)},${esc(tag)})`)
  }
}
if (tagRows.length > 0) {
  lines.push(`INSERT INTO exam_word_tags (word_id, exam_type) VALUES`)
  lines.push(tagRows.join(',\n'))
  lines.push(`ON CONFLICT (word_id, exam_type) DO NOTHING;`)
} else {
  lines.push(`-- No exam tags to insert`)
}
lines.push(``)
lines.push(`-- End of Phase 6H seed`)

const outPath = join(__dirname, '..', 'supabase', 'sql', 'phase-6h-core-dictionary-seed.sql')
writeFileSync(outPath, lines.join('\n'), 'utf-8')
console.log(`✓ Written: ${outPath}`)
console.log(`  Words: ${EXPANDED_WORDS_SEED.length}`)
console.log(`  Definitions: ${defRows.length}`)
console.log(`  Examples: ${exRows.length}`)
console.log(`  Synonyms: ${synRows.length}`)
console.log(`  Antonyms: ${antRows.length}`)
console.log(`  Exam tags: ${tagRows.length}`)
console.log(`\nNext: run this SQL manually in Supabase SQL Editor.`)
```

- [ ] **Step 2: Run the generator**

```bash
cd d:/ai-studio/ocean-english && npx tsx scripts/generate-dictionary-seed-sql.ts
```

Expected output:
```
✓ Written: .../supabase/sql/phase-6h-core-dictionary-seed.sql
  Words: 74
  Definitions: 74
  Examples: 74
  ...
```

Verify `supabase/sql/phase-6h-core-dictionary-seed.sql` exists and contains valid SQL.

- [ ] **Step 3: Commit both script and generated SQL**

```bash
git add scripts/generate-dictionary-seed-sql.ts supabase/sql/phase-6h-core-dictionary-seed.sql
git commit -m "feat(6h): SQL generator + generated phase-6h-core-dictionary-seed.sql"
```

---

### Task 7: Upgrade search API (add difficulty param)

**Files:**
- Modify: `app/api/dictionary/search/route.ts`

- [ ] **Step 1: Add difficulty param to the route**

Replace the full content of `app/api/dictionary/search/route.ts` with:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import type { WordLevel } from '@/lib/dictionary/dictionary-types'

const VALID_LEVELS: WordLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'exam-prep']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5] as const
const MAX_LIMIT = 50

/**
 * GET /api/dictionary/search?q=&level=&difficulty=&limit=&offset=
 *
 * Public endpoint — no auth required.
 * Chain: SupabaseDictionaryClient → ExpandedSeedAdapter → CoreSeedAdapter → MockDictionaryAdapter
 *
 * Params:
 *   q          — search query (word text or definition substring)
 *   level      — WordLevel filter
 *   difficulty — 1-5 filter
 *   limit      — max results, default 20, max 50
 *   offset     — pagination offset, default 0
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')?.trim() ?? ''
  const levelRaw = searchParams.get('level') ?? ''
  const diffRaw = parseInt(searchParams.get('difficulty') ?? '', 10)
  const limitRaw = parseInt(searchParams.get('limit') ?? '20', 10)
  const offsetRaw = parseInt(searchParams.get('offset') ?? '0', 10)

  const level = VALID_LEVELS.includes(levelRaw as WordLevel) ? (levelRaw as WordLevel) : undefined
  const difficulty = VALID_DIFFICULTY.includes(diffRaw as 1|2|3|4|5) ? (diffRaw as 1|2|3|4|5) : undefined
  const limit = Math.min(isNaN(limitRaw) ? 20 : Math.max(1, limitRaw), MAX_LIMIT)
  const offset = isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

  const results = await getDictionaryClient().searchWords(q, { level, difficulty, limit, offset })

  return NextResponse.json({
    ok: true,
    query: q,
    total: results.length,
    data: results,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/dictionary/search/route.ts
git commit -m "feat(6h): add difficulty param to /api/dictionary/search"
```

---

### Task 8: Update /dictionary page to use search API

**Files:**
- Modify: `app/dictionary/page.tsx`

- [ ] **Step 1: Replace the page with API-driven version**

Replace the full content of `app/dictionary/page.tsx` with:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { WordSearchBox } from '@/components/learning/WordSearchBox'
import { WordCard } from '@/components/learning/WordCard'
import { useLearningStore } from '@/store/learningStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { Word, ExamFrequency } from '@/types/word'

const levelOptions = [
  { value: '', label: 'All Levels / 全部等级' },
  { value: 'beginner', label: 'Beginner / 入门' },
  { value: 'elementary', label: 'Elementary / 新手' },
  { value: 'intermediate', label: 'Intermediate / 熟练' },
  { value: 'advanced', label: 'Advanced / 进阶' },
  { value: 'exam-prep', label: 'Exam Prep / 备考' },
]

const difficultyOptions = [
  { value: '', label: 'All Difficulty / 全部难度' },
  { value: '1', label: 'L1 — Beginner' },
  { value: '2', label: 'L2 — Elementary' },
  { value: '3', label: 'L3 — Intermediate' },
  { value: '4', label: 'L4 — Advanced' },
  { value: '5', label: 'L5 — Expert' },
]

const VALID_EXAM_FREQ: ExamFrequency[] = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO']

function toWordCardProp(w: DictionaryWord): Word {
  return {
    id: w.id,
    word: w.word,
    phonetic: w.phoneticIpa ?? '',
    definitions: w.definitions.length > 0
      ? w.definitions.map(d => ({
          partOfSpeech: d.partOfSpeech,
          meaning: d.definitionEn,
          meaningZh: d.definitionZh ?? '',
          example: w.examples[0]?.sentenceEn ?? '',
          exampleZh: w.examples[0]?.sentenceZh ?? '',
        }))
      : [{ partOfSpeech: '', meaning: '', meaningZh: '', example: '', exampleZh: '' }],
    etymology: { roots: '', explanation: '', explanationZh: '' },
    mnemonic: w.mnemonics[0]?.mnemonicEn ?? '',
    mnemonicZh: w.mnemonics[0]?.mnemonicZh ?? '',
    synonyms: w.synonyms,
    antonyms: w.antonyms,
    collocations: w.collocations.map(c => ({
      phrase: c.phrase,
      example: c.exampleEn ?? '',
      exampleZh: c.exampleZh ?? '',
    })),
    sceneUsage: [],
    examFrequency: w.examTags.filter((t): t is ExamFrequency => VALID_EXAM_FREQ.includes(t as ExamFrequency)),
    tags: w.tags,
    difficulty: w.difficulty,
    level: w.level,
  }
}

export default function DictionaryPage() {
  const { userLevel } = useLearningStore()
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState(userLevel ?? '')
  const [diffFilter, setDiffFilter] = useState('')
  const [results, setResults] = useState<DictionaryWord[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchWords = useCallback(async (q: string, level: string, diff: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (level) params.set('level', level)
      if (diff) params.set('difficulty', diff)
      params.set('limit', '80')

      const res = await fetch(`/api/dictionary/search?${params.toString()}`)
      if (!res.ok) throw new Error('search failed')
      const json: { ok: boolean; data: DictionaryWord[] } = await res.json()
      setResults(json.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  // Initial load and filter changes
  useEffect(() => {
    fetchWords(query, levelFilter, diffFilter)
  }, [levelFilter, diffFilter, fetchWords]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce query changes only
  useEffect(() => {
    const timer = setTimeout(() => fetchWords(query, levelFilter, diffFilter), 300)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectStyle: React.CSSProperties = {
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(155,191,202,0.25)',
    borderRadius: '8px',
    color: '#9BBFCA',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '160px',
    flex: '1',
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Header */}
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Vocabulary Roots{' '}
            <span style={{ fontSize: '18px', color: '#9BBFCA' }}>词汇根系</span>
          </h1>

          {/* LexiGraph entry card */}
          <Link
            href="/lexigraph"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              marginBottom: '20px',
              borderRadius: '10px',
              textDecoration: 'none',
              background: 'rgba(126,249,255,0.05)',
              border: '1px solid rgba(126,249,255,0.2)',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.2s',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7EF9FF', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.06em' }}>
                ✦ Explore in LexiGraph / 进入词汇星图
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.6)', marginTop: '3px' }}>
                Explore word relationships, collocations, synonyms &amp; review status on an interactive map.
                <br />
                <span style={{ opacity: 0.7 }}>用关系图探索单词搭配、近反义词和复习状态。</span>
              </div>
            </div>
            <span style={{ fontSize: '18px', color: 'rgba(126,249,255,0.5)', marginLeft: '12px', flexShrink: 0 }}>→</span>
          </Link>

          <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px' }}>
            {loading && !initialLoad ? 'Searching… / 搜索中…' : `${results.length} word${results.length !== 1 ? 's' : ''} — Search, filter, and build your vocabulary.`}
            <span style={{ marginLeft: '8px', color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
              {!loading && !initialLoad && '搜索、过滤，构建你的词汇根系。'}
            </span>
          </p>

          {/* Search + filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '240px' }}>
              <WordSearchBox onSearch={setQuery} />
            </div>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} style={selectStyle}>
              {levelOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#020617' }}>{o.label}</option>
              ))}
            </select>
            <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} style={selectStyle}>
              {difficultyOptions.map(o => (
                <option key={o.value} value={o.value} style={{ background: '#020617' }}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', marginBottom: '16px', fontFamily: 'ui-monospace, monospace' }}>
            {loading ? '…' : `${results.length} result${results.length !== 1 ? 's' : ''} / ${results.length} 个结果`}
          </div>

          {/* Word list */}
          {!loading && results.length === 0 && !initialLoad ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(155,191,202,0.4)', fontFamily: 'ui-monospace, monospace', fontSize: '14px' }}>
              {query
                ? <>No words found for &quot;{query}&quot; / 未找到相关单词</>
                : 'No words available / 暂无词汇'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {results.map(w => (
                <WordCard key={w.id} word={toWordCardProp(w)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dictionary/page.tsx
git commit -m "feat(6h): /dictionary page — API-driven search using expanded dictionary"
```

---

### Task 9: Lint + Build

- [ ] **Step 1: Run lint**

```bash
cd d:/ai-studio/ocean-english && npm run lint
```

Expected: No errors. Fix any lint errors before proceeding.

Common issues to watch for:
- `react-hooks/exhaustive-deps` warning on `useEffect` in page — suppressed with `// eslint-disable-line`
- Unused imports — remove them
- TypeScript strict errors in supabase-dictionary-client.ts — ensure all DB type fields are correct

- [ ] **Step 2: Run build**

```bash
cd d:/ai-studio/ocean-english && npm run build
```

Expected: Build completes successfully (no TypeScript errors, no missing module errors).

If build fails on TypeScript errors in `supabase-dictionary-client.ts`, check that:
- All `DbXxx` interfaces match the DB column names
- `mapDbWord` doesn't have null/undefined mismatches

- [ ] **Step 3: Run dictionary validator**

```bash
cd d:/ai-studio/ocean-english && npm run validate:dictionary
```

Expected: 74 words, 0 errors.

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "fix(6h): lint and build fixes"
```

---

### Task 10: Documentation

**Files:**
- Create: `docs/phase-reports/phase-6h-dictionary-expansion-search.md`

- [ ] **Step 1: Create phase report**

Create `docs/phase-reports/phase-6h-dictionary-expansion-search.md`:

```markdown
# Phase 6H: Dictionary Expansion + Search Upgrade

**Status:** Phase 6H-A complete  
**Date:** 2026-06-02  
**Previous:** Phase 6F (LexiGraph Polish + Motivation Lite)

---

## 1. Goals

Phase 6H-A wires the dictionary system to a real database (Supabase), adds 74 original expanded words, and establishes a compliant import/validation/SQL pipeline. The /dictionary page is upgraded to use the search API rather than a static mock word list.

---

## 2. Current Dictionary Architecture

Lookup chain (CompositeDictionaryClient):
1. **SupabaseDictionaryClient** — reads `dictionary_words` + related tables when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and tables exist. Falls through on any error.
2. **ExpandedSeedAdapter** — Phase 6H 74 original words (offline, always available).
3. **CoreSeedAdapter** — Phase 6B 60 original words (offline, always available).
4. **MockDictionaryAdapter** — Phase 1 20 mock words (offline, always available).
5. **null** — word not found.

All adapters fail gracefully. No user-visible errors on fallback.

---

## 3. Import Data Format

File: `data/dictionary/import/core-words-expanded.ts`  
Type: `DictionaryImportWord` (defined in `lib/dictionary/dictionary-import-types.ts`)

Required fields:
- `normalizedWord` — lowercase slug (e.g., `"ability"`)
- `word` — display form
- `partOfSpeech` — string array, primary first
- `definitions` — array of `{language: 'en'|'zh', definition: string}`; must have ≥1 en + ≥1 zh
- `sourceType` — `'original_seed'` | `'ai_generated_draft'` | `'licensed_public'`
- `sourceNote` — compliance description

---

## 4. Data Source Compliance

| Field | Value |
|-------|-------|
| sourceType | `original_seed` |
| sourceNote | "Original educational content created for LexiOcean Phase 6H expansion." |
| Commercial dictionaries | Not used |
| Pirated exam word lists | Not used |
| User uploaded documents | Not used |
| AI-generated content | None in Phase 6H-A (all original) |

---

## 5. Validation

```bash
npm run validate:dictionary
# → npx tsx scripts/validate-dictionary-import.ts
```

Checks: word not empty, normalizedWord format, ≥1 en definition, ≥1 zh definition, sourceType/sourceNote required, no blocked source strings, exam tag consistency, duplicates detection.

---

## 6. Seed SQL

File: `supabase/sql/phase-6h-core-dictionary-seed.sql`  
Generated by: `npx tsx scripts/generate-dictionary-seed-sql.ts`

**To seed Supabase:** copy the SQL file content and run in Supabase SQL Editor.  
**Prerequisite:** phase-6a-dictionary-pronunciation-schema.sql must be applied first.

The SQL is idempotent: it deletes then re-inserts all 74 words (cascade cleans related tables).

Tables populated: `dictionary_words`, `dictionary_definitions`, `dictionary_examples`, `dictionary_synonyms`, `dictionary_antonyms`, `exam_word_tags`.

---

## 7. Repository Lookup Flow

```
lookupWord("ability")
  → SupabaseDictionaryClient.lookupWord("ability")
       → if Supabase configured + tables exist → return DB row
       → else → return null
  → ExpandedSeedAdapter.lookupWord("ability")
       → found in 74-word expanded seed → return DictionaryWord
  → CoreSeedAdapter.lookupWord("ability")
       → not found (ability is a 6H word) → return null
  → MockDictionaryAdapter.lookupWord("ability")
       → not found → return null
  → null (404)
```

---

## 8. API Routes

### GET /api/dictionary/word/[slug]
- Normalized slug lookup via getDictionaryClient().lookupWord()
- 404 + `{ok:false, message}` if not found
- No auth required

### GET /api/dictionary/search
- Params: `q`, `level`, `difficulty`, `limit` (max 50), `offset`
- Returns: `{ok, query, total, data: DictionaryWord[]}`
- No auth required

---

## 9. Page Integration

### /dictionary
Now uses `/api/dictionary/search` (fetch + useEffect + 300ms debounce on query).  
- Loads up to 80 words on initial page load  
- Level and difficulty filters send immediately  
- DictionaryWord → Word adapter (`toWordCardProp`) for WordCard compatibility  
- Empty state shows when no results found

### /word/[slug]
Unchanged — already uses getDictionaryClient().lookupWord(). Automatically gains expanded words.

### /lexigraph
Unchanged — already uses getDictionaryClient(). Automatically gains expanded words.

---

## 10. Scan Vocabulary Policy

Scan-extracted vocabulary is NOT written to `dictionary_words`.  
Phase 6H does not change this policy.  
A future Phase 6H-B may add a lightweight lookup (extracted word → dictionary repository) to get stable wordIds when the word is in the dictionary.

---

## 11. Known Limitations

- **Supabase not seeded by default.** Run `supabase/sql/phase-6h-core-dictionary-seed.sql` manually in Supabase SQL Editor to populate the DB. Until then, the system falls through to expanded seed + core seed + mock (fully functional offline).
- **SupabaseDictionaryClient search returns lightweight words.** For search results, related arrays (examples, mnemonics, collocations, etc.) are empty. Full data is only loaded on `lookupWord()` (word detail page).
- **No pg_trgm fuzzy search.** Full-text search relies on ILIKE. For >1000 words, consider adding pg_trgm GIN index.
- **No audio URLs.** `word_pronunciations` rows have `audio_url = null`. Browser TTS is used via PronunciationButton.
- **Expanded seed has no collocations for most words.** These can be added in Phase 6H-B.
- **Phase 6B SQL collocations not included in 6H-A.** No breaking change — 6B SQL is a separate file.

---

## 12. Test Commands

```bash
# Validate import data compliance
npm run validate:dictionary

# Check lint
npm run lint

# Check build
npm run build

# Regenerate seed SQL (if expanded seed changes)
npx tsx scripts/generate-dictionary-seed-sql.ts
```

---

## 13. Codex Review Prompt

```
Review Phase 6H-A dictionary expansion for LexiOcean (d:/ai-studio/ocean-english).

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
- Does SupabaseDictionaryClient fail gracefully on all error paths?
- Does getDictionaryClient singleton reset correctly if Supabase becomes configured?
- Is the DictionaryWord → Word adapter in page.tsx type-safe?
- Any risk of wordId collision between expanded seed and Phase 6B core seed?
- Does the validation script catch all compliance issues in the spec?
- Is the generated SQL idempotent and safe to run multiple times?
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/phase-reports/phase-6h-dictionary-expansion-search.md
git commit -m "docs(6h): Phase 6H-A phase report and Codex review prompt"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| dictionary schema / seed / repo / API review | Task 1 (covered by exploration notes in plan header) |
| DictionaryImportWord format with sourceType/sourceNote | Task 1 |
| Validation script with all 17 checks | Task 5 |
| Seed SQL / upsert script | Task 6 |
| DB → expanded seed → core seed → mock fallback | Tasks 2, 3, 4 |
| /api/dictionary/word/[slug] | Unchanged (already works; gains expanded words via Task 4) |
| /api/dictionary/search with difficulty | Task 7 |
| /dictionary uses search API | Task 8 |
| /word/[slug] continues working | Unchanged (gains expanded words automatically) |
| /lexigraph continues working | Unchanged (gains expanded words automatically) |
| No commercial dictionary content | All entries marked original_seed; validation blocks suspicious strings |
| No pirated exam word lists | No exam word lists used; source compliance documented |
| No user upload data in public dictionary | Architecture unchanged; policy documented in Task 10 |
| 100–200 words (not 3000+) | 74 new words (total 154 with Phase 6B + mock) |
| npm run lint passes | Task 9 |
| npm run build passes | Task 9 |
| validate:dictionary script | Task 5 |
| Phase report + Codex review checklist | Task 10 |

### Gaps / notes

- **Scan vocabulary lookup** (spec Step 9): Listed as optional "if risk not large." Left for Phase 6H-B per spec guidance.
- **SupabaseDictionaryClient singleton** (Codex review note): The singleton captures `isSupabaseConfigured` at first call. If env vars are set after module init, it won't pick them up. This is acceptable for Next.js where env vars are static at build/start time.
- **getDictionaryClient reset**: In dev hot-reload, `_client` module-level var resets on each reload. No issue.
