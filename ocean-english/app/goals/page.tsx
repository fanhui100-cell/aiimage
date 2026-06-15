import { AppShell } from '@/components/layout/AppShell'
import { GoalsScreen } from '@/components/screens/GoalsScreen'

// D13：每日目标 — 今日进度环 + 本周完成柱 + 打卡日历 + 可调目标；数据全部真实
export default function GoalsPage() {
  return (
    <AppShell>
      <GoalsScreen />
    </AppShell>
  )
}
