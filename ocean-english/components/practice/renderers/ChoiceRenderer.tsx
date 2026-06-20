'use client'
/* ChoiceRenderer — 单选（含 reading/listening 的选择作答）。真 <button aria-pressed>，键盘可达。 */
import type { PracticeItem } from '../practice-types'
import { OkMark, NoMark } from '../icons'

export function ChoiceRenderer({
  item, locked, picked, correctId, onPick,
}: {
  item: PracticeItem
  locked: boolean
  picked: string | null
  correctId: string | null
  onPick: (id: string) => void
}) {
  const opts = item.choices ?? []
  return (
    <div className="opts" role="group" aria-label="选项">
      {opts.map((o, i) => {
        const isPicked = picked === o.id
        const isAnswer = correctId != null && o.id === correctId
        const cls = locked && isAnswer ? 'correct' : locked && isPicked ? 'wrong' : ''
        return (
          <button
            key={o.id}
            type="button"
            className={`opt press ${locked ? 'locked' : ''} ${cls}`}
            disabled={locked}
            aria-pressed={isPicked}
            onClick={() => onPick(o.id)}
          >
            <span className="key">{'ABCD'[i] ?? String(i + 1)}</span>
            <span className="otxt">{o.text}</span>
            {locked && (isAnswer || isPicked) && (
              <span className="mk">{isAnswer ? <OkMark /> : <NoMark />}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
