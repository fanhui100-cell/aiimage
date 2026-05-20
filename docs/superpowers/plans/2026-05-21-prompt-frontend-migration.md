# Prompt 前端迁移 + UX 修复 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **前置条件：** Plan A（prompt-backend-foundation）已完成，`/api/prompts/` 接口可用。

**Goal:** 把前端 prompt 数据源从硬编码静态数组迁移到后端 API，修复 3 个已知 Bug，并新增浏览/复制计数、服务端收藏（登录用户）。

**Architecture:** 主页 `/` 使用 SSR 在服务端请求 `/api/prompts/` 数据；详情页 `/prompts/[slug]` 同样 SSR 拉取，并在客户端调用 view++。PromptFavoriteButton 登录后调用后端 API，未登录保持 localStorage。

**Tech Stack:** Next.js 14 App Router (Server Components + Client Components) · TypeScript · Zustand · Axios (lib/api.ts)

---

## 文件结构

```
frontend/lib/prompts.ts                         ← 修改：加 API 函数，保留静态类型定义
frontend/app/page.tsx                           ← 修改：服务端 fetch 替换 getAllPrompts()
frontend/app/prompts/[slug]/page.tsx            ← 修改：服务端 fetch，加 view++ 触发
frontend/components/PromptCard.tsx              ← 修改：显示真实 example_image_url
frontend/components/PromptDirectory.tsx         ← 修改：修 Bug1（收藏最多排序）
frontend/components/PromptActions.tsx           ← 修改：修 Bug2（统一路径到生成台）
frontend/components/PromptFavoriteButton.tsx    ← 修改：修 Bug3（登录用户走后端 API）
frontend/components/PromptVisual.tsx            ← 查看是否存在，若无则需创建
```

---

### Task 1: API 客户端函数（lib/prompts.ts）

**Files:**
- Modify: `frontend/lib/prompts.ts`

在现有静态类型定义末尾追加 API 函数。**不删除现有静态数据**（SSG fallback 还需要它们做 `generateStaticParams`）。

- [ ] **Step 1: 读取现有 lib/prompts.ts**

确认现有 `PromptItem` 类型和静态数组的位置。

- [ ] **Step 2: 追加 API 类型和函数**

在文件末尾追加（不改动现有代码）：

```typescript
// ── API Types ──────────────────────────────────────────────

export type PromptStatAPI = {
  view_count: number;
  copy_count: number;
  favorite_count: number;
};

export type PromptAPI = {
  id: string;
  slug: string;
  title: string;
  model_name: string;    // 注意：后端用 model_name，前端类型用 model
  category: string;
  scenario: string;
  summary: string;
  prompt_zh: string;
  prompt_en: string;
  tags: string[];
  variables: string[];
  usage_tips: string[];
  difficulty: string;
  platform: string;
  output_type: string;
  aspect_ratio: string;
  visual: string;
  example_image_url: string | null;
  is_premium: boolean;
  author: string;
  popularity: number;
  updated_at: string;
  stat: PromptStatAPI | null;
  is_favorited: boolean;
};

export type PromptListAPI = {
  total: number;
  items: PromptAPI[];
};

// ── API helpers ────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchPrompts(params?: {
  q?: string;
  category?: string;
  model_name?: string;
  difficulty?: string;
  sort?: string;
  skip?: number;
  limit?: number;
}): Promise<PromptListAPI> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.category && params.category !== "全部") qs.set("category", params.category);
  if (params?.model_name && params.model_name !== "全部") qs.set("model_name", params.model_name);
  if (params?.difficulty && params.difficulty !== "全部") qs.set("difficulty", params.difficulty);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));

  const url = `${API_BASE}/api/prompts/?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`fetchPrompts failed: ${res.status}`);
  return res.json();
}

export async function fetchPromptBySlug(slug: string): Promise<PromptAPI | null> {
  const res = await fetch(`${API_BASE}/api/prompts/${slug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchPromptBySlug failed: ${res.status}`);
  return res.json();
}

