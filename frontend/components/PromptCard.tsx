import Link from "next/link";
import type { PromptItem } from "@/lib/prompts";
import PromptVisual from "@/components/PromptVisual";

export default function PromptCard({ prompt }: { prompt: PromptItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <PromptVisual type={prompt.visual} />
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white">
            {prompt.model}
          </span>
          {prompt.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{prompt.title}</h3>
        <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{prompt.summary}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">热度 {prompt.popularity}</span>
          <Link href={`/prompts/${prompt.slug}`} className="text-sm font-semibold text-slate-950">
            查看提示词
          </Link>
        </div>
      </div>
    </article>
  );
}
