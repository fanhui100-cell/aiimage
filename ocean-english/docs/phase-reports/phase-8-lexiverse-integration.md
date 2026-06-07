# Phase 8 — Lexiverse 生产接入报告

**日期**：2026-06-05
**分支**：feat/lexiocean-phase1
**状态**：完成 ✓

---

## 概述

将 Claude Design 交付的 `repo-handoff-phase8/`（Stage A/B/C/D 全部 R3F 代码）接入 ocean-english 生产项目。
`/lexiverse` 路由现已可用，支持 42 个星系、真实词典词星球、全量学习状态映射、跨星系 echo 效果。

---

## 新增文件

### `app/api/lexiverse/words/route.ts`
- GET 接口，返回全量词典（无分页限制）
- 供 `useLexiverseDictionary` 客户端 hook 调用

### `app/lexiverse/page.tsx`
- Suspense 路由入口，WebGL 检测

### `config/lexiverse-galaxies.ts`
- 6 个星座 × 42 个星系完整目录
- 每个星系有 filter（themeTags/domainTags/examTags/cefrLevels/difficultyLevels）

### `lib/lexiverse/`（7 个文件）
| 文件 | 作用 |
|------|------|
| `lexiverse-types.ts` | 完整类型合约（Constellation / Galaxy / Planet / PlanetAction） |
| `lexiverse-word-filter.ts` | `scoreWord()` / `resolveGalaxyWords()` / `findGalaxiesForWord()` |
| `lexiverse-learning-state.ts` | 7 种 PlanetLearningState 推导 |
| `lexiverse-galaxy-builder.ts` | filter → 300 个确定性行星生成，含 9 种天体原型 |
| `lexiverse-archetypes.ts` | gas/rocky/molten/geodesic/orb/ringed/galaxy/crystal/dwarf 的 Three.js 构建器 |
| `lexiverse-mock-data.ts` | dev fallback（生产不依赖） |
| `useLexiverseDictionary.ts` | 模块级缓存的真实词典 hook，fetch `/api/lexiverse/words` |

### `components/lexiverse/`（27 个文件）
- Stage A：LexiverseShell、LexiverseScene、UniverseLayer、GalaxyNode、PlanetDetailPanel、WebGLFallback、Liquid UI 等
- Stage B：GalaxyLayer（真实行星场）、PlanetNode、GalaxyEdges、EnergyPulses、BurstPool
- Stage C：useLexiverseSlices、useRecentlyMasteredIds
- Stage D：useGalaxyMastery、useCrossGalaxyEchoes、ReviewSatellite、RecentlyMasteredRibbon

---

## 修改文件

### `lib/dictionary/dictionary-types.ts`
- `DictionaryWord` 新增 `themeTags?: string[]` / `domainTags?: string[]` 可选字段
- 向后兼容（可选字段，不影响现有代码）

### `lib/dictionary/expanded-seed-adapter.ts`
- `importToDictionaryWord()` 同时输出 `themeTags` / `domainTags` 独立字段

### `lib/dictionary/dictionary-client.ts`
- 新增 `getAllDictionaryWords()` 导出函数（内部调用 `searchWords('')`）

### `lib/lexiverse/lexiverse-types.ts`（handoff 后补丁）
- `LexiversePlanet` 加 `color?: string` 字段

### `lib/lexiverse/lexiverse-galaxy-builder.ts`（handoff 后补丁）
- 将 `color` 写入 planet 对象（原 handoff 只 `void color`）

### `components/lexiverse/LexiverseShell.tsx`（handoff 后补丁）
- `addToReview(p.wordId)` → `addToReview(p.wordId, p.word)`（2 参数）
- ribbon 颜色改为 `builtGalaxy.meta.colorTheme`（`p.color` 在类型加前不存在）
- `useLexiverseDictionary` 引用正确（无改动）

### `config/site.ts`
- `navigationMore` 加入 `Lexiverse / 词汇宇宙 → /lexiverse`

---

## 修复的接入问题

| 问题 | 原因 | 修复 |
|------|------|------|
| `useLexiverseDictionary` 动态 import 失败 | `dictionary-client.ts` 含 `next/headers`（服务端专用） | 改为 fetch `/api/lexiverse/words` |
| `/api/dictionary/search` MAX_LIMIT=50 不够 | 搜索接口限制 | 新建 `/api/lexiverse/words` 无限制接口 |
| `p.color` TS 错误 | `LexiversePlanet` 无 `color` 字段 | 加字段 + builder 存储 |
| `addToReview` 参数不足 | ocean-english 需要 2 参数，handoff 只传 1 个 | Shell 修正 |
| `getAllDictionaryWords` 不存在 | dictionary-client 未导出 | 新增导出函数 |

---

## 词典数据

- **总词数（去重前）**：405 个（61 core + 74 expanded + 150 batch-1 + 120 batch-2）
- **themeTags / domainTags**：batch-1/batch-2 已在 DictionaryImportWord 中正确设置，expanded-seed-adapter 现在同时输出为独立字段

---

## 42 个星系结构

| 星座 | 星系数 | 过滤方式 |
|------|--------|----------|
| Daily Communication | 8 | themeTags (daily-life/communication/emotion) + difficultyLevels |
| Academic Knowledge | 8 | themeTags (academic/science/learning) |
| Tech & Engineering | 6 | domainTags (engineering/ai-tech) |
| Business & Project | 6 | domainTags (business) + themeTags (project-management) |
| Exam Targets | 8 | examTags (TOEFL/IELTS/CET-4/CET-6/KAOYAN/GAOKAO) |
| CEFR Ladder | 6 | cefrLevels (A1–C2) |

---

## 验证

- `npx next build` 通过，0 错误，0 警告
- `/lexiverse` 路由已列为 `○ (Static)`
- `/api/lexiverse/words` 路由已列为 `ƒ (Dynamic)`
- 现有全部路由不受影响

---

## 不会碰的文件

全部 store、AI 路由、现有功能页面（/lexigraph、/quiz、/memory、/chat、/scan、/word、/dictionary、/study）、Phase 5 认证、Supabase 均未修改。

---

## 后续（可选）

- **视觉升级**：将 `lexiverse-universe/scene.js` 的粒子螺旋星系效果移植到 `GalaxyNode.tsx`（R3F `<points>` + ShaderMaterial）
- **背景升级**：`LexiverseScene.tsx` 加 17,000 背景粒子 + 2 片远景星云
- **Scan 私有星系**：`useScanHistoryStore` 文档 → Phase E 私有星系
- **词库扩充**：更多词条加入 theme/domain tags 后，更多星系从 empty → active
