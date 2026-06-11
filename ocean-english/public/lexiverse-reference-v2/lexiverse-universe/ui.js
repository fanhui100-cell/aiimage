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
  for (const btn of filterBar.querySelectorAll('[data-filter]')) {
    btn.classList.toggle('active', btn.dataset.filter === activeFilter);
  }
  applyFilter();
});
function applyFilter() {
  const set = activeFilter === 'all' ? null : new Set(C.GALAXIES.filter(g => g.sourceType === activeFilter).map(g => g.id));
  universe.setFilteredGalaxies(set);
  galaxyCountEl.textContent = set ? `${set.size} / ${C.GALAXIES.length}` : `${C.GALAXIES.length} / ${C.GALAXIES.length}`;
}
applyFilter();

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
  universe.focusGalaxy(g.id);
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
  document.getElementById('mock-enter').addEventListener('click', () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'lexiverse-enter-galaxy', galaxyId: g.id }, window.location.origin);
    } else {
      window.location.href = 'Lexiverse Galaxy.html?galaxy=' + encodeURIComponent(g.id);
    }
  });
  document.getElementById('mock-graph').addEventListener('click', () => { window.location.href = 'LexiGraph.html?galaxy=' + encodeURIComponent(g.id); });
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

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data || {};
  if (data.type !== 'lexiverse-preview-galaxy' || !data.galaxyId) return;
  const galaxy = C.GALAXIES.find(g => g.id === data.galaxyId);
  if (galaxy) openGalaxy(galaxy);
});

window.__lexiverse = { universe, openGalaxy, closeDetail, catalog: C };
