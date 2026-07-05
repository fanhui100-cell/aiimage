/* Lexiverse · Galaxy field app chrome (shared)
   Reads window.LEX_MODE = { mode:'overview'|'focus'|'inspect', sector, planet, pageTitle }
   Builds the Liquid-Glass chrome and wires it to the galaxy-field engine. */
import { createGalaxyField } from './galaxy-field.js';

const D = window.LexiverseSectors;
const CFG = window.LEX_MODE || { mode: 'overview' };
const G = D.GALAXY;

const STATUS_COLOR = { active: 'var(--cyan)', growing: 'var(--mint)', forming: 'var(--coral)' };

/* ── build chrome DOM ──────────────────────────────────────────────────── */
const ui = document.getElementById('ui');
ui.innerHTML = `
  <div class="ga-top">
    <div class="ga-brandwrap lg-surface">
      <div class="ga-logo">L</div>
      <nav class="ga-crumbs">
        <button class="home" id="ga-home">Lexiverse</button>
        <span class="sep">/</span>
        <span class="gx">${G.title}<i>${G.titleZh}</i></span>
        <span class="sep" id="sec-sep" style="display:none">/</span>
        <span class="sec" id="sec-crumb"></span>
      </nav>
    </div>
    <div class="right">
      <button class="lg-btn lg-btn--sm ga-return" id="ga-return">↑ Overview · 总览</button>
      <div class="ga-lod lg-surface">LOD · <b id="ga-lod">Galaxy Overview</b></div>
    </div>
  </div>

  <div class="ga-search">
    <input class="lg-input" id="ga-search-input" placeholder="Search word → fly to planet · 搜索单词" autocomplete="off" />
    <div class="ga-suggest lg-surface" id="ga-suggest"></div>
  </div>

  <aside class="ga-index lg-panel" style="padding:0">
    <h4>Sectors · 星区 (${D.SECTORS.length})</h4>
    <div class="body lg-scroll" id="ga-sec-list"></div>
  </aside>

  <div class="ga-hud lg-panel">
    <div class="h">
      <div class="t">${G.title} <i>· ${G.titleZh}</i></div>
      <div class="lvl">★ ${G.constellationLabel}</div>
    </div>
    <div class="grid">
      <div class="s"><b style="color:var(--cyan)">${D.SECTORS.length}</b><span>Sectors · 星区</span></div>
      <div class="s"><b style="color:var(--pearl)">${D.SECTORS.reduce((a,s)=>a+s.wordCount,0).toLocaleString()}</b><span>Words · 词球</span></div>
      <div class="s"><b style="color:var(--mint)">${Math.round(D.SECTORS.reduce((a,s)=>a+s.mastery*s.wordCount,0)/D.SECTORS.reduce((a,s)=>a+s.wordCount,0)*100)}%</b><span>Mastery · 掌握</span></div>
      <div class="s"><b style="color:var(--coral)">${D.SECTORS.reduce((a,s)=>a+s.review,0)}</b><span>Review · 复习</span></div>
    </div>
  </div>

  <div class="ga-legend lg-panel">
    <span class="lg-sec">Planet states · 星球状态</span>
    ${Object.entries(D.STATE).map(([k,v])=>`<span class="lg-status"><span class="sw" style="color:${v.color};background:${v.color}"></span>${v.label}</span>`).join('')}
  </div>

  <aside class="ga-drawer lg-surface" id="ga-drawer">
    <div class="ga-drawer__head">
      <span class="lg-sec">Planet detail · 星球详情</span>
      <button class="lg-icon-btn lg-icon-btn--sm" id="ga-drawer-close" title="Close · 关闭">✕</button>
    </div>
    <div class="ga-drawer__body lg-scroll" id="ga-drawer-body"></div>
  </aside>

  <aside class="ga-drawer ga-sector-panel lg-surface" id="ga-sector-panel">
    <div class="ga-drawer__head">
      <span class="lg-sec">Sector overview · 星区概述</span>
      <button class="lg-icon-btn lg-icon-btn--sm" id="ga-sector-close" title="Close · 关闭">✕</button>
    </div>
    <div class="ga-drawer__body lg-scroll" id="ga-sector-body"></div>
  </aside>
`;

