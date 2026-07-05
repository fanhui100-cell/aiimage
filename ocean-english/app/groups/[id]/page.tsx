import { AppShell } from '@/components/layout/AppShell'
import { GroupDetailScreen } from '@/components/screens/GroupDetailScreen'

// D6：学习小组详情 — 组信息 + 加入/退出 + 成员打卡墙
export default function GroupDetailPage() {
  return (
    <AppShell>
      <GroupDetailScreen />
    </AppShell>
  )
}
