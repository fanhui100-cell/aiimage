import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

import {
  getQuestionFetchWindow,
  normalizeQuestionRowsForClient,
  questionTypeAliases,
} from '../lib/question-bank/question-api-utils'
import {
  applyQuestionBankCorrectAnswers,
  buildQuizAttemptRows,
  type QuizAttemptPayload,
} from '../lib/sync/quiz-history-utils'
import {
  buildStudyProgressUpsertRow,
  type StudyProgressDbRow,
} from '../lib/sync/study-progress-utils'
import {
  buildPreferencesUpsertRow,
  type PreferencesDbRow,
} from '../lib/sync/preferences-utils'
import {
  buildWrongAnswerRows,
  type WrongAnswerPayload,
} from '../lib/sync/wrong-answer-utils'
import {
  buildMigratedQuizAttemptRows,
  type MigrationQuizAttemptPayload,
} from '../lib/migration/quiz-migration-utils'
import { resolveChatMessageCount } from '../lib/sync/chat-message-utils'
import {
  collectRecommendedWords,
  normalizeRecommendationExclude,
} from '../lib/dictionary/recommendation'
import { collectDictionarySearchResults } from '../lib/dictionary/search-utils'
import {
  collectAllDictionaryWordsFromClient,
  createDictionaryClientFromAdapters,
} from '../lib/dictionary/dictionary-client'
import type { DictionaryClient, DictionaryWord, WordSearchOptions } from '../lib/dictionary/dictionary-types'
import { mapExamKeyToTag } from '../lib/dictionary/exam-tag-map'
import { resolveAIProviderName } from '../lib/ai/ai-config'
import { createAIClient } from '../lib/ai/ai-client'
import { MockProvider } from '../lib/ai/providers/mock-provider'

function makeWord(index: number): DictionaryWord {
  const id = `word-${index}`

  return {
    id,
    word: id,
    phoneticIpa: null,
    partOfSpeech: null,
    cefrLevel: null,
    level: 'intermediate',
    difficulty: 3,
    isCore: false,
    isExamWord: false,
    examTags: [],
    tags: [],
    frequencyRank: null,
    sourceType: 'original',
    sourceNote: null,
    definitions: [],
    examples: [],
    etymology: null,
    mnemonics: [],
    synonyms: [],
    antonyms: [],
    collocations: [],
    sceneUsages: [],
    pronunciations: [],
    createdAt: '',
    updatedAt: '',
  }
}

class PagingDictionaryClient implements DictionaryClient {
  readonly calls: Array<{ offset: number; limit: number }> = []

  constructor(
    private readonly words: DictionaryWord[],
    readonly isLive = true,
    private readonly delayMs = 0,
  ) {}

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    return this.words.find((word) => word.id === slug) ?? null
  }

  async searchWords(_query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs))
    }

    const offset = options?.offset ?? 0
    const limit = options?.limit ?? 20

    this.calls.push({ offset, limit })

    return this.words.slice(offset, offset + limit)
  }

  async getWordsByLevel(): Promise<DictionaryWord[]> {
    return []
  }

  async getCoreWords(): Promise<DictionaryWord[]> {
    return []
  }

}

async function testAllDictionaryWordsPaginatesPastApiPageLimit() {
  const words = Array.from({ length: 2305 }, (_, index) => makeWord(index))
  const client = new PagingDictionaryClient(words)

  const result = await collectAllDictionaryWordsFromClient(client, 1000)

  assert.equal(result.length, 2305)
  assert.deepEqual(
    client.calls,
    [
      { offset: 0, limit: 1000 },
      { offset: 1000, limit: 1000 },
      { offset: 2000, limit: 1000 },
    ],
  )
}

