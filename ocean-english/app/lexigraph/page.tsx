import { Suspense } from 'react'
import { LexiGraphScreen } from '@/components/lexigraph-v2/LexiGraphScreen'

// 阶段4：LexiGraph 重做（照 design_handoff_final/prototypes/lexigraph-redesign）
// 旧 React 版在 components/_legacy/lexigraph/ 可整体还原；
// 静态成品 public/lexiverse-html/LexiGraph.html 仍保留为参考。
export const dynamic = 'force-dynamic'

export default function LexiGraphPage() {
  return (
    <Suspense>
      <LexiGraphScreen />
    </Suspense>
  )
}
