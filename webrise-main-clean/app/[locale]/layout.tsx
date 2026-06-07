import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/app/components/nav";
import { Footer } from "@/app/components/footer";
import { FloatingCta } from "@/app/components/floating-cta";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Webrise",
    default: "外贸网站建设 + 产品内容整理 + Google SEO | Webrise",
  },
  description:
    "专为工厂、贸易公司、设备供应商搭建英文产品网站，提供产品文案整理、询盘系统、阿里云香港部署。帮助企业通过 Google 获取海外询盘。",
  keywords: [
    "外贸网站建设",
    "英文产品网站",
    "Google SEO",
    "工厂网站",
    "贸易公司官网",
    "询盘系统",
    "阿里云香港",
    "export website",
    "B2B website China",
  ],
  authors: [{ name: "Webrise" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: "en_US",
    siteName: "Webrise",
    title: "外贸网站建设 + 产品内容整理 + Google SEO | Webrise",
    description:
      "专为工厂、贸易公司、设备供应商搭建英文产品网站，提供产品文案整理、询盘系统、阿里云香港部署。帮助企业通过 Google 获取海外询盘。",
    url: "https://webrisehq.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "外贸网站建设 + 产品内容整理 + Google SEO | Webrise",
    description:
      "专为工厂、贸易公司、设备供应商搭建英文产品网站。帮助企业通过 Google 获取海外询盘。",
  },
  alternates: {
    canonical: "https://webrisehq.com/zh",
    languages: {
      "zh-CN": "https://webrisehq.com/zh",
      "en-US": "https://webrisehq.com/en",
    },
  },
  verification: {
    other: {
      "baidu-site-verification": ["codeva-IczxqDaJNv"],
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "en" | "zh")) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <div className="flex-1">{children}</div>
          <Footer />
          <FloatingCta />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
