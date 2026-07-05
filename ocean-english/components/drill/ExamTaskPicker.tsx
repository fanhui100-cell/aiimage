'use client'
/* ExamTaskPicker — 考试专项（Phase 6 核心）：exam → section → task 手风琴。
   读 lib/exam-specs 结构；task 三态由 deriveTaskState（与后端空池判定一致）。
   可练 task 点击 → /quiz?mode=task&examId&taskType&level（复用 PracticeRunner）。
   空池绝不回退到无关词汇题：选卡台显示「题库建设中」，runner 侧再兜底。 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ic } from '@/components/screens/drill/DrillShared'
import { fmt } from '@/components/screens/drill/drill-data'
import { EXAM_SPECS, getExamSpec, type ExamSectionSpec, type ExamSpec } from '@/lib/exam-specs'
import { DrillEmptyState } from './DrillEmptyState'
import { GROUP_MODE_ZH, bestTask, deriveSectionState, deriveTaskState, skillMeta, taskLabel } from './exam-task-data'

function TaskCard({ exam, section, taskType, delay = 0, onLaunch }: { exam: ExamSpec; section: ExamSectionSpec; taskType: string; delay?: number; onLaunch: (exam: ExamSpec, taskType: string) => void }) {
  const [zh, en] = taskLabel(taskType)
  const sk = skillMeta(section.skill)
  const st = deriveTaskState(exam, taskType)
  const gm = GROUP_MODE_ZH[section.groupMode] ?? section.groupMode
  return (
    <div className={`lx-es-task ${st.state}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="lx-es-task-top">
        <span className="tic" style={{ background: sk.bg, color: sk.color }}><Ic name={sk.ic} s={17} /></span>
        <div className="tt"><div className="tzh">{zh}</div><div className="ten">{en}</div></div>
      </div>
      <div className="lx-es-task-tags">
        <span className="lx-es-tag">{sk.zh}</span>
        <span className="lx-es-tag">{gm}</span>
        <span className="lx-es-tag"><b>{section.itemCount}</b> 题</span>
        {!!section.points && section.points > 0 && <span className="lx-es-tag"><b>{section.points}</b> 分</span>}
        {section.requiresAudio && <span className="lx-es-tag">需音频</span>}
        {section.requiresRubric && <span className="lx-es-tag">需评分</span>}
      </div>
      {st.state === 'ok' && (
        <div className="lx-es-foot">
          <span className="lx-es-status ok"><span className="pd" aria-hidden="true" />可练</span>
          <span className="qty">{fmt(st.count)} 题在库</span>
          <button className="lx-es-go" onClick={() => onLaunch(exam, taskType)}>开始练习 <Ic name="arrowright" s={14} sw={2.2} /></button>
        </div>
      )}
      {st.state === 'build' && (
        <>
          <div className="lx-es-foot"><span className="lx-es-status build"><span className="pd" aria-hidden="true" />题库建设中</span></div>
          <div className="tmini">该 active 题组不足，正在装配；就绪后自动可练，期间不用无关词汇题顶替。</div>
        </>
      )}
      {st.state === 'plan' && (
        <>
          <div className="lx-es-foot"><span className="lx-es-status plan"><span className="pd" aria-hidden="true" />规划中</span></div>
          <div className="tmini">生产性任务（{sk.zh}）需 v2 评分支持，结构位已就绪，随生成阶段开放。</div>
        </>
      )}
    </div>
  )
}

function SectionMeta({ section }: { section: ExamSectionSpec }) {
  const tail = section.taskTypes.length > 1 ? `${section.taskTypes.length} 任务` : taskLabel(section.taskTypes[0])[0]
  return <span className="es-secmeta">{section.itemCount} 题{section.points ? ` · ${section.points} 分` : ''} · {tail}</span>
}

function ExamStrip({ examId, onPick }: { examId: string; onPick: (id: string) => void }) {
  return (
    <div className="lx-es-strip" role="tablist" aria-label="选择考试">
      {EXAM_SPECS.map((e) => (
        <button key={e.id} role="tab" aria-selected={examId === e.id}
          className={`lx-es-exam ${examId === e.id ? 'on' : ''} ${(e.status === 'draft' || e.status === 'coming_soon') ? 'soon' : ''}`} onClick={() => onPick(e.id)}>
          {(e.status === 'draft' || e.status === 'coming_soon') && <span className="esoon">题库建设中</span>}
          <div className="ezh">{e.labelZh}</div>
          <div className="een">{e.labelEn}</div>
          <div className="emeta"><span><b>{e.totalMinutes}</b>′</span><span>满分 <b>{e.fullScore}</b></span></div>
        </button>
      ))}
    </div>
  )
}

function hchip(exam: ExamSpec, section: ExamSectionSpec): [string, string] {
  const ss = deriveSectionState(exam, section)
  if (ss === 'ok') return ['ok', `可练 ${section.taskTypes.filter((t) => deriveTaskState(exam, t).state === 'ok').length}`]
  if (ss === 'plan') return ['plan', '规划中']
  return ['build', '题库建设中']
}

export function ExamTaskPicker({ mob }: { mob?: boolean }) {
  const router = useRouter()
  const [examId, setExamId] = useState('cet4')
  const exam = getExamSpec(examId) ?? EXAM_SPECS[0]
  const draft = exam.status === 'draft' || exam.status === 'coming_soon'
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set([exam.sections[0]?.id]))
  useEffect(() => {
    const s = getExamSpec(examId)?.sections[0]?.id
    setOpenIds(new Set(s ? [s] : []))
  }, [examId])

  const toggle = (id: string) => setOpenIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const allOpen = openIds.size === exam.sections.length
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(exam.sections.map((s) => s.id)))

  const onLaunch = (ex: ExamSpec, taskType: string) => {
    router.push(`/quiz?mode=task&examId=${ex.id}&taskType=${taskType}&level=${ex.level}`)
  }

  return (
    <div className="lx-face face-exam-wrap">
      <p className="lx-eyebrow"><span className="dot" />考试专项 · EXAM TASKS</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>按<em>真实考试结构</em>练任务</h1>
      <p className="lx-sub">选考试 → 板块 → 任务，按官方 <b>section / task</b> 结构出题；题目由 <b>question_bank</b> 按「任务 × 等级」装配。<b>题库未就绪的任务显示「建设中」，绝不回退到无关词汇题。</b></p>

      <ExamStrip examId={examId} onPick={setExamId} />

      {draft && <div style={{ marginTop: 14 }}><DrillEmptyState variant="exam" title={`${exam.labelZh} 题库建设中`} /></div>}

      <div className="lx-es-acc" key={examId} style={{ marginTop: 16 }}>
        <div className="lx-es-accbar">
          <span className="l"><b>{exam.labelZh}</b> · {exam.sections.length} 个板块 · {exam.sections.reduce((a, s) => a + s.taskTypes.length, 0)} 个任务</span>
          <button className="x" onClick={toggleAll}>{allOpen ? '全部收起' : '全部展开'}</button>
        </div>
        {exam.sections.map((s, i) => {
          const sk = skillMeta(s.skill)
          const open = openIds.has(s.id)
          const [chipCls, chipTxt] = hchip(exam, s)
          return (
            <div className={`lx-es-accrow ${open ? 'open' : ''}`} key={s.id}>
              <button className="lx-es-acchead" aria-expanded={open} onClick={() => toggle(s.id)}>
                <span className="an">{i + 1}</span>
                <span className="aic" style={{ background: sk.bg, color: sk.color }}><Ic name={sk.ic} s={16} /></span>
                <span className="ab">
                  <span className="anm">{s.labelZh}<em>{s.labelEn}</em></span>
                  <SectionMeta section={s} />
                </span>
                <span className={`lx-es-hchip ${chipCls}`}><span className="pd" aria-hidden="true" />{chipTxt}</span>
                <span className={`achev ${open ? 'open' : ''}`}><Ic name="chev" s={17} sw={2.2} /></span>
              </button>
              <div className="lx-es-accwrap">
                <div className="lx-es-accinner">
                  <div className="lx-es-accbody">
                    <div className="lx-es-tasks">
                      {s.taskTypes.map((t, ti) => <TaskCard key={t} exam={exam} section={s} taskType={t} delay={ti * 55} onLaunch={onLaunch} />)}
                    </div>
                    {s.notes && <p className="lx-es-secnote">{s.notes}</p>}
                    <div className="lx-es-route">
                      <Ic name="arrowright" s={15} sw={2} />
                      <span>可练任务 → 跳 <code>/quiz?mode=task&examId={exam.id}&taskType={bestTask(exam, s)}&level={exam.level}</code>，复用 PracticeRunner。</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
