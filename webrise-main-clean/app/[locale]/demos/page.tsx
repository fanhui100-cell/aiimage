import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "演示案例",
  description: "6 个真实可访问的行业演示网站，展示外贸英文网站、产品目录系统、报价系统等功能。",
};

type Demo = {
  key: string;
  url: string;
  live: boolean;
  icon: string;
};

const DEMOS: Demo[] = [
  { key: "export", url: "https://export.demo.yoursite.com", live: false, icon: "🏭" },
  { key: "catalog", url: "https://catalog.demo.yoursite.com", live: false, icon: "📋" },
  { key: "engineering", url: "https://engineering.demo.yoursite.com", live: false, icon: "⚙️" },
  { key: "quote", url: "https://quote.demo.yoursite.com", live: false, icon: "📊" },
  { key: "ai", url: "https://ai.demo.yoursite.com", live: false, icon: "🤖" },
  { key: "consulting", url: "https://consulting.demo.yoursite.com", live: false, icon: "💼" },
];

export default function DemosPage() {
  const t = useTranslations("demos");
  const tp = useTranslations("demos_page");

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">{tp("title")}</h1>
        <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">{tp("subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {DEMOS.map((demo) => (
            <div
              key={demo.key}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{demo.icon}</span>
                  <p className="font-semibold text-gray-800">{t(`${demo.key}_title`)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                    demo.live ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {demo.live ? tp("visit") : tp("coming_soon")}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex-1 mb-4">{t(`${demo.key}_desc`)}</p>
              {demo.live ? (
                <a
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-green-700 hover:underline"
                >
                  {tp("visit")} →
                </a>
              ) : (
                <span className="text-sm text-gray-400">{tp("coming_soon")}</span>
              )}
            </div>
          ))}
        </div>

        <div className="text-center bg-green-50 rounded-2xl p-10">
          <h2 className="text-xl font-bold mb-2">{t("title")}</h2>
          <p className="text-gray-500 mb-6">{t("subtitle")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
