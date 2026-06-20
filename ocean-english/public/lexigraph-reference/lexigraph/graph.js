/* ─────────────────────────────────────────────────────────────────────────
   LexiGraph · 力导向词图引擎 v3
   新增：画布缩放/平移 · 钉住可取消 · 学过高亮环 · 悬停聚焦暗化 · 小地图
   数据: window.WU_DATA { words:[[word,ipa,zh,pos,stars,phrases,sent]], edges:[[a,b,type]], families:[[idx..]] }
   type: 0 派生 · 1 近义 · 2 形近
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const REL = {
    0: { key: 'der', zh: '派生', en: 'derivative', color: '#B3781F' },
    1: { key: 'syn', zh: '近义', en: 'synonym', color: '#0E8C7A' },
    2: { key: 'conf', zh: '形近', en: 'confusable', color: '#BF4A30' },
  };

  function LexiGraph(opts) {
    const D = window.WU_DATA;
    this.D = D;
    this.canvas = opts.canvas;
    this.layer = opts.layer;
    this.ctx = this.canvas.getContext('2d');
    this.onSelect = opts.onSelect || function () {};
    this.onChange = opts.onChange || function () {};
    this.onViewChange = opts.onViewChange || function () {};

    const adj = new Map();
    const push = (a, b, t) => { if (!adj.has(a)) adj.set(a, []); const l = adj.get(a); if (!l.some((e) => e[0] === b)) l.push([b, t]); };
    D.edges.forEach(([a, b, t]) => { push(a, b, t); push(b, a, t); });
    D.families.forEach((f) => { for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) { if (f.length <= 5 || i === 0) { push(f[i], f[j], 0); push(f[j], f[i], 0); } } });
    const widx = new Map();
    D.words.forEach((w, i) => { if (!widx.has(w[0].toLowerCase())) widx.set(w[0].toLowerCase(), i); });
    this.adj = adj; this.widx = widx;

    this.nodes = []; this.byIdx = new Map(); this.links = [];
    this.center = null; this.hover = null; this.history = [];
    this.t = 0; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.showHop2 = false;
    this.relFilter = { 0: true, 1: true, 2: true };
    this.rightInset = 0;
    this.learnedSet = new Set();
    this.view = { s: 1, tx: 0, ty: 0 };
    this.layer.style.transformOrigin = '0 0';
    this.minimap = null;

    this._bind();
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._loop();
  }

  LexiGraph.prototype.starsOf = function (idx) { return this.D.words[idx][4] || 1; };
  LexiGraph.prototype.radiusOf = function (hop, idx) {
    const s = this.starsOf(idx);
    if (hop === 0) return 58;
    if (hop === 1) return 30 + s * 4.2;
    return 22 + s * 2.6;
  };

  LexiGraph.prototype.neighborsOf = function (idx, max) {
    const list = [];
    (this.adj.get(idx) || []).forEach(([n, t]) => { if (n !== idx && this.relFilter[t]) list.push({ idx: n, type: t }); });
    const order = { 0: 0, 1: 1, 2: 2 };
    list.sort((a, b) => (order[a.type] - order[b.type]) || (this.starsOf(b.idx) - this.starsOf(a.idx)));
    const seen = new Set(); const out = [];
    for (const it of list) { if (seen.has(it.idx)) continue; seen.add(it.idx); out.push(it); }
    return out.slice(0, max || 14);
  };

  LexiGraph.prototype.focus = function (idx, fromUser) {
    if (idx == null) return;
    if (this.center != null && fromUser && this.center !== idx) this.history.push(this.center);
    this.center = idx;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const cx = (W - (this.rightInset || 0)) / 2, cy = H / 2;
    const hop1 = this.neighborsOf(idx, 14);
    const want = new Map();
    want.set(idx, { idx, hop: 0, type: null, parent: null });
    hop1.forEach((n, i) => want.set(n.idx, { idx: n.idx, hop: 1, type: n.type, parent: idx, ang: (i / hop1.length) * Math.PI * 2 - Math.PI / 2 }));
    if (this.showHop2) {
      let budget = 22 - want.size;
      for (const n of hop1) { if (budget <= 0) break;
        const subs = this.neighborsOf(n.idx, 4).filter((s) => !want.has(s.idx) && s.idx !== idx);
        const take = subs.slice(0, 2);
        take.forEach((s, si) => { if (budget <= 0 || want.has(s.idx)) return; want.set(s.idx, { idx: s.idx, hop: 2, type: s.type, parent: n.idx, subAng: (n.ang || 0) + (si - (take.length - 1) / 2) * 0.6 }); budget--; });
      }
    }
    const old = this.byIdx; const next = []; const nextBy = new Map();
    want.forEach((meta, ni) => {
      let node = old.get(ni);
      if (!node) {
        const parent = meta.parent != null ? old.get(meta.parent) : null;
        const baseAng = meta.subAng != null ? meta.subAng : (meta.ang != null ? meta.ang : Math.random() * Math.PI * 2);
        const rr = meta.hop === 0 ? 0 : (meta.hop === 1 ? 60 : 130);
        const ox = parent ? parent.x : cx, oy = parent ? parent.y : cy;
        node = { idx: ni, x: (meta.hop === 0 ? cx : ox) + Math.cos(baseAng) * rr + (Math.random() - 0.5) * 18, y: (meta.hop === 0 ? cy : oy) + Math.sin(baseAng) * rr + (Math.random() - 0.5) * 18, vx: 0, vy: 0, born: this.t };
      }
      node.hop = meta.hop; node.rel = meta.type; node.parent = meta.parent; node.ang = meta.ang;
      node.r = this.radiusOf(meta.hop, ni);
      if (meta.hop === 0) node.pinned = false;
      next.push(node); nextBy.set(ni, node);
    });
    old.forEach((node, ni) => { if (!nextBy.has(ni) && node.el) node.el.remove(); });
    this.nodes = next; this.byIdx = nextBy;
    const links = []; const visible = new Set([...nextBy.keys()]);
    next.forEach((node) => { if (node.parent != null && visible.has(node.parent)) links.push({ a: node.parent, b: node.idx, type: node.rel, tree: true, born: this.t }); });
    next.forEach((node) => { (this.adj.get(node.idx) || []).forEach(([m, t]) => { if (m !== node.idx && visible.has(m) && node.idx < m && this.relFilter[t] && !links.some((l) => (l.a === node.idx && l.b === m) || (l.a === m && l.b === node.idx))) links.push({ a: node.idx, b: m, type: t, weak: true }); }); });
    this.links = links;
    next.forEach((node) => this._ensureEl(node));
    this.onSelect(idx); this.onChange();
  };

  LexiGraph.prototype.back = function () { if (this.history.length) this.focus(this.history.pop(), false); };
  LexiGraph.prototype.setHop2 = function (on) { this.showHop2 = on; if (this.center != null) this.focus(this.center, false); };
  LexiGraph.prototype.toggleRel = function (t) { this.relFilter[t] = !this.relFilter[t]; if (this.center != null) this.focus(this.center, false); return this.relFilter[t]; };
  LexiGraph.prototype.setLearned = function (set) { this.learnedSet = set || new Set(); };

  LexiGraph.prototype._ensureEl = function (node) {
    const w = this.D.words[node.idx];
    const scale = node.hop === 0 ? 1 : Math.max(0.8, Math.min(1.25, 0.82 + this.starsOf(node.idx) * 0.05));
    if (!node.el) {
      const el = document.createElement('button');
      el.className = 'lg-node pop';
      el.dataset.idx = node.idx;
      el.innerHTML = '<span class="lw">' + w[0] + '</span><span class="lz">' + (w[2] ? w[2].split(/[；;,，]/)[0].replace(/^[a-z]+\.\s*/, '').slice(0, 7) : '') + '</span>';
      this.layer.appendChild(el);
      node.el = el;
      setTimeout(() => { if (el.classList) el.classList.remove('pop'); }, 560);
    }
    if (node.hop !== 0) node.el.style.setProperty('--scale', scale.toFixed(2)); else node.el.style.removeProperty('--scale');
  };

  LexiGraph.prototype._physics = function (dt) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const inset = (this.rightInset || 0);
    const cx = (W - inset) / 2, cy = H / 2;
    const rx = Math.max(175, Math.min((W - inset) / 2 - 60, 250));
    const ry = Math.max(150, Math.min(H / 2 - 70, 230));
    const nodes = this.nodes;
    const center = this.byIdx.get(this.center);
    if (center && !center.pinned) { center.x += (cx - center.x) * Math.min(1, dt * 9); center.y += (cy - center.y) * Math.min(1, dt * 9); center.vx = center.vy = 0; }
    const cAnchor = center || { x: cx, y: cy };
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.hop === 0 || n.pinned) continue;
      if (n.hop === 1 && n.ang != null) {
        let tx = cAnchor.x + Math.cos(n.ang) * rx;
        let ty = cAnchor.y + Math.sin(n.ang) * ry;
        for (let j = 0; j < nodes.length; j++) { if (j === i) continue; const m = nodes[j]; if (m.hop !== 1) continue;
          const dx = n.x - m.x, dy = n.y - m.y; const d2 = dx * dx + dy * dy; const minD = n.r + m.r + 18;
          if (d2 > 1 && d2 < minD * minD) { const d = Math.sqrt(d2); const push = (minD - d) * 0.5; tx += (dx / d) * push; ty += (dy / d) * push; } }
        n.x += (tx - n.x) * Math.min(1, dt * 6); n.y += (ty - n.y) * Math.min(1, dt * 6); n.vx = n.vy = 0; continue;
      }
      let fx = 0, fy = 0;
      for (let j = 0; j < nodes.length; j++) { if (i === j) continue; const m = nodes[j];
        let dx = n.x - m.x, dy = n.y - m.y; let d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
        const minD = (n.r + m.r + 22);
        if (d2 < minD * minD * 6) { const d = Math.sqrt(d2); const f = (n.r * m.r * 9) / d2; fx += (dx / d) * f; fy += (dy / d) * f; } }
      const p = n.parent != null ? this.byIdx.get(n.parent) : null;
      if (p) { const L = 96 + n.r; let dx = p.x - n.x, dy = p.y - n.y; const d = Math.sqrt(dx * dx + dy * dy) || 1; const f = (d - L) * 0.9; fx += (dx / d) * f; fy += (dy / d) * f; }
      n.vx = (n.vx + fx * dt) * 0.84; n.vy = (n.vy + fy * dt) * 0.84;
      const sp = Math.hypot(n.vx, n.vy); if (sp > 600) { n.vx *= 600 / sp; n.vy *= 600 / sp; }
      n.x += n.vx * dt; n.y += n.vy * dt;
      n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(48, Math.min(H - 40, n.y));
    }
  };

  LexiGraph.prototype._hoverSet = function () {
    if (this.hover == null) return null;
    const s = new Set([this.hover, this.center]);
    (this.adj.get(this.hover) || []).forEach(([m]) => { if (this.byIdx.has(m)) s.add(m); });
    return s;
  };

  LexiGraph.prototype._draw = function () {
    const ctx = this.ctx; const v = this.view;
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.translate(v.tx, v.ty); ctx.scale(v.s, v.s);
    this.layer.style.transform = 'translate(' + v.tx + 'px,' + v.ty + 'px) scale(' + v.s + ')';
    const hs = this._hoverSet();
    for (const lk of this.links) {
      const a = this.byIdx.get(lk.a), b = this.byIdx.get(lk.b);
      if (!a || !b) continue;
      const col = (REL[lk.type] || REL[0]).color;
      const active = (this.hover != null && (lk.a === this.hover || lk.b === this.hover)) || lk.a === this.center || lk.b === this.center;
      const dim = hs && !(hs.has(lk.a) && hs.has(lk.b));
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 7;
      ctx.strokeStyle = col;
      ctx.globalAlpha = dim ? 0.05 : (lk.weak ? (active ? 0.24 : 0.08) : (active ? 0.82 : 0.34));
      ctx.lineWidth = lk.weak ? 1 : (active ? 2 : 1.3);
      const prog = lk.born != null ? Math.min(1, (this.t - lk.born) / 0.5) : 1;
      ctx.beginPath();
      if (prog >= 1) { ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); }
      else { // 生长动画：从父端沿曲线画到 prog
        ctx.moveTo(a.x, a.y);
        const steps = 12;
        for (let s = 1; s <= steps; s++) { const u = (s / steps) * prog; const ix = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x; const iy = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y; ctx.lineTo(ix, iy); }
      }
      ctx.stroke();
      if (!lk.weak && !dim && prog >= 1) { ctx.globalAlpha = active ? 0.9 : 0.5; ctx.beginPath(); ctx.arc(mx, my + 3.5, active ? 3 : 2.1, 0, 7); ctx.fillStyle = col; ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (const n of this.nodes) {
      if (!n.el) continue;
      n.el.style.transform = 'translate(-50%,-50%) translate(' + n.x.toFixed(1) + 'px,' + n.y.toFixed(1) + 'px)';
      const isC = n.hop === 0, isH = n.idx === this.hover;
      const learned = this.learnedSet.has(this.D.words[n.idx][0]);
      const dim = hs && !hs.has(n.idx);
      const pk = (this.D.words[n.idx][3] || '').split(/[\s&./,]+/)[0].toLowerCase();
      const pc = pk === 'n' ? 'pos-n' : (pk === 'v' || pk === 'vt' || pk === 'vi') ? 'pos-v' : pk === 'adj' ? 'pos-adj' : pk === 'adv' ? 'pos-adv' : 'pos-other';
      const keepPop = n.el.classList.contains('pop') ? ' pop' : '';
      const keepRoute = n.el.classList.contains('route-on') ? ' route-on' : '';
      n.el.className = 'lg-node' + keepPop + keepRoute + ' ' + pc + (isC ? ' is-center' : '') + (isH ? ' is-hover' : '') + (n.hop === 2 ? ' is-hop2' : '') + (n.pinned ? ' is-pinned' : '') + (learned ? ' is-learned' : '') + (dim ? ' is-dim' : '') + (n.rel != null ? ' rel-' + REL[n.rel].key : '');
      if (isH) { this.hoverScreen = { x: n.x * v.s + v.tx, y: n.y * v.s + v.ty }; }
    }
    if (this.hover == null) this.hoverScreen = null;
    if (this.minimap) this._drawMinimap();
  };

  LexiGraph.prototype._drawMinimap = function () {
    const mc = this.minimap, ctx = mc.getContext('2d');
    const MW = mc.clientWidth, MH = mc.clientHeight, dpr = this.dpr;
    if (mc.width !== MW * dpr) { mc.width = MW * dpr; mc.height = MH * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, MW, MH);
    if (!this.nodes.length) return;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const n of this.nodes) { minX = Math.min(minX, n.x); minY = Math.min(minY, n.y); maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y); }
    const pad = 30; minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const sc = Math.min(MW / (maxX - minX), MH / (maxY - minY));
    const ox = (MW - (maxX - minX) * sc) / 2, oy = (MH - (maxY - minY) * sc) / 2;
    const mp = (x, y) => [ox + (x - minX) * sc, oy + (y - minY) * sc];
    for (const lk of this.links) { if (lk.weak) continue; const a = this.byIdx.get(lk.a), b = this.byIdx.get(lk.b); if (!a || !b) continue; const p = mp(a.x, a.y), q = mp(b.x, b.y); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.strokeStyle = (REL[lk.type] || REL[0]).color; ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const n of this.nodes) { const p = mp(n.x, n.y); ctx.beginPath(); ctx.arc(p[0], p[1], n.hop === 0 ? 3.4 : 2, 0, 7); ctx.fillStyle = n.hop === 0 ? '#14191E' : (n.rel != null ? REL[n.rel].color : '#8A97A2'); ctx.fill(); }
    // viewport rect
    const v = this.view, W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    const tl = mp((0 - v.tx) / v.s, (0 - v.ty) / v.s), br = mp((W - v.tx) / v.s, (H - v.ty) / v.s);
    ctx.strokeStyle = 'rgba(20,25,30,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]);
  };

  LexiGraph.prototype.setMinimap = function (canvas) { this.minimap = canvas; };

  LexiGraph.prototype._loop = function () {
    let last = performance.now(); this._lastFrame = last;
    const frame = (now) => { const dt = Math.min(0.04, (now - last) / 1000); last = now; this._lastFrame = now; this.t += dt; this._physics(dt); this._draw(); };
    const step = (now) => { frame(now); this._raf = requestAnimationFrame(step); };
    this._raf = requestAnimationFrame(step);
    this._timer = setInterval(() => { const now = performance.now(); if (now - this._lastFrame > 40) frame(now); }, 33);
  };

  LexiGraph.prototype._resize = function () { const W = this.canvas.clientWidth, H = this.canvas.clientHeight; this.canvas.width = W * this.dpr; this.canvas.height = H * this.dpr; };

  // ── view: zoom / pan ──
  LexiGraph.prototype.zoomAt = function (sx, sy, factor) {
    const v = this.view; const ns = Math.max(0.45, Math.min(2.6, v.s * factor));
    const k = ns / v.s; v.tx = sx - (sx - v.tx) * k; v.ty = sy - (sy - v.ty) * k; v.s = ns; this.onViewChange();
  };
  LexiGraph.prototype.resetView = function () { this.view = { s: 1, tx: 0, ty: 0 }; this.onViewChange(); };
  LexiGraph.prototype.recenter = function () {
    this.nodes.forEach((n) => { n.pinned = false; });
    this.resetView();
    if (this.center != null) this.focus(this.center, false);
  };

  LexiGraph.prototype._bind = function () {
    let drag = null, pan = null, lastTap = { idx: -1, t: 0 };
    const rect = () => this.canvas.getBoundingClientRect();
    const toWorld = (cx, cy) => { const r = rect(); return [(cx - r.left - this.view.tx) / this.view.s, (cy - r.top - this.view.ty) / this.view.s]; };

    this.layer.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.lg-node');
      if (b) { const idx = +b.dataset.idx; const node = this.byIdx.get(idx); if (!node) return;
        const w = toWorld(e.clientX, e.clientY); drag = { node, sx: e.clientX, sy: e.clientY, moved: false, offX: w[0] - node.x, offY: w[1] - node.y }; b.setPointerCapture && b.setPointerCapture(e.pointerId);
      } else { pan = { sx: e.clientX, sy: e.clientY, tx0: this.view.tx, ty0: this.view.ty }; this.layer.style.cursor = 'grabbing'; }
    });
    window.addEventListener('pointermove', (e) => {
      if (drag) { if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
        if (drag.moved) { const w = toWorld(e.clientX, e.clientY); drag.node.pinned = true; drag.node.x = w[0] - drag.offX; drag.node.y = w[1] - drag.offY; drag.node.vx = drag.node.vy = 0; } }
      else if (pan) { this.view.tx = pan.tx0 + (e.clientX - pan.sx); this.view.ty = pan.ty0 + (e.clientY - pan.sy); this.onViewChange(); }
    });
    window.addEventListener('pointerup', (e) => {
      if (drag) {
        const node = drag.node, idx = node.idx;
        if (!drag.moved) {
          if (idx === this.center) this.onSelect(idx);
          else if (node.pinned) { node.pinned = false; }     // 点击已钉住的节点 → 取消钉住
          else this.focus(idx, true);
        }
        drag = null;
      }
      if (pan) { pan = null; this.layer.style.cursor = ''; }
    });
    this.layer.addEventListener('wheel', (e) => { e.preventDefault(); const r = rect(); this.zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });
    this.layer.addEventListener('mouseover', (e) => { const b = e.target.closest('.lg-node'); this.hover = b ? +b.dataset.idx : null; });
    this.layer.addEventListener('mouseout', () => { this.hover = null; });
  };

  LexiGraph.prototype.search = function (q) {
    q = q.trim().toLowerCase(); if (!q) return [];
    const hits = [];
    for (let i = 0; i < this.D.words.length && hits.length < 8; i++) { const w = this.D.words[i]; if (w[0].toLowerCase().startsWith(q) || (w[2] && w[2].includes(q))) hits.push(i); }
    return hits;
  };

  window.LexiGraph = LexiGraph;
  window.LG_REL = REL;
})();
