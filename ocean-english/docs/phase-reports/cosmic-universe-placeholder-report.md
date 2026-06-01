# Cosmic Universe Placeholder Report

**Project:** LexiOcean (`d:\ai-studio\ocean-english`)
**Branch:** feat/lexiocean-phase1
**Date:** 2026-06-01
**Phase:** Architecture Pre-reservation (Pre-Phase 3)

---

## 1. 本次新增文件

| 文件路径 | 说明 |
|---|---|
| `app/universe/page.tsx` | `/universe` 宇宙地图占位页 — 7个模块卡片网格，静态 UI，无 Three.js |
| `app/universe/[module]/page.tsx` | `/universe/[module]` 动态模块占位页 — 根据 slug 查找模块，显示 Coming Soon 面板 |
| `app/visual-lab/cosmic-td/page.tsx` | `/visual-lab/cosmic-td` 视觉实验室占位页 — 未来 Phase 3 TD 粒子系统预留入口 |
| `config/cosmic-module-visuals.ts` | 宇宙视觉映射静态配置 — 7条映射数据，含 cosmicRole / orbitLevel / 未来视觉描述 |
| `docs/phase-reports/cosmic-universe-placeholder-report.md` | 本报告 |

## 2. 本次修改文件

| 文件路径 | 修改内容 |
|---|---|
| `types/learning.ts` | `LearningModule` 接口增加 `universeRoute?: string`（可选字段，不影响任何现有消费代码） |
| `config/learning-modules.ts` | 7个模块各增加 `universeRoute` 字段，原有 `route` 字段完全保留不变 |

### universeRoute 映射详情

| 模块 | route（保留不变） | universeRoute（新增） |
|---|---|---|
| vocabulary-roots | `/dictionary` | `/universe/vocabulary` |
| voice-sonar | `/study` | `/universe/voice` |
| ai-navigator | `/chat` | `/universe/ai` |
| reading-canopy | `/study` | `/universe/reading` |
| scan-hollow | `/scan` | `/universe/scan` |
| exam-branch | `/exam` | `/universe/exam` |
| memory-roots | `/memory` | `/universe/memory` |

## 3. 是否修改 Banyan 首页

**否。** `app/page.tsx` 未动。

BanyanParticleHero 的模块节点 CTA 继续使用 `module.route`（真实功能页面），**未改为 `module.universeRoute`**。

## 4. 是否修改 Phase 2 功能页面

**否。** 以下页面完全未动：

- `app/dictionary/page.tsx`
- `app/word/[slug]/page.tsx`
- `app/word/[slug]/WordDetailClient.tsx`
- `app/quiz/page.tsx`
- `app/study/page.tsx`
- `app/memory/page.tsx`
- `app/exam/page.tsx`
- `app/chat/page.tsx`
- `app/scan/page.tsx`
- `app/onboarding/page.tsx`

## 5. learning-modules.ts 是否增加 universeRoute

**是。** 7个模块均已增加 `universeRoute` 字段，原有 `route` 字段保留不变。TypeScript 类型声明为 `universeRoute?: string`（可选），现有引用 `module.route` 的代码（BanyanModulePanel、各功能页面）不受任何影响。

## 6. 新增路由说明

### `/universe`（静态页）

- 7个模块卡片网格，`minmax(280px, 1fr)` 响应式布局
- 每个卡片：icon、英文名、中文名、type badge、中文简介、"Enter Universe / 进入宇宙 →" 按钮
- 按钮跳转到 `module.universeRoute`（即 `/universe/vocabulary` 等）
- 页面底部提供 "← Back to Home" 和 "Visual Lab →" 导航
- 无 Three.js / R3F / 粒子系统

### `/universe/[module]`（动态服务端页）

- 根据 URL slug 匹配：先按 `universeRoute` 精确匹配，再按 `module.id` 兜底
- 未匹配则调用 Next.js `notFound()` — 返回 404
- 显示：模块详情面板、Core Abilities 列表、Cosmic Role 卡片（来自 `cosmic-module-visuals.ts`）、Coming Soon 面板
- **"Enter Module / 进入模块 →"** 跳转到 `learningModule.route`（真实功能页）
- **"← Back to Universe / 返回宇宙地图"** 跳转到 `/universe`

