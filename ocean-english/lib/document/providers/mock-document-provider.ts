import type {
  ExtractedDocumentData,
  DocumentAnalysisResult,
  UploadedDocumentType,
} from '@/types/document'
import { DEMO_RAW_TEXT } from '../demo-text'

export function buildMockExtraction(
  fileName: string,
  fileType: UploadedDocumentType,
): ExtractedDocumentData {
  return {
    fileName,
    fileType,
    rawText: DEMO_RAW_TEXT,
    extractionMethod: 'mock',
    warnings: [
      'Demo extraction active — upload a real PDF or image for actual text extraction.',
    ],
  }
}

export function buildMockDocumentAnalysis(
  rawText: string,
  fileName: string,
): DocumentAnalysisResult {
  const text = rawText || DEMO_RAW_TEXT

  return {
    id: `doc-${Date.now()}`,
    fileName: fileName || 'Document',
    fileType: 'text',
    rawText: text,
    summaryEn:
      'This academic passage examines the societal impact of digital technology on communication, highlighting dependency on connectivity and diminishing face-to-face interaction. Researchers suggest reassessing social cohesion in light of this shift.',
    summaryZh:
      '本学术段落探讨了数字技术对沟通方式的社会影响，强调了对网络连接的依赖性和面对面互动的减少。研究人员建议就此转变重新审视社会凝聚力。',
    questions: [
      {
        id: 'q1',
        type: 'reading',
        prompt: 'According to the passage, what has digital technology caused?',
        answerSuggestion:
          'Digital technology has caused unprecedented changes in communication patterns and created an unequivocal dependence on ubiquitous connectivity.',
        explanation:
          'The opening sentence explicitly states this effect of digital technology proliferation.',
        sourceText:
          'The proliferation of digital technology has engendered unprecedented changes in communication patterns.',
      },
      {
        id: 'q2',
        type: 'reading',
        prompt: 'What does the passage suggest about face-to-face interaction?',
        answerSuggestion:
          'Face-to-face interaction is becoming increasingly ephemeral (short-lived) as a result of digital connectivity.',
        explanation:
          'The word "ephemeral" is key — it means lasting a very short time, contrasting with the permanence of digital connections.',
        sourceText: 'rendering face-to-face interaction increasingly ephemeral',
      },
      {
        id: 'q3',
        type: 'reading',
        prompt: 'What do researchers argue is necessary according to the passage?',
        answerSuggestion:
          'Researchers argue that a comprehensive reassessment of social cohesion is necessary due to this paradigm shift.',
        explanation:
          'The word "necessitates" means makes necessary, linking the paradigm shift to the need for reassessment.',
        sourceText:
          'this paradigm shift necessitates a comprehensive reassessment of social cohesion',
      },
    ],
    vocabulary: [
      {
        word: 'proliferation',
        meaningZh: '快速增殖；大量扩散',
        definitionEn: 'Rapid increase or spread in numbers',
        context: 'The proliferation of digital technology...',
        difficulty: 'advanced',
        shouldReview: true,
      },
      {
        word: 'engendered',
        meaningZh: '引起；产生；导致',
        definitionEn: 'Cause or give rise to a situation or feeling',
        context: '...has engendered unprecedented changes...',
        difficulty: 'advanced',
        shouldReview: true,
      },
      {
        word: 'unequivocal',
        meaningZh: '明确的；毫不含糊的',
        definitionEn: 'Leaving no doubt; unambiguous',
        context: '...unequivocal dependence on ubiquitous connectivity...',
        difficulty: 'exam',
        shouldReview: true,
      },
      {
        word: 'ubiquitous',
        meaningZh: '无处不在的；普遍存在的',
        definitionEn: 'Present, appearing, or found everywhere',
        context: '...dependence on ubiquitous connectivity...',
        difficulty: 'advanced',
        shouldReview: true,
      },
      {
        word: 'ephemeral',
        meaningZh: '短暂的；瞬间即逝的',
        definitionEn: 'Lasting for a very short time',
        context: '...face-to-face interaction increasingly ephemeral',
        difficulty: 'exam',
        shouldReview: true,
      },
      {
        word: 'paradigm',
        meaningZh: '范例；范式；典范',
        definitionEn: 'A typical example or pattern; a model',
        context: '...this paradigm shift necessitates...',
        difficulty: 'advanced',
        shouldReview: false,
      },
      {
        word: 'cohesion',
        meaningZh: '凝聚力；结合力；团结',
        definitionEn: 'The action of forming a united whole',
        context: '...reassessment of social cohesion',
        difficulty: 'intermediate',
        shouldReview: false,
      },
    ],
    answerSuggestions: [
      {
        questionId: 'q1',
        suggestion:
          'Digital technology has caused unprecedented changes in communication patterns.',
        explanationZh: '数字技术在沟通模式方面引起了前所未有的变化。',
      },
      {
        questionId: 'q2',
        suggestion: 'Face-to-face interaction is becoming increasingly ephemeral.',
        explanationZh: '面对面互动变得越来越短暂（ephemeral = 短暂的）。',
      },
      {
        questionId: 'q3',
        suggestion: 'A comprehensive reassessment of social cohesion is necessary.',
        explanationZh: '有必要对社会凝聚力进行全面重新评估。',
      },
    ],
    studyNotes: [
      {
        title: 'Academic Vocabulary Focus',
        titleZh: '学术词汇重点',
        content:
          'This passage contains several high-frequency academic words: proliferation, engendered, unequivocal, ubiquitous, ephemeral, paradigm, cohesion. These appear frequently in TOEFL, IELTS, and 考研 reading sections.',
        contentZh:
          '本段落含有多个高频学术词汇：proliferation、engendered、unequivocal、ubiquitous、ephemeral、paradigm、cohesion。这些词在托福、雅思、考研阅读中频繁出现。',
      },
      {
        title: 'Reading Strategy',
        titleZh: '阅读策略',
        content:
          'For passages like this, identify the main argument in the first sentence, then look for how each subsequent sentence supports or expands on that argument. Pay attention to causal connectors (has engendered, rendering, necessitates).',
        contentZh:
          '对于此类段落，先识别首句的核心论点，再观察每个后续句子如何支撑或拓展该论点。注意因果连接词（has engendered、rendering、necessitates）。',
      },
    ],
    warnings: [],
    createdAt: new Date().toISOString(),
  }
}

// Re-exported so existing imports don't break; prefer importing from '@/lib/document/demo-text' directly.
export { DEMO_RAW_TEXT as DEMO_RAW_TEXT_EXPORT }
