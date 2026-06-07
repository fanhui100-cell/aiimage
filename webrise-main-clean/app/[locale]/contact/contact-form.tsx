"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitContactForm, type ContactFormState } from "./actions";

const initialState: ContactFormState = {};

export function ContactForm() {
  const t = useTranslations("contact_page");
  const locale = useLocale();
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.success) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl font-bold text-green-700 mb-2">
          {t("success_title")}
        </p>
        <p className="text-gray-500">{t("success_desc")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("name_label")} *
        </label>
        <input
          name="name"
          required
          placeholder={t("name_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("company_label")}
        </label>
        <input
          name="company"
          placeholder={t("company_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("contact_label")} *
        </label>
        <input
          name="contact"
          required
          placeholder={t("contact_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("message_label")} *
        </label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder={t("message_placeholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{t("error")}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-60 transition-colors"
      >
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
