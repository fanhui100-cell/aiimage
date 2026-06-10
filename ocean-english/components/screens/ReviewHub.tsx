'use client'
// ReviewHub — /memory 入口，三 tab：到期 / 薄弱 / 错题（读 ?tab=）
// 到期、薄弱复用 ReviewScreen（SrsQueue 闪卡流）；错题用 WrongAnswerList

import { useSearchParams, useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { useLearningStore } from '@/store/learningStore'
import { ReviewScreen } from '@/components/screens/ReviewScreen'
import { WrongAnswerList } from '@/components/screens/WrongAnswerList'

type Tab = 'due' | 'weak' | 'wrong'

const TABS: { id: Tab; zh: string }[] = [
  { id: 'due', zh: '到期' },
  { id: 'weak', zh: '薄弱' },
  { id: 'wrong', zh: '错题' },
]

export function ReviewHub() {
  const router = useRouter()
  const sp = useSearchParams()
  const raw = sp.get('tab')
  const tab: Tab = raw === 'weak' || raw === 'wrong' ? raw : 'due'

  const dueCount = useLexiStore(s => s.getDue().length)
  const weakCount = useLexiStore(s => s.getWeak().length)
  const wrongCount = useLearningStore(s => s.wrongAnswers.length)
  const counts: Record<Tab, number> = { due: dueCount, weak: weakCount, wrong: wrongCount }

  function go(t: Tab) {
    router.replace(t === 'due' ? '/memory' : `/memory?tab=${t}`)
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

      {/* tab content */}
      {tab === 'due' && <ReviewScreen source="due" />}
      {tab === 'weak' && <ReviewScreen source="weak" />}
      {tab === 'wrong' && (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 20px 100px' }}>
          <WrongAnswerList />
        </div>
      )}
    </div>
  )
}
