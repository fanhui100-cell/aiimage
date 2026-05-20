"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Item {
  id: string;
  image_url: string;
  mode: string;
  credits_used: number;
  created_at: string;
}

const modeNames: Record<string, string> = {
  template: "模板生成",
  keyword: "关键词生成",
  custom: "自定义 Prompt",
};

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/history/", { params: { page } })
      .then((response) => setItems(response.data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-amber-700">生成资产库</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">历史记录</h1>
            <p className="mt-2 text-sm text-slate-500">查看已生成图片，下载后可继续用于上架和测图。</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            返回生成台
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white/85 py-20 text-center text-sm text-slate-500">
            正在加载历史记录...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-20 text-center">
            <h2 className="font-semibold text-slate-900">暂无生成记录</h2>
            <p className="mt-2 text-sm text-slate-500">完成第一次生成后，图片会出现在这里。</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={item.image_url}
                  alt="历史生成的商品图"
                  className="aspect-square w-full bg-slate-100 object-cover"
                />
                <div className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{modeNames[item.mode] || item.mode}</div>
                    <div className="mt-1 text-xs text-slate-500">消耗 {item.credits_used} 张积分</div>
                  </div>
                  <a
                    href={item.image_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
                  >
                    下载
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
          >
            上一页
          </button>
          <span className="rounded-lg bg-white/70 px-4 py-2 text-sm text-slate-500">第 {page} 页</span>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      </section>
    </main>
  );
}
