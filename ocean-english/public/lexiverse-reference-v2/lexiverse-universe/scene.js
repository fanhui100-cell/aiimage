/* Lexiverse Universe · spiral-galaxy field (vanilla Three.js)
   ─────────────────────────────────────────────────────────────────────────
   42 galaxies, each a real PARTICLE SPIRAL (arms + core bulge + tilt + spin),
   scattered randomly across a huge volume. ~8,500 drifting background
   particles read as distant planets/stars. Full free camera: orbit, pan,
   zoom across the whole space.

   Public API is unchanged from the Stage-A scene so ui.js keeps working:
     createUniverse(container, { onSelectGalaxy, onHoverGalaxy })
       → { focusGalaxy(id), clearFocus(), setFilteredGalaxies(set), dispose() }
   ───────────────────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const C = window.LexiverseCatalog;
const TAU = Math.PI * 2;
const WHITE = new THREE.Color('#ffffff');

export function createUniverse(container, opts = {}) {
  const onSelectGalaxy = opts.onSelectGalaxy || (() => {});
  const onHoverGalaxy = opts.onHoverGalaxy || (() => {});

  const W = () => container.clientWidth, H = () => container.clientHeight;
  const PR = () => Math.min(window.devicePixelRatio, 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(PR());
  renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = 'grab';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04040a');
  scene.fog = new THREE.FogExp2('#04040a', 0.00006);

  const HOME = new THREE.Vector3(0, 620, 3050);
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 22000);
  camera.position.copy(HOME);

  // ── controls: full free roam (orbit + pan + zoom) ───────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55; controls.zoomSpeed = 0.9; controls.panSpeed = 0.7;
  controls.enablePan = true; controls.screenSpacePanning = true;
  controls.minDistance = 24; controls.maxDistance = 9500;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.1;

  // ── shared particle shader (round soft points, optional drift) ──────────
  const sharedTime = { value: 0 };
  const sharedPR = { value: PR() };
  function makePointsMaterial({ opacity = 1, drift = 0, sizeScale = 1, blending = THREE.AdditiveBlending }) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: sharedTime, uPixelRatio: sharedPR,
        uOpacity: { value: opacity }, uMute: { value: 1 },
        uDrift: { value: drift }, uSizeScale: { value: sizeScale },
      },
      vertexShader: `
        attribute vec3 aColor; attribute float aSize; attribute float aPhase;
        uniform float uTime, uPixelRatio, uDrift, uSizeScale;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec3 p = position;
          p.x += sin(uTime * 0.07 + aPhase) * uDrift;
          p.y += cos(uTime * 0.055 + aPhase * 1.3) * uDrift;
          p.z += sin(uTime * 0.045 + aPhase * 0.7) * uDrift;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uSizeScale * uPixelRatio * (320.0 / max(-mv.z, 1.0));
        }`,
      fragmentShader: `
        precision mediump float;
        varying vec3 vColor;
        uniform float uOpacity, uMute;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float a = smoothstep(0.5, 0.0, d);
          a *= a;
          gl_FragColor = vec4(vColor, a * uOpacity * uMute);
        }`,
      transparent: true, depthWrite: false, depthTest: true, blending,
    });
  }

  // ── faint nebula backdrops (deep, low-opacity — adds depth) ─────────────
  addNebulaBackdrops(scene);

  // ── background particle field (drifting, planet-like sizes) ─────────────
  const bgMat = addBackgroundField(scene, makePointsMaterial);

  // ── galaxy spirals ──────────────────────────────────────────────────────
  const haloTex = makeGlowTexture();
  const positions = distributeGalaxies(C.GALAXIES);
  const nodeObjects = new Map();
  const pickTargets = [];

  for (const g of C.GALAXIES) {
    const seed = hashStr(g.id);
    const rnd = mulberry32(seed);
    const params = spiralParamsFor(g, rnd);
    const color = new THREE.Color(g.colorTheme || '#7EF9FF');

    const grp = new THREE.Group();
    const pos = positions.get(g.id);
    grp.position.set(pos.x, pos.y, pos.z);

    // tilt pivot holds the spinning disk so the spin axis is the disk normal
    const pivot = new THREE.Group();
    pivot.rotation.set(params.tiltX, rnd() * TAU, params.tiltZ);
    grp.add(pivot);

    const diskGeo = buildSpiralGeometry(params, color, rnd);
    const diskMat = makePointsMaterial({ opacity: params.opacity, drift: 0, sizeScale: 1 });
    const disk = new THREE.Points(diskGeo, diskMat);
    pivot.add(disk);

    // soft central bloom (also the hover glow) — not tilted, stays facing cam
    const haloMat = new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.setScalar(params.radius * 1.7);
    grp.add(halo);

    // invisible pick sphere (raycastable even though not drawn)
    const pickSphere = new THREE.Mesh(
      new THREE.SphereGeometry(params.radius * 0.92, 8, 6),
      new THREE.MeshBasicMaterial(),
    );
    pickSphere.visible = false;
    pickSphere.userData.id = g.id;
    grp.add(pickSphere);
    pickTargets.push(pickSphere);

    scene.add(grp);
    nodeObjects.set(g.id, {
      galaxy: g, grp, pivot, disk, diskMat, halo, haloMat,
      radius: params.radius, spinSpeed: params.spinSpeed,
      breathPhase: (seed % 1000) / 1000 * TAU,
      breathSpeed: 0.4 + (hashStr(g.id + '_b') % 1000) / 1000 * 0.5,
    });
  }

  // ── camera tween ─────────────────────────────────────────────────────────
  let currentGalaxyId = null;
  const desiredCam = new THREE.Vector3().copy(HOME);
  const desiredTgt = new THREE.Vector3(0, 0, 0);
  let tweening = false;

  // any manual interaction cancels an in-flight camera tween — without this,
  // an unfinished fly-back keeps lerping toward HOME and "rebounds" the view.
  controls.addEventListener('start', () => { tweening = false; });

  function focusGalaxy(id) {
    currentGalaxyId = id;
    const o = nodeObjects.get(id);
    if (!o) return;
    const p = o.grp.position;
    desiredTgt.copy(p);
    const offset = camera.position.clone().sub(p);
    if (offset.length() < 1) offset.set(0, 0.4, 1);
    offset.normalize().multiplyScalar(Math.max(o.radius * 3.6, 120));
    offset.y += o.radius * 0.9;
    desiredCam.copy(p).add(offset);
    controls.autoRotate = false;
    tweening = true;
  }
  function clearFocus() {
    currentGalaxyId = null;
    desiredCam.copy(HOME); desiredTgt.set(0, 0, 0);
    controls.autoRotate = true;
    tweening = true;
  }

  // ── picking + hover ──────────────────────────────────────────────────────
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hoveredId = null;
  function setPtr(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }
  function pick() {
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(pickTargets, false);
    for (const h of hits) {
      const id = h.object.userData.id;
      const o = nodeObjects.get(id);
      if (o && o.grp.visible) return id;
    }
    return null;
  }
  function onMove(ev) {
    setPtr(ev);
    const id = pick();
    if (id !== hoveredId) {
      hoveredId = id;
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      onHoverGalaxy(id ? C.GALAXIES.find(g => g.id === id) : null);
    }
  }
  let down = null;
  function onDown(ev) { down = [ev.clientX, ev.clientY]; }
  function onUp(ev) {
    if (!down) return;
    const moved = Math.hypot(ev.clientX - down[0], ev.clientY - down[1]);
    down = null;
    if (moved > 6) return; // it was a drag, not a click
    setPtr(ev);
    const id = pick();
    if (id) { onSelectGalaxy(C.GALAXIES.find(x => x.id === id)); focusGalaxy(id); }
  }
  renderer.domElement.addEventListener('pointermove', onMove, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onUp, { passive: true });

  // ── projected HTML labels (hovered + selected only) ─────────────────────
  const labelLayer = document.createElement('div');
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(labelLayer);
  const labelEls = new Map();
  function ensureLabel(id) {
    let el = labelEls.get(id);
    if (!el) {
      const o = nodeObjects.get(id);
      el = document.createElement('div');
      el.className = 'lv-label';
      el.innerHTML = `<b style="color:${o.galaxy.colorTheme}">${o.galaxy.title}</b><br><span>${o.galaxy.titleZh}</span>`;
      labelLayer.appendChild(el);
      labelEls.set(id, el);
    }
    return el;
  }

  // ── render loop ──────────────────────────────────────────────────────────
  let raf = 0, running = true;
  const v = new THREE.Vector3();
  let last = performance.now();
  // lv2 U5：后台标签页暂停渲染（visibilitychange）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const t = now / 1000;
    sharedTime.value = t;

    if (tweening) {
      camera.position.lerp(desiredCam, 0.045);
      controls.target.lerp(desiredTgt, 0.06);
      if (camera.position.distanceTo(desiredCam) < 2) tweening = false;
    }
    controls.update();

    for (const o of nodeObjects.values()) {
      // each galaxy spins around its own disk normal
      o.disk.rotation.y += o.spinSpeed * dt;

      const s = 0.5 + 0.5 * Math.sin(t * o.breathSpeed + o.breathPhase);
      const isSelected = currentGalaxyId === o.galaxy.id;
      const isHovered = hoveredId === o.galaxy.id;
      const isMuted = currentGalaxyId && !isSelected;

      const mute = isMuted ? 0.32 : (isHovered ? 1.25 : 1);
      o.diskMat.uniforms.uMute.value += (mute - o.diskMat.uniforms.uMute.value) * 0.15;

      const haloBase = isSelected ? 0.62 : isHovered ? 0.6 : 0.34;
      o.haloMat.opacity = (haloBase + (s - 0.5) * 0.18) * (isMuted ? 0.4 : 1);
      const hsc = o.radius * 1.7 * (isHovered ? 1.18 : 1) * (1 + s * 0.05);
      o.halo.scale.set(hsc, hsc, 1);

      const gs = isHovered ? 1.06 : 1;
      o.grp.scale.x += (gs - o.grp.scale.x) * 0.15;
      o.grp.scale.y = o.grp.scale.z = o.grp.scale.x;
    }

    // labels
    const wanted = new Set();
    if (hoveredId) wanted.add(hoveredId);
    if (currentGalaxyId) wanted.add(currentGalaxyId);
    for (const [id, el] of labelEls) if (!wanted.has(id)) el.style.opacity = '0';
    for (const id of wanted) {
      const o = nodeObjects.get(id);
      const el = ensureLabel(id);
      v.copy(o.grp.position); v.y += o.radius * 1.15; v.project(camera);
      if (v.z > 1) { el.style.opacity = '0'; continue; }
      const x = (v.x * 0.5 + 0.5) * W();
      const y = (-v.y * 0.5 + 0.5) * H();
      el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`;
      el.style.opacity = '1';
    }

    renderer.render(scene, camera);
  }

  function resize() {
    sharedPR.value = PR(); renderer.setPixelRatio(PR());
    camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H());
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  raf = requestAnimationFrame(frame);

  return {
    focusGalaxy, clearFocus,
    setFilteredGalaxies(visibleSet) {
      for (const o of nodeObjects.values()) {
        o.grp.visible = visibleSet ? visibleSet.has(o.galaxy.id) : true;
      }
    },
    dispose() {
      running = false; cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose(); renderer.dispose();
      container.removeChild(renderer.domElement); labelLayer.remove();
    },
  };
}

/* ── galaxy placement: random, separated, in a flattened huge volume ─────── */
function distributeGalaxies(galaxies) {
  const rnd = mulberry32(0x5eed1234);
  const placed = [];
  const out = new Map();
  const R_XZ = 2150, R_Y = 820, MIN_DIST = 235;
  for (const g of galaxies) {
    let p = null;
    for (let tries = 0; tries < 90; tries++) {
      // sample in a flattened ball (wide in XZ, shallow in Y)
      const u = Math.cbrt(rnd());
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      const cand = {
        x: Math.sin(ph) * Math.cos(th) * R_XZ * u,
        y: Math.cos(ph) * R_Y * u,
        z: Math.sin(ph) * Math.sin(th) * R_XZ * u,
      };
      let ok = true;
      for (const q of placed) {
        if (Math.hypot(cand.x - q.x, cand.y - q.y, cand.z - q.z) < MIN_DIST) { ok = false; break; }
      }
      if (ok || tries === 89) { p = cand; break; }
    }
    placed.push(p);
    out.set(g.id, p);
  }
  return out;
}

