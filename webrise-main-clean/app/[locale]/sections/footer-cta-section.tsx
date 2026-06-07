import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function FooterCtaSection() {
  const t = useTranslations("footer_cta");
  return (
    <section className="py-20 px-4 bg-green-700 text-white text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-3">{t("title")}</h2>
        <p className="text-green-100 mb-8">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/consult"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-white text-green-700 hover:bg-green-50 transition-colors"
          >
            {t("cta_primary")}
          </Link>
          <Link
            href="/demos"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold border border-white/50 text-white hover:bg-green-600 transition-colors"
          >
            {t("cta_secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
