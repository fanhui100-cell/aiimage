'use client'
/* DrillFlow.tsx — 仅保留 GalaxySVG（结果屏星系）+ MobileChrome（移动端顶/底栏）
   原型 flow.jsx 的 AnswerScreen/ResultScreen/MobileConfig/DEMO_Q/speak 不接入，已删。 */
import { useRouter } from 'next/navigation'
import { Ic } from './DrillShared'

// 底栏 5 tab → 真实路由（drill = 当前页，不跳）
const TAB_ROUTE: Record<string, string> = { today: '/today', dict: '/dictionary', verse: '/lexiverse', me: '/profile' }

function GalaxySVG({ lit }: { lit?: boolean }) {
  const nodes = [[60, 50], [110, 32], [160, 58], [210, 36], [258, 54], [44, 74], [150, 86], [220, 78], [276, 84], [104, 70]]
  const cx = 160, cy = 56
  return (
    <svg viewBox="0 0 300 110" style={{ width: '100%' }}>
      {nodes.map(([x, y], i) => <line key={'l' + i} x1={cx} y1={cy} x2={x} y2={y} stroke={lit ? 'rgba(79,230,206,.4)' : 'var(--line)'} strokeWidth="1" />)}
      {nodes.map(([x, y], i) => <circle key={'n' + i} cx={x} cy={y} r={2.5 + (i % 3)} fill={lit ? '#34d8c0' : 'var(--line-strong)'} style={{ opacity: lit ? 1 : .45 }} />)}
      <circle cx={cx} cy={cy} r="6" fill={lit ? 'var(--teal-ink)' : 'var(--ink-muted)'} />
      <circle cx={cx} cy={cy} r="11" fill="none" stroke={lit ? 'rgba(79,230,206,.5)' : 'var(--line)'} strokeWidth="1.4" />
    </svg>
  )
}

// ── 移动端顶栏 + 底栏 ──
function MobileChrome({ active, noTab, drillBadge = 12 }: { mode?: string; active?: string; noTab?: boolean; drillBadge?: number }) {
  const router = useRouter()
  const tabs = [['today', 'today', '今日'], ['grid', 'dict', '词库'], ['bolt', 'drill', '专练'], ['star', 'verse', '宇宙'], ['user', 'me', '我的']]
  return (
    <>
      <div className="lx-mtopbar">
        <span className="brand">词渊 <em>Lexiverse</em></span>
        <span style={{ color: 'var(--accent-ink)' }}><Ic name="user" s={20} /></span>
      </div>
      {!noTab && (
        <div className="lx-mtabbar">
          {tabs.map(([ic, k, zh]) => k === 'drill' ? (
            <button key={k} className="lx-mtab center">
              <span className="fab"><Ic name={ic} s={25} sw={2} />{drillBadge > 0 && <span className="lx-badge">{drillBadge}</span>}</span>
              <span className="tl">{zh}</span>
            </button>
          ) : (
            <button key={k} className={`lx-mtab ${active === k ? 'on' : ''}`} onClick={() => { const r = TAB_ROUTE[k]; if (r) router.push(r) }}><Ic name={ic} s={20} sw={1.8} /><span className="tl">{zh}</span></button>
          ))}
        </div>
      )}
    </>
  )
}

export { GalaxySVG, MobileChrome }
