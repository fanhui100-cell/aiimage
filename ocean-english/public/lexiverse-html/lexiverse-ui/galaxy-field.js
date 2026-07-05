/* ═══════════════════════════════════════════════════════════════════════════
   Lexiverse · Galaxy Field engine  (Spatial Sector Model)
   ─────────────────────────────────────────────────────────────────────────
   ONE galaxy = ONE continuous 3D field. It contains several spaced-out Sector
   Clusters, each carrying 200–500 word planets. A sector is a *region of
   space*, never a separate page. The user drags / zooms / pans / clicks
   sector labels / searches to move between sectors — the camera flies, the
   page never switches.

   Zoom-driven LOD (continuous):
     Far Sector     → nebula glow + label, planets merged to faint glow
     Near Sector    → low-detail planets, a few featured labels, simplified
     Focused Sector → full planets, learning state, labels, relationship lines

   Camera states the host page picks via opts.initialMode + the returned API:
     Galaxy Overview · Sector Cruise · Sector Focus · Planet Inspect

   API: createGalaxyField(container, {
     initialMode, focusSector, focusPlanet,
     onSelectPlanet(planet|null), onSectorChange(sector|null), onLOD(name)
   }) → { flyToSector, flyToPlanet, flyHome, focusWord, getSectors, dispose }
   ═════════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TAU = Math.PI * 2;
const WHITE = new THREE.Color('#ffffff');
const D = window.LexiverseSectors;

export function createGalaxyField(container, opts = {}) {
  const onSelectPlanet = opts.onSelectPlanet || (() => {});
  const onSectorChange = opts.onSectorChange || (() => {});
  const onSectorClick = opts.onSectorClick || (() => {});
  const onLOD = opts.onLOD || (() => {});

  const W = () => container.clientWidth, H = () => container.clientHeight;
  const PR = () => Math.min(window.devicePixelRatio, 2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(PR()); renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cursor = 'grab';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#05080f');
  scene.fog = new THREE.FogExp2('#05080f', 0.00016);

  const HOME = new THREE.Vector3(0, 900, 2600);
  const camera = new THREE.PerspectiveCamera(52, W() / H(), 0.1, 14000);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.5; controls.zoomSpeed = 0.95; controls.panSpeed = 0.7;
  controls.enablePan = true; controls.screenSpacePanning = true;
  controls.minDistance = 60; controls.maxDistance = 5200;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.08;

  /* ── shared round-point shader (reveal-driven opacity for LOD) ─────────── */
  const sharedTime = { value: 0 }, sharedPR = { value: PR() };
  function pointsMaterial({ opacity = 1, drift = 0, blending = THREE.AdditiveBlending }) {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: sharedTime, uPixelRatio: sharedPR, uOpacity: { value: opacity },
        uReveal: { value: 1 }, uDrift: { value: drift }, uSizeBoost: { value: 1 } },
      vertexShader: `
        attribute vec3 aColor; attribute float aSize; attribute float aPhase;
        uniform float uTime,uPixelRatio,uDrift,uSizeBoost,uReveal;
        varying vec3 vColor; varying float vTwinkle;
        void main(){
          vColor=aColor;
          vTwinkle=0.7+0.3*sin(uTime*1.4+aPhase);
          vec3 p=position;
          p.x+=sin(uTime*0.06+aPhase)*uDrift;
          p.y+=cos(uTime*0.05+aPhase*1.3)*uDrift;
          vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv;
          float far=mix(1.7,1.0,uReveal); // merge to glow when far
          gl_PointSize=aSize*uSizeBoost*far*uPixelRatio*(300.0/max(-mv.z,1.0));
        }`,
      fragmentShader: `
        precision highp float; varying vec3 vColor; varying float vTwinkle;
        uniform float uOpacity,uReveal;
        void main(){
          vec2 uv=gl_PointCoord-0.5; float d=length(uv);
          float a=smoothstep(0.5,0.0,d); a*=a;
          gl_FragColor=vec4(vColor*vTwinkle, a*uOpacity*clamp(uReveal,0.34,1.0));
        }`,
      transparent: true, depthWrite: false, blending,
    });
  }

  /* ── deep background: stars + 2 nebula backdrops + faint host disk ─────── */
  addStarfield(scene, pointsMaterial);
  addNebulaBackdrops(scene);
  addHostDisk(scene, pointsMaterial);

  /* ── build sectors ─────────────────────────────────────────────────────── */
  const glowTex = makeGlow();
  const sectorObjs = D.SECTORS.map(s => buildSector(s, pointsMaterial, glowTex, scene));
  const pickTargets = [];
  sectorObjs.forEach(o => o.pickSpheres.forEach(m => pickTargets.push(m)));
  const sectorPickTargets = sectorObjs.map(o => o.sectorPick);

  /* ── HTML overlay: sector labels + featured word labels ───────────────── */
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(overlay);
  sectorObjs.forEach(o => {
    const el = document.createElement('button');
    el.className = 'gf-sector-label';
    el.style.pointerEvents = 'auto';
    el.innerHTML = `<span class="dot" style="background:${o.sector.color};box-shadow:0 0 10px ${o.sector.color}"></span>
      <span class="txt"><b>${o.sector.name}</b><i>${o.sector.nameZh} · ${o.sector.wordCount} 词 · ${Math.round(o.sector.mastery*100)}%</i></span>`;
    el.onclick = (e) => { e.stopPropagation(); selectSector(o.sector.id); };
    overlay.appendChild(el);
    o.labelEl = el;
    o.featLabelEls = new Map();
  });

  /* ── camera tweening ───────────────────────────────────────────────────── */
  const desiredCam = HOME.clone(), desiredTgt = new THREE.Vector3();
  let tweening = false, activeSectorId = null, selectedPlanet = null, lastLOD = '';
  controls.addEventListener('start', () => { tweening = false; });

  function flyToSector(id, tight = false) {
    const o = sectorObjs.find(x => x.sector.id === id); if (!o) return;
    const c = o.center;
    desiredTgt.copy(c);
    const off = camera.position.clone().sub(c);
    if (off.length() < 1) off.set(0.2, 0.5, 1);
    off.normalize().multiplyScalar(o.sector.radius * (tight ? 2.0 : 3.0));
    off.y += o.sector.radius * 0.7;
    desiredCam.copy(c).add(off);
    controls.autoRotate = false; tweening = true;
    setActiveSector(id);
  }
  function flyHome() {
    desiredCam.copy(HOME); desiredTgt.set(0, 0, 0);
    controls.autoRotate = true; tweening = true;
    setActiveSector(null); clearSelection();
  }
  function flyToPlanet(sectorId, word) {
    const o = sectorObjs.find(x => x.sector.id === sectorId); if (!o) return;
    const p = o.planets.find(pl => pl.word === word); if (!p) { flyToSector(sectorId, true); return; }
    desiredTgt.copy(p.world);
    const off = camera.position.clone().sub(p.world);
    if (off.length() < 1) off.set(0.2, 0.4, 1);
    off.normalize().multiplyScalar(Math.max(o.sector.radius * 1.1, 90));
    desiredCam.copy(p.world).add(off);
    controls.autoRotate = false; tweening = true;
    setActiveSector(sectorId); selectPlanet(p, o);
  }
  function focusWord(word) {
    for (const o of sectorObjs) { const p = o.planets.find(pl => pl.word === word); if (p) { flyToPlanet(o.sector.id, word); return o.sector.id; } }
    return null;
  }

  function setActiveSector(id) {
    if (activeSectorId === id) return;
    activeSectorId = id;
    onSectorChange(id ? sectorObjs.find(x => x.sector.id === id).sector : null);
  }

  // click a sector (label or cluster): fly the camera near it + open its overview panel
  function selectSector(id) {
    const o = sectorObjs.find(x => x.sector.id === id); if (!o) return;
    clearSelection();
    flyToSector(id, false);
    onSectorClick(o.sector);
  }

  /* ── selection + relationship lines ───────────────────────────────────── */
  function selectPlanet(p, o) {
    selectedPlanet = { p, o };
    buildRelationLines(o, p);
    onSelectPlanet(p.word ? D.byWord(p.word) || { word: p.word, _partial: true } : null, p);
  }
  function clearSelection() { selectedPlanet = null; sectorObjs.forEach(o => { if (o.lines) o.lines.visible = false; }); onSelectPlanet(null, null); }

  function buildRelationLines(o, p) {
    // connect the selected featured planet to its nearest featured neighbours
    const feats = o.planets.filter(x => x.featured && x !== p);
    feats.sort((a, b) => a.world.distanceToSquared(p.world) - b.world.distanceToSquared(p.world));
    const near = feats.slice(0, 4);
    const pts = [];
    near.forEach(n => { pts.push(p.world.x, p.world.y, p.world.z, n.world.x, n.world.y, n.world.z); });
    o.lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    o.lines.geometry.computeBoundingSphere();
    o.lines.material.color.set(o.sector.color);
    o.lines.visible = true;
  }

  /* ── picking ───────────────────────────────────────────────────────────── */
  const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
  let down = null, hoverObj = null;
  function setPtr(e) { const r = renderer.domElement.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1; }
  function pickPlanet() { ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(pickTargets, false)[0]; return hit ? hit.object : null; }
  function pickSector() { ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(sectorPickTargets, false)[0]; return hit ? hit.object.userData.sectorId : null; }
  renderer.domElement.addEventListener('pointermove', (e) => {
    setPtr(e); const obj = pickPlanet() || pickSector();
    if (obj !== hoverObj) { hoverObj = obj; renderer.domElement.style.cursor = obj ? 'pointer' : 'grab'; }
  }, { passive: true });
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; }, { passive: true });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
    if (moved > 6) return; setPtr(e);
    const planet = pickPlanet();
    if (planet) { const o = sectorObjs.find(x => x.sector.id === planet.userData.sectorId); flyToPlanet(o.sector.id, planet.userData.planet.word); return; }
    const secId = pickSector();
    if (secId) selectSector(secId);
  }, { passive: true });

  /* ── render loop with continuous LOD ──────────────────────────────────── */
  let raf = 0, running = true, last = performance.now();
  const v = new THREE.Vector3();
  const NEAR = 470, FAR = 1180;
  function frame() {
    if (!running) return; raf = requestAnimationFrame(frame);
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now;
    sharedTime.value = now / 1000;
    if (tweening) {
      camera.position.lerp(desiredCam, 0.05); controls.target.lerp(desiredTgt, 0.07);
      if (camera.position.distanceTo(desiredCam) < 2) tweening = false;
    }
    controls.update();

    let bestSector = null, bestReveal = 0;
    for (const o of sectorObjs) {
      const dist = camera.position.distanceTo(o.center);
      let reveal = (FAR - dist) / (FAR - NEAR); reveal = Math.max(0, Math.min(1, reveal));
      o.points.material.uniforms.uReveal.value += (reveal - o.points.material.uniforms.uReveal.value) * 0.12;
      const rv = o.points.material.uniforms.uReveal.value;
      // local nebula breathes; brighter + steadier with mastery
      const breathe = 0.85 + 0.15 * Math.sin(sharedTime.value * (0.4 + o.sector.mastery * 0.3) + o.phase);
      // local nebula is strongest when far (reads as a luminous cluster) and eases back as planets take over up close
      o.nebula.material.opacity = (0.30 + 0.24 * o.sector.mastery) * (0.7 + 0.7 * (1 - rv)) * breathe;
      o.core.material.opacity = (0.26 + 0.26 * o.sector.mastery) * (0.55 + 0.8 * (1 - rv)) * breathe;
      // review amber orbit + weak pink pulse hints
      if (o.reviewRing) { o.reviewRing.rotation.z += dt * 0.25; o.reviewRing.material.opacity = 0.10 + 0.05 * Math.sin(sharedTime.value * 0.8 + o.phase); }
      if (o.weakPulse) o.weakPulse.material.opacity = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(sharedTime.value * 1.6 + o.phase));
      if (o.lines && o.lines.visible) o.lines.material.opacity = 0.10 + 0.32 * rv;
      if (rv > bestReveal) { bestReveal = rv; bestSector = o; }
      // sector label position + opacity (fade near the very top so it doesn't clash with the top bar)
      placeLabel(o.labelEl, o.center, 0);
      v.copy(o.center); v.project(camera);
      const screenY = (-v.y * 0.5 + 0.5) * H();
      const topFade = screenY < 78 ? Math.max(0, screenY / 78) : 1;
      o.labelEl.style.opacity = String((0.35 + 0.55 * (1 - Math.abs(rv - 0.5) * 1.0)) * topFade);
      o.labelEl.classList.toggle('is-active', activeSectorId === o.sector.id);
      // featured word labels only when this sector is fairly focused
      const showFeat = rv > 0.72;
      o.featured.forEach(p => {
        let el = o.featLabelEls.get(p.idx);
        if (showFeat && !el) { el = document.createElement('div'); el.className = 'gf-word-label'; el.textContent = p.word; overlay.appendChild(el); o.featLabelEls.set(p.idx, el); }
        if (el) {
          if (!showFeat) { el.style.opacity = '0'; }
          else { placeLabel(el, p.world, 6); el.style.opacity = String((rv - 0.72) / 0.28); el.style.color = D.STATE[p.state].color; }
        }
      });
    }
    // active sector follows the most-revealed cluster while cruising
    if (!tweening && bestSector && bestReveal > 0.55) setActiveSector(bestSector.sector.id);
    const lod = bestReveal > 0.78 ? (selectedPlanet ? 'Planet Inspect' : 'Sector Focus') : bestReveal > 0.4 ? 'Sector Cruise' : 'Galaxy Overview';
    if (lod !== lastLOD) { lastLOD = lod; onLOD(lod); }

    renderer.render(scene, camera);
  }
  function placeLabel(el, world, lift) {
    v.copy(world); v.y += lift; v.project(camera);
    if (v.z > 1) { el.style.opacity = '0'; return; }
    el.style.transform = `translate(-50%,-50%) translate(${(v.x * 0.5 + 0.5) * W()}px,${(-v.y * 0.5 + 0.5) * H()}px)`;
  }

  function resize() { sharedPR.value = PR(); renderer.setPixelRatio(PR()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); }
  const ro = new ResizeObserver(resize); ro.observe(container);
  raf = requestAnimationFrame(frame);

  /* ── initial mode ─────────────────────────────────────────────────────── */
  requestAnimationFrame(() => {
    if (opts.initialMode === 'focus' && opts.focusSector) { const c = bringNear(opts.focusSector); camera.position.copy(c.cam); controls.target.copy(c.tgt); flyToSector(opts.focusSector, true); }
    else if (opts.initialMode === 'inspect' && opts.focusSector) { const c = bringNear(opts.focusSector); camera.position.copy(c.cam); controls.target.copy(c.tgt); flyToPlanet(opts.focusSector, opts.focusPlanet); }
  });
  function bringNear(id) { const o = sectorObjs.find(x => x.sector.id === id); const c = o.center; const off = new THREE.Vector3(0.3, 0.5, 1).normalize().multiplyScalar(o.sector.radius * 2.4); off.y += o.sector.radius * 0.6; return { cam: c.clone().add(off), tgt: c.clone() }; }

  const api = {
    flyToSector, flyHome, flyToPlanet, focusWord, selectSector,
    getSectors: () => D.SECTORS,
    getActiveSector: () => activeSectorId,
    dispose() { running = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); container.removeChild(renderer.domElement); overlay.remove(); },
  };
  window.__field = api;
  return api;
}

