import Link from "next/link";
import type { PromptItem } from "@/lib/prompts";
import PromptFavoriteButton from "@/components/PromptFavoriteButton";
import PromptVisual from "@/components/PromptVisual";

export default function PromptCard({ prompt }: { prompt: PromptItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <div className="relative">
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
        <div className="absolute right-3 top-3">
          <PromptFavoriteButton
            slug={prompt.slug}
            compact
            initialFavorited={prompt.isFavorited}
            initialCount={prompt.stat?.favorite_count}
          />
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white">
            {prompt.model}
          </span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
            {prompt.difficulty}
          </span>
          {prompt.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{prompt.title}</h3>
        <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">{prompt.summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
          <div>
            <div className="font-semibold text-slate-800">{prompt.aspectRatio}</div>
            <div>比例</div>
          </div>
          <div>
            <div className="truncate font-semibold text-slate-800">{prompt.outputType}</div>
            <div>类型</div>
          </div>
          <div>
            <div className="truncate font-semibold text-slate-800">{prompt.platform}</div>
            <div>平台</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            热度 {prompt.popularity}
            {prompt.stat && ` · 👁 ${prompt.stat.view_count} · 复制 ${prompt.stat.copy_count}`}
            {" · "}{prompt.updatedAt}
          </span>
          <Link href={`/prompts/${prompt.slug}`} className="text-sm font-semibold text-slate-950">
            查看提示词
          </Link>
        </div>
      </div>
    </article>
  );
}
