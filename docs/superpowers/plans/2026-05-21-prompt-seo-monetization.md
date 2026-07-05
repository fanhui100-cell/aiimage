# Prompt SEO + 热门榜 + 商业化 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **前置条件：** Plan A + Plan B 均已完成。后端 `/api/prompts/` 正常，前端从 API 拉取数据。

**Goal:** 新增分类/模型 SEO 静态页、JSON-LD 结构化数据、热门榜、Premium Prompt 会员解锁、Prompt Pack 积分下载。

**Architecture:** Next.js `generateStaticParams` 在 build 时生成所有 category/model 静态页面，ISR revalidate=3600 保持更新。热门榜为独立页面 `/prompts/hot`，服务端按 `view_count` 取 Top 20。Premium 字段 `is_premium=true` 的 prompt 在未登录或 `tier=free` 时隐藏 prompt 内容，只显示模糊预览。Prompt Pack 是后端新接口，返回选定 prompt 的 ZIP 文件，消耗积分。

**Tech Stack:** Next.js 14 App Router · TypeScript · JSON-LD (inline script) · Python zipfile (标准库) · FastAPI StreamingResponse

---

## 文件结构

```
frontend/app/prompts/category/[slug]/page.tsx    ← 新建：分类 SEO 页
frontend/app/prompts/model/[slug]/page.tsx       ← 新建：模型 SEO 页
frontend/app/prompts/hot/page.tsx                ← 新建：热门榜页
frontend/app/prompts/[slug]/page.tsx             ← 修改：加 JSON-LD + Premium 锁
frontend/components/PromptJsonLd.tsx             ← 新建：JSON-LD script 组件
frontend/components/PremiumLock.tsx              ← 新建：Premium 锁屏组件
backend/app/routers/prompts.py                   ← 修改：加 /hot、/pack 接口
backend/app/schemas/prompt.py                    ← 修改：加 PromptPackOut schema
```

---

### Task 1: 分类 SEO 静态页 `/prompts/category/[slug]`

**Files:**
- Create: `frontend/app/prompts/category/[slug]/page.tsx`

为每个分类生成独立的 SEO 页面，如 `/prompts/category/电商商品图`（slug 用 URL encode）。

- [ ] **Step 1: 创建分类页**

```typescript
// frontend/app/prompts/category/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromptDirectory from "@/components/PromptDirectory";
import { fetchPrompts, apiToItem, promptCategories } from "@/lib/prompts";

// 分类 → URL slug 映射（中文直接 encodeURIComponent）
const CATEGORIES = promptCategories.filter((c) => c !== "全部");

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: encodeURIComponent(cat) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  if (!CATEGORIES.includes(category)) return {};
  return {
    title: `${category} AI 提示词合集 | Prompt123`,
    description: `收录 GPT-Image-2、Nano Banana、Midjourney 等模型的${category}提示词，中文可用，无需翻墙。`,
    alternates: { canonical: `/prompts/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  if (!CATEGORIES.includes(category)) notFound();

  let prompts;
  try {
    const data = await fetchPrompts({ category, limit: 100 });
    prompts = data.items.map(apiToItem);
  } catch {
    const { getAllPrompts } = await import("@/lib/prompts");
    prompts = getAllPrompts().filter((p) => p.category === category);
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <a href="/" className="hover:text-slate-950">首页</a>
          {" / "}
          <span className="font-semibold text-slate-950">{category}</span>
        </nav>
        <h1 className="mb-2 text-3xl font-semibold text-slate-950">{category} 提示词</h1>
        <p className="mb-8 text-slate-500">共 {prompts.length} 条，适用于 GPT-Image-2 / Nano Banana / Midjourney</p>
      </div>
      <PromptDirectory prompts={prompts} />
    </main>
  );
}
```

- [ ] **Step 2: TypeScript 验证**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/prompts/category/
git commit -m "feat: category SEO static pages /prompts/category/[slug]"
```

---

### Task 2: 模型 SEO 静态页 `/prompts/model/[slug]`

