import { AppShell } from '@/components/layout/AppShell'
import { DrillEntryScreen } from '@/components/screens/LevelDrillEntry'

// D4：按档专练入口 — 选一档单独刷该档高频新词（不改定级），跳 /learn?level=N&drill=1
export default function DrillPage() {
  return (
    <AppShell>
      <DrillEntryScreen />
    </AppShell>
  )
}
