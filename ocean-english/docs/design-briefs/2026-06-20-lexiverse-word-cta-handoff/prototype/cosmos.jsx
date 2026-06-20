// cosmos.jsx — atmosphere layer that ties the page back to the 3D Lexiverse.
// Exports: Starfield (twinkling canvas bg), PlanetOrb (the word's "planet"),
// and injects the shared keyframes / entrance animations once.

(function injectCosmosCSS() {
  if (document.getElementById('cosmos-css')) return;
  const css = `
  @keyframes cosmos-float { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-9px) } }
  @keyframes cosmos-spin  { to { transform: rotate(360deg) } }
  @keyframes cosmos-pulse { 0%,100%{ opacity:.55; transform:scale(1) } 50%{ opacity:1; transform:scale(1.08) } }
  @keyframes cosmos-rise  { from { transform: translateY(16px) } to { transform: none } }
  @keyframes cosmos-fade  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes cosmos-sheen { to { background-position: 200% center } }

  /* base state is ALWAYS visible (opacity:1) so content never depends on the
     animation clock. Entrance only slides via transform — harmless if frozen. */
  .rise { opacity: 1; }
  @media (prefers-reduced-motion: no-preference) {
    .rise { animation: cosmos-rise .6s cubic-bezier(.22,1,.36,1) both; }
  }

  .orb-wrap { position: relative; width: 132px; height: 132px; flex: none;
    display: grid; place-items: center; animation: cosmos-float 7s ease-in-out infinite; }
  .orb { width: 116px; height: 116px; border-radius: 50%; position: relative;
    background:
      radial-gradient(circle at 30% 26%, rgba(255,255,255,.85), rgba(255,255,255,0) 34%),
      radial-gradient(circle at 36% 34%, var(--c), color-mix(in oklab, var(--c) 22%, #02060a) 80%);
    box-shadow: 0 0 64px -6px var(--c), inset -16px -20px 38px rgba(0,0,0,.62),
      inset 10px 12px 30px color-mix(in oklab, var(--c) 45%, transparent); }
  .orb::after { content:''; position:absolute; inset:0; border-radius:50%;
    background: radial-gradient(circle at 68% 72%, color-mix(in oklab, var(--c) 40%, transparent), transparent 46%);
    mix-blend-mode: screen; }
  .orb-ring { position:absolute; width:148px; height:148px; border-radius:50%;
    border: 1px solid color-mix(in oklab, var(--c) 50%, transparent);
    transform: rotateX(74deg); animation: cosmos-spin 16s linear infinite;
    box-shadow: 0 0 18px -4px var(--c); }
  .orb-halo { position:absolute; width:170px; height:170px; border-radius:50%;
    background: radial-gradient(circle, color-mix(in oklab, var(--c) 30%, transparent), transparent 62%);
    animation: cosmos-pulse 5.5s ease-in-out infinite; pointer-events:none; }

  .lift { transition: transform .2s cubic-bezier(.22,1,.36,1), border-color .2s, background .2s, box-shadow .2s; }
  .lift:hover { transform: translateY(-3px); }

  @media (prefers-reduced-motion: reduce) {
    .rise { opacity:1 !important; animation:none !important; }
    .orb-wrap,.orb-ring,.orb-halo { animation:none !important; }
  }`;
  const el = document.createElement('style');
  el.id = 'cosmos-css';
  el.textContent = css;
  document.head.appendChild(el);
})();

function Starfield() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, w, h, dpr, stars = [];
    const COLORS = ['#7EF9FF', '#B79BFF', '#FFFFFF', '#9AD8FF', '#FFD66B'];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.018 + 0.004,
        drift: Math.random() * 0.05 + 0.01,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.sp; s.y += s.drift;
        if (s.y > h + 2) { s.y = -2; s.x = Math.random() * w; }
        const a = 0.35 + Math.sin(s.tw) * 0.45;
        ctx.globalAlpha = Math.max(0.05, a);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.c; ctx.shadowColor = s.c; ctx.shadowBlur = s.r * 3;
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize(); window.addEventListener('resize', resize);
    if (reduce) frame(), cancelAnimationFrame(raf), ctx.clearRect(0,0,w,h), stars.forEach(s=>{ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fillStyle=s.c;ctx.fill();});
    else frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function PlanetOrb({ color = '#38BDF8', size = 132 }) {
  return (
    <div className="orb-wrap" style={{ width: size, height: size }}>
      <div className="orb-halo" />
      <div className="orb-ring" />
      <div className="orb" style={{ '--c': color }} />
    </div>
  );
}

Object.assign(window, { Starfield, PlanetOrb });
