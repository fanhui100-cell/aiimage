// nav.jsx — navigation system for the word detail page.
// Exports: ProductNav (desktop floating bar + mobile top bar), BottomNav (mobile
// tab bar), CosmosMap (the star map you close back to — clickable planets).

const NAV_SECTIONS = [
  { id: 'cosmos', label: '星图', en: 'Cosmos', route: '/lexiverse' },
  { id: 'today', label: '今日', en: 'Today', route: '/today' },
  { id: 'dict', label: '词库', en: 'Dictionary', route: '/dictionary' },
  { id: 'graph', label: '词图', en: 'LexiGraph', route: '/lexigraph' },
];

function NIco({ children }) {
  return <svg aria-hidden width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}
const SecIcon = {
  cosmos: () => <NIco><circle cx="12" cy="12" r="2.4" /><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" /></NIco>,
  today: () => <NIco><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9.5h16M8 3.5v3M16 3.5v3M9 14l2 2 4-4" /></NIco>,
  dict: () => <NIco><path d="M5 4.5h9a2.5 2.5 0 0 1 2.5 2.5V20a2 2 0 0 0-2-2H5V4.5Z" /><path d="M16.5 7h2.5v13H8" /></NIco>,
  graph: () => <NIco><circle cx="6" cy="7" r="2.1" /><circle cx="18" cy="6" r="2.1" /><circle cx="14" cy="18" r="2.1" /><path d="M8 8l5 8M16 8l-2 8" /></NIco>,
};

