/* Stage-A prototype · DOM overlay (vanilla, no React) */
import { createUniverse } from './scene.js';

const C = window.LexiverseCatalog;
const stage = document.getElementById('stage');
const canvasWrap = document.getElementById('universe-wrap');
const previewEl = document.getElementById('preview');
const detailEl = document.getElementById('detail');
const detailBody = document.getElementById('detail-body');
const closeBtn = document.getElementById('close-btn');
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
const filterBar = document.getElementById('filter-bar');
const breadcrumbEl = document.getElementById('breadcrumb');
const universeHud = document.getElementById('universe-hud');
const galaxyHud = document.getElementById('galaxy-hud');
const returnBtn = document.getElementById('return-btn');
const galaxyCountEl = document.getElementById('hud-galaxies');

let activeFilter = 'all';
let activeConstellationId = new URLSearchParams(location.search).get('constellation') || null;
let selectedGalaxyId = null;

const universe = createUniverse(canvasWrap, {
  onSelectGalaxy: (g) => openGalaxy(g),
  onHoverGalaxy: (g) => updatePreview(g),
});

// ── Filter bar ─────────────────────────────────────────────────────────────
filterBar.addEventListener('click', (e) => {
  const t = e.target.closest('[data-filter]');
  if (!t) return;
  activeFilter = t.dataset.filter;
  activeConstellationId = null;           // clear constellation filter
  for (const btn of filterBar.querySelectorAll('[data-filter]')) {
    btn.classList.toggle('active', btn.dataset.filter === activeFilter);
  }
  renderLeftNav();                         // update left nav highlight
  applyFilter();
});
function applyFilter() {
  let set = null;
  if (activeConstellationId) {
    set = new Set(C.GALAXIES.filter(g => g.constellationId === activeConstellationId).map(g => g.id));
  } else if (activeFilter !== 'all') {
    set = new Set(C.GALAXIES.filter(g => g.sourceType === activeFilter).map(g => g.id));
  }
  universe.setFilteredGalaxies(set);
  galaxyCountEl.textContent = set ? `${set.size} / ${C.GALAXIES.length}` : `${C.GALAXIES.length} / ${C.GALAXIES.length}`;
}
applyFilter();

// ── Left constellation nav ──────────────────────────────────────────────────
function setConstellationFilter(id) {
  activeConstellationId = id;
  activeFilter = 'all';
  for (const btn of filterBar.querySelectorAll('[data-filter]')) {
    btn.classList.toggle('active', btn.dataset.filter === 'all');
  }
  renderLeftNav();
  applyFilter();
}

function renderLeftNav() {
  const nav = document.getElementById('left-nav');
  if (!nav) return;
  const allCount = C.GALAXIES.length;
  nav.innerHTML = `
    <h4 style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(126,249,255,0.55);font-family:'Space Mono',monospace;margin:0;padding:16px 18px 10px;flex-shrink:0">星座区 · Constellations</h4>
    <div style="overflow-y:auto;padding:0 12px 14px;scrollbar-width:none">
      <button onclick="setConstellationFilter(null)" style="width:100%;text-align:left;padding:10px 12px;border-radius:14px;margin-bottom:7px;cursor:pointer;background:${!activeConstellationId ? 'linear-gradient(155deg,rgba(126,249,255,0.09),rgba(90,200,220,0.04))' : 'linear-gradient(155deg,rgba(180,215,255,0.10),rgba(150,190,240,0.045))'};border:1px solid ${!activeConstellationId ? 'rgba(126,249,255,0.60)' : 'rgba(190,228,255,0.28)'};box-shadow:${!activeConstellationId ? '0 0 14px rgba(126,249,255,0.20)' : 'none'};transition:all 0.18s">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:#7EF9FF;box-shadow:0 0 7px #7EF9FF"></span>
          <span style="font-size:13px;font-weight:700;color:#EAF6FF;font-family:'Noto Sans SC','Space Grotesk',sans-serif">全部星座区</span>
        </div>
        <div style="font-size:10.5px;color:#9DB6CB;margin-top:3px;font-family:'Space Grotesk',sans-serif">All Sectors · ${allCount} galaxies</div>
      </button>
      ${C.CONSTELLATIONS.map(c => {
        const count = C.GALAXIES.filter(g => g.constellationId === c.id).length;
        const active = activeConstellationId === c.id;
        return `<button onclick="setConstellationFilter('${c.id}')" style="width:100%;text-align:left;padding:10px 12px;border-radius:14px;margin-bottom:7px;cursor:pointer;background:${active ? `linear-gradient(155deg,rgba(126,249,255,0.09),rgba(90,200,220,0.04))` : 'linear-gradient(155deg,rgba(180,215,255,0.10),rgba(150,190,240,0.045))'};border:1px solid ${active ? c.color + '99' : 'rgba(190,228,255,0.28)'};box-shadow:${active ? `0 0 14px ${c.color}33` : 'none'};transition:all 0.18s">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${c.color};box-shadow:0 0 7px ${c.color}"></span>
            <span style="font-size:13px;font-weight:700;color:#EAF6FF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Noto Sans SC','Space Grotesk',sans-serif">${c.titleZh}</span>
          </div>
          <div style="font-size:10.5px;color:#9DB6CB;margin-top:3px;line-height:1.3;font-family:'Space Grotesk',sans-serif">${c.title} · ${count} galaxies</div>
        </button>`;
      }).join('')}
    </div>`;
}
renderLeftNav();

