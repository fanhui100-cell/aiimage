import { useTranslations } from "next-intl";

const ICONS = {
  no_website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  no_traffic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  chinese_only: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 5h7" /><path d="M7 4c0 6-1.5 10-4 12" /><path d="M8 11c1 1 2.5 2 4 2" />
      <rect x="12" y="4" width="8" height="4" rx="1" /><path d="M20 8l-4 8" /><path d="M16 8l4 8" />
    </svg>
  ),
  no_inquiries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  hard_to_update: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  no_seo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" />
    </svg>
  ),
} as const;

const PAIN_POINTS = [
  "no_website", "no_traffic", "chinese_only", "no_inquiries", "hard_to_update", "no_seo",
] as const;

export function PainPointsSection() {
  const t = useTranslations("pain_points");
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white via-emerald-50/30 to-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t("title")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PAIN_POINTS.map((key) => (
            <div key={key} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center shrink-0">
                {ICONS[key]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">{t(`${key}_title`)}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
