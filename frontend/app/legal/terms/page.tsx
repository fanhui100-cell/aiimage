import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-amber-700">Prompt123</Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">服务条款</h1>
        <p className="mt-3 text-sm text-slate-500">最后更新：2026 年 5 月 20 日</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">1. 服务说明</h2>
            <p>本平台提供基于 AI 技术的商品图片生成服务。用户注册并购买积分后，可使用积分生成商品图、场景图和营销素材。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">2. 用户责任</h2>
            <p>用户须对其上传的素材拥有合法使用权。禁止上传侵权图片、明星肖像、品牌 Logo 或其他受版权、商标权、肖像权保护的内容。用户对最终生成图片的商业使用承担全部责任。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">3. 积分与付款</h2>
            <p>积分购买后通常不退款，法律规定或平台系统错误导致的情况除外。平台有权根据运营成本调整积分价格，调整前会尽量提前通知用户。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">4. 服务中断</h2>
            <p>平台不保证服务永久可用。因第三方 API 故障、网络异常、维护升级等原因造成服务中断时，平台会尽力恢复，但不承担由此产生的间接经济损失。</p>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">5. 争议解决</h2>
            <p>本条款适用中华人民共和国法律。双方应优先通过友好协商解决争议。</p>
          </section>
        </div>
      </article>
    </main>
  );
}
