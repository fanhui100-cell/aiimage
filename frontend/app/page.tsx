import Link from "next/link";

const navItems = ["首页", "GPT-Image-2", "Nano Banana", "Midjourney", "电商图", "视频提示词"];

const categories = ["全部", "图片生成", "图片编辑", "电商商品图", "人物写真", "海报排版", "Logo", "视频分镜", "3D 手作"];

const hotSearches = [
  "淘宝主图",
  "Nano Banana 一致性",
  "GPT-Image-2 海报",
  "小红书封面",
  "白底商品图",
  "人物证件照",
  "盲盒手办",
  "节日促销",
  "信息图表",
  "短视频分镜",
  "Logo 生成",
  "高级感摄影",
];

const quickSections = [
  { title: "精选分类", desc: "按平台、用途和画面风格快速筛选", items: ["商品主图", "场景图", "海报", "人物", "Logo", "视频"] },
  { title: "结构化标签", desc: "把复杂提示词拆成可组合的模块", items: ["主体", "场景", "光线", "镜头", "材质", "比例"] },
  { title: "近期热门", desc: "围绕当下高频玩法持续更新", items: ["手办", "证件照", "国潮", "赛博", "水彩", "质感"] },
];

const topics = [
  {
    eyebrow: "GPT-IMAGE-2",
    title: "GPT-Image-2 电商商品图",
    desc: "适合商品主体保真、平台主图、促销海报和中文本地化视觉。",
    accent: "amber",
    cards: [
      {
        title: "淘宝质感白底主图",
        desc: "保留商品比例，强化白底阴影、材质细节和上架质感。",
        tags: ["电商", "白底", "主图"],
        visual: "product",
      },
      {
        title: "拼多多爆款促销图",
        desc: "高饱和背景、价格气泡、强卖点位置，为测图准备多个版本。",
        tags: ["促销", "测图", "高点击"],
        visual: "sale",
      },
      {
        title: "小红书封面商品海报",
        desc: "把商品融入生活方式场景，保留干净标题区和笔记感排版。",
        tags: ["封面", "生活方式", "排版"],
        visual: "poster",
      },
    ],
  },
  {
    eyebrow: "GEMINI NANO BANANA",
    title: "Gemini Nano Banana 图片编辑",
    desc: "适合参考图延展、局部编辑、人物一致性和创意合成。",
    accent: "emerald",
    cards: [
      {
        title: "人物一致性写真",
        desc: "用同一人物生成多套服装、场景和镜头角度，保持脸部一致。",
        tags: ["人物", "写真", "一致性"],
        visual: "portrait",
      },
      {
        title: "手办盲盒包装",
        desc: "把人物或商品转成 3D 手办，并生成透明盒、吊牌和陈列背景。",
        tags: ["3D", "手办", "包装"],
        visual: "toy",
      },
      {
        title: "参考图局部重绘",
        desc: "只改背景、材质、服装或道具，不破坏主体结构。",
        tags: ["局部编辑", "换背景", "保主体"],
        visual: "edit",
      },
    ],
  },
  {
    eyebrow: "MIDJOURNEY / DESIGN",
    title: "风格灵感与视觉实验",
    desc: "适合海报、Logo、空间氛围、插画角色和高审美风格探索。",
    accent: "violet",
    cards: [
      {
        title: "品牌 Logo 氛围提案",
        desc: "从行业关键词扩展成标志、色彩、材质和品牌应用场景。",
        tags: ["Logo", "品牌", "VI"],
        visual: "logo",
      },
      {
        title: "电影感场景海报",
        desc: "控制镜头、光影、色温和构图，生成强叙事视觉。",
        tags: ["电影感", "海报", "构图"],
        visual: "cinema",
      },
      {
        title: "信息图与社媒排版",
        desc: "把复杂卖点整理成高可读的信息卡、长图和封面版式。",
        tags: ["信息图", "社媒", "版式"],
        visual: "layout",
      },
    ],
  },
  {
    eyebrow: "VIDEO PROMPT",
    title: "视频分镜与动态图像",
    desc: "为可灵、即梦、Seedance 等视频生成平台准备镜头化提示词。",
    accent: "rose",
    cards: [
      {
        title: "商品短视频开场",
        desc: "3 秒抓眼球镜头，包含运动轨迹、转场、光线和主体动作。",
        tags: ["短视频", "镜头", "电商"],
        visual: "video",
      },
      {
        title: "Vlog 风场景切换",
        desc: "把生活场景拆成可连续生成的镜头组，适合种草内容。",
        tags: ["Vlog", "场景", "节奏"],
        visual: "vlog",
      },
      {
        title: "产品功能演示",
        desc: "用镜头脚本解释功能点，适合工具、家电和数码产品。",
        tags: ["演示", "功能", "分镜"],
        visual: "demo",
      },
    ],
  },
];