**Files:**
- Create: `frontend/app/prompts/model/[slug]/page.tsx`

- [ ] **Step 1: 创建模型页**

```typescript
// frontend/app/prompts/model/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromptDirectory from "@/components/PromptDirectory";
import { fetchPrompts, apiToItem, promptModels } from "@/lib/prompts";

const MODEL_DESCS: Record<string, string> = {
  "GPT-Image-2": "OpenAI GPT-Image-2 中文提示词合集，电商主图、海报、排版一键生成，国内直接访问。",
  "Nano Banana": "Gemini Nano Banana 参考图编辑提示词，人物一致性、局部重绘、3D 手办。",
  "Midjourney": "Midjourney 品牌设计、电影感海报、艺术风格探索提示词，中文整理。",
  "Video": "AI 视频生成提示词：可灵、即梦、Seedance，短视频开场和 Vlog 转场镜头描述。",
};

const MODELS = promptModels.filter((m) => m !== "全部") as string[];

export function generateStaticParams() {
  return MODELS.map((m) => ({ slug: encodeURIComponent(m) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const model = decodeURIComponent(slug);
  if (!MODELS.includes(model)) return {};
  return {
    title: `${model} 提示词合集 | Prompt123`,
    description: MODEL_DESCS[model] ?? `${model} 中文 AI 提示词，收藏、复制、一键带入生成台。`,
    alternates: { canonical: `/prompts/model/${slug}` },
  };
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const model = decodeURIComponent(slug);
  if (!MODELS.includes(model)) notFound();

  let prompts;
  try {
    const data = await fetchPrompts({ model_name: model, limit: 100 });
    prompts = data.items.map(apiToItem);
  } catch {
    const { getAllPrompts } = await import("@/lib/prompts");
    prompts = getAllPrompts().filter((p) => p.model === model);
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <a href="/" className="hover:text-slate-950">首页</a>
          {" / "}
          <span className="font-semibold text-slate-950">{model}</span>
        </nav>
        <h1 className="mb-2 text-3xl font-semibold text-slate-950">{model} 提示词</h1>
        <p className="mb-4 text-slate-500">{MODEL_DESCS[model]}</p>
        <p className="mb-8 text-sm text-slate-400">共 {prompts.length} 条提示词</p>
      </div>
      <PromptDirectory prompts={prompts} />
    </main>
  );
}
```

- [ ] **Step 2: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
git add frontend/app/prompts/model/
git commit -m "feat: model SEO static pages /prompts/model/[slug]"
```

---

### Task 3: JSON-LD 结构化数据 + OpenGraph 增强

**Files:**
- Create: `frontend/components/PromptJsonLd.tsx`
- Modify: `frontend/app/prompts/[slug]/page.tsx`

- [ ] **Step 1: 创建 PromptJsonLd 组件**

```typescript
// frontend/components/PromptJsonLd.tsx
import type { PromptItem } from "@/lib/prompts";

