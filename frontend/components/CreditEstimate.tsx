interface Props {
  creditsRequired: number;
  creditsBalance: number;
}

export default function CreditEstimate({ creditsRequired, creditsBalance }: Props) {
  const sufficient = creditsBalance >= creditsRequired;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        sufficient
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-medium">预计消耗</span>
        <span>
          <strong>{creditsRequired}</strong> 张积分
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 text-xs opacity-80">
        <span>当前余额</span>
        <span>
          {creditsBalance} 张{sufficient ? "" : "，积分不足"}
        </span>
      </div>
    </div>
  );
}
