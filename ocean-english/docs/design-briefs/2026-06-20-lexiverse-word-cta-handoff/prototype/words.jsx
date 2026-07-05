// words.jsx — a small dictionary so any chip can "warp" to that word's planet.
// resolveWord(slug) returns a full entry when known, otherwise a graceful stub.

function slugify(s) { return String(s).toLowerCase().trim().replace(/\s+/g, '-'); }

const WORD_DB = {
  resilient: {
    id: 'resilient', word: 'resilient', phoneticIpa: '/rɪˈzɪliənt/', partOfSpeech: 'adj.',
    glossZh: '有韧性的 · 能迅速复原的', cefrLevel: 'B2', examTags: ['CET-6', 'IELTS', '考研'],
    themeTags: ['Character', 'Growth'], domainTags: ['Psychology'],
    definitionEn: 'Able to recover quickly from difficulty, setbacks, or change; tough and adaptable.',
    definitionZh: '能从困境、挫折或变化中迅速恢复的；有韧性的、适应力强的。',
    exampleEn: 'A resilient economy can absorb shocks and bounce back faster than its rivals.',
    exampleZh: '有韧性的经济体能吸收冲击，比对手更快地复苏。',
    synonyms: ['tough', 'hardy', 'adaptable', 'buoyant'], antonyms: ['fragile', 'brittle', 'vulnerable'],
    collocations: ['resilient economy', 'emotionally resilient', 'resilient material'],
    galaxyTitle: 'Mind & Character · 心智星系', constellationTitle: 'Humanities 星座',
    galaxyWords: ['adaptable', 'persevere', 'tenacity', 'cope', 'endure', 'fortitude', 'setback', 'bounce back', 'grit', 'thrive', 'withstand', 'recover'],
    learningState: 'learning',
  },
  adaptable: {
    id: 'adaptable', word: 'adaptable', phoneticIpa: '/əˈdæptəbl/', partOfSpeech: 'adj.',
    glossZh: '适应力强的 · 可调整的', cefrLevel: 'B2', examTags: ['CET-6', 'IELTS'],
    themeTags: ['Character'], domainTags: ['Psychology'],
    definitionEn: 'Able to adjust to new conditions or be modified for a different use.',
    definitionZh: '能适应新环境的；可调整以适应不同用途的。',
    exampleEn: 'Adaptable teams thrive when the market shifts overnight.',
    exampleZh: '当市场一夜之间变化时，适应力强的团队反而蓬勃发展。',
    synonyms: ['resilient', 'flexible', 'versatile'], antonyms: ['rigid', 'fixed'],
    collocations: ['highly adaptable', 'adaptable design'],
    galaxyTitle: 'Mind & Character · 心智星系', constellationTitle: 'Humanities 星座',
    galaxyWords: ['resilient', 'flexible', 'versatile', 'persevere', 'cope', 'thrive'],
    learningState: 'recommended',
  },
  persevere: {
    id: 'persevere', word: 'persevere', phoneticIpa: '/ˌpɜːsɪˈvɪə/', partOfSpeech: 'v.',
    glossZh: '坚持不懈 · 锲而不舍', cefrLevel: 'C1', examTags: ['考研', 'IELTS'],
    themeTags: ['Growth'], domainTags: [],
    definitionEn: 'To continue steadfastly in a course of action despite difficulty or opposition.',
    definitionZh: '不顾困难或反对，坚定不移地坚持下去。',
    exampleEn: 'She persevered through years of rejection before her work was recognized.',
    exampleZh: '在作品被认可之前，她在多年的拒绝中始终坚持。',
    synonyms: ['persist', 'endure', 'carry on'], antonyms: ['quit', 'surrender'],
    collocations: ['persevere with', 'persevere despite'],
    galaxyTitle: 'Mind & Character · 心智星系', constellationTitle: 'Humanities 星座',
    galaxyWords: ['resilient', 'tenacity', 'grit', 'endure', 'withstand'],
    learningState: 'weak',
  },
  fragile: {
    id: 'fragile', word: 'fragile', phoneticIpa: '/ˈfrædʒaɪl/', partOfSpeech: 'adj.',
    glossZh: '脆弱的 · 易碎的', cefrLevel: 'B1', examTags: ['CET-4'],
    themeTags: ['Character'], domainTags: [],
    definitionEn: 'Easily broken or damaged; delicate and not strong.',
    definitionZh: '容易破碎或受损的；脆弱而不坚固的。',
    exampleEn: 'The peace deal remained fragile for months after it was signed.',
    exampleZh: '和平协议签署后的数月里一直十分脆弱。',
    synonyms: ['brittle', 'delicate', 'frail'], antonyms: ['resilient', 'sturdy', 'tough'],
    collocations: ['fragile peace', 'fragile ecosystem'],
    galaxyTitle: 'Mind & Character · 心智星系', constellationTitle: 'Humanities 星座',
    galaxyWords: ['brittle', 'vulnerable', 'delicate', 'resilient'],
    learningState: 'mastered',
  },
  tough: {
    id: 'tough', word: 'tough', phoneticIpa: '/tʌf/', partOfSpeech: 'adj.',
    glossZh: '坚韧的 · 棘手的', cefrLevel: 'B1', examTags: ['CET-4', 'CET-6'],
    themeTags: ['Character'], domainTags: [],
    definitionEn: 'Strong enough to withstand adverse conditions; difficult to deal with.',
    definitionZh: '足以承受不利条件的；难以应付的。',
    exampleEn: 'It was a tough decision, but a resilient leader makes it anyway.',
    exampleZh: '这是个艰难的决定，但有韧性的领导者依然会拍板。',
    synonyms: ['resilient', 'hardy', 'sturdy'], antonyms: ['fragile', 'weak'],
    collocations: ['tough decision', 'mentally tough'],
    galaxyTitle: 'Mind & Character · 心智星系', constellationTitle: 'Humanities 星座',
    galaxyWords: ['resilient', 'hardy', 'sturdy', 'grit'],
    learningState: 'unknown',
  },
};

function resolveWord(slug) {
  if (WORD_DB[slug]) return WORD_DB[slug];
  const display = slug.replace(/-/g, ' ');
  return {
    id: slug, word: display, phoneticIpa: '', partOfSpeech: '',
    glossZh: '词条数据补全中', cefrLevel: '', examTags: [], themeTags: [], domainTags: [],
    definitionEn: '', definitionZh: '',
    exampleEn: '', exampleZh: '',
    synonyms: [], antonyms: [], collocations: [],
    galaxyTitle: 'Lexiverse · 未分类星域', constellationTitle: '—',
    galaxyWords: [], learningState: 'unknown', isStub: true,
  };
}

Object.assign(window, { WORD_DB, resolveWord, slugify });
