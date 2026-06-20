'use client'
/* practice/PracticeFrame.tsx — .pr-v2 外壳；base 之后叠加 premium overlay */
import type { ReactNode } from 'react'
import '../quiz/practice-session.css'
import '../quiz/practice-session-premium.css'

export function PracticeFrame({ children }: { children: ReactNode }) {
  return (
    <main className="theme-light pr-v2">
      <div className="pr-app">{children}</div>
    </main>
  )
}
