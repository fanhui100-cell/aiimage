import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "联系我们",
  description: "填写需求表单，我们会在 1 个工作日内回复。",
};

export default function ContactPage() {
  const t = useTranslations("contact_page");
  return (
    <main className="py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3">{t("title")}</h1>
        <p className="text-center text-gray-500 mb-10">{t("subtitle")}</p>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