// ── Search ─────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { searchResults.style.display = 'none'; searchResults.innerHTML = ''; return; }
  const hits = C.GALAXIES.filter(g => g.title.toLowerCase().includes(q) || g.titleZh.includes(searchInput.value)).slice(0, 6);
  if (!hits.length) { searchResults.style.display = 'none'; return; }
  searchResults.innerHTML = hits.map(g => `<button data-id="${g.id}"><span class="dot" style="background:${g.colorTheme};box-shadow:0 0 6px ${g.colorTheme}"></span>${g.title}<span class="zh"> · ${g.titleZh}</span></button>`).join('');
  searchResults.style.display = 'block';
});
searchResults.addEventListener('mousedown', (e) => {
  const b = e.target.closest('button[data-id]');
  if (!b) return;
  e.preventDefault();
  searchInput.value = '';
  searchResults.style.display = 'none';
  const g = C.GALAXIES.find(x => x.id === b.dataset.id);
  if (g) openGalaxy(g);
});

// ── Hover preview tooltip ──────────────────────────────────────────────────
function updatePreview(g) {
  if (!g) { previewEl.style.opacity = '0'; return; }
  const constellation = C.CONSTELLATIONS.find(c => c.id === g.constellationId);
  previewEl.innerHTML = `
    <div class="row">
      <span class="dot" style="background:${g.colorTheme};box-shadow:0 0 8px ${g.colorTheme}"></span>
      <div class="head">
        <div class="title" style="color:${g.colorTheme}">${g.title}</div>
        <div class="zh">${g.titleZh}</div>
      </div>
    </div>
    <div class="desc">${g.description}</div>
    <div class="desc zh-desc">${g.descriptionZh || ''}</div>
    <div class="meta">
      <span class="chip">${g.sourceType}</span>
      ${constellation ? `<span class="chip muted">${constellation.title}</span>` : ''}
      <span class="chip muted">click to enter · 点击进入</span>
    </div>`;
  previewEl.style.opacity = '1';
}

