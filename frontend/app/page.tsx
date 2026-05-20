// frontend/app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
          商品图不用拍
          <br />
          <span className="text-blue-600">AI 一键生成，直接上架</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          面向淘宝 · 拼多多 · 抖音小店卖家
          <br />
          省拍摄 · 省修图 · 批量生成 · 低成本测图
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
        >
          免费试用 3 张 →
        </Link>
      </section>

      {/* Value props */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 grid sm:grid-cols-3 gap-8 text-center">
          {[
            { title: "省拍摄成本", desc: "一张白底图，生成 10 种场景图" },
            { title: "提速上新", desc: "批量处理 SKU，1 小时顶一天" },
            { title: "低成本测图", desc: "多版主图对比，找出高点击率" },
          ].map((item) => (
            <div key={item.title}>
              <div className="text-xl font-bold mb-2">{item.title}</div>
              <div className="text-gray-500 text-sm">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-400 space-x-4">
        <Link href="/legal/terms">服务条款</Link>
        <Link href="/legal/privacy">隐私政策</Link>
        <Link href="/legal/refund">退款规则</Link>
        <Link href="/legal/disclaimer">免责声明</Link>
        <Link href="/legal/authorization">素材授权</Link>
      </footer>
    </main>
  );
}
