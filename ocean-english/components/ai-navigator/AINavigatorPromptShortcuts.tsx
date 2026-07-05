'use client'

import { PROMPT_SHORTCUTS, buildShortcutPrompt } from '@/lib/ai-navigator/ai-navigator-prompts'
import type { AINavigatorContext } from '@/lib/ai-navigator/ai-navigator-types'

interface Props {
  context: AINavigatorContext
  onSend: (text: string) => void
  onFill: (text: string) => void
  disabled?: boolean
}

const SHORTCUT_ICONS: Record<string, string> = {
  explain_word: '📖',
  break_sentence: '🔍',
  explain_mistake: '❌',
  generate_quiz: '📝',
  study_plan: '📅',
  summarize_doc: '📄',
}

export function AINavigatorPromptShortcuts({ context, onSend, onFill, disabled }: Props) {
  return (
    <div style={{ maxWidth: '800px', margin: '14px auto 0', padding: '0 24px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
        }}
      >
        {PROMPT_SHORTCUTS.map(shortcut => {
          const isEnabled =
            !shortcut.disabled &&
            (shortcut.enabledFor.length === 0 || shortcut.enabledFor.includes(context.type))

          const handleClick = () => {
            if (!isEnabled || disabled) return
            const prompt = buildShortcutPrompt(shortcut.id, context)
            if (!prompt) return
            if (shortcut.fillOnly) {
              onFill(prompt)
            } else {
              onSend(prompt)
            }
          }

          return (
            <button
              key={shortcut.id}
              onClick={handleClick}
              disabled={!isEnabled || disabled}
              title={shortcut.disabled ? shortcut.disabledReason : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 12px', borderRadius: '8px', textAlign: 'left',
                background: isEnabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${isEnabled ? 'rgba(155,191,202,0.18)' : 'rgba(155,191,202,0.07)'}`,
                color: isEnabled ? '#ECFBFF' : 'rgba(155,191,202,0.3)',
                fontSize: '12px', cursor: isEnabled && !disabled ? 'pointer' : 'default',
                transition: 'border-color 0.15s, background 0.15s',
                opacity: isEnabled ? 1 : 0.5,
              }}
              onMouseEnter={e => {
                if (!isEnabled || disabled) return
                const el = e.currentTarget
                el.style.borderColor = 'rgba(56,189,248,0.4)'
                el.style.background = 'rgba(56,189,248,0.06)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.borderColor = isEnabled ? 'rgba(155,191,202,0.18)' : 'rgba(155,191,202,0.07)'
                el.style.background = isEnabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)'
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>
                {SHORTCUT_ICONS[shortcut.id] ?? '✦'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, lineHeight: 1.3 }}>
                  {shortcut.label}
                  {shortcut.fillOnly && (
                    <span style={{ fontSize: '10px', color: 'rgba(155,191,202,0.4)', marginLeft: '5px' }}>
                      ✏
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.45)', lineHeight: 1.2, marginTop: '1px' }}>
                  {shortcut.disabled ? shortcut.disabledReason ?? shortcut.labelZh : shortcut.labelZh}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.3)', marginTop: '6px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
        ✏ = fills input for you to complete · click to send
      </div>
    </div>
  )
}