async function testAllDictionaryWordsUsesExtendedTimeoutForSlowLiveAdapter() {
  const liveWords = Array.from({ length: 205 }, (_, index) => makeWord(index))
  const seedWords = [makeWord(9000)]
  const live = new PagingDictionaryClient(liveWords, true, 35)
  const seed = new PagingDictionaryClient(seedWords, false)
  const client = createDictionaryClientFromAdapters([live, seed])

  const result = await collectAllDictionaryWordsFromClient(client, 100, 1000, 200)

  assert.equal(result.length, 205)
  assert.equal(result[0].id, 'word-0')
  assert.equal(result.at(-1)?.id, 'word-204')
  assert.deepEqual(
    live.calls,
    [
      { offset: 0, limit: 100 },
      { offset: 100, limit: 100 },
      { offset: 200, limit: 100 },
    ],
  )
  assert.deepEqual(seed.calls, [])
}

function testExamKeyMappingAcceptsNormalizedTagsAndSat() {
  assert.equal(mapExamKeyToTag('CET4'), 'CET-4')
  assert.equal(mapExamKeyToTag('CET-4'), 'CET-4')
  assert.equal(mapExamKeyToTag('SAT'), 'SAT')
  assert.equal(mapExamKeyToTag('casual'), null)
}

function testQuestionApiUsesStableWindowsAndNormalizesTypes() {
  assert.deepEqual(getQuestionFetchWindow(12), { from: 0, to: 95 })
  assert.deepEqual(questionTypeAliases('def_to_word'), [
    'def_to_word',
    'definition_to_word',
    'zh_definition_to_word',
  ])
  assert.deepEqual(
    normalizeQuestionRowsForClient([
      { id: 'q1', type: 'definition_to_word', normalized_word: 'adjust' },
      { id: 'q2', type: 'zh_definition_to_word', normalized_word: 'alternative' },
      { id: 'q3', type: 'cet_cloze', normalized_word: 'coherent' },
    ]),
    [
      { id: 'q1', type: 'def_to_word', normalized_word: 'adjust' },
      { id: 'q2', type: 'def_to_word', normalized_word: 'alternative' },
      { id: 'q3', type: 'cet_cloze', normalized_word: 'coherent' },
    ],
  )
}

function testQuizHistoryRowsKeepCorrectAnswer() {
  const attempts: QuizAttemptPayload[] = [
    {
      questionId: 'q1',
      wordId: 'coherent',
      word: 'coherent',
      userAnswer: 'unclear',
      correctAnswer: 'logical and consistent',
      correct: false,
      timestamp: 1_700_000_000_000,
    },
    {
      questionId: 'q2',
      wordId: 'adapt',
      word: 'adapt',
      userAnswer: 'adapt',
      correct: true,
      timestamp: 1_700_000_001_000,
    },
  ]

  const rows = buildQuizAttemptRows('session-db-id', 'user-id', attempts)

  assert.equal(rows[0].correct_answer, 'logical and consistent')
  assert.equal(rows[1].correct_answer, 'adapt')

  const hydrated = applyQuestionBankCorrectAnswers(
    [{ ...attempts[0], correctAnswer: undefined }],
    [{
      id: 'q1',
      answer: 'b',
      answer_text: null,
      choices: [
        { id: 'a', text: 'unclear' },
        { id: 'b', text: 'logical and consistent' },
      ],
    }],
  )

  assert.equal(
    buildQuizAttemptRows('session-db-id', 'user-id', hydrated)[0].correct_answer,
    'logical and consistent',
  )
}

function testStudyProgressPatchPreservesExistingValues() {
  const existing: StudyProgressDbRow = {
    total_words_learned: 42,
    current_streak: 3,
    longest_streak: 9,
    total_xp: 1200,
    last_study_date: '2026-06-13',
    level_progress: { lv3: 0.7 },
  }

  const row = buildStudyProgressUpsertRow(
    'user-id',
    { currentStreak: 4 },
    existing,
    new Date('2026-06-14T00:00:00.000Z'),
  )

  assert.equal(row.current_streak, 4)
  assert.equal(row.total_words_learned, 42)
  assert.equal(row.longest_streak, 9)
  assert.equal(row.total_xp, 1200)
  assert.equal(row.last_study_date, '2026-06-13')
  assert.deepEqual(row.level_progress, { lv3: 0.7 })
  // 周榜：无 totalXp 变化 + existing 无 week_start → 本周从 0 起、week_start = 当周周一
  assert.equal(row.week_start, '2026-06-08')
  assert.equal(row.week_xp, 0)
}

