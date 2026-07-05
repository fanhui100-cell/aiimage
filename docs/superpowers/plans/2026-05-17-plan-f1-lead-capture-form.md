# F1: Lead Capture Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium 4-step needs-assessment wizard at `/consult` on `apps/main` that captures 9 question groups about a prospect's business, saves the submission to Supabase, optionally sends a Resend email notification, and updates all primary CTAs to link there.

**Architecture:** New page at `apps/main/app/[locale]/consult/` — three files: `page.tsx` (server component), `wizard.tsx` ("use client" wizard), `actions.ts` ("use server" action). The wizard state is managed entirely client-side with `useState`; on step-4 submit the server action is called directly via `useTransition` (no FormData — Next.js 15 supports typed server action arguments). Resend email is optional/graceful: if `RESEND_API_KEY` and `NOTIFY_EMAIL` env vars are not set, the form still works (Supabase-only). i18n follows the existing pattern: add `consult_page` block to both `zh.json` and `en.json`.

**Tech Stack:** Next.js 15 App Router, next-intl v3, Tailwind CSS 4, React 19 `useTransition`, Supabase `@supabase/ssr`, Resend (optional), TypeScript 5

---

## Context — Existing Patterns to Follow

- All pages live at `apps/main/app/[locale]/...`
- Server components use `useTranslations("namespace")` from `"next-intl"` (see `contact/page.tsx`)
- Client components use `useTranslations` + `useLocale` from `"next-intl"`
- `Link` is imported from `"@/i18n/navigation"` (NOT `"next/link"`)
- Supabase client: `await createClient()` from `"@/lib/supabase/server"` — already exists
- `contact_submissions` table columns: `name`, `company` (nullable), `contact`, `message`, `locale`
- Theme: green — `bg-green-700`, `text-green-700`, `focus:ring-green-600`
- Metadata: hardcoded Chinese strings (see `contact/page.tsx:5-8`)

---

## File Map

```
apps/main/
├── app/[locale]/consult/
│   ├── page.tsx           server component — metadata + premium banner + <ConsultWizard />
│   ├── wizard.tsx         "use client" — 4-step wizard, RadioCard, CheckboxCard
│   └── actions.ts         "use server" — ConsultFormData type + submitConsultForm
├── app/[locale]/sections/
│   ├── hero-section.tsx   MODIFY: cta_primary href /contact → /consult
│   ├── footer-cta-section.tsx  MODIFY: cta_primary href /contact → /consult
│   └── pricing-section.tsx    MODIFY: all /contact → /consult
├── messages/
│   ├── zh.json            MODIFY: add consult_page block
│   └── en.json            MODIFY: add consult_page block
└── .env.example           MODIFY: add NOTIFY_EMAIL=
```

---

## Task 1: Add i18n Translations

**Files:**
- Modify: `apps/main/messages/zh.json`
- Modify: `apps/main/messages/en.json`

- [ ] **Step 1: Add `consult_page` block to `apps/main/messages/zh.json`**

Open `zh.json` and add this block **before** the final closing `}` (after the `"footer"` block):

