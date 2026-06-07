import { redirect } from 'next/navigation'

// /wrong-answers → /memory
// The Memory Roots page contains the "Wrong Answers / 错题本" tab.
// This redirect satisfies direct URL navigation while keeping the UX in /memory.
export default function WrongAnswersRedirectPage() {
  redirect('/memory')
}
