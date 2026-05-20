"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();

  function startCountdown() {
    setCountdown(60);
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function handleSendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请输入正确的手机号");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/send-code", { phone });
      setCodeSent(true);
      startCountdown();
      toast.success("验证码已发送");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "发送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请输入正确的手机号");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      toast.error("请输入 6 位验证码");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, code });
      setAuth(data.token, data.credit_balance, data.tier);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "验证码错误或已过期");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950">
            图
          </span>
          <span className="font-semibold">主图工厂</span>
        </Link>
        <div>
          <p className="mb-4 text-sm font-medium text-amber-200">Seller image studio</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            把一张商品图，变成一组可测试的上架素材。
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            登录后即可使用模板生成淘宝、拼多多、抖音小店商品图。新用户赠送 3 张体验额度。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
          <div>
            <div className="text-2xl font-semibold text-white">10+</div>
            <div className="mt-1">核心模板</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">3</div>
            <div className="mt-1">免费额度</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-white">1 min</div>
            <div className="mt-1">快速出图</div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-white/80 bg-white/85 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <div className="mb-8">
            <Link href="/" className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                图
              </span>
              <span className="font-semibold text-slate-950">主图工厂</span>
            </Link>
            <h1 className="text-2xl font-semibold text-slate-950">登录 / 注册</h1>
            <p className="mt-2 text-sm text-slate-500">手机号验证登录，无需单独创建密码。</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-500">手机号</span>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
              />
            </label>

            <button
              onClick={handleSendCode}
              disabled={loading || countdown > 0}
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s 后重新发送` : "发送验证码"}
            </button>

            {codeSent && (
              <>
                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-500">验证码</span>
                  <input
                    type="text"
                    placeholder="6 位验证码"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.4em] outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-900/10"
                  />
                </label>
                <button
                  onClick={handleLogin}
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-lg bg-amber-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/10 transition hover:bg-amber-800 disabled:opacity-50"
                >
                  {loading ? "登录中..." : "进入工作台"}
                </button>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            登录即表示同意{" "}
            <Link href="/legal/terms" className="text-slate-600 underline">
              服务条款
            </Link>{" "}
            和{" "}
            <Link href="/legal/privacy" className="text-slate-600 underline">
              隐私政策
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