// ── Mock galaxy detail (Stage A — no real planets yet) ─────────────────────
function openGalaxy(g) {
  selectedGalaxyId = g.id;
  const constellation = C.CONSTELLATIONS.find(c => c.id === g.constellationId);
  const filterPretty = Object.entries(g.filter).map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${Array.isArray(v) ? v.join(', ') : v}</span></div>`).join('');
  detailBody.innerHTML = `
    <div class="badge" style="color:${g.colorTheme};border-color:${g.colorTheme}55;background:${g.colorTheme}14">
      <span class="dot" style="background:${g.colorTheme}"></span>${g.sourceType.toUpperCase()}
    </div>
    <h1>${g.title}</h1>
    <div class="subtitle">${g.titleZh}</div>
    <div class="constellation">${constellation ? `${constellation.title} · ${constellation.titleZh}` : ''}</div>

    <div class="sec">DESCRIPTION / 简介</div>
    <div class="desc">${g.description}</div>
    <div class="desc-zh">${g.descriptionZh || ''}</div>

    <div class="sec">FILTER · 词典查询条件</div>
    <div class="filter-block">${filterPretty}</div>

    <div class="sec">STAGE-A NOTE / 阶段 A 提示</div>
    <div class="note">
      Stage A renders the universe view only. Clicking "Enter galaxy" in
      production will trigger the Stage-B fly-in to this galaxy's 300-planet
      field. Stage-A wires up the camera tween (left) and the URL state.
      <br><br>
      Stage A 仅渲染外层宇宙。生产环境点击「进入星系」会触发 Stage B 的镜头飞入与 300 颗星球场景。Stage A 已实现镜头切换与 URL 状态。
    </div>

    <div class="actions">
      <button class="primary" id="mock-enter">Enter galaxy · 进入星系 ↗</button>
      <button class="ghost" id="mock-graph">Open LexiGraph · 词图 ↗</button>
    </div>`;
  detailEl.classList.add('open');
  breadcrumbEl.querySelector('.crumb-galaxy').textContent = g.title;
  breadcrumbEl.querySelector('.crumb-galaxy-zh').textContent = ' · ' + g.titleZh;
  breadcrumbEl.querySelector('.crumb-constellation').textContent = constellation ? constellation.title : '';
  breadcrumbEl.classList.add('with-trail');
  galaxyHud.style.display = 'block';
  universeHud.style.display = 'none';
  returnBtn.style.display = 'inline-flex';
  document.getElementById('mock-enter').addEventListener('click', () => { window.location.href = 'Lexiverse Galaxy.html?galaxy=' + encodeURIComponent(g.id) + (activeConstellationId ? '&constellation=' + encodeURIComponent(activeConstellationId) : ''); });
  document.getElementById('mock-graph').addEventListener('click', () => { window.location.href = 'LexiGraph.html?galaxy=' + encodeURIComponent(g.id); });
  renderGalaxyExam(g);
}

function closeDetail() {
  selectedGalaxyId = null;
  detailEl.classList.remove('open');
  breadcrumbEl.classList.remove('with-trail');
  galaxyHud.style.display = 'none';
  universeHud.style.display = 'block';
  returnBtn.style.display = 'none';
  universe.clearFocus();
}
closeBtn.addEventListener('click', closeDetail);
returnBtn.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

window.__lexiverse = { universe, openGalaxy, closeDetail, catalog: C };

/* ═══ EXAM ROUTES overlay (mock) ═══════════════════════════════════════════ */
const X = window.LexiverseExam;
let currentExam = 'all';

(function buildExamUI() {
  // launcher
  const launch = document.createElement('button');
  launch.id = 'ex-launch';
  launch.innerHTML = `<span class="ic">◈</span><span>Exam Routes · 考试路线</span><span class="cur" id="ex-launch-cur"></span>`;
  document.body.appendChild(launch);
  launch.addEventListener('click', () => document.getElementById('ex-selector').classList.add('open'));

  // selector
  const sel = document.createElement('div');
  sel.id = 'ex-selector';
  sel.innerHTML = `<div class="ex-sheet">
    <button class="x" id="ex-sel-close">✕</button>
    <h2>Exam Routes · 考试词汇路线</h2>
    <div class="sub">Choose why you're learning. Your words stay in their semantic galaxies — a route only filters &amp; lights the path. · 词的语义归属不变，路线只是筛选与点亮。</div>
    <div class="ex-grid" id="ex-grid"></div>
  </div>`;
  document.body.appendChild(sel);
  document.getElementById('ex-grid').innerHTML = X.EXAMS.map(e => {
    const t = X.universeTotals(e.id);
    const dots = Array.from({length:5},(_,i)=>`<i class="${i<e.difficulty?'on':''}"></i>`).join('');
    return `<button class="ex-card ${e.reserved?'reserved':''} ${e.id===currentExam?'is-active':''}" data-exam="${e.id}" style="--c:${e.color}">
      <div class="top"><span class="ring"></span><div><div class="nm">${e.name}</div><div class="zh">${e.nameZh}</div></div>${e.reserved?'<span class="res">reserved</span>':`<span class="ex-diffdots">${dots}</span>`}</div>
      <div class="blurb">${e.blurb}</div>
      <div class="stats">
        <div class="s"><b>${e.id==='all'?t.total.toLocaleString():t.total.toLocaleString()}</b><span>${e.id==='all'?'words · 词':'route words · 路线词'}</span></div>
        <div class="s"><b>${e.reserved?'—':Math.round(t.mastered/Math.max(1,t.total)*100)+'%'}</b><span>mastered · 掌握</span></div>
        <div class="s"><b>${e.reserved?'—':e.daily}</b><span>today · 今日</span></div>
      </div></button>`;
  }).join('');
  sel.addEventListener('click', (ev) => {
    if (ev.target === sel) sel.classList.remove('open');
    const card = ev.target.closest('[data-exam]'); if (!card) return;
    const e = X.byId[card.dataset.exam];
    if (e.reserved) return;
    selectExam(card.dataset.exam);
    sel.classList.remove('open');
  });
  document.getElementById('ex-sel-close').addEventListener('click', () => sel.classList.remove('open'));

  // HUD
  const hud = document.createElement('div');
  hud.id = 'ex-hud';
  document.body.appendChild(hud);
})();

function selectExam(id) {
  currentExam = id;
  const e = X.byId[id];
  document.querySelectorAll('.ex-card').forEach(c => c.classList.toggle('is-active', c.dataset.exam === id));
  document.getElementById('ex-launch-cur').textContent = id === 'all' ? '' : '· ' + e.short;
  if (id === 'all') {
    universe.setExamMode(null);
    document.getElementById('ex-hud').classList.remove('open');
  } else {
    const map = new Map(C.GALAXIES.map(g => [g.id, X.galaxyExamFactor(g.id, id)]));
    universe.setExamMode(map);
    const t = X.universeTotals(id);
    const hud = document.getElementById('ex-hud');
    hud.style.setProperty('--c', e.color);
    hud.innerHTML = `
      <div class="route" style="--c:${e.color}"><span class="ring"></span><div><b>${e.name}</b><br><span>${e.nameZh} · route active</span></div></div>
      <div class="m"><b style="color:#EAF6FF">${t.total.toLocaleString()}</b><span>Words · 词汇</span></div>
      <div class="m"><b style="color:#7EF9FF">${t.mastered.toLocaleString()}</b><span>Mastered · 已掌握</span></div>
      <div class="m"><b style="color:#FF9E6B">${t.review.toLocaleString()}</b><span>Review · 复习</span></div>
      <div class="m"><b style="color:#FF8FA8">${t.weak.toLocaleString()}</b><span>Weak · 薄弱</span></div>
      <button class="exit" id="ex-exit">Exit · 退出</button>`;
    hud.classList.add('open');
    document.getElementById('ex-exit').addEventListener('click', () => selectExam('all'));
  }
  if (selectedGalaxyId) { const g = C.GALAXIES.find(x => x.id === selectedGalaxyId); if (g) renderGalaxyExam(g); }
}

function renderGalaxyExam(g) {
  const host = document.getElementById('detail-body'); if (!host) return;
  const cov = X.galaxyCoverage(g.id);
  const size = X.galaxySize(g.id);
  const rows = X.ACTIVE.map(e => {
    const c = cov[e.id]; const pct = Math.round(c / Math.max(1, size) * 100);
    if (c === 0) return `<div class="row forming"><span class="nm">${e.short}</span><div class="bar"></div><span class="ct">forming</span></div>`;
    return `<div class="row"><span class="nm">${e.short}</span><div class="bar"><i style="width:${Math.min(100,pct)}%;background:linear-gradient(90deg,${e.color},#fff)"></i></div><span class="ct" style="color:${e.color}">${c}</span></div>`;
  }).join('');
  const studiable = X.ACTIVE.filter(e => cov[e.id] > 0);
  const pills = studiable.map(e => `<button data-study="${e.id}" style="--c:${e.color}">Study ${e.short} · ${cov[e.id]} words</button>`).join('');
  const forming = studiable.length < X.ACTIVE.length
    ? `<div class="ex-forming"><b>Some routes still forming · 部分路线形成中</b><p>Routes marked “forming” don’t yet have enough verified words in this galaxy. Ambient bodies fill the space but are not learnable. · 标为 forming 的路线词汇不足，环境天体仅作背景。</p></div>` : '';
  const block = document.createElement('div');
  block.className = 'ex-cov';
  block.innerHTML = `<div class="lab">Exam coverage · 考试词汇覆盖</div>${rows}<div class="studybtns">${pills}</div>${forming}`;
  host.appendChild(block);
  block.querySelectorAll('[data-study]').forEach(b => b.addEventListener('click', () => {
    selectExam(b.dataset.study);
    window.location.href = 'Lexiverse Galaxy.html?galaxy=' + encodeURIComponent(g.id) + '&exam=' + b.dataset.study;
  }));
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.getElementById('ex-selector').classList.remove('open'); });
window.__lexiverseExam = { selectExam, get current(){ return currentExam; } };
