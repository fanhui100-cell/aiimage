/* word-practice-links.ts — 词详情页 CTA 的纯 URL 构造器。
   examContext 字段保留兼容；UI 在 v2 per-word coverage 充足前不渲染为可点击考试入口。
   无 router/store 耦合；word.id 即词槽 slug / word 参数（= question_bank.normalized_word）。 */
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
    examContext: `/quiz?word=${id}&returnTo=${rt}`,
    graph: `/lexigraph?word=${id}`,
    askAi: `/chat?context=word&word=${id}&returnTo=${rt}`,
    browser: `/dictionary?tab=explore`,
  }
}
