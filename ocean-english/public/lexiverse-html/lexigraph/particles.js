/* ─────────────────────────────────────────────────────────────────────────
   Cosmic Particle Background  ·  宇宙粒子背景
   Single <canvas>, low-density drifting starfield with twinkle, gentle mouse
   parallax, faint near-neighbor constellation links, and a soft nebula vignette.
   Mirrors components/lexigraph/LexiGraphParticleBackground.tsx (React port).

   Design rules honored:
     · one canvas (never one DOM node per particle)
     · prefers-reduced-motion → single static frame, no rAF loop
     · mobile → reduced particle count
     · destroy() cancels rAF, removes listeners, disconnects observer
   Usage: const bg = CosmicParticles(canvasEl, { density: 0.00010 }); bg.destroy()
   ───────────────────────────────────────────────────────────────────────── */
window.CosmicParticles = function CosmicParticles(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  const cfg = {
    density: opts.density ?? 0.00011,          // particles per CSS px²
    maxParticles: opts.maxParticles ?? (isMobile ? 60 : 150),
    linkDist: opts.linkDist ?? 96,             // constellation link radius
    linkNear: opts.linkNear ?? 150,            // only link near cursor
    parallax: opts.parallax ?? (reduced ? 0 : 14),
    palette: opts.palette ?? ['#7EF9FF', '#38BDF8', '#A78BFA', '#E2F4FF', '#FBBF24'],
  };

  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let particles = [];
  let raf = 0;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeParticles() {
    const area = W * H;
    const n = Math.min(cfg.maxParticles, Math.max(28, Math.round(area * cfg.density)));
    particles = [];
    for (let i = 0; i < n; i++) {
      const depth = rand(0.25, 1);            // parallax depth + size driver
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: depth,
        r: rand(0.5, 2.4) * depth + 0.3,
        vx: rand(-0.05, 0.05) * (reduced ? 0 : 1),
        vy: rand(-0.05, 0.05) * (reduced ? 0 : 1),
        twPhase: Math.random() * Math.PI * 2,
        twSpeed: rand(0.6, 1.8),
        baseA: rand(0.25, 0.9),
        color: cfg.palette[(Math.random() * cfg.palette.length) | 0],
      });
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeParticles();
    if (reduced) draw(0);            // static frame for reduced-motion
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Soft nebula vignette (two faint radial pools).
    const g1 = ctx.createRadialGradient(W * 0.30, H * 0.32, 0, W * 0.30, H * 0.32, Math.max(W, H) * 0.55);
    g1.addColorStop(0, 'rgba(14,116,165,0.10)');
    g1.addColorStop(1, 'rgba(14,116,165,0)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.74, H * 0.70, 0, W * 0.74, H * 0.70, Math.max(W, H) * 0.5);
    g2.addColorStop(0, 'rgba(124,77,196,0.08)');
    g2.addColorStop(1, 'rgba(124,77,196,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // ease cursor
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    const sec = t / 1000;
    for (const p of particles) {
      if (!reduced) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -4) p.x = W + 4; else if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4; else if (p.y > H + 4) p.y = -4;
      }
      const px = mouse.x > -9000 ? (mouse.x - W / 2) / W : 0;
      const py = mouse.y > -9000 ? (mouse.y - H / 2) / H : 0;
      const ox = px * cfg.parallax * p.z;
      const oy = py * cfg.parallax * p.z;

      const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(sec * p.twSpeed + p.twPhase);
      const a = p.baseA * tw;
      const dx = p.x + ox, dy = p.y + oy;

      ctx.beginPath();
      ctx.arc(dx, dy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fill();

      // glow for the brighter/closer stars
      if (p.r > 1.5) {
        ctx.globalAlpha = a * 0.25;
        ctx.beginPath();
        ctx.arc(dx, dy, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Constellation links — only near the cursor, keeps it calm & cheap.
    if (!reduced && mouse.x > -9000) {
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (Math.hypot(a.x - mouse.x, a.y - mouse.y) > cfg.linkNear) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < cfg.linkDist) {
            ctx.globalAlpha = (1 - d / cfg.linkDist) * 0.16;
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    if (!reduced) raf = requestAnimationFrame(draw);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - rect.left;
    mouse.ty = e.clientY - rect.top;
  }
  function onLeave() { mouse.tx = -9999; mouse.ty = -9999; }

  // ── wire up ──
  let ro = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas); }
  else window.addEventListener('resize', resize);
  if (!reduced) {
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });
  }
  resize();
  if (!reduced) raf = requestAnimationFrame(draw);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    },
  };
};
