'use client'
// fix5b：/lexigraph 应用 stash@{0} 在制品的入口形态 —— 静态成品 iframe 整页嵌入。
// 在制品原指向 /lexigraph-embed/Lexigraph.html，但该目录从未入库（WIP 未带上资产）；
// 改指库内现存的同一静态成品 public/lexiverse-html/LexiGraph.html（含 lexigraph/ 资产）。
// ?word= 深链透传给 iframe（静态页已加 3 行读取接线）。React 版组件保留备用。

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LexiGraphFrame() {
  const sp = useSearchParams()
  const word = sp.get('word')
  const src = word
    ? `/lexiverse-html/LexiGraph.html?word=${encodeURIComponent(word)}`
    : '/lexiverse-html/LexiGraph.html'
  return (
    <iframe
      src={src}
      title="LexiGraph 词汇星图"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#ece8df' }}
    />
  )
}

export default function LexiGraphPage() {
  return (
    <Suspense>
      <LexiGraphFrame />
    </Suspense>
  )
}
