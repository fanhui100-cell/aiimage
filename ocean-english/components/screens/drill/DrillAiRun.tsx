'use client'
/* DrillAiRun.tsx — 口说 / 产出 家族的内嵌答题（界面优化2·导航合并）
   面板视觉照 reference-prototype/practice.jsx 的 SpeakQ / ProduceQ；
   口说接真实 useSpeechScoring（lib/pronunciation），产出接真实 POST /api/ai/writing；
   结果回流 lexiStore.recordDimPass / addWrongAnswer / incXp / setPronScore。
   组卷取词来自 lexiStore（getDue 优先，再补 words），不走 /api/questions（不碰组卷算法）。 */
import { useState as useS, useEffect as useE, useRef as useR } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { useSpeechScoring } from '@/lib/pronunciation/use-speech-scoring'
import { LEVEL_IDX } from './drill-data'
import { Ic, Aurora, levelZh } from './DrillShared'
import { MobileChrome } from './DrillFlow'

type AiMode = 'speak' | 'produce'
interface AiConfig { mode?: 'practice' | 'trial'; level: string; types?: string[]; count?: number; tcount?: number; lenMode?: string }
interface AiStats { kind: 'drill'; mode: 'practice' | 'trial'; total: number; correct: number; wrongWords: string[] }
interface AiItem { word: WordEntry; mode: AiMode }

const SPEAK_TYPES = new Set(['pron_score', 'speak_scene'])
const PRODUCE_TYPES = new Set(['sentence_make', 'sentence_polish'])
const lvNum = (key: string) => (LEVEL_IDX[key] ?? 2) + 1

/* ───────── 口说面板（真实发音评分）───────── */
function SpeakPanel({ item, onResult }: { item: AiItem; onResult: (ok: boolean, word: string) => void }) {
  const speech = useSpeechScoring()
  const w = item.word
  const speak = (slow = false) => { try { const u = new SpeechSynthesisUtterance(w.word); u.lang = 'en-US'; u.rate = slow ? 0.6 : 0.92; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch { /* noop */ } }
  // 切到下一题（key 变更→卸载）时清理录音/识别
  useE(() => () => speech.reset(), [])
  const sc = speech.score?.total ?? 0
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 40, color: 'var(--ink)' }}>{w.word}</div>
      <button className="lx-chip" style={{ marginTop: 8 }} onClick={() => speak(true)}><Ic name="play" s={14} /> {w.phon || '慢速示范'}</button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 56, margin: '22px 0' }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const active = speech.phase === 'recording'
          const h = active ? 0.2 + ((Math.sin(i * 1.7 + speech.level * 18) + 1) / 2) * (0.4 + speech.level) : 0.12
          return <div key={i} style={{ width: 5, borderRadius: 99, height: `${Math.min(100, h * 100)}%`, background: active ? 'var(--rose-ink)' : 'var(--line)', transition: 'height .08s' }} />
        })}
      </div>
      {(speech.phase === 'scored' || speech.phase === 'fallback-recorded') ? (
        <div className="lx-reveal">
          {speech.phase === 'scored' ? (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 700, color: sc >= 80 ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{sc}<span style={{ fontSize: 13, color: 'var(--ink-muted)' }}> 发音分</span></div>
              <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 6 }}>{sc >= 88 ? '非常地道 ✦' : sc >= 80 ? '清晰准确' : '重音可再注意'}</div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-sub)' }}>已录音 · 浏览器不支持自动评分，可回放对比</div>
          )}
          {speech.audioUrl && <audio src={speech.audioUrl} controls style={{ display: 'block', margin: '12px auto 0', height: 34 }} />}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="lx-rbtn ghost" style={{ flex: 1 }} onClick={() => speech.reset()}>重读</button>
            <button className="lx-cta" style={{ flex: 1.3, justifyContent: 'center' }} onClick={() => onResult(sc >= 80, w.word)}>下一题 <Ic name="arrow" s={16} sw={2} /></button>
          </div>
        </div>
      ) : !speech.supported ? (
        <div className="lx-reveal">
          <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>当前浏览器不支持语音识别，点下方听标准发音后跟读。</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="lx-rbtn ghost" style={{ flex: 1 }} onClick={() => speak()}>听发音</button>
            <button className="lx-cta" style={{ flex: 1.3, justifyContent: 'center' }} onClick={() => onResult(true, w.word)}>完成 · 下一题 <Ic name="arrow" s={16} sw={2} /></button>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => speech.phase === 'recording' ? speech.stop() : void speech.start(w.word, 'en-US')} disabled={speech.phase === 'processing'}
            style={{ width: 72, height: 72, borderRadius: '50%', border: 'none', cursor: 'pointer', background: speech.phase === 'recording' ? 'var(--rose-ink)' : 'linear-gradient(180deg,var(--teal),var(--teal-deep))', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 26px -10px rgba(14,140,122,.8)' }}>
            <Ic name="mic" s={28} />
          </button>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 14 }}>
            {speech.phase === 'recording' ? '录音中…点击停止' : speech.phase === 'processing' ? '评分中…' : speech.micDenied ? '麦克风被拒绝，点听发音跟读' : '点麦克风跟读'}
          </div>
        </>
      )}
    </div>
  )
}

