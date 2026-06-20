/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse WU · Galaxy page UI (vanilla DOM overlay, module)
   宇宙目录 → URL ?galaxy=<id> → 单词星空。
   学习闭环: 探索(点亮) → 复习舱(自测) → 掌握(金星) — 全部 localStorage 持久化
   ───────────────────────────────────────────────────────────────────────── */
import { createWordField, VARIANTS, hashStr, mulberry32 } from './wu-scene.js';

const C = window.LexiverseCatalog;
const params = new URLSearchParams(location.search);
const galaxyId = params.get('galaxy') || 'cet4';
const galaxy = C.GALAXIES.find((g) => g.id === galaxyId) || C.GALAXIES[0];
const constellation = C.CONSTELLATIONS.find((c) => c.id === galaxy.constellationId);

// 每个星系装入不同的单词子集 (原型: 从 CET-4 词库按星系种子抽样, 优先保留完整词族)
function sliceData(full, count, seed) {
  if (!count || count >= full.words.length) return full;
  const rnd = mulberry32(seed);
  const keep = new Set();
  const famOrder = full.families.map((_, i) => i);
  for (let i = famOrder.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [famOrder[i], famOrder[j]] = [famOrder[j], famOrder[i]]; }
  for (const fi of famOrder) {
    const f = full.families[fi];
    if (keep.size + f.length > count * 0.6) continue;
    f.forEach((wi) => keep.add(wi));
  }
  const wordOrder = full.words.map((_, i) => i);
  for (let i = wordOrder.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [wordOrder[i], wordOrder[j]] = [wordOrder[j], wordOrder[i]]; }
  for (const wi of wordOrder) { if (keep.size >= count) break; keep.add(wi); }
  const map = new Map();
  const words = [];
  [...keep].sort((a, b) => a - b).forEach((wi) => { map.set(wi, words.length); words.push(full.words[wi]); });
  const edges = full.edges.filter((e) => map.has(e[0]) && map.has(e[1])).map((e) => [map.get(e[0]), map.get(e[1]), e[2]]);
  const families = full.families.map((f) => f.filter((wi) => map.has(wi)).map((wi) => map.get(wi))).filter((f) => f.length >= 2);
  return { list: full.list, words, edges, families };
}
// 等级星系加载完整真实词表 (dataFile) — 有多少单词就有多少颗星; 其它星系从默认词库抽样
let FULL = window.WU_DATA;
const loadScript = (src) => new Promise((res) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
if (galaxy.dataFile) { if (await loadScript(galaxy.dataFile)) FULL = window.WU_DATA; }
else if (galaxy.isMine) { if (await loadScript('data/words-cet4-full.js')) FULL = window.WU_DATA; } // 我的星云用大词库作匹配池

// ── 全局学习记录 (跨星系聚合): 已学会 / 已掌握 / 收藏 / 错词 ──
const FAV_KEY = 'wu-fav', WRONG_KEY = 'wu-wrong';
function loadGlobalSet(key) { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (e) { return new Set(); } }
function allLearned() {
  const litAll = new Set(), mastAll = new Set();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i); if (!k) continue;
    try {
      if (k.startsWith('wu-lit-')) JSON.parse(localStorage.getItem(k) || '[]').forEach((w) => litAll.add(w));
      else if (k.startsWith('wu-mastered-')) JSON.parse(localStorage.getItem(k) || '[]').forEach((w) => mastAll.add(w));
    } catch (e) { /* noop */ }
  }
  return { litAll, mastAll };
}

// ── 我的星云: 由 学会+掌握+收藏+错词 聚合而成, 0 起步, 按类别着色 + 筛选 ──
const MINE_CATS = {
  learned:  { zh: '已学会', color: '#FFE9A8' },
  mastered: { zh: '已掌握', color: '#FFD66B' },
  fav:      { zh: '收藏',   color: '#FF9BD2' },
  wrong:    { zh: '错词',   color: '#FF7A8A' },
};
const mineCat = params.get('cat') || 'all';
let mineCatOf = null;     // newIdx -> category
let mineCounts = null;

