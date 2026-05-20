export default function DisclaimerPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">AI 生成内容免责声明</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <ul className="list-disc pl-5 space-y-2">
          <li>平台使用 AI 技术生成图片，生成结果具有随机性，平台不保证每次生成结果均满足用户期望。</li>
          <li>生成图片仅供设计辅助参考，用户在将图片用于商业用途前，须自行审核内容的合法性。</li>
          <li>平台不承诺生成图片能提升点击率、转化率或销量。</li>
          <li>严禁使用平台生成：虚假宣传图片、夸大功效的医疗/保健品图、仿冒品牌形象、侵犯他人肖像权的图片。</li>
          <li>不同用户使用相同提示词可能得到相似输出（AI 特性），用户不对生成图片主张独家版权。</li>
          <li>因用户违规使用生成图片导致的法律责任，由用户自行承担。</li>
        </ul>
      </div>
    </main>
  );
}
