'use client'
// MeScreen — 「我的」页（B9：数据中心重组）
// ① 账户卡 ② 数据区（streak/XP/热力图/复习预测/掌握度）
// ③ 目标与定级（重新定级 + 每日目标调整）④ 工具区 ⑤ 设置

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META } from '@/lib/state-meta'
import { useNavigate } from '@/hooks/useNavigate'
import { TOOL_NAV, MORE_NAV } from '@/lib/product-flow/nav'
import { useCommandPalette } from '@/components/ui/motion/CommandPalette'
import { levelDef } from '@/lib/levels'
import { WeeklyReportCard } from '@/components/me/WeeklyReportCard'
import { ReminderSetting } from '@/components/me/ReminderSetting'
import { StudyHeatmap } from '@/components/profile/StudyHeatmap'
import { NumberRoll } from '@/components/ui/NumberRoll'
import { ReviewForecast } from '@/components/profile/ReviewForecast'
import { AccentSelector } from '@/components/pronunciation/AccentSelector'
import { readAccentPreference, writeAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'
import { ReportScreen } from '@/components/screens/ReportScreen'

const GOAL_OPTS = [8, 12, 16, 20]
type MeTab = 'overview' | 'data' | 'settings'

function SectionTitle({ zh, en }: { zh: string; en: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 12px' }}>
      <span style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 15.5, color: 'var(--ink)' }}>{zh}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{en}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    </div>
  )
}

