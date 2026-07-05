export interface LuminousCurveConfig {
  rootCurves: number
  rootPointsPerCurve: number
  grassCurves: number
  grassPointsPerCurve: number
  mainTrunks: number
  strandsPerTrunk: number
  trunkPointsPerCurve: number
  twigCurves: number
  twigPointsPerCurve: number
  aerialRoots: number
  aerialRootPointsPerCurve: number
  dustCount: number
  trailCount: number
}

export const LUMINOUS_DESKTOP_CONFIG: LuminousCurveConfig = {
  rootCurves: 250,
  rootPointsPerCurve: 150,
  grassCurves: 1200,
  grassPointsPerCurve: 18,
  mainTrunks: 4,
  strandsPerTrunk: 75,
  trunkPointsPerCurve: 200,
  twigCurves: 3000,
  twigPointsPerCurve: 60,
  aerialRoots: 1200,
  aerialRootPointsPerCurve: 160,
  dustCount: 4000,
  trailCount: 200,
}

export const LUMINOUS_MOBILE_CONFIG: LuminousCurveConfig = {
  rootCurves: 90,
  rootPointsPerCurve: 70,
  grassCurves: 420,
  grassPointsPerCurve: 12,
  mainTrunks: 4,
  strandsPerTrunk: 28,
  trunkPointsPerCurve: 90,
  twigCurves: 900,
  twigPointsPerCurve: 32,
  aerialRoots: 360,
  aerialRootPointsPerCurve: 70,
  dustCount: 1400,
  trailCount: 120,
}

export const LUMINOUS_CAMERA = {
  fov: 45,
  position: [0, 30, 260] as [number, number, number],
  target: [0, 45, 0] as [number, number, number],
  fogDensity: 0.0022,
}

export const LUMINOUS_BLOOM = {
  intensity: 2.0,
  luminanceThreshold: 0.1,
  luminanceSmoothing: 0.6,
}

export const LUMINOUS_COLORS = {
  base: '#DDF0FF',
  tip: '#FFFFFF',
  alternate: '#C2E0FA',
  grassBase: '#A5E6D8',
  grassAlt: '#75D1C3',
}

export const LUMINOUS_TREE_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uPointSize;
  uniform float uTailAlpha;
  uniform vec2 uMouse;
  uniform float uMouseActive;

  attribute float aPathLength;
  attribute float aDelay;
  attribute float aDuration;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor * 1.2;
    vAlpha = 0.0;

    float progress = clamp((uTime - aDelay) / aDuration, 0.0, 1.0);
    progress = progress * progress * (3.0 - 2.0 * progress);

    vec3 pos = position;
    bool grown = (aPathLength <= progress && progress > 0.0);

    if (grown) {
      float headDist = progress - aPathLength;
      if (headDist < 0.02) {
        vAlpha = 1.0;
        vColor = vec3(1.0);
      } else {
        vAlpha = uTailAlpha;
        float afterTime = uTime - (aDelay + aDuration);
        if (afterTime > 0.0) {
          float pulsePhase = mod(afterTime * 0.3, 1.0);
          float pulseDist = abs(aPathLength - pulsePhase);
          if (pulseDist < 0.05) {
            vAlpha += (0.05 - pulseDist) * 15.0;
            vColor = mix(vColor, vec3(1.0, 1.0, 1.0), 0.9);
          }
          vAlpha += sin(uTime * 2.0 + aPathLength * 20.0) * 0.08;
        }
      }

      pos.x += sin(uTime * 1.5 + pos.y * 0.5) * 0.12 * progress;
      pos.z += cos(uTime * 1.5 + pos.x * 0.5) * 0.12 * progress;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float ptSize = uPointSize * (100.0 / -mvPosition.z);

    if (grown && uMouseActive > 0.5) {
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vec2 pushDir = ndc - uMouse;
      float md = length(pushDir);
      float infl = smoothstep(0.25, 0.0, md);

      if (md > 0.001) {
        gl_Position.xy += (pushDir / md) * (infl * infl) * 0.012 * gl_Position.w;
      }

      vAlpha += infl * 0.05;
      vColor = mix(vColor, vec3(1.0), infl * 0.08);
      ptSize *= (1.0 + infl * 0.15);
    }

    gl_PointSize = ptSize;
  }
`

export const LUMINOUS_TREE_FRAGMENT_SHADER = `
  uniform vec3 uTint;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.0) discard;
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float core = pow(1.0 - (dist * 2.0), 1.5);
    gl_FragColor = vec4(vColor * uTint, core * vAlpha);
  }
`

export const LUMINOUS_DUST_VERTEX_SHADER = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseActive;

  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 0.3 + aPhase) * 6.0;
    pos.x += cos(uTime * 0.2 + aPhase) * 4.0;
    pos.z += sin(uTime * 0.15 + aPhase) * 4.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = (sin(uTime * 0.8 + aPhase) * 0.5 + 0.5) * 0.45;
    float ptSize = 3.5;

    if (uMouseActive > 0.5) {
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vec2 pullDir = uMouse - ndc;
      float md = length(pullDir);
      float pullInfl = smoothstep(0.2, 0.0, md);

      if (md > 0.001) {
        gl_Position.xy += (pullDir / md) * (pullInfl * pullInfl) * 0.2 * gl_Position.w;
      }

      vAlpha += pullInfl * 1.0;
      ptSize *= (1.0 + pullInfl * 1.5);
    }

    gl_PointSize = ptSize * (100.0 / -mvPosition.z);
  }
`

export const LUMINOUS_DUST_FRAGMENT_SHADER = `
  uniform vec3 uTint;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.01) discard;
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float core = pow(1.0 - (dist * 2.0), 1.5);
    gl_FragColor = vec4(uTint, core * vAlpha);
  }
`

export const LUMINOUS_TRAIL_VERTEX_SHADER = `
  attribute float aAge;
  varying float vAlpha;

  void main() {
    vAlpha = 1.0 - aAge;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 25.0 * vAlpha * (100.0 / -mvPosition.z);
  }
`

export const LUMINOUS_TRAIL_FRAGMENT_SHADER = `
  uniform vec3 uTint;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.0) discard;
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float core = pow(1.0 - (dist * 2.0), 2.0);
    gl_FragColor = vec4(uTint, core * vAlpha * 0.8);
  }
`
