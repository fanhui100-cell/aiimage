import type { ExtractedQuestion } from '@/types/document'

/**
 * Heuristically identifies question-like sentences in raw text.
 * Used as a lightweight pre-pass before AI analysis.
 * Phase 4B: Replace with AI-driven question classification.
 */
export function extractQuestionsFromText(rawText: string): ExtractedQuestion[] {
  if (!rawText || rawText.length < 20) return []

  const sentences = rawText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 500)

  const questions: ExtractedQuestion[] = []

  sentences.forEach((sentence, i) => {
    const looksLikeQuestion =
      sentence.endsWith('?') ||
      /^(what|which|who|when|where|why|how|according|based|identify|choose|select|complete|fill)\b/i.test(sentence)

    if (looksLikeQuestion) {
      questions.push({
        id: `auto-q${i + 1}`,
        type: 'unknown',
        prompt: sentence,
        sourceText: sentence,
      })
    }
  })

  // Return at most 10 auto-detected questions
  return questions.slice(0, 10)
}
