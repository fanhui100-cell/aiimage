'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { CHROMELESS_ROUTES, FOCUS_ROUTES } from './MobileTabBar'
import { FocusBackButton } from './FocusBackButton'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { MilestoneToast } from '@/components/ui/MilestoneToast'
import { LumiCompanion } from '@/components/companion/LumiCompanion'
import { useLexiStore } from '@/store/lexiStore'
import { isDarkRoute } from '@/lib/theme-route'
import { checkReminderOnOpen } from '@/components/me/ReminderSetting'
// +++ 接入改动：全局命令面板 Provider（必须包住两个分支，⌘K 才能在 chromeless 的 /lexiverse 也生效）
import { CommandPaletteProvider } from '@/components/ui/motion/CommandPalette'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 启动兜底：① 词库空且断网时注入离线种子包；② stub 词条（zh === ''）补拉词典内容
  useEffect(() => {
    const lexi = useLexiStore.getState()
    void lexi.injectOfflineSeedIfEmpty()
    // F6-B2：页面打开时检查每日提醒（到点未学且有到期词 → 系统通知，每日一次）
    checkReminderOnOpen()
    void lexi.hydrateMissingEntries()
  }, [])
  const chromeless = CHROMELESS_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )
  // B1-3：聚焦页（tab bar 隐藏）移动端给悬浮返回；chromeless 页自带返回
  const focus = !chromeless && FOCUS_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )

  if (chromeless) {
    return (
      <CommandPaletteProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
          <main>{children}</main>
        </div>
      </CommandPaletteProvider>
    )
  }

  // P1：固定 Navbar 占位补偿——深色沉浸页（首页 hero 等）设计为顶栏透叠，不补
  const dark = isDarkRoute(pathname)

  return (
    <CommandPaletteProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
        <Navbar />
        {focus && <FocusBackButton />}
        <CloudSyncProvider>
          <main style={{ paddingTop: dark ? 0 : 'var(--nav-h)' }}>{children}</main>
        </CloudSyncProvider>
        <MobileTabBar />
        <MilestoneToast />
        {/* B10-2：陪伴系统挂 Lumi（仅非 chromeless；设置可关，会话频控 ≤2 条） */}
        <LumiCompanion />
      </div>
    </CommandPaletteProvider>
  )
}
