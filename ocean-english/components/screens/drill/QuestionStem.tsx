'use client'
/* QuestionStem.tsx — 题干渲染（移植自 /quiz 的 PromptCard 分支逻辑，套用原型 .lx-* 视觉）
   按题型语义显示：阅读篇章+问题 / 听力播放+问题 / 完形挖空 / 拼写中文释义 / 释义选词 / 词干。
   自由练（BRun）与模拟考（MockRun）共用，保证 22 题型在所有等级显示一致。 */
import type { ReactNode } from 'react'
import { Ic } from './DrillShared'
import type { DrillQuestion } from './drill-questions'

// 完形挖空：拆 [BLANK] → 文本 + 空格标记
function clozeNodes(text: string): ReactNode[] {
  const parts = String(text || '').split('[BLANK]')
  const out: ReactNode[] = []
  parts.forEach((p, i) => {
    if (i > 0) out.push(<span key={`b${i}`} style={{ color: 'var(--accent-ink)', borderBottom: '2px solid var(--accent)' }}>&nbsp;?&nbsp;</span>)
    out.push(<span key={`t${i}`}>{p}</span>)
  })
  return out
}

export function QuestionStem({ q, onPlay }: { q: DrillQuestion; onPlay: () => void }) {
  // 1) 阅读理解：屏显短文 + 提示语 + 实际问题
  if (q.isReading && q.passage) {
    return (
      <>
        <div className="lx-demolabel">阅读篇章</div>
        <div className="lx-passage-stub">{q.passage}</div>
        {q.promptZh && <div className="lx-q-zh">{q.promptZh}</div>}
        {q.prompt && <div className="lx-q-stem" style={{ fontSize: 18, fontStyle: 'normal', marginTop: 8 }}>{q.prompt}</div>}
      </>
    )
  }
  // 2) 听力题（听音选义 / 听写 / 听短文理解）：播放按钮 + 提示语 + 理解题题干
  if (q.isListen) {
    return (
      <div style={{ textAlign: 'center' }}>
        <button className="lx-listen-play" onClick={onPlay}><Ic name="play" s={24} sw={2} /></button>
        {q.promptZh && <div className="lx-q-zh">{q.promptZh}</div>}
        {q.type === 'listening_comprehension' && q.prompt && <div className="lx-q-stem" style={{ fontSize: 18, fontStyle: 'normal', marginTop: 10 }}>{q.prompt}</div>}
      </div>
    )
  }
  // 3) 完形 / 同义替换：屏显带空格（或带「」）的句子 + 提示语
  if (q.type === 'cloze_choice' || q.type === 'cloze_spell' || q.type === 'synonym_substitute') {
    return (
      <>
        <div className="lx-q-stem" style={{ fontSize: 21, fontStyle: 'normal', lineHeight: 1.55 }}>{clozeNodes(q.prompt)}</div>
        {q.ask && <div className="lx-q-zh" style={{ marginTop: 10 }}>{q.ask}</div>}
      </>
    )
  }
  // 4) 拼写（看中文释义拼写 / 词形变化）：屏显中文释义/题干 + 提示语
  if (q.inputMode === 'spell') {
    return (
      <>
        <div className="lx-q-stem" style={{ fontFamily: 'var(--font-serif-zh)', fontStyle: 'normal', fontSize: 23 }}>{q.promptZh || q.prompt}</div>
        {q.ask && <div className="lx-q-zh" style={{ marginTop: 8 }}>{q.ask}</div>}
      </>
    )
  }
  // 5) 释义选词 / 中译英 / 易混辨析：屏显释义/中文 + 提示语（答案是单词，不显示词干）
  if (q.type === 'def_to_word' || q.type === 'zh_to_en' || q.type === 'confusable_choice') {
    return (
      <>
        <div className="lx-q-stem" style={{ fontSize: 20, fontStyle: 'normal', lineHeight: 1.5 }}>{q.promptZh || q.prompt}</div>
        {q.ask && <div className="lx-q-zh" style={{ marginTop: 8 }}>{q.ask}</div>}
      </>
    )
  }
  // 6) 其余（英译中 / 近义 / 反义 / 搭配）：显示词干 + 音标 + 提示语
  return (
    <>
      <div className="lx-q-stem">{q.prompt || q.word}</div>
      {q.ipa && <div className="lx-q-phon">{q.ipa}</div>}
      {q.ask && <div className="lx-q-zh" style={{ marginTop: 8 }}>{q.ask}</div>}
    </>
  )
}
