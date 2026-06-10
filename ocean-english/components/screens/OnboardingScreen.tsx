'use client'
// OnboardingScreen — 1:1 port of prototype/screen-onboarding.jsx
// Steps: goal → path → test → selfcheck → result

import { useState } from 'react'
import { useLexiStore, bandToLevel, PROBE_LADDER, BAND_CEFR } from '@/store/lexiStore'
import { useLearningStore } from '@/store/learningStore'
import { useNavigate } from '@/hooks/useNavigate'
import { PrimaryBtn, GhostBtn, Eyebrow } from '@/components/screens/SharedUI'

// ── constants ──────────────────────────────────────────────────
const EXAM_GRID = [
  { id: 'IELTS',  zh: '雅思',  en: 'IELTS Academic',       color: '#1f9f8c' },
  { id: 'TOEFL',  zh: '托福',  en: 'TOEFL iBT',            color: '#3b5bd9' },
  { id: 'CET6',   zh: '六级',  en: 'CET Band 6',           color: '#6d4bc4' },
  { id: 'CET4',   zh: '四级',  en: 'CET Band 4',           color: '#d2792f' },
  { id: 'KAOYAN', zh: '考研',  en: 'Graduate Entrance',    color: '#d4477e' },
  { id: 'casual', zh: '休闲',  en: 'Casual Vocabulary',    color: '#5b6b78' },
]

const PATH_OPTS = [
  { id: 'full',    zh: '全面掌握', en: 'Complete Mastery',   icon: '🎯', desc: '词汇+练习+阅读+复习完整闭环' },
  { id: 'words',   zh: '速记词汇', en: 'Rapid Words',        icon: '⚡', desc: '快速积累核心词汇，每日打卡' },
  { id: 'reading', zh: '精读提升', en: 'Deep Reading',       icon: '📖', desc: '通过语境理解词汇用法' },
  { id: 'exam',    zh: '应试备考', en: 'Exam Focus',         icon: '🏆', desc: '针对性题型，模拟测试练习' },
]

const GOAL_OPTS = [8, 12, 16, 20]

type Step = 'goal' | 'path' | 'test' | 'selfcheck' | 'result'

