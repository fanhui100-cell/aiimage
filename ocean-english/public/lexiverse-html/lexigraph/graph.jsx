/* global React, ReactDOM, LexiData, CosmicParticles */
const { useState, useEffect, useRef, useMemo } = React;
const D = window.LexiData;

/* ── Relation filter config ─────────────────────────────────────────────── */
const FILTER_RELATIONS = {
  all: null,
  synonym: ['synonym'],
  antonym: ['antonym'],
  collocation: ['collocation'],
  roots: ['etymology', 'scene', 'exam'],
};
const FILTER_LABELS = { all: 'All', synonym: 'Syn', antonym: 'Ant', collocation: 'Collo', roots: 'Roots' };

/* ── Edge ───────────────────────────────────────────────────────────────── */
function Edge({ edge, nodes, isHighlighted, isDimmed }) {
  const s = nodes.find((n) => n.id === edge.source);
  const t = nodes.find((n) => n.id === edge.target);
  if (!s || !t) return null;
  const color = D.EDGE_COLORS[edge.relation];
  const opacity = isDimmed ? 0.06 : isHighlighted ? 0.9 : edge.strength * 0.38;
  const dashed = edge.relation === 'etymology' || edge.relation === 'scene';
  return (
    <line
      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
      stroke={color} strokeWidth={isHighlighted ? 2 : 1}
      strokeOpacity={opacity} strokeDasharray={dashed ? '5 3' : undefined}
    />
  );
}

/* ── Node ───────────────────────────────────────────────────────────────── */
function GraphNode({ node, isHovered, isActive, onHover, onClick, isWaving }) {
  const isCore = node.type === 'core';
  const r = isHovered ? node.size * 1.14 : node.size;
  const fill = D.NODE_FILL[node.type];
  const stroke = isActive ? '#ECFBFF' : D.NODE_STROKE[node.type];
  const ring = D.STATE_RING[node.state];
  const hasRing = ring !== 'transparent';
  const ringClass = node.state === 'weak' ? 'lxi-pulse' : node.state === 'mastered' ? 'lxi-glow' : undefined;
  return (
    <g style={{ cursor: 'pointer' }}
       onMouseEnter={() => onHover(node.id)}
       onMouseLeave={() => onHover(null)}
       onClick={() => onClick(node)}>
      {isCore && <circle cx={node.x} cy={node.y} r={r + 14} fill="none" stroke="#38BDF8" strokeWidth={1.5} strokeOpacity={0.5} className="lxi-core-pulse" />}
      {hasRing && (
        <circle cx={node.x} cy={node.y} r={r + 5} fill="none" stroke={ring}
          strokeWidth={isCore ? 2 : 1.5} strokeOpacity={isHovered ? 0.9 : 0.5} className={ringClass} />
      )}
      <circle cx={node.x} cy={node.y} r={r} fill={fill} stroke={stroke}
        strokeWidth={isCore ? 2 : 1.5} strokeOpacity={isHovered ? 1 : 0.7}
        filter={isHovered ? 'url(#lxi-glow)' : undefined} />
      {isCore && <circle cx={node.x} cy={node.y} r={5} fill="#38BDF8" fillOpacity={0.85} />}
      {isWaving && <circle cx={node.x} cy={node.y} r={node.size} fill="none" stroke="#38BDF8" strokeWidth={1.5} className="lxi-wave" />}
      <text x={node.x} y={node.y + r + 13} textAnchor="middle" fill="#ECFBFF"
        fontSize={isCore ? 13 : 11} fontWeight={isCore ? 700 : 400}
        fontFamily="ui-monospace, monospace" fillOpacity={isHovered ? 1 : 0.72}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {node.label}
      </text>
    </g>
  );
}

