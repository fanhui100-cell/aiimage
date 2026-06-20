/* ═══════════════════════════════════════════════════════════════════════════
   lexigraph-bridge.js — LexiGraph 词图 × ocean-english 联动层（界面优化10 / 任务A）
   职责：把原型里「实装时跳转」的占位 + location.href 真正接成版块跳转 + SRS 双向回流。
   契约与 ReferenceLexiverseFrame / wu-bridge 一致（沿用同一套消息词汇）：
     parent → iframe : lv:user-states
     iframe → parent : lv:ready｜lv:navigate｜lv:open-word｜lv:ensure-word｜lv:review-grade
   数据归 React store；iframe 只展示与转发；所有消息校验 origin。
   原型 JS 观感不改——本文件只做拦截/转发；app.js 仅加了 additive 集成缝。
   备注：wu-fav/wu-wrong/wu-lit-* 为同源 localStorage，收藏/错词/学会与「我的星云」天然共享。
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const ORIGIN = window.location.origin;
  const inFrame = window.parent && window.parent !== window;
  const send = (msg) => { if (inFrame) window.parent.postMessage(msg, ORIGIN); };
  const slugOf = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const LIT_STATES = new Set(['mastered', 'review', 'weak', 'learning']);
  const cardWord = () => { const h = document.querySelector('#detail h1'); return h ? h.textContent.trim() : ''; };

  // ── 导航拦截（capture）：宇宙 / 词典 → 父级真路由 ──────────────────────────
  document.addEventListener('click', (e) => {
    if (!inFrame) return;  // 独立运行时让原型自行处理（location.href / toast）
    if (e.target.closest('#go-universe')) {
      e.preventDefault(); e.stopImmediatePropagation();
      send({ type: 'lv:navigate', href: '/lexiverse' });
      return;
    }
    if (e.target.closest('#d-dict')) {
      e.preventDefault(); e.stopImmediatePropagation();
      const w = cardWord();
      if (w) send({ type: 'lv:open-word', wordId: slugOf(w) });  // 完整词条 /word/[slug]
      return;
    }
  }, true);

  // ── 等待引擎 + 集成缝就绪 ────────────────────────────────────────────────
  let tries = 0;
  (function ready() {
    if (window.__lg && window.__lgBridge) {
      // 学习状态回流：原型标记 → 真 SRS（收藏走同源 localStorage，不回写）
      window.__lgBridge.onChange = (kind, word) => {
        const slug = slugOf(word);
        if (!slug) return;
        if (kind === 'learn') send({ type: 'lv:ensure-word', wordId: slug });
        else if (kind === 'wrong') send({ type: 'lv:review-grade', wordId: slug, grade: 'again' });
      };
      // 真 SRS → 金环
      window.addEventListener('message', (ev) => {
        if (ev.origin !== ORIGIN) return;
        const d = ev.data || {};
        if (d.type === 'lv:user-states') {
          const learned = [], mastered = [];
          for (const [slug, st] of Object.entries(d.states || {})) {
            if (st.state === 'mastered') mastered.push(slug);
            else if (LIT_STATES.has(st.state)) learned.push(slug);
          }
          window.__lgBridge.applyExternalStates({ learned, mastered });
        }
      });
      // 词卡「待接入」接富化 DB：开卡 → fetch /api/dictionary/word → 注入 词频/词形/辨析
      const FORM_LABEL = { past: '过去式', pp: '过去分词', ing: '现在分词', third: '三单', plural: '复数', comparative: '比较级', superlative: '最高级' };
      const stripSoon = (detail, label) => detail.querySelectorAll('.sec').forEach((sec) => { if ((sec.textContent || '').includes(label)) { const x = sec.querySelector('.ph-soon'); if (x) x.remove(); } });
      async function enrichCard() {
        const detail = document.getElementById('detail');
        const h1 = detail && detail.querySelector('h1'); if (!h1) return;
        const slug = slugOf(h1.textContent || ''); if (!slug || detail.dataset.enr === slug) return;
        detail.dataset.enr = slug;
        let data; try { const r = await fetch('/api/dictionary/word/' + encodeURIComponent(slug)); if (!r.ok) return; data = (await r.json()).data; } catch (e) { return; }
        if (!data || detail.dataset.enr !== slug) return;   // 卡片已切词
        const rk = detail.querySelector('.rank'); if (rk && data.frequencyRank != null) rk.innerHTML = '词频 #' + Number(data.frequencyRank).toLocaleString();
        if (data.inflections && Object.keys(data.inflections).length) {
          const forms = detail.querySelector('.forms');
          if (forms) forms.innerHTML = Object.entries(FORM_LABEL).filter(([k]) => data.inflections[k]).map(([k, lab]) => '<div class="form"><span class="k">' + lab + '</span><span class="v">' + data.inflections[k] + '</span></div>').join('');
          stripSoon(detail, 'FORMS');
        }
        if (Array.isArray(data.nuance) && data.nuance.length) {
          const nu = detail.querySelector('.nuance');
          if (nu) { nu.innerHTML = data.nuance.map((n) => '<div class="nrow"><b>' + n.member + '</b><span>' + n.nuanceZh + '</span></div>').join(''); stripSoon(detail, 'NUANCE'); }
        }
      }
      const detailEl = document.getElementById('detail');
      if (detailEl) new MutationObserver(() => { enrichCard(); }).observe(detailEl, { childList: true });

      send({ type: 'lv:ready', page: 'lexigraph' });
    } else if (tries++ < 300) {
      setTimeout(ready, 100);
    }
  })();
})();