### `/visual-lab/cosmic-td`（静态页）

- Coming Soon 横幅（含 Phase 3 标注）
- 6条未来实现计划列表：Deep Space Canvas / AI Core Star / Module Nebulas / Particle Orbits / Camera Transition / Zustand Progress Mapping
- 页面底部：Back to Home + Go to Learning Universe

## 7. config/cosmic-module-visuals.ts 说明

```typescript
type CosmicRole = 'core' | 'nebula' | 'planet' | 'station' | 'satellite'

interface CosmicModuleVisual {
  moduleId: ModuleId
  slug: string
  cosmicRole: CosmicRole
  orbitLevel: 0 | 1 | 2 | 3
  color: string
  secondaryColor: string
  futureVisualDescription: string
}
```

| 模块 | cosmicRole | orbitLevel |
|---|---|---|
| ai-navigator | core | 0 — 引力中心，脉动强度 ← 每日任务完成率 |
| vocabulary-roots | nebula | 1 — 粒子密度 ← savedWords.length |
| voice-sonar | planet | 1 — 声纹环频率（预留） |
| reading-canopy | nebula | 2 — 星云体积（预留） |
| scan-hollow | station | 2 — 文档摄入光束（预留） |
| exam-branch | planet | 2 — 轨道刻度 ← quizHistory.length |
| memory-roots | satellite | 3 — 环绕粒子数 ← reviewWords.length；警示脉冲 ← wrongAnswers |

该文件**不含任何 shader 代码或 WebGL 调用**，是纯 TypeScript 静态数据。`/universe/[module]` 页面已接入，展示 cosmicRole 和 futureVisualDescription。

## 8. 后续正式 Cosmic Universe 实现时的建议接入点

### 接入顺序（推荐）

1. **替换 `/universe/page.tsx` 主体**  
   将静态卡片网格替换为 R3F Canvas，挂载 CosmicScene 组件。静态卡片可保留为无 JS 回退。

2. **在 `app/universe/[module]/page.tsx` 增加摄像机推进**  
   通过 URL 参数或 Zustand 传递目标模块 ID，触发宇宙场景中的摄像机 fly-in。

3. **接入 Zustand 进度映射**  
   在 CosmicScene 中读取 `useLearningStore()`，将以下状态映射到粒子参数：
   - `savedWords.length` → vocabulary nebula 粒子密度
   - `wrongAnswers.length` → memory/exam 节点警示脉冲
   - `reviewWords.length` → memory satellite 环绕粒子数
   - `quizHistory.length` → exam 轨道刻度亮度
   - `dailyTasks` completion rate → AI core pulse 强度
   - `studyProgress.currentStreak` / `totalXp` → 轨道能量流亮度

4. **更新 `config/cosmic-module-visuals.ts`**  
   补充 GLSL uniform 名称和 Three.js 几何体参数，作为粒子系统的配置驱动层。

5. **决定首页节点跳转目标**  
   当宇宙系统稳定后，评估是否将 `BanyanModulePanel` 的 CTA 从 `module.route` 改为 `module.universeRoute`，让用户路径变为：首页 → 宇宙地图 → 功能页。

### 无需改动的文件（Phase 3 时）

- `BanyanParticleHero` 所有组件（除非主动决定改 CTA 跳转逻辑）
- `store/learningStore.ts`（Zustand store 结构已满足需求）
- `types/learning.ts`（`universeRoute?` 已预留）
- `config/learning-modules.ts`（`universeRoute` 映射已完备）
- Phase 2 所有功能页面

## 9. Lint 结果

```
> ocean-english@0.1.0 lint
> eslint
(无错误，无警告)
```

**✓ 通过**（修复了 `@next/next/no-assign-module-variable` — 将解构变量 `module` 重命名为 `learningModule`）

## 10. Build 结果

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 2.4s
✓ TypeScript 通过
✓ 14 个页面全部静态/动态生成成功

Route (app)
├ ○ /universe              ← 新增静态页
├ ƒ /universe/[module]     ← 新增动态页
└ ○ /visual-lab/cosmic-td  ← 新增静态页
```

**✓ 通过**，0 TypeScript 错误，0 构建警告。

---

*Report generated: 2026-06-01*
