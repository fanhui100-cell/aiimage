import { AppShell } from '@/components/layout/AppShell'
import { ReportScreen } from '@/components/screens/ReportScreen'

// D2：学习报告 — 记忆矩阵 / 状态分布 / 跨维雷达 / 强度柱 / 热力图 / 个人遗忘曲线
export default function ReportPage() {
  return (
    <AppShell>
      <ReportScreen />
    </AppShell>
  )
}
