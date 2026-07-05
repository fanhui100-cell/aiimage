'use client'
/* DrillScreen.tsx — 专练主流程（Phase 6：三面重排）
   配置台 = 单词宇宙练习 / 考试专项 / 模拟试卷 三面 + 智能复习细 entry；config→run→result。
   run/result 机制不变：单词宇宙(BRun/DrillAiRun) · 模拟卷(MockRun)；考试专项任务跳 /quiz 复用 PracticeRunner。 */
import { useState as useS, useEffect as useE, useRef as useR } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { FAMILIES, TYPE_BY_KEY, LEVEL_IDX } from './drill-data'
import { Ic, Aurora, levelZh } from './DrillShared'
import { GalaxySVG, MobileChrome } from './DrillFlow'
import { buildSession, PASSAGE_TYPES, type DrillQuestion } from './drill-questions'
import { QuestionStem } from './QuestionStem'
import { DrillAiRun } from './DrillAiRun'
import { MockRun, MockResult, type MockStats } from './MockExam'
import { WordUniversePracticePicker } from '@/components/drill/WordUniversePracticePicker'
import { ExamTaskPicker } from '@/components/drill/ExamTaskPicker'
import { MockPaperPicker } from '@/components/drill/MockPaperPicker'
import './drill-merged.css'
import './drill-phase6.css'

// 口说/产出 家族的题型 key —— 选中这些 → 走 AI 内嵌答题（DrillAiRun），不走题库 BRun
const AI_TYPES = new Set(['pron_score', 'speak_scene', 'sentence_make', 'sentence_polish'])
const hasAiType = (types?: string[]) => (types ?? []).some(t => AI_TYPES.has(t))

function bspeak(t: string) { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch { /* noop */ } }

export type DrillMode = 'practice' | 'trial'
const lvOf = (key: string) => LEVEL_IDX[key] + 1

export interface DrillConfig {
  mode?: DrillMode; kind?: 'mock'; level: string; types?: string[]
  lenMode?: string; count?: number; minutes?: number; tcount?: number
  difficulty?: string; shuffle?: boolean; exam?: string
}
interface DrillStats { kind: 'drill'; mode: DrillMode; total: number; correct: number; wrongWords: string[] }

/* ───────────── 三面切换 + 智能复习 entry ───────────── */
type Surface = 'universe' | 'exam' | 'mock'
const SURFACES: { key: Surface; cls: string; ic: string; st: string; stShort: string; sd: string }[] = [
  { key: 'universe', cls: 'universe', ic: 'planet', st: '单词宇宙练习', stShort: '单词宇宙', sd: '背词闭环 · 练/测' },
  { key: 'exam', cls: 'exam', ic: 'target', st: '考试专项', stShort: '考试专项', sd: '真实结构 · 任务级' },
  { key: 'mock', cls: 'mock', ic: 'layers', st: '模拟试卷', stShort: '模拟试卷', sd: '整卷限时 · 真分制' },
]

