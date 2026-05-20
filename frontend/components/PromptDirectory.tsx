"use client";

import { useMemo, useState } from "react";
import type { PromptDifficulty, PromptItem, PromptModel } from "@/lib/prompts";
import { hotSearches, promptCategories, promptCollections, promptDifficulties, promptModels } from "@/lib/prompts";
import PromptCard from "@/components/PromptCard";

type SortMode = "最新" | "热门" | "收藏最多";

function SearchIcon() {
  return (
    <span className="relative h-4 w-4 rounded-full border border-current opacity-70">
      <span className="absolute -bottom-1 -right-1 h-2 w-px rotate-[-45deg] bg-current" />
    </span>
  );
}

const modelIntros = [
  { model: "GPT-Image-2", desc: "电商主图、活动海报、中文排版留白", tone: "bg-slate-950 text-white" },
  { model: "Nano Banana", desc: "参考图编辑、人物一致性、局部重绘", tone: "bg-emerald-50 text-emerald-800" },
  { model: "Midjourney", desc: "品牌氛围、海报视觉、风格探索", tone: "bg-violet-50 text-violet-800" },
  { model: "Video", desc: "短视频开场、镜头调度、转场描述", tone: "bg-amber-50 text-amber-800" },
];

export default function PromptDirectory({ prompts }: { prompts: PromptItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [model, setModel] = useState<"全部" | PromptModel>("全部");
  const [difficulty, setDifficulty] = useState<"全部" | PromptDifficulty>("全部");
  const [sort, setSort] = useState<SortMode>("热门");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = prompts.filter((prompt) => {
      const matchQuery =
        !keyword ||
        [
          prompt.title,
          prompt.model,
          prompt.category,
          prompt.scenario,
          prompt.summary,
          prompt.platform,
          prompt.outputType,
          prompt.difficulty,
          ...prompt.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchCategory = category === "全部" || prompt.category === category;
      const matchModel = model === "全部" || prompt.model === model;
      const matchDifficulty = difficulty === "全部" || prompt.difficulty === difficulty;
      return matchQuery && matchCategory && matchModel && matchDifficulty;
    });

    return [...result].sort((a, b) => {
      if (sort === "收藏最多") {
        const aFav = a.stat?.favorite_count ?? 0;
        const bFav = b.stat?.favorite_count ?? 0;
        return bFav - aFav;
      }
      if (sort === "热门") return b.popularity - a.popularity;
      return 0;
    });
  }, [category, difficulty, model, prompts, query, sort]);

  function applyQuery(value: string) {
    setQuery(value);
    window.requestAnimationFrame(() => {
      document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function renderSearchBox(className = "border-slate-200 bg-white text-slate-500 shadow-sm") {
    return (
      <form
        className={`flex h-14 items-center gap-3 rounded-xl border px-4 ${className}`}
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          placeholder="搜索提示词、模型、主题或关键词，例如：淘宝主图 / Nano Banana / 人物写真"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-xs font-semibold text-slate-400 hover:text-slate-950">
            清空
          </button>
        )}
        <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          搜索
        </button>
      </form>
    );
  }

  return (
    <>
      <section className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-8">
          <a href="#" className="hidden shrink-0 items-center gap-3 md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              提
            </span>
            <span className="text-sm font-semibold text-slate-950">Prompt123</span>
          </a>
          <div className="min-w-0 flex-1">{renderSearchBox()}</div>
          <a href="/prompts/hot" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 lg:block">
            🔥 热门榜
          </a>
          <a href="/prompts/pack" className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 lg:block">
            📦 Pack 下载
          </a>
          <a href="/dashboard" className="hidden rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 lg:block">
            生成台
          </a>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#10111f] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold tracking-[0.34em] text-indigo-300">NEXT-GEN PROMPT DIRECTORY</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            高质量中文 AI 提示词
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
            收集 GPT-Image-2、Gemini Nano Banana、Midjourney、视频生成等平台的中文提示词，按模型、场景和行业整理。
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {promptCollections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => applyQuery(collection.query)}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/30"
              >
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-950">{collection.tag}</span>
                <h2 className="mt-4 text-lg font-semibold text-white">{collection.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{collection.desc}</p>
              </button>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left shadow-2xl shadow-black/25 backdrop-blur">
            {renderSearchBox("border-white/10 bg-slate-950/70 text-slate-400 shadow-none [&_input]:text-white [&_input]:placeholder:text-slate-500")}

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">分类</span>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  {promptCategories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">模型</span>
                <select value={model} onChange={(event) => setModel(event.target.value as "全部" | PromptModel)} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  {promptModels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">难度</span>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as "全部" | PromptDifficulty)} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  {promptDifficulties.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">排序方式</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  <option>热门</option>
                  <option>最新</option>
                  <option>收藏最多</option>
                </select>
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                <SearchIcon /> 热门搜索
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {hotSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => applyQuery(item)}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 hover:border-indigo-400 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-left md:grid-cols-4">
            {modelIntros.map((item) => (
              <button
                key={item.model}
                onClick={() => setModel(item.model as PromptModel)}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/30"
              >
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>{item.model}</span>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="directory" className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Prompt Library</p>
            <h2 className="mt-1 text-3xl font-semibold text-slate-950">全部提示词</h2>
          </div>
          <p className="text-sm text-slate-500">找到 {filtered.length} 条结果</p>
        </div>

        {filtered.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((prompt) => (
              <PromptCard key={prompt.slug} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            没有找到匹配的提示词，试试换一个关键词或分类。
          </div>
        )}
      </section>
    </>
  );
}