```json
  ,
  "consult_page": {
    "title": "免费需求咨询",
    "subtitle": "大约 10 分钟，让我们了解您的需求，免费获取定制报价",
    "step1_title": "关于您的业务",
    "step1_subtitle": "告诉我们您的企业背景",
    "step2_title": "您的目标",
    "step2_subtitle": "我们将根据目标推荐最合适的方案",
    "step3_title": "规模与计划",
    "step3_subtitle": "帮我们准备合适的方案和报价",
    "step4_title": "留下联系方式",
    "step4_subtitle": "我们将在 1 个工作日内联系您",
    "q1_label": "您的业务类型",
    "q1_factory": "外贸工厂 / 制造企业",
    "q1_trading": "贸易公司 / 进出口商",
    "q1_equipment": "设备 / 机械供应商",
    "q1_engineering": "工程 / 建筑公司",
    "q1_service": "服务型企业",
    "q1_other": "其他类型",
    "q2_label": "目前网站情况",
    "q2_none": "没有网站",
    "q2_chinese": "只有中文网站",
    "q2_poor": "有英文网站，但没询盘",
    "q2_upgrade": "有网站，需升级改版",
    "q3_label": "主要出口市场（可多选）",
    "q3_americas": "欧美（US / EU / Canada）",
    "q3_sea": "东南亚",
    "q3_mid": "中东",
    "q3_africa": "非洲",
    "q3_au": "澳洲 / 新西兰",
    "q3_other": "其他市场",
    "q4_label": "感兴趣的服务套餐",
    "q4_display": "展示型官网（¥5,000 起）",
    "q4_export": "外贸英文产品网站（¥9,800 起）",
    "q4_catalog": "产品目录 + 询盘系统（¥18,000 起）",
    "q4_unsure": "暂不确定，需要建议",
    "q5_label": "需展示的产品数量",
    "q5_lt20": "20 种以内",
    "q5_20to50": "20–50 种",
    "q5_50to100": "50–100 种",
    "q5_gt100": "100 种以上",
    "q5_unsure": "暂不清楚",
    "q6_label": "期望上线时间",
    "q6_urgent": "尽快（1 个月内）",
    "q6_normal": "正常节奏（1–3 个月）",
    "q6_planned": "计划中（3 个月以上）",
    "q6_exploring": "只是了解，暂无计划",
    "q7_label": "预算范围",
    "q7_lt5k": "5,000 元以内",
    "q7_5to10k": "5,000–10,000 元",
    "q7_10to20k": "10,000–20,000 元",
    "q7_gt20k": "20,000 元以上",
    "q7_unsure": "暂不确定",
    "name_label": "您的姓名",
    "name_placeholder": "张三",
    "company_label": "公司名称",
    "company_placeholder": "XX 贸易有限公司",
    "contact_label": "联系方式（微信 / 电话 / 邮箱）",
    "contact_placeholder": "+86 138 0000 0000",
    "notes_label": "补充说明（选填）",
    "notes_placeholder": "如有特殊需求或想说明的，请写在这里...",
    "prev": "上一步",
    "next": "下一步",
    "submit": "提交需求",
    "submitting": "提交中...",
    "success_title": "提交成功！",
    "success_subtitle": "感谢您的信任，我们将在 1 个工作日内与您联系。",
    "success_back": "返回首页",
    "error": "提交失败，请稍后重试。"
  }
```

- [ ] **Step 2: Add `consult_page` block to `apps/main/messages/en.json`**

Open `en.json` and add this block before the final `}` (after the `"footer"` block):

