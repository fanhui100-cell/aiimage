'use client'
/* ============================================================================
   ReminderSetting — F6-B2 每日学习提醒
   Notification API：开关 + 时间选择（localStorage）；页面打开时检查
   （过提醒时间 && 今天未学 && 有到期词 → 通知「你有 N 个词今天到期」，
   每天最多一次）。不支持/拒绝 → 降级说明。PWA 后台推送记 BACKLOG。
   ============================================================================ */

import { useEffect, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'

const KEY = 'lexi-reminder-v1'

interface ReminderConf { enabled: boolean; time: string }

function loadConf(): ReminderConf {
  try { return { enabled: false, time: '20:00', ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return { enabled: false, time: '20:00' } }
}

/** 页面打开时的提醒检查（AppShell 调一次） */
export function checkReminderOnOpen() {
  try {
    const conf = loadConf()
    if (!conf.enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(KEY + ':fired') === today) return
    const [h, m] = conf.time.split(':').map(Number)
    const target = new Date(); target.setHours(h, m, 0, 0)
    if (Date.now() < target.getTime()) return
    const st = useLexiStore.getState()
    const todayActive = st.daily.date === today && (st.daily.learned + st.daily.quizzed + st.daily.reviewed) > 0
    if (todayActive) return
    const due = st.words.filter(w => w.nextReviewAt != null && w.nextReviewAt <= Date.now()).length
    if (!due) return
    new Notification('词渊 Lexiverse', { body: `你有 ${due} 个词今天到期 — 5 分钟收个尾？`, tag: 'lexi-daily' })
    localStorage.setItem(KEY + ':fired', today)
  } catch { /* noop */ }
}

export function ReminderSetting() {
  const [conf, setConf] = useState<ReminderConf>({ enabled: false, time: '20:00' })
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    setConf(loadConf())
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  }, [])

  const save = (next: ReminderConf) => {
    setConf(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  async function toggle() {
    if (!conf.enabled) {
      if (perm === 'unsupported') return
      if (Notification.permission !== 'granted') {
        const p = await Notification.requestPermission()
        setPerm(p)
        if (p !== 'granted') return
      }
      save({ ...conf, enabled: true })
    } else {
      save({ ...conf, enabled: false })
    }
  }

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, color: 'var(--ink)' }}>每日提醒</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {conf.enabled && (
            <input type="time" value={conf.time} onChange={e => save({ ...conf, time: e.target.value })}
              style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card-2)', color: 'var(--ink)', fontSize: 12.5, fontFamily: 'var(--font-mono)' }} />
          )}
          <button onClick={toggle} className="btn-press" disabled={perm === 'unsupported'}
            style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${conf.enabled ? 'var(--teal-ink)' : 'var(--line)'}`, background: conf.enabled ? 'var(--teal-bg)' : 'var(--card-2)', cursor: perm === 'unsupported' ? 'default' : 'pointer', fontSize: 12.5, fontWeight: 700, color: conf.enabled ? 'var(--teal-ink)' : 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>
            {conf.enabled ? '已开启' : '已关闭'}
          </button>
        </div>
      </div>
      {perm === 'unsupported' && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 6 }}>当前浏览器不支持通知，无法启用提醒。</div>
      )}
      {perm === 'denied' && (
        <div style={{ fontSize: 11.5, color: 'var(--gold-ink)', marginTop: 6 }}>通知权限被拒绝 — 在浏览器站点设置中允许通知后重试。</div>
      )}
      {conf.enabled && perm === 'granted' && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 6 }}>到点后打开任意页面即提醒（含当日到期词数）；后台定时推送暂不支持。</div>
      )}
    </div>
  )
}
