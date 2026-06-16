/* 界面优化4：/today 渲染 Bento 版（TodayBento）。原 TodayScreen 保留（PATHS 已抽到 lib/today/today-paths）。 */
import { AppShell } from '@/components/layout/AppShell'
import { TodayBento } from '@/components/screens/TodayBento'

export default function TodayPage() {
  return (
    <AppShell>
      <TodayBento />
    </AppShell>
  )
}
