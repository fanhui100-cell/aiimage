// config/lexiverse-build.ts — Lexiverse 静态资产版本开关（阶段3-0 / 界面优化9）
// 'v1' = public/lexiverse-reference/（定稿原版，随时回退）
// 'v2' = public/lexiverse-reference-v2/（升级版：双语/返回/dock/桥/U1-U5）
// 'v3' = public/lexiverse-reference-v3/（WU 重构原型：16 星系 + 词卡七区 + 复习舱 + 我的星云
//        + wu-bridge.js 联动：模块跳转 / 词图 / 完整词条 / SRS 双向回流）
export type LexiverseBuild = 'v1' | 'v2' | 'v3'
export const LEXIVERSE_BUILD: LexiverseBuild = 'v3'

export function lexiverseBasePath(): string {
  if (LEXIVERSE_BUILD === 'v3') return '/lexiverse-reference-v3'
  if (LEXIVERSE_BUILD === 'v2') return '/lexiverse-reference-v2'
  return '/lexiverse-reference'
}