let DATA;
if (galaxy.isMine) {
  const { litAll, mastAll } = allLearned();
  const fav = loadGlobalSet(FAV_KEY), wrong = loadGlobalSet(WRONG_KEY);
  const catFor = (w) => wrong.has(w) ? 'wrong' : fav.has(w) ? 'fav' : mastAll.has(w) ? 'mastered' : litAll.has(w) ? 'learned' : null;
  mineCounts = { all: 0, learned: 0, mastered: 0, fav: 0, wrong: 0 };
  const keep = [];
  FULL.words.forEach((w, i) => {
    const c = catFor(w[0]); if (!c) return;
    mineCounts[c]++; mineCounts.all++;
    if (mineCat === 'all' || mineCat === c) keep.push(i);
  });
  const map = new Map(); const words = []; mineCatOf = [];
  keep.forEach((i) => { map.set(i, words.length); words.push(FULL.words[i]); mineCatOf.push(catFor(FULL.words[i][0])); });
  const edges = FULL.edges.filter((e) => map.has(e[0]) && map.has(e[1])).map((e) => [map.get(e[0]), map.get(e[1]), e[2]]);
  const families = FULL.families.map((f) => f.filter((wi) => map.has(wi)).map((wi) => map.get(wi))).filter((f) => f.length >= 2);
  DATA = { list: '我的星云', words, edges, families };
} else {
  DATA = galaxy.dataFile ? FULL : sliceData(FULL, galaxy.protoCount || 900, hashStr(galaxyId + ':slice'));
}

const $ = (s) => document.querySelector(s);

// ── breadcrumb / header ──────────────────────────────────────────────────
$('#crumb-constellation').textContent = constellation ? constellation.title : '';
$('#crumb-galaxy').textContent = galaxy.title;
$('#crumb-galaxy-zh').textContent = ' · ' + galaxy.titleZh;
$('#galaxy-dot').style.background = galaxy.colorTheme;
$('#return-btn').addEventListener('click', () => {
  location.href = 'Lexiverse Universe.html' + (galaxy.constellationId ? '?constellation=' + encodeURIComponent(galaxy.constellationId) : '');
});

// ── learning state (lit → mastered) ──────────────────────────────────────
const LIT_KEY = 'wu-lit-' + galaxyId, MASTER_KEY = 'wu-mastered-' + galaxyId;
let lit = new Set(), mastered = new Set();
try { lit = new Set(JSON.parse(localStorage.getItem(LIT_KEY) || '[]')); } catch (e) { /* noop */ }
try { mastered = new Set(JSON.parse(localStorage.getItem(MASTER_KEY) || '[]')); } catch (e) { /* noop */ }
let favSet = loadGlobalSet(FAV_KEY), wrongSet = loadGlobalSet(WRONG_KEY);
const saveLit = () => localStorage.setItem(LIT_KEY, JSON.stringify([...lit]));
const saveMastered = () => localStorage.setItem(MASTER_KEY, JSON.stringify([...mastered]));
const saveFav = () => localStorage.setItem(FAV_KEY, JSON.stringify([...favSet]));
const saveWrong = () => localStorage.setItem(WRONG_KEY, JSON.stringify([...wrongSet]));

// ── scene ────────────────────────────────────────────────────────────────
const field = createWordField($('#canvas-wrap'), DATA, {
  tint: galaxy.colorTheme,
  colorOf: galaxy.isMine ? (wi) => MINE_CATS[mineCatOf[wi]] && MINE_CATS[mineCatOf[wi]].color : null,
  onSelect: (wi) => openWord(wi, true),
  onHover: (wi) => { hoveredWi = wi; },
});
const startVariant = VARIANTS[galaxy.wuVariant] ? galaxy.wuVariant : 'nebula';
field.layout(startVariant);
field.setLit(lit, mastered);
window.__wuField = field;

// stats hud
$('#stat-total').textContent = DATA.words.length.toLocaleString();
$('#stat-fam').textContent = DATA.families.length;
function refreshStats() {
  $('#stat-lit').textContent = lit.size;
  $('#stat-mastered').textContent = mastered.size;
  $('#review-count').textContent = [...lit].filter((w) => !mastered.has(w)).length;
}
refreshStats();

function toggleLearn(wi) {
  const word = DATA.words[wi][0];
  if (lit.has(word)) {
    lit.delete(word); mastered.delete(word);
    saveLit(); saveMastered();
    toast('已取消标记 — 这颗星回到未学状态');
    notifyExt('unlearn', word);
  } else {
    lit.add(word); saveLit();
    toast('✦ 已标记学会 — 星星点亮，去复习舱自测可镞金');
    notifyExt('learn', word);
  }
  field.setLit(lit, mastered);
  refreshStats(); refreshRow(word);
  if (selectedWi === wi) openWord(wi, false);
}
function speak(word) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US'; u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* noop */ }
}
function markMastered(word) {
  if (mastered.has(word)) return;
  mastered.add(word); saveMastered();
  wrongSet.delete(word); saveWrong(); // 答对即从错词移除
  field.setLit(lit, mastered); refreshStats(); refreshRow(word);
  notifyExt('mastered', word);
}
function toggleFav(wi) {
  const word = DATA.words[wi][0];
  if (favSet.has(word)) { favSet.delete(word); toast('已取消收藏'); notifyExt('unfav', word); }
  else { favSet.add(word); toast('♥ 已收藏 — 进「我的星云」查看'); notifyExt('fav', word); }
  saveFav();
  if (selectedWi === wi) openWord(wi, false);
}
function markWrong(word) { wrongSet.add(word); saveWrong(); notifyExt('wrong', word); }

