'use client'
/* FreeTextRenderer — 自由文本（v2 free_text）。收集文本、标记已提交；无评分 API 时不判分（中性反馈）。 */

export function FreeTextRenderer({
  value, submitted, onChange,
}: {
  value: string
  submitted: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="spell">
      <label className="sr-only" htmlFor="pr-freetext-input">作答</label>
      <textarea
        id="pr-freetext-input"
        className="lg-input"
        rows={4}
        style={{ textAlign: 'left', resize: 'vertical', fontFamily: 'var(--font-sans)', letterSpacing: 0, lineHeight: 1.6 }}
        placeholder="写下你的答案…"
        value={value}
        disabled={submitted}
        onChange={(e) => onChange(e.target.value)}
      />
      {submitted && (
        <div className="feedback show note" role="status">
          <div className="fb-head">已提交 · 暂不判分</div>
          <div className="fb-exp">本题为产出型练习，评分功能上线后再给出反馈。</div>
        </div>
      )}
    </div>
  )
}
