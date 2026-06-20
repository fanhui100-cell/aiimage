import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LexiGraphFrame } from '@/components/lexigraph/LexiGraphFrame'

// 界面优化10 / 任务A：LexiGraph 1:1 原型移植（public/lexigraph-reference/ + 桥联动）
// 界面优化14 / 提示词4：外层补全站导航（AppShell 的 Navbar + MobileTabBar）；
// 词图本体（iframe 内原型）不改，仅确保 iframe 不被顶栏遮挡。
export const dynamic = 'force-dynamic'

export default function LexiGraphPage() {
  return (
    <AppShell>
      <Suspense>
        <LexiGraphFrame />
      </Suspense>
    </AppShell>
  )
}