```json
  ,
  "consult_page": {
    "title": "Free Requirements Consultation",
    "subtitle": "About 10 minutes to help us understand your needs and prepare a custom quote",
    "step1_title": "About Your Business",
    "step1_subtitle": "Tell us about your company background",
    "step2_title": "Your Goals",
    "step2_subtitle": "We'll recommend the best solution based on your goals",
    "step3_title": "Scale & Timeline",
    "step3_subtitle": "Help us prepare the right plan and quote",
    "step4_title": "Contact Details",
    "step4_subtitle": "We'll reach out within 1 business day",
    "q1_label": "Your Business Type",
    "q1_factory": "Export Factory / Manufacturer",
    "q1_trading": "Trading Company / Importer-Exporter",
    "q1_equipment": "Equipment / Machinery Supplier",
    "q1_engineering": "Engineering / Construction Company",
    "q1_service": "Service Business",
    "q1_other": "Other",
    "q2_label": "Current Website Situation",
    "q2_none": "No website",
    "q2_chinese": "Chinese-only website",
    "q2_poor": "Have English site, but no inquiries",
    "q2_upgrade": "Have a site, need to upgrade",
    "q3_label": "Main Export Markets (select all that apply)",
    "q3_americas": "Americas (US / EU / Canada)",
    "q3_sea": "Southeast Asia",
    "q3_mid": "Middle East",
    "q3_africa": "Africa",
    "q3_au": "Australia / New Zealand",
    "q3_other": "Other markets",
    "q4_label": "Package of Interest",
    "q4_display": "Display Website (from ¥5,000)",
    "q4_export": "Export English Product Website (from ¥9,800)",
    "q4_catalog": "Product Catalog + Inquiry System (from ¥18,000)",
    "q4_unsure": "Not sure yet, need advice",
    "q5_label": "Number of Products to Show",
    "q5_lt20": "Under 20",
    "q5_20to50": "20–50",
    "q5_50to100": "50–100",
    "q5_gt100": "Over 100",
    "q5_unsure": "Not sure yet",
    "q6_label": "Target Launch Timeline",
    "q6_urgent": "ASAP (within 1 month)",
    "q6_normal": "Normal pace (1–3 months)",
    "q6_planned": "Planned (3+ months)",
    "q6_exploring": "Just exploring, no set plans",
    "q7_label": "Budget Range",
    "q7_lt5k": "Under ¥5,000",
    "q7_5to10k": "¥5,000–10,000",
    "q7_10to20k": "¥10,000–20,000",
    "q7_gt20k": "Over ¥20,000",
    "q7_unsure": "Not sure yet",
    "name_label": "Your Name",
    "name_placeholder": "John Smith",
    "company_label": "Company Name",
    "company_placeholder": "ABC Trading Co.",
    "contact_label": "Contact (WeChat / Phone / Email)",
    "contact_placeholder": "+86 138 0000 0000",
    "notes_label": "Additional Notes (optional)",
    "notes_placeholder": "Any special requirements or other details...",
    "prev": "Back",
    "next": "Next",
    "submit": "Submit Requirements",
    "submitting": "Submitting...",
    "success_title": "Submitted Successfully!",
    "success_subtitle": "Thank you for your trust. We'll reach out within 1 business day.",
    "success_back": "Back to Home",
    "error": "Submission failed. Please try again later."
  }
```

