import { AppShell } from '@/components/layout/AppShell'
import { GroupsScreen } from '@/components/screens/GroupsScreen'

// D6：学习小组 — 我的/发现小组 + 创建，进 /groups/[id]
export default function GroupsPage() {
  return (
    <AppShell>
      <GroupsScreen />
    </AppShell>
  )
}
