export default function AuthorizationPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">用户上传素材授权说明</h1>
      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <p>当您向本平台上传图片素材时，即表示您声明并保证：</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>您拥有该图片的合法使用权，或已获得版权所有者的授权。</li>
          <li>该图片不包含他人肖像（除非您已获得肖像权人书面授权）。</li>
          <li>该图片不涉及侵权品牌 LOGO、注册商标或其他受法律保护的标识。</li>
          <li>您授权本平台将上传素材用于 AI 图片生成处理，处理完成后原始素材不会被长期存储或用于其他用途。</li>
        </ul>
        <p>如因上传内容违规导致第三方投诉或法律纠纷，由用户自行承担全部责任。</p>
      </div>
    </main>
  );
}
