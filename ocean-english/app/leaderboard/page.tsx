import { AppShell } from '@/components/layout/AppShell'
import { LeaderboardScreen } from '@/components/screens/LeaderboardScreen'

// D5：排行榜 — 周/总/连击榜，复用 user_study_progress + leaderboard 视图
export default function LeaderboardPage() {
  return (
    <AppShell>
      <LeaderboardScreen />
    </AppShell>
  )
}
