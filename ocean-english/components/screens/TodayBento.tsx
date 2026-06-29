'use client'

/* ════════════════════════════════════════════════════════════════════════
   界面优化4 · 今日页 Bento —— 1:1 自「今日页-Bento.html」重建，数据全接 store。
   · 学习方式 tabs → profile.path（写 store 重排今日动线 PATHS）
   · 今日动线「去完成」→ 项目 useNavigate 真实闭环（与 TodayScreen go() 同）
   · AI 编排 / 进度环 / 每日目标 / 掌握度光带 / 连击环 / 7 天预测 / 每日一词 / 推荐词带 全部 store 实时值
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { useV2DailyPlan, PLAN_CARD_TONE, type V2PlanCard } from '@/hooks/useV2DailyPlan'
import { useNavigate } from '@/hooks/useNavigate'
import { levelDef, MAX_LEVEL } from '@/lib/levels'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { PATHS, PATH_KEYS, LEVEL_NAMES, daysToExam, type PathId, type ActCard } from '@/lib/today/today-paths'
import './today-bento.css'

const MILES = [3, 7, 14, 30, 60, 100, 200, 365]
// 每日一词池（按等级轮换）
const WOD: Record<'junior' | 'cet' | 'advanced', [string, string, string, string][]> = {
  junior: [['serene', '/sɪˈriːn/', 'adj.', '平静的；安详的 —— 心如止水，自有从容。'], ['gentle', '/ˈdʒentl/', 'adj.', '温和的 —— 以柔克刚，亦是力量。']],
  cet: [['resilience', '/rɪˈzɪliəns/', 'n.', '韧性；快速恢复力 —— 跌倒了再站起来的力量。'], ['eloquent', '/ˈeləkwənt/', 'adj.', '雄辩的；有感染力的 —— 言之有物，动人于心。'], ['nuance', '/ˈnjuːɑːns/', 'n.', '细微差别 —— 高手与新手，差在这一点点。'], ['tenacious', '/təˈneɪʃəs/', 'adj.', '坚韧不拔的 —— 咬定青山不放松。'], ['serendipity', '/ˌserənˈdɪpəti/', 'n.', '机缘巧合 —— 不期而遇的美好。'], ['luminous', '/ˈluːmɪnəs/', 'adj.', '发光的；明亮的 —— 万词成海，自有光。'], ['ephemeral', '/ɪˈfemərəl/', 'adj.', '短暂的 —— 朝露易逝，更要珍惜。']],
  advanced: [['quintessential', '/ˌkwɪntɪˈsenʃl/', 'adj.', '典型的；精髓的 —— 最能代表本质的那一个。'], ['ubiquitous', '/juːˈbɪkwɪtəs/', 'adj.', '无处不在的 —— 你越留意，越发现它处处都在。'], ['ineffable', '/ɪnˈefəbl/', 'adj.', '难以言喻的 —— 有些美，只可意会。']],
}
const MASTERY_SEG: { state: string; zh: string; color: string }[] = [
  { state: 'recommended', zh: '推荐', color: '#c99a3e' },
  { state: 'learning', zh: '学习中', color: '#3b5bd9' },
  { state: 'review', zh: '待复习', color: '#b3781f' },
  { state: 'weak', zh: '薄弱', color: '#bf4a30' },
  { state: 'mastered', zh: '已掌握', color: '#0e8c7a' },
]
const DAY = 86_400_000

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0; const dur = 850, start = performance.now()
    const tick = (t: number) => { const p = Math.min(1, (t - start) / dur); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [to])
  return <>{v}{suffix}</>
}

export function TodayBento() {
  const router = useRouter()
  const navigate = useNavigate()
  const profile = useLexiStore(s => s.profile)
  const words = useLexiStore(s => s.words)
  const streak = useLexiStore(s => s.streakData.current)
  const setProfile = useLexiStore(s => s.setProfile)
  const getTodayProgress = useLexiStore(s => s.getTodayProgress)
  const getToday = useLexiStore(s => s.getToday)
  const getDue = useLexiStore(s => s.getDue)
  const getWeak = useLexiStore(s => s.getWeak)
  const wrongAnswers = useLexiStore(s => s.wrongAnswers)
  const counts = useLexiStore(s => s.counts)
  const masteredPct = useLexiStore(s => s.masteredPct)
  const quizHistory = useLexiStore(s => s.quizHistory)

  const [mounted, setMounted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [askVal, setAskVal] = useState('')
  const [displayName, setDisplayName] = useState('学习者')
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t) }, [])
  // 挂载时按需生成今日包（buildTodayPack 当天已建则跳过，幂等）——与 HomeScreen/旧 TodayScreen 同源。
  // /today 是底栏主入口，直接进入(非经首页)也应在新的一天重建今日包，避免显示昨日/空包（界面优化4 迁移时遗漏）。
  useEffect(() => { void useLexiStore.getState().buildTodayPack() }, [])
  // 用户名存于 Supabase（user_metadata / profiles），本地 store 无此字段 → 客户端 best-effort 取
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void (async () => {
      try {
        const { data } = await createClient().auth.getUser()
        const u = data.user
        const name = (u?.user_metadata?.username as string | undefined) || (u?.email ? u.email.split('@')[0] : '')
        if (!cancelled && name) setDisplayName(name)
      } catch { /* 取不到就用默认 */ }
    })()
    return () => { cancelled = true }
  }, [])

  const level = profile.level ?? 0
  const path: PathId = (PATH_KEYS as string[]).includes(profile.path as string) ? (profile.path as PathId) : 'full'
  const pathCfg = PATHS[path]

  // ── 问候 / 日期 ──
  const now = new Date()
  const hr = now.getHours()
  const greet = hr < 5 ? '夜深了' : hr < 12 ? '早上好' : hr < 18 ? '下午好' : '晚上好'
  const goalDir = (LEVEL_NAMES[level] || (typeof profile.targetExam === 'string' ? profile.targetExam : '')) + '方向'
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  const dateStr = `${weekday} · ${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`

  // ── 连击 ──
  const milestone = MILES.find(m => m > streak) ?? streak
  const streakFrac = milestone > 0 ? Math.min(1, streak / milestone) : 0
  const toMilestone = Math.max(0, milestone - streak)

  // ── 今日进度 ──
  const progress = getTodayProgress()
  const { n: studied, goal, pct } = progress
  const remaining = Math.max(0, goal - studied)
  const pack = getToday()
  const dueLen = getDue().length

  // ── 掌握度 ──
  const c = counts()
  const masteryPct = masteredPct()
  const totalWords = levelDef(level).wordCount
  const learned = (c.learning ?? 0) + (c.review ?? 0) + (c.weak ?? 0) + (c.mastered ?? 0)
  const weekMastered = words.filter(w => w.state === 'mastered' && w.lastReviewedAt && Date.now() - w.lastReviewedAt < 7 * DAY).length
  const segData = MASTERY_SEG.map(s => ({ ...s, count: c[s.state as keyof typeof c] ?? 0 }))
  const segSum = segData.reduce((a, s) => a + s.count, 0)

  // ── 未来 7 天预测 ──
  const forecast = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const t0 = start.getTime(), dow = start.getDay()
    const buckets = Array.from({ length: 7 }, (_, i) => words.filter(w => w.nextReviewAt != null && w.nextReviewAt >= t0 + i * DAY && w.nextReviewAt < t0 + (i + 1) * DAY).length)
    const max = Math.max(1, ...buckets)
    const dn = ['日', '一', '二', '三', '四', '五', '六']
    return buckets.map((cnt, i) => ({ cnt, h: 12 + Math.round((cnt / max) * 48), label: i === 0 ? '今' : i === 1 ? '明' : dn[(dow + i) % 7] }))
  }, [words])

  // ── 昨日正确率 ──
  const lastQuiz = quizHistory[0]
  const yAcc = lastQuiz && lastQuiz.total > 0 ? Math.round((lastQuiz.score / lastQuiz.total) * 100) : null
  const weakCount = words.filter(w => w.state === 'weak').length
  const examDays = profile.examDate ? daysToExam(profile.examDate) : null
  const examName = LEVEL_NAMES[level] || (typeof profile.targetExam === 'string' ? profile.targetExam : '目标')

  // ── 每日一词 ──
  const wod = useMemo(() => {
    // 八档：雅思(L8, B2-C1)按 cefrRank 与六级/考研同级，归中阶桶，不入 advanced 最难桶
    const key = level <= 2 ? 'junior' : (level <= 5 || level === MAX_LEVEL) ? 'cet' : 'advanced'
    const pool = WOD[key]
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / DAY)
    return pool[doy % pool.length]
  }, [level])

  // ── 推荐单词带（未学过）──
  const recommend = useMemo(() => words.filter(w => w.state === 'unknown' || w.state === 'recommended').slice(0, 12), [words])

  // ── v2 服务端今日编排（叠加层；登录时 source==='v2'，否则纯客户端，仅 v2 时展示编排卡）──
  const v2PlanInput = useMemo(() => ({
    dueWords: getDue().map(w => ({ id: w.id, word: w.word })),
    weakWords: getWeak().map(w => ({ id: w.id, word: w.word })),
    recentMistakes: wrongAnswers.slice(0, 50).map(w => ({ wordId: w.wordId })),
    goal: { dailyGoal: profile.dailyGoal || 0, goals: profile.goals ?? [] },
    examTarget: typeof profile.targetExam === 'string' ? profile.targetExam : null,
    mockPending: false,
    // getDue/getWeak 是稳定 store 选择器引用，读当前 words；故 words 变化时需重算（eslint 检测不到此闭包依赖）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [words, wrongAnswers, profile.dailyGoal, profile.goals, profile.targetExam, getDue, getWeak])
  const v2Plan = useV2DailyPlan(v2PlanInput)

  // ── 路由（与 TodayScreen go() 同源）──
  const examTag = typeof profile.targetExam === 'string' ? profile.targetExam : ''
  const go = (key: string) => {
    switch (key) {
      case 'learn': return navigate('learn', { flow: true })
      case 'practice': case 'quiz': return navigate('quiz', { flow: true })
      case 'reading': case 'article': case 'pick': return navigate('reading')
      case 'review': return navigate('review', { flow: true })
      case 'mock': return navigate('quiz', examTag ? { mode: 'exam-practice', exam: examTag } : { mode: 'exam-practice' })
      case 'wrong': return navigate('quiz', { mode: 'wrong-answer-booster' })
      case 'progress': return navigate('exam')
      case 'recap': return navigate('universe', { celebrate: 1 })
      default: return navigate('today')
    }
  }
  // v2 计划卡 → 路由（exam_task 带 skillKey 直跳考试专项任务，其余复用 go()）
  const goPlan = (c: V2PlanCard) => {
    switch (c.type) {
      case 'word_review': return go('review')
      case 'new_words': return go('learn')
      case 'mistake_fix': return go('wrong')
      case 'mock_review': return go('mock')
      case 'exam_task': {
        const p = c.payload ?? {}
        const examId = typeof p.examId === 'string' ? p.examId : ''
        const skillKey = typeof p.skillKey === 'string' ? p.skillKey : ''
        if (examId && skillKey) { router.push(`/quiz?mode=task&examId=${examId}&taskType=${skillKey}`); return }
        return go('practice')
      }
      case 'output': default: return go('practice')
    }
  }
  const dailyGoal = profile.dailyGoal || goal
  const metaFor = (card: ActCard): string => {
    if (card.key === 'learn') return `${dailyGoal} 词`
    if (card.key === 'practice' || card.key === 'quiz') return `${Math.max(6, Math.round(dailyGoal * 0.8))} 题`
    if (card.key === 'pick') return `${Math.max(5, Math.round(dailyGoal * 0.5))} 词`
    if (card.key === 'review') return `${dueLen} 词`
    return card.meta ?? ''
  }

  // 指针高光
  const onTileMove = (e: React.MouseEvent<HTMLElement>) => { const el = e.currentTarget; const r = el.getBoundingClientRect(); el.style.setProperty('--px', `${(e.clientX - r.left) / r.width * 100}%`); el.style.setProperty('--py', `${(e.clientY - r.top) / r.height * 100}%`) }
  const onTileLeave = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.removeProperty('--px'); e.currentTarget.style.removeProperty('--py') }

  const askSend = (q?: string) => { const text = (q ?? askVal).trim(); if (!text) return; router.push(`/chat?ask=${encodeURIComponent(text)}`) }
  const playWord = () => { setPlaying(true); void speakSmart(wod[0], 'us'); setTimeout(() => setPlaying(false), 1600) }

  // 今日进度环（半径 52，周长 326.7）
  const R = 52, C2 = 2 * Math.PI * R
  const ringOffset = mounted ? C2 * (1 - pct / 100) : C2
  const SR = 39, SC = 2 * Math.PI * SR
  const streakOffset = mounted ? SC * (1 - streakFrac) : SC
  const rev = (cls = '') => `reveal${mounted ? ' in' : ''}${cls ? ' ' + cls : ''}`

  return (
    <div className="tbento" ref={rootRef}>
      <div className="bgaur"><b className="a1 drift-a" /><b className="a2 drift-b" /></div>

      <div className="page lqg">
        <div className={`greet ${rev()}`}>
          <div>
            <div className="k">{greet}，{displayName} · {goalDir}</div>
            <h1>今天，继续航行<span className="news-i">Keep sailing</span></h1>
          </div>
          <div className="date">{dateStr}<br />已连续 {streak} 天</div>
        </div>

        {/* 学习方式 tabs */}
        <div className="methods">
          {PATH_KEYS.map(m => (
            <button key={m} className={m === path ? 'on' : ''} onClick={() => setProfile({ path: m })}>{PATHS[m].zh}</button>
          ))}
        </div>

        <div className="bento">
          {/* AI 今日编排 */}
          <section className={`tile t-ai glow ${rev()}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <div className="top">
              <span className="aic"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.7 4.5 2.8 6.6 7.3 7.3-4.5.7-6.6 2.8-7.3 7.3-.7-4.5-2.8-6.6-7.3-7.3 4.5-.7 6.6-2.8 7.3-7.3z" /></svg></span>
              <h3>AI 今日编排</h3>
              <span className="tag">ALGORITHM</span>
            </div>
            <p className="msg">状态正好 —— <b>先学今天的新词</b>，再顺势练一组。{examDays != null && <b style={{ color: 'var(--rose-ink)' }}> · 距 {examName} 还有 {examDays} 天</b>}</p>
            <div className="aichips">
              <span><span className="d" style={{ background: 'var(--blue-ink)' }} />到期复习 <b>{dueLen}</b></span>
              <span><span className="d" style={{ background: 'var(--rose-ink)' }} />薄弱 <b>{weakCount}</b></span>
              {yAcc != null && <span><span className="d" style={{ background: 'var(--teal-ink)' }} />昨日正确率 <b>{yAcc}%</b></span>}
            </div>
            {/* v2 服务端编排（仅登录 + 服务端有 skill_states 时；否则保留上方本地静态编排） */}
            {v2Plan.source === 'v2' && v2Plan.cards.length > 0 && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '.04em', marginBottom: 8 }}>服务端编排 · 按真实作答</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {v2Plan.cards.slice(0, 3).map((c, i) => (
                    <button key={`${c.type}-${i}`} onClick={() => goPlan(c)} className="btn-press"
                      style={{ display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 11, padding: '8px 11px', cursor: 'pointer' }}>
                      <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: 99, background: PLAN_CARD_TONE[c.type] }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 700 }}>{c.titleZh}</b>
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-sub)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reason}</span>
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-muted)' }}>{c.estimatedMinutes}分</span>
                      <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--teal-ink)', fontWeight: 700 }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* today */}
          <section className={`tile t-today glow ${rev()}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <div className="glowblob drift-a" style={{ top: -70, right: -50, width: 220, height: 220, background: 'radial-gradient(circle,rgba(79,230,206,.22),transparent 70%)' }} />
            <div className="glowblob drift-b" style={{ bottom: -90, left: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(59,91,217,.14),transparent 70%)' }} />
            <p className="tk">今日学习 · Today</p>
            <h2>{remaining > 0 ? `还有 ${remaining} 个词待完成` : '今日目标已达成 ✦'}</h2>
            <p className="sub">今日包 <b style={{ color: '#c99a3e' }}>{pack.recommended.length} 推荐</b> · <b style={{ color: '#8ad7ff' }}>{pack.review.length} 待复习</b> · <b style={{ color: '#ff8a72' }}>{pack.weak.length} 薄弱</b></p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 'auto', paddingTop: 24 }}>
              <div className="ring">
                <svg width="116" height="116"><circle cx="58" cy="58" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" /><circle className="ring-fg" cx="58" cy="58" r={R} fill="none" stroke="#4fe6ce" strokeWidth="10" strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={ringOffset} /></svg>
                <div className="pct"><b><CountUp to={pct} />%</b><s>今日完成</s></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="barmeta"><span>{studied} / {goal} 词</span><span>{pct}%</span></div>
                <div className="bar"><i style={{ width: mounted ? `${pct}%` : 0 }} /></div>
                <button className="lq lq-btn accent" data-magnetic="0.16" style={{ marginTop: 18, width: '100%', fontSize: 14, padding: '13px 22px' }} onClick={() => go(pathCfg.cards[0].key)}><span className="lq-sheen" /><span>继续学习 →</span></button>
                <div className="goalrow">
                  <span className="gl">每日目标</span>
                  {[8, 12, 15, 20].map(g => <button key={g} className={g === dailyGoal ? 'on' : ''} onClick={() => setProfile({ dailyGoal: g })}>{g} 词</button>)}
                </div>
              </div>
            </div>
          </section>

          {/* mastery */}
          <section className={`tile t-mastery glow ${rev('reveal-d1')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <p className="tk">词库掌握度 · Mastery</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="big"><CountUp to={masteryPct} />%</span>
              <span className="ms">已掌握 · 共 <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{totalWords.toLocaleString()}</b> 词 · 已学 <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{learned}</b></span>
              {weekMastered > 0 && <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--teal-ink)', background: 'var(--teal-bg)', borderRadius: 99, padding: '3px 11px', fontWeight: 600 }}>本周 +{weekMastered}</span>}
            </div>
            <div className="seg">
              {segSum > 0 ? segData.filter(s => s.count > 0).map(s => <i key={s.state} style={{ flex: s.count, background: s.color }} />) : <i style={{ flex: 1, background: 'var(--line-strong)' }} />}
            </div>
            <div className="chips">
              {segData.map(s => (
                <Link key={s.state} href={`/dictionary?state=${s.state}`} className="chip"><span className="d" style={{ background: s.color }} />{s.zh} <b>{s.count}</b></Link>
              ))}
            </div>
          </section>

          {/* streak */}
          <Link href="/achievements" className={`tile t-streak hov glow ${rev('reveal-d2')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <div className="streak-ring">
              <svg width="88" height="88"><circle cx="44" cy="44" r={SR} fill="none" stroke="var(--gold-bg)" strokeWidth="7" /><circle className="ring-fg" cx="44" cy="44" r={SR} fill="none" stroke="var(--gold-ink)" strokeWidth="7" strokeLinecap="round" strokeDasharray={SC} strokeDashoffset={streakOffset} /></svg>
              <div className="c"><span className="fl"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 3 5 6 6-3 1-5 3-6 8-1-5-3-7-6-8 3-1 5-2 6-6z" /></svg></span><span className="n"><CountUp to={streak} /></span></div>
            </div>
            <div className="l">连续天数</div>
            <div className="sub">{toMilestone > 0 ? `再 ${toMilestone} 天解锁徽章` : '徽章已解锁 ✦'}</div>
          </Link>

          {/* forecast */}
          <Link href="/memory" className={`tile t-forecast hov glow ${rev('reveal-d2')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <p className="tk">未来 7 天 · Forecast</p>
            <div className="bars">
              {forecast.map((f, i) => (
                <div key={i} className={`col${i === 0 ? ' today' : ''}`} title={`${f.cnt} 词到期`}><i style={{ height: mounted ? f.h : 4 }} /><small>{f.label}</small></div>
              ))}
            </div>
          </Link>

          {/* resume */}
          <button className={`tile t-resume hov glow ${rev()}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave} onClick={() => go(pathCfg.cards[0].key)} style={{ textAlign: 'left' }}>
            <span className="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg></span>
            <span style={{ flex: 1, minWidth: 0 }}><span className="tk" style={{ color: 'var(--ink-muted)' }}>继续上次 · Resume</span><span className="t">{studied < goal ? `新词学到 ${studied}/${goal}，继续` : '今日已完成，复习巩固'}</span></span>
            <span className="ar">→</span>
          </button>

          {/* word of day */}
          <section className={`tile t-word glow ${rev('reveal-d1')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <button className={`play${playing ? ' on' : ''}`} onClick={playWord} aria-label="朗读"><span className="tri"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg></span><span className="eq"><i /><i /><i /></span></button>
            <p className="tk" style={{ color: 'var(--ink-muted)' }}>每日一词 · Word of the day</p>
            <div className="w" style={{ marginTop: 10 }}>{wod[0]}</div>
            <div className="ipa">{wod[1]} <span className="pos">{wod[2]}</span></div>
            <div className="def">{wod[3]}</div>
          </section>

          {/* 今日动线（任务清单） */}
          <section className={`tile t-tasks glow ${rev('reveal-d1')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <p className="tk" style={{ color: 'var(--ink-muted)' }}>今日动线 · {pathCfg.zh}</p>
            <div className="list">
              {pathCfg.cards.filter(card => card.key !== 'recap').map((card, i) => (
                <div key={card.key} className={`ti${i === 0 ? ' active' : ''}`} onClick={() => go(card.key)}>
                  <span className="num">{i + 1}</span>
                  <span className="rt"><b>{card.t}</b><i>{card.s}</i></span>
                  <span className="meta">{metaFor(card) && <span>{metaFor(card)}</span>}{i === 0 && <em>去完成 →</em>}</span>
                </div>
              ))}
            </div>
          </section>

          {/* AI 领航问答 */}
          <section className={`tile t-ask glow ${rev('reveal-d2')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <p className="tk" style={{ color: 'var(--ink-muted)' }}>领航 · 随时问</p>
            <div className="lq lq-field"><span className="lq-sheen" />
              <svg className="lead" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>
              <input value={askVal} onChange={e => setAskVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') askSend() }} placeholder="问问今天学的词…" />
              <button className="lq-iconbtn" type="button" aria-label="问" onClick={() => askSend()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </div>
            <div className="sugg">{[`${wod[0]} 的词根？`, '近义词有哪些', '给我造个句'].map(s => <span key={s} onClick={() => askSend(s)}>{s}</span>)}</div>
          </section>

          {/* tools */}
          <section className={`tile t-tools glow ${rev('reveal-d2')}`} onMouseMove={onTileMove} onMouseLeave={onTileLeave}>
            <p className="tk" style={{ color: 'var(--ink-muted)', marginBottom: 14 }}>工具 · Tools</p>
            <div className="grid">
              <Link className="mtool" href="/reading"><span className="ic" style={{ background: 'var(--teal-bg)', color: 'var(--teal-ink)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 7l10-4 10 4-10 4z" /><path d="M6 9.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.5" /></svg></span><span><span className="nm">阅读</span><br /><span className="ds">边读边收生词</span></span></Link>
              <Link className="mtool" href="/scan"><span className="ic" style={{ background: 'var(--blue-bg)', color: 'var(--blue-ink)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="3" y1="12" x2="21" y2="12" /></svg></span><span><span className="nm">扫描</span><br /><span className="ds">拍照提取生词</span></span></Link>
              <Link className="mtool" href="/chat"><span className="ic" style={{ background: 'var(--violet-bg)', color: 'var(--violet-ink)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8" /></svg></span><span><span className="nm">领航</span><br /><span className="ds">AI 答疑</span></span></Link>
              <Link className="mtool" href="/exam"><span className="ic" style={{ background: 'rgba(179,120,31,.1)', color: 'var(--gold-ink)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" /></svg></span><span><span className="nm">试炼</span><br /><span className="ds">限时测验</span></span></Link>
            </div>
          </section>

          {/* recent words strip */}
          {recommend.length > 0 && (
            <section className={`tile t-strip ${rev()}`}>
              <span className="lab">推荐单词</span>
              <div className="marquee"><div className="marquee-track" style={{ ['--mq' as string]: '34s' }}>
                {[...recommend, ...recommend].map((w, i) => (
                  <Link key={`${w.id}-${i}`} className="chip" href={`/dictionary?word=${encodeURIComponent(w.word.toLowerCase())}`}><span className="w">{w.word}</span><span className="zh">{w.zh}</span></Link>
                ))}
              </div></div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
