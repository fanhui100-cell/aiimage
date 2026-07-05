'use client'
/* ============================================================================
   RemindersScreen.tsx — D19 提醒设置 Reminders
   每日学习提醒（开关+时间+重复日）/ 复习到期推送 / 小组打卡提醒 / 夜间免打扰。
   每日提醒沿用 ReminderSetting 的 'lexi-reminder-v1' key（checkReminderOnOpen 消费）；
   其余偏好存 'lexi-reminders-ext'。开启需 Notification 授权；后台定时推送暂不支持（如实说明）。
   ============================================================================ */

import { useEffect, useState, type ReactNode } from 'react'
import './screen-kit.css'
import './reminders.css'

const DAILY_KEY = 'lexi-reminder-v1'
const EXT_KEY = 'lexi-reminders-ext'
const WD = ['一', '二', '三', '四', '五', '六', '日']

interface Daily { enabled: boolean; time: string; days: number[] }
interface Ext { review: boolean; group: boolean; dnd: boolean; dndTime: string }

function loadDaily(): Daily {
  try { return { enabled: false, time: '20:00', days: [1, 1, 1, 1, 1, 1, 1], ...JSON.parse(localStorage.getItem(DAILY_KEY) ?? '{}') } }
  catch { return { enabled: false, time: '20:00', days: [1, 1, 1, 1, 1, 1, 1] } }
}
function loadExt(): Ext {
  try { return { review: true, group: false, dnd: false, dndTime: '23:00', ...JSON.parse(localStorage.getItem(EXT_KEY) ?? '{}') } }
  catch { return { review: true, group: false, dnd: false, dndTime: '23:00' } }
}

const I: Record<string, ReactNode> = {
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  refresh: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  group: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return <button className={`st-toggle${on ? ' on' : ''}`} onClick={onClick} disabled={disabled} aria-pressed={on} style={disabled ? { opacity: .5, cursor: 'default' } : undefined}><i /></button>
}

export function RemindersScreen() {
  const [daily, setDaily] = useState<Daily>({ enabled: false, time: '20:00', days: [1, 1, 1, 1, 1, 1, 1] })
  const [ext, setExt] = useState<Ext>({ review: true, group: false, dnd: false, dndTime: '23:00' })
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    setDaily(loadDaily()); setExt(loadExt())
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  }, [])

  const saveDaily = (n: Daily) => { setDaily(n); localStorage.setItem(DAILY_KEY, JSON.stringify(n)) }
  const saveExt = (n: Ext) => { setExt(n); localStorage.setItem(EXT_KEY, JSON.stringify(n)) }

  async function ensurePerm(): Promise<boolean> {
    if (perm === 'unsupported') return false
    if (Notification.permission === 'granted') return true
    const p = await Notification.requestPermission(); setPerm(p)
    return p === 'granted'
  }
  async function toggleDaily() {
    if (!daily.enabled) { if (!(await ensurePerm())) return; saveDaily({ ...daily, enabled: true }) }
    else saveDaily({ ...daily, enabled: false })
  }
  async function toggleExt(key: 'review' | 'group' | 'dnd') {
    if (!ext[key] && key !== 'dnd') { if (!(await ensurePerm())) return }
    saveExt({ ...ext, [key]: !ext[key] })
  }
  function toggleDay(i: number) {
    const days = daily.days.slice(); days[i] = days[i] ? 0 : 1; saveDaily({ ...daily, days })
  }

  return (
    <div className="scr theme-light">
      <div className="wrap" style={{ maxWidth: 620 }}>
        <div className="eyebrow">提醒 · Reminders</div>
        <h1 className="h1">在对的时间提醒你</h1>
        <p className="sub">恰到好处的提醒，帮你把学习变成习惯 —— 不打扰，但不让你忘。</p>

        {perm === 'unsupported' && <div className="st-note warn" style={{ padding: '8px 0' }}>当前浏览器不支持通知，无法启用提醒。</div>}
        {perm === 'denied' && <div className="st-note warn" style={{ padding: '8px 0' }}>通知权限被拒绝 — 在浏览器站点设置中允许通知后重试。</div>}

        {/* 每日学习提醒 */}
        <div className="st-card">
          <div className="st-card-h">每日学习提醒</div>
          <div className="st-row">
            <span className="st-ic" style={{ background: 'var(--teal-bg)', color: 'var(--teal-ink)' }}>{I.bell}</span>
            <span className="st-main"><span className="st-nm">每日提醒</span><span className="st-ds">到点提醒你来学习</span></span>
            <Toggle on={daily.enabled} onClick={toggleDaily} disabled={perm === 'unsupported'} />
          </div>
          {daily.enabled && (
            <>
              <div className="st-row">
                <span className="st-ic" style={{ background: 'var(--paper-2)' }}>⏰</span>
                <span className="st-main"><span className="st-nm">提醒时间</span><span className="st-ds">每天这个点提醒</span></span>
                <input type="time" className="st-time" value={daily.time} onChange={e => saveDaily({ ...daily, time: e.target.value })} />
              </div>
              <div className="st-row" style={{ alignItems: 'flex-start' }}>
                <span className="st-ic" style={{ background: 'var(--paper-2)' }}>📅</span>
                <span className="st-main">
                  <span className="st-nm" style={{ marginBottom: 8, display: 'block' }}>重复</span>
                  <div className="st-week">
                    {WD.map((d, i) => <button key={i} className={`st-wd${daily.days[i] ? ' on' : ''}`} onClick={() => toggleDay(i)}>{d}</button>)}
                  </div>
                </span>
              </div>
            </>
          )}
          {daily.enabled && perm === 'granted' && <div className="st-note">到点后打开任意页面即提醒（含当日到期词数）；后台定时推送暂不支持。</div>}
        </div>

        {/* 推送通知 */}
        <div className="st-card">
          <div className="st-card-h">推送通知</div>
          <div className="st-row">
            <span className="st-ic" style={{ background: 'var(--gold-bg)', color: 'var(--gold-ink)' }}>{I.refresh}</span>
            <span className="st-main"><span className="st-nm">复习到期提醒</span><span className="st-ds">有词到期该复习时推送</span></span>
            <Toggle on={ext.review} onClick={() => toggleExt('review')} disabled={perm === 'unsupported'} />
          </div>
          <div className="st-row">
            <span className="st-ic" style={{ background: 'var(--blue-bg)', color: 'var(--blue-ink)' }}>{I.group}</span>
            <span className="st-main"><span className="st-nm">小组打卡提醒</span><span className="st-ds">组员都打卡了、就差你时提醒</span></span>
            <Toggle on={ext.group} onClick={() => toggleExt('group')} disabled={perm === 'unsupported'} />
          </div>
        </div>

        {/* 免打扰 */}
        <div className="st-card">
          <div className="st-card-h">免打扰</div>
          <div className="st-row">
            <span className="st-ic" style={{ background: 'var(--violet-bg)', color: 'var(--violet-ink)' }}>{I.moon}</span>
            <span className="st-main"><span className="st-nm">夜间免打扰</span><span className="st-ds">这之后不再推送，到次日 8:00</span></span>
            {ext.dnd && <input type="time" className="st-time" value={ext.dndTime} onChange={e => saveExt({ ...ext, dndTime: e.target.value })} style={{ marginRight: 10 }} />}
            <Toggle on={ext.dnd} onClick={() => toggleExt('dnd')} />
          </div>
        </div>
      </div>
    </div>
  )
}
