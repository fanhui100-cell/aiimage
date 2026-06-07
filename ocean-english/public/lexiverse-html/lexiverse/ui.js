/* Lexiverse prototype controller (ES module).
   Wires the Three.js scene to the 2D overlay UI: depth-fold transition,
   detail panel, HUD, legend, and the mark-as-learned → re-derive flow. */
import { createScene } from './scene.js';

const LV = window.Lexiverse;
const graph = LV.createGraph(7);

const stage = document.getElementById('stage');
const canvasWrap = document.getElementById('canvas-wrap');
const detail = document.getElementById('detail');
const detailBody = document.getElementById('detail-body');
const closeBtn = document.getElementById('close-btn');

let selected = null;

const scene = createScene(canvasWrap, graph, {
  onSelect: (node) => openDetail(node),
  onHover: (node) => { /* cursor handled in scene; could show tooltip */ },
});

// ── HUD counts ─────────────────────────────────────────────────────────────
function counts() {
  let m = 0, u = 0, l = 0;
  for (const n of graph.nodes) n.status === 'mastered' ? m++ : n.status === 'unlockable' ? u++ : l++;
  return { m, u, l };
}
function renderHUD() {
  const { m, u, l } = counts();
  document.getElementById('hud-m').textContent = m;
  document.getElementById('hud-u').textContent = u;
  document.getElementById('hud-l').textContent = l;
  const pct = Math.round((m / graph.nodes.length) * 100);
  document.getElementById('hud-pct').textContent = pct + '%';
  document.getElementById('hud-bar').style.width = pct + '%';
}
renderHUD();

// ── Detail panel + depth-fold ───────────────────────────────────────────────
function statusMeta(status) {
  return {
    mastered:   { label: 'Mastered', zh: '已掌握', color: '#7EF9FF' },
    unlockable: { label: 'Unlockable', zh: '待解锁', color: '#38BDF8' },
    locked:     { label: 'Locked', zh: '静默', color: '#5a6b80' },
  }[status];
}

function openDetail(node) {
  selected = node;
  scene.setSelected(node.id);
  scene.setAutoRotate(false);
  canvasWrap.classList.add('folded');   // ← CSS depth-fold: scale + blur
  detail.classList.add('open');
  renderDetail(node);
}

function closeDetail() {
  selected = null;
  scene.setSelected(null);
  scene.setAutoRotate(true);
  canvasWrap.classList.remove('folded');
  detail.classList.remove('open');
}
closeBtn.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

function renderDetail(node) {
  const meta = statusMeta(node.status);
  const gloss = LV.GLOSS[node.category];
  const neighbors = (graph.adjacency.get(node.id) || []).map((id) => graph.byId[id]);
  const catLabel = { noun: 'noun · 名词', verb: 'verb · 动词', adj: 'adjective · 形容词' }[node.category];

  detailBody.innerHTML = `
    <div class="d-status" style="color:${meta.color};border-color:${meta.color}55;background:${meta.color}14">
      <span class="d-dot" style="background:${meta.color}"></span>${meta.label} · ${meta.zh}
    </div>
    <div class="d-word">${node.word}</div>
    <div class="d-ipa">${LV.ipaFor(node.word)}<span class="d-cat">${catLabel}</span></div>

    <div class="d-sec-label">DEFINITION / 释义</div>
    <div class="d-def">${gloss.en}</div>
    <div class="d-def-zh">${gloss.zh}</div>

    <div class="d-sec-label">CONNECTIONS / 关联 · ${neighbors.length}</div>
    <div class="d-neighbors">
      ${neighbors.map((nb) => {
        const c = statusMeta(nb.status).color;
        return `<button class="d-nb" data-id="${nb.id}"><span class="d-nb-dot" style="background:${c}"></span>${nb.word}</button>`;
      }).join('')}
    </div>

    <div class="d-actions">
      ${node.status === 'mastered'
        ? `<div class="d-mastered">✓ This star is lit · 此星已点亮</div>`
        : `<button class="d-primary" id="learn-btn">✦ Mark as Learned · 标记已掌握</button>`}
      <button class="d-ghost" id="quiz-btn">Quiz this word · 测验</button>
    </div>
  `;

  // neighbor navigation
  detailBody.querySelectorAll('.d-nb').forEach((b) =>
    b.addEventListener('click', () => openDetail(graph.byId[b.dataset.id])));

  const learnBtn = document.getElementById('learn-btn');
  if (learnBtn) learnBtn.addEventListener('click', () => markAsLearned(node));
  const quizBtn = document.getElementById('quiz-btn');
  if (quizBtn) quizBtn.addEventListener('click', () => toast(`Quiz queued → /quiz?word=${node.word}`));
}

// ── Mark as learned: light the node, re-derive unlockable neighbors ─────────
function markAsLearned(node) {
  graph.masteredIds.add(node.id);
  // re-derive every node's status from the new mastered set (locked adj mastered → unlockable)
  LV.deriveStatuses(graph.nodes, graph.adjacency, graph.masteredIds);
  scene.applyStatuses();    // recolors + pops the newly-mastered node + relights edges
  renderHUD();
  renderDetail(graph.byId[node.id]);
  toast(`✦ ${node.word} is now part of your sky`);
}

// ── Toast ───────────────────────────────────────────────────────────────────
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('lv-toast');
  if (!el) { el = document.createElement('div'); el.id = 'lv-toast'; stage.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

// expose for debugging / verifier
window.__lexiverse = { graph, scene, openDetail, markAsLearned, counts };
