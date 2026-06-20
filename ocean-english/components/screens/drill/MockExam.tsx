'use client'
/* MockExam.tsx — 模拟考试（移植自原型 mock.jsx）
   选卷台 / 结果屏 JSX 一字不改；MockRun 把本地 SEC_SAMPLES 换成 GET /api/mock-exam 整卷，
   真实行（choices:{id,text}[]+answer:选项id）适配成原型 opts:string[]+ans:索引。 */
import { useState as useM, useEffect as useME, useRef as useMR } from 'react'
import { PAPER_SPECS, getPaperSpec, sectionType, TYPE_BY_KEY, typeCount, fmt, type PaperSpec } from './drill-data'
import { Ic, Aurora } from './DrillShared'
import { MobileChrome } from './DrillFlow'
import { adapt, type DrillQuestion } from './drill-questions'
import { QuestionStem } from './QuestionStem'

function mspeak(t: string) { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch { /* noop */ } }

type MockStartCfg = { kind: 'mock'; exam: string; level: string }

export interface MockStats {
  kind: 'mock'; exam: string; cnExam: string; zh: string
  secStats: { label: string; points: number; correct: number; total: number; score: number }[]
  objectiveScore: number; objectivePoints: number; scaled: number; fullPoints: number
  wrongWords: string[]
}

interface MockChoice { id: string; text: string }
interface MockRow {
  id: string | number; type: string; input_mode?: string
  word_id?: string | number | null; normalized_word?: string | null
  prompt?: string | null; prompt_zh?: string | null
  choices?: MockChoice[] | null; answer?: string | number | null; answer_text?: string | null
  hint?: { initials?: string; ipa?: string } | string | null
  audio_ref?: string | null; explanation_zh?: string | null
}
interface MockPaperSection { key: string; label: string; en: string; type: string; points: number; questions: MockRow[]; note?: string }
interface MockPaper { exam: string; zh: string; cnExam: string; level: number; minutes: number; objectivePoints: number; fullPoints: number; skipped: string[]; seed: number; totalQuestions: number; sections: MockPaperSection[] }
// 行 → 题目结构复用 drill-questions.adapt（与 /quiz、自由练同一套语义）；无法作答的行 q=null（占位）
interface MockItem { si: number; sec: MockPaperSection; q: DrillQuestion | null; row: MockRow }

