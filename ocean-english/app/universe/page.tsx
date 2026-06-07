import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { learningModules } from '@/config/learning-modules'

export default function UniversePage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.2em',
                color: 'rgba(56,189,248,0.5)',
                fontFamily: 'ui-monospace, monospace',
                marginBottom: '10px',
              }}
            >
              LEXIOCEAN / LEARNING UNIVERSE
            </div>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 700,
                color: '#ECFBFF',
              }}
            >
              Learning Universe{' '}
              <span style={{ fontSize: 'clamp(16px, 2vw, 22px)', color: '#9BBFCA' }}>
                学习宇宙
              </span>
            </h1>
          </div>

          {/* Description */}
          <p style={{ margin: '0 0 6px', fontSize: '15px', color: '#ECFBFF', lineHeight: 1.7 }}>
            This space will visualize your learning modules and progress as a cosmic map.
          </p>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: '14px',
              color: '#9BBFCA',
              lineHeight: 1.7,
            }}
          >
            这里未来会把学习模块和学习进度可视化成宇宙星图。
          </p>

          {/* Coming soon badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              letterSpacing: '0.12em',
              color: 'rgba(139,92,246,0.7)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '4px',
              padding: '4px 12px',
              marginBottom: '40px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(139,92,246,0.7)', display: 'inline-block' }} />
            COSMIC VISUALIZATION — COMING IN PHASE 3 / 宇宙视觉化即将在 Phase 3 接入
          </div>

          {/* Module grid */}
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '0.1em',
              color: 'rgba(56,189,248,0.5)',
              fontFamily: 'ui-monospace, monospace',
              marginBottom: '16px',
            }}
          >
            LEARNING MODULES / 学习模块 — {learningModules.length} nodes
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {learningModules.map(module => (
              <div
                key={module.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${module.color}30`,
                  borderRadius: '14px',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>{module.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: module.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {module.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{module.nameZh}</div>
                  </div>
                </div>

                {/* Type badge */}
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: module.color,
                    border: `1px solid ${module.color}50`,
                    borderRadius: '4px',
                    padding: '2px 8px',
                    width: 'fit-content',
                  }}
                >
                  {module.type} / {module.typeZh}
                </div>

                {/* Description */}
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#9BBFCA',
                    lineHeight: 1.6,
                    flexGrow: 1,
                  }}
                >
                  {module.descriptionZh}
                </p>

                {/* CTA */}
                <Link
                  href={module.universeRoute ?? `/universe/${module.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: `${module.color}12`,
                    border: `1px solid ${module.color}50`,
                    color: module.color,
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  Enter Universe / 进入宇宙 →
                </Link>
              </div>
            ))}
          </div>

          {/* Footer links */}
          <div
            style={{
              marginTop: '48px',
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
              href="/visual-lab/cosmic-td"
              style={{ fontSize: '13px', color: 'rgba(139,92,246,0.7)', textDecoration: 'none' }}
            >
              Visual Lab / 视觉实验室 →
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
