import { AppShell } from '@/components/layout/AppShell'
import { RemindersScreen } from '@/components/screens/RemindersScreen'

// D19：提醒设置 — 每日提醒/复习推送/小组打卡/夜间免打扰；每日提醒沿用现有 Notification 逻辑
export default function RemindersPage() {
  return (
    <AppShell>
      <RemindersScreen />
    </AppShell>
  )
}
