/* 界面优化3：未登录 / → 沉浸星海落地页；已登录 / → 原 HomeScreen（不改 HomeScreen） */
import { AppShell } from '@/components/layout/AppShell'
import { HomeScreen } from '@/components/home/HomeScreen'
import { LandingPage } from '@/components/landing/LandingPage'
import { CommandPaletteProvider } from '@/components/ui/motion/CommandPalette'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let loggedIn = false
  if (isSupabaseConfigured) {
    try {
      const sb = await createClient()
      const { data } = await sb.auth.getUser()
      loggedIn = !!data.user
    } catch { loggedIn = false }
  }

  if (loggedIn) {
    return (
      <AppShell>
        <HomeScreen />
      </AppShell>
    )
  }

  // 未登录落地页：自带命令面板 Provider（本页不经 AppShell），⌘K 与顶栏「全部」可用
  return (
    <CommandPaletteProvider>
      <LandingPage />
    </CommandPaletteProvider>
  )
}
