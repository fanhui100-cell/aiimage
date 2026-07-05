import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARTICLES, getArticle } from "@/lib/blog-data";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.titleZh,
    description: article.excerptZh,
    openGraph: {
      title: article.titleZh,
      description: article.excerptZh,
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const locale = await getLocale();
  const isZh = locale === "zh";

  const title = isZh ? article.titleZh : article.titleEn;
  const content = isZh ? article.contentZh : article.contentEn;

  const paragraphs = content.split("\n\n").filter(Boolean);

  return (
    <main className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <BackLink />
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readingMinutes} min read</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8 leading-snug">{title}</h1>
        <div className="prose prose-gray max-w-none space-y-4">
          {paragraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return (
                <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">
                  {para.replace(/^## /, "")}
                </h2>
              );
            }
            if (para.startsWith("### ")) {
              return (
                <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">
                  {para.replace(/^### /, "")}
                </h3>
              );
            }
            if (para.startsWith("| ")) {
              const rows = para.split("\n").filter((r) => !r.match(/^\|[-\s|]+\|$/));
              return (
                <div key={i} className="overflow-x-auto my-4">
                  <table className="w-full text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                    {rows.map((row, ri) => {
                      const cells = row.split("|").filter((c) => c.trim());
                      return (
                        <tr key={ri} className={ri === 0 ? "bg-gray-50 font-semibold" : "border-t border-gray-100"}>
                          {cells.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2 border-r border-gray-100 last:border-r-0">
                              {cell.trim()}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </table>
                </div>
              );
            }
            if (para.startsWith("- ") || para.startsWith("* ")) {
              const items = para.split("\n").filter(Boolean);
              return (
                <ul key={i} className="space-y-1 pl-5 list-disc text-gray-700 text-sm">
                  {items.map((item, ii) => (
                    <li key={ii}>{item.replace(/^[-*] /, "")}</li>
                  ))}
                </ul>
              );
            }
            if (para.startsWith("**")) {
              return (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  <strong>{para.replace(/\*\*/g, "")}</strong>
                </p>
              );
            }
            if (para.startsWith("❌ ") || para.startsWith("✅ ")) {
              return (
                <p key={i} className="text-sm text-gray-700 leading-relaxed pl-2">
                  {para}
                </p>
              );
            }
            return (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {para}
              </p>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="bg-green-50 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isZh ? "需要专业帮助？" : "Need professional help?"}
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              {isZh
                ? "我们提供免费咨询，评估你的网站和 SEO 方案。"
                : "We offer free consultations to assess your website and SEO options."}
            </p>
            <Link
              href="/consult"
              className="inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
            >
              {isZh ? "免费咨询 →" : "Free Consultation →"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function BackLink() {
  const t = useTranslations("blog");
  return (
    <Link href="/blog" className="inline-flex items-center text-sm text-gray-500 hover:text-green-700 transition-colors mb-6">
      {t("back")}
    </Link>
  );
}
