import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LexiverseShell } from '@/components/lexiverse/LexiverseShell'
import { LoadingState } from '@/components/lexiverse/LoadingState'

export const metadata: Metadata = {
  title: '词汇宇宙 · Lexiverse — LexiOcean',
  description: '星系 / 扇区 / 行星三级词汇宇宙，掌握状态实时点亮。',
}

// fix4：恢复完整 WebGL 宇宙（星系/扇区/行星 URL 路由、到期高亮、Stage D）。
// LexiverseShell 内部已做 WebGL 检测，不可用时降级为现有 2D 视图（WebGLFallback）；
// UniverseScreen（原型 iframe 版）保留备用，不再作为路由入口。
export default function LexiversePage() {
  return (
    <Suspense fallback={<LoadingState message="Initialising Lexiverse… / 初始化中" />}>
      <LexiverseShell />
    </Suspense>
  )
}
