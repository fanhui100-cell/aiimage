'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'

const EXPLORE_MODES = [
  {
    href: '/lexigraph',
    labelZh: '词汇星图',
    label: 'LexiGraph',
    descZh: '词根、搭配与近反义词的交互关系图谱',
    desc: 'Interactive word relationship graph — roots, collocations, synonyms.',
    accent: 'var(--teal-ink)',
    accentBg: 'var(--teal-bg)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <circle cx="4"  cy="6"  r="2" /><circle cx="20" cy="6"  r="2" />
        <circle cx="4"  cy="18" r="2" /><circle cx="20" cy="18" r="2" />
        <line x1="12" y1="9"  x2="4"  y2="8"  />
        <line x1="12" y1="9"  x2="20" y2="8"  />
        <line x1="12" y1="15" x2="4"  y2="16" />
        <line x1="12" y1="15" x2="20" y2="16" />
      </svg>
    ),
  },
  {
    href: '/lexiverse',
    labelZh: '词汇宇宙',
    label: 'Lexiverse',
    descZh: '以星球和星系可视化你掌握的词汇版图',
    desc: 'Your vocabulary as a universe of constellations, galaxies, and planets.',
    accent: '#7c5cbf',
    accentBg: 'rgba(124,92,191,0.07)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4"  />
        <line x1="12" y1="2"  x2="12" y2="5"  />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2"  y1="12" x2="5"  y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    href: '/lexiverse/vocab',
    labelZh: '词库浏览',
    label: 'Vocab Browser',
    descZh: '按掌握状态筛选、浏览全部词汇',
    desc: 'Browse your full vocabulary by mastery state.',
    accent: 'var(--gold-ink)',
    accentBg: 'rgba(179,120,31,0.07)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
]

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3 },
  }
}

export default function ExplorePage() {
  return (
    <AppShell>
      <PageShell maxWidth={860} theme="light">
        <motion.div {...fadeUp(0)}>
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
            探索 · Explore
          </p>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
            词汇星河
          </h1>
          <p style={{ margin: '0 0 36px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
            Vocabulary Universe — explore the constellation of words you know
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {EXPLORE_MODES.map((mode, i) => (
            <motion.div key={mode.href} {...fadeUp(0.08 + i * 0.07)} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Link
                href={mode.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '24px 28px',
                  borderRadius: 'var(--r-card)',
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--card-shadow-sm)',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${mode.accent}40`
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--line)'
                  e.currentTarget.style.boxShadow = 'var(--card-shadow-sm)'
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                  background: mode.accentBg, border: `1px solid ${mode.accent}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mode.accent,
                }}>
                  {mode.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: '17px', color: 'var(--ink)' }}>{mode.labelZh}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-muted)', letterSpacing: '0.06em' }}>{mode.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>{mode.descZh}</p>
                  <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '12px', color: 'var(--ink-muted)' }}>{mode.desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageShell>
    </AppShell>
  )
}
