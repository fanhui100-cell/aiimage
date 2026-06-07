/* ─────────────────────────────────────────────────────────────────────────
   LexiGraph prototype data layer
   Mirrors the real repo:
     · lib/lexigraph/lexigraph-colors.ts   (EDGE_COLORS / NODE_FILL / NODE_STROKE / STATE_RING)
     · lib/lexigraph/lexigraph-layout.ts   (deterministic radial layout)
     · lib/lexigraph/lexigraph-data-mapper.ts (buildLexiGraphModel)
   Words are the project's own Phase 6B original educational seed content.
   ───────────────────────────────────────────────────────────────────────── */

// ── Color tokens (verbatim from lexigraph-colors.ts) ───────────────────────
const EDGE_COLORS = {
  synonym: '#34D399', antonym: '#F87171', collocation: '#38BDF8',
  etymology: '#FBBF24', scene: '#2DD4BF', exam: '#A78BFA', example: '#6B7FA3',
};
const NODE_FILL = {
  core: 'rgba(14,165,233,0.18)', synonym: 'rgba(52,211,153,0.12)',
  antonym: 'rgba(248,113,113,0.12)', collocation: 'rgba(56,189,248,0.10)',
  etymology: 'rgba(251,191,36,0.10)', scene: 'rgba(45,212,191,0.10)',
  exam: 'rgba(167,139,250,0.10)', example: 'rgba(107,127,163,0.10)',
};
const NODE_STROKE = {
  core: '#38BDF8', synonym: '#34D399', antonym: '#F87171', collocation: '#38BDF8',
  etymology: '#FBBF24', scene: '#2DD4BF', exam: '#A78BFA', example: '#6B7FA3',
};
const STATE_RING = {
  unknown: 'transparent', learning: '#38BDF8', review: '#FB923C',
  mastered: '#34D399', weak: '#F87171', recommended: '#FBBF24',
};

