export default function PromptVisual({ type }: { type: string }) {
  const base = "relative h-44 overflow-hidden rounded-lg border border-white/45";

  if (type === "product") {
    return (
      <div className={`${base} bg-gradient-to-br from-white via-stone-100 to-slate-200`}>
        <div className="absolute left-1/2 top-8 h-24 w-20 -translate-x-1/2 rounded-b-[28px] rounded-t-lg bg-slate-950 shadow-2xl" />
        <div className="absolute left-1/2 top-16 h-5 w-28 -translate-x-1/2 rounded-full bg-slate-950/15 blur-md" />
        <div className="absolute bottom-4 left-4 rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-950 shadow">纯白背景</div>
      </div>
    );
  }

  if (type === "sale") {
    return (
      <div className={`${base} bg-gradient-to-br from-red-600 via-orange-400 to-amber-200`}>
        <div className="absolute left-4 top-4 rounded-lg bg-white px-3 py-2 text-2xl font-black text-red-600">¥99</div>
        <div className="absolute bottom-5 right-5 h-24 w-24 rounded-full bg-white/90 shadow-xl" />
        <div className="absolute bottom-8 right-8 h-14 w-14 rounded-full bg-red-500" />
        <div className="absolute bottom-4 left-4 text-lg font-black text-white drop-shadow">爆款测图</div>
      </div>
    );
  }

  if (type === "poster") {
    return (
      <div className={`${base} bg-gradient-to-br from-rose-100 via-white to-emerald-100`}>
        <div className="absolute left-5 top-5 h-28 w-20 rounded-t-full bg-rose-500 shadow-xl" />
        <div className="absolute right-5 top-6 space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-950" />
          <div className="h-2 w-20 rounded-full bg-slate-400" />
          <div className="h-2 w-16 rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-4 right-5 rounded-full bg-white px-3 py-1 text-xs font-semibold">小红书封面</div>
      </div>
    );
  }

  if (type === "portrait") {
    return (
      <div className={`${base} bg-gradient-to-br from-sky-100 via-white to-violet-100`}>
        <div className="absolute left-1/2 top-5 h-16 w-16 -translate-x-1/2 rounded-full bg-amber-200 shadow-lg" />
        <div className="absolute left-1/2 top-20 h-20 w-28 -translate-x-1/2 rounded-t-[40px] bg-indigo-700" />
        <div className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold">多角度一致</div>
      </div>
    );
  }

  if (type === "toy") {
    return (
      <div className={`${base} bg-gradient-to-br from-purple-100 via-white to-amber-100`}>
        <div className="absolute left-1/2 top-5 h-32 w-28 -translate-x-1/2 rounded-2xl border-4 border-white bg-white/55 shadow-xl" />
        <div className="absolute left-1/2 top-12 h-12 w-12 -translate-x-1/2 rounded-full bg-amber-300" />
        <div className="absolute bottom-6 left-1/2 h-12 w-16 -translate-x-1/2 rounded-t-2xl bg-slate-950" />
        <div className="absolute left-5 top-5 rotate-[-8deg] rounded-md bg-rose-500 px-2 py-1 text-xs font-bold text-white">BLIND BOX</div>
      </div>
    );
  }

  if (type === "edit") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-100 via-white to-emerald-100`}>
        <div className="absolute left-4 top-4 h-28 w-28 rounded-xl bg-slate-900" />
        <div className="absolute right-4 top-4 h-28 w-28 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-100" />
        <div className="absolute bottom-4 left-4 right-4 h-3 rounded-full bg-slate-200">
          <div className="h-3 w-2/3 rounded-full bg-emerald-500" />
        </div>
      </div>
    );
  }

  if (type === "logo") {
    return (
      <div className={`${base} bg-gradient-to-br from-slate-950 via-slate-800 to-amber-700`}>
        <div className="absolute left-1/2 top-9 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-3xl border border-amber-200/40 bg-white/10 text-5xl font-black text-white">A</div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-950">品牌提案</div>
      </div>
    );
  }

  if (type === "cinema") {
    return (
      <div className={`${base} bg-gradient-to-br from-black via-slate-900 to-orange-900`}>
        <div className="absolute inset-x-0 top-10 h-px bg-amber-200/40" />
        <div className="absolute bottom-0 left-1/2 h-24 w-40 -translate-x-1/2 rounded-t-full bg-amber-500/30 blur-xl" />
        <div className="absolute bottom-8 left-1/2 h-24 w-10 -translate-x-1/2 bg-black" />
        <div className="absolute left-4 top-4 text-xs font-semibold text-amber-100">CINEMATIC</div>
      </div>
    );
  }

  if (type === "layout") {
    return (
      <div className={`${base} bg-gradient-to-br from-white via-slate-100 to-sky-100`}>
        <div className="absolute left-4 top-4 h-16 w-28 rounded-lg bg-slate-950" />
        <div className="absolute right-4 top-4 space-y-2">
          <div className="h-3 w-20 rounded-full bg-slate-800" />
          <div className="h-3 w-16 rounded-full bg-slate-300" />
        </div>
        <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-2">
          <div className="h-12 w-12 rounded-md bg-amber-300" />
          <div className="h-12 w-12 rounded-md bg-emerald-300" />
          <div className="h-12 w-12 rounded-md bg-rose-300" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${base} bg-gradient-to-br from-slate-900 via-indigo-900 to-rose-700`}>
      <div className="absolute left-5 top-5 h-24 w-36 rounded-lg border border-white/30 bg-black/30 shadow-xl" />
      <div className="absolute left-[86px] top-[62px] h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-white" />
      <div className="absolute bottom-5 left-5 right-5 flex gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-8 flex-1 rounded bg-white/20" />
        ))}
      </div>
    </div>
  );
}
