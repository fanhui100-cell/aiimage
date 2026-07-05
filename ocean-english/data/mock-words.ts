import type { Word } from '@/types/word'

export const mockWords: Word[] = [
  {
    id: 'ubiquitous',
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    level: 'advanced',
    difficulty: 4,
    tags: ['GRE', 'TOEFL', 'academic'],
    examFrequency: ['TOEFL', 'IELTS', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Present, appearing, or found everywhere.',
        meaningZh: '无处不在的；普遍存在的。',
        example: 'Smartphones have become ubiquitous in modern society.',
        exampleZh: '智能手机在现代社会已无处不在。',
      },
    ],
    etymology: {
      roots: 'Latin ubique "everywhere" + -ous',
      explanation: 'From Latin ubique meaning "everywhere", from ubi "where" + -que "and".',
      explanationZh: '源自拉丁语 ubique，意为"到处"，由 ubi（在哪里）与 -que（以及）构成。',
    },
    mnemonic: "U + BIG + QUIT + OUS — You can't quit it because it's everywhere!",
    mnemonicZh: '谐音"优比克维特"——优秀的东西自然无处不在。',
    mnemonicEvil: 'Imagine WiFi signals everywhere — U Big Quit? OUS! You simply cannot escape it.',
    mnemonicEvilZh: '想象 WiFi 信号无处不在——你根本逃不掉，就像这个单词的含义。',
    synonyms: ['omnipresent', 'pervasive', 'universal', 'widespread'],
    antonyms: ['rare', 'scarce', 'absent'],
    collocations: [
      { phrase: 'ubiquitous presence', example: 'The ubiquitous presence of social media affects daily life.', exampleZh: '社交媒体无处不在的存在影响着日常生活。' },
      { phrase: 'become ubiquitous', example: 'Electric vehicles are becoming ubiquitous on city roads.', exampleZh: '电动汽车正在城市道路上变得无处不在。' },
    ],
    sceneUsage: [
      { scene: 'Academic writing', sceneZh: '学术写作', example: 'The author argues that surveillance technology has become ubiquitous in urban environments.', exampleZh: '作者认为监控技术在城市环境中已经无处不在。' },
      { scene: 'Casual conversation', sceneZh: '日常对话', example: 'Coffee shops are ubiquitous in this city.', exampleZh: '这座城市里咖啡馆随处可见。' },
    ],
  },
  {
    id: 'ephemeral',
    word: 'ephemeral',
    phonetic: '/ɪˈfemərəl/',
    level: 'advanced',
    difficulty: 4,
    tags: ['GRE', 'literary', 'IELTS'],
    examFrequency: ['TOEFL', 'IELTS', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Lasting for a very short time.',
        meaningZh: '短暂的；瞬间即逝的。',
        example: 'The beauty of cherry blossoms is ephemeral.',
        exampleZh: '樱花的美丽是短暂的。',
      },
    ],
    etymology: {
      roots: 'Greek ephemeros (epi- "on" + hemera "day")',
      explanation: 'From Greek ephemeros, literally "lasting only a day".',
      explanationZh: '源自希腊语 ephemeros，字面意思是"仅持续一天"。',
    },
    mnemonic: 'e-PHEMER-al — Think of a fever that burns bright and passes quickly.',
    mnemonicZh: '谐音"一飞没了"——飞起来就没了，形容短暂。',
    mnemonicEvil: 'Your ex was ephemeral — seemed eternal but gone in a flash.',
    mnemonicEvilZh: '前任是短暂的——感觉永恒却转瞬即逝，就像这个词的意思。',
    synonyms: ['transient', 'fleeting', 'momentary', 'transitory', 'evanescent'],
    antonyms: ['eternal', 'permanent', 'enduring', 'everlasting'],
    collocations: [
      { phrase: 'ephemeral beauty', example: 'The ephemeral beauty of autumn leaves draws tourists every year.', exampleZh: '秋叶短暂的美丽每年都吸引大批游客。' },
      { phrase: 'ephemeral nature', example: 'The ephemeral nature of fame is well documented in history.', exampleZh: '名声的短暂本质在历史上有充分记录。' },
    ],
    sceneUsage: [
      { scene: 'Philosophy', sceneZh: '哲学', example: 'Human existence is ephemeral against the backdrop of geological time.', exampleZh: '与地质时间相比，人类的存在是短暂的。' },
    ],
  },
  {
    id: 'resilient',
    word: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'IELTS', 'psychology'],
    examFrequency: ['CET-6', 'IELTS', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Able to withstand or recover quickly from difficult conditions.',
        meaningZh: '有弹性的；能快速从困难中恢复的。',
        example: 'Children are often more resilient than adults give them credit for.',
        exampleZh: '孩子往往比大人认为的更有韧性。',
      },
    ],
    etymology: {
      roots: 'Latin resilire "to leap back" (re- + salire "to jump")',
      explanation: 'From Latin resilire, meaning "to spring back".',
      explanationZh: '源自拉丁语 resilire，意为"弹回"。',
    },
    mnemonic: 'RE-SILI-ENT — Like a rubber band, it re-sili-ently bounces back.',
    mnemonicZh: '谐音"如硅恩体"——硅橡胶有弹性，象征韧性。',
    synonyms: ['tough', 'adaptable', 'sturdy', 'flexible', 'durable'],
    antonyms: ['fragile', 'brittle', 'weak', 'vulnerable'],
    collocations: [
      { phrase: 'resilient economy', example: 'The resilient economy recovered faster than expected.', exampleZh: '韧性经济复苏速度超过预期。' },
      { phrase: 'prove resilient', example: 'Small businesses proved resilient during the pandemic.', exampleZh: '小企业在疫情期间展现出韧性。' },
    ],
    sceneUsage: [
      { scene: 'Business', sceneZh: '商业', example: 'A resilient supply chain can adapt to unexpected disruptions.', exampleZh: '具有韧性的供应链能够适应意外中断。' },
    ],
  },
  {
    id: 'ambiguous',
    word: 'ambiguous',
    phonetic: '/æmˈbɪɡjuəs/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'academic', 'TOEFL'],
    examFrequency: ['CET-6', 'TOEFL', 'IELTS'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Open to more than one interpretation; not having one obvious meaning.',
        meaningZh: '模棱两可的；含义不清的。',
        example: 'The contract contained several ambiguous clauses.',
        exampleZh: '合同中包含几处模棱两可的条款。',
      },
    ],
    etymology: {
      roots: 'Latin ambiguus (ambi- "both" + agere "to drive")',
      explanation: 'From Latin ambiguus, meaning "doubtful, shifting", from ambi- (both ways) + agere (to drive).',
      explanationZh: '源自拉丁语 ambiguus，由 ambi-（两个方向）和 agere（驱动）构成。',
    },
    mnemonic: 'AMBIguous — AMBIvalent — "ambi" means both ways, so meaning goes both ways.',
    mnemonicZh: '"ambi" = 两个方向，含义两边摇摆，模棱两可。',
    synonyms: ['vague', 'unclear', 'equivocal', 'obscure', 'indefinite'],
    antonyms: ['clear', 'unambiguous', 'definite', 'explicit'],
    collocations: [
      { phrase: 'ambiguous statement', example: 'His ambiguous statement left everyone confused.', exampleZh: '他模棱两可的陈述让所有人感到困惑。' },
      { phrase: 'morally ambiguous', example: 'The film\'s protagonist is a morally ambiguous character.', exampleZh: '影片主角是一个道德上模棱两可的人物。' },
    ],
    sceneUsage: [
      { scene: 'Legal', sceneZh: '法律', example: 'Ambiguous language in contracts often leads to disputes.', exampleZh: '合同中模糊的措辞往往会导致纠纷。' },
    ],
  },
  {
    id: 'meticulous',
    word: 'meticulous',
    phonetic: '/məˈtɪkjʊləs/',
    level: 'advanced',
    difficulty: 4,
    tags: ['CET-6', 'TOEFL', 'academic'],
    examFrequency: ['CET-6', 'TOEFL', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Showing great attention to detail; very careful and precise.',
        meaningZh: '一丝不苟的；极其仔细的。',
        example: "The meticulous craftsman spent hours perfecting each detail.",
        exampleZh: '这位一丝不苟的工匠花了几个小时完善每一个细节。',
      },
    ],
    etymology: {
      roots: 'Latin meticulosus "fearful, timid" (metus "fear" + -osus)',
      explanation: 'Originally meant "overly fearful", evolved to mean "excessively careful about detail".',
      explanationZh: '原意为"过于恐惧"，演变为"对细节过分谨慎"。',
    },
    mnemonic: 'METI-CULOUS — Imagine measuring (meti) every little detail with a ruler.',
    mnemonicZh: '联想"每一刻"都要检查——一丝不苟，每刻不忘细节。',
    synonyms: ['precise', 'thorough', 'scrupulous', 'painstaking', 'fastidious'],
    antonyms: ['careless', 'sloppy', 'negligent', 'hasty'],
    collocations: [
      { phrase: 'meticulous attention', example: 'She paid meticulous attention to the financial reports.', exampleZh: '她对财务报告一丝不苟地进行审查。' },
      { phrase: 'meticulous planning', example: 'The event required meticulous planning over six months.', exampleZh: '这次活动需要六个月的精心策划。' },
    ],
    sceneUsage: [
      { scene: 'Professional', sceneZh: '职业场合', example: 'A meticulous approach to data analysis is essential in research.', exampleZh: '研究中对数据分析一丝不苟的态度至关重要。' },
    ],
  },
  {
    id: 'eloquent',
    word: 'eloquent',
    phonetic: '/ˈɛləkwənt/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['IELTS', 'academic', 'literature'],
    examFrequency: ['IELTS', 'TOEFL', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Fluent or persuasive in speaking or writing.',
        meaningZh: '口才流利的；有说服力的；雄辩的。',
        example: 'Her eloquent speech moved the entire audience to tears.',
        exampleZh: '她雄辩的演讲让整个观众感动落泪。',
      },
    ],
    etymology: {
      roots: 'Latin eloquens (e- "out" + loqui "to speak")',
      explanation: 'From Latin eloquens, present participle of eloqui, meaning "to speak out".',
      explanationZh: '源自拉丁语 eloquens，为 eloqui（大声说出）的现在分词形式。',
    },
    mnemonic: 'ELO-QUENT — ELO (music) + QUENT (frequent) — frequently making beautiful sounds.',
    mnemonicZh: '谐音"伊落葵"——开口如葵花盛开，优美流利。',
    synonyms: ['articulate', 'fluent', 'persuasive', 'expressive', 'silver-tongued'],
    antonyms: ['inarticulate', 'tongue-tied', 'incoherent'],
    collocations: [
      { phrase: 'eloquent speaker', example: 'He is known as an eloquent speaker on environmental issues.', exampleZh: '他以在环保问题上能言善辩而闻名。' },
      { phrase: 'eloquent silence', example: 'Sometimes eloquent silence says more than words.', exampleZh: '有时候雄辩的沉默比言语更有力量。' },
    ],
    sceneUsage: [
      { scene: 'Public speaking', sceneZh: '公开演讲', example: 'An eloquent argument relies on both logic and emotion.', exampleZh: '一篇有说服力的论证需要兼顾逻辑和情感。' },
    ],
  },
  {
    id: 'pragmatic',
    word: 'pragmatic',
    phonetic: '/præɡˈmætɪk/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'business', 'IELTS'],
    examFrequency: ['CET-6', 'IELTS', 'TOEFL'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Dealing with things sensibly and realistically; focused on practical outcomes.',
        meaningZh: '务实的；注重实效的。',
        example: 'We need a pragmatic approach to solving the budget crisis.',
        exampleZh: '我们需要一种务实的方法来解决预算危机。',
      },
    ],
    etymology: {
      roots: 'Greek pragmatikos (pragma "deed, act" from prattein "to do")',
      explanation: 'From Greek pragma, meaning "a deed, act", related to prattein "to do, act".',
      explanationZh: '源自希腊语 pragma（行动、事情），与 prattein（做、行动）相关。',
    },
    mnemonic: 'PRAGMA-TIC — "pragma" sounds like "program" — a practical program for getting things done.',
    mnemonicZh: '"pragma" 听起来像"规划"——脚踏实地地规划，务实行事。',
    synonyms: ['practical', 'realistic', 'sensible', 'utilitarian', 'matter-of-fact'],
    antonyms: ['idealistic', 'impractical', 'unrealistic', 'theoretical'],
    collocations: [
      { phrase: 'pragmatic solution', example: 'The committee offered a pragmatic solution to the housing shortage.', exampleZh: '委员会对住房短缺提出了务实的解决方案。' },
    ],
    sceneUsage: [
      { scene: 'Business', sceneZh: '商业', example: 'A pragmatic leader focuses on achievable goals.', exampleZh: '务实的领导者专注于可实现的目标。' },
    ],
  },
  {
    id: 'tenacious',
    word: 'tenacious',
    phonetic: '/tɪˈneɪʃəs/',
    level: 'advanced',
    difficulty: 4,
    tags: ['GRE', 'TOEFL', 'KAOYAN'],
    examFrequency: ['TOEFL', 'KAOYAN', 'IELTS'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Tending to keep a firm hold; persistent and determined.',
        meaningZh: '坚韧不拔的；锲而不舍的。',
        example: 'Her tenacious pursuit of justice inspired the whole community.',
        exampleZh: '她对公正锲而不舍的追求激励了整个社区。',
      },
    ],
    etymology: {
      roots: 'Latin tenax (tenere "to hold")',
      explanation: 'From Latin tenax, meaning "holding fast", from tenere "to hold".',
      explanationZh: '源自拉丁语 tenax，意为"紧紧抓住"，源于 tenere（握住）。',
    },
    mnemonic: 'TEN-ACIOUS — TEN fingers gripping with ACI-d determination.',
    mnemonicZh: '十指紧握（TEN 指十根手指）——坚韧不拔，紧抓不放。',
    synonyms: ['persistent', 'determined', 'resolute', 'steadfast', 'dogged'],
    antonyms: ['irresolute', 'weak-willed', 'fickle', 'yielding'],
    collocations: [
      { phrase: 'tenacious grip', example: 'The climber maintained a tenacious grip on the rock face.', exampleZh: '攀登者紧紧抓住岩面，不肯松手。' },
    ],
    sceneUsage: [
      { scene: 'Sports commentary', sceneZh: '体育解说', example: 'A tenacious defender who never gives up.', exampleZh: '一位锲而不舍、永不放弃的防守球员。' },
    ],
  },
  {
    id: 'ambivalent',
    word: 'ambivalent',
    phonetic: '/æmˈbɪvələnt/',
    level: 'advanced',
    difficulty: 4,
    tags: ['GRE', 'psychology', 'TOEFL'],
    examFrequency: ['TOEFL', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Having mixed or contradictory feelings about something.',
        meaningZh: '矛盾的；既爱又恨的；态度不明朗的。',
        example: 'She felt ambivalent about leaving her hometown for the new job.',
        exampleZh: '她对离开家乡去做新工作感到矛盾。',
      },
    ],
    etymology: {
      roots: 'Latin ambi- "both" + valens "having power"',
      explanation: 'From ambi- (both) + valent (having strength) — pulled in both directions with equal force.',
      explanationZh: '由 ambi-（两者）和 valent（有力量）组成——被两个方向同等强度地拉扯。',
    },
    mnemonic: 'AMBI-VALENT — AMBIdextrous can use BOTH hands — ambivalent feels BOTH ways.',
    mnemonicZh: '"ambi" = 两者——对一件事有两种相反的感受，举棋不定。',
    synonyms: ['conflicted', 'undecided', 'torn', 'uncertain', 'equivocal'],
    antonyms: ['certain', 'decisive', 'unequivocal', 'clear-cut'],
    collocations: [
      { phrase: 'feel ambivalent about', example: 'Many voters feel ambivalent about the new policy.', exampleZh: '许多选民对新政策态度矛盾。' },
    ],
    sceneUsage: [
      { scene: 'Psychology', sceneZh: '心理学', example: 'Ambivalent attachment styles can affect adult relationships.', exampleZh: '矛盾型依恋风格会影响成年人的关系。' },
    ],
  },
  {
    id: 'scrutinize',
    word: 'scrutinize',
    phonetic: '/ˈskruːtɪnaɪz/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'TOEFL', 'academic'],
    examFrequency: ['CET-6', 'TOEFL', 'IELTS'],
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: 'Examine or inspect closely and thoroughly.',
        meaningZh: '仔细检查；审视；细看。',
        example: 'The accountant scrutinized every line of the financial report.',
        exampleZh: '会计仔细审查了财务报告的每一行。',
      },
    ],
    etymology: {
      roots: 'Latin scrutari "to search carefully" (scruta "trash, rags")',
      explanation: 'Originally meant searching through trash (scruta) to find valuables — careful, thorough searching.',
      explanationZh: '原意是翻找垃圾（scruta）寻找有价值的东西，引申为仔细搜查。',
    },
    mnemonic: 'SCRUT-INIZE — SCRU-tinize like a CREW with a magnifying glass.',
    mnemonicZh: '"scrutinize" 谐音"死看了"——死死地盯着看，仔细检查。',
    synonyms: ['examine', 'inspect', 'analyze', 'study', 'investigate'],
    antonyms: ['ignore', 'overlook', 'glance'],
    collocations: [
      { phrase: 'scrutinize carefully', example: 'Investors scrutinize earnings reports carefully each quarter.', exampleZh: '投资者每季度都会仔细审查收益报告。' },
    ],
    sceneUsage: [
      { scene: 'Academic', sceneZh: '学术', example: 'Researchers scrutinized the data for any anomalies.', exampleZh: '研究人员仔细审查数据，寻找任何异常。' },
    ],
  },
  {
    id: 'unprecedented',
    word: 'unprecedented',
    phonetic: '/ʌnˈpresɪdentɪd/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'news', 'IELTS'],
    examFrequency: ['CET-6', 'IELTS', 'GAOKAO'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Never done or known before.',
        meaningZh: '前所未有的；史无前例的。',
        example: 'The storm caused unprecedented damage to the coastal region.',
        exampleZh: '这场风暴对沿海地区造成了史无前例的破坏。',
      },
    ],
    etymology: {
      roots: 'un- (not) + precedent (something done before)',
      explanation: 'Literally "without a precedent" — no example has come before it.',
      explanationZh: '字面意思是"没有先例"——之前没有同类案例。',
    },
    mnemonic: 'UN-PRECEDE-NTED — PRECEDE means "come before" — UN means "not" — nothing came before.',
    mnemonicZh: '"precedent" = 先例，"un" = 没有——前所未有。',
    synonyms: ['unparalleled', 'unmatched', 'extraordinary', 'novel', 'unique'],
    antonyms: ['ordinary', 'common', 'usual', 'routine'],
    collocations: [
      { phrase: 'unprecedented level', example: 'Unemployment reached an unprecedented level during the crisis.', exampleZh: '危机期间失业率达到了前所未有的水平。' },
    ],
    sceneUsage: [
      { scene: 'News reporting', sceneZh: '新闻报道', example: 'The earthquake was of unprecedented magnitude in that region.', exampleZh: '这次地震的震级在该地区史无前例。' },
    ],
  },
  {
    id: 'diligent',
    word: 'diligent',
    phonetic: '/ˈdɪlɪdʒənt/',
    level: 'elementary',
    difficulty: 2,
    tags: ['CET-4', 'basic', 'GAOKAO'],
    examFrequency: ['CET-4', 'GAOKAO'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Having or showing care and conscientiousness in one\'s work.',
        meaningZh: '勤奋的；刻苦的；认真的。',
        example: 'She was a diligent student who never missed a deadline.',
        exampleZh: '她是一个勤奋的学生，从不错过截止日期。',
      },
    ],
    etymology: {
      roots: 'Latin diligens "attentive, careful" (diligere "to love, to value highly")',
      explanation: 'From Latin diligere, meaning "to love, to value highly" — one who values their work works hard.',
      explanationZh: '源自拉丁语 diligere（珍视、喜爱）——珍视自己工作的人才会努力做。',
    },
    mnemonic: 'DILI-GENT — A GENTLE, DILIGENT person works carefully.',
    mnemonicZh: '"dili" 谐音"努力"——努力勤奋的人。',
    synonyms: ['hardworking', 'industrious', 'assiduous', 'conscientious'],
    antonyms: ['lazy', 'idle', 'negligent', 'careless'],
    collocations: [
      { phrase: 'diligent worker', example: 'She is known as a diligent worker throughout the office.', exampleZh: '她在整个办公室以勤奋工作著称。' },
    ],
    sceneUsage: [
      { scene: 'School', sceneZh: '学校', example: 'Diligent students consistently outperform their peers over time.', exampleZh: '勤奋的学生长期来看总是超越同龄人。' },
    ],
  },
  {
    id: 'alleviate',
    word: 'alleviate',
    phonetic: '/əˈliːvieɪt/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'medical', 'TOEFL'],
    examFrequency: ['CET-6', 'TOEFL', 'KAOYAN'],
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: 'Make suffering, deficiency, or a problem less severe.',
        meaningZh: '减轻；缓和；缓解。',
        example: 'The new medicine helped alleviate the patient\'s chronic pain.',
        exampleZh: '新药帮助减轻了患者的慢性疼痛。',
      },
    ],
    etymology: {
      roots: 'Latin alleviare (ad- "to" + levis "light")',
      explanation: 'From Latin alleviare, meaning "to lighten, relieve", from levis (light in weight).',
      explanationZh: '源自拉丁语 alleviare（减轻），来自 levis（重量轻）。',
    },
    mnemonic: 'ALLE-VIATE — "alleviate" sounds like "all leave it" — let the pain leave.',
    mnemonicZh: '"alleviate" 谐音"阿里离开"——让痛苦"离开"，减轻痛苦。',
    synonyms: ['relieve', 'ease', 'mitigate', 'lessen', 'reduce'],
    antonyms: ['aggravate', 'worsen', 'intensify', 'exacerbate'],
    collocations: [
      { phrase: 'alleviate poverty', example: 'The government introduced programs to alleviate rural poverty.', exampleZh: '政府推出了扶贫项目以减轻农村贫困。' },
    ],
    sceneUsage: [
      { scene: 'Healthcare', sceneZh: '医疗', example: 'Meditation can alleviate symptoms of anxiety and stress.', exampleZh: '冥想可以减轻焦虑和压力的症状。' },
    ],
  },
  {
    id: 'inevitable',
    word: 'inevitable',
    phonetic: '/ɪnˈevɪtəbl/',
    level: 'intermediate',
    difficulty: 2,
    tags: ['CET-4', 'CET-6', 'general'],
    examFrequency: ['CET-4', 'CET-6', 'GAOKAO'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Certain to happen; unavoidable.',
        meaningZh: '不可避免的；必然的。',
        example: 'Conflict seemed inevitable given the two sides\' opposing views.',
        exampleZh: '鉴于双方立场对立，冲突似乎不可避免。',
      },
    ],
    etymology: {
      roots: 'Latin inevitabilis (in- "not" + evitabilis "avoidable")',
      explanation: 'From Latin in- (not) + evitabilis (avoidable), from evitare (to avoid).',
      explanationZh: '源自拉丁语 in-（不）+ evitabilis（可避免的），来自 evitare（避开）。',
    },
    mnemonic: 'IN-EVIT-ABLE — "evit" sounds like "evade" — you cannot evade it.',
    mnemonicZh: '"in" = 不，+ "evit" 像"逃避"——无法逃避，必然发生。',
    synonyms: ['unavoidable', 'certain', 'inescapable', 'definite', 'assured'],
    antonyms: ['avoidable', 'preventable', 'escapable', 'uncertain'],
    collocations: [
      { phrase: 'seem inevitable', example: 'A merger between the two companies seemed inevitable.', exampleZh: '两家公司的合并似乎是不可避免的。' },
    ],
    sceneUsage: [
      { scene: 'Everyday', sceneZh: '日常', example: 'Change is inevitable; how you adapt is what matters.', exampleZh: '变化是不可避免的，重要的是你如何适应。' },
    ],
  },
  {
    id: 'deteriorate',
    word: 'deteriorate',
    phonetic: '/dɪˈtɪəriəreɪt/',
    level: 'advanced',
    difficulty: 4,
    tags: ['CET-6', 'environmental', 'TOEFL'],
    examFrequency: ['CET-6', 'TOEFL', 'IELTS'],
    definitions: [
      {
        partOfSpeech: 'verb',
        meaning: 'Become progressively worse.',
        meaningZh: '恶化；变坏；退化。',
        example: 'Without proper maintenance, the bridge will rapidly deteriorate.',
        exampleZh: '如果没有适当维护，这座桥将迅速恶化。',
      },
    ],
    etymology: {
      roots: 'Latin deteriorare (deterior "worse")',
      explanation: 'From Latin deteriorare, from deterior "lower, inferior, worse".',
      explanationZh: '源自拉丁语 deteriorare，来自 deterior（更糟糕的、更差的）。',
    },
    mnemonic: 'DETER-IORATE — something that DETERs you from using it because it got worse.',
    mnemonicZh: '"deteriorate" 谐音"得他累死"——越来越糟，把人累死，暗示持续恶化。',
    synonyms: ['worsen', 'decline', 'degrade', 'decay', 'erode'],
    antonyms: ['improve', 'recover', 'enhance', 'progress'],
    collocations: [
      { phrase: 'rapidly deteriorate', example: 'Air quality in the city continued to rapidly deteriorate.', exampleZh: '该市的空气质量继续迅速恶化。' },
    ],
    sceneUsage: [
      { scene: 'Environment', sceneZh: '环境', example: 'Climate change causes many ecosystems to deteriorate at alarming rates.', exampleZh: '气候变化导致许多生态系统以令人担忧的速度恶化。' },
    ],
  },
  {
    id: 'conducive',
    word: 'conducive',
    phonetic: '/kənˈdjuːsɪv/',
    level: 'advanced',
    difficulty: 4,
    tags: ['TOEFL', 'academic', 'KAOYAN'],
    examFrequency: ['TOEFL', 'KAOYAN', 'IELTS'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Making a certain situation or outcome likely or possible.',
        meaningZh: '有利于……的；促进……的。',
        example: 'A quiet library is conducive to focused study.',
        exampleZh: '安静的图书馆有利于专注学习。',
      },
    ],
    etymology: {
      roots: 'Latin conducere "to bring together" (con- + ducere "to lead")',
      explanation: 'From Latin conducere, "to lead together", suggesting factors that lead toward an outcome.',
      explanationZh: '源自拉丁语 conducere（引导在一起），暗示推动某一结果的因素。',
    },
    mnemonic: 'CONDU-CIVE — a CONDUCTor (conductor) leads music to SUCCESS — conducive leads to good outcomes.',
    mnemonicZh: '"condu" 联想"引导"——引导向有利结果，有利于……的。',
    synonyms: ['favorable', 'beneficial', 'helpful', 'advantageous', 'productive'],
    antonyms: ['detrimental', 'harmful', 'unfavorable', 'counterproductive'],
    collocations: [
      { phrase: 'conducive to learning', example: 'A warm, supportive classroom is conducive to learning.', exampleZh: '温暖、支持性的课堂环境有利于学习。' },
    ],
    sceneUsage: [
      { scene: 'Education', sceneZh: '教育', example: 'A growth mindset is conducive to long-term academic success.', exampleZh: '成长型思维有利于长期的学业成功。' },
    ],
  },
  {
    id: 'profound',
    word: 'profound',
    phonetic: '/prəˈfaʊnd/',
    level: 'intermediate',
    difficulty: 2,
    tags: ['CET-4', 'literary', 'general'],
    examFrequency: ['CET-4', 'CET-6', 'GAOKAO'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Very great or intense; having deep insight or understanding.',
        meaningZh: '深刻的；深远的；意义深远的。',
        example: 'The experience had a profound impact on her world view.',
        exampleZh: '这段经历对她的世界观产生了深远的影响。',
      },
    ],
    etymology: {
      roots: 'Latin profundus (pro- "before, forward" + fundus "bottom")',
      explanation: 'From Latin profundus, literally "very deep" — going deep to the bottom.',
      explanationZh: '源自拉丁语 profundus，字面意思是"非常深的"——深入到底部。',
    },
    mnemonic: 'PRO-FOUND — "pro" means forward, "found" = found the bottom — profoundly deep.',
    mnemonicZh: '"profound" 谐音"普若饭"——饭做得极其深入（用心），意义深刻。',
    synonyms: ['deep', 'significant', 'intense', 'far-reaching', 'fundamental'],
    antonyms: ['shallow', 'superficial', 'trivial', 'insignificant'],
    collocations: [
      { phrase: 'profound effect', example: 'Music can have a profound effect on our emotions.', exampleZh: '音乐可以对我们的情感产生深刻影响。' },
    ],
    sceneUsage: [
      { scene: 'Philosophy', sceneZh: '哲学', example: 'The question of consciousness is one of the most profound in science.', exampleZh: '意识问题是科学中最深刻的问题之一。' },
    ],
  },
  {
    id: 'constraint',
    word: 'constraint',
    phonetic: '/kənˈstreɪnt/',
    level: 'intermediate',
    difficulty: 3,
    tags: ['CET-6', 'business', 'academic'],
    examFrequency: ['CET-6', 'IELTS', 'TOEFL'],
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'A limitation or restriction on freedom of action.',
        meaningZh: '限制；约束；制约因素。',
        example: 'Budget constraints prevented the company from expanding.',
        exampleZh: '预算限制阻止了公司扩张。',
      },
    ],
    etymology: {
      roots: 'Latin constringere "to bind tightly" (con- + stringere "to bind")',
      explanation: 'From Latin constringere, meaning "to bind tightly together".',
      explanationZh: '源自拉丁语 constringere，意为"紧紧绑在一起"。',
    },
    mnemonic: "CONSTRAINT = CON-STRAIN-T — you're STRAINED (stretched) and CONfined.",
    mnemonicZh: '"constrain" 联想"紧绑"——被约束、被限制住。',
    synonyms: ['restriction', 'limitation', 'restraint', 'impediment'],
    antonyms: ['freedom', 'latitude', 'liberty'],
    collocations: [
      { phrase: 'under constraints', example: 'Working under time constraints requires good prioritization.', exampleZh: '在时间限制下工作需要合理排列优先级。' },
    ],
    sceneUsage: [
      { scene: 'Business', sceneZh: '商业', example: 'Resource constraints often drive innovation.', exampleZh: '资源限制往往推动创新。' },
    ],
  },
  {
    id: 'consensus',
    word: 'consensus',
    phonetic: '/kənˈsensəs/',
    level: 'intermediate',
    difficulty: 2,
    tags: ['CET-6', 'politics', 'academic'],
    examFrequency: ['CET-6', 'IELTS', 'TOEFL'],
    definitions: [
      {
        partOfSpeech: 'noun',
        meaning: 'General agreement among a group of people.',
        meaningZh: '共识；一致意见。',
        example: 'The team reached a consensus on the project deadline.',
        exampleZh: '团队就项目截止日期达成了共识。',
      },
    ],
    etymology: {
      roots: 'Latin consensus (con- "together" + sentire "to feel")',
      explanation: 'From Latin consensus, meaning "agreement, accord", from consentire "to feel together".',
      explanationZh: '源自拉丁语 consensus（同意、协议），来自 consentire（共同感受）。',
    },
    mnemonic: 'CON-SENSUS — CON (together) + SENSUS (sense) — making sense together.',
    mnemonicZh: '"con" = 共同，+ "sens" = 感知——共同感知，达成一致。',
    synonyms: ['agreement', 'accord', 'unanimity', 'harmony', 'concurrence'],
    antonyms: ['disagreement', 'dissent', 'discord', 'conflict'],
    collocations: [
      { phrase: 'reach a consensus', example: 'After lengthy negotiations, the parties reached a consensus.', exampleZh: '经过长时间的谈判，各方达成了共识。' },
    ],
    sceneUsage: [
      { scene: 'Science', sceneZh: '科学', example: 'Scientific consensus indicates human activity drives climate change.', exampleZh: '科学共识表明人类活动是气候变化的驱动因素。' },
    ],
  },
  {
    id: 'substantial',
    word: 'substantial',
    phonetic: '/səbˈstænʃəl/',
    level: 'elementary',
    difficulty: 2,
    tags: ['CET-4', 'CET-6', 'general'],
    examFrequency: ['CET-4', 'CET-6', 'GAOKAO'],
    definitions: [
      {
        partOfSpeech: 'adjective',
        meaning: 'Of considerable importance, size, or worth.',
        meaningZh: '大量的；相当大的；实质性的。',
        example: 'The company made a substantial profit this quarter.',
        exampleZh: '该公司本季度获得了可观的利润。',
      },
    ],
    etymology: {
      roots: 'Latin substantialis (substantia "substance, material")',
      explanation: 'From Latin substantia (substance, matter) — something of real substance and weight.',
      explanationZh: '源自拉丁语 substantia（实质、物质）——具有真实分量和意义。',
    },
    mnemonic: 'SUBSTANT-IAL — SUBSTANCE + IAL — full of substance, considerable.',
    mnemonicZh: '"substance" = 实质——有实质性的分量，大量的。',
    synonyms: ['considerable', 'significant', 'sizeable', 'ample', 'notable'],
    antonyms: ['minor', 'negligible', 'trivial', 'slight'],
    collocations: [
      { phrase: 'substantial evidence', example: 'The prosecution presented substantial evidence of wrongdoing.', exampleZh: '检察官提出了大量的不当行为证据。' },
    ],
    sceneUsage: [
      { scene: 'Business reporting', sceneZh: '商业报道', example: 'The acquisition represented a substantial investment.', exampleZh: '此次收购代表着一项重大投资。' },
    ],
  },
]

export function getMockWord(id: string): Word | undefined {
  return mockWords.find(w => w.id === id)
}

export function searchMockWords(query: string): Word[] {
  const q = query.toLowerCase().trim()
  if (!q) return mockWords
  return mockWords.filter(
    w =>
      w.word.toLowerCase().includes(q) ||
      w.definitions.some(d => d.meaningZh.includes(q) || d.meaning.toLowerCase().includes(q)),
  )
}

export function getMockWordsByLevel(level: string): Word[] {
  return mockWords.filter(w => w.level === level)
}