// ── Seed entries (project's own original content, seed shape) ──────────────
const SN = 'Original educational seed content created for LexiOcean Phase 6B.';
const SEED_RAW = [
  {
    id: 'accept', word: 'accept', ipa: '/əkˈsɛpt/', pos: 'verb', cefr: 'A2', difficulty: 1,
    core: true, exam: false, examTags: [], tags: ['basic', 'social'],
    def: 'to willingly take or receive something that is offered or given', defZh: '接受；接纳',
    ex: 'She decided to accept the invitation to join the team.', exZh: '她决定接受加入团队的邀请。',
    synonyms: ['receive', 'take', 'agree'], antonyms: ['reject', 'refuse', 'decline'],
    collos: [
      { phrase: 'accept an offer', ex: 'He accepted the job offer without hesitation.', exZh: '他毫不犹豫地接受了工作邀请。' },
      { phrase: 'accept responsibility', ex: 'We must accept responsibility for our choices.', exZh: '我们必须对自己的选择负责。' },
    ],
    scenes: [{ en: 'Job interview', zh: '求职面试' }],
    mnem: null, mnemZh: null, etym: 'From Latin "ac-" (toward) + "capere" (to take); to take toward oneself.',
  },
  {
    id: 'receive', word: 'receive', ipa: '/rɪˈsiːv/', pos: 'verb', cefr: 'A2', difficulty: 1,
    core: true, exam: false, examTags: [], tags: ['basic'],
    def: 'to get or be given something', defZh: '收到；接收',
    ex: 'You will receive a confirmation email after you sign up.', exZh: '注册后你会收到一封确认邮件。',
    synonyms: ['get', 'accept', 'obtain'], antonyms: ['send', 'give'],
    collos: [{ phrase: 'receive a gift', ex: 'It is nice to receive a gift on your birthday.', exZh: '生日时收到礼物很开心。' }],
    scenes: [], mnem: null, mnemZh: null, etym: 'From Latin "recipere" meaning to take back.',
  },
  {
    id: 'reject', word: 'reject', ipa: '/rɪˈdʒɛkt/', pos: 'verb', cefr: 'B1', difficulty: 2,
    core: true, exam: true, examTags: ['IELTS'], tags: ['decision'],
    def: 'to refuse to accept, agree to, or believe in something', defZh: '拒绝；否决',
    ex: 'The committee may reject any proposal that lacks clear evidence.', exZh: '委员会可能否决任何缺乏明确证据的提案。',
    synonyms: ['refuse', 'decline', 'deny'], antonyms: ['accept', 'approve'],
    collos: [{ phrase: 'reject a proposal', ex: 'They voted to reject the proposal.', exZh: '他们投票否决了这项提案。' }],
    scenes: [], mnem: null, mnemZh: null, etym: 'From Latin "re-" (back) + "iacere" (to throw); to throw back.',
  },
  {
    id: 'achieve', word: 'achieve', ipa: '/əˈtʃiːv/', pos: 'verb', cefr: 'A2', difficulty: 1,
    core: true, exam: false, examTags: [], tags: ['basic', 'goal'],
    def: 'to successfully reach a goal through hard work and effort', defZh: '实现；取得（成就）',
    ex: 'With daily practice, you can achieve your language goals.', exZh: '通过每日练习，你可以实现你的语言目标。',
    synonyms: ['accomplish', 'attain', 'reach'], antonyms: ['fail', 'miss'],
    collos: [{ phrase: 'achieve a goal', ex: 'She worked hard to achieve her goal.', exZh: '她努力实现了自己的目标。' }],
    scenes: [{ en: 'Goal setting', zh: '目标设定' }],
    mnem: 'A CHIEF always achieves — the chief works hard and gets results.', mnemZh: '首领（chief）总是能实现（achieve）目标。', etym: null,
  },
  {
    id: 'communicate', word: 'communicate', ipa: '/kəˈmjuːnɪkeɪt/', pos: 'verb', cefr: 'A2', difficulty: 2,
    core: true, exam: false, examTags: [], tags: ['basic', 'language'],
    def: 'to share information, ideas, or feelings with others through speaking, writing, or other means', defZh: '交流；沟通；传达',
    ex: 'Learning English helps you communicate with people from around the world.', exZh: '学习英语帮助你与世界各地的人交流。',
    synonyms: ['express', 'convey', 'inform'], antonyms: [],
    collos: [{ phrase: 'communicate clearly', ex: 'Good writers communicate clearly and directly.', exZh: '优秀的写手表达清晰、直接。' }],
    scenes: [{ en: 'Team meeting', zh: '团队会议' }],
    mnem: 'COMMUN-ICATE: "commune" means to share — communicate brings people into a common space.', mnemZh: 'commun- 是 community（社区）的词根，communicate 就是让人们连接在一起。',
    etym: 'From Latin "communicare" meaning to share or make common.',
  },
  {
    id: 'create', word: 'create', ipa: '/kriˈeɪt/', pos: 'verb', cefr: 'A2', difficulty: 1,
    core: true, exam: false, examTags: [], tags: ['basic', 'creativity'],
    def: 'to make or produce something new that did not exist before', defZh: '创造；创建',
    ex: 'Children love to create colorful paintings in art class.', exZh: '孩子们喜欢在美术课上创作色彩丰富的画作。',
    synonyms: ['make', 'build', 'produce'], antonyms: ['destroy', 'demolish'],
    collos: [{ phrase: 'create an opportunity', ex: 'Hard work can create new opportunities.', exZh: '努力工作能创造新机会。' }],
    scenes: [], mnem: null, mnemZh: null, etym: 'From Latin "creare" meaning to make or produce.',
  },
  {
    id: 'discover', word: 'discover', ipa: '/dɪˈskʌvər/', pos: 'verb', cefr: 'A2', difficulty: 1,
    core: true, exam: false, examTags: [], tags: ['basic', 'learning'],
    def: 'to find or learn about something for the first time', defZh: '发现；找到',
    ex: 'She was excited to discover a new word she had never seen before.', exZh: '她很兴奋地发现了一个她以前从未见过的新单词。',
    synonyms: ['find', 'uncover', 'detect'], antonyms: ['hide', 'lose'],
    collos: [{ phrase: 'discover a talent', ex: 'He discovered a talent for languages at school.', exZh: '他在学校发现了自己的语言天赋。' }],
    scenes: [], mnem: null, mnemZh: null, etym: 'From Latin "dis-" (away) + "cooperire" (to cover); literally to uncover.',
  },
  {
    id: 'demonstrate', word: 'demonstrate', ipa: '/ˈdɛmənstreɪt/', pos: 'verb', cefr: 'B1', difficulty: 3,
    core: true, exam: true, examTags: ['IELTS', 'TOEFL'], tags: ['academic', 'teaching'],
    def: 'to show clearly how something works or how to do something', defZh: '展示；证明；示范',
    ex: 'The teacher will demonstrate the correct way to pronounce the sounds.', exZh: '老师将示范正确的发音方法。',
    synonyms: ['show', 'prove', 'illustrate'], antonyms: [],
    collos: [{ phrase: 'demonstrate a skill', ex: 'She demonstrated her skill by solving the problem quickly.', exZh: '她通过快速解决问题展示了她的技能。' }],
    scenes: [{ en: 'Academic lecture', zh: '学术讲座' }],
    mnem: null, mnemZh: null, etym: 'From Latin "demonstrare" meaning to point out clearly.',
  },
  {
    id: 'effective', word: 'effective', ipa: '/ɪˈfɛktɪv/', pos: 'adjective', cefr: 'B1', difficulty: 2,
    core: true, exam: true, examTags: ['IELTS', 'TOEFL'], tags: ['academic', 'quality'],
    def: 'producing the result that you wanted; working well', defZh: '有效的；有效率的',
    ex: 'Spaced repetition is one of the most effective methods for remembering new vocabulary.', exZh: '间隔重复是记忆新词汇最有效的方法之一。',
    synonyms: ['successful', 'productive', 'efficient'], antonyms: ['ineffective', 'useless', 'weak'],
    collos: [{ phrase: 'effective communication', ex: 'Effective communication requires both speaking and listening skills.', exZh: '有效沟通需要口语和听力两方面的技能。' }],
    scenes: [], mnem: null, mnemZh: null, etym: 'From Latin "effectivus" meaning productive or efficient.',
  },
  {
    id: 'contribute', word: 'contribute', ipa: '/kənˈtrɪbjuːt/', pos: 'verb', cefr: 'B1', difficulty: 2,
    core: true, exam: true, examTags: ['IELTS'], tags: ['social', 'academic'],
    def: 'to give something such as money, time, or effort to help achieve a common goal', defZh: '贡献；提供；撰写',
    ex: 'Every student was asked to contribute one new word to the class vocabulary wall.', exZh: '每位学生被要求向班级词汇墙贡献一个新单词。',
    synonyms: ['give', 'provide', 'add'], antonyms: ['take', 'withhold'],
    collos: [{ phrase: 'contribute to society', ex: 'Volunteers contribute to society in many valuable ways.', exZh: '志愿者以许多有价值的方式为社会做出贡献。' }],
    scenes: [{ en: 'Group project', zh: '小组项目' }],
    mnem: null, mnemZh: null, etym: 'From Latin "con-" (together) + "tribuere" (to give).',
  },
  {
    id: 'abstract', word: 'abstract', ipa: '/ˈæbstrækt/', pos: 'adjective', cefr: 'C1', difficulty: 4,
    core: false, exam: true, examTags: ['GRE', 'SAT'], tags: ['academic', 'philosophy'],
    def: 'existing as an idea rather than as a physical thing; difficult to understand or describe', defZh: '抽象的；难以理解的',
    ex: 'Concepts like justice and freedom are abstract but deeply important.', exZh: '"正义"和"自由"等概念是抽象的，但极其重要。',
    synonyms: ['theoretical', 'conceptual', 'vague'], antonyms: ['concrete', 'tangible', 'real'],
    collos: [{ phrase: 'abstract concept', ex: 'Time is an abstract concept that humans experience differently.', exZh: '时间是一个人类有不同体验的抽象概念。' }],
    scenes: [{ en: 'Philosophy seminar', zh: '哲学研讨' }],
    mnem: 'AB-STRACT: things ABSTRACT from the world are TAKEN AWAY (ab = away, tract = draw); they can\u2019t be touched.', mnemZh: 'abstract = ab（离开）+ tract（拉）= 被从现实中"拉离"，因此是抽象的。',
    etym: 'From Latin "abstractus" meaning drawn away or separated.',
  },
];

