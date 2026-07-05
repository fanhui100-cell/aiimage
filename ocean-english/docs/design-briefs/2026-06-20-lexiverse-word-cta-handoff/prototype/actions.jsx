// actions.jsx — WordPracticeActions
// The Phase 7 focused CTA group for the word detail page.
//
// Spec mirrored for Claude Code:
//   components/lexiverse/WordPracticeActions.tsx
//   lib/lexiverse/word-practice-links.ts  → buildWordPracticeLinks(word, returnTo)
//
// Button set (final, de-duplicated):
//   PRIMARY cluster "从这个词出发":
//     1) 练这个词    primary filled  cyan   /quiz?word=X&returnTo=...
//     2) 考试语境    tonal           yellow /quiz?word=X&mode=exam-practice&returnTo=...
//        (1+2 are a split unit: two lenses of the SAME word pool — never random fallback)
//     3) 词图关系    tonal           purple /lexigraph?word=slug
//     4) 加入今日    tonal           orange lexiStore.ensureWord+addToReview  (toggles → 已加入今日)
//   SECONDARY utilities (demoted, text-level): 问 AI · 词库浏览

// ── word-practice-links.ts (pure URL builder, no router/store coupling) ──
function buildWordPracticeLinks(word, returnTo) {
  const rt = encodeURIComponent(returnTo);
  return {
    practice: `/quiz?word=${word.id}&returnTo=${rt}`,
    examContext: `/quiz?word=${word.id}&mode=exam-practice&returnTo=${rt}`,
    graph: `/lexigraph?word=${word.id}`,
    askAi: `/chat?context=word&word=${word.id}&returnTo=${rt}`,
    browser: `/dictionary?tab=explore`,
  };
}

// ── tiny stroke icons (aria-hidden) ─────────────────────────────────────
function Ico({ d, children, size = 16 }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: 'none' }}>
      {children}
    </svg>
  );
}
const IconTarget = () => <Ico><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></Ico>;
const IconExam = () => <Ico><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13.5 3.5V8h4.5" /><path d="M8.5 13l2 2 4-4" /></Ico>;
const IconGraph = () => <Ico><circle cx="6" cy="7" r="2.3" /><circle cx="18" cy="6" r="2.3" /><circle cx="14" cy="18" r="2.3" /><path d="M8 8l5 8M16 8l-2 8" /></Ico>;
const IconPlus = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M12 8.5v7M8.5 12h7" /></Ico>;
const IconCheck = () => <Ico><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.2l2.4 2.4 4.6-4.8" /></Ico>;
const IconChat = () => <Ico size={14}><path d="M4 5.5h16v10H9l-5 4V5.5Z" /></Ico>;
const IconBook = () => <Ico size={14}><path d="M5 4.5h8a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H5V4.5Z" /><path d="M16 7.5h3v9.5h-3" /></Ico>;

// ── small ghost text link (secondary utility row) ───────────────────────
function UtilLink({ icon, label, sub, href }) {
  return (
    <a href={href} onClick={e => e.preventDefault()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none',
        padding: '7px 11px', borderRadius: 9, color: '#9FB6C6', fontSize: 12.5, fontWeight: 600,
        border: '1px solid transparent', transition: 'all .16s ease', whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#ECFBFF'; e.currentTarget.style.borderColor = 'rgba(126,249,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#9FB6C6'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}>
      {icon}{label}
      <span style={{ color: '#5E7689', fontWeight: 400 }}>{sub}</span>
    </a>
  );
}

// ── a tonal (secondary) pill CTA ────────────────────────────────────────
function TonalCTA({ accent, icon, en, zh, href, onClick, disabled, disabledLabel, fullWidth }) {
  const interactive = !disabled;
  return (
    <a href={href || '#'} onClick={e => { e.preventDefault(); if (interactive && onClick) onClick(); }}
      aria-disabled={disabled || undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none',
        width: fullWidth ? '100%' : undefined,
        padding: '11px 15px', borderRadius: 12,
        border: `1px solid ${disabled ? 'rgba(159,182,198,0.18)' : accent + '40'}`,
        background: disabled ? 'rgba(255,255,255,0.02)' : `${accent}14`,
        color: disabled ? '#7E94A6' : accent,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform .16s ease, background .16s ease, border-color .16s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!interactive) return; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = `${accent}22`; e.currentTarget.style.borderColor = `${accent}77`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (interactive) { e.currentTarget.style.background = `${accent}14`; e.currentTarget.style.borderColor = `${accent}40`; } }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, alignItems: 'flex-start' }}>
        <b style={{ fontSize: 13.5, fontWeight: 700 }}>{disabled && disabledLabel ? disabledLabel : zh}</b>
        <span style={{ fontSize: 10, opacity: 0.8, fontFamily: "'Space Mono', monospace", letterSpacing: '.02em' }}>{en}</span>
      </span>
    </a>
  );
}