export function MeScreen() {
  const navigate = useNavigate()
  const cmd = useCommandPalette()
  const { streakData, xp, masteredPct, counts, profile, bandCefr, setProfile } = useLexiStore()
  const streak = streakData.current
  // 界面优化2·导航合并：概览 / 数据(原报告) / 设置；支持 ?tab= 深链（/report 308→/profile?tab=data）
  const sp = useSearchParams()
  const initialTab: MeTab = (['overview', 'data', 'settings'] as const).includes(sp.get('tab') as MeTab) ? (sp.get('tab') as MeTab) : 'overview'
  const [tab, setTab] = useState<MeTab>(initialTab)

  const wordCounts = counts()
  const pct = masteredPct()
  const cefr = bandCefr(profile.band)

  // ① 账户：真实 Supabase 用户
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  // ⑤ 设置：发音口音 + Lumi 开关
  const [accent, setAccent] = useState<Accent>('auto')
  const [lumiOff, setLumiOff] = useState(false)
  useEffect(() => {
    setAccent(readAccentPreference())
    setLumiOff(localStorage.getItem('lexi-lumi-off') === '1')
  }, [])
  function changeAccent(a: Accent) {
    setAccent(a)
    writeAccentPreference(a)
  }
  function toggleLumi() {
    setLumiOff(v => {
      const next = !v
      localStorage.setItem('lexi-lumi-off', next ? '1' : '0')
      return next
    })
  }
  function clearData() {
    if (!window.confirm('确定清除本机学习数据？云端数据不受影响。')) return
    localStorage.removeItem('lexi-store-v1')
    localStorage.removeItem('lexiocean-learning')
    window.location.reload()
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* ① 账户卡 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #3b5bd9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {(email ?? 'L')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {email ? email.split('@')[0] : '词渊学员'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 99, background: 'var(--teal-bg)', color: 'var(--teal-ink)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cefr}</span>
              {profile.targetExam && (
                <span style={{ fontSize: 12, padding: '2px 9px', borderRadius: 99, background: 'var(--card-2)', color: 'var(--ink-sub)', fontWeight: 600 }}>{profile.targetExam}</span>
              )}
              <span style={{ fontSize: 11, color: email ? 'var(--teal-ink)' : 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                {email ? '☁ 云同步已开启' : '本机模式'}
              </span>
            </div>
          </div>
          {!email && (
            <Link href="/auth/login" style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 999, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', textDecoration: 'none', fontSize: 13, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
              登录同步
            </Link>
          )}
        </div>

        {/* tab 组（界面优化2·导航合并）：概览 / 数据〔原报告〕/ 设置 */}
        <div style={{ display: 'flex', gap: 6, padding: 4, margin: '18px 0 4px', borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)', maxWidth: 400 }}>
          {([['overview', '概览'], ['data', '数据'], ['settings', '设置']] as [MeTab, string][]).map(([k, zh]) => {
            const on = tab === k
            return (
              <button key={k} onClick={() => setTab(k)} className="btn-press"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--card)' : 'transparent', boxShadow: on ? 'var(--card-shadow-sm)' : 'none', fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-sans)', color: on ? 'var(--teal-ink)' : 'var(--ink-muted)' }}>
                {zh}{k === 'data' && <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--gold-ink)', background: 'var(--gold-bg)', border: '1px solid rgba(179,120,31,.3)', padding: '0 6px', borderRadius: 999 }}>报告</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (<>
        {/* ② 数据区 */}
        <SectionTitle zh="数据" en="Data" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          {[
            { label: '连续打卡', val: streak, icon: '🔥', color: '#d2792f' },
            { label: '总经验值', val: xp, icon: '⚡', color: '#3b5bd9' },
            { label: '已掌握', val: wordCounts.mastered ?? 0, icon: '🏆', color: '#0e8c7a' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 14px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'var(--font-news)', lineHeight: 1.1, marginTop: 6 }}><NumberRoll value={s.val} /></div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
          {/* D11：成就墙入口 */}
          <Link href="/achievements" className="btn-press" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'radial-gradient(120% 130% at 0% 0%, rgba(179,120,31,.1), transparent 55%), var(--card)', border: '1px solid rgba(179,120,31,.22)', borderRadius: 16, padding: '16px 18px', textDecoration: 'none' }}>
            <span style={{ fontSize: 26 }}>🏅</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-serif-zh)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>成就墙</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-sub)' }}>里程碑勋章 · 连续 / 词汇 / 技能</span>
            </span>
            <span style={{ color: 'var(--gold-ink)', fontFamily: 'var(--font-mono)', fontSize: 18 }}>›</span>
          </Link>
          {/* D14：战绩分享卡入口 */}
          <Link href="/share" className="btn-press" style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', textDecoration: 'none' }}>
            <span style={{ fontSize: 26 }}>📤</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-serif-zh)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>战绩分享卡</span>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-sub)' }}>今日 / 词汇量 / 本周 · 一键生成竖图</span>
            </span>
            <span style={{ color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)', fontSize: 18 }}>›</span>
          </Link>
          {/* F6-B3：本周报告（上周聚合，周内无活动不渲染） */}
          <WeeklyReportCard />
          <StudyHeatmap />
          <ReviewForecast />
          {/* 掌握度 */}
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>词汇掌握率</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--teal-ink)', fontFamily: 'var(--font-news)' }}><NumberRoll value={Math.round(pct)} />%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--teal), #34d8c0)', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {(['learning', 'review', 'weak', 'mastered'] as const).map(s => (
                <Link key={s} href={`/dictionary?state=${s}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: STATE_META[s].light }}>{wordCounts[s] ?? 0}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink-muted)' }}>{STATE_META[s].zh}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ③ 目标与定级 */}
        <SectionTitle zh="目标与定级" en="Goal & Level" />
        <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-sub)' }}>当前水平</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>
                {profile.level != null
                  ? `${levelDef(profile.level).zh} · L${profile.level} · ${cefr}`
                  : `Band ${profile.band} · ${cefr}`}
              </div>
            </div>
            <button onClick={() => navigate('onboarding')} className="btn-press"
              style={{ padding: '9px 16px', borderRadius: 999, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
              重新定级
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginBottom: 8 }}>每日目标</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {GOAL_OPTS.map(g => (
              <button key={g} onClick={() => setProfile({ dailyGoal: g })} className="btn-press"
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                  border: `1.5px solid ${profile.dailyGoal === g ? 'var(--teal-ink)' : 'var(--line)'}`,
                  background: profile.dailyGoal === g ? 'var(--teal-bg)' : 'var(--card-2)',
                  color: profile.dailyGoal === g ? 'var(--teal-ink)' : 'var(--ink-sub)',
                  fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)',
                }}>
                {g} 词
              </button>
            ))}
          </div>
        </div>

        {/* ④ 工具区 */}
        <SectionTitle zh="工具" en="Tools" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {TOOL_NAV.map(t => (
            <Link key={t.key} href={t.href} className="btn-press"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '13px 8px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--line)', textDecoration: 'none', fontSize: 13, fontWeight: 600, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
              {t.zh}
            </Link>
          ))}
        </div>

        {/* ④' 全部功能（方案 A：复习/试炼/发音/口语/听写/造句/词根/词图/报告/排行/小组/知识库 收纳于此，保持可达） */}
        <SectionTitle zh="全部功能" en="All Tools" />
        {/* 界面优化2·P1：主入口改为「⌘K 命令面板」；下方宫格保留做可达性/无 JS 降级 */}
        <button type="button" onClick={cmd.open} className="btn-press"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', marginBottom: 10, padding: '13px 16px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--line-strong)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>命令面板 · 一键跳转任意功能</span>
          </span>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-sub)', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 6, padding: '2px 7px' }}>⌘K</kbd>
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
          {MORE_NAV.map(t => (
            <Link key={t.key} href={t.href} className="btn-press"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '13px 8px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--line)', textDecoration: 'none', color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t.zh}</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{t.en}</span>
            </Link>
          ))}
        </div>

        </>)}

        {/* 数据 tab = 未改动的 ReportScreen（原「报告」并入此处） */}
        {tab === 'data' && (
          <div style={{ marginTop: 10 }}>
            <div style={{ padding: '12px 16px', marginBottom: 4, display: 'flex', gap: 10, alignItems: 'center', background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 14 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--gold-ink)', background: 'var(--gold-bg)', border: '1px solid rgba(179,120,31,.3)', padding: '1px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>原「报告」</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>独立入口退役，作为「我的 → 数据」一处权威分析中心。</span>
            </div>
            <ReportScreen />
          </div>
        )}

        {tab === 'settings' && (<>
        {/* ⑤ 设置 */}
        <SectionTitle zh="设置" en="Settings" />
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>发音口音</span>
            <AccentSelector value={accent} onChange={changeAccent} />
          </div>
          {/* F6-B2：每日学习提醒 */}
          <ReminderSetting />
          {/* D19：完整提醒设置入口 */}
          <Link href="/reminders" className="btn-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>更多提醒设置</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>复习推送 · 小组打卡 · 重复日 · 免打扰 ›</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>学习伙伴 Lumi</span>
            <button onClick={toggleLumi} className="btn-press"
              style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${lumiOff ? 'var(--line)' : 'var(--teal-ink)'}`, background: lumiOff ? 'var(--card-2)' : 'var(--teal-bg)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: lumiOff ? 'var(--ink-muted)' : 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
              {lumiOff ? '已关闭' : '已开启'}
            </button>
          </div>
          <button onClick={clearData} style={{ display: 'block', width: '100%', padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#d4477e', textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
            清除本机学习数据
          </button>
        </div>
        </>)}
      </div>
    </div>
  )
}
