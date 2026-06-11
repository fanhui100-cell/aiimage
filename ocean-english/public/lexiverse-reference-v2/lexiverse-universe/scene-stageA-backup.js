/* Stage-A prototype · vanilla Three.js universe scene
   ─────────────────────────────────────────────────────────────────────────
   Renders the 42 galaxies in 3D space with:
     · soft constellation hulls (additive radial gradients)
     · per-galaxy core + additive halo, breathing pulse
     · hover → label + scale-up
     · click → onSelectGalaxy callback
     · 4000 far-background stars
     · OrbitControls with damping + low auto-rotate (until selection)
     · smooth camera tween between universe view ⇄ galaxy view
   Mirrors the TSX LexiverseScene + UniverseLayer + GalaxyNode logic. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const C = window.LexiverseCatalog;

export function createUniverse(container, opts = {}) {
  const onSelectGalaxy = opts.onSelectGalaxy || (() => {});
  const onHoverGalaxy = opts.onHoverGalaxy || (() => {});

  const W = () => container.clientWidth, H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040407');
  scene.fog = new THREE.FogExp2('#040407', 0.0008);

  const HOME = new THREE.Vector3(0, 40, 480);
  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 4000);
  camera.position.copy(HOME);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.6; controls.minDistance = 60; controls.maxDistance = 800;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.16; controls.enablePan = false;

  // ── far-background stars (persist across layer switches) ────────────────
  addStarfield(scene);

  // ── constellation hulls (faint additive radial gradient sprites) ────────
  const haloTex = makeGlowTexture();
  for (const c of C.CONSTELLATIONS) {
    const mat = new THREE.SpriteMaterial({ map: haloTex, color: c.color, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.position.set(c.centroid.x, c.centroid.y, c.centroid.z);
    sp.scale.set(260, 260, 1);
    scene.add(sp);
  }

  // ── galaxy nodes ────────────────────────────────────────────────────────
  const nodeObjects = new Map();
  const pickTargets = [];
  for (const g of C.GALAXIES) {
    const grp = new THREE.Group();
    grp.position.set(g.visualPosition.x, g.visualPosition.y, g.visualPosition.z);
    const color = g.colorTheme || '#7EF9FF';

    // halo sprite
    const haloMat = new THREE.SpriteMaterial({ map: haloTex, color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.setScalar(22);
    grp.add(halo);

    // core mesh — geometry by visualType
    let coreGeo;
    if (g.visualType === 'wireframe') coreGeo = new THREE.IcosahedronGeometry(5, 1);
    else if (g.visualType === 'spiral') coreGeo = new THREE.SphereGeometry(5, 24, 24);
    else if (g.visualType === 'nebula') coreGeo = new THREE.SphereGeometry(4.5, 16, 16);
    else if (g.visualType === 'binary') coreGeo = new THREE.OctahedronGeometry(5, 0);
    else coreGeo = new THREE.SphereGeometry(4, 20, 20);

    const coreMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, wireframe: g.visualType === 'wireframe' });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData.id = g.id;
    grp.add(core);
    pickTargets.push(core);

    scene.add(grp);
    nodeObjects.set(g.id, {
      galaxy: g, grp, halo, haloMat, core, coreMat,
      breathPhase: hashStr(g.id) % 1000 / 1000 * Math.PI * 2,
      breathSpeed: 0.5 + (hashStr(g.id + '_s') % 1000) / 1000 * 0.6,
    });
  }

  // ── camera tween ────────────────────────────────────────────────────────
  let currentGalaxyId = null;
  const desiredCam = new THREE.Vector3().copy(HOME);
  const desiredTgt = new THREE.Vector3(0, 0, 0);

  function focusGalaxy(id) {
    currentGalaxyId = id;
    const o = nodeObjects.get(id);
    if (!o) return;
    const p = o.grp.position;
    desiredTgt.copy(p);
    const offset = camera.position.clone().sub(p);
    if (offset.length() < 80) offset.set(0, 0, 80);
    offset.normalize().multiplyScalar(60);
    desiredCam.copy(p).add(offset);
    controls.autoRotate = false;
  }
  function clearFocus() {
    currentGalaxyId = null;
    desiredCam.copy(HOME); desiredTgt.set(0, 0, 0);
    controls.autoRotate = true;
  }

  // ── picking + hover ────────────────────────────────────────────────────
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let hoveredId = null;
  function setPtr(ev) { const r = renderer.domElement.getBoundingClientRect(); ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1; }
  function pick() { ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(pickTargets, false); return h.length ? h[0].object.userData.id : null; }
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
    if (moved > 6) return;
    setPtr(ev);
    const id = pick();
    if (id) {
      const g = C.GALAXIES.find(x => x.id === id);
      onSelectGalaxy(g);
      focusGalaxy(id);
    }
  }
  renderer.domElement.addEventListener('pointermove', onMove, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onUp, { passive: true });

  // ── labels (projected HTML overlay) ────────────────────────────────────
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

  // ── render loop ────────────────────────────────────────────────────────
  let raf = 0, running = true;
  const v = new THREE.Vector3();
  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = performance.now() / 1000;

    camera.position.lerp(desiredCam, 0.04);
    controls.target.lerp(desiredTgt, 0.06);
    controls.update();

    // breathing
    for (const o of nodeObjects.values()) {
      const s = 0.5 + 0.5 * Math.sin(t * o.breathSpeed + o.breathPhase);
      const isSelected = currentGalaxyId === o.galaxy.id;
      const isHovered = hoveredId === o.galaxy.id;
      const isMuted = currentGalaxyId && !isSelected;
      const baseA = isSelected ? 0.95 : isHovered ? 0.85 : 0.55;
      o.haloMat.opacity = (baseA + (s - 0.5) * 0.3) * (isMuted ? 0.55 : 1);
      const sc = 22 * (isSelected ? 1.5 : isHovered ? 1.2 : 1.0) * (1 + s * 0.08);
      o.halo.scale.set(sc, sc, 1);
      o.coreMat.opacity = isMuted ? 0.55 : 1;
      o.core.rotation.y += 0.005; o.core.rotation.x += 0.002;
    }

    // labels — show hovered + selected only
    const wantedIds = new Set();
    if (hoveredId) wantedIds.add(hoveredId);
    if (currentGalaxyId) wantedIds.add(currentGalaxyId);
    for (const [id, el] of labelEls) if (!wantedIds.has(id)) el.style.opacity = '0';
    for (const id of wantedIds) {
      const o = nodeObjects.get(id);
      const el = ensureLabel(id);
      v.copy(o.grp.position).project(camera);
      if (v.z > 1) { el.style.opacity = '0'; continue; }
      const x = (v.x * 0.5 + 0.5) * W();
      const y = (-v.y * 0.5 + 0.5) * H();
      el.style.transform = `translate(-50%,-180%) translate(${x}px,${y}px)`;
      el.style.opacity = '1';
    }

    renderer.render(scene, camera);
  }

  function resize() { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); }
  const ro = new ResizeObserver(resize); ro.observe(container);
  raf = requestAnimationFrame(frame);

  return {
    focusGalaxy, clearFocus,
    setFilteredGalaxies(visibleSet) {
      for (const o of nodeObjects.values()) {
        const vis = visibleSet ? visibleSet.has(o.galaxy.id) : true;
        o.grp.visible = vis;
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

function makeGlowTexture() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function addStarfield(scene) {
  const n = 3500, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const tint = [new THREE.Color('#cfe6ff'), new THREE.Color('#ffe9c7'), new THREE.Color('#ffd2e6'), new THREE.Color('#ffffff')];
  for (let i = 0; i < n; i++) {
    const r = 700 + Math.random() * 700;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.cos(ph); pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
    const c = tint[(Math.random()*tint.length)|0]; col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true })));
}

function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
