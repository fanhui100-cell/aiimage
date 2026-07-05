import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

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

export function DemosSection() {
  const t = useTranslations("demos");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {DEMOS.map((demo) => (
            <div
              key={demo.key}
              className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{demo.icon}</span>
                  <p className="font-semibold text-gray-800">{t(`${demo.key}_title`)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                    demo.live
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {demo.live ? t("badge_live") : t("badge_coming")}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex-1">{t(`${demo.key}_desc`)}</p>
              {demo.live ? (
                <a
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-medium text-green-700 hover:underline"
                >
                  → {t("visit")}
                </a>
              ) : (
                <span className="mt-4 text-sm text-gray-300">{t("badge_coming")}</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/consult"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-green-700 text-green-700 hover:bg-green-50 transition-colors"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