export default function PromptJsonLd({ prompt }: { prompt: PromptItem }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: prompt.title,
    description: prompt.summary,
    step: [
      {
        "@type": "HowToStep",
        text: `选择模型：${prompt.model}`,
      },
      {
        "@type": "HowToStep",
        text: `使用提示词：${prompt.promptZh.slice(0, 200)}`,
      },
    ],
    tool: [{ "@type": "HowToTool", name: prompt.platform }],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: 在详情页引入 PromptJsonLd**

读取 `frontend/app/prompts/[slug]/page.tsx`，在 `<main>` 的第一行加：

```tsx
import PromptJsonLd from "@/components/PromptJsonLd";

// 在 return 的 <main> 内第一行：
<PromptJsonLd prompt={prompt} />
```

- [ ] **Step 3: 在 layout.tsx 里加全局 OpenGraph site name**

读取 `frontend/app/layout.tsx`，在 `export const metadata` 里追加：

```typescript
export const metadata: Metadata = {
  // ... 现有内容 ...
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://prompt123.com"),
  openGraph: {
    siteName: "Prompt123",
    locale: "zh_CN",
  },
  twitter: { card: "summary_large_image" },
};
```

- [ ] **Step 4: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
git add frontend/components/PromptJsonLd.tsx frontend/app/prompts/[slug]/page.tsx frontend/app/layout.tsx
git commit -m "feat: JSON-LD structured data and enhanced OpenGraph for prompt pages"
```

---

### Task 4: 热门榜 `/prompts/hot`

**Files:**
- Modify: `backend/app/routers/prompts.py`（加 `/hot` 接口）
- Create: `frontend/app/prompts/hot/page.tsx`

- [ ] **Step 1: 后端加 `/api/prompts/hot` 接口**

读取 `backend/app/routers/prompts.py`，在 `@router.get("/favorites", ...)` 之前插入（注意 `/hot` 要在 `/{slug}` 之前）：

```python
@router.get("/hot", response_model=PromptListOut)
def get_hot_prompts(
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Top prompts by view_count in the last 7 days (using total for MVP)."""
    items = (
        db.query(Prompt)
        .outerjoin(PromptStat, Prompt.id == PromptStat.prompt_id)
        .order_by(PromptStat.view_count.desc().nulls_last())
        .limit(limit)
        .all()
    )
    return PromptListOut(total=len(items), items=[_prompt_to_out(p, db) for p in items])
```

- [ ] **Step 2: 创建热门榜前端页面**

```typescript
// frontend/app/prompts/hot/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import PromptCard from "@/components/PromptCard";
import { fetchPrompts, apiToItem } from "@/lib/prompts";

export const metadata: Metadata = {
  title: "热门 Prompt 排行榜 | Prompt123",
  description: "本周浏览量最高的 AI 提示词，GPT-Image-2 / Nano Banana / Midjourney，中文可用。",
};

export const revalidate = 3600; // 每小时更新

export default async function HotPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let prompts: ReturnType<typeof apiToItem>[] = [];

  try {
    const res = await fetch(`${API_BASE}/api/prompts/hot?limit=20`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      prompts = data.items.map(apiToItem);
    }
  } catch {
    const { getAllPrompts } = await import("@/lib/prompts");
    prompts = getAllPrompts().slice(0, 20);
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">首页</Link>
          {" / "}
          <span className="font-semibold text-slate-950">热门榜</span>
        </nav>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600">HOT PROMPTS</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">热门提示词排行</h1>
            <p className="mt-2 text-slate-500">按浏览量实时排序，每小时更新</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {prompts.map((prompt, idx) => (
            <div key={prompt.slug} className="relative">
              {idx < 3 && (
                <div className={`absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                  idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-400" : "bg-orange-400"
                }`}>
                  {idx + 1}
                </div>
              )}
              <PromptCard prompt={prompt} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
cd .. && git add frontend/app/prompts/hot/ backend/app/routers/prompts.py
git commit -m "feat: hot prompts ranking page and /api/prompts/hot endpoint"
```

---

### Task 5: Premium Prompt 会员解锁

**Files:**
- Create: `frontend/components/PremiumLock.tsx`
- Modify: `frontend/app/prompts/[slug]/page.tsx`

Premium prompt（`is_premium=true`）的 prompt_zh / prompt_en 在服务端正常返回，但前端根据用户 `tier` 决定是否显示。未登录或 `tier=free` 时展示锁屏遮罩。

- [ ] **Step 1: 给 PromptItem 确认 is_premium 字段**

`apiToItem()` 中已经从 API 读取 `is_premium`，加入 PromptItem 扩展字段。在 `frontend/lib/prompts.ts` 的 PromptItem 类型追加（如 Task 1 Plan B 未加）：

```typescript
  isPremium?: boolean;
```

在 `apiToItem()` 中加入：
```typescript
  isPremium: p.is_premium,
```

- [ ] **Step 2: 创建 PremiumLock 组件**

```typescript
// frontend/components/PremiumLock.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function PremiumLock({ children }: { children: React.ReactNode }) {
  const { token, tier } = useAuth();
  const isUnlocked = token && tier === "paid";

  if (isUnlocked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
      <div className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-amber-50/80 p-6 text-center backdrop-blur-sm">
        <span className="text-3xl">🔒</span>
        <div>
          <p className="text-base font-semibold text-amber-900">付费会员专属提示词</p>
          <p className="mt-1 text-sm text-amber-700">购买积分套餐（标准包及以上）即可解锁</p>
        </div>
        <Link
          href="/credits"
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
        >
          立即解锁
        </Link>
        {!token && (
          <p className="text-xs text-amber-600">
            已购买？<Link href="/login" className="underline">登录</Link>后查看
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 在详情页使用 PremiumLock**

读取 `frontend/app/prompts/[slug]/page.tsx`，找到"中文提示词"和"英文提示词"两个 section，用 PremiumLock 包裹（仅当 `prompt.isPremium` 为 true 时）：

```tsx
import PremiumLock from "@/components/PremiumLock";

// 中文提示词 section：
{prompt.isPremium ? (
  <PremiumLock>
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">中文提示词</h2>
      <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {prompt.promptZh}
      </p>
    </section>
  </PremiumLock>
) : (
  <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-slate-950">中文提示词</h2>
    <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
      {prompt.promptZh}
    </p>
  </section>
)}
```

对英文提示词 section 做同样处理。

- [ ] **Step 4: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
git add frontend/components/PremiumLock.tsx frontend/app/prompts/[slug]/page.tsx frontend/lib/prompts.ts
git commit -m "feat: premium prompt lock for free users with member unlock CTA"
```

---

### Task 6: Prompt Pack 积分下载

**Files:**
- Modify: `backend/app/routers/prompts.py`（加 `/pack` 接口）
- Modify: `backend/app/schemas/prompt.py`
- Create: `frontend/app/prompts/pack/page.tsx`

Prompt Pack：用户选择一组 prompt slug，消耗 N 积分，下载包含所有 prompt 文本的 ZIP 文件。MVP：每个 slug 消耗 1 积分，最多 20 个 slug。

- [ ] **Step 1: 后端加 `/api/prompts/pack` 接口**

在 `backend/app/schemas/prompt.py` 追加：

```python
class PromptPackRequest(BaseModel):
    slugs: list[str]  # 1-20 个 slug
```

在 `backend/app/routers/prompts.py` 追加（在 `/{slug}` 路由之前）：

```python
import io
import zipfile
from fastapi.responses import StreamingResponse
from app.schemas.prompt import PromptPackRequest
from sqlalchemy import update as sql_update

@router.post("/pack")
def download_pack(
    body: PromptPackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not 1 <= len(body.slugs) <= 20:
        raise HTTPException(status_code=400, detail="请选择 1-20 个提示词")
    
    prompts = db.query(Prompt).filter(Prompt.slug.in_(body.slugs)).all()
    if not prompts:
        raise HTTPException(status_code=404, detail="未找到提示词")
    
    # is_premium prompts require paid tier
    has_premium = any(p.is_premium for p in prompts)
    if has_premium and current_user.tier != "paid":
        raise HTTPException(status_code=403, detail="高级提示词需要付费会员")
    
    cost = len(prompts)  # 1 积分 / 个
    result = db.execute(
        sql_update(User)
        .where(User.id == current_user.id, User.credit_balance >= cost)
        .values(credit_balance=User.credit_balance - cost)
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=402, detail=f"积分不足，需要 {cost} 积分")
    
    # Build ZIP in memory
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in prompts:
            content = (
                f"# {p.title}\n"
                f"模型：{p.model_name} | 平台：{p.platform} | 难度：{p.difficulty}\n"
                f"场景：{p.scenario}\n\n"
                f"## 中文提示词\n{p.prompt_zh}\n\n"
                f"## English Prompt\n{p.prompt_en}\n\n"
                f"## 使用建议\n" + "\n".join(f"- {t}" for t in (p.usage_tips or [])) + "\n"
            )
            zf.writestr(f"{p.slug}.txt", content)
        zf.writestr("README.txt", f"Prompt Pack | {len(prompts)} 个提示词\n来自 Prompt123\n")
    buf.seek(0)
    
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="prompt-pack-{len(prompts)}.zip"'},
    )
```

- [ ] **Step 2: 创建前端 Prompt Pack 页面**

```typescript
// frontend/app/prompts/pack/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getAllPrompts } from "@/lib/prompts";

const ALL_PROMPTS = getAllPrompts();
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function PromptPackPage() {
  const { token, creditBalance, updateBalance } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        if (next.size >= 20) {
          toast.error("最多选择 20 个提示词");
          return prev;
        }
        next.add(slug);
      }
      return next;
    });
  }

  async function download() {
    if (!token) { toast.error("请先登录"); return; }
    if (selected.size === 0) { toast.error("请至少选择 1 个提示词"); return; }
    if (creditBalance < selected.size) {
      toast.error(`积分不足，需要 ${selected.size} 积分，当前 ${creditBalance}`);
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/prompts/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slugs: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail ?? "下载失败");
        return;
      }
      updateBalance(creditBalance - selected.size);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-pack-${selected.size}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`已下载 ${selected.size} 个提示词（消耗 ${selected.size} 积分）`);
    } finally {
      setDownloading(false);
    }
  }

  const cost = selected.size;

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">首页</Link>
          {" / "}
          <span className="font-semibold text-slate-950">Prompt Pack 下载</span>
        </nav>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Prompt Pack 打包下载</h1>
          <p className="mt-2 text-slate-500">选择提示词，打包成 ZIP 下载到本地，1 积分 / 个，最多 20 个。</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              已选 <span className="font-semibold text-slate-950">{selected.size}</span> 个
              · 消耗 <span className="font-semibold text-indigo-600">{cost} 积分</span>
              {token && <span className="ml-2 text-slate-400">（余额 {creditBalance}）</span>}
            </div>
            <button
              onClick={download}
              disabled={downloading || selected.size === 0}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {downloading ? "打包中…" : "下载 ZIP"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {ALL_PROMPTS.map((p) => (
            <label
              key={p.slug}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                selected.has(p.slug)
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.slug)}
                onChange={() => toggle(p.slug)}
                className="mt-1 accent-indigo-600"
              />
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{p.model} · {p.category}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
cd .. && git add frontend/app/prompts/pack/ backend/app/routers/prompts.py backend/app/schemas/prompt.py
git commit -m "feat: Prompt Pack credit-gated ZIP download"
```

---

### Task 7: 导航栏加入新页面入口

**Files:**
- Modify: `frontend/components/PromptDirectory.tsx`（顶部导航）
- Modify: `frontend/app/layout.tsx` 或 `frontend/app/page.tsx`（如有全局导航）

在 PromptDirectory 顶部导航栏加入"热门榜"和"Prompt Pack"入口：

- [ ] **Step 1: 修改 PromptDirectory 导航**

读取 `frontend/components/PromptDirectory.tsx`，找到顶部 nav 区域（含"生成台"按钮），追加：

```tsx
<a href="/prompts/hot" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 lg:block">
  🔥 热门榜
</a>
<a href="/prompts/pack" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 lg:block">
  📦 Pack 下载
</a>
<a href="/dashboard" className="hidden rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 lg:block">
  生成台
</a>
```

- [ ] **Step 2: TypeScript 验证 + Commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
git add frontend/components/PromptDirectory.tsx
git commit -m "feat: add hot rankings and pack download links to nav"
```

---

## 自检：Spec 覆盖确认

| 需求 | 覆盖 Task |
|------|-----------|
| `/prompts/category/[slug]` SEO 页 | Task 1 |
| `/prompts/model/[slug]` SEO 页 | Task 2 |
| JSON-LD 结构化数据 | Task 3 |
| OpenGraph 增强 | Task 3 |
| 热门榜 `/prompts/hot` | Task 4 |
| Premium Prompt 会员解锁 | Task 5 |
| Prompt Pack 积分下载 | Task 6 |
| 导航入口 | Task 7 |
