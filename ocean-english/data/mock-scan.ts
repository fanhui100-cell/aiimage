import type { ScanResult } from '@/types/study'

export const mockScanResult: ScanResult = {
  extractedText: `The proliferation of digital technology has engendered unprecedented changes in communication patterns. Contemporary society exhibits an unequivocal dependence on ubiquitous connectivity, rendering face-to-face interaction increasingly ephemeral. Researchers contend that this paradigm shift necessitates a comprehensive reassessment of social cohesion.`,

  vocabulary: [
    { word: 'proliferation', definition: 'Rapid increase in numbers.', definitionZh: '快速增殖；大量扩散。' },
    { word: 'engendered', definition: 'Cause or give rise to (a feeling, situation, or condition).', definitionZh: '引起；产生；导致。' },
    { word: 'unequivocal', definition: 'Leaving no doubt; unambiguous.', definitionZh: '明确的；毫不含糊的。' },
    { word: 'ubiquitous', definition: 'Present, appearing, or found everywhere.', definitionZh: '无处不在的；普遍存在的。' },
    { word: 'ephemeral', definition: 'Lasting for a very short time.', definitionZh: '短暂的；瞬间即逝的。' },
    { word: 'paradigm', definition: 'A typical example or pattern; a model.', definitionZh: '范例；范式；典范。' },
    { word: 'cohesion', definition: 'The action or fact of forming a united whole.', definitionZh: '凝聚力；团结；结合。' },
  ],

  questions: [
    {
      text: 'According to the passage, what has digital technology caused?',
      suggestedAnswer: 'Digital technology has caused unprecedented changes in communication patterns and a dependence on ubiquitous connectivity.',
      suggestedAnswerZh: '数字技术在沟通模式方面引起了前所未有的变化，并造成了对无处不在的网络连接的依赖。',
    },
    {
      text: 'What does the passage suggest about face-to-face interaction?',
      suggestedAnswer: 'The passage suggests that face-to-face interaction is becoming increasingly brief and transient (ephemeral) as a result of digital connectivity.',
      suggestedAnswerZh: '文章暗示，由于数字连接，面对面互动变得越来越短暂。',
    },
    {
      text: 'What do researchers argue is necessary?',
      suggestedAnswer: 'Researchers argue that a comprehensive reassessment of social cohesion is necessary due to this paradigm shift.',
      suggestedAnswerZh: '研究人员认为，由于这种范式转变，有必要对社会凝聚力进行全面重新评估。',
    },
  ],
}
