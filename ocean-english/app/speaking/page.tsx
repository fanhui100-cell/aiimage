import { AppShell } from '@/components/layout/AppShell'
import { SpeakingScreen } from '@/components/screens/SpeakingScreen'

// D8：AI 口语对话 — 场景化陪练（DeepSeek + Web Speech）
export default function SpeakingPage() {
  return (
    <AppShell>
      <SpeakingScreen />
    </AppShell>
  )
}
