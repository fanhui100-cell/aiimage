/* ═══════════════════════════════════════════════════════════════════════════
   Lexiverse · Sector demo data  (prototype-only, centralized & replaceable)
   ─────────────────────────────────────────────────────────────────────────
   Spatial Sector Model: ONE galaxy is ONE continuous 3D field that contains
   several spaced-out Sector Clusters. A Sector is a *region of space inside a
   galaxy*, NOT a separate page. Each sector visually carries 200–500 word
   planets. Codex swaps this object for the real dictionary loader — the engine
   never hard-codes content.

   Naming: macro space = Lexiverse / 词汇宇宙.  word-relation graph = LexiGraph.
   ═════════════════════════════════════════════════════════════════════════ */
window.LexiverseSectors = (function () {

  /* the demo galaxy this field represents (one of the 80 in the Universe) */
  const GALAXY = {
    id: 'academic-core',
    constellationId: 'academic-knowledge',
    title: 'Academic Core',
    titleZh: '学术核心',
    colorTheme: '#7EF9FF',
    constellationLabel: 'Academic Knowledge · 学术星座',
  };

  /* learning-state palette (mirrors LexiverseMock.STATE_COLOR) */
  const STATE = {
    mastered:    { color: '#7EF9FF', label: 'Mastered · 已掌握' },
    learning:    { color: '#38BDF8', label: 'Learning · 学习中' },
    review:      { color: '#FF9E6B', label: 'Review · 待复习' },
    weak:        { color: '#FF8FA8', label: 'Weak · 薄弱' },
    recommended: { color: '#FFC861', label: 'Recommended · 推荐' },
    unknown:     { color: '#9DB6CB', label: 'Unknown · 未学' },
  };

  /* 6 sectors placed at different radii / arms of the galaxy field.
     pos = center of the cluster in galaxy-space (engine scatters planets around it).
     density = relative particle density · mastery drives brightness/stability.    */
  const SECTORS = [
    {
      id: 'research-method', name: 'Research & Method', nameZh: '研究方法',
      color: '#7EF9FF', status: 'active',   wordCount: 520, mastery: 0.62, review: 18, weak: 6,
      pos: [-980,  70, -240], radius: 250, density: 1.0,
      blurb: 'How studies are designed, run and reported.',
    },
    {
      id: 'argument-logic', name: 'Argument & Logic', nameZh: '论证逻辑',
      color: '#B79BFF', status: 'active',   wordCount: 470, mastery: 0.48, review: 27, weak: 11,
      pos: [ 880, 240,  420], radius: 235, density: 0.95,
      blurb: 'Claims, evidence, reasoning and rhetoric.',
    },
    {
      id: 'data-statistics', name: 'Data & Statistics', nameZh: '数据统计',
      color: '#5FE0D6', status: 'active',   wordCount: 490, mastery: 0.55, review: 9, weak: 4,
      pos: [ 180, -200, -1040], radius: 245, density: 1.0,
      blurb: 'Measurement, distribution, correlation, trends.',
    },
    {
      id: 'cause-effect', name: 'Cause & Effect', nameZh: '因果关系',
      color: '#6BE0A0', status: 'growing',  wordCount: 360, mastery: 0.34, review: 14, weak: 16,
      pos: [-620, -140,  920], radius: 210, density: 0.8,
      blurb: 'Mechanisms, influence, consequence, feedback.',
    },
    {
      id: 'trends-change', name: 'Trends & Change', nameZh: '趋势变化',
      color: '#FFC861', status: 'growing',  wordCount: 320, mastery: 0.28, review: 8, weak: 9,
      pos: [ 1120, 280, -640], radius: 205, density: 0.72,
      blurb: 'Growth, decline, fluctuation, transformation.',
    },
    {
      id: 'abstract-concepts', name: 'Abstract Concepts', nameZh: '抽象概念',
      color: '#FF9E6B', status: 'forming',  wordCount: 240, mastery: 0.12, review: 3, weak: 5,
      pos: [-260,  150,  1140], radius: 185, density: 0.5,
      blurb: 'High-CEFR nuance: notion, premise, paradigm.',
    },
  ];

  /* real, curated featured words per sector (LABELS only — centralized mock).
     Ambient bodies get NO word and NO detail. These map onto the full Word
     contract via byWord() below; the rest of the planets are ambient texture. */
  const FEATURED = {
    'research-method': ['hypothesis','methodology','sample','variable','empirical','rigorous','validate','replicate','correlate','quantitative','qualitative','framework'],
    'argument-logic': ['premise','infer','refute','coherent','fallacy','assertion','rebut','plausible','contradict','substantiate','rhetoric','concede'],
    'data-statistics': ['median','deviation','outlier','regression','threshold','aggregate','distribution','significant','estimate','margin','sample','trend'],
    'cause-effect': ['trigger','consequence','mechanism','attribute','feedback','catalyst','offset','amplify','underlie','stem','induce','mitigate'],
    'trends-change': ['surge','decline','fluctuate','plateau','accelerate','diminish','escalate','stabilize','shift','emerge','reverse','taper'],
    'abstract-concepts': ['notion','premise','paradigm','intrinsic','nuance','construct','tenet','axiom','abstraction','salient','latent',' subjective'.trim()],
  };

  /* full Word records for the featured words that need a real Planet Detail.
     (A representative subset — Codex replaces with the dictionary loader.) */
  const WORD_BANK = {
    hypothesis: { ipa: '/haɪˈpɒθəsɪs/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A proposed explanation made on limited evidence as a starting point for further investigation.',
      defZh: '假设；前提；猜想',
      exampleEn: 'The team tested the hypothesis with a controlled experiment.',
      exampleZh: '团队用对照实验检验了这一假设。',
      examTags: ['IELTS','TOEFL','postgraduate'], themeTags: ['academic','science'],
      synonyms: ['theory','premise','supposition'], antonyms: ['fact','certainty'],
      collocations: ['test a hypothesis','working hypothesis','null hypothesis'],
      mnemonic: 'hypo- (under) + thesis → an idea placed under testing.' },
    methodology: { ipa: '/ˌmeθəˈdɒlədʒi/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A system of methods used in a particular area of study or activity.',
      defZh: '方法论；研究方法',
      exampleEn: 'The paper describes its methodology in careful detail.',
      exampleZh: '论文详细描述了其研究方法。',
      examTags: ['IELTS','postgraduate'], themeTags: ['academic'],
      synonyms: ['approach','procedure','technique'], antonyms: [],
      collocations: ['research methodology','sound methodology'],
      mnemonic: 'method + -ology → the study of methods.' },
    empirical: { ipa: '/ɪmˈpɪrɪkl/', pos: 'adjective', cefr: 'C1', difficulty: 4,
      defEn: 'Based on observation or experiment rather than theory alone.',
      defZh: '以经验/实证为依据的',
      exampleEn: 'There is strong empirical evidence for the claim.',
      exampleZh: '该说法有充分的实证依据。',
      examTags: ['IELTS','TOEFL','postgraduate'], themeTags: ['academic','science'],
      synonyms: ['observed','experiential','factual'], antonyms: ['theoretical','speculative'],
      collocations: ['empirical evidence','empirical study'],
      mnemonic: 'empirical ← experience → known by experience.' },
    premise: { ipa: '/ˈpremɪs/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A statement taken to be true and used as the basis for an argument.',
      defZh: '前提；假定',
      exampleEn: 'The argument rests on a questionable premise.',
      exampleZh: '该论证建立在一个有疑问的前提之上。',
      examTags: ['TOEFL','postgraduate'], themeTags: ['academic'],
      synonyms: ['assumption','basis','proposition'], antonyms: ['conclusion'],
      collocations: ['false premise','basic premise','on the premise that'],
      mnemonic: 'pre- (before) + miss (send) → sent before the conclusion.' },
    refute: { ipa: '/rɪˈfjuːt/', pos: 'verb', cefr: 'C1', difficulty: 4,
      defEn: 'To prove a statement or argument to be wrong or false.',
      defZh: '反驳；驳斥；证伪',
      exampleEn: 'New data refuted the earlier conclusion.',
      exampleZh: '新数据驳倒了先前的结论。',
      examTags: ['IELTS','TOEFL','postgraduate'], themeTags: ['academic'],
      synonyms: ['disprove','rebut','counter'], antonyms: ['confirm','prove'],
      collocations: ['refute a claim','refute the argument'],
      mnemonic: 're- (back) + futare (to beat) → beat an argument back.' },
    median: { ipa: '/ˈmiːdiən/', pos: 'noun', cefr: 'B2', difficulty: 3,
      defEn: 'The middle value in a set of numbers arranged in order.',
      defZh: '中位数；中值',
      exampleEn: 'The median income is lower than the average.',
      exampleZh: '收入中位数低于平均值。',
      examTags: ['IELTS','CET-6'], themeTags: ['academic','science'],
      synonyms: ['midpoint'], antonyms: [],
      collocations: ['median value','median age'],
      mnemonic: 'median ← medius (middle) → the middle one.' },
    regression: { ipa: '/rɪˈɡreʃn/', pos: 'noun', cefr: 'C1', difficulty: 5,
      defEn: 'A statistical measure of the relationship between variables.',
      defZh: '回归（分析）；倒退',
      exampleEn: 'A linear regression revealed a clear trend.',
      exampleZh: '线性回归揭示了明显的趋势。',
      examTags: ['postgraduate'], themeTags: ['academic','science'],
      synonyms: ['reversion'], antonyms: ['progression'],
      collocations: ['linear regression','regression model'],
      mnemonic: 're- (back) + gress (step) → stepping back to a line.' },
    trigger: { ipa: '/ˈtrɪɡə/', pos: 'verb', cefr: 'B2', difficulty: 3,
      defEn: 'To cause something to start or happen suddenly.',
      defZh: '触发；引发',
      exampleEn: 'A small change can trigger a large effect.',
      exampleZh: '微小的变化可能触发巨大的效应。',
      examTags: ['IELTS','CET-6','TOEFL'], themeTags: ['academic','change'],
      synonyms: ['prompt','spark','set off'], antonyms: ['prevent','suppress'],
      collocations: ['trigger a response','trigger an alarm'],
      mnemonic: 'pull the trigger → start it instantly.' },
    catalyst: { ipa: '/ˈkætəlɪst/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A person or thing that causes an event or change to happen.',
      defZh: '催化剂；促因',
      exampleEn: 'The report was a catalyst for reform.',
      exampleZh: '这份报告成了改革的催化剂。',
      examTags: ['IELTS','postgraduate'], themeTags: ['academic','change','science'],
      synonyms: ['stimulus','spur','trigger'], antonyms: ['inhibitor'],
      collocations: ['catalyst for change','act as a catalyst'],
      mnemonic: 'cata- (down) + lysis (loosen) → loosens a reaction into motion.' },
    surge: { ipa: '/sɜːdʒ/', pos: 'noun', cefr: 'B2', difficulty: 3,
      defEn: 'A sudden and large increase.',
      defZh: '激增；猛涨；涌动',
      exampleEn: 'There was a surge in demand last quarter.',
      exampleZh: '上季度需求激增。',
      examTags: ['IELTS','TOEFL'], themeTags: ['change','business'],
      synonyms: ['spike','upswing','rush'], antonyms: ['decline','dip'],
      collocations: ['a surge in','power surge','surge forward'],
      mnemonic: 'surge ← surgere (to rise) → a sudden rise.' },
    plateau: { ipa: '/ˈplætəʊ/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A state of little or no change after a period of activity or growth.',
      defZh: '平台期；停滞；高原',
      exampleEn: 'Progress reached a plateau after six months.',
      exampleZh: '六个月后进展进入平台期。',
      examTags: ['IELTS','postgraduate'], themeTags: ['change'],
      synonyms: ['levelling off','stabilization'], antonyms: ['surge','spike'],
      collocations: ['reach a plateau','plateau out'],
      mnemonic: 'a flat high plateau → flat, no change.' },
    notion: { ipa: '/ˈnəʊʃn/', pos: 'noun', cefr: 'C1', difficulty: 4,
      defEn: 'A conception of or belief about something; a vague idea.',
      defZh: '概念；观念；想法',
      exampleEn: 'The notion that effort guarantees success is too simple.',
      exampleZh: '“努力必然带来成功”这一观念过于简单。',
      examTags: ['TOEFL','postgraduate'], themeTags: ['academic','emotion'],
      synonyms: ['idea','concept','belief'], antonyms: [],
      collocations: ['the notion that','a vague notion','reject the notion'],
      mnemonic: 'notion ← notio (knowing) → a thing you hold in mind.' },
    paradigm: { ipa: '/ˈpærədaɪm/', pos: 'noun', cefr: 'C2', difficulty: 5,
      defEn: 'A typical example or model; a framework of thought in a field.',
      defZh: '范式；典范；样板',
      exampleEn: 'The discovery caused a paradigm shift in the field.',
      exampleZh: '这一发现引发了该领域的范式转变。',
      examTags: ['postgraduate'], themeTags: ['academic'],
      synonyms: ['model','framework','exemplar'], antonyms: [],
      collocations: ['paradigm shift','dominant paradigm'],
      mnemonic: 'para- + deigma (pattern) → a pattern to follow.' },
  };

  /* distribution of learning states given a sector's mastery (for visual texture) */
  function stateMix(mastery) {
    // higher mastery → more cyan(mastered)/blue(learning), fewer weak/unknown
    return [
      ['mastered',    0.10 + mastery * 0.45],
      ['learning',    0.18 + mastery * 0.10],
      ['review',      0.12],
      ['weak',        0.14 - mastery * 0.08],
      ['recommended', 0.08],
      ['unknown',     0.40 - mastery * 0.40],
    ];
  }

  function byWord(word) {
    const base = WORD_BANK[word];
    if (!base) return null;
    return Object.assign({ id: 'w_' + word, word }, base);
  }

  return { GALAXY, SECTORS, STATE, FEATURED, WORD_BANK, stateMix, byWord,
    DEMO_PLANETS_PER_SECTOR: 300, RENDER_MULT: 2 };
})();
