// frontend/components/CreditEstimate.tsx
interface Props {
  creditsRequired: number;
  creditsBalance: number;
}

export default function CreditEstimate({ creditsRequired, creditsBalance }: Props) {
  const sufficient = creditsBalance >= creditsRequired;
  return (
    <div
      className={`rounded-lg px-4 py-2 text-sm flex justify-between items-center ${
        sufficient ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span>
        预计消耗 <strong>{creditsRequired}</strong> 张积分
      </span>
      <span>
        余额 {creditsBalance} 张{!sufficient && " — 积分不足"}
      </span>
    </div>
  );
}
