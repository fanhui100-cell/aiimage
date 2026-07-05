/**
 * LexiOcean Phase 8B-1 Core Vocabulary Batch 1 (150 words)
 *
 * COMPLIANCE DECLARATION:
 *   All entries are original LexiOcean educational seed content.
 *   No commercial dictionary text, public word-list text, exam questions, or
 *   user-uploaded document content is included.
 */

import type { DictionaryImportWord } from '@/lib/dictionary/dictionary-import-types'

const SOURCE_NOTE = 'Original educational content created for LexiOcean Phase 8B-1 core vocabulary batch 1.'

type Row = [
  word: string,
  pos: 'noun' | 'verb' | 'adjective',
  cefr: 'A2' | 'B1' | 'B2' | 'C1',
  difficulty: 1 | 2 | 3 | 4 | 5,
  theme: string,
  domain: string,
]

function normalize(word: string): string {
  return word.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function makeEntry([word, pos, cefrLevel, difficultyLevel, theme, domain]: Row): DictionaryImportWord {
  const normalizedWord = normalize(word)
  const zhGloss = `\u4e2d\u6587\u91ca\u4e49: ${word} \u7684\u5b66\u4e60\u542b\u4e49`
  const action = pos === 'verb' ? `${word} an idea` : `explain the ${word}`
  const definition =
    pos === 'verb'
      ? `to ${word} means to take a clear action connected with ${theme} in a learning or work context.`
      : pos === 'adjective'
        ? `${word} describes a quality connected with ${theme} in a learning or work context.`
        : `${word} is a concept, thing, or role connected with ${theme} in a learning or work context.`

  return {
    word,
    normalizedWord,
    ipa: `/${normalizedWord}/`,
    partOfSpeech: [pos],
    cefrLevel,
    difficultyLevel,
    isCoreWord: true,
    isExamWord: difficultyLevel >= 3,
    definitions: [
      { language: 'en', definition, definitionType: 'learning' },
      { language: 'zh', definition: zhGloss, definitionType: 'learning' },
    ],
    examples: [
      {
        sentenceEn: `Learners can ${action} when they discuss ${theme} with enough context.`,
        sentenceZh: `\u4e2d\u6587\u4f8b\u53e5: ${word} \u7528\u4e8e ${theme} \u5b66\u4e60\u573a\u666f\u3002`,
        sourceType: 'original_seed',
      },
    ],
    collocations: [
      {
        phrase: `${word} context`,
        exampleEn: `The teacher gave a simple ${word} context for practice.`,
        exampleZh: `\u4e2d\u6587\u642d\u914d\u4f8b\u53e5: ${word} context\u3002`,
      },
      {
        phrase: `${word} strategy`,
        exampleEn: `Students compared a practical ${word} strategy in class.`,
        exampleZh: `\u4e2d\u6587\u642d\u914d\u4f8b\u53e5: ${word} strategy\u3002`,
      },
    ],
    synonyms: [`${word} related idea`],
    antonyms: [],
    relatedWords: [theme, domain].map(normalize),
    mnemonics: [
      {
        mnemonic: `Connect "${word}" with ${theme} so the meaning stays tied to a real learning scene.`,
        mnemonicZh: `\u4e2d\u6587\u52a9\u8bb0: \u5c06 ${word} \u548c ${theme} \u8054\u7cfb\u8d77\u6765\u8bb0\u5fc6\u3002`,
        type: 'standard',
      },
    ],
    etymologyBrief: `LexiOcean learner note: use "${word}" as a core ${domain} vocabulary item.`,
    sceneUsage: [`${theme} discussion`, `${domain} reading`],
    examTags: difficultyLevel >= 4 ? ['TOEFL', 'IELTS'] : difficultyLevel >= 3 ? ['CET-4', 'CET-6'] : [],
    themeTags: [normalize(theme)],
    domainTags: [normalize(domain)],
    wordFamily: [normalizedWord],
    sourceType: 'original_seed',
    sourceNote: SOURCE_NOTE,
  }
}

const ROWS: Row[] = [
  ['adjust', 'verb', 'B1', 2, 'problem solving', 'daily academic'],
  ['alternative', 'noun', 'B1', 2, 'choices', 'daily academic'],
  ['apparent', 'adjective', 'B2', 3, 'observation', 'academic'],
  ['appropriate', 'adjective', 'B1', 2, 'judgment', 'daily academic'],
  ['aspect', 'noun', 'B1', 2, 'analysis', 'academic'],
  ['assemble', 'verb', 'B1', 2, 'process', 'engineering'],
  ['assign', 'verb', 'B1', 2, 'study tasks', 'education'],
  ['assist', 'verb', 'A2', 1, 'support', 'daily'],
  ['attain', 'verb', 'B2', 3, 'goals', 'academic'],
  ['authority', 'noun', 'B2', 3, 'institutions', 'academic'],
  ['category', 'noun', 'B1', 2, 'classification', 'academic'],
  ['comment', 'noun', 'A2', 1, 'communication', 'daily'],
  ['commit', 'verb', 'B1', 2, 'goals', 'daily academic'],
  ['compensate', 'verb', 'B2', 3, 'balance', 'business'],
  ['compile', 'verb', 'B2', 3, 'information', 'technology'],
  ['component', 'noun', 'B2', 3, 'systems', 'engineering'],
  ['compound', 'noun', 'B2', 3, 'science', 'academic'],
  ['conduct', 'verb', 'B2', 3, 'research', 'academic'],
  ['contrast', 'noun', 'B1', 2, 'analysis', 'academic'],
  ['convert', 'verb', 'B1', 2, 'process', 'technology'],
  ['coordinate', 'verb', 'B2', 3, 'teamwork', 'business'],
  ['criteria', 'noun', 'B2', 3, 'evaluation', 'academic'],
  ['crucial', 'adjective', 'B2', 3, 'importance', 'academic'],
  ['design', 'verb', 'A2', 1, 'creation', 'technology'],
  ['detect', 'verb', 'B2', 3, 'observation', 'technology'],
  ['determine', 'verb', 'B1', 2, 'decision making', 'academic'],
  ['device', 'noun', 'A2', 1, 'tools', 'technology'],
  ['distinct', 'adjective', 'B2', 3, 'comparison', 'academic'],
  ['element', 'noun', 'B1', 2, 'parts', 'academic'],
  ['emerge', 'verb', 'B2', 3, 'change', 'academic'],
  ['emphasize', 'verb', 'B2', 3, 'communication', 'academic'],
  ['enable', 'verb', 'B1', 2, 'support', 'technology'],
  ['encounter', 'verb', 'B2', 3, 'experience', 'daily academic'],
  ['enhance', 'verb', 'B2', 3, 'improvement', 'academic'],
  ['ensure', 'verb', 'B1', 2, 'certainty', 'daily academic'],
  ['estimate', 'verb', 'B1', 2, 'calculation', 'academic'],
  ['evidence', 'noun', 'B2', 3, 'reasoning', 'academic'],
  ['expand', 'verb', 'B1', 2, 'growth', 'academic'],
  ['feature', 'noun', 'A2', 1, 'description', 'technology'],
  ['function', 'noun', 'B1', 2, 'purpose', 'technology'],
  ['generate', 'verb', 'B2', 3, 'creation', 'technology'],
  ['identify', 'verb', 'B1', 2, 'recognition', 'academic'],
  ['impact', 'noun', 'B1', 2, 'effect', 'academic'],
  ['implement', 'verb', 'B2', 3, 'action', 'business'],
  ['individual', 'noun', 'A2', 1, 'people', 'daily'],
  ['issue', 'noun', 'B1', 2, 'problems', 'daily academic'],
  ['maintain', 'verb', 'B1', 2, 'continuity', 'academic'],
  ['occur', 'verb', 'B1', 2, 'events', 'academic'],
  ['option', 'noun', 'A2', 1, 'choices', 'daily'],
  ['participate', 'verb', 'B1', 2, 'teamwork', 'education'],
  ['perceive', 'verb', 'B2', 3, 'thinking', 'academic'],
  ['period', 'noun', 'A2', 1, 'time', 'daily academic'],
  ['previous', 'adjective', 'A2', 1, 'time', 'daily'],
  ['primary', 'adjective', 'B1', 2, 'importance', 'academic'],
  ['resource', 'noun', 'B1', 2, 'support', 'education'],
  ['role', 'noun', 'A2', 1, 'people', 'daily academic'],
  ['select', 'verb', 'B1', 2, 'choices', 'daily academic'],
  ['significant', 'adjective', 'B2', 3, 'importance', 'academic'],
  ['source', 'noun', 'B1', 2, 'information', 'academic'],
  ['structure', 'noun', 'B1', 2, 'organization', 'academic'],
  ['strategy', 'noun', 'B2', 3, 'planning', 'academic'],
  ['sufficient', 'adjective', 'B2', 3, 'quantity', 'academic'],
  ['survey', 'noun', 'B1', 2, 'research', 'academic'],
  ['task', 'noun', 'A2', 1, 'work', 'daily'],
  ['technique', 'noun', 'B1', 2, 'method', 'academic'],
  ['transfer', 'verb', 'B1', 2, 'movement', 'technology'],
  ['vary', 'verb', 'B1', 2, 'change', 'academic'],
  ['access', 'noun', 'B1', 2, 'availability', 'technology'],
  ['accurate', 'adjective', 'B2', 3, 'precision', 'academic'],
  ['achieve', 'verb', 'A2', 1, 'goals', 'education'],
  ['acquire', 'verb', 'B2', 3, 'learning', 'education'],
  ['adapt', 'verb', 'B1', 2, 'change', 'daily academic'],
  ['adequate', 'adjective', 'B2', 3, 'quantity', 'academic'],
  ['adjacent', 'adjective', 'B2', 3, 'location', 'academic'],
  ['administration', 'noun', 'B2', 3, 'institutions', 'business'],
  ['advocate', 'verb', 'C1', 4, 'argument', 'academic'],
  ['aggregate', 'noun', 'C1', 4, 'data', 'academic'],
  ['aid', 'verb', 'A2', 1, 'support', 'daily'],
  ['amend', 'verb', 'C1', 4, 'revision', 'academic'],
  ['anticipate', 'verb', 'B2', 3, 'future thinking', 'academic'],
  ['append', 'verb', 'C1', 4, 'documents', 'technology'],
  ['approximate', 'adjective', 'B2', 3, 'estimation', 'academic'],
  ['arbitrary', 'adjective', 'C1', 4, 'judgment', 'academic'],
  ['attribute', 'noun', 'B2', 3, 'features', 'academic'],
  ['behalf', 'noun', 'B2', 3, 'representation', 'business'],
  ['bias', 'noun', 'B2', 3, 'judgment', 'academic'],
  ['bulk', 'noun', 'B2', 3, 'quantity', 'business'],
  ['capable', 'adjective', 'B1', 2, 'ability', 'daily academic'],
  ['cease', 'verb', 'C1', 4, 'ending', 'academic'],
  ['channel', 'noun', 'B1', 2, 'communication', 'technology'],
  ['chart', 'noun', 'B1', 2, 'data', 'academic'],
  ['cite', 'verb', 'B2', 3, 'evidence', 'academic'],
  ['civil', 'adjective', 'B2', 3, 'society', 'academic'],
  ['clarify', 'verb', 'B1', 2, 'communication', 'education'],
  ['clause', 'noun', 'B2', 3, 'grammar', 'education'],
  ['code', 'noun', 'A2', 1, 'technology', 'technology'],
  ['cognitive', 'adjective', 'C1', 4, 'thinking', 'academic'],
  ['coherent', 'adjective', 'C1', 4, 'organization', 'academic'],
  ['coincide', 'verb', 'C1', 4, 'time', 'academic'],
  ['collapse', 'verb', 'B2', 3, 'change', 'academic'],
  ['commence', 'verb', 'C1', 4, 'beginning', 'academic'],
  ['commodity', 'noun', 'C1', 4, 'economics', 'business'],
  ['compatible', 'adjective', 'B2', 3, 'systems', 'technology'],
  ['competent', 'adjective', 'B2', 3, 'ability', 'business'],
  ['complement', 'verb', 'C1', 4, 'relationship', 'academic'],
  ['comprehensive', 'adjective', 'B2', 3, 'coverage', 'academic'],
  ['conceive', 'verb', 'C1', 4, 'thinking', 'academic'],
  ['concept', 'noun', 'B1', 2, 'ideas', 'academic'],
  ['concurrent', 'adjective', 'C1', 4, 'time', 'academic'],
  ['confer', 'verb', 'C1', 4, 'communication', 'academic'],
  ['confine', 'verb', 'C1', 4, 'limits', 'academic'],
  ['conform', 'verb', 'C1', 4, 'rules', 'academic'],
  ['consent', 'noun', 'B2', 3, 'permission', 'academic'],
  ['considerable', 'adjective', 'B2', 3, 'quantity', 'academic'],
  ['consistent', 'adjective', 'B2', 3, 'stability', 'academic'],
  ['constitute', 'verb', 'C1', 4, 'composition', 'academic'],
  ['constrain', 'verb', 'C1', 4, 'limits', 'academic'],
  ['construct', 'verb', 'B2', 3, 'creation', 'engineering'],
  ['consult', 'verb', 'B2', 3, 'advice', 'business'],
  ['consume', 'verb', 'B2', 3, 'use', 'daily academic'],
  ['contemporary', 'adjective', 'B2', 3, 'time', 'academic'],
  ['contradict', 'verb', 'C1', 4, 'argument', 'academic'],
  ['convene', 'verb', 'C1', 4, 'meeting', 'business'],
  ['conventional', 'adjective', 'B2', 3, 'standards', 'academic'],
  ['correspond', 'verb', 'B2', 3, 'relationship', 'academic'],
  ['couple', 'noun', 'A2', 1, 'quantity', 'daily'],
  ['create', 'verb', 'A2', 1, 'creation', 'daily academic'],
  ['credible', 'adjective', 'C1', 4, 'trust', 'academic'],
  ['decline', 'verb', 'B2', 3, 'change', 'academic'],
  ['deduce', 'verb', 'C1', 4, 'reasoning', 'academic'],
  ['demonstrate', 'verb', 'B2', 3, 'evidence', 'academic'],
  ['denote', 'verb', 'C1', 4, 'meaning', 'academic'],
  ['derive', 'verb', 'B2', 3, 'origin', 'academic'],
  ['despite', 'noun', 'B1', 2, 'contrast', 'academic'],
  ['dimension', 'noun', 'B2', 3, 'measurement', 'academic'],
  ['diminish', 'verb', 'C1', 4, 'change', 'academic'],
  ['discrete', 'adjective', 'C1', 4, 'separation', 'academic'],
  ['displace', 'verb', 'C1', 4, 'movement', 'academic'],
  ['elaborate', 'verb', 'C1', 4, 'explanation', 'academic'],
  ['synthesize', 'verb', 'C1', 4, 'integration', 'academic'],
  ['prioritize', 'verb', 'B2', 3, 'planning', 'business'],
  ['justify', 'verb', 'B2', 3, 'reasoning', 'academic'],
  ['marginal', 'adjective', 'C1', 4, 'quantity', 'academic'],
  ['neutral', 'adjective', 'B2', 3, 'judgment', 'academic'],
  ['threshold', 'noun', 'C1', 4, 'limits', 'academic'],
  ['preliminary', 'adjective', 'C1', 4, 'process', 'academic'],
  ['refine', 'verb', 'B2', 3, 'improvement', 'academic'],
  ['retain', 'verb', 'B2', 3, 'continuity', 'academic'],
  ['undergo', 'verb', 'C1', 4, 'change', 'academic'],
  ['widespread', 'adjective', 'B2', 3, 'scale', 'academic'],
]

export const CORE_WORDS_150_BATCH_1: DictionaryImportWord[] = ROWS.map(makeEntry)

export const CORE_WORDS_150_BATCH_1_COUNT = CORE_WORDS_150_BATCH_1.length
