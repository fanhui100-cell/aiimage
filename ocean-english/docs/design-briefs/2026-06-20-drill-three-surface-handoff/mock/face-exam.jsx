/* face-exam.jsx — 考试专项（核心新面）：exam → section → task 层级选择
   读 EXAM_SPECS（= GET /api/exam-specs）；task 三态由 deriveTaskState 推导（= /api/practice/session 空池判定）。
   板块排版：手风琴（板块整行堆叠，点开内联任务；支持多开 + 平滑高度）。 */
const { useState: useSE, useEffect: useEE } = React

function TaskCard({ exam, section, taskType, onLaunch, delay = 0 }) {
  const [zh, en] = taskLabel(taskType)
  const sk = SKILL_META[section.skill] || SKILL_META.vocabulary
  const st = deriveTaskState(exam, taskType)
  const gm = GROUP_MODE_ZH[section.groupMode] || section.groupMode
  return (
    <div className={`lx-es-task ${st.state}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="lx-es-task-top">
        <span className="tic" style={{ background: sk.bg, color: sk.color }}><Ic name={sk.ic} s={17} /></span>
        <div className="tt">
          <div className="tzh">{zh}</div>
          <div className="ten">{en}</div>
        </div>
      </div>
      <div className="lx-es-task-tags">
        <span className="lx-es-tag">{sk.zh}</span>
        <span className="lx-es-tag">{gm}</span>
        <span className="lx-es-tag"><b>{section.itemCount}</b> 题</span>
        {section.points > 0 && <span className="lx-es-tag"><b>{section.points}</b> 分</span>}
        {section.requiresAudio && <span className="lx-es-tag">需音频</span>}
        {section.requiresRubric && <span className="lx-es-tag">需评分</span>}
      </div>

      {st.state === 'ok' && (
        <div className="lx-es-foot">
          <span className="lx-es-status ok"><span className="pd" />可练</span>
          <span className="qty">{fmt(st.count)} 题在库</span>
          <button className="lx-es-go" onClick={() => onLaunch(exam, section, taskType)}>开始练习 <Ic name="arrowright" s={14} sw={2.2} /></button>
        </div>
      )}
      {st.state === 'build' && (<>
        <div className="lx-es-foot"><span className="lx-es-status build"><span className="pd" />题库建设中</span></div>
        <div className="tmini">该 active 题组不足，正在装配；就绪后自动可练，期间不用无关词汇题顶替。</div>
      </>)}
      {st.state === 'plan' && (<>
        <div className="lx-es-foot"><span className="lx-es-status plan"><span className="pd" />规划中</span></div>
        <div className="tmini">生产性任务（{sk.zh}）需 v2 评分支持，结构位已就绪，随生成阶段开放。</div>
      </>)}
    </div>
  )
}

function SectionMeta({ section }) {
  return <span className="es-secmeta">{section.itemCount} 题{section.points > 0 ? ` · ${section.points} 分` : ''} · {section.taskTypes.length > 1 ? `${section.taskTypes.length} 任务` : taskLabel(section.taskTypes[0])[0]}</span>
}

function TaskGrid({ exam, section, onLaunch }) {
  return (
    <>
      <div className="lx-es-tasks">
        {section.taskTypes.map((t, i) => <TaskCard key={t} exam={exam} section={section} taskType={t} onLaunch={onLaunch} delay={i * 55} />)}
      </div>
      {section.notes && <p className="lx-es-secnote">{section.notes}</p>}
    </>
  )
}

/* ── 考试 strip ── */
function ExamStrip({ examId, setExamId }) {
  return (
    <div className="lx-es-strip" role="tablist" aria-label="选择考试">
      {EXAM_SPECS.map(e => (
        <button key={e.id} role="tab" aria-selected={examId === e.id}
          className={`lx-es-exam ${examId === e.id ? 'on' : ''} ${e.status === 'draft' ? 'soon' : ''}`} onClick={() => setExamId(e.id)}>
          {e.status === 'draft' && <span className="esoon">题库建设中</span>}
          <div className="ezh">{e.labelZh}</div>
          <div className="een">{e.labelEn}</div>
          <div className="emeta"><span><b>{e.totalMinutes}</b>′</span><span>满分 <b>{e.fullScore}</b></span></div>
        </button>
      ))}
    </div>
  )
}

const ROUTE_NOTE = (exam, section) => (
  <div className="lx-es-route">
    <Ic name="arrowright" s={15} sw={2} />
    <span>可练任务 → 跳 <code>/quiz?mode=task&examId={exam.id}&taskType={bestTask(exam, section)}&level={exam.level}</code>，复用 PracticeRunner。</span>
  </div>
)

/* ════ 手风琴：板块整行堆叠，点开内联任务；多开 + 平滑高度 ════ */
const HCHIP = (exam, section) => {
  const ss = deriveSectionState(exam, section)
  if (ss === 'ok') return ['ok', `可练 ${section.taskTypes.filter(t => deriveTaskState(exam, t).state === 'ok').length}`]
  if (ss === 'plan') return ['plan', '规划中']
  return ['build', '题库建设中']
}

function ExamSpecialtyFace({ mob, onLaunch }) {
  const [examId, setExamId] = useSE('cet4')
  const exam = getExamSpec(examId)
  const draft = exam.status === 'draft'
  const [openIds, setOpenIds] = useSE(() => new Set([exam.sections[0].id]))
  useEE(() => { setOpenIds(new Set([getExamSpec(examId).sections[0].id])) }, [examId])
  const toggle = id => setOpenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allOpen = openIds.size === exam.sections.length
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(exam.sections.map(s => s.id)))

  return (
    <div className="lx-face face-exam-wrap">
      <p className="lx-eyebrow"><span className="dot" />考试专项 · EXAM TASKS</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>按<em>真实考试结构</em>练任务</h1>
      <p className="lx-sub">选考试 → 板块 → 任务，按官方 <b>section / task</b> 结构出题；题目由 <b>question_bank</b> 按「任务 × 等级」装配。<b>题库未就绪的任务显示「建设中」，绝不回退到无关词汇题。</b></p>

      <ExamStrip examId={examId} setExamId={setExamId} />

      {draft && <div style={{ marginTop: 14 }}><DrillEmptyState variant="exam" title={`${exam.labelZh} 题库建设中`} /></div>}

      <div className="lx-es-acc" key={examId} style={{ marginTop: 16 }}>
        <div className="lx-es-accbar">
          <span className="l"><b>{exam.labelZh}</b> · {exam.sections.length} 个板块 · {exam.sections.reduce((a, s) => a + s.taskTypes.length, 0)} 个任务</span>
          <button className="x" onClick={toggleAll}>{allOpen ? '全部收起' : '全部展开'}</button>
        </div>
        {exam.sections.map((s, i) => {
          const sk = SKILL_META[s.skill] || SKILL_META.vocabulary
          const open = openIds.has(s.id)
          const [chipCls, chipTxt] = HCHIP(exam, s)
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
                  <div className="lx-es-accbody"><TaskGrid exam={exam} section={s} onLaunch={onLaunch} />{ROUTE_NOTE(exam, s)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

Object.assign(window, { ExamSpecialtyFace, TaskCard })
