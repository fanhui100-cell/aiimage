import type { Word } from '@/types/word'

export const mockWords: Word[] = [
  {
    id: 'ubiquitous',
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
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
    mnemonic: "U + BIG + QUIT + OUS: You big quit — ous! You can't quit it because it's everywhere.",
    mnemonicZh: '谐音"优比克维特斯"——"优秀比较突出"，优秀的东西自然无处不在。',
    tags: ['GRE', 'TOEFL', 'academic'],
    difficulty: 4,
  },
  {
    id: 'ephemeral',
    word: 'ephemeral',
    phonetic: '/ɪˈfemərəl/',
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
      roots: 'Greek ephemeros "lasting a day" (epi- "on" + hemera "day")',
      explanation: 'From Greek ephemeros, literally "lasting only a day".',
      explanationZh: '源自希腊语 ephemeros，字面意思是"仅持续一天"，由 epi（在……上）和 hemera（天）构成。',
    },
    mnemonic: 'e-PHEMER-al: Think "fever" — a fever is ephemeral, it passes quickly.',
    mnemonicZh: '谐音"一飞没了"——飞起来就没了，形容短暂。',
    tags: ['GRE', 'literary', 'IELTS'],
    difficulty: 4,
  },
  {
    id: 'resilient',
    word: 'resilient',
    phonetic: '/rɪˈzɪliənt/',
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
      roots: 'Latin resilire "to leap back" (re- "back" + salire "to jump")',
      explanation: 'From Latin resilire, meaning "to spring back", combined with -ent.',
      explanationZh: '源自拉丁语 resilire，意为"弹回"，由 re-（回）和 salire（跳）构成。',
    },
    mnemonic: "RE-SILI-ENT: Like a rubber band, it re-sili-ently bounces back.",
    mnemonicZh: '谐音"如硅恩体"——硅橡胶有弹性，会弹回来，象征韧性。',
    tags: ['CET-6', 'IELTS', 'psychology'],
    difficulty: 3,
  },
]

export function getMockWord(id: string): Word | undefined {
  return mockWords.find(w => w.id === id)
}
