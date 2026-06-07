import { CORE_WORDS_SEED } from '@/data/dictionary/core-words-seed'
import { CORE_WORDS_150_BATCH_1 } from '@/data/dictionary/import/core-words-150-batch-1'
import { CORE_WORDS_500_BATCH_2 } from '@/data/dictionary/import/core-words-500-batch-2'
import { EXPANDED_WORDS_SEED } from '@/data/dictionary/import/core-words-expanded'
import { ORIGINAL_VOCAB_DRILL_LITE } from '@/data/question-bank/original-vocab-drill-lite'

const allowedSourceTypes = new Set([
  'original_curated',
  'ai_generated_practice',
  'scan_private_practice',
  'exam_tagged_practice',
])

const blockedStrings = [
  'cambridge',
  'oxford',
  'longman',
  'collins',
  'merriam',
  'vocabulary.com',
  'official exam',
  'real exam',
  'past paper',
  'pirated',
  'copyrighted',
  'user upload',
  'scan public',
  'public question bank',
]

function norm(value: string): string {
  return value.toLowerCase().trim()
}

const dictionaryIds = new Set<string>([
  ...CORE_WORDS_SEED.map((word) => word.id),
  ...EXPANDED_WORDS_SEED.map((word) => word.normalizedWord),
  ...CORE_WORDS_150_BATCH_1.map((word) => word.normalizedWord),
  ...CORE_WORDS_500_BATCH_2.map((word) => word.normalizedWord),
])

const errors: string[] = []
const warnings: string[] = []
const ids = new Set<string>()

for (const item of ORIGINAL_VOCAB_DRILL_LITE) {
  if (!item.id.trim()) errors.push('Question has empty id.')
  if (ids.has(item.id)) errors.push(`Duplicate question id: ${item.id}`)
  ids.add(item.id)

  if (!item.prompt.trim()) errors.push(`${item.id}: prompt is empty.`)
  if (!item.explanation.trim()) errors.push(`${item.id}: explanation is empty.`)
  if (!item.sourceNote.trim()) errors.push(`${item.id}: sourceNote is empty.`)
  if (!allowedSourceTypes.has(item.sourceType)) errors.push(`${item.id}: invalid sourceType ${item.sourceType}.`)
  if (!dictionaryIds.has(item.wordId)) errors.push(`${item.id}: wordId ${item.wordId} is not in known seed dictionaries.`)
  if (item.normalizedWord !== item.wordId) warnings.push(`${item.id}: normalizedWord differs from wordId.`)
  if (item.difficultyLevel < 1 || item.difficultyLevel > 5) errors.push(`${item.id}: invalid difficultyLevel.`)
  if (item.choices.length !== 4) errors.push(`${item.id}: must have exactly 4 choices.`)
  if (!item.choices.some((choice) => choice.id === item.answer)) errors.push(`${item.id}: answer does not match a choice id.`)
  if (new Set(item.choices.map((choice) => choice.id)).size !== item.choices.length) {
    errors.push(`${item.id}: duplicate choice ids.`)
  }
  if (new Set(item.choices.map((choice) => norm(choice.text))).size !== item.choices.length) {
    errors.push(`${item.id}: duplicate choice text.`)
  }
  if (!item.skillTags.includes('vocabulary_drill')) {
    errors.push(`${item.id}: missing vocabulary_drill skill tag.`)
  }

  const textForScan = [
    item.id,
    item.prompt,
    item.promptZh ?? '',
    item.explanation,
    item.explanationZh ?? '',
    item.sourceNote,
    ...item.choices.map((choice) => choice.text),
    ...item.examTags,
    ...item.themeTags,
    ...item.skillTags,
  ].join(' ').toLowerCase()

  for (const blocked of blockedStrings) {
    if (textForScan.includes(blocked)) {
      errors.push(`${item.id}: contains blocked compliance string "${blocked}".`)
    }
  }
}

console.log(`Question bank validation: ${ORIGINAL_VOCAB_DRILL_LITE.length} questions`)
console.log(`Known dictionary ids: ${dictionaryIds.size}`)
console.log(`Warnings: ${warnings.length}`)
for (const warning of warnings) console.warn(`WARN ${warning}`)
console.log(`Errors: ${errors.length}`)
for (const error of errors) console.error(`ERROR ${error}`)

if (errors.length > 0) {
  process.exit(1)
}
