import type { DocumentAnalysisResult } from '@/types/document'

/**
 * Attempts to parse a real AI provider's text response into DocumentAnalysisResult.
 * Real AI should respond with JSON matching the DocumentAnalysisResult shape.
 * Returns null if parsing fails — callers should fall back to mock analysis.
 *
 * TODO Phase 4B: Harden parsing with Zod schema validation.
 */
export function parseAIDocumentAnalysis(
  content: string,
  meta: { fileName: string; rawText: string },
): DocumentAnalysisResult | null {
  // Try JSON parsing first
  try {
    const parsed = JSON.parse(content) as Partial<DocumentAnalysisResult>

    if (
      typeof parsed.summaryEn === 'string' &&
      Array.isArray(parsed.questions) &&
      Array.isArray(parsed.vocabulary)
    ) {
      return {
        id: `doc-${Date.now()}`,
        fileName: meta.fileName,
        fileType: parsed.fileType ?? 'text',
        rawText: meta.rawText,
        summaryEn: parsed.summaryEn,
        summaryZh: parsed.summaryZh ?? '',
        questions: parsed.questions,
        vocabulary: parsed.vocabulary,
        answerSuggestions: parsed.answerSuggestions ?? [],
        studyNotes: parsed.studyNotes ?? [],
        warnings: parsed.warnings ?? [],
        createdAt: new Date().toISOString(),
      }
    }
  } catch {
    // JSON parsing failed — fall through
  }

  // TODO Phase 4B: Add heuristic text-format parsing as secondary fallback
  return null
}