/* ── per-galaxy spiral parameters (style varies by visualType + seed) ───── */
function spiralParamsFor(g, rnd) {
  const p = {
    count: 1250, bulge: 230, radius: 46 + rnd() * 24, arms: 2, spin: 5.4,
    armSpread: 0.30, radialJitter: 0.05, thickness: 3.4, coreBias: 2.2,
    pointSize: 5.4, opacity: 0.95,
  };
  switch (g.visualType) {
    case 'spiral':    p.arms = 2; p.spin = 5.8; p.armSpread = 0.26; break;
    case 'wireframe': p.arms = 3; p.spin = 6.6; p.armSpread = 0.20; p.pointSize = 4.6; p.radius *= 0.9; p.opacity = 1; break;
    case 'cluster':   p.arms = 4; p.spin = 3.3; p.armSpread = 0.52; p.thickness = 5.2; p.coreBias = 1.7; p.radius *= 1.05; break;
    case 'nebula':    p.arms = 2; p.spin = 4.0; p.armSpread = 0.72; p.thickness = 6.4; p.pointSize = 8.2; p.opacity = 0.72; p.radius *= 1.18; p.coreBias = 1.4; break;
    case 'binary':    p.arms = 2; p.spin = 5.0; break;
    default: break;
  }
  p.spin *= 0.88 + rnd() * 0.28;
  p.arms = Math.max(2, p.arms + (rnd() < 0.25 ? 1 : 0));
  p.tiltX = (rnd() - 0.5) * 1.25;
  p.tiltZ = (rnd() - 0.5) * 1.25;
  p.spinSpeed = (0.05 + rnd() * 0.07) * (rnd() < 0.5 ? 1 : -1);
  return p;
}

