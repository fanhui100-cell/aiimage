export interface BanyanCurveConfig {
  rootCurves: number
  rootPointsPerCurve: number
  trunkCurves: number
  trunkPointsPerCurve: number
  avgBranchesPerTrunk: number
  branchPointsPerCurve: number
  aerialRoots: number
  aerialRootPointsPerCurve: number
}

export interface BanyanColorConfig {
  baseCyan: string
  tipWhite: string
  accentGreen: string
}

export interface BanyanBloomConfig {
  intensity: number
  luminanceThreshold: number
  luminanceSmoothing: number
}

export interface BanyanAnimationConfig {
  autoRotateSpeed: number
  wobbleStrength: number
}

export interface BanyanCameraConfig {
  fov: number
  position: [number, number, number]
  target: [number, number, number]
  fogDensity: number
}

export interface BanyanMouseConfig {
  influenceRadius: number
  influenceStrength: number
}