// ── desktop floating bar + mobile top bar ───────────────────────────────
function ProductNav({ word, narrow, canBack, onBack, onClose, onSection }) {
  if (narrow) {
    return (
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: 'rgba(6,9,16,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(126,249,255,0.12)' }}>
        <NavRound label="返回" onClick={onBack} disabled={!canBack}><span aria-hidden>←</span></NavRound>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <b style={{ fontSize: 14, color: '#ECFBFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{word.word}</b>
          <span style={{ fontSize: 9.5, color: '#7E94A6', fontFamily: "'Space Mono', monospace" }}>Lexiverse · 词详情</span>
        </div>
        <NavRound label="关闭 · 返回星图" onClick={onClose} danger><span aria-hidden>✕</span></NavRound>
      </div>
    );
  }
  return (
    <div style={{ position: 'sticky', top: 14, zIndex: 20, display: 'flex', alignItems: 'center', gap: 14,
      margin: '0 auto 6px', maxWidth: 960, padding: '9px 12px 9px 14px', borderRadius: 16,
      background: 'rgba(8,12,22,0.72)', backdropFilter: 'blur(18px) saturate(1.2)', WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
      border: '1px solid rgba(126,249,255,0.16)', boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#BFF6FF,#7EF9FF 45%,#38BDF8)', color: '#051421', fontWeight: 800, fontSize: 14 }}>L</span>
        <b style={{ fontSize: 14, color: '#ECFBFF' }}>Lexiverse</b>
      </div>
      <span aria-hidden style={{ width: 1, height: 22, background: 'rgba(126,249,255,0.14)' }} />
      <NavRound label="后退" onClick={onBack} disabled={!canBack}><span aria-hidden>←</span></NavRound>
      <div style={{ flex: 1 }} />
      <nav style={{ display: 'flex', gap: 2 }}>
        {NAV_SECTIONS.map(s => {
          const Icon = SecIcon[s.id];
          const active = s.id === 'cosmos';
          return (
            <a key={s.id} href={s.route} onClick={e => { e.preventDefault(); onSection(s); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '7px 12px', borderRadius: 10,
                color: active ? '#7EF9FF' : '#9FB6C6', background: active ? 'rgba(126,249,255,0.12)' : 'transparent',
                border: active ? '1px solid rgba(126,249,255,0.22)' : '1px solid transparent', fontSize: 13, fontWeight: 600, transition: 'all .15s ease' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#ECFBFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#9FB6C6'; e.currentTarget.style.background = 'transparent'; } }}>
              <Icon />{s.label}
            </a>
          );
        })}
      </nav>
      <span aria-hidden style={{ width: 1, height: 22, background: 'rgba(126,249,255,0.14)' }} />
      <button type="button" onClick={onClose} aria-label="关闭页面 · 返回星图"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 11, cursor: 'pointer',
          border: '1px solid rgba(255,143,168,0.28)', background: 'rgba(255,143,168,0.08)', color: '#FFB4C2', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all .15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,143,168,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,143,168,0.55)'; e.currentTarget.style.color = '#FFD6DE'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,143,168,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,143,168,0.28)'; e.currentTarget.style.color = '#FFB4C2'; }}>
        <span aria-hidden>✕</span> 关闭 <span style={{ fontSize: 10, opacity: .7, fontFamily: "'Space Mono', monospace" }}>ESC</span>
      </button>
    </div>
  );
}

function NavRound({ children, label, onClick, disabled, danger }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      style={{ width: 36, height: 36, borderRadius: '50%', flex: 'none', cursor: disabled ? 'default' : 'pointer',
        border: `1px solid ${danger ? 'rgba(255,143,168,0.28)' : 'rgba(126,249,255,0.18)'}`,
        background: danger ? 'rgba(255,143,168,0.08)' : 'rgba(255,255,255,0.04)',
        color: disabled ? '#46586a' : (danger ? '#FFB4C2' : '#BfeFff'), fontSize: 15, display: 'grid', placeItems: 'center',
        opacity: disabled ? 0.5 : 1, transition: 'all .15s ease' }}
      onMouseEnter={e => { if (disabled) return; e.currentTarget.style.background = danger ? 'rgba(255,143,168,0.18)' : 'rgba(126,249,255,0.14)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(255,143,168,0.08)' : 'rgba(255,255,255,0.04)'; }}>
      {children}
    </button>
  );
}

// ── mobile bottom tab bar ───────────────────────────────────────────────
function BottomNav({ onSection }) {
  return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 20, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      gap: 2, padding: '8px 8px calc(8px + env(safe-area-inset-bottom))', background: 'rgba(6,9,16,0.92)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderTop: '1px solid rgba(126,249,255,0.14)' }}>
      {NAV_SECTIONS.map(s => {
        const Icon = SecIcon[s.id];
        const active = s.id === 'cosmos';
        return (
          <a key={s.id} href={s.route} onClick={e => { e.preventDefault(); onSection(s); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '6px 2px', borderRadius: 12,
              color: active ? '#7EF9FF' : '#7E94A6', background: active ? 'rgba(126,249,255,0.10)' : 'transparent' }}>
            <Icon />
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>{s.label}</span>
          </a>
        );
      })}
    </div>
  );
}

// ── the star map you close back to (stand-in for /lexiverse 3D cosmos) ───
const COSMOS_PLANETS = [
  { slug: 'resilient', label: 'resilient', color: '#38BDF8', x: 50, y: 46, size: 96, big: true },
  { slug: 'adaptable', label: 'adaptable', color: '#FFD66B', x: 24, y: 30, size: 60 },
  { slug: 'persevere', label: 'persevere', color: '#FF8FA8', x: 76, y: 28, size: 58 },
  { slug: 'tough', label: 'tough', color: '#9FB6C6', x: 30, y: 70, size: 54 },
  { slug: 'fragile', label: 'fragile', color: '#7EF9FF', x: 72, y: 70, size: 56 },
  { slug: 'grit', label: 'grit', color: '#B79BFF', x: 50, y: 80, size: 46 },
  { slug: 'thrive', label: 'thrive', color: '#6BE0A0', x: 87, y: 50, size: 44 },
];

function CosmosMap({ narrow, onEnter }) {
  return (
    <div style={{ position: 'relative', minHeight: narrow ? 620 : '78vh', overflow: 'hidden', color: '#ECFBFF',
      fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <Starfield />
      <div style={{ position: 'relative', zIndex: 1, padding: narrow ? '22px 16px 10px' : '30px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#BFF6FF,#7EF9FF 45%,#38BDF8)', color: '#051421', fontWeight: 800 }}>L</span>
          <div>
            <b style={{ display: 'block', fontSize: 16 }}>Lexiverse · 星图</b>
            <span style={{ fontSize: 11, color: '#9DB6CB', fontFamily: "'Space Mono', monospace" }}>STAR MAP · 点击星球进入单词</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {COSMOS_PLANETS.map(p => (
          <button key={p.slug} type="button" onClick={() => onEnter(p.slug)} title={`进入 ${p.label}`}
            style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <span className="cosmos-planet" style={{ '--c': p.color, width: p.size, height: p.size, borderRadius: '50%', display: 'block',
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.8), transparent 36%), radial-gradient(circle at 38% 35%, ${p.color}, color-mix(in oklab, ${p.color} 20%, #02060a) 80%)`,
              boxShadow: `0 0 38px -6px ${p.color}, inset -10px -12px 24px rgba(0,0,0,.6)`, transition: 'transform .2s ease, box-shadow .2s ease' }} />
            <span style={{ fontSize: p.big ? 16 : 13, fontWeight: p.big ? 700 : 600, color: p.big ? '#ECFBFF' : '#CFE6F2',
              textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>{p.label}</span>
          </button>
        ))}
      </div>
      {!narrow && (
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', zIndex: 1, fontSize: 12, color: '#6F8AA0', fontFamily: "'Space Mono', monospace" }}>
          这是关闭词详情页后返回的星图（生产环境为 /lexiverse 的 3D 宇宙）· 点任意星球进入
        </div>
      )}
    </div>
  );
}

(function injectNavCSS() {
  if (document.getElementById('nav-css')) return;
  const el = document.createElement('style');
  el.id = 'nav-css';
  el.textContent = `.cosmos-planet:hover{ transform: scale(1.08); box-shadow: 0 0 54px -4px var(--c), inset -10px -12px 24px rgba(0,0,0,.6) !important; }
    button:focus-visible, a:focus-visible { outline: 2px solid #7EF9FF; outline-offset: 2px; border-radius: 8px; }`;
  document.head.appendChild(el);
})();

Object.assign(window, { ProductNav, BottomNav, CosmosMap, NAV_SECTIONS });
