import type { Metadata } from "next";
import Link from "next/link";
import PromptCard from "@/components/PromptCard";
import { apiToItem } from "@/lib/prompts";
import type { PromptAPI } from "@/lib/prompts";

export const metadata: Metadata = {
  title: "热门 Prompt 排行榜 | Prompt123",
  description: "本周浏览量最高的 AI 提示词，GPT-Image-2 / Nano Banana / Midjourney，中文可用。",
};

export const revalidate = 3600;

export default async function HotPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let prompts: ReturnType<typeof apiToItem>[] = [];

  try {
    const res = await fetch(`${API_BASE}/api/prompts/hot?limit=20`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json() as { items: PromptAPI[] };
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
