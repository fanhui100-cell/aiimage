import Link from "next/link";
import PromptCard from "@/components/PromptCard";
import PromptDirectory from "@/components/PromptDirectory";
import { getAllPrompts, fetchPrompts, apiToItem } from "@/lib/prompts";

const navItems = [
  { label: "首页", href: "#" },
  { label: "搜索", href: "#directory" },
  { label: "GPT-Image-2", href: "#gpt-image-2" },
  { label: "Nano Banana", href: "#nano-banana" },
  { label: "Midjourney", href: "#midjourney" },
  { label: "视频提示词", href: "#video" },
];

const quickSections = [
  { title: "精选分类", desc: "按平台、用途和画面风格快速筛选", items: ["商品主图", "场景图", "海报", "人物", "Logo", "视频"] },
  { title: "结构化标签", desc: "把复杂提示词拆成可组合的模块", items: ["主体", "场景", "光线", "镜头", "材质", "比例"] },
  { title: "近期热门", desc: "围绕当下高频玩法持续更新", items: ["手办", "证件照", "国潮", "赛博", "水彩", "质感"] },
];

const topicMap = [
  {
    id: "gpt-image-2",
    eyebrow: "GPT-IMAGE-2",
    title: "GPT-Image-2 电商商品图",
    desc: "适合商品主体保真、平台主图、促销海报和中文本地化视觉。",
    model: "GPT-Image-2",
  },
  {
    id: "nano-banana",
    eyebrow: "GEMINI NANO BANANA",
    title: "Gemini Nano Banana 图片编辑",
    desc: "适合参考图延展、局部编辑、人物一致性和创意合成。",
    model: "Nano Banana",
  },
  {
    id: "midjourney",
    eyebrow: "MIDJOURNEY / DESIGN",
    title: "风格灵感与视觉实验",
    desc: "适合海报、Logo、空间氛围、插画角色和高审美风格探索。",
    model: "Midjourney",
  },
  {
    id: "video",
    eyebrow: "VIDEO PROMPT",
    title: "视频分镜与动态图像",
    desc: "为可灵、即梦、Seedance 等视频生成平台准备镜头化提示词。",
    model: "Video",
  },
] as const;

export default async function LandingPage() {
  let prompts;
  try {
    const data = await fetchPrompts({ limit: 100 });
    prompts = data.items.map(apiToItem);
  } catch {
    prompts = getAllPrompts();
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <PromptDirectory prompts={prompts} />

      <nav className="sticky top-[69px] z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-950 hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {quickSections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-indigo-600">专题栏目</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.desc}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {section.items.map((item) => (
                  <span key={item} className="rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {topicMap.map((topic) => {
        const topicPrompts = prompts.filter((prompt) => prompt.model === topic.model).slice(0, 3);
        return (
          <section key={topic.id} id={topic.id} className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.28em] text-indigo-600">{topic.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{topic.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{topic.desc}</p>
              </div>
              <a href="#directory" className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
                查看全部
              </a>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {topicPrompts.map((prompt) => (
                <PromptCard key={prompt.slug} prompt={prompt} />
              ))}
            </div>
          </section>
        );
      })}

      <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-500">
        <div className="mb-3 font-semibold text-slate-800">Prompt123 / AI 图像提示词库</div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/legal/terms">服务条款</Link>
          <Link href="/legal/privacy">隐私政策</Link>
          <Link href="/legal/refund">退款规则</Link>
          <Link href="/legal/disclaimer">免责声明</Link>
          <Link href="/legal/authorization">素材授权</Link>
        </div>
      </footer>
    </main>
  );
}
