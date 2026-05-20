import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-amber-700">Prompt123</Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">AI 生成内容免责声明</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>使用本平台前，请仔细阅读以下声明。</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>平台使用 AI 技术生成图片，生成结果具有随机性，平台不保证每次生成结果均满足用户期望。</li>
            <li>生成图片仅供设计辅助参考。用户在将图片用于电商上架、广告投放或其他商业用途前，应自行审核内容的合法性、准确性和平台合规性。</li>
            <li>平台不承诺生成图片一定提升点击率、转化率或销量。</li>
            <li>严禁生成虚假宣传、夸大功效、仿冒品牌、侵犯肖像权或误导消费者的图片。</li>
            <li>不同用户使用相同或相似提示词，可能得到相似输出。用户不应对 AI 生成图片主张独占版权。</li>
            <li>因用户违规使用生成图片导致的法律责任，由用户自行承担。</li>
          </ul>
        </div>
      </article>
    </main>
  );
}
