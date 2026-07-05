'use client'

import Link from 'next/link'

interface Props {
  suggestedWord?: string
  recentSearches?: string[]
}

export function LexiGraphStudyCard({ suggestedWord, recentSearches = [] }: Props) {
  const suggestion = suggestedWord ?? 'ubiquitous'
  const slugify = (w: string) => w.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      style={{
        background: 'rgba(126,249,255,0.03)',
        border: '1px solid rgba(126,249,255,0.18)',
        borderRadius: '14px',
        padding: '24px 28px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(126,249,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(126,249,255,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
            LEXIGRAPH / 词汇星图
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: '#ECFBFF' }}>
            Explore Word Relationships
            <span style={{ fontSize: '14px', color: '#9BBFCA', marginLeft: '10px', fontWeight: 400 }}>探索词汇关系</span>
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(155,191,202,0.6)', lineHeight: 1.5 }}>
            Open any word and see its synonyms, antonyms, collocations, and etymology on an interactive map.
            <br />
            <span style={{ fontSize: '12px' }}>在交互式图谱中查看词汇的近义词、反义词、搭配和词源。</span>
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/lexigraph"
              style={{
                padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '13px',
                background: 'rgba(126,249,255,0.1)', border: '1px solid rgba(126,249,255,0.35)', color: '#7EF9FF',
                fontFamily: 'var(--font-mono)',
              }}
            >
              ✦ Open LexiGraph / 打开词汇星图
            </Link>
            <Link
              href={`/lexigraph?word=${slugify(suggestion)}`}
              style={{
                padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,191,202,0.15)', color: '#9BBFCA',
              }}
            >
              Explore &quot;{suggestion}&quot; →
            </Link>
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
              RECENT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {recentSearches.slice(0, 4).map(w => (
                <Link
                  key={w}
                  href={`/lexigraph?word=${slugify(w)}`}
                  style={{ fontSize: '12px', color: 'rgba(126,249,255,0.6)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                >
                  ✦ {w}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
