'use client'
/* DrillEmptyState — 统一空态（Phase 6）。三 variant：
   build=题库建设中(客观空池) · plan=规划中(生产性任务待 v2) · exam=整档建设中。
   role="status"，状态以文字表达（非仅颜色）。 */
import { Ic } from '@/components/screens/drill/DrillShared'

type Variant = 'build' | 'plan' | 'exam'

const CFG: Record<Variant, { ic: string; tone: string; t: string; d: string }> = {
  build: { ic: 'wrench', tone: 'gold', t: '题库建设中', d: '该任务的 active 题组数量不足，正在装配。题库就绪后这里会自动可练，期间不会用无关词汇题顶替。' },
  plan: { ic: 'cone', tone: 'violet', t: '规划中 · 待生产性任务支持', d: '写作 / 翻译 / 口语等生产性任务需要 v2 评分（rubric / 录音）支持，结构位已就绪，将随生成阶段开放。' },
  exam: { ic: 'layers', tone: 'gold', t: '该考试题库建设中', d: '官方结构已确立，产品题库仍在装配；以下为规划结构草案，就绪后即可一键接入练习。' },
}

export function DrillEmptyState({ variant = 'build', title, desc, compact }: { variant?: Variant; title?: string; desc?: string; compact?: boolean }) {
  const cfg = CFG[variant]
  return (
    <div className={`lx-empty ${cfg.tone} ${compact ? 'compact' : ''}`} role="status">
      <div className="lx-empty-ic"><Ic name={cfg.ic} s={compact ? 18 : 22} /></div>
      <div className="lx-empty-body">
        <div className="lx-empty-h">{title || cfg.t}</div>
        <div className="lx-empty-p">{desc || cfg.d}</div>
      </div>
    </div>
  )
}
