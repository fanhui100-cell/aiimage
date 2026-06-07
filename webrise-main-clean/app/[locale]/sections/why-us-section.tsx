import { useTranslations } from "next-intl";

const WHY_KEYS = [
  "demo",
  "content",
  "server",
  "price",
  "support",
  "speed",
] as const;

export function WhyUsSection() {
  const t = useTranslations("why_us");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <p className="font-semibold text-gray-800">
                ✓ {t(`${key}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
