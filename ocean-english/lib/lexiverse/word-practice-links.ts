/* word-practice-links.ts — 词详情页 CTA 的纯 URL 构造器（Phase 7）
   无 router/store 耦合；word.id 即词槽 slug / word 参数（= question_bank.normalized_word）。
   考试语境复用本词题库（仅切换考试镜头），绝不另起随机题源。 */
import type { DictionaryWord } from '@/lib/dictionary/dictionary-client'

export interface WordPracticeLinks {
  practice: string
  examContext: string
  graph: string
  askAi: string
  browser: string
}

export function buildWordPracticeLinks(word: DictionaryWord, returnTo: string): WordPracticeLinks {
  const id = encodeURIComponent(word.id)
  const rt = encodeURIComponent(returnTo)
  return {
    practice: `/quiz?word=${id}&returnTo=${rt}`,
    examContext: `/quiz?word=${id}&mode=exam-practice&returnTo=${rt}`,
    graph: `/lexigraph?word=${id}`,
    askAi: `/chat?context=word&word=${id}&returnTo=${rt}`,
    browser: `/dictionary?tab=explore`,
  }
}
