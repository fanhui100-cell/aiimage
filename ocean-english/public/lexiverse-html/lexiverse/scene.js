/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse 3D scene  (vanilla Three.js twin of LexigraphScene + GraphNodes + GraphEdges)
   Performance contract honored:
     · NO EffectComposer / NO UnrealBloomPass — glow is faked with AdditiveBlending halos
     · single LineSegments + one BufferGeometry for ALL edges
     · shared sphere geometry across nodes
   Visual logic:
     · mastered   → bright category-tinted core + additive halo + persistent label
     · unlockable → Sine breathing halo (scale + opacity) via the render loop
     · locked     → dim, shrunken ghost node
   ───────────────────────────────────────────────────────────────────────── */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CAT_COLOR = { noun: 0x7ef9ff, verb: 0xe8c877, adj: 0xb79bff };
const UNLOCK_COLOR = 0x38bdf8;
const LOCKED_COLOR = 0x33415a;

const SIZE = { mastered: 0.95, unlockable: 0.72, locked: 0.42 };
const HALO = { mastered: 0.42, unlockable: 0.30, locked: 0.0 };

export function createScene(container, graph, opts = {}) {
  const onSelect = opts.onSelect || (() => {});
  const onHover = opts.onHover || (() => {});

  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  scene.fog = new THREE.FogExp2('#050505', 0.0085);

  const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 2000);
  camera.position.set(0, 6, 92);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.6;
  controls.minDistance = 30;
  controls.maxDistance = 160;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  // faint deep-space dust so the void isn't empty
  addStarfield(scene);

  // ── Nodes: shared geometry, per-node group { core, halo } ────────────────
  const sphereGeo = new THREE.SphereGeometry(1, 20, 20);
  const haloGeo = new THREE.SphereGeometry(1, 16, 16);
  const nodeObjects = new Map();   // id → { group, core, halo, node, popT }
  const pickTargets = [];

  for (const node of graph.nodes) {
    const group = new THREE.Group();
    group.position.set(node.x, node.y, node.z);

    const baseColor = colorForNode(node);
    const coreMat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: opacityForCore(node.status) });
    const core = new THREE.Mesh(sphereGeo, coreMat);
    core.scale.setScalar(SIZE[node.status]);
    core.userData.id = node.id;

    const haloMat = new THREE.MeshBasicMaterial({
      color: baseColor, transparent: true, opacity: HALO[node.status],
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.scale.setScalar(SIZE[node.status] * 1.7);

    group.add(halo); group.add(core);
    scene.add(group);
    nodeObjects.set(node.id, { group, core, halo, node, popT: 1 });
    pickTargets.push(core);
  }

  // ── Edges: one LineSegments, one geometry, brightness-encoded per vertex ─
  const edgeColorArr = new Float32Array(graph.edges.length * 6);
  const edgePos = new Float32Array(graph.edges.length * 6);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(edgeColorArr, 3));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  function refreshEdges() {
    const pos = lineGeo.attributes.position.array;
    const col = lineGeo.attributes.color.array;
    const tmp = new THREE.Color();
    graph.edges.forEach((e, i) => {
      const a = graph.byId[e.source], b = graph.byId[e.target];
      pos[i * 6 + 0] = a.x; pos[i * 6 + 1] = a.y; pos[i * 6 + 2] = a.z;
      pos[i * 6 + 3] = b.x; pos[i * 6 + 4] = b.y; pos[i * 6 + 5] = b.z;
      // brightness from endpoint states: mastered=bright, unlockable=mid, locked=dim
      const bri = (s) => (s === 'mastered' ? 1 : s === 'unlockable' ? 0.5 : 0.12);
      const ba = bri(a.status), bb = bri(b.status);
      const ca = tmp.set(a.status === 'mastered' ? colorForNode(a) : UNLOCK_COLOR).multiplyScalar(ba * 0.5);
      col[i * 6 + 0] = ca.r; col[i * 6 + 1] = ca.g; col[i * 6 + 2] = ca.b;
      const cb = tmp.set(b.status === 'mastered' ? colorForNode(b) : UNLOCK_COLOR).multiplyScalar(bb * 0.5);
      col[i * 6 + 3] = cb.r; col[i * 6 + 4] = cb.g; col[i * 6 + 5] = cb.b;
    });
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  }
  refreshEdges();

  // ── Labels (HTML overlay, projected) — only mastered + hovered + selected ─
  const labelLayer = document.createElement('div');
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  container.appendChild(labelLayer);
  const labelEls = new Map();
  function ensureLabel(id, word) {
    let el = labelEls.get(id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'lv-label';
      el.textContent = word;
      labelLayer.appendChild(el);
      labelEls.set(id, el);
    }
    return el;
  }

  // ── Picking ──────────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredId = null;

  function setPointer(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickTargets, false);
    return hits.length ? hits[0].object.userData.id : null;
  }
  function onMove(ev) {
    setPointer(ev);
    const id = pick();
    if (id !== hoveredId) {
      hoveredId = id;
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      onHover(id ? graph.byId[id] : null);
    }
  }
  let downXY = null;
  function onDown(ev) { downXY = [ev.clientX, ev.clientY]; }
  function onUp(ev) {
    if (!downXY) return;
    const moved = Math.hypot(ev.clientX - downXY[0], ev.clientY - downXY[1]);
    downXY = null;
    if (moved > 6) return;           // was a drag, not a click
    setPointer(ev);
    const id = pick();
    if (id) onSelect(graph.byId[id]);
  }
  renderer.domElement.addEventListener('pointermove', onMove, { passive: true });
  renderer.domElement.addEventListener('pointerdown', onDown, { passive: true });
  renderer.domElement.addEventListener('pointerup', onUp, { passive: true });

  // ── Apply a status change (mark-as-learned) with a pop animation ─────────
  function applyStatuses() {
    for (const node of graph.nodes) {
      const o = nodeObjects.get(node.id);
      if (!o) continue;
      const color = colorForNode(node);
      o.core.material.color.set(color);
      o.core.material.opacity = opacityForCore(node.status);
      o.halo.material.color.set(color);
      // pop if newly mastered
      if (o.node.status !== node.status && node.status === 'mastered') o.popT = 0;
      o.node = node;
    }
    refreshEdges();
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let raf = 0, running = true;
  const v = new THREE.Vector3();

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    controls.update();

    for (const o of nodeObjects.values()) {
      const st = o.node.status;
      // breathing for unlockable
      if (st === 'unlockable') {
        const s = 0.5 + 0.5 * Math.sin(t * 3 + o.group.position.x);
        o.halo.scale.setScalar(SIZE.unlockable * (1.5 + s * 0.7));
        o.halo.material.opacity = 0.18 + s * 0.32;
        o.core.scale.setScalar(SIZE.unlockable * (1 + s * 0.08));
      } else if (st === 'mastered') {
        // gentle steady shimmer
        o.halo.material.opacity = HALO.mastered + 0.06 * Math.sin(t * 1.5 + o.group.position.y);
      }
      // pop tween
      if (o.popT < 1) {
        o.popT = Math.min(1, o.popT + 0.04);
        const e = 1 + Math.sin(o.popT * Math.PI) * 0.9;   // overshoot then settle
        o.core.scale.setScalar(SIZE.mastered * e);
        o.halo.scale.setScalar(SIZE.mastered * 1.7 * e);
      }
    }

    // labels: mastered (persistent) + hovered + selected
    const labelIds = new Set();
    for (const o of nodeObjects.values()) if (o.node.status === 'mastered') labelIds.add(o.node.id);
    if (hoveredId) labelIds.add(hoveredId);
    if (selectedId) labelIds.add(selectedId);
    // hide labels no longer needed
    for (const [id, el] of labelEls) if (!labelIds.has(id)) el.style.opacity = '0';
    for (const id of labelIds) {
      const o = nodeObjects.get(id); if (!o) continue;
      const el = ensureLabel(id, o.node.word);
      v.copy(o.group.position).project(camera);
      if (v.z > 1) { el.style.opacity = '0'; continue; }
      const x = (v.x * 0.5 + 0.5) * W();
      const y = (-v.y * 0.5 + 0.5) * H();
      el.style.transform = `translate(-50%,-150%) translate(${x}px,${y}px)`;
      const isMaster = o.node.status === 'mastered';
      el.style.opacity = (id === hoveredId || id === selectedId) ? '1' : (isMaster ? '0.7' : '0');
      el.dataset.kind = o.node.status;
    }

    renderer.render(scene, camera);
  }

  let selectedId = null;
  function setSelected(id) { selectedId = id; }

  function resize() {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  frame();

  return {
    applyStatuses, setSelected,
    setAutoRotate(b) { controls.autoRotate = b; },
    nodeObjects,
    dispose() {
      running = false; cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      controls.dispose();
      sphereGeo.dispose(); haloGeo.dispose(); lineGeo.dispose(); lineMat.dispose();
      nodeObjects.forEach((o) => { o.core.material.dispose(); o.halo.material.dispose(); });
      renderer.dispose();
      container.removeChild(renderer.domElement);
      labelLayer.remove();
    },
  };
}

function colorForNode(node) {
  if (node.status === 'mastered') return CAT_COLOR[node.category];
  if (node.status === 'unlockable') return UNLOCK_COLOR;
  return LOCKED_COLOR;
}
function opacityForCore(status) { return status === 'mastered' ? 1 : status === 'unlockable' ? 0.92 : 0.32; }

function addStarfield(scene) {
  const n = 600;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 180 + Math.random() * 320;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0x8fb6d6, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(g, m));
}
