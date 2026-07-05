'use client'
// ReviewHub — /memory 入口，三 tab：到期 / 薄弱 / 错题（读 ?tab=）
// 到期、薄弱复用 ReviewScreen（SrsQueue 闪卡流）；错题用 WrongAnswerList

import { useSearchParams, useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { ReviewScreen } from '@/components/screens/ReviewScreen'
import { WrongAnswerList } from '@/components/screens/WrongAnswerList'
import { useV2Diagnostics } from '@/hooks/useV2Diagnostics'
import { V2WeakSkills } from '@/components/screens/V2InsightsPanel'
import { skillKeyToTaskType } from '@/lib/practice/skill-task-map'

type Tab = 'due' | 'weak' | 'wrong'

const TABS: { id: Tab; zh: string }[] = [
  { id: 'due', zh: '到期' },
  { id: 'weak', zh: '薄弱' },
  { id: 'wrong', zh: '错题' },
]

const DAY = 86_400_000
const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六']

export function ReviewHub() {
  const router = useRouter()
  const sp = useSearchParams()
  const raw = sp.get('tab')
  const tab: Tab = raw === 'weak' || raw === 'wrong' ? raw : 'due'

  const words = useLexiStore(s => s.words)
  const dueCount = useLexiStore(s => s.getDue().length)
  const weakCount = useLexiStore(s => s.getWeak().length)
  const wrongCount = useLexiStore(s => s.wrongAnswers.length)
  const counts: Record<Tab, number> = { due: dueCount, weak: weakCount, wrong: wrongCount }
  const v2 = useV2Diagnostics()

  function go(t: Tab) {
    router.replace(t === 'due' ? '/memory' : `/memory?tab=${t}`)
  }

  // B6-3：复习预算行 — 预计时长（约 30 秒/词）+ 未来 7 天到期高峰日
  const estMinutes = Math.max(1, Math.ceil(dueCount * 0.5))
  const peakLabel = (() => {
    const now = Date.now()
    let best = 0, bestDay = -1
    for (let i = 1; i <= 7; i++) {
      const start = now + (i - 1) * DAY
      const end = now + i * DAY
      const n = words.filter(w => w.nextReviewAt != null && w.nextReviewAt > start && w.nextReviewAt <= end).length
      if (n > best) { best = n; bestDay = i }
    }
    if (bestDay < 0) return null
    const d = new Date(now + bestDay * DAY)
    return `下次高峰周${WEEKDAY[d.getDay()]}`
  })()

  // B6：底部「全部重练」（仅 weak / wrong tab）
  function retrainAll() {
    if (tab === 'weak') {
      const lexi = useLexiStore.getState()
      lexi.getWeak().forEach(w => lexi.addToReview(w.id))
      router.replace('/memory')
    } else if (tab === 'wrong') {
      router.push('/quiz?mode=wrong-answer-booster')
    }
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 0' }}>
        {/* segmented tab bar */}
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => go(t.id)} className="btn-press"
                style={{
                  flex: 1, padding: '9px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--card)' : 'transparent',
                  boxShadow: active ? 'var(--card-shadow-sm)' : 'none',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: active ? 'var(--teal-ink)' : 'var(--ink-muted)',
                }}>
                {t.zh}
                <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{counts[t.id]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* B6-3：到期 tab 顶部复习预算行 + 题库强化入口（接 question_bank） */}
      {tab === 'due' && dueCount > 0 && (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-sub)', fontFamily: 'var(--font-mono)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            今日到期 {dueCount} · 预计 {estMinutes} 分钟{peakLabel ? ` · ${peakLabel}` : ''}
          </div>
          <button onClick={() => router.push('/quiz?mode=vocabulary-drill')} className="btn-press"
            style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 999, border: '1px solid var(--line-strong)', background: 'var(--card)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
            题库强化练一组 →
          </button>
        </div>
      )}

      {/* tab content */}
      {tab === 'due' && <ReviewScreen source="due" />}
      {tab === 'weak' && (
        <>
          {/* v2 服务端能力诊断弱项（叠加层；仅登录 + 有真实作答时渲染，点「练」跳考试专项任务） */}
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 20px' }}>
            <V2WeakSkills d={v2} onPractice={(s) => {
              // skillKey 是诊断维度（subskill），经映射得 task_type；映射不到则不传（session 按 examId 抽混合题）
              const taskType = skillKeyToTaskType(s.skillKey, s.examId)
              const qs = new URLSearchParams({ mode: 'task', examId: s.examId })
              if (taskType) qs.set('taskType', taskType)
              if (s.skillKey) qs.set('skill', s.skillKey)
              router.push(`/quiz?${qs.toString()}`)
            }} />
          </div>
          <ReviewScreen source="weak" />
        </>
      )}
      {tab === 'wrong' && (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 20px 100px' }}>
          <WrongAnswerList />
        </div>
      )}

      {/* B6：底部常驻「全部重练」（仅 weak/wrong 且有内容时） */}
      {((tab === 'weak' && weakCount > 0) || (tab === 'wrong' && wrongCount > 0)) && (
        <div style={{ position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom))', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 90 }}>
          <button onClick={retrainAll} className="btn-press"
            style={{ pointerEvents: 'auto', padding: '12px 28px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--teal-ink)', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)', boxShadow: '0 10px 26px -10px rgba(14,140,122,0.7)' }}>
            全部重练（{tab === 'weak' ? weakCount : wrongCount}）
          </button>
        </div>
      )}
    </div>
  )
}