/* ── sector index cards ────────────────────────────────────────────────── */
function renderSectorList(activeId) {
  document.getElementById('ga-sec-list').innerHTML = D.SECTORS.map(s => `
    <div class="ga-sec-card ${s.id===activeId?'active':''}" data-id="${s.id}">
      <div class="r1">
        <span class="dot lg-status"><span class="sw" style="color:${s.color};background:${s.color};width:9px;height:9px"></span></span>
        <span class="nm">${s.nameZh}</span>
        <span class="st" style="color:${STATUS_COLOR[s.status]};background:color-mix(in srgb, ${STATUS_COLOR[s.status]} 18%, transparent)">${s.status}</span>
      </div>
      <div class="zh">${s.name} · ${s.blurb}</div>
      <div class="bar"><i style="width:${Math.round(s.mastery*100)}%;background:linear-gradient(90deg,${s.color},#fff)"></i></div>
      <div class="meta"><span>${s.wordCount} 词</span><span>${Math.round(s.mastery*100)}% 掌握 · ${s.review} 待复习</span></div>
      <button class="ga-enter" data-enter="${s.id}" style="--c:${s.color}">进入星区 →</button>
    </div>`).join('');
  document.querySelectorAll('.ga-sec-card').forEach(c => c.onclick = (e) => { if (e.target.closest('.ga-enter')) return; field.selectSector(c.dataset.id); });
  document.querySelectorAll('.ga-enter').forEach(b => b.onclick = (e) => { e.stopPropagation(); window.location.href = 'Lexiverse Universe.html?sector=' + encodeURIComponent(b.dataset.enter); });
}

/* wall-clock JS slide — CSS time-based transitions/animations stall under the
   heavy per-frame WebGL loop, so we tween the inline transform ourselves.
   Generic over any panel element (planet drawer + sector panel). */
const PANEL_MS = 420;
function panelIsMobile(){ return window.matchMedia('(max-width: 620px)').matches; }
function panelClosedOffset(){ return panelIsMobile() ? 900 : 460; }
function panelAxis(){ return panelIsMobile() ? 'Y' : 'X'; }
function readPanelVal(el){ const m=(el.style.transform||'').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : panelClosedOffset(); }
function slidePanel(el, open){
  const from = readPanelVal(el), to = open ? 0 : panelClosedOffset(), start = performance.now(), ax = panelAxis();
  clearInterval(el.__iv);
  el.style.transform = `translate${ax}(${from}px)`;
  el.__iv = setInterval(() => {
    const t = Math.min((performance.now() - start) / PANEL_MS, 1);
    const e = 1 - Math.pow(1 - t, 3);
    el.style.transform = `translate${ax}(${from + (to - from) * e}px)`;
    if (t >= 1) { clearInterval(el.__iv); el.style.transform = `translate${ax}(${to}px)`; }
  }, 16);
}

/* ── planet detail drawer ──────────────────────────────────────────────── */
let drawerTab = 'meaning';
function speak(t){ try{ const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.92; speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){} }
window.__lexSpeak = speak;