// ── 实装集成缝 (additive) — 由 wu-bridge.js 接 React store / 真 SRS，原型独立运行时为 no-op ──
function notifyExt(kind, word) {
  try { if (window.__wuUI && typeof window.__wuUI.onChange === 'function') window.__wuUI.onChange(kind, word, galaxyId); } catch (e) { /* noop */ }
}
const __slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── toast ────────────────────────────────────────────────────────────────
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ── label overlay (pooled divs, top-K by screen prominence) ──────────────
const labelLayer = $('#label-layer');
const POOL = 96;
const pool = [];
for (let i = 0; i < POOL; i++) {
  const d = document.createElement('div');
  d.className = 'wu-label';
  d.style.display = 'none';
  labelLayer.appendChild(d);
  pool.push(d);
}
let hoveredWi = -1, selectedWi = -1;
let labelDensity = 16;
const scratch = [];

field.onFrame(() => {
  const P = field.projected;
  const w = labelLayer.clientWidth, h = labelLayer.clientHeight;
  scratch.length = 0;
  for (let i = 0; i < DATA.words.length; i++) {
    const ok = P[i * 3 + 2];
    if (!ok) continue;
    const x = P[i * 3], y = P[i * 3 + 1];
    if (x < 30 || x > w - 30 || y < 24 || y > h - 24) continue;
    const word = DATA.words[i][0];
    const score = DATA.words[i][4] * 1.4 + ok * 6 + (lit.has(word) ? 1.2 : 0) + (mastered.has(word) ? 1.2 : 0);
    scratch.push([score, i]);
  }
  scratch.sort((a, b) => b[0] - a[0]);
  const items = [];
  const taken = new Set();
  const grid = new Set();
  const push = (wi, forced) => {
    if (wi < 0 || taken.has(wi) || items.length >= POOL) return;
    const x = P[wi * 3], y = P[wi * 3 + 1];
    const cell = ((x / 92) | 0) + ':' + ((y / 28) | 0);
    if (!forced && grid.has(cell)) return;
    grid.add(cell); taken.add(wi);
    items.push({ wi, x, y, forced });
  };
  push(selectedWi, true);
  push(hoveredWi, true);
  const max = Math.min(labelDensity, scratch.length);
  for (let k = 0; k < scratch.length && items.length < max + 2; k++) push(scratch[k][1], false);
  for (let i = 0; i < POOL; i++) {
    const d = pool[i];
    if (i < items.length) {
      const it = items[i];
      const word = DATA.words[it.wi];
      const near = P[it.wi * 3 + 2];
      d.style.display = 'block';
      d.style.transform = `translate(-50%,-150%) translate(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px)`;
      d.style.fontSize = (it.forced ? 14 : 10.5 + near * 4 + word[4] * 0.5).toFixed(1) + 'px';
      d.classList.toggle('is-lit', lit.has(word[0]) && !mastered.has(word[0]));
      d.classList.toggle('is-mastered', mastered.has(word[0]));
      d.classList.toggle('is-active', it.wi === selectedWi || it.wi === hoveredWi);
      if (d.textContent !== word[0]) d.textContent = word[0];
    } else d.style.display = 'none';
  }
});

// ── word list (left panel) ───────────────────────────────────────────────
const listEl = $('#word-list-body');
let rows = new Array(DATA.words.length).fill(null);
const wordToWi = new Map(DATA.words.map((w, i) => [w[0], i]));
const listOrder = DATA.words.map((_, i) => i).sort((a, b) => DATA.words[a][0].localeCompare(DATA.words[b][0]));
const LIST_CAP = 2500;
function renderList(q) {
  rows = new Array(DATA.words.length).fill(null);
  const frag = document.createDocumentFragment();
  let shown = 0, matched = 0;
  for (const wi of listOrder) {
    const w = DATA.words[wi];
    if (q && !(w[0].toLowerCase().includes(q) || w[2].includes(q))) continue;
    matched++;
    if (shown >= LIST_CAP) continue;
    shown++;
    const row = document.createElement('button');
    row.className = 'wl-row';
    row.dataset.wi = wi;
    row.innerHTML = `<span class="st"></span><b>${w[0]}</b><span class="zh">${w[2]}</span>`;
    frag.appendChild(row);
    rows[wi] = row;
    refreshRowEl(row, w[0]);
  }
  listEl.innerHTML = '';
  listEl.appendChild(frag);
  if (matched > shown) {
    const more = document.createElement('div');
    more.style.cssText = 'padding:9px 10px;font-size:10.5px;color:#7E96A6;';
    more.textContent = `共 ${matched.toLocaleString()} 词 · 显示前 ${shown.toLocaleString()} · 输入筛选查看更多`;
    listEl.appendChild(more);
  }
}
renderList('');
listEl.addEventListener('click', (e) => {
  const b = e.target.closest('.wl-row');
  if (b) openWord(+b.dataset.wi, true);
});
$('#word-list-filter').addEventListener('input', (e) => {
  renderList(e.target.value.trim().toLowerCase());
});
function refreshRowEl(row, word) {
  row.classList.toggle('is-lit', lit.has(word) && !mastered.has(word));
  row.classList.toggle('is-mastered', mastered.has(word));
}
function refreshRow(word) {
  const wi = wordToWi.get(word);
  if (wi != null && rows[wi]) refreshRowEl(rows[wi], word);
}
function highlightRow(wi) {
  listEl.querySelectorAll('.wl-row.is-active').forEach((r) => r.classList.remove('is-active'));
  const row = rows[wi];
  if (!row) return;
  row.classList.add('is-active');
  const panel = $('#word-list');
  if (!panel.classList.contains('open')) return;
  listEl.scrollTop = row.offsetTop - listEl.clientHeight / 2 + 14;
}
$('#list-toggle').addEventListener('click', () => {
  const panel = $('#word-list');
  panel.classList.toggle('open');
  $('#list-toggle').classList.toggle('on', panel.classList.contains('open'));
});

