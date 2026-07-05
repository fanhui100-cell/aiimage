export interface Definition {
  partOfSpeech: string
  meaning: string
  meaningZh: string
  example: string
  exampleZh: string
}

export interface Etymology {
  roots: string
  explanation: string
  explanationZh: string
}

export interface Collocation {
  phrase: string
  example: string
  exampleZh: string
}

export interface SceneUsage {
  scene: string
  sceneZh: string
  example: string
  exampleZh: string
}

export type ExamFrequency = 'TOEFL' | 'IELTS' | 'CET-4' | 'CET-6' | 'KAOYAN' | 'GAOKAO'

export interface Word {
  id: string
  word: string
  phonetic: string
  definitions: Definition[]
  etymology: Etymology
  mnemonic: string
  mnemonicZh: string
  mnemonicEvil?: string
  mnemonicEvilZh?: string
  synonyms: string[]
  antonyms: string[]
  collocations: Collocation[]
  sceneUsage: SceneUsage[]
  examFrequency: ExamFrequency[]
  tags: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'exam-prep'
}
