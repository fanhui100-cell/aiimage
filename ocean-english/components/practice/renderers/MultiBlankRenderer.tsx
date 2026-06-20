'use client'
/* MultiBlankRenderer — v2 多空题暂无数据形态 → 受控「建设中」占位（不报错、不计分）。 */

export function MultiBlankRenderer() {
  return (
    <div className="prompt muted" role="note">
      <div className="zh">该题型暂不可用</div>
      <div className="ask">题库建设中，先用其它题型练习（多空填空）</div>
    </div>
  )
}