/* ── Map (SVG) ──────────────────────────────────────────────────────────── */
function GraphMap({ model, activeNodeId, onNodeClick, waveActive, activeFilter }) {
  const [hoveredId, setHoveredId] = useState(null);
  const allowed = FILTER_RELATIONS[activeFilter];
  const visibleEdgeIds = allowed ? new Set(model.edges.filter((e) => allowed.includes(e.relation)).map((e) => e.id)) : null;
  const hoveredEdgeIds = hoveredId
    ? new Set(model.edges.filter((e) => e.source === hoveredId || e.target === hoveredId).map((e) => e.id))
    : new Set();
  return (
    <svg viewBox="0 0 760 600" preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', overflow: 'visible' }} aria-label="LexiGraph word relationship map">
      <defs>
        <filter id="lxi-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {model.edges.map((edge) => {
        const filteredOut = visibleEdgeIds !== null && !visibleEdgeIds.has(edge.id);
        return (
          <Edge key={edge.id} edge={edge} nodes={model.nodes}
            isHighlighted={!filteredOut && hoveredId !== null && hoveredEdgeIds.has(edge.id)}
            isDimmed={filteredOut || (hoveredId !== null && !hoveredEdgeIds.has(edge.id))} />
        );
      })}
      {model.nodes.map((node) => (
        <GraphNode key={node.id} node={node} isHovered={hoveredId === node.id}
          isActive={activeNodeId === node.id} onHover={setHoveredId} onClick={onNodeClick}
          isWaving={waveActive && node.type === 'core'} />
      ))}
    </svg>
  );
}

/* ── Search ─────────────────────────────────────────────────────────────── */
function Search({ onSearch, isLoading, notFound, currentWord }) {
  const [val, setVal] = useState('');
  function submit(e) { e.preventDefault(); if (val.trim()) onSearch(val.trim()); }
  return (
    <form onSubmit={submit} style={{ width: '280px' }}>
      <div style={{ position: 'relative' }}>
        <input value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Search a word / 搜索单词…"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '8px 30px 8px 12px',
            borderRadius: '8px', background: 'rgba(2,6,23,0.78)',
            border: `1px solid ${notFound ? 'rgba(248,113,113,0.5)' : 'rgba(56,189,248,0.3)'}`,
            color: '#ECFBFF', fontSize: '13px', fontFamily: 'ui-monospace, monospace',
            outline: 'none', backdropFilter: 'blur(8px)',
          }} />
        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'rgba(56,189,248,0.6)' }}>
          {isLoading ? '◌' : '⏎'}
        </span>
      </div>
      {notFound && (
        <div style={{ marginTop: '5px', fontSize: '11px', color: '#F87171', fontFamily: 'ui-monospace, monospace' }}>
          Not found / 未找到 · Try another word or open Dictionary.
        </div>
      )}
    </form>
  );
}

/* ── Legend ─────────────────────────────────────────────────────────────── */
function Legend() {
  const items = [
    ['synonym', 'Synonym 近义'], ['antonym', 'Antonym 反义'],
    ['collocation', 'Collocation 搭配'], ['etymology', 'Etymology 词源'],
    ['scene', 'Scene 场景'], ['exam', 'Exam 考试'],
  ];
  return (
    <div style={{
      background: 'rgba(2,6,23,0.78)', border: '1px solid rgba(56,189,248,0.14)',
      borderRadius: '8px', padding: '8px 10px', backdropFilter: 'blur(8px)',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px',
    }}>
      {items.map(([k, label]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: D.EDGE_COLORS[k], flexShrink: 0 }} />
          <span style={{ fontSize: '9.5px', color: 'rgba(155,191,202,0.6)', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Relation filter ────────────────────────────────────────────────────── */
function RelationFilter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '3px', background: 'rgba(2,6,23,0.78)', border: '1px solid rgba(56,189,248,0.14)', borderRadius: '8px', padding: '3px', backdropFilter: 'blur(8px)' }}>
      {Object.keys(FILTER_RELATIONS).map((k) => (
        <button key={k} onClick={() => onChange(k)} style={{
          padding: '3px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer',
          fontFamily: 'ui-monospace, monospace', border: 'none',
          background: value === k ? 'rgba(56,189,248,0.18)' : 'transparent',
          color: value === k ? '#7EF9FF' : 'rgba(155,191,202,0.5)',
        }}>{FILTER_LABELS[k]}</button>
      ))}
    </div>
  );
}

/* ── State legend (node rings) ──────────────────────────────────────────── */
function StateLegend() {
  const items = [['learning', 'Learning 学习中'], ['review', 'Review 复习'], ['mastered', 'Mastered 已掌握'], ['weak', 'Weak 薄弱']];
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {items.map(([k, label]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', border: `2px solid ${D.STATE_RING[k]}`, flexShrink: 0 }} />
          <span style={{ fontSize: '9.5px', color: 'rgba(155,191,202,0.55)', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

window.LexiParts = { GraphMap, Search, Legend, RelationFilter, StateLegend };