// ── nav (功能板块) — 模块网格弹层 ──────────────────────────────────────
const GAL_MODULES = [
  { id: 'universe', zh: '宇宙总览', en: 'Universe', ic: '✦', c: '#7EF9FF' },
  { id: 'mine', zh: '我的星云', en: 'My Nebula', ic: '☄', c: '#FFA85A' },
  { id: 'today', zh: '今日计划', en: 'Today', ic: '◐', c: '#7EC9FF', route: 'today' },
  { id: 'drill', zh: '专练', en: 'Drill', ic: '✪', c: '#5FE0D6', route: 'drill' },
  { id: 'study', zh: '学习', en: 'Study', ic: '✎', c: '#6BE0A0', route: 'study' },
  { id: 'review', zh: '复习舱', en: 'Review', ic: '◉', c: '#FFD66B' },
  { id: 'lexigraph', zh: '词图', en: 'LexiGraph', ic: '⬡', c: '#B79BFF', route: 'lexigraph' },
  { id: 'dictionary', zh: '词典', en: 'Dictionary', ic: '❑', c: '#9AD8FF', route: 'dictionary' },
  { id: 'reading', zh: '阅读', en: 'Reading', ic: '❯', c: '#FFB78A', route: 'reading' },
  { id: 'exam', zh: '考试', en: 'Exam', ic: '◈', c: '#FFC861', route: 'exam' },
  { id: 'quiz', zh: '测验', en: 'Quiz', ic: '◎', c: '#5FE0D6', route: 'quiz' },
  { id: 'memory', zh: '记忆宫殿', en: 'Memory', ic: '❂', c: '#C8B8FF', route: 'memory' },
  { id: 'pronunciation', zh: '发音', en: 'Pronunciation', ic: '♪', c: '#9CFFB0', route: 'pronunciation' },
  { id: 'scan', zh: '拍照查词', en: 'Scan', ic: '⛶', c: '#82B6FF', route: 'scan' },
  { id: 'wrong', zh: '错题本', en: 'Wrong', ic: '✗', c: '#FF8FA8', route: 'wrong-answers' },
  { id: 'navigator', zh: 'AI 领航员', en: 'Navigator', ic: '⎈', c: '#7EF9FF', route: 'chat' },
  { id: 'profile', zh: '我的', en: 'Profile', ic: '❉', c: '#FFE9A8', route: 'profile' },
];
const CUR_MODULE = galaxy.isMine ? 'mine' : 'galaxy';
function goModule(id) {
  $('#module-grid').classList.remove('open');
  if (id === 'universe') { location.href = 'Lexiverse Universe.html'; return; }
  if (id === 'mine') { location.href = 'Lexiverse Galaxy.html?galaxy=mine'; return; }
  if (id === 'review') { openReview(); return; }
  const m = GAL_MODULES.find((x) => x.id === id);
  // 返工FIX5：真实导航 — postMessage 给外层 React（监听 lv:navigate → router.push）
  if (m && m.route) { try { window.parent.postMessage({ type: 'lv:navigate', href: '/' + m.route }, window.location.origin); } catch (e) { toast('「' + m.zh + '」'); } }
}
(function buildGalaxyModuleGrid() {
  const grid = $('#mg-grid');
  grid.innerHTML = GAL_MODULES.map((m) =>
    `<button class="mg-item ${m.id === CUR_MODULE ? 'current' : ''}" data-mn="${m.id}" style="--c:${m.c}"><span class="mi-ic">${m.ic}</span><span class="mi-zh">${m.zh}</span><span class="mi-en">${m.en}</span></button>`).join('');
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-mn]'); if (b) goModule(b.dataset.mn); });
  const mg = $('#module-grid');
  $('#mg-close').addEventListener('click', () => mg.classList.remove('open'));
  mg.addEventListener('click', (e) => { if (e.target === mg) mg.classList.remove('open'); });
  $('#nav-toggle').addEventListener('click', (e) => { e.stopPropagation(); mg.classList.add('open'); });
})();

