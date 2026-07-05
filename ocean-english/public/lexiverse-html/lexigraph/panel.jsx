/* global React, ReactDOM, LexiData, CosmicParticles */
const { useState: useS, useEffect: useE, useRef: useR } = React;
const DD = window.LexiData;
const P = window.LexiParts;

const sHead = { fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(56,189,248,0.5)', fontFamily: 'ui-monospace, monospace', marginBottom: '6px', marginTop: '18px' };
const cefrColor = { A1: '#34D399', A2: '#34D399', B1: '#38BDF8', B2: '#38BDF8', C1: '#F97316', C2: '#F97316' };

function Chip({ label, color }) {
  return <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '4px', background: `${color}18`, color, border: `1px solid ${color}28`, fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>{label}</span>;
}

function PanelShell({ children }) {
  return (
    <div style={{ height: '100%', background: 'rgba(2,6,23,0.88)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.5), transparent)', zIndex: 1 }} />
      {children}
    </div>
  );
}

/* ── Right detail panel ─────────────────────────────────────────────────── */
function Panel({ word, mode, notInCorpusWord, store, onSynonymClick, onAction }) {
  const [ai, setAi] = useS(null);
  const [aiLoading, setAiLoading] = useS(false);

  if (mode === 'empty') {
    return <PanelShell><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(155,191,202,0.4)', fontSize: '13px', padding: '0 20px' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.5 }}>◈</div>
        <div>Search or click a node to explore.</div>
        <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.6 }}>搜索或点击节点以探索。</div>
      </div></div></PanelShell>;
  }
  if (mode === 'loading') {
    return <PanelShell><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontSize: '13px', fontFamily: 'ui-monospace, monospace' }}>Loading… / 加载中…</div></PanelShell>;
  }
  if (mode === 'not-in-corpus') {
    return <PanelShell><div style={{ flex: 1, padding: '24px 20px', color: 'rgba(155,191,202,0.7)', fontSize: '13px' }}>
      <div style={{ fontSize: '15px', color: '#9BBFCA', marginBottom: '12px', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-word' }}>{notInCorpusWord || '—'}</div>
      <div>This related item is not yet in the dictionary.</div>
      <div style={{ marginTop: '4px', opacity: 0.7 }}>这个关联词暂未收录。</div>
      <div style={{ marginTop: '14px', fontSize: '11px', opacity: 0.45, lineHeight: 1.6 }}>May be a phrase, root marker, or exam tag — not a standalone dictionary word.</div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
        <button onClick={() => onAction('ask_ai', notInCorpusWord)} style={{ ...btnBase, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', color: '#38BDF8' }}>✦ Ask AI</button>
        <button onClick={() => onAction('open_dictionary', notInCorpusWord)} style={{ ...btnBase, background: 'rgba(155,191,202,0.06)', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA' }}>↗ Dictionary</button>
      </div>
    </div></PanelShell>;
  }
  if (!word) return null;

  const isInReview = store.reviewIds.includes(word.id);
  const standardMnem = word.mnemonics.find((m) => m.style === 'standard');

  function handleAsk() {
    setAiLoading(true);
    onAction('ask_ai', word.word);
    // Local, non-fabricating "explanation" assembled from the word's own seed fields.
    setTimeout(() => {
      const parts = [`“${word.word}” ${word.phoneticIpa} — ${word.definitions[0].definitionEn}`];
      if (word.etymology) parts.push(`Roots: ${word.etymology.explanationEn}`);
      if (standardMnem) parts.push(`Memory hook: ${standardMnem.mnemonicEn}`);
      parts.push(`Try it: ${word.examples[0].sentenceEn}`);
      setAi(parts.join('\n\n'));
      setAiLoading(false);
    }, 650);
  }

  return (
    <PanelShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 24px' }}>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#ECFBFF', lineHeight: 1.1 }}>{word.word}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '4px' }}>
            {word.phoneticIpa && <span style={{ fontSize: '14px', color: '#7EF9FF', fontFamily: 'ui-monospace, monospace' }}>{word.phoneticIpa}</span>}
            <button onClick={() => onAction('pronunciation_play', word.word)} title="Play pronunciation"
              style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(56,189,248,0.4)', background: 'rgba(56,189,248,0.1)', color: '#38BDF8', cursor: 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>►</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '9px' }}>
            {word.partOfSpeech && <Chip label={word.partOfSpeech} color="#8B5CF6" />}
            {word.cefrLevel && <Chip label={word.cefrLevel} color={cefrColor[word.cefrLevel] || '#9BBFCA'} />}
            {word.isCore && <Chip label="Core" color="#34D399" />}
            {word.isExamWord && <Chip label="Exam" color="#FBBF24" />}
            {word.examTags.slice(0, 2).map((t) => <Chip key={t} label={t} color="rgba(56,189,248,0.75)" />)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '14px' }}>
          <button onClick={() => onAction('add_to_review', word)} disabled={isInReview}
            style={{ ...btnBase, background: isInReview ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)', color: isInReview ? 'rgba(52,211,153,0.4)' : '#34D399', cursor: isInReview ? 'default' : 'pointer' }}>
            {isInReview ? '✓ In Review' : '+ Review'}
          </button>
          <button onClick={() => onAction('quiz_start', word)} style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.4)', color: '#8B5CF6' }}>Quiz</button>
          <button onClick={handleAsk} disabled={aiLoading || !!ai} style={{ ...btnBase, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', color: ai ? 'rgba(56,189,248,0.4)' : '#38BDF8', cursor: aiLoading || ai ? 'default' : 'pointer', opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? '…AI' : ai ? '✦ Done' : '✦ Ask AI'}
          </button>
          <button onClick={() => onAction('open_detail', word)} style={{ ...btnBase, background: 'rgba(155,191,202,0.06)', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA' }}>↗ Detail</button>
        </div>

        {ai && (
          <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '7px', fontSize: '12px', color: '#ECFBFF', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{ai}</div>
        )}

        {word.definitions.length > 0 && (<>
          <div style={sHead}>DEFINITION / 释义</div>
          <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.65 }}>{word.definitions[0].definitionEn}</div>
          {word.definitions[0].definitionZh && <div style={{ fontSize: '12px', color: '#9BBFCA', marginTop: '3px' }}>{word.definitions[0].definitionZh}</div>}
        </>)}

        {word.examples.length > 0 && (<>
          <div style={sHead}>EXAMPLE / 例句</div>
          <div style={{ background: 'rgba(56,189,248,0.04)', borderLeft: '3px solid rgba(56,189,248,0.35)', padding: '7px 11px', borderRadius: '0 5px 5px 0' }}>
            <div style={{ fontSize: '12px', color: '#ECFBFF', lineHeight: 1.65, fontStyle: 'italic' }}>{word.examples[0].sentenceEn}</div>
            {word.examples[0].sentenceZh && <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '3px' }}>{word.examples[0].sentenceZh}</div>}
          </div>
        </>)}

        {word.synonyms.length > 0 && (<>
          <div style={sHead}>SYNONYMS / 近义词</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {word.synonyms.slice(0, 5).map((s) => (
              <button key={s} onClick={() => onSynonymClick(s)} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', background: 'rgba(52,211,153,0.08)', color: '#34D399', border: '1px solid rgba(52,211,153,0.22)', fontFamily: 'ui-monospace, monospace' }}>{s}</button>
            ))}
          </div>
        </>)}

        {word.antonyms.length > 0 && (<>
          <div style={sHead}>ANTONYMS / 反义词</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {word.antonyms.slice(0, 4).map((s) => (
              <button key={s} onClick={() => onSynonymClick(s)} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.85)', border: '1px solid rgba(248,113,113,0.22)', fontFamily: 'ui-monospace, monospace' }}>{s}</button>
            ))}
          </div>
        </>)}

        {word.collocations.length > 0 && (<>
          <div style={sHead}>COLLOCATIONS / 搭配</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {word.collocations.slice(0, 3).map((c, i) => (
              <div key={i}>
                <div style={{ fontSize: '12px', color: '#38BDF8', fontFamily: 'ui-monospace, monospace' }}>{c.phrase}</div>
                {c.exampleEn && <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '2px' }}>{c.exampleEn}</div>}
              </div>
            ))}
          </div>
        </>)}

        {word.etymology && (<>
          <div style={sHead}>ETYMOLOGY / 词源</div>
          <div style={{ fontSize: '12px', color: '#FBBF24', fontFamily: 'ui-monospace, monospace' }}>{word.etymology.roots}</div>
          {word.etymology.explanationEn && <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '3px', lineHeight: 1.55 }}>{word.etymology.explanationEn}</div>}
        </>)}

        {standardMnem && (<>
          <div style={sHead}>MNEMONIC / 记忆法</div>
          <div style={{ fontSize: '12px', color: '#ECFBFF', lineHeight: 1.6, background: 'rgba(139,92,246,0.06)', padding: '8px 11px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.15)' }}>{standardMnem.mnemonicEn}</div>
          {standardMnem.mnemonicZh && <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '4px' }}>{standardMnem.mnemonicZh}</div>}
        </>)}

        <div style={{ marginTop: '18px', fontSize: '10px', color: 'rgba(155,191,202,0.25)', fontFamily: 'ui-monospace, monospace' }}>
          src: {word.sourceType} · {word.sourceNote.slice(0, 40)}
        </div>
      </div>
    </PanelShell>
  );
}

