// app/knowledge/page.tsx — F5 知识库真实化
// 原 17MB LexiVault bundle 为加密构建产物（lv-data.jsx 源未随交付包提供、
// 无外部数据钩子/postMessage），「只换数据层」物理不可行——记录在案的偏离。
// 处置：照其信息架构重建真实数据版（KnowledgeScreen，feed/词脊/复习/统计
// 全接 store + dictionary）；原 bundle 保留于 /lexivault.html 作原型预览。
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { KnowledgeScreen } from '@/components/knowledge/KnowledgeScreen'

export default function KnowledgePage() {
  return (
    <AppShell>
      <Suspense>
        <KnowledgeScreen />
      </Suspense>
    </AppShell>
  )
}
