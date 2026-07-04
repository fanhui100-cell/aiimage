'use client'
/* FreeTextRenderer — 自由文本（v2 free_text，email / essay）。
   实时词数 + 字数指引（非官方）；IME 友好。提交后由 review 驱动：评分中 / AI 估分(isEstimate) / 评分失败+重试。
   安全：不本地伪造对错与分数；估分明确标注「AI 估分，非官方分数」；review 缺失时给中性「暂不判分」反馈。
   仅渲染题目主体 + 本题型评分子面板（topbar/qfoot/shell 由 PracticeRunner 提供）。 */
import type { PracticeItem } from '../practice-types'

/** AI 估分明细（仅在 submitted 后由父级经 review 透传；预提交绝不含分数）。 */
export interface FreeTextRubricLine {
  name: string
  /** 0–100 进度值 */
  v: number
}
export interface FreeTextEstimate {
  provider: string
  score: number
  outOf: number
  band: string
  rubric: FreeTextRubricLine[]
}
export interface FreeTextReview {
  /** 评分流转态：评分中 / 估分完成 / 评分失败。缺省视为 idle（中性反馈）。 */
  phase?: 'pending' | 'done' | 'error'
  estimate?: FreeTextEstimate
  /** 评分中文案里的服务商名（pending 态展示）。 */
  provider?: string
}

/** FreeText 题目主体可选展示字段（非答案，可预提交展示）。 */
type FreeTextItem = PracticeItem & {
  wordMin?: number
  wordMax?: number
  guide?: string
}

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z" /></svg>
)
const RetryIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></svg>
)
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
)
const LangIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" /></svg>
)

export function FreeTextRenderer({
  item, value, submitted, review, onChange, onRetry,
}: {
  item?: FreeTextItem
  value: string
  submitted: boolean
  review?: FreeTextReview | null
  onChange: (v: string) => void
  /** 评分失败时的重试回调（由父级提供；无则不渲染重试钮）。 */
  onRetry?: () => void
}) {
  // 控制式空态：题目主体缺失时不抛错、不判分。
  if (!item || (!item.prompt && !item.promptZh)) {
    return (
      <div className="spell" role="status" aria-live="polite">
        <div className="feedback show note">
          <div className="fb-head">题目内容缺失</div>
          <div className="fb-exp">本题暂无可作答的内容，可跳过。</div>
        </div>
      </div>
    )
  }

  // 实时词数：英文词/数字/连字符 与 单个 CJK 字符各计 1（非官方，仅作字数指引）。
  const wc = (value.match(/[A-Za-z0-9''\-]+|[一-龥]/g) || []).length
  const wordMin = item.wordMin
  const wordMax = item.wordMax
  const over = wordMax != null && wc > wordMax
  const limLabel = wordMin != null && wordMax != null ? `/ ${wordMin}–${wordMax} 词` : '词'

  // 答案/分数仅在 submitted 后从 review 取；预提交 DOM/state 不含任何答案。
  const phase: FreeTextReview['phase'] = submitted ? (review?.phase ?? 'done') : undefined
  const estimate = submitted ? review?.estimate : undefined
  const provider = review?.provider ?? estimate?.provider ?? 'AI'

  // 口语转写边界（2026-07-05 Task 3）：speak 题走文字转写估分；录音不上传、不保存、不建 Storage 对象。
  const isSpeaking = item.inputMode === 'speak'

  return (
    <div className="fade-up">
      <div className="eyebrow">
        <span className="tag">{isSpeaking ? '口语' : '写作'}</span>
        <span className="ask">{isSpeaking ? ASK_SPEAKING : ASK_FREE_TEXT}</span>
      </div>

      <div className="pr-prompt-card">
        {item.promptZh ? <div className="pl">{item.promptZh}</div> : null}
        <div className="pq">{item.prompt}</div>
      </div>

      {isSpeaking && (
        <div className="feedback show note" role="note" style={{ marginBottom: 10 }}>
          <div className="fb-exp">口语练习当前按文字转写估分；录音不会上传或保存。请把你要说的话打字或粘贴到下方。</div>
        </div>
      )}

      <div className="pr-ta-wrap">
        <label className="sr-only" htmlFor="pr-ft">作答</label>
        <textarea
          id="pr-ft"
          className="pr-ta"
          placeholder={isSpeaking ? '把你的口语作答以文字转写形式输入…（录音不会上传或保存）' : '在此用英文撰写你的作答…（支持中/英文输入法）'}
          value={value}
          disabled={submitted}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby="pr-wc pr-guide"
        />
      </div>
      <div className="pr-ta-foot">
        <span id="pr-wc" className={'pr-wc' + (over ? ' over' : '')} aria-live="polite">
          {wc} <span className="lim">{limLabel}</span>
        </span>
        <span className="pr-ime"><LangIcon /> IME 友好</span>
        {item.guide ? <span id="pr-guide" className="pr-guide">{item.guide}</span> : <span id="pr-guide" className="sr-only" />}
      </div>

      {/* 评分中 */}
      {submitted && phase === 'pending' && (
        <div className="pr-pending" role="status" aria-live="polite">
          <span className="pr-spin" aria-hidden="true" />
          <div>
            <div className="pt">评分中…</div>
            <div className="pd">正在调用 {provider} 估分，约需数秒</div>
          </div>
        </div>
      )}

      {/* AI 估分结果（isEstimate=true，非官方） */}
      {submitted && phase === 'done' && estimate && (
        <div className="pr-estimate" role="status" aria-live="polite">
          <div className="pr-est-head">
            <div className="pr-est-top">
              <span className="pr-est-badge"><SparkIcon /> AI 估分</span>
              <span className="pr-est-prov">{estimate.provider}</span>
            </div>
            <div className="pr-est-score">
              <b>{estimate.score.toFixed(1)}</b>
              <span className="out">/ {estimate.outOf}</span>
              <span className="band">{estimate.band}</span>
            </div>
            <div className="pr-est-disc">AI 估分，非官方分数 · isEstimate=true。结果仅供自我评估参考，不计入正式成绩。</div>
          </div>
          <div className="pr-est-body">
            <div className="pr-rubric">
              {estimate.rubric.map((r) => (
                <div className="pr-rub" key={r.name}>
                  <span className="rn">{r.name}</span>
                  <span className="rb"><i style={{ width: r.v + '%' }} /></span>
                  <span className="rv">{r.v}</span>
                </div>
              ))}
            </div>
            {onRetry && (
              <div className="pr-est-actions">
                <button type="button" className="pr-est-retry press" onClick={onRetry}><RetryIcon /> 重新估分</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 评分中性态：提交但无可用估分 → 不伪造分数 */}
      {submitted && phase === 'done' && !estimate && (
        <div className="feedback show note" role="status" aria-live="polite">
          <div className="fb-head">已提交 · 暂不判分</div>
          <div className="fb-exp">本题为产出型练习，AI 估分为可选功能；评分就绪后再给出反馈，不计入正式成绩。</div>
        </div>
      )}

      {/* 评分失败 + 重试 */}
      {submitted && phase === 'error' && (
        <div className="pr-error" role="alert">
          <span className="ei"><WarnIcon /></span>
          <div style={{ flex: 1 }}>
            <div className="et">评分服务暂时不可用</div>
            <div className="ed">你的作答已保存。AI 估分为可选功能，可稍后重试；不影响本次练习的提交记录。</div>
            {onRetry && (
              <button type="button" className="er press" onClick={onRetry}><RetryIcon /> 重试估分</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const ASK_FREE_TEXT = '根据要求完成写作'
const ASK_SPEAKING = '按提示口头作答，并以文字转写提交'
