'use client'
/* MockExam.tsx — 模拟考试（R11b：切 v2 服务端整卷 + 服务端权威判分 + 主观 AI 估分）
   · 开考 POST /api/papers 生成可复现整卷（answerKey 已剥离；登录则持久化 paper_instance）。
   · 交卷 POST /api/papers/[id]/submit：服务端从 question_items 现取答案键判客观分，绝不信任客户端、绝不前泄答案。
   · 客观题（choice/listen/spell/multi_blank/matching）全题型渲染并按服务端分；
     主观区（free_text/speak）作答后调 /api/scoring/* 给 AI 估分（非官方分，标注估算）。
   · 未登录：客观区无法判分（答案键不前泄）→ 提示登录；主观区仍可获 AI 估分（公开限流端点）。
   选卷台 MockExamPicker 维持原结构预览（drill-data 本地 spec），仅作展示；实际出卷以 v2 题池为准。 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { PAPER_SPECS, getPaperSpec, sectionType, TYPE_BY_KEY, typeCount, fmt, type PaperSpec } from './drill-data'
import { Ic, Aurora } from './DrillShared'
import { MobileChrome } from './DrillFlow'
import type { GeneratedPaper, PaperSection, PaperItem, PaperSetRef, PaperScore, PaperChoice } from '@/lib/papers/paper-types'

type MockStartCfg = { kind: 'mock'; exam: string; level: string }

/* ───────────── 对外结果类型（DrillScreen 以 kind:'mock' 判别） ───────────── */
export interface MockSubjectiveResp { sectionId: string; labelZh: string; skill: string; taskType: string | null; text: string }
export interface MockSectionResult { sectionId: string; labelZh: string; labelEn: string; subjective: boolean; awarded: number; max: number; needsManualOrAi: boolean }
export interface MockStats {
  kind: 'mock'
  examId: string; examLabelZh: string; fullScore: number; scoringScale: string
  scored: boolean                       // 服务端是否判分（未登录 → false）
  objectiveAwarded: number; objectiveMax: number; scaled: number
  sections: MockSectionResult[]
  subjective: MockSubjectiveResp[]      // 主观作答（结果屏拉 AI 估分）
  warnings: string[]
}

interface FlatItem { secIdx: number; section: PaperSection; item: PaperItem; set?: PaperSetRef }

const selOpt: React.CSSProperties = { borderColor: 'var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent-ink)', fontWeight: 600 }
const selKey: React.CSSProperties = { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
const fieldStyle: React.CSSProperties = { width: '100%', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', padding: '10px 12px', fontSize: 14, fontFamily: 'var(--font-sans)', resize: 'vertical' as const }
const selectStyle: React.CSSProperties = { borderRadius: 9, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', padding: '7px 10px', fontSize: 13 }
const noteStyle: React.CSSProperties = { fontSize: 12.5, color: 'var(--ink-muted)', background: 'var(--card)', border: '1px dashed var(--line)', borderRadius: 10, padding: '10px 12px', marginTop: 8, lineHeight: 1.6 }

function setAt(arr: string[], i: number, v: string): string[] { const out = arr.slice(); while (out.length <= i) out.push(''); out[i] = v; return out }
const trunc = (s: string, n = 42) => (s.length > n ? s.slice(0, n) + '…' : s)

/* ───────────── 选卷台（结构预览，沿用本地 spec） ───────────── */
function MockExamPicker({ mob, onStart }: { mob?: boolean; onStart: (cfg: MockStartCfg) => void }) {
  const [exam, setExam] = useState('cet4')
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

      <div className="lx-paper" key={exam}>
        {spec.comingSoon && (
          <div className="lx-soonbanner"><Ic name="pen" s={14} /><span><b>{spec.cnExam} 题库建设中</b> · 以下为规划结构草案；题库就绪后即可一键接入。</span></div>
        )}
        <div className="lx-paper-head">
          <div className="lx-paper-title">{spec.zh}</div>
          <div className="lx-paper-sub">整卷 · 共 {spec.sections.length} 个区 · {totalQ} 小题</div>
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
          <div className="lx-paper-skip"><Ic name="pen" s={13} />主观区（{spec.skipped.join(' / ')}）作答后由 AI 估分（非官方分）；客观区服务端判分。</div>
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

/* ───────────── 题面渲染（按 input_mode + 主观标记分发） ───────────── */
function PassageBlock({ text }: { text: string }) {
  return <div className="lx-qcard lx-glass" style={{ textAlign: 'left', maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 10 }}>{text}</div>
}
function QPrompt({ item }: { item: PaperItem }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6, fontWeight: 500 }}>{item.prompt}</div>
      {item.promptZh && <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 4 }}>{item.promptZh}</div>}
    </div>
  )
}

