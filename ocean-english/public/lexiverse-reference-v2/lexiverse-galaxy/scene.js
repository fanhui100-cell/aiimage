/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse Galaxy · scene
   Builds the whole planet field, handles picking, the CAMERA FLY-IN focus
   (zoom to a single planet, like the close-up reference), spin + breathing,
   and distance-based labels. Zero post-processing.
   ───────────────────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createGalaxy(container, graph, opts = {}) {
  const onSelect = opts.onSelect || (() => {});
  const onHover = opts.onHover || (() => {});
  window.LexiPlanets.init(THREE);

  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040407');
  scene.fog = new THREE.FogExp2('#040407', 0.0042);

  const HOME = new THREE.Vector3(0, 10, 205);
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 4000);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55; controls.minDistance = 6; controls.maxDistance = 360;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.18; controls.enablePan = false;

  addBackgroundStars(scene, graph.fieldR);

  // ── Build planets ─────────────────────────────────────────────────────────
  const pickGeo = new THREE.SphereGeometry(1, 8, 8);
  const nodeObjects = new Map();
  const pickTargets = [];
  function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

  // brightness factor for solid materials by status — drives BOTH opacity AND
  // a color multiplier, so locked planets read as dim ghosts of their lit selves
  // while still showing the hue you'll get when you light them up.
  const SOLID_OP    = { mastered: 1.0,  unlockable: 0.98, locked: 0.86 };
  const SOLID_COLOR = { mastered: 1.08, unlockable: 0.90, locked: 0.46 };
  // glow halo opacity — locked has only an ember; lit shines
  const GLOW_F      = { mastered: 1.0, unlockable: 0.50, locked: 0.12 };
  // glow halo size — lit grows a touch larger than the body, locked tight
  const GLOW_SCALE  = { mastered: 1.45, unlockable: 1.14, locked: 0.72 };

  for (const node of graph.nodes) {
    const rnd = mulberry32(node.seed);
    const built = window.LexiPlanets.build(node.archetype, node.radius, node.color, rnd);
    const grp = built.object3D;
    grp.position.set(node.x, node.y, node.z);
    grp.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    scene.add(grp);

    // invisible pick sphere
    const pick = new THREE.Mesh(pickGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
    pick.scale.setScalar(built.pickR); pick.userData.id = node.id;
    grp.add(pick); pickTargets.push(pick);

    // collect materials, separating glow sprites (breathe + grow) from solids (dim).
    // For each solid we snapshot its BASE color so dimming can darken-toward-locked
    // without destroying the planet's identity color.
    const glows = [], solids = [];
    grp.traverse((o) => {
      if (o === pick) return;
      if (o.material && o.material.userData && o.material.userData.glow) {
        glows.push({ sp: o, base: o.material.userData.glow.base, mat: o.material });
      } else if (o.material) {
        solids.push({ m: o.material, baseOp: o.material.opacity ?? 1, baseColor: o.material.color.clone() });
      }
    });

    nodeObjects.set(node.id, { node, grp, glows, solids, spin: built.spin || 0, spinTarget: built.spinTarget || grp, pop: 1 });
    applyStatusDim(nodeObjects.get(node.id));
  }

  // ── Faint constellation edges between mastered neighbours ────────────────
  let edgeLines = null;
  function buildEdges() {
    if (edgeLines) { scene.remove(edgeLines); edgeLines.geometry.dispose(); edgeLines.material.dispose(); edgeLines = null; }
    const segs = [];
    for (const e of graph.edges) {
      const a = graph.byId[e.source], b = graph.byId[e.target];
      const am = a.status === 'mastered', bm = b.status === 'mastered';
      if (!am && !bm) continue;                 // only show lines touching mastered
      if (a.status === 'locked' || b.status === 'locked') continue;
      segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    if (!segs.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    edgeLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(edgeLines);
  }
  buildEdges();

  /* ── Burst particle pool ─────────────────────────────────────────────────
     When a star lights up, we spawn ~38 additive-glow sprites that fly outward
     and fade. A pooled, hidden array keeps allocation off the hot path. */
  const burstTex = (() => {
    const sz = 64, c = document.createElement('canvas'); c.width = c.height = sz;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(sz/2, sz/2, 0, sz/2, sz/2, sz/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, sz, sz);
    return new THREE.CanvasTexture(c);
  })();
  const BURST_POOL = 260;
  const burstSprites = [];
  const burstActive = [];
  for (let i = 0; i < BURST_POOL; i++) {
    const mat = new THREE.SpriteMaterial({ map: burstTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const sp = new THREE.Sprite(mat); sp.visible = false; scene.add(sp); burstSprites.push(sp);
  }
  function burst(nodeId) {
    const o = nodeObjects.get(nodeId); if (!o) return;
    const pos = o.grp.position;
    const color = new THREE.Color(o.node.color);
    const n = 38;
    let spawned = 0;
    for (let i = 0; i < burstSprites.length && spawned < n; i++) {
      const sp = burstSprites[i]; if (sp.visible) continue;
      sp.position.copy(pos);
      const th = Math.random() * Math.PI * 2, el = (Math.random() - 0.5) * 1.7;
      const sp0 = 4 + Math.random() * 10;
      const vx = Math.cos(th) * Math.cos(el) * sp0;
      const vy = Math.sin(el) * sp0;
      const vz = Math.sin(th) * Math.cos(el) * sp0;
      const baseSize = 0.5 + Math.random() * 1.6;
      sp.scale.setScalar(baseSize);
      sp.material.color.copy(color).lerp(new THREE.Color('#ffffff'), Math.random() * 0.6);
      sp.material.opacity = 1; sp.visible = true;
      burstActive.push({ i, vx, vy, vz, ttl: 1.1 + Math.random() * 0.5, max: 1.4, baseSize });
      spawned++;
    }
    spawnShockwave(pos, o.node.color);
  }
  function tickBurst(dt) {
    for (let j = burstActive.length - 1; j >= 0; j--) {
      const a = burstActive[j]; const sp = burstSprites[a.i];
      a.vx *= 0.93; a.vy *= 0.93; a.vz *= 0.93;
      sp.position.x += a.vx * dt; sp.position.y += a.vy * dt; sp.position.z += a.vz * dt;
      a.ttl -= dt;
      const k = Math.max(0, a.ttl / a.max);
      sp.material.opacity = k;
      sp.scale.setScalar(a.baseSize * (1 + (1 - k) * 0.6));
      if (a.ttl <= 0) { sp.visible = false; burstActive.splice(j, 1); }
    }
  }

  /* ── Shockwave rings (camera-facing, expanding) ────────────────────────── */
  const shockGeo = new THREE.RingGeometry(1, 1.07, 64);
  const shockwaves = [];
  function spawnShockwave(pos, color) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(shockGeo, mat); mesh.position.copy(pos); mesh.lookAt(camera.position);
    scene.add(mesh); shockwaves.push({ mesh, ttl: 0.95, max: 0.95 });
  }
  function tickShockwaves(dt) {
    for (let j = shockwaves.length - 1; j >= 0; j--) {
      const s = shockwaves[j]; s.ttl -= dt;
      const k = Math.max(0, s.ttl / s.max);
      const grow = 1 + (1 - k) * 14;
      s.mesh.scale.setScalar(grow * 1.6);
      s.mesh.material.opacity = k * 0.85;
      s.mesh.lookAt(camera.position);
      if (s.ttl <= 0) { scene.remove(s.mesh); s.mesh.material.dispose(); shockwaves.splice(j, 1); }
    }
  }

  /* ── Energy pulses: particles flowing mastered → unlockable along edges ─
     "Knowledge energy is gathering — go light it up." */
  let energySystem = null;
  function buildEnergyPulses() {
    if (energySystem) { scene.remove(energySystem.points); energySystem.points.geometry.dispose(); energySystem.points.material.dispose(); energySystem = null; }
    const edgesToAnimate = [];
    for (const e of graph.edges) {
      const a = graph.byId[e.source], b = graph.byId[e.target];
      const aLit = a.status === 'mastered', bLit = b.status === 'mastered';
      const aUnk = a.status === 'unlockable', bUnk = b.status === 'unlockable';
      if ((aLit && bUnk) || (bLit && aUnk)) {
        const lit = aLit ? a : b, unk = aLit ? b : a;
        edgesToAnimate.push({ src: lit, tgt: unk });
      }
    }
    if (!edgesToAnimate.length) return;
    const N = Math.min(edgesToAnimate.length, 180);
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    const meta = [];
    for (let i = 0; i < N; i++) {
      const e = edgesToAnimate[i];
      const c = new THREE.Color(e.src.color);
      meta.push({ src: new THREE.Vector3(e.src.x, e.src.y, e.src.z), tgt: new THREE.Vector3(e.tgt.x, e.tgt.y, e.tgt.z),
        phase: Math.random(), speed: 0.20 + Math.random() * 0.15, color: c });
      positions[i*3] = e.src.x; positions[i*3+1] = e.src.y; positions[i*3+2] = e.src.z;
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.9, map: burstTex, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geo, mat); scene.add(points);
    energySystem = { points, meta, N };
  }
  function tickEnergy(t) {
    if (!energySystem) return;
    const pos = energySystem.points.geometry.attributes.position.array;
    for (let i = 0; i < energySystem.N; i++) {
      const m = energySystem.meta[i];
      const phase = ((t * m.speed) + m.phase) % 1;
      pos[i*3]   = m.src.x + (m.tgt.x - m.src.x) * phase;
      pos[i*3+1] = m.src.y + (m.tgt.y - m.src.y) * phase;
      pos[i*3+2] = m.src.z + (m.tgt.z - m.src.z) * phase;
    }
    energySystem.points.geometry.attributes.position.needsUpdate = true;
  }
  buildEnergyPulses();

  function applyStatusDim(o) {
    const st = o.node.status;
    const op = SOLID_OP[st], cf = SOLID_COLOR[st], gf = GLOW_F[st], gs = GLOW_SCALE[st];
    for (const mm of o.solids) {
      mm.m.opacity = mm.baseOp * op;
      mm.m.color.copy(mm.baseColor).multiplyScalar(cf);
    }
    for (const gg of o.glows) { gg.mat.opacity = gf; gg.sp.scale.setScalar(gg.base * gs); }
  }

  // ── Labels ────────────────────────────────────────────────────────────────
  const labelLayer = document.createElement('div');
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(labelLayer);
  const labelEls = new Map();
  function ensureLabel(id, word) {
    let el = labelEls.get(id);
    if (!el) { el = document.createElement('div'); el.className = 'lvg-label'; el.textContent = word; labelLayer.appendChild(el); labelEls.set(id, el); }
    return el;
  }

  // ── Picking ───────────────────────────────────────────────────────────────
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hoveredId = null;
  function setPtr(ev){ const r = renderer.domElement.getBoundingClientRect(); ptr.x = ((ev.clientX - r.left)/r.width)*2-1; ptr.y = -((ev.clientY - r.top)/r.height)*2+1; }
  function pick(){ ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(pickTargets, false); return h.length ? h[0].object.userData.id : null; }
  function onMove(ev){ setPtr(ev); const id = pick(); if (id !== hoveredId){ hoveredId = id; renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; onHover(id ? graph.byId[id] : null); } }
  let down = null;
  function onDown(ev){ down = [ev.clientX, ev.clientY]; }
  function onUp(ev){ if (!down) return; const moved = Math.hypot(ev.clientX-down[0], ev.clientY-down[1]); down = null; if (moved > 6) return; setPtr(ev); const id = pick(); if (id) onSelect(graph.byId[id]); }
  renderer.domElement.addEventListener('pointermove', onMove, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onUp, { passive: true });

  // ── Camera fly-in focus ────────────────────────────────────────────────────
  let focusing = false;
  const desiredCam = new THREE.Vector3(), desiredTarget = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  function focusNode(id) {
    const o = nodeObjects.get(id); if (!o) return;
    focusing = true; controls.autoRotate = false;
    desiredTarget.copy(o.grp.position);
    // approach from current camera side so the move feels natural
    tmpDir.copy(camera.position).sub(o.grp.position).normalize();
    const dist = Math.max(o.node.radius * 7, 14);
    desiredCam.copy(o.grp.position).add(tmpDir.multiplyScalar(dist));
  }
  function unfocus() {
    focusing = false; controls.autoRotate = true;
    desiredTarget.set(0, 0, 0); desiredCam.copy(HOME);
    flyingBack = true;
  }
  let flyingBack = false;

  // ── Render loop ─────────────────────────────────────────────────────────────
  let raf = 0, running = true, last = performance.now();
  // lv2 U5：后台标签页暂停渲染（visibilitychange）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  const v = new THREE.Vector3();
  const LABEL_DIST = 70, LABEL_CAP = 38;

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const t = now / 1000;

    // camera tween
    if (focusing || flyingBack) {
      camera.position.lerp(desiredCam, 0.07);
      controls.target.lerp(desiredTarget, 0.09);
      if (flyingBack && camera.position.distanceTo(desiredCam) < 1.5) flyingBack = false;
    }
    controls.update();

    // spin + breathe — EVERY planet breathes at its own frequency; lit planets
    // breathe more visibly. Glow opacity, body scale, AND solid color get pulsed
    // so the mastered stars feel ALIVE next to dim dormant ones.
    for (const o of nodeObjects.values()) {
      if (o.spin) o.spinTarget.rotation.y += o.spin * dt;
      const n = o.node;
      const phase = n.breathPhase || 0;
      const speed = (n.breathSpeed || 1) * (n.status === 'mastered' ? 1.35 : n.status === 'unlockable' ? 1.05 : 0.45);
      const s = 0.5 + 0.5 * Math.sin(t * speed + phase);     // 0..1
      const lit = n.status === 'mastered', un = n.status === 'unlockable';

      // Glow opacity breathing — lit pulses dramatically, locked is a faint ember
      const gBase = GLOW_F[n.status];
      const gAmp = lit ? 0.40 : un ? 0.22 : 0.05;
      const gOp = Math.max(0, Math.min(1, gBase + (s - 0.5) * 2 * gAmp));
      for (const gg of o.glows) gg.mat.opacity = gOp;

      // Body scale pulse — lit visibly throbs, locked barely twitches
      const scaleAmp = lit ? 0.075 : un ? 0.055 : 0.020;
      if (o.pop >= 1) o.grp.scale.setScalar(1 + s * scaleAmp);

      // Color pulse on lit planets — brightens at peak of breath
      if (lit) {
        const k = 1 + (s - 0.5) * 0.25;
        for (const mm of o.solids) mm.m.color.copy(mm.baseColor).multiplyScalar(SOLID_COLOR.mastered * k);
      }

      // Newly-lit pop overshoot
      if (o.pop < 1) { o.pop = Math.min(1, o.pop + 0.03); const e = 1 + Math.sin(o.pop * Math.PI) * 0.9; o.grp.scale.setScalar(e); }
    }

    tickBurst(dt);
    tickShockwaves(dt);
    tickEnergy(t);

    // distance labels
    const cands = [];
    for (const o of nodeObjects.values()) {
      const d = camera.position.distanceTo(o.grp.position);
      if (o.node.status === 'mastered' || o.node.id === hoveredId || o.node.id === selectedId || d < LABEL_DIST) cands.push([d, o]);
    }
    cands.sort((a, b) => a[0] - b[0]);
    const show = new Set();
    for (let i = 0; i < Math.min(cands.length, LABEL_CAP); i++) show.add(cands[i][1].node.id);
    for (const [id, el] of labelEls) if (!show.has(id)) el.style.opacity = '0';
    for (const id of show) {
      const o = nodeObjects.get(id);
      v.copy(o.grp.position).project(camera);
      if (v.z > 1) { const ex = labelEls.get(id); if (ex) ex.style.opacity = '0'; continue; }
      const el = ensureLabel(id, o.node.word);
      const x = (v.x * 0.5 + 0.5) * W(), y = (-v.y * 0.5 + 0.5) * H();
      el.style.transform = `translate(-50%,-160%) translate(${x}px,${y}px)`;
      el.dataset.kind = o.node.status;
      const sel = id === hoveredId || id === selectedId;
      el.style.opacity = sel ? '1' : o.node.status === 'mastered' ? '0.82' : '0.5';
    }

    renderer.render(scene, camera);
  }

  let selectedId = null;
  function setSelected(id){ selectedId = id; }

  function resize(){ camera.aspect = W()/H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); }
  const ro = new ResizeObserver(resize); ro.observe(container);
  raf = requestAnimationFrame(frame);

  return {
    focusNode, unfocus, setSelected, burst,
    applyStatuses(){ for (const o of nodeObjects.values()){ const ns = graph.byId[o.node.id].status; if (o.node.status !== ns && ns === 'mastered') o.pop = 0; o.node = graph.byId[o.node.id]; applyStatusDim(o); } buildEdges(); buildEnergyPulses(); },
    setAutoRotate(b){ if (!focusing) controls.autoRotate = b; },
    dispose(){ running = false; cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose(); renderer.dispose(); container.removeChild(renderer.domElement); labelLayer.remove(); },
  };
}

function addBackgroundStars(scene, fieldR) {
  const n = 1400;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const tint = [new THREE.Color('#cfe6ff'), new THREE.Color('#ffe9c7'), new THREE.Color('#ffd2e6'), new THREE.Color('#ffffff')];
  for (let i = 0; i < n; i++) {
    const r = fieldR * (1.1 + Math.random() * 4);
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.cos(ph); pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
    const c = tint[(Math.random()*tint.length)|0]; col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.7, sizeAttenuation: true })));
}
