"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  submitConsultForm,
  type ConsultFormData,
  type ConsultFormState,
} from "./actions";

const TOTAL_STEPS = 4;

type StringField =
  | "businessType"
  | "websiteStatus"
  | "packageInterest"
  | "productCount"
  | "timeline"
  | "budget"
  | "name"
  | "company"
  | "contact"
  | "notes";

type WizardData = Record<StringField, string> & { targetMarkets: string[] };

function CheckIcon() {
  return (
    <svg
      className="w-2.5 h-2.5 text-white"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function RadioCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
        selected
          ? "border-green-600 bg-green-50 text-green-800 shadow-sm"
          : "border-gray-200 text-gray-700 hover:border-green-300 hover:bg-gray-50"
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
          <CheckIcon />
        </span>
      )}
      {label}
    </button>
  );
}

function CheckboxCard({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
        checked
          ? "border-green-600 bg-green-50 text-green-800 shadow-sm"
          : "border-gray-200 text-gray-700 hover:border-green-300 hover:bg-gray-50"
      }`}
    >
      {checked && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
          <CheckIcon />
        </span>
      )}
      {label}
    </button>
  );
}

export function ConsultWizard() {
  const t = useTranslations("consult_page");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [submitState, setSubmitState] = useState<ConsultFormState>({});
  const [data, setData] = useState<WizardData>({
    businessType: "",
    websiteStatus: "",
    targetMarkets: [],
    packageInterest: "",
    productCount: "",
    timeline: "",
    budget: "",
    name: "",
    company: "",
    contact: "",
    notes: "",
  });

  function pick(key: StringField, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMarket(market: string) {
    setData((prev) => ({
      ...prev,
      targetMarkets: prev.targetMarkets.includes(market)
        ? prev.targetMarkets.filter((m) => m !== market)
        : [...prev.targetMarkets, market],
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) return !!data.businessType && !!data.websiteStatus;
    if (step === 2)
      return data.targetMarkets.length > 0 && !!data.packageInterest;
    if (step === 3)
      return !!data.productCount && !!data.timeline && !!data.budget;
    if (step === 4) return !!data.name && !!data.contact;
    return false;
  }

  function handleSubmit() {
    const formData: ConsultFormData = { ...data, locale };
    startTransition(async () => {
      const result = await submitConsultForm(formData);
      setSubmitState(result);
    });
  }

  if (submitState.success) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center mb-6 shadow-lg">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {t("success_title")}
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">{t("success_subtitle")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
        >
          {t("success_back")}
        </Link>
      </div>
    );
  }

  const stepTitles = [
    { title: t("step1_title"), subtitle: t("step1_subtitle") },
    { title: t("step2_title"), subtitle: t("step2_subtitle") },
    { title: t("step3_title"), subtitle: t("step3_subtitle") },
    { title: t("step4_title"), subtitle: t("step4_subtitle") },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator circles + connector lines */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full text-sm font-bold flex items-center justify-center transition-all ${
                s < step
                  ? "bg-green-600 text-white"
                  : s === step
                  ? "bg-green-700 text-white shadow-md ring-4 ring-green-100"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {s < step ? <CheckIcon /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-10 h-0.5 rounded-full transition-colors ${
                  s < step ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {stepTitles[step - 1]!.title}
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          {stepTitles[step - 1]!.subtitle}
        </p>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
        {/* Step 1: Business type + website status */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q1_label")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  t("q1_factory"),
                  t("q1_trading"),
                  t("q1_equipment"),
                  t("q1_engineering"),
                  t("q1_service"),
                  t("q1_other"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.businessType === label}
                    onSelect={() => pick("businessType", label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q2_label")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  t("q2_none"),
                  t("q2_chinese"),
                  t("q2_poor"),
                  t("q2_upgrade"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.websiteStatus === label}
                    onSelect={() => pick("websiteStatus", label)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Target markets + package interest */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q3_label")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  t("q3_americas"),
                  t("q3_sea"),
                  t("q3_mid"),
                  t("q3_africa"),
                  t("q3_au"),
                  t("q3_other"),
                ].map((label) => (
                  <CheckboxCard
                    key={label}
                    label={label}
                    checked={data.targetMarkets.includes(label)}
                    onToggle={() => toggleMarket(label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q4_label")}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  t("q4_display"),
                  t("q4_export"),
                  t("q4_catalog"),
                  t("q4_unsure"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.packageInterest === label}
                    onSelect={() => pick("packageInterest", label)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Product count + timeline + budget */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q5_label")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  t("q5_lt20"),
                  t("q5_20to50"),
                  t("q5_50to100"),
                  t("q5_gt100"),
                  t("q5_unsure"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.productCount === label}
                    onSelect={() => pick("productCount", label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q6_label")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  t("q6_urgent"),
                  t("q6_normal"),
                  t("q6_planned"),
                  t("q6_exploring"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.timeline === label}
                    onSelect={() => pick("timeline", label)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t("q7_label")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  t("q7_lt5k"),
                  t("q7_5to10k"),
                  t("q7_10to20k"),
                  t("q7_gt20k"),
                  t("q7_unsure"),
                ].map((label) => (
                  <RadioCard
                    key={label}
                    label={label}
                    selected={data.budget === label}
                    onSelect={() => pick("budget", label)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact info */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="consult-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("name_label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="consult-name"
                  type="text"
                  value={data.name}
                  onChange={(e) => pick("name", e.target.value)}
                  placeholder={t("name_placeholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="consult-company" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("company_label")}
                </label>
                <input
                  id="consult-company"
                  type="text"
                  value={data.company}
                  onChange={(e) => pick("company", e.target.value)}
                  placeholder={t("company_placeholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="consult-contact" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("contact_label")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="consult-contact"
                type="text"
                value={data.contact}
                onChange={(e) => pick("contact", e.target.value)}
                placeholder={t("contact_placeholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="consult-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("notes_label")}
              </label>
              <textarea
                id="consult-notes"
                value={data.notes}
                onChange={(e) => pick("notes", e.target.value)}
                placeholder={t("notes_placeholder")}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
              />
            </div>
            {submitState.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
                {t("error")}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div
          className={`flex mt-8 pt-6 border-t border-gray-100 ${
            step === 1 ? "justify-end" : "justify-between"
          }`}
        >
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("prev")}
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="px-6 py-2.5 text-sm font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canAdvance()}
              className="px-6 py-2.5 text-sm font-semibold bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? t("submitting") : t("submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
