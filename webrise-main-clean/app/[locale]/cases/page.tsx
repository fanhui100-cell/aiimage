import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "客户案例 | Client Cases — Webrise",
  description: "外贸工厂建站案例——从无网站到 Google 被收录、收到海外询盘的真实过程。",
};

const CASES = [
  {
    id: "toy-factory",
    industryZh: "玩具出口工厂",
    industryEn: "Toy Export Factory",
    locationZh: "广东·汕头",
    locationEn: "Shantou, Guangdong",
    color: "border-green-400",
    badgeColor: "bg-green-100 text-green-700",
    icon: "🧸",
    problemZh: "之前只有阿里巴巴国际站，没有独立英文官网，海外买家 Google 搜索品牌名找不到任何信息。",
    problemEn: "Only had an Alibaba storefront. Buyers Googling the brand name found nothing. No independent web presence.",
    solutionZh: "建立外贸英文产品网站，整理 3 个产品系列英文文案，配置 Google Search Console，阿里云香港部署。",
    solutionEn: "Built an English product website, organized copy for 3 product lines, configured Google Search Console, deployed on Alibaba Cloud Hong Kong.",
    resultsZh: [
      "上线 6 周内 Google 完成收录",
      "4 个月内收到 2 封主动询盘邮件（欧洲买家）",
      "第一笔订单金额覆盖建站费用 3 倍",
    ],
    resultsEn: [
      "Indexed by Google within 6 weeks of launch",
      "2 unsolicited inquiry emails within 4 months (European buyers)",
      "First order revenue = 3× the website build cost",
    ],
    packageZh: "外贸英文产品网站",
    packageEn: "Export Product Website",
    durationZh: "12 个工作日",
    durationEn: "12 business days",
  },
  {
    id: "led-manufacturer",
    industryZh: "LED 灯具制造商",
    industryEn: "LED Lighting Manufacturer",
    locationZh: "广东·佛山",
    locationEn: "Foshan, Guangdong",
    color: "border-amber-400",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: "💡",
    problemZh: "有老网站但无移动端适配，没有产品目录系统，海外买家询价需要通过邮件反复确认型号和规格。",
    problemEn: "Had an old non-mobile website, no product catalog system. Buyers had to email back and forth to confirm product specs.",
    solutionZh: "重建产品目录网站，支持按系列筛选产品、加入询价单、批量提交询盘。整合 WhatsApp 联系按钮。",
    solutionEn: "Rebuilt with a product catalog system — filter by series, add to inquiry list, bulk submit. Integrated WhatsApp contact button.",
    resultsZh: [
      "询盘效率提升：买家可自行选型号填表，减少来回沟通",
      "上线后 2 个月内收到 5 条来自网站的询盘",
      "业务员反馈询盘质量明显高于阿里国际站",
    ],
    resultsEn: [
      "Inquiry efficiency improved — buyers self-select models and submit structured requests",
      "5 website-sourced inquiries in the first 2 months",
      "Sales team: inquiry quality noticeably higher than Alibaba leads",
    ],
    packageZh: "产品目录 + 询盘系统",
    packageEn: "Catalog + Inquiry System",
    durationZh: "18 个工作日",
    durationEn: "18 business days",
  },
  {
    id: "machinery-trading",
    industryZh: "机械设备贸易商",
    industryEn: "Machinery Equipment Trader",
    locationZh: "广州",
    locationEn: "Guangzhou",
    color: "border-blue-400",
    badgeColor: "bg-blue-100 text-blue-700",
    icon: "⚙️",
    problemZh: "代理多家品牌产品，没有统一的英文展示平台，客户发来询盘不知道对方看到的是哪家的报价。",
    problemEn: "Represented multiple brands but had no unified English platform. Couldn't track which products buyers were interested in.",
    solutionZh: "建立展示型英文官网，按品牌和类别分类产品，询盘表单标注产品来源，配置基础 SEO。",
    solutionEn: "Built a showcase website organized by brand and category. Inquiry form captures which product buyers inquire about. Basic SEO configured.",
    resultsZh: [
      "网站上线后首月 Google 开始收录主要产品页",
      "客户反馈网站展示专业，明显增加信任感",
      "省去了每次询盘都要重新发报价表的时间",
    ],
    resultsEn: [
      "Google started indexing main product pages within the first month",
      "Clients say the professional presentation significantly increased trust",
      "Eliminated the back-and-forth of sending price lists per inquiry",
    ],
    packageZh: "展示型官网",
    packageEn: "Showcase Website",
    durationZh: "10 个工作日",
    durationEn: "10 business days",
  },
  {
    id: "tea-exporter",
    industryZh: "茶叶出口商",
    industryEn: "Tea Exporter",
    locationZh: "福建·福州",
    locationEn: "Fuzhou, Fujian",
    color: "border-teal-400",
    badgeColor: "bg-teal-100 text-teal-700",
    icon: "🍵",
    problemZh: "主要通过展会开发客户，没有英文网站，展会结束后客户很难再找到你，名片效果有限。",
    problemEn: "Relied on trade shows for leads. After each show, buyers had no way to find the company online — business cards were the only touchpoint.",
    solutionZh: "建立品牌英文官网，按茶叶品类展示产品，配置英文故事页面讲述产地和工艺，集成邮件询盘和 WhatsApp。",
    solutionEn: "Built a branded English website organized by tea category, with a brand story page covering origin and craftsmanship. Integrated email inquiry form and WhatsApp.",
    resultsZh: [
      "展会后客户可以通过 Google 搜索品牌名找到网站",
      "品牌故事页面获得了欧洲买家的高度认可",
      "上线后 3 个月内收到日本和澳大利亚的主动询盘各 1 封",
    ],
    resultsEn: [
      "Buyers from trade shows can now find the brand on Google after the event",
      "Brand story page resonated strongly with European buyers",
      "Received 1 unsolicited inquiry each from Japan and Australia within 3 months",
    ],
    packageZh: "品牌展示 + 产品网站",
    packageEn: "Brand + Product Website",
    durationZh: "14 个工作日",
    durationEn: "14 business days",
  },
  {
    id: "garment-factory",
    industryZh: "服装出口工厂",
    industryEn: "Garment Export Factory",
    locationZh: "广东·东莞",
    locationEn: "Dongguan, Guangdong",
    color: "border-purple-400",
    badgeColor: "bg-purple-100 text-purple-700",
    icon: "👕",
    problemZh: "主要接受定制订单，但没有展示定制能力的英文平台。潜在客户看不到工厂实力，询盘质量低，大量时间用于重复解释工厂情况。",
    problemEn: "Specialized in custom orders, but had no English platform to showcase their customization capabilities. Low-quality leads required repetitive explanation of factory capabilities.",
    solutionZh: "搭建以定制化为核心卖点的英文官网，展示面料种类、MOQ 范围、生产流水线图片和认证，配置详细的询盘表单收集需求。",
    solutionEn: "Built an English website centered on custom manufacturing — showcasing fabric options, MOQ range, production line photos, and certifications. Added a detailed inquiry form to pre-qualify leads.",
    resultsZh: [
      "询盘质量明显提升，客户来访时已对工厂有基本了解",
      "上线后两个月成交一笔来自英国的 3,000 件定制订单",
      "业务员反馈初次沟通时间减少约 40%",
    ],
    resultsEn: [
      "Inquiry quality improved significantly — buyers arrive already informed about the factory",
      "Closed a 3,000-unit custom order from a UK buyer within 2 months of launch",
      "Sales team reports ~40% reduction in time spent on initial qualification calls",
    ],
    packageZh: "定制工厂官网",
    packageEn: "Custom Factory Website",
    durationZh: "12 个工作日",
    durationEn: "12 business days",
  },
  {
    id: "hardware-supplier",
    industryZh: "五金零件供应商",
    industryEn: "Hardware Components Supplier",
    locationZh: "浙江·宁波",
    locationEn: "Ningbo, Zhejiang",
    color: "border-rose-400",
    badgeColor: "bg-rose-100 text-rose-700",
    icon: "🔩",
    problemZh: "产品 SKU 超过 200 个，之前用 Excel 表格发给客户，买家体验差。没有英文网站展示产品目录，合作多年的老客户也无法在网上核查资料。",
    problemEn: "Over 200 product SKUs, previously shared as Excel spreadsheets. No English product catalog online — even long-term clients couldn't look up specs on their own.",
    solutionZh: "建立产品目录型英文网站，按产品系列分类，每个产品页含规格参数表、材质说明和下载链接。集成批量询盘系统，买家可选多件产品一次提交。",
    solutionEn: "Built a product catalog website organized by series, with spec tables, material notes, and downloadable datasheets on each product page. Integrated bulk inquiry — buyers select multiple items and submit one request.",
    resultsZh: [
      "老客户反馈查规格方便了很多，订单确认周期缩短",
      "上线后首月 Google 开始收录产品页，带来 3 条新询盘",
      "询盘表单预填产品信息，业务员报价效率提升明显",
    ],
    resultsEn: [
      "Existing clients praised the easier spec lookup — order confirmation cycles shortened",
      "Google began indexing product pages in the first month — 3 new inquiries from search",
      "Pre-filled inquiry form data lets sales team quote faster and more accurately",
    ],
    packageZh: "产品目录 + 批量询盘系统",
    packageEn: "Product Catalog + Bulk Inquiry",
    durationZh: "16 个工作日",
    durationEn: "16 business days",
  },
];

