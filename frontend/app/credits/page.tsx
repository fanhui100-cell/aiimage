"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface CreditPackage {
  id: string;
  name: string;
  price_cny: number;
  credits: number;
  description: string;
}

function CreditsContent() {
  const { creditBalance, tier } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    api
      .get("/credits/packages")
      .then((response) => setPackages(response.data))
      .catch(() => setPackages([]));

    if (searchParams.get("status") === "success") {
      toast.success("支付成功，积分已到账");
    }
  }, [searchParams]);

  async function handleBuy(packageId: string) {
    setLoading(packageId);
    try {
      const { data } = await api.post("/credits/create-order", { package_id: packageId });
      window.location.href = data.pay_url;
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "创建订单失败，请稍后重试");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-700">账户与用量</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">积分充值</h1>
            <p className="mt-2 text-sm text-slate-500">
              当前余额 <strong className="text-slate-950">{creditBalance}</strong> 张，
              {tier === "paid" ? "付费用户" : "免费用户每日限 1 次生成"}。
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            返回生成台
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((pkg, index) => (
            <article
              key={pkg.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                index === 1 ? "border-slate-950 shadow-xl shadow-slate-900/8" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{pkg.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{pkg.description || "适合日常测图和小批量上新。"}</p>
                </div>
                {index === 1 && (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                    推荐
                  </span>
                )}
              </div>
              <div className="mt-6">
                <span className="text-3xl font-semibold text-slate-950">¥{pkg.price_cny}</span>
                <span className="ml-2 text-sm text-slate-500">/ {pkg.credits} 张</span>
              </div>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loading === pkg.id}
                className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  index === 1
                    ? "bg-amber-700 text-white hover:bg-amber-800"
                    : "border border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                }`}
              >
                {loading === pkg.id ? "正在跳转..." : "立即购买"}
              </button>
            </article>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            暂时无法加载套餐，请确认后端服务已启动。
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/75 p-5 text-sm leading-6 text-slate-600">
          支持微信支付与支付宝。AI 图片生成存在第三方 API 成本，已使用的积分通常不支持退款；具体以退款规则为准。
          <div className="mt-3 flex gap-4 text-xs">
            <Link href="/legal/refund" className="text-slate-900 underline">退款规则</Link>
            <Link href="/legal/terms" className="text-slate-900 underline">服务条款</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CreditsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
          正在加载...
        </div>
      }
    >
      <CreditsContent />
    </Suspense>
  );
}
