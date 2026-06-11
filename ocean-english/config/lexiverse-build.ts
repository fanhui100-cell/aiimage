// config/lexiverse-build.ts — Lexiverse 静态资产版本开关（阶段3-0）
// 'v1' = public/lexiverse-reference/（定稿原版，随时回退）
// 'v2' = public/lexiverse-reference-v2/（升级版：双语/返回/dock/桥/U1-U5）
export type LexiverseBuild = 'v1' | 'v2'
export const LEXIVERSE_BUILD: LexiverseBuild = 'v2'

export function lexiverseBasePath(): string {
  return LEXIVERSE_BUILD === 'v2' ? '/lexiverse-reference-v2' : '/lexiverse-reference'
}
