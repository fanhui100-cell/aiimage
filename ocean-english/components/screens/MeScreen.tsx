'use client'
// MeScreen — 「我的」页（B9：数据中心重组）
// ① 账户卡 ② 数据区（streak/XP/热力图/复习预测/掌握度）
// ③ 目标与定级（重新定级 + 每日目标调整）④ 工具区 ⑤ 设置

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META } from '@/lib/state-meta'
import { useNavigate } from '@/hooks/useNavigate'
import { TOOL_NAV } from '@/lib/product-flow/nav'
import { levelDef } from '@/lib/levels'
import { StudyHeatmap } from '@/components/profile/StudyHeatmap'
import { NumberRoll } from '@/components/ui/NumberRoll'
import { ReviewForecast } from '@/components/profile/ReviewForecast'
import { AccentSelector } from '@/components/pronunciation/AccentSelector'
import { readAccentPreference, writeAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

const GOAL_OPTS = [8, 12, 16, 20]

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
  const { streakData, xp, masteredPct, counts, profile, bandCefr, setProfile } = useLexiStore()
  const streak = streakData.current

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

        {/* ⑤ 设置 */}
        <SectionTitle zh="设置" en="Settings" />
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 14, color: 'var(--ink)' }}>发音口音</span>
            <AccentSelector value={accent} onChange={changeAccent} />
          </div>
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
      </div>
    </div>
  )
}
