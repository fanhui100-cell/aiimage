import { useTranslations } from "next-intl";

const FAQ_NUMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function FaqSection() {
  const t = useTranslations("faq");
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t("title")}</h2>
        <div className="space-y-3">
          {FAQ_NUMS.map((n) => (
            <details
              key={n}
              className="group border border-gray-200 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-medium text-gray-800 list-none hover:bg-gray-50">
                {t(`q${n}`)}
                <span className="ml-4 shrink-0 text-gray-400 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">
                {t(`a${n}`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
