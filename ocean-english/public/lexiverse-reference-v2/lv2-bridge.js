/* ═══════════════════════════════════════════════════════════════════════════
   lv2-bridge.js — Lexiverse v2 升级层（阶段3）
   两页共用：宇宙页（window.__lexiverse）与星系页（window.__galaxy）。
   职责：三缺陷修复（双语/返回/dock）+ postMessage 桥 + U1-U4。
   数据归 React store；iframe 只展示与转发。所有消息校验 origin。
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const ORIGIN = window.location.origin;
  const inFrame = window.parent && window.parent !== window;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const send = (msg) => { if (inFrame) window.parent.postMessage(msg, ORIGIN); };
  // 星池节点 id 形如 word-序号；词典/学习状态一律用词形 slug
  const slugOf = (n) => String((n && n.word) || n || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  /* ── 外部状态（parent 推送）────────────────────────────────────────────── */
  // userStates: { [wordId]: { state, due } }   galaxyStats: { [galaxyId]: {mastered,total,due} }
  const ext = { userStates: {}, galaxyStats: {}, level: null };

  const STATE_META = {
    mastered:    { zh: '已掌握', color: '#34D399' },
    review:      { zh: '待复习', color: '#FFA85A' },
    weak:        { zh: '薄弱',   color: '#FF8FA8' },
    learning:    { zh: '学习中', color: '#38BDF8' },
    recommended: { zh: '推荐',   color: '#FFD66B' },
    unknown:     { zh: '未学习', color: '#9FB6C6' },
    locked:      { zh: '静默',   color: '#52617A' },
  };

  /* ── 词典缓存（同源 API，真实中文）──────────────────────────────────────── */
  const dictCache = new Map();
  async function fetchDict(id) {
    if (dictCache.has(id)) return dictCache.get(id);
    try {
      const res = await fetch('/api/dictionary/word/' + encodeURIComponent(id));
      if (!res.ok) { dictCache.set(id, null); return null; }
      const { data } = await res.json();
      const n = normalizeWord(data);
      dictCache.set(id, n);
      return n;
    } catch { return null; }
  }
  // 字段不齐的渲染路径统一适配（缺陷a：不改数据文件）
  function normalizeWord(d) {
    if (!d) return null;
    const def = (d.definitions && d.definitions[0]) || {};
    const ex = (d.examples && d.examples[0]) || {};
    return {
      id: d.id, word: d.word,
      zh: def.definitionZh || def.definitionEn || '',
      en: def.definitionEn || '',
      pos: def.partOfSpeech || d.partOfSpeech || '',
      phon: d.phoneticIpa || '',
      exampleEn: ex.sentenceEn || '',
      exampleZh: ex.sentenceZh || '',
    };
  }

  /* ── 公共样式 ──────────────────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
    .lv2-dock{position:fixed;right:18px;bottom:18px;z-index:60;display:flex;flex-direction:column;gap:8px}
    .lv2-dock button{width:42px;height:42px;border-radius:50%;border:1px solid rgba(126,249,255,.25);
      background:rgba(8,19,32,.72);backdrop-filter:blur(10px);color:#9BBFCA;cursor:pointer;font-size:15px;
      display:flex;align-items:center;justify-content:center;transition:all .2s}
    .lv2-dock button:hover{color:#7EF9FF;border-color:rgba(126,249,255,.6);box-shadow:0 0 14px rgba(126,249,255,.25)}
    .lv2-dock .lv2-tip{position:absolute;right:50px;top:50%;transform:translateY(-50%);white-space:nowrap;
      font:11px 'Space Mono',monospace;color:#9BBFCA;background:rgba(2,6,23,.9);padding:3px 8px;border-radius:5px;
      border:1px solid rgba(126,249,255,.18);opacity:0;pointer-events:none;transition:opacity .15s}
    .lv2-dock button{position:relative}
    .lv2-dock button:hover .lv2-tip{opacity:1}
    @media (max-width:640px){.lv2-dock.collapsed button:not(.lv2-fab){display:none}}
    .lv2-crumbs{position:fixed;top:14px;left:16px;z-index:60;display:flex;gap:6px;align-items:center;
      font:12px 'Space Mono',monospace;color:#9BBFCA;background:rgba(2,6,23,.6);backdrop-filter:blur(8px);
      padding:6px 12px;border-radius:9px;border:1px solid rgba(126,249,255,.14)}
    .lv2-crumbs a{color:#7EF9FF;cursor:pointer;text-decoration:none}
    .lv2-crumbs a:hover{text-decoration:underline}
    .lv2-crumbs .sep{opacity:.4}
    .lv2-zh{font-family:'Noto Serif SC',serif;font-size:15px;color:#4fe6ce;line-height:1.6;margin:6px 0 2px}
    .lv2-ex-zh{font-size:12px;color:#8AA2B2;line-height:1.5;margin-top:3px}
    .lv2-review{margin-top:14px;border:1px solid rgba(126,249,255,.18);border-radius:12px;padding:12px;background:rgba(126,249,255,.04)}
    .lv2-review .lv2-rv-head{font:10px 'Space Mono',monospace;letter-spacing:.14em;color:rgba(126,249,255,.55);margin-bottom:8px}
    .lv2-card{min-height:72px;border-radius:9px;background:rgba(2,6,23,.55);display:flex;flex-direction:column;
      align-items:center;justify-content:center;gap:4px;cursor:pointer;padding:10px;text-align:center}
    .lv2-grades{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;opacity:.4;pointer-events:none;transition:opacity .2s}
    .lv2-grades.on{opacity:1;pointer-events:auto}
    .lv2-grades button{padding:8px 2px;border-radius:8px;border:1px solid;background:transparent;cursor:pointer;
      font:12px 'Space Grotesk',sans-serif;font-weight:700}
    .lv2-state-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;
      font:11px 'Space Grotesk',sans-serif;font-weight:700;border:1px solid;transition:background .45s ease,color .45s ease,border-color .45s ease}
    .lv2-ring{position:relative;width:28px;height:28px;flex-shrink:0}
    .lv2-due-dot{position:absolute;top:-4px;right:-4px;min-width:15px;height:15px;border-radius:999px;background:#FF6B6B;
      color:#fff;font:9px 'Space Mono',monospace;display:flex;align-items:center;justify-content:center;padding:0 3px;
      cursor:pointer;animation:lv2pulse 1.6s ease-in-out infinite}
    @keyframes lv2pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,.5)}50%{box-shadow:0 0 0 6px rgba(255,107,107,0)}}
    .lv2-cruise{position:fixed;inset:0;z-index:80;pointer-events:none;display:none}
    .lv2-cruise.on{display:block}
    .lv2-cruise .lv2-cz-label{position:absolute;left:50%;bottom:18%;transform:translateX(-50%);
      background:rgba(2,6,23,.85);border:1px solid rgba(126,249,255,.3);border-radius:14px;padding:14px 26px;
      text-align:center;backdrop-filter:blur(10px)}
    .lv2-cruise .lv2-cz-word{font:700 26px 'Space Grotesk',sans-serif;color:#ECFBFF}
    .lv2-cruise .lv2-cz-sub{font:12px 'Space Mono',monospace;color:#9BBFCA;margin-top:4px}
    .lv2-cruise .lv2-cz-skip{position:absolute;right:20px;bottom:20px;pointer-events:auto;padding:9px 18px;
      border-radius:999px;border:1px solid rgba(155,191,202,.4);background:rgba(2,6,23,.8);color:#9BBFCA;
      cursor:pointer;font:13px 'Space Grotesk',sans-serif}
    @media (prefers-reduced-motion:reduce){.lv2-due-dot{animation:none}}
  `;
  document.head.appendChild(css);

  /* ── 缺陷 c：跨板块悬浮 dock ───────────────────────────────────────────── */
  function currentWordId() {
    return window.__lv2SelectedSlug || null;
  }
  function buildDock() {
    const dock = document.createElement('div');
    dock.className = 'lv2-dock' + (window.innerWidth <= 640 ? ' collapsed' : '');
    const items = [
      { icon: '☀', zh: '今日', href: () => '/today' },
      { icon: '↻', zh: '复习', href: () => '/memory' },
      { icon: '⌕', zh: '词库', href: () => '/dictionary' },
      { icon: '◈', zh: '词图', href: () => '/lexigraph' + (currentWordId() ? '?word=' + encodeURIComponent(currentWordId()) : '') },
    ];
    for (const it of items) {
      const b = document.createElement('button');
      b.innerHTML = it.icon + '<span class="lv2-tip">' + it.zh + '</span>';
      b.addEventListener('click', () => {
        const href = it.href();
        if (inFrame) send({ type: 'lv:navigate', href });
        else window.location.href = href;
      });
      dock.appendChild(b);
    }
    // 移动端 FAB 展开钮
    if (window.innerWidth <= 640) {
      const fab = document.createElement('button');
      fab.className = 'lv2-fab';
      fab.textContent = '✦';
      fab.addEventListener('click', () => dock.classList.toggle('collapsed'));
      dock.appendChild(fab);
    }
    document.body.appendChild(dock);
  }

  /* ── 等待页面全局就绪 ──────────────────────────────────────────────────── */
  let tries = 0;
  (function waitReady() {
    if (window.__lexiverse) { initUniverse(); }
    else if (window.__galaxy) { initGalaxy(); }
    else if (tries++ < 60) { setTimeout(waitReady, 100); }
  })();

  /* ════════════════════════════ 宇宙页 ═══════════════════════════════════ */
  function initUniverse() {
    buildDock();
    const api = window.__lexiverse;
    const C = api.catalog;

    // 缺陷 b：层级面包屑（宇宙为根；进星系后 universe ui 已有 trail）
    // U3：星系详情面板内进度环 + 到期红点（galaxyStats 推送后注入）
    const detailBody = document.getElementById('detail-body');
    function injectGalaxyProgress() {
      if (!detailBody) return;
      const open = document.getElementById('detail');
      if (!open || !open.classList.contains('open')) return;
      const h1 = detailBody.querySelector('h1');
      if (!h1) return;
      const g = C.GALAXIES.find(x => x.title === h1.textContent);
      if (!g) return;
      const st = ext.galaxyStats[g.id];
      if (!st || detailBody.querySelector('.lv2-gprog')) return;
      const pct = st.total ? Math.round(st.mastered / st.total * 100) : 0;
      const r = 12, circ = 2 * Math.PI * r;
      const el = document.createElement('div');
      el.className = 'lv2-gprog';
      el.style.cssText = 'display:flex;align-items:center;gap:10px;margin:10px 0';
      el.innerHTML =
        '<span class="lv2-ring"><svg width="28" height="28">' +
        '<circle cx="14" cy="14" r="' + r + '" fill="none" stroke="rgba(155,191,202,.2)" stroke-width="3"/>' +
        '<circle cx="14" cy="14" r="' + r + '" fill="none" stroke="' + (g.colorTheme || '#7EF9FF') + '" stroke-width="3" stroke-linecap="round" ' +
        'stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)) + '" transform="rotate(-90 14 14)"/></svg>' +
        (st.due > 0 ? '<span class="lv2-due-dot" title="到期词 · 去复习">' + st.due + '</span>' : '') +
        '</span>' +
        '<span style="font:12px \'Space Mono\',monospace;color:#9BBFCA">' + st.mastered + '/' + st.total + ' 已掌握 · ' + pct + '%' +
        (st.due > 0 ? ' · <b style="color:#FF6B6B">' + st.due + ' 到期</b>' : '') + '</span>';
      h1.after(el);
      const dot = el.querySelector('.lv2-due-dot');
      if (dot) dot.addEventListener('click', () => send({ type: 'lv:navigate', href: '/memory' }));
    }
    new MutationObserver(() => injectGalaxyProgress()).observe(detailBody, { childList: true });

    // U4：今日星图巡航
    const cz = document.createElement('div');
    cz.className = 'lv2-cruise';
    cz.innerHTML = '<div class="lv2-cz-label"><div class="lv2-cz-word"></div><div class="lv2-cz-sub"></div></div>' +
      '<button class="lv2-cz-skip">跳过 · Skip</button>';
    document.body.appendChild(cz);
    let cruiseAbort = false;
    cz.querySelector('.lv2-cz-skip').addEventListener('click', () => { cruiseAbort = true; });

    async function runCruise(items) {
      if (!items || !items.length) return;
      const wordEl = cz.querySelector('.lv2-cz-word');
      const subEl = cz.querySelector('.lv2-cz-sub');
      cz.classList.add('on');
      cruiseAbort = false;
      const list = items.slice(0, 8);
      if (!reducedMotion) {
        for (const it of list) {
          if (cruiseAbort) break;
          if (it.galaxyId) { try { api.universe.focusGalaxy(it.galaxyId); } catch (e) {} }
          wordEl.textContent = it.word;
          const fromZh = (STATE_META[it.from] || {}).zh || it.from || '';
          const toZh = (STATE_META[it.to] || {}).zh || it.to || '';
          subEl.textContent = fromZh + ' → ' + toZh;
          await new Promise(r => setTimeout(r, 1800));
        }
        try { api.closeDetail(); } catch (e) {}
      }
      // 结尾全景定格
      wordEl.textContent = '今天点亮 ' + list.length + ' 颗星 ✦';
      subEl.innerHTML = '<a style="color:#7EF9FF;cursor:pointer;text-decoration:underline" id="lv2-recap">查看今日小结 →</a>';
      document.getElementById('lv2-recap').addEventListener('click', () => send({ type: 'lv:navigate', href: '/today' }));
      cz.querySelector('.lv2-cz-skip').textContent = '关闭 ✕';
      cz.querySelector('.lv2-cz-skip').onclick = () => cz.classList.remove('on');
    }

    window.addEventListener('message', (event) => {
      if (event.origin !== ORIGIN) return;
      const d = event.data || {};
      if (d.type === 'lv:user-states') { ext.userStates = d.states || {}; }
      if (d.type === 'lv:galaxy-stats') { ext.galaxyStats = d.stats || {}; ext.level = d.level ?? null; injectGalaxyProgress(); }
      if (d.type === 'lv:celebrate') { runCruise(d.items); }
    });
    send({ type: 'lv:ready', page: 'universe' });
  }

  /* ════════════════════════════ 星系页 ═══════════════════════════════════ */
  function initGalaxy() {
    buildDock();
    const G = window.__galaxy;
    const detailBody = document.getElementById('detail-body');
    const detailEl = document.getElementById('detail');

    // 缺陷 b：面包屑 宇宙 › 星系 › 词 + history/Esc 逐级退
    const crumbs = document.createElement('div');
    crumbs.className = 'lv2-crumbs';
    function renderCrumbs() {
      const word = window.__lv2SelectedSlug;
      crumbs.innerHTML =
        '<a id="lv2-c-uni">宇宙 Universe</a><span class="sep">›</span>' +
        '<a id="lv2-c-gal">星系 Galaxy</a>' +
        (word ? '<span class="sep">›</span><span style="color:#ECFBFF">' + word + '</span>' : '');
      const u = crumbs.querySelector('#lv2-c-uni');
      u.addEventListener('click', exitGalaxy);
      crumbs.querySelector('#lv2-c-gal').addEventListener('click', () => { closeWord(); });
    }
    document.body.appendChild(crumbs);
    renderCrumbs();

    function exitGalaxy() {
      if (inFrame) send({ type: 'lexiverse-exit-galaxy' });
      else window.location.href = 'Lexiverse Universe.html';
    }
    function closeWord() {
      try { window.__galaxy && document.getElementById('close-btn').click(); } catch (e) {}
    }

    // 视角进 history：选词 pushState #w=，浏览器返回逐级退
    const origOpen = G.openDetail;
    G.openDetail = function (node) {
      window.__lv2SelectedId = node.id;
      window.__lv2SelectedSlug = slugOf(node);
      if (('#w=' + node.id) !== window.location.hash) {
        history.pushState({ lv2w: node.id }, '', '#w=' + encodeURIComponent(node.id));
      }
      renderCrumbs();
      return origOpen(node);
    };
    window.addEventListener('popstate', () => {
      const m = window.location.hash.match(/^#w=(.+)$/);
      if (m) {
        const node = G.graph.byId[decodeURIComponent(m[1])];
        if (node) origOpen(node);
      } else {
        window.__lv2SelectedId = null;
        closeWord();
        renderCrumbs();
      }
    });
    // Esc 逐级：detail 开 → 关词（ui.js 已处理）；否则退宇宙
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!detailEl.classList.contains('open')) exitGalaxy();
      else { window.__lv2SelectedId = null; renderCrumbs(); }
    });

    // 缺陷 a（双语）+ U2（就地复习）：detail 渲染后注入
    async function enrichDetail() {
      const id = window.__lv2SelectedId;
      const slug = window.__lv2SelectedSlug;
      if (!id || !slug || !detailEl.classList.contains('open')) return;
      if (detailBody.querySelector('.lv2-zh-real')) return
      const node = G.graph.byId[id];
      const dict = await fetchDict(slug);
      // ① 真实中文：替换分类占位释义
      const defEl = detailBody.querySelector('.d-def');
      const defZhEl = detailBody.querySelector('.d-def-zh');
      if (dict && defEl) {
        const zhLine = document.createElement('div');
        zhLine.className = 'lv2-zh lv2-zh-real';
        zhLine.textContent = dict.zh;
        defEl.before(zhLine);
        if (dict.en && dict.en !== dict.zh) defEl.textContent = dict.en;
        else defEl.style.display = 'none';
        if (defZhEl) defZhEl.style.display = 'none';
        if (dict.exampleEn) {
          const ex = document.createElement('div');
          ex.innerHTML = '<div class="d-sec">EXAMPLE / 例句</div>' +
            '<div style="font-size:13px;color:#DCEAF2;font-style:italic;line-height:1.6">“' + dict.exampleEn + '”</div>' +
            (dict.exampleZh ? '<div class="lv2-ex-zh">' + dict.exampleZh + '</div>' : '');
          (defZhEl || defEl).after(ex);
        }
        const ipaEl = detailBody.querySelector('.d-ipa');
        if (ipaEl && dict.phon) ipaEl.childNodes[0].textContent = dict.phon;
      }
      // ② 真实学习状态 chip + 就地复习闪卡
      const us = ext.userStates[slug];
      if (us && !detailBody.querySelector('.lv2-review')) {
        const meta = STATE_META[us.state] || STATE_META.unknown;
        const statusEl = detailBody.querySelector('.d-status');
        if (statusEl) {
          const chip = document.createElement('span');
          chip.className = 'lv2-state-chip';
          chip.style.cssText = 'color:' + meta.color + ';border-color:' + meta.color + '55;background:' + meta.color + '14;margin-left:8px';
          chip.innerHTML = '<span style="width:7px;height:7px;border-radius:999px;background:' + meta.color + '"></span>我的状态 · ' + meta.zh;
          statusEl.after(chip);
        }
        if (us.due || us.state === 'review' || us.state === 'weak') {
          const rv = document.createElement('div');
          rv.className = 'lv2-review';
          rv.innerHTML =
            '<div class="lv2-rv-head">REVIEW HERE · 就地复习</div>' +
            '<div class="lv2-card"><div style="font:700 20px \'Space Grotesk\',sans-serif;color:#ECFBFF">' + (node ? node.word : id) + '</div>' +
            '<div class="lv2-rv-hint" style="font:11px \'Space Mono\',monospace;color:#9BBFCA">点击翻面 · 先回忆</div></div>' +
            '<div class="lv2-grades">' +
            [['again', '忘了', '#FF8FA8'], ['hard', '勉强', '#FFA85A'], ['good', '记得', '#38BDF8'], ['easy', '简单', '#34D399']]
              .map(g => '<button data-g="' + g[0] + '" style="color:' + g[2] + ';border-color:' + g[2] + '55">' + g[1] + '</button>').join('') +
            '</div>' +
            '<div style="margin-top:8px;text-align:right"><a id="lv2-full-review" style="font:11px \'Space Mono\',monospace;color:#7EF9FF;cursor:pointer">进入完整复习 →</a></div>';
          detailBody.appendChild(rv);
          const card = rv.querySelector('.lv2-card');
          const grades = rv.querySelector('.lv2-grades');
          card.addEventListener('click', async () => {
            const d2 = dict || await fetchDict(slug);
            card.innerHTML = '<div class="lv2-zh" style="margin:0">' + ((d2 && d2.zh) || '（释义加载中）') + '</div>' +
              ((d2 && d2.exampleEn) ? '<div style="font-size:11px;color:#8AA2B2;font-style:italic">' + d2.exampleEn + '</div>' : '');
            grades.classList.add('on');
          });
          grades.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-g]');
            if (!b) return;
            send({ type: 'lv:review-grade', wordId: slug, grade: b.dataset.g });
            rv.innerHTML = '<div class="lv2-rv-head">REVIEW HERE · 就地复习</div>' +
              '<div style="font:12px \'Space Mono\',monospace;color:#34D399">✓ 已评分 — 星色随状态更新</div>';
          });
          rv.querySelector('#lv2-full-review').addEventListener('click', () => send({ type: 'lv:navigate', href: '/memory' }));
        }
      }
    }
    new MutationObserver(() => { enrichDetail(); }).observe(detailBody, { childList: true });

    // 状态推送：评分后 mastered → 复用点亮动效（星色当场变化）
    window.addEventListener('message', (event) => {
      if (event.origin !== ORIGIN) return;
      const d = event.data || {};
      if (d.type === 'lv:user-states') {
        const prev = ext.userStates;
        ext.userStates = d.states || {};
        // 刚转 mastered 的词且在本星系池中 → 点亮
        const bySlug = window.__lv2BySlug || (window.__lv2BySlug = (() => {
          const m = {};
          for (const n of G.graph.nodes) { (m[slugOf(n)] ??= []).push(n); }
          return m;
        })());
        for (const [slug, st] of Object.entries(ext.userStates)) {
          if (st.state === 'mastered' && prev[slug] && prev[slug].state !== 'mastered') {
            for (const n of (bySlug[slug] || [])) G.markAsLearned(n);
          }
        }
        // 面板开着 → 重渲染富化
        const stale = detailBody.querySelector('.lv2-review');
        if (stale) { stale.remove(); }
        const realZh = detailBody.querySelector('.lv2-zh-real');
        if (realZh) realZh.classList.remove('lv2-zh-real');
        enrichDetail();
      }
      if (d.type === 'lv:focus-word' && d.wordId) {
        const node = G.graph.nodes.find(n => slugOf(n) === d.wordId) || G.graph.byId[d.wordId];
        if (node) { G.openDetail(node); }
        else { showDictPanel(d.wordId); }
      }
    });

    // U1（?word= 外部定位）：词不在演示星池 → 词典卡 + 加入学习
    async function showDictPanel(id) {
      const dict = await fetchDict(id);
      if (!dict) return;
      window.__lv2SelectedId = id;
      window.__lv2SelectedSlug = id;
      renderCrumbs();
      detailEl.classList.add('open');
      detailBody.innerHTML =
        '<div class="d-word">' + dict.word + '</div>' +
        '<div class="d-ipa">' + (dict.phon || '') + '</div>' +
        '<div class="lv2-zh">' + dict.zh + '</div>' +
        (dict.exampleEn ? '<div style="font-size:13px;color:#DCEAF2;font-style:italic;margin-top:8px">“' + dict.exampleEn + '”</div>' : '') +
        (dict.exampleZh ? '<div class="lv2-ex-zh">' + dict.exampleZh + '</div>' : '') +
        '<div class="d-actions" style="margin-top:16px"><button class="d-task" id="lv2-ensure">+ 加入学习 · Start learning</button></div>';
      document.getElementById('lv2-ensure').addEventListener('click', () => {
        send({ type: 'lv:ensure-word', wordId: id });
        document.getElementById('lv2-ensure').textContent = '✓ 已加入学习';
      });
    }

    send({ type: 'lv:ready', page: 'galaxy' });
  }
})();
