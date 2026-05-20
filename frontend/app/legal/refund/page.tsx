import Link from "next/link";

export default function RefundPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-amber-700">Prompt123</Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">退款规则</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">不予退款的情况</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>积分已被全部或部分使用。</li>
              <li>因用户提供的素材不符合要求导致生成失败或结果不符合预期。</li>
              <li>因用户违反服务条款或法律法规导致账号被限制使用。</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">可申请退款的情况</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>购买后 24 小时内，积分完全未使用，可申请全额退款。</li>
              <li>因平台系统故障导致积分错误扣除，经核实后退还相应积分或款项。</li>
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-base font-semibold text-slate-950">申请方式</h2>
            <p>请联系 support@yourdomain.com，并注明订单号、手机号和退款原因。我们会在 3 个工作日内处理。</p>
          </section>
        </div>
      </article>
    </main>
  );
}
