/* 界面优化5：/dictionary 渲染合并版词库（DictionaryVaultScreen）。
   原 DictionaryScreen 暂保留（分阶段·先建后删；删除/重定向旧页在第二阶段）。 */
import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { DictionaryVaultScreen } from '@/components/screens/DictionaryVaultScreen'

export default function DictionaryPage() {
  return (
    <AppShell>
      <Suspense>
        <DictionaryVaultScreen />
      </Suspense>
    </AppShell>
  )
}
