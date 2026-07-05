import { AppShell } from '@/components/layout/AppShell'
import { WritingScreen } from '@/components/screens/WritingScreen'

// D16：造句练习 — 用目标词造句，AI 中文批改（评分/建议/润色）；达标喂报告「拼」维度
export default function WritingPage() {
  return (
    <AppShell>
      <WritingScreen />
    </AppShell>
  )
}
