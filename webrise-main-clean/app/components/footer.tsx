import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-white font-bold text-lg mb-2">YourSite</p>
            <p className="text-sm">{t("tagline")}</p>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">快速导航</p>
            <div className="space-y-2 text-sm">
              <Link href="/demos" className="block hover:text-white transition-colors">演示案例</Link>
              <Link href="/pricing" className="block hover:text-white transition-colors">价格套餐</Link>
              <Link href="/blog" className="block hover:text-white transition-colors">知识库</Link>
              <Link href="/contact" className="block hover:text-white transition-colors">联系我们</Link>
            </div>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">联系方式</p>
            <div className="space-y-2 text-sm">
              <p>WhatsApp / 微信：待填写</p>
              <p>邮箱：hello@yoursite.com</p>
              <p>服务时间：周一至周五 9:00–18:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center">
          © {year} YourSite. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
