// frontend/app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";

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
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
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
      toast.error(err.response?.data?.detail || "发送失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { phone, code });
      setAuth(data.token, data.credit_balance, data.tier);
      router.push("/dashboard");
    } catch {
      toast.error("验证码错误或已过期");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">登录 / 注册</h1>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendCode}
              disabled={loading || countdown > 0}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {countdown > 0 ? `${countdown}s` : "发送验证码"}
            </button>
          </div>
          {codeSent && (
            <>
              <input
                type="text"
                placeholder="6 位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLogin}
                disabled={loading || code.length !== 6}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录 / 注册"}
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          登录即表示同意{" "}
          <a href="/legal/terms" className="underline">服务条款</a>
          {" "}和{" "}
          <a href="/legal/privacy" className="underline">隐私政策</a>
        </p>
      </div>
    </main>
  );
}
