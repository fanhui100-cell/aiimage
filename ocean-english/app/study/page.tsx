import { redirect } from 'next/navigation'

// /study → /today (学习主线入口升级)
export default function StudyRedirectPage() {
  redirect('/today')
}
