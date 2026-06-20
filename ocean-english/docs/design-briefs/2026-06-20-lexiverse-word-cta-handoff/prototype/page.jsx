// page.jsx — /lexiverse/word/[slug] — premium editorial pass.
// Deep-space hero with the word's "planet" orb (ties back to the 3D cosmos you
// clicked from), refined typography, staggered entrance, micro-interactions.
// The OLD flat 5-button row is replaced by <WordPracticeActions>.

const { useState } = React;

function Eyebrow({ children, color = 'rgba(126,249,255,0.6)' }) {
  return <div style={{ fontSize: 10, letterSpacing: '0.18em', color, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase' }}>{children}</div>;
}
function highlightWord(sentence, word) {
  const i = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return sentence;
  return <>{sentence.slice(0, i)}<b style={{ color: '#7EF9FF', fontWeight: 700 }}>{sentence.slice(i, i + word.length)}</b>{sentence.slice(i + word.length)}</>;
}

// ── refined info card with hover lift ───────────────────────────────────
function InfoCard({ title, items, color, delay, clickable, onNavigate }) {
  return (
    <div className="rise lift" style={{ animationDelay: delay,
      background: 'linear-gradient(165deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
      border: '1px solid rgba(126,249,255,0.10)', borderRadius: 14, padding: '15px 16px', minHeight: 112,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.45), inset 0 0 0 1px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(126,249,255,0.10)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
        <Eyebrow color={`${color}aa`}>{title}</Eyebrow>
        {clickable && items.length > 0 && <span style={{ marginLeft: 'auto', fontSize: 9, color: `${color}99`, fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' }}>→ 跳转星球</span>}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {items.length ? items.slice(0, 8).map(it => (
          clickable ? (
            <a key={it} href={`/lexiverse/word/${slugify(it)}`} onClick={e => { e.preventDefault(); onNavigate(slugify(it)); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '5px 11px', borderRadius: 9, border: `1px solid ${color}33`, color: '#DCEAF2', background: `${color}10`, fontSize: 12.5, cursor: 'pointer', transition: 'all .15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = `${color}24`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}33`; e.currentTarget.style.color = '#DCEAF2'; e.currentTarget.style.background = `${color}10`; e.currentTarget.style.transform = 'none'; }}>
              <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />{it}
            </a>
          ) : (
            <span key={it} style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: 9, border: `1px solid ${color}33`, color: '#DCEAF2', background: `${color}10`, fontSize: 12.5 }}>{it}</span>
          )
        )) : <span style={{ color: '#6F8AA0', fontSize: 13 }}>暂无数据 · No data yet</span>}
      </div>
    </div>
  );
}

function WordDetailPage({ word, poolEmpty, inToday, setInToday, narrow, onNavigate }) {
  const returnTo = `/lexiverse/word/${word.id}`;
  const stateColor = STATE_COLOR[word.learningState];
  const tags = [...(word.themeTags || []), ...(word.domainTags || [])];
  const cells = [
    { title: 'Synonyms · 近义词', items: word.synonyms, color: '#7EF9FF', clickable: true },
    { title: 'Antonyms · 反义词', items: word.antonyms, color: '#FF8FA8', clickable: true },
    { title: 'Collocations · 搭配', items: word.collocations, color: '#6BE0A0', clickable: true },
    { title: 'Exam & CEFR · 考试等级', items: [word.cefrLevel, ...word.examTags].filter(Boolean), color: '#FFD66B', clickable: false },
    { title: 'Themes · 主题领域', items: tags, color: '#9AD8FF', clickable: false },
  ];

  return (
    <main style={{ minHeight: '100%', background: 'transparent', color: '#ECFBFF', fontFamily: "'Space Grotesk', system-ui, sans-serif", padding: narrow ? '0 14px 24px' : '0 26px 72px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* breadcrumb */}
        <nav className="rise" style={{ fontSize: 12, color: '#9FB6C6', margin: '22px 0 14px', fontFamily: "'Space Mono', monospace", animationDelay: '.04s' }}>
          <a href="/lexiverse/word/resilient" onClick={e => { e.preventDefault(); onNavigate('resilient'); }} style={{ color: '#7EF9FF', textDecoration: 'none' }}>Lexiverse</a> <span style={{ opacity: .5 }}>/</span> {word.constellationTitle} <span style={{ opacity: .5 }}>/</span> <span style={{ color: '#CFE6F2' }}>{word.galaxyTitle.split(' · ')[1] || word.galaxyTitle}</span> <span style={{ opacity: .5 }}>/</span> <span style={{ color: '#ECFBFF' }}>{word.word}</span>
        </nav>

        {/* ── HERO ── */}
        <section className="rise" style={{ position: 'relative', borderRadius: 22, padding: narrow ? '22px 18px' : '34px 38px',
          background: 'linear-gradient(160deg, rgba(126,249,255,0.10), rgba(139,92,246,0.06) 55%, rgba(8,12,22,0.4))',
          border: '1px solid rgba(190,228,255,0.20)', backdropFilter: 'blur(22px) saturate(1.2)', WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)', overflow: 'hidden', animationDelay: '.06s' }}>
          <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(126,249,255,0.7), rgba(183,155,255,0.5), transparent)' }} />

          {/* origin chip — answers "where did this come from" */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: narrow ? 4 : -8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(126,249,255,0.18)', background: 'rgba(8,12,22,0.5)', fontSize: 11, color: '#9FB6C6', fontFamily: "'Space Mono', monospace" }}>
              <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: `radial-gradient(circle at 32% 30%, #fff, ${stateColor})`, boxShadow: `0 0 10px ${stateColor}` }} />
              来自 {word.galaxyTitle.split(' · ')[1] || word.galaxyTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: narrow ? 18 : 34, flexWrap: narrow ? 'wrap' : 'nowrap' }}>
            <PlanetOrb color={stateColor} size={narrow ? 104 : 132} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <Eyebrow>{word.learningState} · 当前学习状态</Eyebrow>
              <h1 style={{ fontSize: narrow ? 'clamp(46px,15vw,66px)' : 'clamp(58px, 7.2vw, 96px)', lineHeight: 0.9, margin: '8px 0 0', fontWeight: 700, letterSpacing: '-0.015em',
                background: 'linear-gradient(180deg, #ffffff, #D6F4FF 52%, #7EF9FF)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                filter: 'drop-shadow(0 8px 30px rgba(126,249,255,0.25))' }}>{word.word}</h1>
              <div style={{ fontSize: narrow ? 15 : 17, color: '#A9CBD8', marginTop: 10, fontWeight: 500 }}>{word.glossZh}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 16, flexWrap: 'wrap' }}>
                <button type="button" aria-label="Play pronunciation" className="lift" style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(126,249,255,0.4)', background: 'rgba(126,249,255,0.12)', color: '#7EF9FF', cursor: 'pointer', fontSize: 13, display: 'grid', placeItems: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(126,249,255,0.22)'; e.currentTarget.style.boxShadow = '0 0 22px rgba(126,249,255,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(126,249,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}>▶</button>
                {word.phoneticIpa && <span style={{ color: '#7EF9FF', fontFamily: "'Space Mono', monospace", fontSize: 15 }}>{word.phoneticIpa}</span>}
                {word.partOfSpeech && <span style={{ color: '#8FA8B8', fontStyle: 'italic' }}>{word.partOfSpeech}</span>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {word.cefrLevel && <LiquidBadge color="#7EF9FF">{word.cefrLevel}</LiquidBadge>}
                  {word.examTags.map(t => <LiquidBadge key={t} color="#FFD66B" size="sm">{t}</LiquidBadge>)}
                </div>
              </div>
            </div>
          </div>

          {/* ★ focused CTA group */}
          <WordPracticeActions word={word} returnTo={returnTo} poolEmpty={poolEmpty} inToday={inToday} onAddToday={() => setInToday(true)} narrow={narrow} />
        </section>

        {/* ── MEANING ── */}
        {word.definitionEn ? (
        <section className="rise" style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1.1fr 1fr', gap: 16, marginTop: 18, animationDelay: '.12s' }}>
          <div style={{ padding: '22px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(126,249,255,0.10)' }}>
            <Eyebrow>Definition · 释义</Eyebrow>
            <div style={{ fontSize: narrow ? 19 : 22, lineHeight: 1.5, color: '#EAF6FB', marginTop: 12, fontWeight: 500, textWrap: 'pretty' }}>{word.definitionEn}</div>
            <div style={{ fontSize: 15, color: '#9BBFCA', marginTop: 10, lineHeight: 1.6 }}>{word.definitionZh}</div>
          </div>
          {word.exampleEn && (
          <div style={{ position: 'relative', padding: '22px 24px 22px 28px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(126,249,255,0.07), rgba(126,249,255,0.02))', border: '1px solid rgba(126,249,255,0.16)', overflow: 'hidden' }}>
            <span aria-hidden style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 3, borderRadius: 3, background: 'linear-gradient(180deg, #7EF9FF, rgba(126,249,255,0.2))' }} />
            <span aria-hidden style={{ position: 'absolute', top: 6, right: 16, fontSize: 64, lineHeight: 1, color: 'rgba(126,249,255,0.14)', fontFamily: 'Georgia, serif' }}>”</span>
            <Eyebrow>In context · 语境例句</Eyebrow>
            <p style={{ margin: '14px 0 0', fontSize: 16.5, lineHeight: 1.72, color: '#E4F2F8' }}>{highlightWord(word.exampleEn, word.word)}</p>
            <p style={{ margin: '10px 0 0', fontSize: 13.5, color: '#8AA2B2' }}>{word.exampleZh}</p>
          </div>
          )}
        </section>
        ) : (
        <section className="rise" style={{ marginTop: 18, padding: '26px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(126,249,255,0.18)', textAlign: 'center', color: '#9FB6C6', animationDelay: '.1s' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#CFE6F2' }}>该词星球数据正在补全</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>释义 / 例句 / 词网即将到达·你仍可从上方「加入今日」或查看「词图关系」</div>
        </section>
        )}

        {/* ── INFO GRID ── */}
        <section style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: 13, marginTop: 16 }}>
          {cells.map((c, i) => <InfoCard key={c.title} title={c.title} items={c.items} color={c.color} delay={`${0.14 + i * 0.04}s`} clickable={c.clickable} onNavigate={onNavigate} />)}
        </section>

        {/* ── GALAXY RAIL ── */}
        {word.galaxyWords.length > 0 && (
        <section className="rise" style={{ marginTop: 26, animationDelay: '.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
            <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: stateColor, boxShadow: `0 0 10px ${stateColor}` }} />
            <Eyebrow color="rgba(126,249,255,0.7)">{word.galaxyTitle} · 同星系词语 · 点击跳转星球</Eyebrow>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {word.galaxyWords.map(w => (
              <a key={w} href={`/lexiverse/word/${slugify(w)}`} onClick={e => { e.preventDefault(); onNavigate(slugify(w)); }} className="lift" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 11, border: '1px solid rgba(159,182,198,0.18)', color: '#CFE6F2', background: 'rgba(255,255,255,0.025)', fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(126,249,255,0.5)'; e.currentTarget.style.color = '#7EF9FF'; e.currentTarget.style.background = 'rgba(126,249,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(159,182,198,0.18)'; e.currentTarget.style.color = '#CFE6F2'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}>
                <span aria-hidden style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: .6 }} />{w}
              </a>
            ))}
          </div>
        </section>
        )}
      </div>
    </main>
  );
}

