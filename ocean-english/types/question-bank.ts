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

/**
 * 题型分类的「唯一真源」是 `lib/question-bank/question-type-taxonomy.ts`
 * （WORD_UNIVERSE / EXAM_TASK / DEPRECATED / ALIAS_ONLY）。本 union 仅用于编译期标注，
 * 保留所有历史成员（旧 DB 行仍在用，不物理删除）。
 *
 * 命名与退役约定：
 * - `def_to_word` 是 DB 实际使用的「看释义选词」题型；下方 `definition_to_word` /
 *   `zh_definition_to_word` 是历史命名别名（alias-only），客户端会被归一到 `def_to_word`，
 *   不作为独立可选题型。
 * - `antonym_choice` 与 `cet_cloze` 已退役：不再进入新的考试/练习默认入口、推荐与模拟卷。
 *   `cet_cloze` 未列入本 union（DB 历史 type），新入口一律不主动抽取。
 */
export type QuestionBankQuestionType =
  | 'definition_to_word'      // alias-only：归一到 def_to_word（见 taxonomy）
  | 'zh_definition_to_word'   // alias-only：归一到 def_to_word（见 taxonomy）
  | 'en_to_zh'
  | 'zh_to_en'
  | 'synonym_choice'
  | 'antonym_choice'          // DEPRECATED：仅兼容旧行，新入口不抽取
  | 'collocation_choice'
  // ── Task B P1+ 练习引擎扩展（PracticeSession 消费；可选输入模式见 inputMode）──
  | 'zh_to_word_spell'        // 中文 → 敲英文（拼写）
  | 'cloze_choice'            // 例句填空（选）
  | 'cloze_spell'            // 例句填空（敲）
  | 'word_form'              // 词形/派生填空
  | 'confusable_choice'      // 易混词辨析（选）
  | 'synonym_substitute'     // 同义替换
  | 'listen_to_word'         // 听音 → 选/敲单词
  | 'listen_to_meaning'      // 听音 → 选义
  | 'dictation_spell'        // 听音 → 敲单词（听写）
  | 'listening_comprehension' // 听短文 → 选择
  | 'reading_comprehension'   // 读短文 → 选择
  | 'cloze_passage'           // 完形填空(整篇) → 逐空多选
  | 'seven_select'            // 七选五/阅读填句 → 5 空选 7 句
  | 'banked_cloze'            // 选词填空(CET) → 10 空选 15 词
  | 'para_match'              // 长篇阅读匹配 → 陈述配段落
  | 'grammar_fill'            // 语法填空(高考) → 逐空自由填词

export type QuestionSkillTag =
  | 'definition'
  | 'translation'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'usage'
  | 'vocabulary_drill'
  | 'spelling'               // 拼写/产出
  | 'listening'              // 听力
  | 'word_form'              // 词形变化

/** 输入模态（PracticeSession 据此渲染输入区）。默认 'choice' 兼容旧题。 */
export type QuestionInputMode = 'choice' | 'spell' | 'speak' | 'listen'

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

  // ── Task B P1+ 练习引擎扩展（全部可选，旧 MCQ 题不受影响）──
  /** 输入模态；缺省视为 'choice'（选择题，用 choices/answer）。 */
  inputMode?: QuestionInputMode
  /** 打字/听写题的标准答案（词形/释义文本）；choice 题用 answer 即可。 */
  answerText?: string
  /** 打字题提示：首字母骨架 / 音标。 */
  hint?: { initials?: string; ipa?: string }
  /** 听力题音频引用（词形 slug / passage id / 直接 URL）；前端可退回 TTS。 */
  audioRef?: string

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
