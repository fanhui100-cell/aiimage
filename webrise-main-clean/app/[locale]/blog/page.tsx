import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ARTICLES } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "知识库 | Webrise",
  description: "外贸建站、Google SEO、出口合规——外贸工厂实战知识库。",
};

const CAT_STYLE = {
  green:  { badge: "bg-green-100 text-green-700", bar: "bg-green-500", dot: "bg-green-500" },
  blue:   { badge: "bg-blue-100 text-blue-700",   bar: "bg-blue-500",  dot: "bg-blue-500" },
  orange: { badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500", dot: "bg-orange-500" },
} as const;

const CATEGORY_FILTERS = [
  { key: null, zhLabel: "全部", enLabel: "All" },
  { key: "建站指南", zhLabel: "建站指南", enLabel: "Website Guide", color: "green" as const },
  { key: "SEO 优化", zhLabel: "SEO 优化", enLabel: "SEO", color: "orange" as const },
  { key: "出口合规", zhLabel: "出口合规", enLabel: "Export Compliance", color: "blue" as const },
];

export default async function BlogPage() {
  const [t, locale] = await Promise.all([getTranslations("blog"), getLocale()]);
  const isZh = locale === "zh";

  const [featured, second, ...rest] = ARTICLES as [
    typeof ARTICLES[0],
    typeof ARTICLES[0],
    ...typeof ARTICLES
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Hero — cleaner with gradient top bar */}
      <section className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold uppercase tracking-widest border border-green-200">
                {isZh ? "实战知识库" : "Knowledge Base"}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
              <p className="text-gray-400 text-sm max-w-xl">{t("subtitle")}</p>
            </div>
            {/* Stats */}
            <div className="flex gap-8 text-center shrink-0">
              {[
                { val: ARTICLES.length, label: isZh ? "篇文章" : "Articles" },
                { val: 3, label: isZh ? "个专题" : "Topics" },
                { val: isZh ? "免费" : "Free", label: isZh ? "全部免费" : "All Free" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-gray-900">{s.val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mt-7">
            {CATEGORY_FILTERS.map((c) => (
              <span
                key={c.zhLabel}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors border ${
                  c.color
                    ? `${CAT_STYLE[c.color].badge} border-transparent hover:opacity-80`
                    : "bg-gray-900 text-white border-transparent"
                }`}
              >
                {c.color && <span className={`w-1.5 h-1.5 rounded-full ${CAT_STYLE[c.color].dot}`} />}
                {isZh ? c.zhLabel : c.enLabel}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Top featured — redesigned with numbered badges */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-6">
          {/* Main featured */}
          <Link
            href={`/blog/${featured.slug}` as `/blog/${string}`}
            className="md:col-span-3 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <div className={`h-1.5 w-full ${CAT_STYLE[featured.categoryColor].bar}`} />
            <div className="p-8 flex flex-col flex-1 relative">
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-200">
                1
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_STYLE[featured.categoryColor].badge}`}>
                  {isZh ? featured.category : featured.categoryEn}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-green-700 transition-colors">
                {isZh ? featured.titleZh : featured.titleEn}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-5">
                {isZh ? featured.excerptZh : featured.excerptEn}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">{featured.date}</span>
                <span className="text-sm font-semibold text-green-700 group-hover:gap-3 transition-all flex items-center gap-1">
                  {t("read_more")} →
                </span>
              </div>
            </div>
          </Link>

          {/* Second featured */}
          <Link
            href={`/blog/${second.slug}` as `/blog/${string}`}
            className="md:col-span-2 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            <div className={`h-1.5 w-full ${CAT_STYLE[second.categoryColor].bar}`} />
            <div className="p-7 flex flex-col flex-1 relative">
              <div className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-base font-bold text-gray-200">
                2
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CAT_STYLE[second.categoryColor].badge}`}>
                  {isZh ? second.category : second.categoryEn}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-green-700 transition-colors">
                {isZh ? second.titleZh : second.titleEn}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed flex-1 line-clamp-4 mb-4">
                {isZh ? second.excerptZh : second.excerptEn}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">{second.date}</span>
                <span className="text-sm font-semibold text-green-700">{t("read_more")} →</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {isZh ? "更多文章" : "More Articles"}
          </span>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{rest.length} {isZh ? "篇" : "articles"}</span>
        </div>

        {/* Article grid — 3 columns, now with richer cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}` as `/blog/${string}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className={`h-1 w-full ${CAT_STYLE[article.categoryColor].bar}`} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CAT_STYLE[article.categoryColor].badge}`}>
                    {isZh ? article.category : article.categoryEn}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
                  {isZh ? article.titleZh : article.titleEn}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-4">
                  {isZh ? article.excerptZh : article.excerptEn}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-300">{article.date}</p>
                  <span className="text-xs font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("read_more")} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="relative overflow-hidden bg-slate-950 rounded-2xl p-10 text-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,#22c55e,transparent_60%)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_20%,#0ea5e9,transparent_50%)]" />
          <div className="relative">
            <h2 className="text-xl font-bold text-white mb-2">
              {isZh ? "还有更多问题？" : "Still have questions?"}
            </h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              {isZh
                ? "我们的顾问可以针对你的行业和产品给出具体方案，免费、不催单。"
                : "Our consultants can give specific recommendations based on your industry and product — free and no hard sell."}
            </p>
            <Link
              href="/consult"
              className="inline-flex items-center gap-2 justify-center rounded-xl px-6 py-3 text-sm font-semibold bg-green-500 text-white hover:bg-green-400 transition-colors"
            >
              {isZh ? "免费咨询 →" : "Free Consultation →"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
