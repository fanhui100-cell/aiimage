"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getAllPrompts } from "@/lib/prompts";

const ALL_PROMPTS = getAllPrompts();
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function PromptPackPage() {
  const { token, creditBalance, updateBalance } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        if (next.size >= 20) {
          toast.error("最多选择 20 个提示词");
          return prev;
        }
        next.add(slug);
      }
      return next;
    });
  }

  async function download() {
    if (!token) { toast.error("请先登录"); return; }
    if (selected.size === 0) { toast.error("请至少选择 1 个提示词"); return; }
    if (creditBalance < selected.size) {
      toast.error(`积分不足，需要 ${selected.size} 积分，当前 ${creditBalance}`);
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/api/prompts/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slugs: Array.from(selected) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        toast.error(err.detail ?? "下载失败");
        return;
      }
      updateBalance(creditBalance - selected.size);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-pack-${selected.size}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`已下载 ${selected.size} 个提示词（消耗 ${selected.size} 积分）`);
    } finally {
      setDownloading(false);
    }
  }

  const cost = selected.size;

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-950">首页</Link>
          {" / "}
          <span className="font-semibold text-slate-950">Prompt Pack 下载</span>
        </nav>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Prompt Pack 打包下载</h1>
          <p className="mt-2 text-slate-500">选择提示词，打包成 ZIP 下载到本地，1 积分 / 个，最多 20 个。</p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600">
              已选 <span className="font-semibold text-slate-950">{selected.size}</span> 个
              · 消耗 <span className="font-semibold text-indigo-600">{cost} 积分</span>
              {token && <span className="ml-2 text-slate-400">（余额 {creditBalance}）</span>}
            </div>
            <button
              onClick={download}
              disabled={downloading || selected.size === 0}
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {downloading ? "打包中…" : "下载 ZIP"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {ALL_PROMPTS.map((p) => (
            <label
              key={p.slug}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                selected.has(p.slug)
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.slug)}
                onChange={() => toggle(p.slug)}
                className="mt-1 accent-indigo-600"
              />
              <div className="min-w-0">
                <p className="font-semibold text-slate-950">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{p.model} · {p.category}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </main>
  );
}
