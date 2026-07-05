import { AppShell } from '@/components/layout/AppShell'
import { ShareScreen } from '@/components/screens/ShareScreen'

// D14：战绩分享卡 — 真实战绩生成竖图卡，canvas 导出 PNG / Web Share；换主题切内容
export default function SharePage() {
  return (
    <AppShell>
      <ShareScreen />
    </AppShell>
  )
}
