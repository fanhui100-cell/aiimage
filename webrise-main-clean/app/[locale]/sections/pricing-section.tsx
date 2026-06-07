import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

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

export function PricingSection() {
  const t = useTranslations("pricing");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
              <ul className="space-y-1 flex-1 mb-6">
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
                href="/consult"
                className={`text-center text-sm font-semibold py-2 rounded-md transition-colors ${
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
        <p className="text-center text-xs text-gray-400">{t("note")}</p>
      </div>
    </section>
  );
}