function SurfaceSwitch({ surface, setSurface, mob }: { surface: Surface; setSurface: (s: Surface) => void; mob?: boolean }) {
  const ref = useR<HTMLDivElement>(null)
  const [thumb, setThumb] = useS({ left: 5, width: 0 })
  useE(() => {
    const root = ref.current; if (!root) return
    const btn = root.querySelector(`button[data-s="${surface}"]`) as HTMLElement | null
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [surface, mob])
  return (
    <div className="lx-surfacesw v2" ref={ref} role="tablist" aria-label="练习面切换">
      <span className="thumb" style={{ left: thumb.left, width: thumb.width }} />
      {SURFACES.map(s => (
        <button key={s.key} data-s={s.key} role="tab" aria-selected={surface === s.key}
          className={`${s.cls} ${surface === s.key ? 'on' : ''}`} onClick={() => setSurface(s.key)}>
          <span className="st"><span className="si"><Ic name={s.ic} s={15} sw={1.9} /></span>{mob ? s.stShort : s.st}</span>
          <span className="sd">{s.sd}</span>
        </button>
      ))}
    </div>
  )
}

function ReviewEntry({ due, wrong, onGo }: { due: number; wrong: number; onGo: () => void }) {
  return (
    <button className="lx-reviewentry" onClick={onGo}>
      <span className="ri"><Ic name="clock" s={18} /></span>
      <span className="rb">
        <span className="rt">智能复习 <em>Smart Review</em></span>
        <span className="rd">按记忆曲线优先练该练的 · 到期 / 错题 / 薄弱一处清 → /memory</span>
      </span>
      <span className="rcounts">
        {due > 0 && <span className="rcount">{due} 到期</span>}
        {wrong > 0 && <span className="rcount gold">{wrong} 错题</span>}
      </span>
      <span className="rgo"><Ic name="arrowright" s={17} sw={2} /></span>
    </button>
  )
}

/* ───────────── 配置台（三面） ───────────── */
function BConfig({ mob, onStart }: { mob?: boolean; onStart: (cfg: DrillConfig) => void }) {
  const [surface, setSurface] = useS<Surface>('universe')
  const router = useRouter()
  const due = useLexiStore(s => s.getDue().length)
  const wrong = useLexiStore(s => s.wrongAnswers.length)
  return (
    <div className={`lx ${mob ? 'phone' : ''} ${surface === 'exam' ? 'face-exam' : ''}`}>
      <Aurora />
      {mob && <MobileChrome mode="practice" active="drill" drillBadge={due + wrong} />}
      <div className="lx-scroll">
        <div className={mob ? 'lx-pad' : 'lx-pad-d'} style={mob ? { paddingTop: 64, paddingBottom: surface === 'universe' ? 210 : 40 } : { paddingTop: 64 }}>
          <ReviewEntry due={due} wrong={wrong} onGo={() => router.push('/memory')} />
          <SurfaceSwitch surface={surface} setSurface={setSurface} mob={mob} />
          <div style={{ marginTop: 18 }}>
            {surface === 'universe' && <WordUniversePracticePicker mob={mob} onStart={onStart} />}
            {surface === 'exam' && <ExamTaskPicker mob={mob} />}
            {surface === 'mock' && <MockPaperPicker mob={mob} onStart={onStart} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────── 答题（run） ───────────── */
function BRun({ mode, config, mob, onFinish, onExit }: { mode: DrillMode; config: DrillConfig; mob?: boolean; onFinish: (s: DrillStats) => void; onExit: () => void }) {
  const trial = mode === 'trial'
  const sessionLen = trial ? (config.tcount ?? 10) : (config.lenMode === 'count' ? (config.count ?? 20) : (config.lenMode === 'time' ? 12 : 8))
  const [idx, setIdx] = useS(0)
  const [picked, setPicked] = useS<number | null>(null)
  const [spellVal, setSpellVal] = useS('')
  const [submitted, setSubmitted] = useS(false)
  const [time, setTime] = useS(Math.max(60, sessionLen * 16))
  // 按所选题型组卷（config.types）→ 选什么题型就出什么题（async 拉 /api/questions）
  const [seq, setSeq] = useS<DrillQuestion[] | null>(null)
  useE(() => {
    let alive = true
    buildSession(config.types ?? [], Math.max(sessionLen, 8), config.shuffle ?? true, lvOf(config.level))
      .then(qs => { if (alive) setSeq(qs) })
    return () => { alive = false }
  }, [])
  const list = seq || []
  const q = list.length ? list[idx % list.length] : null
  const meta = q ? (TYPE_BY_KEY[q.type] || { zh: q.type, fam: 'recognize' }) : { zh: '', fam: 'recognize' }
  const fam = FAMILIES.find(f => f.key === meta.fam) || FAMILIES[0]
  const isPassage = q ? PASSAGE_TYPES.has(q.type) : false
  // 正确答案文本：拼写=answerText；选择=正确选项；用于反馈区与错题记录
  const ansText = q ? (q.inputMode === 'spell' ? (q.answerText || '') : (q.opts && q.ans != null ? (q.opts[q.ans] || '') : '')) : ''
  const revealWord = q ? (isPassage ? '' : (q.word || ansText)) : ''
  const spellRef = useR<HTMLInputElement>(null)
  // refs：定时器到点 / 提前结束时读到的是最新计数（避免闭包读旧值）
  const scoreRef = useR(0), wrongRef = useR<string[]>([]), answeredRef = useR(0), doneRef = useR(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onFinish({ kind: 'drill', mode, total: Math.max(1, answeredRef.current), correct: scoreRef.current, wrongWords: [...new Set(wrongRef.current)] })
  }

  const answered = !q ? false : (q.inputMode === 'spell' ? submitted : picked !== null)
  const correct = !q ? false : (q.inputMode === 'spell' ? spellVal.trim().toLowerCase() === (q.answerText || '').toLowerCase() : picked === q.ans)

  const commit = (isCorrect: boolean, q0: DrillQuestion, userAnswer: string) => {
    answeredRef.current += 1
    if (isCorrect) { scoreRef.current += 1; return }
    const passage = PASSAGE_TYPES.has(q0.type)
    const correctAnswer = q0.inputMode === 'spell' ? (q0.answerText || '') : (q0.opts && q0.ans != null ? (q0.opts[q0.ans] || '') : '')
    const w = passage ? '' : (q0.word || correctAnswer || '')
    if (w) wrongRef.current = [...wrongRef.current, w]
    // 答错回流今日：复用 lexiStore 现有错词写入（与 /quiz 同一套）；短文题不入词级错题本
    if (!passage) {
      useLexiStore.getState().addWrongAnswer({
        wordId: q0.wordId || q0.id, word: w || q0.word, question: q0.ask || q0.prompt || '',
        userAnswer, correctAnswer, explanation: q0.ex || '', timestamp: Date.now(),
      })
    }
  }
  const pickOpt = (i: number) => { if (answered || !q) return; setPicked(i); commit(i === q.ans, q, q.opts?.[i] ?? '') }
  const submitSpell = () => { if (!spellVal.trim() || submitted || !q) return; setSubmitted(true); commit(spellVal.trim().toLowerCase() === (q.answerText || '').toLowerCase(), q, spellVal.trim()) }

  const next = () => {
    if (idx + 1 >= sessionLen) { finish(); return }
    setIdx(i => i + 1); setPicked(null); setSpellVal(''); setSubmitted(false)
  }
  const endNow = () => finish()
  const play = () => { if (q) bspeak(q.audioRef || q.word || '') }

  useE(() => {
    if (!trial) return
    const t = setInterval(() => setTime(v => { if (v <= 1) { clearInterval(t); finish(); return 0 } return v - 1 }), 1000)
    return () => clearInterval(t)
  }, [trial])
  // 新题：拼写题自动聚焦；听力/听写题自动播放发音（无需鼠标点喇叭）
  useE(() => {
    if (!q) return
    if (q.inputMode === 'spell' && spellRef.current) spellRef.current.focus()
    if (q.isListen) bspeak(q.audioRef || q.word || '')
  }, [idx, q])
  // 已作答后按 Enter 直接进入下一题（再按一次 enter 跳题；新题若是听力会自动发音）
  useE(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && answered) { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, idx, seq])

  if (!seq) return <div className={`lx ${trial ? 'mode-trial' : ''} ${mob ? 'phone' : ''}`}><Aurora /><div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 36 }}>正在抽题…</div></div></div>
  if (!q) return <div className={`lx ${trial ? 'mode-trial' : ''} ${mob ? 'phone' : ''}`}><Aurora /><div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 36 }}>该范围暂无可用题，换个题型或等级。 <button className="lx-exit" onClick={onExit}>‹ 返回</button></div></div></div>

  return (
    <div className={`lx ${trial ? 'mode-trial' : ''} ${mob ? 'phone' : ''}`}>
      <Aurora />
      {mob && <MobileChrome mode={mode} active="drill" noTab />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 34, paddingBottom: mob ? 34 : 40 }}>
        <div className="lx-runwrap">
          <div className="lx-runhead">
            <button className="lx-exit" onClick={onExit}>‹ 退出</button>
            <span className={`lx-runtag ${trial ? 'trial' : 'practice'}`}>{trial ? '✦ 限时试炼' : '∞ 自由练'} · {levelZh(config.level)}</span>
          </div>

          <div className="lx-run-top">
            <span className="lx-run-idx">{idx + 1} / {config.lenMode === 'inf' && !trial ? '∞' : sessionLen}</span>
            <div className="lx-run-bar"><i style={{ width: `${Math.min(100, ((idx) / sessionLen) * 100)}%` }} /></div>
            {trial
              ? <span className="lx-run-timer" style={time < 20 ? { color: 'var(--rose-ink)' } : undefined}><Ic name="clock" s={14} /> {time}s</span>
              : <button className="lx-exit" onClick={endNow}>结束并看小结</button>}
          </div>

          <div className="lx-qmeta">
            <span className="lx-qtype"><span style={{ color: fam.color }}>◆</span>{meta.zh}</span>
            <span className="lx-qdiff">{[0, 1, 2, 3, 4].map(i => <i key={i} className={i < 3 ? 'on' : ''} />)}</span>
            <span className="lx-qtag" style={{ marginLeft: 'auto' }}>{trial ? '试炼计分' : '练习 · 不计分'}</span>
          </div>

          <div className="lx-qcard lx-glass" style={q.isReading ? { textAlign: 'left' } : undefined}>
            <QuestionStem q={q} onPlay={play} />
          </div>

          {q.inputMode === 'spell' ? (
            <div className="lx-spell">
              <input ref={spellRef} className={submitted ? (correct ? 'correct' : 'wrong') : ''} value={spellVal} placeholder="输入英文…"
                autoComplete="off" spellCheck={false} disabled={submitted}
                onChange={e => setSpellVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitSpell() }} />
              <div className="lx-spell-hint">首字母 <b>{(q.answerText || '')[0]}</b> · {(q.answerText || '').length} 个字母{q.isListen && q.ipa ? <> · <span style={{ fontFamily: 'var(--font-mono)' }}>{q.ipa}</span></> : null}</div>
              {!submitted && <button className="lx-submit" disabled={!spellVal.trim()} onClick={submitSpell}>提交</button>}
            </div>
          ) : (
            <div className="lx-opts">
              {(q.opts ?? []).map((o, i) => {
                const cls = answered ? (i === q.ans ? 'correct' : (picked === i ? 'wrong' : '')) : ''
                return (
                  <button key={i} className={`lx-opt ${cls} ${answered ? 'locked' : ''}`} disabled={answered} onClick={() => pickOpt(i)}>
                    <span className="key">{'ABCD'[i]}</span>{o}
                  </button>
                )
              })}
            </div>
          )}

          {answered && (
            <div className="lx-reveal">
              <div className="lx-explain">
                <b className={correct ? 'ok' : 'no'}>{correct ? '✓ 正确' : '✗ 错误'}</b>{(revealWord || q.wz) ? <> · <b>{revealWord}{q.ipa ? ` ${q.ipa}` : ''}{q.wz ? `（${q.wz}）` : ''}</b></> : (isPassage && ansText ? <> · 正确答案 <b>{ansText}</b></> : '')}{q.ex ? <> — {q.ex}</> : ''}
                {!correct && (trial ? <> 已回流今日复习。</> : <> 已加入薄弱词，稍后重出。</>)}
              </div>
              <button className="lx-cta" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }} onClick={next}>
                {idx + 1 >= sessionLen ? (trial ? '查看成绩' : '看小结') : '下一题'} <Ic name="arrow" s={16} sw={2} />
              </button>
            </div>
          )}
        </div>
      </div></div>
    </div>
  )
}

