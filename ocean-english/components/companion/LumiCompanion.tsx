'use client'

import { useEffect, useRef, useState } from 'react'
import { LumiBubble } from './LumiBubble'
import { useLexiStore } from '@/store/lexiStore'
import { useMotivationStore } from '@/store/useMotivationStore'

const ORBIT_COUNT = 4
const DAY = 86_400_000
const STREAK_MILESTONES = new Set([7, 30, 100])
const SESSION_CAP = 2          // B10-2 频控：每会话最多 2 条自动消息
const COUNT_KEY = 'lexi-lumi-auto-count'

export function LumiCompanion() {
  const [bubbleOpen, setBubbleOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [disabled, setDisabled] = useState(true)   // SSR 安全：挂载后读取设置
  const closedLoopShown = useRef(false)

  useEffect(() => {
    setDisabled(localStorage.getItem('lexi-lumi-off') === '1')
  }, [])

  // 自动消息：频控 + 写入 motivationStore 后弹泡
  function autoSay(message: string) {
    const n = Number(sessionStorage.getItem(COUNT_KEY) ?? '0')
    if (n >= SESSION_CAP) return
    sessionStorage.setItem(COUNT_KEY, String(n + 1))
    useMotivationStore.getState().setCompanionMessage(message)
    setBubbleOpen(true)
  }

  // ① 回访问候：连续 3 天未学习
  useEffect(() => {
    if (disabled) return
    const { lastStudyDate } = useLexiStore.getState().streakData
    if (!lastStudyDate) return
    const gap = Date.now() - new Date(lastStudyDate).getTime()
    if (gap >= 3 * DAY) {
      autoSay('好久不见。哪怕今天只学 3 分钟，也能让学习信号继续存在。')
    }
  }, [disabled])

  // ② streak 里程碑（7/30/100）③ 今日闭环完成
  useEffect(() => {
    if (disabled) return
    let prevStreak = useLexiStore.getState().streakData.current
    const unsub = useLexiStore.subscribe(state => {
      const cur = state.streakData.current
      if (cur !== prevStreak && STREAK_MILESTONES.has(cur)) {
        autoSay(`连续学习 ${cur} 天了——里程碑达成，继续点亮前行的路。`)
      }
      prevStreak = cur

      if (!closedLoopShown.current) {
        const today = new Date().toISOString().slice(0, 10)
        const d = state.daily
        if (d.date === today && d.quizzed >= 5 && d.learned > 0
          && !state.words.some(w => w.nextReviewAt != null && w.nextReviewAt <= Date.now())) {
          closedLoopShown.current = true
          autoSay('今日闭环完成！学习 → 练习 → 复习一气呵成。')
        }
      }
    })
    return unsub
  }, [disabled])

  if (disabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '64px',
        right: '20px',
        zIndex: 45,
      }}
    >
      {bubbleOpen && <LumiBubble onClose={() => setBubbleOpen(false)} />}

      <div
        role="button"
        aria-label="Lumi companion — click for help"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setBubbleOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setBubbleOpen(v => !v)}
        style={{ position: 'relative', cursor: 'pointer', width: '52px', height: '52px' }}
      >
        {/* Orbit particles */}
        {Array.from({ length: ORBIT_COUNT }).map((_, i) => (
          <span
            key={i}
            className={`lumi-orbit lumi-orbit-${i}`}
            style={{
              position: 'absolute',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: '#7EF9FF',
              top: '50%',
              left: '50%',
              opacity: 0.55,
            }}
          />
        ))}

        {/* Orb */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 36% 36%, #C8FFFE 0%, #7EF9FF 18%, #38BDF8 48%, #0EA5E9 72%, rgba(2,6,23,0.3) 100%)',
            boxShadow: hovered
              ? '0 0 28px rgba(56,189,248,0.95), 0 0 60px rgba(56,189,248,0.55), 0 0 100px rgba(56,189,248,0.28)'
              : '0 0 18px rgba(56,189,248,0.65), 0 0 44px rgba(56,189,248,0.3)',
            animation: 'lumiFloat 3s ease-in-out infinite',
            transition: 'box-shadow 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 0 8px rgba(255,255,255,0.85)',
            }}
          />
        </div>

        {/* Hover tooltip */}
        {hovered && !bubbleOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '58px',
              right: 0,
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: '#9BBFCA',
              background: 'rgba(2,6,23,0.88)',
              padding: '4px 9px',
              borderRadius: '5px',
              border: '1px solid rgba(56,189,248,0.2)',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}
          >
            Need help?
          </div>
        )}
      </div>
    </div>
  )
}
