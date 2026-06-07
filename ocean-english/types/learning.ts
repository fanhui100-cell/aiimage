export type ModuleId =
  | 'vocabulary-roots'
  | 'voice-sonar'
  | 'ai-navigator'
  | 'reading-canopy'
  | 'scan-hollow'
  | 'exam-branch'
  | 'memory-roots'

export interface ModulePosition3D {
  x: number
  y: number
  z: number
}

export interface LearningModule {
  id: ModuleId
  name: string
  nameZh: string
  type: string
  typeZh: string
  description: string
  descriptionZh: string
  abilities: readonly string[]
  abilitiesZh: readonly string[]
  route: string
  universeRoute?: string
  visualPosition: ModulePosition3D
  color: string
  icon: string
}

export type LearningLevel =
  | 'beginner'
  | 'elementary'
  | 'intermediate'
  | 'advanced'
  | 'exam-prep'
  | 'free-explore'

export interface LevelOption {
  id: LearningLevel
  name: string
  nameZh: string
  description: string
  descriptionZh: string
}
