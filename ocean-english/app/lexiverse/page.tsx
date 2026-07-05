import type { Metadata } from 'next'
import { ReferenceLexiverseFrame } from '@/components/lexiverse/ReferenceLexiverseFrame'
// 界面优化2·P1：本页不走 AppShell（全屏 iframe 宇宙面），故在此自带命令面板 Provider，
// 让 ⌘K 与宇宙面右上角 ⌘K 入口都可用。
import { CommandPaletteProvider } from '@/components/ui/motion/CommandPalette'

export const metadata: Metadata = {
  title: 'Lexiverse',
  description: 'Explore vocabulary as a universe of constellations, galaxies, and planets.',
}

export const dynamic = 'force-dynamic'

export default function LexiverseRoute() {
  return (
    <CommandPaletteProvider>
      <ReferenceLexiverseFrame />
    </CommandPaletteProvider>
  )
}