- [ ] **Step 3: Commit**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
git add apps/main/messages/zh.json apps/main/messages/en.json
git commit -m "feat(main): add consult_page i18n keys for needs assessment wizard"
```

---

## Task 2: Server Action + Env Setup

**Files:**
- Create: `apps/main/app/[locale]/consult/actions.ts`
- Modify: `apps/main/.env.example`
- Note: `apps/main/package.json` (add `resend` dependency)

- [ ] **Step 1: Add `resend` to `apps/main/package.json`**

In `apps/main/package.json`, add `"resend": "^4.0.0"` to `"dependencies"`:

```json
{
  "name": "@repo/main",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "next": "^15.0.0",
    "next-intl": "^3.26.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
pnpm install
```

Expected: Resolves `resend` package. No errors.

- [ ] **Step 3: Add `NOTIFY_EMAIL` to `apps/main/.env.example`**

Append this line to the existing `.env.example` (after the `RESEND_FROM` line):

```
NOTIFY_EMAIL=your-notification-email@example.com
```

The complete Resend section of `.env.example` should now look like:
```
# Resend — email for form submissions (sign up at resend.com)
RESEND_API_KEY=re_your_key
RESEND_FROM=YourSite <noreply@yoursite.com>
NOTIFY_EMAIL=your-notification-email@example.com
```

- [ ] **Step 4: Create `apps/main/app/[locale]/consult/actions.ts`**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";

export type ConsultFormData = {
  businessType: string;
  websiteStatus: string;
  targetMarkets: string[];
  packageInterest: string;
  productCount: string;
  timeline: string;
  budget: string;
  name: string;
  company: string;
  contact: string;
  notes: string;
  locale: string;
};

export type ConsultFormState = {
  success?: boolean;
  error?: string;
};

export async function submitConsultForm(
  data: ConsultFormData
): Promise<ConsultFormState> {
  if (!data.name || !data.contact) {
    return { error: "请填写姓名和联系方式" };
  }

  const messageParts = [
    "[需求咨询表单]",
    `业务类型: ${data.businessType}`,
    `网站现状: ${data.websiteStatus}`,
    `目标市场: ${data.targetMarkets.join("、")}`,
    `感兴趣套餐: ${data.packageInterest}`,
    `产品数量: ${data.productCount}`,
    `上线时间: ${data.timeline}`,
    `预算范围: ${data.budget}`,
  ];
  if (data.notes) messageParts.push(`\n补充说明:\n${data.notes}`);
  const message = messageParts.join("\n");

  try {
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: data.name,
        company: data.company || null,
        contact: data.contact,
        message,
        locale: `consult-${data.locale}`,
      });
    if (dbError) throw dbError;

    // Optional email notification — skipped gracefully if env vars are missing
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from =
          process.env.RESEND_FROM ?? "Consult Form <noreply@resend.dev>";
        await resend.emails.send({
          from,
          to: [process.env.NOTIFY_EMAIL],
          subject: `新需求咨询 — ${data.name}${data.company ? ` (${data.company})` : ""}`,
          html: `<pre style="font-family:sans-serif;white-space:pre-wrap;font-size:14px">${message}\n\n联系方式: ${data.contact}</pre>`,
        });
      } catch {
        // Email failure does not break form submission
      }
    }

    return { success: true };
  } catch {
    return { error: "提交失败，请稍后重试" };
  }
}
```

- [ ] **Step 5: Commit**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
git add apps/main/package.json apps/main/.env.example apps/main/app/[locale]/consult/actions.ts
git commit -m "feat(main): add consult form server action with Supabase + optional Resend"
```

---

## Task 3: ConsultWizard Component

**Files:**
- Create: `apps/main/app/[locale]/consult/wizard.tsx`

This is a "use client" component. It is the full 4-step interactive wizard. Style note: match the main site's green theme (`green-700`, `green-600`, `green-50`). Card selections should feel premium — large touch targets, subtle shadows, animated selected state with checkmark.

- [ ] **Step 1: Create `apps/main/app/[locale]/consult/wizard.tsx`**

```tsx
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
      {/* Step indicator circles */}
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
          {stepTitles[step - 1].title}
        </h2>
        <p className="text-gray-500 mt-1 text-sm">
          {stepTitles[step - 1].subtitle}
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("name_label")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => pick("name", e.target.value)}
                  placeholder={t("name_placeholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("company_label")}
                </label>
                <input
                  type="text"
                  value={data.company}
                  onChange={(e) => pick("company", e.target.value)}
                  placeholder={t("company_placeholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("contact_label")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.contact}
                onChange={(e) => pick("contact", e.target.value)}
                placeholder={t("contact_placeholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("notes_label")}
              </label>
              <textarea
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
```

- [ ] **Step 2: Commit**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
git add "apps/main/app/[locale]/consult/wizard.tsx"
git commit -m "feat(main): add 4-step needs assessment wizard component"
```

---

## Task 4: Page Component

**Files:**
- Create: `apps/main/app/[locale]/consult/page.tsx`

- [ ] **Step 1: Create `apps/main/app/[locale]/consult/page.tsx`**

```tsx
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { ConsultWizard } from "./wizard";

export const metadata: Metadata = {
  title: "免费需求咨询",
  description: "10 分钟填写需求表单，免费获取定制报价。适合外贸工厂、贸易公司、设备供应商。",
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
```

- [ ] **Step 2: Commit**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
git add "apps/main/app/[locale]/consult/page.tsx"
git commit -m "feat(main): add consult page with premium banner and wizard"
```

---

## Task 5: Update CTAs to Point to `/consult`

**Files:**
- Modify: `apps/main/app/[locale]/sections/hero-section.tsx`
- Modify: `apps/main/app/[locale]/sections/footer-cta-section.tsx`
- Modify: `apps/main/app/[locale]/sections/pricing-section.tsx`

All three currently link to `/contact` for primary CTAs. Update them to link to `/consult`.

- [ ] **Step 1: Update `hero-section.tsx`**

Change `href="/contact"` to `href="/consult"` for the primary CTA button (line 14–18):

```tsx
        <Link
          href="/consult"
          className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-green-700 text-white hover:bg-green-800 transition-colors"
        >
          {t("cta_primary")}
        </Link>
```

- [ ] **Step 2: Update `footer-cta-section.tsx`**

Change `href="/contact"` to `href="/consult"` for the primary CTA link:

```tsx
          <Link
            href="/consult"
            className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold bg-white text-green-700 hover:bg-green-50 transition-colors"
          >
            {t("cta_primary")}
          </Link>
```

- [ ] **Step 3: Update `pricing-section.tsx`**

Change `href="/contact"` to `href="/consult"` for all package CTA links. There is one `<Link href="/contact" ...>` inside the `PACKAGES.map()` loop (line 54–62). Update the href:

```tsx
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
```

- [ ] **Step 4: Commit**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
git add "apps/main/app/[locale]/sections/hero-section.tsx" "apps/main/app/[locale]/sections/footer-cta-section.tsx" "apps/main/app/[locale]/sections/pricing-section.tsx"
git commit -m "feat(main): update primary CTAs to link to /consult needs assessment form"
```

---

## Task 6: Build Verify

**Files:** None created — runs the build and fixes any errors.

- [ ] **Step 1: Run full build**

```powershell
cd "C:\Users\fanhu\Desktop\test\service-website"
pnpm turbo build --filter=@repo/main...
```

Expected: Build passes. New route `/[locale]/consult` appears in output:
```
ƒ /consult
ƒ /en/consult
```

Common errors to watch for and fix:

1. **`useTranslations` in server component**: If `useTranslations` doesn't work in `page.tsx` (server component), replace with `getTranslations` from `"next-intl/server"`:
   ```tsx
   import { getTranslations } from "next-intl/server";
   export default async function ConsultPage() {
     const t = await getTranslations("consult_page");
     ...
   }
   ```
   Note: if you make this change, the function must be `async`.

2. **`resend` import type error**: If TypeScript can't find `resend` types, run `pnpm install` again to make sure the package resolved.

3. **`exactOptionalPropertyTypes` error**: The server action accepts typed args — no FormData. No spread issues expected. But if TypeScript complains about `company: data.company || null` (where `company` is `string`), the column type on Supabase insert is `string | null`. Use `company: data.company.trim() || null` which evaluates to `string | null`. ✓

4. **next-intl type error on `t("q1_factory")` etc.**: If next-intl's strict type checking flags these keys as missing, verify that `consult_page` was correctly added to BOTH `zh.json` and `en.json` with matching key names.

- [ ] **Step 2: Fix any TypeScript errors, then commit fixes**

```powershell
git add -A
git commit -m "fix(main): resolve TypeScript build errors in consult wizard"
```

- [ ] **Step 3: Confirm build success**

Build passes. Dev server can be started:

```powershell
pnpm --filter @repo/main dev
```

Visit `http://localhost:3000/consult` to verify:
- Premium green gradient banner visible
- Step 1 shows 6 business-type cards in 2-column grid
- Selecting cards highlights them with green border + checkmark
- "Next" button is disabled until both Q1 and Q2 are selected
- Step indicators show correct progress (circles 1-2-3-4 with connector lines)
- Step 4 contact form shows name/company/contact/notes fields
- Submit button is disabled until name + contact are filled

---

## Self-Review

**Spec coverage:**
- ✓ 9-question needs assessment (Q1–Q9 = business type, website status, target markets, package, product count, timeline, budget, name/company, contact) — Tasks 1–4
- ✓ Multi-step wizard with premium design — Task 3
- ✓ Supabase insert with `locale: "consult-zh"` or `"consult-en"` — Task 2
- ✓ Resend email notification (optional, graceful) — Task 2
- ✓ i18n for both zh and en — Task 1
- ✓ CTAs updated to point to `/consult` — Task 5
- ✓ Build verify — Task 6

**Placeholder scan:**
- No TBD or TODO
- `resend.dev` default from address — intentional fallback for development
- Hardcoded metadata strings — intentional (matches existing page pattern)

**Type consistency:**
- `ConsultFormData` defined in `actions.ts` and imported in `wizard.tsx` — same type used in both
- `StringField` union type in `wizard.tsx` covers all string fields of `WizardData` — consistent with `pick(key, value)` calls
- `targetMarkets: string[]` handled separately via `toggleMarket` — not in `StringField` union — consistent
- `locale: \`consult-${data.locale}\`` — always a string, never undefined — ✓
