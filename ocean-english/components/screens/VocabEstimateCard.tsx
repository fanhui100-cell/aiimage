'use client'
/* ════════════════════════════════════════════════════════════════════════
   D3 词汇量反馈卡 — onboarding 结果步内一段（presentational）
   inline 样式贴合结果步视觉；数据由 OnboardingScreen 传入（VocabEstimateCard 契约）。
   无目标考试 → 只显主行；data==null → 整卡不渲染。
   ════════════════════════════════════════════════════════════════════════ */
import type { VocabEstimateCard as CardData } from '@/lib/analytics/report'

export function VocabEstimateCard({ data }: { data: CardData | null }) {
  if (!data) return null
  const { vocabEstimate, levelName, targetExamName, gapToTarget } = data
  const reached = gapToTarget != null && gapToTarget <= 0
  const targetTotal = gapToTarget != null ? vocabEstimate + gapToTarget : vocabEstimate
  const pct = targetTotal ? Math.min(100, Math.round(vocabEstimate / targetTotal * 100)) : 100
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-rest)' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: .82 }}>估算词汇量 · Vocabulary</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>约 {vocabEstimate.toLocaleString('en-US')}</span>
        <span style={{ fontSize: 13, color: 'var(--ink-sub)' }}>词</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: 'var(--teal-bg)', color: 'var(--teal-ink)' }}>{levelName} 档</span>
      </div>
      {targetExamName && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12.5, color: reached ? 'var(--teal-ink)' : 'var(--ink-sub)', marginBottom: 6 }}>
            {reached
              ? `已达到 ${targetExamName} 目标词汇量 ✦`
              : <>距 <b style={{ color: 'var(--ink)' }}>{targetExamName}</b> 还需约 <b style={{ color: 'var(--ink)' }}>{(gapToTarget ?? 0).toLocaleString('en-US')}</b> 词</>}
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(20,30,40,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--teal-deep),var(--teal))' }} />
          </div>
        </div>
      )}
    </div>
  )
}