function closeSectorPanel(){ const p=document.getElementById('ga-sector-panel'); p.classList.remove('open'); slidePanel(p, false); }
function openDrawer(word, planet) {
  const drawer = document.getElementById('ga-drawer');
  if (!word) { drawer.classList.remove('open'); slidePanel(drawer, false); return; }
  closeSectorPanel();
  drawer.classList.add('open');
  slidePanel(drawer, true);
  drawerTab = 'meaning';
  renderDrawer(word, planet);
}
function renderDrawer(w, planet) {
  const body = document.getElementById('ga-drawer-body');
  const stateKey = planet ? planet.state : 'unknown';
  const sc = D.STATE[stateKey];
  if (w._partial) {
    body.innerHTML = `
      <div class="word">${w.word}</div>
      <div class="badges"><span class="lg-badge" style="--c:${sc.color}"><span class="dot"></span>${sc.label}</span></div>
      <div class="partial lg-card">This word planet is wired for layout but has no full dictionary record in the demo mock. In production, Codex resolves it from the dictionary loader — all fields (IPA, definition, examples, CEFR, exam tags…) populate here.</div>
      <div class="acts"><button class="lg-btn lg-btn--primary wide" onclick="__lexSpeak('${w.word}')">▶ Play Pronunciation · 朗读</button></div>`;
    return;
  }
  const diff = Array.from({length:5},(_,i)=>`<span style="width:8px;height:8px;border-radius:50%;display:inline-block;background:${i<w.difficulty?'var(--amber)':'rgba(255,255,255,0.14)'};box-shadow:${i<w.difficulty?'0 0 7px var(--amber)':'none'}"></span>`).join(' ');
  const tab = (id,label)=>`<button class="${drawerTab===id?'on':''}" data-tab="${id}">${label}</button>`;
  let tabBody = '';
  if (drawerTab === 'meaning') tabBody = `
    <div class="def">${w.defEn}</div>
    <div class="def-zh">${w.defZh}</div>
    <div class="ex lg-card">${w.exampleEn.replace(new RegExp('('+w.word+'\\\\w*)','ig'),'<b>$1</b>')}<div class="zh">${w.exampleZh}</div></div>
    <div class="field"><span class="lg-sec">CEFR &amp; Difficulty · 难度</span><div style="display:flex;align-items:center;gap:10px"><span class="lg-badge lg-badge--mono" style="--c:var(--cyan)">${w.cefr}</span><span>${diff}</span></div></div>`;
  else if (drawerTab === 'usage') tabBody = `
    <div class="field"><span class="lg-sec">Collocations · 搭配</span><div class="chips">${w.collocations.map(c=>`<span class="chip">${c}</span>`).join('')}</div></div>
    <div class="field"><span class="lg-sec">Synonyms · 近义词</span><div class="chips">${w.synonyms.map(c=>`<span class="chip">${c}</span>`).join('')||'<span class="chip">—</span>'}</div></div>
    <div class="field"><span class="lg-sec">Antonyms · 反义词</span><div class="chips">${(w.antonyms.length?w.antonyms:['—']).map(c=>`<span class="chip">${c}</span>`).join('')}</div></div>
    <div class="field"><span class="lg-sec">Mnemonic · 记忆法</span><div class="def" style="font-size:14px">${w.mnemonic}</div></div>`;
  else if (drawerTab === 'review') { const xp = window.LexiverseExam ? window.LexiverseExam.wordExamProfile(w.word, (window.__galaxyExam||'all')) : null; tabBody = `
    <div class="field"><span class="lg-sec">Learning state · 学习状态</span><div><span class="lg-badge" style="--c:${sc.color}"><span class="dot"></span>${sc.label}</span></div></div>
    ${xp?`<div class="field"><span class="lg-sec">Exam profile · 考试档案 <span style="color:var(--text-muted);font-weight:400">(mock)</span></span>
      <div class="chips">${xp.examTags.map(t=>`<span class="lg-badge lg-badge--mono" style="--c:var(--amber)">${(window.LexiverseExam.byId[t]||{}).short||t}</span>`).join('')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">
        <span class="lg-badge" style="--c:var(--cyan)">priority · ${xp.priority}</span>
        <span class="lg-badge" style="--c:var(--aqua)">${xp.frequencyBand}</span>
        ${xp.module?`<span class="lg-badge" style="--c:var(--violet)">${xp.module}</span>`:''}
        <span class="lg-badge" style="--c:var(--mint)">${xp.questionCount} questions</span>
        ${xp.reviewDue?'<span class="lg-badge" style="--c:var(--coral)"><span class="dot"></span>review due</span>':''}
      </div></div>`:''}
    <div class="field"><span class="lg-sec">Theme · 主题</span><div class="chips">${w.themeTags.map(t=>`<span class="lg-badge" style="--c:var(--aqua)">${t}</span>`).join('')}</div></div>
    <div class="partial lg-card" style="margin-top:16px">Spaced-repetition schedule, next-review date and streak come from learningStore in production.</div>`; }
  else if (drawerTab === 'quiz') tabBody = `<div class="partial lg-card">A quick check for <b style="color:var(--cyan)">${w.word}</b> launches here — multiple-choice / sentence / recall. Questions come from the question bank in production. <div style="margin-top:14px"><button class="lg-btn lg-btn--primary" onclick="location.href='Lexiverse Quiz Center.html'">Open Quiz Center · 测验中心 ↗</button></div></div>`;
  else if (drawerTab === 'ai') tabBody = `<div class="partial lg-card">Ask AI about <b style="color:var(--cyan)">${w.word}</b> — usage nuance, more examples, etymology, contrast with similar words. Wired to the assistant in production.</div>`;

  body.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px">
      <div class="word">${w.word}</div>
      <button class="lg-icon-btn lg-icon-btn--sm" title="Play · 朗读" onclick="__lexSpeak('${w.word}')">▶</button>
    </div>
    <div class="ipa-row"><span class="ipa">${w.ipa}</span><span class="pos">${w.pos}</span></div>
    <div class="badges">
      <span class="lg-badge lg-badge--mono" style="--c:var(--cyan)">CEFR ${w.cefr}</span>
      <span class="lg-badge" style="--c:${sc.color}"><span class="dot"></span>${sc.label}</span>
      ${w.examTags.slice(0,2).map(t=>`<span class="lg-badge lg-badge--mono" style="--c:var(--amber)">${t}</span>`).join('')}
    </div>
    <div class="tabs">${tab('meaning','Meaning')}${tab('usage','Usage')}${tab('review','Review')}${tab('quiz','Quiz')}${tab('ai','AI')}</div>
    ${tabBody}
    <div class="acts">
      <button class="lg-btn lg-btn--primary wide">＋ Add to Review · 加入复习</button>
      <button class="lg-btn" onclick="location.href='Lexiverse Quiz Center.html'">Quiz · 测验</button>
      <button class="lg-btn">Ask AI · 问 AI</button>
      <button class="lg-btn" onclick="location.href='Lexiverse Word Detail.html'">Word Detail · 词条</button>
      <button class="lg-btn" onclick="location.href='LexiGraph.html?word=${encodeURIComponent(w.word)}'">LexiGraph ↗</button>
      <button class="lg-btn lg-btn--ghost wide" onclick="__lexSpeak('${w.word}')">▶ Play Pronunciation · 朗读</button>
    </div>`;
  body.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { drawerTab = b.dataset.tab; renderDrawer(w, planet); });
}

/* ── sector overview panel (opens when a sector is clicked) ─────────────── */
function openSectorPanel(sector) {
  const panel = document.getElementById('ga-sector-panel');
  panel.classList.add('open');
  slidePanel(panel, true);
  const featured = (D.FEATURED[sector.id] || []).slice(0, 8);
  const statusColor = { active: 'var(--cyan)', growing: 'var(--mint)', forming: 'var(--coral)' }[sector.status];
  const particles = Math.round(sector.wordCount * (D.RENDER_MULT || 1));
  document.getElementById('ga-sector-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:11px">
      <span class="sw" style="width:13px;height:13px;border-radius:50%;background:${sector.color};box-shadow:0 0 12px ${sector.color}"></span>
      <div class="word" style="font-size:28px;font-family:'Noto Sans SC',var(--font-display)">${sector.nameZh}</div>
    </div>
    <div class="ipa-row"><span style="color:var(--text-dim);font-size:13px;font-family:var(--font-mono)">${sector.name}</span>
      <span class="lg-badge" style="--c:${statusColor}"><span class="dot"></span>${sector.status}</span></div>
    <div class="def" style="margin-top:16px">${sector.blurb}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px">
      <div class="lg-card" style="padding:13px 14px"><b style="font-size:19px;font-family:var(--font-mono);color:var(--pearl)">${sector.wordCount}</b><div style="font-size:10px;color:var(--text-muted);margin-top:3px">词汇</div></div>
      <div class="lg-card" style="padding:13px 14px"><b style="font-size:19px;font-family:var(--font-mono);color:var(--mint)">${Math.round(sector.mastery*100)}%</b><div style="font-size:10px;color:var(--text-muted);margin-top:3px">已掌握</div></div>
      <div class="lg-card" style="padding:13px 14px"><b style="font-size:19px;font-family:var(--font-mono);color:var(--coral)">${sector.review}</b><div style="font-size:10px;color:var(--text-muted);margin-top:3px">待复习</div></div>
    </div>
    <div class="field"><span class="lg-sec">重点词 · Featured Words</span><div class="chips">${featured.map(w=>`<span class="chip">${w}</span>`).join('')}</div></div>
    <div class="field"><span class="lg-sec">掌握进度 · Mastery</span>
      <div style="height:7px;border-radius:7px;background:rgba(255,255,255,0.08);overflow:hidden"><i style="display:block;height:100%;width:${Math.round(sector.mastery*100)}%;background:linear-gradient(90deg,${sector.color},#fff)"></i></div>
    </div>
    <div class="acts">
      <button class="lg-btn lg-btn--primary wide" id="ga-sector-enter">进入词汇星系 →</button>
      <button class="lg-btn wide" onclick="location.href='Lexiverse Quiz Center.html'">测验本星区 · Quiz</button>
    </div>`;
  document.getElementById('ga-sector-enter').onclick = () => { window.location.href = 'Lexiverse Universe.html?sector=' + encodeURIComponent(sector.id); };
}

/* ── search → fly to word ──────────────────────────────────────────────── */
const allFeatured = [];
D.SECTORS.forEach(s => (D.FEATURED[s.id]||[]).forEach(w => allFeatured.push({ word: w, sector: s })));
function renderSuggest(q) {
  const box = document.getElementById('ga-suggest');
  if (!q) { box.classList.remove('show'); return; }
  const hits = allFeatured.filter(x => x.word.toLowerCase().startsWith(q)).slice(0, 6);
  if (!hits.length) { box.classList.remove('show'); return; }
  box.classList.add('show');
  box.innerHTML = hits.map(h => `<button data-word="${h.word}" data-sec="${h.sector.id}"><span style="color:${h.sector.color}">●</span>${h.word}<span class="sec">${h.sector.nameZh}</span></button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => { field.flyToPlanet(b.dataset.sec, b.dataset.word); box.classList.remove('show'); document.getElementById('ga-search-input').value = b.dataset.word; });
}

/* ── init engine ───────────────────────────────────────────────────────── */
const field = createGalaxyField(document.getElementById('stage'), {
  initialMode: CFG.mode, focusSector: CFG.sector, focusPlanet: CFG.planet,
  onSelectPlanet: (word, planet) => openDrawer(word, planet),
  onSectorClick: (sector) => openSectorPanel(sector),
  onSectorChange: (sector) => {
    const sep = document.getElementById('sec-sep'), cr = document.getElementById('sec-crumb');
    if (sector) { sep.style.display = ''; cr.textContent = sector.name + ' · ' + sector.nameZh; document.getElementById('ga-return').classList.add('show'); }
    else { sep.style.display = 'none'; cr.textContent = ''; document.getElementById('ga-return').classList.remove('show'); }
    renderSectorList(sector ? sector.id : null);
  },
  onLOD: (name) => { document.getElementById('ga-lod').textContent = name; },
});

renderSectorList(CFG.sector || null);
document.getElementById('ga-home').onclick = () => { window.location.href = 'Lexiverse Universe.html'; };
document.getElementById('ga-return').onclick = () => field.flyHome();
document.getElementById('ga-drawer-close').onclick = () => { document.getElementById('ga-drawer').classList.remove('open'); slidePanel(document.getElementById('ga-drawer'), false); };
document.getElementById('ga-sector-close').onclick = () => closeSectorPanel();
const si = document.getElementById('ga-search-input');
si.oninput = () => renderSuggest(si.value.toLowerCase().trim());
si.onkeydown = (e) => { if (e.key === 'Enter') { const v = si.value.toLowerCase().trim(); if (v) field.focusWord(v); document.getElementById('ga-suggest').classList.remove('show'); } };

/* open the planet drawer when launched directly in inspect mode */
if (CFG.mode === 'inspect' && CFG.planet) setTimeout(() => { const w = D.byWord(CFG.planet); if (w) openDrawer(w, { state: 'learning', word: CFG.planet }); }, 900);