/* ───────────── 选卷台 ───────────── */
function MockExamPicker({ mob, onStart }: { mob?: boolean; onStart: (cfg: MockStartCfg) => void }) {
  const [exam, setExam] = useM('cet4')
  const spec: PaperSpec = getPaperSpec(exam) ?? PAPER_SPECS[0]
  const totalQ = spec.sections.reduce((s, x) => s + x.questions, 0)
  return (
    <div>
      <div className="lx-paper-src" style={{ marginTop: 4, marginBottom: 16 }}>
        <Ic name="check" s={15} sw={2.2} />
        <span>按各考试<b>真实结构</b>整卷限时、真分制评分；题目全部由 <b>question_bank</b> 按「类型 × 等级」装配，不含真题版权内容。</span>
      </div>

      <div className="lx-step-h" style={{ marginBottom: 11 }}><span className="lx-step-n">1</span><span className="lx-step-t">选目标考试</span><span className="lx-step-d">· 5 档已开放 + 托福 / SAT 题库建设中</span></div>
      <div className={`lx-exam-grid ${mob ? 'mob' : ''}`}>
        {PAPER_SPECS.map(p => (
          <button key={p.exam} className={`lx-exam ${exam === p.exam ? 'on' : ''} ${p.comingSoon ? 'soon' : ''}`} onClick={() => setExam(p.exam)}>
            {p.comingSoon && <span className="lx-exam-soon">题库建设中</span>}
            <div className="lx-exam-zh">{p.cnExam}</div>
            <div className="lx-exam-en">{p.zh.replace(/ · .*/, '')}</div>
            <div className="lx-exam-meta"><span><b>{p.minutes}</b>′</span><span>满分 <b>{p.fullPoints}</b></span></div>
          </button>
        ))}
      </div>

      {/* 试卷结构 */}
      <div className="lx-paper" key={exam}>
        {spec.comingSoon && (
          <div className="lx-soonbanner"><Ic name="pen" s={14} /><span><b>{spec.cnExam} 题库建设中</b> · 以下为规划结构草案；题库就绪后即可一键接入。</span></div>
        )}
        <div className="lx-paper-head">
          <div className="lx-paper-title">{spec.zh}</div>
          <div className="lx-paper-sub">客观题整卷 · 共 {spec.sections.length} 个区 · {totalQ} 小题</div>
          <div className="lx-paper-stats">
            <div className="lx-paper-stat"><div className="n">{spec.minutes}′</div><div className="l">建议时长</div></div>
            <div className="lx-paper-stat"><div className="n">{spec.objectivePoints}</div><div className="l">客观满分</div></div>
            <div className="lx-paper-stat"><div className="n">{spec.fullPoints}</div><div className="l">真卷满分</div></div>
          </div>
        </div>
        <div className="lx-paper-body">
          {spec.sections.map((sec, i) => {
            const tk = sectionType(sec, exam)
            const t = TYPE_BY_KEY[tk]
            return (
              <div className="lx-paper-sec" key={sec.key}>
                <span className="sn">{i + 1}</span>
                <div className="sbody">
                  <div className="stitle">{sec.label}<em>{sec.en}</em></div>
                  <div className="ssrc">题源 <b>{t ? t.zh : tk}</b> · {spec.comingSoon ? <span style={{ color: 'var(--gold-ink)' }}>待规划入库</span> : (typeCount(tk, exam) > 0 ? <>{fmt(typeCount(tk, exam))} 题在库</> : <span style={{ color: 'var(--gold-ink)' }}>待入库 · 回退近义题型</span>)} · {sec.mode === 'passages' ? '按整篇取' : '按行取'}</div>
                </div>
                <div className="smeta"><div className="q">{sec.questions} 题</div><div className="p">{sec.points} 分</div></div>
              </div>
            )
          })}
        </div>
        {spec.skipped.length > 0 && (
          <div className="lx-paper-skip"><Ic name="pen" s={13} />本卷只做客观题；{spec.skipped.join(' / ')} 等主观题不计入（{spec.objectivePoints}/{spec.fullPoints} 分制）。</div>
        )}
      </div>

      {spec.comingSoon ? (
        <button className="lx-cta" disabled style={{ width: '100%', justifyContent: 'center', marginTop: 18 }}>
          <Ic name="clock" s={16} />题库建设中 · 敬请期待
        </button>
      ) : (
        <button className="lx-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={() => onStart({ kind: 'mock', exam, level: exam })}>
          <Ic name="bolt" s={17} sw={2} />开始模拟考 · {spec.minutes} 分钟
        </button>
      )}
    </div>
  )
}

