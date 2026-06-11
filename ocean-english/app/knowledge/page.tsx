// app/knowledge/page.tsx
// LexiVault 个人知识库 —— 原型「原封不动」嵌入。
// ⚠️ 不要在这里重建 UI。LexiVault 的页面、交互、视觉全部来自 /public/lexivault.html，
//    本文件只负责把它整页嵌入到 Next.js 路由 /knowledge。
'use client'

export default function KnowledgePage() {
  return (
    <iframe
      src="/lexivault.html"
      title="LexiVault 个人知识库"
      // LexiVault 自带完整顶栏导航，故整页铺满。
      // 若你们保留了全局 header，请把 inset 改成 top: <headerHeight> 让出空间。
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 'none' }}
      allow="clipboard-read; clipboard-write"
    />
  )
}
