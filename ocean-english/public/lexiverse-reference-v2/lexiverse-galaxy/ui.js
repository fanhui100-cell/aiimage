/* Lexiverse Galaxy · controller */
import { createGalaxy } from './scene.js';

const D = window.LexiGalaxyData;
const graph = D.build();

const wrap = document.getElementById('galaxy-wrap');
const detail = document.getElementById('detail');
const detailBody = document.getElementById('detail-body');
const closeBtn = document.getElementById('close-btn');

let selected = null;

const galaxy = createGalaxy(wrap, graph, {
  onSelect: (n) => openDetail(n),
});

function counts() { let m=0,u=0,l=0; for (const n of graph.nodes) n.status==='mastered'?m++:n.status==='unlockable'?u++:l++; return {m,u,l}; }
function renderHUD() {
  const {m,u,l} = counts();
  document.getElementById('hud-m').textContent = m;
  document.getElementById('hud-u').textContent = u;
  document.getElementById('hud-l').textContent = l;
  const pct = Math.round(m / graph.nodes.length * 100);
  document.getElementById('hud-pct').textContent = pct + '%';
  document.getElementById('hud-bar').style.width = pct + '%';
}
renderHUD();

const STM = {
  mastered: { label: 'Mastered', zh: '已掌握', color: '#7EF9FF' },
  unlockable: { label: 'Unlockable', zh: '待解锁', color: '#38BDF8' },
  locked: { label: 'Locked', zh: '静默', color: '#7d8aa0' },
};
const ARCH_LABEL = {
  gas: 'Gas giant 气态巨星', rocky: 'Rocky world 岩质行星', molten: 'Molten world 熔岩星',
  geodesic: 'Geodesic star 测地星', orb: 'Glowing orb 辉光星', ringed: 'Ringed world 环带行星',
  galaxy: 'Spiral galaxy 旋涡星系', crystal: 'Crystal body 晶体星', dwarf: 'Dwarf star 矮星',
};
const CAT_LABEL = { noun: 'noun · 名词', verb: 'verb · 动词', adj: 'adj · 形容词' };

function openDetail(node) {
  selected = node;
  galaxy.setSelected(node.id);
  galaxy.focusNode(node.id);
  detail.classList.add('open');
  renderDetail(node);
}
function closeDetail() {
  selected = null;
  galaxy.setSelected(null);
  galaxy.unfocus();
  detail.classList.remove('open');
}
closeBtn.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

function renderDetail(node) {
  const meta = STM[node.status];
  const gloss = D.GLOSS[node.category];
  const neighbors = (graph.adjacency.get(node.id) || []).map((id) => graph.byId[id]);
  detailBody.innerHTML = `
    <div class="d-arch" style="color:${node.color}"><span class="d-arch-dot" style="background:${node.color}"></span>${ARCH_LABEL[node.archetype]}</div>
    <div class="d-word">${node.word}</div>
    <div class="d-ipa">${D.ipaFor(node.word)}<span class="d-cat">${CAT_LABEL[node.category]}</span></div>
    <div class="d-status" style="color:${meta.color};border-color:${meta.color}55;background:${meta.color}14">
      <span class="d-dot" style="background:${meta.color}"></span>${meta.label} · ${meta.zh}
    </div>

    <div class="d-sec">DEFINITION / 释义</div>
    ${node.zh ? `<div class="d-def-zh" style="font-size:14px">${node.zh}</div><div class="d-def" style="opacity:.55">${gloss.en}</div>`
      : `<div class="d-def">${gloss.en}</div><div class="d-def-zh">${gloss.zh}</div>`}

    <div class="d-sec">NEARBY SYSTEMS / 邻近星系 · ${neighbors.length}</div>
    <div class="d-neighbors">
      ${neighbors.slice(0, 8).map((nb) => `<button class="d-nb" data-id="${nb.id}"><span class="d-nb-dot" style="background:${nb.color}"></span>${nb.word}</button>`).join('')}
    </div>

    <div class="d-actions">
      ${node.status === 'mastered'
        ? `<div class="d-mastered">✓ This star is lit · 此星已点亮</div>`
        : `<div class="d-tasks-label">Complete a task to light this star · 完成任务点亮此星</div>
           <div class="d-tasks">
             <button class="d-task" id="task-quiz">◷ Quiz · 答题</button>
             <button class="d-task" id="task-read">▤ Reading · 阅读</button>
           </div>`}
    </div>`;
  detailBody.querySelectorAll('.d-nb').forEach((b) => b.addEventListener('click', () => openDetail(graph.byId[b.dataset.id])));
  const tq = document.getElementById('task-quiz'); if (tq) tq.addEventListener('click', () => completeTask(node, 'quiz'));
  const tr = document.getElementById('task-read'); if (tr) tr.addEventListener('click', () => completeTask(node, 'read'));
}

