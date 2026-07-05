import { AppShell } from '@/components/layout/AppShell'
import { SearchScreen } from '@/components/screens/SearchScreen'

// D18：全局搜索 — 单词/文章/词族一站搜，最近搜索 + 最近在学；数据全部真实
export default function SearchPage() {
  return (
    <AppShell>
      <SearchScreen />
    </AppShell>
  )
}
