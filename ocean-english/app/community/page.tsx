import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { CommunityScreen } from '@/components/screens/CommunityScreen'

// 社区 /community — 界面优化2·导航合并：排行 / 小组 / 成就 合一（三块现成屏内部零改动）
export default function CommunityPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CommunityScreen />
      </Suspense>
    </AppShell>
  )
}