/* ───────── 产出面板（真实 AI 批改）───────── */
interface WritingFeedback { ok: boolean; score: number; title?: string; good?: string[]; fix?: string[]; polished?: string; degraded?: boolean }
function ProducePanel({ item, level, onResult }: { item: AiItem; level: string; onResult: (ok: boolean, word: string) => void }) {
  const w = item.word
  const [val, setVal] = useS('')
  const [phase, setPhase] = useS<'edit' | 'grading' | 'result'>('edit')
  const [fb, setFb] = useS<WritingFeedback | null>(null)
  const grade = async () => {
    if (!val.trim() || phase !== 'edit') return
    setPhase('grading')
    try {
      const res = await fetch('/api/ai/writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: w.word, zh: w.zh, sentence: val.trim(), level: lvNum(level) }) })
      if (res.ok) {
        const j = await res.json() as WritingFeedback
        setFb(j)
      } else {
        // 未配置 AI（503）等 → 本地启发式降级：用上目标词即过线
        const used = val.toLowerCase().includes(w.word.toLowerCase())
        setFb({ ok: true, degraded: true, score: used ? 75 : 55, title: used ? '已用上目标词' : '别忘了用上目标词', good: used ? [`句中用到了 ${w.word}`] : [], fix: used ? ['AI 批改暂未开启，先自检语法与搭配'] : [`句子里要包含 ${w.word}`], polished: val.trim() })
      }
    } catch {
      setFb({ ok: true, degraded: true, score: 60, title: '已提交', good: [], fix: ['网络异常，AI 批改未完成'], polished: val.trim() })
    }
    setPhase('result')
  }
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)' }}>用目标词造一个句子</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, marginTop: 4, color: 'var(--ink)' }}>{w.word}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-sub)' }}>{w.zh}{w.phon ? <> · <span style={{ fontFamily: 'var(--font-mono)' }}>{w.phon}</span></> : null}</div>
      </div>
      <textarea autoFocus value={val} disabled={phase !== 'edit'} onChange={e => setVal(e.target.value)} placeholder={`e.g. I will ${w.word} ...`} rows={3}
        style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--line-strong)', background: 'var(--card-2)', fontSize: 15, lineHeight: 1.6, resize: 'none', outline: 'none', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }} />
      {phase === 'edit' && <button className="lx-cta" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }} disabled={!val.trim()} onClick={grade}>提交批改</button>}
      {phase === 'grading' && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-muted)' }}>AI 老师批改中…</div>}
      {phase === 'result' && fb && (
        <div className="lx-reveal" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: fb.score >= 85 ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{fb.score}</div>
            <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>{fb.title || (fb.score >= 85 ? '写得很地道 ✦' : fb.score >= 70 ? '用词准确，可再打磨' : '方向对了，继续加油')}</div>
          </div>
          {(fb.good || []).map((g, i) => <div key={'g' + i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13, color: 'var(--ink-sub)' }}><span style={{ color: 'var(--teal-ink)' }}>✓</span>{g}</div>)}
          {(fb.fix || []).map((g, i) => <div key={'f' + i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13, color: 'var(--ink-sub)' }}><span style={{ color: 'var(--gold-ink)' }}>○</span>{g}</div>)}
          {fb.polished && (
            <div style={{ padding: '10px 13px', marginTop: 8, borderRadius: 12, background: 'var(--card-2)', border: '1px solid var(--teal-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--teal-ink)', letterSpacing: '.1em' }}>润色版</span>
                {fb.degraded && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-muted)' }}>AI 未开启 · 本地降级</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, marginTop: 3, color: 'var(--ink)' }}>{fb.polished}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="lx-rbtn ghost" style={{ flex: 1 }} onClick={() => { setPhase('edit'); setFb(null) }}>再改一次</button>
            <button className="lx-cta" style={{ flex: 1.3, justifyContent: 'center' }} onClick={() => onResult(fb.score >= 70, w.word)}>下一题 <Ic name="arrow" s={16} sw={2} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DrillAiRun({ config, mob, onFinish, onExit }: { config: AiConfig; mob?: boolean; onFinish: (s: AiStats) => void; onExit: () => void }) {
  const trial = config.mode === 'trial'
  const sessionLen = trial ? (config.tcount ?? 10) : (config.lenMode === 'count' ? (config.count ?? 12) : 8)
  const [idx, setIdx] = useS(0)
  const correctRef = useR(0), answeredRef = useR(0), wrongRef = useR<string[]>([]), doneRef = useR(false)

  // 取词组卷：getDue 优先，再补 words（去重），不足则循环
  const [items] = useS<AiItem[]>(() => {
    const st = useLexiStore.getState()
    const speakOn = (config.types ?? []).some(t => SPEAK_TYPES.has(t))
    const produceOn = (config.types ?? []).some(t => PRODUCE_TYPES.has(t))
    const modes: AiMode[] = []
    if (speakOn) modes.push('speak')
    if (produceOn) modes.push('produce')
    if (!modes.length) modes.push('produce')
    const due = st.getDue()
    const pool = [...due, ...st.words.filter(w => !due.find(d => d.id === w.id))].filter(w => w.word && /[a-zA-Z]/.test(w.word))
    const out: AiItem[] = []
    for (let i = 0; i < sessionLen; i++) {
      const word = pool.length ? pool[i % pool.length] : null
      if (!word) break
      out.push({ word, mode: modes[i % modes.length] })
    }
    return out
  })

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onFinish({ kind: 'drill', mode: trial ? 'trial' : 'practice', total: Math.max(1, answeredRef.current), correct: correctRef.current, wrongWords: [...new Set(wrongRef.current)] })
  }
  const cur = items[idx] ?? null
  const onResult = (ok: boolean, word: string) => {
    if (!cur) return
    answeredRef.current += 1
    const dim = cur.mode === 'speak' ? 'speak' : 'write'
    const lexi = useLexiStore.getState()
    if (ok) {
      correctRef.current += 1
      lexi.recordDimPass(cur.word.id, dim)
      lexi.incXp(10)
      if (cur.mode === 'speak') lexi.setPronScore?.(cur.word.id, 85)
    } else {
      wrongRef.current = [...wrongRef.current, word]
      lexi.addWrongAnswer({ wordId: cur.word.id, word, question: cur.mode === 'speak' ? '发音跟读' : `用「${word}」造句`, userAnswer: '', correctAnswer: '', explanation: '', timestamp: Date.now() })
    }
    if (idx + 1 >= items.length || idx + 1 >= sessionLen) finish()
    else setIdx(i => i + 1)
  }

  if (!items.length) return (
    <div className={`lx ${mob ? 'phone' : ''}`}><Aurora /><div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 36 }}>
      词库还没有可练的词，先去「今日 / 词库」收几个词再来口说 / 造句。 <button className="lx-exit" onClick={onExit}>‹ 返回</button>
    </div></div></div>
  )
  if (!cur) return null
  const modeZh = cur.mode === 'speak' ? '口说 · 发音' : '产出 · 造句'
  const modeColor = cur.mode === 'speak' ? 'var(--rose-ink)' : '#2f8f6b'

  return (
    <div className={`lx ${mob ? 'phone' : ''}`}>
      <Aurora />
      {mob && <MobileChrome mode="practice" active="drill" noTab />}
      <div className="lx-scroll"><div className={mob ? 'lx-pad' : 'lx-pad-d'} style={{ paddingTop: mob ? 60 : 34, paddingBottom: mob ? 34 : 40 }}>
        <div className="lx-runwrap">
          <div className="lx-runhead">
            <button className="lx-exit" onClick={onExit}>‹ 退出</button>
            <span className="lx-runtag practice" style={{ color: modeColor }}>{modeZh} · {levelZh(config.level)}</span>
          </div>
          <div className="lx-run-top">
            <span className="lx-run-idx">{idx + 1} / {items.length}</span>
            <div className="lx-run-bar"><i style={{ width: `${(idx / items.length) * 100}%` }} /></div>
            <button className="lx-exit" onClick={finish}>结束并看小结</button>
          </div>
          <div className="lx-qmeta">
            <span className="lx-qtype"><span style={{ color: modeColor }}>◆</span>{cur.mode === 'speak' ? '发音评分' : '用词造句'}</span>
            <span className="lx-qtag" style={{ marginLeft: 'auto' }}>AI 实时 · 不计入题库</span>
          </div>
          <div className="lx-qcard lx-glass">
            {cur.mode === 'speak'
              ? <SpeakPanel key={cur.word.id + idx} item={cur} onResult={onResult} />
              : <ProducePanel key={cur.word.id + idx} item={cur} level={config.level} onResult={onResult} />}
          </div>
        </div>
      </div></div>
    </div>
  )
}
