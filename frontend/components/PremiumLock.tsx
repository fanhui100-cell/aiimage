"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function PremiumLock({ children }: { children: React.ReactNode }) {
  const { token, tier } = useAuth();
  const isUnlocked = token && tier === "paid";

  if (isUnlocked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
      <div className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-amber-50/80 p-6 text-center backdrop-blur-sm">
        <span className="text-3xl">🔒</span>
        <div>
          <p className="text-base font-semibold text-amber-900">付费会员专属提示词</p>
          <p className="mt-1 text-sm text-amber-700">购买积分套餐（标准包及以上）即可解锁</p>
        </div>
        <Link
          href="/credits"
          className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
        >
          立即解锁
        </Link>
        {!token && (
          <p className="text-xs text-amber-600">
            已购买？<Link href="/login" className="underline">登录</Link>后查看
          </p>
        )}
      </div>
    </div>
  );
}
