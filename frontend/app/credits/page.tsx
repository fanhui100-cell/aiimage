// frontend/app/credits/page.tsx
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import toast from "react-hot-toast";

interface Package {
  id: string;
  name: string;
  price_cny: number;
  credits: number;
  description: string;
}

function CreditsContent() {
  const { creditBalance, tier } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    api.get("/credits/packages").then((r) => setPackages(r.data)).catch(() => {});
    if (searchParams.get("status") === "success") {
      toast.success("支付成功！积分已到账");
    }
  }, [searchParams]);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    try {
      const { data } = await api.post("/credits/create-order", {
        package_id: packageId,
      });
      window.location.href = data.pay_url;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "创建订单失败，请重试");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">积分充值</h1>
        <Link href="/dashboard" className="text-sm text-blue-500 underline">
          返回生成
        </Link>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        当前余额：<strong className="text-blue-600">{creditBalance}</strong> 张 ·{" "}
        {tier === "paid" ? "付费用户" : "免费用户（每日限 1 次生成）"}
      </p>
      <div className="grid gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{pkg.name}</div>
              <div className="text-sm text-gray-500">
                {pkg.credits} 张图片 · ¥{pkg.price_cny}
              </div>
            </div>
            <button
              onClick={() => handleBuy(pkg.id)}
              disabled={loading === pkg.id}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading === pkg.id ? "跳转中..." : "立即购买"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-6 text-center">
        支持微信支付 · 支付宝 · 安全加密
      </p>
      <div className="mt-4 text-center text-xs text-gray-400 space-x-3">
        <a href="/legal/refund" className="underline">退款规则</a>
        <a href="/legal/terms" className="underline">服务条款</a>
      </div>
    </main>
  );
}

export default function CreditsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400">加载中...</div>}>
      <CreditsContent />
    </Suspense>
  );
}
