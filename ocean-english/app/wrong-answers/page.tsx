import { redirect } from 'next/navigation'

// /wrong-answers → /memory?tab=wrong
// 错题本是复习中心的「错题」tab；直达 URL 重定向到该 tab。
export default function WrongAnswersRedirectPage() {
  redirect('/memory?tab=wrong')
}