function WordPracticeActions({ word, returnTo, poolEmpty = false, inToday = false, onAddToday, narrow = false }) {
  const links = buildWordPracticeLinks(word, returnTo);

  return (
    <section aria-label="Word practice actions" className="rise" style={{ marginTop: 26, animationDelay: '.1s' }}>
      {/* group caption + pool status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.16em', color: 'rgba(126,249,255,0.55)', fontFamily: "'Space Mono', monospace" }}>
          {narrow ? '从这个词出发' : 'START FROM THIS WORD · 从这个词出发'}
        </span>
        <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: poolEmpty ? '#FFB48A' : '#6FA9B8', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: poolEmpty ? '#FFA85A' : '#7EF9FF', boxShadow: poolEmpty ? 'none' : '0 0 8px #7EF9FF' }} />
          {poolEmpty ? '本词暂无题目' : '本词题库 · 12 题就绪'}
        </span>
      </div>

      {/* main cluster */}
      <div style={{ display: 'flex', flexDirection: narrow ? 'column' : 'row', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {/* ── practice split unit: 练这个词 (primary) | 考试语境 (lens) ── */}
        <div style={{ display: 'flex', width: narrow ? '100%' : undefined, borderRadius: 13, overflow: 'hidden',
          border: poolEmpty ? '1px solid rgba(159,182,198,0.20)' : '1px solid rgba(126,249,255,0.30)',
          boxShadow: poolEmpty ? 'none' : '0 10px 30px rgba(126,249,255,0.16)' }}>
          {/* 练这个词 */}
          <a href={poolEmpty ? '#' : links.practice} onClick={e => { if (poolEmpty) e.preventDefault(); }}
            aria-disabled={poolEmpty || undefined}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none',
              flex: narrow ? 1 : undefined,
              padding: '13px 20px',
              background: poolEmpty ? 'rgba(255,255,255,0.03)' : 'linear-gradient(135deg, #9DFBFF, #7EF9FF 45%, #38BDF8)',
              color: poolEmpty ? '#7E94A6' : '#04202B',
              cursor: poolEmpty ? 'default' : 'pointer', transition: 'filter .16s ease' }}
            onMouseEnter={e => { if (!poolEmpty) e.currentTarget.style.filter = 'brightness(1.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}>
            <IconTarget />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12, alignItems: 'flex-start' }}>
              <b style={{ fontSize: 15.5, fontWeight: 700 }}>{poolEmpty ? '暂无可练题目' : '练这个词'}</b>
              <span style={{ fontSize: 10, opacity: 0.72, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{poolEmpty ? 'NO ITEMS YET' : 'PRACTICE · 综合背词'}</span>
            </span>
          </a>
          {/* divider */}
          <span aria-hidden style={{ width: 1, background: poolEmpty ? 'rgba(159,182,198,0.18)' : 'rgba(4,32,43,0.35)' }} />
          {/* 考试语境 */}
          <a href={poolEmpty ? '#' : links.examContext} onClick={e => { if (poolEmpty) e.preventDefault(); }}
            aria-disabled={poolEmpty || undefined}
            title="该词的语境 / 考试风格题（cloze · 同义 · 辨析），仍来自本词题库"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, textDecoration: 'none',
              flex: narrow ? 1 : undefined,
              padding: '13px 17px',
              background: poolEmpty ? 'rgba(255,255,255,0.02)' : 'rgba(255,214,107,0.12)',
              color: poolEmpty ? '#7E94A6' : '#FFD66B',
              cursor: poolEmpty ? 'default' : 'pointer', transition: 'background .16s ease' }}
            onMouseEnter={e => { if (!poolEmpty) e.currentTarget.style.background = 'rgba(255,214,107,0.2)'; }}
            onMouseLeave={e => { if (!poolEmpty) e.currentTarget.style.background = 'rgba(255,214,107,0.12)'; }}>
            <IconExam />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12, alignItems: 'flex-start' }}>
              <b style={{ fontSize: 13.5, fontWeight: 700 }}>考试语境</b>
              <span style={{ fontSize: 10, opacity: 0.82, fontFamily: "'Space Mono', monospace" }}>EXAM CONTEXT</span>
            </span>
          </a>
        </div>

        {/* 词图关系 + 加入今日 — on mobile they share a 2-col row; on desktop they sit inline */}
        <div style={{ display: narrow ? 'grid' : 'contents', gridTemplateColumns: narrow ? '1fr 1fr' : undefined, gap: 10 }}>
          <TonalCTA accent="#B79BFF" icon={<IconGraph />} zh="词图关系" en="LEXIGRAPH" href={links.graph} onClick={() => {}} fullWidth={narrow} />
          {inToday ? (
            <TonalCTA accent="#6BE0A0" icon={<IconCheck />} zh="已加入今日" en="IN TODAY'S QUEUE" disabled disabledLabel="已加入今日" fullWidth={narrow} />
          ) : (
            <TonalCTA accent="#FFA85A" icon={<IconPlus />} zh="加入今日" en="ADD TO TODAY" onClick={onAddToday} fullWidth={narrow} />
          )}
        </div>
      </div>

      {/* empty-pool inline hint (never a silent fallback to random) */}
      {poolEmpty && (
        <p style={{ margin: '11px 2px 0', fontSize: 12.5, color: '#FFB48A', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span aria-hidden>⚠</span>
          本词暂无可练题目，正在补充中——不会用无关随机题替代。可先「加入今日」或查看「词图关系」。
        </p>
      )}
      {inToday && !poolEmpty && (
        <p style={{ margin: '10px 2px 0', fontSize: 12.5, color: '#7FD4A6' }}>
          已加入今日复习队列 · 将按 SRS 节奏在「今日」出现。
        </p>
      )}

      {/* secondary utilities row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(126,249,255,0.10)', alignItems: 'center' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.14em', color: '#5E7689', fontFamily: "'Space Mono', monospace", marginRight: 6 }}>MORE</span>
        <UtilLink icon={<IconChat />} label="问 AI" sub="Ask AI" href={links.askAi} />
        <UtilLink icon={<IconBook />} label="词库浏览" sub="Browser" href={links.browser} />
      </div>
    </section>
  );
}

Object.assign(window, { WordPracticeActions, buildWordPracticeLinks });
