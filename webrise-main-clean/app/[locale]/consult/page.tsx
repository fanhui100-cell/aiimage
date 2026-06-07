import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ConsultWizard } from "./wizard";

export const metadata: Metadata = {
  title: "免费需求咨询",
  description:
    "10 分钟填写需求表单，免费获取定制报价。适合外贸工厂、贸易公司、设备供应商。",
};

export default function ConsultPage() {
  const t = useTranslations("consult_page");
  return (
    <main>
      {/* Premium gradient banner */}
      <section className="bg-gradient-to-b from-green-50 to-white pt-16 pb-10 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold text-green-700 bg-green-100 rounded-full px-3 py-1 mb-4 uppercase tracking-widest">
            免费咨询
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">{t("subtitle")}</p>
        </div>
      </section>

      {/* Wizard */}
      <section className="pb-24 px-4">
        <ConsultWizard />
      </section>
    </main>
  );
}
