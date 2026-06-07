/* ═══════════════════════════════════════════════════════════════════════════
   Lexiverse · central mock data (prototype-only)
   ─────────────────────────────────────────────────────────────────────────
   ONE source of demo content for every visual reference. Claude Code swaps
   this object for the real dictionary loader without touching any UI.

   Rules honoured here:
     · real English words, real-looking definitions (no random gibberish)
     · CEFR ∈ {A1,A2,B1,B2,C1,C2} only
     · examTags ∈ {CET-4,CET-6,IELTS,TOEFL,postgraduate,gaokao} only
     · learningState ∈ {mastered,learning,review,weak,unknown,recommended}
   ═════════════════════════════════════════════════════════════════════════ */
window.LexiverseMock = (function () {
  /** @type {Array<Object>} word planets (real vocabulary) */
  const WORDS = [
    {
      id: 'w_arise', word: 'arise', ipa: '/əˈraɪz/', pos: 'verb',
      defEn: 'To come into being, emerge, or originate, especially of a situation or problem.',
      defZh: '出现；产生；（问题或情况）发生',
      exampleEn: 'New challenges arise whenever a system grows beyond its original design.',
      exampleZh: '每当系统超出最初设计规模时，新的挑战就会出现。',
      cefr: 'B2', difficulty: 3, examTags: ['IELTS', 'CET-6', 'postgraduate'],
      themeTags: ['academic', 'change'], learningState: 'learning',
      synonyms: ['emerge', 'occur', 'surface', 'develop'],
      antonyms: ['vanish', 'subside'],
      collocations: ['arise from', 'problems arise', 'questions arise', 'arise out of'],
      mnemonic: 'a- (up) + rise → something rises up into existence.',
    },
    {
      id: 'w_allocate', word: 'allocate', ipa: '/ˈæləkeɪt/', pos: 'verb',
      defEn: 'To distribute resources or duties for a particular purpose.',
      defZh: '分配；分派（资源、时间、职责）',
      exampleEn: 'The team allocated two weeks to testing before the release.',
      exampleZh: '团队在发布前留出两周用于测试。',
      cefr: 'B2', difficulty: 3, examTags: ['IELTS', 'TOEFL', 'CET-6'],
      themeTags: ['business', 'project-management'], learningState: 'review',
      synonyms: ['assign', 'apportion', 'distribute'], antonyms: ['withhold', 'retain'],
      collocations: ['allocate resources', 'allocate funds', 'allocate time'],
      mnemonic: 'al + locate → put each thing in its location.',
    },
    {
      id: 'w_resilient', word: 'resilient', ipa: '/rɪˈzɪliənt/', pos: 'adjective',
      defEn: 'Able to recover quickly from difficulty; springing back into shape.',
      defZh: '有韧性的；能快速恢复的；有弹性的',
      exampleEn: 'A resilient design keeps working even when one part fails.',
      exampleZh: '有韧性的设计即使某个部件失效也能继续运转。',
      cefr: 'C1', difficulty: 4, examTags: ['IELTS', 'TOEFL', 'postgraduate'],
      themeTags: ['academic', 'emotion'], learningState: 'recommended',
      synonyms: ['tough', 'adaptable', 'hardy'], antonyms: ['fragile', 'brittle'],
      collocations: ['resilient system', 'emotionally resilient', 'resilient economy'],
      mnemonic: 're- (back) + salire (to jump) → jumps back after a knock.',
    },
    {
      id: 'w_fluent', word: 'fluent', ipa: '/ˈfluːənt/', pos: 'adjective',
      defEn: 'Able to express oneself easily and accurately in a language.',
      defZh: '流利的；流畅的',
      exampleEn: 'After a year abroad she became fluent in Spanish.',
      exampleZh: '在国外待了一年后，她的西班牙语变得流利。',
      cefr: 'B1', difficulty: 2, examTags: ['CET-4', 'IELTS', 'gaokao'],
      themeTags: ['communication', 'learning'], learningState: 'mastered',
      synonyms: ['articulate', 'eloquent'], antonyms: ['halting', 'hesitant'],
      collocations: ['fluent in', 'fluent speaker', 'speak fluently'],
      mnemonic: 'fluent ← fluere (to flow) → words flow out.',
    },
    {
      id: 'w_foster', word: 'foster', ipa: '/ˈfɒstə/', pos: 'verb',
      defEn: 'To encourage the development of something desirable.',
      defZh: '培养；促进；助长',
      exampleEn: 'Good mentorship fosters curiosity and independent thinking.',
      exampleZh: '良好的指导能培养好奇心和独立思考。',
      cefr: 'C1', difficulty: 4, examTags: ['IELTS', 'CET-6', 'postgraduate'],
      themeTags: ['academic', 'learning'], learningState: 'weak',
      synonyms: ['nurture', 'cultivate', 'promote'], antonyms: ['suppress', 'hinder'],
      collocations: ['foster growth', 'foster innovation', 'foster a sense of'],
      mnemonic: 'A foster parent nurtures a child → foster = nurture.',
    },
    {
      id: 'w_mitigate', word: 'mitigate', ipa: '/ˈmɪtɪɡeɪt/', pos: 'verb',
      defEn: 'To make something bad less severe or harmful.',
      defZh: '减轻；缓和；使缓解',
      exampleEn: 'Backups mitigate the damage caused by a server failure.',
      exampleZh: '备份能减轻服务器故障造成的损失。',
      cefr: 'C1', difficulty: 4, examTags: ['IELTS', 'TOEFL', 'postgraduate'],
      themeTags: ['academic', 'business'], learningState: 'unknown',
      synonyms: ['alleviate', 'lessen', 'ease'], antonyms: ['aggravate', 'intensify'],
      collocations: ['mitigate risk', 'mitigate the effects', 'mitigate damage'],
      mnemonic: 'mit ← mitis (soft) → soften the blow.',
    },
    {
      id: 'w_candor', word: 'candor', ipa: '/ˈkændə/', pos: 'noun',
      defEn: 'The quality of being open, honest, and direct in speech.',
      defZh: '坦率；直率；真诚',
      exampleEn: 'She answered every question with refreshing candor.',
      exampleZh: '她以令人耳目一新的坦率回答了每一个问题。',
      cefr: 'C2', difficulty: 5, examTags: ['TOEFL', 'postgraduate'],
      themeTags: ['communication', 'emotion'], learningState: 'unknown',
      synonyms: ['frankness', 'honesty', 'openness'], antonyms: ['evasion', 'deceit'],
      collocations: ['with candor', 'refreshing candor', 'speak with candor'],
      mnemonic: 'candor ← candere (to shine white) → bright, clear honesty.',
    },
    {
      id: 'w_ambient', word: 'ambient', ipa: '/ˈæmbiənt/', pos: 'adjective',
      defEn: 'Relating to the surrounding environment; present on all sides.',
      defZh: '周围的；环境的；弥漫的',
      exampleEn: 'Sensors measured the ambient temperature of the room.',
      exampleZh: '传感器测量了房间的环境温度。',
      cefr: 'C1', difficulty: 4, examTags: ['IELTS', 'CET-6'],
      themeTags: ['science', 'daily-life'], learningState: 'learning',
      synonyms: ['surrounding', 'encompassing'], antonyms: ['localized'],
      collocations: ['ambient light', 'ambient temperature', 'ambient noise'],
      mnemonic: 'amb- (around) → what surrounds you.',
    },
    {
      id: 'w_abandon', word: 'abandon', ipa: '/əˈbændən/', pos: 'verb',
      defEn: 'To give up completely; to leave permanently.',
      defZh: '放弃；抛弃；离弃',
      exampleEn: 'They abandoned the old approach for a simpler one.',
      exampleZh: '他们放弃了旧方法，改用更简单的方案。',
      cefr: 'B1', difficulty: 2, examTags: ['CET-4', 'gaokao', 'IELTS'],
      themeTags: ['change', 'daily-life'], learningState: 'review',
      synonyms: ['desert', 'forsake', 'relinquish'], antonyms: ['keep', 'maintain'],
      collocations: ['abandon a plan', 'abandon hope', 'abandon ship'],
      mnemonic: 'a-band-on → leave the band and walk off.',
    },
    {
      id: 'w_acquire', word: 'acquire', ipa: '/əˈkwaɪə/', pos: 'verb',
      defEn: 'To gain possession of, or come to have, a skill or quality.',
      defZh: '获得；取得；学到',
      exampleEn: 'You acquire fluency through steady daily practice.',
      exampleZh: '通过每天稳定练习，你会获得流利度。',
      cefr: 'B2', difficulty: 3, examTags: ['CET-6', 'IELTS', 'TOEFL'],
      themeTags: ['learning', 'business'], learningState: 'mastered',
      synonyms: ['obtain', 'gain', 'attain'], antonyms: ['lose', 'forfeit'],
      collocations: ['acquire a skill', 'acquire knowledge', 'acquire a company'],
      mnemonic: 'ac + quaerere (to seek) → seek and get.',
    },
  ];

  const byId = Object.fromEntries(WORDS.map(w => [w.id, w]));

  /** original demo quiz questions (NOT from any real exam) */
  const QUIZ = [
    {
      id: 'q1', mode: 'vocabulary-drill', wordId: 'w_arise',
      prompt: 'Which word best completes the sentence?',
      sentence: 'Unexpected problems often ___ when a small project suddenly scales up.',
      options: ['arise', 'arrange', 'arrive', 'arouse'], answer: 0,
      explain: '“arise” means to come into being / emerge — problems arise. The others mean to organise, to reach a place, and to stir up.',
    },
    {
      id: 'q2', mode: 'vocabulary-drill', wordId: 'w_mitigate',
      prompt: 'Choose the closest synonym.',
      sentence: 'mitigate',
      options: ['intensify', 'alleviate', 'ignore', 'measure'], answer: 1,
      explain: '“mitigate” = to make less severe, so “alleviate” is closest. “intensify” is the opposite.',
    },
    {
      id: 'q3', mode: 'sentence-practice', wordId: 'w_foster',
      prompt: 'Pick the sentence that uses the word correctly.',
      sentence: 'foster',
      options: [
        'The company fosters a culture of open feedback.',
        'She fostered the train to the airport.',
        'They fostered the door shut against the wind.',
        'He fostered a glass of water quickly.',
      ], answer: 0,
      explain: '“foster” means to encourage development — fostering a culture. The other sentences misuse it as a physical verb.',
    },
  ];

  /** lightweight galaxy summary (mirrors the 80-galaxy universe HUD) */
  const UNIVERSE = {
    galaxies: 80, active: 12, growing: 7, empty: 61,
    knownWords: 1840, masteredWords: 612, reviewQueue: 38, weakWords: 23,
    lexiStar: 7, levelLabel: 'Voyager · 航行者',
  };

  function wordsForState(state) { return WORDS.filter(w => w.learningState === state); }

  return { WORDS, byId, QUIZ, UNIVERSE, wordsForState,
    CEFR: ['A1','A2','B1','B2','C1','C2'],
    EXAMS: ['CET-4','CET-6','IELTS','TOEFL','postgraduate','gaokao'],
    POS: ['noun','verb','adjective','adverb'],
    THEMES: ['daily-life','communication','academic','business','science','learning','emotion','change','project-management'],
    STATE_COLOR: { mastered:'#7EF9FF', recommended:'#FFC861', learning:'#38BDF8', review:'#FF9E6B', weak:'#FF8FA8', unknown:'#9DB6CB' },
    STATE_LABEL: { mastered:'Mastered · 已掌握', recommended:'Recommended · 推荐', learning:'Learning · 学习中', review:'Review · 待复习', weak:'Weak · 薄弱', unknown:'Unknown · 未学' },
  };
})();
