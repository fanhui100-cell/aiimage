import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const INDUSTRY_KEYS = [
  "factory",
  "trading",
  "equipment",
  "engineering",
  "interior",
  "professional",
  "wholesale",
  "consulting",
] as const;

export function IndustriesSection() {
  const t = useTranslations("industries");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-3">{t("title")}</h2>
        <p className="text-center text-gray-500 mb-12">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {INDUSTRY_KEYS.map((key) => (
            <span
              key={key}
              className="px-4 py-2 rounded-full bg-green-50 text-green-800 text-sm font-medium border border-green-100"
            >
              {t(key)}
            </span>
          ))}
        </div>
        <p className="text-center text-gray-400 text-sm">
          {t("cta_prefix")}{" "}
          <Link href="/contact" className="text-green-700 hover:underline font-medium">
            {t("cta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
