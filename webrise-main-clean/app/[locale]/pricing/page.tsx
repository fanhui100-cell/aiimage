import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "价格套餐",
  description: "透明定价，无隐藏费用。展示型官网 ¥5,000 起，外贸英文网站 ¥9,800 起。",
};

type Package = {
  key: string;
  popular?: boolean;
  featureCount: number;
};

const PACKAGES: Package[] = [
  { key: "display", featureCount: 5 },
  { key: "export", popular: true, featureCount: 5 },
  { key: "catalog", featureCount: 5 },
  { key: "ai", featureCount: 5 },
];

const MAINTENANCE_PLANS = [
  { key: "basic", featureCount: 5 },
  { key: "content", featureCount: 4 },
  { key: "seo", featureCount: 4 },
];

export default function PricingPage() {
  const t = useTranslations("pricing");
  const tp = useTranslations("pricing_page");

  return (
    <main className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">{tp("title")}</h1>
        <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">
          {tp("subtitle")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.key}
              className={`rounded-xl border p-6 flex flex-col ${
                pkg.popular
                  ? "border-green-500 bg-white shadow-lg ring-1 ring-green-500"
                  : "border-gray-200 bg-white"
              }`}
            >
              {pkg.popular && (
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full self-start mb-3">
                  {t("popular_badge")}
                </span>
              )}
              <p className="font-bold text-gray-800 mb-1">{t(`${pkg.key}_name`)}</p>
              <p className="text-2xl font-bold text-green-700 mb-1">
                {t(`${pkg.key}_price`)}
              </p>
              <p className="text-xs text-gray-400 mb-4">{t(`${pkg.key}_desc`)}</p>
              <ul className="space-y-1.5 flex-1 mb-6">
                {Array.from({ length: pkg.featureCount }, (_, i) => i + 1).map(
                  (n) => (
                    <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-green-500 shrink-0">✓</span>
                      {t(`${pkg.key}_f${n}`)}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/contact"
                className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                  pkg.popular
                    ? "bg-green-700 text-white hover:bg-green-800"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t("cta_consult")}
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-16">{t("note")}</p>

        <h2 className="text-2xl font-bold text-center mb-2">
          {tp("maintenance_title")}
        </h2>
        <p className="text-center text-gray-500 mb-10">{tp("maintenance_subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {MAINTENANCE_PLANS.map((plan) => (
            <div
              key={plan.key}
              className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col"
            >
              <p className="font-bold text-gray-800 mb-1">
                {tp(`${plan.key}_name`)}
              </p>
              <p className="text-xl font-bold text-green-700 mb-4">
                {tp(`${plan.key}_price`)}
              </p>
              <ul className="space-y-1.5 flex-1">
                {Array.from(
                  { length: plan.featureCount },
                  (_, i) => i + 1
                ).map((n) => (
                  <li key={n} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500 shrink-0">✓</span>
                    {tp(`${plan.key}_f${n}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center bg-green-50 rounded-2xl p-10">
          <h3 className="text-xl font-bold mb-2">{tp("cta_title")}</h3>
          <p className="text-gray-500 mb-6">{tp("cta_subtitle")}</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {tp("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}
