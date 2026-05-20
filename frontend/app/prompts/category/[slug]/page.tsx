import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromptDirectory from "@/components/PromptDirectory";
import { fetchPrompts, apiToItem, promptCategories } from "@/lib/prompts";

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
