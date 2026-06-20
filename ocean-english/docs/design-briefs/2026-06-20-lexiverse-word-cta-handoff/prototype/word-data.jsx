// word-data.jsx — sample DictionaryWord, mirrors the real shape used by the page.

const SAMPLE_WORD = {
  id: 'resilient',
  word: 'resilient',
  phoneticIpa: '/rɪˈzɪliənt/',
  partOfSpeech: 'adj.',
  glossZh: '有韧性的 · 能迅速复原的',
  cefrLevel: 'B2',
  examTags: ['CET-6', 'IELTS', '考研'],
  themeTags: ['Character', 'Growth'],
  domainTags: ['Psychology'],
  definitionEn: 'Able to recover quickly from difficulty, setbacks, or change; tough and adaptable.',
  definitionZh: '能从困境、挫折或变化中迅速恢复的；有韧性的、适应力强的。',
  exampleEn: 'A resilient economy can absorb shocks and bounce back faster than its rivals.',
  exampleZh: '有韧性的经济体能吸收冲击，比对手更快地复苏。',
  synonyms: ['tough', 'hardy', 'adaptable', 'buoyant'],
  antonyms: ['fragile', 'brittle', 'vulnerable'],
  collocations: ['resilient economy', 'emotionally resilient', 'resilient material'],
  // galaxy context (breadcrumb + same-galaxy chips)
  galaxyTitle: 'Mind & Character · 心智星系',
  constellationTitle: 'Humanities 星座',
  galaxyWords: ['adaptable', 'persevere', 'tenacity', 'cope', 'endure', 'fortitude', 'setback', 'bounce back', 'grit', 'thrive', 'withstand', 'recover'],
  // learning state for the headword badge
  learningState: 'learning',
};

const STATE_COLOR = {
  mastered: '#7EF9FF', recommended: '#FFD66B', learning: '#38BDF8',
  review: '#FFA85A', weak: '#FF8FA8', unknown: '#9FB6C6', locked: '#52617A',
};

Object.assign(window, { SAMPLE_WORD, STATE_COLOR });