/** 把 PromptAPI 转成前端组件使用的 PromptItem（做字段映射）*/
export function apiToItem(p: PromptAPI): PromptItem {
  return {
    slug: p.slug,
    title: p.title,
    model: p.model_name as PromptModel,
    category: p.category,
    scenario: p.scenario,
    summary: p.summary,
    tags: p.tags,
    visual: p.visual,
    popularity: p.popularity,
    difficulty: p.difficulty as PromptDifficulty,
    platform: p.platform,
    outputType: p.output_type,
    aspectRatio: p.aspect_ratio,
    updatedAt: p.updated_at,
    author: p.author,
    variables: p.variables,
    promptZh: p.prompt_zh,
    promptEn: p.prompt_en,
    usageTips: p.usage_tips,
    // 扩展字段（组件需要能读到）
    exampleImageUrl: p.example_image_url ?? undefined,
    isFavorited: p.is_favorited,
    stat: p.stat ?? undefined,
  };
}
```

同时在 `PromptItem` 类型定义（已有的那个）里追加三个可选字段：

```typescript
// 在已有 PromptItem 的末尾加：
  exampleImageUrl?: string;
  isFavorited?: boolean;
  stat?: { view_count: number; copy_count: number; favorite_count: number };
```

- [ ] **Step 3: TypeScript 编译验证**

```bash
cd frontend
npx tsc --noEmit 2>&1 | head -30
```

Expected: 无类型错误（或只有其他已有错误，不含 prompts.ts 相关错误）。

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/prompts.ts
git commit -m "feat: add API types and fetch helpers to lib/prompts.ts"
```

---

### Task 2: 主页改为服务端 Fetch

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: 读取现有 page.tsx**

确认当前主页如何调用 `getAllPrompts()` 和渲染 `PromptDirectory`。

- [ ] **Step 2: 替换数据源**

将 `getAllPrompts()` 替换为服务端 `fetchPrompts()`，并将结果映射为 `PromptItem[]`：

```typescript
// frontend/app/page.tsx
import PromptDirectory from "@/components/PromptDirectory";
import { fetchPrompts, apiToItem } from "@/lib/prompts";

export default async function Home() {
  let prompts;
  try {
    const data = await fetchPrompts({ limit: 100 });
    prompts = data.items.map(apiToItem);
  } catch {
    // 后端不可用时 fallback 到静态数据
    const { getAllPrompts } = await import("@/lib/prompts");
    prompts = getAllPrompts();
  }

  return <PromptDirectory prompts={prompts} />;
}
```

保留页面其他内容（navItems、quickSections 等静态部分不动）。如果原来 page.tsx 有其他内容（landing page 部分），只替换 getAllPrompts 的调用，其他保持不变。

- [ ] **Step 3: 验证 TypeScript**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: home page fetches prompts from backend API with static fallback"
```

---

### Task 3: 详情页改为服务端 Fetch + View 计数

**Files:**
- Modify: `frontend/app/prompts/[slug]/page.tsx`
- Create: `frontend/components/PromptViewTracker.tsx`

- [ ] **Step 1: 创建 PromptViewTracker 客户端组件**

详情页是 Server Component，不能直接用 useEffect。单独做一个 Client Component 来调用 view++：

```typescript
// frontend/components/PromptViewTracker.tsx
"use client";
import { useEffect } from "react";

export default function PromptViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/prompts/${slug}/view`, {
      method: "POST",
    }).catch(() => {}); // best-effort, ignore errors
  }, [slug]);
  return null;
}
```

- [ ] **Step 2: 修改详情页**

读取 `frontend/app/prompts/[slug]/page.tsx`，做以下修改：

1. 把 `getPromptBySlug(slug)` 替换为 `fetchPromptBySlug(slug)` + `apiToItem()`：

```typescript
import { fetchPromptBySlug, apiToItem, getAllPrompts } from "@/lib/prompts";
import PromptViewTracker from "@/components/PromptViewTracker";

// generateStaticParams 仍用静态数据（build 时需要）
export function generateStaticParams() {
  return getAllPrompts().map((p) => ({ slug: p.slug }));
}

export default async function PromptDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let prompt;
  try {
    const apiPrompt = await fetchPromptBySlug(slug);
    if (!apiPrompt) notFound();
    prompt = apiToItem(apiPrompt);
  } catch {
    // fallback 到静态数据
    const { getPromptBySlug } = await import("@/lib/prompts");
    const staticPrompt = getPromptBySlug(slug);
    if (!staticPrompt) notFound();
    prompt = staticPrompt;
  }

  // ... 其余不变
  return (
    <main ...>
      <PromptViewTracker slug={slug} />  {/* 加在 <main> 内任意位置 */}
      {/* 其余原有内容保持不变 */}
    </main>
  );
}
```

2. `generateMetadata` 同样改为从 API 拉取，fallback 静态：