// ── 我的星云: 分类筛选条 (学会/收藏/错词) ───────────────────────────────
if (galaxy.isMine) {
  const bar = $('#mine-bar');
  bar.classList.add('show');
  const cats = [
    ['all', '全部', '#FFA85A'],
    ['learned', '已学会', MINE_CATS.learned.color],
    ['mastered', '已掌握', MINE_CATS.mastered.color],
    ['fav', '收藏', MINE_CATS.fav.color],
    ['wrong', '错词', MINE_CATS.wrong.color],
  ];
  bar.innerHTML = cats.map(([id, zh, c]) =>
    `<button class="${id === mineCat ? 'active' : ''}" data-cat="${id}"><span class="sw" style="color:${c}"></span>${zh} <b>${mineCounts[id] || 0}</b></button>`).join('');
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (b) location.href = 'Lexiverse Galaxy.html?galaxy=mine&cat=' + b.dataset.cat;
  });
  if (DATA.words.length === 0) {
    setTimeout(() => toast('我的星云还是空的 — 去任意星系标记「已学会」「收藏」或在复习舱答错，星星就会出现在这里'), 600);
  }
}

// ── word card ────────────────────────────────────────────────────────────
const card = $('#word-card');
const STAR = (n) => '★'.repeat(n) + '<span class="dim">' + '★'.repeat(5 - n) + '</span>';

function relatedOf(wi) {
  const fam = [], syn = [], conf = [];
  const fi = DATA.families.findIndex((f) => f.includes(wi));
  if (fi >= 0) DATA.families[fi].forEach((o) => { if (o !== wi) fam.push(o); });
  DATA.edges.forEach((e) => {
    const o = e[0] === wi ? e[1] : e[1] === wi ? e[0] : -1;
    if (o < 0) return;
    if (e[2] === 0) { if (!fam.includes(o)) fam.push(o); }
    else if (e[2] === 1) { if (!syn.includes(o)) syn.push(o); }
    else if (!conf.includes(o)) conf.push(o);
  });
  return { fam, syn, conf };
}

