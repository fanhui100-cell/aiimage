import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://webrisehq.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["zh", "en"];

  const pages = [
    { path: "",                                    priority: 1.0, changeFrequency: "weekly"  as const },
    { path: "/demos",                              priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/industries",                         priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/industries/export-factory",          priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/industries/machinery",               priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/industries/led-lighting",            priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/industries/packaging",               priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/industries/hardware",                priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/industries/engineering",             priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing",                            priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/cases",                              priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about",                              priority: 0.7, changeFrequency: "yearly"  as const },
    { path: "/estimate",                           priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/diagnose",                           priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact",                            priority: 0.7, changeFrequency: "yearly"  as const },
    { path: "/consult",                            priority: 0.7, changeFrequency: "yearly"  as const },
    { path: "/blog",                               priority: 0.8, changeFrequency: "weekly"  as const },
    { path: "/blog/linkedin-for-export-business",       priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/export-tax-rebate-guide",            priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/export-contract-key-clauses",        priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/shopify-vs-custom-website",          priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/inquiry-conversion-optimization",    priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/why-english-website",                priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/ce-certification-guide",             priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/google-seo-basics",                  priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/export-website-cost-guide",          priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/how-to-get-more-inquiries",          priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/whatsapp-for-export-business",       priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/product-photo-guide",                priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/alibaba-vs-own-website",             priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/export-website-launch-checklist",    priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/target-market-selection",            priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy",                            priority: 0.3, changeFrequency: "yearly"  as const },
    { path: "/terms",                              priority: 0.3, changeFrequency: "yearly"  as const },
  ];

  return locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `${BASE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    }))
  );
}
