import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'

const futurePlans = [
  {
    label: 'Deep Space Canvas',
    labelZh: '深空画布',
    desc: 'Full-viewport R3F canvas with GPU particle system, zero DOM overhead.',
    descZh: '全视口 R3F 画布，GPU 粒子系统，零 DOM 开销。',
    icon: '🖥',
  },
  {
    label: 'AI Core Star',
    labelZh: 'AI 核心恒星',
    desc: 'AI Navigator rendered as the gravitational center — pulsing singularity driven by daily task completion.',
    descZh: 'AI Navigator 渲染为宇宙引力中心，随每日任务完成度脉动。',
    icon: '⭐',
  },
  {
    label: 'Module Nebulas',
    labelZh: '模块星云',
    desc: 'Six learning modules as distinct nebula clusters, color-coded and size-driven by Zustand progress state.',
    descZh: '六个学习模块作为独立星云节点，颜色与大小由 Zustand 学习进度驱动。',
    icon: '🌌',
  },
  {
    label: 'Particle Orbits',
    labelZh: '粒子轨道',
    desc: 'Orbital particle streams connecting module nebulas, density driven by quiz history and review count.',
    descZh: '连接模块星云的轨道粒子流，密度由测验记录和复习数量驱动。',
    icon: '🔄',
  },
  {
    label: 'Camera Transition',
    labelZh: '摄像机推进',
    desc: 'On module click: smooth camera fly-in to focus nebula, then portal to the real feature page.',
    descZh: '点击模块后：摄像机平滑推进聚焦目标星云，再跳转到真实功能页。',
    icon: '🎥',
  },
  {
    label: 'Zustand Progress Mapping',
    labelZh: 'Zustand 进度映射',
    desc: 'savedWords → nebula density · wrongAnswers → warning pulse · streak/XP → orbit energy flow.',
    descZh: 'savedWords → 星云密度 · wrongAnswers → 警示脉冲 · streak/XP → 轨道能量流。',
    icon: '📊',
  },
]

export default function CosmicTdLabPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: 'rgba(139,92,246,0.5)',
              fontFamily: 'ui-monospace, monospace',
              marginBottom: '10px',
            }}
          >
            LEXIOCEAN / VISUAL LAB
          </div>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: 'clamp(22px, 3.5vw, 36px)',
              fontWeight: 700,
              color: '#ECFBFF',
            }}
          >
            Cosmic TD Theme Lab{' '}
            <span style={{ fontSize: 'clamp(14px, 2vw, 20px)', color: '#9BBFCA' }}>
              宇宙 TD 视觉实验室
            </span>
          </h1>

          {/* Description */}
          <p style={{ margin: '0 0 6px', fontSize: '15px', color: '#ECFBFF', lineHeight: 1.7 }}>
            This page is reserved for the future TouchDesigner-style cosmic particle prototype.
          </p>
          <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9BBFCA', lineHeight: 1.7 }}>
            这里预留给后续宇宙系 TD 粒子视觉原型。
          </p>

          {/* Coming soon panel */}
          <div
            style={{
              background: 'rgba(139,92,246,0.04)',
              border: '1px dashed rgba(139,92,246,0.4)',
              borderRadius: '16px',
              padding: '36px 32px',
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'rgba(139,92,246,0.9)',
                marginBottom: '8px',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(155,191,202,0.6)', marginBottom: '4px' }}>
              TouchDesigner-style GPU particle canvas
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'rgba(155,191,202,0.4)',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.08em',
              }}
            >
              [ PHASE 3 — R3F · GLSL · GPU Particles ]
            </div>
          </div>

          {/* Future plans */}
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: 'rgba(139,92,246,0.6)',
              fontFamily: 'ui-monospace, monospace',
              marginBottom: '16px',
            }}
          >
            FUTURE IMPLEMENTATION PLAN / 未来实现计划
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' }}>
            {futurePlans.map(plan => (
              <div
                key={plan.label}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(155,191,202,0.1)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{plan.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#ECFBFF',
                      marginBottom: '2px',
                    }}
                  >
                    {plan.label}{' '}
                    <span style={{ color: '#9BBFCA', fontWeight: 400 }}>/ {plan.labelZh}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6, marginBottom: '2px' }}>
                    {plan.desc}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', lineHeight: 1.6 }}>
                    {plan.descZh}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid rgba(155,191,202,0.1)',
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Home / 返回首页
            </Link>
            <Link
              href="/universe"
              style={{ fontSize: '13px', color: 'rgba(139,92,246,0.7)', textDecoration: 'none' }}
            >
              Go to Learning Universe / 进入学习宇宙 →
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