function SearchIcon() {
  return (
    <span className="relative h-4 w-4 rounded-full border border-current opacity-70">
      <span className="absolute -bottom-1 -right-1 h-2 w-px rotate-[-45deg] bg-current" />
    </span>
  );
}

function ArrowIcon() {
  return (
    <span className="relative h-4 w-4">
      <span className="absolute left-0 top-1/2 h-px w-4 bg-current" />
      <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-current" />
    </span>
  );
}

function PromptVisual({ type }: { type: string }) {
  const base = "relative h-44 overflow-hidden rounded-lg border border-white/45";

  if (type === "product") {
    return (
      <div className={`${base} bg-gradient-to-br from-white via-stone-100 to-slate-200`}>
        <div className="absolute left-1/2 top-8 h-24 w-20 -translate-x-1/2 rounded-b-[28px] rounded-t-lg bg-slate-950 shadow-2xl" />
        <div className="absolute left-1/2 top-16 h-5 w-28 -translate-x-1/2 rounded-full bg-slate-950/15 blur-md" />
        <div className="absolute bottom-4 left-4 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow">纯白背景</div>
      </div>
    );
  }

  if (type === "sale") {
    return (
      <div className={`${base} bg-gradient-to-br from-red-600 via-orange-400 to-amber-200`}>
        <div className="absolute left-4 top-4 rounded-lg bg-white px-3 py-2 text-2xl font-black text-red-600">¥99</div>
        <div className="absolute bottom-5 right-5 h-24 w-24 rounded-full bg-white/90 shadow-xl" />
        <div className="absolute bottom-8 right-8 h-14 w-14 rounded-full bg-red-500" />
        <div className="absolute bottom-4 left-4 text-lg font-black text-white drop-shadow">爆款测图</div>
      </div>
    );
  }

  if (type === "poster") {
    return (
      <div className={`${base} bg-gradient-to-br from-rose-100 via-white to-emerald-100`}>
        <div className="absolute left-5 top-5 h-28 w-20 rounded-t-full bg-rose-500 shadow-xl" />
        <div className="absolute right-5 top-6 space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-950" />
          <div className="h-2 w-20 rounded-full bg-slate-400" />
          <div className="h-2 w-16 rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-4 right-5 rounded-full bg-white px-3 py-1 text-xs font-semibold">小红书封面</div>
      </div>
    );
  }

  if (type === "portrait") {
    return (
      <div className={`${base} bg-gradient-to-br from-sky-100 via-white to-violet-100`}>
        <div className="absolute left-1/2 top-5 h-16 w-16 -translate-x-1/2 rounded-full bg-amber-200 shadow-lg" />
        <div className="absolute left-1/2 top-20 h-20 w-28 -translate-x-1/2 rounded-t-[40px] bg-indigo-700" />
        <div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold">多角度一致</div>
      </div>
    );
  }

  if (type === "toy") {
    return (
      <div className={`${base} bg-gradient-to-br from-purple-100 via-white to-amber-100`}>
        <div className="absolute left-1/2 top-5 h-32 w-28 -translate-x-1/2 rounded-2xl border-4 border-white bg-white/55 shadow-xl" />
        <div className="absolute left-1/2 top-12 h-12 w-12 -translate-x-1/2 rounded-full bg-amber-300" />
        <div className="absolute bottom-6 left-1/2 h-12 w-16 -translate-x-1/2 rounded-t-2xl bg-slate-950" />
        <div className="absolute left-5 top-5 rotate-[-8deg] rounded-md bg-rose-500 px-2 py-1 text-xs font-bold text-white">BLIND BOX</div>
      </div>
    );
  }

  if (type === "edit") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-100 via-white to-emerald-100`}>
        <div className="absolute left-4 top-4 h-28 w-28 rounded-xl bg-slate-900" />
        <div className="absolute right-4 top-4 h-28 w-28 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-100" />
        <div className="absolute bottom-4 left-4 right-4 h-3 rounded-full bg-slate-200">
          <div className="h-3 w-2/3 rounded-full bg-emerald-500" />
        </div>
      </div>
    );
  }

  if (type === "logo") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-950 via-slate-800 to-amber-700`}>
        <div className="absolute left-1/2 top-9 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-3xl border border-amber-200/40 bg-white/10 text-5xl font-black text-white">A</div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-950">品牌提案</div>
      </div>
    );
  }

  if (type === "cinema") {
    return (
      <div className={`${base} bg-gradient-to-br from-black via-slate-900 to-orange-900`}>
        <div className="absolute inset-x-0 top-10 h-px bg-amber-200/40" />
        <div className="absolute bottom-0 left-1/2 h-24 w-40 -translate-x-1/2 rounded-t-full bg-amber-500/30 blur-xl" />
        <div className="absolute bottom-8 left-1/2 h-24 w-10 -translate-x-1/2 bg-black" />
        <div className="absolute left-4 top-4 text-xs font-semibold text-amber-100">CINEMATIC</div>
      </div>
    );
  }

  if (type === "layout") {
    return (
      <div className={`${base} bg-gradient-to-br from-white via-slate-100 to-sky-100`}>
        <div className="absolute left-4 top-4 h-16 w-28 rounded-lg bg-slate-950" />
        <div className="absolute right-4 top-4 space-y-2">
          <div className="h-3 w-20 rounded-full bg-slate-800" />
          <div className="h-3 w-16 rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-2">
          <div className="h-12 w-12 rounded-md bg-amber-300" />
          <div className="h-12 w-12 rounded-md bg-emerald-300" />
          <div className="h-12 w-12 rounded-md bg-rose-300" />
        </div>
      </div>
    );
  }

  if (type === "video" || type === "vlog" || type === "demo") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-900 via-indigo-900 to-rose-700`}>
        <div className="absolute left-5 top-5 h-24 w-36 rounded-lg border border-white/30 bg-black/30 shadow-xl" />
        <div className="absolute left-[86px] top-[62px] h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-white" />
        <div className="absolute bottom-5 left-5 right-5 flex gap-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-8 flex-1 rounded bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  return <div className={`${base} bg-slate-100`} />;
}

function PromptCard({
  card,
}: {
  card: { title: string; desc: string; tags: string[]; visual: string };
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
      <PromptVisual type={card.visual} />
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {card.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
        <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
          查看提示词 <ArrowIcon />
        </button>
      </div>
    </article>
  );
}

function TopicSection({ topic }: { topic: (typeof topics)[number] }) {
  const accentClass =
    topic.accent === "amber"
      ? "text-amber-700"
      : topic.accent === "emerald"
        ? "text-emerald-700"
        : topic.accent === "violet"
          ? "text-violet-700"
          : "text-rose-700";

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className={`text-xs font-bold tracking-[0.28em] ${accentClass}`}>{topic.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{topic.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{topic.desc}</p>
        </div>
        <button className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400">
          查看全部
        </button>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {topic.cards.map((card) => (
          <PromptCard key={card.title} card={card} />
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              提
            </span>
            <span className="hidden text-sm font-semibold text-slate-950 sm:block">Prompt123</span>
          </Link>

          <form className="flex h-11 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="搜索提示词、模型、主题，例如：淘宝主图 / Nano Banana / 人物写真"
            />
            <button className="hidden rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white sm:block">
              搜索
            </button>
          </form>

          <Link href="/dashboard" className="hidden rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 md:block">
            生成台
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#10111f] px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold tracking-[0.34em] text-indigo-300">NEXT-GEN PROMPT DIRECTORY</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            高质量中文 AI 提示词
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300">
            收集 GPT-Image-2、Gemini Nano Banana、Midjourney、视频生成等平台的高质量中文提示词，按模型、场景和行业整理。
          </p>

          <div className="mx-auto mt-9 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left shadow-2xl shadow-black/25 backdrop-blur">
            <form className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-4 text-slate-400">
              <SearchIcon />
              <input
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                placeholder="搜索提示词、主题或关键词..."
              />
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white">
                <ArrowIcon />
              </button>
            </form>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">分类</span>
                <select className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs text-slate-400">排序方式</span>
                <select className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none">
                  <option>最新</option>
                  <option>热门</option>
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
                  <button key={item} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-300 hover:border-indigo-400 hover:text-white">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-[69px] z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">
          {navItems.map((item) => (
            <a key={item} href={item === "首页" ? "#" : `#${item}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-950 hover:text-slate-950">
              {item}
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

      {topics.map((topic) => (
        <div key={topic.title} id={topic.eyebrow.includes("GPT") ? "GPT-Image-2" : topic.title.includes("Nano") ? "Nano Banana" : topic.title.includes("风格") ? "Midjourney" : "视频提示词"}>
          <TopicSection topic={topic} />
        </div>
      ))}

      <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-500">
        <div className="mb-3 font-semibold text-slate-800">Prompt123 / 主图工厂</div>
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
