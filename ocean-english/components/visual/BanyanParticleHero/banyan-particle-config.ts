import type {
  BanyanCurveConfig,
  BanyanColorConfig,
  BanyanBloomConfig,
  BanyanAnimationConfig,
  BanyanCameraConfig,
  BanyanMouseConfig,
} from './banyan-types'

export const BANYAN_CURVES_DESKTOP: BanyanCurveConfig = {
  rootCurves: 150,
  rootPointsPerCurve: 100,
  trunkCurves: 200,
  trunkPointsPerCurve: 150,
  avgBranchesPerTrunk: 4,
  branchPointsPerCurve: 120,
  aerialRoots: 600,
  aerialRootPointsPerCurve: 100,
}

export const BANYAN_CURVES_MOBILE: BanyanCurveConfig = {
  rootCurves: 50,
  rootPointsPerCurve: 40,
  trunkCurves: 60,
  trunkPointsPerCurve: 60,
  avgBranchesPerTrunk: 3,
  branchPointsPerCurve: 50,
  aerialRoots: 200,
  aerialRootPointsPerCurve: 40,
}

export const BANYAN_COLORS: BanyanColorConfig = {
  baseCyan: '#22D3EE',
  tipWhite: '#E0F8FF',
  accentGreen: '#4ade80',
}

export const BANYAN_BLOOM: BanyanBloomConfig = {
  intensity: 1.8,
  luminanceThreshold: 0.15,
  luminanceSmoothing: 0.9,
}

export const BANYAN_ANIMATION: BanyanAnimationConfig = {
  autoRotateSpeed: 0.3,
  wobbleStrength: 0.1,
}

export const BANYAN_CAMERA: BanyanCameraConfig = {
  fov: 45,
  position: [0, 15, 180],
  target: [0, 40, 0],
  fogDensity: 0.003,
}

export const BANYAN_MOUSE: BanyanMouseConfig = {
  influenceRadius: 0.4,
  influenceStrength: 2.0,
}

// GLSL shaders — ported verbatim from HTML demo with mouse disturbance uniforms added.
// Particle size (2.5) and wobble (0.1) match original demo values exactly.
export const BANYAN_SHADERS = {
  vertex: `
    uniform float uTime;
    uniform vec2 uMouseNDC;
    uniform float uMouseForce;

    attribute float aPathLength;
    attribute float aDelay;
    attribute float aDuration;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;

      float progress = clamp((uTime - aDelay) / aDuration, 0.0, 1.0);
      progress = progress * progress * (3.0 - 2.0 * progress);

      vAlpha = 0.0;
      vec3 pos = position;

      if (aPathLength <= progress && progress > 0.0) {
        float headDist = progress - aPathLength;

        if (headDist < 0.02) {
          vAlpha = 1.0;
          vColor = vec3(1.0);
        } else {
          vAlpha = 0.15;

          float afterTime = uTime - (aDelay + aDuration);
          if (afterTime > 0.0) {
            float pulsePhase = mod(afterTime * 0.3, 1.0);
            float pulseDist = abs(aPathLength - pulsePhase);
            if (pulseDist < 0.05) {
              vAlpha += (0.05 - pulseDist) * 10.0;
              vColor = mix(vColor, vec3(0.8, 1.0, 1.0), 0.8);
            }
            vAlpha += sin(uTime * 2.0 + aPathLength * 20.0) * 0.05;
          }
        }

        pos.x += sin(uTime * 1.5 + pos.y * 0.5) * 0.1 * progress;
        pos.z += cos(uTime * 1.5 + pos.x * 0.5) * 0.1 * progress;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vec2 posNDC = gl_Position.xy / gl_Position.w;
      float mouseDist = length(posNDC - uMouseNDC);
      float mouseInfluence = max(0.0, 1.0 - mouseDist * 2.5) * uMouseForce;
      if (mouseInfluence > 0.001) {
        pos.x += sin(pos.y * 2.0 + uTime * 3.0) * mouseInfluence * 2.0;
        pos.z += cos(pos.x * 2.0 + uTime * 3.0) * mouseInfluence * 2.0;
        mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }

      gl_PointSize = 2.5 * (100.0 / -mvPosition.z);
    }
  `,
  fragment: `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      if (vAlpha <= 0.0) discard;

      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      float core = pow(1.0 - (dist * 2.0), 1.5);
      gl_FragColor = vec4(vColor, core * vAlpha);
    }
  `,
}