// ── Adapt seed-shape → DictionaryWord-shape (mirrors repo dictionary adapter)
function adapt(e) {
  let etymology = null;
  if (e.etym) {
    // Pull a short root token for the etymology graph node label.
    const m = e.etym.match(/Latin "([^"]+)"/i) || e.etym.match(/"([^"]+)"/);
    const roots = m ? 'L. ' + m[1].split(' ')[0] : e.etym.slice(0, 14);
    etymology = { roots, explanationEn: e.etym, explanationZh: '' };
  }
  return {
    id: e.id, word: e.word, phoneticIpa: e.ipa, partOfSpeech: e.pos,
    cefrLevel: e.cefr, difficulty: e.difficulty, isCore: e.core, isExamWord: e.exam,
    examTags: e.examTags || [],
    definitions: [{ definitionEn: e.def, definitionZh: e.defZh }],
    examples: [{ sentenceEn: e.ex, sentenceZh: e.exZh }],
    synonyms: e.synonyms || [], antonyms: e.antonyms || [],
    collocations: (e.collos || []).map((c) => ({ phrase: c.phrase, exampleEn: c.ex, exampleZh: c.exZh })),
    etymology,
    mnemonics: e.mnem ? [{ style: 'standard', mnemonicEn: e.mnem, mnemonicZh: e.mnemZh }] : [],
    sceneUsages: (e.scenes || []).map((s) => ({ sceneEn: s.en, sceneZh: s.zh })),
    sourceType: 'original', sourceNote: SN,
  };
}

