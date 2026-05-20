export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">隐私政策</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>最后更新：2026年5月20日</p>
        <h2 className="font-semibold text-base">1. 收集的信息</h2>
        <p>我们收集：手机号码（用于登录验证）、生成记录（图片 URL、使用的提示词）、支付信息（由第三方支付平台处理，我们不存储银行卡信息）。</p>
        <h2 className="font-semibold text-base">2. 信息使用</h2>
        <p>收集的信息仅用于提供服务、改善产品体验、处理支付和客服纠纷。我们不会向第三方出售您的个人信息。</p>
        <h2 className="font-semibold text-base">3. 数据存储</h2>
        <p>生成图片：免费用户保存 7 天，付费用户保存 30 天，到期自动删除。</p>
        <h2 className="font-semibold text-base">4. 联系我们</h2>
        <p>如有隐私问题，请发邮件至：privacy@yourdomain.com</p>
      </div>
    </main>
  );
}