/* ── build a single sector cluster ────────────────────────────────────────*/
function buildSector(sector, makeMat, glowTex, scene) {
  const center = new THREE.Vector3(sector.pos[0], sector.pos[1], sector.pos[2]);
  const rnd = mulberry32(hash(sector.id));
  const N = Math.round((sector.wordCount || D.DEMO_PLANETS_PER_SECTOR) * (D.RENDER_MULT || 1));
  const feat = D.FEATURED[sector.id] || [];
  const mix = cumulative(D.stateMix(sector.mastery));
  const col = new THREE.Color(sector.color);

  const pos = new Float32Array(N * 3), colA = new Float32Array(N * 3), siz = new Float32Array(N), pha = new Float32Array(N);
  const planets = []; const tmp = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.pow(rnd(), 0.62) * sector.radius;
    const th = rnd() * TAU, ph = Math.acos(2 * rnd() - 1);
    const lx = Math.sin(ph) * Math.cos(th) * r, ly = Math.cos(ph) * r * 0.45, lz = Math.sin(ph) * Math.sin(th) * r;
    const world = new THREE.Vector3(center.x + lx, center.y + ly, center.z + lz);
    const featured = i < feat.length;
    const state = featured ? featuredState(i, sector.mastery) : pickState(mix, rnd());
    tmp.set(D.STATE[state].color);
    if (!featured) tmp.lerp(col, 0.18).multiplyScalar(0.7 + rnd() * 0.4);
    pos[i*3]=world.x; pos[i*3+1]=world.y; pos[i*3+2]=world.z;
    colA[i*3]=tmp.r; colA[i*3+1]=tmp.g; colA[i*3+2]=tmp.b;
    siz[i] = featured ? 15 + rnd() * 6 : 3.6 + rnd() * 5.0;
    pha[i] = rnd() * TAU;
    planets.push({ idx: i, world, state, featured, word: featured ? feat[i] : null });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colA, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));
  const points = new THREE.Points(geo, makeMat({ opacity: 1.0, drift: 1.2 }));
  scene.add(points);

  // local nebula (soft, no hard border) + bright core
  const nebula = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
  nebula.position.copy(center); nebula.scale.setScalar(sector.radius * 4.6); scene.add(nebula);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col.clone().lerp(WHITE, 0.4), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  core.position.copy(center); core.scale.setScalar(sector.radius * 0.95); scene.add(core);

  // review amber ring hint
  let reviewRing = null;
  if (sector.review >= 12) {
    const g = new THREE.RingGeometry(sector.radius * 1.5, sector.radius * 1.56, 64);
    reviewRing = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#FFC861', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    reviewRing.position.copy(center); reviewRing.rotation.x = Math.PI * 0.42; scene.add(reviewRing);
  }
  // weak pink pulse hint
  let weakPulse = null;
  if (sector.weak >= 10) {
    weakPulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#FF8FA8', transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }));
    weakPulse.position.copy(center); weakPulse.scale.setScalar(sector.radius * 2.4); scene.add(weakPulse);
  }

  // relationship lines (filled on selection)
  const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  lines.visible = false; scene.add(lines);

  // invisible pick spheres for featured (real) planets only — ambient bodies are not pickable
  const pickSpheres = planets.filter(p => p.featured).map(p => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(16, 6, 5), new THREE.MeshBasicMaterial());
    m.visible = false; m.position.copy(p.world); m.userData = { sectorId: sector.id, planet: p }; scene.add(m); return m;
  });

  // big invisible sphere so the whole cluster is clickable as a SECTOR (overview / cruise)
  const sectorPick = new THREE.Mesh(new THREE.SphereGeometry(sector.radius * 1.15, 10, 8), new THREE.MeshBasicMaterial());
  sectorPick.visible = false; sectorPick.position.copy(center); sectorPick.userData = { sectorId: sector.id }; scene.add(sectorPick);

  return { sector, center, points, nebula, core, reviewRing, weakPulse, lines, planets,
    featured: planets.filter(p => p.featured), pickSpheres, sectorPick, phase: hash(sector.id) % 100 / 100 * TAU };
}

