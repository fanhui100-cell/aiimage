interface QuizSourceBadgeProps {
  questionId: string
}

export function QuizSourceBadge({ questionId }: QuizSourceBadgeProps) {
  const isQuestionBank = questionId.startsWith('vdl-')
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        padding: '3px 9px',
        borderRadius: '999px',
        border: isQuestionBank ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(155,191,202,0.2)',
        background: isQuestionBank ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
        color: isQuestionBank ? '#34D399' : 'var(--text-secondary)',
        marginLeft: '8px',
      }}
    >
      {isQuestionBank ? 'Original curated' : 'Mock fallback'}
    </span>
  )
}
