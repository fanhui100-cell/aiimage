// frontend/app/history/page.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

interface Item {
  id: string;
  image_url: string;
  mode: string;
  credits_used: number;
  created_at: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("/history/", { params: { page } })
      .then((r) => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">生成历史</h1>
        <Link href="/dashboard" className="text-sm text-blue-500 underline">
          返回生成
        </Link>
      </div>
      {loading && <p className="text-gray-400 text-center py-20">加载中...</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-400 text-center py-20">暂无生成记录</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-xl overflow-hidden">
            <img
              src={item.image_url}
              alt=""
              className="w-full aspect-square object-cover"
            />
            <div className="p-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">{item.mode}</span>
              <a
                href={item.image_url}
                download
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-500 underline"
              >
                下载
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center mt-8">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
        >
          上一页
        </button>
        <span className="px-4 py-2 text-sm text-gray-500">第 {page} 页</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={items.length === 0}
          className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
        >
          下一页
        </button>
      </div>
    </main>
  );
}