// 派生放射图 (SVG radial map)
function radialSvg(wi, fam) {
  const cx = 140, cy = 112, R = 78;
  const items = fam.slice(0, 8);
  const nodes = items.map((o, k) => {
    const a = -Math.PI / 2 + (k / items.length) * Math.PI * 2;
    return { o, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.82 };
  });
  return `<svg class="radial" viewBox="0 0 280 224">
    <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.82}" fill="none" stroke="rgba(126,249,255,0.18)" stroke-dasharray="3 5"></ellipse>
    ${nodes.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="rgba(255,214,107,0.30)"></line>`).join('')}
    <text x="${cx}" y="${cy + 4}" class="rad-center">${DATA.words[wi][0]}</text>
    ${nodes.map((p) => `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" class="rad-node" data-wi="${p.o}">${DATA.words[p.o][0]}<tspan x="${p.x.toFixed(1)}" dy="11">${(DATA.words[p.o][2] || '').slice(0, 7)}</tspan></text>`).join('')}
  </svg>`;
}

function openWord(wi, fly) {
  selectedWi = wi;
  field.select(wi);
  if (fly) field.flyTo(wi, 85);
  highlightRow(wi);
  const [word, ipa, zh, pos, stars, phrases, sent] = DATA.words[wi];
  const isLit = lit.has(word), isMast = mastered.has(word), isFav = favSet.has(word);
  const rel = relatedOf(wi);
  const posCh = pos ? pos.split(/[\s&]+/)[0] : 'v';
  // 1 单词派生 (radial)
  const radial = rel.fam.length
    ? `<div class="sec">单词派生<span class="en">DERIVATION</span></div>${radialSvg(wi, rel.fam)}`
    : '';
  // 2 同义替换
  const synBlock = rel.syn.length
    ? `<div class="sec">同义替换<span class="en">SYNONYMS</span>${stars >= 4 ? '<span class="wc-tag ielts">高频考点</span>' : ''}</div>
       <div class="wc-block wc-syn"><span class="pos">${posCh}.</span><span class="ws">${rel.syn.map((o) => `<b data-wi="${o}">${DATA.words[o][0]}</b>`).join('')}</span></div>`
    : '';
  // 3 单词关系 (易混)
  const confBlock = rel.conf.length
    ? `<div class="sec">易混辨析<span class="en">CONFUSABLE</span></div>
       <div class="chips">${rel.conf.map((o) => `<button class="chip chip-conf" data-wi="${o}">${DATA.words[o][0]}</button>`).join('')}</div>`
    : '';
  // 4 单词搭配
  const phHtml = (phrases && phrases.length)
    ? `<div class="sec">词组搭配<span class="en">PHRASES</span><span class="wc-tag write">写作口语</span></div>${phrases.map((p) => `<div class="ph"><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}`
    : '';
  // 5 考点
  const examBits = [];
  examBits.push(`<div class="ph"><b>高频指数</b><span>${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ${stars >= 4 ? '高频核心词' : stars === 3 ? '中频词' : '低频进阶词'}</span></div>`);
  examBits.push(`<div class="ph"><b>所属词表</b><span>${DATA.list} · ${galaxy.titleZh}</span></div>`);
  if (pos) examBits.push(`<div class="ph"><b>常考词性</b><span>${pos}.</span></div>`);
  if (rel.conf.length) examBits.push(`<div class="ph"><b>易混提醒</b><span>注意与 ${rel.conf.slice(0, 3).map((o) => DATA.words[o][0]).join(' / ')} 区分</span></div>`);
  const examHtml = `<div class="sec">考点<span class="en">EXAM FOCUS</span></div>${examBits.join('')}`;
  // 6 例句 (逐句发音)
  const sentHtml = sent
    ? `<div class="sec">例句<span class="en">EXAMPLE</span></div>
       <div class="sent-card"><div class="sc-text"><div class="sent">${sent[0].replace(new RegExp('(' + word + ')', 'ig'), '<b>$1</b>')}</div><div class="sent-zh">${sent[1]}</div></div><button class="sc-speak" data-say="${sent[0].replace(/"/g, '&quot;')}">🔊</button></div>`
    : '';
  // 7 关联词汇 (空间近邻)
  const shown = new Set([wi, ...rel.fam, ...rel.syn, ...rel.conf]);
  const nearby = field.nearbyWords(wi, 16).filter((o) => !shown.has(o)).slice(0, 6);
  const nearHtml = nearby.length
    ? `<div class="sec">关联词汇<span class="en">RELATED</span></div><div class="chips">${nearby.map((o) => `<button class="chip chip-near" data-wi="${o}">${DATA.words[o][0]}</button>`).join('')}</div>`
    : '';
  const state = isMast ? '<span class="gold">★ 已掌握</span>' : isLit ? '✦ 已学会 — 复习舱自测后变为掌握' : '○ 未学 — 学会后点上方按钮点亮这颗星';
  card.innerHTML = `
    <button class="x" id="card-close">✕</button>
    <div class="eyebrow"><span class="dot" style="background:${galaxy.colorTheme}"></span>WORD STAR · 单词星</div>
    <h1>${word}</h1>
    <div class="ipa">/${ipa}/ <button class="speak" id="speak-btn" title="发音">🔊 发音</button><span class="stars">${STAR(stars)}</span></div>
    <div class="zh">${zh}</div>
    <button class="learn-btn ${isLit ? 'on' : ''}" id="act-learn">${isMast ? '★ 已掌握 · 点击取消' : isLit ? '★ 已学会 · 点击取消' : '☆ 标记已学会'}</button>
    <button class="fav-btn ${isFav ? 'on' : ''}" id="act-fav">${isFav ? '♥ 已收藏 · 点击取消' : '♡ 收藏到我的星云'}</button>
    ${radial}${synBlock}${confBlock}${phHtml}${examHtml}${sentHtml}${nearHtml}
    <div class="card-actions">
      <button class="act" id="act-review">◉ 复习舱自测</button>
      <button class="act" id="act-graph">⬡ 词图 ↗</button>
    </div>
    <div class="lit-note">${state}</div>`;
  card.classList.add('open');
  $('#card-close').addEventListener('click', closeWord);
  card.querySelectorAll('.chip, .rad-node, .wc-syn b').forEach((b) => b.addEventListener('click', () => openWord(+b.dataset.wi, true)));
  $('#act-learn').addEventListener('click', () => toggleLearn(wi));
  $('#act-fav').addEventListener('click', () => toggleFav(wi));
  $('#speak-btn').addEventListener('click', () => speak(word));
  card.querySelectorAll('.sc-speak').forEach((b) => b.addEventListener('click', () => speak(b.dataset.say)));
  $('#act-review').addEventListener('click', () => openReview(wi));
  $('#act-graph').addEventListener('click', () => toast('词图 LexiGraph — 实装时跳转 LexiGraph.html?word=' + word));
}
function closeWord() {
  selectedWi = -1;
  field.select(null);
  card.classList.remove('open');
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeWord(); $('#search-results').style.display = 'none'; $('#review').classList.remove('open'); $('#nav-menu').classList.remove('open'); }
});

