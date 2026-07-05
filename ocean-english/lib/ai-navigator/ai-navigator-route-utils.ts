/** Phase 7D — Helpers to build /chat?context=... URLs */

export function chatHrefWord(word: string): string {
  return `/chat?context=word&word=${encodeURIComponent(word.slice(0, 100))}`
}

export function chatHrefLexigraphWord(word: string): string {
  return `/chat?context=lexigraph_word&word=${encodeURIComponent(word.slice(0, 100))}`
}

export function chatHrefWrongAnswer(id: string): string {
  return `/chat?context=wrong_answer&id=${encodeURIComponent(id.slice(0, 50))}`
}

export function chatHrefStudyGoal(): string {
  return `/chat?context=study_goal`
}