```typescript
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await fetchPromptBySlug(slug);
    if (!p) return {};
    return {
      title: `${p.title} | Prompt123`,
      description: p.summary,
      openGraph: { title: p.title, description: p.summary, images: p.example_image_url ? [p.example_image_url] : [] },
    };
  } catch {
    const { getPromptBySlug } = await import("@/lib/prompts");
    const p = getPromptBySlug(slug);
    if (!p) return {};
    return { title: `${p.title} | Prompt123`, description: p.summary };
  }
}
```

- [ ] **Step 3: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/prompts/[slug]/page.tsx frontend/components/PromptViewTracker.tsx
git commit -m "feat: prompt detail page fetches from API, tracks view count"
```

---

### Task 4: PromptCard 显示真实效果图

**Files:**
- Modify: `frontend/components/PromptCard.tsx`
- Modify: `frontend/components/PromptVisual.tsx`（若存在）

- [ ] **Step 1: 读取 PromptCard.tsx 和 PromptVisual.tsx（如果存在）**

确认当前封面渲染逻辑（`PromptVisual` 组件还是内联 CSS）。

- [ ] **Step 2: 修改 PromptCard，优先显示真实图**

在 `PromptCard.tsx` 中，将封面区域从：
```tsx
<PromptVisual type={prompt.visual} />
```
改为：
```tsx
{prompt.exampleImageUrl ? (
  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
    <img
      src={prompt.exampleImageUrl}
      alt={prompt.title}
      className="h-full w-full object-cover transition group-hover:scale-105"
      loading="lazy"
    />
  </div>
) : (
  <PromptVisual type={prompt.visual} />
)}
```

- [ ] **Step 3: 在卡片底部显示浏览/复制数**

在卡片 `热度 {prompt.popularity}` 那行，追加 stat 数字（如果有）：

```tsx
<span className="text-xs text-slate-400">
  热度 {prompt.popularity}
  {prompt.stat && ` · 👁 ${prompt.stat.view_count} · 复制 ${prompt.stat.copy_count}`}
  · {prompt.updatedAt}
</span>
```

- [ ] **Step 4: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/PromptCard.tsx
git commit -m "feat: PromptCard shows real example image and stat counts"
```

---

### Task 5: 修 Bug 1 — "收藏最多"排序

**Files:**
- Modify: `frontend/components/PromptDirectory.tsx`