// ── review quiz (复习舱 — 闭环: 点亮 → 自测 → 掌握) ─────────────────────
const reviewEl = $('#review');
let quizQueue = [], quizIdx = 0, quizRight = 0;
function openReview(focusWi) {
  const pool2 = [...lit].filter((w) => !mastered.has(w)).map((w) => wordToWi.get(w)).filter((x) => x != null);
  if (focusWi != null && !pool2.includes(focusWi) && !mastered.has(DATA.words[focusWi][0])) pool2.unshift(focusWi);
  if (!pool2.length) { toast('没有待复习的单词 — 先把学过的词标记为已学会 ☆'); return; }
  // shuffle, cap 8
  for (let i = pool2.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool2[i], pool2[j]] = [pool2[j], pool2[i]]; }
  quizQueue = pool2.slice(0, 8);
  if (focusWi != null && quizQueue.includes(focusWi)) quizQueue = [focusWi, ...quizQueue.filter((x) => x !== focusWi)];
  quizIdx = 0; quizRight = 0;
  reviewEl.classList.add('open');
  renderQuiz();
}
function renderQuiz() {
  if (quizIdx >= quizQueue.length) {
    if (quizRight === quizQueue.length && quizQueue.length > 0) { // 全对 → 镀金后直接退出
      toast('★ 全部命中 · ' + quizQueue.length + ' 颗星星已镀金');
      reviewEl.classList.remove('open');
      refreshStats();
      return;
    }
    reviewEl.querySelector('.rv-body').innerHTML = `
      <div class="rv-done">
        <div class="big">${quizRight} / ${quizQueue.length}</div>
        <div class="msg">答对的星星已变为金色 · 答错的已加入错词，留在复习舱</div>
        <button class="rv-btn" id="rv-again">再来一轮</button>
        <button class="rv-btn ghost" id="rv-close2">返回星空</button>
      </div>`;
    $('#rv-again').addEventListener('click', () => openReview());
    $('#rv-close2').addEventListener('click', () => reviewEl.classList.remove('open'));
    refreshStats();
    return;
  }
  const wi = quizQueue[quizIdx];
  const w = DATA.words[wi];
  // 1 correct + 3 distractors
  const opts = [{ zh: w[2], ok: true }];
  const used = new Set([wi]);
  while (opts.length < 4) {
    const r = (Math.random() * DATA.words.length) | 0;
    if (used.has(r) || !DATA.words[r][2]) continue;
    used.add(r); opts.push({ zh: DATA.words[r][2], ok: false });
  }
  for (let i = opts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [opts[i], opts[j]] = [opts[j], opts[i]]; }
  reviewEl.querySelector('.rv-body').innerHTML = `
    <div class="rv-prog">${quizIdx + 1} / ${quizQueue.length}</div>
    <div class="rv-word">${w[0]}</div>
    <div class="rv-ipa">/${w[1]}/</div>
    <div class="rv-opts">${opts.map((o, k) => `<button class="rv-opt" data-ok="${o.ok ? 1 : 0}" data-k="${k}">${o.zh}</button>`).join('')}</div>`;
  reviewEl.querySelectorAll('.rv-opt').forEach((b) => b.addEventListener('click', () => {
    if (reviewEl.dataset.lock) return;
    reviewEl.dataset.lock = '1';
    const ok = b.dataset.ok === '1';
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) reviewEl.querySelector('.rv-opt[data-ok="1"]').classList.add('right');
    if (ok) { quizRight++; markMastered(w[0]); }
    else markWrong(w[0]);
    setTimeout(() => { delete reviewEl.dataset.lock; quizIdx++; renderQuiz(); }, ok ? 650 : 1300);
  }));
}
$('#review-launch').addEventListener('click', () => openReview());
$('#rv-close').addEventListener('click', () => reviewEl.classList.remove('open'));

// ── search ───────────────────────────────────────────────────────────────
const searchEl = $('#search'), resultsEl = $('#search-results');
searchEl.addEventListener('input', () => {
  const q = searchEl.value.trim().toLowerCase();
  if (q.length < 1) { resultsEl.style.display = 'none'; return; }
  const hits = [];
  for (let i = 0; i < DATA.words.length && hits.length < 8; i++) {
    const w = DATA.words[i];
    if (w[0].toLowerCase().startsWith(q) || w[2].includes(q)) hits.push(i);
  }
  if (!hits.length) { resultsEl.style.display = 'none'; return; }
  resultsEl.innerHTML = hits.map((i) => `<button data-wi="${i}"><b>${DATA.words[i][0]}</b><span>${DATA.words[i][2]}</span></button>`).join('');
  resultsEl.style.display = 'block';
});
resultsEl.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-wi]');
  if (!b) return;
  resultsEl.style.display = 'none';
  searchEl.value = '';
  openWord(+b.dataset.wi, true);
});