function MockQuestionView({ fi, value, onChange }: { fi: FlatItem; value: unknown; onChange: (v: unknown) => void }) {
  const { item, section, set } = fi
  const mode = item.inputMode
  const passage = set?.stimulus?.textEn
  const audioUrl = set?.stimulus?.audioUrl
  const arr = Array.isArray(value) ? (value as string[]) : []

  // 主观区（写作/翻译/口语）：材料 + 题面 + 文本作答（提交后 AI 估分）
  if (section.subjective || mode === 'free_text' || mode === 'speak') {
    return (
      <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
        {passage && <PassageBlock text={passage} />}
        <QPrompt item={item} />
        {mode === 'speak' && <div style={noteStyle}>口语题：此处以文字转写作答，提交后给出 AI 估分（语音评分暂未开放）。</div>}
        <textarea style={{ ...fieldStyle, marginTop: 8 }} rows={mode === 'speak' ? 5 : 8} value={String(value ?? '')} onChange={e => onChange(e.target.value)} placeholder={mode === 'speak' ? '输入你的口语转写…' : '在此作答…'} />
      </div>
    )
  }

  // 选择题 / 听力 MCQ
  if ((mode === 'choice' || mode === 'listen') && item.choices?.length) {
    return (
      <>
        <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
          {mode === 'listen' && audioUrl && <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 10 }} />}
          {mode !== 'listen' && passage && <PassageBlock text={passage} />}
          <QPrompt item={item} />
        </div>
        <div className="lx-opts">
          {item.choices.map((o, i) => (
            <button key={o.id} className="lx-opt" style={value === o.id ? selOpt : undefined} onClick={() => onChange(o.id)}>
              <span className="key" style={value === o.id ? selKey : undefined}>{'ABCDEFG'[i] ?? o.id}</span>{o.text}
            </button>
          ))}
        </div>
      </>
    )
  }

  // 拼写（complete_words）：仅展示遮盖题面（不显示完整原文，避免泄露）
  if (mode === 'spell') {
    return (
      <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
        <QPrompt item={item} />
        <input style={{ ...fieldStyle, marginTop: 8 }} value={String(value ?? '')} onChange={e => onChange(e.target.value)} placeholder="补全单词…" />
      </div>
    )
  }

  // 完形填空（cloze_passage）：每空 4 选项
  if (mode === 'multi_blank' && item.blanks?.length) {
    return (
      <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
        <PassageBlock text={passage ?? item.prompt} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 8 }}>完形填空 · 共 {item.blanks.length} 空</div>
        {item.blanks.map((b, bi) => (
          <div key={bi} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', padding: '6px 0', borderTop: bi ? '1px solid var(--line)' : undefined }}>
            <span style={{ flex: '0 0 30px', fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--ink-sub)' }}>{bi + 1}.</span>
            {b.options.map((o, oi) => {
              const on = arr[bi] === o.id
              return (
                <button key={o.id} className="lx-opt" style={{ flex: '0 0 auto', padding: '6px 10px', fontSize: 13, ...(on ? selOpt : {}) }} onClick={() => onChange(setAt(arr, bi, o.id))}>
                  <span className="key" style={{ marginRight: 5, ...(on ? selKey : {}) }}>{'ABCD'[oi] ?? o.id}</span>{o.text}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  // banked_cloze / seven_select（共享词库/句库下拉）或 grammar_fill（无 choices，自由填）
  if (mode === 'multi_blank' && (item.blankCount ?? 0) > 0) {
    const bank: PaperChoice[] = item.choices ?? []
    return (
      <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
        <PassageBlock text={passage ?? item.prompt} />
        {bank.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {bank.map((c, ci) => <span key={c.id} style={{ fontSize: 12, color: 'var(--ink-sub)', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 8, padding: '3px 8px' }}>{'ABCDEFGHIJKLMNO'[ci] ?? c.id}. {c.text}</span>)}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {Array.from({ length: item.blankCount! }).map((_, bi) => (
            <label key={bi} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-sub)' }}>
              <span style={{ flex: '0 0 auto', fontFamily: 'var(--font-mono, monospace)' }}>空{bi + 1}</span>
              {bank.length > 0 ? (
                <select style={{ ...selectStyle, flex: 1 }} value={arr[bi] ?? ''} onChange={e => onChange(setAt(arr, bi, e.target.value))}>
                  <option value="">—</option>
                  {bank.map((c, ci) => <option key={c.id} value={c.id}>{'ABCDEFGHIJKLMNO'[ci] ?? c.id}. {trunc(c.text)}</option>)}
                </select>
              ) : (
                <input style={{ ...fieldStyle, flex: 1, padding: '7px 10px' }} value={arr[bi] ?? ''} onChange={e => onChange(setAt(arr, bi, e.target.value))} placeholder={`空 ${bi + 1}`} />
              )}
            </label>
          ))}
        </div>
      </div>
    )
  }

  // 段落信息匹配（para_match）：每句选对应段落 A..N
  if (mode === 'matching' && item.choices?.length) {
    const targets = item.matchTargets ?? item.choices.length
    return (
      <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
        <PassageBlock text={passage ?? item.prompt} />
        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginBottom: 8 }}>段落信息匹配 · 为每句选择对应段落</div>
        {item.choices.map((st, si) => (
          <div key={st.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '7px 0', borderTop: si ? '1px solid var(--line)' : undefined }}>
            <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6 }}>{st.text}</span>
            <select style={{ ...selectStyle, flex: '0 0 auto' }} value={arr[si] ?? ''} onChange={e => onChange(setAt(arr, si, e.target.value))}>
              <option value="">—</option>
              {Array.from({ length: targets }).map((_, ti) => <option key={ti} value={String(ti)}>{String.fromCharCode(65 + ti)}</option>)}
            </select>
          </div>
        ))}
      </div>
    )
  }

  // 兜底：暂不可作答（未知形态）→ 题面 + 专项练习提示
  return (
    <div className="lx-qcard lx-glass" style={{ textAlign: 'left' }}>
      {passage && <PassageBlock text={passage} />}
      <QPrompt item={item} />
      <div style={noteStyle}>此题型请在「专项练习」中作答（模拟卷暂未展开为可作答形式）。</div>
    </div>
  )
}

/* ───────────── 整卷答题（分区、无即时反馈、整体计时、服务端判分） ───────────── */
function MockRun({ config, mob, onFinish, onExit }: { config: { exam: string }; mob?: boolean; onFinish: (s: MockStats) => void; onExit: () => void }) {
  const [paper, setPaper] = useState<GeneratedPaper | null>(null)
  const [instanceId, setInstanceId] = useState<string | undefined>(undefined)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [idx, setIdx] = useState(0)
  const [time, setTime] = useState(0)
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resp, setResp] = useState<Record<string, unknown>>({})
  const respRef = useRef<Record<string, unknown>>({})
  const doneRef = useRef(false)
  const builtRef = useRef(false)

  // 开考：POST /api/papers 生成 v2 整卷（服务端权威；登录则持久化 instance）
  useEffect(() => {
    let alive = true
    fetch('/api/papers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ examId: config.exam, mode: 'full' }) })
      .then(r => r.json())
      .then(j => {
        if (!alive) return
        if (!j?.paper) { setLoadErr(String(j?.warnings?.[0] ?? 'unavailable')); setPaper(null); return }
        setPaper(j.paper as GeneratedPaper)
        setInstanceId(typeof j.paperInstanceId === 'string' ? j.paperInstanceId : undefined)
      })
      .catch(() => { if (alive) { setLoadErr('network'); setPaper(null) } })
    return () => { alive = false }
  }, [config.exam])

  const flat = useMemo<FlatItem[]>(() => {
    if (!paper) return []
    const setById = new Map<string, PaperSetRef>()
    paper.sections.forEach(s => s.sets.forEach(set => setById.set(set.setId, set)))
    const out: FlatItem[] = []
    paper.sections.forEach((section, secIdx) => section.items.forEach(item => out.push({ secIdx, section, item, set: setById.get(item.setId) })))
    return out
  }, [paper])

  useEffect(() => {
    if (!paper || builtRef.current) return
    builtRef.current = true
    setTime((paper.totalMinutes || 1) * 60)
    setReady(true)
  }, [paper])

  const setAnswer = (id: string, v: unknown) => setResp(p => { const np = { ...p, [id]: v }; respRef.current = np; return np })

  const finish = async () => {
    if (doneRef.current || !paper) return
    doneRef.current = true
    setSubmitting(true)
    const r = respRef.current

    const subjective: MockSubjectiveResp[] = paper.sections
      .filter(s => s.subjective)
      .map(s => { const it = s.items[0]; const text = it ? String(r[it.questionItemId] ?? '').trim() : ''; return { sectionId: s.sectionId, labelZh: s.labelZh, skill: s.skill, taskType: s.taskType, text } })
      .filter(s => s.text.length > 0)

    let score: PaperScore | null = null
    if (instanceId) {
      const responses = Object.entries(r)
        .filter(([, v]) => v != null && !(typeof v === 'string' && v.trim() === ''))
        .map(([questionItemId, answer]) => ({ questionItemId, answer }))
      try {
        const res = await fetch(`/api/papers/${instanceId}/submit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ responses }) }).then(x => x.json())
        if (res?.ok && res.score) score = res.score as PaperScore
      } catch { /* 判分失败 → 退回未判分态 */ }
    }

    const scoreSecById = new Map((score?.sections ?? []).map(s => [s.sectionId, s]))
    const sections: MockSectionResult[] = paper.sections.map(s => {
      const ss = scoreSecById.get(s.sectionId)
      return { sectionId: s.sectionId, labelZh: s.labelZh, labelEn: s.labelEn, subjective: s.subjective, awarded: ss?.awarded ?? 0, max: ss?.max ?? s.points, needsManualOrAi: ss?.needsManualOrAi ?? s.subjective }
    })
    const objectiveMax = score?.objectiveMax ?? paper.sections.filter(s => !s.subjective).reduce((a, s) => a + s.points, 0)

    onFinish({
      kind: 'mock', examId: paper.examId, examLabelZh: paper.examLabelZh, fullScore: paper.fullScore, scoringScale: paper.scoringScale,
      scored: !!score, objectiveAwarded: score?.objectiveAwarded ?? 0, objectiveMax, scaled: score?.scaled ?? 0,
      sections, subjective, warnings: paper.warnings ?? [],
    })
  }

  useEffect(() => {
    if (!paper || !ready) return
    const t = setInterval(() => setTime(v => { if (v <= 1) { clearInterval(t); void finish(); return 0 } return v - 1 }), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper, ready])

  const wrap = (body: React.ReactNode) => (
    <div className="lx mode-exam"><Aurora />{mob && <MobileChrome mode="exam" active="drill" noTab />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 34, paddingBottom: 40 }}>{body}</div></div>
    </div>
  )

  if (submitting) return wrap(<div style={{ paddingTop: 40, textAlign: 'center', color: 'var(--ink-sub)' }}>正在判分…</div>)
  if (loadErr && !paper) return wrap(<div style={{ paddingTop: 40 }}>暂时无法生成本卷（{loadErr === 'v2_not_applied' ? '题库未就绪' : loadErr === 'insufficient_pool' ? '题量不足' : loadErr}）。<button className="lx-exit" onClick={onExit}>‹ 返回</button></div>)
  if (!paper) return wrap(<div style={{ paddingTop: 40 }}>正在组卷…</div>)
  if (!flat.length) return wrap(<div style={{ paddingTop: 40 }}>该考试暂无可用题。<button className="lx-exit" onClick={onExit}>‹ 返回</button></div>)

  const cur = flat[idx]
  const sec = cur.section
  const secLocalTotal = flat.filter(x => x.secIdx === cur.secIdx).length
  const secLocalIdx = flat.slice(0, idx + 1).filter(x => x.secIdx === cur.secIdx).length
  const mm = String(Math.floor(time / 60)).padStart(2, '0'), ss = String(time % 60).padStart(2, '0')
  const next = () => { if (idx + 1 >= flat.length) void finish(); else setIdx(i => i + 1) }

  return wrap(
    <div className="lx-runwrap">
      <div className="lx-runhead">
        <button className="lx-exit" onClick={onExit}>‹ 退出</button>
        <span className="lx-run-timer" style={time < 60 ? { color: 'var(--rose-ink)' } : { color: 'var(--accent-ink)' }}><Ic name="clock" s={14} /> {mm}:{ss}</span>
      </div>

      {!instanceId && (
        <div style={{ ...noteStyle, marginBottom: 12, marginTop: 0 }}>未登录：客观区无法服务端判分（答案不前泄）；主观区作答仍可获 AI 估分。登录后参加可保存成绩与完整判分。</div>
      )}

      <div className="lx-secdots">
        {paper.sections.map((s, si) => <i key={s.sectionId} className={si < cur.secIdx ? 'done' : (si === cur.secIdx ? 'cur' : '')} />)}
      </div>
      <div className="lx-secbanner">
        <span className="sn">{cur.secIdx + 1}</span>
        <div className="sb"><div className="st">{sec.labelZh}<span style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', color: 'var(--ink-muted)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>{sec.labelEn}</span></div><div className="sm">本区 {sec.items.length} 题 · {sec.points} 分{sec.subjective ? ' · 主观（AI 估分）' : ''}</div></div>
        <span className="sg">{cur.secIdx + 1}/{paper.sections.length} 区</span>
      </div>

      <div className="lx-qmeta">
        <span className="lx-run-idx">第 {idx + 1} / {flat.length} 题</span>
        <span className="lx-qtag" style={{ marginLeft: 'auto' }}>模拟考 · 交卷后统一评分</span>
      </div>

      <MockQuestionView fi={cur} value={resp[cur.item.questionItemId]} onChange={v => setAnswer(cur.item.questionItemId, v)} />

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {idx > 0 && <button className="lx-rbtn ghost" style={{ flex: '0 0 auto', minWidth: 90 }} onClick={() => setIdx(i => i - 1)}>‹ 上一题</button>}
        <button className="lx-cta" style={{ flex: 1, justifyContent: 'center' }} onClick={next}>
          {idx + 1 >= flat.length ? '交卷评分' : (secLocalIdx >= secLocalTotal ? '进入下一区' : '下一题')} <Ic name="arrow" s={16} sw={2} />
        </button>
      </div>
    </div>
  )
}

/* ───────────── 模拟考结果（服务端客观分 + 主观 AI 估分） ───────────── */
interface EstState { loading: boolean; overall?: number; fullScore?: number; band?: string; disclaimer?: string; error?: string }

function MockResult({ stats, mob, onAgain, onConfig, onReview }: { stats: MockStats; mob?: boolean; onAgain: () => void; onConfig: () => void; onReview: () => void }) {
  const [est, setEst] = useState<Record<string, EstState>>({})

  useEffect(() => {
    let alive = true
    stats.subjective.forEach(sub => {
      setEst(p => ({ ...p, [sub.sectionId]: { loading: true } }))
      const endpoint = sub.skill === 'translation' ? 'translation' : sub.skill === 'speaking' ? 'speaking' : 'writing'
      const body: Record<string, unknown> = endpoint === 'speaking' ? { examId: stats.examId, transcript: sub.text, taskType: sub.taskType } : { examId: stats.examId, text: sub.text, taskType: sub.taskType }
      fetch(`/api/scoring/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.json())
        .then(j => {
          if (!alive) return
          if (j?.ok) setEst(p => ({ ...p, [sub.sectionId]: { loading: false, overall: j.overall, fullScore: j.fullScore, band: j.band, disclaimer: j.disclaimer } }))
          else setEst(p => ({ ...p, [sub.sectionId]: { loading: false, error: String(j?.error ?? 'estimate_failed') } }))
        })
        .catch(() => { if (alive) setEst(p => ({ ...p, [sub.sectionId]: { loading: false, error: 'network' } })) })
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const objPct = stats.objectiveMax > 0 ? Math.round(stats.objectiveAwarded / stats.objectiveMax * 100) : 0

  return (
    <div className="lx mode-exam">
      <Aurora />
      {mob && <MobileChrome mode="exam" active="drill" />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 62 : 34, paddingBottom: mob ? 80 : 40 }}>
        <div className="lx-runwrap lx-result">
          <div className="lx-rbadge pass" style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)', borderColor: 'color-mix(in srgb,var(--accent) 30%,transparent)' }}><Ic name="target" s={28} /></div>
          <div className="lx-eyebrow" style={{ justifyContent: 'center', color: 'var(--accent-ink)' }}><span className="dot" style={{ background: 'var(--accent)' }} />{stats.examLabelZh} · 模拟考成绩</div>

          {stats.scored ? (
            <>
              <div className="lx-scorebig" style={{ marginTop: 12 }}>{stats.objectiveAwarded}<span className="sm"> / {stats.objectiveMax}</span></div>
              <div className="lx-scoreline">客观区服务端判分 · 正确率 <b>{objPct}%</b> · 真卷满分 {stats.fullScore}（含主观区，按下方 AI 估分参考）</div>
            </>
          ) : (
            <>
              <div className="lx-scorebig" style={{ marginTop: 12, fontSize: 28 }}>未判分</div>
              <div className="lx-scoreline">登录后参加可获客观区服务端判分；本次仅提供主观区 AI 估分。</div>
            </>
          )}

          {stats.sections.length > 0 && (
            <div className="lx-skill" style={{ marginTop: 22 }}>
              <div className="lx-skill-h">分区得分</div>
              <div className="lx-secscore">
                {stats.sections.map(s => {
                  if (s.subjective) {
                    const e = est[s.sectionId]
                    const txt = !e ? '未作答' : e.loading ? 'AI 估分中…' : e.error ? '估分不可用' : (e.overall != null ? `约 ${e.overall}${e.fullScore ? ` / ${e.fullScore}` : ''}${e.band ? ` · ${e.band}` : ''}` : '估算')
                    return (
                      <div className="lx-secscore-row" key={s.sectionId}>
                        <span className="nm">{s.labelZh} <em style={{ fontStyle: 'normal', color: 'var(--gold-ink)', fontSize: 11 }}>AI 估分</em></span>
                        <div className="bar"><i style={{ width: e?.overall != null && e.fullScore ? Math.round(e.overall / e.fullScore * 100) + '%' : '0%', background: 'var(--gold-ink)' }} /></div>
                        <span className="vl">{txt}</span>
                      </div>
                    )
                  }
                  const pct = s.max ? Math.round(s.awarded / s.max * 100) : 0
                  return (
                    <div className="lx-secscore-row" key={s.sectionId}>
                      <span className="nm">{s.labelZh}</span>
                      <div className="bar"><i style={{ width: pct + '%' }} /></div>
                      <span className="vl">{stats.scored ? `${s.awarded}/${s.max}` : `— /${s.max}`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {stats.subjective.some(s => est[s.sectionId]?.disclaimer) && (
            <div style={{ ...noteStyle, marginTop: 14 }}>{stats.subjective.map(s => est[s.sectionId]?.disclaimer).find(Boolean)}</div>
          )}

          <div className="lx-r-acts" style={{ marginTop: 20 }}>
            <button className="lx-rbtn primary" onClick={onAgain}>再考一次</button>
            <button className="lx-rbtn ghost" onClick={onReview}>换考试</button>
            <button className="lx-rbtn ghost" onClick={onConfig}>返回</button>
          </div>
        </div>
      </div></div>
    </div>
  )
}

export { MockExamPicker, MockRun, MockResult }