function testWeekXpAccumulatesAndResets() {
  // 同周累加：delta = 1120-1000 = 120，week_xp = 50 + 120
  const sameWeek = buildStudyProgressUpsertRow(
    'user-id', { totalXp: 1120 },
    { total_xp: 1000, week_xp: 50, week_start: '2026-06-08' },
    new Date('2026-06-10T00:00:00.000Z'),
  )
  assert.equal(sameWeek.week_xp, 170)
  assert.equal(sameWeek.week_start, '2026-06-08')
  // 跨周归零：上周 week_start 不同 → 仅记本次 delta = 1030-1000 = 30
  const newWeek = buildStudyProgressUpsertRow(
    'user-id', { totalXp: 1030 },
    { total_xp: 1000, week_xp: 999, week_start: '2026-06-01' },
    new Date('2026-06-10T00:00:00.000Z'),
  )
  assert.equal(newWeek.week_xp, 30)
  assert.equal(newWeek.week_start, '2026-06-08')
}

function testPreferencesPatchPreservesExistingValues() {
  const existing: PreferencesDbRow = {
    level: 'exam-prep',
    numeric_level: 4,
    daily_goal: 20,
    ui_language: 'bilingual',
  }

  const row = buildPreferencesUpsertRow(
    'user-id',
    { numericLevel: 5 },
    existing,
    new Date('2026-06-14T00:00:00.000Z'),
  )

  assert.equal(row.level, 'exam-prep')
  assert.equal(row.numeric_level, 5)
  assert.equal(row.daily_goal, 20)
  assert.equal(row.ui_language, 'bilingual')
}

function testWrongAnswerRowsDedupeRetries() {
  const attempts: Array<WrongAnswerPayload | null | Record<string, unknown>> = [
    {
      wordId: 'coherent',
      word: 'coherent',
      question: 'Choose the meaning',
      userAnswer: 'unclear',
      correctAnswer: 'logical and consistent',
      explanation: '',
      timestamp: 1_700_000_000_000,
    },
    {
      wordId: 'coherent',
      word: 'coherent',
      question: 'Choose the meaning',
      userAnswer: 'unclear',
      correctAnswer: 'logical and consistent',
      explanation: '',
      timestamp: 1_700_000_000_000,
    },
    null,
    { wordId: 'missing-question', timestamp: 1_700_000_000_001 },
  ]

  const rows = buildWrongAnswerRows('user-id', attempts)

  assert.equal(rows.length, 1)
  assert.equal(rows[0].dedupe_key, 'quiz:coherent:1700000000000')
}

function testMigratedQuizAttemptsKeepCorrectAnswer() {
  const attempts: MigrationQuizAttemptPayload[] = [
    {
      questionId: 'q1',
      wordId: 'coherent',
      word: 'coherent',
      userAnswer: 'unclear',
      correct: false,
      timestamp: 1_700_000_000_000,
    },
  ]
  const rows = buildMigratedQuizAttemptRows(
    'session-db-id',
    'user-id',
    attempts,
    [{
      id: 'q1',
      answer: 'b',
      answer_text: null,
      choices: [
        { id: 'a', text: 'unclear' },
        { id: 'b', text: 'logical and consistent' },
      ],
    }],
  )

  assert.equal(rows[0].correct_answer, 'logical and consistent')
}

function testChatMessageCountUsesExistingCount() {
  assert.equal(resolveChatMessageCount(8, 2), 10)
  assert.equal(resolveChatMessageCount(null, 2), 2)
}

async function testRecommendationPaginationAndPostExcludeSupport() {
  const words = Array.from({ length: 205 }, (_, index) => ({
    ...makeWord(index),
    cefrLevel: 'B2' as const,
    levels: [3],
    frequencyRank: index,
  }))
  const client = new PagingDictionaryClient(words)
  const exclude = normalizeRecommendationExclude([
    ...Array.from({ length: 200 }, (_, index) => `word-${index}`),
    '',
  ])

  const picked = await collectRecommendedWords(client, {
    band: 5,
    level: 3,
    limit: 3,
    exclude,
  })

  assert.deepEqual(client.calls, [
    { offset: 0, limit: 200 },
    { offset: 200, limit: 200 },
  ])
  assert.deepEqual(picked.map((word) => word.id), ['word-200', 'word-201', 'word-202'])
}

