import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-amber-700">主图工厂</Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">隐私政策</h1>
        <p className="mt-3 text-sm text-slate-500">最后更新：2026 年 5 月 20 日</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">1. 收集的信息</h2>
            <p>我们可能收集手机号、验证码登录记录、生成记录、图片 URL、使用的提示词、支付订单状态等信息。支付信息由第三方支付平台处理，我们不存储银行卡信息。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">2. 信息使用</h2>
            <p>收集的信息仅用于提供服务、改进产品体验、处理支付、排查故障和处理客服纠纷。我们不会向第三方出售用户个人信息。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">3. 数据存储</h2>
            <p>生成图片的保存周期会根据账户类型和套餐不同而变化。免费用户图片默认保存 7 天，付费用户默认保存 30 天，到期后可能自动删除。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">4. 联系我们</h2>
            <p>如有隐私相关问题，请发送邮件至 privacy@yourdomain.com。</p>
          </section>
        </div>
      </article>
    </main>
  );
}
