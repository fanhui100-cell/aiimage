import { AppShell } from '@/components/layout/AppShell'
import { AchievementsScreen } from '@/components/screens/AchievementsScreen'

// D11：成就墙 — 里程碑勋章，数据全部从学习库真实派生；与排行/小组形成激励闭环
export default function AchievementsPage() {
  return (
    <AppShell>
      <AchievementsScreen />
    </AppShell>
  )
}
