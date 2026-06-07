import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { learningModules } from '@/config/learning-modules'
import { cosmicModuleVisuals } from '@/config/cosmic-module-visuals'

export default async function UniverseModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module: slug } = await params

  const learningModule = learningModules.find(
    m => m.universeRoute === `/universe/${slug}` || m.id === slug,
  )

  if (!learningModule) notFound()

  const visual = cosmicModuleVisuals.find(v => v.moduleId === learningModule.id)

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '24px', fontSize: '13px' }}>
            <Link
              href="/universe"
              style={{ color: 'rgba(56,189,248,0.6)', textDecoration: 'none' }}
            >
              Learning Universe / 学习宇宙
            </Link>
            <span style={{ color: 'rgba(155,191,202,0.4)', margin: '0 8px' }}>›</span>
            <span style={{ color: '#9BBFCA' }}>{learningModule.name}</span>
          </div>

          {/* Module header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <span style={{ fontSize: '36px' }}>{learningModule.icon}</span>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(22px, 3.5vw, 36px)',
                    fontWeight: 700,
                    color: learningModule.color,
                    lineHeight: 1.2,
                  }}
                >
                  {learningModule.name}
                </h1>
                <div style={{ fontSize: '16px', color: '#9BBFCA', marginTop: '2px' }}>
                  {learningModule.nameZh}
                </div>
              </div>
            </div>

            {/* Type badge */}
            <div
              style={{
                display: 'inline-block',
                fontSize: '11px',
                letterSpacing: '0.08em',
                color: learningModule.color,
                border: `1px solid ${learningModule.color}60`,
                borderRadius: '4px',
                padding: '3px 10px',
              }}
            >
              {learningModule.type} / {learningModule.typeZh}
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(155,191,202,0.12)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: `${learningModule.color}99`,
                fontFamily: 'ui-monospace, monospace',
                marginBottom: '10px',
              }}
            >
              MODULE DESCRIPTION / 模块说明
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#ECFBFF', lineHeight: 1.7 }}>
              {learningModule.description}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA', lineHeight: 1.7 }}>
              {learningModule.descriptionZh}
            </p>
          </div>

          {/* Core abilities */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(155,191,202,0.12)',
              borderRadius: '12px',
              padding: '20px 24px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                color: `${learningModule.color}99`,
                fontFamily: 'ui-monospace, monospace',
                marginBottom: '14px',
              }}
            >
              CORE ABILITIES / 核心能力
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {learningModule.abilities.map((ability, i) => (
                <li
                  key={i}
                  style={{
                    paddingLeft: '14px',
                    borderLeft: `2px solid ${learningModule.color}50`,
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '1px' }}>{ability}</div>
                  <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{learningModule.abilitiesZh[i]}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Cosmic visual info (if available) */}
          {visual && (
            <div
              style={{
                background: 'rgba(139,92,246,0.04)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  color: 'rgba(139,92,246,0.7)',
                  fontFamily: 'ui-monospace, monospace',
                  marginBottom: '12px',
                }}
              >
                COSMIC ROLE / 宇宙角色（预留）
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    color: 'rgba(139,92,246,0.9)',
                    fontFamily: 'ui-monospace, monospace',
                    letterSpacing: '0.06em',
                  }}
                >
                  {visual.cosmicRole.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(155,191,202,0.2)',
                    color: '#9BBFCA',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  ORBIT LEVEL {visual.orbitLevel}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(155,191,202,0.6)', lineHeight: 1.6 }}>
                {visual.futureVisualDescription}
              </p>
            </div>
          )}

          {/* Coming soon panel */}
          <div
            style={{
              background: 'rgba(2,6,23,0.6)',
              border: '1px dashed rgba(139,92,246,0.35)',
              borderRadius: '12px',
              padding: '28px 24px',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🌌</div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: 'rgba(139,92,246,0.8)',
                marginBottom: '6px',
                letterSpacing: '0.04em',
              }}
            >
              Coming Soon: Cosmic Universe Focus View
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(155,191,202,0.5)' }}>
              宇宙星云聚焦视图即将接入
            </div>
            <div
              style={{
                marginTop: '16px',
                fontSize: '11px',
                color: 'rgba(155,191,202,0.3)',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.1em',
              }}
            >
              [ PHASE 3 — TouchDesigner-style particle canvas ]
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href={learningModule.route}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                background: `${learningModule.color}18`,
                border: `1px solid ${learningModule.color}70`,
                color: learningModule.color,
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textDecoration: 'none',
              }}
            >
              Enter Module / 进入模块 →
            </Link>
            <Link
              href="/universe"
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                background: 'transparent',
                border: '1px solid rgba(155,191,202,0.25)',
                color: '#9BBFCA',
                fontSize: '14px',
                letterSpacing: '0.04em',
                textDecoration: 'none',
              }}
            >
              ← Back to Universe / 返回宇宙地图
            </Link>
          </div>

        </div>
      </div>
    </AppShell>
  )
}