/* ── build a spiral disk + core bulge as a particle geometry ────────────── */
function buildSpiralGeometry(p, armColor, rnd) {
  const total = p.count + p.bulge;
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const siz = new Float32Array(total);
  const pha = new Float32Array(total);

  const coreColor = armColor.clone().lerp(WHITE, 0.62).multiplyScalar(1.18);
  const edgeColor = armColor.clone().multiplyScalar(0.62);
  const twist = p.spin / p.radius;
  const tmp = new THREE.Color();
  let k = 0;

  // spiral arms
  for (let i = 0; i < p.count; i++) {
    const t = Math.pow(rnd(), p.coreBias);            // 0..1, concentrated to center
    const r = t * p.radius;
    const armAng = (i % p.arms) / p.arms * TAU;
    let ang = armAng + r * twist + gauss(rnd) * p.armSpread * (1.1 - t * 0.5);
    const jx = gauss(rnd) * p.radialJitter * p.radius;
    const jz = gauss(rnd) * p.radialJitter * p.radius;
    pos[k * 3]     = Math.cos(ang) * r + jx;
    pos[k * 3 + 1] = gauss(rnd) * p.thickness * (1.0 - t * 0.6);
    pos[k * 3 + 2] = Math.sin(ang) * r + jz;

    tmp.copy(coreColor).lerp(armColor, smoothstep(0.04, 0.6, t)).lerp(edgeColor, smoothstep(0.6, 1.0, t));
    tmp.offsetHSL(0, 0, (rnd() - 0.5) * 0.06);
    col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
    siz[k] = p.pointSize * (0.65 + (1 - t) * 0.95) * (0.7 + rnd() * 0.6);
    pha[k] = rnd() * TAU;
    k++;
  }

  // central bulge (bright, near-spherical)
  for (let i = 0; i < p.bulge; i++) {
    const rb = Math.pow(rnd(), 2) * p.radius * 0.2;
    const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
    pos[k * 3]     = Math.sin(ph) * Math.cos(th) * rb;
    pos[k * 3 + 1] = Math.cos(ph) * rb * 0.7;
    pos[k * 3 + 2] = Math.sin(ph) * Math.sin(th) * rb;
    tmp.copy(coreColor).offsetHSL(0, 0, (rnd() - 0.5) * 0.04);
    col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
    siz[k] = p.pointSize * (1.0 + rnd() * 1.1);
    pha[k] = rnd() * TAU;
    k++;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));
  return geo;
}

