export type PromptModel = "GPT-Image-2" | "Nano Banana" | "Midjourney" | "Video";

export type PromptDifficulty = "入门" | "进阶" | "专业";

export type PromptItem = {
  slug: string;
  title: string;
  model: PromptModel;
  category: string;
  scenario: string;
  summary: string;
  tags: string[];
  visual: string;
  popularity: number;
  difficulty: PromptDifficulty;
  platform: string;
  outputType: string;
  aspectRatio: string;
  updatedAt: string;
  author: string;
  variables: string[];
  promptZh: string;
  promptEn: string;
  usageTips: string[];
  exampleImageUrl?: string;
  isFavorited?: boolean;
  isPremium?: boolean;
  stat?: { view_count: number; copy_count: number; favorite_count: number };
};

export type PromptCollection = {
  id: string;
  title: string;
  desc: string;
  query: string;
  tag: string;
};

export const promptCategories = [
  "全部",
  "电商商品图",
  "图片编辑",
  "人物写真",
  "海报排版",
  "品牌 Logo",
  "视频分镜",
  "3D 手办",
];

export const promptModels: Array<"全部" | PromptModel> = [
  "全部",
  "GPT-Image-2",
  "Nano Banana",
  "Midjourney",
  "Video",
];

export const promptDifficulties: Array<"全部" | PromptDifficulty> = ["全部", "入门", "进阶", "专业"];

