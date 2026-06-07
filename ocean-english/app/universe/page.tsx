import { redirect } from 'next/navigation'

// /universe → /explore (词汇探索合并入口)
export default function UniverseRedirectPage() {
  redirect('/explore')
}
