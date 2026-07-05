import { AppShell } from '@/components/layout/AppShell'
import DrillScreen from '@/components/screens/drill/DrillScreen'

// 专练 /drill — 自由练 / 限时试炼 / 模拟考试，一个入口（合并原「试炼」）
export default function DrillPage() {
  return (
    <AppShell>
      <DrillScreen />
    </AppShell>
  )
}
