'use client'
// OnboardingScreen — P1-2 双通道定级
// Steps: goal → path → channel →（test → selfcheck ｜ pick）→ result
//   a) 快速测评（约1分钟）：PROBE_WORDS 7 档梯度词二分检索
//   b) 我知道我的水平：7 张等级卡直选

import { useState } from 'react'
import { useLexiStore, bandToLevel, BAND_CEFR } from '@/store/lexiStore'
import { LEVELS, PROBE_WORDS, LEVEL_CEFR, levelToBand, levelDef } from '@/lib/levels'
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

type Step = 'goal' | 'path' | 'channel' | 'test' | 'selfcheck' | 'pick' | 'result'

export function OnboardingScreen() {
  const navigate = useNavigate()
  const { setProfile, skipOnboarding, profile } = useLexiStore()

  const [step, setStep] = useState<Step>('goal')
  const [exam, setExam] = useState<string | null>(null)
  const [path, setPath] = useState<string | null>(null)

  // probe state（P1-2：PROBE_WORDS 7 档梯度，按数组索引二分）
  const ladder = PROBE_WORDS
  const [lo, setLo] = useState(0)
  const [hi, setHi] = useState(ladder.length - 1)
  const [round, setRound] = useState(0)
  const [level, setLevel] = useState(3)
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
    setStep('channel')
  }

  function answerProbe(know: boolean) {
    const newLo = know ? mid + 1 : lo
    const newHi = know ? hi : mid - 1
    setLo(newLo)
    setHi(newHi)
    const newMid = Math.floor((newLo + newHi) / 2)
    const probed = ladder[Math.max(0, Math.min(newMid, ladder.length - 1))].level
    const newLevel = Math.max(1, Math.min(7, probed))
    setLevel(newLevel)
    if (round + 1 >= MAX_ROUNDS || newLo >= newHi) {
      setStep('selfcheck')
    } else {
      setRound(r => r + 1)
    }
  }

  const scWords = ladder.filter(w => Math.abs(w.level - level) <= 1).slice(0, 3)
  const scWord = scWords[scIdx]

  function answerSelf(know: boolean) {
    const next = scIdx + 1
    const nextKnow = scKnow + (know ? 1 : 0)
    if (next >= scWords.length) {
      const adj = nextKnow >= 2 ? 1 : nextKnow === 1 ? 0 : -1
      setLevel(l => Math.max(1, Math.min(7, l + adj)))
      setStep('result')
    } else {
      setScKnow(nextKnow)
      setScIdx(next)
    }
  }

  function handlePick(l: number) {
    setLevel(l)
    setStep('result')
  }

  async function finish() {
    const band = levelToBand(level)
    const def = levelDef(level)
    setProfile({
      targetExam: exam ?? def.examKey ?? 'casual',
      level,
      band,
      dailyGoal,
      onboarded: true,
      userLevel: bandToLevel(band),
    })
    // A5：定级完成立即生成个性化今日包，再进今日页
    await useLexiStore.getState().buildTodayPack()
    navigate('today', { flow: true })
  }

  function skip() {
    skipOnboarding()
    navigate('home')
  }

  const def = levelDef(level)
  const cefr = LEVEL_CEFR[level] ?? BAND_CEFR[levelToBand(level)] ?? 'B1'
  const estVocab = def.wordCount

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

      {/* Step indicator（双通道：channel 后 test/selfcheck 与 pick 等价为第 4 段） */}
      <div style={{ padding: '14px 24px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
        {(['goal', 'path', 'channel', 'test', 'result'] as const).map(s => {
          const order = ['goal', 'path', 'channel', 'test', 'selfcheck', 'pick', 'result']
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

        {/* ── Step: channel（P1-2 双通道选择）── */}
        {step === 'channel' && (
          <div className="fade-up">
            <Eyebrow>Step 3 of 4 — 定级方式</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>怎么确定你的水平？</h2>
            <p style={{ margin: '0 0 28px', color: 'var(--ink-sub)', fontSize: 14 }}>两种方式都不到一分钟。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setStep('test')} className="btn-press"
                style={{ padding: '20px', borderRadius: 14, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>快速测评（约 1 分钟）</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-sub)', marginTop: 4 }}>认词二分检索，{MAX_ROUNDS} 轮内锁定你的档位</div>
              </button>
              <button onClick={() => setStep('pick')} className="btn-press"
                style={{ padding: '20px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>我知道我的水平</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-sub)', marginTop: 4 }}>直接从 7 个等级里选</div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step: pick（7 张等级卡直选）── */}
        {step === 'pick' && (
          <div className="fade-up">
            <Eyebrow>选择等级</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>你的水平在哪一档？</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--ink-sub)', fontSize: 14 }}>与词库七档对齐，之后可随时在「我的」页重新定级。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LEVELS.map(l => (
                <button key={l.level} onClick={() => handlePick(l.level)} className="btn-press"
                  style={{ padding: '14px 18px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'var(--teal-bg)', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{l.level}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>{l.zh}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>{l.desc}</span>
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{l.wordCount.toLocaleString()} 词</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: test ── */}
        {step === 'test' && currentWord && (
          <div className="fade-up">
            <Eyebrow>快速测评 — 词汇测试</Eyebrow>
            <h2 style={{ margin: '10px 0 6px', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>你认识这个词吗？</h2>
            <p style={{ margin: '0 0 32px', color: 'var(--ink-sub)', fontSize: 14 }}>诚实作答，帮我们找到你的词汇基线。({round + 1}/{MAX_ROUNDS})</p>
            <div style={{ background: 'var(--card)', borderRadius: 20, padding: '48px 32px', textAlign: 'center', border: '1px solid var(--line)', marginBottom: 32 }}>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', letterSpacing: '-0.01em', marginBottom: 10 }}>{currentWord.word}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>{LEVEL_CEFR[currentWord.level]}</div>
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

            {/* Level card（P1-2：7 档等级 + CEFR 对照 + 该档词库词量） */}
            <div style={{ background: 'linear-gradient(135deg, var(--teal-bg) 0%, var(--card) 100%)', borderRadius: 20, padding: '32px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--teal-ink)', fontFamily: 'var(--font-serif-zh)', lineHeight: 1.2 }}>{def.zh}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>Level {level} · {cefr}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 12 }}>该档词库</div>
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
