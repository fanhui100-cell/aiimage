/* ═══════════════════════════════════════════════════════════════════════════
   wu-bridge.js — Lexiverse WU 升级原型 × ocean-english 联动层（界面优化9 / v3）
   两页共用：宇宙页（window.__lexiverse）与星系页（window.__wuUI / __wuField）。
   职责：把原型里「实装时跳转 /xxx」的占位 toast 真正接成版块跳转 + SRS 双向回流。
   契约与 ReferenceLexiverseFrame.tsx 完全一致（沿用 v2 桥的消息词汇）：
     parent → iframe : lv:user-states｜lv:galaxy-stats｜lv:celebrate｜lv:highlight｜lv:focus-word
     iframe → parent : lv:ready｜lv:navigate｜lv:open-word｜lv:review-grade｜lv:ensure-word｜
                       lexiverse-enter-galaxy｜lexiverse-exit-galaxy
   数据归 React store；iframe 只展示与转发；所有消息校验 origin。
   原型 JS 不改观感——本文件只做拦截/转发；wu-ui.js 仅加了 additive 集成缝。
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const ORIGIN = window.location.origin;
  const inFrame = window.parent && window.parent !== window;
  const send = (msg) => { if (inFrame) window.parent.postMessage(msg, ORIGIN); };
  const slugOf = (s) => String((s && s.word) || s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // 16 模块 → 真实路由（与原型 MODULES/GAL_MODULES 的 route 字段一致；
  // universe/mine/review 为站内行为，不在此表，交原型或单独处理）
  const ROUTES = {
    today: '/today', study: '/study', lexigraph: '/lexigraph', dictionary: '/dictionary',
    reading: '/reading', exam: '/exam', quiz: '/quiz', memory: '/memory',
    pronunciation: '/pronunciation', scan: '/scan', wrong: '/wrong-answers',
    navigator: '/chat', profile: '/profile',
  };
  // 真 SRS 状态 → 点亮（lit）；唯 mastered → 镀金
  const LIT_STATES = new Set(['mastered', 'review', 'weak', 'learning']);

  const closeGrid = () => { const g = document.getElementById('module-grid'); if (g) g.classList.remove('open'); };

  /* ── 等待页面全局就绪（真词池 loader / top-level await 期间需轮询）──────────── */
  let tries = 0;
  (function waitReady() {
    if (window.__lexiverse) initUniverse();
    else if (window.__wuUI && window.__wuField) initGalaxy();
    else if (tries++ < 300) setTimeout(waitReady, 100);
  })();

  /* ════════════════════════════ 宇宙页 ═══════════════════════════════════ */
  function initUniverse() {
    const api = window.__lexiverse;
    const C = (api && api.catalog) || window.LexiverseCatalog;
    const galaxyById = (id) => C && C.GALAXIES.find((g) => g.id === id);
    const galaxyByTitle = (t) => C && C.GALAXIES.find((g) => g.title === t);

    // 模块网格/顶栏 → 真路由；「进入星系」→ 同步父级 URL（保留深链/浏览器后退）
    document.addEventListener('click', (e) => {
      if (!inFrame) return; // 独立运行时让原型自行处理（toast / location.href）

      const enter = e.target.closest('#mock-enter');
      if (enter) {
        const h1 = document.querySelector('#detail-body h1');
        const g = h1 && galaxyByTitle(h1.textContent.trim());
        if (g) { e.preventDefault(); e.stopImmediatePropagation(); send({ type: 'lexiverse-enter-galaxy', galaxyId: g.id }); }
        return;
      }

      const mn = e.target.closest('[data-mn]');
      if (mn) {
        const id = mn.dataset.mn;
        if (ROUTES[id]) {
          e.preventDefault(); e.stopImmediatePropagation();
          closeGrid();
          send({ type: 'lv:navigate', href: ROUTES[id] });
        }
        // universe / mine / review → 交原型站内处理
      }
    }, true);

    // U3：星系详情面板注入「真实学习进度」（galaxy-stats 推送后；与原型 localStorage 块并存，标注真实）
    const detailBody = document.getElementById('detail-body');
    const stats = {};
    let level = null;
    function injectRealProgress() {
      if (!detailBody) return;
      const open = document.getElementById('detail');
      if (!open || !open.classList.contains('open')) return;
      const h1 = detailBody.querySelector('h1');
      if (!h1) return;
      const g = galaxyByTitle(h1.textContent.trim());
      if (!g) return;
      const st = stats[g.id];
      if (!st || detailBody.querySelector('.wu-realprog')) return;
      const pct = st.total ? Math.round((st.mastered / st.total) * 100) : 0;
      const el = document.createElement('div');
      el.className = 'wu-realprog';
      el.style.cssText = 'display:flex;align-items:center;gap:10px;margin:10px 0 2px;padding:9px 12px;border-radius:12px;background:rgba(126,249,255,.05);border:1px solid rgba(126,249,255,.16)';
      el.innerHTML =
        '<span style="font:10px \'Space Mono\',monospace;letter-spacing:.12em;color:rgba(126,249,255,.6)">我的真实进度</span>' +
        '<span style="font:12px \'Space Mono\',monospace;color:#9BBFCA">' + st.mastered + '/' + st.total + ' 已掌握 · ' + pct + '%' +
        (st.due > 0 ? ' · <b style="color:#FF6B6B;cursor:pointer" class="wu-due">' + st.due + ' 到期 →</b>' : '') + '</span>';
      h1.after(el);
      const due = el.querySelector('.wu-due');
      if (due) due.addEventListener('click', () => send({ type: 'lv:navigate', href: '/memory' }));
    }
    if (detailBody) new MutationObserver(() => injectRealProgress()).observe(detailBody, { childList: true });

    // 顶部 HUD 接真实点亮/掌握总数
    function setHud(lit, mast) {
      const total = C ? C.GALAXIES.reduce((s, g) => s + (g.wordCount || 0), 0) : 0;
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('hud-lit', lit.toLocaleString());
      set('hud-mastered', mast.toLocaleString());
      const pct = total ? (lit / total) * 100 : 0, pctM = total ? (mast / total) * 100 : 0;
      const fill = document.getElementById('hud-bar-fill'); if (fill) fill.style.width = Math.max(0.5, pct).toFixed(2) + '%';
      const fillM = document.getElementById('hud-bar-fill-m'); if (fillM) fillM.style.width = Math.max(0, pctM).toFixed(2) + '%';
      const note = document.getElementById('hud-bar-note'); if (note) note.textContent = '点亮 ' + pct.toFixed(1) + '% · 掌握 ' + pctM.toFixed(1) + '%';
    }

    // 庆祝巡航 / 测验后脉冲（聚焦对应星系 + 浮层），与 v2 桥一致
    function focusGalaxy(id) { try { api.universe.focusGalaxy(id); } catch (e) { /* noop */ } }
    function pulse(items, headline, subline) {
      const first = (items || []).find((it) => it.galaxyId);
      if (first) focusGalaxy(first.galaxyId);
      const hl = document.createElement('div');
      hl.style.cssText = 'position:fixed;left:50%;bottom:13%;transform:translateX(-50%);z-index:75;' +
        'background:rgba(2,6,23,.9);border:1px solid rgba(126,249,255,.42);border-radius:14px;padding:12px 22px;text-align:center;backdrop-filter:blur(10px)';
      hl.innerHTML = '<div style="font:700 15px \'Space Grotesk\',sans-serif;color:#7EF9FF">✦ ' + headline + '</div>' +
        '<div style="font:11px \'Space Mono\',monospace;color:#9BBFCA;margin-top:3px">' + subline + '</div>';
      document.body.appendChild(hl);
      setTimeout(() => hl.remove(), 4200);
    }

    window.addEventListener('message', (event) => {
      if (event.origin !== ORIGIN) return;
      const d = event.data || {};
      if (d.type === 'lv:user-states') {
        let lit = 0, mast = 0;
        for (const st of Object.values(d.states || {})) { if (LIT_STATES.has(st.state)) lit++; if (st.state === 'mastered') mast++; }
        setHud(lit, mast);
      } else if (d.type === 'lv:galaxy-stats') {
        Object.assign(stats, d.stats || {});
        level = d.level != null ? d.level : level;
        injectRealProgress();
      } else if (d.type === 'lv:celebrate' && Array.isArray(d.items) && d.items.length) {
        pulse(d.items, '今天点亮 ' + d.items.length + ' 颗星', d.items.map((it) => it.word).join(' · '));
      } else if (d.type === 'lv:highlight' && Array.isArray(d.items) && d.items.length) {
        pulse(d.items, d.items.map((it) => it.word).join(' · '), '本轮测验改变了这些星球');
      } else if (d.type === 'lv:home-focus') {
        // 默认进站：聚焦用户档位星系 + 一次性提示（你在 X · 目标 Y）
        const g = d.levelGalaxy && C.GALAXIES.find((x) => x.id === d.levelGalaxy);
        const tg = d.targetGalaxy && C.GALAXIES.find((x) => x.id === d.targetGalaxy);
        if (g) focusGalaxy(g.id);
        if (!window.__lvHomed && (g || tg)) {
          window.__lvHomed = true;
          const hint = document.createElement('div');
          hint.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:70;' +
            'background:rgba(2,6,23,.86);border:1px solid rgba(126,249,255,.35);border-radius:12px;padding:9px 16px;' +
            'backdrop-filter:blur(10px);font:12.5px "Noto Sans SC",sans-serif;color:#ECFBFF;opacity:0;transition:opacity .4s';
          hint.innerHTML = '你在 <b style="color:#7EF9FF">' + (g ? g.titleZh : '—') + '</b>' +
            (tg ? ' · 目标 <b style="color:#FFD66B">' + tg.titleZh + '</b>' : '');
          document.body.appendChild(hint);
          requestAnimationFrame(() => { hint.style.opacity = '1'; });
          setTimeout(() => { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 500); }, 4200);
        }
      }
    });

    send({ type: 'lv:ready', page: 'universe' });
  }

  /* ════════════════════════════ 星系页 ═══════════════════════════════════ */
  function initGalaxy() {
    const UI = window.__wuUI;

    function currentCardWord() {
      const h1 = document.querySelector('#word-card h1');
      return h1 ? h1.textContent.trim() : null;
    }

    // 模块网格 / 词卡按钮 / 返回 → 真路由或父级 URL 同步
    document.addEventListener('click', (e) => {
      if (!inFrame) return;

      // 词图 ↗（原型为占位 toast）→ /lexigraph?word=
      const graph = e.target.closest('#act-graph');
      if (graph) {
        const w = currentCardWord();
        if (w) { e.preventDefault(); e.stopImmediatePropagation(); send({ type: 'lv:navigate', href: '/lexigraph?word=' + encodeURIComponent(slugOf(w)) }); }
        return;
      }
      // 完整词条（桥注入的按钮）→ /word/[slug]
      const full = e.target.closest('.wu-full-entry');
      if (full) {
        e.preventDefault(); e.stopImmediatePropagation();
        const w = full.dataset.w || currentCardWord();
        if (w) send({ type: 'lv:open-word', wordId: slugOf(w) });
        return;
      }
      // 返回宇宙（原型 location.href）→ 同步父级 URL
      const ret = e.target.closest('#return-btn');
      if (ret) { e.preventDefault(); e.stopImmediatePropagation(); send({ type: 'lexiverse-exit-galaxy' }); return; }

      // 模块网格
      const mn = e.target.closest('[data-mn]');
      if (mn) {
        const id = mn.dataset.mn;
        if (ROUTES[id]) { e.preventDefault(); e.stopImmediatePropagation(); closeGrid(); send({ type: 'lv:navigate', href: ROUTES[id] }); }
        else if (id === 'universe') { e.preventDefault(); e.stopImmediatePropagation(); closeGrid(); send({ type: 'lexiverse-exit-galaxy' }); }
        else if (id === 'mine') { e.preventDefault(); e.stopImmediatePropagation(); closeGrid(); send({ type: 'lexiverse-enter-galaxy', galaxyId: 'mine' }); }
        // review → 原型开复习舱
      }
    }, true);

    // 词卡渲染后注入「完整词条 ↗」（card-actions 内，与「词图 ↗」并列）
    const card = document.getElementById('word-card');
    if (card) {
      new MutationObserver(() => {
        if (!card.classList.contains('open')) return;
        const actions = card.querySelector('.card-actions');
        const w = currentCardWord();
        if (!actions || !w || actions.querySelector('.wu-full-entry')) return;
        const b = document.createElement('button');
        b.className = 'act wu-full-entry';
        b.dataset.w = w;
        b.textContent = '❑ 完整词条 ↗';
        actions.appendChild(b);
      }).observe(card, { attributes: true, childList: true, subtree: true });
    }

    // 学习状态回流：原型标记 → 真 SRS
    UI.onChange = (kind, word) => {
      const slug = slugOf(word);
      if (!slug) return;
      if (kind === 'mastered') send({ type: 'lv:review-grade', wordId: slug, grade: 'good' });
      else if (kind === 'wrong') send({ type: 'lv:review-grade', wordId: slug, grade: 'again' });
      else if (kind === 'learn') send({ type: 'lv:ensure-word', wordId: slug });
      // unlearn / fav / unfav：本地（我的星云）即可，不回写 SRS
    };

    // 真 SRS → 星色 / 外部 ?word= 定位
    window.addEventListener('message', (event) => {
      if (event.origin !== ORIGIN) return;
      const d = event.data || {};
      if (d.type === 'lv:user-states') {
        const mastered = [], learned = [];
        for (const [slug, st] of Object.entries(d.states || {})) {
          if (st.state === 'mastered') mastered.push(slug);
          else if (LIT_STATES.has(st.state)) learned.push(slug);
        }
        UI.applyExternalStates({ mastered, learned });
      } else if (d.type === 'lv:focus-word' && d.wordId) {
        // 命中 → 飞入该词星球；未命中（该词不在本星系真词表）→ 回报 parent 给可见提示，不再静默
        const ok = UI.focusWord(d.wordId);
        if (!ok) send({ type: 'lv:focus-miss', wordId: d.wordId });
      }
    });

    send({ type: 'lv:ready', page: 'galaxy' });
  }
})();
