'use client'

/* 界面优化2·P4：AINavigatorPanel 改用 AIPromptInput（米白·teal-ink 系）。
   输入区直接收问题，onSend 路由到 /chat?ask=…，由 LexiPilot 接现有 /api/ai/chat 流式回答。
   （原暗色玻璃 + 紫色链接面板已废弃，与全站米白主题对齐，不再串色。） */

import { useRouter } from 'next/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AIPromptInput } from '@/components/ui/AIPromptInput'

export function AINavigatorPanel() {
  const router = useRouter()
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <SectionHeader label="AI NAVIGATOR" labelZh="AI 领航" style={{ marginTop: 0, marginBottom: '4px' }} />
      <p style={{ fontSize: '12px', color: 'var(--ink-sub)', margin: '0 0 14px', lineHeight: 1.55 }}>
        提问词汇、语法、策略或练习题 —— 直接问，领航 LexiPilot 接管。
      </p>
      <AIPromptInput
        suggestions={['解释单词', '生成练习题', '分析错题', '制定计划']}
        placeholder="问问领航员…"
        onSend={(text) => router.push(`/chat?ask=${encodeURIComponent(text)}`)}
      />
    </div>
  )
}
