import { useTranslations } from "next-intl";

const STEPS = ["01", "02", "03", "04", "05", "06", "07", "08"] as const;

export function ProcessSection() {
  const t = useTranslations("process");
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step) => (
            <div key={step} className="flex flex-col">
              <div className="text-3xl font-bold text-green-200 mb-2">
                {step}
              </div>
              <p className="font-semibold text-gray-800 mb-1">
                {t(`step${step}_title`)}
              </p>
              <p className="text-sm text-gray-500">{t(`step${step}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
