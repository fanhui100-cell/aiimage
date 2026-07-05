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
    <h4 style="display:flex;align-items:center;justify-content:space-between;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(126,249,255,0.55);font-family:'Space Mono',monospace;margin:0;padding:16px 18px 10px;flex-shrink:0">星座区 · Constellations
      <button onclick="__lexiNavCollapse()" title="收起导航" style="display:flex;align-items:center;gap:5px;border:1px solid rgba(126,249,255,0.22);background:rgba(126,249,255,0.06);color:#9DB6CB;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;padding:5px 11px;border-radius:999px;transition:all 0.16s" onmouseover="this.style.color='#7EF9FF';this.style.borderColor='rgba(126,249,255,0.5)';this.style.transform='translateX(-1px)'" onmouseout="this.style.color='#9DB6CB';this.style.borderColor='rgba(126,249,255,0.22)';this.style.transform='none'">‹ 收起</button>
    </h4>
    <div style="overflow-y:auto;padding:0 12px 14px;scrollbar-width:none">
      <button onclick="setConstellationFilter(null)" style="width:100%;text-align:left;padding:10px 12px;border-radius:14px;margin-bottom:7px;cursor:pointer;background:${!activeConstellationId ? 'linear-gradient(155deg,rgba(126,249,255,0.09),rgba(90,200,220,0.04))' : 'linear-gradient(155deg,rgba(126,180,240,0.07),rgba(90,140,200,0.03))'};border:1px solid ${!activeConstellationId ? 'rgba(126,249,255,0.60)' : 'rgba(150,200,255,0.15)'};box-shadow:${!activeConstellationId ? '0 0 14px rgba(126,249,255,0.20)' : 'none'};transition:all 0.18s">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:#7EF9FF;box-shadow:0 0 7px #7EF9FF"></span>
          <span style="font-size:13px;font-weight:700;color:#EAF6FF;font-family:'Noto Sans SC','Space Grotesk',sans-serif">全部星座区</span>
        </div>
        <div style="font-size:10.5px;color:#9DB6CB;margin-top:3px;font-family:'Space Grotesk',sans-serif">All Sectors · ${allCount} galaxies</div>
      </button>
      ${C.CONSTELLATIONS.map(c => {
        const gals = C.GALAXIES.filter(g => g.constellationId === c.id);
        const count = gals.length;
        const active = activeConstellationId === c.id;
        const sub = active ? `<div style="margin:-3px 0 8px;padding:0 2px;display:flex;flex-direction:column;gap:2px">${gals.map(g => `
          <button onclick="__lexiNavGo('${g.id}')" style="display:flex;align-items:center;gap:7px;width:100%;text-align:left;padding:7px 10px;border-radius:10px;cursor:pointer;background:${selectedGalaxyId === g.id ? 'rgba(126,249,255,0.10)' : 'transparent'};border:1px solid ${selectedGalaxyId === g.id ? g.colorTheme + '66' : 'transparent'};transition:all 0.15s">
            <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${g.colorTheme};box-shadow:0 0 6px ${g.colorTheme}"></span>
            <span style="font-size:12px;color:#DCEAF2;font-weight:600;font-family:'Noto Sans SC',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.titleZh}</span>
            <span style="margin-left:auto;font-size:10px;color:#7E96A6;font-family:'Space Mono',monospace">${(g.wordCount || 0).toLocaleString()}</span>
          </button>`).join('')}</div>` : '';
        return `<button onclick="setConstellationFilter(${active ? 'null' : `'${c.id}'`})" style="width:100%;text-align:left;padding:10px 12px;border-radius:14px;margin-bottom:7px;cursor:pointer;background:${active ? `linear-gradient(155deg,rgba(126,249,255,0.09),rgba(90,200,220,0.04))` : 'linear-gradient(155deg,rgba(126,180,240,0.07),rgba(90,140,200,0.03))'};border:1px solid ${active ? c.color + '99' : 'rgba(150,200,255,0.15)'};box-shadow:${active ? `0 0 14px ${c.color}33` : 'none'};transition:all 0.18s">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:9px;height:9px;border-radius:50%;flex-shrink:0;background:${c.color};box-shadow:0 0 7px ${c.color}"></span>
            <span style="font-size:13px;font-weight:700;color:#EAF6FF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Noto Sans SC','Space Grotesk',sans-serif">${c.titleZh}</span>
            <span style="margin-left:auto;font-size:10px;color:#7E96A6">${active ? '▾' : '▸'}</span>
          </div>
          <div style="font-size:10.5px;color:#9DB6CB;margin-top:3px;line-height:1.3;font-family:'Space Grotesk',sans-serif">${c.title} · ${count} galaxies</div>
        </button>${sub}`;
      }).join('')}
    </div>`;
}
renderLeftNav();
window.setConstellationFilter = setConstellationFilter;
window.__lexiNavGo = (id) => {
  const g = C.GALAXIES.find(x => x.id === id);
  if (!g) return;
  universe.focusGalaxy(g.id);
  openGalaxy(g);
  renderLeftNav();
};

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
  if (!g) { previewEl.classList.remove('show'); return; }
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
  previewEl.classList.add('show');
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

    <div class="sec">WORD UNIVERSE / 单词星空</div>
    <div class="note">
      Enter this galaxy to see every word as a star — thousands on screen,
      word families joined into constellations, click any star to fly in.
      <br><br>
      进入星系后，每个单词就是一颗星星：数千颗同屏、词族连线成星座，点击任意星星镜头飞入。
    </div>

    <div class="actions">
      <button class="primary" id="mock-enter">Enter galaxy · 进入星系 ↗</button>
      <button class="ghost" id="mock-exit">Exit view · 退出视角</button>
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
  document.getElementById('mock-exit').addEventListener('click', closeDetail);
  renderGalaxyProgress(g);
}

function closeDetail() {
  selectedGalaxyId = null;
  detailEl.classList.remove('open');
  breadcrumbEl.classList.remove('with-trail');
  galaxyHud.style.display = 'none';
  universeHud.style.display = 'block';
  returnBtn.style.display = 'none';
  universe.clearFocus();
  renderLeftNav();
}
closeBtn.addEventListener('click', closeDetail);
returnBtn.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

window.__lexiverse = { universe, openGalaxy, closeDetail, catalog: C };

/* ═══ EXAM ROUTES overlay (mock) ═══════════════════════════════════════════ */
const X = window.LexiverseExam;
let currentExam = 'all';

(function buildExamUI() {
  return; // Exam Routes 启动器已移除 — 等级带星系本身就是考试路线
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
  if (!document.getElementById('ex-launch-cur')) return;
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
    window.location.href = 'Lexiverse Galaxy.html?galaxy=' + encodeURIComponent(g.id) + '&exam=' + b.dataset.study;
  }));
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const sel = document.getElementById('ex-selector'); if (sel) sel.classList.remove('open'); } });
window.__lexiverseExam = { selectExam, get current(){ return currentExam; } };

// ── 真实宇宙 HUD: 词量 = 各星系实际星数之和; 点亮/掌握聚合自学习记录 ──
(function fillUniverseHud() {
  const totalWords = C.GALAXIES.reduce((s, g) => s + (g.wordCount || 0), 0);
  let lit = 0, mast = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    try {
      if (k && k.startsWith('wu-lit-')) lit += (JSON.parse(localStorage.getItem(k)) || []).length;
      else if (k && k.startsWith('wu-mastered-')) mast += (JSON.parse(localStorage.getItem(k)) || []).length;
    } catch (e) { /* noop */ }
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('hud-words', totalWords.toLocaleString());
  set('hud-lit', lit.toLocaleString());
  set('hud-mastered', mast.toLocaleString());
  const fill = document.getElementById('hud-bar-fill');
  const note = document.getElementById('hud-bar-note');
  const pct = totalWords ? (lit / totalWords) * 100 : 0;
  const pctM = totalWords ? (mast / totalWords) * 100 : 0;
  if (fill) { fill.style.width = Math.max(0.5, pct).toFixed(2) + '%'; }
  const fillM = document.getElementById('hud-bar-fill-m');
  if (fillM) { fillM.style.width = Math.max(0, pctM).toFixed(2) + '%'; }
  if (note) note.textContent = '点亮 ' + pct.toFixed(1) + '% · 掌握 ' + pctM.toFixed(1) + '%';
})();

// ── 详情面板: 真实学习进度 (替代 mock 考试覆盖) ──
function renderGalaxyProgress(g) {
  let litN = 0, mastN = 0;
  try { litN = (JSON.parse(localStorage.getItem('wu-lit-' + g.id)) || []).length; } catch (e) { /* noop */ }
  try { mastN = (JSON.parse(localStorage.getItem('wu-mastered-' + g.id)) || []).length; } catch (e) { /* noop */ }
  const total = g.wordCount || 0;
  const pl = total ? Math.min(100, litN / total * 100) : 0;
  const pm = total ? Math.min(100, mastN / total * 100) : 0;
  const block = document.createElement('div');
  block.innerHTML = `<div class="sec">LEARNING PROGRESS · 学习进度</div>
    <div class="prog-row"><span>已学会</span><div class="prog"><i style="width:${pl.toFixed(1)}%;background:linear-gradient(90deg,rgba(255,233,168,0.5),#FFE9A8)"></i></div><b style="color:#FFE9A8">${litN}</b></div>
    <div class="prog-row"><span>已掌握</span><div class="prog"><i style="width:${pm.toFixed(1)}%;background:linear-gradient(90deg,#FFC85A,#FFD66B)"></i></div><b style="color:#FFD66B">${mastN}</b></div>
    <div class="prog-note">共 ${total.toLocaleString()} 颗单词星 · 进入星系标记学会、复习镀金</div>`;
  detailBody.appendChild(block);
}

// ── 左侧导航收起/展开 ──
window.__lexiNavCollapse = () => {
  document.getElementById('left-nav').classList.add('collapsed');
  document.getElementById('nav-expand').classList.add('show');
};
document.getElementById('nav-expand').addEventListener('click', () => {
  document.getElementById('left-nav').classList.remove('collapsed');
  document.getElementById('nav-expand').classList.remove('show');
});

// ── 顶部模块导航 ──
let uToastTimer = null;
function uToast(msg) {
  const el = document.getElementById('u-toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(uToastTimer);
  uToastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
document.getElementById('module-nav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mn]');
  if (!b) return;
  goModule(b.dataset.mn);
});

// ── 全部功能板块导航 (项目 16 个模块) ──
const MODULES = [
  { id: 'universe', zh: '宇宙总览', en: 'Universe', ic: '✦', c: '#7EF9FF' },
  { id: 'mine', zh: '我的星云', en: 'My Nebula', ic: '☄', c: '#FFA85A' },
  { id: 'today', zh: '今日计划', en: 'Today', ic: '◐', c: '#7EC9FF', route: 'today' },
  { id: 'drill', zh: '专练', en: 'Drill', ic: '✪', c: '#5FE0D6', route: 'drill' },
  { id: 'study', zh: '学习', en: 'Study', ic: '✎', c: '#6BE0A0', route: 'study' },
  { id: 'review', zh: '复习', en: 'Review', ic: '◉', c: '#FFD66B', route: 'memory' },
  { id: 'lexigraph', zh: '词图', en: 'LexiGraph', ic: '⬡', c: '#B79BFF', route: 'lexigraph' },
  { id: 'dictionary', zh: '词典', en: 'Dictionary', ic: '❝', c: '#9AD8FF', route: 'dictionary' },
  { id: 'reading', zh: '阅读', en: 'Reading', ic: '❯', c: '#FFB78A', route: 'reading' },
  { id: 'exam', zh: '考试', en: 'Exam', ic: '◈', c: '#FFC861', route: 'exam' },
  { id: 'quiz', zh: '测验', en: 'Quiz', ic: '◎', c: '#5FE0D6', route: 'quiz' },
  { id: 'memory', zh: '记忆宫殿', en: 'Memory', ic: '❂', c: '#C8B8FF', route: 'memory' },
  { id: 'pronunciation', zh: '发音', en: 'Pronunciation', ic: '♪', c: '#9CFFB0', route: 'pronunciation' },
  { id: 'scan', zh: '拍照查词', en: 'Scan', ic: '⛶', c: '#82B6FF', route: 'scan' },
  { id: 'wrong', zh: '错题本', en: 'Wrong', ic: '✕', c: '#FF8FA8', route: 'wrong-answers' },
  { id: 'navigator', zh: 'AI 领航员', en: 'Navigator', ic: '⎈', c: '#7EF9FF', route: 'chat' },
  { id: 'profile', zh: '我的', en: 'Profile', ic: '❉', c: '#FFE9A8', route: 'profile' },
];
// 返工FIX5：顶部快捷条对齐方案 A（宇宙·我的星云·今日·专练 + 全部）
const PRIMARY = ['universe', 'mine', 'today', 'drill'];
const CURRENT = 'universe';

function goModule(id) {
  if (id === 'universe') { closeDetail(); document.getElementById('module-grid').classList.remove('open'); return; }
  if (id === 'mine') { document.getElementById('module-grid').classList.remove('open'); uToast('我的星云 · 自由探索'); return; }
  const m = MODULES.find((x) => x.id === id);
  document.getElementById('module-grid').classList.remove('open');
  // 真实导航：postMessage 给外层 React（ReferenceLexiverseFrame 监听 lv:navigate → router.push）
  if (m && m.route) { try { window.parent.postMessage({ type: 'lv:navigate', href: '/' + m.route }, window.location.origin); } catch (e) { uToast('「' + m.zh + '」'); } }
}

(function renderModuleNav() {
  const nav = document.getElementById('module-nav');
  nav.innerHTML = PRIMARY.map((id) => {
    const m = MODULES.find((x) => x.id === id);
    return `<button class="mn ${id === CURRENT ? 'is-active' : ''}" data-mn="${id}"><span class="i">${m.ic}</span>${m.zh}</button>`;
  }).join('') + `<button class="mn more" id="mn-all"><span class="i">⋯</span>全部</button>`;
  document.getElementById('mn-all').addEventListener('click', () => document.getElementById('module-grid').classList.add('open'));

  const grid = document.getElementById('mg-grid');
  grid.innerHTML = MODULES.map((m) =>
    `<button class="mg-item ${m.id === CURRENT ? 'current' : ''}" data-mn="${m.id}" style="--c:${m.c}"><span class="mi-ic">${m.ic}</span><span class="mi-zh">${m.zh}</span><span class="mi-en">${m.en}</span></button>`).join('');
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mn]');
    if (!b) return;
    document.getElementById('module-grid').classList.remove('open');
    goModule(b.dataset.mn);
  });
  const mg = document.getElementById('module-grid');
  document.getElementById('mg-close').addEventListener('click', () => mg.classList.remove('open'));
  mg.addEventListener('click', (e) => { if (e.target === mg) mg.classList.remove('open'); });
})();
