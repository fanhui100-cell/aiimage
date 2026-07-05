'use client'

/* ════════════════════════════════════════════════════════════════════════
   TodayScreen 按学习方式 path 编排（界面优化12 / 任务B · P1）
   1:1 移植自 design_handoff「TodayScreen 按 path 编排.html」：页眉(brand+日期+
   path 分段+改) → 今日进度卡(环+streak) → 今日动线(按 profile.path 的 4 套活动卡
   编排，逐卡 done/active/locked + 连接线) → 完成态庆祝小结卡。
   数据接现有 store：getTodayProgress / streakData / getToday / getDue / daily /
   todayPack / profile.path / setProfile。新词·练习·复习三里程碑驱动动线解锁；
   阅读/真题等侧路卡先按里程碑近似解锁（其完成度跟踪属 P2/P3）。浅色 .theme-light .td-v2。
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { RingProgress } from '@/components/ui/motion/RingProgress'
import { RecentlyMasteredRibbon } from '@/components/screens/RecentlyMasteredRibbon'
import './today-screen.css'

type PathId = 'full' | 'words' | 'reading' | 'exam'
type CardColor = 'teal' | 'blue' | 'gold' | 'rose' | 'violet'
type IconName = 'book' | 'target' | 'doc' | 'refresh' | 'spark' | 'exam' | 'flag' | 'chart' | 'flame'
type ActCard = { key: string; t: string; en: string; s: string; c: CardColor; ic: IconName; meta?: string }
type CardStatus = 'done' | 'active' | 'locked'

const COLOR_VAR: Record<CardColor, string> = {
  teal: 'var(--teal-ink)', blue: 'var(--blue-ink)', gold: 'var(--gold-ink)',
  rose: 'var(--rose-ink)', violet: 'var(--violet-ink)',
}

// 四套编排（与设计稿一致；meta 为默认会话量，运行时对 learn/review 用真实数）
const PATHS: Record<PathId, { zh: string; cards: ActCard[] }> = {
  full: {
    zh: '全面掌握', cards: [
      { key: 'learn', t: '今日新词', en: 'New Words', s: '闪卡学习，链到词图', c: 'teal', ic: 'book', meta: '12 词' },
      { key: 'practice', t: '练习', en: 'Practice', s: '选择 + 打字，错题长红边', c: 'blue', ic: 'target', meta: '10 题' },
      { key: 'reading', t: '阅读任务', en: 'Reading', s: '带生词短文，语境里理解', c: 'violet', ic: 'doc', meta: '1 篇' },
      { key: 'review', t: '复习到期', en: 'Review SRS', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '8 词' },
      { key: 'recap', t: '今日小结', en: 'Recap', s: '闭环点亮你的词汇宇宙', c: 'teal', ic: 'spark', meta: '' },
    ],
  },
  words: {
    zh: '速记词汇', cards: [
      { key: 'learn', t: '新词速刷', en: 'Rapid Cards', s: '放大卡片，快速过词', c: 'teal', ic: 'book', meta: '20 词' },
      { key: 'quiz', t: '快速自测', en: 'Quick Check', s: '秒答巩固，连击加分', c: 'blue', ic: 'target', meta: '12 题' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '8 词' },
    ],
  },
  reading: {
    zh: '精读提升', cards: [
      { key: 'article', t: '今日精读', en: 'Deep Reading', s: '整篇文章，标注生词', c: 'violet', ic: 'doc', meta: '1 篇 · 680 词' },
      { key: 'pick', t: '文中取词', en: 'Mine Words', s: '从文章里收词学习', c: 'teal', ic: 'book', meta: '9 词' },
      { key: 'practice', t: '练习', en: 'Practice', s: '就刚学的词练一组', c: 'blue', ic: 'target', meta: '8 题' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '6 词' },
    ],
  },
  exam: {
    zh: '应试备考', cards: [
      { key: 'mock', t: '今日题型练习', en: 'Exam Drill', s: '按目标考试出题型', c: 'rose', ic: 'exam', meta: '15 题' },
      { key: 'wrong', t: '错题强化', en: 'Wrong Set', s: '昨日错题重练', c: 'rose', ic: 'flag', meta: '6 题' },
      { key: 'progress', t: '目标考试进度', en: 'Exam Progress', s: '距目标还有一段', c: 'teal', ic: 'chart', meta: '' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '5 词' },
    ],
  },
}
const PATH_KEYS: PathId[] = ['full', 'words', 'reading', 'exam']
const LEVEL_NAMES = ['', '初中', '高中', '四级', '六级', '考研', '托福', 'SAT', '满级']
// 界面优化1·阶段4：距考试天数（实时）
const daysToExam = (d: string) => { const ms = new Date(d + 'T00:00:00').getTime() - Date.now(); return Math.max(0, Math.ceil(ms / 86_400_000)) }
// 因子数字滚动计数（reduced-motion 下浏览器降级，无碍）
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0; const dur = 750, start = performance.now()
    const tick = (t: number) => { const p = Math.min(1, (t - start) / dur); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
  }, [to])
  return <>{v}{suffix}</>
}

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  book: <path d="M12 5.5C10.5 4 8 3.5 4 4v14c4-.5 6.5 0 8 1.5M12 5.5C13.5 4 16 3.5 20 4v14c-4-.5-6.5 0-8 1.5M12 5.5v14" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
  exam: <><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m9 13 2 2 4-4" /></>,
  flag: <path d="M4 21V4M4 4h13l-2 4 2 4H4" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  flame: <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .2 1 .8 1.5 1.5 1.5C11 8 10 6 12 3z" />,
}
function Icon({ name, color, size = 20 }: { name: IconName; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  )
}
function Check({ color, size = 15 }: { color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
}

export function TodayScreen() {
  const navigate = useNavigate()
  const { getToday, getTodayProgress, streakData, xp, profile } = useLexiStore()
  const setProfile = useLexiStore(s => s.setProfile)
  const words = useLexiStore(s => s.words)
  const todayPack = useLexiStore(s => s.todayPack)
  const todayActivity = useLexiStore(s => s.todayActivity)
  const markActivityDone = useLexiStore(s => s.markActivityDone)
  const dueLen = useLexiStore(s => s.getDue().length)

  useEffect(() => { void useLexiStore.getState().buildTodayPack() }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => getToday(), [words, todayPack])
  // P3③ 升档自适应（getLevelUpProgress 每次返回新对象，用 useMemo 避免选择器无限重渲染）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const levelUp = useMemo(() => useLexiStore.getState().getLevelUpProgress(), [words, profile])
  const progress = getTodayProgress()
  const studied = progress.n
  const goal = progress.goal
  const pct = progress.pct
  const streak = streakData.current

  const path: PathId = (PATH_KEYS.includes(profile.path as PathId) ? profile.path : 'full') as PathId
  const pathCfg = PATHS[path]

  // 阶段4：AI 今日编排 —— 真实学情驱动「推荐先做」+ 因子 chips
  const quizHistory = useLexiStore(s => s.quizHistory)
  const dailyGoal = profile.dailyGoal || goal
  const weakCount = words.filter(w => w.state === 'weak').length
  const examDays = (profile.path === 'exam' && profile.examDate) ? daysToExam(profile.examDate) : null
  const goalZh = LEVEL_NAMES[profile.level ?? 0] || (typeof profile.targetExam === 'string' ? profile.targetExam : '目标')
  const yAcc = (() => {
    for (const sess of quizHistory) {
      const total = sess.attempts?.length ?? 0
      if (total > 0) return Math.round(sess.attempts.filter(a => a.correct).length / total * 100)
    }
    return null
  })()
  const rec: { key: string; why: React.ReactNode } = dueLen >= 8
    ? { key: 'review', why: <>你有 <b>{dueLen} 个到期复习</b>正在堆积，今天不复习明天会多忘。<b>建议先清复习</b>，再上新词。</> }
    : weakCount >= 5
      ? { key: 'practice', why: <><b>{weakCount} 个薄弱词</b>反复出错，先用一组练习把它们顶上去。</> }
      : { key: 'learn', why: <>状态正好 —— <b>先学今天的新词</b>，再顺势练一组。</> }
  const recKey = pathCfg.cards.some(c => c.key === rec.key) ? rec.key : pathCfg.cards[0].key

  const todayStr = new Date().toISOString().slice(0, 10)
  const packTotal = todayPack.recommendedIds.length
  const step1done = today.recommended.length === 0
  const step3done = dueLen === 0
  // 侧路活动（阅读/真题/错题/考试进度）的独立完成标记（按日）
  const sideDone = new Set(todayActivity?.date === todayStr ? todayActivity.done : [])

  // 客户端日期（避免 SSR/hydration 时区不一致）
  const [dateLabel, setDateLabel] = useState('')
  useEffect(() => {
    const d = new Date()
    setDateLabel(`${d.getMonth() + 1}月${d.getDate()}日 · 周${'日一二三四五六'[d.getDay()]}`)
  }, [])

  // 单卡完成判定：核心三里程碑用 SRS 真值；侧路卡用独立活动标记
  const SIDE_KEYS = new Set(['reading', 'article', 'pick', 'mock', 'wrong', 'progress'])
  const cardDoneBase = (key: string): boolean => {
    if (SIDE_KEYS.has(key)) return sideDone.has(key)
    if (key === 'learn') return step1done
    // 练习/自测：必须真正做完一组练习（markActivityDone('practice')）才算完成，
    // 不再用全局 quizzed≥5（会被 chat/听力/写作等其它答题流程顶满 → 进了就显示已完成的 bug）
    if (key === 'practice' || key === 'quiz') return sideDone.has('practice')
    if (key === 'review') return step3done
    return false
  }
  // 路径级闭环：当前编排里所有非「小结」卡都完成
  const allDone = pathCfg.cards.filter(c => c.key !== 'recap').every(c => cardDoneBase(c.key))
  const cardDone = (key: string): boolean => (key === 'recap' ? allDone : cardDoneBase(key))

  const statuses: CardStatus[] = []
  let activeAssigned = false
  for (const card of pathCfg.cards) {
    if (!activeAssigned && cardDone(card.key)) statuses.push('done')
    else if (!activeAssigned) { statuses.push('active'); activeAssigned = true }
    else statuses.push('locked')
  }

  const examTag = typeof profile.targetExam === 'string' ? profile.targetExam : ''
  const go = (key: string) => {
    switch (key) {
      case 'learn': return navigate('learn', { flow: true })
      case 'practice': case 'quiz': return navigate('quiz', { flow: true })
      case 'reading': case 'article': case 'pick': return navigate('reading')
      case 'review': return navigate('review', { flow: true })
      case 'mock': return navigate('quiz', examTag ? { mode: 'exam-practice', exam: examTag } : { mode: 'exam-practice' })
      case 'wrong': return navigate('quiz', { mode: 'wrong-answer-booster' })
      case 'progress': markActivityDone('progress'); return navigate('exam')
      case 'recap': return navigate('universe', { celebrate: 1 })
      default: return navigate('today')
    }
  }
  // 阶段4：动线卡数字随每日量联动
  const metaFor = (card: ActCard): string => {
    if (card.key === 'learn') return `${dailyGoal} 词`
    if (card.key === 'practice' || card.key === 'quiz') return `${Math.max(6, Math.round(dailyGoal * 0.8))} 题`
    if (card.key === 'pick') return `${Math.max(5, Math.round(dailyGoal * 0.5))} 词`
    if (card.key === 'review') return `${dueLen} 词`
    return card.meta ?? ''
  }

  const switchPath = (p: PathId) => setProfile({ path: p })

  return (
    <div className="theme-light td-v2">
      <div className="td-app">
        {/* 页眉 */}
        <div className="thead">
          <div className="thead-row">
            <span className="brand">今日 <em>Today</em></span>
            <span className="date">{dateLabel || ' '}</span>
          </div>
          <div className="pathbar">
            <div className="seg">
              {PATH_KEYS.map(k => (
                <button key={k} className={k === path ? 'on' : ''} onClick={() => switchPath(k)}>{PATHS[k].zh}</button>
              ))}
            </div>
            <button className="switch" title="去「我的」重新定级" onClick={() => navigate('me')}>
              改<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>

        <div className="tmain">
          <div className="fade-up">
            {/* 完成态庆祝小结 */}
            {allDone && (
              <div className="recap">
                <div className="spark"><Icon name="spark" color="var(--teal-ink)" size={26} /></div>
                <h3>今日闭环已完成</h3>
                <p>{pathCfg.zh} 路线的每张活动卡都走完了，连续天 +1。</p>
                <div className="stats">
                  <div className="st"><b>{pathCfg.cards.length}</b><span>活动卡</span></div>
                  <div className="st"><b>{xp}</b><span>XP</span></div>
                  <div className="st"><b>{streak}</b><span>连续天</span></div>
                </div>
                <button className="cta press" onClick={() => navigate('universe', { celebrate: 1 })}>查看今日小结 →</button>
              </div>
            )}

            {/* 阶段4：AI 今日编排卡 */}
            {!allDone && (
              <div className="ai-plan">
                <div className="ahead"><span className="ic"><Icon name="spark" color="#fff" size={17} /></span><b>AI 今日编排</b><span className="tag">Algorithm</span></div>
                <div className="reason">{rec.why}{examDays != null && <> 距考试仅 <b>{examDays}</b> 天，今日量已按倒计时定在 <b>{dailyGoal}</b> 个/天。</>}</div>
                <div className="factors">
                  {examDays != null && <span className="factor"><span className="fd" style={{ background: 'var(--gold-ink)' }} />距{goalZh}考试 <b><CountUp to={examDays} /></b> 天</span>}
                  <span className="factor"><span className="fd" style={{ background: '#d2792f' }} />到期复习 <b><CountUp to={dueLen} /></b></span>
                  <span className="factor"><span className="fd" style={{ background: 'var(--rose)' }} />薄弱 <b><CountUp to={weakCount} /></b></span>
                  {yAcc != null && <span className="factor"><span className="fd" style={{ background: 'var(--blue-ink)' }} />昨日正确率 <b><CountUp to={yAcc} suffix="%" /></b></span>}
                </div>
              </div>
            )}

            {/* 今日进度卡 */}
            <div className="prog">
              <div className="ring">
                {/* 界面优化2·P6：今日进度环改用 RingProgress（米白·入场填充）；中心保留 学习数/目标 */}
                <RingProgress value={pct} size={62} stroke={5}>
                  <span className="lab"><b>{studied}</b><span>/{goal}</span></span>
                </RingProgress>
              </div>
              <div className="mid">
                <div className="ttl">{allDone ? '今日目标已达成' : '继续今日学习'}</div>
                <div className="sub">学习方式 · <b style={{ color: 'var(--teal-ink)' }}>{pathCfg.zh}</b> 编排 · <Link href="/goals" style={{ color: 'var(--teal-ink)', fontWeight: 600, textDecoration: 'none' }}>目标详情 →</Link></div>
              </div>
              <div className="streak"><b><Icon name="flame" color="var(--gold-ink)" size={14} /> {streak}</b><span>连续天</span></div>
            </div>

            {/* P3③ 升档自适应：本档跨维掌握率达标 → 提示升下一档 */}
            {levelUp.ready && levelUp.level != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '13px 16px', borderRadius: 16, background: 'linear-gradient(150deg, var(--gold-bg), var(--card))', border: '1px solid color-mix(in srgb, var(--gold-ink) 30%, transparent)' }}>
                <Icon name="spark" color="var(--gold-ink)" size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>{LEVEL_NAMES[levelUp.level]}已跨维掌握 {levelUp.rate}%</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>认 · 拼 · 听多维达标，可升入 <b style={{ color: 'var(--gold-ink)' }}>{LEVEL_NAMES[levelUp.level + 1]}</b></div>
                </div>
                <button className="press" onClick={() => { const next = levelUp.level! + 1; setProfile({ level: next, band: next }); void useLexiStore.getState().buildTodayPack(true) }}
                  style={{ flexShrink: 0, padding: '8px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--gold-ink)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                  升档 →
                </button>
              </div>
            )}

            {/* 今日包生成失败兜底（仅真失败时出现；闭环完成不再提示） */}
            {todayPack.date !== '' && packTotal === 0 && !allDone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '11px 14px', marginTop: 10 }}>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-sub)' }}>新词推荐暂时不可用，先完成复习部分</span>
                <button onClick={() => void useLexiStore.getState().buildTodayPack(true)} className="press"
                  style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
                  重试
                </button>
              </div>
            )}

            {/* 今日动线 */}
            <div className="flow-label">
              <span className="l">今日动线</span>
              <span className="pill">{pathCfg.zh}</span>
              <span className="line" />
            </div>
            <div className="acts">
              {pathCfg.cards.map((card, i) => {
                const status = statuses[i]
                const isEmptyRev = card.key === 'review' && dueLen === 0 && !allDone
                return (
                  <div key={card.key}>
                    <ActivityCard card={card} index={i} status={status} emptyRev={isEmptyRev} meta={metaFor(card)} onGo={() => go(card.key)} recommended={card.key === recKey && status === 'active'} />
                    {i < pathCfg.cards.length - 1 && <div className={`conn ${(status === 'done') ? 'done' : ''}`} />}
                  </div>
                )
              })}
            </div>

            {/* 界面优化2·P7：最近掌握词跑马灯（米白，<6 词自动不显示） */}
            <RecentlyMasteredRibbon />
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityCard({ card, index, status, emptyRev, meta, onGo, recommended }: {
  card: ActCard; index: number; status: CardStatus; emptyRev: boolean; meta: string; onGo: () => void; recommended?: boolean
}) {
  const color = COLOR_VAR[card.c]

  if (emptyRev) {
    return (
      <div className="act empty-rev">
        <div className="circ" style={{ background: 'var(--teal-bg)' }}><Icon name="refresh" color="var(--teal-ink)" /></div>
        <div className="body">
          <div className="t">复习到期 <span className="en">{card.en}</span></div>
          <div className="s">今日到期词已清零，明天再见 ✦</div>
        </div>
        <div className="right"><div className="donetag"><Check color="var(--teal-ink)" /> 已清零</div></div>
      </div>
    )
  }

  const circStyle: React.CSSProperties = status === 'done'
    ? { background: color }
    : status === 'locked'
      ? { background: 'var(--line)' }
      : { background: `color-mix(in srgb, ${color} 12%, transparent)`, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 14%, transparent)` }

  return (
    <div className={`act ${status} ${status === 'active' ? 'card-hover' : ''}`} style={status === 'active' ? { borderColor: color } : undefined}>
      <div className="circ" style={circStyle}>
        {status === 'done'
          ? <Check color="#fff" size={18} />
          : <><Icon name={card.ic} color={status === 'locked' ? 'var(--ink-muted)' : color} /><span className="num">{index + 1}</span></>}
      </div>
      <div className="body">
        <div className="t">{card.t} <span className="en">{card.en}</span>{recommended && <span className="rec">推荐先做</span>}</div>
        <div className="s">{card.s}</div>
      </div>
      <div className="right">
        {meta && <div className="meta">{meta}</div>}
        {status === 'done' && <div className="donetag"><Check color={color} /> 已完成</div>}
        {status === 'active' && (
          <button className="go press" style={{ ['--c']: color } as React.CSSProperties} onClick={onGo}>去完成 →</button>
        )}
      </div>
    </div>
  )
}
