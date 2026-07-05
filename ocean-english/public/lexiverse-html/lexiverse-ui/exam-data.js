/* ═══════════════════════════════════════════════════════════════════════════
   Lexiverse · EXAM ROUTES data  (★ MOCK / prototype-only ★)
   ─────────────────────────────────────────────────────────────────────────
   Exam routes are an OVERLAY, never a semantic galaxy. A word's home is its
   semantic galaxy + sector; exam tags only say *why* you study it, *how* to
   filter it, and *which* learning path to enter.

   EVERYTHING in this file is illustrative mock data generated deterministically
   from ids — NOT production. Codex replaces:
     · coverageForGalaxy / universeTotals  → real dictionary exam-tag counts
     · wordExamProfile                      → real exam profile from the loader
   No real/commercial dictionary or question-bank content is included.
   ═════════════════════════════════════════════════════════════════════════ */
window.LexiverseExam = (function () {

  /* route catalogue. color stays inside the Liquid-Glass palette; each route
     has a distinct visual language described in the handoff. */
  const EXAMS = [
    { id: 'all',     name: 'All Vocabulary', nameZh: '全部词汇', short: 'ALL',  color: '#7EF9FF', glow: 'cyan',   reserved: false, difficulty: 0,
      blurb: 'The full semantic universe — every galaxy lit.', daily: 30 },
    { id: 'cet4',    name: 'CET-4',          nameZh: '四级',     short: 'CET-4', color: '#8FD6FF', glow: 'sky',    reserved: false, difficulty: 2,
      blurb: 'Core foundation vocabulary. Light, clear, everyday.', daily: 20 },
    { id: 'cet6',    name: 'CET-6',          nameZh: '六级',     short: 'CET-6', color: '#38BDF8', glow: 'blue',   reserved: false, difficulty: 3,
      blurb: 'Advanced college words. Collocations & reading.', daily: 25 },
    { id: 'kaoyan',  name: 'Postgraduate',   nameZh: '考研',     short: '考研',  color: '#9BB6FF', glow: 'silver', reserved: false, difficulty: 4,
      blurb: 'Academic reading, polysemy, long sentences, abstraction.', daily: 30 },
    { id: 'ielts',   name: 'IELTS',          nameZh: '雅思',     short: 'IELTS', color: '#A9B8FF', glow: 'pearl',  reserved: false, difficulty: 4,
      blurb: 'Academic + topic vocab across the four modules.', daily: 28 },
    { id: 'toefl',   name: 'TOEFL',          nameZh: '托福',     short: 'TOEFL', color: '#5FB6E0', glow: 'academic', reserved: false, difficulty: 4,
      blurb: 'Academic lecture, campus, reading & listening.', daily: 28 },
    { id: 'gre',     name: 'GRE',            nameZh: 'GRE',      short: 'GRE',   color: '#FFC861', glow: 'amber',  reserved: true,  difficulty: 5,
      blurb: 'Reserved — high-level analytical vocabulary.', daily: 35 },
    { id: 'sat',     name: 'SAT',            nameZh: 'SAT',      short: 'SAT',   color: '#FFB070', glow: 'amber',  reserved: true,  difficulty: 4,
      blurb: 'Reserved — US college admissions vocabulary.', daily: 30 },
    { id: 'custom',  name: 'Custom List',    nameZh: '自定义',   short: 'Custom',color: '#6BE0A0', glow: 'mint',   reserved: true,  difficulty: 0,
      blurb: 'Reserved — your own imported word list.', daily: 15 },
  ];
  const byId = Object.fromEntries(EXAMS.map(e => [e.id, e]));
  const ACTIVE = EXAMS.filter(e => !e.reserved && e.id !== 'all'); // the 5 live routes

  /* IELTS / TOEFL modules (sector-level tags in the handoff) */
  const MODULES = {
    ielts: [['writing','IELTS Writing','文档光环'], ['speaking','IELTS Speaking','声波光环'], ['listening','IELTS Listening','声呐波纹'], ['reading','IELTS Reading','阅读纹理']],
    toefl: [['lecture','TOEFL Lecture','学术讲座'], ['campus','TOEFL Campus','校园场景'], ['reading','TOEFL Reading','学术阅读'], ['listening','TOEFL Listening','听力']],
    kaoyan: [['reading','Academic Reading','学术阅读'], ['longsentence','Long Sentence','长难句'], ['polysemy','熟词僻义','多义层'], ['translation','Translation Trap','翻译陷阱']],
  };

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function srnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* a deterministic "verified word size" for a galaxy (mock) */
  function galaxySize(galaxyId) { const r = srnd(hash(galaxyId + ':size')); return 160 + Math.floor(r() * 460); } // 160–620

  /* base coverage fraction per exam (how much of a galaxy an exam touches) */
  const BASE_FRAC = { cet4: 0.30, cet6: 0.46, kaoyan: 0.62, ielts: 0.40, toefl: 0.44 };

  /* coverage (word count) for an exam within a galaxy — deterministic mock.
     Some galaxy×exam combos return 0 to drive the Forming state.            */
  function coverageForGalaxy(galaxyId, examId) {
    if (examId === 'all') return galaxySize(galaxyId);
    const e = byId[examId]; if (!e || e.reserved) return 0;
    const r = srnd(hash(galaxyId + ':' + examId));
    if (r() < 0.10) return 0;                       // ~10% forming (not enough words)
    const frac = Math.max(0.05, BASE_FRAC[examId] + (r() - 0.5) * 0.34);
    return Math.round(galaxySize(galaxyId) * frac);
  }

  /* full coverage map for a galaxy across the 5 live routes */
  function galaxyCoverage(galaxyId) {
    const out = {}; ACTIVE.forEach(e => out[e.id] = coverageForGalaxy(galaxyId, e.id)); return out;
  }

  /* universe-wide route progress (mock) — summed over the catalogue if present */
  function universeTotals(examId) {
    const cat = window.LexiverseCatalog;
    const ids = cat ? cat.GALAXIES.map(g => g.id) : ['demo'];
    let total = 0; ids.forEach(id => total += coverageForGalaxy(id, examId === 'all' ? 'all' : examId));
    const r = srnd(hash('totals:' + examId));
    const mastered = Math.round(total * (0.18 + r() * 0.22));
    const review = Math.round(total * (0.06 + r() * 0.06));
    const weak = Math.round(total * (0.04 + r() * 0.05));
    return { total, mastered, review, weak };
  }

  /* per-galaxy coverage fraction (for the universe highlight dimming 0..1) */
  function galaxyExamFactor(galaxyId, examId) {
    if (examId === 'all') return 1;
    const cov = coverageForGalaxy(galaxyId, examId);
    if (cov === 0) return 0.10;                    // forming: dim but still faintly present
    const frac = cov / Math.max(1, galaxySize(galaxyId));
    return Math.min(1.3, 0.6 + frac);              // covered: bright, scales with coverage
  }

  /* exam profile for a single (featured) word — MOCK. Real loader supplies this. */
  const PRIORITY = ['core', 'high', 'medium', 'low'];
  function wordExamProfile(word, examId) {
    const r = srnd(hash((word || '') + ':' + (examId || 'all')));
    const band = PRIORITY[Math.floor(r() * 4)];
    const tags = ACTIVE.filter(() => r() > 0.55).map(e => e.id);
    if (!tags.length) tags.push(examId && examId !== 'all' ? examId : 'cet6');
    let module = null;
    if (examId && MODULES[examId]) module = MODULES[examId][Math.floor(r() * MODULES[examId].length)][1];
    return {
      examTags: tags,
      priority: band,
      frequencyBand: band === 'core' ? 'core' : band === 'high' ? 'high-frequency' : band === 'medium' ? 'medium-frequency' : 'low-frequency',
      module,
      questionCount: 2 + Math.floor(r() * 14),
      reviewDue: r() > 0.7,
    };
  }

  /* route action hrefs (handoff contract — prototype just navigates) */
  function routes(word, lexiverseUrl) {
    const w = encodeURIComponent(word); const ret = encodeURIComponent(lexiverseUrl || location.href);
    return {
      wordDetail: `/word/${w}`,
      lexiGraph: `/lexigraph?word=${w}`,
      quiz: `/quiz?mode=vocabulary-drill&word=${w}&returnTo=${ret}`,
      askAI: `/chat?context=word&word=${w}&returnTo=${ret}`,
    };
  }

  const FORMING_MSG = {
    title: 'This sector is still forming · 星区仍在形成',
    lines: ['Not enough verified words for this route yet.', '该路线已验证的词汇还不足。', 'Add more through future content expansion · 后续内容扩充中。'],
  };

  return { EXAMS, byId, ACTIVE, MODULES, PRIORITY,
    coverageForGalaxy, galaxyCoverage, universeTotals, galaxyExamFactor, galaxySize,
    wordExamProfile, routes, FORMING_MSG,
    MOCK: true };
})();