// ── variant switcher (morphs in-place) ───────────────────────────────────
const variantBar = $('#variant-bar');
variantBar.innerHTML = Object.entries(VARIANTS).map(([k, v]) =>
  `<button data-variant="${k}" class="${k === startVariant ? 'active' : ''}"><b>${k.toUpperCase()}</b><span>${v.zh}</span></button>`).join('');
variantBar.addEventListener('click', (e) => {
  const b = e.target.closest('[data-variant]');
  if (!b) return;
  setVariant(b.dataset.variant);
});
function setVariant(v) {
  if (v === 'auto' || !VARIANTS[v]) return; // 'auto' = 保持星系默认布局
  if (field.variant === v) return;
  field.layout(v);
  field.applyConfig({});
  variantBar.querySelectorAll('[data-variant]').forEach((x) => x.classList.toggle('active', x.dataset.variant === v));
  if (selectedWi >= 0) setTimeout(() => field.select(selectedWi), 1200);
  if (window.__wuSyncTweak) window.__wuSyncTweak('variant', v);
}

// ── view controls ────────────────────────────────────────────────────────
$('#reset-view').addEventListener('click', () => { closeWord(); field.resetView(); });
let drifting = true;
$('#drift-toggle').addEventListener('click', () => setDrift(!drifting));
function setDrift(on) {
  drifting = on;
  field.applyConfig({ drift: on });
  $('#drift-toggle').classList.toggle('on', on);
  $('#drift-toggle').textContent = on ? '◉ 自动旋转 · 开' : '○ 自动旋转 · 关';
  if (window.__wuSyncTweak) window.__wuSyncTweak('drift', on);
}

// bridge for the Tweaks panel
window.__wuUI = {
  setVariant,
  setLabelDensity: (n) => { labelDensity = n; },
  applyConfig: (cfg) => { if (cfg.drift !== undefined && cfg.drift !== drifting) { drifting = cfg.drift; $('#drift-toggle').classList.toggle('on', drifting); $('#drift-toggle').textContent = drifting ? '◉ 自动旋转 · 开' : '○ 自动旋转 · 关'; } return field.applyConfig(cfg); },
  setSpread: (k) => field.setSpread(k),
  relight: () => { lit.clear(); mastered.clear(); saveLit(); saveMastered(); field.setLit(lit, mastered); refreshStats(); renderList($('#word-list-filter').value.trim().toLowerCase()); },
  // ── 实装集成缝 (additive) ──
  onChange: null,   // wu-bridge.js 设为 (kind, word, galaxyId) => void，回写真 SRS
  // 真 SRS → 星色: ext = { mastered:[slug...], learned:[slug...] }（并集叠加，不回退本地）
  applyExternalStates: (ext) => {
    if (!ext) return;
    const mastSet = new Set((ext.mastered || []).map(__slug));
    const litSet = new Set((ext.learned || []).map(__slug));
    if (!mastSet.size && !litSet.size) return;
    let changed = false;
    for (const w of DATA.words) {
      const ws = __slug(w[0]);
      if (mastSet.has(ws) && !mastered.has(w[0])) { mastered.add(w[0]); lit.add(w[0]); changed = true; }
      else if (litSet.has(ws) && !lit.has(w[0])) { lit.add(w[0]); changed = true; }
    }
    if (changed) { saveLit(); saveMastered(); field.setLit(lit, mastered); refreshStats(); renderList($('#word-list-filter').value.trim().toLowerCase()); }
  },
  // 外部 ?word= 定位: slug/词形 → 打开词卡 + 相机飞入
  focusWord: (s) => {
    const direct = wordToWi.get(String(s || '').toLowerCase());
    let wi = direct != null ? direct : null;
    if (wi == null) { const ns = __slug(s); for (const [word, idx] of wordToWi) { if (__slug(word) === ns) { wi = idx; break; } } }
    if (wi != null) openWord(wi, true);
    return wi != null;
  },
  galaxyId,
};
field.applyConfig({});
field.intro();        // 开场: 从深空飞入星系
field.renderOnce();   // paint a correct first frame even before rAF kicks in

// ── Tweaks 面板收纳开关 (右下 ⚙) ──
let tweaksOpen = false;
const tweaksBtn = document.getElementById('tweaks-toggle');
if (tweaksBtn) {
  tweaksBtn.addEventListener('click', () => {
    tweaksOpen = !tweaksOpen;
    window.postMessage({ type: tweaksOpen ? '__activate_edit_mode' : '__deactivate_edit_mode' }, '*');
    tweaksBtn.classList.toggle('on', tweaksOpen);
  });
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === '__edit_mode_dismissed') { tweaksOpen = false; tweaksBtn.classList.remove('on'); }
  });
}
