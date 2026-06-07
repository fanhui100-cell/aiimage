"use client";

// Style 6: Centered title + four cards in fan spread below

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const locale = useLocale();
  const isZh = locale === "zh";

  const trust = isZh
    ? ["¥3,800 起", "10–14 工作日上线", "源码归您", "3 个月质保"]
    : ["From $530", "10–14 Business Days", "You Own the Code", "3-Month Warranty"];

  const [d0, d1, d2, d3] = [
    { src: "/screenshots/demo-zh-garment.png", label: isZh ? "服装出口" : "Garment Export" },
    { src: "/screenshots/demo-zh-tea.png",     label: isZh ? "茶叶出口" : "Tea Export" },
    { src: "/screenshots/demo-zh-tech.png",    label: isZh ? "电子元器件" : "Electronics" },
    { src: "/screenshots/demo-zh-food.png",    label: isZh ? "食品出口" : "Food Export" },
  ] as const;

  // Fan layout: four cards, each tilted and offset
  // translate values = fan-offset minus 50% (card own half-width) to center the group
  const cards = [
    { data: d0, rotate: "-rotate-6",  translate: "-translate-x-[180%]", zIndex: "z-10", shadow: "shadow-lg",  mobileHide: true  },
    { data: d1, rotate: "-rotate-2",  translate: "md:-translate-x-[94%] -translate-x-[55%]",  zIndex: "z-20", shadow: "shadow-xl", mobileHide: false },
    { data: d2, rotate: "rotate-2",   translate: "md:-translate-x-[6%]  translate-x-[5%]",    zIndex: "z-20", shadow: "shadow-xl", mobileHide: false },
    { data: d3, rotate: "rotate-6",   translate: "translate-x-[80%]",   zIndex: "z-10", shadow: "shadow-lg",  mobileHide: true  },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">

      {/* Soft gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[650px] h-[550px] rounded-full bg-emerald-200/60 blur-[120px]" />
        <div className="absolute -top-20 right-0 w-[550px] h-[450px] rounded-full bg-teal-100/70 blur-[100px]" />
        <div className="absolute top-32 left-1/3 w-[400px] h-[300px] rounded-full bg-emerald-100/50 blur-[80px]" />
        <div className="absolute bottom-0 left-0 right-0 h-[220px] bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-0 text-center">

        {/* Label */}
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-gray-500 text-xs font-medium shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {isZh ? "专业建站服务 · 全行业覆盖" : "Professional Web Development · All Industries"}
        </div>

        {/* Headline — consistent dark color, no gray splits */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-950 leading-[1.08] mb-5">
          {isZh ? (<>专业官网建设<br />让客户主动找上门</>) : (<>Professional Websites<br />That Bring Clients to You</>)}
        </h1>

        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-2 leading-relaxed">
          {isZh
            ? "工厂 · 贸易公司 · 服务机构 · 品牌电商 · 本地商家，全行业覆盖"
            : "Factories · Trading Companies · Service Firms · Brands · Local Businesses"}
        </p>
        <p className="text-gray-400 text-sm max-w-xl mx-auto mb-10">
          {isZh
            ? "不是模板套版 — 根据你的行业量身定制，帮你整理内容、完成上线，你只需提供基本资料"
            : "Not template fill-in — tailored to your industry, we handle content and deployment end-to-end"}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Link
            href="/consult"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-gray-950 text-white hover:bg-gray-800 transition-colors shadow-lg shadow-gray-950/10"
          >
            {isZh ? "免费咨询" : "Free Consultation"}
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M2.75 8a.75.75 0 0 1 .75-.75h7.44L8.22 4.53a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06-1.06l2.72-2.72H3.5A.75.75 0 0 1 2.75 8z"/>
            </svg>
          </Link>
          <Link
            href="/demos"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-gray-700 border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            {isZh ? "查看演示案例" : "View Live Demos"}
          </Link>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap gap-6 justify-center mb-16">
          {trust.map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-green-500 shrink-0">
                <path d="M10.28 2.28 3.989 8.575 1.695 6.28A1 1 0 0 0 .28 7.695l3 3a1 1 0 0 0 1.414 0l7-7A1 1 0 0 0 10.28 2.28z"/>
              </svg>
              {item}
            </span>
          ))}
        </div>

        {/* Four-card fan spread */}
        <div className="relative h-[320px] md:h-[380px] select-none flex items-start justify-center">
          {/* Glow underneath */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-gray-900/8 blur-2xl rounded-full" />

          {cards.map(({ data, rotate, translate, zIndex, shadow, mobileHide }) => (
            <div
              key={data.label}
              className={`absolute top-0 left-1/2 w-[44%] md:w-[22%] rounded-xl overflow-hidden border border-gray-100 ${shadow} ${rotate} ${translate} ${zIndex} hover:scale-[1.4] hover:z-30 transition-all duration-500 origin-top ${mobileHide ? "hidden md:block" : ""}`}
            >
              <div className="bg-gray-100 px-2 py-1.5 flex items-center gap-1 border-b border-gray-200">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.src} alt={data.label} className="w-full h-auto" />
              <div className="bg-white px-2 py-1 border-t border-gray-100">
                <p className="text-[9px] text-gray-400 truncate">{data.label}</p>
              </div>
            </div>
          ))}

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-40 pointer-events-none" />
        </div>

      </div>

      {/* Stats strip */}
      <div className="relative z-10 border-t border-emerald-100/60 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-emerald-50/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
          {(isZh
            ? [{ val: "50+", label: "服务企业" }, { val: "4.9", label: "客户满意度" }, { val: "10天", label: "平均上线周期" }, { val: "11+", label: "覆盖行业" }]
            : [{ val: "50+", label: "Clients Served" }, { val: "4.9", label: "Client Satisfaction" }, { val: "10d", label: "Avg Launch Time" }, { val: "11+", label: "Industries" }]
          ).map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">{s.val}</span>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