/* ── ~8,500 background particles (distant planets/stars), GPU drift ─────── */
function addBackgroundField(scene, makeMat) {
  const n = 17000;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const siz = new Float32Array(n);
  const pha = new Float32Array(n);
  const tints = ['#cfe0ff', '#ffe6c2', '#ffd0e2', '#d6fbff', '#ffffff', '#c9d4ff', '#ffeede'].map(h => new THREE.Color(h));
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = 700 + Math.pow(Math.random(), 0.7) * 6800;
    const th = Math.random() * TAU, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = Math.sin(ph) * Math.cos(th) * r;
    pos[i * 3 + 1] = Math.cos(ph) * r * 0.72;
    pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    tmp.copy(tints[(Math.random() * tints.length) | 0]);
    const planet = Math.random() < 0.06;       // a few read as bigger "distant planets"
    if (!planet) tmp.multiplyScalar(0.55 + Math.random() * 0.5);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    siz[i] = planet ? 9 + Math.random() * 14 : 1.4 + Math.random() * 3.6;
    pha[i] = Math.random() * TAU;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));
  const mat = makeMat({ opacity: 0.85, drift: 7.5, sizeScale: 1 });
  scene.add(new THREE.Points(geo, mat));
  return mat;
}

/* ── two faint nebula clouds far behind everything (depth) ──────────────── */
function addNebulaBackdrops(scene) {
  const tex = makeNebulaTexture();
  const clouds = [
    { pos: [-2100, 350, -4200], color: '#4a36b0', scale: 8200, op: 0.55 },
    { pos: [2600, -560, -3000], color: '#1f6f80', scale: 6800, op: 0.46 },
  ];
  for (const c of clouds) {
    const m = new THREE.SpriteMaterial({ map: tex, color: c.color, transparent: true, opacity: c.op, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    const sp = new THREE.Sprite(m);
    sp.position.set(c.pos[0], c.pos[1], c.pos[2]);
    sp.scale.set(c.scale, c.scale, 1);
    sp.renderOrder = -10;
    scene.add(sp);
  }
}
function makeNebulaTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, s, s);
  const rnd = mulberry32(0x4e454255);
  for (let i = 0; i < 20; i++) {
    const x = s * 0.5 + (rnd() - 0.5) * s * 0.62;
    const y = s * 0.5 + (rnd() - 0.5) * s * 0.62;
    const r = s * (0.12 + rnd() * 0.24);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.04 + rnd() * 0.08;
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  }
  return new THREE.CanvasTexture(c);
}

/* ── helpers ──────────────────────────────────────────────────────────────*/
function makeGlowTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
function gauss(rnd) { return (rnd() + rnd() + rnd() + rnd() - 2) / 1.4; }
function smoothstep(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
