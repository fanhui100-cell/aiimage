import Link from "next/link";

export default function AuthorizationPage() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-amber-700">主图工厂</Link>
        <h1 className="mt-6 text-3xl font-semibold text-slate-950">用户上传素材授权说明</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>当您向本平台上传图片素材时，即表示您声明并保证：</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>您拥有该图片的合法使用权，或已获得版权方、品牌方或权利人的授权。</li>
            <li>该图片不包含他人肖像，除非您已获得肖像权人的书面授权。</li>
            <li>该图片不涉及侵权品牌 Logo、注册商标或其他受法律保护的标识。</li>
            <li>您授权本平台将上传素材用于 AI 图片生成处理。处理完成后，原始素材不会被用于与本次服务无关的其他用途。</li>
          </ul>
          <p>如因上传内容违规导致第三方投诉或法律纠纷，由用户自行承担全部责任。</p>
        </div>
      </article>
    </main>
  );
}