export function OnboardingScreen() {
  const navigate = useNavigate()
  const { setProfile, skipOnboarding, probeLadder, bandCefr, profile } = useLexiStore()

  const [step, setStep] = useState<Step>('goal')
  const [exam, setExam] = useState<string | null>(null)
  const [path, setPath] = useState<string | null>(null)

  // probe state
  const ladder = probeLadder()
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(ladder.length - 1)
  const [round, setRound] = useState(0)
  const [probeBand, setProbeBand] = useState(5)
  const MAX_ROUNDS = 6

  // selfcheck state
  const [scIdx, setScIdx] = useState(0)
  const [scKnow, setScKnow] = useState(0)

  // result state
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoal ?? 12)
  const [customGoal, setCustomGoal] = useState(false)

  const mid = Math.floor((lo + hi) / 2)
  const currentWord = ladder[mid]

  function handleExam(id: string) {
    setExam(id)
    setStep('path')
  }

  function handlePath(id: string) {
    setPath(id)
    setStep('test')
  }

  function answerProbe(know: boolean) {
    const newLo = know ? mid + 1 : lo
    const newHi = know ? hi : mid - 1
    setLo(newLo)
    setHi(newHi)
    const newMid = Math.floor((newLo + newHi) / 2)
    const newBand = Math.max(1, Math.min(8, ladder[Math.max(0, Math.min(newMid, ladder.length - 1))].band))
    setProbeBand(newBand)
    if (round + 1 >= MAX_ROUNDS || newLo >= newHi) {
      setProbeBand(newBand)
      setStep('selfcheck')
    } else {
      setRound(r => r + 1)
    }
  }

  const scWords = ladder.filter(w => Math.abs(w.band - probeBand) <= 1).slice(0, 3)
  const scWord = scWords[scIdx]

  function answerSelf(know: boolean) {
    const next = scIdx + 1
    const nextKnow = scKnow + (know ? 1 : 0)
    if (next >= scWords.length) {
      const adj = nextKnow >= 2 ? 1 : nextKnow === 1 ? 0 : -1
      const finalBand = Math.max(1, Math.min(8, probeBand + adj))
      setProbeBand(finalBand)
      setStep('result')
    } else {
      setScKnow(nextKnow)
      setScIdx(next)
    }
  }

  async function finish() {
    const userLevel = bandToLevel(probeBand)
    setProfile({
      targetExam: exam ?? 'casual',
      band: probeBand,
      dailyGoal,
      onboarded: true,
      userLevel,
    })
    // 镜像写 learningStore：云同步（CloudSyncProvider）仍监听它，A7 改造后移除
    useLearningStore.getState().setUserLevel(userLevel)
    // A5：定级完成立即生成个性化今日包，再进今日页
    await useLexiStore.getState().buildTodayPack()
    navigate('today', { flow: true })
  }

  function skip() {
    skipOnboarding()
    navigate('home')
  }

  const cefr = BAND_CEFR[probeBand] ?? 'B2'
  const estVocab = probeBand * 650

  // ── Shared shell ────────────────────────────────────────────
  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '18px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
          词渊 <em style={{ color: 'var(--teal-ink)', fontStyle: 'normal', fontSize: 14 }}>Lexiverse</em>
        </span>
        <button onClick={skip} style={{ fontSize: 13, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          跳过设置
        </button>
      </header>

      {/* Step indicator */}
      <div style={{ padding: '14px 24px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
        {(['goal', 'path', 'test', 'result'] as const).map((s, i) => {
          const order = ['goal', 'path', 'test', 'selfcheck', 'result']
          const current = order.indexOf(step)
          const mine = order.indexOf(s)
          const active = mine <= current
          return <div key={s} style={{ height: 3, flex: 1, borderRadius: 99, background: active ? 'var(--teal-ink)' : 'var(--line)', transition: 'background 0.3s' }} />
        })}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 600, margin: '0 auto', width: '100%' }}>

        {/* ── Step: goal ── */}
        {step === 'goal' && (
          <div className="fade-up">
            <Eyebrow>Step 1 of 4</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>你的目标是？</h2>
            <p style={{ margin: '0 0 28px', color: 'var(--ink-sub)', fontSize: 14 }}>选择你想要通过的考试，我们会按需配置词库。</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {EXAM_GRID.map(e => (
                <button key={e.id} onClick={() => handleExam(e.id)} className="btn-press"
                  style={{ padding: '20px 16px', borderRadius: 14, border: `1.5px solid ${exam === e.id ? e.color : 'var(--line)'}`, background: exam === e.id ? hexA(e.color, 0.08) : 'var(--card)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-serif-zh)', fontWeight: 700, color: e.color }}>{e.zh}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>{e.en}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: path ── */}
        {step === 'path' && (
          <div className="fade-up">
            <Eyebrow>Step 2 of 4</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>学习方式</h2>
            <p style={{ margin: '0 0 28px', color: 'var(--ink-sub)', fontSize: 14 }}>选择最适合你的学习路径。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PATH_OPTS.map(p => (
                <button key={p.id} onClick={() => handlePath(p.id)} className="btn-press"
                  style={{ padding: '18px 20px', borderRadius: 14, border: `1.5px solid ${path === p.id ? 'var(--teal-ink)' : 'var(--line)'}`, background: path === p.id ? 'var(--teal-bg)' : 'var(--card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 26 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>{p.zh}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: test ── */}
        {step === 'test' && currentWord && (
          <div className="fade-up">
            <Eyebrow>Step 3 of 4 — 词汇测试</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>你认识这个词吗？</h2>
            <p style={{ margin: '0 0 32px', color: 'var(--ink-sub)', fontSize: 14 }}>诚实作答，帮我们找到你的词汇基线。({round + 1}/{MAX_ROUNDS})</p>
            <div style={{ background: 'var(--card)', borderRadius: 20, padding: '48px 32px', textAlign: 'center', border: '1px solid var(--line)', marginBottom: 32 }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', letterSpacing: '-0.01em', marginBottom: 10 }}>{currentWord.word}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{currentWord.cefr}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => answerProbe(false)} className="btn-press"
                style={{ padding: '16px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
                不认识
              </button>
              <button onClick={() => answerProbe(true)} className="btn-press"
                style={{ padding: '16px', borderRadius: 12, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
                认识 ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Step: selfcheck ── */}
        {step === 'selfcheck' && scWord && (
          <div className="fade-up">
            <Eyebrow>微调校准</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>再确认几个词</h2>
            <p style={{ margin: '0 0 28px', color: 'var(--ink-sub)', fontSize: 14 }}>({scIdx + 1}/{scWords.length})</p>
            <div style={{ background: 'var(--card)', borderRadius: 20, padding: '40px 32px', textAlign: 'center', border: '1px solid var(--line)', marginBottom: 24 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', marginBottom: 8 }}>{scWord.word}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-sub)' }}>{scWord.zh}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => answerSelf(false)} className="btn-press"
                style={{ padding: '14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 15, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
                不太确定
              </button>
              <button onClick={() => answerSelf(true)} className="btn-press"
                style={{ padding: '14px', borderRadius: 12, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
                认识 ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Step: result ── */}
        {step === 'result' && (
          <div className="fade-up">
            <Eyebrow>测试完成</Eyebrow>
            <h2 style={{ margin: '10px 0 20px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>你的词汇基线</h2>

            {/* CEFR card */}
            <div style={{ background: 'linear-gradient(135deg, var(--teal-bg) 0%, var(--card) 100%)', borderRadius: 20, padding: '32px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--teal-ink)', fontFamily: 'var(--font-news)', lineHeight: 1 }}>{cefr}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 8 }}>预估词汇量</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{estVocab.toLocaleString()} 词</div>
            </div>

            {/* Daily goal */}
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: '20px', border: '1px solid var(--line)', marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>每日学习目标</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {GOAL_OPTS.map(g => (
                  <button key={g} onClick={() => { setDailyGoal(g); setCustomGoal(false) }}
                    className="btn-press"
                    style={{ padding: '8px 18px', borderRadius: 99, border: `1.5px solid ${dailyGoal === g && !customGoal ? 'var(--teal-ink)' : 'var(--line)'}`, background: dailyGoal === g && !customGoal ? 'var(--teal-bg)' : 'transparent', color: dailyGoal === g && !customGoal ? 'var(--teal-ink)' : 'var(--ink-sub)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    {g} 词
                  </button>
                ))}
                <button onClick={() => setCustomGoal(true)} className="btn-press"
                  style={{ padding: '8px 18px', borderRadius: 99, border: `1.5px solid ${customGoal ? 'var(--teal-ink)' : 'var(--line)'}`, background: customGoal ? 'var(--teal-bg)' : 'transparent', color: customGoal ? 'var(--teal-ink)' : 'var(--ink-sub)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  自定义
                </button>
              </div>
              {customGoal && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setDailyGoal(d => Math.max(4, d - 4))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--card-2)', cursor: 'pointer', fontSize: 18, color: 'var(--ink-sub)' }}>-</button>
                  <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)', minWidth: 48, textAlign: 'center' }}>{dailyGoal} 词</span>
                  <button onClick={() => setDailyGoal(d => Math.min(60, d + 4))} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--card-2)', cursor: 'pointer', fontSize: 18, color: 'var(--ink-sub)' }}>+</button>
                </div>
              )}
            </div>

            <PrimaryBtn onClick={finish} style={{ width: '100%' }}>开始学习 →</PrimaryBtn>
          </div>
        )}
      </main>
    </div>
  )
}

// inline hexA for this file
function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