/* ───────────── 整卷答题（分区、无即时反馈、整体计时） ───────────── */
function MockRun({ config, mob, onFinish, onExit }: { config: { exam: string }; mob?: boolean; onFinish: (s: MockStats) => void; onExit: () => void }) {
  const [paper, setPaper] = useM<MockPaper | null>(null)
  const [idx, setIdx] = useM(0)
  const [picks, setPicks] = useM<number[]>([])
  const [time, setTime] = useM(0)
  const [ready, setReady] = useM(false)
  const [items, setItems] = useM<MockItem[] | null>(null)
  const doneRef = useMR(false)
  const picksRef = useMR<number[]>([])
  const builtRef = useMR(false)

  // 开考拉整卷
  useME(() => {
    let alive = true
    fetch(`/api/mock-exam?exam=${encodeURIComponent(config.exam)}`).then(r => r.json())
      .then(j => { if (alive) setPaper(j?.ok ? j.data : null) }).catch(() => { if (alive) setPaper(null) })
    return () => { alive = false }
  }, [config.exam])

  // 整卷就绪 → 展平为题序 + 初始化作答/计时（仅一次）
  useME(() => {
    if (!paper || builtRef.current) return
    builtRef.current = true
    const arr: MockItem[] = []
    paper.sections.forEach((sec, si) => { (sec.questions || []).forEach(row => arr.push({ si, sec, q: adapt(row), row })) })
    setItems(arr)
    const init = arr.map(() => -1)
    picksRef.current = init
    setPicks(init)
    setTime((paper.minutes || 1) * 60)
    setReady(true)
  }, [paper])

  const finish = (pk: number[] = picksRef.current) => {
    if (doneRef.current) return
    doneRef.current = true
    const list = items || []
    const secs = paper?.sections || []
    // 逐区计分：correct/total → ×该区分值
    const secStats = secs.map((s, si) => {
      const its = list.map((it, k) => ({ it, k })).filter(x => x.it.si === si)
      const correct = its.filter(x => x.it.q != null && pk[x.k] === x.it.q.ans).length
      const total = its.length
      const score = total ? Math.round(correct / total * s.points) : 0
      return { label: s.label, points: s.points, correct, total, score }
    })
    const objectiveScore = secStats.reduce((a, s) => a + s.score, 0)
    const objectivePoints = paper?.objectivePoints || 1
    const fullPoints = paper?.fullPoints || 0
    const scaled = Math.round(objectiveScore / objectivePoints * fullPoints)
    const wrongWords = [...new Set(
      list.filter((it, k) => it.q == null || pk[k] !== it.q.ans)
        .map(it => (it.row.normalized_word ?? '').trim())
        .filter(w => !!w && /^[a-zA-Z][a-zA-Z'’-]*$/.test(w)),
    )].slice(0, 12)
    onFinish({ kind: 'mock', exam: config.exam, cnExam: paper?.cnExam || '', zh: paper?.zh || '', secStats, objectiveScore, objectivePoints, scaled, fullPoints, wrongWords })
  }

  // 整体计时（整卷就绪后启动；到点交卷）
  useME(() => {
    if (!paper || !ready) return
    const t = setInterval(() => setTime(v => { if (v <= 1) { clearInterval(t); finish(picksRef.current); return 0 } return v - 1 }), 1000)
    return () => clearInterval(t)
  }, [paper, ready])

  const mm = String(Math.floor(time / 60)).padStart(2, '0'), ss = String(time % 60).padStart(2, '0')
  const pick = (oi: number) => setPicks(p => { const np = p.map((v, k) => k === idx ? oi : v); picksRef.current = np; return np })
  const next = () => { const list = items || []; if (idx + 1 >= list.length) finish(); else setIdx(i => i + 1) }

  if (!paper) return <div className="lx mode-exam"><Aurora /><div className="lx-scroll"><div className="lx-pad-d" style={{ paddingTop: 60 }}>正在组卷…</div></div></div>
  const list = items || []
  if (!list.length) return <div className="lx mode-exam"><Aurora /><div className="lx-scroll"><div className="lx-pad-d" style={{ paddingTop: 60 }}>该考试暂无可用题。<button className="lx-exit" onClick={onExit}>‹ 返回</button></div></div></div>
  const cur = list[idx]
  const sec = cur.sec
  const secLocalTotal = list.filter(x => x.si === cur.si).length
  const secLocalIdx = list.slice(0, idx + 1).filter(x => x.si === cur.si).length
  const q = cur.q

  return (
    <div className="lx mode-exam">
      <Aurora />
      {mob && <MobileChrome mode="exam" active="drill" noTab />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 34, paddingBottom: mob ? 34 : 40 }}>
        <div className="lx-runwrap">
          <div className="lx-runhead">
            <button className="lx-exit" onClick={onExit}>‹ 退出</button>
            <span className="lx-run-timer" style={time < 60 ? { color: 'var(--rose-ink)' } : { color: 'var(--accent-ink)' }}><Ic name="clock" s={14} /> {mm}:{ss}</span>
          </div>

          {/* 分区进度点 */}
          <div className="lx-secdots">
            {(paper.sections).map((s, si) => <i key={s.key} className={si < cur.si ? 'done' : (si === cur.si ? 'cur' : '')} />)}
          </div>
          <div className="lx-secbanner">
            <span className="sn">{cur.si + 1}</span>
            <div className="sb"><div className="st">{sec.label}<span style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', color: 'var(--ink-muted)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>{sec.en}</span></div><div className="sm">本区 {sec.questions.length} 题 · {sec.points} 分 · 题源 {TYPE_BY_KEY[sec.type]?.zh || ''}</div></div>
            <span className="sg">{cur.si + 1}/{paper.sections.length} 区</span>
          </div>

          <div className="lx-qmeta">
            <span className="lx-run-idx">第 {idx + 1} / {list.length} 题</span>
            <span className="lx-qtag" style={{ marginLeft: 'auto' }}>模拟考 · 交卷后统一评分</span>
          </div>

          {q ? (
            <div className="lx-qcard lx-glass" style={q.isReading ? { textAlign: 'left' } : undefined}>
              <QuestionStem q={q} onPlay={() => mspeak(q.audioRef || q.word || '')} />
            </div>
          ) : (
            <div className="lx-qcard lx-glass">
              <div className="lx-q-zh">该题型暂未展开为可作答小题，可直接进入下一题。</div>
            </div>
          )}

          {q && q.inputMode === 'choice' && q.opts && (
            <div className="lx-opts">
              {q.opts.map((o, i) => (
                <button key={i} className="lx-opt" style={picks[idx] === i ? { borderColor: 'var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent-ink)', fontWeight: 600 } : undefined} onClick={() => pick(i)}>
                  <span className="key" style={picks[idx] === i ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' } : undefined}>{'ABCD'[i]}</span>{o}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {idx > 0 && <button className="lx-rbtn ghost" style={{ flex: '0 0 auto', minWidth: 90 }} onClick={() => setIdx(i => i - 1)}>‹ 上一题</button>}
            <button className="lx-cta" style={{ flex: 1, justifyContent: 'center' }} onClick={next}>
              {idx + 1 >= list.length ? '交卷评分' : (secLocalIdx >= secLocalTotal ? '进入下一区' : '下一题')} <Ic name="arrow" s={16} sw={2} />
            </button>
          </div>
        </div>
      </div></div>
    </div>
  )
}

/* ───────────── 模拟考结果（真分制） ───────────── */
function MockResult({ stats, mob, onAgain, onConfig, onReview }: { stats: MockStats; mob?: boolean; onAgain: () => void; onConfig: () => void; onReview: () => void }) {
  const isCet = /CET|四级|六级|cet/i.test(stats.cnExam) || ['cet4', 'cet6'].includes(stats.exam)
  const passLine = isCet ? 425 : Math.round(stats.fullPoints * 0.6)
  const passed = stats.scaled >= passLine
  return (
    <div className="lx mode-exam">
      <Aurora />
      {mob && <MobileChrome mode="exam" active="drill" />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 62 : 34, paddingBottom: mob ? 80 : 40 }}>
        <div className="lx-runwrap lx-result">
          <div className={`lx-rbadge ${passed ? 'pass' : 'fail'}`} style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)', borderColor: 'color-mix(in srgb,var(--accent) 30%,transparent)' }}><Ic name="target" s={28} /></div>
          <div className="lx-eyebrow" style={{ justifyContent: 'center', color: 'var(--accent-ink)' }}><span className="dot" style={{ background: 'var(--accent)' }} />{stats.cnExam} · 模拟考成绩</div>
          <div className="lx-scorebig" style={{ marginTop: 12 }}>{stats.scaled}<span className="sm"> / {stats.fullPoints}</span></div>
          <div className="lx-scoreline">客观分 <b>{stats.objectiveScore}</b> / {stats.objectivePoints} · 折合真卷满分 <b>{stats.scaled}</b> / {stats.fullPoints}</div>
          <div className={`lx-passpill ${passed ? 'pass' : 'near'}`}>{passed ? '✓ 已过线' : '差一点'} · {isCet ? '425' : passLine} 分线</div>

          <div className="lx-skill" style={{ marginTop: 22 }}>
            <div className="lx-skill-h">分区得分</div>
            <div className="lx-secscore">
              {stats.secStats.map(s => {
                const pct = s.points ? Math.round(s.score / s.points * 100) : 0
                return (
                  <div className="lx-secscore-row" key={s.label}>
                    <span className="nm">{s.label}</span>
                    <div className="bar"><i style={{ width: pct + '%' }} /></div>
                    <span className="vl">{s.score}/{s.points}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {stats.wrongWords.length > 0 && (
            <div className="lx-wrong">
              <div className="lx-wrong-h"><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--rose-ink)' }} />{stats.wrongWords.length} 个薄弱词已回流今日</div>
              <div className="lx-wrong-chips">{stats.wrongWords.map(w => <span key={w} className="lx-wrong-chip"><span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--rose-ink)' }} />{w}</span>)}</div>
            </div>
          )}

          <div className="lx-r-acts">
            <button className="lx-rbtn primary" onClick={onAgain}>再考一次</button>
            <button className="lx-rbtn ghost" onClick={onReview}>看解析</button>
            <button className="lx-rbtn ghost" onClick={onConfig}>换考试</button>
          </div>
        </div>
      </div></div>
    </div>
  )
}

export { MockExamPicker, MockRun, MockResult }
