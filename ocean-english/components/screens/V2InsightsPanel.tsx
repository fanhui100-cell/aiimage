'use client'
/* V2InsightsPanel — v2 服务端学习闭环的展示组件（叠加层，仅 source==='real' 时渲染）。
   呈现真实作答聚合的「技能掌握度 + 置信度/估算标签 + 分考试正确率」，与现有 lexiStore 报告并存。
   纯展示：数据由 useV2Diagnostics 经 props 传入；样式用主题令牌内联，无需新增 CSS 文件。
   红线：confidence!=='high'（isEstimate）必标「估算·样本不足」，不展示精确分。 */
import { CONFIDENCE_ZH, skillKeyZh, type V2Diagnostics, type V2SkillState } from '@/hooks/useV2Diagnostics'
import { skillKeyToTaskType } from '@/lib/practice/skill-task-map'

const pct = (m: number) => Math.round(m * 100)
/** isEstimate 时给档位文案而非精确分（避免把估算当精确分）。 */
const masteryLabel = (s: V2SkillState) => s.isEstimate ? `约 ${Math.round(pct(s.mastery) / 10) * 10}%` : `${pct(s.mastery)}%`

function ConfidenceBadge({ s }: { s: V2SkillState }) {
  const tone = s.confidence === 'high' ? 'var(--teal-ink)' : s.confidence === 'medium' ? 'var(--gold-ink)' : 'var(--ink-muted)'
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: tone, background: `color-mix(in srgb, ${tone} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${tone} 28%, transparent)`, borderRadius: 99, padding: '1px 7px', whiteSpace: 'nowrap' }}>
      {CONFIDENCE_ZH[s.confidence]}{s.isEstimate ? ' · 估算' : ''}
    </span>
  )
}

function SkillRow({ s }: { s: V2SkillState }) {
  const tone = s.mastery >= 0.7 ? 'var(--teal-ink)' : s.mastery >= 0.5 ? 'var(--gold-ink)' : 'var(--rose-ink)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <span style={{ flex: '0 0 96px', fontSize: 13, color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{skillKeyZh(s.skillKey)}</span>
      <span style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', position: 'relative' }}>
        <i style={{ position: 'absolute', inset: '0 auto 0 0', width: pct(s.mastery) + '%', borderRadius: 99, background: tone, opacity: s.isEstimate ? 0.55 : 1, transition: 'width .4s var(--ease, ease)' }} />
      </span>
      <span style={{ flex: '0 0 auto', fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--ink)', minWidth: 46, textAlign: 'right' }}>{masteryLabel(s)}</span>
      <span style={{ flex: '0 0 auto', fontSize: 10.5, color: 'var(--ink-muted)', minWidth: 34, textAlign: 'right' }}>{s.attempts}次</span>
      <ConfidenceBadge s={s} />
    </div>
  )
}

/** Report 用：完整 v2 诊断面板（技能掌握 + 分考试正确率 + 免责）。source!=='real' 不渲染。 */
export function V2InsightsPanel({ d }: { d: V2Diagnostics }) {
  if (d.loading || d.source !== 'real' || d.skill.length === 0) return null
  const byExam = new Map<string, V2SkillState[]>()
  for (const s of d.skill) { const a = byExam.get(s.examId) ?? []; a.push(s); byExam.set(s.examId, a) }
  return (
    <div className="rp-card" style={{ marginTop: 16 }}>
      <div className="sec-head"><span className="sec-title">能力诊断 · 基于真实作答</span><span className="sec-hint">服务端聚合 · 样本不足为估算</span></div>
      {d.note ? <div style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '4px 0 10px', lineHeight: 1.6 }}>{d.note}</div> : null}
      {[...byExam.entries()].map(([examId, list]) => (
        <div key={examId} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-sub)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{examId}</div>
          {list.slice(0, 8).map((s) => <SkillRow key={s.skillKey} s={s} />)}
        </div>
      ))}
      {d.exam.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {d.exam.map((e) => (
            <span key={e.examId} style={{ fontSize: 12, color: 'var(--ink-sub)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '4px 10px' }}>
              {e.examId} 正确率 <b style={{ color: 'var(--ink)' }}>{e.isEstimate ? `约 ${Math.round(e.accuracy * 100 / 10) * 10}` : Math.round(e.accuracy * 100)}%</b>{e.isEstimate ? ' · 估算' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Review 用：薄弱技能紧凑列表 + 定向练习 CTA。source!=='real' 或无弱项 → 不渲染。 */
export function V2WeakSkills({ d, onPractice }: { d: V2Diagnostics; onPractice: (s: V2SkillState) => void }) {
  if (d.loading || d.source !== 'real' || d.weakSkills.length === 0) return null
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>薄弱技能 · 基于真实作答</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {d.weakSkills.slice(0, 6).map((s) => {
          // 仅「可映射客观题型」的弱项可定向练（跳 /quiz task）；写作/翻译/口语等产出型弱项无客观题型，
          // 禁用并标「产出练习」，避免跳 mode=task 空 taskType 误抽客观题（如 essay_writing → 听力题）。
          const objective = skillKeyToTaskType(s.skillKey, s.examId) != null
          return (
            <button key={`${s.examId}:${s.skillKey}`} onClick={objective ? () => onPractice(s) : undefined} disabled={!objective}
              title={objective ? undefined : '写作/口语等产出练习入口建设中'}
              style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: '9px 12px', cursor: objective ? 'pointer' : 'default', opacity: objective ? 1 : 0.65 }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{s.examId} · {skillKeyZh(s.skillKey)}</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--rose-ink)' }}>{masteryLabel(s)}</span>
              <ConfidenceBadge s={s} />
              <span style={{ fontSize: 12, color: objective ? 'var(--teal-ink)' : 'var(--ink-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{objective ? '练 →' : '产出练习'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
