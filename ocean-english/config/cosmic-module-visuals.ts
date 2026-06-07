import type { ModuleId } from '@/types/learning'

export type CosmicRole = 'core' | 'nebula' | 'planet' | 'station' | 'satellite'

export interface CosmicModuleVisual {
  moduleId: ModuleId
  slug: string
  cosmicRole: CosmicRole
  orbitLevel: 0 | 1 | 2 | 3
  color: string
  secondaryColor: string
  futureVisualDescription: string
}

export const cosmicModuleVisuals: CosmicModuleVisual[] = [
  {
    moduleId: 'ai-navigator',
    slug: 'ai',
    cosmicRole: 'core',
    orbitLevel: 0,
    color: '#8B5CF6',
    secondaryColor: '#C4B5FD',
    futureVisualDescription:
      'AI Navigator sits at the gravitational center of the universe — rendered as a pulsing singularity whose pulse rate is driven by daily task completion rate from Zustand.',
  },
  {
    moduleId: 'vocabulary-roots',
    slug: 'vocabulary',
    cosmicRole: 'nebula',
    orbitLevel: 1,
    color: '#38BDF8',
    secondaryColor: '#7EF9FF',
    futureVisualDescription:
      'Cyan vocabulary nebula in close orbit. Particle density scales with savedWords.length — the more words saved, the denser and brighter the nebula cluster.',
  },
  {
    moduleId: 'voice-sonar',
    slug: 'voice',
    cosmicRole: 'planet',
    orbitLevel: 1,
    color: '#7EF9FF',
    secondaryColor: '#A5F3FC',
    futureVisualDescription:
      'Resonance planet emitting concentric sonar rings. Ring frequency and amplitude are reserved for future pronunciation session data.',
  },
  {
    moduleId: 'reading-canopy',
    slug: 'reading',
    cosmicRole: 'nebula',
    orbitLevel: 2,
    color: '#B8FFB2',
    secondaryColor: '#86EFAC',
    futureVisualDescription:
      'Green reading cloud in mid-orbit. Cloud volume and luminosity are reserved for future reading session history data.',
  },
  {
    moduleId: 'scan-hollow',
    slug: 'scan',
    cosmicRole: 'station',
    orbitLevel: 2,
    color: '#FFD76A',
    secondaryColor: '#FDE68A',
    futureVisualDescription:
      'Ice-blue scan station with document intake beams. Station glow intensity reserved for future real OCR scan history.',
  },
  {
    moduleId: 'exam-branch',
    slug: 'exam',
    cosmicRole: 'planet',
    orbitLevel: 2,
    color: '#F97316',
    secondaryColor: '#FED7AA',
    futureVisualDescription:
      'Gold-red challenge star. Orbit tick marks light up based on quizHistory.length — each completed quiz session adds a visible orbital marker.',
  },
  {
    moduleId: 'memory-roots',
    slug: 'memory',
    cosmicRole: 'satellite',
    orbitLevel: 3,
    color: '#34D399',
    secondaryColor: '#6EE7B7',
    futureVisualDescription:
      'Amber memory orbit satellite in outer ring. Surrounding particle count maps to reviewWords.length; warning pulse activates when wrongAnswers.length exceeds threshold.',
  },
]

export function getCosmicVisualBySlug(slug: string): CosmicModuleVisual | undefined {
  return cosmicModuleVisuals.find(v => v.slug === slug)
}

export function getCosmicVisualByModuleId(moduleId: ModuleId): CosmicModuleVisual | undefined {
  return cosmicModuleVisuals.find(v => v.moduleId === moduleId)
}