**现有 Bug（[PromptDirectory.tsx:58](frontend/components/PromptDirectory.tsx#L58)）：**
```ts
if (sort === "热门" || sort === "收藏最多") return b.popularity - a.popularity;
```
收藏最多和热门走了同一个排序逻辑。

- [ ] **Step 1: 修改排序逻辑**

读取 `frontend/components/PromptDirectory.tsx`，找到排序代码，替换为：

```typescript
return [...result].sort((a, b) => {
  if (sort === "收藏最多") {
    const aFav = a.stat?.favorite_count ?? 0;
    const bFav = b.stat?.favorite_count ?? 0;
    return bFav - aFav;
  }
  if (sort === "热门") return b.popularity - a.popularity;
  // 最新：按数组顺序（即 API 返回顺序，后端已按 created_at desc）
  return 0;
});
```

- [ ] **Step 2: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/PromptDirectory.tsx
git commit -m "fix: sort by real favorite_count instead of popularity"
```

---

### Task 6: 修 Bug 2 — PromptActions 统一路径

**Files:**
- Modify: `frontend/components/PromptActions.tsx`

**现有 Bug：**
- "使用此提示词生成" → `/dashboard?prompt=slug`：进入生成台时加载的是含 `{变量}` 占位符的原始 prompt_zh，用户看到未填变量的文本。
- `PromptVariableBuilder` 的"带入生成台" → `/dashboard?text=compiled`：正确。

**修复：** 统一走 `?text=` 路径，默认传入中文 prompt 原文（用户可在生成台自行修改）。

- [ ] **Step 1: 修改 PromptActions.tsx**

读取文件，找到 `href={/dashboard?prompt=${prompt.slug}}` 的 Link，替换为：

```tsx
<Link
  href={`/dashboard?text=${encodeURIComponent(prompt.promptZh)}`}
  className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
>
  使用此提示词生成
</Link>
```

- [ ] **Step 2: 同时追加复制计数 API 调用**

在 `copyPrompt` 函数中，复制成功后调用后端 copy++（best-effort）：

```typescript
async function copyPrompt() {
  await navigator.clipboard.writeText(prompt.promptZh);
  toast.success("提示词已复制");
  // best-effort copy count
  fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/prompts/${prompt.slug}/copy`, {
    method: "POST",
  }).catch(() => {});
}
```

- [ ] **Step 3: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/PromptActions.tsx
git commit -m "fix: PromptActions uses compiled text path and tracks copy count"
```

---

### Task 7: 修 Bug 3 — 收藏走后端 API（登录用户）

**Files:**
- Modify: `frontend/components/PromptFavoriteButton.tsx`

**现有问题：** 收藏仅存 localStorage，换设备丢失，且后端 `favorite_count` 无法统计。

**修复策略：** 登录用户走后端 API；未登录用户保持 localStorage（保留兜底）。

- [ ] **Step 1: 修改 PromptFavoriteButton.tsx**

读取现有文件，完整替换为：

```typescript
// frontend/components/PromptFavoriteButton.tsx
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "prompt123:favorites";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readLocalFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeLocalFavorites(favorites: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
}

export default function PromptFavoriteButton({
  slug,
  compact = false,
  initialFavorited = false,
  initialCount,
}: {
  slug: string;
  compact?: boolean;
  initialFavorited?: boolean;
  initialCount?: number;
}) {
  const { token } = useAuth();
  const [active, setActive] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (!token) {
      setActive(readLocalFavorites().has(slug));
    } else {
      setActive(initialFavorited);
    }
  }, [slug, token, initialFavorited]);

  async function toggleFavorite() {
    if (token) {
      // 登录用户：调用后端
      try {
        const res = await fetch(`${API_BASE}/api/prompts/${slug}/favorite`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setActive(data.favorited);
        setCount(data.favorite_count);
        toast.success(data.favorited ? "已收藏" : "已取消收藏");
      } catch {
        toast.error("操作失败，请重试");
      }
    } else {
      // 未登录：localStorage
      const favorites = readLocalFavorites();
      if (favorites.has(slug)) {
        favorites.delete(slug);
        setActive(false);
        toast.success("已取消收藏");
      } else {
        favorites.add(slug);
        setActive(true);
        toast.success("已收藏（登录后可同步到云端）");
      }
      writeLocalFavorites(favorites);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={active}
      aria-label={active ? "取消收藏" : "收藏提示词"}
      className={`inline-flex items-center justify-center rounded-lg border transition ${
        active
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-950"
      } ${compact ? "h-9 w-9 text-sm" : "gap-2 px-4 py-3 text-sm font-semibold"}`}
    >
      <span>{active ? "★" : "☆"}</span>
      {!compact && (
        <span>
          {active ? "已收藏" : "收藏"}
          {count != null && count > 0 && <span className="ml-1 text-xs opacity-70">{count}</span>}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: 更新 PromptCard 传入 initialFavorited 和 initialCount**

在 `frontend/components/PromptCard.tsx` 里，将 `<PromptFavoriteButton slug={prompt.slug} compact />` 改为：

```tsx
<PromptFavoriteButton
  slug={prompt.slug}
  compact
  initialFavorited={prompt.isFavorited}
  initialCount={prompt.stat?.favorite_count}
/>
```

在 `frontend/app/prompts/[slug]/page.tsx` 里的 PromptActions 中也要传 initialFavorited。找到 `<PromptActions prompt={prompt} />` 的渲染，确认 PromptActions 内部的 PromptFavoriteButton 调用，传入 initialFavorited：

```tsx
<PromptFavoriteButton
  slug={prompt.slug}
  initialFavorited={prompt.isFavorited}
  initialCount={prompt.stat?.favorite_count}
/>
```

- [ ] **Step 3: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/PromptFavoriteButton.tsx frontend/components/PromptCard.tsx frontend/app/prompts/[slug]/page.tsx frontend/components/PromptActions.tsx
git commit -m "fix: server-side favorites for logged-in users, localStorage fallback for guests"
```

---

## 自检：Spec 覆盖确认

| 需求 | 覆盖 Task |
|------|-----------|
| 前端从后端 API 拉取 prompt 列表 | Task 2 |
| 详情页从后端拉取 + 增加浏览数 | Task 3 |
| 卡片显示真实效果图 | Task 4 |
| 卡片显示浏览/复制数 | Task 4 |
| Bug1 修复（收藏最多排序） | Task 5 |
| Bug2 修复（统一生成台路径） | Task 6 |
| 复制计数后端同步 | Task 6 |
| Bug3 修复（服务端收藏） | Task 7 |
| 未登录用户 localStorage 兜底 | Task 7 |