const btnBase = { padding: '6px 11px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', lineHeight: 1.4 };

/* ── HUD ────────────────────────────────────────────────────────────────── */
function HUD({ store }) {
  const level = Math.floor(store.lexiStar / 50) + 1;
  const pct = Math.round(((store.lexiStar % 50) / 50) * 100);
  const cell = (last) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: last ? undefined : '1px solid rgba(56,189,248,0.07)', padding: '0 4px' });
  const big = (c) => ({ fontSize: '15px', fontWeight: 700, color: c, fontFamily: 'ui-monospace, monospace', lineHeight: 1 });
  const sub = { fontSize: '9px', color: 'rgba(155,191,202,0.45)', marginTop: '3px', letterSpacing: '0.04em' };
  return (
    <div style={{ display: 'flex', borderTop: '1px solid rgba(56,189,248,0.1)', background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)', height: '54px' }}>
      <div style={cell()}><div style={big('#38BDF8')}>{store.litWords.length}</div><div style={sub}>Lit / 已点亮</div></div>
      <div style={cell()}><div style={big('#FB923C')}>{store.reviewIds.length}</div><div style={sub}>Due / 待复习</div></div>
      <div style={{ ...cell(), flex: 1.4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={big('#FBBF24')}>★{store.lexiStar}</span>
          <span style={{ fontSize: '9px', color: '#FBBF24', opacity: 0.8, fontFamily: 'ui-monospace, monospace' }}>Lv.{level}</span>
        </div>
        <div style={{ width: '72%', height: '2px', background: 'rgba(251,191,36,0.15)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#FBBF24', borderRadius: '1px', transition: 'width 0.4s ease' }} />
        </div>
      </div>
      <div style={cell()}><div style={big('#34D399')}>{store.streak}d</div><div style={sub}>Streak / 连学</div></div>
      <div style={cell(true)}><div style={big('#7EF9FF')}>{store.searchCount}</div><div style={sub}>Explored / 探索</div></div>
    </div>
  );
}

/* ── Lumi placeholder companion ─────────────────────────────────────────── */
function Lumi({ message }) {
  return (
    <div style={{ position: 'fixed', right: '356px', bottom: '66px', zIndex: 30, display: 'flex', alignItems: 'flex-end', gap: '8px', pointerEvents: 'none' }}>
      {message && (
        <div style={{ maxWidth: '210px', background: 'rgba(2,6,23,0.92)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px 10px 2px 10px', padding: '7px 11px', fontSize: '11px', color: '#cfe9f2', lineHeight: 1.5, backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>{message}</div>
      )}
      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }} className="lumi-float">
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #7EF9FF, #2563eb 70%)', boxShadow: '0 0 18px rgba(56,189,248,0.6)' }} />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`lumi-orbit lumi-orbit-${i}`} style={{ position: 'absolute', left: '50%', top: '50%', width: '4px', height: '4px', borderRadius: '50%', background: i % 2 ? '#A78BFA' : '#FBBF24', boxShadow: '0 0 6px currentColor' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Toast (transient action feedback) ──────────────────────────────────── */
function Toast({ text }) {
  if (!text) return null;
  return <div style={{ position: 'fixed', left: '50%', bottom: '74px', transform: 'translateX(-50%)', zIndex: 40, background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: '#7EF9FF', fontFamily: 'ui-monospace, monospace', backdropFilter: 'blur(8px)', boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>{text}</div>;
}

window.LexiPanels = { Panel, HUD, Lumi, Toast };