const SEED = SEED_RAW.map(adapt);
const SEED_BY_ID = Object.fromEntries(SEED.map((w) => [w.id, w]));

function lookupWord(slug) {
  if (!slug) return null;
  const key = slug.toLowerCase().trim().replace(/\s+/g, '-');
  return SEED_BY_ID[key] || null;
}

// ── Deterministic radial layout (verbatim math from lexigraph-layout.ts) ───
const CX = 380, CY = 300, LAYER1_RADIUS = 148, LAYER2_RADIUS = 256;
const LAYER1_TYPES = ['synonym', 'antonym', 'collocation'];
const LAYER2_TYPES = ['etymology', 'scene', 'exam', 'example'];

function assignLayout(nodes) {
  const core = nodes.find((n) => n.type === 'core');
  const layer1 = nodes.filter((n) => LAYER1_TYPES.includes(n.type));
  const layer2 = nodes.filter((n) => LAYER2_TYPES.includes(n.type));
  const result = [];
  if (core) result.push({ ...core, x: CX, y: CY });
  layer1.forEach((n, i) => {
    const a = (i / Math.max(layer1.length, 1)) * 2 * Math.PI - Math.PI / 2;
    result.push({ ...n, x: Math.round(CX + LAYER1_RADIUS * Math.cos(a)), y: Math.round(CY + LAYER1_RADIUS * Math.sin(a)) });
  });
  layer2.forEach((n, i) => {
    const a = (i / Math.max(layer2.length, 1)) * 2 * Math.PI - Math.PI / 2 + Math.PI / 8;
    result.push({ ...n, x: Math.round(CX + LAYER2_RADIUS * Math.cos(a)), y: Math.round(CY + LAYER2_RADIUS * Math.sin(a)) });
  });
  return result;
}

