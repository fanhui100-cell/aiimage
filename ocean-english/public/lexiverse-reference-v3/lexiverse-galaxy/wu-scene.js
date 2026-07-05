/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse WU · Word-Universe scene
   每个单词 = 一颗星。数千星点 + 词族星座连线 + 相机飞行 + 深空辉光。
   三个氛围变体: classic 经典星图 / nebula 词族星云 / atlas 星等图谱
   数据: window.WU_DATA  { words:[[word,ipa,zh,pos,stars,phrases,sent]], edges:[[a,b,t]], families:[[i..]] }
   ───────────────────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ── utils ────────────────────────────────────────────────────────────────
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function glowTexture(size, inner, mid) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(255,255,255,${inner})`);
  g.addColorStop(0.25, `rgba(255,255,255,${mid})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function starMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 1 }, uGlow: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aColor; attribute float aLit;
      varying vec3 vColor; varying float vLit;
      uniform float uTime; uniform float uSize;
      void main(){
        vColor = aColor; vLit = aLit;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.80 + 0.20 * sin(uTime * 1.7 + aPhase * 6.2831);
        gl_PointSize = min(aSize * uSize * tw * (430.0 / -mv.z), 64.0); // 近距离封顶, 避免过曝
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vLit;
      uniform float uGlow; uniform float uOpacity;
      void main(){
        vec2 uv = gl_PointCoord - 0.5; float d = length(uv) * 2.0;
        float core = smoothstep(0.5, 0.0, d);
        float lit1 = clamp(vLit, 0.0, 1.0);
        float gold = step(1.5, vLit);
        float halo = exp(-d * 2.6) * uGlow * (0.55 + lit1 * 0.7 + gold * 0.5);
        float a = clamp(core + halo, 0.0, 1.0) * uOpacity;
        if (a < 0.02) discard;
        vec3 c = vColor * (core * 1.7 + halo) + vec3(1.0) * core * (0.6 + lit1 * 0.55);
        c = mix(c, vec3(1.0, 0.82, 0.42) * (core * 2.2 + halo * 1.4), gold * 0.8);
        gl_FragColor = vec4(c, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

function ambientStars(count, radius) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const sz = new Float32Array(count), ph = new Float32Array(count), lit = new Float32Array(count);
  const rnd = mulberry32(20260612);
  const tints = [[1, 1, 1], [0.78, 0.88, 1], [1, 0.92, 0.78], [0.9, 0.82, 1]];
  for (let i = 0; i < count; i++) {
    const u = rnd(), v = rnd(), w = Math.cbrt(rnd());
    const th = u * Math.PI * 2, phi = Math.acos(2 * v - 1), r = radius * (0.4 + 0.6 * w);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(phi) * 0.8;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(th);
    const t = tints[(rnd() * 4) | 0];
    const tier = rnd();
    const big = tier < 0.28; // 更多背景亮星: 一部分显著更大更亮
    const huge = tier < 0.05;
    const b = huge ? 1.0 : big ? 0.9 + rnd() * 0.1 : 0.6 + rnd() * 0.4;
    col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
    sz[i] = huge ? 9 + rnd() * 6 : big ? 5.2 + rnd() * 4 : 2.0 + rnd() * 3.4; ph[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aLit', new THREE.BufferAttribute(lit, 1));
  const m = starMaterial(); m.uniforms.uGlow.value = 1.0;
  const p = new THREE.Points(g, m); p.frustumCulled = false;
  return p;
}

// drifting dust motes around the galaxy (粒子飘动)
function dustField(count, radius) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const sz = new Float32Array(count), ph = new Float32Array(count);
  const rnd = mulberry32(777);
  const tints = [[0.6, 0.85, 1], [1, 0.85, 0.55], [0.8, 0.7, 1], [0.55, 1, 0.85]];
  for (let i = 0; i < count; i++) {
    const u = rnd(), v = rnd(), w = Math.cbrt(rnd());
    const th = u * Math.PI * 2, phi = Math.acos(2 * v - 1), r = radius * (0.25 + 0.75 * w);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(phi) * 0.75;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(th);
    const t = tints[(rnd() * 4) | 0], b = 0.5 + rnd() * 0.5;
    col[i * 3] = t[0] * b; col[i * 3 + 1] = t[1] * b; col[i * 3 + 2] = t[2] * b;
    sz[i] = 1.4 + rnd() * 3.2; ph[i] = rnd();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; attribute vec3 aColor;
      varying vec3 vColor; uniform float uTime;
      void main(){
        vColor = aColor;
        float t = uTime * 0.06 + aPhase * 6.2831;
        vec3 p = position + vec3(sin(t * 1.3), cos(t * 0.9), sin(t * 0.7 + 1.7)) * (10.0 + aSize * 7.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (320.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; uniform float uOpacity;
      void main(){
        vec2 uv = gl_PointCoord - 0.5; float d = length(uv) * 2.0;
        float a = exp(-d * 3.4) * 0.30 * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p2 = new THREE.Points(g, m); p2.frustumCulled = false;
  return p2;
}

// 多面体行星壳 — 每颗高频词一个独特组合: 外壳 + (可选)内核/轨道环
function makePolyShell(seed) {
  const rnd = mulberry32(seed);
  const lineMat = () => new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 + rnd() * 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
  const SHELLS = [
    () => new THREE.IcosahedronGeometry(1, 0), () => new THREE.IcosahedronGeometry(1, 1),
    () => new THREE.DodecahedronGeometry(1, 0), () => new THREE.OctahedronGeometry(1, 0),
    () => new THREE.OctahedronGeometry(1, 1), () => new THREE.TetrahedronGeometry(1.1, 1),
  ];
  const grp = new THREE.Group();
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(SHELLS[(rnd() * SHELLS.length) | 0]()), lineMat());
  grp.add(shell);
  const r = rnd();
  if (r < 0.3) { // 双层壳
    const inner = new THREE.LineSegments(new THREE.EdgesGeometry(SHELLS[(rnd() * SHELLS.length) | 0]()), lineMat());
    inner.scale.setScalar(0.55); grp.add(inner);
  } else if (r < 0.62) { // 土星环
    const pts = [];
    for (let a = 0; a <= 48; a++) pts.push(new THREE.Vector3(Math.cos(a / 48 * Math.PI * 2) * 1.7, 0, Math.sin(a / 48 * Math.PI * 2) * 1.7));
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat());
    ring.rotation.set(0.35 + rnd() * 0.7, 0, 0.2 + rnd() * 0.6);
    grp.add(ring);
  }
  return grp;
}

// ── palettes / variants ──────────────────────────────────────────────────
export const VARIANTS = {
  nebula:  { zh: '词族星云', bg: '#000010', fogD: 0.00052 },
  classic: { zh: '经典星图', bg: '#000008', fogD: 0.00026 },
};
const PALETTES = {
  classic: ['#FFD66B', '#FFE9A8', '#7EC9FF', '#B79BFF', '#9CFFB0', '#FFA94D', '#FF8FD0', '#9AD8FF', '#F6F2D8'],
  nebula:  ['#7EF9FF', '#5FE0D6', '#82B6FF', '#B79BFF', '#C8B8FF', '#6BE0A0', '#9AD8FF', '#FF8FA8'],
  atlas:   ['#7EF9FF', '#FFD66B', '#9AD8FF'],
};
const EDGE_COLORS = { fam: '#FFD66B', syn: '#5FE0D6', conf: '#FF8FA8' };

// ── main factory ─────────────────────────────────────────────────────────
export function createWordField(container, data, opts = {}) {
  const onSelect = opts.onSelect || (() => {});
  const onHover = opts.onHover || (() => {});
  const tint = opts.tint || null; // galaxy colorTheme hex

  const W = () => container.clientWidth, H = () => container.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);

  // ── bloom 后处理 (梦幻辉光 — Tweaks 可关) ──
  let composer = null, bloomPass = null;
  function ensureComposer() {
    if (composer) return;
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloomPass = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.65, 0.55, 0.22);
    composer.addPass(bloomPass);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 5000);
  let HOME_R = 950;
  camera.position.set(0, 200, HOME_R);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55; controls.minDistance = 14; controls.maxDistance = 3000;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.14; controls.enablePan = false;

  // ── data ───────────────────────────────────────────────────────────────
  const n = data.words.length;
  const famOf = new Int16Array(n).fill(-1);
  data.families.forEach((f, fi) => f.forEach((wi) => { famOf[wi] = fi; }));
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const litArr = new Float32Array(n);
  const projected = new Float32Array(n * 3);
  // 星系空间随词量生长: 词越多空间越大, 保持广袁感一致
  const sizeK = Math.min(2.2, Math.max(1, Math.sqrt(n / 1100)));
  HOME_R = 950 * Math.min(1.7, sizeK);
  camera.position.set(0, 200 * sizeK, HOME_R);
  controls.maxDistance = 3200 * sizeK;
  let fromPositions = null, morphT = 1, variant = null, spreadK = 2.0 * sizeK;
  const colorOf = opts.colorOf || null; // (wi)=>hex 覆盖 (我的星云按分类着色)

  // ── word stars ─────────────────────────────────────────────────────────
  const geo = new THREE.BufferGeometry();
  {
    const sz = new Float32Array(n), ph = new Float32Array(n);
    const rnd = mulberry32(7);
    for (let i = 0; i < n; i++) { sz[i] = 5.5 + data.words[i][4] * 3.2 + rnd() * 1.6; ph[i] = rnd(); }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); // 独立显示缓冲 — 不得与 morph 目标数组 positions 共享
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('aLit', new THREE.BufferAttribute(litArr, 1));
  }
  const material = starMaterial();
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);

  const ambient = ambientStars(6000, 1800);
  scene.add(ambient);

  const dust = dustField(2000, 900);
  scene.add(dust);

  // featured wireframe polyhedra (高频词的多面体行星壳 — 每颗都是独特组合)
  const featured = new THREE.Group();
  const featuredOf = {};
  {
    let count = 0;
    for (let i = 0; i < n && count < 150; i++) {
      const stars = data.words[i][4];
      const h = hashStr(data.words[i][0]);
      if (stars < 4 || (stars === 4 && h % 3 !== 0)) continue;
      const grp = makePolyShell(h);
      grp.userData = { wi: i, rot: 0.08 + (h % 100) / 420 };
      featured.add(grp); featuredOf[i] = grp; count++;
    }
  }
  scene.add(featured);

  // nebula fog sprites per family
  const fog = new THREE.Group();
  {
    const fogTex = glowTexture(256, 0.15, 0.06);
    data.families.forEach((f) => {
      if (f.length < 3) return;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.userData.fam = f;
      fog.add(sp);
    });
  }
  scene.add(fog);

  // selection marker (白色线框壳 + 光环, 像 worduniverse 选中态)
  const marker = new THREE.Group();
  const markerShell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const markerHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(128, 0.45, 0.14), color: 0xffffff, transparent: true, opacity: 0.20, depthWrite: false, blending: THREE.AdditiveBlending }));
  markerHalo.scale.set(3.2, 3.2, 1);
  // 选中星环 (像参考截图里的白色光环)
  const ringPts = [];
  for (let a = 0; a <= 64; a++) ringPts.push(new THREE.Vector3(Math.cos(a / 64 * Math.PI * 2) * 2.0, 0, Math.sin(a / 64 * Math.PI * 2) * 2.0));
  const markerRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  markerRing.rotation.x = 0.42; markerRing.rotation.z = 0.18;
  marker.add(markerRing);
  marker.add(markerShell); marker.add(markerHalo);
  marker.visible = false;
  scene.add(marker);

  let lines = null;       // { fam, syn, conf } LineSegments
  let selLines = null;
  let goldLine = null;    // 金色学习星座 — 已掌握词之间的光路
  let masteredIdx = new Set();
  const GOLD = new THREE.Color('#FFC85A');

  // ── layout ─────────────────────────────────────────────────────────────
  function currentMorph() {
    const out = new Float32Array(n * 3);
    const k = easeInOut(morphT);
    for (let i = 0; i < out.length; i++) out[i] = fromPositions[i] + (positions[i] - fromPositions[i]) * k;
    return out;
  }

  function layout(v) {
    fromPositions = morphT >= 1 ? positions.slice() : currentMorph();
    morphT = variant === null ? 1 : 0;
    variant = v;
    scene.background = new THREE.Color(VARIANTS[v].bg);
    scene.fog = new THREE.FogExp2(VARIANTS[v].bg, VARIANTS[v].fogD);

    const famCenter = [];
    const famRnd = mulberry32(99);
    const S = spreadK; // 间距系数 (Tweaks 可调)
    for (let fi = 0; fi < data.families.length; fi++) {
      const u = famRnd(), vv = famRnd(), w = Math.cbrt(famRnd());
      const th = u * Math.PI * 2, phi = Math.acos(2 * vv - 1);
      const R = ((v === 'nebula' ? 215 : 235) * w + (v === 'nebula' ? 60 : 40)) * S;
      famCenter.push([R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi) * (v === 'classic' ? 0.62 : 0.8), R * Math.sin(phi) * Math.sin(th)]);
    }
    for (let i = 0; i < n; i++) {
      const w = data.words[i];
      const rnd = mulberry32(hashStr(w[0] + ':' + v));
      const u = rnd(), vv = rnd(), q = rnd();
      const th = u * Math.PI * 2, phi = Math.acos(2 * vv - 1);
      const fi = famOf[i];
      let x, y, z;
      if (v === 'atlas') {
        // 星等轨道环 — 按词频分 5 层扁平同心环 (一眼区别于其它布局)
        const ringR = ([330, 272, 212, 150, 88][w[4] - 1] + (q - 0.5) * 26) * S;
        const a = u * Math.PI * 2;
        x = Math.cos(a) * ringR; z = Math.sin(a) * ringR;
        y = (vv - 0.5) * 26;
      } else if (fi >= 0) {
        const c = famCenter[fi];
        const spread = (v === 'nebula' ? 13 + rnd() * 22 : 22 + rnd() * 38) * (0.8 + S * 0.35);
        x = c[0] + (rnd() - 0.5) * 2 * spread;
        y = c[1] + (rnd() - 0.5) * 1.6 * spread;
        z = c[2] + (rnd() - 0.5) * 2 * spread;
      } else {
        const R = 300 * S * Math.cbrt(0.05 + 0.95 * q);
        x = R * Math.sin(phi) * Math.cos(th); y = R * Math.cos(phi) * (v === 'classic' ? 0.6 : 0.78); z = R * Math.sin(phi) * Math.sin(th);
      }
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    }
    applyColors(v);
    buildEdges();
    rebuildGold();
    placeAux();
    if (morphT >= 1) { geo.attributes.position.array.set(positions); geo.attributes.position.needsUpdate = true; }
  }

  function applyColors(v) {
    const pal = PALETTES[v].map((h) => new THREE.Color(h));
    const tintC = tint ? new THREE.Color(tint) : null;
    for (let i = 0; i < n; i++) {
      const w = data.words[i];
      let c;
      if (v === 'atlas') c = (w[4] >= 4 ? pal[1] : w[4] === 3 ? pal[2] : pal[0]).clone();
      else { const fi = famOf[i]; c = pal[(fi >= 0 ? fi : hashStr(w[0])) % pal.length].clone(); }
      if (colorOf) { const hx = colorOf(i); if (hx) c = new THREE.Color(hx); }
      if (tintC && !colorOf) c.lerp(tintC, 0.2);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      if (featuredOf[i]) featuredOf[i].traverse((o) => { if (o.material) o.material.color.copy(c); });
    }
    geo.attributes.aColor.needsUpdate = true;
  }

  function buildEdges() {
    if (lines) { scene.remove(lines.group); lines.group.traverse((o) => o.geometry && o.geometry.dispose()); }
    const segsByKind = { fam: [], syn: [], conf: [] };
    data.families.forEach((f) => { for (let i = 1; i < f.length; i++) segsByKind.fam.push([f[0], f[i]]); });
    data.edges.forEach((e) => {
      if (e[2] === 0) segsByKind.fam.push([e[0], e[1]]);
      else if (e[2] === 1) segsByKind.syn.push([e[0], e[1]]);
      else segsByKind.conf.push([e[0], e[1]]);
    });
    const make = (segs, hex) => {
      if (!segs.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs.length * 6), 3));
      const ls = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(hex), transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
      ls.userData.segs = segs; ls.frustumCulled = false;
      return ls;
    };
    const group = new THREE.Group();
    lines = { group, fam: make(segsByKind.fam, EDGE_COLORS.fam), syn: make(segsByKind.syn, EDGE_COLORS.syn), conf: make(segsByKind.conf, EDGE_COLORS.conf) };
    ['fam', 'syn', 'conf'].forEach((k) => lines[k] && group.add(lines[k]));
    scene.add(group);
    refreshEdges();
  }
  // 金色星座: 用最近邻链把所有已掌握的词连成一条发光路径
  function rebuildGold() {
    if (goldLine) { scene.remove(goldLine); goldLine.geometry.dispose(); goldLine = null; }
    const arr = [...masteredIdx];
    if (arr.length < 2) return;
    const d2 = (a, b) => {
      const dx = positions[a * 3] - positions[b * 3], dy = positions[a * 3 + 1] - positions[b * 3 + 1], dz = positions[a * 3 + 2] - positions[b * 3 + 2];
      return dx * dx + dy * dy + dz * dz;
    };
    const segs = [];
    const used = new Set([arr[0]]);
    let cur = arr[0];
    while (used.size < arr.length) {
      let best = -1, bd = Infinity;
      for (const o of arr) { if (used.has(o)) continue; const d = d2(cur, o); if (d < bd) { bd = d; best = o; } }
      segs.push([cur, best]); used.add(best); cur = best;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs.length * 6), 3));
    goldLine = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    goldLine.userData.segs = segs;
    goldLine.frustumCulled = false;
    scene.add(goldLine);
    refreshSegLine(goldLine, positions);
  }

  function refreshSegLine(ls, cur) {
    const arr = ls.geometry.attributes.position.array;
    ls.userData.segs.forEach((s, i) => {
      arr[i * 6] = cur[s[0] * 3]; arr[i * 6 + 1] = cur[s[0] * 3 + 1]; arr[i * 6 + 2] = cur[s[0] * 3 + 2];
      arr[i * 6 + 3] = cur[s[1] * 3]; arr[i * 6 + 4] = cur[s[1] * 3 + 1]; arr[i * 6 + 5] = cur[s[1] * 3 + 2];
    });
    ls.geometry.attributes.position.needsUpdate = true;
  }
  function refreshEdges() {
    const cur = morphT >= 1 ? positions : currentMorph();
    ['fam', 'syn', 'conf'].forEach((k) => { if (lines && lines[k]) refreshSegLine(lines[k], cur); });
    if (goldLine) refreshSegLine(goldLine, cur);
  }
  function placeAux() {
    featured.children.forEach((m) => {
      const wi = m.userData.wi;
      m.position.set(positions[wi * 3], positions[wi * 3 + 1], positions[wi * 3 + 2]);
      m.scale.setScalar(2.4 + data.words[wi][4] * 0.7);
    });
    fog.children.forEach((sp) => {
      const f = sp.userData.fam;
      let x = 0, y = 0, z = 0, mc = 0;
      f.forEach((wi) => { x += positions[wi * 3]; y += positions[wi * 3 + 1]; z += positions[wi * 3 + 2]; if (masteredIdx.has(wi)) mc++; });
      sp.position.set(x / f.length, y / f.length, z / f.length);
      // 词族星云按掌握度镞金
      const ratio = mc / f.length;
      sp.material.color.setRGB(colors[f[0] * 3], colors[f[0] * 3 + 1], colors[f[0] * 3 + 2]).lerp(GOLD, ratio * 0.85);
      sp.material.opacity = 0.45 + ratio * 0.3;
      sp.scale.setScalar(38 + f.length * 9);
    });
  }

  function setSpread(k) {
    const next = k * sizeK;
    if (Math.abs(next - spreadK) < 0.01) return;
    spreadK = next;
    if (variant) { layout(variant); applyConfig({}); }
  }

  // ── config (tweaks) ────────────────────────────────────────────────────
  let cfg = { starSize: 1, glow: 1.25, lineStrength: 0, showConfusable: false, drift: true, labelDensity: 14, dust: true, bloom: true };
  function applyConfig(next) {
    cfg = Object.assign({}, cfg, next);
    material.uniforms.uSize.value = cfg.starSize;
    material.uniforms.uGlow.value = cfg.glow;
    const base = variant === 'nebula' ? 0.03 : variant === 'atlas' ? 0.03 : 0.075;
    if (lines) {
      if (lines.fam) lines.fam.material.opacity = base * cfg.lineStrength * 2;
      if (lines.syn) lines.syn.material.opacity = (variant === 'atlas' ? 0.09 : 0.055) * cfg.lineStrength * 2;
      if (lines.conf) { lines.conf.visible = !!cfg.showConfusable; lines.conf.material.opacity = 0.03 * cfg.lineStrength * 2; }
    }
    fog.visible = variant === 'nebula';
    dust.visible = cfg.dust !== false;
    if (goldLine) goldLine.material.opacity = 0.55 * Math.min(1.5, cfg.lineStrength);
    controls.autoRotate = !!cfg.drift;
    return cfg;
  }

  function setLit(litSet, masteredSet) {
    masteredIdx = new Set();
    for (let i = 0; i < n; i++) {
      const w = data.words[i][0];
      const m = masteredSet && masteredSet.has(w);
      if (m) masteredIdx.add(i);
      litArr[i] = m ? 2 : litSet.has(w) ? 1 : 0;
    }
    geo.attributes.aLit.needsUpdate = true;
    rebuildGold();
    placeAux();
  }

  // ── selection / fly ────────────────────────────────────────────────────
  let selected = -1;
  function select(wi) {
    selected = wi == null ? -1 : wi;
    if (selLines) { scene.remove(selLines); selLines.geometry.dispose(); selLines = null; }
    if (selected < 0) { marker.visible = false; return; }
    marker.visible = true;
    marker.position.set(positions[wi * 3], positions[wi * 3 + 1], positions[wi * 3 + 2]);
    marker.scale.setScalar(2.4 + data.words[wi][4] * 0.55);
    const segs = [];
    if (famOf[wi] >= 0) data.families[famOf[wi]].forEach((o) => { if (o !== wi) segs.push([wi, o]); });
    data.edges.forEach((e) => { if (e[0] === wi) segs.push([wi, e[1]]); else if (e[1] === wi) segs.push([wi, e[0]]); });
    if (segs.length) {
      const pos = new Float32Array(segs.length * 6);
      segs.forEach((s, i) => {
        pos[i * 6] = positions[s[0] * 3]; pos[i * 6 + 1] = positions[s[0] * 3 + 1]; pos[i * 6 + 2] = positions[s[0] * 3 + 2];
        pos[i * 6 + 3] = positions[s[1] * 3]; pos[i * 6 + 4] = positions[s[1] * 3 + 1]; pos[i * 6 + 5] = positions[s[1] * 3 + 2];
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      selLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
      selLines.frustumCulled = false;
      scene.add(selLines);
    }
  }

  // 空间近邻 (关联词汇: 同区星邻)
  function nearbyWords(wi, k) {
    const x = positions[wi * 3], y = positions[wi * 3 + 1], z = positions[wi * 3 + 2];
    const out = [];
    for (let i = 0; i < n; i++) {
      if (i === wi) continue;
      const dx = positions[i * 3] - x, dy = positions[i * 3 + 1] - y, dz = positions[i * 3 + 2] - z;
      out.push([dx * dx + dy * dy + dz * dz, i]);
    }
    out.sort((a, b) => a[0] - b[0]);
    return out.slice(0, k || 6).map((e) => e[1]);
  }

  let tween = null;
  function flyTo(wi, dist) {
    const target = new THREE.Vector3(positions[wi * 3], positions[wi * 3 + 1], positions[wi * 3 + 2]);
    flyToPoint(target, dist || 80);
  }
  function flyToPoint(target, dist, dur) {
    const dir = camera.position.clone().sub(controls.target);
    if (dir.lengthSq() < 1) dir.set(0, 30, 120);
    dir.normalize().multiplyScalar(dist);
    tween = { t: 0, dur: dur || 1.5, fromT: controls.target.clone(), toT: target.clone(), fromC: camera.position.clone(), toC: target.clone().add(dir) };
  }
  function resetView() { flyToPoint(new THREE.Vector3(0, 0, 0), HOME_R); }

  // 开场飞入: 从深空远处推进 + 星点淡入
  let introT = 1;
  function intro() {
    introT = 0;
    material.uniforms.uOpacity.value = 0;
    ambient.material.uniforms.uOpacity.value = 0;
    dust.material.uniforms.uOpacity.value = 0;
    const a = -1.15; // 进场方位
    camera.position.set(Math.sin(a) * 2600 * sizeK, 720 * sizeK, Math.cos(a) * 2600 * sizeK);
    controls.target.set(0, 0, 0);
    flyToPoint(new THREE.Vector3(0, 0, 0), HOME_R, 2.8);
  }

  // ── picking (screen-space nearest) ─────────────────────────────────────
  function nearest(sx, sy, maxPx) {
    let best = -1, bd = maxPx * maxPx;
    for (let i = 0; i < n; i++) {
      if (!projected[i * 3 + 2]) continue;
      const dx = projected[i * 3] - sx, dy = projected[i * 3 + 1] - sy;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  let downX = 0, downY = 0, hovered = -1;
  renderer.domElement.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) return;
    const r = renderer.domElement.getBoundingClientRect();
    const wi = nearest(e.clientX - r.left, e.clientY - r.top, 26);
    if (wi >= 0) onSelect(wi);
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    const wi = nearest(e.clientX - r.left, e.clientY - r.top, 22);
    if (wi !== hovered) { hovered = wi; onHover(wi); renderer.domElement.style.cursor = wi >= 0 ? 'pointer' : 'grab'; }
  });

  // ── frame loop ─────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let disposed = false;
  const frameCbs = [];
  let lastFrameAt = 0;
  function animate() {
    if (disposed) return;
    requestAnimationFrame(animate);
    frame();
  }
  function frame() {
    lastFrameAt = performance.now();
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    material.uniforms.uTime.value = t;
    ambient.material.uniforms.uTime.value = t;
    dust.material.uniforms.uTime.value = t;
    if (introT < 1) {
      introT = Math.min(1, introT + dt / 2.2);
      const k = easeInOut(introT);
      material.uniforms.uOpacity.value = k;
      ambient.material.uniforms.uOpacity.value = k;
      dust.material.uniforms.uOpacity.value = k;
    }

    if (morphT < 1) {
      morphT = Math.min(1, morphT + dt / 1.1);
      geo.attributes.position.array.set(morphT >= 1 ? positions : currentMorph());
      geo.attributes.position.needsUpdate = true;
      refreshEdges(); placeAux();
      if (selected >= 0) select(selected);
    }
    featured.children.forEach((m) => { m.rotation.y += m.userData.rot * dt; m.rotation.x += m.userData.rot * 0.4 * dt; });
    if (marker.visible) { markerShell.scale.setScalar(1 + 0.1 * Math.sin(t * 3.2)); marker.rotation.y += dt * 0.5; }

    if (tween) {
      tween.t += dt / tween.dur;
      const k = easeInOut(Math.min(1, tween.t));
      controls.target.lerpVectors(tween.fromT, tween.toT, k);
      camera.position.lerpVectors(tween.fromC, tween.toC, k);
      if (tween.t >= 1) tween = null;
    }
    controls.update();

    // project word positions to screen space
    const m4 = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const v = new THREE.Vector3();
    const cur = geo.attributes.position.array;
    const w = W(), h = H();
    for (let i = 0; i < n; i++) {
      v.set(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]).applyMatrix4(m4);
      if (v.z < -1 || v.z > 1) { projected[i * 3 + 2] = 0; continue; }
      projected[i * 3] = (v.x * 0.5 + 0.5) * w;
      projected[i * 3 + 1] = (-v.y * 0.5 + 0.5) * h;
      projected[i * 3 + 2] = 1 - (v.z * 0.5 + 0.5) * 0.999;
    }
    frameCbs.forEach((cb) => cb(t, dt));
    if (cfg.bloom !== false) { ensureComposer(); composer.render(); }
    else renderer.render(scene, camera);
  }
  requestAnimationFrame(animate); // defer first frame until caller has run layout()
  // keep the scene alive when rAF is throttled (hidden iframe / background tab)
  const aliveTimer = setInterval(() => {
    if (!disposed && performance.now() - lastFrameAt > 700) frame();
  }, 750);

  window.addEventListener('resize', () => {
    camera.aspect = W() / H(); camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    if (composer) composer.setSize(W(), H());
  });

  return {
    layout, applyConfig, setLit, select, flyTo, resetView, nearest, projected, renderOnce: frame, intro, setSpread, nearbyWords,
    __geo: geo, __points: points, __scene: scene,
    camera, controls, get variant() { return variant; }, get hovered() { return hovered; },
    onFrame: (cb) => frameCbs.push(cb),
    wordPos: (wi) => new THREE.Vector3(positions[wi * 3], positions[wi * 3 + 1], positions[wi * 3 + 2]),
    distTo: (wi) => camera.position.distanceTo(new THREE.Vector3(positions[wi * 3], positions[wi * 3 + 1], positions[wi * 3 + 2])),
    dispose: () => { disposed = true; clearInterval(aliveTimer); renderer.dispose(); },
  };
}