// ── design-review shell ─────────────────────────────────────────────────
const STATES = [
  { id: 'live', label: 'Live · 默认', poolEmpty: false, today: false },
  { id: 'today', label: '已加入今日', poolEmpty: false, today: true },
  { id: 'empty', label: '空池 · 无题', poolEmpty: true, today: false },
];

function App() {
  const [stateId, setStateId] = useState('live');
  const [narrow, setNarrow] = useState(false);
  const [inToday, setInToday] = useState(false);
  const [view, setView] = useState('word');        // 'word' | 'cosmos'
  const [hist, setHist] = useState(['resilient']);  // navigation history of slugs
  const [ptr, setPtr] = useState(0);
  const [toast, setToast] = useState(null);
  const slug = hist[ptr];
  const word = resolveWord(slug);
  const st = STATES.find(s => s.id === stateId);
  const effectiveToday = st.today || inToday;
  const canBack = view === 'word';  // from a word you can always step back (to prev word or cosmos)

  function pick(id) { setStateId(id); setInToday(false); }
  function toTop() { try { document.querySelector('#scrollHost')?.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} window.scrollTo(0, 0); }

  function enterWord(next) {
    if (!next) return;
    setInToday(false); setView('word');
    if (next === slug && view === 'word') return;
    setHist(h => { const nh = h.slice(0, ptr + 1); nh.push(next); return nh; });
    setPtr(p => p + 1);
    toTop();
  }
  function back() {
    if (view !== 'word') return;
    setInToday(false);
    if (ptr > 0) { setPtr(p => p - 1); toTop(); }
    else { setView('cosmos'); }
  }
  function close() { setView('cosmos'); setToast(null); }
  function onSection(s) {
    if (s.id === 'cosmos') { close(); return; }
    setToast(`原型演示 · 实际跳转 ${s.route}`);
    clearTimeout(window.__navToast); window.__navToast = setTimeout(() => setToast(null), 2200);
  }

  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && view === 'word') close(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  const frameStyle = narrow
    ? { width: 392, maxWidth: 392, height: 'min(800px, 86vh)', overflowY: 'auto', overflowX: 'hidden', position: 'relative',
        border: '1px solid rgba(126,249,255,0.18)', borderRadius: 26, boxShadow: '0 40px 100px rgba(0,0,0,0.7)', background: 'rgba(3,5,11,0.6)' }
    : { width: '100%', maxWidth: 'none', position: 'relative', background: 'transparent' };

  return (
    <div style={{ minHeight: '100vh', position: 'relative',
      background: 'radial-gradient(ellipse at 30% 0%, #0a1326 0%, #050711 45%, #020205 100%)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}><Starfield /></div>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 78% 12%, rgba(183,155,255,0.12), transparent 38%), radial-gradient(circle at 12% 88%, rgba(126,249,255,0.08), transparent 40%)' }} />

      {/* design-review chrome (meta — not part of the product) */}
      <div style={{ position: 'relative', zIndex: 50, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        padding: '10px 18px', background: 'rgba(4,6,12,0.72)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(126,249,255,0.12)', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ECFBFF' }}>Phase 7 · 词详情页聚焦 CTA</span>
        <span style={{ fontSize: 11, color: '#6F8AA0', fontFamily: "'Space Mono', monospace" }}>{view === 'cosmos' ? '/lexiverse · 星图' : `/lexiverse/word/${slug}`}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(126,249,255,0.14)', borderRadius: 10, padding: 3 }}>
          {STATES.map(s => (
            <button key={s.id} type="button" onClick={() => pick(s.id)}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                background: stateId === s.id ? 'rgba(126,249,255,0.18)' : 'transparent', color: stateId === s.id ? '#7EF9FF' : '#7E94A6' }}>{s.label}</button>
          ))}
        </div>
        <button type="button" onClick={() => setNarrow(n => !n)}
          style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            border: '1px solid rgba(126,249,255,0.2)', background: narrow ? 'rgba(126,249,255,0.16)' : 'rgba(255,255,255,0.03)', color: narrow ? '#7EF9FF' : '#9FB6C6' }}>
          {narrow ? '◳ 移动' : '▭ 桌面'}</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: narrow ? '24px 12px' : '0', position: 'relative', zIndex: 1 }}>
        <div id="scrollHost" style={frameStyle}>
          {view === 'cosmos' ? (
            <CosmosMap key={'cosmos' + narrow} narrow={narrow} onEnter={enterWord} />
          ) : (
            <React.Fragment>
              <ProductNav word={word} narrow={narrow} canBack={canBack} onBack={back} onClose={close} onSection={onSection} />
              <WordDetailPage key={stateId + narrow + slug} word={word} poolEmpty={st.poolEmpty} inToday={effectiveToday} setInToday={setInToday} narrow={narrow} onNavigate={enterWord} />
              {narrow && <BottomNav onSection={onSection} />}
            </React.Fragment>
          )}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 30, transform: 'translateX(-50%)', zIndex: 80,
          padding: '10px 18px', borderRadius: 12, background: 'rgba(8,12,22,0.92)', border: '1px solid rgba(126,249,255,0.22)',
          color: '#CFE6F2', fontSize: 13, fontFamily: "'Space Grotesk', system-ui, sans-serif", boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>{toast}</div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