/* ───────────── 结果 ───────────── */
function BResult({ mode, stats, mob, onAgain, onConfig, onReview }: { mode: DrillMode; stats: DrillStats; mob?: boolean; onAgain: () => void; onConfig: () => void; onReview: () => void }) {
  const trial = mode === 'trial'
  const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
  const passed = pct >= 80
  const skills: [string, number, string][] = [['翻译', Math.min(100, pct + 6), 'var(--teal-ink)'], ['近义', Math.max(40, pct - 12), 'var(--gold-ink)'], ['听力', Math.max(35, pct - 25), 'var(--rose-ink)']]
  const due = useLexiStore(s => s.getDue().length)
  const wrong = useLexiStore(s => s.wrongAnswers.length)
  return (
    <div className={`lx ${trial ? 'mode-trial' : ''} ${mob ? 'phone' : ''}`}>
      <Aurora />
      {mob && <MobileChrome mode={mode} active="drill" drillBadge={due + wrong} />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 62 : 34, paddingBottom: mob ? 80 : 40 }}>
        <div className="lx-runwrap lx-result">
          {trial ? (
            <>
              <div className={`lx-rbadge ${passed ? 'pass' : 'fail'}`}><Ic name={passed ? 'star' : 'bolt'} s={28} /></div>
              <h2 className="lx-r-h" style={{ color: passed ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{passed ? '通关！星系点亮' : '差一点，再来一次'}</h2>
              <div className="lx-r-pct" style={{ color: passed ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{stats.correct} / {stats.total} · {pct}%</div>
              <div className="lx-galaxy"><GalaxySVG lit={passed} /></div>
            </>
          ) : (
            <>
              <div className="lx-rbadge practice"><Ic name="inf" s={26} sw={2} /></div>
              <h2 className="lx-r-h">这组练完了</h2>
              <div className="lx-r-pct" style={{ color: 'var(--ink-sub)' }}>本组 {stats.total} 题 · 正确率 {pct}%</div>
            </>
          )}

          <div className="lx-r-stats">
            <div className="lx-r-stat"><div className={`f ${trial ? 'violet' : 'teal'}`}>{stats.total}</div><div className="l">{trial ? '题量' : '本组练了'}</div></div>
            <div className="lx-r-stat"><div className="f teal">{pct}%</div><div className="l">正确率</div></div>
            <div className="lx-r-stat"><div className="f">{stats.wrongWords.length}</div><div className="l">薄弱词</div></div>
          </div>

          <div className="lx-skill">
            <div className="lx-skill-h">能力维度 · skillTags 命中率</div>
            {skills.map(([n, v, c]) => (
              <div className="lx-sb" key={n}><span className="lx-sb-name">{n}</span><div className="lx-sb-bar"><i style={{ width: v + '%', background: c }} /></div><span className="lx-sb-val">{v}%</span></div>
            ))}
          </div>

          {stats.wrongWords.length > 0 && (
            <div className="lx-wrong">
              <div className="lx-wrong-h"><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--rose-ink)' }} />{stats.wrongWords.length} 个薄弱词已回流今日</div>
              <div className="lx-wrong-chips">{stats.wrongWords.map(w => <span key={w} className="lx-wrong-chip"><span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--rose-ink)' }} />{w}</span>)}</div>
            </div>
          )}

          <div className="lx-r-acts">
            <button className="lx-rbtn primary" onClick={onAgain}>{trial ? '再试一次' : '再来一组'}</button>
            {stats.wrongWords.length > 0 && <button className="lx-rbtn ghost" onClick={onReview}>去复习薄弱词</button>}
            <button className="lx-rbtn ghost" onClick={onConfig}>换配置</button>
          </div>
        </div>
      </div></div>
    </div>
  )
}

/* ───────────── 路由 ───────────── */
function DrillScreen() {
  const [phase, setPhase] = useS<'config' | 'run' | 'result'>('config')   // config | run | result
  const [config, setConfig] = useS<DrillConfig | null>(null)
  const [stats, setStats] = useS<DrillStats | MockStats | null>(null)
  // 按 viewport 探测移动端（SSR/首屏默认桌面，不闪）
  const [mob, setMob] = useS(false)
  useE(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => setMob(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // 原型 .lx 用 height:100% + 绝对定位滚动容器（artboard 模型），需父级有确定高度；
  // AppShell <main> 是 auto 高度，故套一层确定高度的 host，避免 .lx 塌成 0 高（黑屏）。
  let view: React.ReactNode
  if (phase === 'run' && config) {
    view = config.kind === 'mock'
      ? <MockRun config={{ exam: config.exam || config.level }} mob={mob} onExit={() => setPhase('config')} onFinish={(s) => { setStats(s); setPhase('result') }} />
      : hasAiType(config.types)
        ? <DrillAiRun config={config} mob={mob} onExit={() => setPhase('config')} onFinish={(s) => { setStats(s); setPhase('result') }} />
        : <BRun mode={config.mode ?? 'practice'} config={config} mob={mob} onExit={() => setPhase('config')} onFinish={(s) => { setStats(s); setPhase('result') }} />
  } else if (phase === 'result' && stats) {
    view = stats.kind === 'mock'
      ? <MockResult stats={stats} mob={mob} onAgain={() => setPhase('run')} onConfig={() => setPhase('config')} onReview={() => setPhase('config')} />
      : <BResult mode={stats.mode} stats={stats} mob={mob} onAgain={() => setPhase('run')} onConfig={() => setPhase('config')} onReview={() => setPhase('config')} />
  } else {
    view = <BConfig mob={mob} onStart={(cfg) => { setConfig(cfg); setPhase('run') }} />
  }
  return <div style={{ height: 'calc(100dvh - var(--nav-h))' }}>{view}</div>
}

export default DrillScreen
export { DrillScreen }
