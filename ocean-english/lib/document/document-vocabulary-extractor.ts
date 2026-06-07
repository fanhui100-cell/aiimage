import type { ExtractedVocabulary } from '@/types/document'

// Common English function words to skip
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it', 'its',
  'he', 'she', 'they', 'we', 'you', 'i', 'me', 'him', 'her', 'us', 'them',
  'not', 'no', 'nor', 'so', 'yet', 'as', 'if', 'then', 'than', 'also',
])

/**
 * Extracts candidate vocabulary words from raw text for human review.
 * Favors longer, less common words (good candidates for English learning).
 * Phase 4B: Augment with word frequency corpus lookup.
 */
export function extractVocabularyCandidates(rawText: string, maxWords = 15): ExtractedVocabulary[] {
  if (!rawText || rawText.length < 10) return []

  const wordPattern = /\b[a-zA-Z]{5,}\b/g
  const matches = rawText.matchAll(wordPattern)

  const wordContexts = new Map<string, string>()

  for (const match of matches) {
    const word = match[0]
    const lower = word.toLowerCase()
    if (STOP_WORDS.has(lower) || wordContexts.has(lower)) continue

    // Capture a small context window around the word
    const start = Math.max(0, (match.index ?? 0) - 30)
    const end = Math.min(rawText.length, (match.index ?? 0) + word.length + 30)
    wordContexts.set(lower, rawText.slice(start, end).trim())
  }

  // Sort by word length descending (longer words tend to be more advanced)
  const candidates = Array.from(wordContexts.entries())
    .sort(([a], [b]) => b.length - a.length)
    .slice(0, maxWords)

  return candidates.map(([word, context]) => ({
    word,
    context: `...${context}...`,
    difficulty: classifyDifficulty(word),
    shouldReview: word.length >= 8,
  }))
}

function classifyDifficulty(word: string): ExtractedVocabulary['difficulty'] {
  if (word.length <= 5) return 'beginner'
  if (word.length <= 7) return 'elementary'
  if (word.length <= 9) return 'intermediate'
  if (word.length <= 11) return 'advanced'
  return 'exam'
}
