import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PromptActions from "@/components/PromptActions";
import PromptCard from "@/components/PromptCard";
import PromptVisual from "@/components/PromptVisual";
import PromptVariableBuilder from "@/components/PromptVariableBuilder";
import PromptViewTracker from "@/components/PromptViewTracker";
import { getAllPrompts, getPromptBySlug, getRelatedPrompts, fetchPromptBySlug, apiToItem } from "@/lib/prompts";

export function generateStaticParams() {
  return getAllPrompts().map((prompt) => ({ slug: prompt.slug }));
}

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
    const p = getPromptBySlug(slug);
    if (!p) return {};
    return { title: `${p.title} | Prompt123`, description: p.summary };
  }
}

export default async function PromptDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let prompt;
  try {
    const apiPrompt = await fetchPromptBySlug(slug);
    if (!apiPrompt) notFound();
    prompt = apiToItem(apiPrompt);
  } catch {
    const staticPrompt = getPromptBySlug(slug);
    if (!staticPrompt) notFound();
    prompt = staticPrompt;
  }

  const related = getRelatedPrompts(prompt);

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <PromptViewTracker slug={slug} />
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              提
            </span>
            <span className="font-semibold text-slate-950">Prompt123</span>
          </Link>
          <Link href="/dashboard" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            生成台
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[420px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <PromptVisual type={prompt.visual} />
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{prompt.model}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{prompt.category}</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{prompt.difficulty}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{prompt.title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{prompt.summary}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{prompt.platform}</div>
                  <div className="mt-1">适用平台</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{prompt.aspectRatio}</div>
                  <div className="mt-1">推荐比例</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{prompt.outputType}</div>
                  <div className="mt-1">输出类型</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{prompt.updatedAt}</div>
                  <div className="mt-1">最近更新</div>
                </div>
              </div>
              <div className="mt-5">
                <PromptActions prompt={prompt} />
              </div>
          </div>
        </aside>

        <article className="space-y-6">
          <PromptVariableBuilder prompt={prompt} />

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-indigo-600">适用场景</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{prompt.scenario}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {prompt.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">中文提示词</h2>
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {prompt.promptZh}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">英文提示词</h2>
            <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm leading-7 text-slate-100">
              {prompt.promptEn}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">使用建议</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {prompt.usageTips.map((tip) => (
                <li key={tip} className="rounded-lg bg-slate-50 px-4 py-3">
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </article>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-8">
          <div className="mb-5">
            <p className="text-sm font-semibold text-indigo-600">Related Prompts</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">相关推荐</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <PromptCard key={item.slug} prompt={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
