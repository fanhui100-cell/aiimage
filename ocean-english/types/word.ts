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

export interface Word {
  id: string
  word: string
  phonetic: string
  definitions: Definition[]
  etymology: Etymology
  mnemonic: string
  mnemonicZh: string
  tags: string[]
  difficulty: 1 | 2 | 3 | 4 | 5
}
