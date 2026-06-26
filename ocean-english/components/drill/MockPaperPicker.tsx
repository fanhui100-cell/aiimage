'use client'
/* MockPaperPicker — 模拟试卷（Phase 6）。改读 canonical exam-specs（替代旧 PAPER_SPECS）。
   题源经 bestTask 取板块首个可练客观 taskType，绝不暴露退役题型；生产性板块标「主观题·不计入客观卷」。
   TOEFL/SAT(draft) coming-soon 置灰、CTA 禁用。开始 → onStart({kind:'mock',exam}) 复用现有 MockRun。 */
import { useState, type CSSProperties } from 'react'
import { Ic } from '@/components/screens/drill/DrillShared'
import { fmt } from '@/components/screens/drill/drill-data'
import { EXAM_SPECS, getExamSpec } from '@/lib/exam-specs'
import { isExamTaskType } from '@/lib/question-bank/question-type-taxonomy'
import { GROUP_MODE_ZH, bestTask, deriveTaskState, taskLabel } from './exam-task-data'

export interface MockStartCfg { kind: 'mock'; exam: string; level: string }

const VIOLET: CSSProperties = { ['--accent' as string]: 'var(--violet-ink)', ['--accent-bg' as string]: 'var(--violet-bg)', ['--accent-ink' as string]: 'var(--violet-ink)', ['--accent-deep' as string]: 'var(--violet-ink)' }

export function MockPaperPicker({ mob, onStart }: { mob?: boolean; onStart: (cfg: MockStartCfg) => void }) {
  const [examId, setExamId] = useState('cet4')
  const exam = getExamSpec(examId) ?? EXAM_SPECS[0]
  const draft = exam.status === 'draft' || exam.status === 'coming_soon'
  const totalQ = exam.sections.reduce((s, x) => s + x.itemCount, 0)
  const objSecs = exam.sections.filter((s) => s.taskTypes.some(isExamTaskType))
  const objPoints = objSecs.reduce((s, x) => s + (x.points || 0), 0)

  return (
    <div className="lx-face">
      <p className="lx-eyebrow"><span className="dot" />模拟试卷 · MOCK PAPER</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>整卷限时，<em>真分制评分</em></h1>
      <p className="lx-sub">按各考试<b>真实结构</b>整卷限时；题目由 <b>question_bank</b> 按「任务 × 等级」装配，不含真题版权内容。退役题型不出现，TOEFL / SAT 题库建设中。</p>

      <div className={`lx-exam-grid ${mob ? 'mob' : ''}`} style={{ marginTop: 18 }}>
        {EXAM_SPECS.map((e) => (
          <button key={e.id} className={`lx-exam ${examId === e.id ? 'on' : ''} ${(e.status === 'draft' || e.status === 'coming_soon') ? 'soon' : ''}`} onClick={() => setExamId(e.id)}>
            {(e.status === 'draft' || e.status === 'coming_soon') && <span className="lx-exam-soon">题库建设中</span>}
            <div className="lx-exam-zh">{e.labelZh}</div>
            <div className="lx-exam-en">{e.labelEn}</div>
            <div className="lx-exam-meta"><span><b>{e.totalMinutes}</b>′</span><span>满分 <b>{e.fullScore}</b></span></div>
          </button>
        ))}
      </div>

      <div className="lx-paper" key={examId} style={VIOLET}>
        {draft && <div className="lx-soonbanner"><Ic name="pen" s={14} /><span><b>{exam.labelZh} 题库建设中</b> · 以下为规划结构草案；题库就绪后即可一键接入。</span></div>}
        <div className="lx-paper-head">
          <div className="lx-paper-title">{exam.labelZh} · 模拟卷</div>
          <div className="lx-paper-sub">客观题整卷 · 共 {objSecs.length} 个区 · {totalQ} 小题</div>
          <div className="lx-paper-stats">
            <div className="lx-paper-stat"><div className="n">{exam.totalMinutes}′</div><div className="l">建议时长</div></div>
            <div className="lx-paper-stat"><div className="n">{objPoints || '—'}</div><div className="l">客观满分</div></div>
            <div className="lx-paper-stat"><div className="n">{exam.fullScore}</div><div className="l">真卷满分</div></div>
          </div>
        </div>
        <div className="lx-paper-body">
          {exam.sections.map((sec, i) => {
            const tk = bestTask(exam, sec)
            const [zh] = taskLabel(tk)
            const st = deriveTaskState(exam, tk)
            return (
              <div className="lx-paper-sec" key={sec.id}>
                <span className="sn">{i + 1}</span>
                <div className="sbody">
                  <div className="stitle">{sec.labelZh}<em>{sec.labelEn}</em></div>
                  <div className="ssrc">题源 <b>{zh}</b> · {st.state === 'ok'
                    ? <>{fmt(st.count)} 题在库</>
                    : st.state === 'plan'
                      ? <span style={{ color: 'var(--violet-ink)' }}>主观题 · 不计入客观卷</span>
                      : <span style={{ color: 'var(--gold-ink)' }}>待入库 · 建设中</span>} · {GROUP_MODE_ZH[sec.groupMode] ?? sec.groupMode}</div>
                </div>
                <div className="smeta"><div className="q">{sec.itemCount} 题</div><div className="p">{sec.points || '—'} 分</div></div>
              </div>
            )
          })}
        </div>
        <div className="lx-paper-skip"><Ic name="pen" s={13} />本卷只做客观题；写作 / 翻译 / 口语等主观题不计入。</div>
      </div>

      {draft ? (
        <button className="lx-cta" disabled style={{ width: '100%', justifyContent: 'center', marginTop: 18, ...VIOLET }}><Ic name="clock" s={16} />题库建设中 · 敬请期待</button>
      ) : (
        <button className="lx-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 18, ...VIOLET }} onClick={() => onStart({ kind: 'mock', exam: exam.id, level: exam.id })}><Ic name="bolt" s={17} sw={2} />开始模拟考 · {exam.totalMinutes} 分钟</button>
      )}
    </div>
  )
}
