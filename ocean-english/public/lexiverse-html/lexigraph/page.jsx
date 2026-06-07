/* global React, ReactDOM, LexiData, CosmicParticles */
const { useState: uS, useEffect: uE, useRef: uR } = React;
const DAT = window.LexiData;
const PA = window.LexiParts;
const PN = window.LexiPanels;

const DEFAULT_WORD = 'accept';

// Seed a little learning state so node rings + HUD show variety on first load.
const INITIAL_STORE = {
  savedIds: ['receive', 'achieve'],
  reviewIds: ['reject'],
  weakIds: ['abstract'],
  masteredIds: ['communicate'],
  litWords: ['accept', 'communicate'],
  lexiStar: 42,
  streak: 5,
  searchCount: 1,
};

const COMPANION_LINES = {
  add_to_review: "I'll keep this word warm for your next review.",
  pronunciation_play: 'Good. Let the sound shape the memory.',
  quiz_start: 'Good work. Keep going.',
  ask_ai: 'Let me show you how this word breathes.',
  node_lit: 'Another star wakes up in your sky. ✦',
  open_detail: 'Opening the full entry…',
  open_dictionary: 'Back to the dictionary index.',
};

function LexiGraphPage() {
  const [store, setStore] = uS(INITIAL_STORE);
  const [centerWord, setCenterWord] = uS(DEFAULT_WORD);
  const [model, setModel] = uS(null);
  const [isLoading, setLoading] = uS(false);
  const [notFound, setNotFound] = uS(false);
  const [activeNodeId, setActiveNodeId] = uS(null);
  const [panelWord, setPanelWord] = uS(null);
  const [panelMode, setPanelMode] = uS('loading');
  const [notInCorpusWord, setNotInCorpus] = uS(undefined);
  const [waveActive, setWaveActive] = uS(false);
  const [activeFilter, setActiveFilter] = uS('all');
  const [recent, setRecent] = uS([]);
  const [lumiMsg, setLumiMsg] = uS('Welcome back. Pick a star to begin. 欢迎回来，点亮一颗词汇之星。');
  const [toast, setToast] = uS(null);
  const toastTimer = uR(null);

  const canvasRef = uR(null);

  // Mount cosmic particle background once.
  uE(() => {
    if (!canvasRef.current) return;
    const bg = CosmicParticles(canvasRef.current, {});
    return () => bg.destroy();
  }, []);

  uE(() => { loadCenterWord(DEFAULT_WORD, store); /* eslint-disable-next-line */ }, []);

  function flashToast(t) {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  function loadCenterWord(slug, storeSnapshot) {
    setLoading(true); setNotFound(false);
    const word = DAT.lookupWord(slug);
    setLoading(false);
    if (!word) {
      setCenterWord(slug); setNotFound(true);
      if (!panelWord) setPanelMode('empty');
      return;
    }
    const slices = {
      savedIds: storeSnapshot.savedIds, reviewIds: storeSnapshot.reviewIds,
      weakIds: storeSnapshot.weakIds, masteredIds: storeSnapshot.masteredIds,
      litWords: storeSnapshot.litWords,
    };
    const m = DAT.buildModel(word, slices);
    setModel(m); setPanelWord(word); setPanelMode('detail');
    setActiveNodeId(m.nodes.find((n) => n.type === 'core')?.id ?? null);
    setCenterWord(slug);
    setRecent((prev) => [word.word, ...prev.filter((s) => s !== word.word)].slice(0, 5));

    // hook: node_lit  — light up the center word once
    setStore((s) => {
      if (s.litWords.includes(word.id)) return { ...s, searchCount: s.searchCount + 1 };
      return { ...s, litWords: [...s.litWords, word.id], searchCount: s.searchCount + 1 };
    });
  }

  // central event dispatcher — the five reserved LexiGraph hooks
  function emit(event, payload) {
    if (COMPANION_LINES[event]) setLumiMsg(COMPANION_LINES[event]);
    switch (event) {
      case 'add_to_review': {
        const w = payload;
        if (store.reviewIds.includes(w.id)) { flashToast('Already in Review / 已在复习队列'); return; }
        setStore((s) => ({ ...s, reviewIds: [...s.reviewIds, w.id], litWords: s.litWords.includes(w.id) ? s.litWords : [...s.litWords, w.id], lexiStar: s.lexiStar + 8 }));
        // re-light node state to review in the live model
        setModel((m) => m ? { ...m, nodes: m.nodes.map((n) => n.type === 'core' ? { ...n, state: 'review' } : n) } : m);
        flashToast('+ Added to Review · ★8');
        break;
      }
      case 'pronunciation_play': {
        try { const u = new SpeechSynthesisUtterance(payload); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
        setWaveActive(true); setTimeout(() => setWaveActive(false), 1700);
        setStore((s) => ({ ...s, lexiStar: s.lexiStar + 2 }));
        break;
      }
      case 'quiz_start': {
        setStore((s) => ({ ...s, lexiStar: s.lexiStar + 5 }));
        flashToast(`Quiz queued → /quiz?word=${payload.id} · ★5`);
        break;
      }
      case 'ask_ai': { flashToast('Ask AI / AI 讲解'); break; }
      case 'open_detail': { flashToast(`Open Full Detail → /word/${payload.id}`); break; }
      case 'open_dictionary': { flashToast('Open Dictionary → /dictionary'); break; }
      default: break;
    }
  }

  function handleNodeClick(node) {
    setActiveNodeId(node.id);
    if (node.type === 'core') { if (model) { setPanelWord(model.centerDetail); setPanelMode('detail'); } return; }
    if (DAT.NON_WORD_TYPES.has(node.type)) { setNotInCorpus(node.word); setPanelMode('not-in-corpus'); return; }
    const w = DAT.lookupWord(node.word);
    if (w) loadCenterWord(node.word, store);
    else { setNotInCorpus(node.word); setPanelMode('not-in-corpus'); }
  }

  function handleSynonymClick(syn) {
    const slug = DAT.slugify(syn);
    const w = DAT.lookupWord(slug);
    if (w) loadCenterWord(slug, store);
    else { setNotInCorpus(syn); setPanelMode('not-in-corpus'); }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', background: '#020617' }}>
      {/* Sub-header */}
      <div style={{ height: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(56,189,248,0.1)', background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(12px)', zIndex: 20 }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#7EF9FF', letterSpacing: '0.06em', fontFamily: 'ui-monospace, monospace' }}>LexiGraph</span>
          <span style={{ marginLeft: '10px', fontSize: '11px', color: 'rgba(155,191,202,0.45)', letterSpacing: '0.04em' }}>词汇星图 · Explore word relationships, usage &amp; memory</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); emit('open_dictionary'); }} style={{ fontSize: '12px', color: 'rgba(56,189,248,0.65)', textDecoration: 'none', fontFamily: 'ui-monospace, monospace' }}>← Dictionary / 词典</a>
          {panelWord && <a href="#" onClick={(e) => { e.preventDefault(); emit('open_detail', panelWord); }} style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', textDecoration: 'none', fontFamily: 'ui-monospace, monospace' }}>↗ Full Detail</a>}
        </div>
      </div>

      {/* Main row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
          {/* Cosmic particle background */}
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

          {/* Search + recent */}
          <div style={{ position: 'absolute', top: '14px', left: '18px', zIndex: 10 }}>
            <PA.Search onSearch={(q) => loadCenterWord(q, store)} isLoading={isLoading} notFound={notFound} currentWord={centerWord} />
            {recent.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px', maxWidth: '280px' }}>
                {recent.map((w) => (
                  <button key={w} onClick={() => loadCenterWord(w, store)} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'ui-monospace, monospace', cursor: 'pointer', background: w === centerWord ? 'rgba(56,189,248,0.15)' : 'rgba(2,6,23,0.75)', border: `1px solid ${w === centerWord ? 'rgba(56,189,248,0.45)' : 'rgba(56,189,248,0.18)'}`, color: w === centerWord ? '#38BDF8' : 'rgba(155,191,202,0.5)', backdropFilter: 'blur(6px)', lineHeight: 1.5 }}>{w}</button>
                ))}
              </div>
            )}
          </div>

          {/* Legend + filter */}
          {model && (
            <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <PA.Legend />
              <PA.RelationFilter value={activeFilter} onChange={setActiveFilter} />
            </div>
          )}

          {/* State legend bottom-left */}
          {model && <div style={{ position: 'absolute', bottom: '14px', left: '18px', zIndex: 10, background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(56,189,248,0.12)', borderRadius: '8px', padding: '7px 10px', backdropFilter: 'blur(8px)' }}><PA.StateLegend /></div>}

          {/* Graph */}
          <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 5 }}>
            {model ? (
              <PA.GraphMap model={model} activeNodeId={activeNodeId} onNodeClick={handleNodeClick} waveActive={waveActive} activeFilter={activeFilter} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#38BDF8', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>
                {isLoading ? 'Loading graph… / 加载星图中…' : 'Enter a word to begin / 输入单词开始探索'}
              </div>
            )}
          </div>
        </div>

        {/* Panel */}
        <div style={{ width: '340px', flexShrink: 0, borderLeft: '1px solid rgba(56,189,248,0.08)', overflow: 'hidden', zIndex: 20 }}>
          <PN.Panel key={(panelWord && panelWord.id) || panelMode} word={panelWord} mode={panelMode} notInCorpusWord={notInCorpusWord} store={store} onSynonymClick={handleSynonymClick} onAction={emit} />
        </div>
      </div>

      {/* HUD */}
      <div style={{ flexShrink: 0, zIndex: 20 }}><PN.HUD store={store} /></div>

      <PN.Lumi message={lumiMsg} />
      <PN.Toast text={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LexiGraphPage />);