// ── State resolution (mirrors lexigraph-state-mapper.ts intent) ────────────
function resolveNodeState(id, slices) {
  if (slices.litWords?.includes(id) && slices.reviewIds?.includes(id)) return 'review';
  if (slices.reviewIds?.includes(id)) return 'review';
  if (slices.weakIds?.includes(id)) return 'weak';
  if (slices.masteredIds?.includes(id)) return 'mastered';
  if (slices.savedIds?.includes(id)) return 'learning';
  if (slices.litWords?.includes(id)) return 'learning';
  return 'unknown';
}

// ── buildLexiGraphModel (mirrors lexigraph-data-mapper.ts) ──────────────────
const MAX_SYN = 4, MAX_ANT = 3, MAX_COL = 4, MAX_NODES = 28;
const trunc = (t, max = 14) => (t.length > max ? t.slice(0, max - 1) + '…' : t);
const slugify = (t) => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

function buildModel(word, slices) {
  const warnings = [], nodes = [], edges = [];
  const coreId = word.id;
  nodes.push({ id: coreId, word: coreId, label: word.word, type: 'core', state: resolveNodeState(coreId, slices), size: 26, sourceWord: coreId });

  function addNode(id, wordSlug, label, type, relation, strength, size = 16) {
    const state = (type === 'synonym' || type === 'antonym') ? resolveNodeState(wordSlug, slices) : 'unknown';
    nodes.push({ id, word: wordSlug, label, type, state, size, sourceWord: coreId });
    edges.push({ id: `e-${coreId}-${id}`, source: coreId, target: id, relation, strength });
  }

  if (word.synonyms.length === 0) warnings.push('No synonyms.');
  word.synonyms.slice(0, MAX_SYN).forEach((s, i) => addNode(`syn-${i}`, slugify(s), trunc(s), 'synonym', 'synonym', 1.0, 18));
  word.antonyms.slice(0, MAX_ANT).forEach((a, i) => addNode(`ant-${i}`, slugify(a), trunc(a), 'antonym', 'antonym', 1.0, 18));
  word.collocations.slice(0, MAX_COL).forEach((c, i) => addNode(`col-${i}`, c.phrase, trunc(c.phrase, 16), 'collocation', 'collocation', 0.7, 15));
  if (word.etymology?.roots) addNode('etym-0', word.etymology.roots, trunc(word.etymology.roots, 14), 'etymology', 'etymology', 0.5, 14);
  if (word.sceneUsages.length > 0) {
    const sc = word.sceneUsages[0].sceneEn || word.sceneUsages[0].sceneZh || 'Scene';
    addNode('scene-0', sc, trunc(sc, 14), 'scene', 'scene', 0.5, 14);
  }
  if (word.isExamWord && word.examTags.length > 0) addNode(`exam-${word.examTags[0]}`, word.examTags[0], word.examTags[0], 'exam', 'exam', 0.5, 14);

  const capped = nodes.length > MAX_NODES ? [nodes[0], ...nodes.slice(1, MAX_NODES)] : nodes;
  const keptIds = new Set(capped.map((n) => n.id));
  const keptEdges = edges.filter((e) => keptIds.has(e.target));
  return { centerWord: coreId, centerDetail: word, nodes: assignLayout(capped), edges: keptEdges, sourceType: 'seed', warnings };
}

window.LexiData = {
  EDGE_COLORS, NODE_FILL, NODE_STROKE, STATE_RING,
  SEED, SEED_BY_ID, lookupWord, buildModel, slugify,
  NON_WORD_TYPES: new Set(['collocation', 'etymology', 'scene', 'exam', 'example']),
};