export const hotSearches = [
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

export const promptCollections: PromptCollection[] = [
  {
    id: "ecommerce-launch",
    title: "电商上新测图包",
    desc: "白底主图、促销主图、小红书封面，一套覆盖商品上架前的高频测图。",
    query: "主图",
    tag: "高转化",
  },
  {
    id: "nano-editing",
    title: "Nano Banana 编辑专题",
    desc: "人物一致性、局部重绘、盲盒手办，适合参考图驱动的图片编辑。",
    query: "Nano Banana",
    tag: "参考图",
  },
  {
    id: "creator-growth",
    title: "自媒体封面与短视频",
    desc: "小红书封面、信息图、Vlog 转场和商品短视频开场。",
    query: "封面",
    tag: "内容增长",
  },
];

export const prompts: PromptItem[] = [
  {
    slug: "taobao-premium-white-background",
    title: "淘宝质感白底主图",
    model: "GPT-Image-2",
    category: "电商商品图",
    scenario: "淘宝 / 天猫主图",
    summary: "保留商品比例，强化白底阴影、材质细节和上架质感。",
    tags: ["电商", "白底", "主图", "商品保真"],
    visual: "product",
    popularity: 98,
    difficulty: "入门",
    platform: "淘宝 / 天猫",
    outputType: "商品主图",
    aspectRatio: "1:1",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["商品描述"],
    promptZh:
      "为 {商品描述} 生成一张淘宝/天猫风格的高质感白底商品主图。保持商品主体比例真实、轮廓清晰、材质细节可见，使用柔和棚拍光、轻微自然阴影、干净纯白背景。画面中心构图，不添加无关道具，不生成品牌 Logo，不生成夸张促销文字。",
    promptEn:
      "Create a premium Taobao/Tmall product hero image for {product description}. Keep the product proportion accurate, silhouette clean, and material details visible. Use soft studio lighting, subtle natural shadows, and a pure white background. Centered composition, no unrelated props, no brand logo, no exaggerated promotional text.",
    usageTips: ["适合有参考商品图时使用", "文字和价格建议后期叠加", "主体必须清晰，避免背景过度花哨"],
  },
  {
    slug: "pdd-promotion-main-image",
    title: "拼多多爆款促销图",
    model: "GPT-Image-2",
    category: "电商商品图",
    scenario: "拼多多主图 / 活动图",
    summary: "高饱和背景、价格气泡、强卖点位置，为测图准备多个版本。",
    tags: ["拼多多", "促销", "测图", "高点击"],
    visual: "sale",
    popularity: 95,
    difficulty: "进阶",
    platform: "拼多多",
    outputType: "促销主图",
    aspectRatio: "1:1",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["商品描述"],
    promptZh:
      "为 {商品描述} 生成拼多多爆款促销主图。商品主体要大、清晰、位于画面中心偏右，背景使用红橙高能量促销色，预留左上角价格气泡和底部卖点区域。整体风格热闹、直接、有强点击感，但不要生成具体价格数字和虚假功效。",
    promptEn:
      "Create a Pinduoduo-style viral promotional product image for {product description}. The product should be large, sharp, and placed slightly right of center. Use energetic red-orange promotional colors, reserve a top-left price bubble area and a bottom selling-point area. Make it direct and click-worthy, but do not generate actual prices or false claims.",
    usageTips: ["适合低价爆款、活动测图", "价格、满减、销量等必须人工审核", "同一商品建议生成 4 个版本做对比"],
  },
  {
    slug: "xiaohongshu-product-cover",
    title: "小红书商品封面海报",
    model: "GPT-Image-2",
    category: "海报排版",
    scenario: "小红书封面 / 种草图",
    summary: "把商品融入生活方式场景，保留干净标题区和笔记感排版。",
    tags: ["小红书", "封面", "生活方式", "种草"],
    visual: "poster",
    popularity: 91,
    difficulty: "入门",
    platform: "小红书",
    outputType: "社媒封面",
    aspectRatio: "3:4",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["商品描述"],
    promptZh:
      "为 {商品描述} 生成一张小红书风格商品封面。画面要有生活方式氛围，柔和自然光，背景干净有质感，主体商品清晰可见。预留上方或左侧标题留白区域，整体像高质量种草笔记封面，色调清爽、精致、不过度商业化。",
    promptEn:
      "Create a Xiaohongshu-style product cover for {product description}. Use a lifestyle atmosphere, soft natural light, clean textured background, and a clearly visible product. Reserve whitespace for title text at the top or left. The result should feel like a high-quality recommendation post, fresh, refined, and not overly commercial.",
    usageTips: ["更适合美妆、服饰、家居类商品", "标题建议后期叠加", "主体不要太小"],
  },
  {
    slug: "nano-banana-character-consistency",
    title: "人物一致性写真",
    model: "Nano Banana",
    category: "人物写真",
    scenario: "人物参考图延展",
    summary: "用同一人物生成多套服装、场景和镜头角度，保持脸部一致。",
    tags: ["人物", "写真", "一致性", "参考图"],
    visual: "portrait",
    popularity: 96,
    difficulty: "专业",
    platform: "Gemini Nano Banana",
    outputType: "人物写真",
    aspectRatio: "3:4",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["场景/服装描述"],
    promptZh:
      "基于上传的人物参考图，保持人物面部特征、年龄感、发型和整体气质一致。为人物生成 {场景/服装描述} 的写真图，使用真实摄影质感、自然皮肤纹理、柔和光线和干净背景。不要改变五官，不要过度美颜，不要生成夸张姿势。",
    promptEn:
      "Based on the uploaded character reference, preserve the person's facial features, perceived age, hairstyle, and overall temperament. Generate a portrait in {scene/outfit description} with realistic photographic quality, natural skin texture, soft lighting, and a clean background. Do not alter facial identity, over-beautify, or create exaggerated poses.",
    usageTips: ["必须上传清晰正脸参考图", "一次只改一个变量：服装或场景", "适合做证件照、职业照、种草头像"],
  },
  {
    slug: "nano-banana-blind-box-toy",
    title: "手办盲盒包装",
    model: "Nano Banana",
    category: "3D 手办",
    scenario: "人物/商品 3D 化",
    summary: "把人物或商品转成 3D 手办，并生成透明盒、吊牌和陈列背景。",
    tags: ["3D", "手办", "盲盒", "包装"],
    visual: "toy",
    popularity: 93,
    difficulty: "进阶",
    platform: "Gemini Nano Banana",
    outputType: "创意合成",
    aspectRatio: "1:1",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["参考主体"],
    promptZh:
      "将参考图中的 {参考主体} 转化为精致 3D 手办，保持主体最有辨识度的外观特征。生成透明盲盒包装、底座、标签卡和桌面陈列场景。整体风格像高端收藏玩具摄影，材质细腻，灯光柔和，画面干净，避免文字乱码。",
    promptEn:
      "Turn {reference subject} in the reference image into a refined 3D collectible figure while preserving the most recognizable visual features. Generate a transparent blind-box package, base stand, label card, and tabletop display scene. The style should feel like premium collectible toy photography with fine materials, soft lighting, and a clean composition. Avoid garbled text.",
    usageTips: ["适合做爆款社媒内容", "包装文字尽量后期做", "人物参考图越清晰越稳定"],
  },
  {
    slug: "nano-banana-local-repaint",
    title: "参考图局部重绘",
    model: "Nano Banana",
    category: "图片编辑",
    scenario: "换背景 / 换材质 / 换服装",
    summary: "只改背景、材质、服装或道具，不破坏主体结构。",
    tags: ["局部编辑", "换背景", "保主体"],
    visual: "edit",
    popularity: 88,
    difficulty: "专业",
    platform: "Gemini Nano Banana",
    outputType: "图片编辑",
    aspectRatio: "原图比例",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["需要修改的区域", "目标风格/材质/场景"],
    promptZh:
      "基于参考图进行局部编辑，只修改 {需要修改的区域}，保持其他区域完全一致。主体结构、透视、比例、边缘和光影关系必须自然。新区域风格为 {目标风格/材质/场景}，不要改变主体身份，不要引入无关元素。",
    promptEn:
      "Perform a local edit based on the reference image. Only modify {target area to edit} and keep all other areas unchanged. Preserve subject structure, perspective, proportions, edges, and lighting consistency. The new area should match {target style/material/scene}. Do not alter the subject identity or introduce unrelated elements.",
    usageTips: ["描述修改范围越具体越好", "用于电商换背景很实用", "避免一次修改多个大区域"],
  },
  {
    slug: "brand-logo-moodboard",
    title: "品牌 Logo 氛围提案",
    model: "Midjourney",
    category: "品牌 Logo",
    scenario: "品牌视觉探索",
    summary: "从行业关键词扩展成标志、色彩、材质和品牌应用场景。",
    tags: ["Logo", "品牌", "VI", "提案"],
    visual: "logo",
    popularity: 84,
    difficulty: "进阶",
    platform: "Midjourney",
    outputType: "品牌提案",
    aspectRatio: "16:9",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["品牌/行业描述"],
    promptZh:
      "为 {品牌/行业描述} 创建一组高端品牌 Logo 氛围提案。包含极简标志、品牌色板、字体气质、名片和包装应用场景。整体视觉应专业、克制、有高级感，适合商业品牌提案。不要生成复杂小字。",
    promptEn:
      "Create a premium brand logo moodboard for {brand/industry description}. Include a minimalist mark, color palette, typography direction, business card, and packaging application scene. The visual should be professional, restrained, and premium, suitable for a commercial brand proposal. Avoid complex tiny text.",
    usageTips: ["适合前期风格探索，不等于最终商标", "商用前需重新设计和查重", "避免直接生成可注册商标承诺"],
  },
  {
    slug: "cinematic-scene-poster",
    title: "电影感场景海报",
    model: "Midjourney",
    category: "海报排版",
    scenario: "宣传海报 / 概念图",
    summary: "控制镜头、光影、色温和构图，生成强叙事视觉。",
    tags: ["电影感", "海报", "构图"],
    visual: "cinema",
    popularity: 86,
    difficulty: "进阶",
    platform: "Midjourney",
    outputType: "概念海报",
    aspectRatio: "16:9",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["主题描述"],
    promptZh:
      "生成一张电影感场景海报，主题为 {主题描述}。使用宽银幕构图、强叙事光影、明确前景/中景/背景层次、戏剧化色温和高质量摄影质感。画面要有故事张力，保留标题排版空间，不生成具体文字。",
    promptEn:
      "Generate a cinematic scene poster about {theme description}. Use widescreen composition, narrative lighting, clear foreground/midground/background layers, dramatic color temperature, and high-quality photographic texture. The image should have strong storytelling tension and reserved space for title typography. Do not generate actual text.",
    usageTips: ["适合广告视觉和概念海报", "把主题、时间、地点写清楚", "文字最好后期排版"],
  },
  {
    slug: "social-infographic-layout",
    title: "信息图与社媒排版",
    model: "Midjourney",
    category: "海报排版",
    scenario: "信息卡 / 长图 / 封面",
    summary: "把复杂卖点整理成高可读的信息卡、长图和封面版式。",
    tags: ["信息图", "社媒", "版式"],
    visual: "layout",
    popularity: 82,
    difficulty: "入门",
    platform: "小红书 / 公众号",
    outputType: "版式参考",
    aspectRatio: "3:4",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["内容主题"],
    promptZh:
      "为 {内容主题} 生成一张现代信息图版式参考。画面包含清晰的信息分区、卡片式模块、图标占位、数据视觉化区域和标题留白。风格干净、专业、适合社媒传播。不要生成可读小字，只保留版式结构。",
    promptEn:
      "Generate a modern infographic layout reference for {content topic}. Include clear information sections, card modules, icon placeholders, data visualization areas, and title whitespace. The style should be clean, professional, and suitable for social media. Do not generate readable tiny text; focus on layout structure.",
    usageTips: ["适合先出视觉骨架", "正式文字建议后期叠加", "用于课程、知识卡、产品介绍"],
  },
  {
    slug: "ecommerce-short-video-opening",
    title: "商品短视频开场",
    model: "Video",
    category: "视频分镜",
    scenario: "3 秒开场镜头",
    summary: "3 秒抓眼球镜头，包含运动轨迹、转场、光线和主体动作。",
    tags: ["短视频", "镜头", "电商"],
    visual: "video",
    popularity: 89,
    difficulty: "进阶",
    platform: "可灵 / 即梦 / Seedance",
    outputType: "视频分镜",
    aspectRatio: "9:16",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["商品描述"],
    promptZh:
      "为 {商品描述} 设计 3 秒短视频开场镜头。镜头从极近距离的产品材质细节开始，快速拉远到完整商品，背景光线扫过主体，最后定格在可放标题的位置。节奏干净、有冲击力，适合电商种草视频。",
    promptEn:
      "Design a 3-second opening shot for a short product video about {product description}. Start with an extreme close-up of the product material details, quickly pull back to reveal the full product, let background light sweep across the subject, and end with a composition that leaves space for title text. Clean, impactful, suitable for e-commerce social video.",
    usageTips: ["适合可灵、即梦、Seedance", "每条视频 prompt 只描述一个镜头", "镜头动作要明确"],
  },
  {
    slug: "vlog-scene-transition",
    title: "Vlog 风场景切换",
    model: "Video",
    category: "视频分镜",
    scenario: "生活方式视频",
    summary: "把生活场景拆成可连续生成的镜头组，适合种草内容。",
    tags: ["Vlog", "场景", "节奏"],
    visual: "vlog",
    popularity: 80,
    difficulty: "入门",
    platform: "可灵 / 即梦 / Seedance",
    outputType: "视频分镜",
    aspectRatio: "9:16",
    updatedAt: "2026-05-20",
    author: "Prompt123 编辑部",
    variables: ["商品/道具", "目标场景"],
    promptZh:
      "生成一段 Vlog 风格的场景切换镜头：人物拿起 {商品/道具}，镜头跟随手部动作向右平移，转场到 {目标场景}，保持自然手持摄影感、柔和日光、真实生活氛围。动作连贯，画面温暖，适合种草内容。",
    promptEn:
      "Generate a Vlog-style scene transition shot: a person picks up {product/prop}, the camera follows the hand movement and pans right, transitioning into {target scene}. Keep a natural handheld camera feel, soft daylight, and realistic lifestyle atmosphere. Smooth motion, warm visuals, suitable for recommendation content.",
    usageTips: ["适合生活方式账号", "场景切换不要太复杂", "明确人物动作和镜头方向"],
  },
];

export function getAllPrompts() {
  return prompts;
}

export function getPromptBySlug(slug: string) {
  return prompts.find((prompt) => prompt.slug === slug);
}

export function getRelatedPrompts(prompt: PromptItem) {
  return prompts
    .filter((item) => item.slug !== prompt.slug)
    .filter((item) => item.model === prompt.model || item.category === prompt.category || item.tags.some((tag) => prompt.tags.includes(tag)))
    .slice(0, 3);
}

// ── API Types ──────────────────────────────────────────────

export type PromptStatAPI = {
  view_count: number;
  copy_count: number;
  favorite_count: number;
};

export type PromptAPI = {
  id: string;
  slug: string;
  title: string;
  model_name: string;
  category: string;
  scenario: string;
  summary: string;
  prompt_zh: string;
  prompt_en: string;
  tags: string[];
  variables: string[];
  usage_tips: string[];
  difficulty: string;
  platform: string;
  output_type: string;
  aspect_ratio: string;
  visual: string;
  example_image_url: string | null;
  is_premium: boolean;
  author: string;
  popularity: number;
  updated_at: string;
  stat: PromptStatAPI | null;
  is_favorited: boolean;
};

export type PromptListAPI = {
  total: number;
  items: PromptAPI[];
};

// ── API helpers ────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchPrompts(params?: {
  q?: string;
  category?: string;
  model_name?: string;
  difficulty?: string;
  sort?: string;
  skip?: number;
  limit?: number;
}): Promise<PromptListAPI> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.category && params.category !== "全部") qs.set("category", params.category);
  if (params?.model_name && params.model_name !== "全部") qs.set("model_name", params.model_name);
  if (params?.difficulty && params.difficulty !== "全部") qs.set("difficulty", params.difficulty);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));

  const url = `${API_BASE}/api/prompts/?${qs.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`fetchPrompts failed: ${res.status}`);
  return res.json();
}

export async function fetchPromptBySlug(slug: string): Promise<PromptAPI | null> {
  const res = await fetch(`${API_BASE}/api/prompts/${slug}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchPromptBySlug failed: ${res.status}`);
  return res.json();
}

export function apiToItem(p: PromptAPI): PromptItem {
  return {
    slug: p.slug,
    title: p.title,
    model: p.model_name as PromptModel,
    category: p.category,
    scenario: p.scenario,
    summary: p.summary,
    tags: p.tags,
    visual: p.visual,
    popularity: p.popularity,
    difficulty: p.difficulty as PromptDifficulty,
    platform: p.platform,
    outputType: p.output_type,
    aspectRatio: p.aspect_ratio,
    updatedAt: p.updated_at,
    author: p.author,
    variables: p.variables,
    promptZh: p.prompt_zh,
    promptEn: p.prompt_en,
    usageTips: p.usage_tips,
    exampleImageUrl: p.example_image_url ?? undefined,
    isFavorited: p.is_favorited,
    isPremium: p.is_premium,
    stat: p.stat ?? undefined,
  };
}