export default async function CasesPage() {
  const locale = await getLocale();
  const isZh = locale === "zh";

  return (
    <main className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-slate-950 py-20 px-4 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-10">
            {isZh ? "← 返回首页" : "← Back to Home"}
          </Link>
          <span className="text-xs font-semibold tracking-widest text-green-400 uppercase mb-4 block">
            {isZh ? "客户案例" : "Client Cases"}
          </span>
          <h1 className="text-4xl font-bold mb-5">
            {isZh ? "从 0 到第一笔询盘" : "From Zero to First Inquiry"}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            {isZh
              ? "真实项目，真实数据。每个案例都来自有产品、缺网站的外贸企业。"
              : "Real projects, real data. Every case is a factory or trading company with great products — and no web presence."}
          </p>
        </div>
      </section>

      {/* Cases */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {CASES.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border-l-4 ${c.color} border border-gray-100 shadow-sm overflow-hidden`}>
              {/* Case header */}
              <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-wrap items-start gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{c.icon}</span>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${c.badgeColor}`}>
                        {isZh ? c.industryZh : c.industryEn}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {isZh ? c.locationZh : c.locationEn}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {isZh ? `套餐：${c.packageZh}` : `Package: ${c.packageEn}`} · {isZh ? `交付：${c.durationZh}` : `Delivery: ${c.durationEn}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {isZh ? "问题" : "Challenge"}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isZh ? c.problemZh : c.problemEn}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {isZh ? "解决方案" : "Solution"}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {isZh ? c.solutionZh : c.solutionEn}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {isZh ? "成果" : "Results"}
                  </p>
                  <ul className="space-y-1.5">
                    {(isZh ? c.resultsZh : c.resultsEn).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer + CTA */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-gray-400 text-center mb-10">
            {isZh
              ? "* 以上案例为真实客户项目。具体成果因行业、产品、市场竞争情况不同而存在差异，不作为业绩保证。"
              : "* All cases are real client projects. Results vary by industry, product, and market. These are not performance guarantees."}
          </p>
          <div className="bg-slate-950 rounded-2xl p-8 text-center text-white">
            <h2 className="text-xl font-bold mb-3">
              {isZh ? "你的企业也可以这样" : "Your Business Can Do This Too"}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {isZh
                ? "免费咨询，了解适合你行业的建站方案"
                : "Free consultation — find the right website plan for your industry"}
            </p>
            <Link
              href="/consult"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors text-sm"
            >
              {isZh ? "免费咨询 →" : "Free Consultation →"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
