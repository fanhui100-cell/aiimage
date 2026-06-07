export type QuestionSourceType =
  | 'original_curated'
  | 'ai_generated_practice'
  | 'scan_private_practice'
  | 'exam_tagged_practice'

/** Phase 8C — question lifecycle status */
export type QuestionStatus = 'active' | 'draft' | 'deprecated'

/**
 * Phase 8C — Bloom's taxonomy level.
 * AI-generated questions default to 'remember' or 'understand'.
 */
export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze'

export type QuestionBankQuestionType =
  | 'definition_to_word'
  | 'zh_definition_to_word'
  | 'en_to_zh'
  | 'zh_to_en'
  | 'synonym_choice'
  | 'antonym_choice'
  | 'collocation_choice'

export type QuestionSkillTag =
  | 'definition'
  | 'translation'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'usage'
  | 'vocabulary_drill'

export interface QuestionChoice {
  id: 'a' | 'b' | 'c' | 'd'
  text: string
}

export interface QuestionBankItem {
  id: string
  type: QuestionBankQuestionType
  sourceType: QuestionSourceType
  sourceNote: string
  wordId: string
  normalizedWord: string
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  prompt: string
  promptZh?: string
  choices: QuestionChoice[]
  answer: QuestionChoice['id']
  explanation: string
  explanationZh?: string
  skillTags: QuestionSkillTag[]
  examTags: string[]
  themeTags: string[]
  createdAt: string

  // ── Phase 8C optional fields ────────────────────────────────────────────
  /** Lifecycle status. AI-generated items should start as 'draft'. */
  status?: QuestionStatus
  /** Whether a human has reviewed and approved this question. */
  isReviewed?: boolean
  /** Reviewer identifier (name, email, or user ID). */
  reviewedBy?: string
  /**
   * Question-level difficulty (independent of word difficulty).
   * A question about a simple word can still be hard to answer.
   */
  questionDifficulty?: 1 | 2 | 3 | 4 | 5
  /** Bloom's taxonomy level for this question's cognitive demand. */
  bloomLevel?: BloomLevel
  /**
   * Identifier for the source exercise set.
   * Must reference LexiOcean-original content — not pirated exam papers.
   * Example: 'LexiOcean-Drill-Set-1', 'LexiOcean-CET4-Practice-A'
   */
  sourceExam?: string
  /** Version tag for tracking edits, e.g. 'v1', 'v2'. */
  version?: string
  /** Estimated pass rate 0..1 derived from usage telemetry. */
  estimatedPassRate?: number
}
