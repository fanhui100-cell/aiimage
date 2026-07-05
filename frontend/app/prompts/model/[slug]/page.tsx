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