async function testDictionarySearchCollectsTrueFilteredTotal() {
  const words = Array.from({ length: 205 }, (_, index) => ({
    ...makeWord(index),
    cefrLevel: index < 204 ? 'B2' as const : 'C1' as const,
    frequencyRank: index,
  }))
  const client = new PagingDictionaryClient(words)

  const result = await collectDictionarySearchResults(client, {
    query: '',
    limit: 3,
    offset: 201,
    cefr: 'B2',
  })

  assert.equal(result.total, 204)
  assert.deepEqual(result.data.map((word) => word.id), ['word-201', 'word-202', 'word-203'])
  assert.deepEqual(client.calls, [
    { offset: 0, limit: 500 },
  ])
}

function testRealAiProvidersAreOptInUntilImplemented() {
  assert.equal(resolveAIProviderName({ AI_PROVIDER: 'openai' }), 'mock')
  assert.equal(resolveAIProviderName({ AI_PROVIDER: 'openai', AI_ENABLE_REAL_PROVIDERS: 'true' }), 'openai')
  // 即便 env 选中未实装的真实 provider，工厂也回退 mock（不抛 notImplemented / 不 500）
  assert.ok(createAIClient('openai') instanceof MockProvider)
  assert.ok(createAIClient('anthropic') instanceof MockProvider)
  assert.ok(createAIClient('gemini') instanceof MockProvider)
  assert.ok(createAIClient('mock') instanceof MockProvider)
}

function source(path: string): string {
  return readFileSync(path, 'utf8')
}

function testStudyGroupSecuritySqlAvoidsPolicyRecursion() {
  const sql = source('supabase/sql/p3-study-groups-security.sql')

  assert.match(sql, /DROP POLICY IF EXISTS "study_groups_read" ON study_groups/)
  assert.match(sql, /public\.is_group_member\(study_groups\.id,\s*auth\.uid\(\)\)/)
  assert.doesNotMatch(sql, /FROM group_members m\s+WHERE m\.group_id = study_groups\.id/)
}

function testInviteCodeInputAndRpcNormalizeCase() {
  const groupsScreen = source('components/screens/GroupsScreen.tsx')
  const sql = source('supabase/sql/p3-study-groups-security.sql')

  assert.match(groupsScreen, /\.toUpperCase\(\)/)
  assert.match(sql, /upper\(btrim\(code\)\)/)
}

function testReportTooltipDoesNotUseDangerousHtml() {
  const reportScreen = source('components/screens/ReportScreen.tsx')

  assert.doesNotMatch(reportScreen, /dangerouslySetInnerHTML/)
}

async function main() {
  await testAllDictionaryWordsPaginatesPastApiPageLimit()
  await testAllDictionaryWordsUsesExtendedTimeoutForSlowLiveAdapter()
  testExamKeyMappingAcceptsNormalizedTagsAndSat()
  testQuestionApiUsesStableWindowsAndNormalizesTypes()
  testQuizHistoryRowsKeepCorrectAnswer()
  testStudyProgressPatchPreservesExistingValues()
  testWeekXpAccumulatesAndResets()
  testPreferencesPatchPreservesExistingValues()
  testWrongAnswerRowsDedupeRetries()
  testMigratedQuizAttemptsKeepCorrectAnswer()
  testChatMessageCountUsesExistingCount()
  await testRecommendationPaginationAndPostExcludeSupport()
  await testDictionarySearchCollectsTrueFilteredTotal()
  testRealAiProvidersAreOptInUntilImplemented()
  testStudyGroupSecuritySqlAvoidsPolicyRecursion()
  testInviteCodeInputAndRpcNormalizeCase()
  testReportTooltipDoesNotUseDangerousHtml()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