/* ── deep background helpers ──────────────────────────────────────────────*/
function addStarfield(scene, makeMat) {
  const n = 15000, pos = new Float32Array(n*3), colA = new Float32Array(n*3), siz = new Float32Array(n), pha = new Float32Array(n);
  const tints = ['#cfe0ff','#ffe6c2','#d6fbff','#ffffff','#c9d4ff'].map(h => new THREE.Color(h)); const tmp = new THREE.Color();
  for (let i=0;i<n;i++){ const r=900+Math.pow(Math.random(),0.7)*4200; const th=Math.random()*TAU, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=Math.sin(ph)*Math.cos(th)*r; pos[i*3+1]=Math.cos(ph)*r*0.7; pos[i*3+2]=Math.sin(ph)*Math.sin(th)*r;
    tmp.copy(tints[(Math.random()*tints.length)|0]).multiplyScalar(0.5+Math.random()*0.5);
    colA[i*3]=tmp.r; colA[i*3+1]=tmp.g; colA[i*3+2]=tmp.b; siz[i]=1.2+Math.random()*3; pha[i]=Math.random()*TAU; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('aColor', new THREE.BufferAttribute(colA,3));
  g.setAttribute('aSize', new THREE.BufferAttribute(siz,1)); g.setAttribute('aPhase', new THREE.BufferAttribute(pha,1));
  scene.add(new THREE.Points(g, makeMat({ opacity: 0.8, drift: 5 })));
}
function addNebulaBackdrops(scene) {
  const tex = makeNebula();
  [['#3b2f8f',[-1700,300,-2600],6200,0.5], ['#1d6a78',[2000,-420,-2200],5400,0.42]].forEach(([c,p,s,o]) => {
    const m = new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
    const sp = new THREE.Sprite(m); sp.position.set(p[0],p[1],p[2]); sp.scale.set(s,s,1); sp.renderOrder=-10; scene.add(sp);
  });
}
function addHostDisk(scene, makeMat) {
  // very faint large spiral suggesting the galaxy disk the sectors live in
  const n = 7600, pos = new Float32Array(n*3), colA = new Float32Array(n*3), siz = new Float32Array(n), pha = new Float32Array(n);
  const base = new THREE.Color('#9fc7ff'); const tmp = new THREE.Color(); const R=1900, arms=2, twist=4.5/R;
  for (let i=0;i<n;i++){ const t=Math.pow(Math.random(),1.4); const r=t*R; const arm=(i%arms)/arms*TAU; const ang=arm+r*twist+(Math.random()-0.5)*0.5;
    pos[i*3]=Math.cos(ang)*r; pos[i*3+1]=(Math.random()-0.5)*60*(1-t*0.5); pos[i*3+2]=Math.sin(ang)*r;
    tmp.copy(base).multiplyScalar(0.4+Math.random()*0.3); colA[i*3]=tmp.r; colA[i*3+1]=tmp.g; colA[i*3+2]=tmp.b;
    siz[i]=1.4+Math.random()*2.4; pha[i]=Math.random()*TAU; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('aColor', new THREE.BufferAttribute(colA,3));
  g.setAttribute('aSize', new THREE.BufferAttribute(siz,1)); g.setAttribute('aPhase', new THREE.BufferAttribute(pha,1));
  const mat = makeMat({ opacity: 0.32, drift: 0 }); const pts = new THREE.Points(g, mat); pts.rotation.x = 0.32; scene.add(pts);
}

/* ── small helpers ────────────────────────────────────────────────────────*/
function featuredState(i, mastery) { const order=['mastered','learning','review','recommended','weak','unknown']; const idx=Math.floor(((i*0.61803)%1)*order.length); const s=order[idx]; if (mastery>0.5 && s==='unknown') return 'learning'; return s; }
function cumulative(mix){ let sum=0; const out=mix.map(([k,w])=>{sum+=Math.max(0,w);return [k,sum];}); return out.map(([k,c])=>[k,c/sum]); }
function pickState(cum, r){ for(const [k,c] of cum){ if(r<=c) return k; } return cum[cum.length-1][0]; }
function makeGlow(){ const s=128,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.3,'rgba(255,255,255,0.5)');g.addColorStop(0.6,'rgba(255,255,255,0.14)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);return new THREE.CanvasTexture(c); }
function makeNebula(){ const s=256,c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,s,s);const rnd=mulberry32(0x4e4255);for(let i=0;i<18;i++){const px=s*0.5+(rnd()-0.5)*s*0.6,py=s*0.5+(rnd()-0.5)*s*0.6,r=s*(0.12+rnd()*0.22);const g=x.createRadialGradient(px,py,0,px,py,r);const a=0.04+rnd()*0.07;g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);}return new THREE.CanvasTexture(c); }
function mulberry32(a){ return function(){ a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
