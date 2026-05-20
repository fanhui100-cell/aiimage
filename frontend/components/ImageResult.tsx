interface Props {
  imageUrl: string;
  onReset: () => void;
}

export default function ImageResult({ imageUrl, onReset }: Props) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">生成结果</h2>
          <p className="mt-1 text-xs text-slate-500">确认画面、文字和商品细节后再用于上架。</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          已完成
        </span>
      </div>
      <img
        src={imageUrl}
        alt="AI 生成的商品图"
        className="mx-auto aspect-square w-full max-w-xl rounded-xl border border-slate-100 object-contain shadow-lg shadow-slate-900/8"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href={imageUrl}
          download="ai-product-image.png"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          下载图片
        </a>
        <button
          onClick={onReset}
          className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          重新生成
        </button>
      </div>
    </section>
  );
}
