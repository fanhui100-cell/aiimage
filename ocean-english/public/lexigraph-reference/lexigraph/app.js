/* LexiGraph · app v2 — UI 绑定 */
(function () {
  'use strict';
  const D = window.WU_DATA;
  const REL = window.LG_REL;
  const $ = (s) => document.querySelector(s);

  const lg = new window.LexiGraph({
    canvas: $('#wires'),
    layer: $('#nodes'),
    onSelect: (idx) => { openDetail(idx); },
    onChange: () => renderTrail(),
  });
  window.__lg = lg;

  // ── 全局学习状态（与星系页共享）──
  const FAV_KEY = 'wu-fav';
  let fav = new Set(); try { fav = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch (e) {}
  const saveFav = () => localStorage.setItem(FAV_KEY, JSON.stringify([...fav]));
  function allLearned() {
    const lit = new Set(), mast = new Set();
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!k) continue;
      try { if (k.startsWith('wu-lit-')) JSON.parse(localStorage.getItem(k) || '[]').forEach((w) => lit.add(w));
        else if (k.startsWith('wu-mastered-')) JSON.parse(localStorage.getItem(k) || '[]').forEach((w) => mast.add(w)); } catch (e) {} }
    return { lit, mast };
  }
  const LEARN_KEY = 'wu-lit-lexigraph';
  let learned = new Set(); try { learned = new Set(JSON.parse(localStorage.getItem(LEARN_KEY) || '[]')); } catch (e) {}
  const saveLearned = () => localStorage.setItem(LEARN_KEY, JSON.stringify([...learned]));
  const WRONG_KEY = 'wu-wrong';
  let wrong = new Set(); try { wrong = new Set(JSON.parse(localStorage.getItem(WRONG_KEY) || '[]')); } catch (e) {}
  const saveWrong = () => localStorage.setItem(WRONG_KEY, JSON.stringify([...wrong]));
  // 把“已学”集合同步给引擎（节点金环）
  let extLearned = new Set();   // 实装集成缝：真 SRS 推送的已学/已掌握词形（lexigraph-bridge → __lgBridge）
  function syncLearnedToGraph() { const { lit, mast } = allLearned(); const s = new Set([...learned, ...lit, ...mast, ...extLearned]); lg.setLearned(s); }
  function lgNotify(kind, word) { try { if (window.__lgBridge && typeof window.__lgBridge.onChange === 'function') window.__lgBridge.onChange(kind, word); } catch (e) {} }
  // 实装集成缝（additive）：真 SRS → 金环；原型独立运行时为 no-op
  window.__lgBridge = {
    onChange: null,
    applyExternalStates: (ext) => {
      if (!ext) return;
      const norm = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const set = new Set([...(ext.learned || []), ...(ext.mastered || [])].map(norm));
      if (!set.size) return;
      let changed = false;
      for (const w of D.words) { if (set.has(norm(w[0])) && !extLearned.has(w[0])) { extLearned.add(w[0]); changed = true; } }
      if (changed) syncLearnedToGraph();
    },
  };

  // ── 词根词缀表（常见拉丁/希腊词根 + 前缀 + 后缀）──
  const ROOTS = [
    ['spect','看 (look)'],['vis','看 (see)'],['vid','看 (see)'],['scop','观察 (watch)'],
    ['dict','说 (say)'],['voc','声音/叫 (call)'],['voke','叫 (call)'],['log','言/学 (word)'],['graph','写/画 (write)'],['scrib','写 (write)'],['script','写 (write)'],
    ['port','搬运 (carry)'],['fer','带来 (bring)'],['duc','引导 (lead)'],['duct','引导 (lead)'],['ject','投掷 (throw)'],['mit','送 (send)'],['miss','送 (send)'],['tract','拉 (pull)'],['pel','推 (drive)'],['puls','推 (drive)'],
    ['form','形状/构成'],['struct','建造 (build)'],['fac','做 (make)'],['fac','做'],['fect','做 (make)'],['fic','做'],['cap','拿/抓 (take)'],['cept','拿 (take)'],['ten','握 (hold)'],['tain','握 (hold)'],['pos','放置 (place)'],['pon','放 (put)'],
    ['cred','相信 (believe)'],['sens','感觉 (feel)'],['sent','感觉 (feel)'],['mem','记忆 (memory)'],['cogn','知道 (know)'],['sci','知道 (know)'],['path','感受/疾病'],
    ['vert','转 (turn)'],['vers','转 (turn)'],['flect','弯 (bend)'],['flex','弯 (bend)'],['rupt','破 (break)'],['cid','落/切'],['cis','切 (cut)'],['sect','切 (cut)'],
    ['ann','年 (year)'],['chron','时间 (time)'],['temp','时间 (time)'],['ven','来 (come)'],['vent','来 (come)'],['gress','走 (step)'],['grad','走/级'],['mot','移动 (move)'],['mov','移动 (move)'],
    ['aud','听 (hear)'],['phon','声音 (sound)'],['vac','空 (empty)'],['plen','满 (full)'],['ple','满 (fill)'],['equ','相等 (equal)'],['magn','大 (great)'],['micro','微小'],['max','最大'],['min','小 (small)'],
    ['bio','生命 (life)'],['geo','地 (earth)'],['therm','热 (heat)'],['hydr','水 (water)'],['photo','光 (light)'],['astro','星 (star)'],['cycl','圆/环'],['meter','测量 (measure)'],
  ];
  const PREFIX = [['anti','反/对抗'],['auto','自我/自动'],['bene','好/善'],['circum','环绕'],['contra','相反'],['counter','反'],['de','向下/去除'],['dis','不/相反'],['ex','向外/前'],['extra','额外/超'],['fore','前'],['inter','在…之间'],['intro','向内'],['mal','坏'],['mis','错误'],['mono','单一'],['multi','多'],['non','非'],['over','过度'],['poly','多'],['post','后'],['pre','前/预'],['pro','向前/支持'],['re','再/回'],['semi','半'],['sub','下/次'],['super','超/上'],['trans','跨/转'],['tri','三'],['un','不/相反'],['under','下/不足'],['uni','单一']];
  const SUFFIX = [['able','能…的'],['ible','能…的'],['al','…的(形/名)'],['ance','…性/状态'],['ence','…性/状态'],['ation','行为/结果'],['tion','名词:行为'],['sion','名词:状态'],['ist','…者/家'],['ism','…主义'],['ity','…性'],['ment','名词:结果'],['ness','名词:性质'],['ous','充满…的'],['ful','充满…的'],['less','无…的'],['ize','使…化'],['ify','使…化'],['ate','使…/…的'],['ive','有…性质的'],['ic','…的'],['ity','…性'],['ly','…地'],['ward','向…'],['ship','身份/状态'],['hood','状态/身份'],['en','使…']];
  function rootInfo(word) {
    const w = word.toLowerCase(); const out = [];
    for (const [p, m] of PREFIX) if (w.startsWith(p) && w.length > p.length + 2) { out.push(['前缀', p + '-', m]); break; }
    let bestRoot = null;
    for (const [r, m] of ROOTS) if (w.includes(r) && r.length >= 3) { if (!bestRoot || r.length > bestRoot[1].length) bestRoot = ['词根', r, m]; }
    if (bestRoot) out.push(bestRoot);
    for (let i = SUFFIX.length - 1; i >= 0; i--) { const [s, m] = SUFFIX[i]; if (w.endsWith(s) && w.length > s.length + 2) { out.push(['后缀', '-' + s, m]); break; } }
    return out;
  }

  function speak(text) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {} }

  // ── detail card ──
  const detail = $('#detail');
  const POS_ZH = { n: '名词', v: '动词', adj: '形容词', adv: '副词', prep: '介词', conj: '连词', pron: '代词', num: '数词', vt: '及物动词', vi: '不及物动词', art: '冠词' };
  function relGroups(idx) {
    const g = { der: [], syn: [], conf: [] };
    (lg.adj.get(idx) || []).forEach(([n, t]) => { const k = REL[t].key; if (g[k] && !g[k].includes(n)) g[k].push(n); });
    return g;
  }
  function levelOf(stars) { return ['进阶词', '较难词', '中频词', '高频词', '核心词'][stars - 1] || '—'; }
  const POS_COLOR = { n: 'pos-n', v: 'pos-v', vt: 'pos-v', vi: 'pos-v', adj: 'pos-adj', adv: 'pos-adv' };
  const POS_HEX = { n: '#388EC4', v: '#0E8C7A', vt: '#0E8C7A', vi: '#0E8C7A', adj: '#B3781F', adv: '#965AC8' };
  function posKeyOf(pos) { return (pos || '').split(/[\s&./,]+/)[0].toLowerCase(); }
  function pseudoRank(idx, stars) { return Math.round((5 - stars) * 1500 + (idx % 700) + 120); }
  const SOON = '<span class="ph-soon">待接入</span>';
  function openDetail(idx) {
    const [word, ipa, zh, pos, stars, phrases, sent] = D.words[idx];
    const g = relGroups(idx);
    const { lit, mast } = allLearned();
    const isLearned = learned.has(word) || lit.has(word) || mast.has(word);
    const isFav = fav.has(word); const isWrong = wrong.has(word);
    const chipRow = (arr, cls) => arr.slice(0, 8).map((n) => `<button class="rchip ${cls}" data-idx="${n}">${D.words[n][0]}</button>`).join('');
    const sec = (title, key, cls, arr) => arr.length ? `<div class="sec"><i style="background:${REL[key].color}"></i>${title} · ${arr.length}</div><div class="rel-row">${chipRow(arr, cls)}</div>` : '';
    // POS pills
    const posList = (pos || '').split(/[&,/]/).map((p) => p.trim()).filter(Boolean);
    const posPills = posList.map((p) => { const k = posKeyOf(p); const hex = POS_HEX[k] || '#8A97A2'; return `<span class="pp" style="color:${hex};background:${hex}1f">${p}.${POS_ZH[k] ? ' ' + POS_ZH[k] : ''}</span>`; }).join('') || `<span class="pp" style="color:#8A97A2;background:#8A97A21f">—</span>`;
    // 释义 senses
    const senses = (zh || '').split(/[；;]/).map((s) => s.trim()).filter(Boolean);
    const sensesHtml = senses.map((s, i) => `<div class="sense"><span class="n">${i + 1}</span><span class="t">${s}</span></div>`).join('');
    // 词形变化（占位：朴素推导，待接入）
    const forms = [['复数', /[sxz]$|[cs]h$/.test(word) ? word + 'es' : word + 's'], ['过去式', /e$/.test(word) ? word + 'd' : word + 'ed'], ['现在分词', /e$/.test(word) ? word.slice(0, -1) + 'ing' : word + 'ing'], ['比较级', /e$/.test(word) ? word + 'r' : word + 'er']];
    const formsHtml = forms.map((f) => `<div class="form"><span class="k">${f[0]}</span><span class="v">${f[1]}</span></div>`).join('');
    // 同义辨析（占位 nuance）
    const nuanceHtml = g.syn.length ? g.syn.slice(0, 3).map((n) => `<div class="nrow"><b>${D.words[n][0]}</b><span>${(D.words[n][2] || '').split(/[；;]/)[0]} — 语义/语域差异 ${SOON}</span></div>`).join('') : '';
    // 短语 / 例句 / 词根
    const phHtml = (phrases && phrases.length) ? `<div class="sec">短语搭配 · PHRASES</div>${phrases.slice(0, 5).map((p) => `<div class="ph"><b>${p[0]}</b><span>${p[1]}</span></div>`).join('')}` : '';
    const exMain = (sent && sent[0]) ? `<div class="ex"><div class="en">${sent[0].replace(new RegExp('(' + word + ')', 'ig'), '<b>$1</b>')}</div><div class="cn">${sent[1] || ''}</div><button class="say" id="d-saysent">🔊</button></div>` : `<div class="ex"><div class="en" style="color:var(--ink-muted)">例句 ${SOON}</div></div>`;
    const roots = rootInfo(word);
    const rootHtml = roots.length ? `<div class="sec">词根词缀 · ROOTS</div><div class="roots">${roots.map((r) => `<div class="root"><span class="rk">${r[0]}</span><b>${r[1]}</b><span class="rm">${r[2]}</span></div>`).join('')}</div>` : '';
    detail.innerHTML = `
      <button id="d-collapse" title="收起">›</button>
      <div class="d-top"><div class="pos-pills">${posPills}</div><span class="rank">词频 #${pseudoRank(idx, stars).toLocaleString()} ${SOON}</span></div>
      <div class="titlerow"><h1>${word}</h1><div class="qa">
        <button id="qa-speak" title="发音">🔊</button>
        <button id="qa-fav" class="${isFav ? 'on-gold' : ''}" title="收藏">${isFav ? '♥' : '♡'}</button>
        <button id="qa-learn" class="${isLearned ? 'on-teal' : ''}" title="标记学会">✦</button>
      </div></div>
      <div class="phon">
        <div class="pi"><span class="tag">英</span>/${ipa}/<span class="mini" data-say="${word}">🔊</span></div>
        <div class="pi"><span class="tag">美</span>/${ipa}/<span class="mini" data-say="${word}">🔊</span></div>
        <span class="stars" style="color:var(--accent)">${'★'.repeat(stars)}<span style="color:rgba(179,120,31,.25)">${'★'.repeat(5 - stars)}</span></span>
      </div>
      <div class="meta"><span class="badge">${levelOf(stars)}</span><span class="badge">${D.list || 'CET-4'}</span>${isLearned ? '<span class="badge" style="color:var(--syn)">✦ 已学</span>' : ''}${isWrong ? '<span class="badge" style="color:var(--conf)">✕ 错词</span>' : ''}</div>
      <div class="sec">释义 · DEFINITION</div><div class="senses">${sensesHtml}</div>
      <div class="sec">词形变化 · FORMS ${SOON}</div><div class="forms">${formsHtml}</div>
      ${sec('派生 DERIVATIVE', 0, 'der', g.der)}
      ${nuanceHtml ? `<div class="sec"><i style="background:${REL[1].color}"></i>同义辨析 · NUANCE</div><div class="nuance">${nuanceHtml}</div>` : ''}
      ${sec('形近 CONFUSABLE', 2, 'conf', g.conf)}
      ${rootHtml}
      ${phHtml}
      <div class="sec">例句 · EXAMPLE</div>${exMain}
      <div class="sec">真题 · EXAM ${SOON}</div>
      <div class="exam"><div class="q">In the passage, the word <b>${word}</b> most nearly means ______.</div><div class="opts"><span>A. ${senses[0] || '—'}</span><span>B. ……</span><span>C. ……</span><span>D. ……</span></div></div>
      <div class="actions">
        <button class="act ${isLearned ? 'teal' : ''}" id="d-learn">${isLearned ? '✦ 已学会' : '◦ 标记学会'}</button>
        <button class="act ${isFav ? 'gold' : ''}" id="d-fav">${isFav ? '♥ 已收藏' : '♡ 收藏'}</button>
        <button class="act ${isWrong ? 'rose' : ''}" id="d-wrong">${isWrong ? '✕ 错词本中' : '✕ 加入错词'}</button>
        <button class="act" id="d-dict">词典 ↗</button>
      </div>`;
    detail.classList.remove('collapsed'); $('#detail-tab').classList.remove('show'); $('#minimap').classList.remove('show');
    lg.rightInset = lg.canvas.clientWidth > 760 ? 250 : 0;
    const toggleFav = () => { const now = !fav.has(word); if (now) fav.add(word); else fav.delete(word); saveFav(); toast(now ? '♥ 已收藏 — 进「我的星云」查看' : '已取消收藏'); lgNotify(now ? 'fav' : 'unfav', word); openDetail(idx); };
    const toggleLearn = () => { const now = !learned.has(word); if (now) learned.add(word); else learned.delete(word); saveLearned(); syncLearnedToGraph(); lgNotify(now ? 'learn' : 'unlearn', word); openDetail(idx); };
    $('#d-collapse').addEventListener('click', collapseDetail);
    $('#qa-speak').addEventListener('click', () => speak(word));
    $('#qa-fav').addEventListener('click', toggleFav);
    $('#qa-learn').addEventListener('click', toggleLearn);
    const ss = $('#d-saysent'); if (ss) ss.addEventListener('click', () => speak(sent[0]));
    detail.querySelectorAll('.mini[data-say]').forEach((b) => b.addEventListener('click', () => speak(b.dataset.say)));
    $('#d-learn').addEventListener('click', toggleLearn);
    $('#d-fav').addEventListener('click', toggleFav);
    $('#d-wrong').addEventListener('click', () => { const now = !wrong.has(word); if (now) wrong.add(word); else wrong.delete(word); saveWrong(); toast(now ? '✕ 已加入错词本' : '已移出错词本'); lgNotify(now ? 'wrong' : 'unwrong', word); openDetail(idx); });
    $('#d-dict').addEventListener('click', () => toast('词典 — 实装时跳转 /dictionary?word=' + word));
    detail.querySelectorAll('.rchip').forEach((b) => b.addEventListener('click', () => lg.focus(+b.dataset.idx, true)));
  }
  function collapseDetail() { detail.classList.add('collapsed'); $('#detail-tab').classList.add('show'); lg.rightInset = 0; $('#minimap').classList.add('show'); }
  $('#detail-tab').addEventListener('click', () => { detail.classList.remove('collapsed'); $('#detail-tab').classList.remove('show'); $('#minimap').classList.remove('show'); lg.rightInset = lg.canvas.clientWidth > 760 ? 250 : 0; });

  // ── breadcrumb trail (clickable, jump to any) ──
  function renderTrail() {
    const trail = $('#trail');
    const path = [...lg.history, lg.center].filter((x) => x != null);
    const tail = path.slice(-7);
    trail.innerHTML = tail.map((idx, i) => {
      const cur = i === tail.length - 1;
      return `<button class="${cur ? 'cur' : ''}" data-h="${idx}">${D.words[idx][0]}</button>` + (cur ? '' : '<span class="sep">›</span>');
    }).join('');
    trail.querySelectorAll('button[data-h]').forEach((b) => b.addEventListener('click', () => {
      const target = +b.dataset.h;
      if (target === lg.center) return;
      // trim history up to the clicked one
      const hi = lg.history.indexOf(target);
      if (hi >= 0) lg.history = lg.history.slice(0, hi);
      lg.focus(target, hi < 0);
    }));
  }

  // ── search ──
  const search = $('#search'), results = $('#results');
  search.addEventListener('input', () => {
    const hits = lg.search(search.value);
    if (!hits.length) { results.style.display = 'none'; return; }
    results.innerHTML = hits.map((i) => `<button data-idx="${i}"><b>${D.words[i][0]}</b><span>${(D.words[i][2] || '').slice(0, 16)}</span></button>`).join('');
    results.style.display = 'flex';
  });
  results.addEventListener('click', (e) => { const b = e.target.closest('button[data-idx]'); if (!b) return; results.style.display = 'none'; search.value = ''; lg.focus(+b.dataset.idx, true); });
  document.addEventListener('click', (e) => { if (!e.target.closest('#searchwrap')) results.style.display = 'none'; });

  // ── legend filters ──
  $('#legend').addEventListener('click', (e) => {
    const row = e.target.closest('[data-rel]'); if (!row) return;
    const on = lg.toggleRel(+row.dataset.rel);
    row.classList.toggle('off', !on);
  });

  // ── dock ──
  $('#back').addEventListener('click', () => lg.back());
  $('#recenter').addEventListener('click', () => lg.recenter());
  $('#hop2').addEventListener('click', (e) => { const on = !lg.showHop2; lg.setHop2(on); e.currentTarget.classList.toggle('on', on); toast(on ? '已展开二跳词网' : '已收起二跳'); });
  $('#random').addEventListener('click', () => { let idx, tries = 0; do { idx = (Math.random() * D.words.length) | 0; tries++; } while (!(lg.adj.get(idx) || []).length && tries < 50); lg.focus(idx, true); });
  $('#go-universe').addEventListener('click', () => { location.href = 'Lexiverse Universe.html'; });
  $('#resetview').addEventListener('click', () => lg.resetView());
  $('#zoomin').addEventListener('click', () => lg.zoomAt(lg.canvas.clientWidth / 2, lg.canvas.clientHeight / 2, 1.2));
  $('#zoomout').addEventListener('click', () => lg.zoomAt(lg.canvas.clientWidth / 2, lg.canvas.clientHeight / 2, 0.83));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') collapseDetail(); });
  lg.setMinimap($('#minimap'));
  syncLearnedToGraph();

  // ── 悬停浮动迷你卡 ──
  const minicard = $('#minicard');
  let mcIdx = -1;
  setInterval(() => {
    const h = lg.hover;
    if (h == null || !lg.hoverScreen || h === lg.center) { if (minicard.classList.contains('show')) minicard.classList.remove('show'); mcIdx = -1; return; }
    const [w, ipa, zh, pos, stars] = D.words[h];
    if (h !== mcIdx) {
      mcIdx = h;
      const pk = posKeyOf(pos); const hex = POS_HEX[pk] || '#8A97A2';
      minicard.innerHTML = `<div class="mw">${w}</div><div class="mi">/${ipa}/</div><div class="mz">${(zh || '').split(/[；;]/)[0]}</div><div class="mr"><span class="badge" style="color:${hex};background:${hex}1f">${pos || '—'}.</span><span class="badge">${'★'.repeat(stars)}</span></div>`;
    }
    const r = lg.canvas.getBoundingClientRect();
    let x = r.left + lg.hoverScreen.x + 18, y = r.top + lg.hoverScreen.y - 10;
    if (x + 230 > window.innerWidth) x = r.left + lg.hoverScreen.x - 230;
    minicard.style.left = x + 'px'; minicard.style.top = y + 'px';
    minicard.classList.add('show');
  }, 90);

  // ── 词性配色图层 ──
  // ── 学习路线 / 导出（已按需移除） ──

  // ── toast ──
  let tT = null;
  function toast(msg) {
    let el = document.getElementById('lg-toast');
    if (!el) { el = document.createElement('div'); el.id = 'lg-toast'; el.style.cssText = 'position:fixed;left:50%;bottom:78px;transform:translate(-50%,14px);z-index:40;padding:10px 18px;border-radius:999px;font-size:12.5px;color:#fff;background:rgba(40,46,52,0.92);opacity:0;transition:all .3s;pointer-events:none'; document.body.appendChild(el); }
    el.textContent = msg; requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translate(-50%,0)'; });
    clearTimeout(tT); tT = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%,14px)'; }, 2200);
  }

  // ── entry word ──
  const params = new URLSearchParams(location.search);
  const startWord = params.get('word');
  let startIdx = startWord && lg.widx.has(startWord.toLowerCase()) ? lg.widx.get(startWord.toLowerCase()) : null;
  if (startIdx == null) {
    const cands = ['form', 'act', 'create', 'press', 'part', 'sense', 'vision'];
    for (const c of cands) { if (lg.widx.has(c)) { const i = lg.widx.get(c); if ((lg.adj.get(i) || []).length >= 3) { startIdx = i; break; } } }
    if (startIdx == null) { let best = 0, bd = -1; for (let i = 0; i < Math.min(D.words.length, 4000); i++) { const d = (lg.adj.get(i) || []).length; if (d > bd) { bd = d; best = i; } } startIdx = best; }
  }
  setTimeout(() => { lg.focus(startIdx, false); setTimeout(() => { const h = $('#hint'); if (h) h.style.opacity = '0'; }, 5000); }, 100);
})();
