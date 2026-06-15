import { AppShell } from '@/components/layout/AppShell'
import { ListeningScreen } from '@/components/screens/ListeningScreen'

// D15：听写练习 — 放音 → 拼写 → 判对错；词源 = 用户学习库，答对喂报告「听」维度
export default function ListeningPage() {
  return (
    <AppShell>
      <ListeningScreen />
    </AppShell>
  )
}
