import Link from 'next/link'

interface QuizModeSelectorProps {
  activeMode: 'quick' | 'vocabulary-drill' | 'review' | 'wrong-answer-booster'
  wordParam?: string | null
}

const linkBase = {
  display: 'block',
  padding: '12px 14px',
  borderRadius: '10px',
  textDecoration: 'none',
  border: '1px solid rgba(155,191,202,0.18)',
  background: 'rgba(255,255,255,0.03)',
  color: '#9BBFCA',
  fontSize: '13px',
} satisfies React.CSSProperties

export function QuizModeSelector({ activeMode, wordParam }: QuizModeSelectorProps) {
  const wordSuffix = wordParam ? `&word=${encodeURIComponent(wordParam)}` : ''
  const modes = [
    { id: 'quick', href: wordParam ? `/quiz?word=${encodeURIComponent(wordParam)}` : '/quiz', title: 'Quick Quiz', desc: '快速练习' },
    { id: 'vocabulary-drill', href: `/quiz?mode=vocabulary-drill${wordSuffix}`, title: 'Vocabulary Drill', desc: '词汇训练' },
    { id: 'review', href: '/memory?tab=review', title: 'Review Quiz', desc: '复习练习' },
    { id: 'wrong-answer-booster', href: '/memory?tab=wrong', title: 'Wrong Answer Booster', desc: '错题强化' },
  ] as const

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '28px' }}>
      {modes.map((mode) => {
        const active = activeMode === mode.id
        return (
          <Link
            key={mode.id}
            href={mode.href}
            style={{
              ...linkBase,
              border: active ? '1px solid rgba(56,189,248,0.55)' : linkBase.border,
              background: active ? 'rgba(56,189,248,0.1)' : linkBase.background,
              color: active ? '#38BDF8' : linkBase.color,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '3px' }}>{mode.title}</div>
            <div style={{ color: active ? 'rgba(125,211,252,0.75)' : 'rgba(155,191,202,0.65)' }}>{mode.desc}</div>
          </Link>
        )
      })}
    </div>
  )
}