// A task (quiz/reading) runs briefly, then lights the star — the reward loop.
function completeTask(node, kind) {
  const btn = document.getElementById(kind === 'quiz' ? 'task-quiz' : 'task-read');
  if (btn) { btn.disabled = true; btn.textContent = kind === 'quiz' ? '◷ Quizzing…' : '▤ Reading…'; }
  toast(kind === 'quiz' ? 'Quiz complete ✓ 答题完成' : 'Reading complete ✓ 阅读完成');
  setTimeout(() => markAsLearned(node), 850);
}

function markAsLearned(node) {
  const wasNew = !graph.masteredIds.has(node.id);
  graph.masteredIds.add(node.id);
  const prevSystems = countSystems();
  D.deriveStatuses(graph.nodes, graph.adjacency, graph.masteredIds);
  galaxy.applyStatuses();
  if (wasNew) galaxy.burst(node.id);   // ← particle burst at the freshly-lit star
  renderHUD();
  if (selected && selected.id === node.id) renderDetail(graph.byId[node.id]);
  if (wasNew) toast(`✦ ${node.word} lit · 点亮一颗星`);
  // celebrate a freshly-completed constellation (a connected mastered cluster)
  const nowSystems = countSystems();
  if (nowSystems > prevSystems) setTimeout(() => toast('★ A new constellation lit! 一个星系点亮了！'), 1100);
}

// count connected components made entirely of mastered nodes (a "lit galaxy")
function countSystems() {
  const seen = new Set(); let n = 0;
  for (const id of graph.masteredIds) {
    if (seen.has(id)) continue;
    n++; const stack = [id];
    while (stack.length) { const cur = stack.pop(); if (seen.has(cur)) continue; seen.add(cur);
      for (const nb of (graph.adjacency.get(cur) || [])) if (graph.masteredIds.has(nb) && !seen.has(nb)) stack.push(nb); }
  }
  return n;
}

let tt = null;
function toast(msg) {
  let el = document.getElementById('lvg-toast');
  if (!el) { el = document.createElement('div'); el.id = 'lvg-toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2000);
}

/* ── Demo: fly to a dim star and light it, so the reward loop is obvious ──── */
let userInteracted = false;
['pointerdown', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { userInteracted = true; }, { once: true, passive: true }));

function runDemo() {
  // pick an unlockable planet that isn't already lit, prefer one near the core
  const cand = graph.nodes
    .filter((n) => n.status === 'unlockable')
    .sort((a, b) => (a.x*a.x+a.y*a.y+a.z*a.z) - (b.x*b.x+b.y*b.y+b.z*b.z))[0];
  if (!cand) return;
  galaxy.setSelected(cand.id);
  galaxy.focusNode(cand.id);
  toast('✦ Demo · complete a task to light a star');
  setTimeout(() => { markAsLearned(cand); }, 1800);
  setTimeout(() => { galaxy.setSelected(null); galaxy.unfocus(); }, 3800);
}

const demoBtn = document.getElementById('demo-btn');
if (demoBtn) demoBtn.addEventListener('click', runDemo);

// auto-run the demo once shortly after load, unless the user already grabbed control
setTimeout(() => { if (!userInteracted) runDemo(); }, 3200);

window.__galaxy = { graph, galaxy, openDetail, markAsLearned, runDemo, counts, countSystems };
