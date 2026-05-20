export default function RefundPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">退款规则</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="font-semibold text-base">不予退款的情形</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>积分已被全部或部分使用</li>
          <li>因用户提供的素材不符合要求导致生成失败</li>
          <li>因用户违反服务条款被封号</li>
        </ul>
        <h2 className="font-semibold text-base">可申请退款的情形</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>购买后 24 小时内，积分未使用，可申请全额退款</li>
          <li>因平台系统故障导致积分错误扣除，经核实后退还</li>
        </ul>
        <h2 className="font-semibold text-base">申请方式</h2>
        <p>联系客服邮箱：support@yourdomain.com，注明订单号和退款原因，我们将在 3 个工作日内处理。</p>
      </div>
    </main>
  );
}
